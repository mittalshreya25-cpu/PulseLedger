import sqlite3
import pytest
from pathlib import Path

from backend.app.database import init_db
from backend.engines.currency import to_paise, to_rupees
from backend.engines.categorizer import (
    get_builtin_categories,
    categorize,
    map_paytm_tag_to_category,
)
from backend.engines.dedupe import is_duplicate_transaction
from backend.engines.ingest import ingest_sms_records, ingest_paytm_records
from backend.engines.integrity import check_balance_chain
from backend.engines.reconciliation import (
    reconcile_sms_with_paytm,
    get_match_rate,
    calculate_total_spend,
)
from backend.engines.transactions import (
    create_quick_transaction,
    get_needs_merchant_transactions,
    update_transaction_merchant,
)


@pytest.fixture
def conn():
    connection = sqlite3.connect(":memory:")
    init_db(connection)
    yield connection
    connection.close()


def test_currency_engine():
    assert to_paise(180.0) == 18000
    assert to_paise("180.50") == 18050
    assert to_paise(0.0) == 0
    assert to_paise(None) is None

    assert to_rupees(18000) == 180.0
    assert to_rupees(18050) == 180.5
    assert to_rupees(None) is None


def test_categorizer_engine():
    categories = get_builtin_categories()
    expected = [
        "Food",
        "Money Transfer",
        "Entertainment",
        "Education",
        "Services",
        "Miscellaneous",
        "Hostel & Mess",
        "Transport",
        "Bank charges",
        "Uncategorized",
        "Allowance",
        "Investments & Savings",
    ]
    for cat in expected:
        assert cat in categories

    # Matches bank charges
    assert categorize(merchant="CANARA BANK SMS CHARGES") == "Bank charges"
    assert categorize(raw_text="Annual card maintenance fee debited") == "Bank charges"
    assert categorize(raw_text="ATM fee charged") == "Bank charges"

    # Custom rules override
    custom_rules = [(r"swiggy|zomato", "Food")]
    assert categorize(merchant="ZOMATO", custom_rules=custom_rules) == "Food"

    # Defaults to Uncategorized
    assert categorize(merchant="RANDOM MERCHANT") == "Uncategorized"
    assert categorize() == "Uncategorized"


def test_map_paytm_tag_to_category():
    # Tag mappings per requirement 2
    assert map_paytm_tag_to_category("Food") == "Food"
    assert map_paytm_tag_to_category("#Food") == "Food"
    assert map_paytm_tag_to_category("Groceries") == "Food"
    assert map_paytm_tag_to_category("#Groceries") == "Food"
    assert map_paytm_tag_to_category("Shopping") == "Miscellaneous"
    assert map_paytm_tag_to_category("Travel") == "Transport"
    assert map_paytm_tag_to_category("Money Transfer") == "Money Transfer"
    assert map_paytm_tag_to_category("Money Received") == "Allowance"
    assert map_paytm_tag_to_category("Financial Services") == "Investments & Savings"
    assert map_paytm_tag_to_category("Bill Payments") == "Services"
    assert map_paytm_tag_to_category("RandomTag") == "Uncategorized"
    assert map_paytm_tag_to_category(None) == "Uncategorized"


