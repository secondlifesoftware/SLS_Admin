# SLS Admin - Company Website & Admin Dashboard

A modern, full-stack web application for Second Life Software, built with React (frontend) and Python FastAPI (backend). The frontend uses Tailwind CSS for styling and Firebase for authentication. The admin dashboard includes comprehensive client management, invoice generation, and Scope of Work (SOW) creation with AI assistance.

## 🏗️ Project Structure

```
SLS_Admin/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── admin/     # Admin dashboard components
│   │   │   │   ├── ClientList.js
│   │   │   │   ├── ClientDetail.js
│   │   │   │   ├── ClientForm.js
│   │   │   │   ├── InvoiceGenerator.js
│   │   │   │   ├── InvoiceDetail.js
│   │   │   │   ├── CreateInvoiceWizard.js
│   │   │   │   ├── ScopeOfWorkGenerator.js
│   │   │   │   ├── ScopeOfWorkList.js
│   │   │   │   └── MyProfile.js
│   │   │   ├── Hero.js     # Hero section
│   │   │   ├── Services.js # Service cards carousel
│   │   │   ├── Admin.js    # Admin panel (Firebase auth)
│   │   │   └── Home.js     # Main home page component
│   │   ├── services/       # API service layer
│   │   │   └── api.js      # Centralized API client
│   │   ├── firebase.js     # Firebase configuration
│   │   ├── App.js          # Main app component with routing
│   │   └── index.js        # Entry point
│   ├── public/             # Static assets
│   ├── .env                # Environment variables (not in git)
│   ├── .env.example        # Environment variables template
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   ├── postcss.config.js   # PostCSS configuration
│   └── package.json        # Dependencies and scripts
├── backend/                # Python FastAPI backend
│   ├── main.py             # FastAPI application
│   ├── database.py         # Database configuration
│   ├── models.py           # SQLAlchemy ORM models
│   ├── schemas.py          # Pydantic schemas
│   ├── routers/            # API route handlers
│   │   ├── clients.py
│   │   ├── invoices.py
│   │   ├── scope_of_work.py
│   │   ├── expenses.py
│   │   └── ...
│   ├── utils/              # Utility functions
│   │   ├── pdf_generator.py
│   │   ├── sow_pdf_generator.py
│   │   ├── sow_templates.py
│   │   └── encryption.py
│   ├── .env                # Environment variables (not in git)
│   ├── .env.example        # Environment variables template
│   ├── requirements.txt    # Python dependencies
│   └── init_db.py          # Database initialization
├── demo/                   # Demo application (Git submodule)
│   └── [See demo/README.md for details]
├── docs/                   # Project documentation
│   ├── README.md           # Documentation index
│   ├── BUILD.md            # Build documentation
│   └── FIREBASE_SETUP.md   # Firebase setup guide
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **npm** or **yarn**
- **pip** or **poetry**

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your Firebase credentials and backend URL
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

   The frontend will be available at `http://localhost:3000`

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   
   **Note:** If you encounter any missing dependencies, ensure you have:
   - Python 3.9 or higher
   - pip updated to the latest version: `pip install --upgrade pip`

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your configuration (see Environment Variables section)
   ```

5. **Initialize database:**
   ```bash
   python init_db.py
   ```
   
   This creates the SQLite database file (`sls_admin.db`) with all necessary tables.

6. **Seed data (optional):**
   ```bash
   # Seed user profiles
   python seed_profiles.py
   
   # Seed clients with mock data
   python seed_clients.py
   
   # Seed invoices with mock data
   python seed_invoices.py
   
   # Seed expenses for invoices
   python seed_expenses.py
   ```

7. **Start the development server:**
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

   The backend API will be available at `http://localhost:8000`
   API documentation will be available at `http://localhost:8000/docs`

## 🛠️ Technology Stack

### Frontend
- **React 18.2** - UI library
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **React Router DOM 7.11** - Client-side routing
- **Firebase 12.7** - Authentication and analytics
- **React Icons 4.12** - Icon library
- **date-fns** - Date formatting utilities

