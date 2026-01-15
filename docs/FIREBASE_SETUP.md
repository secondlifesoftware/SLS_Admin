# Firebase Authentication Setup

This guide will help you set up Firebase authentication for the admin panel.

## Prerequisites

1. A Firebase account (sign up at https://firebase.google.com/)
2. A Firebase project created

## Setup Steps

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

### 2. Enable Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **Get Started**
3. Click on **Sign-in method** tab
4. Enable **Email/Password** authentication
5. Click **Save**

### 3. Get Your Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select **Project settings**
3. Scroll down to **Your apps** section
4. If you don't have a web app, click the **</>** icon to add one
5. Copy the configuration values from the `firebaseConfig` object

### 4. Set Up Environment Variables

1. In the `frontend` directory, create a `.env` file (if it doesn't exist)
2. Add the following environment variables with your Firebase credentials:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key-here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

Replace the placeholder values with your actual Firebase configuration values.

### 5. Create Admin Users

1. In Firebase Console, go to **Authentication** > **Users**
2. Click **Add user**
3. Enter an email and password for your admin account
4. Click **Add user**

### 6. Test the Admin Panel

1. Start your React app: `npm start`
2. Navigate to `http://localhost:3000/admin`
3. Log in with the credentials you created in step 5

## Security Notes

- The admin route (`/admin`) is not linked anywhere in the public-facing website
- Only users with Firebase authentication can access the admin dashboard
- Make sure to keep your `.env` file secure and never commit it to version control (it's already in `.gitignore`)

## Troubleshooting

- **"Firebase: Error (auth/invalid-api-key)"**: Check that your environment variables are correctly set and the app has been restarted after adding them
- **"Firebase: Error (auth/user-not-found)"**: Make sure you've created the user in Firebase Console
- **Environment variables not loading**: Make sure the `.env` file is in the `frontend` directory and restart the development server




