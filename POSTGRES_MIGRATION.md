# PostgreSQL Migration Guide for Render

This guide will help you set up a PostgreSQL database in Render and migrate your data from SQLite.

## 🎯 Overview

Your backend is currently using SQLite (a file-based database). PostgreSQL is better for production because:
- **Scalable**: Handles multiple concurrent connections
- **Reliable**: Better data integrity and ACID compliance  
- **Cloud-ready**: Works seamlessly with Render and other cloud platforms
- **Feature-rich**: Advanced querying, indexing, and data types

---

## Step 1: Create PostgreSQL Database in Render

1. **Go to Render Dashboard**: https://dashboard.render.com

2. **Click "New +" → "PostgreSQL"**

3. **Configure the database:**
   - **Name**: `sls-admin-db` (or your preferred name)
   - **Database**: `sls_admin` (auto-generated)
   - **User**: `sls_admin` (auto-generated)
   - **Region**: Same as your web service (Oregon US West)
   - **PostgreSQL Version**: 16 (latest)
   - **Plan**: 
     - **Free** (for testing) - 90 days free, then $7/month
     - **Starter** ($7/month) - 256 MB RAM, good for small apps
     - **Standard** ($20/month) - 1 GB RAM, better for production

4. **Click "Create Database"**

5. **Wait 2-3 minutes** for the database to be created

---

## Step 2: Get Database Connection String

After your PostgreSQL database is created:

1. **Go to your database dashboard** in Render

2. **Find "Connections"** section

3. **Copy the "Internal Database URL"** (looks like):
   ```
   postgresql://sls_admin:PASSWORD@dpg-xxxxx-a.oregon-postgres.render.com/sls_admin_xxxx
   ```

4. **Important**: Use the **Internal URL** (faster and free within Render) not the External URL

---

## Step 3: Update Backend Environment Variables

1. **Go to your Backend Web Service** in Render

2. **Go to "Environment" tab**

3. **Add/Update** the `DATABASE_URL` variable:
   - **Key**: `DATABASE_URL`
   - **Value**: `postgresql://sls_admin:PASSWORD@dpg-xxxxx-a.oregon-postgres.render.com/sls_admin_xxxx`
   (paste the Internal Database URL you copied)

4. **Click "Save Changes"**

5. **Render will automatically redeploy** your backend

6. **Wait for deployment** to complete (check logs)

---

## Step 4: Verify PostgreSQL Connection

Once your backend is redeployed:

1. **Check the deployment logs** in Render:
   - Look for "Application startup complete"
   - No database connection errors

2. **Test the API**:
   ```bash
   curl https://sls-admin.onrender.com/health
   ```
   
   Should return: `{"status":"healthy"}`

3. **Check scheduler status** (should work without errors):
   ```bash
   curl https://sls-admin.onrender.com/scheduler/status
   ```

---

## Step 5: Migrate Data from SQLite (Optional)

If you have existing data in SQLite that you want to migrate:

### Option A: Run Migration Script Locally

1. **Install PostgreSQL driver** (if not done):
   ```bash
   cd backend
   pip install psycopg2-binary==2.9.10
   ```

2. **Set environment variables**:
   ```bash
   export POSTGRES_URL="postgresql://sls_admin:PASSWORD@dpg-xxxxx-a.oregon-postgres.render.com/sls_admin_xxxx"
   export SQLITE_URL="sqlite:///./sls_admin.db"
   ```
   
   Replace the POSTGRES_URL with your **External Database URL** from Render (for remote access)

3. **Run migration script**:
   ```bash
   python migrate_to_postgres.py
   ```

4. **Verify** the migration completed successfully

### Option B: Manual Fresh Start

If you don't have critical data, you can start fresh:

1. **Your PostgreSQL database is empty** - that's fine!
2. **Tables will be auto-created** when your backend starts
3. **Add data through the admin panel** as needed

---

## Step 6: Update Frontend API URL (if needed)

Your frontend should already be pointing to:
```
REACT_APP_API_URL=https://sls-admin.onrender.com
```

No changes needed - the API URL stays the same!

---

## 🎉 You're Done!

Your app is now using PostgreSQL! Here's what changed:

✅ **Before**: SQLite (file-based, single connection)  
✅ **After**: PostgreSQL (cloud database, scalable)

### Benefits:
- **No more database file** to manage
- **Better performance** under load
- **Automatic backups** (on paid Render plans)
- **Scalable** as your app grows
- **Production-ready** infrastructure

---

## 🔍 Troubleshooting

### Connection Errors

**Error**: `could not connect to server`
- ✅ Check that `DATABASE_URL` is set correctly in Render
- ✅ Use the **Internal Database URL**, not External (unless connecting from outside Render)
- ✅ Verify database is in "Available" status in Render dashboard

### Migration Issues

**Error**: `relation does not exist`
- ✅ Make sure tables are created (they auto-create on first startup)
- ✅ Check that your backend has redeployed successfully

### Slow Performance

- ✅ Consider upgrading to Starter or Standard database plan
- ✅ Add database indexes if needed (already configured in models)
- ✅ Upgrade web service instance for more RAM/CPU

---

## 📊 Database Management

### Viewing Data

Use **Render's built-in database viewer**:
1. Go to your database in Render
2. Click "Connect" tab
3. Use the provided connection string with tools like:
   - **DBeaver** (free, GUI)
   - **pgAdmin** (free, GUI)
   - **psql** (command-line)

### Backups

Render automatically backs up your database:
- **Free plan**: No automatic backups
- **Starter plan ($7/mo)**: Daily backups, 7-day retention
- **Standard plan ($20/mo)**: Daily backups, 14-day retention

### Monitoring

Monitor your database in Render dashboard:
- Connection count
- Database size
- Query performance
- CPU/Memory usage

---

## 💰 Cost Summary

| Item | Free | Starter | Standard |
|------|------|---------|----------|
| **PostgreSQL Database** | 90 days free | $7/month | $20/month |
| **Backend Web Service** | Free (spins down) | $7/month | $25/month |
| **Frontend (Netlify)** | Free | Free | Free |
| **Total** | Free | $14/month | $45/month |

**Recommended for production**: Starter plan ($14/month total)

---

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs/databases
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org/

---

## 📝 Next Steps

After PostgreSQL is set up:

1. ✅ Test all admin panel features
2. ✅ Create a few test clients/invoices
3. ✅ Verify Google Calendar sync works
4. ✅ Test PDF generation (invoices/SOWs)
5. ✅ Check that all CRUD operations work
6. ✅ Monitor performance in Render dashboard

Congratulations! Your app is now production-ready! 🚀
