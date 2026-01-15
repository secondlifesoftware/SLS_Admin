 # Plaid Integration Setup Guide

This guide will help you set up Plaid integration for the ClearPath debt tracker to connect to banks.

## Supported Banks

Plaid supports connections to:
- ✅ **Wells Fargo**
- ✅ **Bank of America**
- ✅ **Chase**
- ✅ **Citi Bank**
- ✅ **American Express**
- ⚠️ **APCU (Atlanta Postal Credit Union)** - Check Plaid's institution list
- ⚠️ **Bilt** - Check Plaid's institution list

## Step 1: Create a Plaid Account

1. Go to [Plaid Dashboard](https://dashboard.plaid.com/signup)
2. Sign up for a free account
3. Verify your email address

## Step 2: Get Your API Keys

1. Log in to the [Plaid Dashboard](https://dashboard.plaid.com/)
2. Navigate to **Team Settings** → **Keys**
3. You'll see three environments:
   - **Sandbox** (for testing - FREE)
   - **Development** (for development - FREE)
   - **Production** (for live apps - requires approval)

4. Copy your **Client ID** and **Secret** for the **Sandbox** environment (to start)

## Step 3: Add Environment Variables

Add these to your `.env` file in the backend directory:

```env
# Plaid Configuration
PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_secret_here
PLAID_ENV=sandbox  # Options: sandbox, development, production
```

## Step 4: Install Dependencies

The Plaid Python SDK is already added to `requirements.txt`. Install it:

```bash
cd backend
pip install -r requirements.txt
```

## Step 5: Initialize Database

The new database tables (`bank_connections` and `debt_accounts`) will be created automatically when you start the backend server.

If you need to manually create them:

```bash
cd backend
python init_db.py
```

## Step 6: Test the Integration

1. Start your backend server:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. Test the link token endpoint:
   ```bash
   curl http://localhost:8000/api/debt-tracker/link-token
   ```

   You should receive a `link_token` in the response.

## Frontend Integration

The frontend will use Plaid Link (Plaid's JavaScript library) to connect banks. You'll need to:

1. Install Plaid Link in the frontend:
   ```bash
   cd frontend
   npm install react-plaid-link
   ```

2. The `IdeaDetail.js` component for ClearPath will include a "Connect Bank" button that opens Plaid Link.

## Sandbox Testing

In **Sandbox** mode, you can use these test credentials:

- **Username**: `user_good`
- **Password**: `pass_good`
- **Institution**: Search for any bank (Wells Fargo, Chase, etc.)

Plaid will return mock data for testing.

## Moving to Production

1. **Complete Plaid's onboarding**:
   - Go to Plaid Dashboard → **Onboarding**
   - Complete the required steps
   - Submit for production access

2. **Update environment variables**:
   ```env
   PLAID_ENV=production
   PLAID_CLIENT_ID=your_production_client_id
   PLAID_SECRET=your_production_secret
   ```

3. **Important Security Notes**:
   - In production, **encrypt** the `access_token` stored in the database
   - Use environment variables for all secrets
   - Never commit API keys to version control

## API Endpoints

The following endpoints are available:

- `GET /api/debt-tracker/link-token` - Create a Plaid Link token
- `POST /api/debt-tracker/exchange-public-token` - Exchange public token for access token
- `GET /api/debt-tracker/accounts` - Get all debt accounts
- `POST /api/debt-tracker/accounts` - Create a manual debt account
- `PUT /api/debt-tracker/accounts/{id}` - Update a debt account
- `DELETE /api/debt-tracker/accounts/{id}` - Delete a debt account
- `POST /api/debt-tracker/accounts/{id}/sync` - Sync balance from Plaid
- `GET /api/debt-tracker/summary` - Get total debt summary

## Troubleshooting

### "Plaid is not configured" error
- Check that `PLAID_CLIENT_ID` and `PLAID_SECRET` are set in your `.env` file
- Restart the backend server after adding environment variables

### "Institution not found"
- Some smaller credit unions may not be supported
- Check Plaid's [institution list](https://plaid.com/institutions/)
- You can always add accounts manually

### Connection fails
- Make sure you're using the correct environment (sandbox vs production)
- Check that your API keys match the environment
- Verify your Plaid account is active

## Resources

- [Plaid Documentation](https://plaid.com/docs/)
- [Plaid Dashboard](https://dashboard.plaid.com/)
- [Plaid Support](https://support.plaid.com/)

