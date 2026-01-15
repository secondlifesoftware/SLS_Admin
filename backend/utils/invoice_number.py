"""
Invoice number generation utility
Format: [CLIENT_CODE]-INV-[SEQUENTIAL]
Example: PRO-INV-001, PRO-INV-002 (for Propharma)
"""
import re
from sqlalchemy.orm import Session
from models import Invoice, Client


def generate_client_code(client_name: str, company: str = None) -> str:
    """
    Generate a 3-4 character client code from client name or company name.
    Priority: company name > client last name > client first name
    """
    source = company or client_name or "CLIENT"
    
    # Remove common words
    source = re.sub(r'\b(inc|llc|corp|company|co|ltd|limited)\b', '', source, flags=re.IGNORECASE)
    
    # Extract first letters of words, up to 4 characters
    words = source.split()
    if words:
        code = ''.join([word[0].upper() for word in words[:4]])
        # Ensure at least 3 characters
        if len(code) < 3:
            code = source[:3].upper().replace(' ', '')
        return code[:4]
    
    return source[:3].upper().replace(' ', '')


def get_next_invoice_number(client_id: int, db: Session) -> str:
    """
    Generate the next invoice number for a client.
    Format: [CLIENT_CODE]-INV-[SEQUENTIAL]
    """
    # Get client info
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise ValueError(f"Client with ID {client_id} not found")
    
    # Generate client code
    client_code = generate_client_code(
        f"{client.first_name} {client.last_name}",
        client.company
    )
    
    # Get all existing invoices for this client
    existing_invoices = db.query(Invoice).filter(
        Invoice.client_id == client_id
    ).all()
    
    # Find the highest sequential number
    max_seq = 0
    pattern = re.compile(rf"^{re.escape(client_code)}-INV-(\d+)$")
    
    for invoice in existing_invoices:
        match = pattern.match(invoice.invoice_number)
        if match:
            seq = int(match.group(1))
            max_seq = max(max_seq, seq)
    
    # Generate next number
    next_seq = max_seq + 1
    invoice_number = f"{client_code}-INV-{next_seq:03d}"
    
    # Ensure uniqueness (in case of race conditions)
    existing = db.query(Invoice).filter(Invoice.invoice_number == invoice_number).first()
    if existing:
        # If somehow exists, increment
        next_seq += 1
        invoice_number = f"{client_code}-INV-{next_seq:03d}"
    
    return invoice_number

