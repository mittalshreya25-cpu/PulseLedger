from datetime import datetime
import sqlite3
from typing import Any, Dict, List, Optional

try:
    from engines.categorizer import categorize
except ImportError:
    from backend.engines.categorizer import categorize


def create_quick_transaction(
    conn: sqlite3.Connection,
    amount_paise: int,
    direction: str,
    merchant: str,
    category: Optional[str] = None,
    date: Optional[str] = None,
    ref_no: Optional[str] = None,
    raw_text: Optional[str] = None,
    balance_paise: Optional[int] = None,
) -> Dict[str, Any]:
    """Creates a manual quick transaction entry."""
    if amount_paise <= 0:
        raise ValueError("amount_paise must be positive")

    resolved_date = date.strip() if date and date.strip() else datetime.now().strftime("%Y-%m-%d")
    resolved_direction = direction.strip()
    resolved_merchant = merchant.strip()

    if category is not None and category.strip():
        resolved_category = category.strip()
    else:
        resolved_category = categorize(
            merchant=resolved_merchant,
            amount_paise=amount_paise,
            direction=resolved_direction,
            raw_text=raw_text,
            conn=conn,
        )

    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO transactions (
            date, amount_paise, direction, raw_text, source,
            ref_no, upi_ref, merchant, category, balance_paise,
            dedupe_key, needs_merchant
        ) VALUES (?, ?, ?, ?, 'manual', ?, ?, ?, ?, ?, NULL, 0)
        """,
        (
            resolved_date,
            int(amount_paise),
            resolved_direction,
            raw_text,
            ref_no,
            None,
            resolved_merchant,
            resolved_category,
            balance_paise,
        ),
    )
    conn.commit()

    tx_id = cursor.lastrowid
    cursor.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
    row = cursor.fetchone()
    if not row:
        return {}
    if isinstance(row, sqlite3.Row):
        return dict(row)
    col_names = [col[0] for col in cursor.description]
    return dict(zip(col_names, row))


def get_needs_merchant_transactions(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    """Retrieves all transactions needing a merchant, newest first."""
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT * FROM transactions 
        WHERE needs_merchant = 1 
        ORDER BY date DESC, id DESC
        """
    )
    col_names = [col[0] for col in cursor.description]
    rows = cursor.fetchall()
    return [dict(zip(col_names, r)) for r in rows]


def update_transaction_merchant(
    conn: sqlite3.Connection,
    transaction_id: int,
    merchant: str,
) -> Optional[Dict[str, Any]]:
    """Sets merchant and clears needs_merchant flag for a transaction, recategorizing if Uncategorized."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,))
    existing_row = cursor.fetchone()
    if existing_row is None:
        return None

    col_names = [col[0] for col in cursor.description]
    tx_dict = dict(zip(col_names, existing_row))

    cleaned_merchant = merchant.strip()
    curr_cat = tx_dict.get("category")
    new_cat = curr_cat
    if not curr_cat or curr_cat == "Uncategorized":
        new_cat = categorize(
            merchant=cleaned_merchant,
            amount_paise=tx_dict.get("amount_paise"),
            direction=tx_dict.get("direction"),
            raw_text=tx_dict.get("raw_text"),
            conn=conn,
        )

    cursor.execute(
        """
        UPDATE transactions 
        SET merchant = ?, category = ?, needs_merchant = 0 
        WHERE id = ?
        """,
        (cleaned_merchant, new_cat, transaction_id),
    )
    conn.commit()

    cursor.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,))
    row = cursor.fetchone()
    return dict(zip(col_names, row)) if row else None
