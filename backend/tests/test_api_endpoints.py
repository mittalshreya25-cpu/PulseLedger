import sqlite3
from pathlib import Path
import pytest
from fastapi import HTTPException

from backend.app.database import init_db
from backend.app.main import (
    SMSIngestRequest,
    PaytmIngestRequest,
    QuickTransactionRequest,
    SetMerchantRequest,
    SimulateRequest,
    RippleRequest,
    ReverseIncomeRequest,
    CliffRequest,
    CoachChatRequest,
    ingest_sms,
    ingest_paytm,
    list_needs_merchant,
    set_merchant,
    quick_transaction,
    get_balance_chain,
    match_rate,
    list_categories,
    recurring_subscriptions,
    simulate_monte_carlo,
    simulate_ripple,
    solve_reverse_income,
    solve_cliff,
    get_nudges,
    get_monthly_report,
    coach_chat,
)
from backend.engines.reconciliation import calculate_total_spend


@pytest.fixture
def db_conn():
    conn = sqlite3.connect(":memory:")
    init_db(conn)
    yield conn
    conn.close()


def test_point_1_schema_columns(db_conn):
    """Point 1: transactions: add columns ref_no (nullable), balance_paise (nullable), dedupe_key (UNIQUE), needs_merchant (bool)."""
    cursor = db_conn.cursor()
    cursor.execute("PRAGMA table_info(transactions);")
    cols = {row[1] for row in cursor.fetchall()}

    assert "ref_no" in cols
    assert "balance_paise" in cols
    assert "dedupe_key" in cols
    assert "needs_merchant" in cols
    assert "matched_paytm_id" in cols

    # Verify dedupe_key uniqueness
    cursor.execute(
        """
        INSERT INTO transactions (date, amount_paise, direction, source, dedupe_key)
        VALUES ('2026-10-31', 1000, 'DEBIT', 'sms', 'test:dedupe:key')
        """
    )
    db_conn.commit()

    with pytest.raises(sqlite3.IntegrityError):
        cursor.execute(
            """
            INSERT INTO transactions (date, amount_paise, direction, source, dedupe_key)
            VALUES ('2026-10-31', 2000, 'CREDIT', 'sms', 'test:dedupe:key')
            """
        )
        db_conn.commit()


def test_point_2_ingest_sms_and_dedupe(db_conn):
    """Point 2: POST /ingest/sms {text, received_at?}: use parse_many; insert only status=='parsed' rows using the parser's dedupe_key.
    If needs_merchant, leave merchant empty and category 'Uncategorized'. Response lists inserted, duplicates_skipped, ignored (with reason), and unparsed.
    Re-posting the same text must insert 0 new rows."""
    fixture_path = Path(__file__).parent / "fixtures" / "canara_sms.txt"
    raw_blob = fixture_path.read_text(encoding="utf-8")

    payload = SMSIngestRequest(text=raw_blob)
    res = ingest_sms(payload=payload, conn=db_conn)

    assert len(res["inserted"]) == 5
    assert len(res["duplicates_skipped"]) == 0
    assert len(res["ignored"]) == 2
    assert len(res["unparsed"]) == 0

    for ign in res["ignored"]:
        assert "reason" in ign
        assert ign["reason"] in ("otp", "feedback_or_promo")

    cursor = db_conn.cursor()
    cursor.execute("SELECT merchant, category, needs_merchant FROM transactions WHERE needs_merchant = 1")
    needs_merchant_rows = cursor.fetchall()
    assert len(needs_merchant_rows) == 4
    for r in needs_merchant_rows:
        assert r[0] == ""
        assert r[1] == "Uncategorized"
        assert r[2] == 1

    # Re-posting the exact same text MUST insert 0 new rows
    res_repeat = ingest_sms(payload=payload, conn=db_conn)
    assert len(res_repeat["inserted"]) == 0
    assert len(res_repeat["duplicates_skipped"]) == 5

    cursor.execute("SELECT COUNT(*) FROM transactions WHERE source = 'sms'")
    assert cursor.fetchone()[0] == 5


