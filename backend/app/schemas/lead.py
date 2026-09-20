from typing import Optional, Dict, Any, List
from pydantic import BaseModel, HttpUrl
from datetime import datetime

class LeadBase(BaseModel):
    name: str
    category: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postcode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    twitter_url: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    smb_tier: Optional[str] = "SMALL"
    recommended_service: Optional[str] = None
    google_maps_url: Optional[str] = None
    status: str = "discovered"
    campaign_id: Optional[int] = None

class LeadCreate(LeadBase):
    place_id: Optional[str] = None
    categories_raw: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    twitter_url: Optional[str] = None
    status: Optional[str] = None
    campaign_id: Optional[int] = None
    icp_score: Optional[int] = None
    smb_tier: Optional[str] = None
    recommended_service: Optional[str] = None
    google_maps_url: Optional[str] = None
    ai_qualification_summary: Optional[str] = None
    ai_pain_points: Optional[str] = None
    ai_value_prop: Optional[str] = None

class LeadFilter(BaseModel):
    search: Optional[str] = None
    city: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    smb_tier: Optional[str] = None
    campaign_id: Optional[int] = None
    min_icp_score: Optional[int] = None
    has_email: Optional[bool] = None
    has_phone: Optional[bool] = None
    has_website: Optional[bool] = None
    page: int = 1
    page_size: int = 50
    sort_by: str = "created_at"
    sort_order: str = "desc"

class LeadResponse(LeadBase):
    id: int
    place_id: Optional[str] = None
    scraped_title: Optional[str] = None
    scraped_meta_desc: Optional[str] = None
    scraped_body_snippet: Optional[str] = None
    crawl_status: Optional[str] = "pending"
    icp_score: Optional[int] = None
    smb_tier: Optional[str] = "SMALL"
    recommended_service: Optional[str] = None
    google_maps_url: Optional[str] = None
    ai_qualification_summary: Optional[str] = None
    ai_pain_points: Optional[str] = None
    ai_value_prop: Optional[str] = None
    ai_provider_used: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LeadPaginationResponse(BaseModel):
    items: List[LeadResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
