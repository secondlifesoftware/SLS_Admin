from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import ClientContact, Client
from schemas import ClientContact as ClientContactSchema, ClientContactCreate, ClientContactUpdate

router = APIRouter(prefix="/api/client-contacts", tags=["client-contacts"])


@router.get("/client/{client_id}", response_model=List[ClientContactSchema])
def get_client_contacts(client_id: int, db: Session = Depends(get_db)):
    """Get all contacts for a specific client"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    contacts = db.query(ClientContact).filter(ClientContact.client_id == client_id).order_by(ClientContact.order).all()
    return contacts


@router.get("/{contact_id}", response_model=ClientContactSchema)
def get_contact(contact_id: int, db: Session = Depends(get_db)):
    """Get a specific contact by ID"""
    contact = db.query(ClientContact).filter(ClientContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.post("/", response_model=ClientContactSchema)
def create_contact(contact: ClientContactCreate, db: Session = Depends(get_db)):
    """Create a new contact for a client"""
    client = db.query(Client).filter(Client.id == contact.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    db_contact = ClientContact(**contact.model_dump())
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact


@router.put("/{contact_id}", response_model=ClientContactSchema)
def update_contact(contact_id: int, contact_update: ClientContactUpdate, db: Session = Depends(get_db)):
    """Update a contact"""
    db_contact = db.query(ClientContact).filter(ClientContact.id == contact_id).first()
    if not db_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    update_data = contact_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_contact, field, value)
    
    db.commit()
    db.refresh(db_contact)
    return db_contact


@router.delete("/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    """Delete a contact"""
    db_contact = db.query(ClientContact).filter(ClientContact.id == contact_id).first()
    if not db_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    db.delete(db_contact)
    db.commit()
    return {"message": "Contact deleted successfully"}

