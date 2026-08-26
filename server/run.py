"""Server entrypoint script to launch the Flask application."""
from app.main import app
from app.config import settings

if __name__ == "__main__":
    print(f"Starting Flask server on port {settings.PORT}...")
    app.run(
        host="0.0.0.0",
        port=settings.PORT,
        debug=True
    )
