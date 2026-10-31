import sqlite3
import pytest
from datetime import date, timedelta

from backend.app.database import init_db
from backend.engines.recurring import (
    _median,
    _mad,
    detect_recurring_series,
)
from backend.engines.simulate import (
    run_monte_carlo_simulation,
    compute_goal_ripple,
)
from backend.engines.solver import (
    calculate_in_hand_from_ctc,
    solve_required_ctc,
    solve_cliff_partition,
)
from backend.engines.guardrails import (
    check_intent_firewall,
    validate_model_output,
    get_asset_class_scenarios,
)
from backend.engines.nudges import calculate_category_nudges
from backend.engines.report import (
    generate_monthly_review,
    verify_numeric_grounding,
)
from backend.engines.profile import save_profile


@pytest.fixture
def test_db():
    conn = sqlite3.connect(":memory:")
    init_db(conn)
    # Seed sample profile
    save_profile(
        conn,
        {
            "buffer_paise": 500000,  # ₹5,000
            "income_streams": [
                {"name": "Stipend", "amount_paise": 3000000, "cadence": "monthly", "next_date": "2026-11-01"}
            ],
            "fixed_costs": [
                {"name": "Hostel & Rent", "amount_paise": 1000000, "due_day": 5}
            ],
            "goals": [
                {"name": "MacBook Fund", "target_paise": 10000000, "saved_paise": 2000000, "monthly_alloc_paise": 500000}
            ],
        },
    )
    yield conn
    conn.close()


# -------------------- RECURRING SUBSCRIPTIONS ENGINE --------------------

def test_recurring_helpers():
    assert _median([10, 20, 30]) == 20.0
    assert _median([10, 20, 30, 40]) == 25.0
    assert _median([]) == 0.0
    assert _mad([10, 20, 30], 20.0) == 10.0


def test_detect_recurring_series(test_db):
    cursor = test_db.cursor()
    # Insert 3 monthly Netflix transactions (₹499 then ₹499 then ₹649 -> price increase alert)
    cursor.execute(
        """
        INSERT INTO transactions (date, amount_paise, direction, merchant, category, source)
        VALUES 
            ('2026-08-01', 49900, 'DEBIT', 'Netflix', 'Entertainment', 'sms'),
            ('2026-09-01', 49900, 'DEBIT', 'Netflix', 'Entertainment', 'sms'),
            ('2026-10-01', 64900, 'DEBIT', 'Netflix', 'Entertainment', 'sms')
        """
    )
    test_db.commit()

    series = detect_recurring_series(test_db)
    assert len(series) == 1
    s = series[0]
    assert s["merchant"] == "Netflix"
    assert s["cadence"] == "monthly"
    assert len(s["alerts"]) == 1
    assert s["alerts"][0]["kind"] == "price_change"
    assert s["alerts"][0]["old_amount_paise"] == 49900
    assert s["alerts"][0]["new_amount_paise"] == 64900
    assert s["latest_amount_paise"] == 64900
    assert s["estimated_annual_paise"] == 49900 * 12


# -------------------- SIMULATION & MONTE CARLO ENGINE --------------------

def test_monte_carlo_simulation(test_db):
    cursor = test_db.cursor()
    # Insert some historical debits for bootstrap
    for i in range(1, 15):
        cursor.execute(
            """
            INSERT INTO transactions (date, amount_paise, direction, source, balance_paise)
            VALUES (?, ?, 'DEBIT', 'sms', ?)
            """,
            (f"2026-10-{i:02d}", 25000 + (i * 1000), 2000000 - (i * 20000)),
        )
    test_db.commit()

    res = run_monte_carlo_simulation(test_db, horizon_days=90, num_runs=200, seed=42)
    assert res["horizon_days"] == 90
    assert res["num_runs"] == 200
    assert len(res["percentiles_over_time"]) > 0
    assert 0.0 <= res["shortfall_probability"] <= 1.0
    assert 0.0 <= res["buffer_breach_probability"] <= 1.0

    p_last = res["percentiles_over_time"][-1]
    # Check percentile ordering: P10 <= P25 <= P50 <= P75 <= P90
    assert p_last["p10"] <= p_last["p25"] <= p_last["p50"] <= p_last["p75"] <= p_last["p90"]


def test_goal_ripple(test_db):
    ripple = compute_goal_ripple(test_db, transaction_amount_paise=500000, seed=42)
    assert "days_delayed" in ripple
    assert ripple["days_delayed"] >= 1
    assert "ripple_message" in ripple
    assert "₹5000.00" in ripple["ripple_message"]


# -------------------- SOLVER & TAX ENGINE --------------------

