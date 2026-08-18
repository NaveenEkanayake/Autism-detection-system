"""Child-scoped feature data: SDQ, health, and documents using Firestore."""
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..db import (
    create_document,
    get_document,
    delete_document,
    query_documents,
)
from ..deps import get_current_user

router = APIRouter(tags=["data"])

def _require_child(child_id: str, parent_id: str) -> str:
    row = get_document("children", child_id)
    if row is None or row.get("parent_id") != parent_id:
        raise HTTPException(status_code=404, detail="Child profile not found.")
    return child_id

def _with_patient_id(record: dict, child_id: str) -> dict:
    record["patientId"] = child_id
    return record

# ---------------------------------------------------------------- SDQ
class SdqCreate(BaseModel):
    patientId: str
    responses: Optional[dict] = None
    scores: Optional[dict] = None
    notes: str = ""

@router.get("/sdq/{child_id}")
def list_sdq(child_id: str, user=Depends(get_current_user)):
    _require_child(child_id, user["id"])
    rows = query_documents("sdq", {"child_id": child_id, "parent_id": user["id"]})
    rows.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return [
        _with_patient_id(
            {
                "id": r["id"],
                "responses": r.get("responses"),
                "scores": r.get("scores"),
                "notes": r.get("notes", ""),
                "createdAt": r["created_at"],
            },
            child_id,
        )
        for r in rows
    ]

@router.post("/sdq", status_code=201)
def create_sdq(body: SdqCreate, user=Depends(get_current_user)):
    _require_child(body.patientId, user["id"])
    doc_id = str(uuid.uuid4())
    created = datetime.now(timezone.utc).isoformat()
    
    sdq_data = {
        "child_id": body.patientId,
        "parent_id": user["id"],
        "responses": body.responses,
        "scores": body.scores,
        "notes": body.notes,
        "created_at": created,
    }
    
    cur = create_document("sdq", doc_id, sdq_data)
    return _with_patient_id(
        {
            "id": cur["id"],
            "responses": body.responses,
            "scores": body.scores,
            "notes": body.notes,
            "createdAt": created,
        },
        body.patientId,
    )

# ---------------------------------------------------------------- Milestones
class MilestoneCreate(BaseModel):
    patientId: str
    category: str = "general"
    title: str = Field(min_length=1)
    date: str
    notes: str = ""

@router.get("/health/milestones/{child_id}")
def list_milestones(child_id: str, user=Depends(get_current_user)):
    _require_child(child_id, user["id"])
    rows = query_documents("milestones", {"child_id": child_id, "parent_id": user["id"]})
    rows.sort(key=lambda x: x.get("date", ""), reverse=True)
    return [
        _with_patient_id(
            {
                "id": r["id"],
                "category": r.get("category", "general"),
                "title": r["title"],
                "date": r["date"],
                "notes": r.get("notes", ""),
                "createdAt": r["created_at"],
            },
            child_id,
        )
        for r in rows
    ]

@router.post("/health/milestones", status_code=201)
def create_milestone(body: MilestoneCreate, user=Depends(get_current_user)):
    _require_child(body.patientId, user["id"])
    doc_id = str(uuid.uuid4())
    created = datetime.now(timezone.utc).isoformat()
    
    milestone_data = {
        "child_id": body.patientId,
        "parent_id": user["id"],
        "category": body.category,
        "title": body.title,
        "date": body.date,
        "notes": body.notes,
        "created_at": created,
    }
    
    cur = create_document("milestones", doc_id, milestone_data)
    return _with_patient_id(
        {
            "id": cur["id"],
            "category": body.category,
            "title": body.title,
            "date": body.date,
            "notes": body.notes,
            "createdAt": created,
        },
        body.patientId,
    )

# ---------------------------------------------------------------- Growth
class GrowthCreate(BaseModel):
    patientId: str
    date: str
    height: Optional[float] = None
    weight: Optional[float] = None
    headCircumference: Optional[float] = None

@router.get("/health/growth/{child_id}")
def list_growth(child_id: str, user=Depends(get_current_user)):
    _require_child(child_id, user["id"])
    rows = query_documents("growth", {"child_id": child_id, "parent_id": user["id"]})
    rows.sort(key=lambda x: x.get("date", ""))
    return [
        _with_patient_id(
            {
                "id": r["id"],
                "date": r["date"],
                "height": r.get("height"),
                "weight": r.get("weight"),
                "headCircumference": r.get("head_circumference"),
                "createdAt": r["created_at"],
            },
            child_id,
        )
        for r in rows
    ]

