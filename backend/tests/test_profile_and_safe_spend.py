import sqlite3
import pytest
from datetime import date

from backend.app.database import init_db
from backend.app.main import (
    BalancePayload,
    FixedCost,
    GoalItem,
    IncomeStream,
    ProfilePayload,
    get_profile_endpoint,
    safe_to_spend_endpoint,
    set_balance_endpoint,
    update_profile_endpoint,
)
from backend.engines.profile import (
    clear_manual_balance,
    get_manual_balance,
    get_profile,
    save_profile,
    seed_placeholder_profile,
    set_manual_balance,
)
from backend.engines.spend import compute_safe_to_spend, get_spent_today_debits


@pytest.fixture
def db_conn():
    conn = sqlite3.connect(":memory:")
    init_db(conn)
    yield conn
    conn.close()


def test_profile_endpoints_and_placeholder_seed(db_conn):
    """Requirement 1: GET/PUT /profile with income streams, fixed_costs, goals, buffer_paise, many_small_inflows.
    Seeded placeholders: buffer 20000 paise, one goal 'PLACEHOLDER Laptop fund' 6000000 target, saved 0,
    target 2027-06-30, monthly_alloc 300000.
    """
    prof = get_profile_endpoint(conn=db_conn)
    assert prof["buffer_paise"] == 20000
    assert prof["many_small_inflows"] is False
    assert len(prof["goals"]) >= 1

    placeholder_goal = next(
        g for g in prof["goals"] if "PLACEHOLDER Laptop fund" in (g.get("title") or g.get("name") or "")
    )
    assert placeholder_goal["target_paise"] == 6000000
    assert placeholder_goal["saved_paise"] == 0
    assert placeholder_goal["target_date"] == "2027-06-30"
    assert placeholder_goal["monthly_alloc_paise"] == 300000

    # PUT /profile update
    update_payload = ProfilePayload(
        income_streams=[
            IncomeStream(name="Salary", amount_paise=4000000, cadence="monthly", next_date="2026-11-01")
        ],
        fixed_costs=[FixedCost(name="Rent", amount_paise=1200000, due_day=5)],
        goals=[
            GoalItem(
                title="Emergency Fund",
                target_paise=10000000,
                saved_paise=2000000,
                target_date="2027-12-31",
                monthly_alloc_paise=500000,
            )
        ],
        buffer_paise=50000,
        many_small_inflows=True,
    )
    updated = update_profile_endpoint(payload=update_payload, conn=db_conn)
    assert updated["buffer_paise"] == 50000
    assert updated["many_small_inflows"] is True
    assert len(updated["income_streams"]) == 1
    assert updated["income_streams"][0]["name"] == "Salary"
    assert len(updated["fixed_costs"]) == 1
    assert updated["fixed_costs"][0]["name"] == "Rent"
    assert len(updated["goals"]) == 1
    assert updated["goals"][0]["title"] == "Emergency Fund"


def test_manual_balance_override(db_conn):
    """Requirement 3: POST /balance {balance_paise} for manual override."""
    res = set_balance_endpoint(payload=BalancePayload(balance_paise=450000), conn=db_conn)
    assert res["balance_paise"] == 450000
    assert res["status"] == "ok"

    # Query via engine function
    assert get_manual_balance(db_conn) == 450000

    # Clear and verify None
    clear_manual_balance(db_conn)
    assert get_manual_balance(db_conn) is None


