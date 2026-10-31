import json
import logging
import sys
from pathlib import Path
from typing import Optional, Union

# Ensure repository root is on sys.path when executed directly
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.app.database import BASE_DIR, get_connection, init_db

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

FIXTURES_DIR = BASE_DIR / "data" / "fixtures"


def seed_data(
    db_path: Optional[Union[str, Path]] = None,
    fixtures_dir: Path = FIXTURES_DIR,
) -> None:
    profile_fixture = fixtures_dir / "profile.json"
    goals_fixture = fixtures_dir / "goals.json"
    categories_fixture = fixtures_dir / "categories.json"

    if not profile_fixture.exists():
        raise FileNotFoundError(f"Profile fixture not found at {profile_fixture}")
    if not goals_fixture.exists():
        raise FileNotFoundError(f"Goals fixture not found at {goals_fixture}")

    conn = init_db(db_path)

    with conn:
        # Load categories
        if categories_fixture.exists():
            with open(categories_fixture, "r", encoding="utf-8") as f:
                categories_data: list[str] = json.load(f)
            for cat in categories_data:
                conn.execute(
                    "INSERT OR IGNORE INTO categories (name) VALUES (?)",
                    (cat,),
                )
            logger.info("Seeded %d categories", len(categories_data))

        # Load profile
        with open(profile_fixture, "r", encoding="utf-8") as f:
            profile_data: dict[str, str] = json.load(f)

        for key, value in profile_data.items():
            conn.execute(
                "INSERT OR REPLACE INTO profile (key, value) VALUES (?, ?)",
                (key, str(value)),
            )
        logger.info("Seeded %d profile entries", len(profile_data))

        # Load goals
        with open(goals_fixture, "r", encoding="utf-8") as f:
            goals_data: list[dict] = json.load(f)

        # Clear existing seeded goals to avoid duplicate rows on repeated seed runs
        conn.execute("DELETE FROM goals")
        for goal in goals_data:
            conn.execute(
                "INSERT INTO goals (name, target_paise, target_date) VALUES (?, ?, ?)",
                (goal["name"], int(goal["target_paise"]), goal.get("target_date")),
            )
        logger.info("Seeded %d goal entries", len(goals_data))

    conn.close()
    logger.info("Database seeding completed successfully.")


if __name__ == "__main__":
    seed_data()
