import re
import json
import logging
import asyncio
from typing import Dict, Any, Optional, Set, List
from urllib.parse import urlparse, urljoin
import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# Standard & International Email Regex
EMAIL_REGEX = re.compile(r'\b[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\b')
OBFUSCATED_EMAIL_REGEX = re.compile(
    r'\b([a-zA-Z0-9_.+-]+)\s*(?:\[at\]|\(at\)|\s+at\s+|&#64;)\s*([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)\b',
    re.IGNORECASE
)

# Comprehensive Phone Number Patterns (UK, US, EU, International, Mobile, Landline)
# Matches: +44 161 834 5000, 0161 834 5000, (0161) 834-5000, 07123456789, +1 (555) 123-4567, 555-123-4567, +49 30 123456
PHONE_REGEX = re.compile(
    r'(?:(?:\+|00)\d{1,3}[\s.-]*)?(?:\(?\d{2,5}\)?[\s.-]*)?\d{3,4}[\s.-]*\d{3,5}(?:[\s.-]*\d{1,4})?'
)

EXCLUDE_EMAIL_PREFIXES = (
    "sentry", "wix", "bootstrap", "example", "domain", "user", "noreply", 
    "no-reply", "mailer", "support@github", "root@", "privacy@", "terms@", 
    "cookie@", "abuse@", "postmaster@"
)
EXCLUDE_EXTENSIONS = (
    ".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp", ".js", ".css", 
    ".ico", ".woff", ".woff2", ".ttf", ".mp4", ".pdf", ".zip"
)

def decode_cloudflare_email(cf_hex: str) -> Optional[str]:
    """Decodes Cloudflare email protection data-cfemail attribute."""
    try:
        if not cf_hex or len(cf_hex) < 4:
            return None
        r = int(cf_hex[:2], 16)
        email = ''.join([chr(int(cf_hex[i:i+2], 16) ^ r) for i in range(2, len(cf_hex), 2)])
        return email.strip()
    except Exception:
        return None

