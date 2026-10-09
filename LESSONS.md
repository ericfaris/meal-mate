# Lessons Learned

## 2026-09-14 — Design system uplift (Farmhouse Kitchen)

- **Google Fonts no longer serves true static per-weight files for most
  families.** Both the modern (`css2?family=Font:wght@400;600`) and legacy
  (`css?family=Font:400,600`) endpoints returned the *same* file URL for
  every requested weight for Fraunces and Karla — they're variable-only now.
  For a React Native app (where `expo-font`'s `useFonts` maps one file to
  one `fontFamily` name, with no runtime variable-axis control), this means
  only the default (400) instance is usable without extra tooling. Fix used:
  fetch the variable `.woff2`, convert to `.ttf` with `fontTools` (pip
  install into a throwaway venv — the system Python is externally managed),
  and ship one weight per face. If multi-weight static type is needed later,
  either pick a family that still ships true static instances (checked via
  the google/fonts GitHub repo's `ofl/<family>/static/` folder — not all
  families have one anymore) or take on the `@expo-google-fonts/*` package
  dependency instead.
- **A shared Ideogram MCP account can be heavily queued.** Generation
  requests from many unrelated sessions interleave in the same queue;
  `get_generation_status` with no `request_id` returns *everyone's* recent
  jobs, not just this session's. Only poll for your own `request_id` and
  expect real wait times (multiple minutes) rather than the near-instant
  turnaround you'd get on a dedicated account.
- **RN apps with no shared `<Button>`/`<Card>` components can still get an
  app-wide font identity cheaply**: patch `Text.defaultProps.style` /
  `TextInput.defaultProps.style` once in the root `App.tsx` rather than
  touching every screen's `StyleSheet.create`. Screens that already read
  weight/size from theme tokens (`typography.sizes.h1`, etc.) inherit the
  new font automatically with zero risk of behavioral regression.

## 2026-09-30 — Logo: Plate-and-M replaced by Two Cloches
- **Critique-first worked**: the old mark (initial in a circle) had two ideas
  and a 2.6-unit hairline ring that vanished at 16px. Comparing three
  one-idea concepts side by side at real 64/32/16px sizes made the choice fast.
- **Ship a small-size cut, not one master.** Knobs/gaps that read at 512px
  close up at 16px, so `logoMark.js` has `PATHS.full` and a heavier
  `PATHS.small`; `Logo.tsx` switches at <=32px. The test renders a 16px favicon
  and checks the knobs survive.
- **No SVG renderer was installed** (no rsvg/inkscape/cairosvg, so the logo
  skill's `render_png.py` fails). `sharp` in `frontend/node_modules` works; call
  `sharp(svgBuffer, {density:300})` and `process.exit(0)` afterwards (it can
  keep the node process alive).
- SVG `<title>` must escape `&` (raw `&` made sharp's parser throw).

## 2026-10-05 — Renovate vs. Expo pins
- Renovate bumped `react-native` 0.81.5→0.87.1 and gesture-handler 2.28→2.33
  in package.json only (no lockfile update) → web image `npm ci` ERESOLVE
  (RN 0.87 peers react ^19.2.3; Expo 54 pins react 19.1). Restored the Expo 54
  pins; sentinel's renovate config now disables minor/major bumps of
  react/react-native/react-native-* here. Upgrade those via an Expo SDK bump
  (`npx expo install --fix`), never piecemeal.

## 2026-10-08 — Expo removed; frontend is Vite + react-native-web
- Expo was only the web bundler by now (native app gone), and it dragged ~50
  audit findings (metro/jest/@expo/cli chain) along. Vite 8 + an
  `react-native` → `react-native-web` alias builds the same app in ~0.2s.
- **`.npmrc` `legacy-peer-deps=true` is load-bearing**: React Navigation and
  react-native-screens peer on `react-native`; without it npm auto-installs
  real RN and its vulnerable toolchain. Types come from `@types/react-native`
  0.72.8 (last release with real typings).
- **RN libraries `require('./x.png')` even in their ESM builds** (React
  Navigation's header back arrow). Vite silently drops these; no error, the
  arrow just vanishes. `vite.config.mts`'s `rnAssetRequires` plugin rewrites
  them, and it must also run in `optimizeDeps.rolldownOptions.plugins` or dev
  mode still loses them.
- **Flow-source packages don't bundle** (react-native-confetti-cannon ships
  raw Flow); replaced with canvas-confetti.
- **Correction to the 2026-09 font lesson**: `Text.defaultProps` is ignored
  for function components under React 19, so the Karla default never applied
  (live site renders body text in the system font). Still unfixed.
- Auth keys in localStorage (`auth_token`, `user_data`) match what
  AsyncStorage-web wrote, so the switch doesn't log users out; a unit test
  pins them.
- `.expo/` had been committed despite the gitignore entry; `git ls-files`
  before trusting `.gitignore`.
- The 2026-10-05 Renovate rule (no minor/major react/react-native bumps)
  was there for Expo pins; react can be upgraded freely now, but RNW and
  React Navigation still need their own peer ranges checked.

## 2026-10-08 — Pushing to main deploys; version stamping fixed
- `test.yml`'s `deploy` job (self-hosted runner → sentinel `/api/deploy`)
  auto-deploys every push to main. Running `lab-deploy.sh` right after a push
  raced it: container-name conflicts plus a stray `Created` container
  (`<oldid>_meal-mate-api-1`) that blocked the next recreate until removed.
- Sentinel runs a bare `docker compose up -d --build`, so version build args
  were never passed and the live API had reported `dev` / build 0 for a while.
  Fix: compose `additional_contexts: repo: .` + `COPY --from=repo
  version.json`; app code reads the file first, env second. A root
  `.dockerignore` (`*`, `!version.json`) keeps `.env`/node_modules out of that
  context. Lesson: put build metadata where every build route sees it, not in
  one wrapper script's env.
- A plain `docker build` of `frontend/` or `backend/` now needs
  `--build-context repo=..`.
