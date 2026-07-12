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
    web: {
      favicon: './assets/icon.png',
      bundler: 'metro',
    },
    plugins: ['expo-image-picker'],
    extra: {
      appVersion: version,
      buildNumber: buildNumber,
    },
    owner: 'ericfaris',
  },
};
