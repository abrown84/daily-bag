#!/usr/bin/env python3
"""Generate marketing images via One Gateway only (OpenAI-compatible).

All AI traffic goes through One Gateway / OpenClaw:
  POST {ONE_GATEWAY_URL}/v1/chat/completions

Direct OpenRouter / Google / OpenAI calls are not allowed.

Env (see https://github.com/abrown84/one-gateway):
  ONE_GATEWAY_URL           default https://brwnindustries.com/labs/one-gateway
  ONE_GATEWAY_MODEL         default gemini-3.8-flash
  ONE_GATEWAY_TOKEN         optional (public gateway needs none)
  ONE_GATEWAY_IMAGE_MODEL   preferred for this script
  ONE_GATEWAY_AGENT         default main

Capability gap:
  One Gateway exposes chat completions, not a dedicated images API.
  This script best-effort requests image payloads from chat responses.
  If the routed model returns text only, generation fails clearly.
"""

from __future__ import annotations

import base64
import json
import os
import sys
from pathlib import Path

import requests

try:
    from dotenv import load_dotenv
except ImportError:  # optional
    def load_dotenv(*_args, **_kwargs):
        return False


ROOT = Path(__file__).resolve().parent.parent
load_dotenv(os.path.expanduser("~/.claude/api-keys.env"))
load_dotenv(ROOT / ".env")
load_dotenv(ROOT / ".env.local")

ONE_GATEWAY_TOKEN = (
    os.getenv("ONE_GATEWAY_TOKEN") or os.getenv("OPENCLAW_GATEWAY_TOKEN") or ""
).strip() or None
ONE_GATEWAY_URL = (
    os.getenv("ONE_GATEWAY_URL")
    or os.getenv("OPENCLAW_BASE_URL")
    or "https://brwnindustries.com/labs/one-gateway"
).rstrip("/")
ONE_GATEWAY_AGENT = os.getenv("ONE_GATEWAY_AGENT") or os.getenv("OPENCLAW_AGENT_ID") or "main"
DEFAULT_MODEL = (
    os.getenv("ONE_GATEWAY_IMAGE_MODEL")
    or os.getenv("ONE_GATEWAY_MODEL")
    or os.getenv("OPENCLAW_MODEL_PRIMARY")
    or "gemini-3.8-flash"
)

OUTPUT_DIR = Path(__file__).parent / "images"
OUTPUT_DIR.mkdir(exist_ok=True)


def _save_data_url(url_data: str, output_path: Path) -> bool:
    if url_data.startswith("data:image"):
        b64 = url_data.split(",", 1)[1]
        output_path.write_bytes(base64.b64decode(b64))
        return True
    if url_data.startswith("http"):
        img_resp = requests.get(url_data, timeout=60)
        if img_resp.status_code == 200:
            output_path.write_bytes(img_resp.content)
            return True
    return False


def _extract_image(message: dict, output_path: Path) -> bool:
    images = message.get("images")
    if isinstance(images, list) and images:
        img = images[0]
        url_data = (
            (img.get("image_url") or {}).get("url")
            if isinstance(img, dict)
            else None
        ) or (img.get("url") if isinstance(img, dict) else None)
        if isinstance(url_data, str) and _save_data_url(url_data, output_path):
            return True

    content = message.get("content")
    if isinstance(content, list):
        for item in content:
            if not isinstance(item, dict):
                continue
            if item.get("type") in ("image_url", "image"):
                url_data = (item.get("image_url") or {}).get("url") or item.get("url")
                if isinstance(url_data, str) and _save_data_url(url_data, output_path):
                    return True
    if isinstance(content, str):
        marker = "data:image/"
        if marker in content:
            start = content.index(marker)
            # crude extract through end of base64-ish run
            chunk = content[start:].split()[0].rstrip(")'\"")
            if _save_data_url(chunk, output_path):
                return True
    return False


