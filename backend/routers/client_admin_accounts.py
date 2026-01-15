from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Client, ClientAdminAccount
from schemas import (
    ClientAdminAccountCreate, 
    ClientAdminAccountUpdate, 
    ClientAdminAccount as ClientAdminAccountSchema,
    PasswordRevealRequest
)
from utils.encryption import encrypt_password, decrypt_password
# from firebase_admin import auth  # Optional - for future Firebase password verification
import os

router = APIRouter(prefix="/api/client-admin-accounts", tags=["client-admin-accounts"])


@router.get("/client/{client_id}", response_model=List[ClientAdminAccountSchema])
def get_client_admin_accounts(client_id: int, db: Session = Depends(get_db)):
    """Get all admin accounts for a client (passwords are encrypted)"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    accounts = db.query(ClientAdminAccount).filter(
        ClientAdminAccount.client_id == client_id
    ).order_by(ClientAdminAccount.service_name).all()
    
    # Don't return decrypted passwords in list view
    for account in accounts:
        account.password = None  # Remove password field from response
    
    return accounts


@router.get("/{account_id}", response_model=ClientAdminAccountSchema)
def get_admin_account(account_id: int, db: Session = Depends(get_db)):
    """Get a specific admin account (password encrypted)"""
    account = db.query(ClientAdminAccount).filter(ClientAdminAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    account.password = None  # Don't return password
    return account


@router.post("/{account_id}/reveal-password")
def reveal_password(account_id: int, request: PasswordRevealRequest, db: Session = Depends(get_db)):
    """Reveal password after authentication (requires user password)"""
    # Verify user password with Firebase
    # For now, we'll use a simple check - in production, verify with Firebase Auth
    # This is a placeholder - you should verify the user's Firebase password
    
    account = db.query(ClientAdminAccount).filter(ClientAdminAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if not account.encrypted_password:
        return {"password": ""}
    
    try:
        decrypted = decrypt_password(account.encrypted_password)
        return {"password": decrypted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to decrypt password: {str(e)}")


@router.post("/", response_model=ClientAdminAccountSchema)
def create_admin_account(account_data: ClientAdminAccountCreate, db: Session = Depends(get_db)):
    """Create a new admin account"""
    client = db.query(Client).filter(Client.id == account_data.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Encrypt password if provided
    encrypted_pwd = None
    if account_data.password:
        encrypted_pwd = encrypt_password(account_data.password)
    
    db_account = ClientAdminAccount(
        client_id=account_data.client_id,
        service_name=account_data.service_name,
        account_type=account_data.account_type,
        username=account_data.username,
        encrypted_password=encrypted_pwd,
        url=account_data.url,
        notes=account_data.notes,
        tech_stack_category=account_data.tech_stack_category
    )
    
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    
    db_account.password = None  # Don't return password
    return db_account


@router.put("/{account_id}", response_model=ClientAdminAccountSchema)
def update_admin_account(account_id: int, account_update: ClientAdminAccountUpdate, db: Session = Depends(get_db)):
    """Update an admin account"""
    db_account = db.query(ClientAdminAccount).filter(ClientAdminAccount.id == account_id).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    update_data = account_update.dict(exclude_unset=True)
    
    # Encrypt password if it's being updated
    if 'password' in update_data and update_data['password']:
        update_data['encrypted_password'] = encrypt_password(update_data['password'])
        del update_data['password']  # Remove plain password
    
    for field, value in update_data.items():
        setattr(db_account, field, value)
    
    db.commit()
    db.refresh(db_account)
    
    db_account.password = None  # Don't return password
    return db_account


@router.delete("/{account_id}")
def delete_admin_account(account_id: int, db: Session = Depends(get_db)):
    """Delete an admin account"""
    db_account = db.query(ClientAdminAccount).filter(ClientAdminAccount.id == account_id).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    db.delete(db_account)
    db.commit()
    return {"message": "Account deleted successfully"}

