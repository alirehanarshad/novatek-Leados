@echo off
echo ====================================================
echo Starting Novatek LeadOS Backend Server (FastAPI)
echo ====================================================
cd /d %~dp0backend
if not exist .venv (
    echo Creating Python Virtual Environment...
    python -m venv .venv
    call .venv\Scripts\activate
    pip install -r requirements.txt
) else (
    call .venv\Scripts\activate
)
echo Running FastAPI Server on http://localhost:8000
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
