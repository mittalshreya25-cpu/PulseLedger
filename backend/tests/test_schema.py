import sqlite3
import pytest
from backend.app.database import init_db
from backend.seed import seed_data


@pytest.fixture
def db_conn():
    conn = sqlite3.connect(":memory:")
    init_db(conn)
    yield conn
    conn.close()


def test_schema_creates_tables(db_conn):
    cursor = db_conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = {row[0] for row in cursor.fetchall()}

    expected_tables = {"transactions", "rules", "profile", "goals", "categories"}
    assert expected_tables.issubset(tables), f"Missing tables: {expected_tables - tables}"


def test_table_columns(db_conn):
    cursor = db_conn.cursor()

    # transactions columns
    cursor.execute("PRAGMA table_info(transactions);")
    tx_cols = {row[1] for row in cursor.fetchall()}
    expected_tx_cols = {
        "id",
        "date",
        "amount_paise",
        "direction",
        "raw_text",
        "source",
        "ref_no",
        "upi_ref",
        "merchant",
        "category",
        "balance_paise",
        "dedupe_key",
        "needs_merchant",
        "matched_paytm_id",
    }
    assert expected_tx_cols == tx_cols

    # rules columns
    cursor.execute("PRAGMA table_info(rules);")
    rule_cols = {row[1] for row in cursor.fetchall()}
    assert {"id", "pattern", "category", "created_at"}.issubset(rule_cols)

    # profile columns
    cursor.execute("PRAGMA table_info(profile);")
    profile_cols = {row[1] for row in cursor.fetchall()}
    assert {"key", "value"} == profile_cols

    # goals columns
    cursor.execute("PRAGMA table_info(goals);")
    goal_cols = {row[1] for row in cursor.fetchall()}
    assert {"id", "name", "target_paise", "target_date"}.issubset(goal_cols)

    # categories columns
    cursor.execute("PRAGMA table_info(categories);")
    cat_cols = {row[1] for row in cursor.fetchall()}
    assert {"id", "name"} == cat_cols


def test_transactions_source_constraint(db_conn):
    cursor = db_conn.cursor()

    # Valid insert with source='sms'
    cursor.execute(
        """
        INSERT INTO transactions (date, amount_paise, direction, raw_text, source, upi_ref, merchant, category, balance_paise)
        VALUES ('2026-10-31', 150000, 'debit', 'Paid at grocery', 'sms', 'UPI12345', 'Supermarket', 'Groceries', 5000000)
        """
    )
    db_conn.commit()

    # Invalid insert with source='unknown' must fail CHECK constraint
    with pytest.raises(sqlite3.IntegrityError):
        cursor.execute(
            """
            INSERT INTO transactions (date, amount_paise, direction, raw_text, source, upi_ref, merchant, category, balance_paise)
            VALUES ('2026-10-31', 20000, 'debit', 'Test invalid source', 'invalid_source', NULL, 'Test', 'Misc', 4980000)
            """
        )
        db_conn.commit()


def test_transactions_dedupe_key_unique(db_conn):
    cursor = db_conn.cursor()

    cursor.execute(
        """
        INSERT INTO transactions (date, amount_paise, direction, source, dedupe_key)
        VALUES ('2026-10-31', 10000, 'debit', 'sms', 'sms:unique:key:1')
        """
    )
    db_conn.commit()

    with pytest.raises(sqlite3.IntegrityError):
        cursor.execute(
            """
            INSERT INTO transactions (date, amount_paise, direction, source, dedupe_key)
            VALUES ('2026-10-31', 10000, 'debit', 'sms', 'sms:unique:key:1')
            """
        )
        db_conn.commit()


def test_seed_loads_profile_and_goals_and_categories(tmp_path):
    test_db = tmp_path / "test_seed.db"
    seed_data(db_path=test_db)

    conn = sqlite3.connect(str(test_db))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) AS count FROM profile")
    profile_count = cursor.fetchone()["count"]
    assert profile_count > 0

    cursor.execute("SELECT COUNT(*) AS count FROM goals")
    goals_count = cursor.fetchone()["count"]
    assert goals_count > 0

    cursor.execute("SELECT COUNT(*) AS count FROM categories")
    categories_count = cursor.fetchone()["count"]
    assert categories_count >= 11

    cursor.execute("SELECT name FROM categories")
    all_cats = {r[0] for r in cursor.fetchall()}
    assert "Investments & Savings" in all_cats

    conn.close()
