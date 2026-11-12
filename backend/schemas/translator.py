"""
Pydantic schemas for Medical Translator 6-part AI response validation.
Dialect -> Statement -> Translation -> Vitals -> Conclusion -> Source
"""
from typing import Optional
from pydantic import BaseModel, Field


class VitalsSchema(BaseModel):
    age: Optional[int] = Field(None, description="Patient age in years")
    gender: Optional[str] = Field(None, description="Patient gender (e.g., Male, Female)")
    bp_sys: Optional[int] = Field(None, description="Systolic blood pressure in mmHg")
    bp_dia: Optional[int] = Field(None, description="Diastolic blood pressure in mmHg")
    spo2: Optional[int] = Field(None, description="Blood oxygen saturation percentage")
    temp: Optional[float] = Field(None, description="Body temperature in Celsius")


class TranslationResponseSchema(BaseModel):
    dialect: str = Field(..., description="Identified language or dialect (e.g. Hausa, Yoruba, Igbo)")
    statement: str = Field(..., description="Raw dialect transcription verbatim")
    translation: str = Field(..., description="Standardized clinical English translation")
    vitals: VitalsSchema = Field(..., description="Parsed numeric vital signs")
    conclusion: str = Field(..., description="Clinical triage impression or summary")
    source: str = Field(..., description="Clinical guideline or evidence source")


class TTSRequestSchema(BaseModel):
    text: str = Field(..., description="Worker instruction text to synthesize")
    voice: Optional[str] = Field("autumn", description="Voice identifier (e.g., autumn, troy, diana, en-NG-AbeoNeural)")
    engine: Optional[str] = Field("groq", description="TTS Engine to use ('groq' or 'edge')")
    model: Optional[str] = Field("canopylabs/orpheus-v1-english", description="TTS Model ID")
