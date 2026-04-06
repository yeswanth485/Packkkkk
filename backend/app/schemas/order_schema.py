from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime

class OrderCreate(BaseModel):
    product_name: str
    length: float
    width: float
    height: float
    weight: float
    quantity: int = 1

    @field_validator("length", "width", "height", "weight")
    @classmethod
    def must_be_positive(cls, v, info):
        if v <= 0:
            raise ValueError(f"{info.field_name} must be greater than 0")
        return round(v, 4)

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v):
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v

class OrderResponse(BaseModel):
    id: int
    user_id: int
    product_name: str
    length: float
    width: float
    height: float
    weight: float
    quantity: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}

class OrderWithResult(OrderResponse):
    packaging_result: Optional["PackagingResultResponse"] = None

class PackagingResultResponse(BaseModel):
    id: int
    order_id: int
    recommended_box: str
    confidence_score: float
    efficiency_score: float
    baseline_cost: float
    optimized_cost: float
    savings: float
    decision_explanation: Optional[str]
    alternative_boxes: Optional[str]
    box_dimensions: Optional[str]
    prediction_source: str
    created_at: datetime

    model_config = {"from_attributes": True}

OrderWithResult.model_rebuild()

class CSVOrderRow(BaseModel):
    order_id: Optional[str] = None
    product_name: str
    length: float
    width: float
    height: float
    weight: float
    quantity: int = 1
