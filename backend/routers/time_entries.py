from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import os
from database import get_db
from models import InvoiceItem, Client
from schemas import InvoiceItem as InvoiceItemSchema, InvoiceItemCreate, InvoiceItemUpdate

router = APIRouter(prefix="/api/time-entries", tags=["time-entries"])

# Initialize OpenAI client for description enhancement
openai_client = None
try:
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if openai_api_key:
        from openai import OpenAI
        openai_client = OpenAI(api_key=openai_api_key)
except ImportError:
    openai_client = None
except Exception as e:
    print(f"⚠️  WARNING: Error initializing OpenAI client: {e}")
    openai_client = None


class DescriptionEnhancementRequest(BaseModel):
    description: str


class DescriptionEnhancementResponse(BaseModel):
    enhanced_description: str


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
    
    # Calculate hours if start_time and end_time are provided
    hours = None
    if entry.start_time and entry.end_time:
        calculated_hours = calculate_hours(entry.start_time, entry.end_time)
        # Only use calculated hours if > 0, otherwise allow manual hours
        if calculated_hours > 0:
            hours = calculated_hours
        elif entry.hours:
            hours = entry.hours
    elif entry.hours:
        hours = entry.hours
    
    # Calculate amount
    # Priority: 1) hours × rate (if hours > 0), 2) manual amount, 3) error
    if hours and hours > 0 and entry.rate:
        amount = round(hours * entry.rate, 2)
    elif entry.amount and entry.amount > 0:
        amount = entry.amount
    else:
        raise HTTPException(
            status_code=400, 
            detail="Amount must be greater than 0. Either provide start/end time with rate (resulting in hours > 0), or provide hours > 0 with rate, or provide amount > 0 directly."
        )
    
    # Create entry
    entry_data = entry.model_dump()
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
    
    update_data = entry_update.model_dump(exclude_unset=True)
    
    # Recalculate hours and amount if times or rate changed
    start_time = update_data.get('start_time', db_entry.start_time)
    end_time = update_data.get('end_time', db_entry.end_time)
    rate = update_data.get('rate', db_entry.rate)
    
    # If start_time and end_time are provided, calculate hours from them
    if start_time and end_time:
        hours = calculate_hours(start_time, end_time)
        update_data['hours'] = hours
        # Calculate amount from hours × rate
        if rate:
            update_data['amount'] = round(hours * rate, 2)
    # If hours is manually set and no start/end time, use manual hours
    elif 'hours' in update_data and update_data['hours']:
        hours = update_data['hours']
        # Calculate amount from hours × rate if rate is set
        if rate:
            update_data['amount'] = round(hours * rate, 2)
    # If amount is manually set and no start/end time, allow manual amount
    elif 'amount' in update_data and not start_time and not end_time:
        # Allow manual amount entry
        pass
    
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


@router.post("/enhance-description", response_model=DescriptionEnhancementResponse)
def enhance_description(request: DescriptionEnhancementRequest):
    """Enhance time entry description using AI - improve formatting, grammar, and clarity (30 words or less)"""
    if not request.description or not request.description.strip():
        raise HTTPException(status_code=400, detail="Description is required")
    
    if not openai_client:
        # Return original if OpenAI is not configured
        return DescriptionEnhancementResponse(enhanced_description=request.description)
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional time entry description editor. Your task is to improve time entry descriptions to be clear, concise, professional, and exactly 30 words or less. Fix grammar, improve clarity, and ensure professional formatting. Return ONLY the enhanced description, nothing else."
                },
                {
                    "role": "user",
                    "content": f"Enhance this time entry description to be professional, clear, and exactly 30 words or less:\n\n{request.description}"
                }
            ],
            max_tokens=100,
            temperature=0.3,
        )
        
        enhanced = response.choices[0].message.content.strip()
        
        # Ensure it's 30 words or less
        words = enhanced.split()
        if len(words) > 30:
            enhanced = ' '.join(words[:30])
        
        return DescriptionEnhancementResponse(enhanced_description=enhanced)
    
    except Exception as e:
        print(f"Error enhancing description: {e}")
        # Return original on error
        return DescriptionEnhancementResponse(enhanced_description=request.description)

