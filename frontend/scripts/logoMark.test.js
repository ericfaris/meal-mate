// Run: node --test scripts/logoMark.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PATHS, COLORS, markGroup, iconSVG } = require('./logoMark');

const root = path.join(__dirname, '..');

test('SVG builder is well-formed, uses the brand colors, and ink is a single colour', () => {
  const svg = iconSVG(64);
  assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
  assert.ok(svg.includes(COLORS.primary));
  assert.ok(svg.includes(COLORS.cream));
  // Mark itself is one ink colour (sage is too faint on terracotta).
  const mark = markGroup();
  assert.ok(!mark.includes(COLORS.secondary));
  assert.strictEqual([...new Set(mark.match(/#[0-9A-Fa-f]{6}/g))].length, 1);
});

test('Logo.tsx mirrors both mark cuts from logoMark.js', () => {
  const tsx = fs.readFileSync(path.join(root, 'src/components/branding/Logo.tsx'), 'utf8');
  for (const cut of ['full', 'small']) {
    const { m, knobs, table } = PATHS[cut];
    assert.ok(tsx.includes(m.d), `${cut} arch path drifted between Logo.tsx and logoMark.js`);
    assert.ok(tsx.includes(`strokeWidth: ${m.strokeWidth}`), `${cut} stroke width drifted`);
    assert.ok(tsx.includes(`cy: ${knobs.cy}`) && tsx.includes(`r: ${knobs.r}`), `${cut} knobs drifted`);
    assert.ok(tsx.includes(`cxs: [${knobs.cxs.join(', ')}]`), `${cut} knob x drifted`);
    assert.ok(tsx.includes(`y: ${table.y}, width: ${table.width}, height: ${table.height}`), `${cut} table drifted`);
  }
  assert.ok(tsx.includes('#FDFAF6'), 'ink color drifted');
});

test('small cut is heavier than the master (survives favicon sizes)', () => {
  assert.ok(PATHS.small.m.strokeWidth > PATHS.full.m.strokeWidth);
  assert.ok(PATHS.small.knobs.r > PATHS.full.knobs.r);
  assert.ok(PATHS.small.table.height > PATHS.full.table.height);
});

test('both cuts stay inside the 100x100 box with a safe margin', () => {
  for (const cut of ['full', 'small']) {
    const { m, knobs, table } = PATHS[cut];
    const left = Math.min(...m.d.match(/[ML]?\s*(\d+\.?\d*)/g).slice(0, 1).map((v) => parseFloat(v.replace(/[^\d.]/g, ''))) ) - m.strokeWidth / 2;
    assert.ok(left >= 4, `${cut} left edge ${left}`);
    assert.ok(knobs.cy - knobs.r >= 4, `${cut} knobs too close to top`);
    assert.ok(table.x >= 4 && table.x + table.width <= 96, `${cut} table exceeds box`);
    assert.ok(table.y + table.height <= 96, `${cut} table too low`);
  }
});

test('16px favicon still shows both knobs (regression: details closing up)', async () => {
  const { data, info } = await sharp(Buffer.from(iconSVG(16, { scale: 0.94, radius: 4, cut: 'small' })))
    .raw()
    .toBuffer({ resolveWithObject: true });
  const isInk = (x, y) => {
    const i = (y * info.width + x) * info.channels;
    return data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 190; // cream, not terracotta
  };
  // Knobs sit in the top ~third; look for ink on the left and right halves.
  let left = 0;
  let right = 0;
  for (let y = 1; y < 6; y++) {
    for (let x = 2; x < 8; x++) if (isInk(x, y)) left++;
    for (let x = 8; x < 14; x++) if (isInk(x, y)) right++;
  }
  assert.ok(left > 0 && right > 0, `knobs lost at 16px (left ${left}, right ${right})`);
});

test('generated raster assets have expected sizes', async () => {
  const expected = {
    'assets/icon.png': [1024, 1024],
    'assets/favicon.png': [48, 48],
    'public/icons/icon-192.png': [192, 192],
    'public/icons/icon-512.png': [512, 512],
    'public/icons/maskable-512.png': [512, 512],
    'public/icons/apple-touch-icon.png': [180, 180],
  };
  for (const [f, [w, h]] of Object.entries(expected)) {
    const m = await sharp(path.join(root, f)).metadata();
    assert.deepStrictEqual([m.width, m.height], [w, h], f);
  }
});

test('manifest icons and favicon links resolve to real files', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/manifest.json'), 'utf8'));
  for (const i of manifest.icons) assert.ok(fs.existsSync(path.join(root, 'public', i.src)), i.src);
  assert.ok(fs.existsSync(path.join(root, 'public/favicon.svg')));
  assert.ok(fs.readFileSync(path.join(root, 'scripts/inject-pwa.js'), 'utf8').includes('/favicon.svg'));
});
