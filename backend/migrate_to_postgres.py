"""
Migration script to move data from SQLite to PostgreSQL.

Usage:
    python migrate_to_postgres.py

Make sure to set the POSTGRES_URL environment variable before running:
    export POSTGRES_URL="postgresql://user:password@host:port/database"
"""

import os
import sys
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from database import Base
from models import (
    Client, Invoice, InvoiceItem, InvoiceExpense, ScopeOfWork, ScopeSection,
    ClientContact, ClientNote, CalendarEvent, ClientTimeline, Contract,
    ContractMilestone, ClientDocument, ClientAdminAccount, ClientTechStack,
    UserProfile, BankConnection, DebtAccount, DebtPayment
)


def migrate_data():
    """Migrate all data from SQLite to PostgreSQL"""
    
    # Get PostgreSQL URL from environment
    postgres_url = os.getenv("POSTGRES_URL")
    if not postgres_url:
        print("❌ Error: POSTGRES_URL environment variable not set!")
        print("Example: export POSTGRES_URL='postgresql://user:password@host:port/database'")
        sys.exit(1)
    
    # SQLite source database
    sqlite_url = os.getenv("SQLITE_URL", "sqlite:///./sls_admin.db")
    
    print(f"📊 Source (SQLite): {sqlite_url}")
    print(f"🎯 Target (PostgreSQL): {postgres_url.split('@')[0].split('//')[1].split(':')[0]}@{postgres_url.split('@')[1] if '@' in postgres_url else 'localhost'}")
    print("\n" + "="*70)
    
    # Create engines
    print("\n1️⃣  Connecting to databases...")
    sqlite_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
    postgres_engine = create_engine(postgres_url)
    
    # Create sessions
    SqliteSession = sessionmaker(bind=sqlite_engine)
    PostgresSession = sessionmaker(bind=postgres_engine)
    
    sqlite_session = SqliteSession()
    postgres_session = PostgresSession()
    
    try:
        # Check if SQLite database has data
        inspector = inspect(sqlite_engine)
        if not inspector.get_table_names():
            print("⚠️  SQLite database is empty or doesn't exist. Nothing to migrate.")
            return
        
        # Create all tables in PostgreSQL
        print("2️⃣  Creating PostgreSQL tables...")
        Base.metadata.create_all(bind=postgres_engine)
        print("✅ Tables created successfully!")
        
        # Define the order of tables to migrate (respecting foreign key constraints)
        migration_order = [
            (UserProfile, "User Profiles"),
            (Client, "Clients"),
            (ClientContact, "Client Contacts"),
            (ClientNote, "Client Notes"),
            (CalendarEvent, "Calendar Events"),
            (ClientTimeline, "Client Timeline"),
            (Contract, "Contracts"),
            (ContractMilestone, "Contract Milestones"),
            (Invoice, "Invoices"),
            (InvoiceItem, "Invoice Items"),
            (InvoiceExpense, "Invoice Expenses"),
            (ScopeOfWork, "Scopes of Work"),
            (ScopeSection, "Scope Sections"),
            (ClientDocument, "Client Documents"),
            (ClientAdminAccount, "Client Admin Accounts"),
            (ClientTechStack, "Client Tech Stack"),
            (BankConnection, "Bank Connections"),
            (DebtAccount, "Debt Accounts"),
            (DebtPayment, "Debt Payments"),
        ]
        
        print("\n3️⃣  Migrating data...")
        print("="*70)
        
        total_records = 0
        
        for model, name in migration_order:
            # Get all records from SQLite
            try:
                records = sqlite_session.query(model).all()
                count = len(records)
                
                if count > 0:
                    print(f"   Migrating {count:>4} {name}...", end=" ")
                    
                    # Bulk insert into PostgreSQL
                    for record in records:
                        # Get the record as a dict
                        record_dict = {c.name: getattr(record, c.name) for c in record.__table__.columns}
                        
                        # Create new instance for PostgreSQL
                        new_record = model(**record_dict)
                        postgres_session.add(new_record)
                    
                    postgres_session.commit()
                    total_records += count
                    print("✅")
                else:
                    print(f"   Skipping {name} (no data)")
                    
            except Exception as e:
                print(f"❌ Error migrating {name}: {e}")
                postgres_session.rollback()
                continue
        
        print("="*70)
        print(f"\n✅ Migration completed successfully!")
        print(f"📊 Total records migrated: {total_records}")
        
        # Verify migration
        print("\n4️⃣  Verifying migration...")
        for model, name in migration_order:
            sqlite_count = sqlite_session.query(model).count()
            postgres_count = postgres_session.query(model).count()
            
            if sqlite_count > 0:
                status = "✅" if sqlite_count == postgres_count else "⚠️"
                print(f"   {status} {name}: SQLite={sqlite_count}, PostgreSQL={postgres_count}")
        
        print("\n" + "="*70)
        print("🎉 Migration complete! Your data is now in PostgreSQL.")
        print("\n📝 Next steps:")
        print("   1. Update DATABASE_URL in Render to point to PostgreSQL")
        print("   2. Redeploy your backend on Render")
        print("   3. Test your application thoroughly")
        print("   4. Once verified, you can remove the SQLite database file")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        postgres_session.rollback()
        raise
    
    finally:
        sqlite_session.close()
        postgres_session.close()


if __name__ == "__main__":
    print("\n" + "="*70)
    print("  SQLite → PostgreSQL Migration Tool")
    print("="*70)
    
    migrate_data()
