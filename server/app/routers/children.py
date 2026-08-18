"""Child profile CRUD routes scoped to the logged-in parent using Firestore."""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ..db import (
    create_document,
    get_document,
    update_document,
    delete_document,
    query_documents,
)
from ..deps import get_current_user

router = APIRouter(prefix="/children", tags=["children"])

CASCADE_TABLES = ["sdq", "milestones", "growth", "sleep", "documents", "vision_analyses"]

class ChildCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    dob: str
    sex: str = Field(default="male", pattern="^(male|female|other)$")

class ChildUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    dob: str
    sex: str = Field(pattern="^(male|female|other)$")

def _child_dict(d) -> dict:
    return {
        "id": d["id"],
        "name": d["name"],
        "dob": d["dob"],
        "sex": d.get("sex", "male"),
        "createdAt": d.get("created_at") or d.get("createdAt"),
        "updatedAt": d.get("updated_at") or d.get("updatedAt"),
    }

@router.get("")
def list_children(user=Depends(get_current_user)):
    rows = query_documents("children", {"parent_id": user["id"]})
    # Sort children by created_at descending (Firestore runQuery returns unsorted list usually)
    rows.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return [_child_dict(r) for r in rows]

@router.post("", status_code=status.HTTP_201_CREATED)
def create_child(body: ChildCreate, user=Depends(get_current_user)):
    child_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    child_data = {
        "parent_id": user["id"],
        "name": body.name.strip(),
        "dob": body.dob,
        "sex": body.sex,
        "created_at": now,
        "updated_at": now,
    }
    
    row = create_document("children", child_id, child_data)
    return _child_dict(row)

@router.put("/{child_id}")
def update_child(child_id: str, body: ChildUpdate, user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    row = get_document("children", child_id)
    
    if row is None or row.get("parent_id") != user["id"]:
        raise HTTPException(status_code=404, detail="Child profile not found.")
        
    update_data = {
        "name": body.name.strip(),
        "dob": body.dob,
        "sex": body.sex,
        "updated_at": now,
    }
    
    updated_row = update_document("children", child_id, update_data)
    return _child_dict(updated_row)

@router.delete("/{child_id}")
def delete_child(child_id: str, user=Depends(get_current_user)):
    row = get_document("children", child_id)
    if row is None or row.get("parent_id") != user["id"]:
        raise HTTPException(status_code=404, detail="Child profile not found.")
        
    for table in CASCADE_TABLES:
        records = query_documents(table, {"child_id": child_id})
        for r in records:
            delete_document(table, r["id"])
            
    delete_document("children", child_id)
    return {"message": "Child profile deleted successfully."}
