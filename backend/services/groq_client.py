"""
Groq Speech-to-Text (STT) Service Layer.
Powered by Groq's high-speed Whisper Large v3 model with contextual biasing
for Nigerian Pidgin and Hausa clinical intake dialogues.
"""
from io import BytesIO
import json
import os
import urllib.error
import urllib.request
import uuid
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

try:
    from groq import Groq
except ImportError:
    Groq = None


# Contextual prompt hack:
# Whisper models struggle with African dialects and Nigerian Pidgin unless seeded
# with typical vocabulary in the prompt parameter. Passing these key terms biases the
# decoder towards recognizing Pidgin colloquialisms and Hausa medical terms.
NIGERIAN_MEDICAL_PROMPT = (
    "This is a medical intake in Nigerian Pidgin or Hausa. "
    "Words may include: body dey pain me, how far, zazzabi, ciwon kai, "
    "belle dey run, eye dey turn me, malaria, typhoid, tension, BP, doctor, clinic."
)


class GroqSTTClient:
    """
    Client for Groq's high-speed Whisper Large v3 Speech-to-Text API.
    Uses GROQ_API_KEY from environment variables.
    """

    def __init__(self) -> None:
        self.api_key: str = os.getenv("GROQ_API_KEY", "").strip()
        self.base_url: str = "https://api.groq.com/openai/v1"
        self.model: str = "whisper-large-v3"

        if Groq is not None and self.api_key and not self.api_key.startswith("your_"):
            self.sdk_client = Groq(api_key=self.api_key)
        else:
            self.sdk_client = None

    def _ensure_api_key(self) -> str:
        api_key = os.getenv("GROQ_API_KEY", "").strip()
        if not api_key or api_key == "your_groq_key":
            raise ValueError(
                "GROQ_API_KEY is not configured in .env. "
                "Please add your Groq API key (starts with gsk_...) to .env."
            )
        return api_key

    def transcribe_audio_groq(
        self,
        audio_file_bytes: bytes,
        filename: str = "patient_recording.webm",
        language: Optional[str] = None,
        custom_prompt: Optional[str] = None,
    ) -> str:
        """
        Transcribes patient audio bytes using Groq whisper-large-v3.

        Args:
            audio_file_bytes: Raw bytes of the audio file (webm, mp3, wav, m4a, ogg).
            filename: Original filename to preserve mime-type context.
            language: Set to 'ha' for Hausa. For Pidgin, leave as None (auto-detect)
                      because Whisper classifies Nigerian Pidgin under English.
            custom_prompt: Optional contextual biasing prompt override.

        Returns:
            Transcribed raw speech string.
        """
        if not audio_file_bytes:
            raise ValueError("Audio buffer is empty. Please provide a valid patient audio recording.")

        api_key = self._ensure_api_key()
        prompt_text = custom_prompt or NIGERIAN_MEDICAL_PROMPT

        # Route via official Groq SDK if available
        if self.sdk_client is not None:
            audio_io = BytesIO(audio_file_bytes)
            audio_io.name = filename

            kwargs = {
                "model": self.model,
                "file": audio_io,
                "prompt": prompt_text,
                "temperature": 0.0,
                "response_format": "json",
            }
            if language:
                kwargs["language"] = language

            transcription = self.sdk_client.audio.transcriptions.create(**kwargs)
            return transcription.text.strip()

        # Direct HTTP multipart/form-data request to Groq API (zero extra dependencies)
        url = f"{self.base_url}/audio/transcriptions"
        boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"

        body = bytearray()

        def add_field(name: str, value: str):
            body.extend(f"--{boundary}\r\n".encode("utf-8"))
            body.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"))
            body.extend(f"{value}\r\n".encode("utf-8"))

        add_field("model", self.model)
        add_field("prompt", prompt_text)
        add_field("response_format", "json")
        add_field("temperature", "0.0")

        # CRITICAL: Only set language if explicitly specified (e.g., 'ha' for Hausa).
        # For Nigerian Pidgin, leaving language blank allows Whisper to auto-detect English variant.
        if language and language.strip():
            add_field("language", language.strip())

        # Determine file mime type
        ext = filename.lower().split(".")[-1] if "." in filename else "webm"
        mime_map = {
            "webm": "audio/webm",
            "mp3": "audio/mpeg",
            "wav": "audio/wav",
            "m4a": "audio/m4a",
            "ogg": "audio/ogg",
        }
        content_type = mime_map.get(ext, "audio/webm")

        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(
            f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode("utf-8")
        )
        body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
        body.extend(audio_file_bytes)
        body.extend(b"\r\n")
        body.extend(f"--{boundary}--\r\n".encode("utf-8"))

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        }

        req = urllib.request.Request(url, data=bytes(body), headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=40) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                return resp_data.get("text", "").strip()
        except urllib.error.HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Groq STT Error ({exc.code}): {error_body}") from exc


# Service singleton
groq_service = GroqSTTClient()


def transcribe_audio_groq(
    audio_file_bytes: bytes,
    filename: str = "patient_recording.webm",
    language: Optional[str] = None,
) -> str:
    """
    Convenience function to transcribe patient audio via Groq Whisper Large v3.
    """
    return groq_service.transcribe_audio_groq(
        audio_file_bytes=audio_file_bytes,
        filename=filename,
        language=language,
    )
