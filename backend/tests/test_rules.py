import json
from pathlib import Path
import sqlite3
import pytest
from fastapi import HTTPException, Request

from backend.app.database import init_db
from backend.app.main import (
    RuleApplyRequest,
    RulePreviewRequest,
    RuleUndoRequest,
    apply_rule_route,
    preview_rule_get,
    preview_rule_post,
    undo_rule_path,
    undo_rule_post,
    quick_transaction,
    QuickTransactionRequest,
)
from backend.engines.categorizer import (
    categorize,
    check_tier1_rules,
    get_llm_calls,
    get_merchant_dictionary,
    llm_calls,
    reset_llm_calls,
)
from backend.engines.rules import (
    apply_rule,
    get_rules,
    preview_rule,
    undo_rule,
)
from backend.engines.transactions import create_quick_transaction


@pytest.fixture
def db_conn():
    conn = sqlite3.connect(":memory:")
    init_db(conn)
    yield conn
    conn.close()


def test_merchant_dictionary_loaded():
    """Requirement 1: data/merchants.json contains ~40 common Indian merchants mapped to categories."""
    merchants = get_merchant_dictionary()
    assert len(merchants) >= 35, f"Expected >= 35 merchants, found {len(merchants)}"

    expected_merchants = [
        "McDonalds",
        "Chaayos",
        "Zomato",
        "Swiggy",
        "District",
        "BookMyShow",
        "Rapido",
        "Uber",
        "Porter",
        "Netflix",
        "Spotify",
        "OpenAI",
        "Jio",
        "Airtel",
        "College Fee",
    ]
    for m in expected_merchants:
        assert m in merchants or m.lower() in [k.lower() for k in merchants], f"Missing merchant: {m}"

    # Check categories
    assert merchants["McDonalds"] == "Food"
    assert merchants["Swiggy"] == "Food"
    assert merchants["BookMyShow"] == "Entertainment"
    assert merchants["Rapido"] == "Transport"
    assert merchants["Porter"] == "Services"
    assert merchants["OpenAI"] == "Services"
    assert merchants["College Fee"] == "Education"


def test_tier2_categorizer_uses_merchants_json():
    """Tier 2 of categorizer uses merchants.json."""
    assert categorize(merchant="McDonalds") == "Food"
    assert categorize(merchant="Chaayos") == "Food"
    assert categorize(merchant="Zomato") == "Food"
    assert categorize(merchant="District") == "Entertainment"
    assert categorize(merchant="BookMyShow") == "Entertainment"
    assert categorize(merchant="Rapido") == "Transport"
    assert categorize(merchant="Uber") == "Transport"
    assert categorize(merchant="Porter") == "Services"
    assert categorize(merchant="Netflix") == "Entertainment"
    assert categorize(merchant="Spotify") == "Entertainment"
    assert categorize(merchant="OpenAI") == "Services"
    assert categorize(merchant="Jio") == "Services"
    assert categorize(merchant="Airtel") == "Services"
    assert categorize(raw_text="College Fee 3rd semester payment") == "Education"


def test_specificity_ordering(db_conn):
    """Requirement 2: Tier 1 checks rules first, ordered by specificity.
    
    (exact payee+band beats payee beats substring)
    """
    cursor = db_conn.cursor()
    # Rule 1: exact payee + band (specificity 30) -> Transport
    cursor.execute(
        """
        INSERT INTO rules (payee_pattern, amount_min, amount_max, direction, category, specificity, active)
        VALUES ('Uber', 10000, 30000, 'DEBIT', 'Transport', 30, 1)
        """
    )
    # Rule 2: exact payee (specificity 20) -> Miscellaneous
    cursor.execute(
        """
        INSERT INTO rules (payee_pattern, direction, category, specificity, active)
        VALUES ('Uber', 'DEBIT', 'Miscellaneous', 20, 1)
        """
    )
    # Rule 3: substring pattern (specificity 10) -> Services
    cursor.execute(
        """
        INSERT INTO rules (payee_pattern, direction, category, specificity, active)
        VALUES ('uber', 'DEBIT', 'Services', 10, 1)
        """
    )
    db_conn.commit()

    # Case 1: "Uber" with amount 20000 (within 10000..30000 band)
    # Rule 1 (specificity 30) should win over Rule 2 and Rule 3
    cat1 = categorize(merchant="Uber", amount_paise=20000, direction="DEBIT", conn=db_conn)
    assert cat1 == "Transport"

    # Case 2: "Uber" with amount 50000 (outside band of Rule 1)
    # Rule 1 fails band check. Rule 2 (specificity 20) should win over Rule 3
    cat2 = categorize(merchant="Uber", amount_paise=50000, direction="DEBIT", conn=db_conn)
    assert cat2 == "Miscellaneous"

    # Case 3: "Uber Trip Services" (payee is not exact "Uber", but contains "uber" substring)
    # Rule 1 and Rule 2 fail exact payee check. Rule 3 (specificity 10) matches substring!
    cat3 = categorize(merchant="Uber Trip Services", amount_paise=20000, direction="DEBIT", conn=db_conn)
    assert cat3 == "Services"


