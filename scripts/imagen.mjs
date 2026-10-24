#!/usr/bin/env node
/**
 * Image Generation Script — One Gateway only
 *
 * All AI traffic goes through One Gateway (OpenAI-compatible OpenClaw endpoint).
 * Direct calls to Google, OpenRouter, OpenAI, CogView, etc. are forbidden.
 *
 * Usage:
 *   node scripts/imagen.mjs --prompt "description" [options]
 *
 * Env (see https://github.com/abrown84/one-gateway):
 *   ONE_GATEWAY_TOKEN        required
 *   ONE_GATEWAY_URL          default http://127.0.0.1:18789
 *   ONE_GATEWAY_MODEL        chat / routing model
 *   ONE_GATEWAY_IMAGE_MODEL  preferred model for this script (falls back to ONE_GATEWAY_MODEL)
 *
 * Capability gap:
 *   One Gateway exposes /v1/chat/completions (text). Native image APIs
 *   (DALL·E images/generations, Gemini multimodal edit with local files) are
 *   NOT available through the gateway client. This script best-effort requests
 *   image modalities via chat completions and saves any image payload the
 *   upstream model returns. Image editing via --input is unsupported.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as https from "node:https";
import * as http from "node:http";
import { parseArgs } from "node:util";
import {
  describeGatewaySetup,
  gatewayChatCompletions,
  gatewayComplete,
  loadGatewayEnv,
  resolveGatewayConfig,
} from "./lib/oneGateway.mjs";

const STYLE_PRESETS = {
  realistic: "photorealistic, high detail, natural lighting, 8k resolution",
  artistic: "artistic style, painterly, expressive brushstrokes, vibrant colors",
  cartoon: "cartoon style, bold outlines, bright colors, playful",
  sketch: "pencil sketch style, black and white, hand-drawn appearance",
};

const SIZE_PRESETS = {
  square: "1024x1024",
  landscape: "1792x1024",
  portrait: "1024x1792",
};

function downloadImage(url, outputPath) {
  const transport = url.startsWith("https:") ? https : http;
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    transport
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          downloadImage(response.headers.location, outputPath)
            .then(resolve)
            .catch(reject);
          return;
        }
        if (response.statusCode && response.statusCode >= 400) {
          reject(new Error(`Failed to download image: HTTP ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve(outputPath);
        });
      })
      .on("error", (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
  });
}

async function saveImageFromData(imageData, outputPath) {
  const outputDir = path.dirname(outputPath);
  if (outputDir && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (typeof imageData !== "string") {
    throw new Error("Unknown image data format");
  }

  const b64Match = imageData.match(/^data:image\/[^;]+;base64,(.+)$/);
  if (b64Match) {
    fs.writeFileSync(outputPath, Buffer.from(b64Match[1], "base64"));
    return;
  }

  if (/^[A-Za-z0-9+/=\s]+$/.test(imageData) && imageData.replace(/\s/g, "").length > 100) {
    fs.writeFileSync(outputPath, Buffer.from(imageData.replace(/\s/g, ""), "base64"));
    return;
  }

  if (imageData.startsWith("http")) {
    await downloadImage(imageData, outputPath);
    return;
  }

  throw new Error("Unknown image data format");
}

/**
 * Try to extract an image from an OpenAI-style chat completion response.
 */
async function extractAndSaveImage(message, outputPath) {
  if (!message) return false;

  if (message.images && Array.isArray(message.images) && message.images.length > 0) {
    const imgObj = message.images[0];
    const imageData = imgObj?.image_url?.url || imgObj?.url || imgObj;
    await saveImageFromData(imageData, outputPath);
    return true;
  }

  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      if (part?.type === "image" || part?.type === "image_url") {
        const imgData = part.image_url?.url || part.url || part.data;
        if (imgData) {
          await saveImageFromData(imgData, outputPath);
          return true;
        }
      }
      if (part?.inlineData?.data) {
        const mime = part.inlineData.mimeType || "image/png";
        await saveImageFromData(
          `data:${mime};base64,${part.inlineData.data}`,
          outputPath
        );
        return true;
      }
    }
  }

  if (typeof message.content === "string") {
    const b64Match = message.content.match(
      /data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/
    );
    if (b64Match) {
      await saveImageFromData(b64Match[0], outputPath);
      return true;
    }

    const urlMatch = message.content.match(
      /https?:\/\/[^\s"']+\.(png|jpg|jpeg|webp)/i
    );
    if (urlMatch) {
      await downloadImage(urlMatch[0], outputPath);
      return true;
    }
  }

  return false;
}

function buildPrompt(prompt, style, size) {
  let full = prompt;
  if (style && STYLE_PRESETS[style]) {
    full = `${prompt}. Style: ${STYLE_PRESETS[style]}`;
  }
  if (size) {
    const dims = SIZE_PRESETS[size] || size;
    full = `${full}. Target size: ${dims}.`;
  }
  return full;
}

