"""
Migration script to make time entry fields nullable.

This allows manual time entry without requiring start/end times.
Run this after updating the models.

Usage:
    python migrate_time_entry_fields.py
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Get database URL
database_url = os.getenv("DATABASE_URL")
if not database_url:
    print("❌ Error: DATABASE_URL environment variable not set!")
    sys.exit(1)

# Only run for PostgreSQL (SQLite doesn't need this migration)
if not database_url.startswith("postgresql"):
    print("ℹ️  SQLite database detected. No migration needed (SQLite allows NULL by default).")
    sys.exit(0)

print(f"🔗 Connecting to PostgreSQL...")
engine = create_engine(database_url)

print("\n" + "="*70)
print("  Time Entry Fields Migration")
print("="*70)

with engine.connect() as conn:
    try:
        # Make start_time nullable
        print("   Making start_time nullable...", end=" ")
        conn.execute(text("ALTER TABLE invoice_items ALTER COLUMN start_time DROP NOT NULL"))
        conn.commit()
        print("✅")
        
        # Make end_time nullable
        print("   Making end_time nullable...", end=" ")
        conn.execute(text("ALTER TABLE invoice_items ALTER COLUMN end_time DROP NOT NULL"))
        conn.commit()
        print("✅")
        
        # Make hours nullable
        print("   Making hours nullable...", end=" ")
        conn.execute(text("ALTER TABLE invoice_items ALTER COLUMN hours DROP NOT NULL"))
        conn.commit()
        print("✅")
        
        print("\n" + "="*70)
        print("✅ Migration complete!")
        print("="*70)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
        sys.exit(1)
