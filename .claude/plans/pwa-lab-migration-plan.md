# Implementation Plan: Migrate Meal Mate to Self-Hosted PWA on the Docker Lab

*Written 2026-07-12 by Fable for execution by Opus. This plan is self-contained — the executor has NOT read the concept brief or the planning conversation. Everything needed is restated here.*

---

## Summary

Meal Mate (React Native/Expo frontend + Node/Express backend, MongoDB Atlas) currently deploys as two Railway services fed by GitHub Actions → Docker Hub, plus manually built EAS Android APKs. This migration consolidates everything onto Eric's self-hosted Docker lab (this machine — the same box you're running on): a new root `docker-compose.yml` runs the backend and the web frontend as two containers, exposed publicly via the lab's existing Cloudflare Tunnel as `https://mealmate.mooseflip.com` (web, installable PWA) and `https://mealmate-api.mooseflip.com` (API). The web build gains a proper PWA manifest, icons, and service worker (Expo's Metro web bundler does not generate these). Docker Hub push workflows are deleted; secrets move from GitHub-secrets-baked-into-images to a local uncommitted `.env`. Native/EAS teardown is **Phase B, which you must NOT execute in this run** — see the hard stop below.

**The two phases are a hard ordering constraint.** Phase A = deploy + verify the lab/PWA setup. Phase B = delete EAS/native infra. Phase B only happens in a *later, separate invocation* after Eric explicitly confirms the new deployment is live and working. When Phase A verification passes, STOP and report. Do not touch any Phase B file in this run.

---

## Essential context (restated from the brief)

- Repo: `/home/eric/projects/meal-mate`. Backend = `backend/` (TypeScript, `npm run build` → `dist/`, entry `dist/server.js`, listens on `process.env.PORT || 3001`). Frontend web build already works: `frontend/Dockerfile.web` (multi-stage `node:20-alpine` → `nginx:alpine`, `npx expo export --platform web` → `dist/`, served via `frontend/nginx.conf.template`, nginx listens on `${PORT}`, default 80).
- MongoDB stays on Atlas (`MONGODB_URI` env var). **Do not containerize Mongo.**
- Web Google OAuth already works via a separate path: `frontend/src/components/auth/GoogleSignInButton.tsx` branches `Platform.OS === 'web'` to `@react-oauth/google`; `frontend/src/services/auth/google.ts` branches web vs native; both hit `POST /api/auth/google`. **Do not modify these files.** Same for `frontend/src/services/storage/index.ts` (web already uses AsyncStorage/localStorage) and `frontend/src/services/notifications.ts` (already a no-op on web) — leave all three alone.
- Cloudflare: **mooseflip** account, id `13887f102c0b8baa1f9b10450c4550f0`, zone id `e0b2d5fd3686b6bf2ad68341dfbc3632`. Scoped API token at `~/.config/cloudflare/mooseflip.token` (Tunnel Edit, DNS Edit, Access Edit). Read it via `TOK=$(cat ~/.config/cloudflare/mooseflip.token)`; send `Authorization: Bearer $TOK`. The token has no *user* scope so `/user/tokens/verify` reports "Invalid" — ignore that; account/zone calls work. **Never copy this token into any project `.env` or any file inside the repo. Announce to the user before making real Cloudflare changes (DNS records, tunnel config).**
- The lab already runs a shared, locally-managed Cloudflare Tunnel: id `83441a36-f288-40e3-ab39-9393b284ccc5`, run by systemd unit `cloudflared` pinned to `--config /etc/cloudflared/config.yml`. A fallback copy lives at `~/.cloudflared/config.yml` (keep both in sync — the file itself says so). Existing ingress hostnames → `http://localhost:<port>`: slipcast:8000, bookhunt:3000, tools:8200, gttp:8100, convene:8300, pinpoint:8400, jambo:8500. Local dev backend uses 3001. **This migration uses host ports 8600 (web) and 8601 (api).**
- Lab compose convention (see `~/projects/bookhunt/docker-compose.yml` for reference): `name: <project>`, services bound to `127.0.0.1:<port>` (tunnel is the only public entry), `restart: unless-stopped`, secrets via uncommitted `.env` interpolation.
- Railway (being retired for this project): project `c186050d-6060-423a-8e0f-74fb00bfd95a`, env `db59933f-50c3-4b47-a422-45bfc60d36bd`, backend service `013015f5-b8c5-437a-9df3-0f10343147e1` (`https://meal-mate-backend-production-f138.up.railway.app`), web service `5f14ec43-053c-4efe-b2f3-a2df65d7fb27` (`https://meal-mate.up.railway.app`). Railway API token at `~/.railway/api_token`. Do NOT delete the Railway services in this run — they simply stop receiving deploys; actual teardown is Eric's call later.
- Git: work on `main` (repo is clean apart from untracked `.claude/screenshots/`). Commit Phase A changes once verification passes. Per Eric's global rules: **do not add `Co-Authored-By: Claude ...` lines to commit messages.**

