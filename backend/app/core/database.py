from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Use SQLite for local development if DATABASE_URL contains 'user:password'
# This allows the app to run without PostgreSQL installed
database_url = settings.DATABASE_URL
if "user:password" in database_url:
    # Use SQLite in-memory database for testing
    database_url = "sqlite:///./perle.db"

engine = create_engine(
    database_url,
    connect_args={"check_same_thread": False} if database_url.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
