# server/app/routers/documents.py
import os
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from ..db import db
from ..config import settings
from ..security import decode_access_token

documents_blueprint = Blueprint("documents", __name__)

def get_current_user_id() -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)
    return payload.get("sub") if payload else None

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "docx"}
ALLOWED_CATEGORIES = {"therapist_notes", "genetics", "iep_school_form", "evaluation_report", "other"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@documents_blueprint.route("/documents/upload", methods=["POST"])
async def upload_document():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    if "file" not in request.files:
        return jsonify({"detail": "No file part in request."}), 400

    file = request.files["file"]
    child_id = request.form.get("child_id")
    category = request.form.get("category", "other")

    if not child_id:
        return jsonify({"detail": "child_id is required."}), 400

    # Verify child ownership
    child = await db.patients.find_one({"id": child_id})
    if not child:
        return jsonify({"detail": "Child profile not found."}), 404
    if child.get("parent_id") != user_id:
        return jsonify({"detail": "Permission denied. Child profile does not belong to this account."}), 403

    if category not in ALLOWED_CATEGORIES:
        return jsonify({"detail": f"category must be one of {ALLOWED_CATEGORIES}"}), 400
    if not file.filename or not allowed_file(file.filename):
        return jsonify({"detail": "Unsupported file type."}), 400

    ext = file.filename.rsplit(".", 1)[1].lower()
    stored_name = f"{uuid.uuid4().hex}.{ext}"
    os.makedirs(settings.DOCUMENT_STORAGE_DIR, exist_ok=True)
    storage_path = os.path.join(settings.DOCUMENT_STORAGE_DIR, stored_name)
    file.save(storage_path)

    doc = {
        "child_id": child_id,
        "category": category,
        "original_filename": file.filename,
        "stored_filename": stored_name,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }
    inserted = await db.documents.insert_one(doc)
    doc["id"] = inserted.inserted_id

    return jsonify(doc), 201


@documents_blueprint.route("/documents/<child_id>", methods=["GET"])
async def list_documents(child_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    # Verify child ownership
    child = await db.patients.find_one({"id": child_id})
    if not child:
        return jsonify({"detail": "Child profile not found."}), 404
    if child.get("parent_id") != user_id:
        return jsonify({"detail": "Permission denied. Child profile does not belong to this account."}), 403

    docs = await db.documents.find({"child_id": child_id})
    return jsonify({"child_id": child_id, "documents": docs}), 200
