from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class OrderLog(Base):
    __tablename__ = "order_logs"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    created_by_type = Column(String, nullable=False)  # 'system' or 'admin'
    created_by_admin_id = Column(Integer, ForeignKey("admin_users.id"), nullable=True)  # Only set if created_by_type is 'admin'
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    order = relationship("Order", back_populates="logs")
    created_by_admin = relationship("AdminUser")
