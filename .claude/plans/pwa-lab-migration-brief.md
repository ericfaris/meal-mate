# Concept Brief: Migrate Meal Mate to Self-Hosted PWA

## Problem

Meal Mate currently runs as a native Android app (sideloaded APKs built manually via EAS) plus a web build, with both frontend and backend deployed as separate Railway services. This is more infrastructure than a household app (used by Eric + April) needs: manual Railway redeploys (no auto-deploy on image push), a manual EAS/APK build-and-sideload process for Android, and Docker Hub as a middleman between GitHub Actions and Railway.

## Goal

Consolidate onto Eric's self-hosted Docker lab as the only deployment target, accessed as an installable Progressive Web App. Drop native Android/iOS builds entirely. End state: `https://mealmate.mooseflip.com` (frontend, installable PWA) and `https://mealmate-api.mooseflip.com` (backend API), both running as Docker containers in the lab, built directly from the repo (no Docker Hub push step), reachable via Cloudflare Tunnel on the `mooseflip` Cloudflare account. Railway is retired for this project.

## In Scope

1. **`docker-compose.yml`** at repo root (or wherever conventions dictate) running two services: backend (from `backend/Dockerfile`) and web frontend (from `frontend/Dockerfile.web`). MongoDB stays on the existing Atlas cloud cluster — do not containerize Mongo.
2. **Cloudflare Tunnel + DNS** for both new hostnames (`mealmate.mooseflip.com`, `mealmate-api.mooseflip.com`) on the mooseflip account, routed to the two containers. Use the standing scoped token at `~/.config/cloudflare/mooseflip.token` per global CLAUDE.md instructions (Tunnel Edit + DNS Edit scope already granted). **Announce before making real Cloudflare changes**, per that same global rule.
3. **Retire the Docker Hub push workflows**: delete `.github/workflows/docker-build.yml` and `.github/workflows/web-build.yml`. The lab builds directly from the repo (git pull + `docker compose up -d --build`), matching the existing `rebuild` skill pattern used for other lab projects.
4. **Update hardcoded URLs**:
   - `frontend/src/config/api.ts` — `PROD_URL` fallback constant (currently `https://meal-mate-backend-production-f138.up.railway.app`) → `https://mealmate-api.mooseflip.com`.
   - `backend/src/app.ts` — `CORS_ORIGINS` needs to include `https://mealmate.mooseflip.com` (this is env-driven already; update wherever the env value is actually set for the lab deployment — likely a `.env` file referenced by the new compose file, not committed to git).
   - `EXPO_PUBLIC_API_URL` build-arg for the web Docker build → `https://mealmate-api.mooseflip.com` (baked in at build time via `frontend/Dockerfile.web`; needs to be supplied by the new compose file/build process instead of the old GitHub secret).
5. **Make the web build a properly installable PWA**: add a web app manifest (`manifest.json`) + icons (reuse existing assets in `frontend/assets/`) + a basic service worker for an app-shell/installable experience (standalone display mode, home-screen icon on Android/iOS). Expo's Metro web bundler does not auto-generate these (unlike the old Webpack adapter), so this needs manual wiring into the exported `dist/` output and the HTML template, then served correctly via `frontend/nginx.conf.template`.
6. **Documentation updates**: root `CLAUDE.md` (Release Workflow, Recent Development, versioning-flow diagram — remove Railway-specific and EAS-active language), `.claude/rules/frontend.md` (its "Google OAuth Flow" section currently only documents the native flow — add the existing separate web flow via `@react-oauth/google`, which already works and needs no code change, just correct docs), `.claude/rules/api-design.md`/`backend.md` if they reference Railway. Update the memory file `/home/eric/.claude/projects/-home-eric-projects-meal-mate/memory/deploy-credentials-and-endpoints.md` to reflect the new lab/Cloudflare setup once it exists (old Railway service IDs become historical, not deleted outright — note them as retired).
7. **Verification**: after everything is deployed, confirm the app is actually reachable and functional at the new domains (login, at least one core flow) before touching mobile teardown.
8. **Mobile/EAS teardown — sequenced LAST, only after the user confirms the new deployment is up and working**: delete `.github/workflows/eas-android-build.yml`, `.github/workflows/eas-ios-build.yml`, `frontend/eas.json`, `frontend/google-services.json`; remove the `expo-build-properties` cleartext-traffic plugin block and the `@react-native-google-signin/google-signin` plugin block from `frontend/app.config.js`; remove the corresponding now-unused native dependencies from `frontend/package.json` (e.g. `@react-native-google-signin/google-signin`, FCM/push-related native config) and any backend expo-server-sdk push-sending code that becomes dead once no native client exists. **Do not perform this step in the same pass as the deployment migration** — it must wait for explicit "it's up and working, go ahead" confirmation from Eric in a later turn/session.

