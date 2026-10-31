from datetime import date
import pytest
try:
    from backend.engines.safe_spend import safe_to_spend, choose_horizon
except ImportError:
    try:
        from backend.app.engines.safe_spend import safe_to_spend, choose_horizon
    except ImportError:  # running from inside backend/
        try:
            from app.engines.safe_spend import safe_to_spend, choose_horizon
        except ImportError:
            from engines.safe_spend import safe_to_spend, choose_horizon


def test_basic_pool_and_daily():
    # 5000 + 0 - 1000 - 500 - 500 = 3000 over 10 days = 300/day (all in paise)
    r = safe_to_spend(liquid_paise=500000, commitments_paise=100000, goal_alloc_paise=50000,
                      buffer_paise=50000, horizon_days=10)
    assert r.pool_paise == 300000 and r.daily_paise == 30000 and r.status == "ok"
    assert r.remaining_today_paise == 30000 and r.overcommitted_paise == 0


def test_spent_today_is_not_double_counted():
    # balance already dropped by today's 100 spend: 4900 now, 100 spent today
    r = safe_to_spend(liquid_paise=490000, commitments_paise=100000, goal_alloc_paise=50000,
                      buffer_paise=50000, horizon_days=10, spent_today_paise=10000)
    assert r.today_budget_paise == 30000 and r.remaining_today_paise == 20000


def test_overcommitted_explains_gap():
    r = safe_to_spend(liquid_paise=100000, commitments_paise=150000, horizon_days=5)
    assert r.overcommitted_paise == 50000 and r.daily_paise == 0 and r.status == "overcommitted"


def test_declared_inflow_raises_pool():
    r = safe_to_spend(liquid_paise=100000, inflows_paise=200000, commitments_paise=50000, horizon_days=5)
    assert r.pool_paise == 250000 and r.daily_paise == 50000


def test_overspent_today_goes_negative_remaining():
    r = safe_to_spend(liquid_paise=300000, horizon_days=10, spent_today_paise=50000)
    assert r.today_budget_paise == 35000 and r.remaining_today_paise == -15000


def test_zero_horizon_guard_and_tight_status():
    r = safe_to_spend(liquid_paise=5000, horizon_days=0)
    assert r.horizon_days == 1 and r.daily_paise == 5000 and r.status == "tight"


def test_negative_inputs_rejected():
    with pytest.raises(ValueError):
        safe_to_spend(liquid_paise=-1)


def test_horizon_rules():
    assert choose_horizon(date(2026, 10, 31)) == 1                       # last day of month
    assert choose_horizon(date(2026, 10, 25)) == 7                       # to month end inclusive
    assert choose_horizon(date(2026, 10, 10), next_inflow=date(2026, 10, 15)) == 6
    assert choose_horizon(date(2026, 10, 1), many_small_inflows=True) == 7
    assert choose_horizon(date(2026, 10, 20), next_inflow=date(2026, 10, 10)) == 12  # past date ignored
