# Deployment Guide

This guide covers production deployment options for the SLS Admin application and the demo application.

## 🏗️ Architecture Overview

The project consists of:
1. **Main Site** (`frontend/`) - React app with admin panel
2. **Backend API** (`backend/`) - FastAPI application
3. **Demo App** (`demo/`) - Separate Vite/React demo application (Git submodule)

## 📦 Deployment Options

### Option 1: Separate Netlify Sites (Recommended) ⭐

**Best for:** Independent deployments, separate domains, easier management

#### Main Site Deployment

1. **Connect to Netlify:**
   - Go to [Netlify](https://app.netlify.com)
   - Click "Add new site" > "Import an existing project"
   - Connect your GitHub repository: `secondlifesoftware/SLS_Admin`
   - Select the repository

2. **Configure Build Settings:**
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/build
   ```

3. **Environment Variables:**
   Add all your Firebase environment variables in Netlify:
   - `REACT_APP_FIREBASE_API_KEY`
   - `REACT_APP_FIREBASE_AUTH_DOMAIN`
   - `REACT_APP_FIREBASE_PROJECT_ID`
   - `REACT_APP_FIREBASE_STORAGE_BUCKET`
   - `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
   - `REACT_APP_FIREBASE_APP_ID`
   - `REACT_APP_FIREBASE_MEASUREMENT_ID`
   - `REACT_APP_API_URL` (your backend API URL)

4. **Custom Domain:**
   - Set up `secondlifesoftware.com` or your preferred domain

#### Demo Site Deployment

1. **Option A: Deploy from Submodule (Recommended)**
   - In Netlify, create a new site
   - Connect to the demo repository: `secondlifesoftware/sls_demo`
   - Netlify will automatically detect `netlify.toml`
   - Build settings are already configured

2. **Option B: Deploy from Monorepo**
   - Create a new Netlify site
   - Connect to `secondlifesoftware/SLS_Admin`
   - Configure build settings:
     ```
     Base directory: demo
     Build command: npm run build
     Publish directory: demo/dist
     ```
   - Note: You'll need to ensure submodules are initialized in Netlify

3. **Custom Domain:**
   - Set up `demo.secondlifesoftware.com` or `secondlifesoftware.com/demo`

#### Backend API Deployment

**Option A: Railway (Recommended for Python)**
1. Go to [Railway](https://railway.app)
2. Create new project
3. Connect GitHub repository
4. Select `backend/` directory
5. Railway auto-detects Python and installs dependencies
6. Set environment variables if needed
7. Get the deployment URL (e.g., `https://sls-api.railway.app`)

**Option B: Render**
1. Go to [Render](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Environment: Python 3

**Option C: Fly.io**
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. In `backend/` directory: `fly launch`
3. Follow prompts
4. Deploy: `fly deploy`

### Option 2: Single Netlify Site with Monorepo

**Best for:** Unified deployment, single domain, simpler setup

1. **Create `netlify.toml` in root:**
   ```toml
   [build]
     command = "cd frontend && npm install && npm run build"
     publish = "frontend/build"

   [[redirects]]
     from = "/demo/*"
     to = "https://demo.secondlifesoftware.com/:splat"
     status = 301
     force = true
   ```

2. **Deploy demo separately** (as in Option 1)

3. **Use redirects** to point `/demo` to the separate demo site

### Option 3: Vercel (Alternative to Netlify)

**Main Site:**
1. Install Vercel CLI: `npm i -g vercel`
2. In `frontend/` directory: `vercel`
3. Follow prompts
4. Set environment variables in Vercel dashboard

**Demo Site:**
1. In `demo/` directory: `vercel`
2. Configure separately

**Backend:**
- Use Railway, Render, or Fly.io (as above)

## 🔧 Configuration Steps

### 1. Update Environment Variables

**Frontend `.env.production`:**
```env
REACT_APP_FIREBASE_API_KEY=your-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
REACT_APP_API_URL=https://your-api-url.com
```

**Backend Environment Variables:**
```env
DATABASE_URL=your-database-url
CORS_ORIGINS=https://secondlifesoftware.com,https://demo.secondlifesoftware.com
```

### 2. Update Demo Link in Admin Dashboard

After deploying, update the demo link in `AdminDashboard.js`:

```javascript
<a
  href="https://demo.secondlifesoftware.com"  // Update this
  target="_blank"
  rel="noopener noreferrer"
  // ...
>
```

### 3. CORS Configuration

Update `backend/main.py` to allow your production domains:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Dev
        "https://secondlifesoftware.com",  # Production
        "https://demo.secondlifesoftware.com",  # Demo
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🚀 Quick Deploy Commands

### Netlify CLI

**Main Site:**
```bash
cd frontend
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

**Demo Site:**
```bash
cd demo
netlify init
netlify deploy --prod
```

### Vercel CLI

**Main Site:**
```bash
cd frontend
vercel --prod
```

**Demo Site:**
```bash
cd demo
vercel --prod
```

## 📝 Recommended Setup

For your use case, I recommend:

1. **Main Site**: Deploy `frontend/` to Netlify → `secondlifesoftware.com`
2. **Demo Site**: Deploy `demo/` to Netlify → `demo.secondlifesoftware.com`
3. **Backend API**: Deploy `backend/` to Railway → `api.secondlifesoftware.com`

This gives you:
- ✅ Independent deployments
- ✅ Separate scaling
- ✅ Easy updates
- ✅ Clean separation of concerns
- ✅ Better performance (CDN for frontends)

## 🔄 Continuous Deployment

Both Netlify and Vercel support automatic deployments:
- Push to `main` branch → Auto-deploy to production
- Push to other branches → Preview deployments

## 📊 Monitoring

Consider adding:
- **Netlify Analytics** - Track site performance
- **Sentry** - Error tracking
- **Google Analytics** - User analytics (already configured via Firebase)

## 🛠️ Troubleshooting

### Submodule Issues in Netlify

If deploying demo from monorepo, add to `netlify.toml`:
```toml
[build]
  command = "git submodule update --init --recursive && cd demo && npm install && npm run build"
```

### Build Failures

- Check Node.js version (Netlify uses 18 by default)
- Verify all environment variables are set
- Check build logs in Netlify dashboard

### CORS Errors

- Ensure backend CORS includes all frontend domains
- Check that API URL is correct in frontend environment variables