def test_point_3_ingest_paytm_dedupe_and_reimport(db_conn):
    """Point 3: POST /ingest/paytm: insert rows with source 'PAYTM', dedupe by upi_ref, else by (date, amount, direction, merchant).
    Re-import inserts 0 rows."""
    paytm_fixture = Path(__file__).parent / "fixtures" / "paytm_sample.csv"
    csv_text = paytm_fixture.read_text(encoding="utf-8")

    res = ingest_paytm(payload=PaytmIngestRequest(csv_text=csv_text), conn=db_conn)
    assert len(res["inserted"]) == 25
    assert len(res["duplicates_skipped"]) == 0
    assert len(res["unparsed"]) == 0

    cursor = db_conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE source = 'PAYTM'")
    assert cursor.fetchone()[0] == 25

    # Re-import MUST insert 0 rows
    res_repeat = ingest_paytm(payload=PaytmIngestRequest(csv_text=csv_text), conn=db_conn)
    assert len(res_repeat["inserted"]) == 0
    assert len(res_repeat["duplicates_skipped"]) == 25

    cursor.execute("SELECT COUNT(*) FROM transactions WHERE source = 'PAYTM'")
    assert cursor.fetchone()[0] == 25


def test_point_4_reconciliation_and_single_count_totals(db_conn):
    """Point 4: Reconciliation: after any ingest, for each SMS debit or credit row still needing a merchant,
    find Paytm rows with the same direction and amount and a date within 1 day.
    Exactly one candidate: link them (copy merchant and category onto the SMS row, set needs_merchant false, store matched_paytm_id)
    and do not create a duplicate spend. Zero or several candidates: leave it in needs-merchant.
    Never double count a linked pair in totals."""
    sms_fixture = Path(__file__).parent / "fixtures" / "canara_sms.txt"
    paytm_fixture = Path(__file__).parent / "fixtures" / "paytm_sample.csv"

    # Step 1: Ingest SMS
    ingest_sms(payload=SMSIngestRequest(text=sms_fixture.read_text(encoding="utf-8")), conn=db_conn)

    # Initially 4 SMS rows need merchant
    cursor = db_conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE source = 'sms' AND needs_merchant = 1")
    assert cursor.fetchone()[0] == 4

    # Step 2: Ingest Paytm (triggers reconciliation)
    ingest_paytm(payload=PaytmIngestRequest(csv_text=paytm_fixture.read_text(encoding="utf-8")), conn=db_conn)

    # 3 SMS rows should now be uniquely matched and cleared from needs_merchant:
    # - Credit 2000 on 2026-06-12 -> Papa Allowance
    # - Debit 120 on 2026-10-20 -> Zomato
    # - Debit 55 on 2026-10-21 -> Chai Point
    cursor.execute("SELECT merchant, category, needs_merchant, matched_paytm_id FROM transactions WHERE source = 'sms' AND matched_paytm_id IS NOT NULL")
    matched_sms_rows = cursor.fetchall()
    assert len(matched_sms_rows) == 3

    matched_merchants = {r[0] for r in matched_sms_rows}
    assert "Papa Allowance" in matched_merchants
    assert "Zomato" in matched_merchants
    assert "Chai Point" in matched_merchants

    for r in matched_sms_rows:
        assert r[2] == 0  # needs_merchant set to False
        assert r[3] is not None  # matched_paytm_id is set

    # Exactly 1 ambiguous debit row (Debit 20 on 2026-10-21 with 2 candidate Paytm rows) stays in needs-merchant!
    cursor.execute("SELECT id, amount_paise, needs_merchant, matched_paytm_id FROM transactions WHERE source = 'sms' AND needs_merchant = 1")
    remaining_needs = cursor.fetchall()
    assert len(remaining_needs) == 1
    assert remaining_needs[0][1] == 2000
    assert remaining_needs[0][2] == 1
    assert remaining_needs[0][3] is None

    # Verify totals: linked pairs counted once and never double-counted!
    total_debit = calculate_total_spend(db_conn)
    cursor.execute("SELECT SUM(amount_paise) FROM transactions WHERE UPPER(direction) = 'DEBIT'")
    raw_sum = cursor.fetchone()[0]
    # raw_sum includes both SMS debits and Paytm debits
    # The linked debits (Zomato 12000 + Chai Point 5500 = 17500) are excluded from Paytm to prevent double counting
    assert raw_sum - total_debit == 17500


