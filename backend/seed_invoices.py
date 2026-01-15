"""
Script to generate mock invoice data
Creates 1-6 invoices per client with associated time entries
"""
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Client, Invoice, InvoiceItem
from utils.invoice_number import get_next_invoice_number

# Initialize database
Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Sample project names
PROJECT_NAMES = [
    "AI Web Application Development",
    "Machine Learning Model Training",
    "Data Analytics Platform",
    "Cloud Infrastructure Setup",
    "Mobile App Development",
    "API Integration Services",
    "Database Optimization",
    "Security Audit & Implementation",
    "UI/UX Design & Development",
    "DevOps Pipeline Setup"
]

# Sample descriptions for time entries
DESCRIPTIONS = [
    "Frontend development and UI implementation",
    "Backend API development and testing",
    "Database schema design and optimization",
    "Machine learning model training and validation",
    "Code review and refactoring",
    "Bug fixes and debugging",
    "Integration testing and QA",
    "Documentation and code comments",
    "Performance optimization",
    "Security implementation and testing",
    "Deployment and configuration",
    "Client meeting and requirements discussion",
    "Architecture design and planning",
    "Third-party API integration",
    "Data migration and ETL processes"
]

# People who can work on projects
PEOPLE = ["Darius Smith", "Katia Smith", "John Doe", "Jane Smith"]

# Hourly rates
RATES = [125.0, 150.0, 175.0, 200.0, 225.0]


def generate_time_entry(client_id: int, invoice_id: int, date: datetime, db: Session):
    """Generate a single time entry"""
    start_hour = random.randint(9, 16)  # Between 9 AM and 4 PM
    start_minute = random.choice([0, 15, 30, 45])
    duration_hours = random.uniform(2.0, 8.0)  # 2-8 hours
    
    start_time = f"{start_hour:02d}:{start_minute:02d}"
    
    # Calculate end time
    end_hour = start_hour + int(duration_hours)
    end_minute = start_minute + int((duration_hours % 1) * 60)
    if end_minute >= 60:
        end_minute -= 60
        end_hour += 1
    
    end_time = f"{end_hour:02d}:{end_minute:02d}"
    
    # Round duration to 2 decimal places
    hours = round(duration_hours, 2)
    rate = random.choice(RATES)
    amount = round(hours * rate, 2)
    
    entry = InvoiceItem(
        client_id=client_id,
        invoice_id=invoice_id,
        date=date,
        start_time=start_time,
        end_time=end_time,
        person=random.choice(PEOPLE),
        description=random.choice(DESCRIPTIONS),
        hours=hours,
        rate=rate,
        amount=amount
    )
    
    db.add(entry)
    return entry


def generate_invoice_for_client(client: Client, db: Session):
    """Generate 1-6 invoices for a client"""
    num_invoices = random.randint(1, 6)
    
    print(f"Generating {num_invoices} invoice(s) for {client.first_name} {client.last_name}...")
    
    for i in range(num_invoices):
        # Generate invoice date (within last 6 months)
        days_ago = random.randint(0, 180)
        issue_date = datetime.now() - timedelta(days=days_ago)
        
        # Due date is 30 days after issue date
        due_date = issue_date + timedelta(days=30)
        
        # Generate invoice number
        invoice_number = get_next_invoice_number(client.id, db)
        
        # Generate project name
        project_name = random.choice(PROJECT_NAMES)
        
        # Generate number of time entries (3-15 per invoice)
        num_entries = random.randint(3, 15)
        
        # Generate time entries over a period (invoice covers 1-4 weeks)
        period_days = random.randint(7, 28)
        start_date = issue_date - timedelta(days=period_days)
        
        # Create invoice first (without items)
        invoice = Invoice(
            client_id=client.id,
            invoice_number=invoice_number,
            amount=0.0,  # Will calculate
            tax=random.choice([0.0, 0.0, 0.0, 50.0, 100.0, 150.0]),  # Sometimes no tax
            total=0.0,  # Will calculate
            status=random.choice(["Draft", "Sent", "Paid", "Overdue"]),
            issue_date=issue_date,
            due_date=due_date,
            project_name=project_name
        )
        
        db.add(invoice)
        db.flush()  # Get invoice ID
        
        # Generate time entries
        total_amount = 0.0
        for j in range(num_entries):
            # Random date within the period
            entry_days_offset = random.randint(0, period_days)
            entry_date = start_date + timedelta(days=entry_days_offset)
            
            entry = generate_time_entry(client.id, invoice.id, entry_date, db)
            total_amount += entry.amount
        
        # Update invoice with calculated totals
        invoice.amount = round(total_amount, 2)
        invoice.total = round(invoice.amount + invoice.tax, 2)
        
        # Set paid_date if status is Paid
        if invoice.status == "Paid":
            paid_days_after_issue = random.randint(1, 30)
            invoice.paid_date = issue_date + timedelta(days=paid_days_after_issue)
        
        print(f"  Created invoice {invoice_number} with {num_entries} time entries (${invoice.total:.2f})")
    
    db.commit()


def main():
    """Main function to seed invoices"""
    try:
        # Get all clients
        clients = db.query(Client).all()
        
        if not clients:
            print("No clients found. Please seed clients first.")
            return
        
        print(f"Found {len(clients)} clients. Generating invoices...")
        print("-" * 60)
        
        for client in clients:
            try:
                generate_invoice_for_client(client, db)
            except Exception as e:
                print(f"Error generating invoices for {client.first_name} {client.last_name}: {e}")
                db.rollback()
                continue
        
        print("-" * 60)
        print("Invoice generation complete!")
        
        # Print summary
        total_invoices = db.query(Invoice).count()
        total_entries = db.query(InvoiceItem).count()
        print(f"\nSummary:")
        print(f"  Total invoices: {total_invoices}")
        print(f"  Total time entries: {total_entries}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()

