import sqlite3
from pathlib import Path
import pytest

from backend.app.database import init_db
from backend.engines.ingest import ingest_paytm_records


@pytest.fixture
def fresh_db():
    conn = sqlite3.connect(":memory:")
    init_db(conn)
    yield conn
    conn.close()


def test_paytm_scrubbed_import_and_october_totals(fresh_db):
    fixture_path = Path(__file__).parent / "fixtures" / "paytm_scrubbed.csv"
    assert fixture_path.exists(), f"Fixture file not found: {fixture_path}"

    csv_text = fixture_path.read_text(encoding="utf-8")

    # Initial import
    result = ingest_paytm_records(fresh_db, data=csv_text)
    assert len(result["inserted"]) > 0
    assert len(result["unparsed"]) == 0

    cursor = fresh_db.cursor()

    # Total debits for October 2026: 331910 paise
    cursor.execute(
        """
        SELECT COALESCE(SUM(amount_paise), 0) FROM transactions 
        WHERE date LIKE '2026-10%' AND UPPER(direction) = 'DEBIT'
        """
    )
    total_debits = cursor.fetchone()[0]
    assert total_debits == 331910

    # Total credits for October 2026: 441000 paise
    cursor.execute(
        """
        SELECT COALESCE(SUM(amount_paise), 0) FROM transactions 
        WHERE date LIKE '2026-10%' AND UPPER(direction) = 'CREDIT'
        """
    )
    total_credits = cursor.fetchone()[0]
    assert total_credits == 441000

    # Per-category debits for October 2026
    cursor.execute(
        """
        SELECT category, SUM(amount_paise) FROM transactions 
        WHERE date LIKE '2026-10%' AND UPPER(direction) = 'DEBIT'
        GROUP BY category
        """
    )
    category_debits = dict(cursor.fetchall())

    expected_category_debits = {
        "Food": 138426,
        "Money Transfer": 93200,
        "Entertainment": 64784,
        "Education": 20000,
        "Services": 13500,
        "Miscellaneous": 2000,
    }

    assert category_debits == expected_category_debits

    # Re-import must insert 0 rows
    cursor.execute("SELECT COUNT(*) FROM transactions")
    initial_row_count = cursor.fetchone()[0]

    reimport_result = ingest_paytm_records(fresh_db, data=csv_text)
    assert len(reimport_result["inserted"]) == 0
    assert len(reimport_result["duplicates_skipped"]) == len(result["inserted"])

    cursor.execute("SELECT COUNT(*) FROM transactions")
    final_row_count = cursor.fetchone()[0]
    assert final_row_count == initial_row_count

