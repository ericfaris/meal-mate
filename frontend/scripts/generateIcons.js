const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

// Colors from theme
const colors = {
  background: '#FDFAF6',
  primary: '#E8A798',
  secondary: '#A8B5A2',
  white: '#FFFFFF',
};

// SVG for app icon - plate with utensils and heart
const createIconSVG = (size, padding = 0) => {
  const viewBox = 100;
  const scale = (size - padding * 2) / viewBox;
  const offset = padding;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${colors.background}"/>

  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    <!-- Plate/Bowl base -->
    <circle cx="50" cy="52" r="42" fill="${colors.primary}" opacity="0.15"/>
    <circle cx="50" cy="52" r="36" fill="${colors.primary}" opacity="0.3"/>
    <circle cx="50" cy="52" r="28" fill="${colors.primary}"/>

    <!-- Fork - left utensil -->
    <g transform="translate(22, 18) rotate(-20, 12, 35)">
      <rect x="10" y="28" width="4" height="32" rx="2" fill="${colors.secondary}"/>
      <rect x="4" y="8" width="2.5" height="20" rx="1" fill="${colors.secondary}"/>
      <rect x="9" y="6" width="2.5" height="22" rx="1" fill="${colors.secondary}"/>
      <rect x="14" y="8" width="2.5" height="20" rx="1" fill="${colors.secondary}"/>
    </g>

    <!-- Knife - right utensil -->
    <g transform="translate(58, 18) rotate(20, 12, 35)">
      <rect x="10" y="28" width="4" height="32" rx="2" fill="${colors.secondary}"/>
      <path d="M10 8 L10 28 L16 28 L16 10 Z" fill="${colors.secondary}" rx="1"/>
    </g>

    <!-- Heart on plate -->
    <path
      d="M50 58 C50 54 46 51 43 53.5 C39 56 39 60 43 64 L50 70 L57 64 C61 60 61 56 57 53.5 C54 51 50 54 50 58"
      fill="${colors.white}"
    />
  </g>
</svg>`;
};

// SVG for splash screen - larger with text
const createSplashSVG = (width, height) => {
  const iconSize = 200;
  const iconX = (width - iconSize) / 2;
  const iconY = (height - iconSize) / 2 - 100;

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${colors.background}"/>

  <!-- Icon -->
  <g transform="translate(${iconX}, ${iconY})">
    <!-- Plate/Bowl base -->
    <circle cx="100" cy="104" r="84" fill="${colors.primary}" opacity="0.15"/>
    <circle cx="100" cy="104" r="72" fill="${colors.primary}" opacity="0.3"/>
    <circle cx="100" cy="104" r="56" fill="${colors.primary}"/>

    <!-- Fork - left utensil -->
    <g transform="translate(44, 36) rotate(-20, 24, 70)">
      <rect x="20" y="56" width="8" height="64" rx="4" fill="${colors.secondary}"/>
      <rect x="8" y="16" width="5" height="40" rx="2" fill="${colors.secondary}"/>
      <rect x="18" y="12" width="5" height="44" rx="2" fill="${colors.secondary}"/>
      <rect x="28" y="16" width="5" height="40" rx="2" fill="${colors.secondary}"/>
    </g>

    <!-- Knife - right utensil -->
    <g transform="translate(116, 36) rotate(20, 24, 70)">
      <rect x="20" y="56" width="8" height="64" rx="4" fill="${colors.secondary}"/>
      <path d="M20 16 L20 56 L32 56 L32 20 Z" fill="${colors.secondary}"/>
    </g>

    <!-- Heart on plate -->
    <path
      d="M100 116 C100 108 92 102 86 107 C78 112 78 120 86 128 L100 140 L114 128 C122 120 122 112 114 107 C108 102 100 108 100 116"
      fill="${colors.white}"
    />
  </g>

  <!-- App Name -->
  <text
    x="${width / 2}"
    y="${iconY + iconSize + 80}"
    text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="48"
    font-weight="bold"
    fill="${colors.primary}"
  >Meal Mate</text>

  <!-- Tagline -->
  <text
    x="${width / 2}"
    y="${iconY + iconSize + 130}"
    text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="24"
    fill="#666666"
    font-style="italic"
  >Plan your week, love your meals</text>
</svg>`;
};

async function generateIcons() {
  // Ensure assets directory exists
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  console.log('Generating app icons...\n');

  try {
    // 1. Generate main app icon (1024x1024)
    console.log('Creating icon.png (1024x1024)...');
    const iconSVG = createIconSVG(1024, 100);
    await sharp(Buffer.from(iconSVG))
      .png()
      .toFile(path.join(ASSETS_DIR, 'icon.png'));
    console.log('  ✓ icon.png created');

    // 2. Generate adaptive icon for Android (1024x1024 with more padding)
    console.log('Creating adaptive-icon.png (1024x1024)...');
    const adaptiveIconSVG = createIconSVG(1024, 180);
    await sharp(Buffer.from(adaptiveIconSVG))
      .png()
      .toFile(path.join(ASSETS_DIR, 'adaptive-icon.png'));
    console.log('  ✓ adaptive-icon.png created');

    // 3. Generate splash screen (1284x2778 for iPhone 14 Pro Max)
    console.log('Creating splash.png (1284x2778)...');
    const splashSVG = createSplashSVG(1284, 2778);
    await sharp(Buffer.from(splashSVG))
      .png()
      .toFile(path.join(ASSETS_DIR, 'splash.png'));
    console.log('  ✓ splash.png created');

    // 4. Generate favicon for web (48x48)
    console.log('Creating favicon.png (48x48)...');
    const faviconSVG = createIconSVG(48, 4);
    await sharp(Buffer.from(faviconSVG))
      .png()
      .toFile(path.join(ASSETS_DIR, 'favicon.png'));
    console.log('  ✓ favicon.png created');

    console.log('\n✅ All icons generated successfully!');
    console.log(`\nIcons saved to: ${ASSETS_DIR}`);
    console.log('\nFiles created:');
    console.log('  - icon.png (1024x1024) - Main app icon');
    console.log('  - adaptive-icon.png (1024x1024) - Android adaptive icon');
    console.log('  - splash.png (1284x2778) - Splash screen');
    console.log('  - favicon.png (48x48) - Web favicon');

  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
