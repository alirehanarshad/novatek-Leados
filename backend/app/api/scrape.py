import asyncio
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db, AsyncSessionLocal
from app.models.lead import Lead
from app.models.scrape_job import ScrapeJob
from app.schemas.scrape import GeoapifyScrapeRequest, WebCrawlRequest, ScrapeJobResponse
from app.services.geoapify_service import geoapify_service
from app.services.crawler_service import crawler_service
from app.services.ai_service import ai_service
from app.services.icp_service import icp_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/scrape", tags=["Scraping & Discovery"])

async def _process_geoapify_job(job_id: int, request_data: dict):
    async with AsyncSessionLocal() as session:
        try:
            job_result = await session.execute(select(ScrapeJob).where(ScrapeJob.id == job_id))
            job = job_result.scalars().first()
            if not job:
                return

            job.status = "running"
            await session.commit()

            # 1. Query Geoapify with requested limit
            places = await geoapify_service.search_places(
                categories=request_data["categories"],
                city=request_data.get("city"),
                country_code=request_data.get("country_code"),
                lat=request_data.get("latitude"),
                lon=request_data.get("longitude"),
                radius_meters=request_data.get("radius_meters", 5000),
                limit=request_data.get("limit", 50)
            )

            job.total_found = len(places)
            await session.commit()

            require_contact = request_data.get("require_contact", True)
            require_website = request_data.get("require_website", False)
            auto_enrich = request_data.get("auto_enrich_websites", True)
            auto_qualify = request_data.get("auto_ai_qualify", False)
            provider = request_data.get("ai_provider", "groq")

            processed_leads: List[Lead] = []
            enriched_count = 0

            # Process candidates concurrently in chunks
            async def process_candidate(p: Dict[str, Any]) -> Optional[Lead]:
                nonlocal enriched_count
                name = p.get("name", "Unnamed")
                category = p.get("category", "commercial")
                
                # 1. Hard Exclusion Pre-Filter (Discard McDonald's, Starbucks, 7-Eleven, Aldi, Banks, Enterprise)
                is_rejected, reject_reason = icp_service.is_hard_rejected(name, category, p.get("metadata_json"))
                if is_rejected:
                    logger.info(f"Pre-filter excluded enterprise chain: {name} ({reject_reason})")
                    return None

                # Check if place_id already exists in database
                existing = await session.execute(select(Lead).where(Lead.place_id == p["place_id"]))
                if existing.scalars().first():
                    return None

                phone = p.get("phone")
                email = p.get("email")
                website = p.get("website")
                scraped_data: Dict[str, Any] = {}

                # 2. Deep Website & Contact Discovery
                if auto_enrich:
                    if not website and name:
                        website = await crawler_service.find_website_for_lead(name, p.get("city") or request_data.get("city"))

                    if website:
                        scraped_data = await crawler_service.crawl_lead_website(website)
                        if scraped_data.get("primary_email") and not email:
                            email = scraped_data["primary_email"]
                        if scraped_data.get("primary_phone") and not phone:
                            phone = scraped_data["primary_phone"]

                    # Fallback search if still missing both phone and email
                    if not email and not phone and name:
                        fallback_c = await crawler_service.search_fallback_contacts(name, p.get("city") or request_data.get("city"))
                        if fallback_c.get("phone"):
                            phone = fallback_c["phone"]
                        if fallback_c.get("email"):
                            email = fallback_c["email"]

                # 3. Strict Contact & Website Accuracy Filter
                if require_contact and not (email or phone):
                    logger.info(f"Skipping lead '{name}' — no reachable phone or email found.")
                    return None

                if require_website and not website:
                    logger.info(f"Skipping lead '{name}' — no website found.")
                    return None

                # 4. Generate Google Maps Location Pin
                maps_url = icp_service.generate_google_maps_url(
                    name=name,
                    address=p.get("address"),
                    lat=p.get("latitude"),
                    lon=p.get("longitude")
                )

                # 5. Baseline Deterministic SMB Scoring & Service Recommendation
                snippet_text = scraped_data.get("scraped_body_snippet") or scraped_data.get("scraped_meta_desc")
                smb_calc = icp_service.calculate_smb_fit_score(
                    lead_name=name,
                    category=category,
                    website=website,
                    scraped_text=snippet_text,
                    email=email,
                    phone=phone
                )

                lead = Lead(
                    place_id=p["place_id"],
                    name=name,
                    category=category,
                    categories_raw=p.get("categories_raw"),
                    address=p.get("address"),
                    city=p.get("city") or request_data.get("city"),
                    state=p.get("state"),
                    country=p.get("country"),
                    postcode=p.get("postcode"),
                    latitude=p.get("latitude"),
                    longitude=p.get("longitude"),
                    phone=phone,
                    email=email,
                    website=website,
                    google_maps_url=maps_url,
                    smb_tier=smb_calc["tier"],
                    recommended_service=smb_calc["recommended_service"],
                    icp_score=smb_calc["smb_fit_score"],
                    campaign_id=request_data.get("campaign_id"),
                    linkedin_url=scraped_data.get("linkedin_url"),
                    facebook_url=scraped_data.get("facebook_url"),
                    instagram_url=scraped_data.get("instagram_url"),
                    twitter_url=scraped_data.get("twitter_url"),
                    scraped_title=scraped_data.get("scraped_title"),
                    scraped_meta_desc=scraped_data.get("scraped_meta_desc"),
                    scraped_body_snippet=snippet_text,
                    crawl_status=scraped_data.get("status") if website else "no_website",
                    status="enriched" if (phone or email or website) else "discovered",
                    metadata_json=p.get("metadata_json", {})
                )

                if website and (phone or email):
                    enriched_count += 1

                # 6. Optional Groq AI Prospect Qualification
                if auto_qualify:
                    try:
                        ai_res = await ai_service.qualify_lead(
                            lead_name=name,
                            category=category,
                            website_snippet=snippet_text or lead.address,
                            icp_description="Owner-led micro & small business seeking high-leverage single service automation.",
                            provider=provider
                        )
                        lead.icp_score = ai_res.get("icp_score", lead.icp_score)
                        lead.smb_tier = ai_res.get("smb_tier", lead.smb_tier)
                        if ai_res.get("recommended_service"):
                            lead.recommended_service = ai_res.get("recommended_service")
                        lead.ai_qualification_summary = ai_res.get("qualification_summary")
                        lead.ai_pain_points = ai_res.get("pain_points")
                        lead.ai_value_prop = ai_res.get("value_prop")
                        lead.ai_provider_used = provider
                        if lead.icp_score and lead.icp_score >= 70:
                            lead.status = "qualified"
                    except Exception as err:
                        logger.debug(f"AI qualify error for {name}: {err}")

                return lead

            # Execute candidates with high parallelism using asyncio.Semaphore
            sem = asyncio.Semaphore(25)

            async def bounded_process(p: Dict[str, Any]):
                async with sem:
                    return await process_candidate(p)

            results = await asyncio.gather(*[bounded_process(p) for p in places], return_exceptions=True)
            for res in results:
                if isinstance(res, Lead):
                    session.add(res)
                    processed_leads.append(res)
            await session.commit()

            job.total_processed = len(processed_leads)
            job.total_enriched = enriched_count
            job.status = "completed"
            job.completed_at = datetime.now(timezone.utc)
            await session.commit()

        except Exception as e:
            logger.error(f"Scrape job {job_id} failed: {e}", exc_info=True)
            job.status = "failed"
            job.error_message = str(e)
            await session.commit()

