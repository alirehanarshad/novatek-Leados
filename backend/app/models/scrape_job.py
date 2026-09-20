from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class ScrapeJob(Base):
    __tablename__ = "scrape_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    campaign_id: Mapped[int] = mapped_column(Integer, ForeignKey("campaigns.id"), nullable=True)
    
    source: Mapped[str] = mapped_column(String(50), default="geoapify") # geoapify, web_enrich, csv_import
    query_params: Mapped[dict] = mapped_column(JSON, default=dict)
    
    status: Mapped[str] = mapped_column(String(50), default="pending") # pending, running, completed, failed
    total_found: Mapped[int] = mapped_column(Integer, default=0)
    total_processed: Mapped[int] = mapped_column(Integer, default=0)
    total_enriched: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    user = relationship("User", back_populates="scrape_jobs")
