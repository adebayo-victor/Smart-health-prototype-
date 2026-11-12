"""
Main FastAPI entry point for SmartHealth PWA backend.
Mounts database, routers, and CORS middleware.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers.translator import router as translator_router
from backend.api.translator import router as v1_translator_router

# Initialize database schema if running with local SQLite/PostgreSQL
try:
    Base.metadata.create_all(bind=engine)
except Exception as exc:
    print(f"[Database init warning] {exc}")

app = FastAPI(
    title="SmartHealth AI PWA Backend",
    description="Clinical translation, triage, and encounter sync API for rural healthcare centers.",
    version="1.0.0",
)

# CORS configuration for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount endpoints
app.include_router(translator_router)
app.include_router(v1_translator_router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "SmartHealth AI Backend"}
