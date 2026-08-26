"""Events CRUD blueprint with Firestore persistence and instant email notifications."""
import logging
import threading
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from ..db import db
from ..security import decode_access_token
from ..email_service import send_event_reminder_email

logger = logging.getLogger("app.events")
events_blueprint = Blueprint("events", __name__)


def get_current_user_id() -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)
    return payload.get("sub") if payload else None


def _get_user_email_sync(user_id: str) -> str:
    """Synchronously look up user email from Firestore using httpx."""
    import httpx
    from ..config import settings
    print(f"[Events] Looking up email for user_id={user_id}")
    try:
        url = f"https://firestore.googleapis.com/v1/projects/{settings.FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery?key={settings.FIREBASE_API_KEY}"
        payload = {
            "structuredQuery": {
                "from": [{"collectionId": "users"}],
                "where": {
                    "fieldFilter": {
                        "field": {"fieldPath": "id"},
                        "op": "EQUAL",
                        "value": {"stringValue": user_id}
                    }
                },
                "limit": 1
            }
        }
        with httpx.Client(timeout=10) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                results = resp.json()
                for r in results:
                    if "document" in r:
                        fields = r["document"].get("fields", {})
                        email_val = fields.get("email", {})
                        found_email = email_val.get("stringValue", "")
                        print(f"[Events] Found email: {found_email}")
                        return found_email
            else:
                print(f"[Events] Firestore query failed with status {resp.status_code}")
    except Exception as e:
        print(f"[Events] Failed to look up user email: {type(e).__name__}: {e}")
    return ""


def _send_event_email(event_doc: dict):
    """Send event notification email. Runs in a background thread."""
    print(f"[Events] Sending email for '{event_doc.get('title')}'...")
    try:
        user_id = event_doc.get("user_id")
        to_email = _get_user_email_sync(user_id)
        if not to_email:
            print(f"[Events] WARNING: User {user_id} has no email — cannot send")
            return

        success = send_event_reminder_email(
            to_email=to_email,
            event_title=event_doc.get("title", "Untitled Event"),
            event_start=f"{event_doc.get('startDate', '')} {event_doc.get('startTime', '')}",
            event_location=event_doc.get("location", ""),
            event_description=event_doc.get("description", ""),
        )
        if success:
            # Mark as sent in Firestore
            try:
                import httpx
                from ..config import settings
                event_id = event_doc.get("id")
                url = f"https://firestore.googleapis.com/v1/projects/{settings.FIREBASE_PROJECT_ID}/databases/(default)/documents/events/{event_id}?updateMask.fieldPaths=reminder_sent&key={settings.FIREBASE_API_KEY}"
                payload = {"fields": {"reminder_sent": {"booleanValue": True}}}
                with httpx.Client(timeout=10) as client:
                    client.patch(url, json=payload)
            except Exception as e:
                print(f"[Events] Failed to mark reminder_sent: {e}")
            print(f"[Events] Email sent to {to_email} for '{event_doc.get('title')}'")
        else:
            print(f"[Events] Failed to send email to {to_email}")

    except Exception as e:
        print(f"[Events] Failed to send email: {type(e).__name__}: {e}")


# ─── CRUD Routes ──────────────────────────────────────────────────

@events_blueprint.route("/events", methods=["GET"])
async def list_events():
    """List all events for the authenticated user."""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    try:
        events = await db.events.find({"user_id": user_id})
        events.sort(key=lambda e: e.get("startDate", "") + " " + e.get("startTime", "00:00"))
        return jsonify(events), 200
    except Exception as e:
        logger.error(f"Error fetching events: {e}")
        return jsonify({"detail": "Failed to fetch events."}), 500


@events_blueprint.route("/events", methods=["POST"])
async def create_event():
    """Create a new event and send email notification immediately."""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    body = request.get_json() or {}
    title = (body.get("title") or "").strip()
    if not title:
        return jsonify({"detail": "Event title is required."}), 400

    start_date = body.get("startDate") or body.get("start_date", "")
    start_time = body.get("startTime") or body.get("start_time", "")
    if not start_date:
        return jsonify({"detail": "Start date is required."}), 400

    event_id = f"event-{int(datetime.now().timestamp())}-{title[:8].replace(' ', '_').lower()}"
    event_data = {
        "id": event_id,
        "user_id": user_id,
        "title": title,
        "category": body.get("category", "appointments"),
        "startDate": start_date,
        "startTime": start_time,
        "endDate": body.get("endDate") or body.get("end_date") or start_date,
        "endTime": body.get("endTime") or body.get("end_time") or start_time,
        "location": body.get("location", ""),
        "description": body.get("description", ""),
        "reminder_sent": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        await db.events.insert_one(event_data)
        # Send email immediately in background thread
        threading.Thread(target=_send_event_email, args=(event_data,), daemon=True).start()
        print(f"[Events] Created event '{title}' — sending email now")
        return jsonify(event_data), 201
    except Exception as e:
        logger.error(f"Error creating event: {e}")
        return jsonify({"detail": "Failed to create event."}), 500


@events_blueprint.route("/events/<event_id>", methods=["PATCH"])
async def update_event(event_id):
    """Update an event and send email notification immediately."""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    event = await db.events.find_one({"id": event_id})
    if not event:
        return jsonify({"detail": "Event not found."}), 404
    if event.get("user_id") != user_id:
        return jsonify({"detail": "Permission denied."}), 403

    body = request.get_json() or {}
    update_fields = {}
    for key in ["title", "category", "startDate", "startTime", "endDate", "endTime", "location", "description"]:
        if key in body:
            update_fields[key] = body[key]

    if not update_fields:
        return jsonify(event), 200

    update_fields["reminder_sent"] = False

    try:
        await db.events.update_one({"id": event_id}, {"$set": update_fields})
        updated_event = {**event, **update_fields, "id": event_id}
        # Send email immediately in background thread
        threading.Thread(target=_send_event_email, args=(updated_event,), daemon=True).start()
        return jsonify(updated_event), 200
    except Exception as e:
        logger.error(f"Error updating event: {e}")
        return jsonify({"detail": "Failed to update event."}), 500


@events_blueprint.route("/events/<event_id>", methods=["DELETE"])
async def delete_event(event_id):
    """Delete an event."""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    event = await db.events.find_one({"id": event_id})
    if not event:
        return jsonify({"detail": "Event not found."}), 404
    if event.get("user_id") != user_id:
        return jsonify({"detail": "Permission denied."}), 403

    try:
        await db.events.delete_one({"id": event_id})
        return jsonify({"success": True, "message": "Event deleted successfully."}), 200
    except Exception as e:
        logger.error(f"Error deleting event: {e}")
        return jsonify({"detail": "Failed to delete event."}), 500
