import calendar
from datetime import date, timedelta
import sqlite3
from typing import Any, Dict, List, Optional, Union

try:
    from engines.profile import get_manual_balance, get_profile
    from engines.safe_spend import SafeToSpend, choose_horizon, safe_to_spend
except ImportError:
    from backend.engines.profile import get_manual_balance, get_profile
    from backend.engines.safe_spend import SafeToSpend, choose_horizon, safe_to_spend


def get_spent_today_debits(conn: sqlite3.Connection, today_str: str) -> int:
    """Calculates sum of debits spent on today_str (linked SMS-Paytm pairs counted once)."""
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT COALESCE(SUM(amount_paise), 0) FROM transactions 
        WHERE UPPER(direction) = 'DEBIT' 
          AND date = ?
          AND (
              source != 'PAYTM' 
              OR id NOT IN (
                  SELECT matched_paytm_id FROM transactions 
                  WHERE matched_paytm_id IS NOT NULL AND source = 'sms'
              )
          )
        """,
        (today_str,),
    )
    return int(cursor.fetchone()[0])


def compute_safe_to_spend(
    conn: sqlite3.Connection,
    today: Optional[Union[str, date]] = None,
) -> Dict[str, Any]:
    """Computes Safe-to-Spend for a given date according to PulseLedger rules:
    
    - liquid = manual override if present, else balance_paise of most recent SMS row (by date, then id).
               If none, liquid = 0 and needs_balance = True.
    - horizon from choose_horizon(today, next_inflow, many_small_inflows).
    - inflows = sum of declared income streams whose next_date falls inside the horizon.
    - commitments = fixed costs due inside the horizon.
    - goal_alloc = monthly_alloc scaled by horizon/30, rounded down.
    - spent_today = sum of today's debits (linked pairs counted once).
    - Return SafeToSpend fields, locked items, and a plain sentence when overcommitted.
    """
    if today is None:
        today_date = date.today()
    elif isinstance(today, date):
        today_date = today
    else:
        today_date = date.fromisoformat(str(today).strip())

    today_str = today_date.isoformat()

    # 1. Profile information
    prof = get_profile(conn)
    income_streams: List[Dict[str, Any]] = prof.get("income_streams", [])
    fixed_costs: List[Dict[str, Any]] = prof.get("fixed_costs", [])
    goals: List[Dict[str, Any]] = prof.get("goals", [])
    buffer_paise: int = int(prof.get("buffer_paise", 20000))
    many_small_inflows: bool = bool(prof.get("many_small_inflows", False))

    # 2. Liquid balance & needs_balance flag
    manual_bal = get_manual_balance(conn)
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT balance_paise FROM transactions 
        WHERE source = 'sms' AND balance_paise IS NOT NULL 
        ORDER BY date DESC, id DESC 
        LIMIT 1
        """
    )
    sms_row = cursor.fetchone()

    if manual_bal is not None:
        liquid_paise = manual_bal
        needs_balance = False
    elif sms_row is not None and sms_row[0] is not None:
        liquid_paise = int(sms_row[0])
        needs_balance = False
    else:
        liquid_paise = 0
        needs_balance = True

    # 3. Next declared inflow & choose_horizon
    candidate_inflow_dates: List[date] = []
    for s in income_streams:
        if s.get("next_date"):
            try:
                nd = date.fromisoformat(s["next_date"].strip())
                ed = date.fromisoformat(s["end_date"].strip()) if s.get("end_date") else None
                if nd > today_date and (ed is None or nd <= ed):
                    candidate_inflow_dates.append(nd)
            except Exception:
                pass

    earliest_inflow = min(candidate_inflow_dates) if candidate_inflow_dates else None
    horizon_days = choose_horizon(
        today=today_date,
        next_inflow=earliest_inflow,
        many_small_inflows=many_small_inflows,
    )
    horizon_end = today_date + timedelta(days=horizon_days - 1)

    # 4. Inflows inside horizon
    inflows_paise = 0
    for s in income_streams:
        if s.get("next_date"):
            try:
                nd = date.fromisoformat(s["next_date"].strip())
                ed = date.fromisoformat(s["end_date"].strip()) if s.get("end_date") else None
                if today_date <= nd <= horizon_end and (ed is None or nd <= ed):
                    inflows_paise += int(s.get("amount_paise") or 0)
            except Exception:
                pass

    # 5. Commitments & locked items inside horizon
    commitments_paise = 0
    locked_items: List[Dict[str, Any]] = []

    for cost in fixed_costs:
        due_day = int(cost["due_day"])
        curr = today_date
        while curr <= horizon_end:
            max_day = calendar.monthrange(curr.year, curr.month)[1]
            effective_day = min(due_day, max_day)
            if curr.day == effective_day:
                amt = int(cost["amount_paise"])
                commitments_paise += amt
                locked_items.append(
                    {
                        "name": cost["name"],
                        "amount_paise": amt,
                        "due_date": curr.isoformat(),
                    }
                )
            curr += timedelta(days=1)

    # 6. Goal allocation: monthly_alloc scaled by horizon/30, rounded down
    total_monthly_alloc = sum(int(g.get("monthly_alloc_paise") or 0) for g in goals)
    goal_alloc_paise = (total_monthly_alloc * horizon_days) // 30

    # 7. Spent today (linked pairs counted once)
    spent_today_paise = get_spent_today_debits(conn, today_str)

    # 8. Pure safe_to_spend calculation
    sts: SafeToSpend = safe_to_spend(
        liquid_paise=liquid_paise,
        inflows_paise=inflows_paise,
        commitments_paise=commitments_paise,
        goal_alloc_paise=goal_alloc_paise,
        buffer_paise=buffer_paise,
        horizon_days=horizon_days,
        spent_today_paise=spent_today_paise,
    )

    # 9. Plain sentence explanations
    if sts.status == "overcommitted" or sts.overcommitted_paise > 0:
        over_rupees = sts.overcommitted_paise / 100
        sentence = (
            f"Commitments exceed available funds by ₹{over_rupees:.2f} "
            f"over the next {sts.horizon_days} days until horizon end."
        )
        overcommitted_sentence = sentence
    elif sts.status == "tight":
        sentence = (
            f"Budget is tight with only ₹{sts.daily_paise / 100:.2f}/day "
            f"available over the next {sts.horizon_days} days."
        )
        overcommitted_sentence = None
    else:
        sentence = f"You can safely spend ₹{sts.remaining_today_paise / 100:.2f} today."
        overcommitted_sentence = None

    return {
        "horizon_days": sts.horizon_days,
        "pool_paise": sts.pool_paise,
        "daily_paise": sts.daily_paise,
        "today_budget_paise": sts.today_budget_paise,
        "remaining_today_paise": sts.remaining_today_paise,
        "overcommitted_paise": sts.overcommitted_paise,
        "segments": sts.segments,
        "status": sts.status,
        "liquid_paise": liquid_paise,
        "inflows_paise": inflows_paise,
        "commitments_paise": commitments_paise,
        "goal_alloc_paise": goal_alloc_paise,
        "buffer_paise": buffer_paise,
        "spent_today_paise": spent_today_paise,
        "needs_balance": needs_balance,
        "locked_items": locked_items,
        "overcommitted_sentence": overcommitted_sentence,
        "sentence": sentence,
    }

