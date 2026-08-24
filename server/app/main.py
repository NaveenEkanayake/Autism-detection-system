"""Main FastAPI application configuration and startup handlers."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import auth
from .db import ping_db

app = FastAPI(
    title="Autism Detection Platform API",
    description="Backend API for autism screening, user accounts, and AI integration.",
    version="1.0.0"
)

# Configure CORS Middleware
origins = settings.CORS_ORIGINS
# FastAPI will raise an error if allow_origins=['*'] is set with allow_credentials=True.
# We check if wildcard is present and toggle allow_credentials accordingly.
allow_creds = False if "*" in origins or (isinstance(origins, str) and origins == "*") else True

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_creds,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup_db_client():
    is_connected = await ping_db()
    if is_connected:
        print("[Startup] Connected to MongoDB Atlas database successfully.")
    else:
        print("[Startup] WARNING: Could not connect to MongoDB Atlas database.")

# Root Route
@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Autism Detection Platform Backend API is running.",
        "version": "1.0.0"
    }

# Mount Routers under /api prefix
app.include_router(auth.router, prefix="/api")