def test_preview_equals_apply(db_conn):
    """Requirement 3 & 4: GET /rules/preview returns how many past rows would change,
    their total, and up to 5 examples. It changes nothing.
    POST /rules/apply saves the rule, updates all matching rows in one DB transaction,
    writes rule_audit rows, recomputes totals, and returns counts equal to preview.
    """
    # Seed transactions
    tx1 = create_quick_transaction(db_conn, amount_paise=15000, direction="DEBIT", merchant="Swiggy", category="Uncategorized")
    tx2 = create_quick_transaction(db_conn, amount_paise=25000, direction="DEBIT", merchant="Swiggy", category="Uncategorized")
    tx3 = create_quick_transaction(db_conn, amount_paise=35000, direction="DEBIT", merchant="Swiggy", category="Uncategorized")

    # Preview rule to set Swiggy -> Food
    prev = preview_rule(db_conn, transaction_id=tx1["id"], scope="payee_always", category="Food")
    assert prev["count"] == 3
    assert prev["total_paise"] == 75000
    assert len(prev["examples"]) == 3

    # Assert preview changed NOTHING in the database
    cursor = db_conn.cursor()
    cursor.execute("SELECT category FROM transactions WHERE id IN (?, ?, ?)", (tx1["id"], tx2["id"], tx3["id"]))
    cats_after_prev = [r[0] for r in cursor.fetchall()]
    assert all(c == "Uncategorized" for c in cats_after_prev)

    # Apply rule
    app_res = apply_rule(db_conn, transaction_id=tx1["id"], scope="payee_always", category="Food")
    assert app_res["count"] == prev["count"]
    assert app_res["total_paise"] == prev["total_paise"]
    assert len(app_res["examples"]) == len(prev["examples"])

    # Verify rows in DB were updated
    cursor.execute("SELECT category FROM transactions WHERE id IN (?, ?, ?)", (tx1["id"], tx2["id"], tx3["id"]))
    cats_after_app = [r[0] for r in cursor.fetchall()]
    assert all(c == "Food" for c in cats_after_app)

    # Verify rule_audit table has old and new categories recorded
    cursor.execute("SELECT old_category, new_category FROM rule_audit WHERE rule_id = ?", (app_res["rule_id"],))
    audit_rows = cursor.fetchall()
    assert len(audit_rows) == 3
    assert all(r[0] == "Uncategorized" and r[1] == "Food" for r in audit_rows)


def test_repeat_apply_is_idempotent(db_conn):
    """Repeat apply is idempotent: second apply modifies 0 rows and creates no duplicate audits."""
    tx1 = create_quick_transaction(db_conn, amount_paise=20000, direction="DEBIT", merchant="Zomato", category="Uncategorized")
    tx2 = create_quick_transaction(db_conn, amount_paise=30000, direction="DEBIT", merchant="Zomato", category="Uncategorized")

    # First apply
    first_res = apply_rule(db_conn, transaction_id=tx1["id"], scope="payee_always", category="Food")
    assert first_res["count"] == 2
    rule_id = first_res["rule_id"]

    cursor = db_conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM rule_audit WHERE rule_id = ?", (rule_id,))
    assert cursor.fetchone()[0] == 2

    # Second apply (identical arguments)
    second_res = apply_rule(db_conn, transaction_id=tx1["id"], scope="payee_always", category="Food")
    assert second_res["count"] == 0
    assert second_res["total_paise"] == 0

    # Verify no new audits created
    cursor.execute("SELECT COUNT(*) FROM rule_audit WHERE rule_id = ?", (rule_id,))
    assert cursor.fetchone()[0] == 2


