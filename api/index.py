import os
import sys
from pathlib import Path

# Add project root directory to sys.path so backend and engines packages resolve cleanly
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# On Vercel serverless, the filesystem is read-only except /tmp
if os.environ.get("VERCEL") or not os.environ.get("PULSELEDGER_DB_PATH"):
    os.environ.setdefault("PULSELEDGER_DB_PATH", "/tmp/pulseledger.db")

from backend.app.main import app
from backend.seed import seed_data

# Automatically seed the database on cold start if /tmp/pulseledger.db is empty
try:
    db_file = Path(os.environ.get("PULSELEDGER_DB_PATH", "/tmp/pulseledger.db"))
    if not db_file.exists():
        fixtures_dir = ROOT_DIR / "data" / "fixtures"
        if fixtures_dir.exists():
            seed_data(db_path=db_file, fixtures_dir=fixtures_dir)
except Exception as e:
    # Graceful pass if fixtures cannot be read or already initialized
    pass

