from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import InvoiceExpense, Client, Invoice
from schemas import InvoiceExpenseCreate, InvoiceExpenseUpdate, InvoiceExpense as InvoiceExpenseSchema

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("/", response_model=list[InvoiceExpenseSchema])
def get_expenses(
    client_id: int = None,
    invoice_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all expenses, optionally filtered by client or invoice"""
    query = db.query(InvoiceExpense)
    
    if client_id:
        query = query.filter(InvoiceExpense.client_id == client_id)
    if invoice_id:
        query = query.filter(InvoiceExpense.invoice_id == invoice_id)
    else:
        # If no invoice_id specified, show unbilled expenses (invoice_id is None)
        # This allows filtering for unbilled expenses
        pass
    
    expenses = query.order_by(InvoiceExpense.date.desc()).offset(skip).limit(limit).all()
    return expenses


@router.get("/{expense_id}", response_model=InvoiceExpenseSchema)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    """Get a single expense by ID"""
    expense = db.query(InvoiceExpense).filter(InvoiceExpense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.post("/", response_model=InvoiceExpenseSchema)
def create_expense(expense: InvoiceExpenseCreate, db: Session = Depends(get_db)):
    """Create a new expense"""
    # Verify client exists
    client = db.query(Client).filter(Client.id == expense.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # If invoice_id is provided, verify invoice exists
    if expense.invoice_id:
        invoice = db.query(Invoice).filter(Invoice.id == expense.invoice_id).first()
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
    
    db_expense = InvoiceExpense(**expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense


@router.put("/{expense_id}", response_model=InvoiceExpenseSchema)
def update_expense(expense_id: int, expense_update: InvoiceExpenseUpdate, db: Session = Depends(get_db)):
    """Update an expense"""
    db_expense = db.query(InvoiceExpense).filter(InvoiceExpense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    update_data = expense_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_expense, field, value)
    
    db.commit()
    db.refresh(db_expense)
    return db_expense


@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    """Delete an expense"""
    db_expense = db.query(InvoiceExpense).filter(InvoiceExpense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.delete(db_expense)
    db.commit()
    return {"message": "Expense deleted successfully"}

