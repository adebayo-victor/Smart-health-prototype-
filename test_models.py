#!/usr/bin/env python3
"""
Test script to inspect available models on the LiteLLM gateway.
Queries the public model hub and OpenAI-compatible model endpoints.
Usage:
    python3 test_models.py [OPTIONAL_API_KEY] [OPTIONAL_BASE_URL]
"""
import json
import os
import sys
import urllib.error
import urllib.request

# Manual lightweight .env loader
def load_env_file():
    env_path = ".env"
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    v = v.strip().strip('"').strip("'")
                    os.environ.setdefault(k.strip(), v)

load_env_file()

# Read from command line arguments or environment / .env
api_key = sys.argv[1] if len(sys.argv) > 1 else os.getenv("LITELLM_API_KEY", "").strip()
base_url = sys.argv[2] if len(sys.argv) > 2 else os.getenv("LITELLM_BASE_URL", "https://litellm.codeforafrica.org/v1").strip()
base_url = base_url.rstrip("/")

print("=" * 65)
print("LiteLLM Gateway Model Inspection Tool")
print("=" * 65)
print(f"Target Gateway: {base_url}")
masked_key = (api_key[:6] + "..." + api_key[-4:]) if len(api_key) > 10 else (api_key or "(EMPTY)")
print(f"API Key:        {masked_key}\n")

# First, query the live public model hub on the LiteLLM gateway
hub_url = base_url.replace("/v1", "") + "/public/model_hub"
print(f"--> Querying Gateway Model Catalog: {hub_url}")

try:
    req = urllib.request.Request(hub_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        models = json.loads(resp.read().decode("utf-8"))
        print(f"✅ Success! Found {len(models)} configured models on LiteLLM gateway.\n")

        chat_models = []
        audio_models = []
        embedding_models = []

        for m in models:
            name = m.get("model_group") or m.get("model_name")
            mode = m.get("mode", "chat")
            fc = m.get("supports_function_calling", False)
            cost_in = m.get("input_cost_per_token", 0)
            cost_out = m.get("output_cost_per_token", 0)

            entry = {
                "name": name,
                "function_calling": fc,
                "cost_in": cost_in,
                "cost_out": cost_out,
            }

            if mode == "embedding":
                embedding_models.append(entry)
            elif "voxtral" in name.lower() or "audio" in name.lower():
                audio_models.append(entry)
            elif mode == "chat":
                chat_models.append(entry)

        print("-" * 65)
        print("🧠 RECOMMENDED LLM CHAT MODELS (For 6-Part Clinical JSON Extraction):")
        print("-" * 65)
        for item in chat_models:
            fc_badge = " [Function Calling / JSON: YES]" if item["function_calling"] else ""
            print(f"  • {item['name']}{fc_badge}")

        if audio_models:
            print("\n" + "-" * 65)
            print("🎙️ AUDIO / SPEECH MODELS AVAILABLE ON GATEWAY:")
            print("-" * 65)
            for item in audio_models:
                print(f"  • {item['name']}")

        print("\n" + "=" * 65)
        print("RECOMMENDED .env CONFIGURATION FOR THIS GATEWAY:")
        print("=" * 65)
        print('LLM_MODEL="bedrock-amazon-nova-pro-v1-0"  # Best for 6-part clinical JSON extraction')
        print('STT_MODEL="whisper-1"')
        print('TTS_MODEL="tts-1"')
        print("Note: The Code for Africa LiteLLM proxy hosts AWS Bedrock LLM/Chat models.")
        print("Worker instruction speech is translated via LiteLLM and played via the voice engine.")
        print("=" * 65)

except Exception as exc:
    print(f"Failed to query model hub: {exc}")
