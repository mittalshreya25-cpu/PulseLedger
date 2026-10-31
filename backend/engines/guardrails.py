import re
from typing import Any, Dict, List, Optional, Tuple

BLOCKED_TICKERS = {
    "nifty", "sensex", "reliance", "tcs", "hdfc", "infosys", "icici", "itc", "sbi",
    "bhartiartl", "tata", "tatamotors", "tatasteel", "maruti", "wipro", "hcl",
    "adani", "lic", "zomato", "paytm", "nykaa", "bitcoin", "btc", "ethereum", "eth",
    "crypto", "doge", "dogecoin", "solana", "nvidia", "apple", "tesla", "nasdaq",
}

SPECULATIVE_ASSET_KEYWORDS = {
    "stock", "stocks", "share", "shares", "crypto", "cryptocurrency", "cryptos",
    "mutual fund", "mutual funds", "equity", "equities", "multibagger", "penny stock",
    "small cap", "midcap", "bluechip", "sip", "etf", "etfs", "index fund", "debt fund",
    "swing trading", "trading", "dividend yield", "dividends",
}

INTENT_ACTION_KEYWORDS = {
    "buy", "sell", "invest", "purchase", "pick", "short", "recommend", "suggest",
    "portfolio", "returns", "profit", "undervalued", "good buy", "worth buying",
    "kaunsa", "kisme",
}

RECOMMENDATION_INTENT_PATTERNS = [
    r"\b(?:which|what)\s+(?:stock|share|crypto|coin|equity|mutual\s*fund|sip|etf)\s+(?:should|to|can)\s+i\s+(?:buy|invest|purchase|pick)\b",
    r"\b(?:recommend|suggest)\s+(?:me\s+)?(?:some\s+)?(?:stocks?|shares?|cryptos?|funds?|securities)\b",
    r"\b(?:is|are)\s+([a-zA-Z0-9]+)\s+(?:a\s+good\s+(?:buy|investment|stock)|worth\s+buying)\b",
    r"\b(?:should\s+i\s+(?:buy|invest\s+in|sell|short))\s+([a-zA-Z0-9]+)\b",
    r"\b(?:best|top)\s+(?:stocks?|shares?|mutual\s*funds?|cryptos?)\s+(?:to\s+buy|for\s+202[0-9]|now)\b",
    r"\b(?:kaunsa\s+stock|kisme\s+invest)\b",
]

BENIGN_ALLOWLIST = {
    "laptop", "phone", "bike", "car", "groceries", "flight", "ticket", "hostel", "mess",
    "tuition", "fee", "course", "books", "shoes", "clothes", "food", "dining", "coffee",
}

GENERIC_ASSET_CLASSES = [
    {
        "name": "Emergency Buffer / High-Yield Savings",
        "nominal_return_range": "3.5% - 7.0%",
        "liquidity": "Immediate (T+0)",
        "volatility": "Very Low",
        "role_in_plan": "Covers unpredicted shocks without disrupting goal timelines.",
    },
    {
        "name": "Fixed Deposits / Short-Term Debt",
        "nominal_return_range": "6.5% - 7.5%",
        "liquidity": "High (penalty on early break)",
        "volatility": "Low",
        "role_in_plan": "Ideal for goals with fixed horizons under 3 years.",
    },
    {
        "name": "Broad Market Index / Long-Term Equity (Generic)",
        "nominal_return_range": "10.0% - 13.0% (historical broad average)",
        "liquidity": "Medium (T+2)",
        "volatility": "High in short-term; smooths over 7+ years",
        "role_in_plan": "For long-term horizon goals (5+ years) where inflation beat is required.",
    },
]


def check_intent_firewall(user_prompt: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """Checks input prompt against Layer 1 guardrails.
    
    Returns (is_blocked, blocked_reason, suggested_pivot).
    """
    clean = user_prompt.strip().lower()

    # Allowlist check: if asking about benign non-security items, permit immediately
    if any(b in clean for b in BENIGN_ALLOWLIST) and not any(k in clean for k in ["stock", "share", "crypto", "fund", "sip", "etf", "coin"]):
        return False, None, None

    # Check for direct blocked security/ticker mentions
    for ticker in BLOCKED_TICKERS:
        pattern = r"\b" + re.escape(ticker) + r"\b"
        if re.search(pattern, clean):
            return True, f"Direct mention of regulated security or speculative asset '{ticker.upper()}'", "asset_class_scenario"

    # Check for speculative asset keywords paired with action intent
    has_asset_keyword = any(re.search(r"\b" + re.escape(k) + r"\b", clean) for k in SPECULATIVE_ASSET_KEYWORDS)
    has_action_intent = any(re.search(r"\b" + re.escape(k) + r"\b", clean) for k in INTENT_ACTION_KEYWORDS)

    if has_asset_keyword and (has_action_intent or "?" in clean):
        return True, "Request for specific security or speculative asset recommendation", "asset_class_scenario"

    # Check for recommendation phrasing
    for pat in RECOMMENDATION_INTENT_PATTERNS:
        if re.search(pat, clean):
            return True, "Request for specific security or speculative asset recommendation", "asset_class_scenario"

    return False, None, None


def validate_model_output(response_text: str) -> Tuple[bool, str]:
    """Layer 3 Output Validator: ensures model never outputs advice or specific security names."""
    clean = response_text.lower()
    for ticker in BLOCKED_TICKERS:
        if re.search(r"\b" + re.escape(ticker) + r"\b", clean):
            safe_fallback = (
                "PulseLedger is designed strictly as an educational financial coach and does not recommend "
                "specific stocks, funds, or speculative assets. Please explore our generic asset-class scenario model below."
            )
            return False, safe_fallback

    return True, response_text


def get_asset_class_scenarios() -> List[Dict[str, Any]]:
    """Returns educational asset-class scenario definitions."""
    return list(GENERIC_ASSET_CLASSES)
