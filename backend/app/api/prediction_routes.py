from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user, decode_token
from app.models.user_model import User
from app.schemas.prediction_schema import PredictionRequest, PredictionResponse
from app.services.prediction_service import predict_packaging
from app.services.websocket_service import manager
import logging
import json

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Predictions"])

@router.post("/predict-packaging", response_model=PredictionResponse)
async def predict(
    req: PredictionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Run packaging optimization prediction for an order."""
    try:
        result = predict_packaging(req.length, req.width, req.height, req.weight)
        return PredictionResponse(
            order_id=req.order_id,
            recommended_box=result["recommended_box"],
            confidence_score=result["confidence_score"],
            efficiency_score=result["efficiency_score"],
            baseline_cost=result["baseline_cost"],
            optimized_cost=result["optimized_cost"],
            savings=result["savings"],
            decision_explanation=result["decision_explanation"],
            alternative_boxes=result["alternative_boxes"],
            box_dimensions=result["box_dimensions"],
            prediction_source=result["prediction_source"],
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail="Prediction service error")

@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """WebSocket endpoint for real-time dashboard updates."""
    try:
        payload = decode_token(token)
        user_email = payload.get("sub")
        if not user_email:
            await websocket.close(code=4001)
            return
        # Use a hash of email as user identifier for WS
        user_id = hash(user_email) % 100000
    except Exception:
        await websocket.close(code=4001)
        return

    await manager.connect(websocket, user_id)
    try:
        await websocket.send_text(json.dumps({"type": "connected", "message": "Real-time updates active"}))
        while True:
            # Keep connection alive, handle client pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
