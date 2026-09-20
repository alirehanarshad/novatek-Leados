from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.lead import Lead
from app.models.outreach import Outreach
from app.schemas.ai import (
    AIQualifyRequest,
    AIColdEmailRequest,
    AIColdEmailResponse,
    SendEmailRequest
)
from app.services.ai_service import ai_service
from app.services.email_service import email_service

router = APIRouter(prefix="/ai", tags=["AI Intelligence & Outreach"])

@router.post("/qualify-batch")
async def qualify_leads_batch(
    req: AIQualifyRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Lead).where(Lead.id.in_(req.lead_ids)))
    leads = result.scalars().all()

    processed = []
    for lead in leads:
        ai_res = await ai_service.qualify_lead(
            lead_name=lead.name,
            category=lead.category,
            website_snippet=lead.scraped_meta_desc or lead.scraped_body_snippet or lead.address,
            icp_description=req.icp_description or "General high-value B2B lead",
            provider=req.provider or "groq"
        )
        lead.icp_score = ai_res.get("icp_score", 70)
        lead.ai_qualification_summary = ai_res.get("qualification_summary")
        lead.ai_pain_points = ai_res.get("pain_points")
        lead.ai_value_prop = ai_res.get("value_prop")
        lead.ai_provider_used = req.provider or "groq"
        if lead.icp_score >= 70 and lead.status in ["discovered", "enriched"]:
            lead.status = "qualified"

        processed.append({
            "lead_id": lead.id,
            "name": lead.name,
            "icp_score": lead.icp_score,
            "summary": lead.ai_qualification_summary,
            "pain_points": lead.ai_pain_points,
            "value_prop": lead.ai_value_prop
        })

    await db.commit()
    return {"message": f"Successfully evaluated {len(processed)} leads.", "results": processed}

@router.post("/generate-cold-email", response_model=AIColdEmailResponse)
async def generate_cold_email(
    req: AIColdEmailRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Lead).where(Lead.id == req.lead_id))
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    draft = await ai_service.generate_cold_email(
        lead_name=lead.name,
        category=lead.category,
        city=lead.city,
        scraped_bio=lead.scraped_meta_desc or lead.scraped_body_snippet or lead.ai_qualification_summary,
        sender_name=req.sender_name,
        sender_company=req.sender_company,
        offer_summary=req.offer_summary,
        tone=req.tone or "conversational and value-driven",
        provider=req.provider or "groq"
    )

    # Save draft to outreach table
    outreach = Outreach(
        lead_id=lead.id,
        channel="email",
        subject=draft.get("subject", "Connecting regarding your business"),
        body=draft.get("body", ""),
        ai_model=f"{req.provider}",
        status="draft",
        recipient=lead.email
    )
    db.add(outreach)
    await db.commit()

    return {
        "lead_id": lead.id,
        "subject": draft.get("subject", ""),
        "body": draft.get("body", ""),
        "call_to_action": draft.get("call_to_action", ""),
        "ai_provider": req.provider or "groq",
        "model_used": f"{req.provider}-llm"
    }

@router.post("/send-email")
async def send_outreach_email(
    req: SendEmailRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Lead).where(Lead.id == req.lead_id))
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    send_res = await email_service.send_email(
        to_email=req.recipient_email,
        subject=req.subject,
        body=req.body
    )

    outreach = Outreach(
        lead_id=lead.id,
        channel="email",
        subject=req.subject,
        body=req.body,
        status="sent" if send_res.get("success") else "failed",
        recipient=req.recipient_email,
        error_message=send_res.get("error")
    )
    db.add(outreach)
    lead.status = "contacted"
    await db.commit()

    return send_res