def test_undo_restores_exactly(db_conn):
    """Requirement 5: POST /rules/undo restores every row exactly from rule_audit and deactivates rule."""
    tx1 = create_quick_transaction(db_conn, amount_paise=10000, direction="DEBIT", merchant="Netflix", category="Uncategorized")
    tx2 = create_quick_transaction(db_conn, amount_paise=20000, direction="DEBIT", merchant="Netflix", category="Miscellaneous")

    # Apply rule setting Netflix -> Entertainment
    res = apply_rule(db_conn, transaction_id=tx1["id"], scope="payee_always", category="Entertainment")
    assert res["count"] == 2
    rule_id = res["rule_id"]

    cursor = db_conn.cursor()
    cursor.execute("SELECT category FROM transactions WHERE id IN (?, ?)", (tx1["id"], tx2["id"]))
    assert [r[0] for r in cursor.fetchall()] == ["Entertainment", "Entertainment"]

    # Undo rule
    undo_res = undo_rule(db_conn, rule_id=rule_id)
    assert undo_res["restored_count"] == 2
    assert undo_res["active"] == 0

    # Verify transactions restored EXACTLY to their previous categories
    cursor.execute("SELECT id, category FROM transactions WHERE id IN (?, ?) ORDER BY id ASC", (tx1["id"], tx2["id"]))
    rows = cursor.fetchall()
    assert rows[0][1] == "Uncategorized"
    assert rows[1][1] == "Miscellaneous"

    # Verify rule is deactivated
    cursor.execute("SELECT active FROM rules WHERE id = ?", (rule_id,))
    assert cursor.fetchone()[0] == 0


def test_different_payee_is_untouched(db_conn):
    """Rule preview, apply, and undo touch only the specified payee; different payees remain untouched."""
    tx_swiggy = create_quick_transaction(db_conn, amount_paise=25000, direction="DEBIT", merchant="Swiggy", category="Uncategorized")
    tx_zomato = create_quick_transaction(db_conn, amount_paise=30000, direction="DEBIT", merchant="Zomato", category="Uncategorized")

    # Preview Swiggy
    prev = preview_rule(db_conn, transaction_id=tx_swiggy["id"], scope="payee_always", category="Food")
    assert prev["count"] == 1
    assert prev["examples"][0]["id"] == tx_swiggy["id"]

    # Apply Swiggy rule
    app_res = apply_rule(db_conn, transaction_id=tx_swiggy["id"], scope="payee_always", category="Food")
    assert app_res["count"] == 1

    # Verify Zomato transaction was NOT touched
    cursor = db_conn.cursor()
    cursor.execute("SELECT category FROM transactions WHERE id = ?", (tx_zomato["id"],))
    assert cursor.fetchone()[0] == "Uncategorized"

    # Undo Swiggy rule
    undo_rule(db_conn, rule_id=app_res["rule_id"])

    # Verify Zomato transaction still untouched
    cursor.execute("SELECT category FROM transactions WHERE id = ?", (tx_zomato["id"],))
    assert cursor.fetchone()[0] == "Uncategorized"


def test_newly_ingested_row_classified_by_rule_zero_llm_calls(db_conn):
    """Requirement 6: After apply, a newly ingested row for the same payee is
    classified by the rule with zero LLM calls (add an llm_calls counter and assert 0).
    """
    # Seed an initial transaction to base the rule on
    tx_initial = create_quick_transaction(
        db_conn,
        amount_paise=15000,
        direction="DEBIT",
        merchant="CustomCafe",
        category="Uncategorized",
    )

    # Apply rule mapping "CustomCafe" -> "Food"
    app_res = apply_rule(
        db_conn,
        transaction_id=tx_initial["id"],
        scope="payee_always",
        category="Food",
    )
    assert app_res["count"] == 1

    # Reset llm_calls counter
    reset_llm_calls()
    assert get_llm_calls() == 0
    assert llm_calls == 0

    # Ingest a new transaction for the same payee
    new_tx = create_quick_transaction(
        db_conn,
        amount_paise=22000,
        direction="DEBIT",
        merchant="CustomCafe",
    )

    # Verify it is classified as "Food" by Tier 1 rule
    assert new_tx["category"] == "Food"

    # Assert exactly 0 LLM calls were made
    assert get_llm_calls() == 0
    assert llm_calls == 0


