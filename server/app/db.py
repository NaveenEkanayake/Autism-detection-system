import logging
import asyncio
import uuid
import httpx
from .config import settings

logger = logging.getLogger("app.db")

# Helper functions to convert standard Python dictionaries to Firestore REST JSON format and vice-versa
def to_firestore_value(val):
    if val is None:
        return {"nullValue": None}
    if isinstance(val, bool):
        return {"booleanValue": val}
    if isinstance(val, (int, float)):
        if isinstance(val, bool): # Python bool is subclass of int, check it first just in case
            return {"booleanValue": val}
        if isinstance(val, int):
            return {"integerValue": str(val)}
        return {"doubleValue": val}
    if isinstance(val, str):
        return {"stringValue": val}
    if isinstance(val, list):
        return {"arrayValue": {"values": [to_firestore_value(v) for v in val]}}
    if isinstance(val, dict):
        return {"mapValue": {"fields": {k: to_firestore_value(v) for k, v in val.items()}}}
    return {"stringValue": str(val)}

def from_firestore_value(f_val):
    if not isinstance(f_val, dict):
        return f_val
    for k, v in f_val.items():
        if k == "nullValue":
            return None
        if k == "booleanValue":
            return v
        if k == "integerValue":
            return int(v)
        if k == "doubleValue":
            return float(v)
        if k == "stringValue":
            return v
        if k == "arrayValue":
            values = v.get("values", [])
            return [from_firestore_value(x) for x in values]
        if k == "mapValue":
            fields = v.get("fields", {})
            return {fk: from_firestore_value(fv) for fk, fv in fields.items()}
    return f_val

def to_firestore_fields(data: dict) -> dict:
    return {"fields": {k: to_firestore_value(v) for k, v in data.items()}}

def from_firestore_doc(doc: dict) -> dict:
    if "fields" not in doc:
        return {}
    res = {k: from_firestore_value(v) for k, v in doc["fields"].items()}
    name = doc.get("name", "")
    if name:
        res["_id"] = name.split("/")[-1]
    return res

async def query_collection(collection_id: str, field_path: str, value, limit: int = None) -> list:
    url = f"https://firestore.googleapis.com/v1/projects/{settings.FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery?key={settings.FIREBASE_API_KEY}"
    f_val = to_firestore_value(value)
    
    structured_query = {
        "from": [{"collectionId": collection_id}],
        "where": {
            "fieldFilter": {
                "field": {"fieldPath": field_path},
                "op": "EQUAL",
                "value": f_val
            }
        }
    }
    if limit is not None:
        structured_query["limit"] = limit

    payload = {"structuredQuery": structured_query}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                results = resp.json()
                docs = []
                for r in results:
                    if "document" in r:
                        docs.append(from_firestore_doc(r["document"]))
                return docs
            else:
                logger.error(f"Firestore query failed ({resp.status_code}): {resp.text}")
                raise Exception(f"Firestore query failed ({resp.status_code}): {resp.text}")
    except Exception as e:
        logger.error(f"Firestore query connection failed: {e}")
        raise

async def insert_document(collection_id: str, doc_id: str, data: dict) -> bool:
    url = f"https://firestore.googleapis.com/v1/projects/{settings.FIREBASE_PROJECT_ID}/databases/(default)/documents/{collection_id}?documentId={doc_id}&key={settings.FIREBASE_API_KEY}"
    payload = to_firestore_fields(data)
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code in (200, 201):
                return True
            else:
                logger.error(f"Firestore insert failed ({resp.status_code}): {resp.text}")
                raise Exception(f"Firestore insert failed ({resp.status_code}): {resp.text}")
    except Exception as e:
        logger.error(f"Firestore insert connection failed: {e}")
        raise

async def update_document(collection_id: str, doc_id: str, data: dict) -> bool:
    # Patch only specified fields using updateMask
    field_paths = "&".join([f"updateMask.fieldPaths={k}" for k in data.keys()])
    url = f"https://firestore.googleapis.com/v1/projects/{settings.FIREBASE_PROJECT_ID}/databases/(default)/documents/{collection_id}/{doc_id}?{field_paths}&key={settings.FIREBASE_API_KEY}"
    payload = to_firestore_fields(data)
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.patch(url, json=payload)
            if resp.status_code == 200:
                return True
            else:
                logger.error(f"Firestore update failed ({resp.status_code}): {resp.text}")
                raise Exception(f"Firestore update failed ({resp.status_code}): {resp.text}")
    except Exception as e:
        logger.error(f"Firestore update connection failed: {e}")
        raise

