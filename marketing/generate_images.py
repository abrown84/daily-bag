#!/usr/bin/env python3
"""Generate marketing images using Gemini image models via OpenRouter."""

import os
import base64
import requests
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(os.path.expanduser("~/.claude/api-keys.env"))

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OUTPUT_DIR = Path(__file__).parent / "images"
OUTPUT_DIR.mkdir(exist_ok=True)


def generate_image(prompt: str, filename: str, model: str = "google/gemini-2.5-flash-image") -> bool:
    """Generate image using specified model via OpenRouter."""

    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chore-checklist.app",
    }

    data = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": f"Generate this image: {prompt}"
            }
        ]
    }

    print(f"Generating: {filename}")
    print(f"Model: {model}")
    print(f"Prompt: {prompt[:70]}...")

    try:
        response = requests.post(url, headers=headers, json=data, timeout=180)

        if response.status_code == 200:
            result = response.json()

            if "choices" in result:
                for choice in result["choices"]:
                    message = choice.get("message", {})
                    content = message.get("content")

                    # Content could be string or list
                    if isinstance(content, list):
                        for item in content:
                            if isinstance(item, dict):
                                if item.get("type") == "image_url":
                                    url_data = item.get("image_url", {}).get("url", "")
                                    if url_data.startswith("data:image"):
                                        b64 = url_data.split(",")[1]
                                        img_bytes = base64.b64decode(b64)
                                        output_path = OUTPUT_DIR / filename
                                        with open(output_path, "wb") as f:
                                            f.write(img_bytes)
                                        print(f"SUCCESS: {output_path}")
                                        return True
                                    elif url_data.startswith("http"):
                                        img_resp = requests.get(url_data, timeout=60)
                                        if img_resp.status_code == 200:
                                            output_path = OUTPUT_DIR / filename
                                            with open(output_path, "wb") as f:
                                                f.write(img_resp.content)
                                            print(f"SUCCESS: {output_path}")
                                            return True

            print(f"Response: {json.dumps(result, indent=2)[:700]}")
        else:
            print(f"Error {response.status_code}: {response.text[:300]}")

    except Exception as e:
        print(f"Exception: {e}")

    return False


# Marketing prompts - simplified to avoid content policy issues
PROMPTS = [
    {
        "filename": "01-gamification-concept.png",
        "prompt": "Modern flat design digital illustration showing gamification concept for household tasks. Colorful icons of stars, badges, level indicators and achievement symbols. Purple and gold color scheme. Clean vector style marketing graphic. No people, abstract design."
    },
    {
        "filename": "02-app-mockup.png",
        "prompt": "Smartphone floating on purple gradient background displaying a colorful leaderboard interface with circular avatar placeholders and score bars. Confetti and star decorations around the device. Modern tech product marketing illustration. Clean minimal design."
    },
    {
        "filename": "03-teamwork-icons.png",
        "prompt": "Cheerful flat design illustration showing household activity icons: broom, dishes, laundry basket arranged in a playful pattern. Bright warm colors with purple and gold accents. Family friendly vector graphics for app marketing."
    },
    {
        "filename": "04-rewards-system.png",
        "prompt": "Abstract flat design illustration of achievement and reward concept. Star icons, trophy symbols, gift box icons, and medal badges arranged artistically. Purple, indigo and gold color palette. Clean vector marketing graphic."
    },
    {
        "filename": "05-happy-home.png",
        "prompt": "Cozy modern living room interior illustration in warm flat design style. Clean organized space with houseplants, comfortable sofa, warm golden lighting from window. Peaceful domestic scene, no people visible."
    }
]


if __name__ == "__main__":
    print("=" * 60)
    print("Chore Checklist Image Generator")
    print("=" * 60)

    if not OPENROUTER_API_KEY:
        print("Error: OPENROUTER_API_KEY not found")
        exit(1)

    # Try cheapest model first, fallback to more capable
    models = [
        "google/gemini-2.5-flash-image",
        "google/gemini-3-pro-image-preview"
    ]

    success_count = 0
    for item in PROMPTS:
        print(f"\n{'='*60}")

        for model in models:
            if generate_image(item["prompt"], item["filename"], model):
                success_count += 1
                break
            print(f"Failed with {model}, trying next...")

    print(f"\n{'='*60}")
    print(f"Complete: {success_count}/{len(PROMPTS)} images generated")
    print(f"Output directory: {OUTPUT_DIR}")
