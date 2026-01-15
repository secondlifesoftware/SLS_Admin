# Quick Setup - Google Calendar Integration

## ✅ Code Changes Made

1. Updated default calendar ID to use **Client Calls calendar** for both:
   - Event creation
   - Booking sync

## 📝 What You Need to Do

### 1. Update Backend Environment Variables

In `backend/.env`, update:

```bash
GOOGLE_CALENDAR_CREDENTIALS_JSON=./path/to/service-account.json
GOOGLE_CALENDAR_ID=c_0ea3bbd846411aab668246f1ff0309e4326ee7a6e49c899e432c68d946c53c74@group.calendar.google.com
GOOGLE_CALENDAR_IMPERSONATE_USER=info@secondlifesoftware.com
```

### 2. Share Client Calls Calendar with Service Account

Since you can't change service account settings for Client Calls calendar, share it:

1. Go to Google Calendar
2. Find **"Client Calls"** calendar
3. Click **three dots (⋮)** → **"Settings and sharing"**
4. Scroll to **"Share with specific people"**
5. Click **"Add people"**
6. Enter service account email: `sls-calendar-bot@your-project.iam.gserviceaccount.com`
   - Find this in: Google Cloud Console → IAM & Admin → Service Accounts
7. Set permission: **"Make changes to events"**
8. Click **"Send"**

### 3. Get Booking Page URL (NOT Embed URL)

The URLs you shared are **embed URLs** (for displaying calendars). You need the **booking page URL**:

**Option A: If you already created an appointment schedule**
1. Google Calendar → Settings (⚙️)
2. Click **"Appointment schedules"** in left menu
3. Click your schedule
4. Copy the **"Booking page"** URL (looks like `https://calendar.app.google/...`)

**Option B: Create new appointment schedule**
1. Google Calendar → Click **"+"** → **"Appointment schedule"**
2. **IMPORTANT**: Select **"Client Calls"** calendar from dropdown
3. Configure:
   - Name: "Client Consultation"
   - Duration: 30 min
   - Add attendees: katia@secondlifesoftware.com, darius@secondlifesoftware.com
4. Save and copy the **booking page URL**

### 4. Update Frontend Environment

In `frontend/.env`:

```bash
REACT_APP_GOOGLE_CALENDAR_BOOKING_URL=https://calendar.app.google/your-actual-booking-url-here
```

**Important**: This must be the booking page URL, NOT the embed URL.

### 5. Restart Servers

```bash
# Backend (if running)
# Kill and restart to pick up new env vars

# Frontend
cd frontend && npm start
```

## 🧪 Test

1. **Test sync**:
   ```bash
   curl -X POST http://localhost:8000/api/clients/sync-calendar-bookings
   ```

2. **Test booking button**:
   - Submit booking form
   - Click "Book a Call"
   - Should open booking page (not "Appointment not found")

3. **Test end-to-end**:
   - Book an appointment
   - Wait 5 minutes (scheduler runs automatically)
   - Check events: `curl http://localhost:8000/api/clients/calendar-events`

## ⚠️ Important Notes

- **Embed URL ≠ Booking URL**: The URLs you provided are for embedding calendars, not booking
- **Calendar Sharing**: You MUST share Client Calls calendar with service account
- **Appointment Schedule**: Must be created on the Client Calls calendar
- **Booking URL Format**: Should be `https://calendar.app.google/...` or `https://calendar.google.com/calendar/appointments/schedules/...`