@router.post("/health/growth", status_code=201)
def create_growth(body: GrowthCreate, user=Depends(get_current_user)):
    _require_child(body.patientId, user["id"])
    doc_id = str(uuid.uuid4())
    created = datetime.now(timezone.utc).isoformat()
    
    growth_data = {
        "child_id": body.patientId,
        "parent_id": user["id"],
        "date": body.date,
        "height": body.height,
        "weight": body.weight,
        "head_circumference": body.headCircumference,
        "created_at": created,
    }
    
    cur = create_document("growth", doc_id, growth_data)
    return _with_patient_id(
        {
            "id": cur["id"],
            "date": body.date,
            "height": body.height,
            "weight": body.weight,
            "headCircumference": body.headCircumference,
            "createdAt": created,
        },
        body.patientId,
    )

# ---------------------------------------------------------------- Sleep
class SleepCreate(BaseModel):
    patientId: str
    date: str
    bedtime: Optional[str] = None
    wakeTime: Optional[str] = None
    naps: int = 0
    quality: int = 3

@router.get("/health/sleep/{child_id}")
def list_sleep(child_id: str, user=Depends(get_current_user)):
    _require_child(child_id, user["id"])
    rows = query_documents("sleep", {"child_id": child_id, "parent_id": user["id"]})
    rows.sort(key=lambda x: x.get("date", ""), reverse=True)
    return [
        _with_patient_id(
            {
                "id": r["id"],
                "date": r["date"],
                "bedtime": r.get("bedtime"),
                "wakeTime": r.get("wake_time"),
                "naps": r.get("naps", 0),
                "quality": r.get("quality", 3),
                "createdAt": r["created_at"],
            },
            child_id,
        )
        for r in rows
    ]

@router.post("/health/sleep", status_code=201)
def create_sleep(body: SleepCreate, user=Depends(get_current_user)):
    _require_child(body.patientId, user["id"])
    doc_id = str(uuid.uuid4())
    created = datetime.now(timezone.utc).isoformat()
    
    sleep_data = {
        "child_id": body.patientId,
        "parent_id": user["id"],
        "date": body.date,
        "bedtime": body.bedtime,
        "wake_time": body.wakeTime,
        "naps": body.naps,
        "quality": body.quality,
        "created_at": created,
    }
    
    cur = create_document("sleep", doc_id, sleep_data)
    return _with_patient_id(
        {
            "id": cur["id"],
            "date": body.date,
            "bedtime": body.bedtime,
            "wakeTime": body.wakeTime,
            "naps": body.naps,
            "quality": body.quality,
            "createdAt": created,
        },
        body.patientId,
    )

# ---------------------------------------------------------------- Documents
class DocumentCreate(BaseModel):
    patientId: str
    parentUid: Optional[str] = None
    name: str = Field(min_length=1)
    type: str = "file"
    fileUrl: str = ""
    size: int = 0

@router.get("/documents/{child_id}")
def list_documents(child_id: str, user=Depends(get_current_user)):
    _require_child(child_id, user["id"])
    rows = query_documents("documents", {"child_id": child_id, "parent_id": user["id"]})
    rows.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return [
        _with_patient_id(
            {
                "id": r["id"],
                "name": r["name"],
                "type": r.get("type", "file"),
                "fileUrl": r.get("file_url", ""),
                "size": r.get("size", 0),
                "createdAt": r["created_at"],
            },
            child_id,
        )
        for r in rows
    ]

@router.post("/documents", status_code=201)
def create_new_document(body: DocumentCreate, user=Depends(get_current_user)):
    _require_child(body.patientId, user["id"])
    doc_id = str(uuid.uuid4())
    created = datetime.now(timezone.utc).isoformat()
    
    doc_data = {
        "child_id": body.patientId,
        "parent_id": user["id"],
        "name": body.name,
        "type": body.type,
        "file_url": body.fileUrl,
        "size": body.size,
        "created_at": created,
    }
    
    cur = create_document("documents", doc_id, doc_data)
    return _with_patient_id(
        {
            "id": cur["id"],
            "name": body.name,
            "type": body.type,
            "fileUrl": body.fileUrl,
            "size": body.size,
            "createdAt": created,
        },
        body.patientId,
    )

@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str, user=Depends(get_current_user)):
    row = get_document("documents", doc_id)
    if row is None or row.get("parent_id") != user["id"]:
        raise HTTPException(status_code=404, detail="Document not found.")
    delete_document("documents", doc_id)
    return {"message": "Document deleted successfully."}
