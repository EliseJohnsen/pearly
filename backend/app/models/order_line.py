from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.core.database import Base

class OrderLine(Base):
    __tablename__ = "order_lines"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    parent_line_id = Column(Integer, ForeignKey("order_lines.id", ondelete="CASCADE"), nullable=True, index=True)
    product_id = Column(String, nullable=False)
    name = Column(String, nullable=True)
    product_type = Column(String, nullable=True)
    unit_price = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)
    line_total = Column(Integer, nullable=False)
    pattern_id = Column(Integer, ForeignKey("patterns.id", ondelete="SET NULL"), nullable=True, index=True)

    # Relationships
    order = relationship("Order", back_populates="order_lines")
    parent = relationship("OrderLine", remote_side=[id], backref="children")
    pattern = relationship("Pattern", foreign_keys=[pattern_id])
