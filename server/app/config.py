"""Application configuration loaded from environment variables."""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class Settings:
    PORT = int(os.getenv("PORT", "8000"))
    JWT_SECRET = os.getenv("JWT_SECRET", "aura-track-dev-secret")
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRE_DAYS = 7

    ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "")
    ROBOFLOW_MODEL_ID = os.getenv("ROBOFLOW_MODEL_ID", "")
    ROBOFLOW_URL = os.getenv("ROBOFLOW_URL", "https://detect.roboflow.com")

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
    FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "")
    FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY", "AIzaSyD6KLsdWAhQ7mvACDvmyt5Wzq69rN-f08k")

    # Google Gemini (AI suggestions)
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models"

    DEV_OTP = os.getenv("DEV_OTP", "1") == "1"

    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


settings = Settings()
