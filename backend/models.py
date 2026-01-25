from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    client_date = Column(DateTime(timezone=True), nullable=False)  # Date they became a client
    description = Column(Text)  # Description of their idea
    hourly_rate = Column(Float)
    notes_from_last_meeting = Column(Text)
    timeline = Column(Text)  # Timeline on the contract
    contract_status = Column(String(50), default="No Contract")  # No Contract, Negotiation, Contract Signed, Not Heard Back
    contract_type = Column(String(50))  # Fixed Price, Milestone Based, Hourly, None
    contract_due_date = Column(DateTime(timezone=True))  # For fixed price contracts
    status = Column(String(50), default="Active")  # Active, Inactive, Lead, Prospect
    company = Column(String(255))
    address = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    contacts = relationship("ClientContact", back_populates="client", cascade="all, delete-orphan", order_by="ClientContact.order")
    notes = relationship("ClientNote", back_populates="client", cascade="all, delete-orphan", order_by="ClientNote.created_at.desc()")
    timeline_events = relationship("ClientTimeline", back_populates="client", cascade="all, delete-orphan", order_by="ClientTimeline.event_date.desc()")
    contracts = relationship("Contract", back_populates="client", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="client", cascade="all, delete-orphan")
    time_entries = relationship("InvoiceItem", back_populates="client", cascade="all, delete-orphan", order_by="InvoiceItem.date.desc()")
    expenses = relationship("InvoiceExpense", back_populates="client", cascade="all, delete-orphan", order_by="InvoiceExpense.date.desc()")
    scopes = relationship("ScopeOfWork", back_populates="client", cascade="all, delete-orphan")
    documents = relationship("ClientDocument", back_populates="client", cascade="all, delete-orphan")
    admin_accounts = relationship("ClientAdminAccount", back_populates="client", cascade="all, delete-orphan")
    tech_stack = relationship("ClientTechStack", back_populates="client", cascade="all, delete-orphan")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=True)  # Optional: link to contract
    invoice_number = Column(String(100), unique=True, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    tax = Column(Float, default=0.0)
    total = Column(Float, nullable=False)
    status = Column(String(50), default="Draft")  # Draft, Sent, Paid, Overdue, Cancelled, Finalized, Archived
    finalized_date = Column(DateTime(timezone=True))  # When invoice was finalized
    archived_date = Column(DateTime(timezone=True))  # When invoice was archived
    due_date = Column(DateTime(timezone=True))
    issue_date = Column(DateTime(timezone=True), server_default=func.now())
    paid_date = Column(DateTime(timezone=True))
    notes = Column(Text)
    project_name = Column(String(255))  # What the invoice is for (from contract or manual entry)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    client = relationship("Client", back_populates="invoices")
    contract = relationship("Contract", foreign_keys=[contract_id])
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan", order_by="InvoiceItem.date.asc()")
    expenses = relationship("InvoiceExpense", back_populates="invoice", cascade="all, delete-orphan", order_by="InvoiceExpense.date.asc()")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)  # Nullable for unbilled time entries
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    start_time = Column(String(10), nullable=False)  # Format: HH:MM
    end_time = Column(String(10), nullable=False)  # Format: HH:MM
    person = Column(String(255), nullable=False)
    description = Column(String(500), nullable=False)
    hours = Column(Float, nullable=False)  # Calculated from start/end time
    rate = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)  # Calculated: hours * rate
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    invoice = relationship("Invoice", back_populates="items")
    client = relationship("Client", back_populates="time_entries")


class InvoiceExpense(Base):
    __tablename__ = "invoice_expenses"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)  # Nullable for unbilled expenses
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)  # Date expense was incurred
    description = Column(String(500), nullable=False)
    category = Column(String(100))  # Optional: Subscription, Software, Travel, etc.
    amount = Column(Float, nullable=False)  # Fixed amount (no hours/rate calculation)
    person = Column(String(255))  # Optional: Person who incurred the expense
    start_time = Column(String(10))  # Optional: Start time (Format: HH:MM)
    end_time = Column(String(10))  # Optional: End time (Format: HH:MM)
    hours = Column(Float)  # Optional: Hours (can be manually entered for fixed costs)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    invoice = relationship("Invoice", back_populates="expenses")
    client = relationship("Client", back_populates="expenses")