### Backend
- **FastAPI 0.104** - Modern Python web framework
- **Uvicorn** - ASGI server
- **Pydantic 2.5** - Data validation
- **SQLAlchemy 2.0** - ORM and database toolkit
- **Python-dotenv** - Environment variable management
- **ReportLab** - PDF generation for invoices and SOWs
- **Cryptography** - Password encryption for client admin accounts
- **Email Validator** - Email validation for Pydantic
- **Python-multipart** - File upload support
- **OpenAI** (optional) - AI-powered SOW generation

## 📦 Build Process

### Development Build

```bash
cd frontend
npm start
```

This runs the app in development mode with hot-reload enabled.

### Production Build

```bash
cd frontend
npm run build
```

This creates an optimized production build in the `build/` folder.

## 🔐 Environment Variables

### Frontend Environment Variables

Copy `frontend/.env.example` to `frontend/.env` and fill in your values:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Backend API URL
REACT_APP_BACKEND_API_URL=http://localhost:8000

# Demo Application URL (optional)
REACT_APP_DEMO_URL=http://localhost:5173
```

### Backend Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your values:

```env
# Database Configuration (optional - defaults to SQLite)
DATABASE_URL=sqlite:///./sls_admin.db

# Encryption Key for Client Admin Account Passwords (optional - auto-generates)
ENCRYPTION_KEY=

# OpenAI API Key (optional - for AI SOW generation)
# Get your key from: https://platform.openai.com/api-keys
# Format: sk-proj-... (starts with "sk-")
OPENAI_API_KEY=sk-your-actual-api-key-here

# CORS Origins (optional - defaults to localhost:3000)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

**⚠️ Important:** The OpenAI API key goes in `backend/.env`, NOT in `frontend/.env`. The backend server reads it directly.

**⚠️ Important:** Never commit `.env` files to version control. They are already in `.gitignore`.

## 🤖 AI-Powered SOW Generation

The Scope of Work generator includes optional AI integration using OpenAI to automatically generate comprehensive SOW content based on client information.

### Setup AI Integration

