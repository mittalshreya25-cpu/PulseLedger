"""Safe-to-Spend: pure, DB-free, integer-paise math. No LLM, no I/O.

pool          = L + E - C - G - B           (L liquid now, E declared inflows, C commitments, G goal
                                             allocations, B untouchable buffer; all due within the horizon)
daily         = pool // D                    (D = days in horizon, minimum 1)
today_budget  = (pool + spent_today) // D    (start-of-day view: L already contains today's spending)
remaining     = today_budget - spent_today   (what you can still spend today)

Only inflows the user has DECLARED are counted in E (conservative by design).
"""
from __future__ import annotations

import calendar
from dataclasses import dataclass
from datetime import date
from typing import Optional


@dataclass(frozen=True)
class SafeToSpend:
    horizon_days: int
    pool_paise: int
    daily_paise: int
    today_budget_paise: int
    remaining_today_paise: int
    overcommitted_paise: int          # > 0 means commitments exceed money until the horizon end
    segments: dict                    # for the runway strip: free / commitments / goals / buffer (paise)
    status: str                       # "ok" | "tight" | "overcommitted"


def choose_horizon(today: date, next_inflow: Optional[date] = None, many_small_inflows: bool = False) -> int:
    """Days until the next declared inflow, else month end. Many small/irregular inflows cap it at 7."""
    month_end = date(today.year, today.month, calendar.monthrange(today.year, today.month)[1])
    end = next_inflow if next_inflow and next_inflow > today else month_end
    days = max(1, (end - today).days + 1)
    return min(days, 7) if many_small_inflows else days


def safe_to_spend(*, liquid_paise: int, inflows_paise: int = 0, commitments_paise: int = 0,
                  goal_alloc_paise: int = 0, buffer_paise: int = 0,
                  horizon_days: int = 1, spent_today_paise: int = 0) -> SafeToSpend:
    for name, v in (("liquid", liquid_paise), ("inflows", inflows_paise), ("commitments", commitments_paise),
                    ("goal_alloc", goal_alloc_paise), ("buffer", buffer_paise), ("spent_today", spent_today_paise)):
        if v < 0:
            raise ValueError(f"{name} must be >= 0 paise")
    d = max(1, int(horizon_days))
    pool = liquid_paise + inflows_paise - commitments_paise - goal_alloc_paise - buffer_paise
    over = max(0, -pool)
    daily = max(0, pool) // d
    today_budget = max(0, pool + spent_today_paise) // d
    remaining = today_budget - spent_today_paise          # may be negative: already overspent today
    free = max(0, pool)
    locked = commitments_paise
    status = "overcommitted" if over > 0 else ("tight" if daily < 10000 else "ok")  # tight < Rs.100/day
    return SafeToSpend(d, pool, daily, today_budget, remaining, over,
                       {"free": free, "commitments": locked, "goals": goal_alloc_paise, "buffer": buffer_paise}, status)
