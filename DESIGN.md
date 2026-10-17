# Meal Mate — Design System

**Direction: "Farmhouse Kitchen"**
Status: v1.1 · 2026-10-16 · landing-page retune (see Changelog)

Live showcase: `frontend/public/design-system.html` (served at
`/design-system.html` on the deployed PWA, e.g.
`https://mealmate.mooseflip.com/design-system.html`, and locally from
`frontend/dist/` after `npm run build` in `frontend/`).

---

## 1. Direction narrative

Meal Mate is a household meal-planning app: a small group of people (a
family, roommates, a couple) plan a week of dinners together, share recipes,
and generate grocery lists from the plan. It's used daily, often in the
kitchen or at the grocery store, by non-technical users who want warmth and
clarity, not a "productivity tool" feel.

The app already had a strong instinct in `frontend/src/theme/index.ts`:
a warm terracotta-and-cream "kitchen" palette with sage accents, described
in its own header comment as "Warm kitchen-inspired palette with friendly,
inviting aesthetics." This uplift's job was **not** to replace that — it was
already the right idea, live in production, and already carries brand
recognition (icon, splash screen, PWA manifest colors). The job was to give
it the two things it was missing to read as a deliberate *system* rather
than a well-chosen palette with default typography: a real typographic
identity, and full documentation.

### Mood-board process

Per the batch/autonomous run, three directions were generated as text
concepts and one was rendered as an image via Ideogram (the account's
shared generation queue was heavily congested during this session, so only
one of the three cleared in time — the reasoning below still compares all
three on their merits):

1. **"Farmhouse Kitchen"** (rendered — saved at
   `docs/design/moodboard-farmhouse-kitchen.png`, generation prompt in §6
   below) — the existing terracotta/cream/sage
   palette, a warm serif display face (cookbook-title energy) paired with a
   clean rounded sans body, linen texture, hand-drawn utensil linework.
   **Chosen.**
2. **"Sunday Market"** — brighter, more playful: chunky rounded display
   type, paper-cut produce illustrations, confetti texture. Rejected: reads
   younger/more novelty than the household-admin, weekly-routine reality of
   the app (grocery lists, store layouts, household roles) — closer to a
   kids' cooking app than a family logistics tool.
3. **"Trattoria Evening"** — deeper terracotta and charcoal, elegant tall
   serif, gold accents, upscale dinner-party mood. Rejected: too formal/dark
   for an app used at 7am checking today's plan or standing in a grocery
   aisle; the existing light, cream-forward palette already tested well
   (5.2:1 contrast, documented in the original theme file) and a dark
   backdrop would fight that.

"Farmhouse Kitchen" won because it's the smallest honest step from what was
already live and already working — it adds typographic personality and
texture language without asking users to relearn a re-skinned app, and its
serif-display-on-cream pairing reads as "a cookbook you keep on the counter,"
which matches the actual use case better than either alternative.

### Key moments this was designed around

1. **App launch / splash** — logo mark + "Plan your week, love your meals"
   tagline (`frontend/src/components/branding/SplashScreen.tsx`).
2. **Home screen greeting** — the first text a returning user reads every
   time they open the app (`frontend/src/screens/HomeScreen.tsx`).
3. **The wordmark itself** — appears in the header logo, splash, and
   anywhere `Logo`/`LogoIcon` is used (`frontend/src/components/branding/Logo.tsx`).
4. **Plan confirmation** — the "emphasis" motion token exists for this
   (see §4) even though celebratory-animation wiring is left for a future
   pass — the token is documented and ready.
5. **Grocery Store Mode** — the highest-frequency non-owner screen (checking
   off items in a store); complexity tags and status banners documented here
   are the ones that screen leans on most.

---

## 2. Color

Source of truth: `frontend/src/theme/index.ts` → `colors`. v1.1 retuned the
neutrals and sage to match the marketing page (`/welcome/`): greys now lean
warm (toward the terracotta) instead of neutral, and sage is deep enough to
carry icons, switches and progress bars.

