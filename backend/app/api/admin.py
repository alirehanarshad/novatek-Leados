import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, delete
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.models.lead import Lead
from app.models.scrape_job import ScrapeJob
from app.models.campaign import Campaign

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin Panel"])

class UserCreateAdmin(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    is_superuser: bool = False

class UserUpdateAdmin(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    password: Optional[str] = None

@router.get("/users")
async def list_users(db: AsyncSession = Depends(get_db)):
    """Lists all team users and administrators."""
    res = await db.execute(select(User).order_by(desc(User.created_at)))
    users = res.scalars().all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "is_active": u.is_active,
            "is_superuser": u.is_superuser,
            "created_at": str(u.created_at),
            "updated_at": str(u.updated_at),
        }
        for u in users
    ]

@router.post("/users")
async def create_user_admin(user_in: UserCreateAdmin, db: AsyncSession = Depends(get_db)):
    """Creates a new team user from the Admin Panel."""
    existing = await db.execute(select(User).where(User.email == user_in.email))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_active=True,
        is_superuser=user_in.is_superuser
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return {
        "id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "is_active": new_user.is_active,
        "is_superuser": new_user.is_superuser
    }

@router.patch("/users/{user_id}")
async def update_user_admin(
    user_id: int,
    user_in: UserUpdateAdmin,
    db: AsyncSession = Depends(get_db)
):
    """Updates team user role, status, or password."""
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.is_superuser is not None:
        user.is_superuser = user_in.is_superuser
    if user_in.password:
        user.hashed_password = get_password_hash(user_in.password)

    await db.commit()
    await db.refresh(user)
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser
    }

@router.delete("/users/{user_id}")
async def delete_user_admin(user_id: int, db: AsyncSession = Depends(get_db)):
    """Deletes a team user."""
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(user)
    await db.commit()
    return {"message": "User deleted successfully", "id": user_id}

@router.get("/stats")
async def get_admin_system_stats(db: AsyncSession = Depends(get_db)):
    """Provides admin oversight metrics across users, leads, campaigns, and jobs."""
    total_users = (await db.execute(select(func.count(User.id)))).scalar_one()
    total_leads = (await db.execute(select(func.count(Lead.id)))).scalar_one()
    total_campaigns = (await db.execute(select(func.count(Campaign.id)))).scalar_one()
    total_jobs = (await db.execute(select(func.count(ScrapeJob.id)))).scalar_one()

    return {
        "total_users": total_users,
        "total_leads": total_leads,
        "total_campaigns": total_campaigns,
        "total_jobs": total_jobs,
        "system_status": "operational",
        "auth_mode": "jwt_bearer"
    }
