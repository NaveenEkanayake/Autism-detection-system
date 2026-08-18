import secrets
import time
from typing import Optional
import jwt
from jwt.exceptions import PyJWTError as JWTError
from passlib.context import CryptContext
from fastapi import HTTPException
import httpx

from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def create_access_token(user_id: str, email: str) -> str:
    expires = time.time() + (settings.JWT_EXPIRE_DAYS * 24 * 60 * 60)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expires
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        return None

def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"

async def verify_google_id_token(id_token: str):
    """Verify a Google/Firebase ID token using Google Identity Toolkit or tokeninfo endpoint."""
    if settings.FIREBASE_API_KEY:
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={settings.FIREBASE_API_KEY}"
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(url, json={"idToken": id_token})
                if resp.status_code == 200:
                    data = resp.json()
                    users = data.get("users", [])
                    if users:
                        user = users[0]
                        return {
                            "email": user.get("email").strip().lower(),
                            "name": user.get("displayName") or user.get("email").split("@")[0],
                            "google_uid": user.get("localId"),
                        }
        except Exception as e:
            print("Firebase lookup error:", str(e))

    url = "https://oauth2.googleapis.com/tokeninfo"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, data={"id_token": id_token})
            if resp.status_code == 200:
                info = resp.json()
                email = info.get("email")
                if email:
                    return {
                        "email": email.strip().lower(),
                        "name": info.get("name") or email.split("@")[0],
                        "google_uid": info.get("sub"),
                    }
    except Exception as e:
        print("Tokeninfo error:", str(e))
        
    return None