| Token | Value | Role | Where used |
|---|---|---|---|
| `background` | `#FDFAF6` | Dominant surface (warm cream) | Screen backgrounds, header bars, tab bar, PWA `theme_color` |
| `primary` | `#B14E33` | Accent (deep terracotta) | Primary buttons, active tab, today's day card, eyebrow labels — **5.2:1 with white text** |
| `primaryLight` | `#FBEDE8` | Terracotta wash | Skipped-day chips, avatar ring |
| `secondary` | `#7E9277` | Sage | On-switches, checked boxes, progress fill, leaf/vegetarian icon (3.6:1 on cream: icons and large marks only, never body text) |
| `secondaryLight` | `#EEF2EC` | Sage wash | Secondary fills, household/info bands |
| `success` | `#A7D8A8` | Semantic — good | Confetti, confirmed indicators |
| `linen` | `#F6EFE6` | Recessed surface | Image placeholders, inactive bands |
| `text` | `#2D2D2D` | Ink | Body copy — 13.6:1 on cream |
| `textLight` | `#5E5A55` | Secondary text | Metadata, descriptions — 6.6:1 on cream |
| `textMuted` | `#857D76` | Tertiary text | Timestamps, item sources, hints — 4.0:1 on cream (AA for ≥14px bold / large; used at 12–13px for non-essential metadata only) |
| `textOnPrimary` | `#FFFFFF` | Text on `primary` | Button labels |
| `white` / `card` | `#FFFFFF` | Card surface | Cards, panels, modals |
| `border` | `#E8DFD4` | Warm hairline | Card/input outlines, header and tab-bar rules |
| `divider` | `#F1EAE1` | Faint separator | List row dividers |
| `overlay` | `rgba(45,30,20,0.5)` | Warm scrim | Modal backdrops |
| `statusGray` | `#7A726B` | Neutral status | "Eating out" marker |
| `error` | `#C8553D` | Semantic — bad | Error text/banners (always paired with an icon or message; it sits near `primary` in hue) |
| `warning` | `#E0A04A` | Semantic — warn | Warning banners |
| `tagSimple` / `tagMedium` / `tagComplex` | `#DCEFD9` / `#FCE9CC` / `#F9D9D6` | Soft tag fills | `tagSimple` = the Vegetarian tag; the others are spare tag fills (recipe complexity was removed from the product in `eb32bd7`) |
| `focusRing` | `#B14E33` | Accessibility | Keyboard-focus outline on web — see §7 |

All swatches render live in the showcase page's Color section, generated
from `design-tokens.css`.

---

## 3. Type

Two self-hosted **variable** fonts (latin subset, from Google Fonts),
declared in `frontend/index.html` with weight ranges so real weights render
instead of synthetic bold:

| Face | Role | Files | Fallback stack |
|---|---|---|---|
| **Fraunces** 300–900, roman + italic | Display — headings, header titles, day numerals, the italic accent ("On the table tonight", Leftovers / Eating Out labels, "Today") | `public/fonts/Fraunces-Variable.woff2`, `Fraunces-Italic-Variable.woff2` | `Georgia, "Times New Roman", serif` |
| **Karla** 300–800 | Body — everything else | `public/fonts/Karla-Variable.woff2` | `-apple-system, "Segoe UI", Roboto, sans-serif` |

**Why this pairing**: Fraunces reads as "cookbook title," Karla is a warm
humanist sans that stays legible in grocery rows and tags. Neither is a
generic default.

### How the faces are applied (the platform shim)

