from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user_model import User
from app.schemas.order_schema import OrderCreate, OrderResponse, OrderWithResult
from app.services.order_service import create_order, get_orders, get_order_by_id
from app.schemas.prediction_schema import AnalyticsResponse
from app.services.order_service import get_analytics
import csv
import io
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("", response_model=OrderWithResult, status_code=201)
async def create_single_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a single order and auto-trigger optimization."""
    order = await create_order(db, order_data, current_user.id)
    return order

@router.get("", response_model=list[OrderWithResult])
async def list_orders(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all orders for the current user with optimization results."""
    return await get_orders(db, current_user.id, skip, limit)

@router.get("/analytics", response_model=AnalyticsResponse)
async def analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated analytics for the current user."""
    data = await get_analytics(db, current_user.id)
    return AnalyticsResponse(
        total_orders_today=data["total_orders_today"],
        total_savings_today=data["total_savings_today"],
        avg_savings_per_order=data["avg_savings_per_order"],
        avg_efficiency_score=data["avg_efficiency_score"],
        box_usage_distribution=data["box_usage_distribution"],
        orders_per_hour=[],
        savings_trend=data["savings_trend"],
    )

@router.post("/upload-csv", status_code=201)
async def upload_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload CSV of orders and process all of them with auto-optimization."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))

    required_fields = {"product_name", "length", "width", "height", "weight"}
    if not reader.fieldnames or not required_fields.issubset(set(reader.fieldnames)):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must contain columns: {', '.join(required_fields)}"
        )

    created_orders = []
    errors = []

    for i, row in enumerate(reader):
        try:
            order_data = OrderCreate(
                product_name=row["product_name"].strip(),
                length=float(row["length"]),
                width=float(row["width"]),
                height=float(row["height"]),
                weight=float(row["weight"]),
                quantity=int(row.get("quantity", 1) or 1),
            )
            order = await create_order(db, order_data, current_user.id)
            created_orders.append(order.id)
        except Exception as e:
            errors.append({"row": i + 2, "error": str(e)})
            logger.warning(f"CSV row {i+2} error: {e}")

    return {
        "message": f"Processed {len(created_orders)} orders successfully",
        "order_ids": created_orders,
        "errors": errors,
        "total_processed": len(created_orders),
        "total_errors": len(errors),
    }

@router.get("/{order_id}", response_model=OrderWithResult)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_order_by_id(db, order_id, current_user.id)
