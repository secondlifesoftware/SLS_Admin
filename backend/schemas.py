from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# Client Schemas
class ClientBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    status: str = "Active"
    company: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class Client(ClientBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Invoice Item Schemas
class InvoiceItemBase(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float


class InvoiceItemCreate(InvoiceItemBase):
    pass


class InvoiceItem(InvoiceItemBase):
    id: int
    invoice_id: int
    total: float
    created_at: datetime

    class Config:
        from_attributes = True


# Invoice Schemas
class InvoiceBase(BaseModel):
    client_id: int
    invoice_number: str
    amount: float
    tax: float = 0.0
    status: str = "Draft"
    due_date: Optional[datetime] = None
    issue_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None
    notes: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    items: Optional[List[InvoiceItemCreate]] = []


class InvoiceUpdate(BaseModel):
    client_id: Optional[int] = None
    invoice_number: Optional[str] = None
    amount: Optional[float] = None
    tax: Optional[float] = None
    total: Optional[float] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    issue_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None
    notes: Optional[str] = None


class Invoice(InvoiceBase):
    id: int
    total: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[InvoiceItem] = []

    class Config:
        from_attributes = True


# Scope Section Schemas
class ScopeSectionBase(BaseModel):
    title: str
    content: Optional[str] = None
    order: int = 0


class ScopeSectionCreate(ScopeSectionBase):
    pass


class ScopeSection(ScopeSectionBase):
    id: int
    scope_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Scope of Work Schemas
class ScopeOfWorkBase(BaseModel):
    client_id: int
    title: str
    version: str = "1.0"
    status: str = "Draft"
    description: Optional[str] = None
    deliverables: Optional[str] = None
    timeline: Optional[str] = None
    budget: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    approved_date: Optional[datetime] = None
    notes: Optional[str] = None


class ScopeOfWorkCreate(ScopeOfWorkBase):
    sections: Optional[List[ScopeSectionCreate]] = []


class ScopeOfWorkUpdate(BaseModel):
    client_id: Optional[int] = None
    title: Optional[str] = None
    version: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    deliverables: Optional[str] = None
    timeline: Optional[str] = None
    budget: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    approved_date: Optional[datetime] = None
    notes: Optional[str] = None


class ScopeOfWork(ScopeOfWorkBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    sections: List[ScopeSection] = []

    class Config:
        from_attributes = True


# User Profile Schemas
class UserProfileBase(BaseModel):
    firebase_uid: str
    email: EmailStr
    name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    bio: Optional[str] = None
    role: str = "Administrator"
    avatar_url: Optional[str] = None


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    bio: Optional[str] = None
    role: Optional[str] = None
    avatar_url: Optional[str] = None


class UserProfile(UserProfileBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

