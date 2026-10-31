import sqlite3
from typing import Optional


def is_duplicate_transaction(
    conn: sqlite3.Connection,
    dedupe_key: Optional[str] = None,
    ref_no: Optional[str] = None,
    date: Optional[str] = None,
    amount_paise: Optional[int] = None,
    direction: Optional[str] = None,
) -> bool:
    """Checks whether a transaction already exists in the database.
    
    Deduplication priority:
    1. By dedupe_key when provided.
    2. Else by ref_no when present.
    3. Else by (date, amount_paise, direction).
    """
    cursor = conn.cursor()

    if dedupe_key:
        cursor.execute("SELECT 1 FROM transactions WHERE dedupe_key = ? LIMIT 1", (dedupe_key,))
        if cursor.fetchone() is not None:
            return True
        return False

    cleaned_ref = ref_no.strip() if ref_no else None
    if cleaned_ref:
        cursor.execute("SELECT 1 FROM transactions WHERE ref_no = ? LIMIT 1", (cleaned_ref,))
        if cursor.fetchone() is not None:
            return True
        return False

    if date is not None and amount_paise is not None and direction is not None:
        cursor.execute(
            """
            SELECT 1 FROM transactions 
            WHERE date = ? 
              AND amount_paise = ? 
              AND LOWER(direction) = LOWER(?)
            LIMIT 1
            """,
            (date, amount_paise, direction),
        )
        return cursor.fetchone() is not None

    return False
