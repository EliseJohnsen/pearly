from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base
from app.api import patterns, products
from app.models import pattern, product  # Import models to register them
import logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        # Don't crash the app if tables already exist

    yield

    # Shutdown (cleanup code goes here if needed)


app = FastAPI(
    title="Perle Pattern API",
    description="API for converting images to bead patterns",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patterns.router, prefix="/api", tags=["patterns"])
app.include_router(products.router, prefix="/api", tags=["products"])

@app.get("/")
def read_root():
    return {"message": "Perle Pattern API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
