from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.product import Product, ProductVariant, ProductImage, ProductType, ProductStatus, DifficultyLevel
from typing import Optional
import logging
import hmac
import hashlib
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


def verify_sanity_webhook(body: bytes, signature: Optional[str], secret: str) -> bool:
    """
    Verify that the webhook request came from Sanity.

    Args:
        body: Raw request body bytes
        signature: Signature from X-Sanity-Signature header
        secret: Webhook secret from Sanity settings

    Returns:
        True if signature is valid, False otherwise
    """
    if not signature or not secret:
        logger.warning("Missing signature or secret for webhook verification")
        return False

    try:
        # Sanity uses HMAC-SHA256
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            body,
            hashlib.sha256
        ).hexdigest()

        # Remove 'sha256=' prefix if present
        if signature.startswith('sha256='):
            signature = signature[7:]

        return hmac.compare_digest(signature, expected_signature)
    except Exception as e:
        logger.error(f"Error verifying webhook signature: {str(e)}")
        return False


@router.post("/webhooks/sanity/product")
async def sanity_product_webhook(
    request: Request,
    x_sanity_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Webhook endpoint for receiving product create/update events from Sanity.

    When a product is created or updated in Sanity Studio, this endpoint
    creates or updates the corresponding product in the database.
    """
    body = await request.body()

    # Verify webhook signature if secret is configured
    webhook_secret = getattr(settings, 'SANITY_WEBHOOK_SECRET', None)
    if webhook_secret:
        if not verify_sanity_webhook(body, x_sanity_signature, webhook_secret):
            logger.warning("Invalid webhook signature")
            raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        payload = await request.json()
    except Exception as e:
        logger.error(f"Failed to parse webhook payload: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    logger.info(f"Received Sanity webhook: {payload}")

    # Extract the document from the payload
    # Sanity webhook format: {"_id": "...", "_type": "products", ...}
    if not payload or "_type" not in payload:
        logger.error("Invalid webhook payload structure")
        raise HTTPException(status_code=400, detail="Invalid payload structure")

    if payload["_type"] != "products":
        logger.info(f"Ignoring webhook for document type: {payload['_type']}")
        return {"message": "Ignored - not a product document"}

    # Check if this is a delete event
    if payload.get("_deleted", False):
        return await handle_product_delete(payload, db)

    # Handle create/update
    return await handle_product_upsert(payload, db)


async def handle_product_delete(payload: dict, db: Session) -> dict:
    """Handle product deletion from Sanity"""
    sanity_id = payload.get("_id")

    if not sanity_id:
        raise HTTPException(status_code=400, detail="Missing _id in payload")

    # Find product by Sanity document ID
    product = db.query(Product).filter(Product.sanity_document_id == sanity_id).first()

    if not product:
        logger.info(f"Product with Sanity ID {sanity_id} not found in database")
        return {"message": "Product not found - nothing to delete"}

    # Don't delete products with patterns - they were created from backend
    if product.pattern_id:
        logger.warning(f"Attempted to delete product {product.id} with pattern - ignoring")
        return {"message": "Cannot delete products with patterns via Sanity"}

    db.delete(product)
    db.commit()

    logger.info(f"Deleted product {product.id} from database")
    return {"message": "Product deleted successfully", "product_id": product.id}


async def handle_product_upsert(payload: dict, db: Session) -> dict:
    """Handle product create/update from Sanity"""
    sanity_id = payload.get("_id")
    sku = payload.get("sku")

    if not sanity_id or not sku:
        raise HTTPException(status_code=400, detail="Missing required fields: _id or sku")

    # Check if product exists by Sanity ID
    product = db.query(Product).filter(Product.sanity_document_id == sanity_id).first()

    # If not found by Sanity ID, check by SKU
    if not product:
        product = db.query(Product).filter(Product.sku == sku).first()
        if product and not product.sanity_document_id:
            # Link existing product to Sanity document
            product.sanity_document_id = sanity_id

    is_new = product is None

    if is_new:
        # Create new product
        product = Product()
        product.sanity_document_id = sanity_id

    # Update product fields from Sanity payload
    try:
        product.sku = sku
        product.product_type = ProductType(payload.get("productType", "other"))
        product.name = payload.get("title", "")
        product.description = payload.get("description")
        product.slug = payload.get("slug", {}).get("current", "")

        # Handle status
        status_value = payload.get("status", "in_stock")
        product.status = ProductStatus(status_value)

        # Handle difficulty
        difficulty_value = payload.get("difficulty")
        if difficulty_value:
            product.difficulty_level = DifficultyLevel(difficulty_value)

        # Pattern-specific fields
        product.category = payload.get("category")
        product.colors_used = payload.get("colors")
        product.grid_size = payload.get("gridSize")

        # Pattern ID (if provided)
        pattern_id_str = payload.get("patternId")
        if pattern_id_str:
            try:
                product.pattern_id = int(pattern_id_str)
            except (ValueError, TypeError):
                logger.warning(f"Invalid pattern_id: {pattern_id_str}")

        # Other fields
        product.currency = payload.get("currency", "NOK")
        product.vat_rate = payload.get("vatRate", 25.0)
        product.tags = payload.get("tags", [])
        product.is_featured = payload.get("isFeatured", False)
        product.display_order = payload.get("order", 0)

        # SEO fields
        seo = payload.get("seo", {})
        if seo:
            product.meta_title = seo.get("metaTitle")
            product.meta_description = seo.get("metaDescription")
            product.keywords = seo.get("keywords", [])

        # Long description - convert from Sanity blocks to text
        long_desc = payload.get("longDescription")
        if long_desc:
            # For now, store as JSON; could convert to HTML/text later
            import json
            product.long_description = json.dumps(long_desc)

        if is_new:
            db.add(product)

        db.flush()  # Get product ID

        # Handle images
        images_data = payload.get("images", [])
        if images_data and is_new:
            # Only create images for new products
            for idx, image_data in enumerate(images_data):
                asset_ref = image_data.get("asset", {}).get("_ref", "")
                alt_text = image_data.get("alt", "")
                is_primary = image_data.get("isPrimary", idx == 0)

                if asset_ref:
                    product_image = ProductImage(
                        product_id=product.id,
                        url=asset_ref,  # Store Sanity asset reference
                        alt_text=alt_text,
                        sort_order=idx,
                        is_primary=is_primary,
                    )
                    db.add(product_image)

        # Handle variants
        variants_data = payload.get("variants", [])
        if variants_data and is_new:
            # Only create variants for new products
            for variant_data in variants_data:
                variant_sku = variant_data.get("sku")
                if not variant_sku:
                    continue

                variant = ProductVariant(
                    product_id=product.id,
                    sku=variant_sku,
                    name=variant_data.get("name", ""),
                    price=variant_data.get("price", 0),
                    compare_at_price=variant_data.get("compareAtPrice"),
                    weight=variant_data.get("weight"),
                    stock_quantity=variant_data.get("stockQuantity", 0),
                    is_active=variant_data.get("isActive", True),
                )

                # Handle dimensions
                dimensions = variant_data.get("dimensions", {})
                if dimensions:
                    variant.width = dimensions.get("width")
                    variant.height = dimensions.get("height")
                    variant.depth = dimensions.get("depth")

                # Handle shipping class
                shipping_class = variant_data.get("shippingClass")
                if shipping_class:
                    from app.models.product import ShippingClass
                    variant.shipping_class = ShippingClass(shipping_class)

                db.add(variant)

        db.commit()
        db.refresh(product)

        action = "created" if is_new else "updated"
        logger.info(f"Successfully {action} product {product.id} from Sanity webhook")

        return {
            "message": f"Product {action} successfully",
            "product_id": product.id,
            "sku": product.sku,
            "action": action
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Error processing webhook: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing webhook: {str(e)}")
