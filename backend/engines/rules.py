import sqlite3
from typing import Any, Dict, List, Optional, Tuple

try:
    from engines.categorizer import llm_calls
    from engines.reconciliation import calculate_total_spend
except ImportError:
    from backend.engines.categorizer import llm_calls
    from backend.engines.reconciliation import calculate_total_spend


def _get_transaction_by_id(conn: sqlite3.Connection, transaction_id: int) -> Dict[str, Any]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,))
    row = cursor.fetchone()
    if not row:
        raise ValueError(f"Transaction with id {transaction_id} not found")
    col_names = [c[0] for c in cursor.description]
    return dict(zip(col_names, row))


def _resolve_scope_and_bounds(
    tx: Dict[str, Any],
    scope: str,
    amount_min: Optional[int] = None,
    amount_max: Optional[int] = None,
) -> Tuple[int, Optional[int], Optional[int]]:
    """Resolves specificity and effective amount boundaries.
    
    payee_in_band: specificity 30, amount band defaults to [round(amount*0.8), round(amount*1.2)]
    payee_always: specificity 20, no amount band
    """
    clean_scope = scope.strip().lower()
    tx_amount = int(tx.get("amount_paise") or 0)

    if clean_scope == "payee_in_band":
        eff_min = amount_min if amount_min is not None else int(round(tx_amount * 0.8))
        eff_max = amount_max if amount_max is not None else int(round(tx_amount * 1.2))
        specificity = 30
        return specificity, eff_min, eff_max
    elif clean_scope == "payee_always":
        specificity = 20
        return specificity, None, None
    else:
        raise ValueError(f"Invalid scope '{scope}', expected 'payee_always' or 'payee_in_band'")


