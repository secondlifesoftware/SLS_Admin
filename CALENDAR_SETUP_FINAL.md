# Final Calendar Setup Steps

## Current Situation

You have two calendars:
1. **Client Calls Calendar** (`c_0ea3bbd846411aab668246f1ff0309e4326ee7a6e49c899e432c68d946c53c74@group.calendar.google.com`)
   - This is where bookings should go
   - Service account settings can't be changed (but we can share the calendar)

2. **Main Calendar** (`info@secondlifesoftware.com`)
   - Service account already configured
   - This is your primary calendar

## What You Need to Do

### Step 1: Share Client Calls Calendar with Service Account

Since you can't change service account settings for the Client Calls calendar, you need to share it:

1. Go to Google Calendar: https://calendar.google.com
2. Find the **"Client Calls"** calendar in your calendar list
3. Click the **three dots** (⋮) next to the calendar name
4. Select **"Settings and sharing"**
5. Scroll down to **"Share with specific people"**
6. Click **"Add people"**
7. Enter your service account email: `sls-calendar-bot@your-project.iam.gserviceaccount.com`
   - (Find this in Google Cloud Console → IAM & Admin → Service Accounts)
8. Set permission to **"Make changes to events"**
9. Click **"Send"**

### Step 2: Get the Booking Page URL

The URLs you provided are **embed URLs** (for displaying calendars on websites), not **booking page URLs**.

To get the actual booking page URL:

1. Go to Google Calendar: https://calendar.google.com
2. Click the **gear icon** (⚙️) → **"Settings"**
3. In the left menu, click **"Appointment schedules"**
4. You should see your appointment schedule listed
5. Click on it to open
6. Look for **"Booking page"** section
7. Copy the URL (it will look like: `https://calendar.app.google/...` or `https://calendar.google.com/calendar/appointments/schedules/...`)

**OR** if you haven't created the appointment schedule yet:

1. In Google Calendar, click **"+"** → **"Appointment schedule"**
2. **Important**: Make sure you're creating it on the **Client Calls** calendar (select it from the calendar dropdown)
3. Configure:
   - Name: "Client Consultation"
   - Duration: 30 minutes
   - Available hours
   - Add attendees: katia@secondlifesoftware.com, darius@secondlifesoftware.com
4. Save and copy the booking page URL

### Step 3: Update Environment Variables

**Backend (`backend/.env`)**:
```bash
GOOGLE_CALENDAR_CREDENTIALS_JSON=./path/to/service-account.json
GOOGLE_CALENDAR_ID=c_0ea3bbd846411aab668246f1ff0309e4326ee7a6e49c899e432c68d946c53c74@group.calendar.google.com
GOOGLE_CALENDAR_IMPERSONATE_USER=info@secondlifesoftware.com
```

**Frontend (`frontend/.env`)**:
```bash
REACT_APP_GOOGLE_CALENDAR_BOOKING_URL=https://calendar.app.google/your-actual-booking-url-here
```

### Step 4: Restart Servers

```bash
# Backend
cd backend && source venv/bin/activate && python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend && npm start
```

## Code Changes Made

✅ Updated sync endpoint to use Client Calls calendar ID by default
✅ Updated event creation to use Client Calls calendar ID by default

## Testing

1. **Test sync**:
   ```bash
   curl -X POST http://localhost:8000/api/clients/sync-calendar-bookings
   ```

2. **Test booking page**:
   - Submit booking form
   - Click "Book a Call"
   - Should open booking page (not "Appointment not found")

3. **Test end-to-end**:
   - Book an appointment on Google Calendar
   - Wait 5 minutes (or trigger sync manually)
   - Check if event appears in database

## Troubleshooting

### "403 Forbidden" when syncing
- Make sure Client Calls calendar is shared with service account
- Verify service account email is correct
- Check that permission is "Make changes to events" or higher

### "Appointment not found"
- The booking URL is wrong - make sure you're using the booking page URL, not embed URL
- Verify the appointment schedule exists and is active
- Make sure the schedule is on the Client Calls calendar

### Events not syncing
- Check backend logs for errors
- Verify calendar ID is correct
- Make sure events are being created on the Client Calls calendar