## Out of Scope

- Any new native (Android/iOS) app work — this is the opposite direction.
- Web Push (VAPID) implementation — dropping push notifications is accepted for now; may be revisited later as a separate feature, not part of this migration.
- Containerizing MongoDB — stays on Atlas.
- Changing the `version.json`/`bump-version.js` versioning mechanism itself (it stays, just no longer feeds EAS builds).
- Rewriting the app's actual features/business logic — this is purely a deployment/hosting/PWA-packaging migration.

## Constraints

- Repo: `/home/eric/projects/meal-mate`. Backend = Node/Express/TypeScript (`backend/`). Frontend = Expo/React Native (`frontend/`), web build already works today via `expo export --platform web` inside `frontend/Dockerfile.web` (multi-stage: `node:20-alpine` builder → `nginx:alpine` runtime, serves via `frontend/nginx.conf.template`, port from `PORT` env, defaults to 80).
- MongoDB: Atlas cloud, connection via `MONGODB_URI` env var — unchanged.
- Auth: JWT (`JWT_SECRET`), Google OAuth. Web already has a fully separate, working OAuth path independent of the native library — see `frontend/src/components/auth/GoogleSignInButton.tsx` (branches `Platform.OS === 'web'` to use `@react-oauth/google`'s `GoogleOAuthProvider`/`GoogleLogin`) and `frontend/src/services/auth/google.ts` (`handleGoogleSignIn` branches web vs native, both ultimately call `POST /api/auth/google` on the backend). **This path must not be touched** — only the native-only plugin config in `app.config.js` gets removed, later, during mobile teardown.
- Token storage: `frontend/src/services/storage/index.ts` already branches `Platform.OS === 'web'` to use `AsyncStorage` (→ browser `localStorage`) instead of `expo-secure-store`. This is accepted as-is — no change needed, no new work here.
- Push notifications: `frontend/src/services/notifications.ts` gates on `Device.isDevice`, already a no-op on web. No functional change needed as part of this migration; only removed as dead code during the later mobile teardown pass.
- Cloudflare: mooseflip account (id `13887f102c0b8baa1f9b10450c4550f0`, zone `e0b2d5fd3686b6bf2ad68341dfbc3632`), token at `~/.config/cloudflare/mooseflip.token` (mode 600, outside any repo), scoped to Tunnel Edit, DNS Edit, Access Apps/Policies Edit. Read via `TOK=$(cat ~/.config/cloudflare/mooseflip.token)`, send `Authorization: Bearer $TOK`. Never copy this token into any project `.env`. Announce before making real Cloudflare changes.
- Lab deploy pattern: matches the existing `rebuild` skill — `docker compose up -d --build` run locally against a git-cloned copy of the repo on Eric's self-hosted Docker box. No Docker Hub intermediary needed for this project going forward.
- GitHub Actions currently pushes secrets (Mongo URI, JWT secret, Google/Anthropic keys, CORS_ORIGINS, etc.) as build-args baked into Docker images (see `docker-build.yml`). For the lab build, these should come from a local `.env` file (not committed) read by `docker-compose.yml`, not from GitHub secrets.

## Acceptance Criteria

1. `docker compose up -d --build` in the lab successfully starts both backend and web frontend containers with no errors.
2. `https://mealmate-api.mooseflip.com/health` (or `/api/version`) returns a 200 response from the lab-hosted backend.
3. `https://mealmate.mooseflip.com` loads the web app, and a user can log in (both email/password and Google OAuth) and see their data (recipes/plans), confirming CORS and API URL wiring are correct end-to-end.
4. On a mobile browser (Android Chrome and/or iOS Safari), the site is installable — "Add to Home Screen" produces a standalone app with the Meal Mate icon and no browser chrome.
5. `.github/workflows/docker-build.yml` and `.github/workflows/web-build.yml` no longer exist in the repo.
6. Root `CLAUDE.md` and relevant `.claude/rules/*.md` files no longer describe Railway as the deploy target or reference the now-deleted Docker Hub push workflows; the web Google OAuth flow is documented.
7. (Deferred to a later, explicitly-confirmed pass) EAS/native build files and native-only config are removed with no regressions to the working web app.

## Open Questions & Decisions Made

- **Plan review before build**: Eric opted to skip the plan-review gate — Fable's plan goes straight to Opus execution with no pause for approval in this flow.
- **Cloudflare scope**: In scope for Opus to execute directly (DNS + Tunnel routes for both new hostnames), using the standing scoped token. Must announce before making real changes, per global CLAUDE.md.
- **Backend/web domain split**: separate subdomains (`mealmate.mooseflip.com` for web, `mealmate-api.mooseflip.com` for API) — no path-based reverse proxy needed, matches the existing two-services model.
- **CI/CD approach**: lab builds directly from the repo; Docker Hub push workflows are deleted, not just disabled.
- **Mobile teardown timing**: explicitly sequenced to happen only *after* Eric confirms the new lab deployment is live and working — this is a hard ordering constraint, not a suggestion. The plan Fable writes should treat this as two logically separate phases even if delivered by the same Opus execution pass, with a clear "STOP AND WAIT FOR CONFIRMATION" checkpoint between them. (Practically: since this is a single non-interactive Opus execution run, Opus should complete and verify the deployment migration fully, then pause/report rather than proceeding to delete EAS files in the same run — deletion of EAS/native infra should be treated as a distinct follow-up task for a later invocation, not executed automatically now.)
- **Existing web-build pipeline reuse**: `frontend/Dockerfile.web` already works and should be reused as-is/adapted for compose, not rewritten from scratch.
- **No docker-compose.yml exists anywhere in this repo today** — this is new.

## Relevant Files/Areas

- `frontend/Dockerfile.web`, `frontend/nginx.conf.template`, `frontend/app.config.js`
- `frontend/src/config/api.ts` (PROD_URL fallback)
- `frontend/src/components/auth/GoogleSignInButton.tsx`, `frontend/src/services/auth/google.ts` (do not modify — web OAuth already works)
- `frontend/src/services/storage/index.ts` (do not modify — web token storage already works)
- `frontend/src/services/notifications.ts` (leave alone this pass)
- `backend/src/app.ts` (CORS_ORIGINS)
- `backend/Dockerfile`
- `.github/workflows/docker-build.yml`, `.github/workflows/web-build.yml` (delete)
- `.github/workflows/eas-android-build.yml`, `.github/workflows/eas-ios-build.yml` (delete — later pass only)
- `frontend/eas.json`, `frontend/google-services.json` (delete — later pass only)
- `version.json`, `scripts/bump-version.js` (leave mechanism intact)
- Root `CLAUDE.md`, `.claude/rules/frontend.md`, `.claude/rules/backend.md`, `.claude/rules/api-design.md`
- Memory: `/home/eric/.claude/projects/-home-eric-projects-meal-mate/memory/deploy-credentials-and-endpoints.md`
- No existing `docker-compose.yml` — net new file.

## Repo Commands & Tree State

- Git status: clean (only untracked `.claude/screenshots/`, unrelated to this work; nothing pre-existing to worry about).
- Backend commands (`backend/package.json`): `npm run dev` (nodemon+ts-node), `npm run build` (tsc), `npm start` (node dist/server.js), `npm test` (jest).
- Frontend commands (`frontend/package.json`): `npm start` (expo start), `npm run web` (expo start --web), `npm run android`/`ios` (expo run — will become irrelevant after mobile teardown).
- Docker build/test commands to verify with: `docker build -f backend/Dockerfile backend/` and `docker build -f frontend/Dockerfile.web frontend/` (or via the new `docker-compose.yml` once written) — confirm both images build clean before wiring Cloudflare.
- No test suite covers deployment config; verification is manual (curl health endpoints, browser login flow, Lighthouse/Chrome PWA installability check).
