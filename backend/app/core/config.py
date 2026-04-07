from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Packaging Automation Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database — Render gives postgres://, we fix both variants automatically
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/packaging_db"
    DATABASE_SYNC_URL: str = "postgresql://postgres:password@localhost:5432/packaging_db"

    def __init__(self, **values):
        # Render or users sometimes inject literal double quotes in env vars
        for k, v in list(os.environ.items()):
            try:
                if isinstance(v, str) and len(v) >= 2 and v[0] == v[-1] and v[0] in ('"', "'"):
                    os.environ[k] = v[1:-1]
            except Exception:
                pass
        
        
        super().__init__(**values)
        # Render provides DATABASE_URL as postgres:// — fix for asyncpg
        raw = os.environ.get("DATABASE_URL", "")
        if raw.startswith("postgres://"):
            object.__setattr__(self, "DATABASE_URL", raw.replace("postgres://", "postgresql+asyncpg://", 1))
            object.__setattr__(self, "DATABASE_SYNC_URL", raw.replace("postgres://", "postgresql://", 1))
        elif raw.startswith("postgresql://") and "+asyncpg" not in raw:
            object.__setattr__(self, "DATABASE_URL", raw.replace("postgresql://", "postgresql+asyncpg://", 1))
            object.__setattr__(self, "DATABASE_SYNC_URL", raw)

    # JWT
    SECRET_KEY: str = "super-secret-key-change-in-production-please"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # ML Model
    ML_MODEL_PATH: str = "ml_engine/packaging_model.pkl"

    # Shipping Rates (₹ per kg)
    SHIPPING_RATE_PER_KG: float = 45.0
    DIM_WEIGHT_DIVISOR: float = 5000.0

    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
