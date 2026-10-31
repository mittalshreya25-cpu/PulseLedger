import json
import os
from pathlib import Path
import re
import sqlite3
from typing import Any, Dict, List, Optional, Tuple, Union

BASE_DIR = Path(__file__).resolve().parent.parent.parent

BUILTIN_CATEGORIES: List[str] = [
    "Food",
    "Money Transfer",
    "Entertainment",
    "Education",
    "Services",
    "Miscellaneous",
    "Hostel & Mess",
    "Transport",
    "Bank charges",
    "Uncategorized",
    "Allowance (income)",
    "Allowance",
    "Investments & Savings",
]

BANK_CHARGES_PATTERNS = [
    r"\b(?:sms\s*chg|sms\s*charges?)\b",
    r"\b(?:annual\s*(?:fee|chg|maintenance))\b",
    r"\b(?:debit\s*card\s*chg|atm\s*fee|card\s*fee)\b",
    r"\b(?:min\s*bal(?:ance)?\s*chg|penalty)\b",
    r"\b(?:service\s*charge|bank\s*charges?)\b",
    r"\bcharges?\b",
    r"\bfee\b",
]

PAYTM_TAG_MAP: Dict[str, str] = {
    "food": "Food",
    "groceries": "Food",
    "shopping": "Miscellaneous",
    "travel": "Transport",
    "money transfer": "Money Transfer",
    "money received": "Allowance",
    "financial services": "Investments & Savings",
    "bill payments": "Services",
}

# Explicit counter for LLM calls to verify zero LLM calls
llm_calls: int = 0


def get_llm_calls() -> int:
    global llm_calls
    return llm_calls


def reset_llm_calls() -> None:
    global llm_calls
    llm_calls = 0


def get_builtin_categories() -> List[str]:
    """Returns the list of built-in categories."""
    return list(BUILTIN_CATEGORIES)


def map_paytm_tag_to_category(tag: Optional[str]) -> str:
    """Maps a Paytm tag (with or without #) to our application categories."""
    if not tag:
        return "Uncategorized"
    cleaned = tag.strip().lstrip("#").strip()
    cleaned_lower = cleaned.lower()

    # 1. Check explicit Paytm tag map
    if cleaned_lower in PAYTM_TAG_MAP:
        return PAYTM_TAG_MAP[cleaned_lower]

    # 2. Check if it directly matches any of our builtin categories
    for cat in BUILTIN_CATEGORIES:
        if cleaned_lower == cat.lower():
            return cat

    return "Uncategorized"


_MERCHANT_DICT_CACHE: Optional[Dict[str, str]] = None


def get_merchant_dictionary() -> Dict[str, str]:
    """Loads and caches the merchant dictionary from data/merchants.json."""
    global _MERCHANT_DICT_CACHE
    if _MERCHANT_DICT_CACHE is not None:
        return _MERCHANT_DICT_CACHE

    json_path = BASE_DIR / "data" / "merchants.json"
    if json_path.exists():
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                _MERCHANT_DICT_CACHE = json.load(f)
        except Exception:
            _MERCHANT_DICT_CACHE = {}
    else:
        _MERCHANT_DICT_CACHE = {}

    return _MERCHANT_DICT_CACHE


