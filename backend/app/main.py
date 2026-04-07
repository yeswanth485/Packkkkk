from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import init_db, check_db_connection
from app.api.auth_routes import router as auth_router
from app.api.orders_routes import router as orders_router
from app.api.prediction_routes import router as prediction_router
from app.services.prediction_service import load_ml_model
import logging
import time

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting AI Packaging Automation Platform...")
    try:
        await init_db()
    except Exception as e:
        logger.error(f"CRITICAL: Failed to initialize database: {e}")
        logger.error("The backend will start, but database-dependent features will fail.")
    
    load_ml_model()
    db_ok = await check_db_connection()
    logger.info(f"Database connected: {db_ok}")
    logger.info("Server ready.")
    yield
    # Shutdown
    logger.info("Shutting down...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered packaging optimization platform",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

import os as _os
_allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
]
# Add Render frontend URL if set
_frontend_url = _os.environ.get("FRONTEND_URL", "")
if _frontend_url:
    _allowed_origins.append(_frontend_url.rstrip("/"))
# In production allow all onrender.com subdomains + any custom domain
_allowed_origins.append("https://*.onrender.com")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(orders_router)
app.include_router(prediction_router)

@app.get("/health")
async def health():
    db_ok = await check_db_connection()
    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "version": settings.APP_VERSION,
        "timestamp": time.time(),
    }

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
