from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class AIQualifyRequest(BaseModel):
    lead_ids: List[int]
    icp_description: Optional[str] = "B2B client looking for premium digital transformation, marketing, or software services with active website and clear contact details."
    provider: Optional[str] = "groq" # openai, gemini, groq
    model_name: Optional[str] = None

class AIColdEmailRequest(BaseModel):
    lead_id: int
    sender_name: str
    sender_company: str
    offer_summary: str
    tone: Optional[str] = "conversational and value-driven" # direct, warm, consultative
    provider: Optional[str] = "groq" # openai, gemini, groq

class AIColdEmailResponse(BaseModel):
    lead_id: int
    subject: str
    body: str
    call_to_action: str
    ai_provider: str
    model_used: str

class SendEmailRequest(BaseModel):
    lead_id: int
    subject: str
    body: str
    recipient_email: str
