#!/usr/bin/env python3
"""List models via One Gateway when the OpenAI-compatible /v1/models exists.

Previously this hit OpenRouter directly — that is no longer allowed.
All AI/provider traffic must go through One Gateway
(https://github.com/abrown84/one-gateway).

Env:
  ONE_GATEWAY_TOKEN  required
  ONE_GATEWAY_URL    default http://127.0.0.1:18789
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import requests

try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(*_args, **_kwargs):
        return False


ROOT = Path(__file__).resolve().parent.parent
load_dotenv(os.path.expanduser("~/.claude/api-keys.env"))
load_dotenv(ROOT / ".env")
load_dotenv(ROOT / ".env.local")

token = os.getenv("ONE_GATEWAY_TOKEN") or os.getenv("OPENCLAW_GATEWAY_TOKEN")
base = (
    os.getenv("ONE_GATEWAY_URL")
    or os.getenv("OPENCLAW_BASE_URL")
    or "http://127.0.0.1:18789"
).rstrip("/")
agent = os.getenv("ONE_GATEWAY_AGENT") or os.getenv("OPENCLAW_AGENT_ID") or "main"

if not token:
    print("Error: ONE_GATEWAY_TOKEN (or OPENCLAW_GATEWAY_TOKEN) not found")
    sys.exit(1)

url = f"{base}/v1/models"
print(f"GET {url}")
response = requests.get(
    url,
    headers={
        "Authorization": f"Bearer {token}",
        "x-openclaw-agent-id": agent,
    },
    timeout=60,
)

if response.status_code == 200:
    payload = response.json()
    models = payload.get("data", payload if isinstance(payload, list) else [])
    keywords = ["image", "flux", "imagen", "recraft", "dall", "stable", "sdxl", "midjourney"]

    print("Models reported by One Gateway / OpenClaw:")
    print("=" * 60)
    if not models:
        print("(empty list)")
    for m in models:
        if not isinstance(m, dict):
            print(m)
            continue
        model_id = m.get("id", "")
        print(model_id)
        pricing = m.get("pricing") or {}
        if pricing:
            print(f"  Price: {pricing.get('prompt', 'N/A')}")
        if any(k in model_id.lower() for k in keywords):
            print("  (matches image-related keyword)")
        print()
else:
    print(f"Error: HTTP {response.status_code}")
    print(response.text[:500])
    print(
        "\nGap: One Gateway / OpenClaw may not expose GET /v1/models. "
        "Configure models in OpenClaw and set ONE_GATEWAY_MODEL / "
        "ONE_GATEWAY_IMAGE_MODEL instead of querying a public catalog."
    )
    sys.exit(1)
