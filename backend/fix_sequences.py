"""
Fix PostgreSQL sequences after data migration.

When migrating from SQLite to PostgreSQL, the auto-increment sequences
don't automatically update to reflect existing data. This script fixes
all sequences to start from the maximum existing ID + 1.

Usage:
    python fix_sequences.py
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Get PostgreSQL URL from environment
postgres_url = os.getenv("DATABASE_URL")
if not postgres_url or not postgres_url.startswith("postgresql"):
    print("❌ Error: DATABASE_URL not set or not a PostgreSQL URL!")
    print("This script only works with PostgreSQL databases.")
    sys.exit(1)

print(f"🔗 Connecting to PostgreSQL...")
engine = create_engine(postgres_url)

# Tables and their sequence names
# Format: (table_name, sequence_name)
tables = [
    ("clients", "clients_id_seq"),
    ("invoices", "invoices_id_seq"),
    ("invoice_items", "invoice_items_id_seq"),
    ("invoice_expenses", "invoice_expenses_id_seq"),
    ("scope_of_work", "scope_of_work_id_seq"),
    ("scope_sections", "scope_sections_id_seq"),
    ("client_contacts", "client_contacts_id_seq"),
    ("client_notes", "client_notes_id_seq"),
    ("calendar_events", "calendar_events_id_seq"),
    ("client_timeline", "client_timeline_id_seq"),
    ("contracts", "contracts_id_seq"),
    ("contract_milestones", "contract_milestones_id_seq"),
    ("client_documents", "client_documents_id_seq"),
    ("client_admin_accounts", "client_admin_accounts_id_seq"),
    ("client_tech_stack", "client_tech_stack_id_seq"),
    ("user_profiles", "user_profiles_id_seq"),
    ("bank_connections", "bank_connections_id_seq"),
    ("debt_accounts", "debt_accounts_id_seq"),
    ("debt_payments", "debt_payments_id_seq"),
]

print("\n" + "="*70)
print("  PostgreSQL Sequence Fixer")
print("="*70)

with engine.connect() as conn:
    for table_name, sequence_name in tables:
        try:
            # Get the maximum ID from the table
            result = conn.execute(text(f"SELECT COALESCE(MAX(id), 0) FROM {table_name}"))
            max_id = result.scalar()
            
            if max_id > 0:
                # Set the sequence to max_id + 1
                next_val = max_id + 1
                conn.execute(text(f"SELECT setval('{sequence_name}', {next_val}, false)"))
                conn.commit()
                print(f"✅ {table_name:30} → Sequence set to {next_val} (max ID: {max_id})")
            else:
                # Table is empty, reset to 1
                conn.execute(text(f"SELECT setval('{sequence_name}', 1, false)"))
                conn.commit()
                print(f"⚪ {table_name:30} → Sequence reset to 1 (table empty)")
                
        except Exception as e:
            # Sequence might not exist or table might not exist
            if "does not exist" in str(e).lower():
                print(f"⚠️  {table_name:30} → Skipped (sequence or table doesn't exist)")
            else:
                print(f"❌ {table_name:30} → Error: {e}")

print("\n" + "="*70)
print("✅ Sequence fix complete!")
print("\n📝 Next steps:")
print("   1. Try creating an expense again")
print("   2. All new records should now get unique IDs")
print("="*70)
