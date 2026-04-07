from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.user_model import User
from app.schemas.user_schema import UserCreate, TokenResponse, UserResponse
from app.core.security import hash_password, verify_password, create_access_token
import logging

logger = logging.getLogger(__name__)

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def register_user(db: AsyncSession, user_data: UserCreate) -> TokenResponse:
    logger.info(f"--- Registration Start: {user_data.email} ---")
    existing = await get_user_by_email(db, user_data.email)
    if existing:
        logger.warning(f"Registration failed: Email {user_data.email} already exists")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    logger.info(f"Hashing password for {user_data.email}...")
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name,
    )
    
    logger.info(f"Saving user {user_data.email} to database...")
    db.add(user)
    await db.commit()
    logger.info(f"Database commit successful for {user_data.email}")
    
    await db.refresh(user)
    token = create_access_token({"sub": user.email})
    logger.info(f"Registration successful: {user.email}")
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user)
    )

async def login_user(db: AsyncSession, email: str, password: str) -> TokenResponse:
    logger.info(f"--- Login attempt: {email} ---")
    user = await get_user_by_email(db, email)
    if not user:
        logger.warning(f"Login failed: User {email} not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    logger.info(f"Verifying password for {email}...")
    if not verify_password(password, user.password_hash):
        logger.warning(f"Login failed: Invalid password for {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    if not user.is_active:
        logger.warning(f"Login failed: Account {email} is disabled")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")
        
    token = create_access_token({"sub": user.email})
    logger.info(f"Login successful for {user.email}")
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user)
    )
