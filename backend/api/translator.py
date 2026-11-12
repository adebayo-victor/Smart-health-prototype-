from fastapi import APIRouter, UploadFile, File, HTTPException
from services.groq_client import transcribe_audio_groq
from services.litellm_client import extract_medical_json
from schemas.translator import TranslationResponseSchema

router = APIRouter(prefix="/api/v1/translator", tags=["translator"])

@router.post("/process", response_model=TranslationResponseSchema)
async def process_audio_translation(audio: UploadFile = File(...)):
    try:
        # 1. Read audio bytes
        audio_bytes = await audio.read()
        
        # 2. Groq STT (Transcribe)
        raw_text = transcribe_audio_groq(audio_bytes, audio.filename)
        if not raw_text:
            raise HTTPException(status_code=400, detail="Transcription failed or audio was empty.")

        # 3. LiteLLM LLM (Extract & Translate)
        structured_data = extract_medical_json(raw_text)
        
        # 4. Return strict JSON
        return structured_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {str(e)}")
