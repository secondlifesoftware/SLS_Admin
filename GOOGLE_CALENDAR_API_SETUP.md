# Google Calendar API Integration - Complete Setup Guide

## What You've Already Done ✅

1. ✅ Created service account in Google Cloud Console
2. ✅ Enabled domain-wide delegation
3. ✅ Added service account to Admin Console with Client ID and scope
4. ✅ Created Google Calendar booking page in UI
5. ✅ Added service account to calendar sharing

## What You Need to Do Now

### 1. Environment Variables

Add these to your `backend/.env` file:

```bash
# Google Calendar API Configuration
GOOGLE_CALENDAR_CREDENTIALS_JSON=./path/to/your-service-account.json
# OR paste the JSON content directly (if using environment variable):
# GOOGLE_CALENDAR_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}

# Calendar to sync (usually your main calendar)
GOOGLE_CALENDAR_ID=info@secondlifesoftware.com

# User to impersonate (must match calendar owner)
GOOGLE_CALENDAR_IMPERSONATE_USER=info@secondlifesoftware.com
```

### 2. Database Migration

The code adds a new `calendar_events` table. Run this to create it:

```bash
cd backend
python3 -c "
from database import engine, Base
from models import CalendarEvent
Base.metadata.create_all(bind=engine, tables=[CalendarEvent.__table__])
print('✅ CalendarEvent table created')
"
```

Or if you have Alembic set up, create a migration.

### 3. Test the Integration

#### Test 1: Verify Service Account Connection

```bash
# In Python shell or create a test script
python3 -c "
from routers.clients import get_google_calendar_service
service = get_google_calendar_service()
if service:
    print('✅ Google Calendar service initialized successfully')
    # Try to list calendars
    calendars = service.calendarList().list().execute()
    print(f'Found {len(calendars.get(\"items\", []))} calendars')
else:
    print('❌ Failed to initialize service')
"
```

#### Test 2: Manual Sync

Call the sync endpoint:

```bash
curl -X POST http://localhost:8000/api/clients/sync-calendar-bookings
```

Or use the FastAPI docs at `http://localhost:8000/docs`

### 4. Set Up Automatic Syncing

You have two options:

#### Option A: Scheduled Task (Recommended)

Create a simple cron job or scheduled task that calls the sync endpoint every 5 minutes:

```bash
# Add to crontab (crontab -e)
*/5 * * * * curl -X POST http://localhost:8000/api/clients/sync-calendar-bookings
```

#### Option B: Background Task in FastAPI

You can use APScheduler or similar to run the sync periodically:

```python
# In main.py or a separate scheduler file
from apscheduler.schedulers.background import BackgroundScheduler
from routers.clients import sync_calendar_bookings
from database import SessionLocal

def scheduled_sync():
    db = SessionLocal()
    try:
        sync_calendar_bookings(db)
    finally:
        db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(scheduled_sync, 'interval', minutes=5)
scheduler.start()
```

## How It Works

1. **Client submits booking form** → Creates/updates client in CRM
2. **Client clicks "Book a Call"** → Opens Google Calendar booking page
3. **Client books a time** → Google creates a calendar event
4. **Your backend syncs** (every 5 minutes):
   - Fetches new events from Google Calendar
   - Matches events to clients by email address
   - Stores event details in `calendar_events` table
   - Creates a note on the client record
5. **Event is linked** → You can see the booking in the client's record

## API Endpoints

### Sync Calendar Bookings
```
POST /api/clients/sync-calendar-bookings
```
Polls Google Calendar and matches events to clients.

### Get Calendar Events
```
GET /api/clients/calendar-events?client_id=123
```
Returns calendar events, optionally filtered by client.

## Matching Logic

Events are matched to clients by:
1. **Primary email match**: Event attendee email matches `clients.email`
2. **Contact email match**: Event attendee email matches `client_contacts.email`

**Important**: Make sure clients use the **same email** in the booking form and when booking on Google Calendar.

## Troubleshooting

### "Google Calendar service not available"
- Check `GOOGLE_CALENDAR_CREDENTIALS_JSON` is set correctly
- Verify the JSON file path is correct or JSON is valid
- Check that domain-wide delegation is enabled

### "403 Forbidden" or "Insufficient permissions"
- Verify domain-wide delegation is set up in Admin Console
- Check that the Client ID matches the OAuth 2 Client ID from Cloud Console
- Ensure the scope `https://www.googleapis.com/auth/calendar` is added
- Verify `GOOGLE_CALENDAR_IMPERSONATE_USER` matches the calendar owner

### Events not matching to clients
- Check that the email in the calendar event matches the client email
- Verify emails are case-insensitive (code handles this)
- Check backend logs for matching messages

### Events not appearing
- Verify the calendar ID is correct (`GOOGLE_CALENDAR_ID`)
- Check that events are being created on the correct calendar
- Verify the time range (syncs last 24 hours to next 30 days)

## Next Steps

1. ✅ Set environment variables
2. ✅ Run database migration
3. ✅ Test the sync endpoint
4. ✅ Set up automatic syncing (cron or scheduler)
5. ✅ Test end-to-end: Submit form → Book on Google → Verify sync

## Example Response

When you call the sync endpoint, you'll get:

```json
{
  "message": "Calendar sync completed",
  "events_found": 5,
  "events_synced": 3,
  "events_created": 2,
  "events_matched": 2
}
```

This tells you:
- How many events Google returned
- How many were updated (already existed)
- How many new events were created
- How many were matched to clients