# ----------------------------------------------------
# 1.3 Firestore Collection Proxy (attribute-based access)
# ----------------------------------------------------
class FirestoreCollectionProxy:
    """Emulates a collection interface (find/insert/update/delete) backed by Firestore REST API."""
    def __init__(self, collection_id: str):
        self.collection_id = collection_id

    async def find_one(self, filter_dict: dict, *args, **kwargs):
        if not filter_dict:
            return None
        docs = await self.find(filter_dict)
        if not docs:
            return None

        sort_args = kwargs.get("sort")
        if sort_args and isinstance(sort_args, list):
            for field, order in reversed(sort_args):
                reverse = True if order == -1 else False
                docs.sort(key=lambda x: x.get(field, ""), reverse=reverse)

        return docs[0]

    async def find(self, filter_dict: dict = None, *args, **kwargs) -> list:
        if not filter_dict:
            return []
        key = list(filter_dict.keys())[0]
        val = filter_dict[key]
        docs = await query_collection(self.collection_id, key, val)

        sort_args = kwargs.get("sort")
        if sort_args and isinstance(sort_args, list):
            for field, order in reversed(sort_args):
                reverse = True if order == -1 else False
                docs.sort(key=lambda x: x.get(field, ""), reverse=reverse)

        return docs

    async def insert_one(self, data: dict):
        doc_id = data.get("id") or data.get("image_hash") or str(uuid.uuid4())
        if "id" not in data:
            data = {**data, "id": doc_id}
        success = await insert_document(self.collection_id, doc_id, data)
        # Return a result object so callers can do result.inserted_id
        return type("InsertOneResult", (), {
            "inserted_id": doc_id,
            "acknowledged": success,
        })()

    async def update_one(self, filter_dict: dict, update_dict: dict):
        doc_id = filter_dict.get("id") or filter_dict.get("_id") or filter_dict.get("image_hash")
        if not doc_id:
            doc = await self.find_one(filter_dict)
            if doc:
                doc_id = doc.get("id") or doc.get("_id") or doc.get("image_hash")
        if not doc_id:
            logger.error(f"Could not resolve document ID for Firestore update: {filter_dict}")
            return False
        set_data = update_dict.get("$set", update_dict)
        return await update_document(self.collection_id, doc_id, set_data)

    async def delete_one(self, filter_dict: dict) -> bool:
        doc_id = filter_dict.get("id") or filter_dict.get("_id") or filter_dict.get("image_hash")
        if not doc_id:
            doc = await self.find_one(filter_dict)
            if doc:
                doc_id = doc.get("id") or doc.get("_id") or doc.get("image_hash")
        if not doc_id:
            logger.error(f"Could not resolve document ID for Firestore delete: {filter_dict}")
            raise Exception(f"Could not resolve document ID for Firestore delete: {filter_dict}")
        url = f"https://firestore.googleapis.com/v1/projects/{settings.FIREBASE_PROJECT_ID}/databases/(default)/documents/{self.collection_id}/{doc_id}?key={settings.FIREBASE_API_KEY}"
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.delete(url)
                if resp.status_code == 200:
                    return True
                else:
                    logger.error(f"Firestore delete failed ({resp.status_code}): {resp.text}")
                    raise Exception(f"Firestore delete failed ({resp.status_code}): {resp.text}")
        except Exception as e:
            logger.error(f"Firestore delete connection failed: {e}")
            raise


class FirestoreDBProxy:
    """
    Attribute-based access to collections, e.g. db.patients, db.sdq_submissions.
    NOTE: unlike the old code, do NOT use db.client["dbname"]["collection"] —
    Firestore has no nested-database concept. Use db.<collection_name> directly.
    """
    def __getattr__(self, name: str) -> FirestoreCollectionProxy:
        # Any attribute access (db.patients, db.sdq_submissions, db.whatever)
        # resolves to a proxy for that Firestore collection.
        return FirestoreCollectionProxy(name)


db = FirestoreDBProxy()


async def ping_db() -> bool:
    """Verifies connection to Firebase Firestore REST API."""
    url = f"https://firestore.googleapis.com/v1/projects/{settings.FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery?key={settings.FIREBASE_API_KEY}"
    payload = {"structuredQuery": {"from": [{"collectionId": "users"}], "limit": 1}}
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.post(url, json=payload)
            return resp.status_code == 200
    except Exception as e:
        logger.error(f"Firestore connection ping failed: {e}")
        return False


