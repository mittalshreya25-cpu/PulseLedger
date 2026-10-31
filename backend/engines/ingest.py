from datetime import datetime
import sqlite3
from typing import Any, Dict, List, Optional, Union

try:
    from app.parsers.canara_sms import parse_many, ParsedSms
    from app.parsers.paytm_import import parse_paytm, ParsedPaytmRow
    from engines.categorizer import categorize, check_tier1_rules
    from engines.dedupe import is_duplicate_transaction
    from engines.reconciliation import reconcile_sms_with_paytm
except ImportError:
    from backend.app.parsers.canara_sms import parse_many, ParsedSms
    from backend.app.parsers.paytm_import import parse_paytm, ParsedPaytmRow
    from backend.engines.categorizer import categorize, check_tier1_rules
    from backend.engines.dedupe import is_duplicate_transaction
    from backend.engines.reconciliation import reconcile_sms_with_paytm


def _resolve_received_at(received_at: Optional[Union[str, datetime]]) -> Optional[datetime]:
    if not received_at:
        return None
    if isinstance(received_at, datetime):
        return received_at
    try:
        return datetime.fromisoformat(received_at.replace("Z", "+00:00"))
    except Exception:
        pass
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(received_at, fmt)
        except ValueError:
            pass
    return None


def ingest_sms_records(
    conn: sqlite3.Connection,
    raw_blob: str,
    received_at: Optional[Union[str, datetime]] = None,
) -> Dict[str, Any]:
    """Ingests a text blob of SMS messages, parsing, deduping, and inserting valid parsed transactions."""
    dt_received = _resolve_received_at(received_at)
    parsed_sms_list: List[ParsedSms] = parse_many(raw_blob, received_at=dt_received)

    inserted: List[Dict[str, Any]] = []
    duplicates_skipped: List[Dict[str, Any]] = []
    ignored: List[Dict[str, Any]] = []
    unparsed: List[Dict[str, Any]] = []

    for item in parsed_sms_list:
        if item.status == "parsed":
            resolved_date = (
                item.txn_date
                or (dt_received.date().isoformat() if dt_received else datetime.now().date().isoformat())
            )

            # Dedupe check using parser's dedupe_key
            if is_duplicate_transaction(conn=conn, dedupe_key=item.dedupe_key):
                duplicates_skipped.append(
                    {
                        "dedupe_key": item.dedupe_key,
                        "date": resolved_date,
                        "amount_paise": item.amount_paise,
                        "direction": item.direction,
                        "raw_text": item.raw,
                    }
                )
                continue

            # If needs_merchant, leave merchant empty and category "Uncategorized"
            if item.needs_merchant:
                merchant = ""
                cat = "Uncategorized"
                needs_merchant_val = 1
            else:
                merchant = item.counterparty_raw or ""
                cat = categorize(
                    merchant=merchant,
                    raw_text=item.raw,
                    amount_paise=item.amount_paise,
                    direction=item.direction,
                    conn=conn,
                )
                needs_merchant_val = 0

            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO transactions (
                    date, amount_paise, direction, raw_text, source,
                    ref_no, upi_ref, merchant, category, balance_paise,
                    dedupe_key, needs_merchant
                ) VALUES (?, ?, ?, ?, 'sms', ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    resolved_date,
                    item.amount_paise,
                    item.direction,
                    item.raw,
                    item.upi_ref,
                    item.upi_ref,
                    merchant,
                    cat,
                    item.balance_paise,
                    item.dedupe_key,
                    needs_merchant_val,
                ),
            )
            tx_id = cursor.lastrowid
            cursor.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
            col_names = [col[0] for col in cursor.description]
            row = cursor.fetchone()
            inserted.append(dict(zip(col_names, row)))

        elif item.status == "ignored":
            ignored.append(
                {
                    "status": item.status,
                    "reason": item.reason,
                    "raw": item.raw,
                    "raw_text": item.raw,
                }
            )
        else:
            unparsed.append(
                {
                    "status": item.status,
                    "reason": item.reason,
                    "raw": item.raw,
                    "raw_text": item.raw,
                }
            )

    conn.commit()

    # Reconcile after SMS ingest
    reconcile_sms_with_paytm(conn)

    return {
        "inserted": inserted,
        "duplicates_skipped": duplicates_skipped,
        "ignored": ignored,
        "unparsed": unparsed,
    }


