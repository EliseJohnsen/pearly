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
    CheckoutOrderLineCreate,
)
from app.services.vipps import vipps_client
from app.services.sanity_service import SanityService
from app.services.cart_validator import CartValidator
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def create_order_lines_recursively(
    db: Session,
    order_id: int,
    lines: List[CheckoutOrderLineCreate],
    parent_line_id: Optional[int] = None
) -> List[OrderLine]:
    """
    Recursively create order lines including nested children.

    Args:
        db: Database session
        order_id: ID of the order
        lines: List of order lines to create
        parent_line_id: ID of parent line (None for top-level)

    Returns:
        List of created OrderLine objects
    """
    created_lines = []

    for line_data in lines:
        line_total = line_data.unit_price * line_data.quantity

        order_line = OrderLine(
            order_id=order_id,
            parent_line_id=parent_line_id,
            product_id=line_data.product_id,
            name=line_data.name,
            product_type=line_data.product_type,
            unit_price=line_data.unit_price,
            quantity=line_data.quantity,
            line_total=line_total
        )
        db.add(order_line)
        db.flush()  # Get the ID for potential children

        created_lines.append(order_line)

        # Recursively create children
        if line_data.children:
            child_lines = create_order_lines_recursively(
                db, order_id, line_data.children, parent_line_id=order_line.id
            )
            created_lines.extend(child_lines)

    return created_lines


def flatten_order_lines_for_vipps(lines: List[CheckoutOrderLineCreate]) -> List[dict]:
    """
    Flatten nested order lines for Vipps (which doesn't support nesting).

    Args:
        lines: Nested order lines

    Returns:
        Flat list of line dicts for Vipps
    """
    flat_lines = []

    for line in lines:
        flat_lines.append({
            "name": line.name,
            "product_id": line.product_id,
            "unit_price": line.unit_price,
            "quantity": line.quantity,
            "total_amount": line.unit_price * line.quantity,
        })

        # Add children with indented names
        if line.children:
            for child in line.children:
                flat_lines.append({
                    "name": f"  → {child.name}",  # Indent child items
                    "product_id": child.product_id,
                    "unit_price": child.unit_price,
                    "quantity": child.quantity,
                    "total_amount": child.unit_price * child.quantity,
                })
                # Note: This assumes only 2 levels. For deeper nesting, use recursion.

    return flat_lines


def calculate_total_amount(lines: List[CheckoutOrderLineCreate]) -> int:
    """
    Calculate total amount including nested children.

    Args:
        lines: Order lines (may be nested)

    Returns:
        Total amount in øre
    """
    total = 0

    for line in lines:
        total += line.unit_price * line.quantity
        if line.children:
            total += calculate_total_amount(line.children)

    return total


@router.post("/checkout", response_model=CheckoutResponse, status_code=201)
async def create_checkout(
    checkout_data: CheckoutCreate,
    db: Session = Depends(get_db)
):
    """
    Create an order and initiate Vipps Checkout session.

    Validates:
    - Product existence and availability
    - Parent-child relationships for strukturprodukter
    - Quantity constraints

    Then:
    1. Creates order with status 'pending_payment'
    2. Creates order lines (including nested children)
    3. Creates Vipps checkout session
    4. Returns checkout URL for redirect

    Note: Customer is created/linked in webhook after payment is confirmed,
    when we receive name and email from Vipps.
    """
    # CRITICAL: Validate order lines (parent-child relationships, stock, etc.)
    sanity_service = SanityService()
    validator = CartValidator(sanity_service)

    is_valid, error_message = await validator.validate_checkout_order_lines(
        checkout_data.order_lines
    )

    if not is_valid:
        logger.warning(f"Checkout validation failed: {error_message}")
        raise HTTPException(status_code=400, detail=error_message)

    # Calculate total amount (including children)
    total_amount = calculate_total_amount(checkout_data.order_lines)

    # Create order (customer will be linked after payment via webhook)
    order = Order(
        status="pending_payment",
        payment_status="pending",
        total_amount=total_amount,
        currency=checkout_data.currency
    )
    db.add(order)
    db.flush()

    # Create order lines (recursively handles children)
    create_order_lines_recursively(db, order.id, checkout_data.order_lines)

    # Create initial order log
    log = OrderLog(
        order_id=order.id,
        created_by_type="system",
        message="Ordre opprettet, venter på betaling"
    )
    db.add(log)

    db.commit()
    db.refresh(order)

    # Prepare order lines for Vipps (flatten nested structure)
    vipps_order_lines = flatten_order_lines_for_vipps(checkout_data.order_lines)

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
