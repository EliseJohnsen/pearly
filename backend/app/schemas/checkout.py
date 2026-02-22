from pydantic import BaseModel
from typing import List, Optional


class CheckoutOrderLineCreate(BaseModel):
    product_id: str
    name: str
    unit_price: int  # Price in øre
    quantity: int


class CheckoutCreate(BaseModel):
    order_lines: List[CheckoutOrderLineCreate]
    currency: str = "NOK"


class CheckoutResponse(BaseModel):
    order_id: int
    order_number: str
    checkout_url: str
    reference: str


class CheckoutStatusResponse(BaseModel):
    order_id: int
    order_number: str
    status: str
    payment_status: str
    total_amount: Optional[int]
    shipping_amount: Optional[int]
    currency: Optional[str]
