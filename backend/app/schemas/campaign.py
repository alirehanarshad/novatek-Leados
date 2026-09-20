from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class CampaignBase(BaseModel):
    name: str
    description: Optional[str] = None
    target_category: Optional[str] = None
    target_location: Optional[str] = None
    icp_description: Optional[str] = None
    status: str = "active"

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_category: Optional[str] = None
    target_location: Optional[str] = None
    icp_description: Optional[str] = None
    status: Optional[str] = None

class CampaignResponse(CampaignBase):
    id: int
    user_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    lead_count: Optional[int] = 0

    class Config:
        from_attributes = True
