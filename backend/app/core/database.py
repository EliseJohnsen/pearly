from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Use SQLite for local development if DATABASE_URL contains 'user:password' or 'sqlite'
# This allows the app to run without PostgreSQL installed locally
database_url = settings.DATABASE_URL

if "user:password" in database_url or database_url.startswith("sqlite"):
    # Use SQLite for local development
    database_url = "sqlite:///./perle.db"
    logger.info("Using SQLite database for local development")
else:
    # Use PostgreSQL in production (Railway will provide DATABASE_URL)
    logger.info(f"Using PostgreSQL database: {database_url.split('@')[1] if '@' in database_url else 'configured'}")

# Create engine with appropriate settings
connect_args = {}
if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    database_url,
    connect_args=connect_args,
    pool_pre_ping=True,  # Verify connections before using them
    pool_recycle=300,    # Recycle connections after 5 minutes
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
