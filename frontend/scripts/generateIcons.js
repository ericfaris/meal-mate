const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { COLORS, iconSVG, splashSVG } = require('./logoMark');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const png = (svg, out) => sharp(Buffer.from(svg)).png().toFile(out);

async function generateIcons() {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  console.log('Generating Meal Mate logo assets...\n');

  // Store/app icon: full-bleed terracotta (OS applies its own corner mask).
  await png(iconSVG(1024, { scale: 0.82 }), path.join(ASSETS_DIR, 'icon.png'));
  // Android adaptive foreground: transparent, mark inside the 66% safe zone.
  // Pair with backgroundColor = primary in app.config.js.
  await png(iconSVG(1024, { scale: 0.66, background: null }), path.join(ASSETS_DIR, 'adaptive-icon.png'));
  await png(splashSVG(1284, 2778), path.join(ASSETS_DIR, 'splash.png'));
  // Favicon: rounded badge so it reads on light and dark browser chrome; uses the heavier small-size cut.
  await png(iconSVG(48, { scale: 0.94, radius: 11, cut: 'small' }), path.join(ASSETS_DIR, 'favicon.png'));

  // Vector favicon + in-README logo.
  fs.writeFileSync(
    path.join(PUBLIC_DIR, 'favicon.svg'),
    iconSVG(100, { scale: 0.94, radius: 22, cut: 'small' })
  );
  fs.mkdirSync(path.join(__dirname, '..', '..', 'docs', 'design'), { recursive: true });
  fs.writeFileSync(
    path.join(__dirname, '..', '..', 'docs', 'design', 'logo.svg'),
    iconSVG(512, { scale: 0.94, radius: 115 })
  );
  console.log('✅ icon.png, adaptive-icon.png, splash.png, favicon.png, favicon.svg, docs/design/logo.svg');
  console.log(`   primary ${COLORS.primary}; now run: node scripts/generatePwaAssets.js`);
}

generateIcons().catch((e) => {
  console.error(e);
  process.exit(1);
});
