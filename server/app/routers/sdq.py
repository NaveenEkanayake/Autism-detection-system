# server/app/routers/sdq.py
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from ..db import db
from ..models.sdq_scoring import score_sdq
from ..security import decode_access_token

sdq_blueprint = Blueprint("sdq", __name__)

def get_current_user_id() -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)
    return payload.get("sub") if payload else None


@sdq_blueprint.route("/sdq/submit", methods=["POST"])
async def submit_sdq():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    payload = request.get_json(silent=True)
    if not payload or "child_id" not in payload or "responses" not in payload:
        return jsonify({"detail": "child_id and responses are required."}), 400

    child_id = payload["child_id"]
    responses = payload["responses"]

    # Verify child ownership
    child = await db.patients.find_one({"id": child_id})
    if not child:
        return jsonify({"detail": "Child profile not found."}), 404
    if child.get("parent_id") != user_id:
        return jsonify({"detail": "Permission denied. Child profile does not belong to this account."}), 403

    if len(responses) != 25:
        return jsonify({"detail": f"Expected 25 item responses, got {len(responses)}."}), 400

    try:
        result = score_sdq(responses)
    except ValueError as e:
        return jsonify({"detail": str(e)}), 400

    # Determine priority (Sets report priority to high if SDQ difficulty is clinical >=20 OR AI confidence is high >80%)
    latest_vision = await db.vision_analyses.find_one({"child_id": child_id}, sort=[("created_at", -1)])
    ai_conf = latest_vision.get("risk_score", 0.0) if latest_vision else 0.0
    sdq_score = result["total_difficulties_score"]

    priority = "high" if (sdq_score >= 8 or ai_conf > 80.0) else "normal"

    doc = {
        "child_id": child_id,
        "responses": responses,
        "subscale_scores": result["subscale_scores"],
        "total_difficulties_score": sdq_score,
        "band": result["band"],
        "priority": priority,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }

    inserted = await db.sdq_submissions.insert_one(doc)
    doc["id"] = inserted.inserted_id

    return jsonify({
        "result": doc,
        "disclaimer": (
            "This score reflects a validated screening questionnaire and is not a "
            "diagnosis. Scores in the 'high' or 'very high' range are a prompt to "
            "discuss with a pediatrician or developmental specialist, not a clinical conclusion."
        )
    }), 201


@sdq_blueprint.route("/sdq/history/<child_id>", methods=["GET"])
async def sdq_history(child_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    # Verify child ownership
    child = await db.patients.find_one({"id": child_id})
    if not child:
        return jsonify({"detail": "Child profile not found."}), 404
    if child.get("parent_id") != user_id:
        return jsonify({"detail": "Permission denied. Child profile does not belong to this account."}), 403

    submissions = await db.sdq_submissions.find({"child_id": child_id})
    submissions.sort(key=lambda d: d.get("submitted_at", ""), reverse=True)
    return jsonify({"child_id": child_id, "submissions": submissions}), 200


@sdq_blueprint.route("/sdq/clear/<child_id>", methods=["DELETE"])
async def clear_sdq_history(child_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    child = await db.patients.find_one({"id": child_id})
    if not child:
        return jsonify({"detail": "Child profile not found."}), 404
    if child.get("parent_id") != user_id:
        return jsonify({"detail": "Permission denied. Child profile does not belong to this account."}), 403

    submissions = await db.sdq_submissions.find({"child_id": child_id})
    for sub in submissions:
        await db.sdq_submissions.delete_one({"id": sub["id"]})

    return jsonify({"message": "SDQ assessment history cleared successfully."}), 200