def test_dedupe_engine(conn):
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO transactions (date, amount_paise, direction, source, ref_no, dedupe_key)
        VALUES ('2026-10-15', 49900, 'DEBIT', 'sms', 'REF123456', 'ref:REF123456')
        """
    )
    conn.commit()

    assert is_duplicate_transaction(conn, dedupe_key="ref:REF123456") is True
    assert is_duplicate_transaction(conn, dedupe_key="ref:NONEXISTENT") is False
    assert is_duplicate_transaction(conn, ref_no="REF123456") is True
    assert is_duplicate_transaction(conn, ref_no="REF999999") is False
    assert is_duplicate_transaction(conn, date="2026-10-15", amount_paise=49900, direction="DEBIT") is True
    assert is_duplicate_transaction(conn, date="2026-10-15", amount_paise=49900, direction="CREDIT") is False


def test_ingest_sms_engine(conn):
    fixture_path = Path(__file__).parent / "fixtures" / "canara_sms.txt"
    raw_blob = fixture_path.read_text(encoding="utf-8")

    result = ingest_sms_records(conn, raw_blob=raw_blob)
    assert len(result["inserted"]) == 5
    assert len(result["duplicates_skipped"]) == 0
    assert len(result["ignored"]) == 2
    assert len(result["unparsed"]) == 0

    result_repeat = ingest_sms_records(conn, raw_blob=raw_blob)
    assert len(result_repeat["inserted"]) == 0
    assert len(result_repeat["duplicates_skipped"]) == 5


def test_ingest_paytm_engine(conn):
    fixture_path = Path(__file__).parent / "fixtures" / "paytm_sample.csv"
    csv_text = fixture_path.read_text(encoding="utf-8")

    result = ingest_paytm_records(conn, data=csv_text)
    assert len(result["inserted"]) == 25
    assert len(result["duplicates_skipped"]) == 0
    assert len(result["unparsed"]) == 0

    # Re-import must insert 0 rows
    repeat = ingest_paytm_records(conn, data=csv_text)
    assert len(repeat["inserted"]) == 0
    assert len(repeat["duplicates_skipped"]) == 25


def test_transactions_engine(conn):
    tx = create_quick_transaction(
        conn=conn,
        amount_paise=25000,
        direction="debit",
        merchant="Blue Tokai",
        category="Food",
    )
    assert tx["id"] is not None
    assert tx["amount_paise"] == 25000
    assert tx["direction"] == "debit"
    assert tx["merchant"] == "Blue Tokai"
    assert tx["category"] == "Food"
    assert tx["source"] == "manual"
    assert tx["needs_merchant"] == 0

    tx_default = create_quick_transaction(
        conn=conn,
        amount_paise=12000,
        direction="debit",
        merchant="Auto Rickshaw",
    )
    assert tx_default["category"] == "Uncategorized"

    with pytest.raises(ValueError):
        create_quick_transaction(conn=conn, amount_paise=-500, direction="debit", merchant="Test")


def test_needs_merchant_and_update(conn):
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO transactions (date, amount_paise, direction, source, merchant, category, needs_merchant)
        VALUES ('2026-10-20', 12000, 'DEBIT', 'sms', '', 'Uncategorized', 1),
               ('2026-10-21', 5500, 'DEBIT', 'sms', '', 'Uncategorized', 1)
        """
    )
    conn.commit()

    pending = get_needs_merchant_transactions(conn)
    assert len(pending) == 2
    assert pending[0]["date"] == "2026-10-21"

    updated = update_transaction_merchant(conn, transaction_id=pending[0]["id"], merchant="Swiggy")
    assert updated is not None
    assert updated["merchant"] == "Swiggy"
    assert updated["needs_merchant"] == 0

    remaining = get_needs_merchant_transactions(conn)
    assert len(remaining) == 1
    assert remaining[0]["id"] == pending[1]["id"]


def test_integrity_balance_chain_engine(conn):
    fixture_path = Path(__file__).parent / "fixtures" / "canara_sms.txt"
    raw_blob = fixture_path.read_text(encoding="utf-8")
    ingest_sms_records(conn, raw_blob=raw_blob)

    failed = check_balance_chain(conn)
    assert len(failed) == 0

    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO transactions (date, amount_paise, direction, source, balance_paise)
        VALUES ('2026-10-25', 99000, 'DEBIT', 'sms', 500000)
        """
    )
    conn.commit()

    failed_after = check_balance_chain(conn)
    assert len(failed_after) == 1
    assert failed_after[0]["amount_paise"] == 99000


def test_reconciliation_engine_and_totals(conn):
    sms_fixture = Path(__file__).parent / "fixtures" / "canara_sms.txt"
    paytm_fixture = Path(__file__).parent / "fixtures" / "paytm_sample.csv"

    # Ingest SMS first
    ingest_sms_records(conn, raw_blob=sms_fixture.read_text(encoding="utf-8"))

    # Ingest Paytm
    ingest_paytm_records(conn, data=paytm_fixture.read_text(encoding="utf-8"))

    # Check match rate
    rates = get_match_rate(conn)
    assert rates["matched"] == 3
    assert rates["ambiguous"] == 1
    assert rates["unmatched"] == 0

    # Test total spend: linked pairs must not be double counted!
    # For a linked pair (e.g. Zomato Rs 120), only 12000 paise is counted once
    total_debit = calculate_total_spend(conn)
    assert total_debit > 0

    # Ensure linked Paytm row is not added again
    cursor = conn.cursor()
    cursor.execute("SELECT SUM(amount_paise) FROM transactions WHERE UPPER(direction) = 'DEBIT'")
    raw_sum = cursor.fetchone()[0]
    # raw_sum would double-count linked debits (Zomato 12000 + 12000, Chai Point 5500 + 5500 = 17500 paise extra)
    assert total_debit < raw_sum
    assert raw_sum - total_debit == 17500  # Exactly the 2 matched debit pairs (12000 + 5500)
