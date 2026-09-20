from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, desc, asc, delete
from app.core.database import get_db
from app.models.lead import Lead
from app.models.campaign import Campaign
from app.schemas.lead import LeadCreate, LeadUpdate, LeadResponse, LeadPaginationResponse
from app.services.export_service import export_service

router = APIRouter(prefix="/leads", tags=["Leads"])

@router.get("", response_model=LeadPaginationResponse)
async def list_leads(
    search: Optional[str] = None,
    city: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    smb_tier: Optional[str] = None,
    campaign_id: Optional[int] = None,
    min_icp_score: Optional[int] = None,
    has_email: Optional[bool] = None,
    has_phone: Optional[bool] = None,
    has_website: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: AsyncSession = Depends(get_db)
):
    query = select(Lead)

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Lead.name.ilike(search_pattern),
                Lead.email.ilike(search_pattern),
                Lead.phone.ilike(search_pattern),
                Lead.address.ilike(search_pattern),
                Lead.category.ilike(search_pattern)
            )
        )

    if city:
        query = query.where(Lead.city.ilike(f"%{city}%"))
    if category:
        query = query.where(Lead.category.ilike(f"%{category}%"))
    if status:
        query = query.where(Lead.status == status)
    if smb_tier:
        query = query.where(Lead.smb_tier == smb_tier)
    if campaign_id:
        query = query.where(Lead.campaign_id == campaign_id)
    if min_icp_score is not None:
        query = query.where(Lead.icp_score >= min_icp_score)
    if has_email is True:
        query = query.where(Lead.email.isnot(None), Lead.email != "")
    if has_phone is True:
        query = query.where(Lead.phone.isnot(None), Lead.phone != "")
    if has_website is True:
        query = query.where(Lead.website.isnot(None), Lead.website != "")

    # Count total matching
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Sorting
    sort_column = getattr(Lead, sort_by, Lead.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    leads = result.scalars().all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": leads,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.post("/cleanup-unreachable")
async def cleanup_unreachable_leads(db: AsyncSession = Depends(get_db)):
    """Deletes leads that have neither an email address nor a phone number."""
    del_stmt = delete(Lead).where(
        or_(Lead.email.is_(None), Lead.email == ""),
        or_(Lead.phone.is_(None), Lead.phone == "")
    )
    result = await db.execute(del_stmt)
    await db.commit()
    return {"deleted_count": result.rowcount, "message": f"Successfully removed {result.rowcount} unreachable leads without phone/email."}

@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@router.post("", response_model=LeadResponse)
async def create_lead(lead_in: LeadCreate, db: AsyncSession = Depends(get_db)):
    lead = Lead(**lead_in.model_dump())
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return lead

@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(lead_id: int, lead_in: LeadUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    update_data = lead_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lead, field, value)

    await db.commit()
    await db.refresh(lead)
    return lead

@router.delete("/{lead_id}")
async def delete_lead(lead_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    await db.delete(lead)
    await db.commit()
    return {"message": "Lead deleted successfully", "id": lead_id}

@router.post("/export")
async def export_leads(
    format: str = Query("csv", pattern="^(csv|json|xlsx)$"),
    campaign_id: Optional[int] = None,
    status: Optional[str] = None,
    smb_tier: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Lead)
    if campaign_id:
        query = query.where(Lead.campaign_id == campaign_id)
    if status:
        query = query.where(Lead.status == status)
    if smb_tier:
        query = query.where(Lead.smb_tier == smb_tier)

    result = await db.execute(query)
    leads = result.scalars().all()

    lead_dicts = []
    for l in leads:
        lead_dicts.append({
            "ID": l.id,
            "Name": l.name,
            "Tier": l.smb_tier or "SMALL",
            "Category": l.category,
            "City": l.city,
            "Address": l.address,
            "Phone": l.phone,
            "Email": l.email,
            "Website": l.website,
            "Google Maps Link": l.google_maps_url,
            "ICP Score": l.icp_score,
            "Recommended Service": l.recommended_service,
            "AI Summary": l.ai_qualification_summary,
            "Status": l.status,
            "Created At": str(l.created_at)
        })

    if format == "csv":
        csv_data = export_service.to_csv(lead_dicts)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=novatek_leads.csv"}
        )
    elif format == "xlsx":
        excel_bytes = export_service.to_excel(lead_dicts)
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=novatek_leads.xlsx"}
        )
    else:
        json_data = export_service.to_json(lead_dicts)
        return Response(
            content=json_data,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=novatek_leads.json"}
        )