def ingest_paytm_records(
    conn: sqlite3.Connection,
    data: Union[str, List[Dict[str, Any]]],
) -> Dict[str, Any]:
    """Ingests Paytm records from CSV or dicts, deduping by upi_ref, else by (date, amount, direction, merchant).
    
    After ingestion, automatically triggers SMS-to-Paytm reconciliation.
    """
    paytm_result = parse_paytm(data)

    inserted: List[Dict[str, Any]] = []
    duplicates_skipped: List[Dict[str, Any]] = []

    cursor = conn.cursor()

    for row in paytm_result.parsed:
        # Deduplication: by upi_ref when present, else by (date, amount, direction, merchant)
        is_dup = False
        if row.upi_ref:
            cursor.execute(
                "SELECT 1 FROM transactions WHERE source = 'PAYTM' AND upi_ref = ? LIMIT 1",
                (row.upi_ref,),
            )
            if cursor.fetchone() is not None:
                is_dup = True
        else:
            cursor.execute(
                """
                SELECT 1 FROM transactions 
                WHERE source = 'PAYTM' 
                  AND date = ? 
                  AND amount_paise = ? 
                  AND UPPER(direction) = UPPER(?) 
                  AND LOWER(merchant) = LOWER(?)
                LIMIT 1
                """,
                (row.date, row.amount_paise, row.direction, row.merchant),
            )
            if cursor.fetchone() is not None:
                is_dup = True

        if is_dup:
            duplicates_skipped.append(row.to_dict())
            continue

        dedupe_key = (
            f"paytm:ref:{row.upi_ref}"
            if row.upi_ref
            else f"paytm:{row.date}:{row.direction}:{row.amount_paise}:{row.merchant}"
        )

        # Check Tier 1 user rule override first
        tier1_cat = None
        if row.merchant:
            tier1_match = check_tier1_rules(
                conn=conn,
                merchant=row.merchant,
                amount_paise=row.amount_paise,
                direction=row.direction,
                raw_text=row.raw_description,
            )
            if tier1_match:
                tier1_cat = tier1_match[1]

        final_category = (
            tier1_cat
            if tier1_cat
            else (
                row.category
                if row.category and row.category != "Uncategorized"
                else categorize(
                    merchant=row.merchant,
                    amount_paise=row.amount_paise,
                    direction=row.direction,
                    raw_text=row.raw_description,
                    conn=conn,
                )
            )
        )

        cursor.execute(
            """
            INSERT INTO transactions (
                date, amount_paise, direction, raw_text, source,
                ref_no, upi_ref, merchant, category, balance_paise,
                dedupe_key, needs_merchant
            ) VALUES (?, ?, ?, ?, 'PAYTM', ?, ?, ?, ?, NULL, ?, 0)
            """,
            (
                row.date,
                row.amount_paise,
                row.direction,
                row.raw_description,
                row.upi_ref,
                row.upi_ref,
                row.merchant,
                final_category,
                dedupe_key,
            ),
        )
        tx_id = cursor.lastrowid
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
        col_names = [c[0] for c in cursor.description]
        inserted_row = cursor.fetchone()
        inserted.append(dict(zip(col_names, inserted_row)))

    conn.commit()

    # Reconcile after Paytm ingest
    reconciliation_result = reconcile_sms_with_paytm(conn)

    return {
        "inserted": inserted,
        "duplicates_skipped": duplicates_skipped,
        "unparsed": [u.to_dict() for u in paytm_result.unparsed],
        "reconciled": reconciliation_result["reconciled_count"],
    }
