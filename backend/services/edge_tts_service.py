"""
Edge-TTS Service Layer.
Uses Microsoft Edge TTS for zero-cost, high-quality neural speech synthesis.
Supports authentic Nigerian neural voices:
- en-NG-AbeoNeural (Nigerian Male)
- en-NG-EzinneNeural (Nigerian Female / Hausa)
Runs via native edge-tts if installed or node msedge-tts bridge.
"""
import asyncio
import json
import subprocess
import sys
from typing import Optional

try:
    import edge_tts
except ImportError:
    edge_tts = None

DEFAULT_VOICE = "en-NG-AbeoNeural"  # Nigerian Male Neural Voice
FEMALE_VOICE = "en-NG-EzinneNeural"  # Nigerian Female Neural Voice


def resolve_voice(voice: Optional[str] = None, dialect: Optional[str] = None) -> str:
    """
    Resolves the appropriate Edge-TTS voice based on requested voice or dialect.
    """
    if voice:
        v_lower = voice.lower()
        if "ezinne" in v_lower or "female" in v_lower:
            return FEMALE_VOICE
        if "abeo" in v_lower or "male" in v_lower:
            return DEFAULT_VOICE
        if voice.startswith("en-NG-") or voice.startswith("sw-"):
            return voice

    if dialect and ("hausa" in dialect.lower() or "female" in dialect.lower()):
        return FEMALE_VOICE

    return DEFAULT_VOICE


def _generate_via_node(text: str, target_voice: str) -> bytes:
    """
    Generates Edge-TTS audio using the msedge-tts Node.js bridge.
    Guarantees execution even if python edge-tts library is not installed.
    """
    js_script = """
    const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
    const text = process.argv[1];
    const voice = process.argv[2] || "en-NG-EzinneNeural";

    (async () => {
      try {
        const tts = new MsEdgeTTS();
        await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
        const { audioStream } = tts.toStream(text);
        const chunks = [];
        audioStream.on("data", c => chunks.push(c));
        audioStream.on("close", () => {
          process.stdout.write(Buffer.concat(chunks));
          process.exit(0);
        });
        audioStream.on("error", err => {
          process.stderr.write(String(err));
          process.exit(1);
        });
      } catch (err) {
        process.stderr.write(String(err));
        process.exit(1);
      }
    })();
    """
    proc = subprocess.run(
        ["node", "-e", js_script, text, target_voice],
        capture_output=True,
        timeout=15,
    )
    if proc.returncode == 0 and len(proc.stdout) > 0:
        return proc.stdout
    err = proc.stderr.decode("utf-8", errors="replace")
    raise RuntimeError(f"Node msedge-tts error: {err or 'Empty output'}")


async def generate_speech_async(text: str, voice: Optional[str] = None) -> bytes:
    """
    Generates MP3 audio bytes using edge-tts or node msedge-tts.
    """
    target_voice = resolve_voice(voice)

    if edge_tts is not None:
        try:
            communicate = edge_tts.Communicate(text, target_voice)
            audio_chunks = []
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_chunks.append(chunk["data"])
            return b"".join(audio_chunks)
        except Exception:
            pass

    # Node.js msedge-tts fallback
    return _generate_via_node(text, target_voice)


def generate_edge_tts(text: str, voice: Optional[str] = None) -> bytes:
    """
    Synchronous wrapper to generate Edge-TTS MP3 audio bytes.
    """
    target_voice = resolve_voice(voice)
    if edge_tts is not None:
        try:
            return asyncio.run(generate_speech_async(text, target_voice))
        except Exception:
            pass
    return _generate_via_node(text, target_voice)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        text_arg = sys.argv[1]
        voice_arg = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_VOICE
        try:
            mp3_bytes = generate_edge_tts(text_arg, voice_arg)
            sys.stdout.buffer.write(mp3_bytes)
            sys.stdout.buffer.flush()
        except Exception as e:
            sys.stderr.write(f"Edge-TTS Error: {e}\n")
            sys.exit(1)
