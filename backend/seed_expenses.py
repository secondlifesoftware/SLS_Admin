"""
Script to add mock expense data to existing invoices
"""
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Invoice, InvoiceExpense

# Initialize database
Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Sample expense categories
EXPENSE_CATEGORIES = [
    "Subscription",
    "Software License",
    "Cloud Service",
    "API Service",
    "Domain",
    "Hosting",
    "Third-party Tool",
    "Service Fee",
    "Reimbursement"
]

# Sample expense descriptions
EXPENSE_DESCRIPTIONS = [
    "Monthly subscription for client project management tool",
    "Annual software license renewal",
    "Cloud hosting service for development environment",
    "API service subscription",
    "Domain registration and renewal",
    "Third-party integration service",
    "Development tool subscription",
    "Client-specific software license",
    "Service provider fee",
    "Reimbursement for client expenses"
]

# Sample expense amounts (realistic subscription/service costs)
EXPENSE_AMOUNTS = [
    9.99, 12.99, 15.99, 18.65, 19.99, 24.99, 29.99, 34.99, 39.99, 49.99,
    59.99, 79.99, 99.99, 149.99, 199.99, 249.99, 299.99, 399.99, 499.99
]


def add_expenses_to_invoice(invoice: Invoice, db: Session):
    """Add 0-3 expenses to an invoice"""
    num_expenses = random.randint(0, 3)  # 0-3 expenses per invoice
    
    if num_expenses == 0:
        return  # Skip this invoice
    
    print(f"  Adding {num_expenses} expense(s) to invoice {invoice.invoice_number}...")
    
    # Expense dates should be within the invoice period (before issue date)
    expense_date_range = 30  # Expenses from last 30 days before invoice
    
    total_expense_amount = 0.0
    
    for i in range(num_expenses):
        # Expense date (before invoice issue date)
        days_before = random.randint(1, expense_date_range)
        expense_date = invoice.issue_date - timedelta(days=days_before) if invoice.issue_date else datetime.now() - timedelta(days=days_before)
        
        # Generate expense
        expense = InvoiceExpense(
            invoice_id=invoice.id,
            client_id=invoice.client_id,
            date=expense_date,
            description=random.choice(EXPENSE_DESCRIPTIONS),
            category=random.choice(EXPENSE_CATEGORIES),
            amount=random.choice(EXPENSE_AMOUNTS)
        )
        
        db.add(expense)
        total_expense_amount += expense.amount
        
        print(f"    - {expense.category}: ${expense.amount:.2f} ({expense.description[:50]}...)")
    
    # Update invoice totals to include expenses
    # Get current labor subtotal from time entries
    from models import InvoiceItem
    labor_subtotal = sum(item.amount for item in invoice.items) if invoice.items else 0.0
    
    # Update invoice amounts
    invoice.amount = round(labor_subtotal + total_expense_amount, 2)
    invoice.total = round(invoice.amount + invoice.tax, 2)
    
    print(f"    Updated invoice total: ${invoice.total:.2f} (Labor: ${labor_subtotal:.2f}, Expenses: ${total_expense_amount:.2f})")


def main():
    """Main function to seed expenses"""
    try:
        # Get all invoices
        invoices = db.query(Invoice).all()
        
        if not invoices:
            print("No invoices found. Please seed invoices first.")
            return
        
        print(f"Found {len(invoices)} invoices. Adding expenses...")
        print("-" * 60)
        
        invoices_with_expenses = 0
        total_expenses = 0
        
        for invoice in invoices:
            try:
                # Check if invoice already has expenses
                existing_expenses = db.query(InvoiceExpense).filter(
                    InvoiceExpense.invoice_id == invoice.id
                ).count()
                
                if existing_expenses > 0:
                    print(f"  Invoice {invoice.invoice_number} already has {existing_expenses} expense(s), skipping...")
                    continue
                
                add_expenses_to_invoice(invoice, db)
                invoices_with_expenses += 1
                
                # Count expenses added
                expense_count = db.query(InvoiceExpense).filter(
                    InvoiceExpense.invoice_id == invoice.id
                ).count()
                total_expenses += expense_count
                
            except Exception as e:
                print(f"Error adding expenses to invoice {invoice.invoice_number}: {e}")
                db.rollback()
                continue
        
        db.commit()
        
        print("-" * 60)
        print("Expense seeding complete!")
        
        # Print summary
        total_expenses_in_db = db.query(InvoiceExpense).count()
        print(f"\nSummary:")
        print(f"  Invoices with expenses: {invoices_with_expenses}")
        print(f"  Total expenses added: {total_expenses}")
        print(f"  Total expenses in database: {total_expenses_in_db}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()

