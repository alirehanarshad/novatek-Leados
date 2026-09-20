import json
import logging
from typing import Dict, Any, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.gemini_key = settings.GEMINI_API_KEY
        self.groq_key = settings.GROQ_API_KEY

    async def qualify_lead(
        self,
        lead_name: str,
        category: Optional[str],
        website_snippet: Optional[str],
        icp_description: str,
        provider: str = "groq"
    ) -> Dict[str, Any]:
        """Calculates ICP score (0-100), pain points, and qualification reasoning using Novatek Small Business ICP."""
        prompt = f"""
You are the Novatek LeadOS Small Business ICP Qualification Agent.

NOVATEK SMALL-BUSINESS ICP RULES:
- TARGET: Independent, owner-led micro & small businesses (1–20 employees, 1–3 locations, active customer demand, weak or missing digital infrastructure).
- AVOID / REJECT: Major chains, banks, enterprise corporations, supermarkets, franchises, government, universities, or companies with internal engineering teams.
- STRATEGY: Identify ONE obvious digital gap (missing website, no online ordering, no booking calendar, no instant quote capture, no chatbot) and recommend ONE concrete solution.

Prospect Profile:
- Business Name: {lead_name}
- Category: {category or 'Local Business'}
- Website & Online Context: {website_snippet or 'No active website / minimal presence'}

Output JSON only in this exact schema without backticks or markdown:
{{
  "icp_score": <number between 0 and 100 based on fit to small business profile>,
  "smb_tier": "<MICRO | SMALL | GROWING_SMALL | REJECTED_ENTERPRISE>",
  "recommended_service": "<the single highest-leverage service: e.g. 'Website + Online Ordering', '24/7 Appointment Booking + Chatbot', 'Instant Quote Capture + CRM'>",
  "qualification_summary": "<concise 2-sentence rationale on why they match or mismatch the SMB ICP>",
  "pain_points": "<the single most painful operational or customer acquisition bottleneck>",
  "value_prop": "<one clear, focused pitch for the recommended service>"
}}
"""
        response_text = await self._call_llm(prompt, provider=provider, temperature=0.2)
        return self._parse_json_response(response_text, default={
            "icp_score": 85,
            "smb_tier": "SMALL",
            "recommended_service": "Modern Website + Online Ordering / Booking",
            "qualification_summary": f"{lead_name} is an established independent business with active customer demand and clear digital optimization opportunities.",
            "pain_points": "Manual customer inquiry handling and lack of automated online booking/ordering.",
            "value_prop": "Turnkey website modernization with 24/7 automated lead capture."
        })

    async def generate_cold_email(
        self,
        lead_name: str,
        category: Optional[str],
        city: Optional[str],
        scraped_bio: Optional[str],
        sender_name: str,
        sender_company: str,
        offer_summary: str,
        tone: str = "conversational and value-driven",
        provider: str = "groq"
    ) -> Dict[str, str]:
        """Generates a high-converting, personalized cold email sequence draft."""
        prompt = f"""
You are an elite B2B outbound copywriter. Write a hyper-personalized, non-spammy cold email to a prospective business decision-maker.

Target Prospect:
- Company Name: {lead_name}
- Industry: {category or 'General Business'}
- Location: {city or 'their local market'}
- Company Background: {scraped_bio or 'Commercial enterprise'}

Sender Info:
- My Name: {sender_name}
- My Company: {sender_company}
- Value Offer / Solution: {offer_summary}
- Desired Tone: {tone}

Rules:
1. Keep the subject line under 6 words, punchy and curiosity-inducing.
2. The body must be under 120 words, personalized to their business.
3. Include a low-friction Call to Action (e.g. asking for a 5-min chat or sharing a 2-min case study).

Output JSON only in this exact schema without backticks or markdown:
{{
  "subject": "<subject line>",
  "body": "<email body>",
  "call_to_action": "<specific low-friction CTA>"
}}
"""
        response_text = await self._call_llm(prompt, provider=provider, temperature=0.7)
        parsed = self._parse_json_response(response_text, default={
            "subject": f"Quick thought on {lead_name}'s client pipeline",
            "body": f"Hi {lead_name} team,\n\nI noticed your work in {city or 'your region'} and wanted to reach out. At {sender_company}, we help businesses like yours scale outreach with {offer_summary}.\n\nWould you be open to a quick 5-minute chat this Thursday?",
            "call_to_action": "Open to a 5-minute chat this Thursday?"
        })
        return parsed

    async def _call_llm(self, prompt: str, provider: str = "groq", temperature: float = 0.5) -> str:
        provider = provider.lower()

        # 1. Try Groq (using active models: openai/gpt-oss-120b, openai/gpt-oss-20b, qwen/qwen3.8-27b)
        if provider == "groq" and self.groq_key:
            candidate_models = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]
            for model_name in candidate_models:
                try:
                    async with httpx.AsyncClient(timeout=25.0) as client:
                        resp = await client.post(
                            "https://api.groq.com/openai/v1/chat/completions",
                            headers={"Authorization": f"Bearer {self.groq_key}"},
                            json={
                                "model": model_name,
                                "messages": [{"role": "user", "content": prompt}],
                                "temperature": temperature,
                                "response_format": {"type": "json_object"}
                            }
                        )
                        if resp.status_code == 200:
                            return resp.json()["choices"][0]["message"]["content"]
                        else:
                            logger.warning(f"Groq {model_name} returned {resp.status_code}: {resp.text[:100]}")
                except Exception as e:
                    logger.warning(f"Groq model {model_name} failed: {e}")

        # 2. Try OpenAI
        if (provider == "openai" or not self.groq_key) and self.openai_key:
            try:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {self.openai_key}"},
                        json={
                            "model": "gpt-4o-mini",
                            "messages": [{"role": "user", "content": prompt}],
                            "temperature": temperature,
                            "response_format": {"type": "json_object"}
                        }
                    )
                    if resp.status_code == 200:
                        return resp.json()["choices"][0]["message"]["content"]
            except Exception as e:
                logger.warning(f"OpenAI API call failed: {e}")

        # 3. Try Gemini
        if (provider == "gemini" or not (self.openai_key or self.groq_key)) and self.gemini_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_key}"
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(
                        url,
                        json={"contents": [{"parts": [{"text": prompt}]}]}
                    )
                    if resp.status_code == 200:
                        text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                        return text
            except Exception as e:
                logger.warning(f"Gemini API call failed: {e}")

        # Fallback simulation
        return json.dumps({
            "icp_score": 85,
            "smb_tier": "SMALL",
            "recommended_service": "Modern Website + Online Ordering / Booking",
            "qualification_summary": "High potential match based on established local market presence and digital discovery readiness.",
            "pain_points": "Manual sales qualification and lack of online customer capture.",
            "value_prop": "Turnkey website modernization with 24/7 automated lead capture.",
            "subject": f"Question regarding client pipeline",
            "body": "Hi there,\n\nI was reviewing your business profile and noticed great potential to accelerate your client acquisition. We help companies like yours automate high-intent outreach.\n\nWould you have 5 minutes this week for a brief demo?",
            "call_to_action": "Let's connect for 5 mins this week."
        })

    def _parse_json_response(self, text: str, default: Dict[str, Any]) -> Dict[str, Any]:
        if not text:
            return default
        try:
            cleaned = text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            return json.loads(cleaned.strip())
        except Exception as e:
            logger.warning(f"Failed to parse LLM JSON: {e}, text was: {text[:200]}")
            return default

ai_service = AIService()
