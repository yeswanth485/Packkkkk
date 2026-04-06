from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.order_model import Order
from app.models.packaging_result_model import PackagingResult
from app.schemas.order_schema import OrderCreate
from app.services.prediction_service import predict_packaging
from app.services.websocket_service import broadcast_update
import json
import logging

logger = logging.getLogger(__name__)

async def create_order(db: AsyncSession, order_data: OrderCreate, user_id: int) -> Order:
    order = Order(
        user_id=user_id,
        product_name=order_data.product_name,
        length=order_data.length,
        width=order_data.width,
        height=order_data.height,
        weight=order_data.weight,
        quantity=order_data.quantity,
        status="processing",
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)

    # Auto-trigger optimization
    try:
        await auto_optimize_order(db, order)
    except Exception as e:
        logger.error(f"Auto-optimization failed for order {order.id}: {e}")
        order.status = "pending"
        await db.commit()

    return order

async def auto_optimize_order(db: AsyncSession, order: Order):
    """Automatically run prediction and store result after order creation."""
    prediction = predict_packaging(order.length, order.width, order.height, order.weight)

    result = PackagingResult(
        order_id=order.id,
        recommended_box=prediction["recommended_box"],
        confidence_score=prediction["confidence_score"],
        efficiency_score=prediction["efficiency_score"],
        baseline_cost=prediction["baseline_cost"],
        optimized_cost=prediction["optimized_cost"],
        savings=prediction["savings"],
        decision_explanation=prediction["decision_explanation"],
        alternative_boxes=json.dumps(prediction["alternative_boxes"]),
        box_dimensions=prediction["box_dimensions"],
        prediction_source=prediction["prediction_source"],
    )
    db.add(result)
    order.status = "optimized"
    await db.commit()
    await db.refresh(result)

    # Broadcast real-time update
    await broadcast_update({
        "type": "order_optimized",
        "order_id": order.id,
        "product_name": order.product_name,
        "recommended_box": prediction["recommended_box"],
        "savings": prediction["savings"],
    })
    logger.info(f"Order {order.id} optimized: box={prediction['recommended_box']} savings=₹{prediction['savings']}")

async def get_orders(db: AsyncSession, user_id: int, skip: int = 0, limit: int = 100):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.packaging_result))
        .where(Order.user_id == user_id)
        .order_by(desc(Order.created_at))
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def get_order_by_id(db: AsyncSession, order_id: int, user_id: int):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.packaging_result))
        .where(Order.id == order_id, Order.user_id == user_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order

async def get_analytics(db: AsyncSession, user_id: int) -> dict:
    from sqlalchemy import cast, Date
    from datetime import date, datetime, timedelta

    today = date.today()

    # Today's orders
    today_orders = await db.execute(
        select(func.count(Order.id))
        .where(Order.user_id == user_id)
        .where(func.date(Order.created_at) == today)
    )
    total_today = today_orders.scalar() or 0

    # Today's savings
    savings_result = await db.execute(
        select(func.sum(PackagingResult.savings), func.avg(PackagingResult.savings), func.avg(PackagingResult.efficiency_score))
        .join(Order, Order.id == PackagingResult.order_id)
        .where(Order.user_id == user_id)
        .where(func.date(Order.created_at) == today)
    )
    row = savings_result.one()
    total_savings = float(row[0] or 0.0)
    avg_savings = float(row[1] or 0.0)
    avg_efficiency = float(row[2] or 0.0)

    # Box usage distribution
    box_usage_result = await db.execute(
        select(PackagingResult.recommended_box, func.count(PackagingResult.id))
        .join(Order, Order.id == PackagingResult.order_id)
        .where(Order.user_id == user_id)
        .group_by(PackagingResult.recommended_box)
    )
    box_distribution = {row[0]: row[1] for row in box_usage_result.all()}

    # Savings trend (last 7 days)
    savings_trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_result = await db.execute(
            select(func.sum(PackagingResult.savings))
            .join(Order, Order.id == PackagingResult.order_id)
            .where(Order.user_id == user_id)
            .where(func.date(Order.created_at) == day)
        )
        day_savings = float(day_result.scalar() or 0.0)
        savings_trend.append({"date": day.strftime("%d %b"), "savings": round(day_savings, 2)})

    return {
        "total_orders_today": total_today,
        "total_savings_today": round(total_savings, 2),
        "avg_savings_per_order": round(avg_savings, 2),
        "avg_efficiency_score": round(avg_efficiency, 4),
        "box_usage_distribution": box_distribution,
        "savings_trend": savings_trend,
    }
