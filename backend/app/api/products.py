from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.pattern import Pattern
from app.schemas.product import ProductCreateFromPatternData
from app.schemas.pattern import PatternResponse
from app.services.sanity_service import SanityService
import base64
import logging
from datetime import datetime, timedelta
import uuid as uuid_lib

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/products/create-from-pattern-data", response_model=PatternResponse)
async def create_product_from_pattern_data(
    product_data: ProductCreateFromPatternData,
    db: Session = Depends(get_db)
):
    """
    Create a pattern in database and a product in Sanity from pattern generation data.

    This endpoint:
    1. Uploads pattern images to Sanity
    2. Creates a Pattern record in the database
    3. Creates a product document in Sanity with pattern metadata
    4. Stores the Sanity product ID in the pattern data

    Returns the created Pattern with Sanity references.
    """
    try:
        sanity_service = SanityService()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"Sanity configuration error: {str(e)}")

    # Check if pattern already exists with this SKU
    # Query all patterns and check in Python since JSONB querying can be tricky
    existing_patterns = db.query(Pattern).all()
    for pattern in existing_patterns:
        if (pattern.pattern_data and
            isinstance(pattern.pattern_data, dict) and
            pattern.pattern_data.get("sanity_product_sku") == product_data.sku):
            raise HTTPException(status_code=400, detail="Pattern with this SKU already exists")

    # Upload images to Sanity
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

    # Create Pattern in database
    pattern_uuid = str(uuid_lib.uuid4())

    updated_pattern_data = {
        **product_data.pattern_data,
        "sanity_pattern_image_id": pattern_upload_result['asset_id'],
        "sanity_pattern_image_url": pattern_upload_result['url'],
        "sanity_product_sku": product_data.sku,
        "sanity_product_slug": product_data.slug,
    }

    if styled_image_asset_id:
        updated_pattern_data["sanity_styled_image_id"] = styled_image_asset_id

    grid_size = product_data.pattern_data.get("width", 29)

    db_pattern = Pattern(
        uuid=pattern_uuid,
        original_image_path="",  # Images stored in Sanity only
        pattern_image_path="",   # Images stored in Sanity only
        pattern_data=updated_pattern_data,
        grid_size=grid_size,
        colors_used=product_data.colors_used,
        expires_at=datetime.utcnow() + timedelta(days=365)
    )
    db.add(db_pattern)
    db.flush()  # Get the pattern ID

    # Create product document in Sanity
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
            product_type="pattern",
            title=product_data.name,
            slug=product_data.slug,
            description=product_data.description,
            image_asset_ids=image_asset_ids,
            status=product_data.status.value if product_data.status else "in_stock",
            difficulty=product_data.difficulty_level.value if product_data.difficulty_level else None,
            colors_count=len(product_data.colors_used),
            grid_size=grid_size_desc,
            tags=product_data.tags,
            category=None,
            pattern_id=str(db_pattern.id),
        )

        # Store Sanity document ID in pattern data
        if "results" in sanity_product_result and len(sanity_product_result["results"]) > 0:
            sanity_doc_id = sanity_product_result["results"][0].get("id")
            if sanity_doc_id:
                db_pattern.pattern_data["sanity_product_id"] = sanity_doc_id
                db.commit()
                logger.info(f"Linked pattern {db_pattern.id} to Sanity product {sanity_doc_id}")

        logger.info(f"Successfully created product in Sanity: {sanity_product_result}")
    except Exception as e:
        # Pattern is created, but Sanity product creation failed
        db.commit()  # Commit pattern anyway
        logger.warning(f"Failed to create product in Sanity, but pattern saved in database: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Pattern saved, but failed to create Sanity product: {str(e)}"
        )

    db.commit()
    db.refresh(db_pattern)

    logger.info(f"Successfully created pattern {db_pattern.id} with Sanity product")

    return PatternResponse(
        id=db_pattern.id,
        uuid=db_pattern.uuid,
        pattern_image_url=pattern_upload_result['url'],
        grid_size=db_pattern.grid_size,
        colors_used=db_pattern.colors_used,
        created_at=db_pattern.created_at,
        boards_width=boards_w,
        boards_height=boards_h,
        pattern_data=db_pattern.pattern_data
    )
