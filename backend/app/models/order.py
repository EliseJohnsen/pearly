from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import random
import string

def generate_order_number():
    """Generate a readable 8-character order number (e.g. 'PRL-A3X9')"""
    chars = string.ascii_uppercase + string.digits
    code = ''.join(random.choices(chars, k=4))
    return f"PRL-{code}"

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True, nullable=False, default=generate_order_number)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    status = Column(String, nullable=False)
    payment_status = Column(String, default="pending")  # pending, paid, failed, cancelled
    vipps_reference = Column(String, nullable=True, index=True)  # Vipps checkout session reference
    total_amount = Column(Integer)
    currency = Column(String, default="NOK")
    shipping_method_id = Column(String, nullable=True)  # ID of selected shipping option
    shipping_amount = Column(Integer, nullable=True)  # Shipping cost in øre
    shipping_tracking_number = Column(String, nullable=True)  # Tracking number set by admin
    shipping_tracking_url = Column(String, nullable=True)  # Tracking url set by admin
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    customer = relationship("Customer", back_populates="orders")
    order_lines = relationship("OrderLine", back_populates="order", cascade="all, delete-orphan")
    addresses = relationship("Address", back_populates="order", cascade="all, delete-orphan")
    logs = relationship("OrderLog", back_populates="order", cascade="all, delete-orphan")
