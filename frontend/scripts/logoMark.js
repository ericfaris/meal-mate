// Single source of truth for the Meal Mate logo geometry ("Two Cloches").
// Used by generateIcons.js (raster assets) and mirrored by
// src/components/branding/Logo.tsx (keep the PATHS in sync; logoMark.test.js
// checks they match).
//
// Concept: a lowercase "m" whose two arches are serving domes (cloches) with
// knobs on top, standing on one shared table line - a household at one table.
// Flat, one ink colour on the terracotta badge, reads at 16px.

const COLORS = {
  background: '#FDFAF6',
  primary: '#B14E33', // terracotta (design-tokens --color-primary)
  secondary: '#A8B5A2', // sage (not used in the mark; too faint on terracotta)
  cream: '#FDFAF6',
};

// All geometry lives in a 100x100 box, optically centred.
// `full` is the master; `small` is a heavier cut for favicon sizes (<= 32px)
// where the master's knobs and gaps would close up.
const PATHS = {
  full: {
    m: {
      d: 'M20.3 76.6V50A14.8 14.8 0 0 1 50 50V76.6M50 50A14.8 14.8 0 0 1 79.7 50V76.6',
      strokeWidth: 11,
    },
    knobs: { cy: 20.4, cxs: [35.2, 64.8], r: 6 },
    table: { x: 10.2, y: 78.6, width: 79.6, height: 7, rx: 3.5 },
  },
  small: {
    m: {
      d: 'M19 78V50A15.5 15.5 0 0 1 50 50V78M50 50A15.5 15.5 0 0 1 81 50V78',
      strokeWidth: 14,
    },
    knobs: { cy: 19.5, cxs: [34.5, 65.5], r: 7.5 },
    table: { x: 8, y: 80, width: 84, height: 9, rx: 4.5 },
  },
};

// Mark only, on a transparent background, in a single ink colour.
function markGroup({ ink = COLORS.cream, cut = 'full' } = {}) {
  const { m, knobs, table } = PATHS[cut];
  return `<path d="${m.d}" fill="none" stroke="${ink}" stroke-width="${m.strokeWidth}"/>
  ${knobs.cxs.map((cx) => `<circle cx="${cx}" cy="${knobs.cy}" r="${knobs.r}" fill="${ink}"/>`).join('\n  ')}
  <rect x="${table.x}" y="${table.y}" width="${table.width}" height="${table.height}" rx="${table.rx}" fill="${ink}"/>`;
}

// Square icon: terracotta full-bleed background, mark scaled by `scale`
// (1 = fills the box; padding handled by scale).
function iconSVG(size, { scale = 1, background = COLORS.primary, radius = 0, cut = 'full' } = {}) {
  const s = (size / 100) * scale;
  const off = (size - 100 * s) / 2;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${background ? `<rect width="${size}" height="${size}" rx="${radius}" fill="${background}"/>` : ''}
  <g transform="translate(${off}, ${off}) scale(${s})">
  ${markGroup({ cut })}
  </g>
</svg>`;
}

module.exports = { COLORS, PATHS, markGroup, iconSVG };
