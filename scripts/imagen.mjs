#!/usr/bin/env node
/**
 * Image Generation Script - Multi-Provider Support
 *
 * Providers:
 *   - gemini: Google Gemini image models (supports image editing)
 *   - cogview: Zhipu AI CogView-4 (text-to-image only)
 *
 * Usage:
 *   node scripts/imagen.mjs --prompt "description" [--provider gemini|cogview] [options]
 *
 * Key loading order:
 *   1. Project .env.local
 *   2. Project .env
 *   3. Global ~/.claude/api-keys.env
 *   4. System environment
 */

import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import * as https from "node:https";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Provider configurations
const PROVIDERS = {
  openrouter: {
    name: "OpenRouter",
    keyName: "OPENROUTER_API_KEY",
    supportsEditing: true,
    defaultModel: "black-forest-labs/flux.2-pro",
    models: [
      "black-forest-labs/flux.2-klein-4b",  // $0.014 - cheapest/fastest
      "black-forest-labs/flux.2-pro",       // $0.03  - best value
      "black-forest-labs/flux.2-flex",      // $0.06  - text/typography
      "black-forest-labs/flux.2-max",       // $0.07  - highest quality
      "google/gemini-3-pro-image-preview",  // $0.0001 - ultra cheap, editing
    ],
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
  },
  openai: {
    name: "OpenAI DALL-E",
    keyName: "OPENAI_API_KEY",
    supportsEditing: false,
    defaultModel: "dall-e-3",
    models: [
      "dall-e-3",           // Latest DALL-E
      "dall-e-2",           // DALL-E 2
    ],
    endpoint: "https://api.openai.com/v1/images/generations",
  },
  gemini: {
    name: "Google Gemini",
    keyName: "GOOGLE_GEMINI_API_KEY",
    supportsEditing: true,
    defaultModel: "gemini-3.1-flash-image",
    models: [
      "gemini-3.1-flash-image",       // Nano Banana 2 — high-efficiency image gen/edit
      "gemini-nano-banana-2.1",       // Nano Banana 2.1 — improved quality/typography
      "gemini-3.1-flash-lite-image",  // Nano Banana 2 Lite — low latency / cost
      "gemini-3-pro-image",           // Nano Banana Pro — studio-quality
      "gemini-2.5-flash-image",       // Nano Banana (legacy 2.5 image model)
    ],
  },
  cogview: {
    name: "Zhipu CogView",
    keyName: "GLM_API_KEY",
    altKeyName: "ZHIPU_API_KEY",
    supportsEditing: false,
    defaultModel: "cogview-4-250304",
    models: [
      "cogview-4-250304",   // Latest CogView-4
    ],
    endpoint: "https://open.bigmodel.cn/api/paas/v4/images/generations",
  },
};

// Style presets for image generation
const STYLE_PRESETS = {
  realistic: "photorealistic, high detail, natural lighting, 8k resolution",
  artistic: "artistic style, painterly, expressive brushstrokes, vibrant colors",
  cartoon: "cartoon style, bold outlines, bright colors, playful",
  sketch: "pencil sketch style, black and white, hand-drawn appearance",
};

// Size presets
const SIZE_PRESETS = {
  square: "1024x1024",
  landscape: "1792x1024",
  portrait: "1024x1792",
};

/**
 * Load environment variables from a file
 */
function loadEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, "utf-8");
    const env = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join("=").trim();
      }
    }
    return env;
  } catch {
    return {};
  }
}

/**
 * Get all environment variables from all sources
 */
function getAllEnv() {
  const homeDir = process.env.USERPROFILE || process.env.HOME;
  return {
    ...loadEnvFile(path.join(homeDir, ".claude", "api-keys.env")),
    ...loadEnvFile(path.join(projectRoot, ".env")),
    ...loadEnvFile(path.join(projectRoot, ".env.local")),
    ...process.env,
  };
}

/**
 * Get API key for a specific provider
 */
function getApiKey(provider) {
  const config = PROVIDERS[provider];
  const env = getAllEnv();

  // Check primary key name
  if (env[config.keyName]) {
    return { key: env[config.keyName], source: config.keyName };
  }

  // Check alternate key name if available
  if (config.altKeyName && env[config.altKeyName]) {
    return { key: env[config.altKeyName], source: config.altKeyName };
  }

  return null;
}