---

## Approach & key decisions

1. **`docker-compose.yml` at repo root, two services (`api`, `web`).** Matches the lab convention (project-rooted compose, `restart: unless-stopped`, `127.0.0.1` port bindings). The lab `rebuild` skill's qualifier is "a `Dockerfile` and a `docker-compose.yml` in the project dir" — this repo has Dockerfiles in subdirs, which is fine; compose points `build.context` at `backend/` and `frontend/` respectively. *Rejected:* separate compose files per service (needless), containerizing Mongo (explicitly out of scope — Atlas stays).

2. **Secrets via a root `.env` file (uncommitted), consumed by compose interpolation — and the backend Dockerfile stops baking secrets into the image.** Today `backend/Dockerfile` accepts `MONGODB_URI`, `JWT_SECRET`, etc. as build ARGs and freezes them into image ENV (an anti-pattern inherited from the Railway flow). Strip that block; supply all secrets at *runtime* via the compose `environment:` section interpolated from `.env`. Commit a `.env.example` with keys only. *Rejected:* keeping build-arg baking (secrets end up in image layers/history); `env_file:` on the service (works too, but explicit `environment:` keys make it obvious which vars each service actually gets).

3. **Populate the real `.env` values from Railway's live service variables.** The production secrets (Atlas `MONGODB_URI`, `JWT_SECRET`, Google/Anthropic/Unsplash keys, etc.) currently live only in GitHub secrets and Railway service variables. Pull them from Railway via its GraphQL API (`https://backboard.railway.app/graphql/v2`, token from `~/.railway/api_token`, `variables(projectId, environmentId, serviceId)` query — the `railway-deploy` skill in this environment documents the API pattern). This guarantees the lab backend talks to the *same* Atlas DB with the *same* JWT secret, so existing user accounts and tokens keep working. **`JWT_SECRET` must be identical to Railway's or every existing login breaks.**

4. **Cloudflare: reuse the existing shared lab tunnel, not a new one.** Add two ingress rules to the tunnel config (`mealmate.mooseflip.com` → `http://localhost:8600`, `mealmate-api.mooseflip.com` → `http://localhost:8601`) and create two proxied CNAME DNS records pointing at `83441a36-f288-40e3-ab39-9393b284ccc5.cfargotunnel.com` via the API token. This matches how every other lab app is exposed. **Caveat:** the live config is `/etc/cloudflared/config.yml` and the systemd restart both need `sudo`, and sudo on this box requires a password. Attempt the sudo commands; if they can't run non-interactively, update `~/.cloudflared/config.yml` (user-writable sync copy), then pause and ask Eric to run the two sudo commands (given verbatim in Task A7). *Rejected alternative:* a dedicated remotely-managed tunnel run as a `cloudflared` container inside the compose stack — avoids sudo entirely and is fully API-manageable, but diverges from the one-shared-tunnel lab convention and adds a second tunnel to maintain. Fall back to this only if Eric prefers it when asked.

