from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import patterns
from app.models import pattern  # Import models to register them

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Perle Pattern API",
    description="API for converting images to bead patterns",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patterns.router, prefix="/api", tags=["patterns"])

@app.get("/")
def read_root():
    return {"message": "Perle Pattern API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
