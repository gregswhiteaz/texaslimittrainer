# Spec: TASK-3.5 — Read big-index cards drawn in code

Status: READY (approved 2026-11-18 by user via Q-1..Q-4)
Task: TASK-3.5 · Parent/epic: TASK-3 (Play hands at the table) · Requirements: REQ-066.1–REQ-066.4 (also REQ-050.4 colours, REQ-057.1, REQ-058.1, REQ-061.3, REQ-067.3) · Dream: limit-holdem-trainer

## 1. Summary
This is the first UI story. It adds a standalone React SVG card component: `PlayingCard` draws any of the 52 faces in a
big-index style (a large rank plus a large suit symbol, no face-card art), in a two-colour or four-colour deck, and
`CardBack` draws a face-down card showing the TLH logo. The logo becomes the app's first shipped image asset. No screen
changes: the tracer table (TASK-3.1, E03-S01) and the seat display (TASK-3.3, E03-S03) will place these components, and
the Settings toggle (TASK-12.7, E12-S06) will drive the deck mode. Tests prove every face and the back in both browsers
at 1280 × 720, including the 24 CSS px rank height and visual snapshots.

## 2. Scope
- In scope:
  - `src/ui/cards/card-art.ts`: card geometry, colour tables, rank-glyph and suit-symbol SVG path data, accessible
    names.
  - `src/ui/cards/PlayingCard.tsx`: `PlayingCard`, `CardBack`, `DeckColoursContext` and the `DeckColours` type.
  - `src/assets/tlh-logo.jpg`: a 512 × 512 derivative of `dreams/limit-holdem-trainer/brand/tlh-logo.jpg` (A-3).
  - Vitest tests of the rendered markup; Playwright tests (Chromium + WebKit, 1280 × 720) of size, colour, axe and
    visual snapshots against a test-only card gallery (D-4).
- Not doing:
  - Any change to `src/ui/App.tsx`, `src/main.tsx`, `index.html` or any screen. No route, page or link to a card
    gallery ships in the app (D-4, approved Q-4).
  - The Settings "Deck colours" control and its persistence (TASK-12.7, REQ-050.4). Here only a prop and a React
    context with a two-colour default.
  - Placing cards on the table: hole cards, board, empty board placeholders, card-back markers on bot seats
    (TASK-3.1, TASK-3.3), deal animation (REQ-069), card sizes other than the one standard size.
  - Splash, Home logo, app icons, manifest (TASK-2.12, E13); CSP (REQ-058.3).
  - Text card notation in logs ("K♠ 9♦"); fonts or web fonts of any kind.
  - New dependencies (npm packages, image tools in `package.json`).
