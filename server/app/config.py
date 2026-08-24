"""Application configuration loaded from environment variables."""
import os
import json
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    PORT: int = int(os.getenv("PORT", "8000"))
    JWT_SECRET: str = os.getenv("JWT_SECRET", "default-fallback-jwt-secret-key-12345")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_DAYS: int = int(os.getenv("JWT_EXPIRE_DAYS", "7"))

    # MongoDB
    MONGODB_URL: str = os.getenv("MONGODB_URL", "")

    # Google/Firebase Client Verification
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    FIREBASE_API_KEY: str = os.getenv("FIREBASE_API_KEY", "AIzaSyD6KLsdWAhQ7mvACDvmyt5Wzq69rN-f08k")

    # Google Gemini API
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    GEMINI_URL: str = "https://generativelanguage.googleapis.com/v1beta/models"

    # CORS Config
    CORS_ORIGINS: list = ["http://localhost:5173", "http://127.0.0.1:5173"]

    def __init__(self):
        origins_str = os.getenv("CORS_ORIGINS")
        if origins_str:
            try:
                self.CORS_ORIGINS = json.loads(origins_str)
            except Exception:
                self.CORS_ORIGINS = [origins_str]

settings = Settings()
