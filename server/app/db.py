"""Firebase Firestore database layer. Uses httpx for REST communication with master token."""
import json
from typing import List, Dict, Any, Optional
import httpx
from fastapi import HTTPException
from .config import settings

PROJECT_ID = settings.FIREBASE_PROJECT_ID
BASE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"
API_KEY = settings.FIREBASE_API_KEY

# Master account credentials for backend service database access
MASTER_EMAIL = "backend_service_admin@auratrack.com"
MASTER_PASSWORD = "MasterSecurePassword123"

# In-memory token cache
_master_token: Optional[str] = None

# In-memory OTP storage for forgot password functionality
OTP_STORE: Dict[str, List[Dict[str, Any]]] = {}

def get_master_token() -> str:
    global _master_token
    if _master_token:
        return _master_token
        
    auth_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
    payload = {
        "email": MASTER_EMAIL,
        "password": MASTER_PASSWORD,
        "returnSecureToken": True
    }
    
    try:
        resp = httpx.post(auth_url, json=payload, timeout=15)
        if resp.status_code == 200:
            _master_token = resp.json().get("idToken")
            return _master_token
        else:
            # If sign-in fails, register the master account
            signup_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={API_KEY}"
            resp_up = httpx.post(signup_url, json=payload, timeout=15)
            if resp_up.status_code == 200:
                _master_token = resp_up.json().get("idToken")
                return _master_token
            else:
                raise HTTPException(
                    status_code=502, 
                    detail=f"Database initialization failed: {resp_up.text}"
                )
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502, 
            detail=f"Database connection error: {str(e)}"
        )

def to_firestore_val(v: Any) -> Dict[str, Any]:
    if v is None:
        return {"nullValue": None}
    elif isinstance(v, bool):
        return {"booleanValue": v}
    elif isinstance(v, int):
        return {"integerValue": str(v)}
    elif isinstance(v, float):
        return {"doubleValue": v}
    elif isinstance(v, str):
        return {"stringValue": v}
    elif isinstance(v, dict):
        return {"mapValue": {"fields": {k: to_firestore_val(val) for k, val in v.items()}}}
    elif isinstance(v, list):
        return {"arrayValue": {"values": [to_firestore_val(val) for val in v]}}
    else:
        return {"stringValue": str(v)}

def from_firestore_val(fv: Dict[str, Any]) -> Any:
    if not isinstance(fv, dict):
        return fv
    if "nullValue" in fv:
        return None
    elif "booleanValue" in fv:
        return fv["booleanValue"]
    elif "integerValue" in fv:
        return int(fv["integerValue"])
    elif "doubleValue" in fv:
        return float(fv["doubleValue"])
    elif "stringValue" in fv:
        return fv["stringValue"]
    elif "mapValue" in fv:
        fields = fv["mapValue"].get("fields", {})
        return {k: from_firestore_val(val) for k, val in fields.items()}
    elif "arrayValue" in fv:
        values = fv["arrayValue"].get("values", [])
        return [from_firestore_val(val) for val in values]
    return fv

def from_firestore_doc(doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not doc or "fields" not in doc:
        return None
    name = doc.get("name", "")
    doc_id = name.split("/")[-1]
    fields = doc.get("fields", {})
    data = {k: from_firestore_val(v) for k, v in fields.items()}
    data["id"] = doc_id
    return data

def get_document(collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
    token = get_master_token()
    url = f"{BASE_URL}/{collection}/{doc_id}"
    headers = {"Authorization": f"Bearer {token}"}
    try:
        resp = httpx.get(url, headers=headers, timeout=15)
        if resp.status_code == 200:
            return from_firestore_doc(resp.json())
        elif resp.status_code == 404:
            return None
        else:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"Database error: {resp.text}"
            )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Database connection failed: {str(e)}")

def create_document(collection: str, doc_id: Optional[str], data: Dict[str, Any]) -> Dict[str, Any]:
    token = get_master_token()
    headers = {"Authorization": f"Bearer {token}"}
    if doc_id:
        url = f"{BASE_URL}/{collection}?documentId={doc_id}"
    else:
        url = f"{BASE_URL}/{collection}"
    
    payload = {"fields": {k: to_firestore_val(v) for k, v in data.items()}}
    try:
        resp = httpx.post(url, json=payload, headers=headers, timeout=15)
        if resp.status_code in (200, 201):
            return from_firestore_doc(resp.json())
        else:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"Database error: {resp.text}"
            )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Database connection failed: {str(e)}")

def update_document(collection: str, doc_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    token = get_master_token()
    url = f"{BASE_URL}/{collection}/{doc_id}"
    headers = {"Authorization": f"Bearer {token}"}
    field_paths = list(data.keys())
    params = [("updateMask.fieldPaths", path) for path in field_paths]
    payload = {"fields": {k: to_firestore_val(v) for k, v in data.items()}}
    try:
        resp = httpx.patch(url, params=params, json=payload, headers=headers, timeout=15)
        if resp.status_code == 200:
            return from_firestore_doc(resp.json())
        else:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"Database error: {resp.text}"
            )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Database connection failed: {str(e)}")

def delete_document(collection: str, doc_id: str) -> bool:
    token = get_master_token()
    url = f"{BASE_URL}/{collection}/{doc_id}"
    headers = {"Authorization": f"Bearer {token}"}
    try:
        resp = httpx.delete(url, headers=headers, timeout=15)
        if resp.status_code in (200, 204):
            return True
        elif resp.status_code == 404:
            return False
        else:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"Database error: {resp.text}"
            )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Database connection failed: {str(e)}")

def query_documents(collection: str, field_filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    token = get_master_token()
    url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents:runQuery"
    headers = {"Authorization": f"Bearer {token}"}
    
    filters = []
    for k, v in field_filters.items():
        filters.append({
            "fieldFilter": {
                "field": {"fieldPath": k},
                "op": "EQUAL",
                "value": to_firestore_val(v)
            }
        })
    
    where_clause = {}
    if len(filters) == 1:
        where_clause = filters[0]
    elif len(filters) > 1:
        where_clause = {
            "compositeFilter": {
                "op": "AND",
                "filters": filters
            }
        }
        
    query = {
        "structuredQuery": {
            "from": [{"collectionId": collection}]
        }
    }
    if where_clause:
        query["structuredQuery"]["where"] = where_clause
        
    try:
        resp = httpx.post(url, json=query, headers=headers, timeout=15)
        if resp.status_code == 200:
            results = []
            for item in resp.json():
                if "document" in item:
                    doc = from_firestore_doc(item["document"])
                    if doc:
                        results.append(doc)
            return results
        else:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"Database query error: {resp.text}"
            )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Database connection failed: {str(e)}")

def init_db():
    pass
