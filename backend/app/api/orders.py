from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.orm.attributes import flag_modified
from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.admin_user import AdminUser
from app.models.order import Order
from app.models.customer import Customer
from app.models.order_line import OrderLine
from app.models.address import Address
from app.models.order_log import OrderLog
from app.schemas.order import (
    OrderLogResponse,
    OrderLogCreate,
    OrderResponse,
    OrderListResponse,
    CustomerResponse,
    OrderLineResponse,
    AddressResponse,
    OrderCreate,
    OrderUpdate,
    OrderEmailSend,
)
from sqlalchemy import func
from app.services.email_service import email_service

router = APIRouter()


@router.post("/orders", response_model=OrderResponse, status_code=201)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db)
):
    """Create a new order with customer, order lines, and addresses"""

    # Check if customer already exists by email
    customer = db.query(Customer).filter(Customer.email == order_data.customer.email).first()

    # Create customer if doesn't exist
    if not customer:
        customer = Customer(
            name=order_data.customer.name,
            email=order_data.customer.email
        )
        db.add(customer)
        db.flush()  # Flush to get the customer.id

    # Calculate total amount from order lines
    total_amount = sum(line.unit_price * line.quantity for line in order_data.order_lines)

    # Create order
    order = Order(
        customer_id=customer.id,
        status=order_data.status,
        total_amount=total_amount,
        currency=order_data.currency
    )
    db.add(order)
    db.flush()  # Flush to get the order.id

    # Create order lines
    for line_data in order_data.order_lines:
        line_total = line_data.unit_price * line_data.quantity
        order_line = OrderLine(
            order_id=order.id,
            product_id=line_data.product_id,
            unit_price=line_data.unit_price,
            quantity=line_data.quantity,
            line_total=line_total
        )
        db.add(order_line)

    # Create addresses
    for addr_data in order_data.addresses:
        address = Address(
            order_id=order.id,
            type=addr_data.type,
            name=addr_data.name,
            address_line_1=addr_data.address_line_1,
            address_line_2=addr_data.address_line_2,
            postal_code=addr_data.postal_code,
            city=addr_data.city,
            country=addr_data.country
        )
        db.add(address)

    # Commit all changes
    db.commit()
    db.refresh(order)

    # Fetch the complete order with relationships
    order = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.order_lines),
            joinedload(Order.addresses)
        )
        .filter(Order.id == order.id)
        .first()
    )
    return _map_to_order_response(order)

@router.get("/orders")
def get_all_orders(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Get all orders from the database with customer info and order line count"""
    orders = (
        db.query(
            Order,
            Customer.name.label("customer_name"),
            Customer.email.label("customer_email"),
            func.count(OrderLine.id).label("order_line_count")
        )
        .outerjoin(Customer, Order.customer_id == Customer.id)
        .outerjoin(OrderLine, Order.id == OrderLine.order_id)
        .group_by(Order.id, Customer.name, Customer.email)
        .order_by(Order.created_at.desc())
        .all()
    )

    return [
        OrderListResponse(
            id=order.Order.id,
            order_number=order.Order.order_number,
            customer_id=order.Order.customer_id,
            customer_name=order.customer_name or "Ingen kunde",
            customer_email=order.customer_email or "",
            status=order.Order.status,
            payment_status=order.Order.payment_status,
            total_amount=order.Order.total_amount,
            currency=order.Order.currency,
            order_line_count=order.order_line_count,
            created_at=order.Order.created_at,
            updated_at=order.Order.updated_at,
        )
        for order in orders
    ]


@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Get a single order with all related data"""
    order = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.order_lines),
            joinedload(Order.addresses),
            joinedload(Order.logs)
        )
        .filter(Order.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return _map_to_order_response(order)


@router.patch("/orders/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    order_update: OrderUpdate,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Update order fields (generic endpoint for admin updates)"""

    # Get the order
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Update fields if provided
    if order_update.shipping_tracking_number is not None:
        order.shipping_tracking_number = order_update.shipping_tracking_number

    if order_update.shipping_tracking_url is not None:
        order.shipping_tracking_url = order_update.shipping_tracking_url

    if order_update.status is not None:
        order.status = order_update.status

    db.commit()
    db.refresh(order)

    # Fetch the complete order with relationships
    order = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.order_lines),
            joinedload(Order.addresses),
            joinedload(Order.logs)
        )
        .filter(Order.id == order_id)
        .first()
    )

    return _map_to_order_response(order)


