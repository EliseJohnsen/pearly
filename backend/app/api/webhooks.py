from fastapi import APIRouter, Request, Header, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import logging
import hmac
import hashlib

from app.core.database import get_db
from app.core.config import settings
from app.models.order import Order
from app.models.order_log import OrderLog
from app.models.address import Address
from app.models.customer import Customer

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


@router.post("/webhooks/vipps")
async def vipps_webhook(
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Handle Vipps Checkout callbacks/webhooks.

    Vipps sends callbacks when:
    - Payment is authorized
    - Payment is captured
    - Payment fails
    - Session expires
    """
    # Verify authorization token
    if authorization != settings.SECRET_KEY:
        logger.warning("Invalid Vipps webhook authorization token")
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        body = await request.json()
        logger.info(f"Received Vipps webhook: {body}")

        reference = body.get("reference")
        session_state = body.get("sessionState")

        if not reference:
            logger.error("Missing reference in Vipps webhook")
            raise HTTPException(status_code=400, detail="Missing reference")

        # Find order by order_number (reference)
        order = db.query(Order).filter(Order.order_number == reference).first()

        if not order:
            logger.error(f"Order not found for reference: {reference}")
            raise HTTPException(status_code=404, detail="Order not found")

        # Handle different session states
        if session_state == "PaymentSuccessful":
            order.status = "paid"
            order.payment_status = "paid"

            # Extract shipping address from Vipps if available
            shipping_details = body.get("shippingDetails")
            if shipping_details:
                shipping_address = Address(
                    order_id=order.id,
                    type="shipping",
                    name=f"{shipping_details.get('firstName', '')} {shipping_details.get('lastName', '')}".strip(),
                    address_line_1=shipping_details.get("streetAddress", ""),
                    postal_code=shipping_details.get("postalCode", ""),
                    city=shipping_details.get("city", ""),
                    country=shipping_details.get("country", "NO"),
                )
                db.add(shipping_address)

                # Store shipping method info
                order.shipping_method_id = shipping_details.get("shippingMethodId")
                shipping_amount = shipping_details.get("amount", {})
                if shipping_amount:
                    order.shipping_amount = shipping_amount.get("value")

                pick_up_point = shipping_details.get("pickupPoint")
                if pick_up_point:
                    pick_up_address = Address(
                        order_id=order.id,
                        type="pickUpPoint",
                        name=pick_up_point.get("name"),
                        address_line_1=pick_up_point.get("address", ""),
                        postal_code=pick_up_point.get("postalCode", ""),
                        city=pick_up_point.get("city", ""),
                        country=pick_up_point.get("country", "NO"),
                        pick_up_point_id=pick_up_point.get("id"),
                    )
                    db.add(pick_up_address)

            # Create/link customer from Vipps user info
                email = shipping_details.get("email")
                name = f"{shipping_details.get('firstName', '')} {shipping_details.get('lastName', '')}".strip() if shipping_details else ""

                # Check if customer with this email already exists
                existing_customer = db.query(Customer).filter(Customer.email == email).first() if email else None

                if existing_customer:
                    order.customer_id = existing_customer.id
                else:
                    # Create new customer
                    new_customer = Customer(
                        name=name,
                        email=email
                    )
                    db.add(new_customer)
                    db.flush()
                    order.customer_id = new_customer.id



            # Add log entry
            log = OrderLog(
                order_id=order.id,
                created_by_type="system",
                message="Betaling fullført via Vipps"
            )
            db.add(log)
            logger.info(f"Payment successful for order {reference}")

        elif session_state == "PaymentTerminated":
            order.status = "cancelled"
            order.payment_status = "cancelled"

            log = OrderLog(
                order_id=order.id,
                created_by_type="system",
                message="Betaling avbrutt av bruker"
            )
            db.add(log)
            logger.info(f"Payment terminated for order {reference}")

        elif session_state == "SessionExpired":
            order.status = "expired"
            order.payment_status = "failed"

            log = OrderLog(
                order_id=order.id,
                created_by_type="system",
                message="Betalingssesjon utløpt"
            )
            db.add(log)
            logger.info(f"Session expired for order {reference}")

        else:
            logger.info(f"Unhandled session state: {session_state} for order {reference}")

        db.commit()

        return {"status": "ok"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing Vipps webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
