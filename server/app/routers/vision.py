"""Vision analysis routes using Roboflow and Firestore."""
import asyncio
import uuid
from datetime import datetime, timezone
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from ..config import settings
from ..db import (
    create_document,
    get_document,
    query_documents,
)
from ..deps import get_current_user

router = APIRouter(prefix="/vision", tags=["vision"])

RISK_WORDS = ("autism", "asd", "autistic", "positive")
SAFE_WORDS = ("non", "typical", "normal", "control", "negative", "healthy")

def _class_is_risk(label: str) -> bool:
    low = label.lower()
    if any(w in low for w in SAFE_WORDS):
        return False
    return any(w in low for w in RISK_WORDS)

def compute_risk(predictions: List[dict]) -> dict:
    """Turn raw Roboflow predictions into a risk score, level and summary."""
    detections = []
    risk_confs: List[float] = []
    safe_confs: List[float] = []
    risk_indicators: List[str] = []

    for pred in predictions:
        label = str(pred.get("class", "")).strip() or "Object"
        confidence = float(pred.get("confidence", 0) or 0)
        detections.append({"label": label, "confidence": round(confidence, 4)})
        if _class_is_risk(label):
            risk_confs.append(confidence)
            risk_indicators.append(f"{label} pattern detected at {confidence * 100:.0f}% confidence")
        else:
            safe_confs.append(confidence)

    if not predictions:
        score = 0.0
        summary = "No autism-related patterns were detected in the uploaded media."
    else:
        risk_conf = max(risk_confs, default=0.0)
        safe_conf = max(safe_confs, default=0.0)
        if risk_conf >= safe_conf and risk_conf > 0:
            score = round(risk_conf * 100, 1)
        else:
            score = round((1 - safe_conf) * 100, 1)
        score = max(0.0, min(100.0, score))
        if risk_indicators:
            summary = (
                f"Analysis found autism-related indicators ({', '.join(risk_indicators[:2])}). "
                "This result is a screening aid, not a medical diagnosis."
            )
        elif score <= 5:
            summary = "Analysis found no meaningful autism-related indicators in the uploaded media."
        else:
            summary = (
                "Analysis did not find clear autism-related indicators, but a small residual "
                "risk remains. This result is a screening aid, not a medical diagnosis."
            )

    if score < 40:
        level = "low"
    elif score < 70:
        level = "moderate"
    else:
        level = "high"

    return {
        "detections": detections,
        "riskIndicators": risk_indicators,
        "riskScore": score,
        "riskLevel": level,
        "summary": summary,
    }

async def run_roboflow(image_bytes: bytes, filename: str) -> dict:
    url = f"{settings.ROBOFLOW_URL}/{settings.ROBOFLOW_MODEL_ID}"
    params = {"api_key": settings.ROBOFLOW_API_KEY}
    content_type = "image/png" if filename.lower().endswith(".png") else "image/jpeg"
    try:
        async with httpx.AsyncClient(timeout=90) as client:
            resp = await client.post(
                url,
                params=params,
                files={"file": (filename, image_bytes, content_type)},
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Detection service unavailable: {exc}")
    if resp.status_code != 200:
        detail = resp.text[:300]
        raise HTTPException(status_code=502, detail=f"Detection service error ({resp.status_code}): {detail}")
    data = resp.json()
    return data.get("predictions") or []

def _analysis_dict(row) -> dict:
    results = row.get("results") or {}
    return {
        "id": row["id"],
        "childId": row["child_id"],
        "patientId": row["child_id"],
        "imageUrl": row.get("image_url", ""),
        "status": row.get("status", "completed"),
        "riskScore": row.get("risk_score", 0),
        "riskLevel": row.get("risk_level", "low"),
        "detections": results.get("detections", []),
        "riskIndicators": results.get("riskIndicators", []),
        "summary": results.get("summary", ""),
        "createdAt": row["created_at"],
    }

@router.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    childId: Optional[str] = Form(None),
    user=Depends(get_current_user),
):
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="No file content received.")

    predictions = await run_roboflow(image_bytes, file.filename or "upload.png")
    risk = compute_risk(predictions)
    print("YOLOv8 Raw Predictions:", predictions)
    print("YOLOv8 Computed Risk Scores:", risk)

    created = datetime.now(timezone.utc).isoformat()
    analysis_id = None
    if childId is not None:
        owned = get_document("children", childId)
        if owned is None or owned.get("parent_id") != user["id"]:
            raise HTTPException(status_code=404, detail="Child profile not found.")
            
        analysis_id = str(uuid.uuid4())
        analysis_data = {
            "child_id": childId,
            "parent_id": user["id"],
            "image_url": "",
            "status": "completed",
            "risk_score": risk["riskScore"],
            "risk_level": risk["riskLevel"],
            "results": risk,
            "created_at": created,
        }
        create_document("vision_analyses", analysis_id, analysis_data)

    response = {
        "id": analysis_id,
        "childId": childId,
        "status": "completed",
        "createdAt": created,
        **risk,
    }
    return response

@router.get("/{child_id}")
def list_analyses(child_id: str, user=Depends(get_current_user)):
    owned = get_document("children", child_id)
    if owned is None or owned.get("parent_id") != user["id"]:
        raise HTTPException(status_code=404, detail="Child profile not found.")
        
    rows = query_documents("vision_analyses", {"child_id": child_id, "parent_id": user["id"]})
    rows.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return [_analysis_dict(r) for r in rows]
