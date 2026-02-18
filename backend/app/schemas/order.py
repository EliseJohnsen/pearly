from pydantic import BaseModel, EmailStr
from typing import List, Optional, Literal
from datetime import datetime


class OrderLineCreate(BaseModel):
    product_id: str
    unit_price: int
    quantity: int


class AddressCreate(BaseModel):
    type: str  # 'billing' or 'shipping'
    name: str
    address_line_1: str
    address_line_2: Optional[str] = None
    postal_code: str
    city: str
    country: str = "NO"
    pick_up_point_id: Optional[str] = None


class CustomerCreate(BaseModel):
    name: str
    email: EmailStr


class OrderCreate(BaseModel):
    customer: CustomerCreate
    order_lines: List[OrderLineCreate]
    addresses: List[AddressCreate]
    status: str = "new"
    currency: str = "NOK"


class AddressResponse(BaseModel):
    id: int
    order_id: int
    type: str
    name: str
    address_line_1: str
    address_line_2: Optional[str]
    postal_code: str
    city: str
    country: str
    created_at: datetime
    pick_up_point_id: Optional[str]

    class Config:
        from_attributes = True


class OrderLineResponse(BaseModel):
    id: int
    order_id: int
    product_id: str
    unit_price: int
    quantity: int
    line_total: int

    class Config:
        from_attributes = True


class CustomerResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class OrderLogResponse(BaseModel):
    id: int
    order_id: int
    created_by_type: Literal["system", "admin"]
    created_by_admin_id: Optional[int]
    created_by_name: Optional[str] = None  # Computed field for display
    message: str
    created_at: datetime

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_id: Optional[int] = None
    status: str
    payment_status: Optional[str] = "pending"
    vipps_reference: Optional[str] = None
    total_amount: Optional[int]
    currency: Optional[str]
    shipping_method_id: Optional[str] = None
    shipping_amount: Optional[int] = None
    shipping_tracking_number: Optional[str] = None
    shipping_tracking_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Relationships
    customer: Optional[CustomerResponse] = None
    order_lines: List[OrderLineResponse] = []
    addresses: List[AddressResponse] = []
    logs: List[OrderLogResponse] = []

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    id: int
    order_number: str
    customer_id: Optional[int] = None
    customer_name: str
    customer_email: str
    status: str
    payment_status: Optional[str] = "pending"
    total_amount: Optional[int]
    currency: Optional[str]
    order_line_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Order Update Schemas
class OrderUpdate(BaseModel):
    """Generic schema for updating order fields by admin"""
    shipping_tracking_number: Optional[str] = None
    shipping_tracking_url: Optional[str] = None
    status: Optional[str] = None
    # Add more updatable fields here as needed in the future


# Order Log Schemas
class OrderLogCreate(BaseModel):
    message: str


# Order Email Schemas
class OrderEmailSend(BaseModel):
    """Schema for sending email to customer"""
    template_id: str
