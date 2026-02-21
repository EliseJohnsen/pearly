from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base
from app.api import patterns, products, auth, orders, checkout, webhooks, colors
import logging

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # Output to console
    ]
)

logger = logging.getLogger(__name__)


def run_migrations():
    """Run Alembic migrations automatically on startup"""
    try:
        from alembic.config import Config
        from alembic import command
        import os

        # Get the directory containing this file
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        alembic_cfg = Config(os.path.join(backend_dir, "alembic.ini"))

        # Set the script location to the absolute path
        alembic_cfg.set_main_option("script_location", os.path.join(backend_dir, "alembic"))

        # Run migrations
        command.upgrade(alembic_cfg, "head")
        logger.info("✅ Database migrations completed successfully")
    except ModuleNotFoundError as e:
        if "alembic" in str(e):
            logger.error(f"❌ Alembic not installed: {e}")
            logger.warning("⚠️  Install dependencies: pip install -r requirements.txt")
        else:
            logger.error(f"❌ Module error: {e}")
        logger.warning("⚠️  Continuing without migrations...")
    except Exception as e:
        error_msg = str(e)
        if "duplicate column" in error_msg or "already exists" in error_msg:
            logger.info("ℹ️  Database schema already up to date (columns exist)")
            logger.info("💡 Run 'alembic stamp head' to mark database as migrated")
        else:
            logger.error(f"❌ Error running migrations: {e}")
            logger.warning("⚠️  Continuing without migrations...")
        # Don't crash the app on migration errors in development
        # In production, you might want to raise the exception


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    logger.info("Starting application...")

    # Run migrations automatically
    run_migrations()

    yield

    # Shutdown (cleanup code goes here if needed)
    logger.info("Shutting down application...")


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

# Global exception handlers to ensure CORS headers are always present
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all uncaught exceptions and ensure CORS headers are present"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal server error: {str(exc)}"},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with proper CORS headers"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )

app.include_router(patterns.router, prefix="/api", tags=["patterns"])
app.include_router(products.router, prefix="/api", tags=["products"])
app.include_router(orders.router, prefix="/api", tags=["orders"])
app.include_router(checkout.router, prefix="/api", tags=["checkout"])
app.include_router(webhooks.router, prefix="/api", tags=["webhooks"])
app.include_router(colors.router, prefix="/api", tags=["colors"])
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "Perle Pattern API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
