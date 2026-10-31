import calendar
from datetime import date, datetime, timedelta
import sqlite3
from typing import Any, Dict, List, Optional, Tuple

try:
    from engines.categorizer import get_merchant_dictionary
except ImportError:
    from backend.engines.categorizer import get_merchant_dictionary

CADENCE_RANGES = {
    "weekly": (6, 8),
    "monthly": (26, 34),
    "quarterly": (85, 96),
    "yearly": (355, 375),
}

KNOWN_SUBSCRIPTIONS = {
    "netflix",
    "spotify",
    "youtube",
    "prime",
    "hotstar",
    "gym",
    "apple",
    "google storage",
    "jio",
    "airtel",
    "chatgpt",
    "openai",
}


def _median(values: List[float]) -> float:
    if not values:
        return 0.0
    s = sorted(values)
    n = len(s)
    mid = n // 2
    if n % 2 == 1:
        return float(s[mid])
    return (s[mid - 1] + s[mid]) / 2.0


def _mad(values: List[float], med: float) -> float:
    if not values:
        return 0.0
    diffs = [abs(v - med) for v in values]
    return _median(diffs)


def detect_recurring_series(
    conn: sqlite3.Connection,
    profile_id: Optional[str] = "default",
    price_change_threshold: float = 0.05,
) -> List[Dict[str, Any]]:
    """Analyzes transaction history to detect recurring subscription payments and cadence."""
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT date, amount_paise, merchant, category 
        FROM transactions 
        WHERE UPPER(direction) = 'DEBIT' 
          AND merchant IS NOT NULL 
          AND TRIM(merchant) != ''
        ORDER BY merchant ASC, date ASC
        """
    )
    rows = cursor.fetchall()

    grouped_by_merchant: Dict[str, List[Tuple[date, int, str]]] = {}
    for r in rows:
        d_str, amt, m, cat = r[0], int(r[1]), r[2].strip(), r[3] or "Subscriptions"
        try:
            d_val = date.fromisoformat(d_str[:10])
            grouped_by_merchant.setdefault(m, []).append((d_val, amt, cat))
        except ValueError:
            continue

    detected_series: List[Dict[str, Any]] = []

    for merchant, txs in grouped_by_merchant.items():
        m_lower = merchant.lower()
        is_known = any(k in m_lower for k in KNOWN_SUBSCRIPTIONS)
        min_required = 2 if is_known else 3

        if len(txs) < min_required:
            continue

        # Sort by date
        txs.sort(key=lambda x: x[0])

        intervals: List[float] = []
        for i in range(1, len(txs)):
            diff_days = (txs[i][0] - txs[i - 1][0]).days
            if diff_days > 0:
                intervals.append(float(diff_days))

        if not intervals:
            continue

        med_interval = _median(intervals)
        mad_interval = _mad(intervals, med_interval)

        # Match cadence
        matched_cadence = None
        for cadence_name, (c_min, c_max) in CADENCE_RANGES.items():
            if c_min <= med_interval <= c_max:
                matched_cadence = cadence_name
                break

        if not matched_cadence:
            continue

        amounts = [t[1] for t in txs]
        latest_amount = amounts[-1]
        earlier_amounts = amounts[:-1]
        median_amount = int(round(_median([float(a) for a in amounts])))
        baseline_median = int(round(_median([float(a) for a in earlier_amounts]))) if earlier_amounts else median_amount

        last_date = txs[-1][0]
        next_expected = last_date + timedelta(days=int(round(med_interval)))

        # Alerts detection
        alerts = []
        # 1. Price change alert
        if earlier_amounts and baseline_median > 0:
            diff_ratio = (latest_amount - baseline_median) / baseline_median
            if abs(diff_ratio) >= price_change_threshold:
                pct_change = round(diff_ratio * 100, 1)
                alerts.append({
                    "kind": "price_change",
                    "old_amount_paise": baseline_median,
                    "new_amount_paise": latest_amount,
                    "percentage_change": pct_change,
                    "message": f"{merchant} changed from ₹{baseline_median/100:.2f} to ₹{latest_amount/100:.2f} ({'+' if pct_change > 0 else ''}{pct_change}%).",
                })

        # 2. Monthly goal cost calculation
        # If monthly subscription: monthly cost = median_amount
        monthly_cost_paise = median_amount
        if matched_cadence == "yearly":
            monthly_cost_paise = median_amount // 12
        elif matched_cadence == "weekly":
            monthly_cost_paise = median_amount * 4

        # Approximate days to reach a ₹60,000 goal
        days_saved_per_year = (monthly_cost_paise * 12) // 20000  # assuming ₹200/day discretionary burn

        detected_series.append({
            "merchant": merchant,
            "category": txs[-1][2],
            "cadence": matched_cadence,
            "interval_days": int(round(med_interval)),
            "occurrences": len(txs),
            "last_date": last_date.isoformat(),
            "next_expected": next_expected.isoformat(),
            "latest_amount_paise": latest_amount,
            "median_amount_paise": median_amount,
            "monthly_cost_paise": monthly_cost_paise,
            "estimated_annual_paise": monthly_cost_paise * 12,
            "alerts": alerts,
        })

    return detected_series

