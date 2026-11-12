"""
Groq Text-to-Speech (TTS) Service Layer.
Powered by Groq's high-speed Orpheus TTS API (canopylabs/orpheus-v1-english).
Generates lifelike audio from worker clinical instructions with ultra-low latency.
"""
import json
import os
import sys
import urllib.error
import urllib.request
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

GROQ_SPEECH_URL = "https://api.groq.com/openai/v1/audio/speech"
DEFAULT_GROQ_TTS_MODEL = os.getenv("GROQ_TTS_MODEL", "canopylabs/orpheus-v1-english")
DEFAULT_GROQ_VOICE = os.getenv("GROQ_TTS_VOICE", "autumn")

# Supported voices for Groq canopylabs/orpheus-v1-english
GROQ_VOICES = ["autumn", "diana", "hannah", "austin", "daniel", "troy"]


def resolve_groq_voice(voice_name: Optional[str] = None) -> str:
    """
    Validates and normalizes voice name for Groq Orpheus TTS.
    """
    if not voice_name:
        return DEFAULT_GROQ_VOICE
    v = voice_name.strip().lower()
    for valid_voice in GROQ_VOICES:
        if valid_voice in v:
            return valid_voice
    return DEFAULT_GROQ_VOICE


def generate_groq_tts(
    text: str,
    voice: Optional[str] = None,
    model: Optional[str] = None,
    api_key: Optional[str] = None,
) -> bytes:
    """
    Generates WAV audio bytes using Groq Text-to-Speech endpoint.

    Args:
        text: Clinical instruction text string to synthesize.
        voice: Voice persona (autumn, diana, hannah, austin, daniel, troy).
        model: TTS model ID (default: canopylabs/orpheus-v1-english).
        api_key: Optional Groq API key override.

    Returns:
        Raw audio bytes (audio/wav).
    """
    if not text or not text.strip():
        raise ValueError("Text string is required for Groq speech synthesis.")

    resolved_key = (api_key or os.getenv("GROQ_API_KEY", "")).strip()
    if not resolved_key or resolved_key.startswith("your_"):
        raise ValueError(
            "GROQ_API_KEY is not configured. "
            "Please provide a valid Groq API key (starts with gsk_...)."
        )

    chosen_voice = resolve_groq_voice(voice)
    chosen_model = (model or DEFAULT_GROQ_TTS_MODEL).strip()

    payload = {
        "model": chosen_model,
        "input": text.strip(),
        "voice": chosen_voice,
        "response_format": "wav",
    }
    data = json.dumps(payload).encode("utf-8")

    headers = {
        "Authorization": f"Bearer {resolved_key}",
        "Content-Type": "application/json",
        "User-Agent": "SmartHealthAI-MedicalTranslator/1.0",
    }

    req = urllib.request.Request(GROQ_SPEECH_URL, data=data, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            return resp.read()
    except urllib.error.HTTPError as exc:
        err_msg = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Groq TTS Error ({exc.code}): {err_msg}") from exc
    except Exception as exc:
        raise RuntimeError(f"Groq TTS Network Error: {str(exc)}") from exc


if __name__ == "__main__":
    # CLI integration: python3 backend/services/groq_tts_service.py "text" "voice" "model"
    # Outputs raw WAV bytes directly to stdout for server.ts piping
    if len(sys.argv) > 1:
        input_text = sys.argv[1]
        input_voice = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_GROQ_VOICE
        input_model = sys.argv[3] if len(sys.argv) > 3 else DEFAULT_GROQ_TTS_MODEL
        try:
            wav_bytes = generate_groq_tts(input_text, voice=input_voice, model=input_model)
            sys.stdout.buffer.write(wav_bytes)
            sys.stdout.buffer.flush()
        except Exception as e:
            sys.stderr.write(f"Groq TTS Error: {e}\n")
            sys.exit(1)