def test_safe_to_spend_case_1_standard_month_end(db_conn):
    """Hand-computed Case 1: Standard horizon to month end.
    
    Today: 2026-10-21 (11 days to Oct 31).
    SMS balance: 1000000 paise.
    Spent today: 50000 paise.
    Buffer: 20000 paise.
    Commitments: Rent 100000 paise (due Oct 25).
    Goals: 1 goal with 300000 monthly_alloc -> (300000 * 11) // 30 = 110000 paise.
    Inflows: 0.
    
    pool = 1000000 + 0 - 100000 - 110000 - 20000 = 770000 paise.
    daily = 770000 // 11 = 70000 paise.
    today_budget = (770000 + 50000) // 11 = 820000 // 11 = 74545 paise.
    remaining_today = 74545 - 50000 = 24545 paise.
    """
    # 1. Profile setup
    save_profile(
        db_conn,
        {
            "income_streams": [],
            "fixed_costs": [
                {"name": "Rent", "amount_paise": 100000, "due_day": 25},
                {"name": "Past Electricity", "amount_paise": 50000, "due_day": 15},
            ],
            "goals": [
                {
                    "title": "Laptop fund",
                    "target_paise": 6000000,
                    "saved_paise": 0,
                    "target_date": "2027-06-30",
                    "monthly_alloc_paise": 300000,
                }
            ],
            "buffer_paise": 20000,
            "many_small_inflows": False,
        },
    )

    # 2. Add SMS row with balance_paise = 1000000
    cursor = db_conn.cursor()
    cursor.execute(
        """
        INSERT INTO transactions (date, amount_paise, direction, source, balance_paise)
        VALUES ('2026-10-21', 10000, 'DEBIT', 'sms', 1000000)
        """
    )
    # Today's spend = 50000 paise
    cursor.execute(
        """
        INSERT INTO transactions (date, amount_paise, direction, source, balance_paise)
        VALUES ('2026-10-21', 50000, 'DEBIT', 'manual', NULL)
        """
    )
    db_conn.commit()

    res = safe_to_spend_endpoint(today="2026-10-21", conn=db_conn)

    assert res["horizon_days"] == 11
    assert res["liquid_paise"] == 1000000
    assert res["needs_balance"] is False
    assert res["inflows_paise"] == 0
    assert res["commitments_paise"] == 100000
    assert res["goal_alloc_paise"] == 110000
    assert res["buffer_paise"] == 20000
    assert res["pool_paise"] == 770000
    assert res["daily_paise"] == 70000
    assert res["spent_today_paise"] == 60000  # 10000 + 50000 debits today
    # today_budget = (770000 + 60000) // 11 = 830000 // 11 = 75454
    assert res["today_budget_paise"] == 75454
    assert res["remaining_today_paise"] == 75454 - 60000
    assert res["overcommitted_paise"] == 0
    assert res["status"] == "ok"
    assert len(res["locked_items"]) == 1
    assert res["locked_items"][0]["name"] == "Rent"
    assert res["locked_items"][0]["due_date"] == "2026-10-25"


def test_safe_to_spend_case_2_inflow_shortens_horizon(db_conn):
    """Hand-computed Case 2: Inflow shortens horizon.
    
    Today: 2026-10-10.
    Inflow next_date: 2026-10-15 -> horizon = (15 - 10) + 1 = 6 days.
    Manual override balance: 200000 paise.
    Inflows: 500000 paise.
    Commitments: Wifi 80000 paise (due Oct 12).
    Goals: monthly_alloc 600000 -> (600000 * 6) // 30 = 120000 paise.
    Buffer: 50000 paise.
    Spent today: 0 paise.
    
    pool = 200000 + 500000 - 80000 - 120000 - 50000 = 450000 paise.
    daily = 450000 // 6 = 75000 paise.
    today_budget = 75000 paise.
    remaining_today = 75000 paise.
    """
    save_profile(
        db_conn,
        {
            "income_streams": [
                {"name": "Freelance", "amount_paise": 500000, "cadence": "one_time", "next_date": "2026-10-15"}
            ],
            "fixed_costs": [
                {"name": "Wifi", "amount_paise": 80000, "due_day": 12}
            ],
            "goals": [
                {"title": "Goal", "target_paise": 1000000, "saved_paise": 0, "target_date": "2027-01-01", "monthly_alloc_paise": 600000}
            ],
            "buffer_paise": 50000,
            "many_small_inflows": False,
        },
    )

    set_manual_balance(db_conn, 200000)

    res = compute_safe_to_spend(conn=db_conn, today="2026-10-10")

    assert res["horizon_days"] == 6
    assert res["liquid_paise"] == 200000
    assert res["inflows_paise"] == 500000
    assert res["commitments_paise"] == 80000
    assert res["goal_alloc_paise"] == 120000
    assert res["buffer_paise"] == 50000
    assert res["pool_paise"] == 450000
    assert res["daily_paise"] == 75000
    assert res["today_budget_paise"] == 75000
    assert res["remaining_today_paise"] == 75000
    assert res["overcommitted_paise"] == 0
    assert res["status"] == "ok"


