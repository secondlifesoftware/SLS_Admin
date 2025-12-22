from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import ScopeOfWork, ScopeSection, Client
from schemas import ScopeOfWork as ScopeOfWorkSchema, ScopeOfWorkCreate, ScopeOfWorkUpdate

router = APIRouter(prefix="/api/scope-of-work", tags=["scope-of-work"])


@router.get("/", response_model=List[ScopeOfWorkSchema])
def get_scopes(skip: int = 0, limit: int = 100, client_id: int = None, status: str = None, db: Session = Depends(get_db)):
    """Get all scope of work documents with optional filtering"""
    query = db.query(ScopeOfWork)
    
    if client_id:
        query = query.filter(ScopeOfWork.client_id == client_id)
    if status:
        query = query.filter(ScopeOfWork.status == status)
    
    scopes = query.offset(skip).limit(limit).all()
    return scopes


@router.get("/{scope_id}", response_model=ScopeOfWorkSchema)
def get_scope(scope_id: int, db: Session = Depends(get_db)):
    """Get a specific scope of work by ID"""
    scope = db.query(ScopeOfWork).filter(ScopeOfWork.id == scope_id).first()
    if not scope:
        raise HTTPException(status_code=404, detail="Scope of work not found")
    return scope


@router.post("/", response_model=ScopeOfWorkSchema)
def create_scope(scope: ScopeOfWorkCreate, db: Session = Depends(get_db)):
    """Create a new scope of work"""
    # Verify client exists
    client = db.query(Client).filter(Client.id == scope.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Create scope
    scope_data = scope.dict(exclude={"sections"})
    db_scope = ScopeOfWork(**scope_data)
    db.add(db_scope)
    db.flush()  # Get the scope ID
    
    # Create sections
    sections_data = scope.sections or []
    for section_data in sections_data:
        db_section = ScopeSection(
            scope_id=db_scope.id,
            title=section_data.title,
            content=section_data.content,
            order=section_data.order
        )
        db.add(db_section)
    
    db.commit()
    db.refresh(db_scope)
    return db_scope


@router.put("/{scope_id}", response_model=ScopeOfWorkSchema)
def update_scope(scope_id: int, scope_update: ScopeOfWorkUpdate, db: Session = Depends(get_db)):
    """Update a scope of work"""
    db_scope = db.query(ScopeOfWork).filter(ScopeOfWork.id == scope_id).first()
    if not db_scope:
        raise HTTPException(status_code=404, detail="Scope of work not found")
    
    update_data = scope_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_scope, field, value)
    
    db.commit()
    db.refresh(db_scope)
    return db_scope


@router.delete("/{scope_id}")
def delete_scope(scope_id: int, db: Session = Depends(get_db)):
    """Delete a scope of work"""
    db_scope = db.query(ScopeOfWork).filter(ScopeOfWork.id == scope_id).first()
    if not db_scope:
        raise HTTPException(status_code=404, detail="Scope of work not found")
    
    db.delete(db_scope)
    db.commit()
    return {"message": "Scope of work deleted successfully"}

