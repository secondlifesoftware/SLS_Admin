from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr
import csv
import os
import base64
from io import StringIO, BytesIO
from database import get_db
from models import Invoice, InvoiceItem, InvoiceExpense, Client, Contract
from schemas import Invoice as InvoiceSchema, InvoiceCreate, InvoiceUpdate, InvoiceGenerateRequest
from utils.invoice_number import get_next_invoice_number
from utils.pdf_generator import generate_invoice_pdf

# Initialize Resend email client
resend_client = None
try:
    resend_api_key = os.getenv("RESEND_API_KEY")
    if resend_api_key:
        import resend
        resend.api_key = resend_api_key
        resend_client = resend
except ImportError:
    resend_client = None
except Exception as e:
    print(f"⚠️  WARNING: Error initializing Resend client: {e}")
    resend_client = None

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


class SendEmailRequest(BaseModel):
    to_email: EmailStr


@router.post("/{invoice_id}/send-email")
def send_invoice_email(invoice_id: int, request: SendEmailRequest, db: Session = Depends(get_db)):
    """Send invoice PDF via email to client"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    client = db.query(Client).filter(Client.id == invoice.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get time entries and expenses
    time_entries = db.query(InvoiceItem).filter(
        InvoiceItem.invoice_id == invoice_id
    ).order_by(InvoiceItem.date.asc(), InvoiceItem.start_time.asc()).all()
    
    expenses = db.query(InvoiceExpense).filter(
        InvoiceExpense.invoice_id == invoice_id
    ).order_by(InvoiceExpense.date.asc()).all()
    
    if not time_entries and not expenses:
        raise HTTPException(status_code=400, detail="No time entries or expenses found for this invoice")
    
    # Load client contacts
    from models import ClientContact
    client.contacts = db.query(ClientContact).filter(
        ClientContact.client_id == client.id
    ).order_by(ClientContact.order).all()
    
    # Generate PDF
    pdf_buffer = generate_invoice_pdf(invoice, client, time_entries, expenses)
    pdf_buffer.seek(0)
    pdf_data = pdf_buffer.read()
    
    # Send email using Resend
    if not resend_client:
        raise HTTPException(
            status_code=500,
            detail="Email service not configured. Please set RESEND_API_KEY environment variable."
        )
    
    try:
        # Get sender email from environment or use default
        from_email = os.getenv("RESEND_FROM_EMAIL", "invoices@secondlifesoftware.com")
        from_name = os.getenv("RESEND_FROM_NAME", "Second Life Software")
        
        # Encode PDF as base64 for attachment
        pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')
        
        # Prepare email content
        client_name = f"{client.first_name} {client.last_name}".strip() or client.email
        subject = f"Invoice {invoice.invoice_number} from Second Life Software"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .invoice-details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Invoice {invoice.invoice_number}</h1>
                    <p>Second Life Software</p>
                </div>
                <div class="content">
                    <p>Dear {client_name},</p>
                    <p>Please find attached your invoice <strong>{invoice.invoice_number}</strong> for the amount of <strong>${invoice.total:.2f}</strong>.</p>
                    
                    <div class="invoice-details">
                        <p><strong>Invoice Number:</strong> {invoice.invoice_number}</p>
                        <p><strong>Date:</strong> {invoice.date.strftime('%B %d, %Y') if invoice.date else 'N/A'}</p>
                        <p><strong>Due Date:</strong> {invoice.due_date.strftime('%B %d, %Y') if invoice.due_date else 'N/A'}</p>
                        <p><strong>Total Amount:</strong> ${invoice.total:.2f}</p>
                    </div>
                    
                    <p>The detailed invoice is attached as a PDF. If you have any questions, please don't hesitate to contact us.</p>
                    
                    <p>Best regards,<br>Second Life Software Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated email. Please do not reply directly to this message.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Send email via Resend
        params = {
            "from": f"{from_name} <{from_email}>",
            "to": [request.to_email],
            "subject": subject,
            "html": html_content,
            "attachments": [
                {
                    "filename": f"SLS_Invoice_{invoice.invoice_number}.pdf",
                    "content": pdf_base64,
                }
            ],
        }
        
        email_response = resend_client.Emails.send(params)
        
        return {
            "message": f"Invoice {invoice.invoice_number} sent successfully to {request.to_email}",
            "invoice_number": invoice.invoice_number,
            "to_email": request.to_email,
            "email_id": email_response.get("id"),
        }
        
    except Exception as e:
        print(f"Error sending email via Resend: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email: {str(e)}"
        )

