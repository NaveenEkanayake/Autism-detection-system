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


# ─── Folder Management ────────────────────────────────────────────

@documents_blueprint.route("/folders", methods=["GET"])
async def list_folders():
    """List all folders for the authenticated user."""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    try:
        folders = await db.folders.find({"user_id": user_id})
        return jsonify(folders), 200
    except Exception as e:
        return jsonify({"detail": f"Failed to fetch folders: {str(e)}"}), 500


@documents_blueprint.route("/folders", methods=["POST"])
async def create_folder():
    """Create a new folder. Validates duplicate names per user."""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    body = request.get_json() or {}
    name = (body.get("name") or "").strip()
    if not name:
        return jsonify({"detail": "Folder name is required."}), 400

    # Check for duplicate folder name (case-insensitive)
    existing_folders = await db.folders.find({"user_id": user_id})
    for f in existing_folders:
        if f.get("name", "").lower() == name.lower():
            return jsonify({"detail": f'A folder named "{name}" already exists.'}), 409

    folder_id = f"folder-{uuid.uuid4().hex[:12]}"
    folder_data = {
        "id": folder_id,
        "user_id": user_id,
        "name": name,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        await db.folders.insert_one(folder_data)
        return jsonify(folder_data), 201
    except Exception as e:
        return jsonify({"detail": f"Failed to create folder: {str(e)}"}), 500


@documents_blueprint.route("/folders/<folder_id>", methods=["PATCH"])
async def rename_folder(folder_id):
    """Rename a folder. Validates duplicate names per user."""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    body = request.get_json() or {}
    new_name = (body.get("name") or "").strip()
    if not new_name:
        return jsonify({"detail": "Folder name is required."}), 400

    # Verify ownership
    folder = await db.folders.find_one({"id": folder_id, "user_id": user_id})
    if not folder:
        return jsonify({"detail": "Folder not found."}), 404

    # Check for duplicate name (excluding current folder)
    existing_folders = await db.folders.find({"user_id": user_id})
    for f in existing_folders:
        if f.get("id") != folder_id and f.get("name", "").lower() == new_name.lower():
            return jsonify({"detail": f'A folder named "{new_name}" already exists.'}), 409

    try:
        await db.folders.update_one({"id": folder_id}, {"$set": {"name": new_name}})
        return jsonify({"id": folder_id, "name": new_name}), 200
    except Exception as e:
        return jsonify({"detail": f"Failed to rename folder: {str(e)}"}), 500


@documents_blueprint.route("/folders/<folder_id>", methods=["DELETE"])
async def delete_folder(folder_id):
    """Delete a folder. Child documents are moved to root (folderId=None)."""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    folder = await db.folders.find_one({"id": folder_id, "user_id": user_id})
    if not folder:
        return jsonify({"detail": "Folder not found."}), 404

    try:
        # Move child documents back to root
        docs_in_folder = await db.documents.find({"folder_id": folder_id})
        for doc in docs_in_folder:
            await db.documents.update_one(
                {"id": doc["id"]},
                {"$set": {"folder_id": None}}
            )

        await db.folders.delete_one({"id": folder_id})
        return jsonify({"success": True, "message": "Folder deleted successfully."}), 200
    except Exception as e:
        return jsonify({"detail": f"Failed to delete folder: {str(e)}"}), 500


# ─── Document Upload & List ───────────────────────────────────────

@documents_blueprint.route("/documents/upload", methods=["POST"])
async def upload_document():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    if "file" not in request.files:
        return jsonify({"detail": "No file part in request."}), 400

    file = request.files["file"]
    child_id = request.form.get("child_id")
    folder_id = request.form.get("folder_id")
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
        "folder_id": folder_id,
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


@documents_blueprint.route("/documents/<doc_id>", methods=["DELETE"])
async def delete_document(doc_id):
    """Delete a single document by ID."""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    doc = await db.documents.find_one({"id": doc_id})
    if not doc:
        return jsonify({"detail": "Document not found."}), 404

    try:
        # Try to remove the stored file
        if doc.get("stored_filename"):
            stored_path = os.path.join(settings.DOCUMENT_STORAGE_DIR, doc["stored_filename"])
            if os.path.exists(stored_path):
                os.remove(stored_path)

        await db.documents.delete_one({"id": doc_id})
        return jsonify({"success": True, "message": "Document deleted successfully."}), 200
    except Exception as e:
        return jsonify({"detail": f"Failed to delete document: {str(e)}"}), 500


# ─── Test / Dummy Cleanup ─────────────────────────────────────────

TEST_PATTERNS = ["test", "dummy", "sample", "tmp", "temp"]

@documents_blueprint.route("/cleanup/test-files", methods=["DELETE"])
async def cleanup_test_files():
    """Remove any test/dummy documents and folders for the authenticated user."""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    deleted_docs = 0
    deleted_folders = 0

    try:
        # Clean up test folders
        all_folders = await db.folders.find({"user_id": user_id})
        for folder in all_folders:
            name_lower = folder.get("name", "").lower()
            if any(pat in name_lower for pat in TEST_PATTERNS):
                # Move child docs to root first
                docs_in_folder = await db.documents.find({"folder_id": folder["id"]})
                for doc in docs_in_folder:
                    await db.documents.update_one(
                        {"id": doc["id"]},
                        {"$set": {"folder_id": None}}
                    )
                await db.folders.delete_one({"id": folder["id"]})
                deleted_folders += 1

        # Clean up test documents (filename contains test/dummy/sample)
        all_docs = await db.documents.find({"child_id": user_id})
        for doc in all_docs:
            fname = (doc.get("original_filename") or doc.get("name") or "").lower()
            if any(pat in fname for pat in TEST_PATTERNS):
                if doc.get("stored_filename"):
                    stored_path = os.path.join(settings.DOCUMENT_STORAGE_DIR, doc["stored_filename"])
                    if os.path.exists(stored_path):
                        os.remove(stored_path)
                await db.documents.delete_one({"id": doc["id"]})
                deleted_docs += 1

        return jsonify({
            "success": True,
            "deleted_folders": deleted_folders,
            "deleted_documents": deleted_docs,
            "message": f"Cleanup complete: removed {deleted_folders} test folders and {deleted_docs} test files.",
        }), 200
    except Exception as e:
        return jsonify({"detail": f"Cleanup failed: {str(e)}"}), 500
