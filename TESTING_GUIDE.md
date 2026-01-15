# Testing Guide - Google Calendar Integration

## ✅ What's Been Set Up

1. **Background Scheduler**: Running every 5 minutes to sync calendar bookings
2. **Sync Endpoint**: `/api/clients/sync-calendar-bookings` 
3. **Database Table**: `calendar_events` created
4. **Scheduler Status Endpoint**: `/scheduler/status`

## 🧪 Testing Steps

### 1. Check Scheduler Status

```bash
curl http://localhost:8000/scheduler/status
```

You should see:
```json
{
  "running": true,
  "jobs": [
    {
      "id": "calendar_sync_job",
      "name": "Sync Google Calendar Bookings",
      "next_run": "2026-01-08 00:17:54..."
    }
  ]
}
```

### 2. Test Manual Sync

```bash
curl -X POST http://localhost:8000/api/clients/sync-calendar-bookings
```

**Expected Results:**
- If credentials are configured: Returns sync results
- If not configured: Returns error about missing credentials

### 3. Fix "Book a Call" Button

The "Appointment not found" error means you need to:

1. **Go to Google Calendar**: https://calendar.google.com
2. **Click "+" → "Appointment schedule"**
3. **Create your schedule** with:
   - Name: "Client Consultation"
   - Duration: 30 minutes
   - Your available hours
   - Add attendees: katia@secondlifesoftware.com, darius@secondlifesoftware.com
4. **Copy the booking page URL** (looks like `https://calendar.app.google/...`)
5. **Add to `frontend/.env`**:
   ```
   REACT_APP_GOOGLE_CALENDAR_BOOKING_URL=https://calendar.app.google/your-actual-url
   ```
6. **Restart frontend**: `npm start`

### 4. Test End-to-End Flow

1. Submit booking form on website
2. Click "Book a Call" button
3. Should open Google Calendar booking page (not "Appointment not found")
4. Book a test appointment
5. Wait 5 minutes (or manually trigger sync)
6. Check if event appears in database:
   ```bash
   curl http://localhost:8000/api/clients/calendar-events
   ```

## 🔍 Troubleshooting

### Scheduler Not Running
- Check backend logs for startup messages
- Verify `apscheduler` is installed
- Check `/scheduler/status` endpoint

### Sync Failing
- Verify `GOOGLE_CALENDAR_CREDENTIALS_JSON` is set in `backend/.env`
- Check domain-wide delegation is configured
- Verify `GOOGLE_CALENDAR_IMPERSONATE_USER` matches calendar owner
- Check backend logs for detailed error messages

### "Appointment not found"
- The booking URL is incorrect or schedule was deleted
- Follow steps in `GET_BOOKING_URL.md` to create/get correct URL
- Make sure the URL is added to `frontend/.env`

### Events Not Matching
- Verify client email matches attendee email in calendar event
- Check backend logs for matching messages
- Events are matched by email (case-insensitive)

## 📝 Next Steps

1. ✅ Scheduler is running
2. ⏳ Get correct booking URL from Google Calendar
3. ⏳ Add URL to frontend/.env
4. ⏳ Test end-to-end flow
5. ⏳ Verify events sync and match to clients

