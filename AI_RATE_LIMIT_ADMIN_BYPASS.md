# AI Rate Limiting with Admin Bypass

## Overview
The AI/LLM features (SOW generation) now include rate limiting that admin users can bypass.

## Changes Made

### 1. Database Schema
- Added `is_admin` column to `user_profiles` table
- Admin users are marked with `is_admin = 1`

### 2. Backend Changes

#### `backend/models.py`
- Added `is_admin` field to `UserProfile` model

#### `backend/utils/rate_limiter.py`
- Updated `RateLimiter.check_rate_limit()` to accept `user_email` and `is_admin` parameters
- Admin users bypass rate limiting entirely
- Added `ADMIN_EMAILS` list:
  - `dks1018@gmail.com`
  - `info@secondlifesoftware.com`

#### `backend/routers/scope_of_work.py`
- Updated all AI endpoints to accept `user_email` parameter:
  - `/ai/generate-sow`
  - `/ai/regenerate-section`
  - `/{scope_id}/ai/regenerate-full`
- Rate limit checks now pass user email

### 3. Frontend Changes

#### `frontend/src/services/api.js`
- Updated `scopeOfWorkAPI.generateWithAI()` to accept `userEmail`
- Updated `scopeOfWorkAPI.regenerateSection()` to accept `userEmail`
- Updated `scopeOfWorkAPI.regenerateFull()` to accept `userEmail`
- User email is passed as query parameter

#### Component Updates
- `ScopeOfWorkGenerator.js`: Gets current user email and passes to API
- `ScopeOfWorkEdit.js`: Gets current user email and passes to API
- `ScopeOfWorkList.js`: Gets current user email and passes to API

### 4. Migration Scripts

#### `backend/add_admin_column.py`
- Adds `is_admin` column to database
- Marks specified users as admins
- Run with: `python3 add_admin_column.py`

#### `backend/update_admin_flag.py`
- Updates existing users' admin status
- Can be run anytime to add new admin users

## How It Works

1. **Regular Users**: 
   - Limited to 3 AI generations
   - 5-minute cooldown after hitting limit
   
2. **Admin Users** (dks1018@gmail.com, etc.):
   - Unlimited AI generations
   - No cooldown period
   - Bypass all rate limiting

3. **Admin Detection**:
   - Checks `user_email` against `ADMIN_EMAILS` list
   - OR checks `is_admin` flag in database
   - Either method grants admin privileges

## Adding New Admin Users

### Method 1: Update ADMIN_EMAILS List
Edit `backend/utils/rate_limiter.py`:
```python
ADMIN_EMAILS = [
    "dks1018@gmail.com",
    "info@secondlifesoftware.com",
    "new_admin@example.com"  # Add here
]
```

### Method 2: Update Database
Run the migration script:
```bash
cd backend
python3 add_admin_column.py
```

Or manually update the database:
```sql
UPDATE user_profiles SET is_admin = 1 WHERE email = 'new_admin@example.com';
```

## Testing

1. **As Admin User** (dks1018@gmail.com):
   - Log into admin panel
   - Generate SOW with AI
   - Should work unlimited times
   - No rate limit warnings

2. **As Regular User**:
   - Use different email
   - Generate SOW 3 times
   - 4th attempt should show rate limit error
   - Wait 5 minutes to reset

## Notes

- Rate limiting is per-instance (resets when backend restarts)
- Admin bypass works for ALL AI features
- User email is automatically detected from Firebase auth
- No changes needed to existing admin workflows
