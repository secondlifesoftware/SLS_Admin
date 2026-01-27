from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# Client Contact Schemas
class ClientContactBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    order: int = 0
    notes: Optional[str] = None


class ClientContactCreate(ClientContactBase):
    client_id: int


class ClientContactUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    order: Optional[int] = None
    notes: Optional[str] = None


class ClientContact(ClientContactBase):
    id: int
    client_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Client Note Schemas
class ClientNoteBase(BaseModel):
    title: Optional[str] = None
    content: str
    note_type: str = "General"
    meeting_date: Optional[datetime] = None
    created_by: Optional[str] = None


class ClientNoteCreate(ClientNoteBase):
    client_id: int


class ClientNoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    note_type: Optional[str] = None
    meeting_date: Optional[datetime] = None


class ClientNote(ClientNoteBase):
    id: int
    client_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Client Timeline Schemas
class ClientTimelineBase(BaseModel):
    event_type: str
    title: str
    description: Optional[str] = None
    event_date: datetime
    next_steps: Optional[str] = None


class ClientTimelineCreate(ClientTimelineBase):
    client_id: int


class ClientTimelineUpdate(BaseModel):
    event_type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    next_steps: Optional[str] = None


class ClientTimeline(ClientTimelineBase):
    id: int
    client_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Contract Milestone Schemas
class ContractMilestoneBase(BaseModel):
    title: str
    description: Optional[str] = None
    amount: float
    due_date: Optional[datetime] = None
    status: str = "Pending"
    order: int = 0
    completed_date: Optional[datetime] = None


class ContractMilestoneCreate(ContractMilestoneBase):
    contract_id: int


class ContractMilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    order: Optional[int] = None
    completed_date: Optional[datetime] = None


class ContractMilestone(ContractMilestoneBase):
    id: int
    contract_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Contract Schemas
class ContractBase(BaseModel):
    contract_type: str  # Fixed Price, Milestone Based
    title: str
    total_amount: float
    status: str = "Draft"
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    signed_date: Optional[datetime] = None
    description: Optional[str] = None
    terms: Optional[str] = None


class ContractCreate(ContractBase):
    client_id: int
    milestones: Optional[List[ContractMilestoneCreate]] = []


class ContractUpdate(BaseModel):
    contract_type: Optional[str] = None
    title: Optional[str] = None
    total_amount: Optional[float] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    signed_date: Optional[datetime] = None
    description: Optional[str] = None
    terms: Optional[str] = None


class Contract(ContractBase):
    id: int
    client_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    milestones: List[ContractMilestone] = []

    class Config:
        from_attributes = True


# Client Schemas
class ClientBase(BaseModel):
    first_name: str  # Required
    last_name: str  # Required
    email: EmailStr  # Required
    client_date: datetime  # Required
    description: Optional[str] = None  # Optional
    hourly_rate: Optional[float] = None  # Optional
    notes_from_last_meeting: Optional[str] = None  # Optional
    timeline: Optional[str] = None  # Optional
    contract_status: str = "Negotiation"  # Default: Negotiation (No Contract, Negotiation, Contract Signed, Not Heard Back, Completed)
    contract_type: Optional[str] = None  # Default: None (Fixed Price, Milestone Based, Hourly, None)
    contract_due_date: Optional[datetime] = None  # Optional
    status: str = "Active"  # Default: Active
    company: Optional[str] = None  # Optional
    address: Optional[str] = None  # Optional


class ClientCreate(ClientBase):
    contacts: Optional[List[ClientContactBase]] = []


class ClientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    client_date: Optional[datetime] = None
    description: Optional[str] = None
    hourly_rate: Optional[float] = None
    notes_from_last_meeting: Optional[str] = None
    timeline: Optional[str] = None
    contract_status: Optional[str] = None
    contract_type: Optional[str] = None
    contract_due_date: Optional[datetime] = None
    status: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None


