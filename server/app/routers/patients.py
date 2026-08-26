"""Blueprint for child/patient profile CRUD operations using Firestore (Flask Blueprint version)."""
import uuid
import logging
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify

from ..db import db
from ..security import decode_access_token

logger = logging.getLogger("app.patients")
patients_blueprint = Blueprint("patients", __name__)

def get_current_user_id() -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        return None
    return payload.get("sub")

@patients_blueprint.route("/patients", methods=["GET"])
async def get_patients():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401
        
    try:
        patients = await db.patients.find({"parent_id": user_id})
        return jsonify(patients), 200
    except Exception as e:
        logger.error(f"Error fetching patients: {e}")
        return jsonify({"detail": "Failed to fetch patient profiles."}), 500

@patients_blueprint.route("/patients", methods=["POST"])
async def create_patient():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401
        
    body = request.get_json() or {}
    name = body.get("name", "").strip()
    dob = body.get("dob", "")
    sex = body.get("sex", "male")
    
    if not name:
        return jsonify({"detail": "Child's name is required."}), 400
    if not dob:
        return jsonify({"detail": "Date of birth is required."}), 400
        
    patient_id = f"child-{str(uuid.uuid4())[:8]}-{int(datetime.now().timestamp())}"
    
    patient_data = {
        "id": patient_id,
        "parent_id": user_id,
        "name": name,
        "dob": dob,
        "sex": sex,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        await db.patients.insert_one(patient_data)
        return jsonify(patient_data), 201
    except Exception as e:
        logger.error(f"Error creating patient: {e}")
        return jsonify({"detail": "Failed to create patient profile."}), 500

@patients_blueprint.route("/patients/<patient_id>", methods=["DELETE"])
async def delete_patient(patient_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401
        
    # Verify patient ownership before deleting
    try:
        patient = await db.patients.find_one({"id": patient_id})
        if not patient:
            return jsonify({"detail": "Patient profile not found."}), 404
            
        if patient.get("parent_id") != user_id:
            return jsonify({"detail": "Permission denied."}), 403

        # Cascade delete all related data
        related_collections = [
            "sdq_submissions",
            "vision_analyses",
            "milestone_logs",
            "growth_logs",
            "sleep_logs",
            "documents",
            "events",
        ]
        for col_name in related_collections:
            try:
                items = await getattr(db, col_name).find({"child_id": patient_id})
                for item in items:
                    await getattr(db, col_name).delete_one({"id": item.get("id")})
            except Exception as e:
                logger.warning(f"Failed to delete {col_name} for child {patient_id}: {e}")

        # Delete the patient record itself
        success = await db.patients.delete_one({"id": patient_id})
        if success:
            return jsonify({"message": "Patient profile and all related data deleted successfully."}), 200
        else:
            return jsonify({"detail": "Failed to delete patient profile."}), 500
    except Exception as e:
        logger.error(f"Error deleting patient {patient_id}: {e}")
        return jsonify({"detail": "Failed to delete patient profile."}), 500

@patients_blueprint.route("/patients/<patient_id>", methods=["PATCH"])
async def update_patient(patient_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401
    body = request.get_json() or {}
    try:
        patient = await db.patients.find_one({"id": patient_id})
        if not patient:
            return jsonify({"detail": "Patient profile not found."}), 404
        if patient.get("parent_id") != user_id:
            return jsonify({"detail": "Permission denied."}), 403
            
        update_data = {}
        if "name" in body:
            name = body["name"].strip()
            if not name:
                return jsonify({"detail": "Child's name cannot be empty."}), 400
            update_data["name"] = name
        if "dob" in body:
            update_data["dob"] = body["dob"]
        if "sex" in body:
            update_data["sex"] = body["sex"]
            
        if not update_data:
            return jsonify(patient), 200
            
        await db.patients.update_one({"id": patient_id}, {"$set": update_data})
        
        updated_patient = await db.patients.find_one({"id": patient_id})
        return jsonify(updated_patient), 200
    except Exception as e:
        logger.error(f"Error updating patient {patient_id}: {e}")
        return jsonify({"detail": "Failed to update patient profile."}), 500