def test_calculate_in_hand_from_ctc():
    # Below rebate threshold (<= 7L taxable), tax is 0 under Sec 87A
    in_hand_6L = calculate_in_hand_from_ctc(60000000)  # ₹6 LPA
    assert in_hand_6L > 0
    # Annual CTC 12 LPA has tax
    in_hand_12L = calculate_in_hand_from_ctc(120000000)  # ₹12 LPA
    assert in_hand_12L > in_hand_6L
    assert in_hand_12L < 120000000  # Taxes and EPF deducted


def test_solve_required_ctc():
    res = solve_required_ctc(
        personal_fixed_monthly_paise=3000000,      # ₹30,000
        personal_discretionary_monthly_paise=1500000, # ₹15,000
        family_support_monthly_paise=1000000, # ₹10,000
        monthly_goal_savings_paise=1500000,   # ₹15,000
        city="Bengaluru",
        slack_ratio=0.10,
    )
    assert res["city"] == "Bengaluru"
    assert res["city_multiplier"] == 1.25
    assert res["required_annual_ctc_paise"] > 0
    assert res["required_monthly_ctc_paise"] == res["required_annual_ctc_paise"] // 12
    assert res["sensitivity_delta_paise_for_5k"] > 0


def test_solve_cliff_partition():
    cliff = solve_cliff_partition(
        remaining_stipend_payments=3,
        monthly_stipend_paise=5000000,  # ₹50,000/mo
        post_stipend_gap_months=4,
        current_living_cost_paise=3500000,  # ₹35,000/mo
        current_liquid_savings_paise=2000000,  # ₹20,000
    )
    assert cliff["remaining_payments"] == 3
    assert cliff["gap_months"] == 4
    assert cliff["needed_buffer_paise"] == (4 * 3500000) - 2000000
    assert "withhold_per_payment_paise" in cliff
    assert "actionable_levers" in cliff


# -------------------- GUARDRAILS ENGINE --------------------

def test_intent_firewall_blocks_ticker_and_advice():
    # Specific securities queries must be blocked
    blocked, reason, pivot = check_intent_firewall("Should I buy Tata Motors or Reliance stock right now?")
    assert blocked is True
    assert "TATA" in reason or "security" in reason
    assert pivot is not None

    # Crypto queries must be blocked
    blocked, _, _ = check_intent_firewall("Which crypto or mutual fund gives 30% return?")
    assert blocked is True

    # Benign queries should pass
    blocked, _, _ = check_intent_firewall("Can I afford to buy a laptop for college next month?")
    assert blocked is False

    # Generic educational query passes or gives asset classes
    scenarios = get_asset_class_scenarios()
    assert len(scenarios) >= 3
    assert any("Emergency Buffer" in s["name"] for s in scenarios)


def test_validate_model_output():
    # Output containing stock ticker or buy recommendation must be blocked
    bad_output = "I recommend you buy Nifty 50 or Reliance shares tomorrow."
    valid, sanitized = validate_model_output(bad_output)
    assert valid is False
    assert "generic asset-class" in sanitized or "educational financial coach" in sanitized

    # Safe output passes cleanly
    safe_output = "Based on your safe-to-spend limit, you have ₹1,200 available today."
    valid, clean = validate_model_output(safe_output)
    assert valid is True
    assert clean == safe_output


# -------------------- NUDGES ENGINE --------------------

def test_calculate_category_nudges(test_db):
    # If day < 4, guard returns empty
    early_nudges = calculate_category_nudges(test_db, today=date(2026, 10, 2))
    assert early_nudges == []

    # If day >= 4 and high spend in Food
    cursor = test_db.cursor()
    cursor.execute(
        """
        INSERT INTO transactions (date, amount_paise, direction, merchant, category, source)
        VALUES ('2026-10-05', 2500000, 'DEBIT', 'Swiggy', 'Food', 'sms')
        """
    )
    test_db.commit()

    nudges = calculate_category_nudges(test_db, today=date(2026, 10, 10))
    # We should detect high velocity in Food
    assert any(n["category"] == "Food" for n in nudges)
    food_nudge = next(n for n in nudges if n["category"] == "Food")
    assert food_nudge["velocity"] > 1.25
    assert "daily_cap_paise" in food_nudge


# -------------------- REPORT & NUMERIC GROUNDING --------------------

def test_generate_monthly_review(test_db):
    cursor = test_db.cursor()
    cursor.execute(
        """
        INSERT INTO transactions (date, amount_paise, direction, merchant, category, source)
        VALUES 
            ('2026-10-02', 150000, 'DEBIT', 'Zomato', 'Food', 'sms'),
            ('2026-10-05', 200000, 'CREDIT', 'Allowance', 'Allowance', 'sms')
        """
    )
    test_db.commit()

    rep = generate_monthly_review(test_db, month="2026-10")
    assert rep["month"] == "2026-10"
    assert rep["total_debits_paise"] == 150000
    assert rep["total_credits_paise"] == 200000
    assert "narrative" in rep
    assert verify_numeric_grounding(rep["narrative"], rep) is True
