from sqlalchemy import Column, Integer, String, DateTime, JSON, Boolean, Numeric, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class ProductStatus(str, enum.Enum):
    IN_STOCK = "in_stock"
    OUT_OF_STOCK = "out_of_stock"
    COMING_SOON = "coming_soon"


class DifficultyLevel(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class ShippingClass(str, enum.Enum):
    LETTER = "letter"
    PACKAGE = "package"


class ProductType(str, enum.Enum):
    PATTERN = "pattern"
    KIT = "kit"
    BEADS = "beads"
    TOOLS = "tools"
    PEGBOARDS = "pegboards"
    OTHER = "other"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, nullable=False, index=True)
    product_type = Column(SQLEnum(ProductType), nullable=False, default=ProductType.PATTERN)
    pattern_id = Column(Integer, ForeignKey("patterns.id"), nullable=True)  # Now optional
    sanity_document_id = Column(String, unique=True, nullable=True, index=True)  # Link to Sanity
    name = Column(String, nullable=False)
    description = Column(Text)
    long_description = Column(Text)
    status = Column(SQLEnum(ProductStatus), default=ProductStatus.IN_STOCK)
    slug = Column(String, unique=True, nullable=False, index=True)
    difficulty_level = Column(SQLEnum(DifficultyLevel))

    # Pattern-specific fields (optional)
    category = Column(String)  # For pattern products
    colors_used = Column(Integer)  # Number of colors in pattern
    grid_size = Column(String)  # Grid size description

    # SEO fields
    meta_title = Column(String)
    meta_description = Column(Text)
    keywords = Column(JSON)  # Array of strings

    # Pricing defaults
    currency = Column(String, default="NOK")
    vat_rate = Column(Numeric(5, 2), default=25.00)  # 25% Norwegian VAT

    # Tags
    tags = Column(JSON)  # Array of strings

    # Display settings
    is_featured = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    pattern = relationship("Pattern", backref="products")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    categories = relationship("ProductCategory", back_populates="product", cascade="all, delete-orphan")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    sku = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)

    # Pricing
    price = Column(Numeric(10, 2), nullable=False)
    compare_at_price = Column(Numeric(10, 2))  # Original price for discount display

    # Shipping dimensions
    weight = Column(Numeric(10, 2))  # in grams
    width = Column(Numeric(10, 2))   # in cm
    height = Column(Numeric(10, 2))  # in cm
    depth = Column(Numeric(10, 2))   # in cm
    shipping_class = Column(SQLEnum(ShippingClass), default=ShippingClass.PACKAGE)

    # Inventory
    stock_quantity = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    product = relationship("Product", back_populates="variants")
    options = relationship("ProductVariantOption", back_populates="variant", cascade="all, delete-orphan")


class ProductVariantOption(Base):
    __tablename__ = "product_variant_options"

    id = Column(Integer, primary_key=True, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=False)
    option_type = Column(String, nullable=False)  # e.g., "Size", "Color Vibrancy"
    option_value = Column(String, nullable=False)  # e.g., "Large", "Vivid"

    # Relationships
    variant = relationship("ProductVariant", back_populates="options")


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    url = Column(String, nullable=False)
    alt_text = Column(String)
    sort_order = Column(Integer, default=0)
    is_primary = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    product = relationship("Product", back_populates="images")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    parent = relationship("Category", remote_side=[id], backref="children")
    products = relationship("ProductCategory", back_populates="category")


class ProductCategory(Base):
    __tablename__ = "product_categories"

    product_id = Column(Integer, ForeignKey("products.id"), primary_key=True)
    category_id = Column(Integer, ForeignKey("categories.id"), primary_key=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    product = relationship("Product", back_populates="categories")
    category = relationship("Category", back_populates="products")