/**
 * Auto-detect best available provider
 */
function detectProvider(needsEditing = false) {
  // If editing is needed, try OpenRouter first (FLUX supports editing), then Gemini
  if (needsEditing) {
    for (const provider of ["openrouter", "gemini"]) {
      const key = getApiKey(provider);
      if (key && PROVIDERS[provider].supportsEditing) return provider;
    }
    return null;
  }

  // Try providers in order of preference (OpenRouter first - has most models)
  for (const provider of ["openrouter", "openai", "gemini", "cogview"]) {
    const key = getApiKey(provider);
    if (key) return provider;
  }

  return null;
}

/**
 * Read image file and convert to base64
 */
function readImageAsBase64(imagePath) {
  const absolutePath = path.isAbsolute(imagePath)
    ? imagePath
    : path.resolve(process.cwd(), imagePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Image file not found: ${absolutePath}`);
  }

  const imageData = fs.readFileSync(absolutePath);
  const base64 = imageData.toString("base64");

  const ext = path.extname(imagePath).toLowerCase();
  const mimeTypes = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  const mimeType = mimeTypes[ext] || "image/png";

  return { base64, mimeType };
}

/**
 * Download image from URL and save to file
 */
function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Handle redirect
          downloadImage(response.headers.location, outputPath)
            .then(resolve)
            .catch(reject);
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve(outputPath);
        });
      })
      .on("error", (err) => {
        fs.unlink(outputPath, () => {}); // Delete partial file
        reject(err);
      });
  });
}

/**
 * Generate image using Google Gemini
 */
async function generateWithGemini({ prompt, inputPaths, outputPath, style, apiKey, model }) {
  const ai = new GoogleGenAI({ apiKey });
  const modelId = model || PROVIDERS.gemini.defaultModel;

  let fullPrompt = prompt;
  if (style && STYLE_PRESETS[style]) {
    fullPrompt = `${prompt}. Style: ${STYLE_PRESETS[style]}`;
  }

  const contentParts = [];

  // Add input images if provided (Gemini supports editing)
  if (inputPaths && inputPaths.length > 0) {
    for (const inputPath of inputPaths) {
      const { base64, mimeType } = readImageAsBase64(inputPath.trim());
      contentParts.push({
        inlineData: { mimeType, data: base64 },
      });
    }
  }

  contentParts.push({ text: fullPrompt });

  console.log(`Model: ${modelId}`);

  const response = await ai.models.generateContent({
    model: modelId,
    contents: contentParts,
    config: { responseModalities: ["TEXT", "IMAGE"] },
  });

  let imageFound = false;
  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log("\nAPI Response:", part.text);
    } else if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      const outputDir = path.dirname(outputPath);
      if (outputDir && !fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(outputPath, buffer);
      imageFound = true;
    }
  }

  if (!imageFound) {
    throw new Error("No image was generated in the response");
  }

  return outputPath;
}

/**
 * Generate image using Zhipu CogView
 */
async function generateWithCogView({ prompt, outputPath, style, size, apiKey, model }) {
  const modelId = model || PROVIDERS.cogview.defaultModel;

  let fullPrompt = prompt;
  if (style && STYLE_PRESETS[style]) {
    fullPrompt = `${prompt}. Style: ${STYLE_PRESETS[style]}`;
  }

  const imageSize = SIZE_PRESETS[size] || size || "1024x1024";

  console.log(`Model: ${modelId}`);

  const requestBody = JSON.stringify({
    model: modelId,
    prompt: fullPrompt,
    size: imageSize,
  });

  return new Promise((resolve, reject) => {
    const url = new URL(PROVIDERS.cogview.endpoint);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Length": Buffer.byteLength(requestBody),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", async () => {
        try {
          const response = JSON.parse(data);

          if (response.error) {
            reject(new Error(response.error.message || JSON.stringify(response.error)));
            return;
          }

          if (response.data && response.data[0]) {
            const imageUrl = response.data[0].url;
            console.log("\nImage URL:", imageUrl);

            // Download the image
            const outputDir = path.dirname(outputPath);
            if (outputDir && !fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir, { recursive: true });
            }

            await downloadImage(imageUrl, outputPath);
            resolve(outputPath);
          } else {
            reject(new Error("No image data in response"));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}\nRaw: ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.write(requestBody);
    req.end();
  });
}

/**
 * Generate image using OpenRouter (FLUX models)
 */
async function generateWithOpenRouter({ prompt, outputPath, style, size, apiKey, model }) {
  const modelId = model || PROVIDERS.openrouter.defaultModel;

  let fullPrompt = prompt;
  if (style && STYLE_PRESETS[style]) {
    fullPrompt = `${prompt}. Style: ${STYLE_PRESETS[style]}`;
  }

  console.log(`Model: ${modelId}`);

  const requestBody = JSON.stringify({
    model: modelId,
    messages: [
      {
        role: "user",
        content: fullPrompt,
      },
    ],
    modalities: ["image", "text"],
  });

  return new Promise((resolve, reject) => {
    const url = new URL(PROVIDERS.openrouter.endpoint);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://github.com/claude-code-skills",
        "X-Title": "Claude Code Image Generation",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", async () => {
        try {
          // Clean up response (remove leading whitespace)
          const cleanData = data.trim();
          const response = JSON.parse(cleanData);

          if (response.error) {
            reject(new Error(response.error.message || JSON.stringify(response.error)));
            return;
          }

          // OpenRouter returns images in different formats depending on model
          const message = response.choices?.[0]?.message;

          // Check for images array (OpenRouter FLUX format)
          if (message?.images && Array.isArray(message.images) && message.images.length > 0) {
            const imgObj = message.images[0];
            // Handle nested image_url format: { type: "image_url", image_url: { url: "data:..." } }
            const imageData = imgObj?.image_url?.url || imgObj?.url || imgObj;
            await saveImageFromData(imageData, outputPath);
            resolve(outputPath);
            return;
          }

          // Check for content array with image parts
          if (Array.isArray(message?.content)) {
            for (const part of message.content) {
              if (part.type === "image" || part.type === "image_url") {
                const imgData = part.image_url?.url || part.url || part.data;
                if (imgData) {
                  await saveImageFromData(imgData, outputPath);
                  resolve(outputPath);
                  return;
                }
              }
            }
          }

          // Check for base64 in content string (some models embed it)
          if (typeof message?.content === "string") {
            const b64Match = message.content.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
            if (b64Match) {
              const buffer = Buffer.from(b64Match[1], "base64");
              const outputDir = path.dirname(outputPath);
              if (outputDir && !fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
              }
              fs.writeFileSync(outputPath, buffer);
              resolve(outputPath);
              return;
            }

            // Check for URL in content
            const urlMatch = message.content.match(/https?:\/\/[^\s"']+\.(png|jpg|jpeg|webp)/i);
            if (urlMatch) {
              await downloadImage(urlMatch[0], outputPath);
              resolve(outputPath);
              return;
            }

            console.log("\nAPI Response:", message.content.substring(0, 500));
          }

          reject(new Error("No image was generated. Try a different model with --model"));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}\nRaw: ${data.substring(0, 1000)}`));
        }
      });
    });

    req.on("error", reject);
    req.write(requestBody);
    req.end();
  });
}

