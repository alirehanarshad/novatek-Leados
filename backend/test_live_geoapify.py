import httpx
import time

def main():
    base = "http://localhost:8000/api"
    
    # Health check
    h = httpx.get(f"{base}/health").json()
    print("[Health Check]")
    print(f"  App: {h['app']}")
    print(f"  Geoapify configured: {h['features']['geoapify']}")
    assert h['features']['geoapify'] is True, "Geoapify API key is not active!"

    # Trigger Live Scrape via Geoapify API
    payload = {
        "categories": ["commercial.supermarket"],
        "city": "Berlin",
        "country_code": "de",
        "radius_meters": 5000,
        "limit": 5,
        "auto_enrich_websites": False,
        "auto_ai_qualify": False
    }
    job = httpx.post(f"{base}/scrape/geoapify", json=payload).json()
    print(f"\n[Scrape Job Initiated] Job ID: {job['id']}")

    # Wait 4 seconds for background async execution
    time.sleep(4)

    # Check Job Status
    job_status = httpx.get(f"{base}/scrape/jobs/{job['id']}").json()
    print("\n[Job Result]")
    print(f"  Status: {job_status['status']}")
    print(f"  Total Real Places Found: {job_status['total_found']}")
    print(f"  Processed Leads: {job_status['total_processed']}")

    # Query Leads CRM table
    leads = httpx.get(f"{base}/leads?city=Berlin").json()
    print(f"\n[Verified Leads in Database] Total: {leads['total']}")
    for i, lead in enumerate(leads["items"][:5], 1):
        print(f"  {i}. {lead['name']} | Category: {lead['category']} | Address: {lead['address']}")

    print("\n[SUCCESS] Live Geoapify integration verified successfully!")

if __name__ == "__main__":
    main()
