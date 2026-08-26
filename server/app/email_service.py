"""Gmail SMTP email notification service for event reminders."""
import logging
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta
from .config import settings

logger = logging.getLogger("app.email")

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587


def send_event_reminder_email(
    to_email: str,
    event_title: str,
    event_start: str,
    event_location: str = "",
    event_description: str = "",
    reminder_minutes: int = 60,
) -> bool:
    """
    Send an event reminder email via Gmail SMTP.
    Returns True on success, False on failure.
    """
    sender = settings.SMTP_EMAIL
    password = settings.SMTP_APP_PASSWORD

    if not sender or not password:
        logger.warning("[Email] SMTP credentials not configured. Skipping email send.")
        return False

    # Build the email
    msg = MIMEMultipart("alternative")
    msg["From"] = f"AuraTrack <{sender}>"
    msg["To"] = to_email
    msg["Subject"] = f"⏰ Reminder: {event_title} — starts in {reminder_minutes} minutes"

    # Format the reminder time text
    if reminder_minutes >= 60:
        time_text = f"{reminder_minutes // 60} hour(s)"
    else:
        time_text = f"{reminder_minutes} minutes"

    # Plain text version
    plain_text = f"""
AuraTrack Event Reminder
========================

Your event "{event_title}" starts in {time_text}.

Start Time: {event_start}
{'Location: ' + event_location if event_location else ''}
{'Notes: ' + event_description if event_description else ''}

This is an automated reminder from AuraTrack.
    """.strip()

    # HTML version
    html_text = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #3b93f5, #14b8a6); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Event Reminder</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Your event starts in {time_text}</p>
      </div>
      <div style="padding: 32px;">
        <div style="background: rgba(59,147,245,0.1); border: 1px solid rgba(59,147,245,0.2); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #e2e8f0; margin: 0 0 12px; font-size: 18px;">{event_title}</h2>
          <div style="color: #94a3b8; font-size: 14px; line-height: 1.8;">
            <p style="margin: 4px 0;">🕐 <strong style="color: #e2e8f0;">Start:</strong> {event_start}</p>
            {'<p style="margin: 4px 0;">📍 <strong style="color: #e2e8f0;">Location:</strong> ' + event_location + '</p>' if event_location else ''}
            {'<p style="margin: 4px 0;">📝 <strong style="color: #e2e8f0;">Notes:</strong> ' + event_description + '</p>' if event_description else ''}
          </div>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
          This is an automated reminder from <strong style="color: #3b93f5;">AuraTrack</strong> — Developmental Tracking Platform
        </p>
      </div>
    </div>
    """

    msg.attach(MIMEText(plain_text, "plain"))
    msg.attach(MIMEText(html_text, "html"))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls(context=context)
            server.login(sender, password)
            server.sendmail(sender, to_email, msg.as_string())
        logger.info(f"[Email] Reminder sent successfully to {to_email} for event '{event_title}'")
        return True
    except smtplib.SMTPAuthenticationError:
        logger.error("[Email] SMTP authentication failed. Check SMTP_EMAIL and SMTP_APP_PASSWORD.")
        return False
    except Exception as e:
        logger.error(f"[Email] Failed to send reminder: {e}")
        return False
