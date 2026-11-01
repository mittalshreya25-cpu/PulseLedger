@echo off
title PulseLedger — Autonomous Financial Workstation
echo ====================================================================
echo  Starting PulseLedger Local Workstation
echo ====================================================================
echo.

:: 1. Check Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python 3 is not found in PATH. Please install Python 3.10+ to continue.
    pause
    exit /b 1
)

:: 2. Check virtual environment
if not exist ".venv\Scripts\python.exe" (
    echo [*] Creating virtual environment .venv...
    python -m venv .venv
    echo [*] Installing backend dependencies...
    .\.venv\Scripts\pip.exe install -r requirements.txt
)

:: 3. Check frontend dependencies
if not exist "frontend\node_modules" (
    echo [*] Installing frontend npm packages...
    npm --prefix frontend install
)

:: 4. Start FastAPI backend on port 8000
echo [*] Starting FastAPI Backend on http://127.0.0.1:8000...
start /b "" .\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000

:: 5. Start Vite frontend on port 5173
echo [*] Starting Vite Frontend on http://localhost:5173...
start /b "" npm --prefix frontend run dev

:: 6. Wait 3 seconds for servers to initialize
timeout /t 3 /nobreak >nul

:: 7. Launch application in default browser (app mode if Chrome/Edge available)
echo [*] Launching PulseLedger in application mode...
where chrome >nul 2>&1
if %errorlevel% equ 0 (
    start chrome --app=http://localhost:5173
) else (
    where msedge >nul 2>&1
    if %errorlevel% equ 0 (
        start msedge --app=http://localhost:5173
    ) else (
        start http://localhost:5173
    )
)

echo.
echo ====================================================================
echo  PulseLedger is running!
echo  - Frontend: http://localhost:5173
echo  - Backend:  http://127.0.0.1:8000
echo ====================================================================
echo  Press Ctrl+C in this window to stop all services.
echo ====================================================================

pause

