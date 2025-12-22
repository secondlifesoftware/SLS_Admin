# SLS Admin Backend API

FastAPI backend for the SLS Admin application.

## Setup

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Initialize database:**
   ```bash
   python init_db.py
   ```

4. **Seed user profiles (optional):**
   ```bash
   python seed_profiles.py
   ```
   This creates profiles for the specified users. Note: You may need to update the `firebase_uid` values with actual Firebase UIDs after users log in.

4. **Run the server:**
   ```bash
   uvicorn main:app --reload
   ```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

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

## Database Models

- **Client**: Company/client information
- **Invoice**: Invoice documents with items
- **InvoiceItem**: Line items for invoices
- **ScopeOfWork**: Project scope documents
- **ScopeSection**: Sections within scope documents
- **UserProfile**: User profile information linked to Firebase

