"""Canara Bank SMS parser.

Built ONLY from templates seen in the owner's real SMS screenshots (31 Oct 2026):
  T1  UPI credit : "Your a/c no. X has been credited with Rs.500.00 on <date> from a/c no. Y (UPI Ref no Z)-Canara Bank"
  T3  Generic debit  : "An amount of INR X has been DEBITED to your account Y on D. Total Avail.bal INR Z. Dial 1930 ..."
  T2  Generic credit : "An amount of INR 2,000.00 has been CREDITED to your account X on <date> Total Avail.bal INR 2,134.97.- Canara Bank"
Ignored on purpose (never stored, never sent to an LLM):
  OTP messages, feedback/promo messages.
The UPI-debit template (upi_debit_a) is an UNVERIFIED mirror and flagged template_verified=False.
IMPORTANT: Canara generic debit SMS carry NO merchant and NO UPI ref. Merchant must come from the user or another source.

Money is integer paise. Nothing here does arithmetic beyond parsing.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

_AMT = r"(?P<amt>[\d,]+(?:\.\d{1,2})?)"
_DATE_FORMATS = (
    "%d-%m-%Y", "%d/%m/%Y", "%d-%m-%y", "%d/%m/%y", "%d-%b-%Y", "%d-%b-%y",
    "%d%b%Y", "%d %b %Y", "%d-%b-%Y %H:%M:%S", "%d-%m-%Y %H:%M:%S",
)

IGNORE_PATTERNS = [
    ("otp", re.compile(r"\bOTP\b", re.I)),
    ("feedback_or_promo", re.compile(r"feedback|enjoying our|click here|apply now|offer", re.I)),
]

# (name, verified, regex)
TEMPLATES = [
    ("upi_credit_a", True, re.compile(
        r"Your a/c no\.?\s*(?P<acct>\S+)\s+has been credited with (?:Rs\.?|INR)\s*" + _AMT +
        r"\s+on\s+(?P<date>.+?)\s+from a/c no\.?\s*(?P<cp>\S+?)\s*\(?\s*UPI Ref\s*no\.?\s*(?P<ref>\d+)\s*\)?",
        re.I | re.S)),
    ("generic_credit", True, re.compile(
        r"An amount of\s*(?:INR\s*)?" + _AMT + r"\s+has been CREDITED (?:to|in) your account\s*(?P<acct>\S*)\s*on\s*(?P<date>.*?)\s*"
        r"Total Avail\.?\s*bal\s*(?:INR\s*)?(?P<bal>[\d,]+(?:\.\d{1,2})?)", re.I | re.S)),
    # Verified shape (user supplied 4 real debit SMS with figures removed):
    # "An amount of INR X has been DEBITED to your account Y on D. Total Avail.bal INR Z. Dial 1930 to report cyber fraud - Canara Bank"
    ("generic_debit", True, re.compile(
        r"An amount of\s*(?:INR\s*)?" + _AMT + r"\s+has been DEBITED (?:to|from) your account\s*(?P<acct>\S*)\s*on\s*(?P<date>.*?)\s*"
        r"Total Avail\.?\s*bal\s*(?:INR\s*)?(?P<bal>[\d,]+(?:\.\d{1,2})?)", re.I | re.S)),
    # --- mirrors of the above; NOT yet seen in real data ---
    ("upi_debit_a", False, re.compile(
        r"Your a/c no\.?\s*(?P<acct>\S+)\s+has been debited with (?:Rs\.?|INR)\s*" + _AMT +
        r"\s+on\s+(?P<date>.+?)\s+(?:to|towards)\s+(?P<cp>.+?)\s*\(?\s*UPI Ref\s*no\.?\s*(?P<ref>\d+)\s*\)?",
        re.I | re.S)),
]


@dataclass
class ParsedSms:
    status: str                      # "parsed" | "ignored" | "unparsed"
    reason: str = ""                 # ignore reason or template name
    direction: Optional[str] = None  # "CREDIT" | "DEBIT"
    amount_paise: Optional[int] = None
    balance_paise: Optional[int] = None
    upi_ref: Optional[str] = None
    counterparty_raw: Optional[str] = None
    txn_date: Optional[str] = None   # ISO date
    template_verified: bool = False
    raw: str = field(default="", repr=False)

    @property
    def dedupe_key(self) -> Optional[str]:
        """UPI ref when present; otherwise date+amount+direction+balance-after (balance makes SMS-only rows unique)."""
        if self.status != "parsed":
            return None
        if self.upi_ref:
            return f"ref:{self.upi_ref}"
        return f"sms:{self.txn_date}:{self.direction}:{self.amount_paise}:{self.balance_paise}"

    @property
    def needs_merchant(self) -> bool:
        return self.status == "parsed" and not self.counterparty_raw


def to_paise(text: str) -> int:
    whole, _, frac = text.replace(",", "").partition(".")
    return int(whole) * 100 + int((frac + "00")[:2])


def _parse_date(raw: str, received_at: Optional[datetime]) -> Optional[str]:
    cleaned = re.sub(r"\s+", " ", (raw or "").strip(" .,-"))
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(cleaned, fmt).date().isoformat()
        except ValueError:
            continue
    return received_at.date().isoformat() if received_at else None  # fall back to SMS timestamp


def parse_sms(text: str, received_at: Optional[datetime] = None) -> ParsedSms:
    body = re.sub(r"\s+", " ", text or "").strip()
    for name, pat in IGNORE_PATTERNS:
        if pat.search(body):
            return ParsedSms("ignored", name, raw=body)
    for name, verified, pat in TEMPLATES:
        m = pat.search(body)
        if not m:
            continue
        g = m.groupdict()
        direction = "DEBIT" if "debit" in name else "CREDIT"
        return ParsedSms(
            status="parsed", reason=name, direction=direction,
            amount_paise=to_paise(g["amt"]),
            balance_paise=to_paise(g["bal"]) if g.get("bal") else None,
            upi_ref=g.get("ref"),
            counterparty_raw=(g.get("cp") or None),
            txn_date=_parse_date(g.get("date", ""), received_at),
            template_verified=verified, raw=body)
    return ParsedSms("unparsed", "no_template_matched", raw=body)


def parse_many(blob: str, received_at: Optional[datetime] = None) -> list[ParsedSms]:
    """Split a pasted blob on blank lines; one message per block."""
    parts = [p for p in re.split(r"\n\s*\n", blob.strip()) if p.strip()]
    return [parse_sms(p, received_at) for p in parts]
