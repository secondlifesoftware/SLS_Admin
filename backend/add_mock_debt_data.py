"""
Script to add mock debt data for testing the ClearPath debt tracker.
Run this with: python add_mock_debt_data.py
"""
from database import SessionLocal, engine, Base
from models import DebtAccount, BankConnection, DebtPayment
from datetime import datetime, timedelta
import random

def add_mock_debt_data():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if mock data already exists
        existing = db.query(DebtAccount).filter(
            DebtAccount.name.in_([
                "Chase Sapphire Card",
                "Wells Fargo Credit Card",
                "Bank of America Card",
                "Citi Credit Card",
                "American Express Card",
                "Student Loan",
                "Car Loan",
                "Personal Loan"
            ])
        ).first()
        
        if existing:
            print("Mock data already exists. Skipping...")
            return
        
        # Mock debt accounts for Darius
        darius_accounts = [
            {
                "owner": "Darius",
                "name": "Chase Sapphire Card",
                "account_type": "credit_card",
                "institution_name": "Chase",
                "original_balance": 8500.00,
                "current_balance": 7500.00,
                "interest_rate": 24.99,
                "minimum_payment": 187.50,
                "suggested_minimum_payment": 250.00,
                "payment_terms": "Minimum payment is 2.5% of balance or $25, whichever is greater",
                "payment_link": "https://chase.com/pay",
                "monthly_payment": 250.00,
                "due_date": datetime.now() + timedelta(days=15)
            },
            {
                "owner": "Darius",
                "name": "Wells Fargo Credit Card",
                "account_type": "credit_card",
                "institution_name": "Wells Fargo",
                "original_balance": 6200.00,
                "current_balance": 5800.00,
                "interest_rate": 22.99,
                "minimum_payment": 145.00,
                "suggested_minimum_payment": 200.00,
                "payment_terms": "Minimum payment is 2% of balance",
                "payment_link": "https://wellsfargo.com/pay",
                "monthly_payment": 200.00,
                "due_date": datetime.now() + timedelta(days=10)
            },
            {
                "owner": "Darius",
                "name": "Student Loan",
                "account_type": "loan",
                "institution_name": "Federal Student Aid",
                "original_balance": 25000.00,
                "current_balance": 23000.00,
                "interest_rate": 5.50,
                "minimum_payment": 350.00,
                "suggested_minimum_payment": 400.00,
                "payment_terms": "Fixed monthly payment, 10 year term",
                "payment_link": "https://studentaid.gov",
                "monthly_payment": 350.00,
                "due_date": datetime.now() + timedelta(days=5)
            },
            {
                "owner": "Darius",
                "name": "Car Loan",
                "account_type": "loan",
                "institution_name": "Bank of America",
                "original_balance": 18000.00,
                "current_balance": 15000.00,
                "interest_rate": 6.25,
                "minimum_payment": 420.00,
                "suggested_minimum_payment": 450.00,
                "payment_terms": "Fixed monthly payment, 5 year term",
                "payment_link": "https://bankofamerica.com/pay",
                "monthly_payment": 420.00,
                "due_date": datetime.now() + timedelta(days=20)
            }
        ]
        
        # Mock debt accounts for Katia
        katia_accounts = [
            {
                "owner": "Katia",
                "name": "Bank of America Card",
                "account_type": "credit_card",
                "institution_name": "Bank of America",
                "original_balance": 5200.00,
                "current_balance": 4800.00,
                "interest_rate": 23.99,
                "minimum_payment": 120.00,
                "suggested_minimum_payment": 180.00,
                "payment_terms": "Minimum payment is 2.5% of balance",
                "payment_link": "https://bankofamerica.com/pay",
                "monthly_payment": 180.00,
                "due_date": datetime.now() + timedelta(days=12)
            },
            {
                "owner": "Katia",
                "name": "Citi Credit Card",
                "account_type": "credit_card",
                "institution_name": "Citi Bank",
                "original_balance": 3800.00,
                "current_balance": 3500.00,
                "interest_rate": 25.99,
                "minimum_payment": 87.50,
                "suggested_minimum_payment": 150.00,
                "payment_terms": "Minimum payment is 2.5% of balance or $25",
                "payment_link": "https://citi.com/pay",
                "monthly_payment": 150.00,
                "due_date": datetime.now() + timedelta(days=18)
            },
            {
                "owner": "Katia",
                "name": "American Express Card",
                "account_type": "credit_card",
                "institution_name": "American Express",
                "original_balance": 4500.00,
                "current_balance": 4200.00,
                "interest_rate": 24.50,
                "minimum_payment": 105.00,
                "suggested_minimum_payment": 175.00,
                "payment_terms": "Minimum payment varies based on balance",
                "payment_link": "https://americanexpress.com/pay",
                "monthly_payment": 175.00,
                "due_date": datetime.now() + timedelta(days=8)
            },
            {
                "owner": "Katia",
                "name": "Personal Loan",
                "account_type": "loan",
                "institution_name": "Wells Fargo",
                "original_balance": 12000.00,
                "current_balance": 10500.00,
                "interest_rate": 12.99,
                "minimum_payment": 280.00,
                "suggested_minimum_payment": 350.00,
                "payment_terms": "Fixed monthly payment, 4 year term",
                "payment_link": "https://wellsfargo.com/pay",
                "monthly_payment": 280.00,
                "due_date": datetime.now() + timedelta(days=25)
            }
        ]
        
        # Add all accounts
        all_accounts = darius_accounts + katia_accounts
        
        for account_data in all_accounts:
            account = DebtAccount(**account_data)
            db.add(account)
        
        db.commit()
        
        # Calculate totals
        darius_total = sum(acc["current_balance"] for acc in darius_accounts)
        katia_total = sum(acc["current_balance"] for acc in katia_accounts)
        grand_total = darius_total + katia_total
        
        print("✅ Mock debt data added successfully!")
        print(f"\n📊 Summary:")
        print(f"   Darius's Total Debt: ${darius_total:,.2f}")
        print(f"   Katia's Total Debt: ${katia_total:,.2f}")
        print(f"   Grand Total: ${grand_total:,.2f}")
        print(f"\n   Accounts added: {len(all_accounts)}")
        print(f"   - Darius: {len(darius_accounts)} accounts")
        print(f"   - Katia: {len(katia_accounts)} accounts")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error adding mock data: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    add_mock_debt_data()