def _find_matching_change_rows(
    conn: sqlite3.Connection,
    merchant: str,
    direction: str,
    target_category: str,
    amount_min: Optional[int] = None,
    amount_max: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Finds past transactions that would change to target_category."""
    cursor = conn.cursor()
    query = """
        SELECT id, date, amount_paise, direction, merchant, category
        FROM transactions
        WHERE LOWER(merchant) = LOWER(?)
          AND UPPER(direction) = UPPER(?)
          AND (category IS NULL OR category != ?)
    """
    params: List[Any] = [merchant, direction, target_category]

    if amount_min is not None:
        query += " AND amount_paise >= ?"
        params.append(amount_min)
    if amount_max is not None:
        query += " AND amount_paise <= ?"
        params.append(amount_max)

    query += " ORDER BY date DESC, id DESC"
    cursor.execute(query, params)
    cols = [c[0] for c in cursor.description]
    return [dict(zip(cols, r)) for r in cursor.fetchall()]


def preview_rule(
    conn: sqlite3.Connection,
    transaction_id: int,
    scope: str,
    category: str,
    amount_min: Optional[int] = None,
    amount_max: Optional[int] = None,
) -> Dict[str, Any]:
    """Previews the effects of creating and applying a rule based on transaction_id.
    
    Mutates nothing in the database.
    Returns the count of past rows that would change, their total in integer paise, and up to 5 examples.
    """
    tx = _get_transaction_by_id(conn, transaction_id)
    merchant = (tx.get("merchant") or "").strip()
    if not merchant:
        raise ValueError(f"Transaction id {transaction_id} has no merchant to base a rule on")

    direction = (tx.get("direction") or "DEBIT").strip()
    target_category = category.strip()

    specificity, eff_min, eff_max = _resolve_scope_and_bounds(
        tx=tx,
        scope=scope,
        amount_min=amount_min,
        amount_max=amount_max,
    )

    matching_rows = _find_matching_change_rows(
        conn=conn,
        merchant=merchant,
        direction=direction,
        target_category=target_category,
        amount_min=eff_min,
        amount_max=eff_max,
    )

    count = len(matching_rows)
    total_paise = sum(int(r["amount_paise"]) for r in matching_rows)
    examples = matching_rows[:5]

    return {
        "count": count,
        "total_paise": total_paise,
        "total": total_paise,
        "examples": examples,
        "scope": scope,
        "payee": merchant,
        "category": target_category,
        "amount_min": eff_min,
        "amount_max": eff_max,
        "specificity": specificity,
    }


def apply_rule(
    conn: sqlite3.Connection,
    transaction_id: int,
    scope: str,
    category: str,
    amount_min: Optional[int] = None,
    amount_max: Optional[int] = None,
) -> Dict[str, Any]:
    """Saves the rule, updates all matching past rows in one DB transaction,
    writes rule_audit rows (old and new category), recomputes totals, and returns counts.
    
    Repeat apply is idempotent.
    """
    tx = _get_transaction_by_id(conn, transaction_id)
    merchant = (tx.get("merchant") or "").strip()
    if not merchant:
        raise ValueError(f"Transaction id {transaction_id} has no merchant to base a rule on")

    direction = (tx.get("direction") or "DEBIT").strip()
    target_category = category.strip()

    specificity, eff_min, eff_max = _resolve_scope_and_bounds(
        tx=tx,
        scope=scope,
        amount_min=amount_min,
        amount_max=amount_max,
    )

    with conn:
        cursor = conn.cursor()

        # Check for existing identical active rule to maintain idempotency
        cursor.execute(
            """
            SELECT id FROM rules 
            WHERE active = 1 
              AND LOWER(payee_pattern) = LOWER(?)
              AND UPPER(direction) = UPPER(?)
              AND category = ?
              AND specificity = ?
              AND ((amount_min IS NULL AND ? IS NULL) OR amount_min = ?)
              AND ((amount_max IS NULL AND ? IS NULL) OR amount_max = ?)
            LIMIT 1
            """,
            (
                merchant,
                direction,
                target_category,
                specificity,
                eff_min,
                eff_min,
                eff_max,
                eff_max,
            ),
        )
        existing = cursor.fetchone()
        if existing:
            rule_id = existing[0]
        else:
            cursor.execute(
                """
                INSERT INTO rules (
                    payee_pattern, pattern, amount_min, amount_max, direction,
                    category, specificity, hits, active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1)
                """,
                (
                    merchant,
                    merchant,
                    eff_min,
                    eff_max,
                    direction,
                    target_category,
                    specificity,
                ),
            )
            rule_id = cursor.lastrowid

        # Find rows that need updating
        matching_rows = _find_matching_change_rows(
            conn=conn,
            merchant=merchant,
            direction=direction,
            target_category=target_category,
            amount_min=eff_min,
            amount_max=eff_max,
        )

        for r in matching_rows:
            old_cat = r.get("category") or "Uncategorized"
            cursor.execute(
                """
                INSERT INTO rule_audit (rule_id, transaction_id, old_category, new_category)
                VALUES (?, ?, ?, ?)
                """,
                (rule_id, r["id"], old_cat, target_category),
            )
            cursor.execute(
                "UPDATE transactions SET category = ? WHERE id = ?",
                (target_category, r["id"]),
            )

        # Update hits
        if matching_rows:
            cursor.execute(
                "UPDATE rules SET hits = hits + ? WHERE id = ?",
                (len(matching_rows), rule_id),
            )

        total_paise = sum(int(r["amount_paise"]) for r in matching_rows)
        total_spend = calculate_total_spend(conn)

    return {
        "rule_id": rule_id,
        "count": len(matching_rows),
        "updated_count": len(matching_rows),
        "total_paise": total_paise,
        "total": total_paise,
        "total_spend": total_spend,
        "examples": matching_rows[:5],
        "scope": scope,
        "payee": merchant,
        "category": target_category,
        "amount_min": eff_min,
        "amount_max": eff_max,
        "specificity": specificity,
    }


def undo_rule(conn: sqlite3.Connection, rule_id: int) -> Dict[str, Any]:
    """Restores every row exactly from rule_audit and deactivates the rule."""
    cursor = conn.cursor()
    cursor.execute("SELECT id, active FROM rules WHERE id = ?", (rule_id,))
    rule_row = cursor.fetchone()
    if not rule_row:
        raise ValueError(f"Rule with id {rule_id} not found")

    with conn:
        cursor.execute(
            """
            SELECT transaction_id, old_category 
            FROM rule_audit 
            WHERE rule_id = ? 
            ORDER BY id DESC
            """,
            (rule_id,),
        )
        audit_rows = cursor.fetchall()
        restored_count = 0

        for r in audit_rows:
            tx_id = r[0] if not isinstance(r, sqlite3.Row) else r["transaction_id"]
            old_cat = r[1] if not isinstance(r, sqlite3.Row) else r["old_category"]
            cursor.execute(
                "UPDATE transactions SET category = ? WHERE id = ?",
                (old_cat, tx_id),
            )
            restored_count += 1

        cursor.execute("UPDATE rules SET active = 0 WHERE id = ?", (rule_id,))

    return {
        "rule_id": rule_id,
        "restored_count": restored_count,
        "count": restored_count,
        "active": 0,
    }


def get_rules(conn: sqlite3.Connection, active_only: bool = True) -> List[Dict[str, Any]]:
    """Returns rules from the DB ordered by specificity DESC, id DESC."""
    cursor = conn.cursor()
    if active_only:
        cursor.execute("SELECT * FROM rules WHERE active = 1 ORDER BY specificity DESC, id DESC")
    else:
        cursor.execute("SELECT * FROM rules ORDER BY specificity DESC, id DESC")
    cols = [c[0] for c in cursor.description]
    return [dict(zip(cols, r)) for r in cursor.fetchall()]

