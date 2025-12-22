# Build Documentation

This document provides detailed information about how the SLS Admin project is built and structured.

## 📋 Table of Contents

- [Project Architecture](#project-architecture)
- [Frontend Build Process](#frontend-build-process)
- [Backend Build Process](#backend-build-process)
- [Dependencies](#dependencies)
- [Configuration Files](#configuration-files)
- [Environment Setup](#environment-setup)
- [Build Commands](#build-commands)

## 🏛️ Project Architecture

### Frontend Architecture

The frontend is a **React Single Page Application (SPA)** built with:

- **Create React App (CRA)** - Build tooling and development server
- **Tailwind CSS** - Utility-first CSS framework for styling
- **React Router** - Client-side routing
- **Firebase** - Authentication and analytics

### Component Structure

```
src/
├── components/
│   ├── Hero.js          # Hero section with headline and rocket emoji
│   ├── Services.js      # Service cards carousel with image-based cards
│   ├── About.js         # About section
│   ├── Technologies.js # Technologies showcase
│   ├── CTA.js          # Call-to-action section
│   ├── Footer.js       # Footer with company info
│   ├── Admin.js        # Admin panel (Firebase auth)
│   └── Home.js         # Main home page component
├── App.js              # Root component with routing
├── firebase.js         # Firebase initialization
└── index.js            # Application entry point
```

## 🔨 Frontend Build Process

### Development Build

The development build uses **react-scripts** which includes:

1. **Webpack** - Module bundler
2. **Babel** - JavaScript compiler
3. **PostCSS** - CSS processing (for Tailwind)
4. **Hot Module Replacement (HMR)** - Live reloading

**Command:**
```bash
npm start
```

**Process:**
1. Webpack compiles React components
2. PostCSS processes Tailwind CSS classes
3. Development server starts on `http://localhost:3000`
4. Changes trigger automatic rebuild and browser refresh

### Production Build

**Command:**
```bash
npm run build
```

**Process:**
1. **Optimization:**
   - JavaScript minification
   - CSS minification and purging (unused Tailwind classes removed)
   - Asset optimization (images, fonts)
   - Code splitting

2. **Output:**
   - Creates `build/` directory
   - Static HTML, CSS, and JavaScript files
   - Optimized for production deployment

### Tailwind CSS Build Process

1. **Scanning:** Tailwind scans all files in `src/` for class names
2. **Purging:** Unused classes are removed in production
3. **Compilation:** CSS is generated with only used utilities
4. **PostCSS:** Autoprefixer adds vendor prefixes

**Configuration:** `tailwind.config.js`
```javascript
content: ["./src/**/*.{js,jsx,ts,tsx}"]
```

## 🐍 Backend Build Process

### Development Server

**Command:**
```bash
uvicorn main:app --reload
```

**Process:**
1. FastAPI application loads
2. Uvicorn ASGI server starts
3. Auto-reload enabled for development
4. API available at `http://localhost:8000`

### Production Deployment

For production, use a production ASGI server:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

Or use Gunicorn with Uvicorn workers:

```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 📦 Dependencies

### Frontend Dependencies

**Production:**
- `react` (^18.2.0) - UI library
- `react-dom` (^18.2.0) - React DOM renderer
- `react-router-dom` (^7.11.0) - Routing
- `firebase` (^12.7.0) - Firebase SDK
- `react-icons` (^4.12.0) - Icon library

**Development:**
- `react-scripts` (5.0.1) - Build tooling
- `tailwindcss` (^3.4.19) - CSS framework
- `postcss` (^8.5.6) - CSS processor
- `autoprefixer` (^10.4.23) - CSS vendor prefixer

### Backend Dependencies

- `fastapi` (0.104.1) - Web framework
- `uvicorn[standard]` (0.24.0) - ASGI server
- `pydantic` (2.5.0) - Data validation
- `python-dotenv` (1.0.0) - Environment variables

## ⚙️ Configuration Files

### Frontend Configuration

**`tailwind.config.js`**
- Defines Tailwind CSS configuration
- Content paths for class scanning
- Custom theme extensions
- Custom animations

**`postcss.config.js`**
- PostCSS plugins configuration
- Tailwind CSS plugin
- Autoprefixer plugin

**`package.json`**
- Dependencies and versions
- NPM scripts
- Project metadata

### Backend Configuration

**`requirements.txt`**
- Python package dependencies
- Version pinning for reproducibility

## 🔧 Environment Setup

### Frontend Environment Variables

Create `frontend/.env` with:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

**Note:** All React environment variables must be prefixed with `REACT_APP_`

### Backend Environment Variables

Create `backend/.env` (if needed) for:
- Database connections
- API keys
- Secret keys

## 🚀 Build Commands

### Frontend Commands

```bash
# Development
npm start              # Start dev server with hot reload

# Production
npm run build          # Create production build
npm test               # Run tests
npm run eject          # Eject from CRA (irreversible)
```

### Backend Commands

```bash
# Development
uvicorn main:app --reload

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 🎨 Styling Architecture

### Tailwind CSS Usage

The project uses **Tailwind CSS** exclusively for styling:

- **Utility Classes:** All styling done with Tailwind utilities
- **Responsive Design:** Mobile-first approach with breakpoints
- **Custom Animations:** Defined in `tailwind.config.js`
- **No Custom CSS Files:** All components use Tailwind classes

### Component Styling Pattern

```jsx
// Example: Services component
<div className="py-[60px] px-6 bg-[rgb(244,244,250)]">
  <div className="max-w-[1280px] w-full mx-auto">
    {/* Content */}
  </div>
</div>
```

## 🔄 Development Workflow

1. **Start Frontend:**
   ```bash
   cd frontend && npm start
   ```

2. **Start Backend (separate terminal):**
   ```bash
   cd backend && uvicorn main:app --reload
   ```

3. **Make Changes:**
   - Frontend: Changes auto-reload in browser
   - Backend: Changes auto-reload server

4. **Build for Production:**
   ```bash
   cd frontend && npm run build
   ```

## 📦 Deployment

### Frontend Deployment

1. **Build the application:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy `build/` folder** to:
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - Any static hosting service

### Backend Deployment

1. **Set up production environment:**
   - Python 3.9+
   - Virtual environment
   - Install dependencies

2. **Run with production server:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

3. **Or use process manager:**
   - PM2
   - Supervisor
   - systemd

## 🐛 Troubleshooting

### Common Issues

**Tailwind classes not working:**
- Restart the dev server after changing `tailwind.config.js`
- Check that classes are in the content paths

**Environment variables not loading:**
- Ensure `.env` file is in `frontend/` directory
- Restart dev server after creating/updating `.env`
- Variables must start with `REACT_APP_`

**Firebase errors:**
- Check `.env` file has correct values
- Verify Firebase project is set up correctly
- See `docs/FIREBASE_SETUP.md` for details

**Port already in use:**
```bash
# Kill process on port 3000
lsof -ti :3000 | xargs kill -9
```

## 📝 Additional Resources

- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Firebase Documentation](https://firebase.google.com/docs)

