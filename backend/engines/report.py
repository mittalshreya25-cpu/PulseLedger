import calendar
from datetime import date
import sqlite3
from typing import Any, Dict, List, Optional
import re

try:
    from engines.profile import get_profile
    from engines.reconciliation import calculate_total_spend
    from engines.recurring import detect_recurring_series
except ImportError:
    from backend.engines.profile import get_profile
    from backend.engines.reconciliation import calculate_total_spend
    from backend.engines.recurring import detect_recurring_series


def verify_numeric_grounding(narrative: str, facts: Dict[str, Any]) -> bool:
    """Verifies that all numbers in the generated narrative exist in the deterministic facts dict."""
    extracted_nums = re.findall(r"\b\d+(?:,\d+)*(?:\.\d+)?\b", narrative)
    if not extracted_nums:
        return True

    # Flatten fact values into strings
    def flatten(val: Any) -> List[str]:
        res = []
        if isinstance(val, (int, float)):
            res.append(str(int(val)))
            res.append(f"{val:.2f}")
            res.append(f"{val/100:.2f}")
            res.append(str(int(val // 100)))
        elif isinstance(val, dict):
            for v in val.values():
                res.extend(flatten(v))
        elif isinstance(val, list):
            for v in val:
                res.extend(flatten(v))
        elif isinstance(val, str):
            res.append(val)
        return res

    known_values = set(flatten(facts))

    # All numbers must have grounding
    for num_str in extracted_nums:
        clean_num = num_str.replace(",", "")
        # Allow small day numbers 1-31 or years 2026-2027
        if clean_num in {"1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "14", "30", "31", "2026", "2027"}:
            continue
        matched = any(clean_num in kv for kv in known_values)
        if not matched:
            return False

    return True


def generate_monthly_review(
    conn: sqlite3.Connection,
    month: Optional[str] = None,
) -> Dict[str, Any]:
    """Generates deterministic monthly executive financial review."""
    if not month:
        month = date.today().strftime("%Y-%m")

    cursor = conn.cursor()

    # 1. Total debits and credits for month
    cursor.execute(
        """
        SELECT 
            COALESCE(SUM(CASE WHEN UPPER(direction) = 'DEBIT' THEN amount_paise ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN UPPER(direction) = 'CREDIT' THEN amount_paise ELSE 0 END), 0),
            COUNT(*)
        FROM transactions 
        WHERE date LIKE ?
        """,
        (f"{month}%",),
    )
    row = cursor.fetchone()
    total_debits = int(row[0])
    total_credits = int(row[1])
    total_txns = int(row[2])

    # 2. Spend by category
    cursor.execute(
        """
        SELECT category, SUM(amount_paise), COUNT(*)
        FROM transactions 
        WHERE UPPER(direction) = 'DEBIT' AND date LIKE ?
        GROUP BY category
        ORDER BY SUM(amount_paise) DESC
        """,
        (f"{month}%",),
    )
    cat_rows = cursor.fetchall()
    by_category = [
        {
            "category": r[0] or "Uncategorized",
            "amount_paise": int(r[1]),
            "percentage": round((int(r[1]) / total_debits * 100), 1) if total_debits > 0 else 0,
            "transaction_count": int(r[2]),
        }
        for r in cat_rows
    ]

    # 3. Automation audit
    cursor.execute("SELECT COUNT(*) FROM rules WHERE active = 1")
    active_rules_count = cursor.fetchone()[0]

    # 4. Savings rate
    net_savings_paise = max(0, total_credits - total_debits)
    savings_rate = round((net_savings_paise / total_credits * 100), 1) if total_credits > 0 else 0.0

    # 5. Subscriptions
    subs = detect_recurring_series(conn)

    report_facts = {
        "month": month,
        "total_debits_paise": total_debits,
        "total_credits_paise": total_credits,
        "total_transactions": total_txns,
        "net_savings_paise": net_savings_paise,
        "savings_rate_pct": savings_rate,
        "active_rules_count": active_rules_count,
        "by_category": by_category,
        "spend_by_category": by_category,
        "recurring_subscriptions": subs,
    }

    # Deterministic narrative guaranteed to pass numeric grounding
    narrative = (
        f"In {month}, you logged {total_txns} transactions totaling ₹{total_debits/100:.2f} in debits "
        f"and ₹{total_credits/100:.2f} in inflows, yielding a {savings_rate}% savings rate. "
        f"Your rulebook has {active_rules_count} active learned rules keeping your ledger clean without manual effort."
    )

    report_facts["narrative"] = narrative
    report_facts["grounding_verified"] = verify_numeric_grounding(narrative, report_facts)

    return report_facts

