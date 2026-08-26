"""Main Flask application configuration and startup handlers."""
import asyncio
from flask import Flask, jsonify
from flask_cors import CORS
from .config import settings
from .routers.auth import auth_blueprint
from .routers.patients import patients_blueprint
from .routers.sdq import sdq_blueprint
from .routers.milestones import milestones_blueprint
from .routers.documents import documents_blueprint
from .routers.vision import vision_blueprint
from .routers.ai import ai_blueprint
from .routers.events import events_blueprint
from .routers.health import health_blueprint
from .db import ping_db

app = Flask(
    "app",
    static_folder=None
)

# Configure CORS Middleware
origins = settings.CORS_ORIGINS
# Flask-CORS supports list or string origins
CORS(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=True)

# Startup DB ping (since Flask is synchronous on startup, we run ping_db in a sync runner)
try:
    loop = asyncio.get_event_loop()
except RuntimeError:
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
is_connected = loop.run_until_complete(ping_db())
if is_connected:
    print("[Startup] Connected to Firebase Firestore database successfully.")
else:
    print("[Startup] WARNING: Could not connect to Firebase Firestore database.")

# Root Route
@app.route("/", methods=["GET"])
def read_root():
    return jsonify({
        "status": "online",
        "message": "Autism Detection Platform Backend API is running.",
        "version": "1.0.0"
    })

# Register blueprints under the /api prefix
app.register_blueprint(auth_blueprint, url_prefix="/api")
app.register_blueprint(patients_blueprint, url_prefix="/api")
app.register_blueprint(sdq_blueprint, url_prefix="/api")
app.register_blueprint(milestones_blueprint, url_prefix="/api")
app.register_blueprint(documents_blueprint, url_prefix="/api")
app.register_blueprint(vision_blueprint, url_prefix="/api")
app.register_blueprint(ai_blueprint, url_prefix="/api")
app.register_blueprint(events_blueprint, url_prefix="/api")
app.register_blueprint(health_blueprint, url_prefix="/api")