@router.post("/geoapify", response_model=ScrapeJobResponse)
async def start_geoapify_scrape(
    scrape_in: GeoapifyScrapeRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    job = ScrapeJob(
        source="geoapify",
        query_params=scrape_in.model_dump(),
        campaign_id=scrape_in.campaign_id,
        status="pending"
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Launch background job
    background_tasks.add_task(_process_geoapify_job, job.id, scrape_in.model_dump())
    return job

@router.post("/crawl-leads")
async def crawl_lead_websites(
    req: WebCrawlRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Lead).where(Lead.id.in_(req.lead_ids)))
    leads = result.scalars().all()
    
    enriched = 0
    for lead in leads:
        if not lead.website and lead.name:
            lead.website = await crawler_service.find_website_for_lead(lead.name, lead.city)

        if not lead.website:
            lead.crawl_status = "no_website"
            continue

        crawl_res = await crawler_service.crawl_lead_website(lead.website)
        if crawl_res["primary_email"] and not lead.email:
            lead.email = crawl_res["primary_email"]
        if crawl_res["primary_phone"] and not lead.phone:
            lead.phone = crawl_res["primary_phone"]
        if crawl_res["linkedin_url"]:
            lead.linkedin_url = crawl_res["linkedin_url"]
        if crawl_res["facebook_url"]:
            lead.facebook_url = crawl_res["facebook_url"]
        if crawl_res["instagram_url"]:
            lead.instagram_url = crawl_res["instagram_url"]
        if crawl_res["twitter_url"]:
            lead.twitter_url = crawl_res["twitter_url"]

        lead.scraped_title = crawl_res["scraped_title"]
        lead.scraped_meta_desc = crawl_res["scraped_meta_desc"]
        lead.scraped_body_snippet = crawl_res["scraped_body_snippet"]
        lead.crawl_status = crawl_res["status"]
        if lead.status == "discovered":
            lead.status = "enriched"
        enriched += 1

    await db.commit()
    return {"message": f"Successfully crawled and updated {enriched} leads."}

@router.get("/jobs", response_model=List[ScrapeJobResponse])
async def list_scrape_jobs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ScrapeJob).order_by(ScrapeJob.created_at.desc()).limit(20))
    return result.scalars().all()

@router.get("/jobs/{job_id}", response_model=ScrapeJobResponse)
async def get_scrape_job(job_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ScrapeJob).where(ScrapeJob.id == job_id))
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Scrape job not found")
    return job
