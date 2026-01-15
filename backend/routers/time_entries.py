from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from database import get_db
from models import InvoiceItem, Client
from schemas import InvoiceItem as InvoiceItemSchema, InvoiceItemCreate, InvoiceItemUpdate

router = APIRouter(prefix="/api/time-entries", tags=["time-entries"])


def calculate_hours(start_time: str, end_time: str) -> float:
    """Calculate hours between start and end time"""
    try:
        start = datetime.strptime(start_time, "%H:%M")
        end = datetime.strptime(end_time, "%H:%M")
        
        # Handle overnight (end time is next day)
        if end < start:
            end = end.replace(day=end.day + 1)
        
        delta = end - start
        return round(delta.total_seconds() / 3600, 2)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM")


@router.get("/client/{client_id}", response_model=List[InvoiceItemSchema])
def get_client_time_entries(
    client_id: int,
    invoiced: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get all time entries for a client, optionally filtered by invoiced status"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    query = db.query(InvoiceItem).filter(InvoiceItem.client_id == client_id)
    
    if invoiced is not None:
        if invoiced:
            query = query.filter(InvoiceItem.invoice_id.isnot(None))
        else:
            query = query.filter(InvoiceItem.invoice_id.is_(None))
    
    entries = query.order_by(InvoiceItem.date.desc(), InvoiceItem.start_time.desc()).all()
    return entries


@router.get("/{entry_id}", response_model=InvoiceItemSchema)
def get_time_entry(entry_id: int, db: Session = Depends(get_db)):
    """Get a specific time entry by ID"""
    entry = db.query(InvoiceItem).filter(InvoiceItem.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return entry


@router.post("/", response_model=InvoiceItemSchema)
def create_time_entry(entry: InvoiceItemCreate, db: Session = Depends(get_db)):
    """Create a new time entry"""
    client = db.query(Client).filter(Client.id == entry.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Calculate hours
    hours = calculate_hours(entry.start_time, entry.end_time)
    
    # Calculate amount
    amount = round(hours * entry.rate, 2)
    
    # Create entry
    entry_data = entry.dict()
    entry_data['hours'] = hours
    entry_data['amount'] = amount
    
    db_entry = InvoiceItem(**entry_data)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.put("/{entry_id}", response_model=InvoiceItemSchema)
def update_time_entry(entry_id: int, entry_update: InvoiceItemUpdate, db: Session = Depends(get_db)):
    """Update a time entry"""
    db_entry = db.query(InvoiceItem).filter(InvoiceItem.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    
    # If invoice_id is set, don't allow updates
    if db_entry.invoice_id:
        raise HTTPException(status_code=400, detail="Cannot update time entry that is already invoiced")
    
    update_data = entry_update.dict(exclude_unset=True)
    
    # Recalculate hours and amount if times or rate changed
    start_time = update_data.get('start_time', db_entry.start_time)
    end_time = update_data.get('end_time', db_entry.end_time)
    rate = update_data.get('rate', db_entry.rate)
    
    if 'start_time' in update_data or 'end_time' in update_data:
        hours = calculate_hours(start_time, end_time)
        update_data['hours'] = hours
    
    if 'hours' in update_data or 'rate' in update_data:
        hours = update_data.get('hours', db_entry.hours)
        update_data['amount'] = round(hours * rate, 2)
    
    for field, value in update_data.items():
        setattr(db_entry, field, value)
    
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.delete("/{entry_id}")
def delete_time_entry(entry_id: int, db: Session = Depends(get_db)):
    """Delete a time entry"""
    db_entry = db.query(InvoiceItem).filter(InvoiceItem.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    
    # Don't allow deletion if already invoiced
    if db_entry.invoice_id:
        raise HTTPException(status_code=400, detail="Cannot delete time entry that is already invoiced")
    
    db.delete(db_entry)
    db.commit()
    return {"message": "Time entry deleted successfully"}

