# Novatek LeadOS — Small-Business Lead Intelligence & Outbound CRM

**Novatek LeadOS** is an autonomous AI-powered prospecting platform designed to target owner-led micro and small businesses (1–20 employees, 1–3 locations). It combines Geoapify Places discovery, deep Schema.org JSON-LD web crawling, Cloudflare email protection de-obfuscation, single-service value proposition mapping, and multi-model AI qualification (Groq, OpenAI, Gemini).

---

## 🚀 Key Features

- **Strict Small-Business ICP v1 Engine**:
  - Automatically pre-filters and excludes enterprise chains, banks, supermarkets, and large franchises (*McDonald's, Starbucks, 7-Eleven, Aldi, Bank of America, Marriott, etc.*).
  - Categorized into 3 high-leverage SMB groups:
    - **Group A (Local Consumer)**: Restaurants, Cafes, Bakeries, Salons, Spas, Gyms.
    - **Group B (Local Services)**: Plumbers, Electricians, HVAC, Cleaners, Auto Repair.
    - **Group C (Professional Small Businesses)**: Accounting, Small Law Firms, Real Estate, Design Studios.
- **Deep Contact Discovery & Reachability Gate**:
  - Recursively crawls websites, parses Schema.org JSON-LD structured data, decodes Cloudflare-protected emails, and extracts verified UK, US, and International phone numbers.
  - Automatically discards uncontactable businesses before database insertion.
- **One-Click "View on Google Maps"**:
  - Live map coordinates button in CRM rows and Lead Drawer for instant real-world location verification.
- **AI Qualification & Single-Service Pitching**:
  - Powered by Groq, OpenAI, and Gemini to compute 0–100 SMB Fit Scores and map one concrete solution (*e.g., Website + Direct Online Ordering, 24/7 Appointment Booking Chatbot, Quote Calculator + CRM*).
- **Team Authentication & Route Security**:
  - JWT Bearer authentication, protected routes, user profile management, and 1-click admin login.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: Next.js 14 / React 18, Lucide Icons, Vanilla CSS Glassmorphism Design System.
- **Backend**: FastAPI (Python 3.11+), Uvicorn, Async SQLAlchemy, SQLite (local preview) / PostgreSQL (production).
- **Crawling & Extraction**: HTTPX, BeautifulSoup4, Schema.org JSON-LD Parsers, Cloudflare Email Decoders.
- **AI Providers**: Groq (Llama-3.3 / GPT-OSS), OpenAI (GPT-4o-mini), Google Gemini (Gemini 1.5 Flash).

---

## 🏁 Quick Start Guide (Local Setup)

### 1. Clone the Repository
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd novascrape
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root and configure your API keys:
```bash
cp .env.example .env
```
Key variables:
- `GEOAPIFY_API_KEY`: Your Geoapify API key for places discovery.
- `GROQ_API_KEY`: Your Groq API key for ultra-fast AI qualification.
- `JWT_SECRET`: Any secure random 32-character string.

---

### 3. Start Backend Server
```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 4. Start Frontend Client
```bash
cd frontend
npm install
npm run dev
```
Open your browser at: [http://localhost:3000](http://localhost:3000)

---

## 🔐 Default Team Credentials

On initial startup, a default admin account is seeded automatically:
- **Email**: `admin@novatek.io`
- **Password**: `admin123`

You can also register new team member accounts directly on the `/register` page.

---

## ☁️ Live Cloud Deployment

### Backend (Render / Railway / VPS)
1. Deploy as a Python web service from your GitHub repository.
2. Build command: `pip install -r backend/requirements.txt`
3. Start command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables from `.env.example`.

### Frontend (Vercel)
1. Import repository on Vercel.
2. Root Directory: `frontend`
3. Set `NEXT_PUBLIC_BACKEND_URL` to your live backend URL (e.g. `https://your-backend.onrender.com/api`).
4. Click Deploy.
