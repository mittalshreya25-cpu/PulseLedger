@echo off
echo ========================================================
echo   Starting PulseLedger - Autonomous Financial OS
echo ========================================================
echo.
echo [1/2] Starting Python FastAPI Backend on http://127.0.0.1:8000 ...
start "PulseLedger Backend" cmd /k ".\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Vite Frontend on http://localhost:5173 ...
start "PulseLedger Frontend" cmd /k "npm --prefix frontend run dev"

echo.
echo ========================================================
echo   PulseLedger is running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://127.0.0.1:8000
echo   Docs:     http://127.0.0.1:8000/docs
echo ========================================================

