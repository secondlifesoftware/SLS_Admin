from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Invoice, InvoiceItem, Client
from schemas import Invoice as InvoiceSchema, InvoiceCreate, InvoiceUpdate

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


@router.get("/", response_model=List[InvoiceSchema])
def get_invoices(skip: int = 0, limit: int = 100, client_id: int = None, status: str = None, db: Session = Depends(get_db)):
    """Get all invoices with optional filtering"""
    query = db.query(Invoice)
    
    if client_id:
        query = query.filter(Invoice.client_id == client_id)
    if status:
        query = query.filter(Invoice.status == status)
    
    invoices = query.offset(skip).limit(limit).all()
    return invoices


@router.get("/{invoice_id}", response_model=InvoiceSchema)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Get a specific invoice by ID"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.post("/", response_model=InvoiceSchema)
def create_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db)):
    """Create a new invoice"""
    # Verify client exists
    client = db.query(Client).filter(Client.id == invoice.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Calculate total from items
    items_data = invoice.items or []
    subtotal = sum(item.unit_price * item.quantity for item in items_data)
    total = subtotal + invoice.tax
    
    # Create invoice
    invoice_data = invoice.dict(exclude={"items"})
    invoice_data["total"] = total
    db_invoice = Invoice(**invoice_data)
    db.add(db_invoice)
    db.flush()  # Get the invoice ID
    
    # Create invoice items
    for item_data in items_data:
        item_total = item_data.unit_price * item_data.quantity
        db_item = InvoiceItem(
            invoice_id=db_invoice.id,
            description=item_data.description,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            total=item_total
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice


@router.put("/{invoice_id}", response_model=InvoiceSchema)
def update_invoice(invoice_id: int, invoice_update: InvoiceUpdate, db: Session = Depends(get_db)):
    """Update an invoice"""
    db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    update_data = invoice_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_invoice, field, value)
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice


@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Delete an invoice"""
    db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    db.delete(db_invoice)
    db.commit()
    return {"message": "Invoice deleted successfully"}

