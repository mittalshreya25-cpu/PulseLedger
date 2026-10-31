import json
import sqlite3
from typing import Any, Dict, List, Optional

PLACEHOLDER_PROFILE = {
    "income_streams": [],
    "fixed_costs": [],
    "goals": [
        {
            "title": "PLACEHOLDER Laptop fund",
            "name": "PLACEHOLDER Laptop fund",
            "target_paise": 6000000,
            "saved_paise": 0,
            "target_date": "2027-06-30",
            "monthly_alloc_paise": 300000,
        }
    ],
    "buffer_paise": 20000,
    "many_small_inflows": False,
}


def seed_placeholder_profile(conn: sqlite3.Connection) -> None:
    """Seeds default placeholders into profile table if not already present."""
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM profile WHERE key IN ('buffer_paise', 'goals')")
    count = cursor.fetchone()[0]
    if count == 0:
        with conn:
            conn.execute(
                "INSERT OR REPLACE INTO profile (key, value) VALUES ('buffer_paise', ?)",
                (str(PLACEHOLDER_PROFILE["buffer_paise"]),),
            )
            conn.execute(
                "INSERT OR REPLACE INTO profile (key, value) VALUES ('goals', ?)",
                (json.dumps(PLACEHOLDER_PROFILE["goals"]),),
            )
            conn.execute(
                "INSERT OR REPLACE INTO profile (key, value) VALUES ('income_streams', ?)",
                (json.dumps(PLACEHOLDER_PROFILE["income_streams"]),),
            )
            conn.execute(
                "INSERT OR REPLACE INTO profile (key, value) VALUES ('fixed_costs', ?)",
                (json.dumps(PLACEHOLDER_PROFILE["fixed_costs"]),),
            )
            conn.execute(
                "INSERT OR REPLACE INTO profile (key, value) VALUES ('many_small_inflows', ?)",
                ("false",),
            )


def get_profile(conn: sqlite3.Connection) -> Dict[str, Any]:
    """Retrieves full profile from SQLite, ensuring placeholders are seeded if absent."""
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM profile")
    rows = cursor.fetchall()
    kv: Dict[str, str] = {r[0]: r[1] for r in rows}

    if "buffer_paise" not in kv:
        seed_placeholder_profile(conn)
        return dict(PLACEHOLDER_PROFILE)

    try:
        income_streams = json.loads(kv.get("income_streams", "[]"))
    except Exception:
        income_streams = []

    try:
        fixed_costs = json.loads(kv.get("fixed_costs", "[]"))
    except Exception:
        fixed_costs = []

    try:
        goals = json.loads(kv.get("goals", "[]"))
    except Exception:
        goals = []

    try:
        buffer_paise = int(kv.get("buffer_paise", 20000))
    except Exception:
        buffer_paise = 20000

    many_small_inflows = kv.get("many_small_inflows", "false").lower() == "true"

    return {
        "income_streams": income_streams,
        "fixed_costs": fixed_costs,
        "goals": goals,
        "buffer_paise": buffer_paise,
        "many_small_inflows": many_small_inflows,
    }


def save_profile(conn: sqlite3.Connection, data: Dict[str, Any]) -> Dict[str, Any]:
    """Persists profile into SQLite."""
    income_streams = data.get("income_streams", [])
    fixed_costs = data.get("fixed_costs", [])
    goals = data.get("goals", [])
    buffer_paise = int(data.get("buffer_paise", 20000))
    many_small_inflows = bool(data.get("many_small_inflows", False))

    with conn:
        conn.execute(
            "INSERT OR REPLACE INTO profile (key, value) VALUES ('income_streams', ?)",
            (json.dumps(income_streams),),
        )
        conn.execute(
            "INSERT OR REPLACE INTO profile (key, value) VALUES ('fixed_costs', ?)",
            (json.dumps(fixed_costs),),
        )
        conn.execute(
            "INSERT OR REPLACE INTO profile (key, value) VALUES ('goals', ?)",
            (json.dumps(goals),),
        )
        conn.execute(
            "INSERT OR REPLACE INTO profile (key, value) VALUES ('buffer_paise', ?)",
            (str(buffer_paise),),
        )
        conn.execute(
            "INSERT OR REPLACE INTO profile (key, value) VALUES ('many_small_inflows', ?)",
            ("true" if many_small_inflows else "false",),
        )

    return get_profile(conn)


def set_manual_balance(conn: sqlite3.Connection, balance_paise: int) -> int:
    """Sets a manual balance override."""
    if balance_paise < 0:
        raise ValueError("balance_paise must be >= 0")
    with conn:
        conn.execute(
            "INSERT OR REPLACE INTO profile (key, value) VALUES ('manual_balance_paise', ?)",
            (str(balance_paise),),
        )
    return balance_paise


def get_manual_balance(conn: sqlite3.Connection) -> Optional[int]:
    """Gets manual balance override if set, else None."""
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM profile WHERE key = 'manual_balance_paise'")
    row = cursor.fetchone()
    if row and row[0] is not None:
        try:
            return int(row[0])
        except ValueError:
            return None
    return None


def clear_manual_balance(conn: sqlite3.Connection) -> None:
    """Clears the manual balance override."""
    with conn:
        conn.execute("DELETE FROM profile WHERE key = 'manual_balance_paise'")

