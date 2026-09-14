# Meal Mate — Design System

**Direction: "Farmhouse Kitchen"**
Status: v1.0 · 2026-09-14 · uplift pass (see Changelog)

Live showcase: `frontend/public/design-system.html` (served at
`/design-system.html` on the deployed PWA, e.g.
`https://mealmate.mooseflip.com/design-system.html`, and locally from
`frontend/dist/` after `expo export --platform web`).

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

Source of truth: `frontend/src/theme/index.ts` → `colors`. All values below
are unchanged from the existing system (already well-chosen) — carried
forward, not redesigned.

| Token | Value | Role | Where used |
|---|---|---|---|
| `background` | `#FDFAF6` | Dominant surface (warm cream / parchment) | Screen backgrounds, PWA `theme_color` |
| `primary` | `#B14E33` | Primary accent (deep terracotta) | Primary buttons, links, focus ring — **5.2:1 contrast with white text (WCAG AA)** |
| `primaryLight` | `#FDF5F3` | Primary tint | Subtle highlighted backgrounds |
| `secondary` | `#A8B5A2` | Secondary accent (soft sage) | Tags, secondary highlights |
| `secondaryLight` | `#F3F6F2` | Secondary tint | Secondary button fills |
| `success` | `#A7D8A8` | Semantic — good | Confirmed-plan indicators |
| `text` | `#2D2D2D` | Primary text | Body copy on `background`/`card` — 11.8:1 contrast |
| `textLight` | `#666666` | Secondary text | Metadata, dates |
| `textMuted` | `#999999` | Tertiary text | Timestamps, disabled hints |
| `textOnPrimary` | `#FFFFFF` | Text on `primary` | Primary button labels |
| `white` / `card` | `#FFFFFF` | Card surface | Cards, modals |
| `border` | `#E5E5E5` | Structural border | Card/input outlines |
| `divider` | `#F0F0F0` | Hairline separator | List row dividers |
| `overlay` | `rgba(0,0,0,0.5)` | Scrim | Modal backdrops |
| `statusGray` | `#6B7280` | Neutral status | "Eating out" day marker |
| `error` | `#E57373` | Semantic — bad | Error banners/text |
| `warning` | `#FFB74D` | Semantic — warn | Warning banners |
| `tagSimple` | `#C8E6C9` | Complexity badge | Simple recipes |
| `tagMedium` | `#FFE0B2` | Complexity badge | Medium recipes |
| `tagComplex` | `#FFCDD2` | Complexity badge | Complex recipes |
| `focusRing` | `#B14E33` **(new)** | Accessibility | Visible keyboard-focus outline on web (Button/Input) — see §7 |

All swatches render live (with hex values) in the showcase page's Color
section, generated directly from `design-tokens.css`.

---

## 3. Type

**Previously:** `typography.families.default: undefined` — every screen fell
back to the OS system font. No display face, no personality, despite the
theme file's own header claiming a deliberate identity.

**Now:** two self-hosted faces, both pulled from the "Farmhouse Kitchen"
mood board's type direction:

| Face | Role | File | Fallback stack |
|---|---|---|---|
| **Fraunces** (Regular, 400) | Display — wordmark, hero/splash, screen `h1` titles | `frontend/assets/fonts/Fraunces-Regular.ttf` (app), `frontend/public/fonts/Fraunces-Regular.woff2` (web/showcase) | `Georgia, serif` |
| **Karla** (Regular, 400) | Body — everything else, applied app-wide as the default | `frontend/assets/fonts/Karla-Regular.ttf` (app), `frontend/public/fonts/Karla-Regular.woff2` (web/showcase) | `-apple-system, sans-serif` |

**Why this pairing**: Fraunces is a soft, warm serif with slightly organic
curves — it reads as "cookbook title" rather than "corporate editorial,"
which is the exact register the mood board and app purpose call for. Karla
is a humanist sans with rounded terminals — friendly and highly legible at
small sizes (grocery-list rows, tags) without competing with Fraunces for
attention. Neither is a cliché "safe AI pick" (Inter/Roboto/system) or the
overused Space-Grotesk-style default — see the global rule against shipping
system fonts as the personality.

