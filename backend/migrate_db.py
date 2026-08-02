"""
migrate_db.py
-------------
One-time migration script to add the 'notes' column to
the existing cases table in crime_dss.db.

Safe to run multiple times — checks before altering.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "crime_dss.db")


def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check existing columns in the cases table
    cursor.execute("PRAGMA table_info(cases)")
    columns = [row[1] for row in cursor.fetchall()]

    if "notes" in columns:
        print("Column 'notes' already exists — no migration needed.")
    else:
        cursor.execute("ALTER TABLE cases ADD COLUMN notes TEXT DEFAULT ''")
        conn.commit()
        print("Migration complete: 'notes' column added to cases table.")

    # Verify
    cursor.execute("PRAGMA table_info(cases)")
    final_columns = [row[1] for row in cursor.fetchall()]
    print(f"Current cases columns: {final_columns}")

    conn.close()


if __name__ == "__main__":
    migrate()
