"""Authentication routes using Firebase Firestore REST database."""
import re
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from ..config import settings
from ..db import (
    create_document,
    update_document,
    query_documents,
    OTP_STORE,
)
from ..deps import get_current_user
from ..security import (
    create_access_token,
    decode_access_token,
    generate_otp,
    hash_password,
    verify_google_id_token,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^\s@]+\.[^\s@]+$")

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)

class GoogleRequest(BaseModel):
    id_token: str

class SendOtpRequest(BaseModel):
    email: EmailStr

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str = Field(min_length=6, max_length=128)

def _public_user(user) -> dict:
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "provider": user["provider"],
        "createdAt": user.get("created_at") or user.get("createdAt") or datetime.now(timezone.utc).isoformat(),
    }

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest):
    email = body.email.strip().lower()
    if not EMAIL_REGEX.match(email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    
    existing = query_documents("users", {"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="This email address is already in use.")
        
    user_id = str(uuid.uuid4())
    created = datetime.now(timezone.utc).isoformat()
    
    user_data = {
        "name": body.name.strip(),
        "email": email,
        "password_hash": hash_password(body.password),
        "provider": "email",
        "created_at": created,
    }
    
    user_row = create_document("users", user_id, user_data)
    token = create_access_token(user_id, email)
    return {"token": token, "user": _public_user(user_row)}

@router.post("/login")
def login(body: LoginRequest):
    email = body.email.strip().lower()
    users = query_documents("users", {"email": email})
    if not users:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    user = users[0]
    if not user.get("password_hash") or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    token = create_access_token(user["id"], email)
    return {"token": token, "user": _public_user(user)}

@router.post("/google")
async def google_login(body: GoogleRequest):
    info = await verify_google_id_token(body.id_token)
    if info is None:
        raise HTTPException(status_code=401, detail="Google authentication failed. Please try again.")
        
    email = info["email"].strip().lower()
    users = query_documents("users", {"email": email})
    
    if not users:
        user_id = info["google_uid"] or str(uuid.uuid4())
        created = datetime.now(timezone.utc).isoformat()
        user_data = {
            "name": info["name"],
            "email": email,
            "provider": "google",
            "google_uid": info["google_uid"],
            "created_at": created,
        }
        user = create_document("users", user_id, user_data)
    else:
        user = users[0]
        if not user.get("google_uid"):
            user = update_document(
                "users", 
                user["id"], 
                {"google_uid": info["google_uid"], "provider": "google"}
            )
            
    token = create_access_token(user["id"], email)
    return {"token": token, "user": _public_user(user)}

@router.get("/me")
def me(user=Depends(get_current_user)):
    return {"user": _public_user(user)}

@router.post("/forgot/send-otp")
def send_otp(body: SendOtpRequest):
    email = body.email.strip().lower()
    users = query_documents("users", {"email": email})
    if not users or not users[0].get("password_hash"):
        raise HTTPException(status_code=404, detail="No account found with this email address.")
        
    otp = generate_otp()
    expires = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    
    if email not in OTP_STORE:
        OTP_STORE[email] = []
    OTP_STORE[email].append({"otp": otp, "expires_at": expires, "used": False})
    
    if settings.DEV_OTP:
        return {"message": "Verification code generated.", "devOtp": otp}
    return {"message": "Verification code sent to your email."}

@router.post("/forgot/verify-otp")
def verify_otp(body: VerifyOtpRequest):
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
def reset_password(body: ResetPasswordRequest):
    email = body.email.strip().lower()
    payload = decode_access_token(body.reset_token)
    if payload is None or payload.get("email", "").lower() != email:
        raise HTTPException(status_code=400, detail="Reset session is invalid or expired.")
        
    users = query_documents("users", {"email": email})
    if not users:
        raise HTTPException(status_code=404, detail="No account found with this email address.")
        
    user = users[0]
    update_document("users", user["id"], {"password_hash": hash_password(body.new_password)})
    return {"message": "Password updated successfully. You can now sign in."}
