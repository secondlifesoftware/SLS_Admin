# How to Create and Find Your Appointment Schedule

## Why You Can't Change Permissions

The "Make changes to events" option is grayed out because:
- **Domain-wide delegation** handles permissions automatically
- You don't need to manually share the calendar
- The service account impersonates `info@secondlifesoftware.com`, so it has full access

## Finding Your Appointment Schedule

### Option 1: Check Existing Schedules

1. Go to Google Calendar: https://calendar.google.com
2. Click the **gear icon (⚙️)** in the top right
3. Click **"Settings"**
4. In the left sidebar, look for **"Appointment schedules"**
   - If you don't see it, you may need to scroll down
   - It's usually under "General" or "Settings for my calendars"
5. Click **"Appointment schedules"**
6. You should see a list of your schedules
7. Click on a schedule to see its **booking page URL**

### Option 2: Create New Appointment Schedule

If you don't have one yet:

1. Go to Google Calendar: https://calendar.google.com
2. Click the **"+"** button (or "Create" button)
3. Select **"Appointment schedule"**
4. **Make sure the calendar is set to**: `info@secondlifesoftware.com` (check the calendar dropdown)
5. Configure:
   - **Name**: "Client Consultation" or "Book a Call"
   - **Duration**: 30 minutes
   - **Available hours**: Set your working hours
   - **Days**: Select available days
   - **Buffer time**: 15 minutes (prevents overlap)
   - **Minimum notice**: 2 hours
6. **Add default attendees**:
   - Click "Add guests" or "Attendees"
   - Add: `katia@secondlifesoftware.com`
   - Add: `darius@secondlifesoftware.com`
7. Click **"Save"** or **"Create"**
8. **Copy the booking page URL** that appears
   - It will look like: `https://calendar.app.google/...`
   - Or: `https://calendar.google.com/calendar/appointments/schedules/...`

### Option 3: Check Calendar Settings

Sometimes the appointment schedule is in a different location:

1. Google Calendar → Settings
2. Click on **"Settings for my calendars"** in the left sidebar
3. Click on **"info@secondlifesoftware.com"** calendar
4. Look for **"Appointment schedules"** section
5. You should see your schedules listed there

## What the Booking URL Looks Like

**Correct booking URL formats:**
- `https://calendar.app.google/abc123def456`
- `https://calendar.google.com/calendar/appointments/schedules/AcZssZ0...`

**NOT these (these are embed URLs):**
- `https://calendar.google.com/calendar/embed?src=...`
- `https://calendar.google.com/calendar/u/0?cid=...`

## If You Still Can't Find It

1. **Check if you have the right Google Workspace plan**:
   - Appointment schedules are available on most plans
   - Some older accounts might not have access

2. **Try creating a new one**:
   - Even if you think you have one, create a fresh one
   - Make sure it's on the `info@secondlifesoftware.com` calendar

3. **Check mobile app**:
   - Sometimes it's easier to find in the Google Calendar mobile app
   - Settings → Appointment schedules

## Quick Test

Once you have the URL:
1. Open it in a browser (incognito/private window)
2. You should see a calendar with available time slots
3. If you see "Appointment not found", the URL is wrong