def test_safe_to_spend_case_3_many_small_inflows_caps_horizon(db_conn):
    """Hand-computed Case 3: many_small_inflows caps horizon at 7 days.
    
    Today: 2026-10-01.
    many_small_inflows: True -> horizon = 7 days.
    SMS balance: 500000 paise.
    Buffer: 10000 paise.
    Commitments: Gym 150000 paise (due Oct 5 inside horizon); Tuition 200000 paise (due Oct 20 outside horizon).
    Goals: monthly_alloc 300000 -> (300000 * 7) // 30 = 70000 paise.
    Spent today: 30000 paise.
    
    pool = 500000 + 0 - 150000 - 70000 - 10000 = 270000 paise.
    daily = 270000 // 7 = 38571 paise.
    today_budget = (270000 + 30000) // 7 = 300000 // 7 = 42857 paise.
    remaining_today = 42857 - 30000 = 12857 paise.
    """
    save_profile(
        db_conn,
        {
            "income_streams": [],
            "fixed_costs": [
                {"name": "Gym", "amount_paise": 150000, "due_day": 5},
                {"name": "Tuition", "amount_paise": 200000, "due_day": 20},
            ],
            "goals": [
                {"title": "G", "target_paise": 500000, "saved_paise": 0, "target_date": "2027-01-01", "monthly_alloc_paise": 300000}
            ],
            "buffer_paise": 10000,
            "many_small_inflows": True,
        },
    )

    cursor = db_conn.cursor()
    cursor.execute(
        """
        INSERT INTO transactions (date, amount_paise, direction, source, balance_paise)
        VALUES ('2026-10-01', 30000, 'DEBIT', 'sms', 500000)
        """
    )
    db_conn.commit()

    res = compute_safe_to_spend(conn=db_conn, today="2026-10-01")

    assert res["horizon_days"] == 7
    assert res["commitments_paise"] == 150000
    assert len(res["locked_items"]) == 1
    assert res["locked_items"][0]["name"] == "Gym"
    assert res["goal_alloc_paise"] == 70000
    assert res["buffer_paise"] == 10000
    assert res["pool_paise"] == 270000
    assert res["daily_paise"] == 38571
    assert res["today_budget_paise"] == 42857
    assert res["remaining_today_paise"] == 12857
    assert res["overcommitted_paise"] == 0
    assert res["status"] == "ok"


def test_safe_to_spend_case_4_overcommitted(db_conn):
    """Case 4: Overcommitted case returns plain sentence.
    
    Today: 2026-10-25 (7 days to Oct 31).
    SMS balance: 150000 paise.
    Buffer: 20000 paise.
    Commitments: Loan EMI 400000 paise (due Oct 28).
    
    pool = 150000 - 400000 - 20000 = -270000 paise.
    overcommitted = 270000 paise.
    daily = 0.
    status = "overcommitted".
    """
    save_profile(
        db_conn,
        {
            "income_streams": [],
            "fixed_costs": [
                {"name": "Loan EMI", "amount_paise": 400000, "due_day": 28}
            ],
            "goals": [],
            "buffer_paise": 20000,
            "many_small_inflows": False,
        },
    )

    cursor = db_conn.cursor()
    cursor.execute(
        """
        INSERT INTO transactions (date, amount_paise, direction, source, balance_paise)
        VALUES ('2026-10-25', 1000, 'DEBIT', 'sms', 150000)
        """
    )
    db_conn.commit()

    res = compute_safe_to_spend(conn=db_conn, today="2026-10-25")

    assert res["overcommitted_paise"] == 270000
    assert res["pool_paise"] == -270000
    assert res["daily_paise"] == 0
    assert res["status"] == "overcommitted"

    # Plain sentence when overcommitted
    assert res["overcommitted_sentence"] is not None
    assert "exceed" in res["sentence"].lower() or "overcommitted" in res["sentence"].lower()
    assert "2700" in res["sentence"] or "2,700" in res["sentence"]


def test_safe_to_spend_case_5_no_balance(db_conn):
    """Case 5: With no SMS rows and no manual balance, liquid = 0 and needs_balance = True."""
    res = compute_safe_to_spend(conn=db_conn, today="2026-10-31")

    assert res["liquid_paise"] == 0
    assert res["needs_balance"] is True

