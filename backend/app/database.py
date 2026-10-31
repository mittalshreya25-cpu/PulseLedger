import json
import os
import sqlite3
from pathlib import Path
from typing import Optional, Union

# Root directory of the repository
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_PATH = BASE_DIR / "data" / "pulseledger.db"

SEED_CATEGORIES = [
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

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount_paise INTEGER NOT NULL,
    direction TEXT NOT NULL,
    raw_text TEXT,
    source TEXT NOT NULL CHECK (source IN ('sms', 'statement', 'manual', 'paytm', 'PAYTM')),
    ref_no TEXT,
    upi_ref TEXT,
    merchant TEXT,
    category TEXT,
    balance_paise INTEGER,
    dedupe_key TEXT UNIQUE,
    needs_merchant INTEGER NOT NULL DEFAULT 0,
    matched_paytm_id INTEGER REFERENCES transactions(id)
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payee_pattern TEXT NOT NULL,
    pattern TEXT,
    amount_min INTEGER,
    amount_max INTEGER,
    direction TEXT,
    category TEXT NOT NULL,
    specificity INTEGER NOT NULL DEFAULT 0,
    hits INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE TABLE IF NOT EXISTS rule_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_id INTEGER NOT NULL REFERENCES rules(id),
    transaction_id INTEGER NOT NULL REFERENCES transactions(id),
    old_category TEXT NOT NULL,
    new_category TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE TABLE IF NOT EXISTS profile (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    target_paise INTEGER NOT NULL,
    target_date TEXT
);
"""


def get_db_path() -> Path:
    env_path = os.getenv("PULSELEDGER_DB_PATH")
    if env_path:
        return Path(env_path)
    return DEFAULT_DB_PATH


def get_connection(db_path: Optional[Union[str, Path]] = None) -> sqlite3.Connection:
    target_path = db_path if db_path is not None else get_db_path()
    
    if isinstance(target_path, Path) and target_path != Path(":memory:"):
        target_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(target_path))
    else:
        conn = sqlite3.connect(str(target_path))

    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db(db_path: Optional[Union[str, Path, sqlite3.Connection]] = None) -> sqlite3.Connection:
    if isinstance(db_path, sqlite3.Connection):
        conn = db_path
    else:
        conn = get_connection(db_path)

    with conn:
        # Check if transactions table exists with old CHECK constraint
        cursor = conn.cursor()
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='transactions'")
        tbl_info = cursor.fetchone()
        if tbl_info and "source in ('sms', 'statement', 'manual')" in tbl_info[0].lower():
            cursor.execute("ALTER TABLE transactions RENAME TO transactions_old;")
            conn.executescript(SCHEMA_SQL)
            cursor.execute("PRAGMA table_info(transactions_old);")
            old_cols = [r[1] for r in cursor.fetchall()]
            cursor.execute("PRAGMA table_info(transactions);")
            new_cols = [r[1] for r in cursor.fetchall()]
            common_cols = [c for c in old_cols if c in new_cols]
            cols_str = ", ".join(common_cols)
            cursor.execute(f"INSERT INTO transactions ({cols_str}) SELECT {cols_str} FROM transactions_old;")
            cursor.execute("DROP TABLE transactions_old;")
        else:
            conn.executescript(SCHEMA_SQL)

        cursor.execute("PRAGMA table_info(transactions);")
        cols = {row[1] for row in cursor.fetchall()}
        if cols:
            if "ref_no" not in cols:
                conn.execute("ALTER TABLE transactions ADD COLUMN ref_no TEXT;")
            if "dedupe_key" not in cols:
                conn.execute("ALTER TABLE transactions ADD COLUMN dedupe_key TEXT;")
                conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_dedupe_key ON transactions(dedupe_key) WHERE dedupe_key IS NOT NULL;")
            if "needs_merchant" not in cols:
                conn.execute("ALTER TABLE transactions ADD COLUMN needs_merchant INTEGER NOT NULL DEFAULT 0;")
            if "matched_paytm_id" not in cols:
                conn.execute("ALTER TABLE transactions ADD COLUMN matched_paytm_id INTEGER REFERENCES transactions(id);")

        cursor.execute("PRAGMA table_info(rules);")
        rule_cols = {row[1] for row in cursor.fetchall()}
        if rule_cols:
            if "payee_pattern" not in rule_cols:
                conn.execute("ALTER TABLE rules ADD COLUMN payee_pattern TEXT;")
                conn.execute("UPDATE rules SET payee_pattern = pattern WHERE payee_pattern IS NULL;")
            if "pattern" not in rule_cols:
                conn.execute("ALTER TABLE rules ADD COLUMN pattern TEXT;")
                conn.execute("UPDATE rules SET pattern = payee_pattern WHERE pattern IS NULL;")
            if "amount_min" not in rule_cols:
                conn.execute("ALTER TABLE rules ADD COLUMN amount_min INTEGER;")
            if "amount_max" not in rule_cols:
                conn.execute("ALTER TABLE rules ADD COLUMN amount_max INTEGER;")
            if "direction" not in rule_cols:
                conn.execute("ALTER TABLE rules ADD COLUMN direction TEXT;")
            if "specificity" not in rule_cols:
                conn.execute("ALTER TABLE rules ADD COLUMN specificity INTEGER NOT NULL DEFAULT 0;")
            if "hits" not in rule_cols:
                conn.execute("ALTER TABLE rules ADD COLUMN hits INTEGER NOT NULL DEFAULT 0;")
            if "active" not in rule_cols:
                conn.execute("ALTER TABLE rules ADD COLUMN active INTEGER NOT NULL DEFAULT 1;")

        # Seed categories if not already present
        for cat in SEED_CATEGORIES:
            conn.execute("INSERT OR IGNORE INTO categories (name) VALUES (?)", (cat,))

        # Seed placeholder profile if not present
        cursor.execute("SELECT COUNT(*) FROM profile WHERE key = 'buffer_paise'")
        if cursor.fetchone()[0] == 0:
            placeholder_goals = [
                {
                    "title": "PLACEHOLDER Laptop fund",
                    "name": "PLACEHOLDER Laptop fund",
                    "target_paise": 6000000,
                    "saved_paise": 0,
                    "target_date": "2027-06-30",
                    "monthly_alloc_paise": 300000,
                }
            ]
            conn.execute("INSERT OR REPLACE INTO profile (key, value) VALUES ('buffer_paise', '20000')")
            conn.execute("INSERT OR REPLACE INTO profile (key, value) VALUES ('goals', ?)", (json.dumps(placeholder_goals),))
            conn.execute("INSERT OR REPLACE INTO profile (key, value) VALUES ('income_streams', '[]')")
            conn.execute("INSERT OR REPLACE INTO profile (key, value) VALUES ('fixed_costs', '[]')")
            conn.execute("INSERT OR REPLACE INTO profile (key, value) VALUES ('many_small_inflows', 'false')")

    return conn
