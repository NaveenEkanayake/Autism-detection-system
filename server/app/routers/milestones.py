# server/app/routers/milestones.py
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from ..db import db
from ..security import decode_access_token

milestones_blueprint = Blueprint("milestones", __name__)

def get_current_user_id() -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)
    return payload.get("sub") if payload else None

MILESTONE_CHECKLIST = {
    "24_months": [
        "Points to things in a book when asked",
        "Says at least two words together",
        "Follows two-step instructions",
        "Responds when name is called",
        "Makes eye contact during interaction",
    ],
    "36_months": [
        "Notices other children and joins them in play",
        "Speaks in sentences of 3+ words",
        "Engages in imaginative/pretend play",
        "Follows simple instructions",
    ],
}


@milestones_blueprint.route("/milestones/checklist/<age_bucket>", methods=["GET"])
def get_checklist(age_bucket):
    items = MILESTONE_CHECKLIST.get(age_bucket)
    if items is None:
        return jsonify({"detail": f"No checklist found for age bucket '{age_bucket}'."}), 404
    return jsonify({"age_bucket": age_bucket, "items": items}), 200


@milestones_blueprint.route("/milestones/log", methods=["POST"])
async def log_entry():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    payload = request.get_json(silent=True)
    required = {"child_id", "age_bucket", "observations"}
    if not payload or not required.issubset(payload):
        return jsonify({"detail": f"Required fields: {required}"}), 400

    child_id = payload["child_id"]

    # Verify child ownership
    child = await db.patients.find_one({"id": child_id})
    if not child:
        return jsonify({"detail": "Child profile not found."}), 404
    if child.get("parent_id") != user_id:
        return jsonify({"detail": "Permission denied. Child profile does not belong to this account."}), 403

    doc = {
        "child_id": child_id,
        "age_bucket": payload["age_bucket"],
        "observations": payload["observations"],
        "logged_at": datetime.now(timezone.utc).isoformat(),
    }

    inserted = await db.milestone_logs.insert_one(doc)
    doc["id"] = inserted.inserted_id
    return jsonify(doc), 201


@milestones_blueprint.route("/milestones/timeline/<child_id>", methods=["GET"])
async def get_timeline(child_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    # Verify child ownership
    child = await db.patients.find_one({"id": child_id})
    if not child:
        return jsonify({"detail": "Child profile not found."}), 404
    if child.get("parent_id") != user_id:
        return jsonify({"detail": "Permission denied. Child profile does not belong to this account."}), 403

    entries = await db.milestone_logs.find({"child_id": child_id})
    entries.sort(key=lambda d: d.get("logged_at", ""))
    return jsonify({"child_id": child_id, "timeline": entries}), 200
