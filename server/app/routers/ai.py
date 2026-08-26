# server/app/routers/ai.py
import logging
import httpx
from flask import Blueprint, request, jsonify
from ..db import db
from ..config import settings
from ..security import decode_access_token

logger = logging.getLogger(__name__)
ai_blueprint = Blueprint("ai", __name__)


def get_current_user_id() -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)
    return payload.get("sub") if payload else None


@ai_blueprint.route("/ai/suggestions", methods=["POST"])
async def ai_suggestions():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    payload = request.get_json(silent=True) or {}
    child_id = payload.get("childId")
    query = payload.get("query", "")

    if not child_id:
        return jsonify({"detail": "childId is required."}), 400

    # Verify child ownership
    child = await db.patients.find_one({"id": child_id})
    if not child:
        return jsonify({"detail": "Child profile not found."}), 404
    if child.get("parent_id") != user_id:
        return jsonify({"detail": "Permission denied. Child profile does not belong to this account."}), 403

    # Load latest SDQ assessment, Vision analysis, milestones, growth, and sleep for this child
    latest_sdq = await db.sdq_submissions.find_one({"child_id": child_id}, sort=[("submitted_at", -1)])
    latest_vision = await db.vision_analyses.find_one({"child_id": child_id}, sort=[("created_at", -1)])
    all_milestones = await db.milestone_logs.find({"child_id": child_id})
    all_growth = await db.growth_logs.find({"child_id": child_id})
    all_sleep = await db.sleep_logs.find({"child_id": child_id})

    # Format child status information for Gemini prompt context
    child_name = child.get("name", "the child")
    child_age = child.get("dob", "N/A")
    child_sex = child.get("sex", "N/A")

    sdq_info = "None completed yet"
    sdq_score = 0
    if latest_sdq:
        sdq_score = latest_sdq.get("total_difficulties_score", 0)
        sub = latest_sdq.get("subscale_scores", {})
        sdq_info = (
            f"Total Score: {sdq_score}/40 (Band: {latest_sdq.get('band', 'N/A')}). "
            f"Subscales: Emotional={sub.get('emotional', 0)}, Conduct={sub.get('conduct', 0)}, "
            f"Hyperactivity={sub.get('hyperactivity', 0)}, Peer Problems={sub.get('peer', 0)}, "
            f"Prosocial={sub.get('prosocial', 0)}"
        )

    vision_info = "None completed yet"
    ai_conf = 0.0
    if latest_vision:
        ai_conf = latest_vision.get("risk_score", 0.0)
        vision_info = f"Risk Score: {ai_conf}% (Risk Level: {latest_vision.get('risk_level', 'N/A')}). Summary: {latest_vision.get('summary', '')}"

    # Format milestones
    milestones_info = "None logged yet"
    if all_milestones:
        milestone_lines = [f"- {m.get('title', 'N/A')} ({m.get('category', 'General')}, {m.get('age_months', '?')}m) - {m.get('date', '')}" for m in all_milestones[:10]]
        milestones_info = f"{len(all_milestones)} milestones logged:\n" + "\n".join(milestone_lines)

    # Format growth
    growth_info = "None logged yet"
    if all_growth:
        latest_g = all_growth[0] if all_growth else {}
        growth_info = f"{len(all_growth)} records. Latest: Weight={latest_g.get('weight_kg', 'N/A')}kg, Height={latest_g.get('height_cm', 'N/A')}cm, Head={latest_g.get('head_cm', 'N/A')}cm"

    # Format sleep
    sleep_info = "None logged yet"
    if all_sleep:
        latest_s = all_sleep[0] if all_sleep else {}
        sleep_info = f"{len(all_sleep)} logs. Latest: {latest_s.get('duration_hours', 'N/A')}hrs, Quality={latest_s.get('quality', 'N/A')}"

    # Determine priority (Sets priority to High if SDQ difficulty is clinical >= 8 (20%) OR AI confidence is high > 80%)
    priority = "Normal"
    if sdq_score >= 8 or ai_conf > 80.0:
        priority = "High"

    # AI Action Plans support levels
    support_level = "Level 1 (Mild/Consultative)"
    if sdq_score >= 20:
        support_level = "Level 3 (High/Complex)"
    elif sdq_score >= 13:
        support_level = "Level 2 (Moderate/Active)"

    # Build Gemini system prompt
    prompt = (
        f"You are a supportive developmental screening AI assistant for the AuraTrack platform. You help parents understand their child's development using all available data.\n\n"
        f"Context for the current child:\n"
        f"- Name: {child_name}\n"
        f"- Date of Birth: {child_age}\n"
        f"- Gender: {child_sex}\n"
        f"- Latest SDQ Assessment: {sdq_info}\n"
        f"- Latest AI Vision screening (YOLOv8): {vision_info}\n"
        f"- CDC Milestones Achieved: {milestones_info}\n"
        f"- Growth Chart Records: {growth_info}\n"
        f"- Sleep Log Records: {sleep_info}\n"
        f"- Calculated Priority/Urgency: {priority}\n"
        f"- Assigned Support Level: {support_level}\n\n"
        f"Parent's Query: {query}\n\n"
        f"IMPORTANT: Only use the data provided above to answer. Do not fabricate information. "
        f"Reference the child's actual milestone achievements, growth measurements, and sleep patterns in your response. "
        f"If asked about data not provided above, say that data is not yet available.\n\n"
        f"Respond in a warm, encouraging tone. Provide personalized developmental recommendations, exercises, "
        f"or behavioral modifications appropriate for the child's specific context and age. "
        f"Frame all advice as supportive screening insights, not a medical diagnosis."
    )

    # Call Gemini API
    url = f"{settings.GEMINI_URL}/{settings.GEMINI_MODEL}:generateContent"
    params = {"key": settings.GEMINI_API_KEY}
    headers = {"Content-Type": "application/json"}
    body = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, json=body, headers=headers, params=params)
            if resp.status_code != 200:
                logger.error(f"Gemini API error ({resp.status_code}): {resp.text}")
                return jsonify({
                    "reply": "I apologize, but I am unable to connect to the recommendation engine right now. Please try again."
                }), 200

            data = resp.json()
            reply = data["candidates"][0]["content"]["parts"][0]["text"]
            return jsonify({"reply": reply, "priority": priority}), 200
    except Exception as e:
        logger.error(f"Gemini calling error: {e}")
        return jsonify({
            "reply": "I apologize, but I encountered an error generating recommendations. Please try again."
        }), 200