def test_point_5_get_needs_merchant_and_manual_update(db_conn):
    """Point 5 & Point 3 & 4: GET /transactions/needs-merchant (newest first) and POST /transactions/{id}/merchant."""
    sms_fixture = Path(__file__).parent / "fixtures" / "canara_sms.txt"
    paytm_fixture = Path(__file__).parent / "fixtures" / "paytm_sample.csv"

    ingest_sms(payload=SMSIngestRequest(text=sms_fixture.read_text(encoding="utf-8")), conn=db_conn)
    ingest_paytm(payload=PaytmIngestRequest(csv_text=paytm_fixture.read_text(encoding="utf-8")), conn=db_conn)

    # Only the ambiguous 20 Rs debit is left in needs-merchant
    needs_rows = list_needs_merchant(conn=db_conn)
    assert len(needs_rows) == 1
    ambiguous_tx_id = needs_rows[0]["id"]
    assert needs_rows[0]["amount_paise"] == 2000

    # User manually resolves the ambiguous merchant
    res = set_merchant(id=ambiguous_tx_id, payload=SetMerchantRequest(merchant="Metro Rail"), conn=db_conn)
    assert res["merchant"] == "Metro Rail"
    assert res["needs_merchant"] == 0

    # Now needs-merchant list is empty
    assert len(list_needs_merchant(conn=db_conn)) == 0


def test_point_6_integrity_match_rate(db_conn):
    """Point 6: GET /integrity/match-rate returns matched, ambiguous, unmatched counts."""
    sms_fixture = Path(__file__).parent / "fixtures" / "canara_sms.txt"
    paytm_fixture = Path(__file__).parent / "fixtures" / "paytm_sample.csv"

    ingest_sms(payload=SMSIngestRequest(text=sms_fixture.read_text(encoding="utf-8")), conn=db_conn)
    ingest_paytm(payload=PaytmIngestRequest(csv_text=paytm_fixture.read_text(encoding="utf-8")), conn=db_conn)

    rate = match_rate(conn=db_conn)
    assert rate["matched"] == 3
    assert rate["ambiguous"] == 1
    assert rate["unmatched"] == 0


def test_point_7_seed_categories(db_conn):
    """Point 7: Seed categories including Investments & Savings and Allowance."""
    categories = list_categories(conn=db_conn)
    assert "Investments & Savings" in categories
    assert "Allowance" in categories
    assert "Food" in categories
    assert "Transport" in categories
    assert "Services" in categories
    assert len(categories) >= 11


def test_advanced_api_endpoints(db_conn):
    """Verifies all new advanced endpoints: recurring, simulate, solvers, nudges, report, coach."""
    # 1. Recurring
    subs = recurring_subscriptions(conn=db_conn)
    assert isinstance(subs, list)

    # 2. Simulate Monte Carlo
    sim = simulate_monte_carlo(payload=SimulateRequest(horizon_days=30, num_runs=50), conn=db_conn)
    assert sim["horizon_days"] == 30
    assert "percentiles_over_time" in sim

    # 3. Simulate Ripple
    ripple = simulate_ripple(payload=RippleRequest(amount_paise=250000), conn=db_conn)
    assert ripple["days_delayed"] >= 1

    # 4. Reverse Income Solver
    rev = solve_reverse_income(
        payload=ReverseIncomeRequest(
            personal_fixed_monthly_paise=2000000,
            personal_discretionary_monthly_paise=1000000,
            city="Bengaluru",
        )
    )
    assert rev["required_annual_ctc_paise"] > 0

    # 5. Cliff Solver
    cliff = solve_cliff(
        payload=CliffRequest(
            remaining_stipend_payments=2,
            monthly_stipend_paise=4000000,
            post_stipend_gap_months=3,
            current_living_cost_paise=3000000,
        )
    )
    assert "needed_buffer_paise" in cliff

    # 6. Nudges
    nudges = get_nudges(conn=db_conn)
    assert isinstance(nudges, list)

    # 7. Monthly Report
    rep = get_monthly_report(month="2026-10", conn=db_conn)
    assert "month" in rep
    assert "narrative" in rep

    # 8. Coach Chat - blocked security
    blocked_chat = coach_chat(payload=CoachChatRequest(message="What stock should I invest in?"), conn=db_conn)
    assert blocked_chat["status"] == "blocked"
    assert len(blocked_chat["suggested_scenarios"]) > 0

    # 9. Coach Chat - allowed financial query
    ok_chat = coach_chat(payload=CoachChatRequest(message="What is my safe to spend limit today?"), conn=db_conn)
    assert ok_chat["status"] == "ok"
    assert "overcommitted" in ok_chat["message"] or "Safe-to-Spend" in ok_chat["message"]

