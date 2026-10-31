from datetime import datetime
import sqlite3
from typing import Any, Dict, List, Optional


def _parse_iso_date(d_str: str):
    return datetime.fromisoformat(d_str.strip()[:10]).date()


def reconcile_sms_with_paytm(conn: sqlite3.Connection) -> Dict[str, Any]:
    """Reconciles SMS transactions needing merchant against Paytm records.
    
    For each SMS row needing a merchant:
    - Finds unlinked Paytm rows with same direction, same amount, and date within 1 day.
    - Exactly 1 candidate: links them, copies merchant & category, clears needs_merchant, stores matched_paytm_id.
    - 0 or several candidates: leaves in needs_merchant.
    """
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT * FROM transactions 
        WHERE source = 'sms' 
          AND needs_merchant = 1 
          AND matched_paytm_id IS NULL
        ORDER BY date ASC, id ASC
        """
    )
    col_names = [col[0] for col in cursor.description]
    sms_rows = [dict(zip(col_names, r)) for r in cursor.fetchall()]

    reconciled_links = []

    for sms in sms_rows:
        sms_id = sms["id"]
        sms_date = _parse_iso_date(sms["date"])
        sms_direction = (sms["direction"] or "").upper()
        sms_amount = sms["amount_paise"]

        # Fetch candidate Paytm rows that are not yet matched
        cursor.execute(
            """
            SELECT * FROM transactions 
            WHERE source = 'PAYTM' 
              AND UPPER(direction) = ? 
              AND amount_paise = ?
              AND id NOT IN (
                  SELECT matched_paytm_id FROM transactions 
                  WHERE matched_paytm_id IS NOT NULL AND source = 'sms'
              )
            """,
            (sms_direction, sms_amount),
        )
        p_cols = [c[0] for c in cursor.description]
        candidates = [dict(zip(p_cols, r)) for r in cursor.fetchall()]

        # Filter by date within 1 day
        date_matched_candidates = []
        for cand in candidates:
            cand_date = _parse_iso_date(cand["date"])
            if abs((cand_date - sms_date).days) <= 1:
                date_matched_candidates.append(cand)

        # Exactly one candidate: link them
        if len(date_matched_candidates) == 1:
            paytm_match = date_matched_candidates[0]
            paytm_id = paytm_match["id"]
            merchant = paytm_match["merchant"]
            category = paytm_match["category"]

            # Update SMS row
            cursor.execute(
                """
                UPDATE transactions 
                SET merchant = ?, category = ?, needs_merchant = 0, matched_paytm_id = ? 
                WHERE id = ?
                """,
                (merchant, category, paytm_id, sms_id),
            )
            # Update Paytm row to cross-reference
            cursor.execute(
                """
                UPDATE transactions 
                SET matched_paytm_id = ? 
                WHERE id = ?
                """,
                (sms_id, paytm_id),
            )
            conn.commit()

            reconciled_links.append(
                {
                    "sms_id": sms_id,
                    "paytm_id": paytm_id,
                    "merchant": merchant,
                    "category": category,
                }
            )

    return {
        "reconciled_count": len(reconciled_links),
        "links": reconciled_links,
    }


def get_match_rate(conn: sqlite3.Connection) -> Dict[str, int]:
    """Computes matched, ambiguous, and unmatched counts for SMS transactions."""
    cursor = conn.cursor()

    # Matched SMS rows
    cursor.execute(
        """
        SELECT COUNT(*) FROM transactions 
        WHERE source = 'sms' AND matched_paytm_id IS NOT NULL
        """
    )
    matched_count = cursor.fetchone()[0]

    # Pending SMS rows (still needing merchant or unmatched)
    cursor.execute(
        """
        SELECT * FROM transactions 
        WHERE source = 'sms' AND needs_merchant = 1 AND matched_paytm_id IS NULL
        """
    )
    col_names = [col[0] for col in cursor.description]
    unresolved_sms = [dict(zip(col_names, r)) for r in cursor.fetchall()]

    ambiguous_count = 0
    unmatched_count = 0

    for sms in unresolved_sms:
        sms_date = _parse_iso_date(sms["date"])
        sms_direction = (sms["direction"] or "").upper()
        sms_amount = sms["amount_paise"]

        cursor.execute(
            """
            SELECT * FROM transactions 
            WHERE source = 'PAYTM' 
              AND UPPER(direction) = ? 
              AND amount_paise = ?
            """,
            (sms_direction, sms_amount),
        )
        p_cols = [c[0] for c in cursor.description]
        candidates = [dict(zip(p_cols, r)) for r in cursor.fetchall()]

        within_one_day = [
            c for c in candidates 
            if abs((_parse_iso_date(c["date"]) - sms_date).days) <= 1
        ]

        if len(within_one_day) > 1:
            ambiguous_count += 1
        else:
            unmatched_count += 1

    return {
        "matched": matched_count,
        "ambiguous": ambiguous_count,
        "unmatched": unmatched_count,
    }


def calculate_total_spend(conn: sqlite3.Connection) -> int:
    """Calculates total debit spend in integer paise, ensuring linked SMS-Paytm pairs are counted only once."""
    cursor = conn.cursor()
    # Exclude Paytm rows that are linked to an SMS row to avoid double-counting
    cursor.execute(
        """
        SELECT COALESCE(SUM(amount_paise), 0) FROM transactions 
        WHERE UPPER(direction) = 'DEBIT' 
          AND (
              source != 'PAYTM' 
              OR id NOT IN (
                  SELECT matched_paytm_id FROM transactions 
                  WHERE matched_paytm_id IS NOT NULL AND source = 'sms'
              )
          )
        """
    )
    return int(cursor.fetchone()[0])

