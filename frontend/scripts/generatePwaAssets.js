// Generate PWA icon assets from the existing 1024x1024 app icon.
// Run once with `cd frontend && node scripts/generatePwaAssets.js`; the
// generated PNGs are committed so the Docker build never needs sharp.
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

// Splash/theme background from app.config.js (iOS ignores transparency, so
// maskable + apple-touch icons are flattened onto this).
const BACKGROUND = '#FDFAF6';

const SOURCE_ICON = path.join(ASSETS_DIR, 'icon.png');
const SOURCE_FAVICON = path.join(ASSETS_DIR, 'favicon.png');

async function generate() {
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error(`Source icon not found: ${SOURCE_ICON}`);
    process.exit(1);
  }
  fs.mkdirSync(ICONS_DIR, { recursive: true });

  console.log('Generating PWA assets...\n');

  // 1. Standard 192x192 icon
  console.log('Creating icons/icon-192.png (192x192)...');
  await sharp(SOURCE_ICON).resize(192, 192).png().toFile(path.join(ICONS_DIR, 'icon-192.png'));

  // 2. Standard 512x512 icon
  console.log('Creating icons/icon-512.png (512x512)...');
  await sharp(SOURCE_ICON).resize(512, 512).png().toFile(path.join(ICONS_DIR, 'icon-512.png'));

  // 3. Maskable 512x512 — source scaled to ~70% centered on the background
  //    so it survives the maskable safe-zone crop on Android.
  console.log('Creating icons/maskable-512.png (512x512)...');
  const inner = 358; // ~70% of 512
  const scaled = await sharp(SOURCE_ICON).resize(inner, inner).png().toBuffer();
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: scaled, gravity: 'centre' }])
    .png()
    .toFile(path.join(ICONS_DIR, 'maskable-512.png'));

  // 4. Apple touch icon 180x180 flattened onto the background (no transparency)
  console.log('Creating icons/apple-touch-icon.png (180x180)...');
  await sharp(SOURCE_ICON)
    .resize(180, 180)
    .flatten({ background: BACKGROUND })
    .png()
    .toFile(path.join(ICONS_DIR, 'apple-touch-icon.png'));

  // 5. Favicon — copy of the existing favicon
  console.log('Creating favicon.png...');
  if (fs.existsSync(SOURCE_FAVICON)) {
    fs.copyFileSync(SOURCE_FAVICON, path.join(PUBLIC_DIR, 'favicon.png'));
  } else {
    await sharp(SOURCE_ICON).resize(48, 48).png().toFile(path.join(PUBLIC_DIR, 'favicon.png'));
  }

  console.log('\n✅ PWA assets generated in frontend/public/');
}

generate().catch((err) => {
  console.error('Error generating PWA assets:', err);
  process.exit(1);
});
