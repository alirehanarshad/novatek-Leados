import asyncio
from app.services.geoapify_service import geoapify_service
from app.services.crawler_service import crawler_service
from app.services.ai_service import ai_service
from app.services.export_service import export_service

async def run_tests():
    print("=== Novatek LeadOS Backend Self-Test ===")

    # 1. Test Geoapify Service (Mock / Real)
    print("\n[1/4] Testing Geoapify discovery...")
    places = await geoapify_service.search_places(
        categories=["healthcare.clinic"],
        city="San Francisco",
        limit=3
    )
    assert len(places) > 0, "Failed to retrieve places"
    print(f"[OK] Found {len(places)} places. First: {places[0]['name']}")

    # 2. Test Crawler Service
    print("\n[2/4] Testing Web Crawler...")
    crawl_res = await crawler_service.crawl_lead_website("https://example.com")
    assert "status" in crawl_res
    print(f"[OK] Crawler executed with status: {crawl_res['status']}")

    # 3. Test AI Gateway
    print("\n[3/4] Testing AI ICP Qualification...")
    ai_eval = await ai_service.qualify_lead(
        lead_name="Apex Dental Care",
        category="healthcare.clinic",
        website_snippet="Cosmetic dentistry, implants, and invisalign clinic in downtown SF.",
        icp_description="Mid-market clinics seeking automated patient recall software.",
        provider="groq"
    )
    assert "icp_score" in ai_eval
    print(f"[OK] AI ICP Score: {ai_eval['icp_score']}/100, Summary: {ai_eval['qualification_summary']}")

    # 4. Test Exporter
    print("\n[4/4] Testing Exporter...")
    csv_out = export_service.to_csv(places)
    assert len(csv_out) > 0
    print("[OK] CSV Export generated successfully.")

    print("\n[SUCCESS] ALL BACKEND TESTS PASSED!")

if __name__ == "__main__":
    asyncio.run(run_tests())