`vite.config.mts` aliases the bare `react-native` import to
`frontend/src/platform/reactNative.tsx`, which re-exports react-native-web
with wrapped `Text` and `TextInput`. App code **and** libraries (React
Navigation's header titles, tab labels) go through it, so:

- Text gets **Karla** by default.
- Text with `fontSize >= 20` gets **Fraunces**, and `bold`/700+ is eased to
  600 (Fraunces at 700 looks heavy next to Karla).
- An explicit `fontFamily` always wins (the Ionicons font, monospace codes).
- Nested Text inherits its parent's face unless it sets its own `fontSize`.

This replaced the v1.0 `Text.defaultProps` hack in `App.tsx`, which React 19
silently ignores, so v1.0 shipped in the system font everywhere. Regression
tests: `src/platform/reactNative.test.tsx`.

Use `typography.families.display` explicitly for display moments **below**
20px (day numerals in the Planner, the italic accents) and spread `eyebrow`
for small uppercase section labels.

**Full type scale** (`typography.scale.*`; the flat `typography.sizes.*`
map stays for existing screens):

| Step | Face | Size / Line-height | Letter-spacing | Use |
|---|---|---|---|---|
| `display` | Fraunces | 34 / 40 | -0.3px | Wordmark, splash, hero greeting |
| `h1` | Fraunces | 28 / 34 | -0.2px | Screen titles, recipe title, Tonight's Dinner title |
| `h2` | Fraunces | 24 / 30 | -0.1px | Section headings ("What's this week like?") |
| `h3` | Fraunces | 20 / 26 | 0px | Header bar titles, card headers |
| `body` | Karla | 16 / 24 | 0px | Default copy, recipe names in lists |
| `small` | Karla | 14 / 20 | 0.1px | Tags, microcopy, buttons in rows |
| `tiny` | Karla | 12 / 16 | 0.2px | Timestamps, item sources, hints |
| `eyebrow` | Karla 700, UPPERCASE | 12 / 16 | 1.4px | Terracotta section labels: "TONIGHT'S DINNER", "PREFERENCES", store aisles |

---

## 4. Spacing, radius, shadow, motion

All from `theme/index.ts`.

**Spacing** (px): `xs 4` · `sm 8` · `md 16` · `lg 24` · `xl 32` · `xxl 48`.

**Radius** (px): `sm 4` · `md 8` · `lg 12` · `xl 16` · `full 999` (pills).

**Shadow** (RN shadow props / CSS box-shadow equivalent):
| Token | CSS equivalent | Use |
|---|---|---|
| `card` | `0 4px 14px rgba(60,40,25,0.06)` | Resting cards (with a 1px `border`) |
| `button` | `0 2px 6px rgba(60,40,25,0.12)` | Buttons at rest |
| `floating` | `0 8px 20px rgba(60,40,25,0.16)` | Modals, menus, FABs |

Shadows are warm brown, not black, and soft: on cream the 1px warm
`border` does the separating and the shadow only lifts.

**Motion** (new — `theme/index.ts` → `motion`): named duration+easing pairs,
each tied to a category of transition rather than left as a bare number.

| Token | Duration | Easing | Use |
|---|---|---|---|
| `microInteraction` | 150ms | `cubic-bezier(0.4, 0, 0.2, 1)` (standard ease) | Button press, checkbox toggle, tab switch — anything under the finger |
| `reveal` | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo-ish) | Modal/card entrances, list stagger, screen-level reveals |
| `emphasis` | 500ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring overshoot) | Success celebrations (plan confirmed, recipe saved) — the one place a little bounce is earned |

In RN, pass the same four numbers to `Easing.bezier(x1, y1, x2, y2)`. The
showcase page's Motion section is interactive — hover/focus each card to see
the actual curve, not just read the numbers.

**Heights**: `button 48` · `buttonSmall 36` · `input 48` · `chip 32` ·
`tabBar 60` · `header 56` (all px, unchanged).

---

## 5. Components

The screens style their own `TouchableOpacity`/`View` combinations from
tokens; v1.1 adds two shared style fragments in `theme/index.ts` —
`eyebrow` (section label) and `surface` (white card, 1px warm border, 16px
radius, soft card shadow) — plus one primitive, `components/ui/ToggleSwitch`.

### Chrome
- **Header bar**: cream (`background`) with a 1px `border` rule, ink title
  in Fraunces 600 at 20px, ink back arrow. Terracotta is kept for actions,
  not chrome (v1.0 used a terracotta bar). Config: `stackHeaderOptions` /
  `headerBarStyle` in `navigation/BottomTabNavigator.tsx`.
