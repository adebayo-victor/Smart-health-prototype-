"""
LiteLLM Gateway Service Layer (Pure LiteLLM, No Mock/Synthesized Fallbacks)
Communicates directly with the LiteLLM gateway using the OpenAI SDK (or direct HTTP).
"""
from io import BytesIO
import json
import os
import urllib.error
import urllib.request
import uuid
from typing import Any, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None


class LiteLLMClient:
    """
    Direct client communicating with the LiteLLM gateway (OpenAI-compatible).
    Uses LITELLM_BASE_URL and LITELLM_API_KEY from environment variables.
    Strictly executes real LiteLLM calls.
    """

    def __init__(self) -> None:
        self.api_key: str = os.getenv("LITELLM_API_KEY", "").strip()
        self.base_url: str = os.getenv(
            "LITELLM_BASE_URL",
            "https://litellm.codeforafrica.org/v1",
        ).rstrip("/")
        self.llm_model: str = os.getenv("LLM_MODEL", "bedrock-amazon-nova-pro-v1-0")
        self.stt_model: str = os.getenv("STT_MODEL", "whisper-1")
        self.tts_model: str = os.getenv("TTS_MODEL", "tts-1")

        if OpenAI is not None and self.api_key:
            self.sdk_client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url,
            )
        else:
            self.sdk_client = None

    def _ensure_credentials(self) -> None:
        if not self.api_key:
            raise ValueError(
                "LITELLM_API_KEY environment variable is not configured. "
                "Please configure your LITELLM_API_KEY in the Secrets panel."
            )
        if not self.base_url:
            raise ValueError(
                "LITELLM_BASE_URL environment variable is not configured."
            )

    def generate_speech(self, text: str, voice: str = "nova") -> bytes:
        """
        Sends text to LiteLLM TTS endpoint (tts-1).
        Returns raw audio bytes directly from LiteLLM.
        """
        self._ensure_credentials()

        # Route via OpenAI SDK if installed
        if self.sdk_client is not None:
            response = self.sdk_client.audio.speech.create(
                model=self.tts_model,
                voice=voice,
                input=text,
            )
            return response.content

        # Direct HTTP call to LiteLLM gateway
        url = f"{self.base_url}/audio/speech"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = json.dumps({
            "model": self.tts_model,
            "voice": voice,
            "input": text,
        }).encode("utf-8")

        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"LiteLLM TTS Error ({exc.code}): {error_body}") from exc

    def transcribe_audio(
        self,
        audio_file_bytes: bytes,
        filename: str = "patient_recording.webm",
        language: Optional[str] = "ha",
    ) -> str:
        """
        Sends audio blob to LiteLLM Whisper endpoint (whisper-1).
        Returns the raw transcribed text directly from LiteLLM.
        """
        self._ensure_credentials()

        if not audio_file_bytes:
            raise ValueError("Audio buffer is empty. Please provide a valid patient audio recording.")

        # Route via OpenAI SDK if installed
        if self.sdk_client is not None:
            audio_file = BytesIO(audio_file_bytes)
            audio_file.name = filename

            response = self.sdk_client.audio.transcriptions.create(
                model=self.stt_model,
                file=audio_file,
                language=language,
            )
            return response.text

        # Direct multipart/form-data HTTP call to LiteLLM gateway
        url = f"{self.base_url}/audio/transcriptions"
        boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"

        body = bytearray()
        # Field: model
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(b'Content-Disposition: form-data; name="model"\r\n\r\n')
        body.extend(f"{self.stt_model}\r\n".encode("utf-8"))

        # Field: language (if provided)
        if language:
            body.extend(f"--{boundary}\r\n".encode("utf-8"))
            body.extend(b'Content-Disposition: form-data; name="language"\r\n\r\n')
            body.extend(f"{language}\r\n".encode("utf-8"))

        # Field: file
        content_type = "audio/webm"
        if filename.endswith(".wav"):
            content_type = "audio/wav"
        elif filename.endswith(".mp3"):
            content_type = "audio/mpeg"

        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode("utf-8"))
        body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
        body.extend(audio_file_bytes)
        body.extend(b"\r\n")

        body.extend(f"--{boundary}--\r\n".encode("utf-8"))

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        }

        req = urllib.request.Request(url, data=bytes(body), headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                resp_json = json.loads(resp.read().decode("utf-8"))
                return resp_json.get("text", "")
        except urllib.error.HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"LiteLLM STT Error ({exc.code}): {error_body}") from exc

    def extract_medical_json(self, raw_transcription: str) -> Dict[str, Any]:
        """
        The central brain. Uses the LLM via LiteLLM with strict response_format={"type": "json_object"}.
        Cleans up phonetic ASR misspellings from Nigerian Pidgin or Hausa and extracts the 6-part JSON:
        {dialect, statement, translation, vitals: {age, gender, bp_sys, bp_dia, spo2, temp}, conclusion, source}.
        """
        self._ensure_credentials()

        if not raw_transcription or not raw_transcription.strip():
            raise ValueError("Raw transcription is empty. Cannot perform clinical extraction.")

        system_prompt = (
            "You are an expert Nigerian medical translator. The input text may contain phonetic misspellings "
            "of Nigerian Pidgin or Hausa from an ASR system. Your job is to: "
            "1. Identify the dialect. "
            "2. State the original raw text. "
            "3. Translate to standard medical English. "
            "4. Extract vitals (temp, bp_sys, bp_dia, spo2, age, gender) as numbers if mentioned. "
            "5. Provide a clinical conclusion. "
            "6. Cite 'Nigerian Standard Treatment Guidelines' as the source. "
            "Output strictly as a valid JSON object matching this schema: "
            "{"
            '"dialect": "identified dialect (e.g. Hausa, Nigerian Pidgin, Yoruba, Igbo)", '
            '"statement": "original raw transcript verbatim", '
            '"translation": "standardized clinical English translation", '
            '"vitals": {"age": int or null, "gender": "Female" | "Male" | null, "bp_sys": int or null, "bp_dia": int or null, "spo2": int or null, "temp": float or null}, '
            '"conclusion": "clinical triage conclusion and risk impression", '
            '"source": "Nigerian Standard Treatment Guidelines"'
            "}"
        )

        # Route via OpenAI SDK if installed
        if self.sdk_client is not None:
            response = self.sdk_client.chat.completions.create(
                model=self.llm_model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": raw_transcription},
                ],
                temperature=0.1,
            )
            content = response.choices[0].message.content
            if not content:
                raise RuntimeError("LiteLLM returned empty completion.")
            return json.loads(content)

        # Direct HTTP call to LiteLLM gateway
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = json.dumps({
            "model": self.llm_model,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": raw_transcription},
            ],
            "temperature": 0.1,
        }).encode("utf-8")

        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                resp_json = json.loads(resp.read().decode("utf-8"))
                content = resp_json["choices"][0]["message"]["content"]
                return json.loads(content)
        except urllib.error.HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"LiteLLM Chat Error ({exc.code}): {error_body}") from exc

    def extract_and_translate(self, raw_text: str) -> Dict[str, Any]:
        """Alias for extract_medical_json for backward compatibility."""
        return self.extract_medical_json(raw_transcription=raw_text)


# Service singleton
litellm_service = LiteLLMClient()


def transcribe_audio(audio_file_bytes: bytes, filename: str = "patient_recording.webm") -> str:
    return litellm_service.transcribe_audio(audio_file_bytes, filename=filename)


def generate_speech(text: str, voice: str = "nova") -> bytes:
    return litellm_service.generate_speech(text, voice=voice)


def extract_medical_json(raw_transcription: str) -> Dict[str, Any]:
    """
    Cleans up raw ASR transcription and extracts 6-part clinical JSON using LiteLLM.
    """
    return litellm_service.extract_medical_json(raw_transcription)


def extract_and_translate(raw_text: str) -> Dict[str, Any]:
    return litellm_service.extract_medical_json(raw_text)
