"""
FastAPI router for Medical Translator workflow.
Exposes /api/v1/translator/tts and /api/v1/translator/process.
"""
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, Response, UploadFile

from backend.schemas.translator import (
    TTSRequestSchema,
    TranslationResponseSchema,
)
from backend.services.edge_tts_service import generate_edge_tts
from backend.services.groq_client import transcribe_audio_groq
from backend.services.groq_tts_service import generate_groq_tts
from backend.services.litellm_client import extract_medical_json

router = APIRouter(prefix="/api/v1/translator", tags=["Medical Translator"])


@router.post("/tts")
async def generate_tts_endpoint(payload: TTSRequestSchema):
    """
    Accepts text, generates speech using Groq Orpheus TTS (canopylabs/orpheus-v1-english).
    Falls back gracefully to Edge-TTS Nigerian Neural Voice if Groq key is unset or errors.
    Returns audio/wav (Groq) or audio/mpeg (Edge-TTS).
    """
    engine_preference = (payload.engine or "groq").lower()

    # Priority 1: Groq TTS
    if engine_preference != "edge":
        try:
            audio_bytes = generate_groq_tts(
                text=payload.text,
                voice=payload.voice or "autumn",
                model=payload.model or "canopylabs/orpheus-v1-english",
            )
            return Response(content=audio_bytes, media_type="audio/wav")
        except Exception as groq_exc:
            # If user explicitly requested groq only and it failed, log and fallback to Edge-TTS
            pass

    # Priority 2: Edge-TTS
    try:
        audio_bytes = generate_edge_tts(
            text=payload.text,
            voice=payload.voice if (payload.voice and "Neural" in payload.voice) else "en-NG-AbeoNeural",
        )
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as edge_exc:
        raise HTTPException(
            status_code=500,
            detail=f"Speech synthesis failed on both Groq and Edge-TTS engines: {str(edge_exc)}",
        )


@router.post("/process", response_model=TranslationResponseSchema)
async def process_patient_audio(
    audio: Optional[UploadFile] = File(None, description="Recorded patient audio blob (webm, mp3, wav)"),
    language: Optional[str] = Form(None, description="Optional dialect code ('ha' for Hausa, leave blank for Pidgin/auto)"),
    raw_text_override: Optional[str] = Form(None, description="Optional raw transcript override"),
):
    """
    Pipeline for Medical Translator:
    1. Accepts recorded patient audio (UploadFile).
    2. Calls transcribe_audio_groq() to get fast, accurate transcription with Nigerian Pidgin/Hausa biasing.
    3. Calls extract_medical_json() via LiteLLM to clean ASR errors, extract vitals, and build 6-part JSON.
    4. Validates and returns the structured clinical JSON.
    """
    try:
        raw_text: str = ""

        # Step 1: Use raw text override if provided (e.g. testing or typing)
        if raw_text_override and raw_text_override.strip():
            raw_text = raw_text_override.strip()
        elif audio is not None:
            # Step 2: Read audio bytes and transcribe via Groq Whisper Large v3
            audio_bytes = await audio.read()
            raw_text = transcribe_audio_groq(
                audio_file_bytes=audio_bytes,
                filename=audio.filename or "patient_recording.webm",
                language=language,
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="Either an audio file or raw_text_override must be provided.",
            )

        if not raw_text.strip():
            raise HTTPException(
                status_code=422,
                detail="Groq STT returned empty transcription for the provided audio.",
            )

        # Step 3: Central LiteLLM extraction for 6-part JSON
        extracted_dict = extract_medical_json(raw_transcription=raw_text)

        # Step 4: Validate against TranslationResponseSchema
        validated_response = TranslationResponseSchema.model_validate(extracted_dict)
        return validated_response

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Translation and clinical extraction failed: {str(exc)}",
        )
