const fs = require('fs');
const path = require('path');

// Read version from the root version.json
const versionFilePath = path.join(__dirname, '..', 'version.json');
let version = '1.0.0';
let buildNumber = 1;

try {
  const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
  version = versionData.version || '1.0.0';
  buildNumber = versionData.buildNumber || 1;
} catch (error) {
  console.warn('Could not read version.json, using defaults:', error.message);
}

export default {
  expo: {
    name: 'Meal Mate',
    slug: 'meal-mate',
    version: version,
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#FDFAF6',
    },
    assetBundlePatterns: ['**/*'],
    android: {
      package: 'com.mealmate.app',
      versionCode: buildNumber,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FDFAF6',
      },
      permissions: ['INTERNET', 'CAMERA', 'READ_MEDIA_IMAGES'],
      googleServicesFile: './google-services.json',
    },
    ios: {
      bundleIdentifier: 'com.mealmate.app',
      buildNumber: String(buildNumber),
    },
    scheme: 'mealmate',
    web: {
      favicon: './assets/icon.png',
      bundler: 'metro',
    },
    plugins: [
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic: true,
          },
        },
      ],
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme:
            'com.googleusercontent.apps.760619972742-o3kcevm7pnr8epu0o5ci7gd223883naa',
        },
      ],
      [
        'expo-notifications',
        {
          color: '#4A90A4',
          defaultChannel: 'default',
        },
      ],
      'expo-image-picker',
    ],
    extra: {
      appVersion: version,
      buildNumber: buildNumber,
      eas: {
        projectId: '910a682b-5db4-440a-af99-ee987b813edf',
      },
    },
    owner: 'ericfaris',
  },
};
