import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db, AsyncSessionLocal
from app.models.lead import Lead
from app.models.campaign import Campaign
from sqlalchemy import select, func

from app.api.auth import router as auth_router
from app.api.leads import router as leads_router
from app.api.scrape import router as scrape_router
from app.api.ai import router as ai_router
from app.api.campaigns import router as campaigns_router
from app.api.dashboard import router as dashboard_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_initial_demo_data():
    async with AsyncSessionLocal() as session:
        try:
            lead_count_res = await session.execute(select(func.count(Lead.id)))
            count = lead_count_res.scalar_one()
            if count == 0:
                logger.info("Database is empty. Seeding initial demo data...")
                # Create default campaign
                camp = Campaign(
                    name="Q3 High-Intent Local Services",
                    description="Outbound pipeline for regional commercial services and medical clinics.",
                    target_category="commercial,healthcare.clinic",
                    target_location="San Francisco, CA",
                    icp_description="Mid-market local businesses with active presence seeking pipeline growth.",
                    status="active"
                )
                session.add(camp)
                await session.flush()

                # Seed sample leads
                sample_leads = [
                    Lead(
                        campaign_id=camp.id,
                        place_id="demo_place_1",
                        name="Apex Dental Care",
                        category="healthcare.clinic",
                        address="450 Sutter St #1200, San Francisco, CA 94108",
                        city="San Francisco",
                        state="CA",
                        country="United States",
                        phone="(415) 555-0192",
                        email="contact@apexdentalcare.com",
                        website="https://apexdentalcare.com",
                        linkedin_url="https://linkedin.com/company/apex-dental-sf",
                        rating=4.9,
                        review_count=128,
                        icp_score=92,
                        ai_qualification_summary="High-volume multi-practitioner clinic with prime location and strong patient review volume.",
                        ai_pain_points="Patient retention automated follow-ups, appointment reminder software integration.",
                        ai_value_prop="AI automated patient recall and outbound review acceleration.",
                        ai_provider_used="groq",
                        status="qualified",
                        crawl_status="completed",
                        scraped_title="Apex Dental Care | Premier San Francisco Dentistry",
                        scraped_meta_desc="Offering cosmetic dentistry, dental implants, and Invisalign in downtown San Francisco."
                    ),
                    Lead(
                        campaign_id=camp.id,
                        place_id="demo_place_2",
                        name="Vanguard Growth Marketing",
                        category="service.marketing",
                        address="101 Mission St, San Francisco, CA 94105",
                        city="San Francisco",
                        state="CA",
                        country="United States",
                        phone="(415) 555-0143",
                        email="partnerships@vanguardgrowth.io",
                        website="https://vanguardgrowth.io",
                        linkedin_url="https://linkedin.com/company/vanguardgrowth",
                        rating=4.8,
                        review_count=42,
                        icp_score=88,
                        ai_qualification_summary="Fast-growing performance marketing agency with a strong B2B focus.",
                        ai_pain_points="Lead scraping bandwidth, hyper-personalized client prospect sourcing.",
                        ai_value_prop="Automated multi-channel prospecting intelligence for agency client acquisition.",
                        ai_provider_used="groq",
                        status="enriched",
                        crawl_status="completed",
                        scraped_title="Vanguard Growth | Scaling Tech & B2B Companies",
                        scraped_meta_desc="Data-driven growth marketing, paid acquisition, and inbound funnel architecture."
                    ),
                    Lead(
                        campaign_id=camp.id,
                        place_id="demo_place_3",
                        name="Lumina Architectural Studio",
                        category="commercial.architecture",
                        address="785 Market St, San Francisco, CA 94103",
                        city="San Francisco",
                        state="CA",
                        country="United States",
                        phone="(415) 555-0188",
                        email="hello@luminaarchitects.design",
                        website="https://luminaarchitects.design",
                        linkedin_url="https://linkedin.com/company/lumina-studio",
                        rating=5.0,
                        review_count=19,
                        icp_score=78,
                        ai_qualification_summary="Boutique high-end residential and commercial architecture practice.",
                        ai_pain_points="Commercial developer networking, RFP procurement pipelines.",
                        ai_value_prop="Targeted outreach to commercial property managers and real estate funds.",
                        ai_provider_used="openai",
                        status="discovered",
                        crawl_status="completed",
                        scraped_title="Lumina Studio | Modern Architecture & Sustainable Design",
                        scraped_meta_desc="Award-winning architecture and urban design studio based in San Francisco."
                    ),
                    Lead(
                        campaign_id=camp.id,
                        place_id="demo_place_4",
                        name="Horizon Wealth Partners",
                        category="financial.bank",
                        address="555 California St, San Francisco, CA 94104",
                        city="San Francisco",
                        state="CA",
                        country="United States",
                        phone="(415) 555-0177",
                        email="advisory@horizonwealth.com",
                        website="https://horizonwealth.com",
                        rating=4.7,
                        review_count=56,
                        icp_score=85,
                        ai_qualification_summary="Independent wealth advisory firm managing accredited investor portfolios.",
                        ai_pain_points="HNW lead generation and automated event webinar booking.",
                        ai_value_prop="High-trust relationship outreach campaigns for private wealth clients.",
                        ai_provider_used="gemini",
                        status="contacted",
                        crawl_status="completed"
                    ),
                ]
                for l in sample_leads:
                    session.add(l)
                await session.commit()
                logger.info("Initial demo leads seeded successfully.")
        except Exception as e:
            logger.warning(f"Could not seed demo data: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database...")
    await init_db()
    await seed_initial_demo_data()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="Enterprise AI-Powered Lead Intelligence & Outbound OS",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router, prefix="/api")
app.include_router(leads_router, prefix="/api")
app.include_router(scrape_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(campaigns_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "features": {
            "geoapify": bool(settings.GEOAPIFY_API_KEY),
            "openai": bool(settings.OPENAI_API_KEY),
            "gemini": bool(settings.GEMINI_API_KEY),
            "groq": bool(settings.GROQ_API_KEY),
            "smtp": bool(settings.SMTP_HOST and settings.SMTP_USER),
            "storage": bool(settings.STORAGE_BUCKET)
        }
    }
