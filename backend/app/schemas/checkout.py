from pydantic import BaseModel, field_validator
from typing import List, Optional


class CheckoutOrderLineCreate(BaseModel):
    product_id: str
    name: str
    unit_price: int  # Price in øre
    quantity: int
    product_type: Optional[str] = None
    children: Optional[List['CheckoutOrderLineCreate']] = None

    @field_validator('quantity')
    @classmethod
    def quantity_must_be_non_negative(cls, v):
        if v < 0:
            raise ValueError('Quantity must be 0 or greater')
        return v


# Enable forward references for recursive model
CheckoutOrderLineCreate.model_rebuild()


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
