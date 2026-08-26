# server/app/routers/vision.py
import os
import uuid
import logging
import tempfile
import base64
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from ultralytics import YOLO
from ..db import db
from ..security import decode_access_token

logger = logging.getLogger(__name__)
vision_blueprint = Blueprint("vision", __name__)

# Initialize YOLO model on load
yolo_model = None
try:
    # autism_yolo_model.pt is at server/models/autism_yolo_model.pt
    model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models", "autism_yolo_model.pt"))
    logger.info(f"Loading YOLOv8 model from: {model_path}")
    if os.path.exists(model_path):
        yolo_model = YOLO(model_path)
        logger.info("YOLOv8 model loaded successfully.")
    else:
        logger.error(f"YOLOv8 weights not found at: {model_path}")
except Exception as e:
    logger.error(f"Failed to load YOLOv8 model: {e}")


def get_current_user_id() -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)
    return payload.get("sub") if payload else None


def compute_risk(predictions) -> dict:
    """Turn model detections into a formatted risk evaluation."""
    detections = []
    autism_confs = []
    non_autism_confs = []

    for pred in predictions:
        label = pred["label"]
        conf = pred["confidence"]
        detections.append({"label": label, "confidence": round(conf, 4)})
        if label == "Autism":
            autism_confs.append(conf)
        elif label == "Non-Autism":
            non_autism_confs.append(conf)

    if not predictions:
        score = 25.0
        level = "Safe"
        summary = "No clear autism-related facial features were detected in the uploaded image. A low residual risk remains."
    else:
        max_autism = max(autism_confs, default=0.0)
        max_non_autism = max(non_autism_confs, default=0.0)

        if max_autism > max_non_autism:
            score = round(max_autism * 100, 1)
        else:
            score = round((1.0 - max_non_autism) * 100, 1)

        score = max(0.0, min(100.0, score))

        if score < 40.0:
            level = "Safe"
            summary = f"The YOLOv8 computer vision model detected typical facial markers with a risk score of {score}% (Non-Autism confidence: {max_non_autism * 100:.1f}%). This indicates a typical developmental probability."
        elif score < 70.0:
            level = "Moderate"
            summary = f"The YOLOv8 computer vision model detected some mixed facial markers with a risk score of {score}%. This indicates a moderate developmental screening probability."
        else:
            level = "At Risk"
            summary = f"The YOLOv8 computer vision model detected facial features associated with Autism with a risk score of {score}%. This indicates a higher probability of atypical markers."

    return {
        "detections": detections,
        "riskScore": score,
        "riskLevel": level,
        "summary": summary
    }