5. **PWA assets are hand-wired into the exported `dist/`, not generated by Expo.** This app uses Metro web (`web.bundler: 'metro'` in `frontend/app.config.js`) with classic React Navigation (no expo-router), so there is no `+html.tsx` hook and Metro does not emit a manifest or service worker (the old Webpack adapter did; Metro doesn't). Approach: keep source-of-truth PWA files in a new `frontend/public/` dir (manifest, service worker, icons), generate the PNG icons with a script using the already-present `sharp` devDependency, and in `Dockerfile.web` after `expo export` run an explicit `cp -r public/. dist/` plus a small Node script (`frontend/scripts/inject-pwa.js`) that rewrites `dist/index.html` to add the manifest link, theme-color, apple-touch metadata, and a service-worker registration snippet. *Rejected:* relying on Expo automatically copying `public/` into `dist/` (version-dependent behavior — the explicit `cp` is deterministic and harmless if Expo also copies); `workbox` (overkill for a two-user app; a ~40-line hand-rolled SW suffices); adopting expo-router just to get `+html.tsx` (massive collateral change).

6. **Service worker strategy: network-first for navigations, cache-first for hashed static assets, versioned cache name.** Expo's exported JS bundles are content-hashed (safe to cache forever), but `index.html`, `manifest.json`, and the SW itself must never be cached long-term or updates will strand users. nginx gets explicit no-cache rules for those three (exact-match `location =` blocks, which take precedence over the existing 1-year regex cache block in `nginx.conf.template`).

7. **Version stamping via a thin deploy script.** Compose can't read `version.json`, so a small `scripts/lab-deploy.sh` exports `APP_VERSION`/`BUILD_NUMBER` from `version.json` and runs `docker compose up -d --build`. Also set `NODE_ENV=production` in the backend's compose environment — this fixes a known bug where `/api/version` reported `environment: "development"` in prod.

8. **Two-phase execution with a hard stop.** Phase A (deploy + verify) completes and is reported; Phase B (EAS/native teardown) is documented here but explicitly deferred to a later invocation gated on Eric's confirmation. Rationale: if the PWA deployment has a problem discovered days later, the native APK path must still exist as the fallback.

---

## Phase A — Lab deployment, Cloudflare, PWA, docs

Do these in order. Each task is independently verifiable.

### A1. Root `.env.example` + `.gitignore` guard

- **Create `/home/eric/projects/meal-mate/.env.example`** (committed) with empty/placeholder values and comments:
  ```
  # Runtime secrets for docker-compose.yml — copy to .env and fill in.
  # Real values live in Railway service variables (until retired) — see plan.
  # NEVER commit .env. NEVER put the Cloudflare token in here.
  MONGODB_URI=
  JWT_SECRET=
  GOOGLE_CLIENT_ID=
  GOOGLE_WEB_CLIENT_ID=
  GOOGLE_ANDROID_CLIENT_ID=
  ANTHROPIC_API_KEY=
  UNSPLASH_ACCESS_KEY=
  GOOGLE_API_KEY=
  GOOGLE_CSE_ID=
  CORS_ORIGINS=https://mealmate.mooseflip.com
  ```
- **Check root `.gitignore`** — ensure it ignores `.env` at the repo root (add `/.env` if not covered). Verify with `git check-ignore -v .env` after creating the real file.
- **Create the real `/home/eric/projects/meal-mate/.env`** by pulling current values from Railway backend service variables: GraphQL POST to `https://backboard.railway.app/graphql/v2` with `Authorization: Bearer $(cat ~/.railway/api_token)`, query `query { variables(projectId: "c186050d-6060-423a-8e0f-74fb00bfd95a", environmentId: "db59933f-50c3-4b47-a422-45bfc60d36bd", serviceId: "013015f5-b8c5-437a-9df3-0f10343147e1") }` (returns a JSON map). The `railway-deploy` skill documents this API if the shape differs. Ignore Railway-injected vars (`RAILWAY_*`, `PORT`); take the app secrets listed above. Set `CORS_ORIGINS=https://mealmate.mooseflip.com` (see env-changes section). Do not echo secret values into the transcript — write them with a script that reads the API response directly into the file.
- Note: `backend/.env` already exists for *local dev* (local Mongo, dev JWT secret) — leave it alone; it is not used by the compose stack.

### A2. Strip baked secrets from `backend/Dockerfile`

- **Edit `/home/eric/projects/meal-mate/backend/Dockerfile`**: delete the `ARG`/`ENV` blocks for `MONGODB_URI`, `PORT`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`, `ANTHROPIC_API_KEY`, `UNSPLASH_ACCESS_KEY`, `GOOGLE_API_KEY`, `GOOGLE_CSE_ID`, `CORS_ORIGINS` (lines ~17–28 and ~34–45). **Keep** `ARG APP_VERSION` / `ARG BUILD_NUMBER` and their `ENV` lines, the OCI labels, and everything else. Change `EXPOSE ${PORT}` → `EXPOSE 3001` (PORT is no longer a build arg; the server defaults to 3001).
- Verify: `docker build -f backend/Dockerfile backend/` succeeds. (Known gotcha, from `.claude/rules/backend.md`: if `npm ci` fails inside `node:20-alpine`, the `parse-domain`/jest override in `backend/package.json` is involved — regenerate the lockfile inside the same image. Don't touch deps unless this actually fails.)

### A3. Create `docker-compose.yml` at repo root

**Create `/home/eric/projects/meal-mate/docker-compose.yml`:**

```yaml
# Meal Mate on the Docker lab. Secrets come from ./.env (uncommitted — see
# .env.example). Public entry is the shared Cloudflare tunnel:
#   https://mealmate.mooseflip.com      -> 127.0.0.1:8600 (web)
#   https://mealmate-api.mooseflip.com  -> 127.0.0.1:8601 (api)
# Deploy with scripts/lab-deploy.sh (stamps APP_VERSION/BUILD_NUMBER from version.json).
name: meal-mate

services:
  api:
    build:
      context: ./backend
      args:
        APP_VERSION: ${APP_VERSION:-dev}
        BUILD_NUMBER: ${BUILD_NUMBER:-0}
    image: ericfaris/meal-mate-backend:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:8601:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_WEB_CLIENT_ID=${GOOGLE_WEB_CLIENT_ID}
      - GOOGLE_ANDROID_CLIENT_ID=${GOOGLE_ANDROID_CLIENT_ID}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - UNSPLASH_ACCESS_KEY=${UNSPLASH_ACCESS_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - GOOGLE_CSE_ID=${GOOGLE_CSE_ID}
      - CORS_ORIGINS=${CORS_ORIGINS}

  web:
    build:
      context: ./frontend
      dockerfile: Dockerfile.web
      args:
        APP_VERSION: ${APP_VERSION:-dev}
        BUILD_NUMBER: ${BUILD_NUMBER:-0}
        EXPO_PUBLIC_API_URL: https://mealmate-api.mooseflip.com
    image: ericfaris/meal-mate-web:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:8600:80"
    depends_on:
      - api
```

Notes: `EXPO_PUBLIC_API_URL` is not a secret — hardcode it in compose so the built bundle is deterministic. Version compose args feed the existing `ARG APP_VERSION`/`BUILD_NUMBER` in both Dockerfiles.

**Create `/home/eric/projects/meal-mate/scripts/lab-deploy.sh`** (executable):
```bash
#!/usr/bin/env bash
# Build + (re)start the Meal Mate lab stack, stamping the version from version.json.
set -euo pipefail
cd "$(dirname "$0")/.."
export APP_VERSION=$(jq -r .version version.json)
export BUILD_NUMBER=$(jq -r .buildNumber version.json)
docker compose up -d --build "$@"
docker compose ps
```

### A4. Update `frontend/src/config/api.ts` PROD_URL

- **Edit `/home/eric/projects/meal-mate/frontend/src/config/api.ts`** line ~21: `const PROD_URL = 'https://meal-mate-backend-production-f138.up.railway.app';` → `const PROD_URL = 'https://mealmate-api.mooseflip.com';`. Also update the stale comment on lines 1–3 ("Production: set EXPO_PUBLIC_API_URL in EAS secrets" → "Production: EXPO_PUBLIC_API_URL baked in by docker-compose.yml build arg"). Change nothing else in this file.

### A5. Build the PWA layer

**A5a. Icons.** Create `/home/eric/projects/meal-mate/frontend/scripts/generatePwaAssets.js` — a Node script using `sharp` (already in `frontend/devDependencies`) that reads `frontend/assets/icon.png` (1024×1024 exists) and writes:
- `frontend/public/icons/icon-192.png` (192×192)
- `frontend/public/icons/icon-512.png` (512×512)
- `frontend/public/icons/maskable-512.png` (512×512 with the source icon scaled to ~70% centered on a `#FDFAF6` background — maskable safe zone)
- `frontend/public/icons/apple-touch-icon.png` (180×180, flattened onto `#FDFAF6` — iOS ignores transparency)
- `frontend/public/favicon.png` (copy of `frontend/assets/favicon.png`)

Run it once (`cd frontend && node scripts/generatePwaAssets.js`) and **commit the generated PNGs** — the Docker build must not depend on running sharp (it's a devDependency; `npm ci` in the builder installs it anyway, but committed assets are simpler and reviewable). Follow the style of the existing `frontend/scripts/generateIcons.js`.

**A5b. Manifest.** Create `/home/eric/projects/meal-mate/frontend/public/manifest.json`:
```json
{
  "name": "Meal Mate",
  "short_name": "Meal Mate",
  "description": "Weekly meal planning for the household",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#FDFAF6",
  "theme_color": "#FDFAF6",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```
(Colors match the app splash background `#FDFAF6` in `frontend/app.config.js`.)

**A5c. Service worker.** Create `/home/eric/projects/meal-mate/frontend/public/service-worker.js`. Keep it small (~40 lines):
- Cache name `mealmate-__APP_VERSION__` — the literal `__APP_VERSION__` placeholder is replaced at build time by `inject-pwa.js` (A5d) with the version from `../version.json`.
- `install`: `self.skipWaiting()`.
- `activate`: delete caches not matching the current name; `clients.claim()`.
- `fetch`: only handle GET + same-origin. Navigation requests (`request.mode === 'navigate'`): network-first, fall back to cached `/index.html`. Everything else (hashed bundles under `/_expo/`, `/assets/`, icons): cache-first with network fill (`cache.put` on success).
- Never intercept requests to other origins (the API is on a different origin — `mealmate-api.mooseflip.com` — so API calls bypass the SW naturally; do not add special casing).

**A5d. HTML injection script.** Create `/home/eric/projects/meal-mate/frontend/scripts/inject-pwa.js` — Node, no deps. Given the export dir (`dist/` by default):
1. Read `dist/index.html`; before `</head>` insert:
   ```html
   <link rel="manifest" href="/manifest.json">
   <meta name="theme-color" content="#FDFAF6">
   <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
   <meta name="apple-mobile-web-app-capable" content="yes">
   <meta name="mobile-web-app-capable" content="yes">
   <meta name="apple-mobile-web-app-status-bar-style" content="default">
   <meta name="apple-mobile-web-app-title" content="Meal Mate">
   <script>if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/service-worker.js')})}</script>
   ```
   Be idempotent (skip if the manifest link is already present).
2. Read `../version.json` (falling back to `process.env.APP_VERSION`, then `"dev"`), and rewrite `__APP_VERSION__` in `dist/service-worker.js`.
3. Fail loudly (non-zero exit) if `dist/index.html` doesn't exist or `</head>` isn't found — a silent no-op here would ship a non-installable build.

Note: `version.json` lives at the repo root, *outside* the `frontend/` Docker build context. Handle this in A5e by having the compose-supplied `APP_VERSION` build arg reach the script via env (the Dockerfile already declares the ARG) — do not try to COPY `../version.json`.

**A5e. Wire into `frontend/Dockerfile.web`.** Edit the builder stage — after `RUN npx expo export --platform web`, add:
```dockerfile
ARG APP_VERSION=dev
RUN cp -r public/. dist/ && APP_VERSION=${APP_VERSION} node scripts/inject-pwa.js
```
(The `cp` runs regardless of whether Expo copied `public/` itself — it's idempotent. Keep the existing `ARG APP_VERSION` in the nginx stage for the label; adding it in the builder stage too is fine, ARGs are per-stage.) Also update the stale comment `# Railway sets PORT env var` → note it defaults to 80 and the lab compose maps 8600→80.

**A5f. nginx caching rules.** Edit `/home/eric/projects/meal-mate/frontend/nginx.conf.template` — add, inside the `server` block, *above* the existing regex cache block:
```nginx
    # PWA control files must never be long-cached or updates strand clients.
    # Exact-match locations take precedence over the regex cache block below.
    location = /service-worker.js {
        add_header Cache-Control "no-cache";
    }
    location = /manifest.json {
        add_header Cache-Control "no-cache";
    }
    location = /index.html {
        add_header Cache-Control "no-cache";
    }
```
Leave the 1-year immutable regex block for js/css/png/etc. as-is (Expo bundles are content-hashed). Note the unused `frontend/nginx.conf` (non-template) exists but isn't referenced by `Dockerfile.web` — leave it, or delete it if clearly dead; do not spend time on it.

**A5g. Local build check.** From repo root: `APP_VERSION=$(jq -r .version version.json) BUILD_NUMBER=$(jq -r .buildNumber version.json) docker compose build` — both images must build clean. Then inspect the web image: `docker run --rm ericfaris/meal-mate-web:latest ls /usr/share/nginx/html` should show `manifest.json`, `service-worker.js`, `icons/`; and `docker run --rm ericfaris/meal-mate-web:latest grep -c 'rel="manifest"' /usr/share/nginx/html/index.html` should print `1`.

### A6. Start the stack locally and smoke-test on localhost

- `./scripts/lab-deploy.sh` (or the compose command from A5g with `up -d`).
- `docker compose ps` — both `running`.
- `curl -s http://127.0.0.1:8601/health` → `{"status":"ok",...}`.
- `curl -s http://127.0.0.1:8601/api/version` → correct version from `version.json` **and** `"environment":"production"`.
- `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8600/` → `200`; `curl -s http://127.0.0.1:8600/manifest.json` returns the manifest; `curl -sI http://127.0.0.1:8600/service-worker.js | grep -i cache-control` → `no-cache`.
- Confirm the API URL was baked correctly: `docker run --rm ericfaris/meal-mate-web:latest sh -c "grep -rl 'mealmate-api.mooseflip.com' /usr/share/nginx/html/_expo | head -1"` returns a bundle file.
- Watch backend logs for a successful Atlas connection: `docker compose logs api --tail 20` (crash without `JWT_SECRET` or bad `MONGODB_URI` shows here).

### A7. Cloudflare Tunnel ingress + DNS (announce first)

**Announce to the user before this task**: state you're about to add two DNS records and two tunnel ingress rules on the mooseflip account.

1. **DNS** (via API token): create two **proxied CNAME** records in zone `e0b2d5fd3686b6bf2ad68341dfbc3632`, both targeting `83441a36-f288-40e3-ab39-9393b284ccc5.cfargotunnel.com`:
   ```bash
   TOK=$(cat ~/.config/cloudflare/mooseflip.token)
   for NAME in mealmate mealmate-api; do
     curl -s -X POST "https://api.cloudflare.com/client/v4/zones/e0b2d5fd3686b6bf2ad68341dfbc3632/dns_records" \
       -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" \
       --data "{\"type\":\"CNAME\",\"name\":\"$NAME\",\"content\":\"83441a36-f288-40e3-ab39-9393b284ccc5.cfargotunnel.com\",\"proxied\":true}"
   done
   ```
   Check `"success":true` on both (a pre-existing record error means check with a GET first and update instead).
2. **Tunnel ingress** (local file, the tunnel is locally managed — the remote-config API does NOT apply here): edit `~/.cloudflared/config.yml`, adding before the final `- service: http_status:404` line:
   ```yaml
     - hostname: mealmate.mooseflip.com
       service: http://localhost:8600
     - hostname: mealmate-api.mooseflip.com
       service: http://localhost:8601
   ```
3. **Sync to the live config and restart** — requires sudo, and **sudo on this box needs a password**:
   ```bash
   sudo cp ~/.cloudflared/config.yml /etc/cloudflared/config.yml
   sudo systemctl restart cloudflared
   ```
   If these can't run non-interactively, STOP here, tell Eric exactly those two commands to run in a real terminal, and wait. Do not proceed to A8 until cloudflared has restarted with the new ingress (`systemctl status cloudflared` timestamps confirm).

### A8. End-to-end verification over the public domains

Maps to the brief's acceptance criteria 1–4:

1. `curl -s https://mealmate-api.mooseflip.com/health` → 200 `{"status":"ok"}`; `curl -s https://mealmate-api.mooseflip.com/api/version` → correct version, `production`.
2. `curl -s -o /dev/null -w '%{http_code}' https://mealmate.mooseflip.com/` → 200; manifest and service-worker fetchable at the public URL.
3. **CORS**: `curl -s -X OPTIONS https://mealmate-api.mooseflip.com/api/auth/login -H "Origin: https://mealmate.mooseflip.com" -H "Access-Control-Request-Method: POST" -D - -o /dev/null | grep -i access-control-allow-origin` must echo the web origin. Also confirm a *disallowed* origin gets no ACAO header.
4. **Browser check** (use the `webapp-testing` skill / Playwright): load `https://mealmate.mooseflip.com`, confirm the login screen renders, the Google sign-in button appears, and the console shows no CORS errors and a successful service-worker registration (`navigator.serviceWorker.controller` non-null after reload). Then prove full-stack auth: POST a wrong-password login via the UI and confirm the API returns a 401 error shown in the UI (proves web→API wiring), then register a throwaway smoke-test account (e.g. `smoketest-2026-07-12@mealmate.dev`), log in with it, and confirm the (empty) Home screen loads with data calls returning 200. Report the throwaway account to Eric for cleanup — **do not touch real user data in Atlas**. Real-account login (email + Google OAuth) is Eric's confirmation step; ask him to do it when reporting.
5. **PWA installability**: in the Playwright/Chromium session, check `document.querySelector('link[rel=manifest]')` resolves and fetches 200, the manifest parses with the two required icon sizes, and the SW is active — that satisfies Chrome's install criteria. Note in the report that the physical add-to-home-screen test on Eric's phone is his to confirm.

### A9. Delete the Docker Hub push workflows

- `git rm .github/workflows/docker-build.yml .github/workflows/web-build.yml` (acceptance criterion 5). Leave `eas-android-build.yml` and `eas-ios-build.yml` **untouched** — those are Phase B.

### A10. Documentation updates

- **Root `CLAUDE.md`**:
  - "Release Workflow" section: replace steps 5–6 (GitHub Actions → Docker Hub → Railway GraphQL deploy) with the lab flow: push/pull on the lab box (which is this machine), run `./scripts/lab-deploy.sh` (or `docker compose up -d --build`), verify `GET https://mealmate-api.mooseflip.com/api/version`. Keep the version-bump steps.
  - Version Flow diagram + "Version Visibility" table: Docker tags now local (`ericfaris/meal-mate-*:latest` built by compose with version labels/args); replace the Railway row with the lab URLs.
  - "CI/CD Pipelines" table: remove `docker-build.yml`; mark EAS rows as "pending removal (Phase B)" for now — don't describe them as active.
  - Architecture / Getting-help sections: note deployment target is the self-hosted Docker lab behind Cloudflare Tunnel; frontend is an installable PWA at `https://mealmate.mooseflip.com`.
  - Do NOT rewrite the whole file; targeted edits only.
- **`.claude/rules/frontend.md`**: the "Google OAuth Flow" section documents only the native flow. Add the web flow (which already works, no code change): `Platform.OS === 'web'` → `@react-oauth/google` `GoogleOAuthProvider`/`GoogleLogin` in `src/components/auth/GoogleSignInButton.tsx`; `src/services/auth/google.ts` `handleGoogleSignIn` branches web vs native; both send the ID token to `POST /api/auth/google`. Also update "Production Builds with EAS" intro to note the primary deployment is now the web PWA via `docker-compose.yml`/`Dockerfile.web` (leave the EAS content in place until Phase B; just demote it from "the way we ship").
- **`.claude/rules/api-design.md`**: "Base URL … Production: TBD" → `https://mealmate-api.mooseflip.com`.
- **`.claude/rules/backend.md`**: the `npm ci` gotcha references `docker-build.yml` failing — reword to reference the compose/lab build (the gotcha itself still applies; same `node:20-alpine` image).
- **Memory file `/home/eric/.claude/projects/-home-eric-projects-meal-mate/memory/deploy-credentials-and-endpoints.md`**: rewrite to lead with the lab setup (compose at repo root, ports 8600/8601, the two mooseflip.com URLs, shared tunnel id, `.env` from Railway variables, `scripts/lab-deploy.sh`). Move the Railway service IDs/URLs into a "retired (historical)" note — do not delete them. Keep the EAS-token line until Phase B.

### A11. Commit and STOP

- Commit all Phase A changes on `main` with a clear message (no Claude co-author lines). Do not push unless Eric's session settings/norms say lab deploys are pull-based from GitHub — the lab *is* this machine, so a local commit suffices; push if the working norm for this repo is push-to-GitHub (it has been — `gh` is authed; pushing `main` is fine and expected here).
- **HARD STOP.** Report to Eric: what's deployed, the verification evidence from A8, the throwaway account to clean up, and the explicit ask: *"Confirm the new deployment works for you (real login incl. Google OAuth, add-to-home-screen on your phone). Phase B — deleting EAS/native infra — will only run when you say go, as a separate task."* **Do not execute any Phase B step in this run, even if everything verified green.**

---

## Phase B — EAS/native teardown (SEPARATE FUTURE INVOCATION ONLY)

> **Gate: explicit human go-ahead from Eric in a later turn/session, after he has confirmed the lab deployment works. If you are the Phase A executor, you are done at A11 — do not read on as work to do now.**

- **B1. Delete files**: `git rm .github/workflows/eas-android-build.yml .github/workflows/eas-ios-build.yml frontend/eas.json frontend/google-services.json`.
- **B2. `frontend/app.config.js`**: remove the `expo-build-properties` plugin block (cleartext traffic — Android-only), the `@react-native-google-signin/google-signin` plugin block (incl. the iOS URL scheme), the `expo-notifications` plugin block, and `android.googleServicesFile`. Keep `android`/`ios` identity fields only if some tooling still needs them; otherwise they may go too. Keep `web`, `extra.appVersion`/`buildNumber`; `extra.eas.projectId` may be removed.
- **B3. `frontend/package.json`**: remove `@react-native-google-signin/google-signin`, `expo-notifications`, `expo-build-properties`, `expo-dev-client`, and `expo-device` *if and only if* a grep shows no remaining web-path imports (`notifications.ts` will be deleted; check `expo-device` usage elsewhere first). **Do NOT remove `@react-oauth/google`** — that's the web OAuth path. Update any code importing removed packages: `frontend/src/services/notifications.ts` (delete along with its call sites — grep for imports), push-token calls in login/logout flows.
- **B4. Backend dead push code**: remove `backend/src/services/notificationService.ts` and its call sites in `controllers/groceryList.ts`, `controllers/recipeSubmission.ts`, `controllers/staples.ts`; remove the `PUT/DELETE /api/users/push-token` endpoints (`routes/user.ts` + controller) and the `pushToken` field from `models/user.ts`. Run `cd backend && npm run build && npm test`.
- **B5. Verify no web regression**: rebuild via compose, re-run the A8 browser checks (login incl. Google button, SW active). The web bundle must not break from removed native deps — `npm ci` must still succeed and `expo export --platform web` must still build.
- **B6. Docs**: strip the EAS sections from `CLAUDE.md` and `.claude/rules/frontend.md`; update the memory file (EAS token line → historical).

---

## Data / model / API changes

**None** — no schema, endpoint, or business-logic changes in Phase A. (Phase B later removes the push-token endpoints/field, noted above.)

**Env var changes (explicit):**
- `CORS_ORIGINS` = `https://mealmate.mooseflip.com` — now sourced from the root `.env` via compose, no longer a GitHub secret/build-arg. (Old Railway web origin intentionally dropped; if Eric wants a transition period where `https://meal-mate.up.railway.app` still works, append it comma-separated — the backend splits on commas.)
- `EXPO_PUBLIC_API_URL` = `https://mealmate-api.mooseflip.com` — build-arg supplied by `docker-compose.yml` (hardcoded there; not a secret), replacing the GitHub secret in the deleted `web-build.yml`.
- `NODE_ENV=production` newly set on the api container (fixes `/api/version` reporting `development`).
- All backend secrets move from image-baked build-args to runtime env from `.env` (keys listed in A1).

## Testing & verification (acceptance-criteria map)

| Criterion | Proof |
|---|---|
| 1. `docker compose up -d --build` starts both containers clean | A6: `docker compose ps` both running; `docker compose logs api` shows Mongo connected |
| 2. API health at new domain | A8: `curl https://mealmate-api.mooseflip.com/health` → 200; `/api/version` matches `version.json`, env=production |
| 3. Web loads, login works, CORS/API wiring correct | A8: OPTIONS preflight shows ACAO for the web origin; Playwright: login screen renders, throwaway-account register+login+data-fetch succeeds, no console CORS errors; real-account + Google OAuth login = Eric's confirmation |
| 4. Installable PWA | A5g/A8: manifest + 192/512 + maskable icons served, SW registered and controlling, no-cache headers on SW/manifest/index.html; physical add-to-home-screen = Eric on-device |
| 5. Docker Hub workflows gone | A9: `git rm`, confirmed absent in the commit |
| 6. Docs updated | A10 edits; grep `CLAUDE.md`/`.claude/rules/*.md` for `railway` / `docker-build.yml` afterwards — remaining hits only in historical notes |
| 7. EAS teardown deferred | A11 hard stop; Phase B untouched in this run |

## Risks & watch-outs

- **The Phase A/B stop is non-negotiable.** Deleting EAS files in the same run as the migration removes the fallback before the new deployment is human-confirmed. Stop at A11.
- **`JWT_SECRET` mismatch** between the lab `.env` and what Railway ran with silently invalidates every existing session and (worse) the invite-token flow. Pull the value from Railway variables (A1), don't invent one.
- **sudo for cloudflared** (A7): the systemd service pins `/etc/cloudflared/config.yml`; sudo needs a password on this box. Editing only `~/.cloudflared/config.yml` does nothing to the live tunnel. If blocked, hand Eric the two commands and wait.
- **Metro web ≠ Webpack**: no auto manifest/SW. If `inject-pwa.js` silently fails, the site works but isn't installable — that's why the script must exit non-zero on failure and A5g greps the built image.
- **nginx cache poisoning of PWA control files**: the existing regex block would give `service-worker.js` a 1-year immutable cache, freezing clients on old code forever. The exact-match `location =` blocks (A5f) must be present; verify the `Cache-Control: no-cache` header with curl before calling it done.
- **Don't intercept cross-origin fetches in the SW** — the API is a different origin; a careless catch-all fetch handler can wedge auth requests.
- **Secrets hygiene**: `.env` must be gitignored and verified with `git check-ignore`; never place the Cloudflare token in `.env` or any repo file; don't echo secret values into command output/transcripts.
- **CORS lockout**: `CORS_ORIGINS` typo = the web app loads but every API call fails. The A8 preflight curl catches this before browser testing.
- **Port collisions**: 8600/8601 chosen against the current lab map (8000/3000/8100–8500 taken, 3001 = local dev backend). Confirm with `ss -tlnp | grep -E '8600|8601'` before compose up.
- **Backend `npm ci` in Docker** has a known `parse-domain`/jest lockfile trap — see `.claude/rules/backend.md`; only relevant if the build actually fails.
- **Railway keeps serving the old URLs** until Eric retires the services — that's fine and intentional (rollback path); note it in the report rather than deleting anything on Railway.
- **Atlas network access**: Atlas may have an IP allowlist. If the api container can't reach Atlas from this box (connection timeout in `docker compose logs api`), the Atlas project's Network Access list likely needs this machine's egress IP — surface to Eric; do not modify Atlas yourself.

## Out of scope (do not build)

- Any native Android/iOS work — this migration is the opposite direction.
- Web Push / VAPID — push notifications are dropped for now; do not re-implement them for web.
- Containerizing MongoDB — Atlas stays.
- Changing `version.json` / `scripts/bump-version.js` mechanics — the mechanism stays as-is (it just no longer feeds EAS).
- Rewriting app features/business logic, the web OAuth path (`GoogleSignInButton.tsx`, `services/auth/google.ts`), web token storage (`services/storage/index.ts`), or `services/notifications.ts` (Phase A).
- Deleting/modifying the Railway services or GitHub secrets — leave them; retirement is Eric's later call.
