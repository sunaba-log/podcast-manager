"""Authentication endpoints."""

import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.middleware.auth import create_access_token, get_current_user
from app.core.database import get_db
from app.lib.validators import UserCreate, UserLogin, UserResponse
from app.models.base import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    statement = select(User).where(User.email == user_data.email)
    result = await db.execute(statement)
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create new user
    db_user = User(
        id=str(uuid.uuid4()),
        email=user_data.email,
        username=user_data.username,
        hashed_password=user_data.hash_password(),
    )
    db.add(db_user)
    await db.flush()
    await db.commit()
    await db.refresh(db_user)

    return UserResponse.from_orm(db_user)


@router.post("/login")
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login user and return JWT token."""
    # Find user
    statement = select(User).where(User.email == credentials.email)
    result = await db.execute(statement)
    user = result.scalars().first()

    if not user or not user.verify_password(credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive",
        )

    # Generate token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(data={"sub": user.id}, expires_delta=access_token_expires)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user),
    }


@router.post("/refresh")
async def refresh_token(current_user: User = Depends(get_current_user)):
    """Refresh JWT token."""
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(data={"sub": current_user.id}, expires_delta=access_token_expires)

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return UserResponse.from_orm(current_user)
