from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.product import Product, ProductVariant, ProductImage, Category, ProductCategory
from app.models.pattern import Pattern
from app.schemas.product import (
    ProductCreateFromPatternData,
    ProductResponse,
    ProductUpdate,
    ProductListResponse,
    CategoryCreate,
    CategoryResponse,
)
from typing import List
from app.services.sanity_service import SanityService
import base64
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/products/create-from-pattern-data", response_model=ProductResponse)
async def create_product_from_pattern_data(
    product_data: ProductCreateFromPatternData,
    db: Session = Depends(get_db)
):
    """
    Create a product directly from pattern generation data.
    Uploads images to Sanity, creates pattern in database, and links to product.
    """
    try:
        sanity_service = SanityService()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"Sanity configuration error: {str(e)}")

    existing_product = db.query(Product).filter(Product.sku == product_data.sku).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="Product with this SKU already exists")

    try:
        pattern_image_bytes = base64.b64decode(product_data.pattern_image_base64)

        pattern_filename = f"{product_data.slug}-pattern.png"
        pattern_upload_result = await sanity_service.upload_image_from_bytes(
            pattern_image_bytes,
            pattern_filename
        )

        logger.info(f"Uploaded pattern image to Sanity: {pattern_upload_result['asset_id']}")

        styled_image_asset_id = None
        if product_data.styled_image_base64:
            styled_image_bytes = base64.b64decode(product_data.styled_image_base64)
            styled_filename = f"{product_data.slug}-styled.png"
            styled_upload_result = await sanity_service.upload_image_from_bytes(
                styled_image_bytes,
                styled_filename
            )
            styled_image_asset_id = styled_upload_result['asset_id']
            logger.info(f"Uploaded styled image to Sanity: {styled_image_asset_id}")

    except Exception as e:
        logger.error(f"Failed to upload images to Sanity: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload images: {str(e)}")

    import uuid as uuid_lib
    from datetime import datetime, timedelta

    pattern_uuid = str(uuid_lib.uuid4())

    updated_pattern_data = {
        **product_data.pattern_data,
        "sanity_pattern_image_id": pattern_upload_result['asset_id'],
        "sanity_pattern_image_url": pattern_upload_result['url'],
    }

    if styled_image_asset_id:
        updated_pattern_data["sanity_styled_image_id"] = styled_image_asset_id

    grid_size = product_data.pattern_data.get("width", 29)

    db_pattern = Pattern(
        uuid=pattern_uuid,
        original_image_path="",  # Not stored locally anymore
        pattern_image_path="",   # Not stored locally anymore
        pattern_data=updated_pattern_data,
        grid_size=grid_size,
        colors_used=product_data.colors_used,
        expires_at=datetime.utcnow() + timedelta(days=365)  # Long expiry for product patterns
    )
    db.add(db_pattern)
    db.flush()  # Get the pattern ID

    db_product = Product(
        sku=product_data.sku,
        product_type="pattern",  # Pattern products from generator
        pattern_id=db_pattern.id,
        name=product_data.name,
        description=product_data.description,
        long_description=product_data.long_description,
        status=product_data.status,
        slug=product_data.slug,
        difficulty_level=product_data.difficulty_level,
        colors_used=len(product_data.colors_used),
        grid_size=f"{product_data.pattern_data.get('boards_width', 1)}x{product_data.pattern_data.get('boards_height', 1)} boards",
        meta_title=product_data.meta_title,
        meta_description=product_data.meta_description,
        keywords=product_data.keywords,
        currency=product_data.currency,
        vat_rate=product_data.vat_rate,
        tags=product_data.tags,
    )
    db.add(db_product)
    db.flush()  # Get the product ID without committing

    for variant_data in product_data.variants:
        db_variant = ProductVariant(
            product_id=db_product.id,
            sku=variant_data.sku,
            name=variant_data.name,
            price=variant_data.price,
            compare_at_price=variant_data.compare_at_price,
            weight=variant_data.weight,
            width=variant_data.width,
            height=variant_data.height,
            depth=variant_data.depth,
            shipping_class=variant_data.shipping_class,
            stock_quantity=variant_data.stock_quantity,
            is_active=variant_data.is_active,
        )
        db.add(db_variant)

    db_pattern_image = ProductImage(
        product_id=db_product.id,
        url=pattern_upload_result['asset_id'],  # Store Sanity asset ID
        alt_text=product_data.name,
        sort_order=0,
        is_primary=True,
    )
    db.add(db_pattern_image)

    if styled_image_asset_id:
        db_styled_image = ProductImage(
            product_id=db_product.id,
            url=styled_image_asset_id,  # Store Sanity asset ID
            alt_text=f"{product_data.name} - Styled",
            sort_order=1,
            is_primary=False,
        )
        db.add(db_styled_image)

    for category_id in product_data.category_ids:
        category = db.query(Category).filter(Category.id == category_id).first()
        if category:
            db_product_category = ProductCategory(
                product_id=db_product.id,
                category_id=category_id,
            )
            db.add(db_product_category)

    db.commit()
    db.refresh(db_product)

    try:
        boards_w = product_data.pattern_data.get("boards_width", 1)
        boards_h = product_data.pattern_data.get("boards_height", 1)
        grid_size_desc = f"{boards_w}x{boards_h} boards"

        # Collect all image asset IDs
        image_asset_ids = [pattern_upload_result['asset_id']]
        if styled_image_asset_id:
            image_asset_ids.append(styled_image_asset_id)

        sanity_product_result = await sanity_service.create_product_document(
            sku=product_data.sku,
            product_type="pattern",  # Pattern products from generator
            title=product_data.name,
            slug=product_data.slug,
            description=product_data.description,
            image_asset_ids=image_asset_ids,
            status=product_data.status.value if product_data.status else "in_stock",
            difficulty=product_data.difficulty_level.value if product_data.difficulty_level else None,
            colors_count=len(product_data.colors_used),
            grid_size=grid_size_desc,
            tags=product_data.tags,
            category=None,  # Can be added later
            pattern_id=str(db_pattern.id),
        )

        # Store Sanity document ID in database
        if "results" in sanity_product_result and len(sanity_product_result["results"]) > 0:
            sanity_doc_id = sanity_product_result["results"][0].get("id")
            if sanity_doc_id:
                db_product.sanity_document_id = sanity_doc_id
                db.commit()

        logger.info(f"Successfully created product in Sanity: {sanity_product_result}")
    except Exception as e:
        logger.warning(f"Failed to create product in Sanity, but product created in database: {str(e)}")

    logger.info(f"Successfully created pattern {db_pattern.id} and product {db_product.id} with Sanity images")
    return db_product

@router.get("/products", response_model=List[ProductListResponse])
async def list_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all products"""
    products = db.query(Product).offset(skip).limit(limit).all()

    # Transform to list response format
    result = []
    for product in products:
        primary_image = next((img for img in product.images if img.is_primary),
                            product.images[0] if product.images else None)
        min_price = min((v.price for v in product.variants), default=None) if product.variants else None

        result.append(ProductListResponse(
            id=product.id,
            sku=product.sku,
            name=product.name,
            description=product.description,
            status=product.status,
            slug=product.slug,
            difficulty_level=product.difficulty_level,
            primary_image=primary_image,
            min_price=min_price,
            created_at=product.created_at,
        ))

    return result


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a single product by ID"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db)
):
    """Update a product"""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)

    db.commit()
    db.refresh(db_product)
    return db_product


@router.delete("/products/{product_id}")
async def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product"""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully"}


@router.post("/categories", response_model=CategoryResponse)
async def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db)
):
    """Create a new category"""
    db_category = Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(db: Session = Depends(get_db)):
    """List all categories"""
    return db.query(Category).all()