- **Tab bar**: cream, top `border` rule, terracotta active label/icon, Karla 700.

### Buttons
- **Primary**: `primary` fill, white Karla 700 label, pill
  (`borderRadius.full`). Signature CTA ("Suggest my week", "Start Cooking")
  is 44–56px tall with a leading or trailing icon.
- **Row action** (Planner "Suggest"/"Change"): 32px pill, white fill,
  `border` outline, ink label. "Pick"/"Log" is the filled primary version.
- **Disabled**: reduced opacity; focus ring as before.

### Day card (Planner) — mirrors the landing hero
Row layout: a 44px **date stack** (weekday, 11px uppercase muted, over a
Fraunces 22px numeral) then the meal. States: **recipe** (Karla 700 title,
time + Vegetarian tag), **label** (dashed border, transparent fill, Fraunces
italic "Leftovers" / "Eating Out"), **empty** (italic muted "Nothing planned
yet"), **today** (terracotta border + 4px terracotta left bar, terracotta
date, italic "Today"), **past** (72% opacity, sage check; action becomes
"Change", or "Log" when empty so past weeks can be filled in).

### Preferences panel (Constraints) — mirrors the landing "Suggest" panel
`surface` card, rows separated by dashed `border` rules, each row a label +
description + `ToggleSwitch` (42×24 pill, sage when on; the whole row is
the hit target with `accessibilityRole="switch"`). Day chips: active days
white with a muted weekday + Fraunces date; skipped days terracotta wash,
struck through.

### Store Mode — mirrors the landing grocery mock
Store logo chips, then a progress row ("Aldi order · 4 of 22 in the cart")
over a 6px sage bar, then aisles: `eyebrow` header with a count, items in a
rounded bordered group. Each item: 22px rounded checkbox (sage when
checked), name, a `tiny` muted **source line** (`utils/groceryItem.ts`: the
dinners that need it, or "Added by Jess"), and the quantity right-aligned in
tabular figures.

### Tonight's Dinner (Home)
Without a photo: white `surface` with a terracotta left bar, italic Fraunces
"On the table tonight", Fraunces title, meta, primary pill CTA. With a photo:
the photo with a warm-brown scrim. Label nights use the dashed italic
treatment.

### Tags, inputs, banners
Tags are small pills (`tagSimple` fill for Vegetarian, with a leaf icon).
Inputs: 48px, `border` outline, focus ring. Banners: unchanged.

---

## 6. Backgrounds, texture, and generated art

No new texture/background asset was generated or wired into the running app
in this pass. The chosen direction's mood board (Ideogram) used a linen
paper texture and hand-drawn utensil linework as atmosphere — the prompt
used, for reference if a matching production asset is generated later:

> `"Farmhouse Kitchen" design system mood board for a family meal-planning
> app. Deep terracotta and warm cream background with soft sage green
> accents. Palette swatch chips labeled: terracotta, warm cream, sage green,
> mint success, soft red. Large display type spelling "Meal Mate" in an
> elegant warm serif cookbook typeface, paired with a clean rounded sans
> body text sample below. A tactile rounded primary button labeled "Plan
> This Week" with soft shadow. Linen paper texture, subtle hand-drawn line
> illustrations of a fork, herb sprigs, a bowl. Cozy, inviting, artisanal
> mood. Design presentation board, flat layout, clean grid.`

The app's current flat `colors.background` surface already reads as clean
and warm without texture, and adding a background image/texture to every
screen is an app-code change (touching many screen files) beyond this
pass's scope — noted here as a documented next step rather than done
unprompted. The showcase page's "Backgrounds" section says this explicitly
rather than faking a texture sample that isn't actually in the app.

---

## 7. Accessibility

