from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.lead import Lead
from app.models.campaign import Campaign
from app.models.scrape_job import ScrapeJob
from app.models.outreach import Outreach

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    # Total Leads
    total_leads_res = await db.execute(select(func.count(Lead.id)))
    total_leads = total_leads_res.scalar_one()

    # Enriched Leads
    enriched_res = await db.execute(select(func.count(Lead.id)).where(Lead.email.isnot(None), Lead.email != ""))
    enriched_emails = enriched_res.scalar_one()

    # Qualified Leads
    qualified_res = await db.execute(select(func.count(Lead.id)).where(Lead.icp_score >= 70))
    qualified_leads = qualified_res.scalar_one()

    # Outreached
    outreach_res = await db.execute(select(func.count(Outreach.id)))
    total_outreaches = outreach_res.scalar_one()

    # Active Campaigns
    campaigns_res = await db.execute(select(func.count(Campaign.id)))
    total_campaigns = campaigns_res.scalar_one()

    # Pipeline Status Breakdown
    status_counts_res = await db.execute(
        select(Lead.status, func.count(Lead.id)).group_by(Lead.status)
    )
    status_breakdown = {row[0]: row[1] for row in status_counts_res.all()}

    # Recent Leads
    recent_leads_res = await db.execute(select(Lead).order_by(Lead.created_at.desc()).limit(8))
    recent_leads = recent_leads_res.scalars().all()

    # Category breakdown
    category_res = await db.execute(
        select(Lead.category, func.count(Lead.id))
        .where(Lead.category.isnot(None))
        .group_by(Lead.category)
        .order_by(func.count(Lead.id).desc())
        .limit(6)
    )
    category_breakdown = [{"category": row[0], "count": row[1]} for row in category_res.all()]

    return {
        "kpis": {
            "total_leads": total_leads,
            "leads_with_email": enriched_emails,
            "qualified_leads": qualified_leads,
            "total_outreaches": total_outreaches,
            "active_campaigns": total_campaigns,
            "enrichment_rate": round((enriched_emails / total_leads * 100), 1) if total_leads > 0 else 0,
            "qualification_rate": round((qualified_leads / total_leads * 100), 1) if total_leads > 0 else 0
        },
        "status_breakdown": status_breakdown,
        "category_breakdown": category_breakdown,
        "recent_leads": recent_leads
    }
