import logging
from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class GeoapifyService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEOAPIFY_API_KEY
        self.base_places_url = settings.GEOAPIFY_BASE_URL
        self.geocode_url = "https://api.geoapify.com/v1/geocode/search"

    async def geocode_city(self, city_or_address: str, country_code: Optional[str] = None) -> Optional[Dict[str, float]]:
        """Resolve a city or address name to latitude/longitude coordinates."""
        if not self.api_key:
            logger.warning("Geoapify API key is missing.")
            return None

        params = {
            "text": city_or_address,
            "apiKey": self.api_key,
            "limit": 1
        }
        if country_code:
            params["filter"] = f"countrycode:{country_code.lower()}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(self.geocode_url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    features = data.get("features", [])
                    if features:
                        coords = features[0]["geometry"]["coordinates"] # [lon, lat]
                        return {"lon": coords[0], "lat": coords[1]}
        except Exception as e:
            logger.error(f"Geocoding error for '{city_or_address}': {e}")
        return None

    async def search_places(
        self,
        categories: List[str],
        city: Optional[str] = None,
        country_code: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        radius_meters: int = 5000,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Fetch places matching categories and location criteria."""
        if not self.api_key:
            logger.warning("Geoapify API key is missing. Returning mock/test data for local dev preview.")
            return self._generate_sample_leads(categories, city or "San Francisco", limit)

        # If lat/lon not provided, resolve city
        if (lat is None or lon is None) and city:
            coords = await self.geocode_city(city, country_code)
            if coords:
                lon = coords["lon"]
                lat = coords["lat"]

        VALID_TOP_CATS = {
            "commercial", "catering", "healthcare", "service", "office", "entertainment", 
            "leisure", "tourism", "education", "childcare", "accommodation", "production", "rental"
        }
        VALID_SUBCATS = {
            "healthcare.hospital", "healthcare.pharmacy", "healthcare.dentist",
            "catering.restaurant", "catering.fast_food", "catering.cafe",
            "commercial.supermarket", "commercial.shopping_mall", "commercial.clothing", "commercial.elektronics",
            "service.financial", "service.vehicle", "service.beauty",
            "office.company", "leisure.spa"
        }

        # Format categories string with verified Geoapify taxonomy
        sanitized_categories = set()
        for cat in categories:
            cat_clean = cat.strip().lower()
            if cat_clean in VALID_SUBCATS or cat_clean in VALID_TOP_CATS:
                sanitized_categories.add(cat_clean)
            elif "." in cat_clean and cat_clean.split(".")[0] in VALID_TOP_CATS:
                sanitized_categories.add(cat_clean.split(".")[0])
            else:
                sanitized_categories.add("commercial")

        if not sanitized_categories:
            sanitized_categories.add("commercial")

        categories_str = ",".join(sanitized_categories)

        params: Dict[str, Any] = {
            "categories": categories_str,
            "apiKey": self.api_key,
            "limit": min(limit, 500),
            "offset": offset
        }

        if lat is not None and lon is not None:
            params["filter"] = f"circle:{lon},{lat},{radius_meters}"
            params["bias"] = f"proximity:{lon},{lat}"
        elif country_code:
            params["filter"] = f"countrycode:{country_code.lower()}"

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(self.base_places_url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    return self._parse_places(data.get("features", []))
                else:
                    logger.error(f"Geoapify Places API returned status {resp.status_code}: {resp.text}")
                    return []
        except Exception as e:
            logger.error(f"Geoapify Places API request error: {e}")
            return []

    def _parse_places(self, features: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        for feat in features:
            props = feat.get("properties", {})
            geom = feat.get("geometry", {})
            coords = geom.get("coordinates", [None, None])
            
            # Extract all possible contact details from properties, contact sub-object, and raw datasource
            contact = props.get("contact", {}) or {}
            datasource = props.get("datasource", {}) or {}
            raw_data = datasource.get("raw", {}) or {}

            # Phone resolution
            phone = (
                contact.get("phone") or 
                props.get("phone") or 
                raw_data.get("phone") or 
                raw_data.get("contact:phone") or 
                raw_data.get("phone:mobile") or 
                raw_data.get("mobile") or
                raw_data.get("contact:mobile")
            )
            if phone:
                phone = str(phone).strip()

            # Email resolution
            email = (
                contact.get("email") or 
                props.get("email") or 
                raw_data.get("email") or 
                raw_data.get("contact:email")
            )
            if email:
                email = str(email).strip().lower()

            # Website resolution
            website = (
                props.get("website") or 
                contact.get("url") or 
                contact.get("website") or 
                raw_data.get("website") or 
                raw_data.get("contact:website") or 
                raw_data.get("url")
            )
            if website:
                website = str(website).strip()
                if not website.startswith("http://") and not website.startswith("https://"):
                    website = "https://" + website

            lead_data = {
                "place_id": props.get("place_id") or props.get("osm_id") or f"geo_{props.get('lon')}_{props.get('lat')}",
                "name": props.get("name") or props.get("formatted", "Unnamed Business"),
                "category": (props.get("categories") or ["commercial"])[0] if props.get("categories") else "commercial",
                "categories_raw": ",".join(props.get("categories", [])),
                "address": props.get("formatted") or props.get("address_line2"),
                "city": props.get("city"),
                "state": props.get("state"),
                "country": props.get("country"),
                "postcode": props.get("postcode"),
                "latitude": coords[1] if len(coords) > 1 else props.get("lat"),
                "longitude": coords[0] if len(coords) > 0 else props.get("lon"),
                "phone": phone,
                "email": email,
                "website": website,
                "metadata_json": {
                    "opening_hours": raw_data.get("opening_hours"),
                    "brand": raw_data.get("brand"),
                    "wheelchair": raw_data.get("wheelchair"),
                    "datasource": datasource.get("sourcename", "geoapify")
                }
            }
            results.append(lead_data)
        return results

    def _generate_sample_leads(self, categories: List[str], city: str, limit: int) -> List[Dict[str, Any]]:
        """Generates realistic structured sample leads when API key is not configured."""
        sample_types = [
            ("Apex Dental Care", "healthcare.clinic", "555-0192", "contact@apexdentalcare.example.com", "https://apexdentalcare.example.com"),
            ("Vanguard Digital Agency", "service.marketing", "555-0143", "growth@vanguarddigital.example.com", "https://vanguarddigital.example.com"),
            ("Lumina Architectural Studio", "commercial.architecture", "555-0188", "info@luminaarchitects.example.com", "https://luminaarchitects.example.com"),
            ("Horizon Wealth Partners", "financial.bank", "555-0177", "advisory@horizonwealth.example.com", "https://horizonwealth.example.com"),
            ("Bluefin Fine Dining", "catering.restaurant", "555-0122", "reservations@bluefinbistro.example.com", "https://bluefinbistro.example.com"),
            ("Nova Cloud Consulting", "commercial.software", "555-0139", "hello@novacloud.example.com", "https://novacloud.example.com"),
            ("Elevate Fitness & Performance", "leisure.spa", "555-0164", "fit@elevateperformance.example.com", "https://elevateperformance.example.com"),
            ("Summit Real Estate Group", "commercial.real_estate", "555-0155", "brokerage@summitrealty.example.com", "https://summitrealty.example.com")
        ]
        
        leads = []
        for i in range(min(limit, len(sample_types))):
            name, cat, phone, email, website = sample_types[i]
            leads.append({
                "place_id": f"sample_place_{i+1}",
                "name": f"{name} ({city})",
                "category": categories[0] if categories else cat,
                "categories_raw": f"{cat},commercial",
                "address": f"{100 + i * 14} Market St, {city}",
                "city": city,
                "state": "CA",
                "country": "United States",
                "postcode": "94105",
                "latitude": 37.7749 + (i * 0.005),
                "longitude": -122.4194 + (i * 0.005),
                "phone": phone,
                "email": email,
                "website": website,
                "metadata_json": {"sample": True, "provider": "sample_generator"}
            })
        return leads

geoapify_service = GeoapifyService()