@router.post("/orders/{order_id}/logs", response_model=OrderLogResponse, status_code=201)
def create_order_log(
    order_id: int,
    log_data: OrderLogCreate,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Create a new log entry for an order"""

    # Verify order exists
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Create log entry
    log = OrderLog(
        order_id=order_id,
        created_by_type="admin",
        created_by_admin_id=admin.id,
        message=log_data.message
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return OrderLogResponse(
        id=log.id,
        order_id=log.order_id,
        created_by_type=log.created_by_type,
        created_by_admin_id=log.created_by_admin_id,
        message=log.message,
        created_at=log.created_at,
    )

@router.post("/orders/{order_id}/send-email")
async def send_order_email(
    order_id: int,
    email_data: OrderEmailSend,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Send an email to the customer using a Sanity template"""

    import logging

    logger = logging.getLogger(__name__)

    print(f"=== EMAIL ENDPOINT CALLED: order_id={order_id}, template_id={email_data.template_id} ===")
    logger.info(f"Email endpoint called for order {order_id} with template {email_data.template_id}")

    try:
        # Fetch order with all relationships
        order = (
            db.query(Order)
            .options(
                joinedload(Order.customer),
                joinedload(Order.order_lines),
                joinedload(Order.addresses)
            )
            .filter(Order.id == order_id)
            .first()
        )

        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if not order.customer or not order.customer.email:
            raise HTTPException(status_code=400, detail="Order has no customer email")

        # Build variables for email template
        variables = {
            "order_number": order.order_number,
            "shipping_tracking_number": order.shipping_tracking_number or "Ikke satt",
            "shipping_tracking_url": order.shipping_tracking_url or "Ikke satt",
            "customer_name": order.customer.name,
            "customer_email": order.customer.email,
            "order_total": f"{order.total_amount / 100:.2f} {order.currency}" if order.total_amount else "0.00 NOK",
            "order_status": order.status,
            "created_at": order.created_at.strftime("%d.%m.%Y %H:%M"),
            "updated_at": order.updated_at.strftime("%d.%m.%Y %H:%M"),
        }

        # Send email
        try:
            print(f"=== SENDING EMAIL to {order.customer.email} with template {email_data.template_id} ===")
            success = await email_service.send_email(
                to=order.customer.email,
                template_id=email_data.template_id,
                variables=variables
            )
            print(f"=== EMAIL SEND RESULT: {success} ===")
        except Exception as e:
            print(f"=== EMAIL ERROR: {type(e).__name__}: {str(e)} ===")
            logger.error(f"Error sending email: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

        if not success:
            raise HTTPException(status_code=500, detail="Failed to send email - check logs for details")

        # Log the email sending
        log = OrderLog(
            order_id=order_id,
            created_by_type="admin",
            created_by_admin_id=admin.id,
            message=f"E-post sendt til kunde: {email_data.template_id}"
        )
        db.add(log)
        db.commit()

        return {"success": True, "message": "Email sent successfully"}

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error in send_order_email: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

def _map_to_order_response(
    order: Order
):
   return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        customer_id=order.customer_id,
        status=order.status,
        payment_status=order.payment_status,
        vipps_reference=order.vipps_reference,
        total_amount=order.total_amount,
        currency=order.currency,
        shipping_method_id=order.shipping_method_id,
        shipping_amount=order.shipping_amount,
        shipping_tracking_number=order.shipping_tracking_number,
        shipping_tracking_url=order.shipping_tracking_url,
        created_at=order.created_at,
        updated_at=order.updated_at,
        customer=CustomerResponse(
            id=order.customer.id,
            name=order.customer.name,
            email=order.customer.email,
            created_at=order.customer.created_at,
        ) if order.customer else None,
        order_lines=[
            OrderLineResponse(
                id=line.id,
                order_id=line.order_id,
                product_id=line.product_id,
                unit_price=line.unit_price,
                quantity=line.quantity,
                line_total=line.line_total,
            )
            for line in order.order_lines
        ],
        addresses=[
            AddressResponse(
                id=addr.id,
                order_id=addr.order_id,
                type=addr.type,
                name=addr.name,
                address_line_1=addr.address_line_1,
                address_line_2=addr.address_line_2,
                postal_code=addr.postal_code,
                city=addr.city,
                country=addr.country,
                created_at=addr.created_at,
                pick_up_point_id=addr.pick_up_point_id,
            )
            for addr in order.addresses
        ],
        logs=[
            OrderLogResponse(
                id=log.id,
                order_id=log.order_id,
                created_by_type = log.created_by_type,
                created_by_admin_id= log.created_by_admin_id,
                message=log.message,
                created_at=log.created_at,
            )
            for log in order.logs
        ],
    )

