# AuraTrack Backend

Python (FastAPI) backend for the AuraTrack autism screening platform.

## Setup

```bash
cd server
python -m venv .venv
source .venv/Scripts/activate   # Git Bash / Windows
pip install -r requirements.txt
cp .env.example .env            # then fill in real keys (already filled in .env)
python run.py
```

The server runs on `http://localhost:8000` with all routes under `/api`.

## Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | /api/auth/register | Create an account (name, email, password) |
| POST | /api/auth/login | Sign in and receive a JWT |
| POST | /api/auth/google | Sign in with a Google/Firebase ID token |
| GET | /api/auth/me | Current session user |
| POST | /api/auth/forgot/send-otp | Request a reset code |
| POST | /api/auth/forgot/verify-otp | Verify the reset code |
| POST | /api/auth/forgot/reset | Set a new password |
| GET | /api/children | List child profiles |
| POST | /api/children | Create a child profile |
| PUT | /api/children/{id} | Update a child profile |
| DELETE | /api/children/{id} | Delete a child profile and related data |
| GET/POST | /api/sdq, /api/sdq/{childId} | SDQ assessments |
| GET/POST | /api/health/milestones, /api/health/milestones/{childId} | Milestones |
| GET/POST | /api/health/growth, /api/health/growth/{childId} | Growth records |
| GET/POST | /api/health/sleep, /api/health/sleep/{childId} | Sleep logs |
| GET/POST/DELETE | /api/documents... | Document library |
| POST | /api/vision/analyze | Run Roboflow autism detection on an image |
| GET | /api/vision/{childId} | List vision analyses for a child |
| POST | /api/ai/suggest | Get a Gemini-powered parenting suggestion |

## Notes

- Authentication uses JWT bearer tokens. Send `Authorization: Bearer <token>`.
- The database is a SQLite file created automatically at `server/aura.db`.
- `DEV_OTP=1` returns the forgot-password code in the API response for testing;
  wire up an email provider in production.
