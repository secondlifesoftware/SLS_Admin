# Restart Instructions - Frontend Needs Restart

## ✅ Environment Variables Updated

**Frontend `.env`**:
```bash
REACT_APP_GOOGLE_CALENDAR_BOOKING_URL=https://calendar.app.google/SoFQjwwGeBL6PCzf6
```

**Backend `.env`**:
```bash
GOOGLE_CALENDAR_CREDENTIALS_JSON=./Keys/symmetric-lore-483621-h5-4740e8760538.json
GOOGLE_CALENDAR_ID=info@secondlifesoftware.com
GOOGLE_CALENDAR_IMPERSONATE_USER=info@secondlifesoftware.com
```

## 🔄 You Must Restart Frontend

React apps only read `.env` files when they start. You need to restart the frontend server for the new booking URL to take effect.

### Steps:

1. **Stop the frontend** (if running):
   - Press `Ctrl+C` in the terminal where `npm start` is running
   - Or kill the process: `lsof -ti:3000 | xargs kill -9`

2. **Restart the frontend**:
   ```bash
   cd frontend
   npm start
   ```

3. **Clear browser cache** (optional but recommended):
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or open in incognito/private window

4. **Test the booking button**:
   - Submit the booking form
   - Click "Book a Call"
   - Should now open: https://calendar.app.google/SoFQjwwGeBL6PCzf6

## 🧪 Verify the URL Works

Before testing in your app, verify the booking URL works directly:

1. Open in browser: https://calendar.app.google/SoFQjwwGeBL6PCzf6
2. You should see:
   - ✅ Available time slots
   - ✅ Calendar interface
   - ❌ NOT "Appointment not found"

If you still see "Appointment not found" when opening the URL directly:
- The appointment schedule might have been deleted
- The URL might be incorrect
- You may need to create a new appointment schedule

## 📝 Quick Checklist

- [ ] Frontend `.env` has correct booking URL
- [ ] Backend `.env` has correct service account path
- [ ] Frontend server restarted
- [ ] Browser cache cleared (or incognito mode)
- [ ] Booking URL works when opened directly in browser
- [ ] "Book a Call" button now works

