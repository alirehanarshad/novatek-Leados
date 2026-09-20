from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.campaign import Campaign
from app.models.lead import Lead
from app.schemas.campaign import CampaignCreate, CampaignUpdate, CampaignResponse

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])

@router.get("", response_model=List[CampaignResponse])
async def list_campaigns(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).order_by(Campaign.created_at.desc()))
    campaigns = result.scalars().all()

    # Enrich with lead counts
    resp = []
    for c in campaigns:
        count_res = await db.execute(select(func.count(Lead.id)).where(Lead.campaign_id == c.id))
        count = count_res.scalar_one()
        c_dict = {
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "target_category": c.target_category,
            "target_location": c.target_location,
            "icp_description": c.icp_description,
            "status": c.status,
            "user_id": c.user_id,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "lead_count": count
        }
        resp.append(c_dict)
    return resp

@router.post("", response_model=CampaignResponse)
async def create_campaign(camp_in: CampaignCreate, db: AsyncSession = Depends(get_db)):
    camp = Campaign(**camp_in.model_dump())
    db.add(camp)
    await db.commit()
    await db.refresh(camp)
    return {
        "id": camp.id,
        "name": camp.name,
        "description": camp.description,
        "target_category": camp.target_category,
        "target_location": camp.target_location,
        "icp_description": camp.icp_description,
        "status": camp.status,
        "user_id": camp.user_id,
        "created_at": camp.created_at,
        "updated_at": camp.updated_at,
        "lead_count": 0
    }

@router.get("/{camp_id}", response_model=CampaignResponse)
async def get_campaign(camp_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).where(Campaign.id == camp_id))
    camp = result.scalars().first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    count_res = await db.execute(select(func.count(Lead.id)).where(Lead.campaign_id == camp.id))
    count = count_res.scalar_one()
    return {
        "id": camp.id,
        "name": camp.name,
        "description": camp.description,
        "target_category": camp.target_category,
        "target_location": camp.target_location,
        "icp_description": camp.icp_description,
        "status": camp.status,
        "user_id": camp.user_id,
        "created_at": camp.created_at,
        "updated_at": camp.updated_at,
        "lead_count": count
    }

@router.patch("/{camp_id}", response_model=CampaignResponse)
async def update_campaign(camp_id: int, camp_in: CampaignUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).where(Campaign.id == camp_id))
    camp = result.scalars().first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    update_data = camp_in.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(camp, k, v)

    await db.commit()
    await db.refresh(camp)
    return await get_campaign(camp_id, db)

@router.delete("/{camp_id}")
async def delete_campaign(camp_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).where(Campaign.id == camp_id))
    camp = result.scalars().first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    await db.delete(camp)
    await db.commit()
    return {"message": "Campaign deleted successfully", "id": camp_id}
