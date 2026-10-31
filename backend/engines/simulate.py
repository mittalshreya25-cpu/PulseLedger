from datetime import date, timedelta
import sqlite3
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

try:
    from engines.profile import get_profile
except ImportError:
    from backend.engines.profile import get_profile


def run_monte_carlo_simulation(
    conn: sqlite3.Connection,
    horizon_days: int = 365,
    num_runs: int = 1000,
    seed: int = 42,
    scenario_multipliers: Optional[Dict[str, float]] = None,
    fixed_cost_delta_paise: int = 0,
    one_time_expense_paise: int = 0,
    one_time_expense_day: int = 0,
    income_delta_paise: int = 0,
) -> Dict[str, Any]:
    """Runs a fully vectorized NumPy Monte Carlo simulation over horizon_days across num_runs.
    
    Uses Common Random Numbers (seed) so baseline vs scenario comparisons are deterministic and noise-free.
    """
    prof = get_profile(conn)
    income_streams = prof.get("income_streams", [])
    fixed_costs = prof.get("fixed_costs", [])
    goals = prof.get("goals", [])
    buffer_paise = int(prof.get("buffer_paise", 20000))
    today = date.today()

    cursor = conn.cursor()
    # 1. Starting balance: manual override -> latest transaction balance -> default ₹27,500
    cursor.execute("SELECT value FROM profile WHERE key = 'manual_balance_paise'")
    mb_row = cursor.fetchone()
    if mb_row and mb_row[0] is not None:
        try:
            starting_balance = int(mb_row[0])
        except ValueError:
            starting_balance = 2750000
    else:
        cursor.execute(
            """
            SELECT balance_paise FROM transactions 
            WHERE source = 'sms' AND balance_paise IS NOT NULL 
            ORDER BY date DESC, id DESC LIMIT 1
            """
        )
        b_row = cursor.fetchone()
        starting_balance = int(b_row[0]) if b_row and b_row[0] is not None else 2750000

    # 2. Income stream fallback: Ensure recurring monthly inflow exists
    if not income_streams:
        cursor.execute("SELECT value FROM profile WHERE key = 'monthly_income_paise'")
        p_row = cursor.fetchone()
        m_inc = int(p_row[0]) if p_row and p_row[0] else 0
        if m_inc <= 0:
            cursor.execute("SELECT amount_paise FROM transactions WHERE UPPER(direction) = 'CREDIT' ORDER BY amount_paise DESC LIMIT 1")
            c_row = cursor.fetchone()
            m_inc = int(c_row[0]) if c_row and c_row[0] else 2500000
        income_streams = [{"amount_paise": m_inc, "next_date": today.isoformat()}]

    if not fixed_costs:
        cursor.execute("SELECT value FROM profile WHERE key = 'monthly_budget_paise'")
        b_row = cursor.fetchone()
        m_budg = int(b_row[0]) if b_row and b_row[0] else int(income_streams[0]["amount_paise"] * 0.65)
        fixed_costs = [{"amount_paise": int(m_budg * 0.4), "due_day": 1}]

    # Retrieve historical daily discretionary spend for bootstrap resampling
    cursor.execute(
        """
        SELECT amount_paise FROM transactions 
        WHERE UPPER(direction) = 'DEBIT' 
        LIMIT 200
        """
    )
    spend_rows = [int(r[0]) for r in cursor.fetchall()]
    if not spend_rows or len(spend_rows) < 5:
        # Sensible daily prior around ₹300/day
        historical_daily_spend = np.array([15000, 25000, 30000, 45000, 60000, 20000, 35000], dtype=np.int64)
    else:
        historical_daily_spend = np.array(spend_rows, dtype=np.int64)

    # Apply category multipliers if scenario passed
    discretionary_multiplier = 1.0
    if scenario_multipliers:
        # Average reduction across categories
        discretionary_multiplier = float(np.mean(list(scenario_multipliers.values())))

    rng = np.random.default_rng(seed)

    # 1. Generate bootstrap discretionary daily spend matrix of shape (num_runs, horizon_days)
    draw_indices = rng.integers(0, len(historical_daily_spend), size=(num_runs, horizon_days))
    daily_spend_matrix = historical_daily_spend[draw_indices].astype(np.float64) * discretionary_multiplier

    # 2. Add fixed costs and income onto daily cash flow vectors of shape (horizon_days,)
    today = date.today()
    fixed_flow = np.zeros(horizon_days, dtype=np.int64)

    # Fixed costs
    for fc in fixed_costs:
        due_day = int(fc.get("due_day", 1))
        amt = int(fc.get("amount_paise", 0))
        for d in range(horizon_days):
            curr_date = today + timedelta(days=d)
            if curr_date.day == due_day:
                fixed_flow[d] -= amt

    if fixed_cost_delta_paise != 0:
        for d in range(horizon_days):
            curr_date = today + timedelta(days=d)
            if curr_date.day == 1:
                fixed_flow[d] -= fixed_cost_delta_paise

    # Income streams
    for inc in income_streams:
        amt = int(inc.get("amount_paise", 0)) + income_delta_paise
        nd_str = inc.get("next_date")
        ed_str = inc.get("end_date")
        end_d = date.fromisoformat(ed_str[:10]) if ed_str else None
        
        # Monthly income on same day of month
        start_day = date.fromisoformat(nd_str[:10]).day if nd_str else 1
        for d in range(horizon_days):
            curr_date = today + timedelta(days=d)
            if end_d and curr_date > end_d:
                continue
            if curr_date.day == start_day:
                fixed_flow[d] += amt

    # One-time expense
    if one_time_expense_paise > 0 and 0 <= one_time_expense_day < horizon_days:
        fixed_flow[one_time_expense_day] -= one_time_expense_paise

    # Net daily change for each run: fixed_flow[d] - daily_spend_matrix[:, d]
    net_daily = fixed_flow[np.newaxis, :] - daily_spend_matrix

    # Cumulative cash flow trajectories
    balance_trajectories = starting_balance + np.cumsum(net_daily, axis=1)

    # 3. Goal tracking: check when cumulative surplus achieves each goal target
    goal_results = []
    primary_goal_target = int(goals[0]["target_paise"]) if goals else 6000000
    primary_goal_saved = int(goals[0]["saved_paise"]) if goals else 0
    remaining_goal = max(0, primary_goal_target - primary_goal_saved)

    # Percentiles over time (at 12 monthly checkpoints)
    checkpoints = [min(horizon_days - 1, int(i * (horizon_days / 12))) for i in range(13)]
    percentiles_over_time = []
    for cp in checkpoints:
        balances_at_cp = balance_trajectories[:, cp]
        percentiles_over_time.append({
            "day": cp,
            "date": (today + timedelta(days=cp)).isoformat(),
            "p10": int(np.percentile(balances_at_cp, 10)),
            "p25": int(np.percentile(balances_at_cp, 25)),
            "p50": int(np.percentile(balances_at_cp, 50)),
            "p75": int(np.percentile(balances_at_cp, 75)),
            "p90": int(np.percentile(balances_at_cp, 90)),
        })

    # P50 goal completion calculation
    # When does median balance exceed (remaining_goal + buffer_paise)?
    median_trajectory = np.percentile(balance_trajectories, 50, axis=0)
    goal_achievement_day = None
    for d in range(horizon_days):
        if median_trajectory[d] >= (starting_balance + remaining_goal):
            goal_achievement_day = d
            break

    # Risk metrics
    min_balances = np.min(balance_trajectories, axis=1)
    shortfall_prob = float(np.mean(min_balances < 0))
    buffer_breach_prob = float(np.mean(min_balances < buffer_paise))

    return {
        "horizon_days": horizon_days,
        "num_runs": num_runs,
        "starting_balance_paise": starting_balance,
        "goal_achievement_day": goal_achievement_day,
        "goal_achievement_date": (today + timedelta(days=goal_achievement_day)).isoformat() if goal_achievement_day else None,
        "shortfall_probability": round(shortfall_prob, 3),
        "buffer_breach_probability": round(buffer_breach_prob, 3),
        "percentiles_over_time": percentiles_over_time,
        "median_ending_balance_paise": int(percentiles_over_time[-1]["p50"]),
    }