- Scope budget: files=15, lines=950   (card-art.ts ~230 incl. glyph paths, PlayingCard.tsx ~110, acceptance unit test ~150, card-art unit test ~70, e2e/cards.spec.ts ~150, e2e/cards.visual.spec.ts ~45, gallery entry ~60, gallery bundle helper ~45, plus 1 JPEG and 6 PNG snapshot baselines)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Card code lives in `src/ui/cards/` (two modules: art data + components). Tests in `tests/ui/` and `e2e/` | yes | Follows TASK-1.1 A-8 test layout; keeps the long path data out of the component file | One `src/ui/Card.tsx`; colocated tests |
| A-2 | One standard card size, 60 × 84 CSS px (approved Q-1), used for both the user's hole cards and the board; the components take no size prop | yes | AC#2 measures "the size used for hole cards and the board"; TASK-3.1/3.3 consume it as is. A smaller size (e.g. bot card-back markers) can be added by the story that needs it | `size: 'standard' \| 'small'` prop now; CSS-scaled SVG |
| A-3 | The logo ships as `src/assets/tlh-logo.jpg`: 512 × 512 JPEG, quality 80 (~52 KB, measured), made once with macOS `sips -Z 512 -s format jpeg -s formatOptions 80` from the brand original (1024 × 1024, 191 KB). Imported through Vite (`import logoUrl from '../../assets/tlh-logo.jpg'`) so the build emits one hashed file under `dist/assets/`. No `public/` folder. TASK-2.12 (splash/Home) reuses the same file | yes | REQ-061.3/REQ-067.3 allow the logo and derivatives; 512 px covers the card back at 2× density and a splash-size logo, at a quarter of the original weight; hashed import keeps caching and the later precache list (TASK-13.4) automatic | Original 1024 px file (191 KB); 256 px (~20 KB, too small for splash); WebP; `public/` with a fixed name |
| A-4 | Visual-snapshot baselines are committed for macOS only (Playwright's default `{platform}` suffix: `*-chromium-darwin.png`, `*-webkit-darwin.png`). `e2e/cards.visual.spec.ts` skips on any other platform, so CI (ubuntu-24.04, `.github/workflows/ci.yml:17`) runs every other card e2e test but not the pixel comparison | yes | The builder runs on macOS without Docker, so Linux baselines can't be generated here; Linux and macOS font-free anti-aliasing still differs, so cross-platform baselines would flake. Size, colour, logo and axe checks run in CI regardless | Platform-free baselines with a pixel tolerance; generate Linux baselines later (follow-up F-1) |
| A-5 | An invalid `card` prop (not an integer 0–51) throws `RangeError('Invalid card: <value>')`, reusing `formatCard`'s check (`src/engine/cards.ts:44-47`) | yes | Engine bugs should fail loudly; same message as the engine | Render a blank card |
| A-6 | The rank's measured height is the geometric bounding box of the rank glyph group (stroke excluded), in CSS px. Stroke only adds ink, so this under-reports and is the conservative reading of "at least 24 CSS px" | yes | Exact and font-independent once ranks are SVG paths (Q-1) | Pixel scan of a screenshot |
| A-7 | `deck` prop overrides `DeckColoursContext`; the context default is `'two-colour'` | yes | REQ-050.4 default off; TASK-12.7 only needs to wrap the app in a provider | Prop only; context only |
| A-8 | Component interface: `PlayingCard({ card: Card; deck?: DeckColours })`, `CardBack()`, `DeckColoursContext` (default `'two-colour'`, prop overrides), fixed 60 × 84 size, code in `src/ui/cards/` (§5) | yes | Internal React props with no consumers yet; reclassified from Q-5 by the orchestrator (qa.md D-5) | Size prop now; context only; prop only |

## 3. Current system
- UI today is a placeholder: `src/ui/App.tsx:1-8` renders a heading; `src/main.tsx:11-15` mounts it in `StrictMode`;
  `src/ui/styles.css:1-6` sets `color-scheme: dark`, background `#1e1f22`, `system-ui` font. No `public/` or
  `src/assets/` folder exists; `dist/assets/` holds only JS and CSS.
- Card model to reuse (`src/engine/cards.ts`): `Card` = `rank * 4 + suit`, 0–51 (`:1-2`); rank 0–12 = 2…A (`:3-4`);
  suit 0–3 = clubs, diamonds, hearts, spades (`:5-6`); `cardRank`/`cardSuit` (`:22-28`) do not validate;
  `formatCard` validates and throws `RangeError('Invalid card: …')` (`:44-49`). UI may import engine code; the
  headless boundary only stops engine/bots/advice/stats importing UI (`tools/lint/headless-boundary.js:8,46`).
- Unit tests: Vitest, `node` environment, files `tests/**/*.test.{ts,tsx}` (`vite.config.ts:7-8`); React markup is
  tested with `react-dom/server` (`tests/unit/app.test.tsx:1-11`). Vite resolves asset imports to URL strings in
  Vitest. `tsconfig.json` includes `vite/client` types (`"types": ["node", "vite/client"]`), so `*.jpg` imports
  type-check. Coverage counts `src/**` toward the 70% overall threshold (`vite.config.ts:12-15`).
- E2E: Playwright, `e2e/**/*.spec.ts`, Chromium + WebKit at 1280 × 720 against the built app on port 4173
  (`playwright.config.ts:3-23`). axe helper `expectNoSeriousAxeViolations` (`e2e/support/axe.ts:10`). Existing
  pattern for testing a module the app does not render: build it with Vite's `build()` as an IIFE library in
  `beforeAll` and inject it with `page.addScriptTag` (`e2e/replay-seed.spec.ts:27-41,61`).
- Lint: ESLint strict + react-hooks on `src/ui/**` + Prettier (single quotes, width 100) (`eslint.config.js:23-26`,
  `.prettierrc.json`). CI runs lint, typecheck, build, test, playtest and e2e on ubuntu-24.04
  (`.github/workflows/ci.yml:17,62`).
- Look references: storyboard cards are `#FAFAF7` faces with red `#B42318` and black `#111111` text, 52 × 72
  (board) and 46 × 64 (hole) (`dreams/limit-holdem-trainer/storyboards/Table.dc.html:32-34,51-52`); palette felt
  `#2F6B4F`, red `#D7262E`, navy `#1F3A6E`, silver `#C9CED6` (requirements REQ-067.4); theme charcoal/red/navy/
  silver (REQ-060.3); WCAG 2.1 AA (REQ-057). Logo: `dreams/limit-holdem-trainer/brand/tlh-logo.jpg`, 1024 × 1024
  JPEG on a black background.
- Existing code to reuse:
  - `src/engine/cards.ts` → `Card`, `cardRank`, `cardSuit`, `formatCard` (validation), `RANK_CHARS`/`SUIT_CHARS`
    for test fixtures. No new card type.
  - `e2e/support/axe.ts` → axe check on the gallery.
  - `e2e/replay-seed.spec.ts:27-41` → in-test Vite build pattern for the gallery bundle.
  - `tests/unit/app.test.tsx` → `react-dom/server` markup testing pattern.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Card face design: 60 × 84 px; face `#FAFAF7`, 1 px border; rank top-left, large suit bottom-right; ranks and suits drawn as SVG paths (rounded monoline rank glyphs, filled suits), no `<text>`; ten shown as "10"; accessible names "Ace of spades" / "Face-down card" | See qa.md Q-1 | User-visible look | yes | user (Q-1, qa.md) |
| D-2 | Colours: red `#B42318`, black `#111111`, four-colour green `#1D6B35`, blue `#1D4ED8` | See qa.md Q-2 | User-visible; contrast | yes | user (Q-2, qa.md) |
| D-3 | Card back: black `#000000` fill, 2 px red `#D7262E` inset frame, logo centred | See qa.md Q-3 | User-visible | yes | user (Q-3, qa.md) |
| D-4 | Cards are shown only in a test-only gallery bundle built inside the e2e tests; nothing ships in the app until TASK-3.1 | See qa.md Q-4 | A showcase route would be user-visible | yes | user (Q-4, qa.md) |
| D-5 | Component interface (§5) used by TASK-3.1, 3.3, 12.7 and the Hand Review | Size prop now; context only; prop only | Internal, reversible React props (A-8); orchestrator reclassified Q-5 as assume (qa.md D-5) | no | assumption (A-8) |
| D-6 | Logo derivative and shipping per A-3 | A-3 alternatives | Reversible, low impact | no | n/a |

## 5. Design

### Files to create / modify
- `src/assets/tlh-logo.jpg` — new: 512 × 512 JPEG logo derivative (A-3)
- `src/ui/cards/card-art.ts` — new: geometry constants, colour tables, glyph/suit path data, `cardLabel`
- `src/ui/cards/PlayingCard.tsx` — new: `PlayingCard`, `CardBack`, `DeckColoursContext`, `DeckColours`
- `tests/ui/playing-card.acceptance.test.tsx` — new: AC#1, AC#3, AC#4, AC#5 markup tests over all 52 cards (locked)
- `tests/ui/card-art.test.ts` — new: unit tests for labels, defaults, invalid input, logo file
- `e2e/support/card-gallery.tsx` — new: test-only gallery entry (two-colour grid, four-colour grid, back)
- `e2e/support/card-gallery-bundle.ts` — new: builds the gallery with Vite and loads it into a page
- `e2e/cards.spec.ts` — new: AC#1, AC#2, AC#3, AC#4, AC#5, axe and network checks in Chromium and WebKit (locked)
- `e2e/cards.visual.spec.ts` — new: DoD#1 visual snapshots (locked)
- `e2e/cards.visual.spec.ts-snapshots/faces-two-colour-chromium-darwin.png` — new baseline
- `e2e/cards.visual.spec.ts-snapshots/faces-four-colour-chromium-darwin.png` — new baseline
- `e2e/cards.visual.spec.ts-snapshots/card-back-chromium-darwin.png` — new baseline
- `e2e/cards.visual.spec.ts-snapshots/faces-two-colour-webkit-darwin.png` — new baseline
- `e2e/cards.visual.spec.ts-snapshots/faces-four-colour-webkit-darwin.png` — new baseline
- `e2e/cards.visual.spec.ts-snapshots/card-back-webkit-darwin.png` — new baseline

### Components, interfaces and data
`src/ui/cards/PlayingCard.tsx` (decided as A-8):
```ts
import type { Card } from '../../engine/cards';
export type DeckColours = 'two-colour' | 'four-colour';
/** Default 'two-colour' (REQ-050.4 default off). TASK-12.7 provides the user's setting. */
export const DeckColoursContext: React.Context<DeckColours>;
export interface PlayingCardProps {
  card: Card;              // 0..51; RangeError('Invalid card: <value>') otherwise (A-5)
  deck?: DeckColours;      // overrides the context (A-7)
}
/** Face-up card: <svg width=60 height=84 role="img" aria-label="Ace of spades">. */
export function PlayingCard(props: PlayingCardProps): React.JSX.Element;
/** Face-down card: <svg width=60 height=84 role="img" aria-label="Face-down card"> with the logo. */
export function CardBack(): React.JSX.Element;
```
`src/ui/cards/card-art.ts`:
```ts
export const CARD_WIDTH = 60;  export const CARD_HEIGHT = 84;   // CSS px = SVG user units (viewBox 0 0 60 84)
export const SUIT_NAMES = ['clubs', 'diamonds', 'hearts', 'spades'] as const;            // index = Suit
export const RANK_NAMES = ['Two', …, 'Ten', 'Jack', 'Queen', 'King', 'Ace'] as const;     // index = Rank
export const RANK_LABELS = ['2', …, '9', '10', 'J', 'Q', 'K', 'A'] as const;              // glyph shown (Q-1)
export const SUIT_COLOURS: Record<DeckColours, readonly [string, string, string, string]>; // index = Suit
export function cardLabel(card: Card): string;  // 51 -> 'Ace of spades'; 32 -> 'Ten of clubs'; validates
export const RANK_GLYPHS: Readonly<Record<RankLabel, { width: number; d: string }>>;     // monoline paths
export const SUIT_SYMBOLS: Readonly<Record<SuitName, { width: number; d: string }>>;     // filled paths
```
Markup contract (tests depend on it; builder must not change the hooks):
- Face root: `<svg xmlns width="60" height="84" viewBox="0 0 60 84" role="img" aria-label="<cardLabel>"
  data-card="<formatCard>" data-deck="<two-colour|four-colour>">`.
- Exactly one `<g data-part="rank" data-rank="<RANK_LABEL>" fill|stroke="<colour>">` containing only `<path>`s.
- Exactly one `<g data-part="suit" data-suit="<suit name>" fill="<colour>">` containing only `<path>`s.
- The colour is set as the `fill` (suit) and `stroke` (monoline rank) attribute on the group, so it is readable both
  from markup and from `getComputedStyle`.
- Faces contain no `<image>`, `<img>`, `<foreignObject>`, `<text>`, `<use href=…external>`, or `url(` references.
- Back root: same size, `role="img" aria-label="Face-down card" data-card="back"`, containing exactly one
  `<image data-part="logo" href="<logoUrl>" preserveAspectRatio="xMidYMid meet">` and no rank or suit parts.
- Children of the root `<svg>` are `aria-hidden` by default (role=img); no `<title>` element (avoid duplicate names).

### Rules and algorithms
- Rank/suit come from `cardRank(card)` / `cardSuit(card)` after `formatCard(card)` validates it.
- Geometry (approved Q-1, user units = CSS px): face rect `x=0.5 y=0.5 w=59 h=83 rx=5`, fill `#FAFAF7`, stroke
  `#A7AEB8` 1 px. Rank glyph: top-left, origin (6, 6), glyph box height 28 (centreline geometry), stroke-width 4.5,
  round caps/joins, no fill; widths ≤ 28 ("10" is the widest). Ink height ≈ 32.5 px; measured geometry ≥ 28 ≥ 24.
  Large suit: filled path, height 30, width ≤ 30, bottom-right with its box ending at (54, 78).
- Preview (two-colour, A♠ and 10♥):
```
 +------------+   +------------+
 | /\         |   | |  /\      |
 |/--\        |   | | |  |     |
 |    \       |   | |  \/      |
 |            |   |            |
 |      /\    |   |     _  _   |
 |     /  \   |   |    ( \/ )  |
 |    (_/\_)  |   |     \  /   |
 |      /\    |   |      \/    |
 +------------+   +------------+
  black #111111     red #B42318
```
- Colours (approved Q-2), `SUIT_COLOURS[mode][suit]`:

| Suit | two-colour | four-colour | contrast on `#FAFAF7` |
|---|---|---|---|
| clubs | `#111111` | `#1D6B35` (green) | 18.1 : 1 / 6.3 : 1 |
| diamonds | `#B42318` | `#1D4ED8` (blue) | 6.3 : 1 / 6.4 : 1 |
| hearts | `#B42318` | `#B42318` | 6.3 : 1 |
| spades | `#111111` | `#111111` | 18.1 : 1 |

  All exceed WCAG 2.1 AA 4.5 : 1 for text and 3 : 1 for graphics (REQ-057). Face vs felt `#2F6B4F` 6.0 : 1; face vs
  charcoal `#1E1F22` 15.8 : 1.
- Back (approved Q-3): rect fill `#000000` rx 5; inset frame rect at 3 px, stroke `#D7262E` width 2, no fill; logo
  `<image>` x 4, y 16, 52 × 52 (square logo centred vertically). Black back vs felt 3.3 : 1.
- Accessible names (approved Q-1): `<RANK_NAMES[rank]> of <SUIT_NAMES[suit]>`, e.g. "Two of clubs", "Ten of
  diamonds", "Ace of spades"; back "Face-down card".

### Error handling and configuration
- `PlayingCard` with `card` outside 0..51 or non-integer → `RangeError('Invalid card: <String(card)>')` thrown during
  render (from `formatCard`). `cardLabel` same.
- No configuration beyond `deck` / `DeckColoursContext`. Default `'two-colour'`.

### Test-only gallery (approved Q-4)
- `e2e/support/card-gallery.tsx` renders into `#root`: `<main><h1>Card gallery</h1>` then
  `<section aria-label="Two-colour deck" data-testid="faces-two-colour">` with all 52 `PlayingCard`s (13 columns ×
  4 rows, order 2c…As, gap 8 px, padding 8 px, background `#2F6B4F`), the same for `"Four-colour deck"`
  (`data-testid="faces-four-colour"`, inside `DeckColoursContext.Provider value="four-colour"`), and
  `<section aria-label="Card back" data-testid="card-back">` with one `CardBack`.
- `e2e/support/card-gallery-bundle.ts` exports `buildCardGallery(): Promise<string>` (Vite `build()` with
  `configFile: false`, `plugins: [react()]`, `define: { 'process.env.NODE_ENV': '"production"' }`, `write: false`,
  `lib: { entry, formats: ['iife'], name: 'TlhCardGallery' }`, as in `e2e/replay-seed.spec.ts:28-36`; in library mode
  Vite inlines the logo as a `data:image/jpeg` URL) and `openCardGallery(page, bundle)` which calls
  `page.setContent('<!doctype html><html lang="en"><head><title>Card gallery</title></head><body><div id="root"></div></body></html>')`,
  adds the script and waits for `[data-testid="card-back"] image` to have decoded (`HTMLImageElement` probe of its
  `href` resolving `naturalWidth === 512`).

## 6. Behaviour specification

### SPEC-01: Every face shows its rank and a suit symbol and no image
- Verifies: AC#1
- Behaviour: Given each of the 52 cards in each deck mode, When `<PlayingCard card={c} deck={mode} />` is rendered with `renderToStaticMarkup`, Then the root is `<svg>` with `width="60" height="84" role="img"` and `aria-label` equal to `cardLabel(c)` (e.g. 51 → "Ace of spades", 32 → "Ten of clubs"); it has exactly one `data-part="rank"` group whose `data-rank` is `RANK_LABELS[cardRank(c)]` and which contains at least one `<path`; exactly one `data-part="suit"` group whose `data-suit` is `SUIT_NAMES[cardSuit(c)]` and which contains at least one `<path`; and the markup contains none of `<image`, `<img`, `<foreignObject`, `<text`, `url(`.
- Verification: acceptance `tests/ui/playing-card.acceptance.test.tsx::every face shows its rank and suit and no image`

### SPEC-02: Rank and suit are large at 1280 × 720
- Verifies: AC#1, AC#2
- Behaviour: Given the gallery at a 1280 × 720 viewport (device scale factor 1) in Chromium and WebKit, When every `[data-part="rank"]` and `[data-part="suit"]` of the 104 faces is measured, Then for each element both Playwright `boundingBox().height` and the geometric height (`getBBox().height × getScreenCTM().d`) are ≥ 24 CSS px, and each card's root `<svg>` bounding box is 60 × 84 (± 0.5) CSS px.
- Verification: acceptance `e2e/cards.spec.ts::rank and suit are at least 24 CSS px tall at 1280x720`

### SPEC-03: Two-colour deck
- Verifies: AC#3
- Behaviour: Given two-colour mode (explicit `deck="two-colour"`, and separately no prop and no provider), When all 52 faces are rendered, Then for hearts and diamonds the rank group `stroke` and suit group `fill` are `#B42318` (red), and for spades and clubs both are `#111111` (black); in the browser gallery `getComputedStyle` gives `rgb(180, 35, 24)` and `rgb(17, 17, 17)` respectively.
- Verification: acceptance `tests/ui/playing-card.acceptance.test.tsx::two-colour deck colours` and acceptance `e2e/cards.spec.ts::two-colour deck colours in the browser`

### SPEC-04: Four-colour deck
- Verifies: AC#4
- Behaviour: Given four-colour mode (explicit `deck="four-colour"`, and separately via `DeckColoursContext.Provider value="four-colour"` with no prop), When all 52 faces are rendered, Then rank and suit colours are clubs `#1D6B35` (green), diamonds `#1D4ED8` (blue), hearts `#B42318` (red), spades `#111111` (black); in the browser gallery the computed colours are `rgb(29, 107, 53)`, `rgb(29, 78, 216)`, `rgb(180, 35, 24)`, `rgb(17, 17, 17)`.
- Verification: acceptance `tests/ui/playing-card.acceptance.test.tsx::four-colour deck colours` and acceptance `e2e/cards.spec.ts::four-colour deck colours in the browser`

### SPEC-05: Prop overrides context; default is two-colour
- Verifies: AC#3, AC#4
- Behaviour: Given a `DeckColoursContext.Provider value="four-colour"`, When `<PlayingCard card={1} deck="two-colour" />` (2d) renders, Then the diamond is `#B42318`; Given no provider and no prop, Then `data-deck="two-colour"`.
- Verification: unit `tests/ui/card-art.test.ts::deck prop overrides context and default is two-colour`

### SPEC-06: Card back shows the TLH logo
- Verifies: AC#5
- Behaviour: Given `<CardBack />`, When rendered with `renderToStaticMarkup`, Then the root `<svg>` is 60 × 84 with `role="img"` and `aria-label="Face-down card"`, it contains exactly one `<image data-part="logo">` whose `href` equals the URL from `import logoUrl from '../../src/assets/tlh-logo.jpg'`, and it has no `data-part="rank"` or `data-part="suit"`. In the browser gallery (Chromium, WebKit) the logo image's bounding box is at least 48 × 48 CSS px inside the 60 × 84 back and its source decodes to a 512 × 512 image.
- Verification: acceptance `tests/ui/playing-card.acceptance.test.tsx::card back shows the TLH logo` and acceptance `e2e/cards.spec.ts::card back shows the decoded TLH logo`

### SPEC-07: Visual snapshots of all faces in both modes and the back
- Verifies: DoD#1
- Behaviour: Given the gallery on macOS in Chromium and WebKit, When the `faces-two-colour`, `faces-four-colour` and `card-back` sections are screenshotted with animations disabled, Then each matches its committed baseline (`faces-two-colour.png`, `faces-four-colour.png`, `card-back.png`, Playwright default threshold); on other platforms the test is skipped with reason "visual baselines are macOS-only (A-4)".
- Verification: acceptance `e2e/cards.visual.spec.ts::cards match visual snapshots`

### SPEC-08: Invalid card input throws
- Verifies: DoD#2
- Behaviour: Given `card` = 52, -1, 1.5 or NaN, When `PlayingCard` renders or `cardLabel` is called, Then it throws `RangeError` with message `Invalid card: 52` (resp. `-1`, `1.5`, `NaN`).
- Verification: unit `tests/ui/card-art.test.ts::invalid cards throw RangeError`

### SPEC-09: Shipped logo asset is the small derivative
- Verifies: AC#5, DoD#9
- Behaviour: Given `src/assets/tlh-logo.jpg`, When read from disk, Then it starts with JPEG SOI `FF D8`, its SOF frame header gives 512 × 512, its size is ≤ 65,536 bytes, and it is the only file under `src/assets/`; `logoUrl` in Vitest is a same-origin path (starts with `/`), not `http`.
- Verification: unit `tests/ui/card-art.test.ts::logo asset is a 512px JPEG under 64 KB`

### SPEC-10: Gallery passes axe and makes no network requests
- Verifies: DoD#8, DoD#9
- Behaviour: Given the gallery in Chromium and WebKit, When `expectNoSeriousAxeViolations(page)` runs, Then it resolves (zero serious or critical violations, including `svg-img-alt` and `color-contrast`); and every request the page makes while rendering is `data:` or `about:` (no `http(s)` request). The existing `e2e/smoke.spec.ts` same-origin test still passes unchanged.
- Verification: acceptance `e2e/cards.spec.ts::gallery has no serious axe violations and no network requests`

### SPEC-11: Checks and coverage pass
- Verifies: DoD#2, DoD#3, DoD#5, DoD#6
- Behaviour: Given the change, When the commands run, Then `npm run lint`, `npm run typecheck`, `npm test` (coverage ≥ 70% overall; engine thresholds unchanged) and `npm run e2e` exit 0; no file under `src/engine`, `src/bots`, `src/advice` or `src/stats` changes, so the headless boundary holds.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run e2e`

### SPEC-12: CI green and story documentation published
- Verifies: DoD#11, DoD#12
- Behaviour: Given the branch is pushed, When CI runs, Then the workflow is green (visual snapshot test skipped on Linux per A-4); and a Backlog story doc for TASK-3.5 is published.
- Verification: manual CI run on branch `doit/TASK-3.5` and `backlog doc list --plain` shows the TASK-3.5 doc

### SPEC-13: Not-applicable DoD items
- Verifies: DoD#4, DoD#7, DoD#10, DoD#13
- Behaviour: Given this story, Then DoD#4 is N/A (no golden-spot suite exists yet; TASK-7.11/TASK-7.14 not done), DoD#7 is N/A (no engine, bots or advice change), DoD#10 is N/A (no strategy content), DoD#13 is N/A (no screen or dialog added; the service worker, TASK-13.4, does not exist).
- Verification: manual Judge confirms no files under `src/engine`, `src/bots`, `src/advice`, `src/ui/App.tsx` or `src/main.tsx` changed

## 7. Edge cases
- Invalid card values (out of range, fractional, NaN): SPEC-08.
- Widest rank "10" still fits the card and meets 24 px: SPEC-02 measures all 13 ranks.
- No context provider: SPEC-03/SPEC-05 (default two-colour). Provider plus prop: SPEC-05.
- Logo fails to load: cannot happen in the harness (inlined data URL); in the app it is a same-origin hashed file. The
  back still draws its black fill and frame, and its accessible name is unchanged. No SPEC (no recovery behaviour).
- High-DPI screens: SVG scales; logo 512 px covers 2× density. Not tested (A-3).
- Empty, duplicate, concurrency, permissions: N/A (pure stateless rendering).

## 8. Security considerations
- Trust boundaries: none new. `card` is an engine integer validated by `formatCard`; no user text reaches the SVG.
- Injection: path data and colours are constants; React escapes attributes. No `dangerouslySetInnerHTML`.
- Network/privacy: no fonts, no external URLs; the logo is a same-origin asset (REQ-058.1). SPEC-10.
- New dependencies: none. Randomness, secrets, authn/authz, logging: N/A.

## 9. Non-functional
- Readability: rank and suit ≥ 24 CSS px at 1280 × 720 (SPEC-02); colour contrast ≥ 4.5 : 1 on the face (§5 table,
  axe in SPEC-10).
- Weight: logo ≤ 64 KB (SPEC-09); `card-art.ts` path data ≤ 12 KB source.
- Rendering cost: a face is ≤ 6 SVG elements; no measurement target (52 cards render instantly).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx playwright test e2e/cards.spec.ts e2e/cards.visual.spec.ts --project=chromium` (the cards are not
  reachable in the app until TASK-3.1; open `playwright-report/index.html` to see the gallery screenshots)
- New tests:
  - `tests/ui/playing-card.acceptance.test.tsx` → SPEC-01, SPEC-03, SPEC-04, SPEC-06
  - `tests/ui/card-art.test.ts` → SPEC-05, SPEC-08, SPEC-09
  - `e2e/cards.spec.ts` → SPEC-02, SPEC-03, SPEC-04, SPEC-06, SPEC-10
  - `e2e/cards.visual.spec.ts` (+ 6 baselines, created with `npx playwright test e2e/cards.visual.spec.ts --update-snapshots`) → SPEC-07
- Judge end-to-end: run `npm run e2e`; open the HTML report, inspect the three visual baselines for both browsers:
  every face readable with a big rank top-left and big suit bottom-right, four-colour clubs green and diamonds blue,
  the back showing the TLH logo; confirm no change to the app's start page (`npm run build && npm run preview`).

## 11. Open questions
None. Q-1..Q-4 answered with the recommended options (doit/TASK-3.5/qa.md), recorded in D-1..D-4; Q-5 recorded as A-8 / D-5.

Follow-ups (become tasks):
- F-1: Generate Linux visual baselines in the Playwright Docker image and drop the macOS-only skip in `e2e/cards.visual.spec.ts`.
- F-2: Wire `DeckColoursContext` to the persisted "Deck colours" setting at the app root (TASK-12.7).
- F-3: Add a smaller card-back marker size for bot seats when TASK-3.3 needs it.
- F-4: Reuse `src/assets/tlh-logo.jpg` for splash/Home (TASK-2.12) and derive app icons from it (E13); no other image source.

## 12. Clarifications log
See `doit/TASK-3.5/qa.md`.
