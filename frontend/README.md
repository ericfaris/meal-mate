# Meal Mate Frontend

React Native components rendered on the web with
[react-native-web](https://necolas.github.io/react-native-web/), bundled by
[Vite](https://vite.dev). Ships as an installable PWA.

## Setup

```bash
npm install        # .npmrc sets legacy-peer-deps (see "Dependencies" below)
npm run dev        # http://localhost:8081, talks to the backend on :3001
```

Start the backend first (`cd ../backend && npm run dev`).

## Scripts

- `npm run dev` - Vite dev server on port 8081
- `npm run build` - production build into `dist/`
- `npm run preview` - serve the production build locally
- `npm run typecheck` - TypeScript check (`tsc --noEmit`)
- `npm test` - Vitest unit tests + `scripts/logoMark.test.js`

## How it fits together

- `index.html` + `src/main.tsx` - entry point; `@font-face` rules for Karla,
  Fraunces and the Ionicons icon font live in `index.html`.
- `vite.config.mts` - aliases `react-native` to `react-native-web`, bakes in
  the app version from `../version.json` (`vite/readVersion.ts`), and
  rewrites `require('./icon.png')` calls inside React Native libraries into
  asset imports (React Navigation's header back arrow needs this).
- `src/components/icons/Ionicons.tsx` - drop-in `Ionicons` component backed
  by the vendored font (`public/fonts/Ionicons.ttf`).
- `public/` - copied into `dist/` as-is: PWA manifest, service worker, icons,
  fonts. `scripts/inject-pwa.js` wires the manifest and service worker into
  `dist/index.html` after the build.

## API URL

Development always uses `http://localhost:3001`. Production builds use
`VITE_API_URL` (a build arg in the root `docker-compose.yml`), falling back to
`https://mealmate-api.mooseflip.com`.

## Dependencies

`.npmrc` sets `legacy-peer-deps=true` so npm doesn't auto-install
`react-native` as a peer of the React Navigation packages; it's aliased to
`react-native-web` instead. Types come from `@types/react-native`.

## Deploy

Pushing to `main` auto-deploys (see the root CLAUDE.md); `./scripts/lab-deploy.sh`
is the manual fallback. `Dockerfile.web` runs `npm ci` → `npm run build` →
`inject-pwa.js` → nginx, and copies the repo-root `version.json` in through the
compose `additional_contexts: repo` entry, so a plain `docker build` of this
directory needs `--build-context repo=..`.
