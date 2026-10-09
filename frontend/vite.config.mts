/// <reference types="vitest/config" />
import fs from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Version comes from build args (APP_VERSION/BUILD_NUMBER, stamped by
// scripts/lab-deploy.sh from version.json). Outside Docker, fall back to the
// repo-root version.json so `npm run dev` shows the real version too.
function readVersion() {
  let version = process.env.APP_VERSION;
  let buildNumber = process.env.BUILD_NUMBER;
  const versionFile = path.resolve(import.meta.dirname, '../version.json');
  if ((!version || !buildNumber) && fs.existsSync(versionFile)) {
    const v = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
    version = version || v.version;
    buildNumber = buildNumber || String(v.buildNumber);
  }
  return { version: version || 'dev', buildNumber: buildNumber || '0' };
}

// React Native libraries load images with `require('./icon.png')`, even in
// their ESM builds (e.g. React Navigation's header back arrow). Metro resolved
// those to asset objects; Vite would drop them. Rewrite each one into a
// hoisted asset import wrapped as an Image source.
const ASSET_REQUIRE = /require\(\s*(['"])([^'"]+\.(?:png|jpe?g|gif|webp))\1\s*\)/g;

export function rnAssetRequires(): Plugin {
  return {
    name: 'rn-asset-requires',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('/node_modules/') || !/\.[cm]?jsx?$/.test(id) || !code.includes('require(')) return null;
      const imports: string[] = [];
      const out = code.replace(ASSET_REQUIRE, (_m, _q, file: string) => {
        const name = `__rnAsset${imports.length}`;
        imports.push(`import ${name} from ${JSON.stringify(file)};`);
        return `{ uri: ${name} }`;
      });
      return imports.length ? { code: `${imports.join('\n')}\n${out}`, map: null } : null;
    },
  };
}

// React Native Web resolves platform files with a .web.* suffix first.
const extensions = ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js', '.jsx', '.json'];

export default defineConfig(({ mode }) => {
  const { version, buildNumber } = readVersion();
  return {
    plugins: [rnAssetRequires(), react()],
    resolve: {
      alias: { 'react-native': 'react-native-web' },
      extensions,
    },
    define: {
      __DEV__: JSON.stringify(mode !== 'production'),
      __APP_VERSION__: JSON.stringify(version),
      __BUILD_NUMBER__: JSON.stringify(Number(buildNumber) || 0),
      // Some React Native libraries reference `global`.
      global: 'globalThis',
    },
    // One SPA bundle (~250 KB gzipped); code-splitting isn't worth it here.
    build: { chunkSizeWarningLimit: 1000 },
    optimizeDeps: {
      // Dependencies are pre-bundled outside the plugin pipeline in dev, so
      // the asset-require rewrite has to run there too.
      rolldownOptions: { resolve: { extensions }, plugins: [rnAssetRequires()] },
    },
    server: { port: 8081 },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
    },
  };
});
