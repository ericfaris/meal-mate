const path = require('path');
const fs = require('fs');
const { COLORS, iconSVG } = require('./logoMark');

async function generateIcons() {
  console.log('Generating Meal Mate logo assets...\n');

  // The app icon set (public/icons/*) is
  // the dimensional Two Cloches from scripts/icons/build.py. This script only
  // writes the flat brand mark used in the README.
  fs.mkdirSync(path.join(__dirname, '..', '..', 'docs', 'design'), { recursive: true });
  fs.writeFileSync(
    path.join(__dirname, '..', '..', 'docs', 'design', 'logo.svg'),
    iconSVG(512, { scale: 0.94, radius: 115 })
  );
  console.log(`✅ docs/design/logo.svg (primary ${COLORS.primary})`);
}

generateIcons().catch((e) => {
  console.error(e);
  process.exit(1);
});