1. **Get OpenAI API Key:**
   - Sign up at [OpenAI Platform](https://platform.openai.com/)
   - Navigate to [API Keys](https://platform.openai.com/api-keys)
   - Create a new API key (format: `sk-proj-...`)

2. **Add to Backend .env File:**
   ```bash
   cd backend
   # Edit .env file (create it if it doesn't exist)
   # Add this line:
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
   
   **Important:** The key goes in `backend/.env`, NOT `frontend/.env`

3. **Install OpenAI Package:**
   ```bash
   cd backend
   pip install openai
   ```

4. **Uncomment in requirements.txt:**
   ```txt
   openai>=1.0.0
   ```

5. **Restart Backend Server:**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

### How AI SOW Generation Works

- **Single API Call:** Makes ONE comprehensive API call (not 19 separate calls)
- **Context-Aware:** Passes all client context in one prompt:
  - Client information (name, company, email, address)
  - Tech stack
  - Existing contracts
  - Recent project notes
  - Project details (title, dates, milestones)
- **No RAG Needed:** Structured data fits in the prompt
- **Cost-Effective:** Uses GPT-4o-mini (~$0.15 per SOW)
- **Fallback:** Automatically falls back to templates if AI is unavailable

### Using AI in SOW Generator

1. Navigate to `/admin/scope`
2. Click "Generate New SOW"
3. Select client and fill in project details
4. In Step 3 (Edit Sections), click "Generate with AI" button
5. Review and customize the AI-generated sections

**Note:** The AI focuses on the 9 customizable sections. Standard legal boilerplate sections use templates.

## 📋 Features

### Client Management
- Complete CRM functionality
- Client profiles with contacts, notes, timeline
- Contract management (Fixed Price, Milestone-Based)
- Tech stack tracking
- Admin account management with encrypted passwords
- Document storage and management

### Invoice Generation
- Time entry tracking
- Expense tracking
- Invoice creation wizard
- PDF and CSV export
- Invoice finalization and archiving
- Automatic invoice numbering

### Scope of Work (SOW) Generator
- 19 required sections (9 customizable, 10 standardized)
- Client-specific prepopulation
- AI-powered content generation (optional)
- Milestone management
- PDF export for client signature
- SOW versioning and status tracking

### Security
- Firebase authentication for admin access
- Encrypted password storage for client admin accounts
- Automatic logout after 10 minutes of inactivity
- Environment variable-based configuration
- No hardcoded credentials

## 🔥 Firebase Integration

Firebase is used for:
- **Authentication** - Admin panel login (`/admin` route)
- **Analytics** - User behavior tracking

See `docs/FIREBASE_SETUP.md` for detailed setup instructions.

## 📱 Routes

### Public Routes
- `/` - Home page
- `/demo` - Demo application redirect

### Admin Routes (Requires Authentication)
- `/admin` - Admin dashboard (redirects to `/admin/clients`)
- `/admin/clients` - Client list
- `/admin/clients/new` - Create new client
- `/admin/clients/:id` - Client detail view
- `/admin/clients/:id/edit` - Edit client
- `/admin/clients/:id/invoices` - Client invoices
- `/admin/invoices` - Invoice list
- `/admin/invoices/create` - Create invoice wizard
- `/admin/invoices/:id` - Invoice detail
- `/admin/scope` - SOW list
- `/admin/scope/create` - SOW generator
- `/admin/profile` - User profile

## 🔐 Accessing the Admin Page

### How to Access

1. **Start the frontend development server:**
   ```bash
   cd frontend
   npm start
   ```

2. **Navigate to the admin page:**
   - Open your browser and go to: `http://localhost:3000/admin`
   - Or click any link/navigation that routes to `/admin`

3. **Login with Firebase:**
   - The admin page requires Firebase authentication
   - You'll need to log in with an email/password that has been set up in Firebase
   - See [Firebase Setup](./docs/FIREBASE_SETUP.md) for instructions on creating admin users

### Admin Authentication

- **Authentication Method:** Firebase Email/Password
- **Required Setup:** Admin users must be created in Firebase Console
- **Security:** Only users with valid Firebase credentials can access the admin panel
- **Session Management:** Automatic logout after 10 minutes of inactivity

### Setting Up Admin Users

To create admin users, follow the steps in [Firebase Setup Guide](./docs/FIREBASE_SETUP.md):
1. Enable Email/Password authentication in Firebase Console
2. Create admin users in Firebase Authentication
3. Use those credentials to log in at `/admin`

## 🧪 Testing

```bash
cd frontend
npm test
```

## 🎨 Demo Application

This repository includes a demo application as a Git submodule located in the `demo/` directory. The demo showcases various UI/UX patterns and component libraries.

### Accessing the Demo

The demo is available as a separate application. To run it:

```bash
cd demo
npm install
npm run dev
```

The demo will be available at `http://localhost:5173` (or the port specified by Vite).

### Working with the Submodule

**Initial Setup (for new clones):**
```bash
git submodule update --init --recursive
```

**Updating the Demo:**
```bash
cd demo
git pull origin main
cd ..
git add demo
git commit -m "Update demo submodule"
```

**For more information:** See [demo/README.md](./demo/README.md)

## 🔒 Security Best Practices

### Code Review Summary

✅ **No Hardcoded Credentials Found:**
- All API keys use environment variables
- Firebase config loaded from `.env`
- Database URLs use environment variables
- Encryption keys stored securely

✅ **Sensitive Files Ignored:**
- `.env` files in `.gitignore`
- `encryption_key.key` in `.gitignore`
- Database files excluded

✅ **Security Features:**
- Password encryption for client admin accounts
- Firebase authentication for admin access
- Automatic session timeout
- CORS configuration

### What to Never Commit

- `.env` files (frontend and backend)
- `encryption_key.key` file
- Database files (`*.db`)
- API keys or secrets
- Firebase service account keys

## 📚 Documentation

- [Build Documentation](./docs/BUILD.md) - Detailed build process
- [Firebase Setup](./docs/FIREBASE_SETUP.md) - Firebase configuration guide
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment instructions

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Ensure all tests pass
4. Submit a pull request

## 📄 License

[Add your license here]
