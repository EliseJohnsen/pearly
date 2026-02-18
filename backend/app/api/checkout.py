from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.order import Order
from app.models.customer import Customer
from app.models.order_line import OrderLine
from app.models.order_log import OrderLog
from app.schemas.checkout import (
    CheckoutCreate,
    CheckoutResponse,
    CheckoutStatusResponse,
)
from app.services.vipps import vipps_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/checkout", response_model=CheckoutResponse, status_code=201)
async def create_checkout(
    checkout_data: CheckoutCreate,
    db: Session = Depends(get_db)
):
    """
    Create an order and initiate Vipps Checkout session.

    1. Creates order with status 'pending_payment'
    2. Creates Vipps checkout session
    3. Returns checkout URL for redirect

    Note: Customer is created/linked in webhook after payment is confirmed,
    when we receive name and email from Vipps.
    """
    # Calculate total amount from order lines
    total_amount = sum(line.unit_price * line.quantity for line in checkout_data.order_lines)

    # Create order (customer will be linked after payment via webhook)
    order = Order(
        status="pending_payment",
        payment_status="pending",
        total_amount=total_amount,
        currency=checkout_data.currency
    )
    db.add(order)
    db.flush()

    # Create order lines
    for line_data in checkout_data.order_lines:
        line_total = line_data.unit_price * line_data.quantity
        order_line = OrderLine(
            order_id=order.id,
            product_id=line_data.product_id,
            unit_price=line_data.unit_price,
            quantity=line_data.quantity,
            line_total=line_total
        )
        db.add(order_line)

    # Create initial order log
    log = OrderLog(
        order_id=order.id,
        created_by_type="system",
        message="Ordre opprettet, venter på betaling"
    )
    db.add(log)

    db.commit()
    db.refresh(order)

    # Prepare order lines for Vipps
    vipps_order_lines = [
        {
            "name": line.name,
            "product_id": line.product_id,
            "unit_price": line.unit_price,
            "quantity": line.quantity,
            "total_amount": line.unit_price * line.quantity,
        }
        for line in checkout_data.order_lines
    ]

    try:
        # Create Vipps checkout session
        vipps_session = await vipps_client.create_checkout_session(
            reference=order.order_number,
            order_lines=vipps_order_lines,
            total_amount=total_amount,
            currency=checkout_data.currency,
        )

        # Update order with Vipps reference
        order.vipps_reference = vipps_session.get("reference", order.order_number)
        db.commit()

        # Build checkout URL with token
        checkout_url = f"{vipps_session['checkoutFrontendUrl']}?token={vipps_session['token']}"

        return CheckoutResponse(
            order_id=order.id,
            order_number=order.order_number,
            checkout_url=checkout_url,
            reference=order.vipps_reference,
        )

    except Exception as e:
        logger.error(f"Failed to create Vipps checkout: {str(e)}")

        # Update order status to failed
        order.status = "payment_failed"
        order.payment_status = "failed"

        # Add log entry
        error_log = OrderLog(
            order_id=order.id,
            created_by_type="system",
            message=f"Vipps checkout feilet: {str(e)}"
        )
        db.add(error_log)
        db.commit()

        raise HTTPException(
            status_code=500,
            detail=f"Kunne ikke opprette Vipps checkout: {str(e)}"
        )


@router.get("/checkout/{reference}", response_model=CheckoutStatusResponse)
async def get_checkout_status(
    reference: str,
    db: Session = Depends(get_db)
):
    """
    Get the status of a checkout/order by reference (order_number).
    """
    order = db.query(Order).filter(Order.order_number == reference).first()


    if not order:
        raise HTTPException(status_code=404, detail="Ordre ikke funnet")

    return CheckoutStatusResponse(
        order_id=order.id,
        order_number=order.order_number,
        status=order.status,
        payment_status=order.payment_status or "pending",
        total_amount=order.total_amount,
        shipping_amount=order.shipping_amount,
        currency=order.currency,
    )
