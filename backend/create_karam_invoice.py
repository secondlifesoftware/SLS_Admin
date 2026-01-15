"""
Script to create an invoice for Karam with initial deposit
"""
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Client, InvoiceItem, InvoiceExpense, Invoice
from datetime import datetime
import sys

def get_next_invoice_number(client_id, db):
    """Generate next invoice number for a client"""
    # Get the last invoice for this client
    last_invoice = db.query(Invoice).filter(
        Invoice.client_id == client_id
    ).order_by(Invoice.id.desc()).first()
    
    if last_invoice:
        # Extract number from invoice_number (format: CLIENT-XXX)
        try:
            parts = last_invoice.invoice_number.split('-')
            if len(parts) == 2:
                last_num = int(parts[1])
                return f"{parts[0]}-{last_num + 1:03d}"
        except:
            pass
    
    # Default format: CLIENT-001
    client = db.query(Client).filter(Client.id == client_id).first()
    if client:
        client_initials = f"{client.first_name[0]}{client.last_name[0]}".upper()
        return f"{client_initials}-001"
    
    return f"INV-001"

def create_karam_invoice():
    """Create invoice for Karam with initial deposit"""
    db = SessionLocal()
    
    try:
        # Find Karam client
        client = db.query(Client).filter(
            (Client.first_name.ilike('%karam%')) |
            (Client.last_name.ilike('%karam%')) |
            (Client.email.ilike('%karam%'))
        ).first()
        
        if not client:
            print("❌ Client 'Karam' not found. Please check the client name.")
            return
        
        print(f"✅ Found client: {client.first_name} {client.last_name} (ID: {client.id})")
        
        # Create fixed cost expense (deposit)
        today = datetime.now()
        expense = InvoiceExpense(
            client_id=client.id,
            invoice_id=None,  # Will be set after invoice is created
            date=today,
            description="initial deposit",
            category=None,
            amount=2000.00,
            person="Darius",
            start_time=None,
            end_time=None,
            hours=None
        )
        db.add(expense)
        db.flush()  # Get the expense ID
        
        print(f"✅ Created fixed cost expense: ${expense.amount} - {expense.description}")
        
        # Generate invoice number
        invoice_number = get_next_invoice_number(client.id, db)
        
        # Create invoice
        invoice = Invoice(
            client_id=client.id,
            contract_id=None,
            invoice_number=invoice_number,
            amount=2000.00,  # Subtotal
            tax=0.0,
            total=2000.00,
            status="Draft",
            issue_date=today,
            due_date=None,
            project_name=None,
            notes=None
        )
        db.add(invoice)
        db.flush()  # Get the invoice ID
        
        # Link expense to invoice
        expense.invoice_id = invoice.id
        
        db.commit()
        
        print(f"✅ Created invoice: {invoice.invoice_number}")
        print(f"   Amount: ${invoice.total}")
        print(f"   Status: {invoice.status}")
        print(f"   Date: {invoice.issue_date.strftime('%Y-%m-%d')}")
        print(f"\n✅ Invoice created successfully!")
        print(f"   Invoice ID: {invoice.id}")
        print(f"   You can view it in the admin panel at: /admin/invoices/{invoice.id}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_karam_invoice()

