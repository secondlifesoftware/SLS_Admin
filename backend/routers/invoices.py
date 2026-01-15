from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import csv
from io import StringIO
from database import get_db
from models import Invoice, InvoiceItem, InvoiceExpense, Client, Contract
from schemas import Invoice as InvoiceSchema, InvoiceCreate, InvoiceUpdate, InvoiceGenerateRequest
from utils.invoice_number import get_next_invoice_number
from utils.pdf_generator import generate_invoice_pdf

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


@router.get("/", response_model=List[InvoiceSchema])
def get_invoices(skip: int = 0, limit: int = 100, client_id: int = None, status: str = None, archived: bool = None, db: Session = Depends(get_db)):
    """Get all invoices with optional filtering"""
    query = db.query(Invoice)
    
    if client_id:
        query = query.filter(Invoice.client_id == client_id)
    if status:
        query = query.filter(Invoice.status == status)
    if archived is not None:
        if archived:
            query = query.filter(Invoice.status == 'Archived')
        else:
            query = query.filter(Invoice.status != 'Archived')
    
    invoices = query.order_by(Invoice.issue_date.desc()).offset(skip).limit(limit).all()
    return invoices


@router.get("/{invoice_id}", response_model=InvoiceSchema)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Get a specific invoice by ID with all related items and expenses"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Load related items and expenses
    from models import InvoiceItem, InvoiceExpense
    invoice.items = db.query(InvoiceItem).filter(
        InvoiceItem.invoice_id == invoice_id
    ).order_by(InvoiceItem.date.asc(), InvoiceItem.start_time.asc()).all()
    
    invoice.expenses = db.query(InvoiceExpense).filter(
        InvoiceExpense.invoice_id == invoice_id
    ).order_by(InvoiceExpense.date.asc()).all()
    
    return invoice


