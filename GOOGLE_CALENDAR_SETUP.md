# Google Calendar Integration Setup Guide

This guide will help you set up Google Calendar integration for the "Book a Call" feature.

## Overview

The integration allows clients to book calls through Google Calendar Appointment Schedules. When they book, the system can automatically:
- Add client information to the meeting
- Include Katia and Darius as attendees
- Add project description to meeting notes
- Send calendar invites to all participants

## Option 1: Simple Setup (Recommended for Start)

Use Google Calendar's built-in Appointment Schedules feature. This is the simplest approach.

### Steps:

1. **Create an Appointment Schedule in Google Calendar:**
   - Go to [Google Calendar](https://calendar.google.com)
   - Click the "+" button and select "Appointment schedule"
   - Configure your availability:
     - Set your available hours
     - Set meeting duration (e.g., 30 minutes, 1 hour)
     - Set buffer time between meetings to prevent overlap
   - Add attendees:
     - Add `katia@secondlifesoftware.com` as an attendee
     - Add `darius@secondlifesoftware.com` as an attendee
   - Save the schedule

2. **Get Your Booking URL:**
   - After creating the schedule, Google will provide a booking page URL
   - It will look like: `https://calendar.app.google/...` or `https://calendar.google.com/calendar/appointments/schedules/...`
   - Copy this URL

3. **Add to Environment Variables:**
   - Add to `frontend/.env`:
     ```
     REACT_APP_GOOGLE_CALENDAR_BOOKING_URL=https://calendar.app.google/your-booking-url
     ```

4. **Customize Availability:**
   - In Google Calendar Appointment Schedule settings:
     - Set your working hours
     - Set days of the week you're available
     - Add buffer time (e.g., 15 minutes) between meetings to prevent overlap
     - Set minimum notice time (e.g., 2 hours in advance)

5. **Add Default Attendees:**
   - In the Appointment Schedule settings, add:
     - `katia@secondlifesoftware.com`
     - `darius@secondlifesoftware.com`
   - These will be automatically added to every booking

### Limitations:
- Custom information (project description, phone number) won't be automatically added
- You'll need to manually add this information after bookings

---

## Option 2: Full API Integration (Advanced)

This option allows automatic creation of calendar events with all custom information.

### Prerequisites:
1. Google Cloud Project
2. Google Calendar API enabled
3. Service Account credentials

### Steps:

1. **Create Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one
   - Enable "Google Calendar API"

2. **Create Service Account:**
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Name it (e.g., "sls-calendar-bot")
   - Grant it "Editor" role
   - Click "Done"

3. **Create and Download Credentials:**
   - Click on the service account you just created
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Select "JSON" format
   - Download the JSON file

4. **Share Calendar with Service Account:**
   - Open Google Calendar
   - Go to Settings > Settings for my calendars > [Your Calendar]
   - Under "Share with specific people", add the service account email (found in the JSON file, looks like `xxx@xxx.iam.gserviceaccount.com`)
   - Give it "Make changes to events" permission

5. **Add Credentials to Backend:**
   - Place the downloaded JSON file in the `backend/` directory
   - Add to `backend/.env`:
     ```
     GOOGLE_CALENDAR_CREDENTIALS_JSON=./path/to/credentials.json
     # OR paste the JSON content directly:
     # GOOGLE_CALENDAR_CREDENTIALS_JSON={"type":"service_account",...}
     GOOGLE_CALENDAR_ID=info@secondlifesoftware.com
     ```

6. **Install Dependencies:**
   ```bash
   cd backend
   source venv/bin/activate
   pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
   ```

7. **Restart Backend Server:**
   ```bash
   # Kill existing server
   lsof -ti:8000 | xargs kill -9
   
   # Restart
   cd backend && source venv/bin/activate && python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### API Endpoint:

The backend now has an endpoint to create calendar events:
```
POST /api/clients/{client_id}/create-calendar-event
```

This will automatically:
- Create a Google Calendar event
- Add client as attendee
- Add katia@secondlifesoftware.com and darius@secondlifesoftware.com as attendees
- Include project description and contact info in meeting notes
- Create Google Meet link
- Send invites to all attendees

---

## Preventing Overlapping Meetings

### In Google Calendar Appointment Schedules:
1. Go to your Appointment Schedule settings
2. Set "Buffer time" between meetings (e.g., 15 minutes)
3. Set "Minimum notice" (e.g., 2 hours in advance)
4. Set your available hours and days
5. Google Calendar will automatically prevent double-booking

### Using API (Option 2):
The API automatically checks for conflicts when creating events. If there's a conflict, it will return an error.

---

## Testing

1. **Test Appointment Schedule:**
   - Click "Book a Call" button in the success screen
   - Verify it opens your Google Calendar booking page
   - Book a test appointment
   - Verify attendees are added correctly

2. **Test API Integration (if using Option 2):**
   - Submit a booking request through the form
   - Click "Book a Call"
   - The system should create a calendar event with all information

---

## Troubleshooting

### "Google Calendar service not available"
- Check that `GOOGLE_CALENDAR_CREDENTIALS_JSON` is set in `backend/.env`
- Verify the JSON file path is correct
- Check that Google Calendar API is enabled in Google Cloud Console

### "Calendar ID not found"
- Verify `GOOGLE_CALENDAR_ID` is set to `info@secondlifesoftware.com`
- Ensure the service account has access to the calendar

### Events not being created
- Check backend logs for errors
- Verify service account has "Make changes to events" permission on the calendar
- Check that the calendar ID is correct

---

## Next Steps

1. Start with **Option 1** (Appointment Schedules) for simplicity
2. If you need automatic custom information, implement **Option 2** (API Integration)
3. Customize availability times in Google Calendar settings
4. Test the booking flow end-to-end

