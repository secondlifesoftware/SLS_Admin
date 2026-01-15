from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import clients, invoices, scope_of_work, profiles, client_contacts, client_notes, client_timeline, contracts, time_entries, expenses, client_documents, client_admin_accounts, client_tech_stack, debt_tracker
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from database import SessionLocal
import atexit
import logging
import os

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SLS Admin API",
    description="Backend API for SLS Admin company website",
    version="0.1.0"
)

# Configure CORS
# Allow all origins in development (restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(clients.router)
app.include_router(invoices.router)
app.include_router(scope_of_work.router)
app.include_router(profiles.router)
app.include_router(client_contacts.router)
app.include_router(client_notes.router)
app.include_router(client_timeline.router)
app.include_router(contracts.router)
app.include_router(time_entries.router)
app.include_router(expenses.router)
app.include_router(client_documents.router)
app.include_router(client_admin_accounts.router)
app.include_router(client_tech_stack.router)
app.include_router(debt_tracker.router)


# Background scheduler for Google Calendar sync
def scheduled_calendar_sync():
    """Scheduled task to sync Google Calendar bookings"""
    # Only run if Google Calendar is configured
    if not os.getenv("GOOGLE_CALENDAR_CREDENTIALS_JSON"):
        print("[SCHEDULER] Skipping calendar sync - GOOGLE_CALENDAR_CREDENTIALS_JSON not configured")
        return
    
    db = SessionLocal()
    try:
        print("[SCHEDULER] Starting scheduled calendar sync...")
        result = clients.sync_calendar_bookings(db)
        print(f"[SCHEDULER] Sync completed: {result}")
    except Exception as e:
        print(f"[SCHEDULER] Error during calendar sync: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


# Initialize scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(
    scheduled_calendar_sync,
    trigger=IntervalTrigger(minutes=5),  # Run every 5 minutes
    id='calendar_sync_job',
    name='Sync Google Calendar Bookings',
    replace_existing=True
)

# Start scheduler when app starts
@app.on_event("startup")
async def startup_event():
    scheduler.start()
    print("✅ Background scheduler started - Calendar sync will run every 5 minutes")

# Shutdown scheduler when app stops
@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    print("⏹️  Background scheduler stopped")

# Also register shutdown handler for atexit
atexit.register(lambda: scheduler.shutdown() if scheduler.running else None)


@app.get("/")
async def root():
    return {"message": "Welcome to SLS Admin API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/scheduler/status")
async def scheduler_status():
    """Check scheduler status"""
    return {
        "running": scheduler.running,
        "jobs": [
            {
                "id": job.id,
                "name": job.name,
                "next_run": str(job.next_run_time) if job.next_run_time else None
            }
            for job in scheduler.get_jobs()
        ]
    }

