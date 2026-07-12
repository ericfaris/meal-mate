// Post-process the exported web build (dist/) to make it an installable PWA:
//   1. Inject manifest link, theme-color, apple-touch metadata, and a
//      service-worker registration snippet into dist/index.html.
//   2. Stamp the app version into dist/service-worker.js (replacing the
//      __APP_VERSION__ placeholder) so releases bust the old cache.
// Node, no dependencies. Metro's web bundler does not emit any of this, so it
// must be wired in explicitly. Fails loudly if the build looks wrong — a
// silent no-op would ship a site that works but isn't installable.
const fs = require('fs');
const path = require('path');

const distDir = process.argv[2] || path.join(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');
const swPath = path.join(distDir, 'service-worker.js');

const HEAD_INJECTION = `    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#FDFAF6">
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="Meal Mate">
    <script>if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/service-worker.js')})}</script>
`;

function resolveVersion() {
  try {
    const versionJson = path.join(__dirname, '..', '..', 'version.json');
    if (fs.existsSync(versionJson)) {
      const v = JSON.parse(fs.readFileSync(versionJson, 'utf8')).version;
      if (v) return v;
    }
  } catch (_) {
    // fall through to env / default
  }
  return process.env.APP_VERSION || 'dev';
}

function injectHead() {
  if (!fs.existsSync(indexPath)) {
    console.error(`[inject-pwa] ERROR: ${indexPath} not found.`);
    process.exit(1);
  }
  let html = fs.readFileSync(indexPath, 'utf8');

  if (html.includes('rel="manifest"')) {
    console.log('[inject-pwa] manifest link already present — skipping head injection.');
    return;
  }
  if (!html.includes('</head>')) {
    console.error('[inject-pwa] ERROR: no </head> found in index.html.');
    process.exit(1);
  }
  html = html.replace('</head>', `${HEAD_INJECTION}</head>`);
  fs.writeFileSync(indexPath, html);
  console.log('[inject-pwa] injected PWA metadata into index.html.');
}

function stampServiceWorker() {
  if (!fs.existsSync(swPath)) {
    console.error(`[inject-pwa] ERROR: ${swPath} not found (was public/ copied into dist/?).`);
    process.exit(1);
  }
  const version = resolveVersion();
  let sw = fs.readFileSync(swPath, 'utf8');
  sw = sw.split('__APP_VERSION__').join(version);
  fs.writeFileSync(swPath, sw);
  console.log(`[inject-pwa] stamped service worker cache version: ${version}`);
}

injectHead();
stampServiceWorker();
