import subprocess
import sys
import time
import urllib.request
import json

def verify():
    print("1. Starting backend server on http://127.0.0.1:8000...")
    backend = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    print("2. Starting Vite dev server on http://localhost:5173...")
    frontend = subprocess.Popen(
        ["cmd.exe", "/c", "npm run dev --prefix frontend"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    try:
        # Give both servers time to start
        time.sleep(3)

        # Probe backend /health
        print("3. Probing backend /health...")
        req = urllib.request.Request("http://127.0.0.1:8000/health")
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            print("   -> Backend /health response:", data)
            assert data["status"] == "ok"

        # Probe backend /safe-to-spend
        print("4. Probing backend /safe-to-spend...")
        req = urllib.request.Request("http://127.0.0.1:8000/safe-to-spend")
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            print(f"   -> Safe-to-spend response: remaining={data.get('remaining_today_paise')} status={data.get('status')}")
            assert "remaining_today_paise" in data
            assert "segments" in data

        # Probe backend /transactions
        print("5. Probing backend /transactions...")
        req = urllib.request.Request("http://127.0.0.1:8000/transactions")
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            print(f"   -> Transactions count: {len(data)}")

        # Probe backend /profile
        print("6. Probing backend /profile...")
        req = urllib.request.Request("http://127.0.0.1:8000/profile")
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            print(f"   -> Profile buffer={data.get('buffer_paise')}, goals={len(data.get('goals', []))}")

        # Probe backend /report/monthly
        print("7. Probing backend /report/monthly...")
        req = urllib.request.Request("http://127.0.0.1:8000/report/monthly?month=2026-10")
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            print(f"   -> Monthly report debits={data.get('total_debits_paise')}, cats={len(data.get('by_category', []))}")
            assert "by_category" in data
            assert "narrative" in data

        # Probe backend /coach/chat
        print("8. Probing backend /coach/chat...")
        req = urllib.request.Request(
            "http://127.0.0.1:8000/coach/chat",
            data=json.dumps({"message": "Can I buy a laptop for college next month?"}).encode(),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            print(f"   -> Coach chat status={data.get('status')}, msg_len={len(data.get('message', ''))}")
            assert data["status"] == "ok"

        # Probe frontend dev server
        print("9. Probing Vite frontend on http://localhost:5173...")
        req = urllib.request.Request("http://localhost:5173")
        with urllib.request.urlopen(req, timeout=5) as resp:
            html = resp.read().decode()
            print(f"   -> Frontend HTTP {resp.status}, HTML size: {len(html)} bytes")
            assert 'id="root"' in html
            assert '/src/main.tsx' in html

        print("\nAll integration checks PASSED! Backend and frontend communicate cleanly.")

    except Exception as e:
        print(f"\nVerification FAILED: {e}")
        # Print logs
        b_out, b_err = backend.communicate(timeout=2)
        print("Backend stderr:\n", b_err)
        f_out, f_err = frontend.communicate(timeout=2)
        print("Frontend stderr:\n", f_err)
        raise
    finally:
        print("Shutting down dev processes...")
        backend.terminate()
        frontend.terminate()
        backend.wait()
        frontend.wait()

if __name__ == "__main__":
    verify()

