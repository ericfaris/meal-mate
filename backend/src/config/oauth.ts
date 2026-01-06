export const oauthConfig = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    // Web client ID for backend verification
    webClientId: process.env.GOOGLE_WEB_CLIENT_ID || '',
    // iOS client ID (optional, for mobile)
    iosClientId: process.env.GOOGLE_IOS_CLIENT_ID || '',
    // Android client ID (optional, for mobile)
    androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID || '',
  },
  // Frontend URLs for redirects
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8081',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
};

export const isOAuthConfigured = (): boolean => {
  return !!(oauthConfig.google.clientId || oauthConfig.google.webClientId);
};
