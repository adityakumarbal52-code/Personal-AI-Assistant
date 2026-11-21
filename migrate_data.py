
import sqlite3
from pathlib import Path

from database import get_connection

# Original SQLite database
BASE_DIR = Path(__file__).resolve().parent
SQLITE_DB = BASE_DIR / "data" / "assistant.db"


def migrate_data():

    if not SQLITE_DB.exists():
        print("SQLite database not found!")
        return

    # Connect to original SQLite database
    sqlite_conn = sqlite3.connect(SQLITE_DB)
    sqlite_conn.row_factory = sqlite3.Row

    try:
        with get_connection() as pg_conn:

            # 1. Migrate Tasks
            tasks = sqlite_conn.execute(
                "SELECT id, title, description, status, created_at FROM tasks"
            ).fetchall()

            for task in tasks:
                pg_conn.execute(
                    """
                    INSERT INTO tasks
                    (id, title, description, status, created_at)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                    """,
                    (
                        task["id"],
                        task["title"],
                        task["description"],
                        task["status"],
                        task["created_at"]
                    )
                )

            # 2. Migrate Notes
            notes = sqlite_conn.execute(
                "SELECT id, title, content, created_at FROM notes"
            ).fetchall()

            for note in notes:
                pg_conn.execute(
                    """
                    INSERT INTO notes
                    (id, title, content, created_at)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                    """,
                    (
                        note["id"],
                        note["title"],
                        note["content"],
                        note["created_at"]
                    )
                )

            # 3. Migrate Reminders
            reminders = sqlite_conn.execute(
                """
                SELECT id, title, description, reminder_time,
                       status, created_at
                FROM reminders
                """
            ).fetchall()

            for reminder in reminders:
                pg_conn.execute(
                    """
                    INSERT INTO reminders
                    (id, title, description, reminder_time, status, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                    """,
                    (
                        reminder["id"],
                        reminder["title"],
                        reminder["description"],
                        reminder["reminder_time"],
                        reminder["status"],
                        reminder["created_at"]
                    )
                )

            # Reset PostgreSQL ID sequences
            for table in ("tasks", "notes", "reminders"):
                pg_conn.execute(
                    f"""
                    SELECT setval(
                        pg_get_serial_sequence('{table}', 'id'),
                        COALESCE((SELECT MAX(id) FROM {table}), 1),
                        EXISTS(SELECT 1 FROM {table})
                    )
                    """
                )

            print("Migration completed successfully!")
            print("SQLite tasks:", len(tasks))
            print("SQLite notes:", len(notes))
            print("SQLite reminders:", len(reminders))

    finally:
        sqlite_conn.close()


if __name__ == "__main__":
    migrate_data()
