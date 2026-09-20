import logging
import httpx
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db, AsyncSessionLocal
from app.core.config import settings
from app.models.setting import SystemSetting
from app.services.geoapify_service import geoapify_service
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/settings", tags=["System Settings & API Keys"])

class APIKeysUpdateRequest(BaseModel):
    geoapify_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None

class TestKeyRequest(BaseModel):
    service: str # "geoapify", "groq", "openai", "gemini"
    api_key: Optional[str] = None

def mask_key(key: Optional[str]) -> Optional[str]:
    if not key or len(key) < 8:
        return None
    return f"{key[:6]}...{key[-4:]}"

async def load_dynamic_settings():
    """Loads saved settings from database into running services on startup."""
    async with AsyncSessionLocal() as session:
        try:
            res = await session.execute(select(SystemSetting))
            rows = res.scalars().all()
            for r in rows:
                if r.key == "GEOAPIFY_API_KEY" and r.value:
                    settings.GEOAPIFY_API_KEY = r.value
                    geoapify_service.api_key = r.value
                elif r.key == "GROQ_API_KEY" and r.value:
                    settings.GROQ_API_KEY = r.value
                    ai_service.groq_key = r.value
                elif r.key == "OPENAI_API_KEY" and r.value:
                    settings.OPENAI_API_KEY = r.value
                    ai_service.openai_key = r.value
                elif r.key == "GEMINI_API_KEY" and r.value:
                    settings.GEMINI_API_KEY = r.value
                    ai_service.gemini_key = r.value
        except Exception as e:
            logger.debug(f"Dynamic settings load check: {e}")

@router.get("/keys")
async def get_configured_keys(db: AsyncSession = Depends(get_db)):
    """Returns status and masked previews of all active API keys."""
    # Check DB overrides first
    res = await db.execute(select(SystemSetting))
    db_keys = {r.key: r.value for r in res.scalars().all()}

    geo_key = db_keys.get("GEOAPIFY_API_KEY") or settings.GEOAPIFY_API_KEY
    groq_key = db_keys.get("GROQ_API_KEY") or settings.GROQ_API_KEY
    openai_key = db_keys.get("OPENAI_API_KEY") or settings.OPENAI_API_KEY
    gemini_key = db_keys.get("GEMINI_API_KEY") or settings.GEMINI_API_KEY

    return {
        "geoapify": {
            "configured": bool(geo_key),
            "masked": mask_key(geo_key),
            "description": "Places discovery & Geocoding Engine"
        },
        "groq": {
            "configured": bool(groq_key),
            "masked": mask_key(groq_key),
            "description": "Ultra-fast Llama-3.3 / GPT-OSS AI Qualification"
        },
        "openai": {
            "configured": bool(openai_key),
            "masked": mask_key(openai_key),
            "description": "GPT-4o & GPT-4o-mini Lead Intelligence"
        },
        "gemini": {
            "configured": bool(gemini_key),
            "masked": mask_key(gemini_key),
            "description": "Google Gemini 1.5 Flash Multimodal"
        }
    }

@router.post("/keys")
async def update_configured_keys(
    payload: APIKeysUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Updates API keys dynamically in database and active memory services."""
    key_mapping = {
        "GEOAPIFY_API_KEY": payload.geoapify_api_key,
        "GROQ_API_KEY": payload.groq_api_key,
        "OPENAI_API_KEY": payload.openai_api_key,
        "GEMINI_API_KEY": payload.gemini_api_key,
    }

    updated = []
    for key_name, key_val in key_mapping.items():
        if key_val is not None:
            clean_val = key_val.strip()
            # Find existing or create
            res = await db.execute(select(SystemSetting).where(SystemSetting.key == key_name))
            setting_obj = res.scalars().first()
            if not setting_obj:
                setting_obj = SystemSetting(key=key_name, value=clean_val)
                db.add(setting_obj)
            else:
                setting_obj.value = clean_val

            # Apply immediately to active in-memory singletons
            if key_name == "GEOAPIFY_API_KEY":
                settings.GEOAPIFY_API_KEY = clean_val
                geoapify_service.api_key = clean_val
            elif key_name == "GROQ_API_KEY":
                settings.GROQ_API_KEY = clean_val
                ai_service.groq_key = clean_val
            elif key_name == "OPENAI_API_KEY":
                settings.OPENAI_API_KEY = clean_val
                ai_service.openai_key = clean_val
            elif key_name == "GEMINI_API_KEY":
                settings.GEMINI_API_KEY = clean_val
                ai_service.gemini_key = clean_val

            updated.append(key_name)

    await db.commit()
    return {"message": f"Successfully updated {len(updated)} API key(s) in active runtime.", "updated": updated}

@router.post("/test-key")
async def test_api_key(req: TestKeyRequest, db: AsyncSession = Depends(get_db)):
    """Validates an API key against the live upstream service."""
    service = req.service.lower()
    key_to_test = req.api_key

    if not key_to_test:
        # Fallback to current configured key
        res = await db.execute(select(SystemSetting).where(SystemSetting.key == f"{service.upper()}_API_KEY"))
        setting_obj = res.scalars().first()
        key_to_test = setting_obj.value if setting_obj else getattr(settings, f"{service.upper()}_API_KEY", None)

    if not key_to_test:
        raise HTTPException(status_code=400, detail=f"No API key provided for {service}")

    # 1. Test Geoapify
    if service == "geoapify":
        try:
            url = f"https://api.geoapify.com/v1/geocode/search?text=London&apiKey={key_to_test}&limit=1"
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    return {"success": True, "message": "Geoapify API key is valid and connected!"}
                else:
                    return {"success": False, "message": f"Geoapify returned HTTP {resp.status_code}: {resp.text[:100]}"}
        except Exception as e:
            return {"success": False, "message": f"Geoapify connection error: {e}"}

    # 2. Test Groq
    elif service == "groq":
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {key_to_test}"},
                    json={
                        "model": "openai/gpt-oss-120b",
                        "messages": [{"role": "user", "content": "Ping"}],
                        "max_tokens": 5
                    }
                )
                if resp.status_code == 200:
                    return {"success": True, "message": "Groq AI API key is valid and operating at ultra-high speed!"}
                else:
                    return {"success": False, "message": f"Groq returned HTTP {resp.status_code}: {resp.text[:100]}"}
        except Exception as e:
            return {"success": False, "message": f"Groq connection error: {e}"}

    # 3. Test OpenAI
    elif service == "openai":
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {key_to_test}"}
                )
                if resp.status_code == 200:
                    return {"success": True, "message": "OpenAI API key is verified and operational!"}
                else:
                    return {"success": False, "message": f"OpenAI returned HTTP {resp.status_code}: {resp.text[:100]}"}
        except Exception as e:
            return {"success": False, "message": f"OpenAI connection error: {e}"}

    # 4. Test Gemini
    elif service == "gemini":
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key_to_test}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    return {"success": True, "message": "Google Gemini API key is valid!"}
                else:
                    return {"success": False, "message": f"Gemini returned HTTP {resp.status_code}: {resp.text[:100]}"}
        except Exception as e:
            return {"success": False, "message": f"Gemini connection error: {e}"}

    raise HTTPException(status_code=400, detail=f"Unsupported service: {service}")