async function generateImage({ prompt, inputPaths, outputPath, style, size, model }) {
  if (inputPaths?.length) {
    console.error(`
Error: Image editing (--input) is not supported through One Gateway.

One Gateway only exposes OpenAI-compatible chat completions with string message
content. Multimodal local-file image editing (previously Gemini-only) would
require calling a provider SDK directly, which is not allowed in this repo.

Workaround: describe the desired edit in --prompt, or generate a new image.
`);
    process.exit(1);
  }

  let config;
  try {
    config = resolveGatewayConfig();
  } catch (err) {
    console.error(`\nError: ${err.message}`);
    console.error(`\n${describeGatewaySetup()}`);
    process.exit(1);
  }

  const resolvedModel =
    model ||
    process.env.ONE_GATEWAY_IMAGE_MODEL ||
    config.primaryModel;

  const fullPrompt = buildPrompt(prompt, style, size);

  console.log(`\nGateway: ${config.baseUrl}`);
  console.log(`Model:   ${resolvedModel}`);
  console.log(`Prompt:  "${fullPrompt}"`);
  if (style) console.log(`Style:   ${style}`);
  if (size) console.log(`Size:    ${SIZE_PRESETS[size] || size}`);

  try {
    const { json } = await gatewayChatCompletions({
      model: resolvedModel,
      messages: [
        {
          role: "user",
          content: `Generate an image for the following description and return the image in your response.\n\n${fullPrompt}`,
        },
      ],
      modalities: ["image", "text"],
      maxTokens: Math.max(config.maxTokens, 2048),
      timeoutMs: Math.max(config.timeoutMs, 180_000),
    });

    const message = json?.choices?.[0]?.message;
    const saved = await extractAndSaveImage(message, outputPath);

    if (saved) {
      console.log(`\nImage saved to: ${outputPath}`);
      return outputPath;
    }

    // Best-effort text path: some gateways only return text; surface it and fail clearly.
    if (typeof message?.content === "string" && message.content.trim()) {
      console.error("\nGateway returned text only (no image payload):");
      console.error(message.content.slice(0, 800));
    } else {
      console.error("\nGateway response contained no image payload.");
      console.error(JSON.stringify(json, null, 2).slice(0, 800));
    }

    console.error(`
Capability gap: One Gateway does not provide a dedicated images API.
This script only uses POST /v1/chat/completions. Configure an image-capable
model on your OpenClaw gateway (ONE_GATEWAY_IMAGE_MODEL / --model), or generate
assets offline. Direct Google / OpenRouter / OpenAI image calls are not allowed.
`);
    process.exit(1);
  } catch (error) {
    const details = error.details ? `\nDetails: ${JSON.stringify(error.details).slice(0, 500)}` : "";
    console.error(`\nError generating image: ${error.message}${details}`);
    process.exit(1);
  }
}

/**
 * Optional: refine a prompt via One Gateway text completion (supported path).
 */
async function refinePrompt(prompt) {
  const result = await gatewayComplete(
    `Rewrite this image prompt to be clearer and more specific for an image model. Reply with only the rewritten prompt:\n\n${prompt}`,
    { maxTokens: 300, temperature: 0.4 }
  );
  return result.content.trim();
}

const { values } = parseArgs({
  options: {
    prompt: { type: "string", short: "p" },
    input: { type: "string", short: "i" },
    output: { type: "string", short: "o", default: "generated-image.png" },
    style: { type: "string", short: "s" },
    size: { type: "string", short: "z" },
    model: { type: "string", short: "m" },
    refine: { type: "boolean", default: false },
    list: { type: "boolean", short: "l" },
    help: { type: "boolean", short: "h" },
  },
});

if (values.list) {
  loadGatewayEnv();
  console.log(`
One Gateway model selection (configured via env / OpenClaw — not a local catalog):

  ONE_GATEWAY_MODEL         ${process.env.ONE_GATEWAY_MODEL || "openclaw (default)"}
  ONE_GATEWAY_IMAGE_MODEL   ${process.env.ONE_GATEWAY_IMAGE_MODEL || "(unset — falls back to ONE_GATEWAY_MODEL)"}
  ONE_GATEWAY_FALLBACKS     ${process.env.ONE_GATEWAY_FALLBACKS || "(none)"}

Pass --model <id> to override for a single run.
There is no local provider list; models are whatever your OpenClaw gateway routes.
`);
  process.exit(0);
}

if (values.help || !values.prompt) {
  console.log(`
Image Generation Script (One Gateway only)

Usage:
  node scripts/imagen.mjs --prompt "description" [options]

Options:
  -p, --prompt <text>      Image description (required)
  -m, --model <model>      Model id routed by OpenClaw / One Gateway
  -o, --output <path>      Output file (default: generated-image.png)
  -s, --style <preset>     Style: realistic, artistic, cartoon, sketch
  -z, --size <size>        Size: square, landscape, portrait, or WxH
      --refine             Refine the prompt via One Gateway text completion first
  -i, --input <paths>      Unsupported (image edit gap — see help text)
  -l, --list               Show configured gateway model env vars
  -h, --help               Show this help

Examples:
  node scripts/imagen.mjs --prompt "A sunset over mountains"
  node scripts/imagen.mjs --prompt "A cat" --model openclaw --refine

${describeGatewaySetup()}
`);
  process.exit(values.help ? 0 : 1);
}

const inputPaths = values.input ? values.input.split(",") : [];

let prompt = values.prompt;
if (values.refine) {
  try {
    console.log("Refining prompt via One Gateway...");
    prompt = await refinePrompt(prompt);
    console.log(`Refined prompt: ${prompt}`);
  } catch (err) {
    console.error(`Prompt refine failed: ${err.message}`);
    process.exit(1);
  }
}

await generateImage({
  prompt,
  inputPaths,
  outputPath: values.output,
  style: values.style,
  size: values.size,
  model: values.model,
});
