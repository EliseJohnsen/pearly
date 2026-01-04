from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from enum import Enum


# Enums
class ProductStatusEnum(str, Enum):
    IN_STOCK = "in_stock"
    OUT_OF_STOCK = "out_of_stock"
    COMING_SOON = "coming_soon"


class DifficultyLevelEnum(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class ShippingClassEnum(str, Enum):
    LETTER = "letter"
    PACKAGE = "package"


# Category Schemas
class CategoryBase(BaseModel):
    name: str
    slug: str
    parent_id: Optional[int] = None


class CategoryCreate(CategoryBase):
    """Schema for creating a category"""
    pass


class CategoryResponse(CategoryBase):
    """Schema for category responses with metadata"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Product Image Schemas
class ProductImageBase(BaseModel):
    url: str
    alt_text: Optional[str] = None
    sort_order: int = 0
    is_primary: bool = False


class ProductImageResponse(ProductImageBase):
    """Schema for product image responses with metadata"""
    id: int
    product_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Product Variant Option Schemas
class ProductVariantOptionBase(BaseModel):
    option_type: str = Field(..., description="e.g., 'Size', 'Color Vibrancy'")
    option_value: str = Field(..., description="e.g., 'Large', 'Vivid'")


class ProductVariantOptionResponse(ProductVariantOptionBase):
    """Schema for product variant option responses with metadata"""
    id: int
    variant_id: int

    class Config:
        from_attributes = True


# Product Variant Schemas
class ProductVariantBase(BaseModel):
    sku: str
    name: str
    price: Decimal
    compare_at_price: Optional[Decimal] = None
    weight: Optional[Decimal] = None
    width: Optional[Decimal] = None
    height: Optional[Decimal] = None
    depth: Optional[Decimal] = None
    shipping_class: ShippingClassEnum = ShippingClassEnum.PACKAGE
    stock_quantity: int = 0
    is_active: bool = True


class ProductVariantCreate(ProductVariantBase):
    """Schema for creating a product variant"""
    options: List[ProductVariantOptionBase] = []


class ProductVariantResponse(ProductVariantBase):
    """Schema for product variant responses with metadata"""
    id: int
    product_id: int
    options: List[ProductVariantOptionResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Product Schemas
class ProductBase(BaseModel):
    """Base schema for product with common fields"""
    sku: str
    name: str
    description: Optional[str] = None
    long_description: Optional[str] = None
    status: ProductStatusEnum = ProductStatusEnum.IN_STOCK
    slug: str
    difficulty_level: Optional[DifficultyLevelEnum] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    keywords: Optional[List[str]] = None
    currency: str = "NOK"
    vat_rate: Decimal = Decimal("25.00")
    tags: Optional[List[str]] = None


class ProductCreateFromPatternData(ProductBase):
    """
    Schema for creating a product directly from pattern generation.
    Includes pattern data and images that will be uploaded to Sanity.
    """
    # Pattern data (from generation)
    pattern_image_base64: str
    styled_image_base64: Optional[str] = None
    pattern_data: dict
    colors_used: List[dict]

    # Product variants and categories
    variants: List[ProductVariantCreate] = []
    category_ids: List[int] = []


class ProductUpdate(BaseModel):
    """Schema for updating a product - all fields optional"""
    sku: Optional[str] = None
    pattern_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    long_description: Optional[str] = None
    status: Optional[ProductStatusEnum] = None
    slug: Optional[str] = None
    difficulty_level: Optional[DifficultyLevelEnum] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    keywords: Optional[List[str]] = None
    currency: Optional[str] = None
    vat_rate: Optional[Decimal] = None
    tags: Optional[List[str]] = None


class ProductResponse(ProductBase):
    """Schema for complete product response with all relationships"""
    id: int
    pattern_id: int
    variants: List[ProductVariantResponse] = []
    images: List[ProductImageResponse] = []
    categories: List[CategoryResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    """Schema for simplified product list response"""
    id: int
    sku: str
    name: str
    description: Optional[str] = None
    status: ProductStatusEnum
    slug: str
    difficulty_level: Optional[DifficultyLevelEnum] = None
    primary_image: Optional[ProductImageResponse] = None
    min_price: Optional[Decimal] = None
    created_at: datetime

    class Config:
        from_attributes = True