- **Contrast**: `primary` (#B14E33) on white/`textOnPrimary` is 5.2:1
  (WCAG AA for normal text), documented in the original theme file and
  preserved unchanged. `text` (#2D2D2D) on `background` (#FDFAF6) is
  ~11.8:1. No color pairing was made worse by this pass.
- **Focus states**: added `colors.focusRing` token (same hue as `primary`)
  and wired a visible 2px outline with offset on the showcase page's
  buttons/inputs. The native app should adopt the same treatment wherever
  it renders as the web PWA (React Native Web maps focus styles through);
  native iOS/Android focus rings are handled by the OS.
- **Reduced motion**: the new `motion.*` tokens are all short (150–500ms)
  and the `emphasis` token's overshoot is the only one with any bounce —
  when wiring real animations against these tokens, gate the `emphasis`
  bounce behind a `prefers-reduced-motion`/`AccessibilityInfo.isReduceMotionEnabled()`
  check and fall back to a plain `reveal`-style fade for those users. Not
  yet wired to an actual animation (see §1 "Plan confirmation"), so there's
  nothing to gate today — this is guidance for whoever wires it next.
- **Font loading**: `useFonts()` blocks render behind a loading spinner
  rather than flashing unstyled text, avoiding a layout-shift/FOUC on first
  load; the web build additionally sets `font-display: swap` on both
  `@font-face` rules so a slow font fetch never blocks paint indefinitely.

---

## 8. Icon / favicon

**Mark: "Two Cloches"** (2026-09-30). A lowercase "m" whose two arches are
serving domes with knobs on top, standing on one shared table line: a
household at one table. Single ink colour (cream `#FDFAF6`) on the terracotta
badge (`#B14E33`); sage is not used in the mark because it is too faint on
terracotta. Geometry lives in `frontend/scripts/logoMark.js` (`PATHS.full`
master and a heavier `PATHS.small` cut used for favicon sizes, 32px and below).

`node scripts/generateIcons.js` writes the flat mark to `docs/design/logo.svg`.

**App icon (house standard, 2026-10-16).** Like every mooseflip app (modelled on
redline and jambo), the app icon is one bold, dimensional mark on a rich tile:
the Two Cloches as real cream serving domes with knobs on one shared platter,
on a terracotta radial (`#cf6d50` → `#8a3620`). Master: `frontend/scripts/icons/icon.svg`
(`#bg` + `#mark`); `python3 frontend/scripts/icons/build.py` renders
`public/icons/` (`favicon.ico` 16/32/48, `apple-touch-icon.png` 180,
`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`). Wiring: `manifest.json`,
`scripts/inject-pwa.js` (`/icons/favicon.ico`), `public/welcome/` and the
showcase. `scripts/logoMark.test.js` checks both the flat mark and the icon set.

---

## 9. Asset inventory

| File | Role |
|---|---|
| `frontend/public/fonts/Fraunces-Variable.woff2` | Display face, roman, weights 300–900 |
| `frontend/public/fonts/Fraunces-Italic-Variable.woff2` | Display face, italic accent |
| `frontend/public/fonts/Karla-Variable.woff2` | Body face, weights 300–800 |
| `frontend/public/fonts/Ionicons.ttf` | Icon font, rendered by `src/components/icons/Ionicons.tsx` |
| `frontend/src/platform/reactNative.tsx` | `react-native` shim that applies the faces (§3) |
| `frontend/public/welcome/index.html` | Marketing landing page (§11) |
| `frontend/public/design-tokens.css` | Generated from `theme/index.ts` — do not hand-edit (§10) |
| `frontend/public/design-system.html` | Static showcase page |
| `frontend/scripts/generate-design-tokens-css.js` | Token → CSS generator |
| `frontend/public/icons/*.png` | App icon set (§8) |
| `docs/design/moodboard-farmhouse-kitchen.png` | Original mood board (docs only) |

---

## 10. Keeping tokens in sync

`frontend/src/theme/index.ts` is the single source of truth. Whenever you
change a value there (a color, a spacing step, a shadow, a motion curve),
regenerate the showcase's CSS so it can't silently drift:

```bash
node frontend/scripts/generate-design-tokens-css.js
```

This overwrites `frontend/public/design-tokens.css` from the current
`theme/index.ts` contents. The showcase page (`design-system.html`) reads
those CSS variables at render time (via `getComputedStyle`) for its color
swatches and spacing scale, so no value is ever hand-copied twice.

---

## 11. Landing page

`frontend/public/welcome/index.html`, served at `/welcome/` (nginx:
`location = /welcome/`, no-cache). It's static HTML with the same tokens
and self-hosted fonts as the app, plus a small inline script for the
interactive store-layout demo (its category orders mirror
`backend/src/controllers/stores.ts`).

- **Entry**: `src/utils/welcome.ts` sends a signed-out first-time visitor at
  `/` to `/welcome/` once. Its buttons link to `/?start`, which marks it
  seen. Deep links (`/join/:token`, `/grocery/:id`) and signed-in users are
  never redirected. The login screen links to it ("What is Meal Mate?").
- **Truth rule**: every mock on the page is a picture of a real screen
  (Planner week, preferences panel, Store Mode) and every claim maps to a
  working feature. When a feature changes, update the page in the same
  change. Example: the v1 draft showed Simple/Medium/Complex tags, but
  complexity no longer exists, so the page shows cook times instead.

---

## 12. Changelog

- **2026-09-14** — Initial design system pass ("Farmhouse Kitchen" uplift).
  Added: full type scale + two self-hosted faces (Fraunces display / Karla
  body) wired app-wide via `Text.defaultProps`; `motion` token set; a
  `focusRing` color token; the token→CSS generator script; the static
  showcase page. Reviewed and kept unchanged: color palette, spacing/
  radius/shadow scales, app icon/favicon set. Targeted font rollout to the
  wordmark, splash tagline, and home-screen greeting only (see §3
  "Extending this" for the pattern to continue it elsewhere).
- **2026-09-30** — Logo redesign: "Plate-and-M" (superseded the same day by "Two Cloches", below). Replaced the pastel
  plate/fork/knife/heart mark with a cream plate + bold rounded terracotta
  "M" + sage rim on a full-bleed terracotta badge (`#B14E33`, matches
  `--color-primary`; the old icon used the pastel `#E8A798`). Geometry is
  single-sourced in `frontend/scripts/logoMark.js`; `generateIcons.js` +
  `generatePwaAssets.js` regenerate icon/adaptive/splash/favicon/PWA icons,
  `favicon.svg` and `docs/design/logo.svg`; `Logo.tsx` mirrors the paths
  (enforced by `node --test scripts/logoMark.test.js`). Android adaptive icon
  now configured (terracotta bg). Bump the release version so the service
  worker cache picks up the new icons.
- **2026-09-30** — Logo redesign: "Two Cloches". Replaced Plate-and-M (an
  initial in a circle: generic, and its sage rim vanished at 16px) with a
  lowercase "m" of two serving domes on a shared table line. One cream ink on
  the terracotta badge; heavier small-size cut for favicons. Same
  single-source pipeline as before (`logoMark.js` -> generators -> `Logo.tsx`,
  guarded by `logoMark.test.js`, now also checking both cuts and that the
  16px favicon keeps its knobs). Bump the release version so the service
  worker cache picks up the new icons.
- **2026-10-16** — v1.1 "landing" retune, matching the new marketing page
  (`/welcome/`). Fixed fonts never loading: the `Text.defaultProps` default
  was a no-op under React 19, so the app rendered in the system font. A
  `react-native` platform shim now applies Karla/Fraunces, and the fonts
  ship as variable files with real weights. Warm neutrals, deeper sage,
  warm borders and shadows. Cream headers and tab bar replace the
  terracotta header bar. New `eyebrow`/`surface` fragments and a
  `ToggleSwitch`. Planner day cards, the Constraints preferences panel,
  Store Mode and Home's Tonight's Dinner were rebuilt to match the landing
  mocks (§5).
