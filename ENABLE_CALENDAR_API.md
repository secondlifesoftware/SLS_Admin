# Enable Google Calendar API

## The Issue

You're getting this error:
```
Google Calendar API has not been used in project 436720837326 before or it is disabled.
```

## Quick Fix

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/apis/api/calendar-json.googleapis.com/overview?project=436720837326
   - Or go to: https://console.cloud.google.com → Select your project → APIs & Services → Library

2. **Enable Google Calendar API**:
   - Search for "Google Calendar API"
   - Click on it
   - Click **"Enable"** button
   - Wait 1-2 minutes for it to propagate

3. **Verify**:
   - Go to: APIs & Services → Enabled APIs
   - You should see "Google Calendar API" in the list

## Alternative: Direct Link

Click this link to enable it directly:
**https://console.cloud.google.com/apis/api/calendar-json.googleapis.com/overview?project=436720837326**

Then click the **"Enable"** button.

## After Enabling

1. Wait 1-2 minutes for the API to be fully enabled
2. Restart your backend server
3. Test again:
   ```bash
   curl -X POST http://localhost:8000/api/clients/sync-calendar-bookings
   ```

## Test the Service

After enabling, test:
```bash
cd backend
python3 -c "
from routers.clients import get_google_calendar_service
service = get_google_calendar_service()
calendars = service.calendarList().list().execute()
print(f'✅ Success! Found {len(calendars.get(\"items\", []))} calendars')
"
```

