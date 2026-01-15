# How to Get Your Google Calendar Booking URL

The "Appointment not found" error means the booking URL is incorrect or the appointment schedule doesn't exist yet.

## Steps to Get Your Booking URL:

1. **Go to Google Calendar**: https://calendar.google.com

2. **Create an Appointment Schedule**:
   - Click the **"+"** button (or "Create" button)
   - Select **"Appointment schedule"**
   
3. **Configure Your Schedule**:
   - **Name**: "Client Consultation" or "Book a Call"
   - **Duration**: 30 minutes (or your preferred length)
   - **Available hours**: Set your working hours
   - **Days**: Select which days you're available
   - **Buffer time**: 15 minutes between meetings (prevents overlap)
   - **Minimum notice**: 2 hours in advance
   
4. **Add Default Attendees**:
   - Click "Add guests" or "Attendees"
   - Add: `katia@secondlifesoftware.com`
   - Add: `darius@secondlifesoftware.com`
   - These will be automatically added to every booking

5. **Save and Get the Link**:
   - Click **"Save"** or **"Create"**
   - Google will show you a **booking page link**
   - It will look like: `https://calendar.app.google/...` or `https://calendar.google.com/calendar/appointments/schedules/...`
   - **Copy this URL**

6. **Add to Frontend Environment**:
   - Add to `frontend/.env`:
     ```
     REACT_APP_GOOGLE_CALENDAR_BOOKING_URL=https://calendar.app.google/your-actual-url-here
     ```
   - Restart your frontend server

## Alternative: If You Already Have a Schedule

If you already created an appointment schedule:

1. Go to Google Calendar
2. Click on the **gear icon** (Settings)
3. Go to **"Appointment schedules"** in the left menu
4. Find your schedule
5. Click on it to see the booking link
6. Copy the **"Booking page"** URL

## Quick Test

Once you have the URL, you can test it by:
1. Opening it in a browser
2. You should see a calendar with available time slots
3. If you see "Appointment not found", the URL is wrong or the schedule was deleted

