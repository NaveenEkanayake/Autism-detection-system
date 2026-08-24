"""Security functions for password hashing, JWT generation, and Google auth verification."""
import time
import logging
from typing import Optional
import jwt
import httpx
from passlib.context import CryptContext
from fastapi import HTTPException, status
from .config import settings

logger = logging.getLogger("app.security")

# Configure pbkdf2_sha256 password hashing
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hashes a plain text password using pbkdf2_sha256."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain text password against a hashed value."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False

def create_access_token(user_id: str, email: str) -> str:
    """Generates a JWT token signed with settings.JWT_SECRET."""
    expires = time.time() + (settings.JWT_EXPIRE_DAYS * 24 * 60 * 60)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expires
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and validates a JWT access token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError as e:
        logger.warning(f"JWT decode error: {e}")
        return None

async def verify_google_id_token(id_token: str) -> Optional[dict]:
    """
    Verifies a Google or Firebase ID Token using Google Identity Toolkit and Tokeninfo.
    Returns user details (email, name, uid) if verified, else None.
    """
    # 1. Try Firebase Identity Toolkit lookup (for React Firebase auth tokens)
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
            logger.error(f"Firebase account lookup failed: {e}")

    # 2. Fall back to standard Google OAuth2 Tokeninfo (for raw oauth2 tokens)
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
            else:
                logger.warning(f"Google ID token verification fallback failed: {resp.text}")
    except Exception as e:
        logger.error(f"Google ID token fallback request error: {e}")
        
    return None