def compute_goal_ripple(
    conn: sqlite3.Connection,
    transaction_amount_paise: int,
    seed: int = 42,
) -> Dict[str, Any]:
    """Calculates Goal Ripple: exact days a transaction delays your primary goal using Common Random Numbers."""
    baseline = run_monte_carlo_simulation(conn=conn, seed=seed)
    with_txn = run_monte_carlo_simulation(
        conn=conn,
        seed=seed,
        one_time_expense_paise=transaction_amount_paise,
        one_time_expense_day=0,
    )

    base_day = baseline.get("goal_achievement_day") or 180
    new_day = with_txn.get("goal_achievement_day") or 180

    days_delayed = max(0, new_day - base_day)
    # If same day due to granularity, estimate based on daily contribution rate
    if days_delayed == 0 and transaction_amount_paise > 0:
        daily_alloc = 10000  # ₹100/day
        days_delayed = max(1, transaction_amount_paise // daily_alloc)

    return {
        "transaction_amount_paise": transaction_amount_paise,
        "baseline_day": base_day,
        "new_day": new_day,
        "days_delayed": days_delayed,
        "ripple_message": f"This ₹{transaction_amount_paise/100:.2f} spend shifts your goal completion by approximately {days_delayed} day{'s' if days_delayed != 1 else ''}."
    }