def check_tier1_rules(
    conn: sqlite3.Connection,
    merchant: Optional[str] = None,
    amount_paise: Optional[int] = None,
    direction: Optional[str] = None,
    raw_text: Optional[str] = None,
) -> Optional[Tuple[int, str]]:
    """Checks DB rules table ordered by specificity DESC, id DESC.
    
    Returns (rule_id, category) if matched, else None.
    Specificity levels:
    - 30+: exact payee + band
    - 20-29: exact payee
    - 10-19: substring / regex
    """
    cleaned_merchant = (merchant or "").strip()
    combined = f"{cleaned_merchant} {raw_text or ''}".strip()

    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, payee_pattern, amount_min, amount_max, direction, category, specificity 
            FROM rules 
            WHERE active = 1 
            ORDER BY specificity DESC, id DESC
            """
        )
        rules = cursor.fetchall()
    except Exception:
        return None

    for rule in rules:
        # Check dictionary access or tuple indexing
        if isinstance(rule, sqlite3.Row):
            r_id = rule["id"]
            payee_pattern = rule["payee_pattern"] or ""
            amt_min = rule["amount_min"]
            amt_max = rule["amount_max"]
            r_dir = rule["direction"]
            category = rule["category"]
            specificity = rule["specificity"]
        else:
            r_id, payee_pattern, amt_min, amt_max, r_dir, category, specificity = rule

        # 1. Direction check
        if r_dir and direction:
            if str(r_dir).strip().upper() != str(direction).strip().upper():
                continue

        # 2. Amount band check
        if amt_min is not None:
            if amount_paise is None or amount_paise < amt_min:
                continue
        if amt_max is not None:
            if amount_paise is None or amount_paise > amt_max:
                continue

        # 3. Payee match check
        p_pattern = (payee_pattern or "").strip().lower()
        if not p_pattern:
            continue

        matched = False
        if specificity >= 20:
            # Exact payee matching
            if cleaned_merchant and cleaned_merchant.lower() == p_pattern:
                matched = True
        else:
            # Substring / pattern matching
            if cleaned_merchant and p_pattern in cleaned_merchant.lower():
                matched = True
            elif combined:
                try:
                    if re.search(r"(?:\b|^)" + re.escape(p_pattern) + r"(?:\b|$)", combined, re.IGNORECASE):
                        matched = True
                    elif p_pattern in combined.lower():
                        matched = True
                except Exception:
                    if p_pattern in combined.lower():
                        matched = True

        if matched:
            try:
                conn.execute("UPDATE rules SET hits = hits + 1 WHERE id = ?", (r_id,))
                conn.commit()
            except Exception:
                pass
            return (r_id, category)

    return None


def categorize(
    merchant: Optional[str] = None,
    raw_text: Optional[str] = None,
    custom_rules: Optional[List[Tuple[str, str]]] = None,
    amount_paise: Optional[int] = None,
    direction: Optional[str] = None,
    conn: Optional[sqlite3.Connection] = None,
) -> str:
    """Categorizes a transaction through the deterministic 3-tier system:
    
    Tier 1: User / Correction Rules (DB rules table ordered by specificity, or passed custom_rules)
    Tier 2: Merchant Dictionary (data/merchants.json)
    Tier 3: Built-in Bank Charges or default 'Uncategorized'
    
    Zero LLM calls are made.
    """
    cleaned_merchant = (merchant or "").strip()
    combined = f"{cleaned_merchant} {raw_text or ''}".strip()

    # --- TIER 1: User / Correction Rules ---
    # 1a. DB Rules table (ordered by specificity: exact+band > exact > substring)
    if conn is not None and (cleaned_merchant or combined):
        t1_match = check_tier1_rules(
            conn=conn,
            merchant=cleaned_merchant,
            amount_paise=amount_paise,
            direction=direction,
            raw_text=raw_text,
        )
        if t1_match is not None:
            return t1_match[1]

    # 1b. Legacy/in-memory custom_rules passed directly
    if custom_rules and combined:
        for pattern, category in custom_rules:
            if re.search(pattern, combined, re.IGNORECASE):
                return category

    # --- TIER 2: Merchant Dictionary (data/merchants.json) ---
    merchant_dict = get_merchant_dictionary()
    if merchant_dict and (cleaned_merchant or combined):
        # 2a. Exact match on merchant
        if cleaned_merchant:
            m_lower = cleaned_merchant.lower()
            for m_key, cat in merchant_dict.items():
                if m_key.strip().lower() == m_lower:
                    return cat

        # 2b. Word boundary / keyword search in merchant and combined
        for m_key, cat in merchant_dict.items():
            k_clean = m_key.strip()
            if not k_clean:
                continue
            pattern = r"(?:\b|^)" + re.escape(k_clean) + r"(?:\b|$)"
            if re.search(pattern, combined, re.IGNORECASE):
                return cat

    # --- TIER 3: Bank Charges / Uncategorized Fallback ---
    if combined:
        for pat in BANK_CHARGES_PATTERNS:
            if re.search(pat, combined, re.IGNORECASE):
                return "Bank charges"

    return "Uncategorized"