@router.post("/generate", response_model=InvoiceSchema)
def generate_invoice_from_time_entries(
    request: InvoiceGenerateRequest,
    db: Session = Depends(get_db)
):
    """Generate an invoice from selected time entries and/or expenses"""
    # Verify client exists
    client = db.query(Client).filter(Client.id == request.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get time entries
    time_entries = []
    if request.time_entry_ids:
        time_entries = db.query(InvoiceItem).filter(
            InvoiceItem.id.in_(request.time_entry_ids),
            InvoiceItem.client_id == request.client_id,
            InvoiceItem.invoice_id.is_(None)  # Only unbilled entries
        ).all()
        
        if len(time_entries) != len(request.time_entry_ids):
            raise HTTPException(status_code=400, detail="Some time entries are already invoiced or not found")
    
    # Get expenses
    expenses = []
    if request.expense_ids:
        expenses = db.query(InvoiceExpense).filter(
            InvoiceExpense.id.in_(request.expense_ids),
            InvoiceExpense.client_id == request.client_id,
            InvoiceExpense.invoice_id.is_(None)  # Only unbilled expenses
        ).all()
        
        if len(expenses) != len(request.expense_ids):
            raise HTTPException(status_code=400, detail="Some expenses are already invoiced or not found")
    
    if not time_entries and not expenses:
        raise HTTPException(status_code=400, detail="No valid time entries or expenses found")
    
    # Get project name from contract if not provided
    project_name = request.project_name
    if not project_name and request.contract_id:
        contract = db.query(Contract).filter(Contract.id == request.contract_id).first()
        if contract:
            project_name = contract.title
    
    # Generate invoice number
    invoice_number = get_next_invoice_number(request.client_id, db)
    
    # Calculate totals
    labor_subtotal = sum(entry.amount for entry in time_entries)
    expense_subtotal = sum(expense.amount for expense in expenses)
    subtotal = labor_subtotal + expense_subtotal
    total = subtotal + request.tax
    
    # Create invoice
    db_invoice = Invoice(
        client_id=request.client_id,
        contract_id=request.contract_id,
        invoice_number=invoice_number,
        amount=subtotal,
        tax=request.tax,
        total=total,
        status="Draft",
        issue_date=datetime.now(),
        due_date=request.due_date,
        project_name=project_name
    )
    db.add(db_invoice)
    db.flush()  # Get the invoice ID
    
    # Link time entries to invoice
    for entry in time_entries:
        entry.invoice_id = db_invoice.id
    
    # Link expenses to invoice
    for expense in expenses:
        expense.invoice_id = db_invoice.id
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice


@router.post("/", response_model=InvoiceSchema)
def create_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db)):
    """Create a new invoice manually"""
    # Verify client exists
    client = db.query(Client).filter(Client.id == invoice.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Generate invoice number if not provided
    if not invoice.invoice_number:
        invoice_number = get_next_invoice_number(invoice.client_id, db)
    else:
        invoice_number = invoice.invoice_number
        # Check if it already exists
        existing = db.query(Invoice).filter(Invoice.invoice_number == invoice_number).first()
        if existing:
            raise HTTPException(status_code=400, detail="Invoice number already exists")
    
    # Get project name from contract if not provided
    project_name = invoice.project_name
    if not project_name and invoice.contract_id:
        contract = db.query(Contract).filter(Contract.id == invoice.contract_id).first()
        if contract:
            project_name = contract.title
    
    # Calculate total
    total = invoice.amount + invoice.tax
    
    # Create invoice
    invoice_data = invoice.dict(exclude={"time_entry_ids"})
    invoice_data["invoice_number"] = invoice_number
    invoice_data["total"] = total
    invoice_data["project_name"] = project_name
    
    db_invoice = Invoice(**invoice_data)
    db.add(db_invoice)
    db.flush()
    
    # Link time entries if provided
    if invoice.time_entry_ids:
        time_entries = db.query(InvoiceItem).filter(
            InvoiceItem.id.in_(invoice.time_entry_ids),
            InvoiceItem.client_id == invoice.client_id,
            InvoiceItem.invoice_id.is_(None)
        ).all()
        
        for entry in time_entries:
            entry.invoice_id = db_invoice.id
    
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
    
    # Handle status changes
    if 'status' in update_data:
        new_status = update_data['status']
        if new_status == 'Finalized' and db_invoice.status != 'Finalized':
            update_data['finalized_date'] = datetime.now()
        elif new_status == 'Archived' and db_invoice.status != 'Archived':
            update_data['archived_date'] = datetime.now()
    
    for field, value in update_data.items():
        setattr(db_invoice, field, value)
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice


@router.post("/{invoice_id}/finalize", response_model=InvoiceSchema)
def finalize_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Finalize an invoice (marks it as complete and locks it)"""
    db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if db_invoice.status == 'Archived':
        raise HTTPException(status_code=400, detail="Cannot finalize an archived invoice")
    
    db_invoice.status = 'Finalized'
    db_invoice.finalized_date = datetime.now()
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice


@router.post("/{invoice_id}/archive", response_model=InvoiceSchema)
def archive_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Archive an invoice (moves it to archived section)"""
    db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    db_invoice.status = 'Archived'
    db_invoice.archived_date = datetime.now()
    
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


@router.get("/{invoice_id}/generate-pdf")
def generate_invoice_pdf_endpoint(invoice_id: int, db: Session = Depends(get_db)):
    """Generate PDF for an invoice"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    client = db.query(Client).filter(Client.id == invoice.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get time entries for this invoice
    time_entries = db.query(InvoiceItem).filter(
        InvoiceItem.invoice_id == invoice_id
    ).order_by(InvoiceItem.date.asc(), InvoiceItem.start_time.asc()).all()
    
    # Get expenses for this invoice
    expenses = db.query(InvoiceExpense).filter(
        InvoiceExpense.invoice_id == invoice_id
    ).order_by(InvoiceExpense.date.asc()).all()
    
    if not time_entries and not expenses:
        raise HTTPException(status_code=400, detail="No time entries or expenses found for this invoice")
    
    # Load client contacts if relationship exists
    from models import ClientContact
    client.contacts = db.query(ClientContact).filter(
        ClientContact.client_id == client.id
    ).order_by(ClientContact.order).all()
    
    # Generate PDF
    pdf_buffer = generate_invoice_pdf(invoice, client, time_entries, expenses)
    
    # Return PDF as response
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="SLS_{invoice.invoice_number}.pdf"'
        }
    )


@router.get("/{invoice_id}/generate-csv")
def generate_invoice_csv_endpoint(invoice_id: int, db: Session = Depends(get_db)):
    """Generate CSV for an invoice"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    client = db.query(Client).filter(Client.id == invoice.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get time entries for this invoice
    time_entries = db.query(InvoiceItem).filter(
        InvoiceItem.invoice_id == invoice_id
    ).order_by(InvoiceItem.date.asc(), InvoiceItem.start_time.asc()).all()
    
    # Get expenses for this invoice
    expenses = db.query(InvoiceExpense).filter(
        InvoiceExpense.invoice_id == invoice_id
    ).order_by(InvoiceExpense.date.asc()).all()
    
    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["Invoice Number", invoice.invoice_number])
    writer.writerow(["Date", invoice.issue_date.strftime("%Y-%m-%d") if invoice.issue_date else "N/A"])
    writer.writerow(["Client", f"{client.first_name} {client.last_name}"])
    if client.company:
        writer.writerow(["Company", client.company])
    if invoice.project_name:
        writer.writerow(["Project", invoice.project_name])
    if invoice.notes:
        writer.writerow(["Description", invoice.notes])
    
    # Calculate contract rate
    contract_rate = None
    if time_entries:
        rates = [entry.rate for entry in time_entries]
        contract_rate = max(set(rates), key=rates.count) if rates else None
    if not contract_rate and client.hourly_rate:
        contract_rate = client.hourly_rate
    if contract_rate:
        writer.writerow(["Contract Rate", f"${contract_rate:.2f}/hr"])
    
    writer.writerow([])
    
    # Time entries header - removed RATE column
    if time_entries:
        writer.writerow(["LABOR CHARGES"])
        writer.writerow(["DATE", "PERSON", "DESCRIPTION", "START TIME", "END TIME", "HOURS", "AMOUNT"])
        
        # Time entries
        for entry in time_entries:
            date_str = entry.date.strftime("%Y-%m-%d") if entry.date else "N/A"
            writer.writerow([
                date_str,
                entry.person,
                entry.description,
                entry.start_time or "N/A",
                entry.end_time or "N/A",
                f"{entry.hours:.2f}",
                f"${entry.amount:.2f}"
            ])
        writer.writerow([])
    
    # Expenses section
    if expenses:
        writer.writerow(["EXPENSES / REIMBURSEMENTS"])
        writer.writerow(["DATE", "DESCRIPTION", "CATEGORY", "AMOUNT"])
        
        # Expenses
        for expense in expenses:
            date_str = expense.date.strftime("%Y-%m-%d") if expense.date else "N/A"
            writer.writerow([
                date_str,
                expense.description,
                expense.category or "N/A",
                f"${expense.amount:.2f}"
            ])
        writer.writerow([])
    
    # Calculate subtotals
    labor_subtotal = sum(entry.amount for entry in time_entries)
    expense_subtotal = sum(expense.amount for expense in expenses)
    
    writer.writerow(["Labor Subtotal", f"${labor_subtotal:.2f}"])
    if expenses:
        writer.writerow(["Expenses Subtotal", f"${expense_subtotal:.2f}"])
    writer.writerow(["Subtotal", f"${invoice.amount:.2f}"])
    if invoice.tax > 0:
        writer.writerow(["Tax", f"${invoice.tax:.2f}"])
    writer.writerow(["Total", f"${invoice.total:.2f}"])
    
    output.seek(0)
    
    # Return CSV as response
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="SLS_{invoice.invoice_number}.csv"'
        }
    )