def generate_image(prompt: str, filename: str, model: str = DEFAULT_MODEL) -> bool:
    """Generate image via One Gateway chat completions."""
    url = f"{ONE_GATEWAY_URL}/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "x-openclaw-agent-id": ONE_GATEWAY_AGENT,
    }
    if ONE_GATEWAY_TOKEN:
        headers["Authorization"] = f"Bearer {ONE_GATEWAY_TOKEN}"
    data = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": (
                    "Generate an image for the following description and "
                    f"return the image in your response.\n\n{prompt}"
                ),
            }
        ],
        "modalities": ["image", "text"],
    }

    print(f"Generating: {filename}")
    print(f"Gateway: {ONE_GATEWAY_URL}")
    print(f"Model: {model}")
    print(f"Prompt: {prompt[:70]}...")

    try:
        response = requests.post(url, headers=headers, json=data, timeout=180)
        if response.status_code != 200:
            print(f"Error {response.status_code}: {response.text[:300]}")
            return False

        result = response.json()
        message = (result.get("choices") or [{}])[0].get("message") or {}
        output_path = OUTPUT_DIR / filename
        if _extract_image(message, output_path):
            print(f"SUCCESS: {output_path}")
            return True

        print("No image payload in gateway response (capability gap).")
        print(f"Response: {json.dumps(result, indent=2)[:700]}")
        return False
    except Exception as e:
        print(f"Exception: {e}")
        return False


PROMPTS = [
    {
        "filename": "01-gamification-concept.png",
        "prompt": (
            "Modern flat design digital illustration showing gamification concept "
            "for household tasks. Colorful icons of stars, badges, level indicators "
            "and achievement symbols. Clean vector style marketing graphic. No people."
        ),
    },
    {
        "filename": "02-app-mockup.png",
        "prompt": (
            "Smartphone floating on soft gradient background displaying a colorful "
            "leaderboard interface with circular avatar placeholders and score bars. "
            "Modern tech product marketing illustration. Clean minimal design."
        ),
    },
    {
        "filename": "03-teamwork-icons.png",
        "prompt": (
            "Cheerful flat design illustration showing household activity icons: "
            "broom, dishes, laundry basket arranged in a playful pattern. Bright warm "
            "colors. Family friendly vector graphics for app marketing."
        ),
    },
    {
        "filename": "04-rewards-system.png",
        "prompt": (
            "Abstract flat design illustration of achievement and reward concept. "
            "Star icons, trophy symbols, gift box icons, and medal badges arranged "
            "artistically. Clean vector marketing graphic."
        ),
    },
    {
        "filename": "05-happy-home.png",
        "prompt": (
            "Cozy modern living room interior illustration in warm flat design style. "
            "Clean organized space with houseplants, comfortable sofa, warm golden "
            "lighting from window. Peaceful domestic scene, no people visible."
        ),
    },
]


if __name__ == "__main__":
    print("=" * 60)
    print("Daily Bag Image Generator (One Gateway)")
    print("=" * 60)

    models = [DEFAULT_MODEL]
    # Optional comma-separated fallbacks, same convention as one-gateway
    fallbacks = os.getenv("ONE_GATEWAY_FALLBACKS") or os.getenv("OPENCLAW_MODEL_FALLBACKS") or ""
    for m in fallbacks.split(","):
        m = m.strip()
        if m and m not in models:
            models.append(m)

    success_count = 0
    for item in PROMPTS:
        print(f"\n{'=' * 60}")
        ok = False
        for model in models:
            if generate_image(item["prompt"], item["filename"], model):
                success_count += 1
                ok = True
                break
            print(f"Failed with {model}, trying next...")
        if not ok:
            print(
                "Failed: One Gateway chat completions returned no image. "
                "Dedicated image APIs are not exposed by one-gateway."
            )

    print(f"\n{'=' * 60}")
    print(f"Complete: {success_count}/{len(PROMPTS)} images generated")
    print(f"Output directory: {OUTPUT_DIR}")
