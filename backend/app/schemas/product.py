from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


# Enums used for product validation (data stored in Sanity CMS)
class ProductStatusEnum(str, Enum):
    """Product availability status"""
    IN_STOCK = "in_stock"
    OUT_OF_STOCK = "out_of_stock"
    COMING_SOON = "coming_soon"


class DifficultyLevelEnum(str, Enum):
    """Pattern difficulty level"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class ProductCreateFromPatternData(BaseModel):
    """
    Schema for creating a product from pattern generation.

    Creates:
    1. Pattern record in PostgreSQL database
    2. Product document in Sanity CMS with images and metadata

    All product data (name, description, images, etc.) is stored in Sanity.
    Only pattern metadata is stored in PostgreSQL.
    """
    # Product identification
    sku: str
    name: str
    slug: str

    # Product details (stored in Sanity)
    description: Optional[str] = None
    status: ProductStatusEnum = ProductStatusEnum.IN_STOCK
    difficulty_level: Optional[DifficultyLevelEnum] = None
    tags: Optional[List[str]] = None

    # Pattern data (for database)
    pattern_image_base64: str
    styled_image_base64: Optional[str] = None
    pattern_data: dict
    colors_used: List[dict]
    price: int
    original_price: Optional[int]
