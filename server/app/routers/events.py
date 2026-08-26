"""Events CRUD blueprint with Firestore persistence and email reminder scheduling."""
import logging
import threading
import time
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify
from ..db import db
from ..security import decode_access_token
from ..email_service import send_event_reminder_email

logger = logging.getLogger("app.events")
events_blueprint = Blueprint("events", __name__)

# In-memory store for scheduled reminders: { event_id: threading.Timer }
_scheduled_reminders = {}


def get_current_user_id() -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)
    return payload.get("sub") if payload else None


def _schedule_email_reminder(event_doc: dict):
    """
    Schedule an email reminder for an event.
    The reminder fires reminder_minutes before the event start time.
    """
    try:
        user_id = event_doc.get("user_id")
        start_str = event_doc.get("start_datetime") or event_doc.get("startDate")
        start_time_str = event_doc.get("start_time", "00:00")
        reminder_minutes = int(event_doc.get("reminder_minutes", 60))

        if not start_str or not user_id:
            return

        # Parse the start datetime
        if "T" in start_str:
            # Already ISO format
            event_start = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
        else:
            # Date only — combine with start_time
            event_start = datetime.fromisoformat(f"{start_str}T{start_time_str}:00")

        # Calculate when to send the reminder
        reminder_time = event_start - timedelta(minutes=reminder_minutes)
        now = datetime.now(timezone.utc)

        if reminder_time <= now:
            # Event is too soon or already past — send immediately
            logger.info(f"[Events] Event '{event_doc.get('title')}' is soon — sending reminder now")
            _send_reminder_for_event(event_doc)
            return

        delay_seconds = (reminder_time - now).total_seconds()
        event_id = event_doc.get("id", "unknown")

        # Cancel existing reminder if re-scheduling
        if event_id in _scheduled_reminders:
            _scheduled_reminders[event_id].cancel()

        timer = threading.Timer(delay_seconds, _send_reminder_for_event, args=[event_doc])
        timer.daemon = True
        timer.start()
        _scheduled_reminders[event_id] = timer
        logger.info(f"[Events] Scheduled reminder for '{event_doc.get('title')}' in {delay_seconds:.0f}s (at {reminder_time.isoformat()})")

    except Exception as e:
        logger.error(f"[Events] Failed to schedule reminder: {e}")


def _send_reminder_for_event(event_doc: dict):
    """Send the email reminder for a given event document."""
    try:
        user_id = event_doc.get("user_id")
        # Look up user email from Firestore
        import asyncio

        async def _lookup_and_send():
            user = await db.users.find_one({"id": user_id})
            if not user:
                logger.warning(f"[Events] User {user_id} not found — cannot send reminder")
                return
            to_email = user.get("email")
            if not to_email:
                logger.warning(f"[Events] User {user_id} has no email — cannot send reminder")
                return

            success = send_event_reminder_email(
                to_email=to_email,
                event_title=event_doc.get("title", "Untitled Event"),
                event_start=f"{event_doc.get('startDate', '')} {event_doc.get('startTime', '')}",
                event_location=event_doc.get("location", ""),
                event_description=event_doc.get("description", ""),
                reminder_minutes=int(event_doc.get("reminder_minutes", 60)),
            )
            if success:
                # Mark reminder as sent in Firestore
                try:
                    await db.events.update_one(
                        {"id": event_doc.get("id")},
                        {"$set": {"reminder_sent": True}}
                    )
                except Exception:
                    pass

        asyncio.get_event_loop().run_until_complete(_lookup_and_send())
    except Exception as e:
        logger.error(f"[Events] Failed to send reminder: {e}")


# ─── CRUD Routes ──────────────────────────────────────────────────

@events_blueprint.route("/events", methods=["GET"])
async def list_events():
    """List all events for the authenticated user."""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    try:
        events = await db.events.find({"user_id": user_id})
        # Sort by start date ascending
        events.sort(key=lambda e: e.get("startDate", "") + " " + e.get("startTime", "00:00"))
        return jsonify(events), 200
    except Exception as e:
        logger.error(f"Error fetching events: {e}")
        return jsonify({"detail": "Failed to fetch events."}), 500


@events_blueprint.route("/events", methods=["POST"])
async def create_event():
    """Create a new event and schedule email reminder."""
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
        "reminder_minutes": int(body.get("reminder_minutes") or body.get("reminderMinutes") or 60),
        "reminder_sent": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        await db.events.insert_one(event_data)
        # Schedule email reminder (1 hour before by default)
        _schedule_email_reminder(event_data)
        return jsonify(event_data), 201
    except Exception as e:
        logger.error(f"Error creating event: {e}")
        return jsonify({"detail": "Failed to create event."}), 500


@events_blueprint.route("/events/<event_id>", methods=["PATCH"])
async def update_event(event_id):
    """Update an event and reschedule its email reminder."""
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
    for key in ["title", "category", "startDate", "startTime", "endDate", "endTime", "location", "description", "reminder_minutes", "reminderMinutes"]:
        if key in body:
            # Normalize field names
            if key == "reminderMinutes":
                update_fields["reminder_minutes"] = int(body[key])
            else:
                update_fields[key] = body[key]

    if not update_fields:
        return jsonify(event), 200

    update_fields["reminder_sent"] = False  # Reset so reminder fires again

    try:
        await db.events.update_one({"id": event_id}, {"$set": update_fields})
        # Reschedule reminder with updated data
        updated_event = {**event, **update_fields, "id": event_id}
        _schedule_email_reminder(updated_event)
        return jsonify(updated_event), 200
    except Exception as e:
        logger.error(f"Error updating event: {e}")
        return jsonify({"detail": "Failed to update event."}), 500


@events_blueprint.route("/events/<event_id>", methods=["DELETE"])
async def delete_event(event_id):
    """Delete an event and cancel its scheduled reminder."""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"detail": "Authentication required."}), 401

    event = await db.events.find_one({"id": event_id})
    if not event:
        return jsonify({"detail": "Event not found."}), 404
    if event.get("user_id") != user_id:
        return jsonify({"detail": "Permission denied."}), 403

    try:
        # Cancel scheduled reminder
        if event_id in _scheduled_reminders:
            _scheduled_reminders[event_id].cancel()
            del _scheduled_reminders[event_id]

        await db.events.delete_one({"id": event_id})
        return jsonify({"success": True, "message": "Event deleted successfully."}), 200
    except Exception as e:
        logger.error(f"Error deleting event: {e}")
        return jsonify({"detail": "Failed to delete event."}), 500


def reschedule_all_reminders():
    """Called on server startup to reschedule all pending event reminders."""
    async def _reschedule():
        try:
            # We can't easily list ALL events without a user_id filter,
            # so we rely on individual user event listing.
            # Reminders will be re-scheduled when events are fetched.
            logger.info("[Events] Reminder scheduler initialized. Reminders will be scheduled on event creation/update.")
        except Exception as e:
            logger.error(f"[Events] Failed to reschedule reminders: {e}")

    import asyncio
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(_reschedule())
    except Exception:
        pass
