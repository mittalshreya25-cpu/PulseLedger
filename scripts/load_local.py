import json
import logging
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Optional

# Ensure repository root is on sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.app.database import get_connection, init_db
from backend.engines.ingest import ingest_paytm_records

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

DEFAULT_CSV_PATH = BASE_DIR / "data" / "local" / "paytm_real.local.csv"
DEFAULT_API_URL = os.getenv("PULSELEDGER_API_URL", "http://127.0.0.1:8000/ingest/paytm")


def post_to_api(csv_text: str, api_url: str = DEFAULT_API_URL) -> Optional[dict]:
    """Attempts to POST the CSV payload to the running FastAPI server."""
    req_body = json.dumps({"csv_text": csv_text}).encode("utf-8")
    req = urllib.request.Request(
        api_url,
        data=req_body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status in (200, 201):
                data = json.loads(response.read().decode("utf-8"))
                logger.info("Successfully posted to %s: %s", api_url, data)
                return data
    except (urllib.error.URLError, ConnectionRefusedError, TimeoutError) as e:
        logger.warning("Could not reach API server at %s (%s). Falling back to direct engine call.", api_url, e)
    return None


def load_local_paytm(
    csv_path: Optional[Path] = None,
    api_url: Optional[str] = None,
    prefer_api: bool = True,
) -> dict:
    target_csv = csv_path or DEFAULT_CSV_PATH
    if not target_csv.exists():
        raise FileNotFoundError(f"Local Paytm CSV not found at: {target_csv}")

    csv_text = target_csv.read_text(encoding="utf-8")
    logger.info("Read %d bytes from %s", len(csv_text), target_csv)

    url_to_use = api_url or DEFAULT_API_URL
    if prefer_api:
        api_result = post_to_api(csv_text, url_to_use)
        if api_result is not None:
            return api_result

    # Fallback / Direct execution through the Paytm import engine
    logger.info("Executing import directly via Paytm ingestion engine...")
    conn = init_db()
    try:
        result = ingest_paytm_records(conn, data=csv_text)
        logger.info(
            "Direct engine import completed: %d inserted, %d duplicates skipped, %d unparsed",
            len(result.get("inserted", [])),
            len(result.get("duplicates_skipped", [])),
            len(result.get("unparsed", [])),
        )
        return result
    finally:
        conn.close()


if __name__ == "__main__":
    load_local_paytm()

