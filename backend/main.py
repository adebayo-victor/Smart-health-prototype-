"""
FastAPI application entry point for SmartHealth Backend.
Mounts translator API router with Groq STT and LiteLLM extraction.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.translator import router as translator_router

app = FastAPI(
    title="SmartHealth Clinical Gateway API",
    description="FastAPI service for Medical Translator with Groq STT and LiteLLM extraction.",
    version="1.0.0",
)

# Enable CORS for PWA frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include translator router
app.include_router(translator_router)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "stt": "Groq Whisper Large v3",
        "llm": "LiteLLM Gateway",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
