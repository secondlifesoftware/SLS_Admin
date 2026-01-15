"""
Script to fix the debt_accounts table by recreating it with the correct schema.
This will drop and recreate the table, so existing data will be lost.
"""
from database import engine, Base, SessionLocal
from models import DebtAccount, DebtPayment, BankConnection
from sqlalchemy import text

def fix_debt_tables():
    db = SessionLocal()
    
    try:
        print("Dropping existing debt tables...")
        # Drop tables in correct order (due to foreign keys)
        db.execute(text("DROP TABLE IF EXISTS debt_payments"))
        db.execute(text("DROP TABLE IF EXISTS debt_accounts"))
        db.execute(text("DROP TABLE IF EXISTS bank_connections"))
        db.commit()
        
        print("Creating tables with correct schema...")
        # Recreate tables
        Base.metadata.create_all(bind=engine, tables=[
            BankConnection.__table__,
            DebtAccount.__table__,
            DebtPayment.__table__
        ])
        
        print("✅ Tables recreated successfully!")
        print("Now run: python3 add_mock_debt_data.py")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    fix_debt_tables()

