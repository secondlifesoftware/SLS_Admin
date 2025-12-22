from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import clients, invoices, scope_of_work, profiles

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SLS Admin API",
    description="Backend API for SLS Admin company website",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(clients.router)
app.include_router(invoices.router)
app.include_router(scope_of_work.router)
app.include_router(profiles.router)


@app.get("/")
async def root():
    return {"message": "Welcome to SLS Admin API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

