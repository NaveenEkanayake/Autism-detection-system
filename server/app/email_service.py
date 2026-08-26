"""Gmail SMTP email notification service for event reminders."""
import logging
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from .config import settings

logger = logging.getLogger("app.email")
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    import sys
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG)
    logger.addHandler(handler)

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587


def send_event_reminder_email(
    to_email: str,
    event_title: str,
    event_start: str = "",
    event_location: str = "",
    event_description: str = "",
) -> bool:
    """
    Send an event reminder email via Gmail SMTP.
    Returns True on success, False on failure.
    """
    sender = settings.SMTP_EMAIL
    password = settings.SMTP_APP_PASSWORD

    print(f"[Email] Sending to {to_email} from {sender}")

    if not sender or not password:
        print("[Email] WARNING: SMTP credentials not configured.")
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = f"AuraTrack <{sender}>"
    msg["To"] = to_email
    msg["Subject"] = f"Event Reminder: {event_title}"

    # Plain text version
    plain_text = f"""
AuraTrack Event Reminder
========================

You have an upcoming event: {event_title}

Start: {event_start}
{'Location: ' + event_location if event_location else ''}
{'Notes: ' + event_description if event_description else ''}

This is an automated reminder from AuraTrack.
    """.strip()

    # HTML version
    html_text = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #3b93f5, #14b8a6); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Event Reminder</h1>
      </div>
      <div style="padding: 32px;">
        <div style="background: rgba(59,147,245,0.1); border: 1px solid rgba(59,147,245,0.2); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #e2e8f0; margin: 0 0 12px; font-size: 18px;">{event_title}</h2>
          <div style="color: #94a3b8; font-size: 14px; line-height: 1.8;">
            <p style="margin: 4px 0;"><strong style="color: #e2e8f0;">Start:</strong> {event_start}</p>
            {'<p style="margin: 4px 0;"><strong style="color: #e2e8f0;">Location:</strong> ' + event_location + '</p>' if event_location else ''}
            {'<p style="margin: 4px 0;"><strong style="color: #e2e8f0;">Notes:</strong> ' + event_description + '</p>' if event_description else ''}
          </div>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
          This is an automated reminder from <strong style="color: #3b93f5;">AuraTrack</strong>
        </p>
      </div>
    </div>
    """

    msg.attach(MIMEText(plain_text, "plain"))
    msg.attach(MIMEText(html_text, "html"))

    try:
        print(f"[Email] Connecting to {SMTP_SERVER}:{SMTP_PORT}...")
        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls(context=context)
            server.login(sender, password)
            server.sendmail(sender, to_email, msg.as_string())
        print(f"[Email] SUCCESS: Sent to {to_email} for '{event_title}'")
        return True
    except smtplib.SMTPAuthenticationError as e:
        print(f"[Email] FAILED: SMTP auth error: {e}")
        return False
    except Exception as e:
        print(f"[Email] FAILED: {type(e).__name__}: {e}")
        return False