**Known constraint**: both Fraunces and Karla ship upstream as *variable*
fonts on Google Fonts (no more static per-weight TTFs). Only the Regular
(400) static instance of each is bundled here to keep the asset footprint
small and the RN font-loading path simple (one file → one `fontFamily` name,
which is how `expo-font`'s `useFonts` works). Numeric `fontWeight` styling
elsewhere in the app (`typography.weights.semibold`, `.bold`) still applies
on top of the custom font and each platform does its best (synthetic
bold/emphasis) — it's a known, acceptable degradation, not a bug. If true
multi-weight display type is wanted later, re-run
`frontend/scripts/generate-design-tokens-css.js`'s sibling font-fetch step
(documented inline in this file's git history / the session that produced
it) against a font that still ships true static weights (e.g. Lora, Zilla
Slab), or add `@expo-google-fonts/*` packages if the project decides
runtime-fetched fonts are worth the added dependency.

**Where fonts are wired**:
- `frontend/App.tsx` — `useFonts()` loads both files at launch (blocking
  splash/loading state until ready), and a one-time `Text.defaultProps` /
  `TextInput.defaultProps` patch sets Karla as the app-wide default so the
  ~30 existing screens (which style text via `typography.sizes.*` without
  ever setting `fontFamily`) pick it up with **zero per-screen edits**.
- `frontend/src/components/branding/Logo.tsx` and `SplashScreen.tsx` — the
  wordmark and splash tagline explicitly use the display face.
- `frontend/src/screens/HomeScreen.tsx` — the greeting (`Good evening,
  Eric`) uses the display face, since it's the first thing read on every
  app open (a documented key moment, §1).
- Other screen `h1`s (day names, section titles elsewhere) were **not**
  swept to the display face in this pass — see "Extending this" below.

**Full type scale** (`typography.scale.*` in `theme/index.ts`; the older
flat `typography.sizes.*` map is kept for the ~30 existing screens that
already read from it):

| Step | Face | Size / Line-height | Letter-spacing | Use |
|---|---|---|---|---|
| `display` | Fraunces | 34 / 40 | 0.2px | App wordmark, splash tagline, big hero moments only |
| `h1` | Fraunces | 28 / 34 | 0px | Screen titles, day names |
| `h2` | Karla | 24 / 30 | 0px | Section headers |
| `h3` | Karla | 20 / 26 | 0px | Recipe titles, card headers |
| `body` | Karla | 16 / 24 | 0px | Default body copy |
| `small` | Karla | 14 / 20 | 0.1px | Tags, microcopy, form labels |
| `tiny` | Karla | 12 / 16 | 0.2px | Timestamps, hints, footer text |

Every step renders live, at its real size/weight/line-height, in the
showcase page's Type section.

**Extending this to more screens**: to move an existing screen title from
system-default-bold to the display face, add
`fontFamily: typography.families.display` to that style (see the three
edits already made in HomeScreen/Logo/SplashScreen as the pattern). This was
deliberately not done everywhere in this pass — a blanket sweep across ~30
files was out of scope for a design-system uplift and carries needless
regression risk; the rollout above covers the highest-impact moments and the
pattern is now established for whoever extends it next.

---

## 4. Spacing, radius, shadow, motion

All from `theme/index.ts`; unchanged except **motion**, which is new.

**Spacing** (px): `xs 4` · `sm 8` · `md 16` · `lg 24` · `xl 32` · `xxl 48`.

**Radius** (px): `sm 4` · `md 8` · `lg 12` · `xl 16` · `full 999` (pills).

**Shadow** (RN shadow props / CSS box-shadow equivalent):
| Token | CSS equivalent | Use |
|---|---|---|
| `card` | `0 2px 8px rgba(0,0,0,0.08)` | Resting cards |
| `button` | `0 2px 4px rgba(0,0,0,0.1)` | Buttons at rest |
| `floating` | `0 4px 12px rgba(0,0,0,0.15)` | Modals, elevated/hovered state |

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

Documented here are the component *patterns* already in use across the app
(buttons, cards, tags, inputs, banners), now with their token mapping made
explicit, plus how each renders in the showcase page. This pass did not
introduce a new shared component library (e.g. a `<Button>` primitive) — the
~30 screens each style their own `TouchableOpacity`/`View` combinations from
theme tokens today, and consolidating that into shared components is a
larger refactor than a design-system pass should take on unprompted (real
behavioral risk across every screen). The token-level contract below is
what such a future consolidation should target.

### Buttons
- **Primary**: `colors.primary` fill, `colors.textOnPrimary` label,
  `shadows.button` at rest, `borderRadius.full` (pill), `heights.button`
  (48px). Hover/press should shift toward `shadows.floating` and a
  `motion.microInteraction` transform — see showcase.
- **Secondary**: `colors.secondaryLight` fill, `colors.text` label, no
  shadow.
- **Disabled**: `colors.divider` fill, `colors.textMuted` label, no shadow,
  `cursor: not-allowed` (web).
- Focus (web/keyboard): 2px outline in `colors.focusRing`, 2px offset —
  never rely on color alone.

### Cards
`colors.card` background, `borderRadius.lg` (12px), `shadows.card` at rest;
an elevated/interactive card (e.g. "today's plan") may use
`shadows.floating` instead to read as more prominent.

### Tags / complexity badges
Pill (`borderRadius.full`), `heights.chip` (32px), one of `tagSimple` /
`tagMedium` / `tagComplex` as background with a darkened version of that
hue for the label text (kept at existing hand-picked text colors — see
showcase CSS — since the stored tokens are backgrounds only).

### Inputs
`heights.input` (48px), `borderRadius.md` (8px), `colors.border` at rest,
`colors.error` border + an error-red hint line below when invalid, focus
ring identical to buttons.

### Status banners
Full-width, `borderRadius.md`, one of `colors.success` / `colors.warning` /
`colors.error` as background with a readable dark/white label — used for
plan-confirmation, missing-day, and network-error states respectively.

All variants/states render side by side in the showcase page's Components
sections.

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

**Already present and kept as-is.** `frontend/assets/icon.png` /
`adaptive-icon.png` / `favicon.png` and the PWA icon set under
`frontend/public/icons/` (`icon-192.png`, `icon-512.png`,
`maskable-512.png`, `apple-touch-icon.png`) already depict a plate with
fork/knife and a heart accent in exactly the terracotta/sage/cream palette
this direction keeps — it was reviewed against the "Farmhouse Kitchen"
direction and found to already fit (same hues, same warm-friendly
character), so it was **not** regenerated. All `<link>`/manifest wiring
(`frontend/public/manifest.json`, `frontend/scripts/inject-pwa.js`) was
already correct and untouched.

---

## 9. Asset inventory

| File | Role |
|---|---|
| `frontend/assets/fonts/Fraunces-Regular.ttf` | Display face, loaded natively via `expo-font` |
| `frontend/assets/fonts/Karla-Regular.ttf` | Body face, loaded natively via `expo-font` |
| `frontend/public/fonts/Fraunces-Regular.woff2` | Same face, self-hosted for the web PWA + showcase page `@font-face` |
| `frontend/public/fonts/Karla-Regular.woff2` | Same face, self-hosted for the web PWA + showcase page `@font-face` |
| `frontend/public/design-tokens.css` | Generated CSS custom properties mirroring `theme/index.ts` — **do not hand-edit**, regenerate (see §10) |
| `frontend/public/design-system.html` | Static showcase page — the live design-system reference |
| `frontend/scripts/generate-design-tokens-css.js` | Generator script that produces `design-tokens.css` from `theme/index.ts` |
| `frontend/assets/icon.png`, `adaptive-icon.png`, `favicon.png`, `public/icons/*.png` | Existing app icon set — reviewed, unchanged (§8) |
| `docs/design/moodboard-farmhouse-kitchen.png` | The chosen Ideogram mood board (documentation only, not shipped in the app) |

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

## 11. Changelog

- **2026-09-14** — Initial design system pass ("Farmhouse Kitchen" uplift).
  Added: full type scale + two self-hosted faces (Fraunces display / Karla
  body) wired app-wide via `Text.defaultProps`; `motion` token set; a
  `focusRing` color token; the token→CSS generator script; the static
  showcase page. Reviewed and kept unchanged: color palette, spacing/
  radius/shadow scales, app icon/favicon set. Targeted font rollout to the
  wordmark, splash tagline, and home-screen greeting only (see §3
  "Extending this" for the pattern to continue it elsewhere).
