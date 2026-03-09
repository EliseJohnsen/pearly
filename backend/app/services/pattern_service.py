"""Service for pattern operations"""
from app.models.pattern import Pattern
from sqlalchemy.orm import Session
import uuid as uuid_lib
import logging

logger = logging.getLogger(__name__)


def save_custom_pattern(db: Session, pattern_data: dict, colors_used: list) -> int:
    """
    Save a custom pattern to the database without creating Sanity product.

    This is used for customer-generated patterns during checkout.
    Unlike create_product_from_pattern_data(), this does NOT:
    - Create a Sanity product
    - Upload images to Sanity
    - Require SKU/slug/price

    Args:
        db: Database session
        pattern_data: Pattern metadata (grid, dimensions, storage_version)
        colors_used: Array of colors with codes and counts

    Returns:
        Pattern ID

    Raises:
        Exception: If pattern creation fails
    """
    try:
        # Calculate grid size from pattern_data
        width = pattern_data.get("width", 0)
        height = pattern_data.get("height", 0)
        grid_size = width * height

        # Create pattern record
        db_pattern = Pattern(
            uuid=str(uuid_lib.uuid4()),
            pattern_data=pattern_data,
            grid_size=grid_size,
            colors_used=colors_used,
        )
        db.add(db_pattern)
        db.flush()  # Get the ID without committing

        logger.info(f"Saved custom pattern {db_pattern.uuid} (ID: {db_pattern.id}, size: {width}x{height}, {grid_size} beads)")

        return db_pattern.id

    except Exception as e:
        logger.error(f"Failed to save custom pattern: {str(e)}")
        raise
