from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Client, ClientTechStack
from schemas import (
    ClientTechStackCreate,
    ClientTechStackUpdate,
    ClientTechStack as ClientTechStackSchema
)

router = APIRouter(prefix="/api/client-tech-stack", tags=["client-tech-stack"])


@router.get("/client/{client_id}", response_model=List[ClientTechStackSchema])
def get_client_tech_stack(client_id: int, db: Session = Depends(get_db)):
    """Get tech stack for a client"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    tech_stack = db.query(ClientTechStack).filter(
        ClientTechStack.client_id == client_id
    ).order_by(ClientTechStack.category, ClientTechStack.technology).all()
    
    return tech_stack


@router.post("/", response_model=ClientTechStackSchema)
def create_tech_stack_item(tech_data: ClientTechStackCreate, db: Session = Depends(get_db)):
    """Add a technology to client's tech stack"""
    client = db.query(Client).filter(Client.id == tech_data.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    db_tech = ClientTechStack(
        client_id=tech_data.client_id,
        technology=tech_data.technology,
        category=tech_data.category,
        version=tech_data.version,
        notes=tech_data.notes
    )
    
    db.add(db_tech)
    db.commit()
    db.refresh(db_tech)
    return db_tech


@router.put("/{tech_id}", response_model=ClientTechStackSchema)
def update_tech_stack_item(tech_id: int, tech_update: ClientTechStackUpdate, db: Session = Depends(get_db)):
    """Update a tech stack item"""
    db_tech = db.query(ClientTechStack).filter(ClientTechStack.id == tech_id).first()
    if not db_tech:
        raise HTTPException(status_code=404, detail="Tech stack item not found")
    
    update_data = tech_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_tech, field, value)
    
    db.commit()
    db.refresh(db_tech)
    return db_tech


@router.delete("/{tech_id}")
def delete_tech_stack_item(tech_id: int, db: Session = Depends(get_db)):
    """Delete a tech stack item"""
    db_tech = db.query(ClientTechStack).filter(ClientTechStack.id == tech_id).first()
    if not db_tech:
        raise HTTPException(status_code=404, detail="Tech stack item not found")
    
    db.delete(db_tech)
    db.commit()
    return {"message": "Tech stack item deleted successfully"}

