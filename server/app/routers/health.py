"""Health tracking CRUD API — milestones, growth charts, sleep logs."""
import logging
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from ..db import db
from ..security import decode_access_token

logger = logging.getLogger("app.health")
health_blueprint = Blueprint("health", __name__)


def get_current_user_id() -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)
    return payload.get("sub") if payload else None


async def _verify_child(child_id, user_id):
    child = await db.patients.find_one({"id": child_id})
    if not child:
        return None, (jsonify({"detail": "Child profile not found."}), 404)
    if child.get("parent_id") != user_id:
        return None, (jsonify({"detail": "Permission denied."}), 403)
    return child, None


# ─── Milestones ──────────────────────────────────────────────────

@health_blueprint.route("/health/milestones", methods=["GET"])
async def list_milestones():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401
    child_id = request.args.get("child_id")
    if not child_id:
        return jsonify({"detail": "child_id query param required."}), 400

    _, err = await _verify_child(child_id, user_id)
    if err:
        return err

    entries = await db.milestone_logs.find({"child_id": child_id})
    entries.sort(key=lambda e: e.get("created_at", ""), reverse=True)
    return jsonify(entries), 200


@health_blueprint.route("/health/milestones", methods=["POST"])
async def create_milestone():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    body = request.get_json() or {}
    child_id = body.get("child_id")
    if not child_id:
        return jsonify({"detail": "child_id is required."}), 400

    _, err = await _verify_child(child_id, user_id)
    if err:
        return err

    title = (body.get("title") or "").strip()
    if not title:
        return jsonify({"detail": "Milestone title is required."}), 400

    milestone_id = f"mile-{int(datetime.now().timestamp())}-{title[:20].replace(' ', '_').lower()}"
    doc = {
        "id": milestone_id,
        "child_id": child_id,
        "title": title,
        "category": body.get("category", "General"),
        "age_months": body.get("age_months", 0),
        "date": body.get("date") or datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.milestone_logs.insert_one(doc)
    return jsonify(doc), 201


@health_blueprint.route("/health/milestones/<milestone_id>", methods=["PATCH"])
async def update_milestone(milestone_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    body = request.get_json() or {}
    update_fields = {}
    for key in ["title", "category", "age_months", "date"]:
        if key in body:
            update_fields[key] = body[key]

    if not update_fields:
        return jsonify({"detail": "No fields to update."}), 400

    try:
        await db.milestone_logs.update_one({"id": milestone_id}, {"$set": update_fields})
        return jsonify({"success": True, "id": milestone_id, **update_fields}), 200
    except Exception as e:
        return jsonify({"detail": f"Failed to update milestone: {str(e)}"}), 500


@health_blueprint.route("/health/milestones/<milestone_id>", methods=["DELETE"])
async def delete_milestone(milestone_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    try:
        await db.milestone_logs.delete_one({"id": milestone_id})
        return jsonify({"success": True, "message": "Milestone deleted."}), 200
    except Exception as e:
        return jsonify({"detail": f"Failed to delete milestone: {str(e)}"}), 500


# ─── Growth Charts ───────────────────────────────────────────────

@health_blueprint.route("/health/growth", methods=["GET"])
async def list_growth():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401
    child_id = request.args.get("child_id")
    if not child_id:
        return jsonify({"detail": "child_id query param required."}), 400

    _, err = await _verify_child(child_id, user_id)
    if err:
        return err

    entries = await db.growth_logs.find({"child_id": child_id})
    entries.sort(key=lambda e: e.get("created_at", ""), reverse=True)
    return jsonify(entries), 200


@health_blueprint.route("/health/growth", methods=["POST"])
async def create_growth():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    body = request.get_json() or {}
    child_id = body.get("child_id")
    if not child_id:
        return jsonify({"detail": "child_id is required."}), 400

    _, err = await _verify_child(child_id, user_id)
    if err:
        return err

    growth_id = f"growth-{int(datetime.now().timestamp())}"
    doc = {
        "id": growth_id,
        "child_id": child_id,
        "weight_kg": body.get("weight_kg"),
        "height_cm": body.get("height_cm"),
        "head_cm": body.get("head_cm"),
        "date": body.get("date") or datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.growth_logs.insert_one(doc)
    return jsonify(doc), 201


@health_blueprint.route("/health/growth/<growth_id>", methods=["PATCH"])
async def update_growth(growth_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    body = request.get_json() or {}
    update_fields = {}
    for key in ["weight_kg", "height_cm", "head_cm", "date"]:
        if key in body:
            update_fields[key] = body[key]

    if not update_fields:
        return jsonify({"detail": "No fields to update."}), 400

    try:
        await db.growth_logs.update_one({"id": growth_id}, {"$set": update_fields})
        return jsonify({"success": True, "id": growth_id, **update_fields}), 200
    except Exception as e:
        return jsonify({"detail": f"Failed to update growth record: {str(e)}"}), 500


@health_blueprint.route("/health/growth/<growth_id>", methods=["DELETE"])
async def delete_growth(growth_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    try:
        await db.growth_logs.delete_one({"id": growth_id})
        return jsonify({"success": True, "message": "Growth record deleted."}), 200
    except Exception as e:
        return jsonify({"detail": f"Failed to delete growth record: {str(e)}"}), 500


# ─── Sleep Logs ──────────────────────────────────────────────────

@health_blueprint.route("/health/sleep", methods=["GET"])
async def list_sleep():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401
    child_id = request.args.get("child_id")
    if not child_id:
        return jsonify({"detail": "child_id query param required."}), 400

    _, err = await _verify_child(child_id, user_id)
    if err:
        return err

    entries = await db.sleep_logs.find({"child_id": child_id})
    entries.sort(key=lambda e: e.get("created_at", ""), reverse=True)
    return jsonify(entries), 200


@health_blueprint.route("/health/sleep", methods=["POST"])
async def create_sleep():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    body = request.get_json() or {}
    child_id = body.get("child_id")
    if not child_id:
        return jsonify({"detail": "child_id is required."}), 400

    _, err = await _verify_child(child_id, user_id)
    if err:
        return err

    sleep_id = f"sleep-{int(datetime.now().timestamp())}"
    doc = {
        "id": sleep_id,
        "child_id": child_id,
        "start_time": body.get("start_time", ""),
        "end_time": body.get("end_time", ""),
        "quality": body.get("quality", "good"),
        "notes": body.get("notes", ""),
        "duration_hours": body.get("duration_hours", 0),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.sleep_logs.insert_one(doc)
    return jsonify(doc), 201


@health_blueprint.route("/health/sleep/<sleep_id>", methods=["PATCH"])
async def update_sleep(sleep_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    body = request.get_json() or {}
    update_fields = {}
    for key in ["start_time", "end_time", "quality", "notes", "duration_hours"]:
        if key in body:
            update_fields[key] = body[key]

    if not update_fields:
        return jsonify({"detail": "No fields to update."}), 400

    try:
        await db.sleep_logs.update_one({"id": sleep_id}, {"$set": update_fields})
        return jsonify({"success": True, "id": sleep_id, **update_fields}), 200
    except Exception as e:
        return jsonify({"detail": f"Failed to update sleep record: {str(e)}"}), 500


@health_blueprint.route("/health/sleep/<sleep_id>", methods=["DELETE"])
async def delete_sleep(sleep_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    try:
        await db.sleep_logs.delete_one({"id": sleep_id})
        return jsonify({"success": True, "message": "Sleep record deleted."}), 200
    except Exception as e:
        return jsonify({"detail": f"Failed to delete sleep record: {str(e)}"}), 500
