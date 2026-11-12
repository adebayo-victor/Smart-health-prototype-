"""
FastAPI router for Medical Translator endpoints.
Exposes TTS, STT, and LLM 6-part extraction APIs.
"""
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, Response, UploadFile
from pydantic import BaseModel, Field

from services.litellm_client import call_llm, call_stt, call_tts

router = APIRouter(prefix="/api/translator", tags=["Translator"])


class TTSRequest(BaseModel):
    text: str = Field(..., description="Worker instruction text to synthesize")
    voice: Optional[str] = Field("nova", description="Voice identifier")


class ProcessRequest(BaseModel):
    transcribed_text: str = Field(
        ...,
        description="Raw transcribed text from patient speech",
    )
    dialect_hint: Optional[str] = Field(
        None,
        description="Optional worker-selected dialect hint (e.g. Hausa, Yoruba, Igbo, Pidgin)",
    )


class VitalsSchema(BaseModel):
    temperature_c: Optional[float] = Field(None, description="Body temperature in Celsius")
    systolic_bp: Optional[int] = Field(None, description="Systolic blood pressure in mmHg")
    diastolic_bp: Optional[int] = Field(None, description="Diastolic blood pressure in mmHg")
    spo2_percent: Optional[int] = Field(None, description="Blood oxygen saturation percentage")
    heart_rate_bpm: Optional[int] = Field(None, description="Heart rate in beats per minute")


class ProcessResponse(BaseModel):
    dialect: str = Field(..., description="Identified language or dialect")
    statement: str = Field(..., description="Raw dialect transcription")
    translation: str = Field(..., description="Standardized clinical English translation")
    vitals: VitalsSchema = Field(..., description="Parsed numerical vitals")
    conclusion: str = Field(..., description="Clinical triage impression or summary")
    source: str = Field(..., description="Medical guideline reference or evidence source")


@router.post("/tts")
async def text_to_speech(payload: TTSRequest):
    """Synthesizes text into spoken audio stream."""
    try:
        audio_bytes = await call_tts(text=payload.text, voice=payload.voice or "nova")
        return Response(content=audio_bytes, media_type="audio/wav")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(exc)}")


@router.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    """Transcribes an uploaded audio file into text."""
    try:
        transcription = await call_stt(audio)
        return {"text": transcription}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Speech transcription failed: {str(exc)}")


@router.post("/process", response_model=ProcessResponse)
async def process_translation(payload: ProcessRequest):
    """
    Accepts raw transcribed text from the frontend.
    Calls call_llm() with strict system prompt and enforces the 6-part JSON response.
    """
    system_prompt = (
        "You are an expert bilingual clinical AI assistant for primary healthcare workers in Nigeria. "
        "Extract the following into JSON: dialect, statement, translation, vitals (parsed as numbers: "
        "temperature_c, systolic_bp, diastolic_bp, spo2_percent, heart_rate_bpm), conclusion, and source. "
        "Strictly adhere to this 6-part schema: "
        "{\n"
        '  "dialect": "Identified Nigerian dialect or language (e.g., Hausa, Yoruba, Igbo, Nigerian Pidgin)",\n'
        '  "statement": "Original raw patient speech statement verbatim",\n'
        '  "translation": "Standardized, grammatically complete clinical English translation",\n'
        '  "vitals": {\n'
        '    "temperature_c": float or null,\n'
        '    "systolic_bp": integer or null,\n'
        '    "diastolic_bp": integer or null,\n'
        '    "spo2_percent": integer or null,\n'
        '    "heart_rate_bpm": integer or null\n'
        "  },\n"
        '  "conclusion": "A concise clinical impression and risk assessment",\n'
        '  "source": "Clinical guideline or medical protocol referenced (e.g. FMOH Nigeria, WHO IMAI)"\n'
        "}\n"
        "If numeric vitals are missing, infer estimated ranges based on symptoms or set as null. Always return valid JSON."
    )

    user_content = f"Patient Transcribed Text: {payload.transcribed_text}"
    if payload.dialect_hint:
        user_content += f"\nDialect Hint: {payload.dialect_hint}"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]

    try:
        data = await call_llm(
            messages=messages,
            response_format={"type": "json_object"},
        )
        return data
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Clinical extraction failed: {str(exc)}",
        )
