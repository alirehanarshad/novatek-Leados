@echo off
echo ====================================================
echo Starting Novatek LeadOS Frontend (Next.js)
echo ====================================================
cd /d %~dp0frontend
if not exist node_modules (
    echo Installing npm dependencies...
    npm install
)
echo Starting Next.js Dev Server on http://localhost:3000
npm run dev
pause
