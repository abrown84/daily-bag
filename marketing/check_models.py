#!/usr/bin/env python3
"""Check available image models on OpenRouter."""
import os
import requests
from dotenv import load_dotenv

load_dotenv(os.path.expanduser("~/.claude/api-keys.env"))
api_key = os.getenv("OPENROUTER_API_KEY")

response = requests.get(
    "https://openrouter.ai/api/v1/models",
    headers={"Authorization": f"Bearer {api_key}"}
)

if response.status_code == 200:
    models = response.json().get("data", [])
    keywords = ["image", "flux", "imagen", "recraft", "dall", "stable", "sdxl", "midjourney"]

    print("Available image generation models:")
    print("=" * 60)

    for m in models:
        model_id = m.get("id", "").lower()
        if any(k in model_id for k in keywords):
            pricing = m.get("pricing", {})
            prompt_price = pricing.get("prompt", "N/A")
            print(f"{m['id']}")
            print(f"  Price: {prompt_price}")
            print()
else:
    print(f"Error: {response.status_code}")
