"""Authentication routes utilizing MongoDB and Google verification."""
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr, Field

from ..db import db
from ..security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_google_id_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class GoogleRequest(BaseModel):
    id_token: str

def _public_user(user_doc: dict) -> dict:
    """Helper to convert MongoDB user document to public format."""
    return {
        "id": user_doc["id"],
        "name": user_doc["name"],
        "email": user_doc["email"],
        "provider": user_doc.get("provider", "email"),
        "createdAt": user_doc.get("created_at") or user_doc.get("createdAt") or datetime.now(timezone.utc).isoformat(),
    }

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    email = body.email.strip().lower()
    
    # Check if user already exists
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email address is already in use."
        )
        
    user_id = str(uuid.uuid4())
    created = datetime.now(timezone.utc).isoformat()
    
    user_data = {
        "id": user_id,
        "name": body.name.strip(),
        "email": email,
        "password_hash": hash_password(body.password),
        "provider": "email",
        "created_at": created,
    }
    
    # Save to MongoDB
    await db.users.insert_one(user_data)
    
    token = create_access_token(user_id, email)
    return {"token": token, "user": _public_user(user_data)}

@router.post("/login")
async def login(body: LoginRequest):
    email = body.email.strip().lower()
    
    # Lookup user
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
        
    # Verify password
    if not user.get("password_hash") or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
        
    token = create_access_token(user["id"], email)
    return {"token": token, "user": _public_user(user)}

@router.post("/google")
async def google_login(body: GoogleRequest):
    # Verify google token
    info = await verify_google_id_token(body.id_token)
    if info is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google authentication failed. Please try again."
        )
        
    email = info["email"].strip().lower()
    user = await db.users.find_one({"email": email})
    
    if not user:
        # Create user profile
        user_id = info["google_uid"] or str(uuid.uuid4())
        created = datetime.now(timezone.utc).isoformat()
        user_data = {
            "id": user_id,
            "name": info["name"],
            "email": email,
            "provider": "google",
            "google_uid": info["google_uid"],
            "created_at": created,
        }
        await db.users.insert_one(user_data)
        user = user_data
    else:
        # Sync Google UID if missing
        if not user.get("google_uid"):
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"google_uid": info["google_uid"], "provider": "google"}}
            )
            user["google_uid"] = info["google_uid"]
            user["provider"] = "google"
            
    token = create_access_token(user["id"], email)
    return {"token": token, "user": _public_user(user)}

# In-memory OTP storage for password reset
OTP_STORE = {}

class SendOtpRequest(BaseModel):
    email: EmailStr

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str = Field(..., min_length=6, max_length=128)

import secrets
from datetime import timedelta, timezone
from ..security import decode_access_token

@router.post("/forgot/send-otp")
async def send_otp(body: SendOtpRequest):
    email = body.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=404, detail="No account found with this email address.")
        
    otp = f"{secrets.randbelow(1_000_000):06d}"
    expires = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    
    if email not in OTP_STORE:
        OTP_STORE[email] = []
    OTP_STORE[email].append({"otp": otp, "expires_at": expires, "used": False})
    
    # In development we return the OTP in response
    return {"message": "Verification code generated.", "devOtp": otp}

@router.post("/forgot/verify-otp")
async def verify_otp(body: VerifyOtpRequest):
    email = body.email.strip().lower()
    now = datetime.now(timezone.utc).isoformat()
    
    otps = OTP_STORE.get(email, [])
    active_otps = [o for o in otps if o["otp"] == body.otp and not o["used"]]
    
    if not active_otps:
        raise HTTPException(status_code=400, detail="Invalid verification code.")
        
    latest_otp = active_otps[-1]
    if latest_otp["expires_at"] < now:
        raise HTTPException(status_code=400, detail="Verification code has expired.")
        
    latest_otp["used"] = True
    reset_token = create_access_token("reset-otp", email)
    return {"resetToken": reset_token}

@router.post("/forgot/reset")
async def reset_password(body: ResetPasswordRequest):
    email = body.email.strip().lower()
    payload = decode_access_token(body.reset_token)
    if payload is None or payload.get("email", "").lower() != email:
        raise HTTPException(status_code=400, detail="Reset session is invalid or expired.")
        
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address.")
        
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password_hash": hash_password(body.new_password)}}
    )
    return {"message": "Password updated successfully. You can now sign in."}

