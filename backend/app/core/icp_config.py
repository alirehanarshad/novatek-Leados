import re
from typing import Dict, Any, List, Optional, Tuple

HARD_EXCLUDE_CHAINS = [
    # Fast Food & Coffee Chains
    "mcdonald's", "mcdonalds", "starbucks", "subway", "burger king", "kfc", "domino's", "pizza hut",
    "dunkin", "costa coffee", "pret a manger", "caffè nero", "caffe nero", "greggs", "taco bell",
    "wendy's", "chipotle", "panera", "five guys", "tim hortons", "nando's", "wagamama",
    # Supermarkets & Hypermarkets
    "walmart", "target", "costco", "kroger", "aldi", "lidl", "tesco", "sainsbury's", "asda",
    "morrisons", "rewe", "edeka", "carrefour", "whole foods", "trader joe's", "7-eleven", "7 eleven",
    "spar", "netto", "penny", "kaufland", "co-op", "marks & spencer", "m&s",
    # Banks & Financial Institutions
    "bank of america", "chase", "wells fargo", "citibank", "hsbc", "barclays", "lloyds", "natwest",
    "santander", "deutsche bank", "commerzbank", "ubs", "credit suisse", "bnp paribas",
    # Hotels & Accommodation Chains
    "marriott", "hilton", "hyatt", "ihg", "holiday inn", "accor", "best western", "radisson",
    "premier inn", "travelodge", "sheraton", "westin", "ibis", "mercure", "novotel",
    # Telecom, Airlines, Tech Giants
    "at&t", "verizon", "t-mobile", "vodafone", "o2", "ee", "delta", "american airlines", "british airways",
    "lufthansa", "ryanair", "easyjet", "emirates", "apple store", "microsoft", "amazon", "google"
]

TARGET_CATEGORIES = {
    # Group A — Local Consumer Businesses
    "catering.restaurant": {"name": "Independent Restaurants", "group": "Group A: Consumer", "recommended": "Website + Online Ordering"},
    "catering.cafe": {"name": "Local Cafés & Bakeries", "group": "Group A: Consumer", "recommended": "Website + Menu & Ordering"},
    "catering.fast_food": {"name": "Takeaway & Food Brands", "group": "Group A: Consumer", "recommended": "Online Ordering + SMS Reminders"},
    "service.beauty": {"name": "Salons, Barbers & Spas", "group": "Group A: Consumer", "recommended": "Website + Booking System + AI Chatbot"},
    "leisure.spa": {"name": "Beauty Studios & Wellness", "group": "Group A: Consumer", "recommended": "Booking Automation + Reminders"},
    "leisure.fitness": {"name": "Fitness Studios & Gyms", "group": "Group A: Consumer", "recommended": "Membership Portal + Lead Capture"},
    "education": {"name": "Tutors & Driving Schools", "group": "Group A: Consumer", "recommended": "Booking Calendar + Quote Assistant"},
    
    # Group B — Local Service Businesses
    "service.cleaning": {"name": "Cleaning Companies", "group": "Group B: Local Services", "recommended": "Quote Form + AI Lead Qualification + CRM"},
    "service.plumber": {"name": "Plumbers & HVAC", "group": "Group B: Local Services", "recommended": "Instant Quote Bot + Dispatch CRM"},
    "service.electrician": {"name": "Electricians & Contractors", "group": "Group B: Local Services", "recommended": "Emergency Call Capture + Booking"},
    "service.vehicle": {"name": "Auto Repair & Detailing", "group": "Group B: Local Services", "recommended": "Service Menu + Appointment Scheduler"},
    "service.landscaping": {"name": "Landscaping & Pest Control", "group": "Group B: Local Services", "recommended": "Quote Estimator + Follow-up Automation"},
    "service.moving": {"name": "Moving & Home Maintenance", "group": "Group B: Local Services", "recommended": "Moving Quote Calculator + CRM"},
    "service.photography": {"name": "Photography & Event Studios", "group": "Group B: Local Services", "recommended": "Portfolio Showcase + Booking Calendar"},

    # Group C — Professional Small Businesses
    "service.financial": {"name": "Small Accounting & Bookkeepers", "group": "Group C: Professional", "recommended": "Consultation Booking + Intake Automation"},
    "service.legal": {"name": "Small Law Firms", "group": "Group C: Professional", "recommended": "Case Evaluation Bot + Intake CRM"},
    "commercial.real_estate": {"name": "Boutique Real Estate Agencies", "group": "Group C: Professional", "recommended": "Property Showcase + Lead Qualification Bot"},
    "office.company": {"name": "Small Design & Architecture", "group": "Group C: Professional", "recommended": "Modern Website Redesign + Portfolio"},
    "tourism": {"name": "Small Travel & Tour Agencies", "group": "Group C: Professional", "recommended": "Tour Booking Flow + WhatsApp Assistant"}
}

NOVATEK_ICP_CONFIG = {
    "name": "Novatek Small Business ICP v1",
    "company_size": {
        "preferred_min_employees": 1,
        "preferred_max_employees": 20,
        "acceptable_max_employees": 30,
        "hard_reject_above": 50
    },
    "locations": {
        "preferred_min": 1,
        "preferred_max": 3,
        "acceptable_max": 5,
        "hard_reject_above": 5
    },
    "opportunity_threshold": 70
}
