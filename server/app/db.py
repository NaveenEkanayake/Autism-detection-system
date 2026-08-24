"""MongoDB database connection setup using Motor."""
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

logger = logging.getLogger("app.db")

# Setup Motor client
try:
    if not settings.MONGODB_URL:
        raise ValueError("MONGODB_URL environment variable is not set!")
    
    # Establish Connection
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    
    # Parse DB name from URL if present (e.g. clusterautism.wanrgte.mongodb.net/test -> test)
    # Defaulting to "autism_detection_db"
    db = client.get_default_database("autism_detection_db")
    logger.info("MongoDB client initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing MongoDB Client: {e}")
    client = None
    db = None

async def ping_db() -> bool:
    """Verifies connection to MongoDB Atlas."""
    if client is None:
        return False
    try:
        # The ping command is cheap and does not require auth privileges beyond the connection check
        await client.admin.command('ping')
        return True
    except Exception as e:
        logger.error(f"MongoDB connection ping failed: {e}")
        return False
