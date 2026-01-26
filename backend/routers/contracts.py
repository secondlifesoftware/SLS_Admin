from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Contract, ContractMilestone, Client
from schemas import Contract as ContractSchema, ContractCreate, ContractUpdate, ContractMilestone as ContractMilestoneSchema, ContractMilestoneCreate

router = APIRouter(prefix="/api/contracts", tags=["contracts"])


@router.get("/client/{client_id}", response_model=List[ContractSchema])
def get_client_contracts(client_id: int, db: Session = Depends(get_db)):
    """Get all contracts for a specific client"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    contracts = db.query(Contract).filter(Contract.client_id == client_id).all()
    return contracts


@router.get("/{contract_id}", response_model=ContractSchema)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    """Get a specific contract by ID"""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract


@router.post("/", response_model=ContractSchema)
def create_contract(contract: ContractCreate, db: Session = Depends(get_db)):
    """Create a new contract for a client"""
    client = db.query(Client).filter(Client.id == contract.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    contract_data = contract.model_dump()
    milestones_data = contract_data.pop('milestones', [])
    
    db_contract = Contract(**contract_data)
    db.add(db_contract)
    db.flush()  # Flush to get the contract ID
    
    # Add milestones
    for milestone_data in milestones_data:
        milestone_data['contract_id'] = db_contract.id
        db_milestone = ContractMilestone(**milestone_data)
        db.add(db_milestone)
    
    db.commit()
    db.refresh(db_contract)
    return db_contract


@router.put("/{contract_id}", response_model=ContractSchema)
def update_contract(contract_id: int, contract_update: ContractUpdate, db: Session = Depends(get_db)):
    """Update a contract"""
    db_contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not db_contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    update_data = contract_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_contract, field, value)
    
    db.commit()
    db.refresh(db_contract)
    return db_contract


@router.delete("/{contract_id}")
def delete_contract(contract_id: int, db: Session = Depends(get_db)):
    """Delete a contract"""
    db_contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not db_contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    db.delete(db_contract)
    db.commit()
    return {"message": "Contract deleted successfully"}


# Milestone endpoints
@router.post("/{contract_id}/milestones", response_model=ContractMilestoneSchema)
def create_milestone(contract_id: int, milestone: ContractMilestoneCreate, db: Session = Depends(get_db)):
    """Create a new milestone for a contract"""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    milestone_data = milestone.model_dump()
    milestone_data['contract_id'] = contract_id
    db_milestone = ContractMilestone(**milestone_data)
    db.add(db_milestone)
    db.commit()
    db.refresh(db_milestone)
    return db_milestone

