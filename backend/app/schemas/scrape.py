from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class GeoapifyScrapeRequest(BaseModel):
    categories: List[str] # e.g. ["catering.restaurant", "commercial.health_and_beauty"]
    city: Optional[str] = None
    country_code: Optional[str] = None # e.g. "us", "gb", "de"
    radius_meters: Optional[int] = 5000 # radius around lat/lon
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    limit: int = 50
    campaign_id: Optional[int] = None
    auto_enrich_websites: bool = True
    auto_ai_qualify: bool = False
    ai_provider: Optional[str] = "groq" # openai, gemini, groq
    require_contact: bool = True # Discard leads with no phone and no email
    require_website: bool = False # Discard leads with no website

class WebCrawlRequest(BaseModel):
    lead_ids: List[int]

class ScrapeJobResponse(BaseModel):
    id: int
    source: str
    status: str
    total_found: int
    total_processed: int
    total_enriched: int
    error_message: Optional[str] = None
    query_params: Dict[str, Any]
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
