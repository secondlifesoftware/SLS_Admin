# SLS Admin - Company Website

A modern, full-stack web application for Second Life Software, built with React (frontend) and Python FastAPI (backend). The frontend uses Tailwind CSS for styling and Firebase for authentication.

## 🏗️ Project Structure

```
SLS_Admin/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Hero.js     # Hero section with rocket emoji
│   │   │   ├── Services.js # Service cards carousel
│   │   │   ├── About.js    # About section
│   │   │   ├── Technologies.js
│   │   │   ├── CTA.js      # Call-to-action section
│   │   │   ├── Footer.js
│   │   │   ├── Admin.js    # Admin panel (Firebase auth)
│   │   │   └── Home.js     # Main home page component
│   │   ├── firebase.js     # Firebase configuration
│   │   ├── App.js          # Main app component with routing
│   │   └── index.js        # Entry point
│   ├── public/             # Static assets
│   ├── .env                # Environment variables (not in git)
│   ├── .env.example        # Environment variables template
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   ├── postcss.config.js   # PostCSS configuration
│   └── package.json        # Dependencies and scripts
├── backend/                # Python FastAPI backend
│   ├── main.py             # FastAPI application
│   └── requirements.txt    # Python dependencies
├── docs/                   # Project documentation
│   ├── README.md           # Documentation index
│   ├── BUILD.md            # Build documentation
│   └── FIREBASE_SETUP.md   # Firebase setup guide
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **npm** or **yarn**
- **pip** or **poetry**

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your Firebase credentials
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

   The frontend will be available at `http://localhost:3000`

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the development server:**
   ```bash
   uvicorn main:app --reload
   ```

   The backend API will be available at `http://localhost:8000`
   API documentation will be available at `http://localhost:8000/docs`

## 🛠️ Technology Stack

### Frontend
- **React 18.2** - UI library
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **React Router DOM 7.11** - Client-side routing
- **Firebase 12.7** - Authentication and analytics
- **React Icons 4.12** - Icon library

### Backend
- **FastAPI 0.104** - Modern Python web framework
- **Uvicorn** - ASGI server
- **Pydantic 2.5** - Data validation
- **Python-dotenv** - Environment variable management

## 📦 Build Process

### Development Build

```bash
cd frontend
npm start
```

This runs the app in development mode with hot-reload enabled.

### Production Build

```bash
cd frontend
npm run build
```

This creates an optimized production build in the `build/` folder.

## 🔐 Environment Variables

The frontend requires Firebase configuration. Copy `.env.example` to `.env` and fill in your Firebase credentials:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

**⚠️ Important:** Never commit `.env` files to version control. They are already in `.gitignore`.

## 🎨 Styling

This project uses **Tailwind CSS** for all styling. The configuration is in `frontend/tailwind.config.js`.

- Utility classes are used throughout components
- Custom animations and keyframes are defined in `tailwind.config.js`
- Global styles are in `frontend/src/index.css`

## 🔥 Firebase Integration

Firebase is used for:
- **Authentication** - Admin panel login (`/admin` route)
- **Analytics** - User behavior tracking

See `docs/FIREBASE_SETUP.md` for detailed setup instructions.

## 📱 Routes

- `/` - Home page (public)
- `/admin` - Admin panel (requires Firebase authentication)

## 🔐 Accessing the Admin Page

### How to Access

1. **Start the frontend development server:**
   ```bash
   cd frontend
   npm start
   ```

2. **Navigate to the admin page:**
   - Open your browser and go to: `http://localhost:3000/admin`
   - Or click any link/navigation that routes to `/admin`

3. **Login with Firebase:**
   - The admin page requires Firebase authentication
   - You'll need to log in with an email/password that has been set up in Firebase
   - See [Firebase Setup](./docs/FIREBASE_SETUP.md) for instructions on creating admin users

### Admin Authentication

- **Authentication Method:** Firebase Email/Password
- **Required Setup:** Admin users must be created in Firebase Console
- **Security:** Only users with valid Firebase credentials can access the admin panel

### Setting Up Admin Users

To create admin users, follow the steps in [Firebase Setup Guide](./docs/FIREBASE_SETUP.md):
1. Enable Email/Password authentication in Firebase Console
2. Create admin users in Firebase Authentication
3. Use those credentials to log in at `/admin`

## 🧪 Testing

```bash
cd frontend
npm test
```

## 📚 Documentation

- [Build Documentation](./docs/BUILD.md) - Detailed build process
- [Firebase Setup](./docs/FIREBASE_SETUP.md) - Firebase configuration guide

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Ensure all tests pass
4. Submit a pull request

## 📄 License

[Add your license here]
