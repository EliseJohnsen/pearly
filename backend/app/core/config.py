from pydantic_settings import BaseSettings
from typing import List, Union
import json
import logging

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://user:password@localhost:5432/perle_db"
    BACKEND_CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000"]
    UPLOAD_DIR: str = "./uploads"
    REPLICATE_API_TOKEN: str = ""
    SANITY_PROJECT_ID: str = ""
    SANITY_DATASET: str = "production"
    SANITY_API_TOKEN: str = ""
    SANITY_API_VERSION: str = "2024-12-16"
    SANITY_WEBHOOK_SECRET: str = ""  # Optional: For verifying webhook signatures
    SECRET_KEY: str = "your-secret-key-change-this-in-production"  # For JWT tokens

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins whether they come as a list or JSON string"""
        if isinstance(self.BACKEND_CORS_ORIGINS, str):
            try:
                parsed = json.loads(self.BACKEND_CORS_ORIGINS)
                logger.info(f"Parsed CORS origins from JSON string: {parsed}")
                return parsed
            except json.JSONDecodeError:
                logger.warning(f"Could not parse CORS origins as JSON, using as single string: {self.BACKEND_CORS_ORIGINS}")
                return [self.BACKEND_CORS_ORIGINS]
        logger.info(f"Using CORS origins as list: {self.BACKEND_CORS_ORIGINS}")
        return self.BACKEND_CORS_ORIGINS

try:
    settings = Settings()
    logger.info(f"Settings loaded successfully. CORS origins: {settings.cors_origins}")
except Exception as e:
    logger.error(f"Error loading settings: {e}")
    raise
