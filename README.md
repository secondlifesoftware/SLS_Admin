# SLS Admin - Company Website

A full-stack web application for the company website, built with React (frontend) and Python FastAPI (backend).

## Project Structure

```
SLS_Admin/
├── frontend/          # React frontend application
├── backend/           # Python FastAPI backend application
├── docs/              # Project documentation
└── README.md          # This file
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.9 or higher)
- npm or yarn
- pip or poetry

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend API will be available at `http://localhost:8000`
API documentation will be available at `http://localhost:8000/docs`

## Development

### Frontend Development
- React application with modern tooling
- Located in `frontend/` directory

### Backend Development
- FastAPI REST API
- Located in `backend/` directory

## Documentation

Additional documentation can be found in the `docs/` folder.

## License

[Add your license here]

