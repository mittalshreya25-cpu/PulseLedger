import csv
from dataclasses import dataclass
from datetime import datetime
import io
import re
from typing import Any, Dict, List, Optional, Tuple, Union

try:
    from engines.categorizer import map_paytm_tag_to_category
    from engines.currency import to_paise
except ImportError:
    from backend.engines.categorizer import map_paytm_tag_to_category
    from backend.engines.currency import to_paise


@dataclass
class ParsedPaytmRow:
    date: str
    date_time: str
    amount_paise: int
    direction: str  # 'DEBIT' or 'CREDIT'
    merchant: str
    category: str
    tag: str
    account: str
    upi_ref: Optional[str]
    raw_description: str
    status: str = "parsed"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "date": self.date,
            "date_time": self.date_time,
            "amount_paise": self.amount_paise,
            "direction": self.direction,
            "merchant": self.merchant,
            "category": self.category,
            "tag": self.tag,
            "account": self.account,
            "upi_ref": self.upi_ref,
            "raw_description": self.raw_description,
            "status": self.status,
        }

    def __getitem__(self, item: str) -> Any:
        return getattr(self, item)


@dataclass
class UnparsedPaytmRow:
    raw: Any
    reason: str
    status: str = "unparsed"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "raw": self.raw,
            "reason": self.reason,
            "status": self.status,
        }

    def __getitem__(self, item: str) -> Any:
        return getattr(self, item)


class PaytmParseResult:
    def __init__(self, parsed: List[ParsedPaytmRow], unparsed: List[UnparsedPaytmRow]):
        self.parsed = parsed
        self.unparsed = unparsed

    def __iter__(self):
        yield self.parsed
        yield self.unparsed

    def __getitem__(self, item: Union[int, str]):
        if isinstance(item, int):
            return (self.parsed, self.unparsed)[item]
        if item == "parsed":
            return self.parsed
        if item == "unparsed":
            return self.unparsed
        raise KeyError(item)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "parsed": [r.to_dict() for r in self.parsed],
            "unparsed": [r.to_dict() for r in self.unparsed],
        }


HEADER_SYNONYMS = {
    "date_time": {"date_time", "datetime", "date & time", "date and time", "date", "transaction date", "txn date", "time"},
    "description": {"description", "narration", "details", "particulars", "remarks", "transaction details"},
    "tag": {"tag", "tags", "category"},
    "account": {"account", "source account", "bank name", "account number", "wallet/bank"},
    "amount": {"amount", "txn amount", "amount (rs.)", "amount(inr)", "total amount"},
    "upi_ref": {"upi_ref", "upi ref", "rrn", "reference no", "ref no", "upi reference no", "utr"},
}


def _match_header(header: str) -> Optional[str]:
    cleaned = header.strip().lower()
    for canonical, synonyms in HEADER_SYNONYMS.items():
        if cleaned in synonyms:
            return canonical
    return None


def _clean_merchant(desc: str) -> str:
    cleaned = re.sub(r"^(?:paid\s+to\s+|received\s+from\s+)", "", desc.strip(), flags=re.I).strip()
    return cleaned if cleaned else desc.strip()


def _parse_amount(raw_amt: str) -> Tuple[Optional[int], Optional[str]]:
    amt_str = raw_amt.strip()
    if not amt_str:
        return None, None

    direction = "DEBIT" if "-" in amt_str else "CREDIT"
    m = re.search(r"([\d,]+(?:\.\d{1,2})?)", amt_str)
    if not m:
        return None, None

    num_part = m.group(1).replace(",", "")
    try:
        paise = to_paise(num_part)
        return paise, direction
    except Exception:
        return None, None


def _parse_date(raw_dt: str) -> Tuple[str, str]:
    cleaned = raw_dt.strip()
    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%d-%m-%Y %H:%M:%S",
        "%d/%m/%Y %H:%M:%S",
        "%d-%m-%Y %H:%M",
        "%d/%m/%Y %H:%M",
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%d/%m/%Y",
    ):
        try:
            dt = datetime.strptime(cleaned, fmt)
            return dt.strftime("%Y-%m-%d"), cleaned
        except ValueError:
            continue
    # Fallback to current date if completely unparseable
    return datetime.now().strftime("%Y-%m-%d"), cleaned


def parse_paytm(rows: Union[str, List[Dict[str, Any]]]) -> PaytmParseResult:
    """Parses Paytm transactions from CSV text or list of dicts.
    
    Accepts tolerant headers, parses signed amounts into integer paise,
    strips 'Paid to ' / 'Received from ' to extract merchant, strips # from tags,
    and returns parsed and unparsed rows.
    """
    raw_dicts: List[Dict[str, Any]] = []

    if isinstance(rows, str):
        # Ignore comments or synthetic markers before header
        lines = [line for line in rows.splitlines() if line.strip() and not line.strip().startswith("#")]
        if not lines:
            return PaytmParseResult([], [])
        reader = csv.DictReader(lines)
        raw_dicts = list(reader)
    elif isinstance(rows, list):
        raw_dicts = rows
    else:
        return PaytmParseResult([], [UnparsedPaytmRow(raw=rows, reason="invalid_input_type")])

    parsed_rows: List[ParsedPaytmRow] = []
    unparsed_rows: List[UnparsedPaytmRow] = []

    for raw_row in raw_dicts:
        # Build canonical dict
        canon: Dict[str, Any] = {}
        for k, v in raw_row.items():
            if k is None:
                continue
            canonical_key = _match_header(str(k))
            if canonical_key:
                canon[canonical_key] = v

        raw_desc = str(canon.get("description") or "").strip()
        raw_amt = str(canon.get("amount") or "").strip()
        raw_date = str(canon.get("date_time") or "").strip()
        raw_tag = str(canon.get("tag") or "").strip()
        raw_account = str(canon.get("account") or "").strip()
        raw_ref = str(canon.get("upi_ref") or "").strip()
        cleaned_ref = raw_ref if raw_ref else None

        if not raw_amt:
            unparsed_rows.append(UnparsedPaytmRow(raw=raw_row, reason="missing_amount"))
            continue

        amount_paise, direction = _parse_amount(raw_amt)
        if amount_paise is None or direction is None:
            unparsed_rows.append(UnparsedPaytmRow(raw=raw_row, reason="unparseable_amount"))
            continue

        date_iso, full_dt = _parse_date(raw_date)
        merchant = _clean_merchant(raw_desc)
        cleaned_tag = raw_tag.lstrip("#").strip()
        category = map_paytm_tag_to_category(cleaned_tag)

        parsed_rows.append(
            ParsedPaytmRow(
                date=date_iso,
                date_time=full_dt,
                amount_paise=amount_paise,
                direction=direction,
                merchant=merchant,
                category=category,
                tag=cleaned_tag,
                account=raw_account,
                upi_ref=cleaned_ref,
                raw_description=raw_desc,
            )
        )

    return PaytmParseResult(parsed=parsed_rows, unparsed=unparsed_rows)
