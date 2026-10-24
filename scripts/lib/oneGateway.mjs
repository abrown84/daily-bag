/**
 * Shared One Gateway client for local scripts.
 *
 * All AI/LLM traffic in this repo MUST go through One Gateway
 * (https://github.com/abrown84/one-gateway) — never directly to
 * Google, OpenRouter, OpenAI, or other providers.
 *
 * Consumes the same OpenAI-compatible OpenClaw endpoint that the
 * official `one-gateway` client uses:
 *   POST {ONE_GATEWAY_URL}/v1/chat/completions
 *   Authorization: Bearer {ONE_GATEWAY_TOKEN}  (only if set)
 *   x-openclaw-agent-id: {ONE_GATEWAY_AGENT}
 *
 * Defaults target the public gateway at brwnindustries.com (no token).
 *
 * Note: the published npm `one-gateway` package on the registry is a
 * stub, and the GitHub package omits built `dist/` artifacts, so this
 * repo mirrors the client protocol instead of importing the package.
 * For browser-facing chat, prefer `one-gateway/serve` in a dedicated
 * process (not used by these offline scripts).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/**
 * Load KEY=VALUE pairs from a file.
 */
export function loadEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, "utf-8");
    const env = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key) env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
}

/**
 * Merge project + home env files under process.env (do not overwrite).
 */
export function loadGatewayEnv() {
  const homeDir = process.env.USERPROFILE || process.env.HOME || "";
  const merged = {
    ...loadEnvFile(path.join(homeDir, ".claude", "api-keys.env")),
    ...loadEnvFile(path.join(projectRoot, ".env")),
    ...loadEnvFile(path.join(projectRoot, ".env.local")),
  };

  for (const [key, value] of Object.entries(merged)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return process.env;
}

function sanitizeHeaderValue(value, field) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid ${field}: must be a non-empty string`);
  }
  if (/[\x00-\x1f\x7f]/.test(value)) {
    throw new Error(`Invalid ${field}: contains control characters`);
  }
  return value.trim();
}

function validateBaseUrl(raw) {
  let url;
  try {
    url = new URL(String(raw || "").trim());
  } catch {
    throw new Error("Invalid ONE_GATEWAY_URL: not a valid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Invalid ONE_GATEWAY_URL: only http: and https: are allowed");
  }
  if (url.username || url.password) {
    throw new Error("Invalid ONE_GATEWAY_URL: credentials in URL are not allowed");
  }
  const host = url.hostname.toLowerCase();
  if (url.protocol === "http:" && !LOOPBACK.has(host)) {
    throw new Error(
      "Invalid ONE_GATEWAY_URL: remote gateways must use https: (http: only for localhost)"
    );
  }
  const pathname = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
  return `${url.protocol}//${url.host}${pathname}`;
}

