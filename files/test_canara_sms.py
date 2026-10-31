from datetime import datetime
from pathlib import Path
from app.parsers.canara_sms import parse_sms, parse_many, to_paise

FIX = Path(__file__).parent / "fixtures" / "canara_sms.txt"


def test_to_paise():
    assert to_paise("2,134.97") == 213497
    assert to_paise("500") == 50000
    assert to_paise("500.5") == 50050


def test_upi_credit():
    r = parse_many(FIX.read_text())[0]
    assert r.status == "parsed" and r.direction == "CREDIT"
    assert r.amount_paise == 50000 and r.upi_ref == "612345678901"
    assert r.txn_date == "2026-03-14" and r.template_verified


def test_generic_credit_with_balance():
    r = parse_many(FIX.read_text())[1]
    assert r.direction == "CREDIT" and r.amount_paise == 200000
    assert r.balance_paise == 213497 and r.txn_date == "2026-06-12"


def test_otp_and_feedback_ignored():
    rs = parse_many(FIX.read_text())
    assert rs[2].status == "ignored" and rs[2].reason == "otp"
    assert rs[3].status == "ignored"
    assert rs[2].amount_paise is None  # OTP content never extracted


def test_redacted_date_falls_back_to_received_at():
    msg = ("An amount of INR 2,000.00 has been CREDITED to your account on Total Avail.bal INR 2,134.97.- Canara Bank")
    r = parse_sms(msg, received_at=datetime(2026, 6, 12, 21, 31))
    assert r.status == "parsed" and r.txn_date == "2026-06-12"


def test_unknown_message_is_returned_not_dropped():
    r = parse_sms("Some brand new Canara format we have not seen")
    assert r.status == "unparsed"


def test_real_debit_shapes():
    rs = parse_many(FIX.read_text())
    d = rs[4:7]
    assert [r.status for r in d] == ["parsed"] * 3
    assert [r.direction for r in d] == ["DEBIT"] * 3
    assert [r.amount_paise for r in d] == [12000, 5500, 2000]
    assert [r.balance_paise for r in d] == [201497, 195997, 193997]
    assert all(r.template_verified and r.needs_merchant for r in d)
    assert d[1].txn_date == "2026-10-21"          # trailing dot after the date is tolerated


def test_debit_balance_chain():
    d = parse_many(FIX.read_text())[4:7]
    for prev, cur in zip(d, d[1:]):               # running-balance integrity check
        assert prev.balance_paise - cur.amount_paise == cur.balance_paise


def test_dedupe_key_unique_without_ref():
    d = parse_many(FIX.read_text())[4:7]
    assert len({r.dedupe_key for r in d}) == 3
    assert parse_many(FIX.read_text())[0].dedupe_key == "ref:612345678901"


def test_cyber_fraud_footer_not_ignored():
    r = parse_many(FIX.read_text())[4]
    assert r.status == "parsed"
