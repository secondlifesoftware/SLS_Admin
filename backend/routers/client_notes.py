from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import ClientNote, Client
from schemas import ClientNote as ClientNoteSchema, ClientNoteCreate, ClientNoteUpdate

router = APIRouter(prefix="/api/client-notes", tags=["client-notes"])


@router.get("/client/{client_id}", response_model=List[ClientNoteSchema])
def get_client_notes(client_id: int, db: Session = Depends(get_db)):
    """Get all notes for a specific client"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    notes = db.query(ClientNote).filter(ClientNote.client_id == client_id).order_by(ClientNote.created_at.desc()).all()
    return notes


@router.get("/{note_id}", response_model=ClientNoteSchema)
def get_note(note_id: int, db: Session = Depends(get_db)):
    """Get a specific note by ID"""
    note = db.query(ClientNote).filter(ClientNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.post("/", response_model=ClientNoteSchema)
def create_note(note: ClientNoteCreate, db: Session = Depends(get_db)):
    """Create a new note for a client"""
    client = db.query(Client).filter(Client.id == note.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    db_note = ClientNote(**note.model_dump())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


@router.put("/{note_id}", response_model=ClientNoteSchema)
def update_note(note_id: int, note_update: ClientNoteUpdate, db: Session = Depends(get_db)):
    """Update a note"""
    db_note = db.query(ClientNote).filter(ClientNote.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    update_data = note_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_note, field, value)
    
    db.commit()
    db.refresh(db_note)
    return db_note


@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    """Delete a note"""
    db_note = db.query(ClientNote).filter(ClientNote.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(db_note)
    db.commit()
    return {"message": "Note deleted successfully"}

