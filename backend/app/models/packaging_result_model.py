from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class PackagingResult(Base):
    __tablename__ = "packaging_results"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True, index=True)
    recommended_box = Column(String(100), nullable=False)
    confidence_score = Column(Float, nullable=False)
    efficiency_score = Column(Float, nullable=False)
    baseline_cost = Column(Float, nullable=False, default=0.0)
    optimized_cost = Column(Float, nullable=False, default=0.0)
    savings = Column(Float, nullable=False, default=0.0)
    decision_explanation = Column(Text, nullable=True)
    alternative_boxes = Column(Text, nullable=True)  # JSON string
    box_dimensions = Column(String(100), nullable=True)  # LxWxH
    prediction_source = Column(String(50), default="rule_based")  # rule_based or ml
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="packaging_result")

    def __repr__(self):
        return f"<PackagingResult id={self.id} order_id={self.order_id} box={self.recommended_box}>"