class ScopeOfWork(Base):
    __tablename__ = "scope_of_work"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    title = Column(String(255), nullable=False)
    version = Column(String(50), default="1.0")
    status = Column(String(50), default="Draft")  # Draft, Sent, Approved, Rejected, In Progress, Completed
    description = Column(Text)
    deliverables = Column(Text)
    timeline = Column(String(255))
    budget = Column(Float)
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    approved_date = Column(DateTime(timezone=True))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    client = relationship("Client", back_populates="scopes")
    sections = relationship("ScopeSection", back_populates="scope", cascade="all, delete-orphan", order_by="ScopeSection.order")


class ScopeSection(Base):
    __tablename__ = "scope_sections"

    id = Column(Integer, primary_key=True, index=True)
    scope_id = Column(Integer, ForeignKey("scope_of_work.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text)
    order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    scope = relationship("ScopeOfWork", back_populates="sections")


class ClientContact(Base):
    __tablename__ = "client_contacts"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255))
    phone = Column(String(50))
    title = Column(String(255))  # Job title
    order = Column(Integer, default=0)  # 1, 2, or 3 for point of contact
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    client = relationship("Client", back_populates="contacts")


class ClientNote(Base):
    __tablename__ = "client_notes"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    title = Column(String(255))
    content = Column(Text, nullable=False)
    note_type = Column(String(50), default="General")  # General, Meeting, Call, Email, Follow-up
    meeting_date = Column(DateTime(timezone=True))  # For meeting notes
    created_by = Column(String(255))  # User who created the note
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    client = relationship("Client", back_populates="notes")


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True, index=True)  # Nullable if not matched yet
    google_event_id = Column(String(255), unique=True, nullable=False, index=True)  # Google Calendar event ID
    calendar_id = Column(String(255), nullable=False)  # Which calendar the event is on
    event_title = Column(String(255))
    event_description = Column(Text)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    timezone = Column(String(50), default="America/Los_Angeles")
    attendee_emails = Column(Text)  # JSON array of attendee emails
    hangout_link = Column(String(500))  # Google Meet link
    html_link = Column(String(500))  # Link to view event in Google Calendar
    status = Column(String(50), default="confirmed")  # confirmed, canceled, tentative
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_synced_at = Column(DateTime(timezone=True))  # When we last synced from Google

    # Relationships
    client = relationship("Client")


class ClientTimeline(Base):
    __tablename__ = "client_timeline"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    event_type = Column(String(50), nullable=False)  # Initial Contact, Proposal Sent, Meeting, Contract Signed, etc.
    title = Column(String(255), nullable=False)
    description = Column(Text)
    event_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    next_steps = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    client = relationship("Client", back_populates="timeline_events")


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    contract_type = Column(String(50), nullable=False)  # Fixed Price, Milestone Based
    title = Column(String(255), nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String(50), default="Draft")  # Draft, Sent, Signed, Active, Completed, Cancelled
    start_date = Column(DateTime(timezone=True))
    due_date = Column(DateTime(timezone=True))  # For fixed price contracts
    signed_date = Column(DateTime(timezone=True))
    description = Column(Text)
    terms = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    client = relationship("Client", back_populates="contracts")
    milestones = relationship("ContractMilestone", back_populates="contract", cascade="all, delete-orphan", order_by="ContractMilestone.order")


class ContractMilestone(Base):
    __tablename__ = "contract_milestones"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    amount = Column(Float, nullable=False)
    due_date = Column(DateTime(timezone=True))
    status = Column(String(50), default="Pending")  # Pending, In Progress, Completed, Paid
    order = Column(Integer, default=0)
    completed_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    contract = relationship("Contract", back_populates="milestones")


