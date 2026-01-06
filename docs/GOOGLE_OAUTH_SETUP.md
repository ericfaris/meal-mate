# Google OAuth Setup Guide

This guide explains how to configure Google Sign-In for the Meal Mate application.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "Meal Mate")
5. Click "Create"

## Step 2: Configure OAuth Consent Screen

1. In the Google Cloud Console, navigate to **APIs & Services > OAuth consent screen**
2. Select "External" user type (or "Internal" if using Google Workspace)
3. Click "Create"
4. Fill in the required fields:
   - **App name**: Meal Mate
   - **User support email**: Your email address
   - **Developer contact email**: Your email address
5. Click "Save and Continue"
6. On the Scopes page, click "Add or Remove Scopes"
7. Select the following scopes:
   - `openid`
   - `email`
   - `profile`
8. Click "Update" and then "Save and Continue"
9. Add test users if in testing mode
10. Click "Save and Continue" to complete

## Step 3: Create OAuth 2.0 Credentials

### Web Client (Required for Web and Backend)

1. Navigate to **APIs & Services > Credentials**
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application"
4. Name it (e.g., "Meal Mate Web Client")
5. Add Authorized JavaScript origins:
   - `http://localhost:8081` (Expo web development)
   - `http://localhost:3001` (Backend)
   - Your production domain
6. Add Authorized redirect URIs:
   - `http://localhost:8081`
   - `https://auth.expo.io/@your-username/meal-mate-frontend` (for Expo Go)
   - Your production callback URL
7. Click "Create"
8. Copy the **Client ID** and **Client Secret**

### iOS Client (For iOS App)

1. Click "Create Credentials" > "OAuth client ID"
2. Select "iOS"
3. Name it (e.g., "Meal Mate iOS")
4. Enter your iOS Bundle ID (from `app.json`: e.g., `com.yourcompany.mealmate`)
5. Click "Create"
6. Copy the **Client ID**

### Android Client (For Android App)

1. Click "Create Credentials" > "OAuth client ID"
2. Select "Android"
3. Name it (e.g., "Meal Mate Android")
4. Enter your Android Package name (from `app.json`)
5. Get your SHA-1 certificate fingerprint:
   ```bash
   # For debug keystore
   keytool -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey -storepass android -keypass android

   # For release keystore
   keytool -keystore your-release-key.keystore -list -v -alias your-alias
   ```
6. Enter the SHA-1 fingerprint
7. Click "Create"
8. Copy the **Client ID**

## Step 4: Configure Environment Variables

### Backend (.env)

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-web-client-secret
GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com

# URLs
FRONTEND_URL=http://localhost:8081
BACKEND_URL=http://localhost:3001
```

### Frontend

The frontend fetches OAuth configuration from the backend via the `/api/auth/google/config` endpoint, so no additional frontend environment variables are needed for OAuth.

## Step 5: Update app.json for Expo

Add the following to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "scheme": "mealmate",
    "ios": {
      "bundleIdentifier": "com.yourcompany.mealmate",
      "config": {
        "googleSignIn": {
          "reservedClientId": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
        }
      }
    },
    "android": {
      "package": "com.yourcompany.mealmate"
    }
  }
}
```

## Testing the Integration

### Development Testing

1. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm start
   ```

3. Open the app in a web browser or Expo Go
4. Click "Continue with Google" on the login screen
5. Complete the Google Sign-In flow
6. Verify you're logged in

### Test Cases

1. **New User Sign-In**: Sign in with a Google account that hasn't been used before
   - Expected: New user created, logged in successfully

2. **Returning User Sign-In**: Sign in with the same Google account
   - Expected: Existing user found, logged in successfully

3. **Existing Email Conflict**: Sign in with Google using an email that already has a local account
   - Expected: Local account is linked to Google, logged in successfully

4. **Cancel Sign-In**: Start Google Sign-In but cancel
   - Expected: Returned to login screen, no error shown

5. **Network Error**: Sign in with Google while backend is offline
   - Expected: Error message displayed

## Troubleshooting

### "Invalid Client ID" Error

- Verify the client IDs in your `.env` file match exactly with Google Cloud Console
- Ensure you're using the correct client ID for your platform (web, iOS, Android)

### "redirect_uri_mismatch" Error

- Add the exact redirect URI to your OAuth client in Google Cloud Console
- For Expo, this is typically `https://auth.expo.io/@your-username/your-app-slug`

### "Access Denied" Error

- Check that your OAuth consent screen is configured correctly
- If in testing mode, ensure your Google account is added as a test user

### iOS-Specific Issues

- Verify the `reservedClientId` in `app.json` matches your iOS client ID (reversed)
- Ensure the bundle identifier matches your iOS OAuth client configuration

### Android-Specific Issues

- Verify the SHA-1 fingerprint matches your keystore
- Ensure the package name matches your Android OAuth client configuration

## Security Best Practices

1. **Never expose client secrets in frontend code** - The backend handles secret management

2. **Use HTTPS in production** - OAuth requires secure connections

3. **Validate ID tokens on the backend** - Never trust frontend-provided user data

4. **Store refresh tokens securely** - Use encrypted storage (expo-secure-store)

5. **Implement token expiration** - JWT tokens expire after 7 days by default

6. **Rate limit auth endpoints** - Prevent brute force attacks

## API Reference

### POST /api/auth/google

Authenticate with a Google ID token.

**Request Body:**
```json
{
  "idToken": "google-id-token-from-client",
  "accessToken": "optional-google-access-token"
}
```

**Response:**
```json
{
  "message": "Google authentication successful",
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "member",
    "profilePicture": "https://...",
    "authProvider": "google"
  }
}
```

### GET /api/auth/google/config

Get Google OAuth client configuration for frontend.

**Response:**
```json
{
  "webClientId": "web-client-id.apps.googleusercontent.com",
  "iosClientId": "ios-client-id.apps.googleusercontent.com",
  "androidClientId": "android-client-id.apps.googleusercontent.com"
}
```

### POST /api/auth/logout

Logout and clear OAuth tokens.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "message": "Logout successful"
}
```
