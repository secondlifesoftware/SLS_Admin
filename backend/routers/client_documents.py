from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Client, ClientDocument
from models import ScopeOfWork
from schemas import ClientDocumentCreate, ClientDocumentUpdate, ClientDocument as ClientDocumentSchema
import os
import shutil
from datetime import datetime

router = APIRouter(prefix="/api/client-documents", tags=["client-documents"])

UPLOAD_DIR = "uploads/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/client/{client_id}", response_model=List[ClientDocumentSchema])
def get_client_documents(client_id: int, db: Session = Depends(get_db)):
    """Get all documents for a client"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    documents = db.query(ClientDocument).filter(ClientDocument.client_id == client_id).order_by(ClientDocument.created_at.desc()).all()
    return documents


@router.post("/", response_model=ClientDocumentSchema)
async def upload_document(
    client_id: int = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    document_type: str = Form("Other"),
    uploaded_by: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a document for a client"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Save file
    file_ext = os.path.splitext(file.filename)[1]
    file_name = f"{client_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = os.path.getsize(file_path)
    file_type = file_ext[1:] if file_ext else None
    
    # Create document record
    db_document = ClientDocument(
        client_id=client_id,
        title=title,
        description=description,
        file_name=file.filename,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
        document_type=document_type,
        uploaded_by=uploaded_by
    )
    
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    # If it's an SOW document and approved, create/update SOW record
    if document_type == "SOW":
        # Check if SOW already exists
        existing_sow = db.query(ScopeOfWork).filter(
            ScopeOfWork.client_id == client_id,
            ScopeOfWork.status == "Approved"
        ).first()
        
        if existing_sow:
            existing_sow.notes = f"Document uploaded: {file.filename}"
        else:
            # Create new SOW record
            new_sow = ScopeOfWork(
                client_id=client_id,
                title=title,
                status="Approved",
                description=description or f"SOW document uploaded: {file.filename}",
                notes=f"Document uploaded: {file.filename}",
                approved_date=datetime.now()
            )
            db.add(new_sow)
        
        db.commit()
    
    return db_document


@router.put("/{document_id}", response_model=ClientDocumentSchema)
def update_document(document_id: int, document_update: ClientDocumentUpdate, db: Session = Depends(get_db)):
    """Update document metadata"""
    db_document = db.query(ClientDocument).filter(ClientDocument.id == document_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    update_data = document_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_document, field, value)
    
    db.commit()
    db.refresh(db_document)
    return db_document


@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    """Delete a document"""
    db_document = db.query(ClientDocument).filter(ClientDocument.id == document_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file
    if os.path.exists(db_document.file_path):
        os.remove(db_document.file_path)
    
    db.delete(db_document)
    db.commit()
    return {"message": "Document deleted successfully"}


@router.get("/{document_id}/download")
def download_document(document_id: int, db: Session = Depends(get_db)):
    """Download a document file"""
    from fastapi.responses import FileResponse
    
    db_document = db.query(ClientDocument).filter(ClientDocument.id == document_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not os.path.exists(db_document.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        db_document.file_path,
        media_type="application/octet-stream",
        filename=db_document.file_name
    )


@router.get("/{document_id}/view")
def view_document(document_id: int, db: Session = Depends(get_db)):
    """View a document file in browser"""
    from fastapi.responses import FileResponse, Response
    import mimetypes
    
    db_document = db.query(ClientDocument).filter(ClientDocument.id == document_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not os.path.exists(db_document.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine content type based on file extension
    content_type, _ = mimetypes.guess_type(db_document.file_name)
    if not content_type:
        # Default to application/octet-stream if we can't determine
        content_type = "application/octet-stream"
    
    # Read file content
    with open(db_document.file_path, 'rb') as f:
        file_content = f.read()
    
    # Return Response with inline content-disposition header
    headers = {
        "Content-Disposition": f"inline; filename=\"{db_document.file_name}\"",
        "Content-Type": content_type,
    }
    
    return Response(
        content=file_content,
        media_type=content_type,
        headers=headers
    )

