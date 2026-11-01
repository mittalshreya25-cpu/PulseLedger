#!/usr/bin/env bash
# PulseLedger 1-Click Launch Script for macOS and Linux

set -e

echo "===================================================================="
echo " Starting PulseLedger Autonomous Financial Workstation"
echo "===================================================================="
echo ""

# 1. Setup Python venv if not present
if [ ! -d ".venv" ]; then
    echo "[*] Creating virtual environment .venv..."
    python3 -m venv .venv
    echo "[*] Installing backend dependencies..."
    .venv/bin/pip install -r requirements.txt
fi

# 2. Setup frontend packages if not present
if [ ! -d "frontend/node_modules" ]; then
    echo "[*] Installing frontend packages..."
    npm --prefix frontend install
fi

# 3. Start Backend in background
echo "[*] Starting FastAPI Backend on http://127.0.0.1:8000..."
.venv/bin/python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# 4. Start Frontend in background
echo "[*] Starting Vite Frontend on http://localhost:5173..."
npm --prefix frontend run dev &
FRONTEND_PID=$!

# Clean trap on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true" EXIT

sleep 3

# 5. Open browser
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:5173
elif command -v open > /dev/null; then
    open http://localhost:5173
fi

echo ""
echo "===================================================================="
echo " PulseLedger is running!"
echo " - Frontend: http://localhost:5173"
echo " - Backend:  http://127.0.0.1:8000"
echo "===================================================================="
echo " Press Ctrl+C to terminate services."

wait