def test_rules_api_endpoints(db_conn):
    """Test GET /rules/preview, POST /rules/preview, POST /rules/apply, and POST /rules/undo endpoints."""
    tx1 = create_quick_transaction(
        db_conn,
        amount_paise=50000,
        direction="DEBIT",
        merchant="SpecialMerchant",
        category="Uncategorized",
    )

    # 1. Preview endpoint via GET
    prev_get = preview_rule_get(
        transaction_id=tx1["id"],
        scope="payee_always",
        category="Entertainment",
        conn=db_conn,
    )
    assert prev_get["count"] == 1
    assert prev_get["total_paise"] == 50000

    # 2. Preview endpoint via POST
    preview_payload = RulePreviewRequest(
        transaction_id=tx1["id"],
        scope="payee_always",
        category="Entertainment",
    )
    prev_post = preview_rule_post(payload=preview_payload, conn=db_conn)
    assert prev_post["count"] == 1
    assert prev_post["total_paise"] == 50000

    # 3. Apply endpoint
    apply_req = RuleApplyRequest(
        transaction_id=tx1["id"],
        scope="payee_always",
        category="Entertainment",
    )
    apply_res = apply_rule_route(payload=apply_req, conn=db_conn)
    assert apply_res["count"] == 1
    rule_id = apply_res["rule_id"]

    # Verify updated
    cursor = db_conn.cursor()
    cursor.execute("SELECT category FROM transactions WHERE id = ?", (tx1["id"],))
    assert cursor.fetchone()[0] == "Entertainment"

    # 4. Undo endpoint via POST body
    undo_payload = RuleUndoRequest(rule_id=rule_id)
    undo_res = undo_rule_post(payload=undo_payload, conn=db_conn)
    assert undo_res["restored_count"] == 1
    assert undo_res["active"] == 0

    cursor.execute("SELECT category FROM transactions WHERE id = ?", (tx1["id"],))
    assert cursor.fetchone()[0] == "Uncategorized"

    # Re-apply and test undo via path param
    apply_res2 = apply_rule_route(payload=apply_req, conn=db_conn)
    assert apply_res2["count"] == 1
    undo_res2 = undo_rule_path(rule_id=apply_res2["rule_id"], conn=db_conn)
    assert undo_res2["restored_count"] == 1
    assert undo_res2["active"] == 0


def test_payee_in_band_preview_and_apply(db_conn):
    """Test payee_in_band scope creates band around amount and only affects rows within band."""
    # Target transaction: 10000 paise
    tx_target = create_quick_transaction(db_conn, amount_paise=10000, direction="DEBIT", merchant="CoffeeCo", category="Uncategorized")
    # In-band transaction: 11000 paise (within default 80% - 120%: 8000..12000)
    tx_in_band = create_quick_transaction(db_conn, amount_paise=11000, direction="DEBIT", merchant="CoffeeCo", category="Uncategorized")
    # Out-of-band transaction: 25000 paise
    tx_out_band = create_quick_transaction(db_conn, amount_paise=25000, direction="DEBIT", merchant="CoffeeCo", category="Uncategorized")

    prev = preview_rule(db_conn, transaction_id=tx_target["id"], scope="payee_in_band", category="Food")
    assert prev["count"] == 2  # target (10000) and in-band (11000)
    assert prev["total_paise"] == 21000

    apply_res = apply_rule(db_conn, transaction_id=tx_target["id"], scope="payee_in_band", category="Food")
    assert apply_res["count"] == 2
    assert apply_res["total_paise"] == 21000

    cursor = db_conn.cursor()
    cursor.execute("SELECT category FROM transactions WHERE id = ?", (tx_out_band["id"],))
    assert cursor.fetchone()[0] == "Uncategorized"  # Out of band untouched
