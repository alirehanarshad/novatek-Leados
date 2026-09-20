import httpx
import time
import sys

def run_100_leads_test():
    base = "http://localhost:8000/api"
    print("=" * 60)
    print("[NOVATEK LEADOS] - FULL 100 LEADS DISCOVERY & ENRICHMENT TEST")
    print("=" * 60)

    # 1. Health & Integration Check
    h = httpx.get(f"{base}/health").json()
    print(f"\n[1/4] System Health Status:")
    print(f"  - App: {h['app']}")
    print(f"  - Geoapify Places API: {'ACTIVE' if h['features']['geoapify'] else 'OFFLINE'}")
    print(f"  - Groq AI Engine: {'ACTIVE' if h['features']['groq'] else 'OFFLINE'}")
    
    assert h['features']['geoapify'], "Geoapify is not active!"
    assert h['features']['groq'], "Groq is not active!"

    # 2. Launch 100 Leads Scrape Job
    print(f"\n[2/4] Triggering 100 Places Scrape via Geoapify & Autonomous Crawler...")
    payload = {
        "categories": ["commercial", "catering", "healthcare", "service"],
        "city": "London",
        "country_code": "gb",
        "radius_meters": 15000,
        "limit": 100,
        "auto_enrich_websites": True,
        "auto_ai_qualify": True,
        "ai_provider": "groq"
    }
    
    resp = httpx.post(f"{base}/scrape/geoapify", json=payload, timeout=20.0).json()
    job_id = resp["id"]
    print(f"  [OK] Job #{job_id} launched in background.")

    # 3. Monitor Job Progress
    print(f"\n[3/4] Processing live scraping, concurrent website crawling & Groq AI evaluation...")
    start_time = time.time()
    max_wait = 90 # seconds
    
    while time.time() - start_time < max_wait:
        job_status = httpx.get(f"{base}/scrape/jobs/{job_id}").json()
        status = job_status.get("status")
        found = job_status.get("total_found", 0)
        processed = job_status.get("total_processed", 0)
        enriched = job_status.get("total_enriched", 0)
        
        sys.stdout.write(f"\r  [*] Status: {status.upper()} | Found: {found} | Processed: {processed} | Web Enriched: {enriched}")
        sys.stdout.flush()

        if status in ["completed", "failed"]:
            break
        time.sleep(3)

    print("\n")
    if job_status.get("status") == "failed":
        print(f"[ERROR] Job failed: {job_status.get('error_message')}")
        return

    # 4. Fetch and Analyze Extracted Leads
    print(f"[4/4] Analyzing Discovered 100-Lead Batch...")
    leads_res = httpx.get(f"{base}/leads?page_size=100&sort_by=created_at&sort_order=desc").json()
    leads = leads_res.get("items", [])
    total_in_db = leads_res.get("total", 0)

    phones_count = sum(1 for l in leads if l.get("phone"))
    emails_count = sum(1 for l in leads if l.get("email"))
    websites_count = sum(1 for l in leads if l.get("website"))
    qualified_count = sum(1 for l in leads if l.get("icp_score") is not None and l.get("icp_score") >= 70)
    scored_count = sum(1 for l in leads if l.get("icp_score") is not None)

    print("\n" + "=" * 60)
    print(f"[REPORT] 100 LEADS EXTRACTION & ENRICHMENT REPORT")
    print("=" * 60)
    print(f"  Total Leads in Database: {total_in_db}")
    print(f"  Batch Examined:          {len(leads)} leads")
    print(f"  [PHONE] Leads with Phone:     {phones_count} / {len(leads)} ({round(phones_count / max(1, len(leads)) * 100, 1)}%)")
    print(f"  [EMAIL] Leads with Email:     {emails_count} / {len(leads)} ({round(emails_count / max(1, len(leads)) * 100, 1)}%)")
    print(f"  [WEB]   Leads with Website:   {websites_count} / {len(leads)} ({round(websites_count / max(1, len(leads)) * 100, 1)}%)")
    print(f"  [AI]    Groq AI Scored Leads: {scored_count} / {len(leads)} ({qualified_count} scored 70+ ICP)")
    print("=" * 60)

    print("\n[SAMPLE] EXTRACTED LEADS WITH CONTACTS & GROQ AI INTELLIGENCE:")
    for i, l in enumerate(leads[:10], 1):
        name = str(l.get('name', 'N/A')).encode('ascii', 'replace').decode('ascii')
        cat = str(l.get('category', 'N/A')).encode('ascii', 'replace').decode('ascii')
        city = str(l.get('city', 'N/A')).encode('ascii', 'replace').decode('ascii')
        pitch = str(l.get('ai_value_prop', 'N/A')).encode('ascii', 'replace').decode('ascii')
        
        print(f"\n[{i}] {name}")
        print(f"    Category: {cat} | City: {city}")
        print(f"    Phone:   {l.get('phone') or 'N/A'}")
        print(f"    Email:   {l.get('email') or 'N/A'}")
        print(f"    Website: {l.get('website') or 'N/A'}")
        if l.get("icp_score") is not None:
            print(f"    Groq ICP Score: {l.get('icp_score')}/100")
            print(f"    AI Value Pitch: {pitch}")

    print("\n" + "=" * 60)
    print("[SUCCESS] 100-LEADS TEST COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_100_leads_test()
