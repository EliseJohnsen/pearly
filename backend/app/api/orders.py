from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
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
)
from sqlalchemy import func

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

    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        customer_id=order.customer_id,
        status=order.status,
        total_amount=order.total_amount,
        currency=order.currency,
        created_at=order.created_at,
        updated_at=order.updated_at,
        customer=CustomerResponse(
            id=order.customer.id,
            name=order.customer.name,
            email=order.customer.email,
            created_at=order.customer.created_at,
        ),
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
            )
            for addr in order.addresses
        ],
    )


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
        .join(Customer, Order.customer_id == Customer.id)
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
            customer_name=order.customer_name,
            customer_email=order.customer_email,
            status=order.Order.status,
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

    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        customer_id=order.customer_id,
        status=order.status,
        total_amount=order.total_amount,
        currency=order.currency,
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
