import re
import urllib.parse
from typing import Dict, Any, Tuple, Optional
from app.core.icp_config import HARD_EXCLUDE_CHAINS, TARGET_CATEGORIES

class ICPService:
    @staticmethod
    def is_hard_rejected(name: str, category: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> Tuple[bool, Optional[str]]:
        """Returns (True, reason) if lead violates hard exclusion rules (e.g. major chains, banks, enterprise)."""
        name_lower = name.lower()

        # Check against blacklist of national/international chains
        for chain in HARD_EXCLUDE_CHAINS:
            if chain in name_lower:
                return True, f"Excluded major chain or corporation ({chain.title()})"

        # Check metadata indicators if available
        if metadata:
            brand = (metadata.get("brand") or "").lower()
            for chain in HARD_EXCLUDE_CHAINS:
                if chain in brand:
                    return True, f"Excluded franchise/brand ({chain.title()})"

        return False, None

    @staticmethod
    def calculate_smb_fit_score(
        lead_name: str,
        category: Optional[str],
        website: Optional[str],
        scraped_text: Optional[str],
        email: Optional[str],
        phone: Optional[str],
        reviews_count: Optional[int] = None
    ) -> Dict[str, Any]:
        """Calculates exact deterministic SMB_FIT_SCORE (0-100) per the Novatek ICP specification."""
        score_breakdown = {}
        total_score = 0
        detected_problems = []

        # 1. Company Size & Structure (25 Points)
        # Default estimated small business (1-10 emp: 25 pts, 11-20: 20 pts)
        size_pts = 25
        tier = "SMALL"
        score_breakdown["company_size"] = {"score": size_pts, "max": 25, "desc": "1-15 employees (Independent)"}
        total_score += size_pts

        # 2. Location Count (15 Points)
        # Standard independent local business (1 location = 15 pts)
        loc_pts = 15
        score_breakdown["locations"] = {"score": loc_pts, "max": 15, "desc": "Single location owner-led"}
        total_score += loc_pts

        # 3. Website Opportunity (20 Points)
        # No website = 20 pts, Weak/outdated = 14-18 pts, Strong modern = 0-7 pts
        if not website:
            web_pts = 20
            detected_problems.append("No active website")
            score_breakdown["website_gap"] = {"score": web_pts, "max": 20, "desc": "Missing Website (Highest Opportunity)"}
        else:
            text_len = len(scraped_text or "")
            if text_len < 150:
                web_pts = 18
                detected_problems.append("Thin / Outdated website")
                score_breakdown["website_gap"] = {"score": web_pts, "max": 20, "desc": "Minimal / Outdated Web Content"}
            else:
                web_pts = 12
                score_breakdown["website_gap"] = {"score": web_pts, "max": 20, "desc": "Standard Web Presence"}
        total_score += web_pts

        # 4. Digital Opportunity / Functionality Gap (15 Points)
        # Check for presence of booking, ordering, chatbot
        dig_pts = 0
        text_lower = (scraped_text or "").lower()
        
        # No online ordering
        if not any(k in text_lower for k in ["order online", "add to cart", "checkout", "menu online"]):
            dig_pts += 5
            detected_problems.append("No online ordering flow")
        
        # No booking system
        if not any(k in text_lower for k in ["book now", "schedule appointment", "calendly", "acuity", "reservation"]):
            dig_pts += 5
            detected_problems.append("No automated booking calendar")

        # No chatbot / live assistant
        if not any(k in text_lower for k in ["chatbot", "intercom", "drift", "tidio", "live chat"]):
            dig_pts += 5
            detected_problems.append("No instant AI query assistant")

        score_breakdown["digital_gap"] = {"score": min(dig_pts, 15), "max": 15, "desc": "Missing Booking / Ordering / Chatbot"}
        total_score += min(dig_pts, 15)

        # 5. Customer Activity Signal (10 Points)
        # Has phone or reviews or active address
        activity_pts = 8
        if reviews_count and reviews_count >= 10:
            activity_pts = 10
        elif phone:
            activity_pts = 8
        score_breakdown["activity_signal"] = {"score": activity_pts, "max": 10, "desc": "Observable customer presence"}
        total_score += activity_pts

        # 6. Decision-Maker Accessibility (10 Points)
        # Direct email / phone accessibility
        if email and phone:
            dm_pts = 10
            dm_desc = "Direct Email & Phone Found"
        elif email or phone:
            dm_pts = 7
            dm_desc = "Primary Contact Found"
        else:
            dm_pts = 3
            dm_desc = "Generic Route"
        score_breakdown["decision_maker"] = {"score": dm_pts, "max": 10, "desc": dm_desc}
        total_score += dm_pts

        # 7. Technology Complexity (5 Points)
        # Independent without internal engineering team
        tech_pts = 5
        score_breakdown["tech_simplicity"] = {"score": tech_pts, "max": 5, "desc": "No internal dev/tech team"}
        total_score += tech_pts

        # Determine Recommended Service based on Category and Detected Problems
        recommended_service = ICPService.get_recommended_service(category, detected_problems)

        # Classify Tier
        if not website or size_pts == 25:
            tier = "MICRO" if not website else "SMALL"

        return {
            "smb_fit_score": min(total_score, 100),
            "tier": tier,
            "detected_problems": detected_problems,
            "recommended_service": recommended_service,
            "score_breakdown": score_breakdown
        }

    @staticmethod
    def get_recommended_service(category: Optional[str], detected_problems: list) -> str:
        """Maps specific digital gaps to a high-leverage single service pitch."""
        if "No active website" in detected_problems:
            return "Modern High-Converting Website"
        
        cat_key = category or ""
        if "catering" in cat_key or "restaurant" in cat_key:
            return "Website + Direct Online Ordering System"
        elif "beauty" in cat_key or "salon" in cat_key or "spa" in cat_key:
            return "24/7 Appointment Booking + AI Chatbot"
        elif "service" in cat_key or "plumber" in cat_key or "clean" in cat_key:
            return "Instant Quote Capture + Automated Follow-up CRM"
        elif "health" in cat_key or "clinic" in cat_key:
            return "Automated Patient Recall & Online Intake"
        else:
            return "Website Modernization + Lead Capture Flow"

    @staticmethod
    def generate_google_maps_url(name: str, address: Optional[str] = None, lat: Optional[float] = None, lon: Optional[float] = None) -> str:
        """Creates accurate clickable Google Maps URL for the lead's real location."""
        if lat is not None and lon is not None:
            return f"https://www.google.com/maps/search/?api=1&query={lat},{lon}"
        query = f"{name} {address or ''}".strip()
        encoded = urllib.parse.quote_plus(query)
        return f"https://www.google.com/maps/search/?api=1&query={encoded}"

icp_service = ICPService()
