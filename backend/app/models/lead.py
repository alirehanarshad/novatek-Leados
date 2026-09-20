from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    campaign_id: Mapped[int] = mapped_column(Integer, ForeignKey("campaigns.id"), nullable=True, index=True)
    
    # Discovery Info
    place_id: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(255), index=True, nullable=True)
    categories_raw: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Location
    address: Mapped[str] = mapped_column(String(500), nullable=True)
    city: Mapped[str] = mapped_column(String(100), index=True, nullable=True)
    state: Mapped[str] = mapped_column(String(100), nullable=True)
    country: Mapped[str] = mapped_column(String(100), nullable=True)
    postcode: Mapped[str] = mapped_column(String(50), nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=True)
    
    # Contact & Online Presence
    phone: Mapped[str] = mapped_column(String(100), nullable=True)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=True)
    website: Mapped[str] = mapped_column(String(500), nullable=True)
    
    # Social links
    linkedin_url: Mapped[str] = mapped_column(String(500), nullable=True)
    facebook_url: Mapped[str] = mapped_column(String(500), nullable=True)
    instagram_url: Mapped[str] = mapped_column(String(500), nullable=True)
    twitter_url: Mapped[str] = mapped_column(String(500), nullable=True)
    
    # Ratings & Reputation
    rating: Mapped[float] = mapped_column(Float, nullable=True)
    review_count: Mapped[int] = mapped_column(Integer, nullable=True)

    # Scraped Website Data
    scraped_title: Mapped[str] = mapped_column(String(500), nullable=True)
    scraped_meta_desc: Mapped[str] = mapped_column(Text, nullable=True)
    scraped_body_snippet: Mapped[str] = mapped_column(Text, nullable=True)
    crawl_status: Mapped[str] = mapped_column(String(50), default="pending") # pending, completed, failed, no_website

    # AI Qualification & Enrichment
    icp_score: Mapped[int] = mapped_column(Integer, nullable=True) # 0 to 100
    ai_qualification_summary: Mapped[str] = mapped_column(Text, nullable=True)
    ai_pain_points: Mapped[str] = mapped_column(Text, nullable=True)
    ai_value_prop: Mapped[str] = mapped_column(Text, nullable=True)
    ai_provider_used: Mapped[str] = mapped_column(String(50), nullable=True)
    
    # SMB ICP & Location Intelligence
    smb_tier: Mapped[str] = mapped_column(String(50), default="SMALL", nullable=True) # MICRO, SMALL, GROWING_SMALL, REJECTED_ENTERPRISE
    recommended_service: Mapped[str] = mapped_column(String(255), nullable=True)
    google_maps_url: Mapped[str] = mapped_column(String(500), nullable=True)

    # Pipeline & CRM Status
    status: Mapped[str] = mapped_column(String(50), default="discovered", index=True) 
    # discovered, enriched, qualified, contacted, meeting_booked, closed_won, disqualified

    # Flexible metadata
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    campaign = relationship("Campaign", back_populates="leads")
    outreaches = relationship("Outreach", back_populates="lead", cascade="all, delete-orphan")
