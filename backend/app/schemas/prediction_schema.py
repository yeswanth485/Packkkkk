from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime

class PredictionRequest(BaseModel):
    order_id: int
    length: float
    width: float
    height: float
    weight: float

    @field_validator("length", "width", "height", "weight")
    @classmethod
    def must_be_positive(cls, v, info):
        if v <= 0:
            raise ValueError(f"{info.field_name} must be greater than 0")
        return v

class AlternativeBox(BaseModel):
    box_type: str
    dimensions: str
    cost: float
    efficiency: float

class PredictionResponse(BaseModel):
    order_id: int
    recommended_box: str
    confidence_score: float
    efficiency_score: float
    baseline_cost: float
    optimized_cost: float
    savings: float
    decision_explanation: str
    alternative_boxes: List[AlternativeBox]
    box_dimensions: str
    prediction_source: str

class AnalyticsResponse(BaseModel):
    total_orders_today: int
    total_savings_today: float
    avg_savings_per_order: float
    avg_efficiency_score: float
    box_usage_distribution: dict
    orders_per_hour: List[dict]
    savings_trend: List[dict]