function parseFallbacks(v = "") {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const DEFAULT_GATEWAY_URL = "https://brwnindustries.com/labs/one-gateway";
const DEFAULT_GATEWAY_MODEL = "gemini-3.8-flash";

/**
 * Resolve One Gateway config from env (same vars as one-gateway getConfig).
 * ONE_GATEWAY_TOKEN is optional — the public gateway needs no auth.
 */
export function resolveGatewayConfig(env = process.env) {
  loadGatewayEnv();
  const rawToken = env.ONE_GATEWAY_TOKEN ?? env.OPENCLAW_GATEWAY_TOKEN;
  const token =
    rawToken && String(rawToken).trim()
      ? sanitizeHeaderValue(rawToken, "ONE_GATEWAY_TOKEN")
      : null;

  return {
    baseUrl: validateBaseUrl(
      env.ONE_GATEWAY_URL ?? env.OPENCLAW_BASE_URL ?? DEFAULT_GATEWAY_URL
    ),
    token,
    primaryModel:
      env.ONE_GATEWAY_MODEL ?? env.OPENCLAW_MODEL_PRIMARY ?? DEFAULT_GATEWAY_MODEL,
    fallbackModels: parseFallbacks(
      env.ONE_GATEWAY_FALLBACKS ?? env.OPENCLAW_MODEL_FALLBACKS ?? ""
    ),
    agentId: sanitizeHeaderValue(
      env.ONE_GATEWAY_AGENT ?? env.OPENCLAW_AGENT_ID ?? "main",
      "ONE_GATEWAY_AGENT"
    ),
    temperature: Number(env.ONE_GATEWAY_TEMPERATURE ?? env.OPENCLAW_TEMPERATURE ?? 0.2),
    maxTokens: Number(env.ONE_GATEWAY_MAX_TOKENS ?? env.OPENCLAW_MAX_TOKENS ?? 500),
    timeoutMs: Number(env.ONE_GATEWAY_TIMEOUT_MS ?? env.OPENCLAW_TIMEOUT_MS ?? 45000),
  };
}

async function callOnce({ config, model, messages, temperature, maxTokens, signal, modalities }) {
  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };
  if (modalities) body.modalities = modalities;

  const headers = {
    "Content-Type": "application/json",
    "x-openclaw-agent-id": config.agentId,
  };
  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`;
  }

  const res = await fetch(`${config.baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text.trim());
  } catch {
    json = { raw: text.slice(0, 2048) };
  }

  if (!res.ok) {
    const err = new Error(`One Gateway HTTP ${res.status} for model=${model}`);
    err.details = json;
    err.status = res.status;
    throw err;
  }

  return { model, json };
}

/**
 * Text completion through One Gateway (string content), with model fallbacks.
 */
export async function gatewayComplete(prompt, opts = {}) {
  const config = opts.config ?? resolveGatewayConfig();
  const models = [opts.model ?? config.primaryModel, ...config.fallbackModels].filter(Boolean);
  const messages = opts.messages ?? [{ role: "user", content: prompt }];
  const temperature = opts.temperature ?? config.temperature;
  const maxTokens = opts.maxTokens ?? config.maxTokens;

  let lastError;
  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
      const { json } = await callOnce({
        config,
        model,
        messages,
        temperature,
        maxTokens,
        signal: controller.signal,
      });
      clearTimeout(timer);
      const content = json?.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content) {
        throw new Error(`Empty content for model=${model}`);
      }
      return { model, content, raw: json };
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
    }
  }

  const e = new Error("All model attempts failed");
  e.cause = lastError;
  throw e;
}

/**
 * Low-level chat/completions for responses that may include image payloads.
 */
export async function gatewayChatCompletions({
  messages,
  model,
  temperature,
  maxTokens,
  modalities,
  timeoutMs,
} = {}) {
  const config = resolveGatewayConfig();
  const resolvedModel =
    model || process.env.ONE_GATEWAY_IMAGE_MODEL || config.primaryModel;

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    timeoutMs ?? Math.max(config.timeoutMs, 180_000)
  );

  try {
    const { json } = await callOnce({
      config,
      model: resolvedModel,
      messages,
      temperature: temperature ?? config.temperature,
      maxTokens: maxTokens ?? config.maxTokens,
      signal: controller.signal,
      modalities,
    });
    return { model: resolvedModel, json, config };
  } finally {
    clearTimeout(timer);
  }
}

export function describeGatewaySetup() {
  return `
One Gateway env (see https://github.com/abrown84/one-gateway):
  ONE_GATEWAY_URL     - default ${DEFAULT_GATEWAY_URL}
  ONE_GATEWAY_MODEL   - primary chat model (default: ${DEFAULT_GATEWAY_MODEL})
  ONE_GATEWAY_TOKEN   - optional (omit for the public gateway; send Authorization only if set)
  ONE_GATEWAY_IMAGE_MODEL - optional override for image-oriented models
  ONE_GATEWAY_AGENT   - OpenClaw agent id (default: main)
`.trim();
}