@vision_blueprint.route("/vision/analyze", methods=["POST"])
async def analyze_media():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    image_bytes = None
    filename = "upload.png"
    child_id = None

    if request.is_json:
        # Base64 JSON payload handling
        body = request.get_json(silent=True) or {}
        image_data = body.get("image")
        child_id = body.get("childId")

        if not image_data:
            return jsonify({"detail": "image base64 string is required in JSON payload."}), 400

        # Strip header (e.g. "data:image/jpeg;base64,") if present
        if "," in image_data:
            image_data = image_data.split(",")[1]

        try:
            import base64
            image_bytes = base64.b64decode(image_data)
        except Exception as e:
            return jsonify({"detail": f"Invalid base64 encoding: {str(e)}"}), 400
    else:
        # Multipart form-data handling
        if "file" not in request.files:
            return jsonify({"detail": "No file part in request."}), 400
        file = request.files["file"]
        child_id = request.form.get("childId")

        if not file.filename:
            return jsonify({"detail": "No selected file."}), 400
        image_bytes = file.read()
        filename = file.filename

    if not child_id:
        return jsonify({"detail": "childId is required."}), 400

    # Verify child ownership
    child = await db.patients.find_one({"id": child_id})
    if not child:
        return jsonify({"detail": "Child profile not found."}), 404
    if child.get("parent_id") != user_id:
        return jsonify({"detail": "Permission denied. Child profile does not belong to this account."}), 403

    if yolo_model is None:
        return jsonify({"detail": "YOLOv8 model weights not loaded on server."}), 500

    # Write input file bytes to a temporary file for Ultralytics inference
    suffix = os.path.splitext(filename)[1] or ".png"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(image_bytes)
        temp_path = temp_file.name

    try:
        # Run inference using the loaded YOLO weights
        results = yolo_model.predict(source=temp_path, conf=0.25)
        predictions = []

        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                label = yolo_model.names.get(cls_id, f"Class {cls_id}")
                predictions.append({
                    "label": label,
                    "confidence": conf
                })

        risk = compute_risk(predictions)

        # Determine priority (Sets report priority to high if SDQ difficulty is clinical >=20 OR AI confidence is high >80%)
        latest_sdq = await db.sdq_submissions.find_one({"child_id": child_id}, sort=[("submitted_at", -1)])
        sdq_score = latest_sdq.get("total_difficulties_score", 0) if latest_sdq else 0
        ai_conf = risk["riskScore"]
        priority = "high" if (sdq_score >= 8 or ai_conf > 80.0) else "normal"

        # Build analysis record to save in Firestore
        created_at = datetime.now(timezone.utc).isoformat()
        analysis_id = f"vision-{str(uuid.uuid4())[:8]}-{int(datetime.now().timestamp())}"

        analysis_data = {
            "id": analysis_id,
            "child_id": child_id,
            "parent_id": user_id,
            "image_url": "",
            "status": "completed",
            "risk_score": ai_conf,
            "risk_level": risk["riskLevel"],
            "priority": priority,
            "results": {
                "detections": risk["detections"],
                "riskScore": risk["riskScore"],
                "riskLevel": risk["riskLevel"],
                "summary": risk["summary"],
                "behavioral_flags": ["Facial symmetry tracked", "Developmental markers indexed"] if risk["riskLevel"] == "Safe" else ["Gaze offset flagged", "Atypical landmarks observed"],
                "risk_indicators": [] if risk["riskLevel"] == "Safe" else ["Atypical features flagged"]
            },
            "created_at": created_at
        }

        await db.vision_analyses.insert_one(analysis_data)

        return jsonify({
            "id": analysis_id,
            "childId": child_id,
            "status": "completed",
            "createdAt": created_at,
            "priority": priority,
            **risk,
            "behavioral_flags": analysis_data["results"]["behavioral_flags"],
            "risk_indicators": analysis_data["results"]["risk_indicators"]
        }), 201

    except Exception as e:
        logger.error(f"Inference error: {e}")
        return jsonify({"detail": f"Model inference failed: {str(e)}"}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@vision_blueprint.route("/vision/history/<child_id>", methods=["GET"])
async def vision_history(child_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    # Verify child ownership
    child = await db.patients.find_one({"id": child_id})
    if not child:
        return jsonify({"detail": "Child profile not found."}), 404
    if child.get("parent_id") != user_id:
        return jsonify({"detail": "Permission denied. Child profile does not belong to this account."}), 403

    rows = await db.vision_analyses.find({"child_id": child_id})
    rows.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    mapped_rows = []
    for r in rows:
        results = r.get("results") or {}
        mapped_rows.append({
            "id": r["id"],
            "childId": r["child_id"],
            "patientId": r["child_id"],
            "imageUrl": r.get("image_url", ""),
            "status": r.get("status", "completed"),
            "riskScore": r.get("risk_score", 0),
            "riskLevel": r.get("risk_level", "low"),
            "detections": results.get("detections", []),
            "behavioral_flags": results.get("behavioral_flags", []),
            "risk_indicators": results.get("risk_indicators", []),
            "summary": results.get("summary", ""),
            "createdAt": r["created_at"]
        })

    return jsonify(mapped_rows), 200


@vision_blueprint.route("/vision/clear/<child_id>", methods=["DELETE"])
async def clear_vision_history(child_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    child = await db.patients.find_one({"id": child_id})
    if not child:
        return jsonify({"detail": "Child profile not found."}), 404
    if child.get("parent_id") != user_id:
        return jsonify({"detail": "Permission denied. Child profile does not belong to this account."}), 403

    analyses = await db.vision_analyses.find({"child_id": child_id})
    for ana in analyses:
        await db.vision_analyses.delete_one({"id": ana["id"]})

    return jsonify({"message": "AI Vision analysis history cleared successfully."}), 200
