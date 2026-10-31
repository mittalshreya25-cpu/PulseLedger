import sqlite3
from typing import Any, Dict, List


def check_balance_chain(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    """Checks running balance integrity for SMS debit transactions.
    
    For each SMS debit row, checks that some other row in transactions has balance_paise
    equal to this row's balance_paise plus its amount_paise. Returns the list of rows that fail.
    """
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT * FROM transactions 
        WHERE source = 'sms' AND UPPER(direction) = 'DEBIT'
        ORDER BY date DESC, id DESC
        """
    )
    col_names = [col[0] for col in cursor.description]
    debit_rows = [dict(zip(col_names, r)) for r in cursor.fetchall()]

    failed_rows: List[Dict[str, Any]] = []

    for row in debit_rows:
        balance_paise = row.get("balance_paise")
        amount_paise = row.get("amount_paise")

        if balance_paise is None or amount_paise is None:
            failed_rows.append(row)
            continue

        target_balance = balance_paise + amount_paise
        cursor.execute(
            """
            SELECT 1 FROM transactions 
            WHERE id != ? AND balance_paise = ?
            LIMIT 1
            """,
            (row["id"], target_balance),
        )
        if cursor.fetchone() is None:
            failed_rows.append(row)

    return failed_rows