/**
 * Helper to save image from various data formats
 */
async function saveImageFromData(imageData, outputPath) {
  const outputDir = path.dirname(outputPath);
  if (outputDir && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (typeof imageData === "string") {
    // Data URL format
    const b64Match = imageData.match(/^data:image\/[^;]+;base64,(.+)$/);
    if (b64Match) {
      const buffer = Buffer.from(b64Match[1], "base64");
      fs.writeFileSync(outputPath, buffer);
      return;
    }

    // Plain base64
    if (/^[A-Za-z0-9+/=]+$/.test(imageData) && imageData.length > 100) {
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync(outputPath, buffer);
      return;
    }

    // URL
    if (imageData.startsWith("http")) {
      await downloadImage(imageData, outputPath);
      return;
    }
  }

  throw new Error("Unknown image data format");
}

/**
 * Generate image using OpenAI DALL-E
 */
async function generateWithOpenAI({ prompt, outputPath, style, size, apiKey, model }) {
  const modelId = model || PROVIDERS.openai.defaultModel;

  let fullPrompt = prompt;
  if (style && STYLE_PRESETS[style]) {
    fullPrompt = `${prompt}. Style: ${STYLE_PRESETS[style]}`;
  }

  // Map size presets to DALL-E sizes
  const dalleSize = {
    square: "1024x1024",
    landscape: "1792x1024",
    portrait: "1024x1792",
  }[size] || size || "1024x1024";

  console.log(`Model: ${modelId}`);

  const requestBody = JSON.stringify({
    model: modelId,
    prompt: fullPrompt,
    n: 1,
    size: dalleSize,
    response_format: "b64_json",
  });

  return new Promise((resolve, reject) => {
    const url = new URL(PROVIDERS.openai.endpoint);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", async () => {
        try {
          const response = JSON.parse(data);

          if (response.error) {
            reject(new Error(response.error.message || JSON.stringify(response.error)));
            return;
          }

          if (response.data && response.data[0]) {
            const imageData = response.data[0].b64_json || response.data[0].url;

            if (response.data[0].b64_json) {
              const buffer = Buffer.from(imageData, "base64");
              const outputDir = path.dirname(outputPath);
              if (outputDir && !fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
              }
              fs.writeFileSync(outputPath, buffer);
              resolve(outputPath);
            } else if (response.data[0].url) {
              await downloadImage(response.data[0].url, outputPath);
              resolve(outputPath);
            }
          } else {
            reject(new Error("No image data in response"));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}\nRaw: ${data.substring(0, 500)}`));
        }
      });
    });

    req.on("error", reject);
    req.write(requestBody);
    req.end();
  });
}

/**
 * Main generation function
 */
async function generateImage({ prompt, inputPaths, outputPath, style, size, provider, model }) {
  const needsEditing = inputPaths && inputPaths.length > 0;

  // Auto-detect provider if not specified
  if (!provider) {
    provider = detectProvider(needsEditing);
    if (!provider) {
      console.error("Error: No API key found for any provider!");
      console.error("\nSet one of these keys in ~/.claude/api-keys.env:");
      console.error("  GOOGLE_GEMINI_API_KEY - for Google Gemini");
      console.error("  GLM_API_KEY - for Zhipu CogView");
      process.exit(1);
    }
    console.log(`Auto-selected provider: ${PROVIDERS[provider].name}`);
  }

  // Validate provider
  if (!PROVIDERS[provider]) {
    console.error(`Unknown provider: ${provider}`);
    console.error(`Available: ${Object.keys(PROVIDERS).join(", ")}`);
    process.exit(1);
  }

  // Check if editing is supported
  if (needsEditing && !PROVIDERS[provider].supportsEditing) {
    console.error(`\nError: ${PROVIDERS[provider].name} does not support image editing.`);
    console.error("Use --provider gemini for image editing tasks.");
    process.exit(1);
  }

  // Get API key
  const keyInfo = getApiKey(provider);
  if (!keyInfo) {
    console.error(`\nError: No API key found for ${PROVIDERS[provider].name}`);
    console.error(`Set ${PROVIDERS[provider].keyName} in ~/.claude/api-keys.env`);
    process.exit(1);
  }

  console.log(`\nProvider: ${PROVIDERS[provider].name}`);
  console.log(`Prompt: "${prompt}"`);
  if (inputPaths?.length) console.log(`Input images: ${inputPaths.join(", ")}`);
  if (style) console.log(`Style: ${style}`);
  if (size) console.log(`Size: ${SIZE_PRESETS[size] || size}`);

  try {
    let result;
    if (provider === "openrouter") {
      result = await generateWithOpenRouter({
        prompt,
        outputPath,
        style,
        size,
        apiKey: keyInfo.key,
        model,
      });
    } else if (provider === "openai") {
      result = await generateWithOpenAI({
        prompt,
        outputPath,
        style,
        size,
        apiKey: keyInfo.key,
        model,
      });
    } else if (provider === "gemini") {
      result = await generateWithGemini({
        prompt,
        inputPaths,
        outputPath,
        style,
        apiKey: keyInfo.key,
        model,
      });
    } else if (provider === "cogview") {
      result = await generateWithCogView({
        prompt,
        outputPath,
        style,
        size,
        apiKey: keyInfo.key,
        model,
      });
    }

    console.log(`\nImage saved to: ${result}`);
    return result;
  } catch (error) {
    handleError(error, provider);
    process.exit(1);
  }
}

/**
 * Handle errors with helpful messages
 */
function handleError(error, provider) {
  const errorStr = error.message || String(error);

  if (errorStr.includes("余额不足") || errorStr.includes("insufficient")) {
    console.error("\nInsufficient balance on your account!");
    if (provider === "cogview") {
      console.error("Add credits at: https://open.bigmodel.cn/usercenter/resourcepack");
    }
    console.error("Or try a different provider: --provider gemini");
  } else if (errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("quota")) {
    console.error("\nQuota exceeded! Your API key has hit its rate limit.");
    console.error("Options:");
    console.error("  1. Wait for quota reset (usually daily)");
    console.error("  2. Enable billing on your account");
    console.error("  3. Try a different provider: --provider cogview/gemini");

    const retryMatch = errorStr.match(/retry in (\d+(?:\.\d+)?s?)/i);
    if (retryMatch) console.error(`\nRetry in: ${retryMatch[1]}`);
  } else if (errorStr.includes("401") || errorStr.includes("403") || errorStr.includes("API key")) {
    console.error("\nAPI key error!");
    console.error("Check that your API key is valid.");
    if (provider === "gemini") {
      console.error("Get a key at: https://aistudio.google.com/apikey");
    } else if (provider === "cogview") {
      console.error("Get a key at: https://open.bigmodel.cn");
    }
  } else {
    console.error("\nError generating image:", errorStr);
  }
}

// Parse command line arguments
const { values } = parseArgs({
  options: {
    prompt: { type: "string", short: "p" },
    input: { type: "string", short: "i" },
    output: { type: "string", short: "o", default: "generated-image.png" },
    style: { type: "string", short: "s" },
    size: { type: "string", short: "z" },
    provider: { type: "string" },
    model: { type: "string", short: "m" },
    list: { type: "boolean", short: "l" },
    help: { type: "boolean", short: "h" },
  },
});

// List available models
if (values.list) {
  console.log("\nAvailable Models:\n");
  for (const [key, config] of Object.entries(PROVIDERS)) {
    console.log(`${config.name} (--provider ${key}):`);
    config.models.forEach((m, i) => {
      const isDefault = m === config.defaultModel ? " (default)" : "";
      console.log(`  - ${m}${isDefault}`);
    });
    console.log();
  }
  process.exit(0);
}

if (values.help || !values.prompt) {
  console.log(`
Image Generation Script (Multi-Provider)

Providers:
  gemini   - Google Gemini (supports image editing)
  cogview  - Zhipu AI CogView (text-to-image, Chinese text support)

Usage:
  node scripts/imagen.mjs --prompt "description" [options]

Options:
  -p, --prompt <text>      Image description (required)
  -m, --model <model>      Specific model to use (see --list)
  -i, --input <paths>      Input image(s) for editing (Gemini only)
  -o, --output <path>      Output file (default: generated-image.png)
  -s, --style <preset>     Style: realistic, artistic, cartoon, sketch
  -z, --size <size>        Size: square, landscape, portrait, or WxH
      --provider <name>    Provider: gemini, cogview (auto-detected if omitted)
  -l, --list               List all available models
  -h, --help               Show this help

Examples:
  # List available models
  node scripts/imagen.mjs --list

  # Text-to-image (auto-selects available provider)
  node scripts/imagen.mjs --prompt "A sunset over mountains"

  # Use specific model
  node scripts/imagen.mjs --prompt "A cat" --model gemini-3.1-flash-image

  # Use CogView with older model
  node scripts/imagen.mjs --prompt "一只可爱的猫咪" --provider cogview --model cogview-3

  # Edit an image (requires Gemini)
  node scripts/imagen.mjs --prompt "Add a rainbow" --input photo.png

Environment Variables (in ~/.claude/api-keys.env):
  GOOGLE_GEMINI_API_KEY  - For Gemini provider
  GLM_API_KEY            - For CogView provider
`);
  process.exit(values.help ? 0 : 1);
}

// Parse input paths if provided
const inputPaths = values.input ? values.input.split(",") : [];

// Run generation
generateImage({
  prompt: values.prompt,
  inputPaths,
  outputPath: values.output,
  style: values.style,
  size: values.size,
  provider: values.provider,
  model: values.model,
});
