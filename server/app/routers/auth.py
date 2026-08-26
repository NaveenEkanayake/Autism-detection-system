"""Authentication routes utilizing Firebase Firestore, JWT tokens, and Google verification (Flask Blueprint version)."""
import uuid
import secrets
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify

from ..db import db
from ..security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_google_id_token,
    decode_access_token,
)

auth_blueprint = Blueprint("auth", __name__)

# In-memory OTP storage for password reset
OTP_STORE = {}

def _public_user(user_doc: dict) -> dict:
    """Helper to convert Firestore user document to public format."""
    return {
        "id": user_doc["id"],
        "name": user_doc["name"],
        "email": user_doc["email"],
        "provider": user_doc.get("provider", "email"),
        "createdAt": user_doc.get("created_at") or user_doc.get("createdAt") or datetime.now(timezone.utc).isoformat(),
    }

@auth_blueprint.route("/auth/register", methods=["POST"])
async def register():
    body = request.get_json() or {}
    name = body.get("name", "").strip()
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")

    if not name or len(name) < 2:
        return jsonify({"detail": "Name must be at least 2 characters long."}), 400
    if not email or "@" not in email:
        return jsonify({"detail": "A valid email address is required."}), 400
    if not password or len(password) < 6:
        return jsonify({"detail": "Password must be at least 6 characters long."}), 400

    # Check if user already exists
    existing = await db.users.find_one({"email": email})
    if existing:
        return jsonify({"detail": "This email address is already in use."}), 409
        
    user_id = str(uuid.uuid4())
    created = datetime.now(timezone.utc).isoformat()
    
    user_data = {
        "id": user_id,
        "name": name,
        "email": email,
        "password_hash": hash_password(password),
        "provider": "email",
        "created_at": created,
    }
    
    # Save to Firestore
    await db.users.insert_one(user_data)
    
    token = create_access_token(user_id, email)
    return jsonify({"token": token, "user": _public_user(user_data)}), 201

@auth_blueprint.route("/auth/login", methods=["POST"])
async def login():
    body = request.get_json() or {}
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")

    if not email or not password:
        return jsonify({"detail": "Email and password are required."}), 400

    # Lookup user
    user = await db.users.find_one({"email": email})
    if not user:
        return jsonify({"detail": "Invalid email or password."}), 401
        
    # Verify password
    if not user.get("password_hash") or not verify_password(password, user["password_hash"]):
        return jsonify({"detail": "Invalid email or password."}), 401
        
    token = create_access_token(user["id"], email)
    return jsonify({"token": token, "user": _public_user(user)}), 200

@auth_blueprint.route("/auth/google", methods=["POST"])
async def google_login():
    body = request.get_json() or {}
    id_token = body.get("id_token")

    if not id_token:
        return jsonify({"detail": "Google ID token is required."}), 400

    # Verify google token
    info = await verify_google_id_token(id_token)
    if info is None:
        return jsonify({"detail": "Google authentication failed. Please try again."}), 401
        
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
    return jsonify({"token": token, "user": _public_user(user)}), 200

@auth_blueprint.route("/auth/forgot/send-otp", methods=["POST"])
async def send_otp():
    body = request.get_json() or {}
    email = body.get("email", "").strip().lower()

    if not email or "@" not in email:
        return jsonify({"detail": "A valid email address is required."}), 400

    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash"):
        return jsonify({"detail": "No account found with this email address."}), 404
        
    otp = f"{secrets.randbelow(1_000_000):06d}"
    expires = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    
    if email not in OTP_STORE:
        OTP_STORE[email] = []
    OTP_STORE[email].append({"otp": otp, "expires_at": expires, "used": False})
    
    # In development we return the OTP in response
    return jsonify({"message": "Verification code generated.", "devOtp": otp}), 200

@auth_blueprint.route("/auth/forgot/verify-otp", methods=["POST"])
async def verify_otp():
    body = request.get_json() or {}
    email = body.get("email", "").strip().lower()
    otp = body.get("otp")

    if not email or not otp:
        return jsonify({"detail": "Email and verification code (OTP) are required."}), 400

    now = datetime.now(timezone.utc).isoformat()
    
    otps = OTP_STORE.get(email, [])
    active_otps = [o for o in otps if o["otp"] == otp and not o["used"]]
    
    if not active_otps:
        return jsonify({"detail": "Invalid verification code."}), 400
        
    latest_otp = active_otps[-1]
    if latest_otp["expires_at"] < now:
        return jsonify({"detail": "Verification code has expired."}), 400
        
    latest_otp["used"] = True
    reset_token = create_access_token("reset-otp", email)
    return jsonify({"resetToken": reset_token}), 200

@auth_blueprint.route("/auth/forgot/reset", methods=["POST"])
async def reset_password():
    body = request.get_json() or {}
    email = body.get("email", "").strip().lower()
    reset_token = body.get("reset_token")
    new_password = body.get("new_password")

    if not email or not reset_token or not new_password or len(new_password) < 6:
        return jsonify({"detail": "Invalid parameters. New password must be at least 6 characters."}), 400

    payload = decode_access_token(reset_token)
    if payload is None or payload.get("email", "").lower() != email:
        return jsonify({"detail": "Reset session is invalid or expired."}), 400
        
    user = await db.users.find_one({"email": email})
    if not user:
        return jsonify({"detail": "No account found with this email address."}), 404
        
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password_hash": hash_password(new_password)}}
    )
    return jsonify({"message": "Password updated successfully. You can now sign in."}), 200
