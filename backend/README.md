# SLS Admin Backend API

FastAPI backend for the SLS Admin application.

## Setup

### Prerequisites
- Python 3.9 or higher
- pip (Python package manager)

### Installation Steps

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Upgrade pip (recommended):**
   ```bash
   pip install --upgrade pip
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   
   **Dependencies included:**
   - FastAPI - Web framework
   - Uvicorn - ASGI server
   - SQLAlchemy - Database ORM
   - Pydantic - Data validation
   - ReportLab - PDF generation
   - Cryptography - Password encryption
   - Email Validator - Email validation
   - Python-multipart - File upload support

4. **Initialize database:**
   ```bash
   python init_db.py
   ```
   This creates the SQLite database (`sls_admin.db`) with all necessary tables.

5. **Seed data (optional):**
   ```bash
   # Seed user profiles
   python seed_profiles.py
   
   # Seed clients with mock data
   python seed_clients.py
   
   # Seed invoices with mock data
   python seed_invoices.py
   ```
   
   **Note:** For user profiles, you may need to update the `firebase_uid` values with actual Firebase UIDs after users log in.

6. **Run the server:**
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

### Troubleshooting

**Missing dependencies error:**
If you see `ModuleNotFoundError` for any package, ensure you've activated the virtual environment and run:
```bash
pip install -r requirements.txt
```

**Port already in use:**
If port 8000 is already in use, you can specify a different port:
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

## Database

The application uses SQLite by default (stored in `sls_admin.db`). To use PostgreSQL or another database, set the `DATABASE_URL` environment variable:

```bash
export DATABASE_URL="postgresql://user:password@localhost/sls_admin"
```

## API Endpoints

### Clients
- `GET /api/clients/` - Get all clients
- `GET /api/clients/{id}` - Get client by ID
- `POST /api/clients/` - Create new client
- `PUT /api/clients/{id}` - Update client
- `DELETE /api/clients/{id}` - Delete client

### Invoices
- `GET /api/invoices/` - Get all invoices
- `GET /api/invoices/{id}` - Get invoice by ID
- `POST /api/invoices/` - Create new invoice
- `PUT /api/invoices/{id}` - Update invoice
- `DELETE /api/invoices/{id}` - Delete invoice

### Scope of Work
- `GET /api/scope-of-work/` - Get all scopes
- `GET /api/scope-of-work/{id}` - Get scope by ID
- `POST /api/scope-of-work/` - Create new scope
- `PUT /api/scope-of-work/{id}` - Update scope
- `DELETE /api/scope-of-work/{id}` - Delete scope

### User Profiles
- `GET /api/profiles/` - Get all profiles
- `GET /api/profiles/{id}` - Get profile by ID
- `GET /api/profiles/firebase/{uid}` - Get profile by Firebase UID
- `GET /api/profiles/email/{email}` - Get profile by email
- `POST /api/profiles/` - Create new profile
- `PUT /api/profiles/{id}` - Update profile
- `PUT /api/profiles/firebase/{uid}` - Update profile by Firebase UID
- `DELETE /api/profiles/{id}` - Delete profile

### Client Contacts
- `GET /api/client-contacts/client/{client_id}` - Get all contacts for a client
- `POST /api/client-contacts/` - Create new contact
- `PUT /api/client-contacts/{id}` - Update contact
- `DELETE /api/client-contacts/{id}` - Delete contact

### Client Notes
- `GET /api/client-notes/client/{client_id}` - Get all notes for a client
- `POST /api/client-notes/` - Create new note
- `PUT /api/client-notes/{id}` - Update note
- `DELETE /api/client-notes/{id}` - Delete note

### Client Timeline
- `GET /api/client-timeline/client/{client_id}` - Get timeline events for a client
- `POST /api/client-timeline/` - Create new timeline event
- `PUT /api/client-timeline/{id}` - Update timeline event
- `DELETE /api/client-timeline/{id}` - Delete timeline event

### Contracts
- `GET /api/contracts/client/{client_id}` - Get all contracts for a client
- `POST /api/contracts/` - Create new contract
- `PUT /api/contracts/{id}` - Update contract
- `DELETE /api/contracts/{id}` - Delete contract

### Time Entries
- `GET /api/time-entries/client/{client_id}` - Get time entries for a client
- `POST /api/time-entries/` - Create new time entry
- `PUT /api/time-entries/{id}` - Update time entry
- `DELETE /api/time-entries/{id}` - Delete time entry

### Client Documents
- `GET /api/client-documents/client/{client_id}` - Get all documents for a client
- `POST /api/client-documents/` - Upload new document
- `GET /api/client-documents/{id}/download` - Download document
- `PUT /api/client-documents/{id}` - Update document metadata
- `DELETE /api/client-documents/{id}` - Delete document

### Client Admin Accounts
- `GET /api/client-admin-accounts/client/{client_id}` - Get admin accounts for a client
- `POST /api/client-admin-accounts/` - Create new admin account
- `POST /api/client-admin-accounts/{id}/reveal-password` - Reveal encrypted password
- `PUT /api/client-admin-accounts/{id}` - Update admin account
- `DELETE /api/client-admin-accounts/{id}` - Delete admin account

### Client Tech Stack
- `GET /api/client-tech-stack/client/{client_id}` - Get tech stack for a client
- `POST /api/client-tech-stack/` - Create new tech stack entry
- `PUT /api/client-tech-stack/{id}` - Update tech stack entry
- `DELETE /api/client-tech-stack/{id}` - Delete tech stack entry

### Invoice Operations
- `GET /api/invoices/{id}/generate-pdf` - Generate PDF for invoice
- `GET /api/invoices/{id}/generate-csv` - Generate CSV for invoice
- `POST /api/invoices/{id}/finalize` - Finalize an invoice
- `POST /api/invoices/{id}/archive` - Archive an invoice

## Database Models

- **Client**: Company/client information with contacts, notes, timeline, contracts
- **Invoice**: Invoice documents with items and status tracking
- **InvoiceItem**: Line items (time entries) for invoices
- **ScopeOfWork**: Project scope documents
- **ScopeSection**: Sections within scope documents
- **UserProfile**: User profile information linked to Firebase
- **ClientContact**: Multiple points of contact per client
- **ClientNote**: Notes and meeting summaries
- **ClientTimeline**: Timeline events and milestones
- **Contract**: Contract information with milestones
- **ContractMilestone**: Milestones within contracts
- **ClientDocument**: Uploaded documents (SOWs, contracts, etc.)
- **ClientAdminAccount**: Encrypted admin account credentials
- **ClientTechStack**: Technology stack information

