from datetime import datetime
from pathlib import Path

try:
    from app.parsers.canara_sms import parse_many
    from app.parsers.paytm_import import parse_paytm
except ImportError:
    from backend.app.parsers.canara_sms import parse_many
    from backend.app.parsers.paytm_import import parse_paytm


def test_parse_many_valid_fixture():
    fixture_path = Path(__file__).parent / "fixtures" / "canara_sms.txt"
    raw_blob = fixture_path.read_text(encoding="utf-8")

    results = parse_many(raw_blob)
    assert len(results) == 7

    parsed_items = [r for r in results if r.status == "parsed"]
    ignored_items = [r for r in results if r.status == "ignored"]

    assert len(parsed_items) == 5
    assert len(ignored_items) == 2

    assert parsed_items[0].amount_paise == 50000
    assert parsed_items[0].direction == "CREDIT"
    assert parsed_items[0].upi_ref == "612345678901"
    assert parsed_items[0].txn_date == "2026-03-14"

    assert parsed_items[1].amount_paise == 200000
    assert parsed_items[1].direction == "CREDIT"
    assert parsed_items[1].balance_paise == 213497


def test_parse_many_ignored_messages():
    blob = """
    123456 is the OTP for txn of INR 0.00 at OPENAI on your Debit Card ending 1234 valid for 5 mins. Please do not share OTP with anyone.-Canara Bank

    Dear Customer, Hope you are enjoying our Services! We would love to hear about your experience to improve our services further. Please provide your valuable feedback for your visit done today at: https://canfeedback.canarabank.bank.in/feedback?id=XXXX Thanks for being so thoughtful. Canara Bank
    """
    results = parse_many(blob)
    assert len(results) == 2
    for res in results:
        assert res.status == "ignored"
        assert res.reason in ("otp", "feedback_or_promo")


def test_parse_many_unparsed_message():
    blob = "Meeting with accountant at 4pm today regarding quarterly audit."
    results = parse_many(blob)
    assert len(results) == 1
    assert results[0].status == "unparsed"
    assert results[0].reason == "no_template_matched"


def test_parse_many_received_at_fallback():
    msg = "An amount of INR 2,000.00 has been CREDITED to your account on Total Avail.bal INR 2,134.97.- Canara Bank"
    results = parse_many(msg, received_at=datetime(2026, 6, 12, 21, 31))
    assert len(results) == 1
    assert results[0].status == "parsed"
    assert results[0].txn_date == "2026-06-12"


def test_parse_paytm_sample_fixture():
    fixture_path = Path(__file__).parent / "fixtures" / "paytm_sample.csv"
    csv_text = fixture_path.read_text(encoding="utf-8")

    parsed, unparsed = parse_paytm(csv_text)
    assert len(parsed) == 25
    assert len(unparsed) == 0

    # Row 1: Received from Papa Allowance
    row1 = parsed[0]
    assert row1.merchant == "Papa Allowance"
    assert row1.category == "Allowance"
    assert row1.amount_paise == 200000
    assert row1.direction == "CREDIT"
    assert row1.date == "2026-06-12"

    # Row 2: Paid to Zomato
    row2 = parsed[1]
    assert row2.merchant == "Zomato"
    assert row2.category == "Food"
    assert row2.amount_paise == 12000
    assert row2.direction == "DEBIT"
    assert row2.date == "2026-10-20"

    # Investment row
    inv_row = next(r for r in parsed if r.merchant == "Zerodha Broking")
    assert inv_row.category == "Investments & Savings"
    assert inv_row.tag == "Financial Services"
    assert inv_row.amount_paise == 500000


def test_parse_paytm_list_of_dicts_and_unparsed():
    data = [
        {
            "Date & Time": "2026-05-10 14:00:00",
            "Details": "Paid to Blue Tokai",
            "Category": "#Food",
            "Account": "Wallet",
            "Amount(INR)": "- Rs.250.00",
            "RRN": "123456789",
        },
        {
            "Date & Time": "2026-05-11 15:00:00",
            "Details": "Corrupted amount entry",
            "Category": "#Food",
            "Account": "Wallet",
            "Amount(INR)": "invalid_number",
            "RRN": "123456790",
        },
    ]
    parsed, unparsed = parse_paytm(data)
    assert len(parsed) == 1
    assert len(unparsed) == 1

    assert parsed[0].merchant == "Blue Tokai"
    assert parsed[0].amount_paise == 25000
    assert parsed[0].direction == "DEBIT"

    assert unparsed[0].reason == "unparseable_amount"
    assert unparsed[0].status == "unparsed"