class Client(ClientBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    contacts: List[ClientContact] = []
    notes: List[ClientNote] = []
    timeline_events: List[ClientTimeline] = []
    contracts: List[Contract] = []

    class Config:
        from_attributes = True


# Simplified client schema for list views (without relationships)
class ClientList(ClientBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Invoice Item Schemas (Time Entries)
class InvoiceItemBase(BaseModel):
    date: datetime
    start_time: str  # Format: HH:MM
    end_time: str  # Format: HH:MM
    person: str
    description: str
    hours: float
    rate: float
    amount: float


class InvoiceItemCreate(InvoiceItemBase):
    client_id: int
    invoice_id: Optional[int] = None


class InvoiceItemUpdate(BaseModel):
    date: Optional[datetime] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    person: Optional[str] = None
    description: Optional[str] = None
    hours: Optional[float] = None
    rate: Optional[float] = None
    amount: Optional[float] = None


class InvoiceItem(InvoiceItemBase):
    id: int
    invoice_id: Optional[int]
    client_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Invoice Expense Schemas
class InvoiceExpenseBase(BaseModel):
    date: datetime
    description: str
    category: Optional[str] = None
    amount: float
    person: Optional[str] = None
    start_time: Optional[str] = None  # Format: HH:MM
    end_time: Optional[str] = None  # Format: HH:MM
    hours: Optional[float] = None


class InvoiceExpenseCreate(InvoiceExpenseBase):
    client_id: int
    invoice_id: Optional[int] = None


class InvoiceExpenseUpdate(BaseModel):
    date: Optional[datetime] = None
    description: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    person: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    hours: Optional[float] = None


class InvoiceExpense(InvoiceExpenseBase):
    id: int
    invoice_id: Optional[int]
    client_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Invoice Schemas
class InvoiceBase(BaseModel):
    client_id: int
    invoice_number: str
    amount: float
    tax: float = 0.0
    status: str = "Draft"  # Draft, Sent, Paid, Overdue, Cancelled, Finalized, Archived
    due_date: Optional[datetime] = None
    issue_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None
    notes: Optional[str] = None
    project_name: Optional[str] = None
    contract_id: Optional[int] = None
    finalized_date: Optional[datetime] = None
    archived_date: Optional[datetime] = None


class InvoiceCreate(InvoiceBase):
    time_entry_ids: Optional[List[int]] = []  # IDs of time entries to include


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
    project_name: Optional[str] = None
    contract_id: Optional[int] = None
    finalized_date: Optional[datetime] = None
    archived_date: Optional[datetime] = None


class Invoice(InvoiceBase):
    id: int
    total: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[InvoiceItem] = []
    expenses: List[InvoiceExpense] = []

    class Config:
        from_attributes = True


# Invoice Generation Request
class InvoiceGenerateRequest(BaseModel):
    client_id: int
    time_entry_ids: List[int] = []
    expense_ids: List[int] = []
    contract_id: Optional[int] = None
    project_name: Optional[str] = None
    tax: float = 0.0
    due_date: Optional[datetime] = None


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
    theme_preference: Optional[str] = None  # 'light' or 'dark'


class UserProfile(UserProfileBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Client Document Schemas
class ClientDocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    file_name: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    document_type: str = "Other"  # SOW, Contract, Other
    uploaded_by: Optional[str] = None


class ClientDocumentCreate(ClientDocumentBase):
    client_id: int


class ClientDocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    document_type: Optional[str] = None


class ClientDocument(ClientDocumentBase):
    id: int
    client_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Client Admin Account Schemas
class ClientAdminAccountBase(BaseModel):
    service_name: str
    account_type: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None  # Plain text for create/update
    url: Optional[str] = None
    notes: Optional[str] = None
    tech_stack_category: Optional[str] = None


class ClientAdminAccountCreate(ClientAdminAccountBase):
    client_id: int


class ClientAdminAccountUpdate(BaseModel):
    service_name: Optional[str] = None
    account_type: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    url: Optional[str] = None
    notes: Optional[str] = None
    tech_stack_category: Optional[str] = None


class ClientAdminAccount(ClientAdminAccountBase):
    id: int
    client_id: int
    encrypted_password: Optional[str] = None  # Encrypted in database
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Client Tech Stack Schemas
class ClientTechStackBase(BaseModel):
    technology: str
    category: Optional[str] = None
    version: Optional[str] = None
    notes: Optional[str] = None


class ClientTechStackCreate(ClientTechStackBase):
    client_id: int


class ClientTechStackUpdate(BaseModel):
    technology: Optional[str] = None
    category: Optional[str] = None
    version: Optional[str] = None
    notes: Optional[str] = None


class ClientTechStack(ClientTechStackBase):
    id: int
    client_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Password Reveal Request
class PasswordRevealRequest(BaseModel):
    user_password: str  # Admin's password for authentication
