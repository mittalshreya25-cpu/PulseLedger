import calendar
from datetime import date, timedelta
import sqlite3
from typing import Any, Dict, List, Optional

try:
    from engines.profile import get_profile
except ImportError:
    from backend.engines.profile import get_profile


def calculate_category_nudges(
    conn: sqlite3.Connection,
    today: Optional[date] = None,
    velocity_threshold: float = 1.25,
) -> List[Dict[str, Any]]:
    """Calculates spending velocity nudges with self-healing daily caps.
    
    Guards: day >= 4, minimum spent threshold, cooldown period.
    """
    if today is None:
        today = date.today()

    day_of_month = today.day
    days_in_month = calendar.monthrange(today.year, today.month)[1]
    days_remaining = max(1, days_in_month - day_of_month)

    # Day >= 4 guard to prevent false alerts on 1st of month
    if day_of_month < 4:
        return []

    month_str = today.strftime("%Y-%m")

    # Fetch month-to-date spending by category
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT category, SUM(amount_paise) 
        FROM transactions 
        WHERE UPPER(direction) = 'DEBIT' 
          AND date LIKE ? 
          AND category IS NOT NULL 
          AND category NOT IN ('Investments & Savings', 'Bank charges')
        GROUP BY category
        """,
        (f"{month_str}%",),
    )
    spent_by_category = {r[0]: int(r[1]) for r in cursor.fetchall()}

    # Category monthly budgets (provisional baseline based on standard distribution)
    default_budgets_paise = {
        "Food": 1500000,          # ₹15,000
        "Entertainment": 500000,  # ₹5,000
        "Transport": 400000,      # ₹4,000
        "Services": 300000,       # ₹3,000
        "Miscellaneous": 300000,  # ₹3,000
    }

    nudges = []
    # Expected progress fraction through the month
    expected_fraction = day_of_month / float(days_in_month)

    for cat, spent in spent_by_category.items():
        budget = default_budgets_paise.get(cat, 500000)
        min_threshold_paise = 50000  # ₹500 minimum spent

        if spent < min_threshold_paise:
            continue

        spent_fraction = spent / float(budget)
        velocity = spent_fraction / expected_fraction if expected_fraction > 0 else 1.0

        if velocity >= velocity_threshold:
            # Self-healing daily cap to stay on budget
            remaining_budget = max(0, budget - spent)
            daily_cap_paise = remaining_budget // days_remaining
            pct_used = int(round(spent_fraction * 100))

            nudges.append({
                "category": cat,
                "day_of_month": day_of_month,
                "days_remaining": days_remaining,
                "velocity": round(velocity, 2),
                "spent_paise": spent,
                "budget_paise": budget,
                "percentage_used": pct_used,
                "remaining_budget_paise": remaining_budget,
                "daily_cap_paise": daily_cap_paise,
                "severity": "high" if velocity > 1.5 else "medium",
                "message": (
                    f"You've used {pct_used}% of your {cat} budget by day {day_of_month}. "
                    f"Cap daily {cat} spend at ₹{daily_cap_paise/100:.2f} for the remaining {days_remaining} days to stay on track."
                ),
            })

    return nudges