class ClientDocument(Base):
    __tablename__ = "client_documents"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    file_name = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    file_type = Column(String(100))  # pdf, docx, etc.
    file_size = Column(Integer)  # in bytes
    document_type = Column(String(100))  # SOW, Contract, Other, etc.
    uploaded_by = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    client = relationship("Client", back_populates="documents")


class ClientAdminAccount(Base):
    __tablename__ = "client_admin_accounts"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    service_name = Column(String(255), nullable=False)  # e.g., "AWS", "GitHub", "Stripe"
    account_type = Column(String(100))  # e.g., "Cloud Service", "Version Control", "Payment Gateway"
    username = Column(String(255))
    encrypted_password = Column(Text)  # Encrypted password
    url = Column(String(500))  # Login URL
    notes = Column(Text)
    tech_stack_category = Column(String(100))  # e.g., "Backend", "Frontend", "Database", "DevOps"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    client = relationship("Client", back_populates="admin_accounts")


class ClientTechStack(Base):
    __tablename__ = "client_tech_stack"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    technology = Column(String(255), nullable=False)  # e.g., "React", "Node.js", "PostgreSQL"
    category = Column(String(100))  # e.g., "Frontend", "Backend", "Database", "DevOps", "Tools"
    version = Column(String(50))  # Optional version info
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    client = relationship("Client", back_populates="tech_stack")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    name = Column(String(255))
    phone = Column(String(50))
    company = Column(String(255))
    bio = Column(Text)
    role = Column(String(100), default="Administrator")
    is_admin = Column(Boolean, default=False)  # True for admin users who bypass rate limits
    avatar_url = Column(String(500))
    theme_preference = Column(String(20), default="dark")  # 'light' or 'dark'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class BankConnection(Base):
    __tablename__ = "bank_connections"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(String(255), nullable=False)
    institution_name = Column(String(255), nullable=False)
    access_token = Column(Text, nullable=False)  # Encrypted in production!
    item_id = Column(String(255), nullable=False)
    status = Column(String(50), default="active")  # active, disconnected, error
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    debt_accounts = relationship("DebtAccount", back_populates="bank_connection", cascade="all, delete-orphan")


class DebtAccount(Base):
    __tablename__ = "debt_accounts"

    id = Column(Integer, primary_key=True, index=True)
    bank_connection_id = Column(Integer, ForeignKey("bank_connections.id"), nullable=True)
    owner = Column(String(50), nullable=False, default="user")  # Custom owner name (e.g., "John", "Jane", "You", "Wife")
    name = Column(String(255), nullable=False)
    account_type = Column(String(50), nullable=False)  # credit_card, loan, mortgage, line_of_credit
    institution_name = Column(String(255), nullable=False)
    original_balance = Column(Float, nullable=False)  # Original debt amount
    current_balance = Column(Float, nullable=False)
    interest_rate = Column(Float)  # Annual percentage rate
    minimum_payment = Column(Float)  # Actual minimum payment
    suggested_minimum_payment = Column(Float)  # AI-suggested minimum payment
    payment_terms = Column(Text)  # Payment terms description
    payment_link = Column(String(500))  # URL to make payments
    monthly_payment = Column(Float)  # Regular monthly payment amount
    due_date = Column(DateTime(timezone=True))
    plaid_account_id = Column(String(255))  # Plaid account ID if connected via Plaid
    is_paid_off = Column(Boolean, default=False)
    paid_off_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    bank_connection = relationship("BankConnection", back_populates="debt_accounts")
    payments = relationship("DebtPayment", back_populates="debt_account", cascade="all, delete-orphan", order_by="DebtPayment.payment_date.desc()")


class DebtPayment(Base):
    __tablename__ = "debt_payments"

    id = Column(Integer, primary_key=True, index=True)
    debt_account_id = Column(Integer, ForeignKey("debt_accounts.id"), nullable=False)
    payment_amount = Column(Float, nullable=False)
    payment_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    payment_type = Column(String(50), default="manual")  # minimum, custom, manual, plaid_sync
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    debt_account = relationship("DebtAccount", back_populates="payments")