class CrawlerService:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 NovatekLeadCrawler/2.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9"
        }

    async def find_website_for_lead(self, business_name: str, city: Optional[str] = None) -> Optional[str]:
        """Discovers official business website when Geoapify has no URL recorded."""
        query = f"{business_name} {city or ''} official website"
        try:
            url = f"https://html.duckduckgo.com/html/?q={query}"
            async with httpx.AsyncClient(headers=self.headers, timeout=8.0, follow_redirects=True, verify=False) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    for a in soup.find_all("a", class_="result__url", href=True):
                        href = a["href"].strip()
                        if href and not any(x in href.lower() for x in [
                            "duckduckgo", "facebook.com", "instagram.com", "wikipedia.org", 
                            "yelp.com", "tripadvisor", "yellowpages", "linkedin.com", "gov.uk"
                        ]):
                            if not href.startswith("http"):
                                href = "https://" + href
                            return href
        except Exception as e:
            logger.debug(f"Search discovery skipped for {business_name}: {e}")
        return None

    async def search_fallback_contacts(self, business_name: str, city: Optional[str] = None) -> Dict[str, Optional[str]]:
        """Queries public search snippets for direct phone & email when standard crawling yields nothing."""
        query = f"{business_name} {city or ''} phone number email address contact"
        contacts = {"phone": None, "email": None}
        try:
            url = f"https://html.duckduckgo.com/html/?q={query}"
            async with httpx.AsyncClient(headers=self.headers, timeout=8.0, follow_redirects=True, verify=False) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    text = resp.text
                    emails = EMAIL_REGEX.findall(text)
                    for em in emails:
                        if self._is_valid_email(em) and not any(x in em for x in ["duckduckgo", "example", "domain"]):
                            contacts["email"] = em.lower()
                            break
                    
                    soup = BeautifulSoup(text, "html.parser")
                    snippets = soup.find_all("a", class_="result__snippet")
                    for snip in snippets:
                        s_text = snip.get_text()
                        phones = PHONE_REGEX.findall(s_text)
                        for ph in phones:
                            if self._is_valid_phone(ph):
                                contacts["phone"] = ph.strip()
                                break
                        if contacts["phone"]:
                            break
        except Exception as e:
            logger.debug(f"Search fallback contacts error: {e}")
        return contacts

    async def crawl_lead_website(self, url: str) -> Dict[str, Any]:
        """Deeply crawls homepage and contact/impressum pages with Schema JSON-LD & Cloudflare decoding."""
        if not url:
            return {"status": "no_website"}

        if not url.startswith("http://") and not url.startswith("https://"):
            url = "https://" + url

        result = {
            "emails": set(),
            "phones": set(),
            "linkedin_url": None,
            "facebook_url": None,
            "instagram_url": None,
            "twitter_url": None,
            "scraped_title": None,
            "scraped_meta_desc": None,
            "scraped_body_snippet": None,
            "status": "completed"
        }

        discovered_contact_urls = set()

        try:
            async with httpx.AsyncClient(headers=self.headers, follow_redirects=True, timeout=12.0, verify=False) as client:
                # 1. Fetch Homepage
                resp = await client.get(url)
                if resp.status_code >= 400:
                    result["status"] = f"http_{resp.status_code}"
                    return self._finalize_result(result)

                html_content = resp.text
                contact_links = self._extract_from_html(html_content, str(resp.url), result)
                discovered_contact_urls.update(contact_links)

                # 2. Add standard known subpaths if not already discovered
                for path in [
                    "/contact", "/contact-us", "/kontakt", "/impressum", "/about", 
                    "/about-us", "/find-us", "/location", "/get-in-touch", "/book"
                ]:
                    candidate = urljoin(str(resp.url), path)
                    if candidate not in discovered_contact_urls:
                        discovered_contact_urls.add(candidate)

                # 3. Crawl top candidate contact pages concurrently (max 4 subpages)
                to_crawl = list(discovered_contact_urls)[:4]
                tasks = [self._fetch_subpage(client, sub_url, result) for sub_url in to_crawl]
                await asyncio.gather(*tasks, return_exceptions=True)

        except Exception as e:
            logger.warning(f"Error crawling {url}: {e}")
            result["status"] = "crawl_failed"

        return self._finalize_result(result)

    async def _fetch_subpage(self, client: httpx.AsyncClient, sub_url: str, result: Dict[str, Any]):
        try:
            resp = await client.get(sub_url, timeout=8.0)
            if resp.status_code == 200:
                self._extract_from_html(resp.text, str(resp.url), result)
        except Exception:
            pass

    def _extract_from_html(self, html: str, current_url: str, result: Dict[str, Any]) -> List[str]:
        contact_links = []
        try:
            soup = BeautifulSoup(html, "html.parser")

            # 1. Title & Meta Description
            if not result["scraped_title"] and soup.title and soup.title.string:
                result["scraped_title"] = soup.title.string.strip()

            if not result["scraped_meta_desc"]:
                meta_tag = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
                if meta_tag and meta_tag.get("content"):
                    result["scraped_meta_desc"] = meta_tag["content"].strip()

            # 2. Extract from JSON-LD Schema (e.g. LocalBusiness, Restaurant, Store schema)
            for script in soup.find_all("script", type="application/ld+json"):
                try:
                    if script.string:
                        ld_data = json.loads(script.string)
                        self._parse_schema_node(ld_data, result)
                except Exception:
                    pass

            # 3. Extract Cloudflare Protected Emails (<a class="__cf_email__" data-cfemail="...">)
            for cf_elem in soup.find_all(attrs={"data-cfemail": True}):
                decoded = decode_cloudflare_email(cf_elem.get("data-cfemail"))
                if decoded and self._is_valid_email(decoded):
                    result["emails"].add(decoded.lower())

            # 4. Extract itemprops and specific meta tags
            for elem in soup.find_all(attrs={"itemprop": ["telephone", "phone", "email"]}):
                val = elem.get("content") or elem.get_text().strip()
                itemprop = elem.get("itemprop").lower()
                if "phone" in itemprop or "tel" in itemprop:
                    if self._is_valid_phone(val):
                        result["phones"].add(val)
                elif "email" in itemprop:
                    if self._is_valid_email(val):
                        result["emails"].add(val.lower())

            # 5. Parse Links (mailto, tel, socials, contact subpages)
            for a in soup.find_all("a", href=True):
                href = a["href"].strip()
                href_lower = href.lower()
                text_lower = a.get_text().strip().lower()

                # Mailto
                if href_lower.startswith("mailto:"):
                    raw_email = href.split("mailto:")[1].split("?")[0].strip()
                    if self._is_valid_email(raw_email):
                        result["emails"].add(raw_email.lower())

                # Tel
                elif href_lower.startswith("tel:"):
                    raw_phone = href.split("tel:")[1].split("?")[0].strip()
                    if self._is_valid_phone(raw_phone):
                        result["phones"].add(raw_phone)

                # Socials
                elif "linkedin.com/company" in href_lower or "linkedin.com/in" in href_lower:
                    if not result["linkedin_url"]:
                        result["linkedin_url"] = href
                elif "facebook.com" in href_lower and not any(x in href_lower for x in ["sharer", "share.php", "plugins"]):
                    if not result["facebook_url"]:
                        result["facebook_url"] = href
                elif "instagram.com" in href_lower:
                    if not result["instagram_url"]:
                        result["instagram_url"] = href
                elif "twitter.com" in href_lower or "x.com" in href_lower:
                    if not result["twitter_url"]:
                        result["twitter_url"] = href

                # Discover contact / impressum / about subpages
                if any(k in href_lower or k in text_lower for k in [
                    "kontakt", "contact", "impressum", "about", "uber-uns", 
                    "team", "legal", "find-us", "reach-us"
                ]):
                    full_link = urljoin(current_url, href)
                    if urlparse(full_link).netloc == urlparse(current_url).netloc:
                        contact_links.append(full_link)

            # 6. Extract Raw Regex Emails
            raw_text = soup.get_text(separator=" ")
            found_emails = EMAIL_REGEX.findall(raw_text)
            for em in found_emails:
                if self._is_valid_email(em):
                    result["emails"].add(em.lower())

            # De-obfuscated emails (e.g. name [at] domain.com)
            for m in OBFUSCATED_EMAIL_REGEX.finditer(raw_text):
                user, domain = m.groups()
                constructed = f"{user}@{domain}".lower()
                if self._is_valid_email(constructed):
                    result["emails"].add(constructed)

            # 7. Extract Raw Regex Phones (specifically from contact/footer/header sections)
            for chunk in soup.find_all(["p", "div", "span", "li", "footer", "header", "address"]):
                t = chunk.get_text().strip()
                if any(w in t.lower() for w in ["tel", "phone", "fon", "telefon", "call", "mobil", "contact", "office", "+"]):
                    matches = PHONE_REGEX.findall(t)
                    for ph in matches:
                        ph_clean = ph.strip()
                        if self._is_valid_phone(ph_clean):
                            result["phones"].add(ph_clean)

            # Body text snippet
            if not result["scraped_body_snippet"]:
                for elem in soup(["script", "style", "nav", "footer", "header", "noscript"]):
                    elem.extract()
                text = soup.get_text(separator=" ", strip=True)
                result["scraped_body_snippet"] = text[:800] if text else None

        except Exception as e:
            logger.debug(f"HTML parsing error: {e}")

        return contact_links

    def _parse_schema_node(self, node: Any, result: Dict[str, Any]):
        """Recursively parses JSON-LD schema objects for contact points."""
        if isinstance(node, list):
            for item in node:
                self._parse_schema_node(item, result)
        elif isinstance(node, dict):
            # Check telephone
            tel = node.get("telephone") or node.get("phone")
            if tel:
                if isinstance(tel, list):
                    for t in tel:
                        if self._is_valid_phone(str(t)):
                            result["phones"].add(str(t).strip())
                elif self._is_valid_phone(str(tel)):
                    result["phones"].add(str(tel).strip())

            # Check email
            em = node.get("email")
            if em:
                if isinstance(em, list):
                    for e in em:
                        if self._is_valid_email(str(e)):
                            result["emails"].add(str(e).strip().lower())
                elif self._is_valid_email(str(em)):
                    result["emails"].add(str(em).strip().lower())

            # Check contactPoint
            if "contactPoint" in node:
                self._parse_schema_node(node["contactPoint"], result)
            if "subOrganization" in node:
                self._parse_schema_node(node["subOrganization"], result)

    def _is_valid_email(self, email: str) -> bool:
        if not email or "@" not in email:
            return False
        email_clean = email.strip().lower()
        if any(email_clean.endswith(ext) for ext in EXCLUDE_EXTENSIONS):
            return False
        if any(email_clean.startswith(prefix) for prefix in EXCLUDE_EMAIL_PREFIXES):
            return False
        if len(email_clean) > 85 or len(email_clean) < 6:
            return False
        # Discard invalid domain formats
        domain_part = email_clean.split("@")[-1]
        if "." not in domain_part or len(domain_part.split(".")[-1]) < 2:
            return False
        return True

    def _is_valid_phone(self, phone: str) -> bool:
        if not phone:
            return False
        cleaned = phone.strip()
        digits = re.sub(r'\D', '', cleaned)
        # Must have between 7 and 16 digits
        if len(digits) < 7 or len(digits) > 16:
            return False
        # Avoid pure year numbers like 2024, 2026, or ZIP codes
        if len(digits) <= 5:
            return False
        # Ignore dummy sequences
        if digits in ["1234567890", "0000000000", "1111111111", "9999999999"]:
            return False
        return True

    def _finalize_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        email_list = list(result["emails"])
        phone_list = list(result["phones"])
        return {
            "emails": email_list,
            "primary_email": email_list[0] if email_list else None,
            "phones": phone_list,
            "primary_phone": phone_list[0] if phone_list else None,
            "linkedin_url": result["linkedin_url"],
            "facebook_url": result["facebook_url"],
            "instagram_url": result["instagram_url"],
            "twitter_url": result["twitter_url"],
            "scraped_title": result["scraped_title"],
            "scraped_meta_desc": result["scraped_meta_desc"],
            "scraped_body_snippet": result["scraped_body_snippet"],
            "status": result["status"]
        }

crawler_service = CrawlerService()
