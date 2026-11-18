# Spec: TASK-2.1 — Start a game from Home through Game Config

Status: READY (approved 2026-11-18 by user via Q-1..Q-4)
Task: TASK-2.1 · Parent/epic: TASK-2 (Launch and set up a session) · Requirements: REQ-002.1, REQ-002.2, REQ-006.1, REQ-060.3, REQ-061.3 (REQ-002.3–.6 Statistics/Settings/Resume are E11/E12/TASK-2.6; REQ-003 snapshot is TASK-2.16/2.17; REQ-005/006 selectors are TASK-2.2–2.4) · Dream: limit-holdem-trainer

## 1. Summary
The app stops opening straight on the table. On load it shows Home (TLH logo, the name "TLH Trainer" and a red
New game control on the charcoal theme). New game opens a minimal Game Config screen that shows the fixed
first-use session (Cash game, 6 players, $4/$8, you plus five TAG bots) with Start game and Cancel / ← Home.
Start game builds the full `SessionConfig` (game type, players, stake, line-up, speed, user seat, button) and
hands it to the existing Table of TASK-3.1/3.2, which deals the first hand. Navigation is in-app screen state; no
router, nothing is stored.

## 2. Scope
- In scope:
  - `src/table/session.ts`: grow `SessionConfig { stake }` into the full plain-data configuration (D-2, Q-2) with
    `DEFAULT_SESSION_CONFIG` as the first-use value; `seatSession` accepts `Partial<SessionConfig>` merged over
    the defaults; the table uses the configured seats, user seat and button instead of the module constants.
  - `src/table/action-bar.ts`, `src/ui/table/Table.tsx`, `src/ui/table/useTableSession.ts`: read the user seat
    from `table.config.userSeat`; accept `Partial<SessionConfig>`.
  - `src/ui/App.tsx`: screen state `home → config → table`, Cancel/← Home back to `home`.
  - New screens `src/ui/home/HomeScreen.tsx`, `src/ui/config/GameConfigScreen.tsx`, `src/ui/table/TableScreen.tsx`.
  - `src/ui/styles.css`: charcoal page theme and the Home/Config styles from the storyboards.
  - Tests: new Playwright `e2e/home.spec.ts`; new Vitest `tests/ui/home.acceptance.test.tsx`,
    `tests/table/session-config.acceptance.test.ts`, `tests/table/session-config.test.ts`; updated
    `tests/unit/app.test.tsx`; the cross-story edits of D-5 (Q-3).
- Not doing:
  - Statistics, Settings and Resume session entries on Home (E11, E12, TASK-2.6/2.7); last-session snapshot and
    first-use message (TASK-2.16, TASK-2.17); the storyboard's "Sample data" tag.
  - Any Game Config selector or editable field: players (TASK-2.2), stake (TASK-2.3), game type (TASK-2.4),
    line-up (TASK-2.5, 2.8, 2.9), speed (TASK-2.11); remembering the last configuration (TASK-2.10).
  - Random user seat and button (TASK-2.13); Table header Home control and pausing (TASK-2.14); splash (TASK-2.12);
    session persistence (TASK-3.10); validation of loaded/persisted configs (first loader: TASK-2.6/3.10).
  - Sit-and-go config shape (TASK-2.4 widens the type), Realistic pacing (TASK-3.18), other bot styles (E06).
  - A router dependency or History API integration (D-3, A-2); web fonts (A-5); CSP, PWA manifest, icons (E13).
  - Changes to `src/engine`, `src/bots`, `src/advice`, `src/playtest`, the lint/test/Playwright config, or any
    earlier-story test beyond the exact D-5 edits.
- Scope budget: files=16, lines=700   (session.ts ~50, action-bar.ts ~3, Table.tsx ~4, useTableSession.ts ~4, App.tsx ~35, HomeScreen.tsx ~35, GameConfigScreen.tsx ~75, TableScreen.tsx ~15, styles.css ~90, e2e/home.spec.ts ~190, tests/ui/home.acceptance.test.tsx ~80, tests/table/session-config.acceptance.test.ts ~40, tests/table/session-config.test.ts ~70, tests/unit/app.test.tsx ~12, e2e/table.spec.ts +2, e2e/action-bar.spec.ts +2, tests/ui/table.acceptance.test.tsx ~5).

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Home, Game Config and Table are three in-app screens held in `App` state (`{ name: 'home' } \| { name: 'config' } \| { name: 'table'; config }`); a page load always opens Home. | yes | One entry point (story); no new dependency; Table already takes a `config` prop (TASK-3.1 A-10). | Router library (new dependency); URL hash routes |
| A-2 | Screen changes add no browser-history entries: the browser Back button leaves the app (to whatever page came before), and reload opens Home. Mid-hand reload behaves as in TASK-3.1 (hand discarded) but now lands on Home. | yes | Without persistence (TASK-3.10) there is nothing to restore on Back/forward; avoids a half-working history. | `history.pushState` per screen with `popstate` handling (follow-up F-3) |
| A-3 | Controls are native `<button type="button">`s (New game, ← Home, Cancel, Start game), not the storyboard's `<a href>`s; "← Home" is styled as the storyboard's link (`#FF6B70`, underline-free, 14 px) but sized ≥ 44 px tall. | yes | There are no URLs to link to (A-1); REQ-057.2 allows native buttons; REQ-057.4 44 px targets. | Anchors with `href="#"` |
| A-4 | After a screen change (not on first load), focus moves to the new screen's `<h1>` (`tabIndex={-1}`). | yes | The clicked button unmounts; without this focus drops to `<body>` and screen-reader users lose their place. | Leave focus on `<body>` |
| A-5 | No Inter web font: the storyboards' Google Fonts link is dropped, text uses the existing `system-ui, sans-serif` stack (`src/ui/styles.css:5`). | yes | REQ-058.1 forbids third-party requests; bundling a font is a new asset (REQ-067.3 allows only the logo). | Self-host Inter (needs approval) |
| A-6 | The New game card's subtitle "Set up a cash game or sit-and-go" is `#FFFFFF`, not the storyboard's `#FBE3E4`. | yes | `#FBE3E4` on `#D7262E` is 4.09:1, below WCAG AA 4.5:1 for 14 px text (axe `color-contrast`, serious); `#FFFFFF` on `#D7262E` is 4.99:1 (computed with the WCAG 2.1 formula). | Darker red behind the subtitle; 18.66 px bold subtitle (3:1 rule) |
| A-7 | Home keeps the storyboard's subtitle text "Set up a cash game or sit-and-go" although Sit-and-go arrives in TASK-2.4/E05. | yes | Storyboard text is approved; changing it now and back later is churn. | "Set up a cash game" until TASK-2.4 |
| A-8 | Home's menu column keeps the storyboard width (`max-width: 508px`, i.e. half of the 1040 px container minus the 24 px gap) with the right-hand "Last session" column absent until TASK-2.16/2.17. | yes | Matches `storyboards/Home.dc.html` (flex `1 1 340px` columns in a 1040 px container); avoids a 1040 px-wide red bar. | Full-width New game card |
| A-9 | The Home logo is `<img alt="" width="64" height="64">` with `border-radius: 12px`, beside the `<h1>`. | yes | Storyboard `Home.dc.html:23` uses `alt=""`: the adjacent heading already names the app, so the logo is decorative for assistive tech. | `alt="TLH logo"` |
| A-10 | The page background (`html`) becomes charcoal `#0E0F12` with text `#F2F3F5` for every screen, including the Table screen around the felt. | yes | REQ-060.3 charcoal backgrounds; storyboards `body{background:#0E0F12}`; the Table's felt keeps its own colour (TASK-3.16 owns table theme). | Charcoal on Home/Config only |
| A-11 | No validation of `SessionConfig` invariants in this story (e.g. `players === seats.length`, exactly one user seat equal to `userSeat`, `button` among the seats); the only producer is `DEFAULT_SESSION_CONFIG`. | yes | No untrusted or persisted config exists yet; the first loader (TASK-2.6/3.10) must validate (follow-up F-4). | `assertSessionConfig` now |

## 3. Current system
- Stack: React 19 + Vite 8 + TypeScript 6 strict (`package.json`), Vitest in `node` environment with
  `renderToString` for UI (no jsdom; `vite.config.ts:9`, `tests/unit/app.test.tsx:1`), Playwright in Chromium and
  WebKit at 1280 × 720 against `npm run build && npm run preview` on port 4173 (`playwright.config.ts:3,17-18`),
  axe via `e2e/support/axe.ts::expectNoSeriousAxeViolations`.
- Entry: `src/main.tsx` renders `<App />` in `StrictMode`; `src/ui/App.tsx:3-9` renders
  `<main><h1>TLH Trainer</h1><Table /></main>` — the app opens on the table today.
- Session: `src/table/session.ts:29-32` `SessionConfig { stake }`, `DEFAULT_SESSION_CONFIG = { stake: $4/$8 }`;
  `USER_SEAT = 5`, `DEFAULT_BUTTON = 6`, `DEFAULT_SEATS` Ava, Ben, Cal, Dee, You(5), Eli, bots `style: 'TAG'`
  (`session.ts:49-64`); `seatSession(config)` (`:83-94`) uses `DEFAULT_SEATS`; `dealHand` uses `DEFAULT_BUTTON`
  (`:108`); `nextStep`, `applyUserAction`, `completedHand` use `USER_SEAT` (`:100,126,164,171`);
  `buyIn = 20 × bigBet` (`:45-47`), `stakesFor` (`:35-42`). Also `USER_SEAT` in `src/table/action-bar.ts:49` and
  `src/ui/table/Table.tsx:16`. `useTableSession({ config = DEFAULT_SESSION_CONFIG })` (`useTableSession.ts:24-29`).
- Earlier callers pass a stake-only config: `tests/table/session.acceptance.test.ts:101`
  (`seatSession({ stake: … })`, locked TASK-3.1), `tests/ui/table.acceptance.test.tsx:38` (locked TASK-3.1),
  `e2e/support/table-harness.tsx:12` — hence `Partial<SessionConfig>` input (D-2).
- Tests that load `/` and expect the table at once: `e2e/table.spec.ts:74-78` `openApp` (locked TASK-3.1),
  `e2e/action-bar.spec.ts:10-13` `openApp` (locked TASK-3.2); `tests/ui/table.acceptance.test.tsx:41-43` renders
  `<App />` and expects the seated table (locked TASK-3.1); `tests/unit/app.test.tsx` (unit, not locked).
  `e2e/smoke.spec.ts` (locked TASK-1.1) needs `<title>TLH Trainer</title>` (kept in `index.html:6`), an
  `<h1>` "TLH Trainer" on `/`, axe clean and same-origin requests — Home satisfies it unchanged.
  `e2e/replay-seed.spec.ts` counts `getRandomValues` calls only after its own `before` mark — unaffected.
- Logo: `dreams/limit-holdem-trainer/brand/tlh-logo.jpg` 1024 × 1024, 190,991 bytes; `src/assets/tlh-logo.jpg`
  512 × 512 q80 derivative, 52,065 bytes (TASK-3.5 A-3, `doit/TASK-3.5/spec.md:39`), imported by
  `src/ui/cards/PlayingCard.tsx:2` for the card back; `tests/ui/card-art.test.ts:79-87` asserts it is the only
  file in `src/assets/`, 512 × 512 and ≤ 65,536 bytes; card-back pixel baselines
  `e2e/cards.visual.spec.ts-snapshots/card-back-{chromium,webkit}-darwin.png` (locked TASK-3.5).
  TASK-2.12 AC#6: splash and Home "reuse src/assets/tlh-logo.jpg and add no other copy of the logo image".
- Theme today: `:root { background: #1e1f22; color: #f2f2f2 }` (`src/ui/styles.css:1-6`).
- Storyboards: `storyboards/Home.dc.html` (header 64 px logo radius 12 + `<h1>` 28 px/700; red `#D7262E` New game
  card, 20 px/600 title, 14 px subtitle, padding 20 × 24, radius 10; container max 1040 px, padding 32 × 16);
  `storyboards/Config.dc.html` (`← Home` link + `<h1>` "New game"; panels `#1A1D22`, border `#343A43`, radius 10,
  padding 24; field labels 14 px/600; Cancel = outline `#4A515C`, Start game = red `#D7262E`, 16 px/600, both
  min-height 44 px, right-aligned).
- Contrast (WCAG 2.1, computed): `#FFFFFF`/`#D7262E` 4.99; `#FBE3E4`/`#D7262E` 4.09; `#F2F3F5`/`#0E0F12` 17.26;
  `#A7AEB8`/`#0E0F12` 8.57; `#A7AEB8`/`#1A1D22` 7.56; `#F2F3F5`/`#1A1D22` 15.22; `#FF6B70`/`#0E0F12` 6.93.
- Existing code to reuse:
  - `src/table/session.ts` → `DEFAULT_SEATS`, `USER_SEAT`, `DEFAULT_BUTTON`, `buyIn`, `SessionSeat`, `Stake`
    as the defaults and types of the new config; no second seat list.
  - `src/ui/table/Table.tsx` → the Table screen body, unchanged except the user-seat source.
  - `src/assets/tlh-logo.jpg` via `import logoUrl from '../../assets/tlh-logo.jpg'` (as in `PlayingCard.tsx:2`)
    — Home reuses it (D-1, Q-1).
  - `e2e/support/axe.ts::expectNoSeriousAxeViolations`; `e2e/support/table-harness-bundle.ts::stubReplayWords`
    (pins and lets the test count replay-code draws).
  - Same-origin request check pattern of `e2e/smoke.spec.ts:33-42`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Home uses the existing 512 px `src/assets/tlh-logo.jpg` (the card-back file, `import logoUrl from '../../assets/tlh-logo.jpg'`); no new image file. AC#2 was reworded in Backlog to the resized-derivative check (qa.md Q-1); REQ-061.3 is read as "the logo comes from brand/tlh-logo.jpg". | Ship the 1024 px original unchanged for Home and card back (+138,926 B, card-art test and card-back baselines change); ship both files (+190,991 B, breaks TASK-2.12 AC#6) | No bundle change, no churn to TASK-3.5's tests; 512 px is 8× the 64 px Home size | yes | user (Q-1) |
| D-2 | `SessionConfig` becomes the full plain-data object below; `seatSession`/`Table`/`useTableSession` take `Partial<SessionConfig>` merged over `DEFAULT_SESSION_CONFIG`; `TableState.config` is always complete. First-use values: gameType `'cash'`, players 6, stake $4/$8, lineUp `'Custom'`, seats `DEFAULT_SEATS`, speed `'rapid'`, userSeat 5, button 6. No version field (storage layer versions data, REQ-054). | Nested `{ table: {...}, lineUp: {...} }`; class with methods; required-only input (edits to three locked tests); a `version` field now | Plain JSON-serialisable data is persistable as is; partial input keeps the stake-only callers in locked tests compiling | yes | user (Q-2) |
| D-3 | No router: `App` holds the current screen in `useState` (A-1, A-2). | react-router (new dependency); hash routes | Three screens, no deep links needed before persistence | no | n/a |
| D-4 | The Table really uses `config.seats`, `config.userSeat` and `config.button` (not just carries them): `seatSession` seats `config.seats`, `dealHand` uses `config.button`, user-seat checks use `table.config.userSeat`. `USER_SEAT`, `DEFAULT_BUTTON`, `DEFAULT_SEATS` stay exported as the defaults. | Carry the fields unused until TASK-2.13 | AC#6 "When the Table receives it" is only meaningful if the Table honours it; TASK-2.13 then only changes values | no | n/a |
| D-5 | Earlier-story tests are kept working by the exact edits listed below under "Cross-story test edits", which route them through the new flow and remove no assertion: (1) `e2e/table.spec.ts` `openApp` — after `await page.goto('/');` add `await page.getByRole('button', { name: 'New game' }).click();` and `await page.getByRole('button', { name: 'Start game' }).click();`; (2) `e2e/action-bar.spec.ts` `openApp` — the same two lines after `await page.goto('/');`; (3) `tests/ui/table.acceptance.test.tsx` — replace `import App from '../../src/ui/App';` with `import { TableScreen } from '../../src/ui/table/TableScreen';` plus `import { DEFAULT_SESSION_CONFIG } from '../../src/table/session';`, and `renderToString(<App />)` with `renderToString(<TableScreen config={DEFAULT_SESSION_CONFIG} />)` (the `<h1>TLH Trainer</h1>` and `$160` assertions stay); (4) `tests/unit/app.test.tsx` (unlocked unit) rewritten to expect Home. Each locked file is unlocked with `doit.py unlock TASK-2.1 <file> --reason "D-5, approved Q-3"`. | Shipped test hook (`?screen=table`, `initialScreen` prop) that skips Home; leaving the tests red | The edits make every earlier flow pass through the real Home → Config → Start path; all earlier assertions are kept verbatim | yes | user (Q-3) |
| D-6 | Game Config in this slice is a read-only summary of `DEFAULT_SESSION_CONFIG` rendered from the same object that Start game hands to the Table. Exact text and layout: the §5 preview as approved (qa.md Q-4). | Show the storyboard's selectors disabled; "TAG" labels; show only the two buttons | Read-only rows can't be mistaken for working selectors; text derives from the config, so screen and table can't disagree | yes | user (Q-4) |

### Cross-story test edits (approved Q-3; nothing else in these files may change)
1. `e2e/table.spec.ts` (locked, TASK-3.1) — in `openApp`, after `await page.goto('/');` add exactly:
   `await page.getByRole('button', { name: 'New game' }).click();` and
   `await page.getByRole('button', { name: 'Start game' }).click();`
2. `e2e/action-bar.spec.ts` (locked, TASK-3.2) — in `openApp`, the same two lines after `await page.goto('/');`.
3. `tests/ui/table.acceptance.test.tsx` (locked, TASK-3.1) — replace `import App from '../../src/ui/App';` with
   `import { TableScreen } from '../../src/ui/table/TableScreen';`, add
   `import { DEFAULT_SESSION_CONFIG } from '../../src/table/session';`, and replace `renderToString(<App />)` with
   `renderToString(<TableScreen config={DEFAULT_SESSION_CONFIG} />)`; the `<h1>TLH Trainer</h1>` and `$160`
   assertions stay.
4. `tests/unit/app.test.tsx` (unit, not locked) — rewritten to expect Home (SPEC-11).

## 5. Design

### Files to create / modify
- `src/table/session.ts` — modify: full `SessionConfig`, `DEFAULT_SESSION_CONFIG`, `resolveSessionConfig`, config-driven seats/user seat/button (D-2, D-4)
- `src/table/action-bar.ts` — modify: `userActionBar` uses `table.config.userSeat`
- `src/ui/table/useTableSession.ts` — modify: `config?: Partial<SessionConfig>`
- `src/ui/table/Table.tsx` — modify: user cards from `table.config.userSeat`
- `src/ui/table/TableScreen.tsx` — new: `<main><h1>TLH Trainer</h1><Table config={config} /></main>`
- `src/ui/home/HomeScreen.tsx` — new: Home screen
- `src/ui/config/GameConfigScreen.tsx` — new: minimal Game Config screen
- `src/ui/App.tsx` — modify: screen state and navigation
- `src/ui/styles.css` — modify: charcoal theme, Home and Config styles
- `e2e/home.spec.ts` — new: Playwright acceptance of the Home → Config → Table flow (Chromium, WebKit)
- `tests/ui/home.acceptance.test.tsx` — new: rendered Home and Game Config markup
- `tests/table/session-config.acceptance.test.ts` — new: first-use `SessionConfig` reaches the table
- `tests/table/session-config.test.ts` — new: partial merge, configured seat/button honoured, JSON round-trip, headless
- `tests/unit/app.test.tsx` — modify: App opens on Home (D-5 item 4)
- `e2e/table.spec.ts` — modify (cross-story, D-5 item 1, two added lines only)
- `e2e/action-bar.spec.ts` — modify (cross-story, D-5 item 2, two added lines only)
- `tests/ui/table.acceptance.test.tsx` — modify (cross-story, D-5 item 3)

### Components, interfaces and data
`src/table/session.ts` (headless; imports engine and bots only):
```ts
export type GameType = 'cash';                 // TASK-2.4 widens: 'sit-and-go' (no stake)
export type LineUpName = 'Mixed' | 'Tough' | 'Soft' | 'Custom';   // REQ-009.1, REQ-009.6
export type Speed = 'rapid';                   // TASK-2.11 / TASK-3.18 widen: 'realistic'
export interface SessionConfig {
  readonly gameType: GameType;
  readonly players: number;                    // 2..10 incl. the user (REQ-005.2); === seats.length
  readonly stake: Stake;                       // { smallBet, bigBet }
  readonly lineUp: LineUpName;                 // name as recorded (REQ-009.6)
  readonly seats: readonly SessionSeat[];      // ascending seat order; one 'user' seat at userSeat; bots carry style
  readonly speed: Speed;
  readonly userSeat: SeatNumber;
  readonly button: SeatNumber;                 // starting dealer button
}
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  gameType: 'cash', players: 6, stake: { smallBet: 4, bigBet: 8 }, lineUp: 'Custom',
  seats: DEFAULT_SEATS, speed: 'rapid', userSeat: USER_SEAT /* 5 */, button: DEFAULT_BUTTON /* 6 */,
};
export function resolveSessionConfig(input?: Partial<SessionConfig>): SessionConfig; // { ...DEFAULT, ...input }
export function seatSession(config?: Partial<SessionConfig>): TableState;            // config = resolved
```
- `lineUp: 'Custom'` for five TAG bots follows REQ-009.6 / TASK-6.7 ("preset name when every bot seat's style
  equals the preset's assignment, otherwise Custom"): no preset (Mixed, Tough, Soft) assigns five TAGs at 6
  players. Part of Q-2.
- All values are strings, numbers and arrays of plain objects: `JSON.parse(JSON.stringify(c))` deep-equals `c`.
- `TableState.config: SessionConfig` (complete). `seatSession` uses `config.seats` for `seats` and `stacks`;
  `dealHand` passes `button: table.config.button`; `nextStep`, `applyUserAction`, `completedHand`
  (`userSeat` field) and `userActionBar` use `table.config.userSeat`.

UI (`src/ui`):
- `HomeScreen({ onNewGame, focusHeading }: { onNewGame: () => void; focusHeading?: boolean })` →
  `<main className="screen">` › `<header className="home-header">` (`<img src={logoUrl} alt="" width={64}
  height={64}>`, `<h1>TLH Trainer</h1>`) › `<nav aria-label="Main menu" className="home-menu">` ›
  `<button type="button" className="menu-primary"><span>New game</span><span>Set up a cash game or
  sit-and-go</span></button>`. Nothing else on Home.
- `GameConfigScreen({ config, onStart, onCancel }: { config: SessionConfig; onStart: (c: SessionConfig) => void;
  onCancel: () => void })` — stateless; renders the Q-4 summary of `config`; Start game calls `onStart(config)`;
  "← Home" and Cancel call `onCancel()`. `<h1>` "New game" (storyboard), focused on mount (A-4).
- `TableScreen({ config }: { config: SessionConfig })` — `<main><h1 tabIndex={-1}>TLH Trainer</h1><Table
  config={config} /></main>` (same markup as today's App plus `tabIndex`; heading focused on mount, A-4).
- `App()` — `const [screen, setScreen] = useState<Screen>({ name: 'home' })`; Home `onNewGame` → `config`;
  Config `onCancel` → `home`; `onStart(c)` → `{ name: 'table', config: c }`. App passes
  `DEFAULT_SESSION_CONFIG` to Game Config ("first use", AC#5). Home shown after Cancel focuses its `<h1>`; the
  initial Home does not move focus.

Game Config text and layout — proposal for Q-4 (1280 × 720, storyboard styles; values are read from `config`):
```
← Home
New game                                                   (h1, 28 px/700)
┌ Session ───────────────────────────────┐ ┌ Opponents ──────────────────────────────┐
│ Game type                   Cash game   │ │ Seat 1   Ava   Tight-aggressive          │
│ Players at the table        6 (6-max)   │ │ Seat 2   Ben   Tight-aggressive          │
│ Stakes (small bet / big bet) $4 / $8    │ │ Seat 3   Cal   Tight-aggressive          │
│ Buy-in             $160 (20 big bets)   │ │ Seat 4   Dee   Tight-aggressive          │
│ Speed                       Rapid       │ │ Seat 6   Eli   Tight-aggressive          │
└─────────────────────────────────────────┘ │ You      Seat 5                          │
                                            └──────────────────────────────────────────┘
                                                              [ Cancel ]  [ Start game ]
```
- Left panel is a `<dl>` with a visually hidden `<h2>` "Session"; right panel `<h2>` "Opponents" (storyboard) and a
  `<ul>`; labels 14 px/600 `#F2F3F5`, values 15 px; seat labels `#A7AEB8`. Labels "Game type", "Players at the
  table", "Stakes (small bet / big bet)", "Buy-in", "Speed", "Opponents", "Seat n", "You", "Cancel", "Start game",
  "← Home" and "6 (6-max)" / "$4 / $8" formats are the storyboard's; "Tight-aggressive" is the storyboard's
  label for TAG; "$160 (20 big bets)" applies REQ-007.1 (`buyIn`) in the storyboard's format; "You — Seat 5"
  replaces the storyboard's "Seat chosen at random each session" until TASK-2.13.

### Rules and algorithms
- Navigation (AC#4, story notes): `home --New game--> config --Start game--> table`; `config --Cancel | ← Home-->
  home`. No transition writes `localStorage`, `sessionStorage`, IndexedDB, cookies or history. No session state
  exists before Start game: the Table (and so `seatSession`/`dealHand`/`newReplayCode`) mounts only on `table`.
- Start game hands the same `config` object that Game Config displays; the Table then seats it and deals the
  first hand in the next macrotask (TASK-3.1 A-2): with the defaults, after the deal seat 1 shows $158, seat 2
  $156, seats 3–6 $160 until they act.
- Worked example (D-4): `seatSession({ userSeat: 2, button: 3, seats: <DEFAULT_SEATS with kinds/names of seats
  2 and 5 swapped> })` → after `dealHand`, `hand.button === 3`, seat 4 posts the small blind and seat 5 the big
  blind, and `nextStep` is `'user'` exactly when `hand.toAct === 2`.

### Error handling and configuration
- No new error types. Logo load failure leaves an empty 64 × 64 box (decorative `alt=""`); heading and New game
  still work. Engine/bot errors propagate as in TASK-3.1 A-8.
- Defaults: `DEFAULT_SESSION_CONFIG` above. Colours: page `#0E0F12`, text `#F2F3F5`, primary `#D7262E` with
  `#FFFFFF` text, panels `#1A1D22`/`#343A43`, outline buttons `#4A515C`, secondary text `#A7AEB8`, link `#FF6B70`.

## 6. Behaviour specification

### SPEC-01: Launch opens Home with the logo and the name
- Verifies: AC#1, DoD#1, DoD#7
- Behaviour: Given a fresh page load of `/`, When loading completes, Then the visible screen has exactly one `<h1>`
  "TLH Trainer", an `<img>` in the Home header whose `naturalWidth > 0` and rendered box is 64 × 64 CSS px, a
  "Main menu" navigation containing exactly one button whose name starts with "New game", and no "Table" region.
- Verification: acceptance `e2e/home.spec.ts::launch opens Home with the TLH logo and the name TLH Trainer`

### SPEC-02: Home logo is the bundled resized derivative of brand/tlh-logo.jpg
- Verifies: AC#2, DoD#1
- Behaviour: AC#2 (reworded, Q-1): Given the Home screen, When the logo image is loaded, Then it is the bundled
  logo derived only by resizing from brand/tlh-logo.jpg (the same file the card back uses), and drawn at 64x64 it
  matches brand/tlh-logo.jpg within an average of 4 per colour channel. Measured as: the bytes served at the
  Home logo's `currentSrc` (fetched with `page.request`, origin `http://localhost:4173`) have the same SHA-256 as
  `src/assets/tlh-logo.jpg` and as the bytes served for the card back's `<image data-part="logo">` href (same
  URL); and in the page, the served logo and `dreams/limit-holdem-trainer/brand/tlh-logo.jpg` (passed in as a
  base64 data URL from disk) are each drawn with `drawImage` onto a 64 × 64 canvas, and the mean absolute
  difference over all R, G and B values of the two `getImageData` results is ≤ 4.
- Verification: acceptance `e2e/home.spec.ts::home logo is the resized brand logo shared with the card back`

### SPEC-03: Charcoal background and red New game control
- Verifies: AC#3, DoD#1
- Behaviour: Given Home, When computed styles are read, Then `html` has `background-color` `rgb(14, 15, 18)`,
  `body` and the Home `<main>` are `rgb(14, 15, 18)` or `rgba(0, 0, 0, 0)`, and the New game button has
  `background-color` `rgb(215, 38, 46)` and text colour `rgb(255, 255, 255)` (title and subtitle).
- Verification: acceptance `e2e/home.spec.ts::home uses the charcoal background and a red New game control`

### SPEC-04: New game opens Game Config and starts no session
- Verifies: AC#4, DoD#1, DoD#7
- Behaviour: Given Home with `stubReplayWords` installed and a counter of 4-word `Uint32Array`
  `getRandomValues` calls, When the user clicks New game, Then an `<h1>` "New game" is visible and focused, Start
  game and Cancel buttons are visible, there is no "Table" region and no "Seats" list, and after 1 s of real time
  the replay-code draw count is 0.
- Verification: acceptance `e2e/home.spec.ts::new game opens game config without starting a session`

### SPEC-05: Cancel and ← Home return to Home with nothing stored
- Verifies: AC#4, DoD#1, DoD#7
- Behaviour: Given Game Config, When the user clicks Cancel, Then Home is shown with its `<h1>` "TLH Trainer"
  focused, the draw count is still 0, and `localStorage.length`, `sessionStorage.length` and `history.length` are
  unchanged from the first load; the same holds when the user opens Game Config again and clicks "← Home".
- Verification: acceptance `e2e/home.spec.ts::cancel and home return to Home with nothing stored`

### SPEC-06: Start game deals the first hand at the default table
- Verifies: AC#5, AC#6, DoD#1, DoD#7
- Behaviour: Given Game Config on first use with the paused fake clock and pinned replay words
  `[0x9e3779b9, 1, 2, 3]`, When the user clicks Start game, Then the "Table" region shows seats named Ava, Ben,
  Cal, Dee, Eli, You with `$160` each and `data-action-count` 0; after advancing the clock 1 s in 50 ms slices seat
  1 shows `$158`, seat 2 `$156`, the user's two cards are face up, `data-to-act` is `5` and the "Your actions"
  group is enabled (the user at seat 5, button at seat 6, $4/$8 blinds $2/$4).
- Verification: acceptance `e2e/home.spec.ts::start game deals the first hand at the default table`

### SPEC-07: Game Config shows the fixed first-use session
- Verifies: AC#5, DoD#1
- Behaviour: Given `renderToString(<GameConfigScreen config={DEFAULT_SESSION_CONFIG} … />)`, When the markup is
  read, Then it contains the `<h1>` "New game", the rows and texts of the Q-4 preview with exact values (Cash game,
  6 (6-max), $4 / $8, $160 (20 big bets), Rapid, five opponent rows Seat 1/2/3/4/6 Ava/Ben/Cal/Dee/Eli each
  "Tight-aggressive", You Seat 5), buttons "Cancel", "Start game" and "← Home", and no `<input>`, `<select>` or
  `<textarea>`. Texts as approved in qa.md Q-4.
- Verification: acceptance `tests/ui/home.acceptance.test.tsx::game config shows the first-use cash session with five TAG bots`

### SPEC-08: Home markup has only the logo, the name and New game
- Verifies: AC#1, AC#3, DoD#1
- Behaviour: Given `renderToString(<HomeScreen onNewGame={() => {}} />)`, Then it contains one `<img>` whose `src`
  equals the URL imported from `src/assets/tlh-logo.jpg` (D-1) with `alt=""`, `<h1>TLH Trainer</h1>`, one `<nav
  aria-label="Main menu">` with exactly one `<button>` containing "New game" and "Set up a cash game or sit-and-go",
  and no text "Resume session", "Statistics" or "Settings".
- Verification: acceptance `tests/ui/home.acceptance.test.tsx::home shows the logo, the name and only New game`

### SPEC-09: First-use SessionConfig carries every field and reaches the table
- Verifies: AC#5, AC#6, DoD#1
- Behaviour: Given `DEFAULT_SESSION_CONFIG`, Then it matches (`toMatchObject`, so later additive fields don't
  break it) `{ gameType: 'cash', players: 6, stake: { smallBet: 4, bigBet: 8 }, lineUp: 'Custom', speed: 'rapid',
  userSeat: 5, button: 6 }`, its `seats` are Ava 1, Ben 2, Cal 3, Dee 4, You 5 (user, style null), Eli 6, every
  bot `style: 'TAG'`, `players === seats.length`; and `seatSession(DEFAULT_SESSION_CONFIG).config` is that same
  object, with `stakes` `{ 2, 4, 4, 8 }`, all six stacks 160, and the dealt hand's `button` 6.
  Shape and values as approved in qa.md Q-2.
- Verification: acceptance `tests/table/session-config.acceptance.test.ts::first-use session config carries game type, players, stake, line-up, speed, seat and button`

### SPEC-10: The table honours a configured user seat, button and seats; partial input; plain data
- Verifies: AC#6, DoD#1
- Behaviour: (1) The §5 worked example: `hand.button === 3`, seats 4 and 5 post the blinds, `nextStep` is `'user'`
  iff `toAct === 2`, `userActionBar` is non-null and enabled only then, `completedHand(...).userSeat === 2`.
  (2) `seatSession({ stake: { smallBet: 10, bigBet: 20 } }).config` equals the defaults with that stake.
  (3) `JSON.parse(JSON.stringify(DEFAULT_SESSION_CONFIG))` deep-equals `DEFAULT_SESSION_CONFIG`.
- Verification: unit `tests/table/session-config.test.ts::the table honours the configured user seat, button and seats`

### SPEC-11: App opens on Home; the Table screen keeps TASK-3.1's markup
- Verifies: AC#1, AC#5, DoD#1
- Behaviour: `renderToString(<App />)` is `<main …>` with `<h1>TLH Trainer</h1>`, the New game button and no
  `aria-label="Table"`; the edited TASK-3.1 test renders `<TableScreen config={DEFAULT_SESSION_CONFIG} />` and
  still finds `<h1>TLH Trainer</h1>` and the seated table with six `$160` stacks.
- Verification: unit `tests/unit/app.test.tsx::App opens on the Home screen` and `tests/ui/table.acceptance.test.tsx::seated table shows names and buy-in stacks and no buy-in control`

### SPEC-12: Home and Game Config are axe clean, fit 1280 × 720 and stay same-origin
- Verifies: DoD#7, DoD#8
- Behaviour: In Chromium and WebKit at 1280 × 720, axe reports zero serious or critical violations on Home and on
  Game Config; on both `document.documentElement.scrollWidth <= clientWidth` (REQ-060.1); every button on both
  screens has a bounding box ≥ 44 × 44 CSS px (REQ-057.4); every request from load through Start game has origin
  `http://localhost:4173`.
- Verification: acceptance `e2e/home.spec.ts::home and game config are axe clean, fit 1280x720 and make only same-origin requests`

### SPEC-13: Earlier stories' browser tests pass through the new flow
- Verifies: DoD#7
- Behaviour: With only the D-5 edits, every test in `e2e/table.spec.ts`, `e2e/action-bar.spec.ts` and the
  unchanged `e2e/smoke.spec.ts`, `e2e/replay-seed.spec.ts`, `e2e/cards*.spec.ts` passes in Chromium and WebKit.
- Verification: integration `npm run e2e`

### SPEC-14: Lint, typecheck, tests and coverage
- Verifies: DoD#1, DoD#2, DoD#4
- Behaviour: Each command exits 0; coverage ≥ 70 % overall and ≥ 90 % for `src/{engine,bots,advice,stats}`.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-15: Session module stays headless; playtest stays clean
- Verifies: DoD#5, DoD#6
- Behaviour: `src/table/session.ts` imports no React, DOM or `src/ui` module (existing scan); the 10,000-hand
  playtest reports 0 invariant violations (engine/bots unchanged; run as a regression check).
- Verification: unit `tests/table/session.test.ts::session module imports no UI code` and command `npm run playtest -- --hands 10000 --seed 42`

### SPEC-16: CI green and story documentation published
- Verifies: DoD#10, DoD#11
- Behaviour: The CI workflow passes on branch `doit/TASK-2.1`; a Backlog doc "TASK-2.1: Start a game from Home
  through Game Config" exists, including the reload-now-lands-on-Home change and A-2 Back behaviour.
- Verification: manual CI run on branch `doit/TASK-2.1` and `backlog doc list --plain`

### SPEC-17: Not-applicable DoD items
- Verifies: DoD#3, DoD#9, DoD#12
- Behaviour: No golden-spot suite exists (E07-S14 not done), no strategy content is added, and no service worker
  exists (E13-S07 not done).
- Verification: manual Judge confirms the diff adds no strategy text and that E07-S14 and E13-S07 are not Done

## 7. Edge cases
- Double click on Start game: React flushes the first click's state change synchronously (discrete event), so the
  second click lands on the Table screen; one session, one deal — covered by SPEC-06 (one Table region, one draw).
- Double click on New game: the second click lands on Game Config where no control sits under the New game card
  (Start game/Cancel are bottom-right) — N/A beyond SPEC-04.
- Cancel then New game again: fresh Game Config, still no session — SPEC-05.
- Reload on any screen: opens Home (A-1/A-2); mid-hand state is discarded as in TASK-3.1 — no new test (smoke and
  SPEC-01 cover load).
- Browser Back: leaves the app (A-2) — no test; follow-up F-3.
- Logo fails to load: decorative image, screen still usable — N/A (bundled same-origin asset).
- Invalid `SessionConfig`: cannot occur (only `DEFAULT_SESSION_CONFIG` is produced) — A-11, follow-up F-4.
- Empty/max/concurrency/permissions: N/A (no input, storage or network).

## 8. Security considerations
- Trust boundaries: none new — no user input, no storage, no network; config comes from a constant.
- New dependencies: none (no router, no font).
- Third-party requests: storyboard Google Fonts link is not copied (A-5); SPEC-12 asserts same-origin.
- Randomness: unchanged (replay code from `crypto.getRandomValues` at deal, TASK-1.3); no session starts before
  Start game (SPEC-04). Random seat/button fairness is TASK-2.13.
- Sensitive data / secrets / injection: N/A.

## 9. Non-functional
- Accessibility: axe zero serious/critical on Home and Game Config (SPEC-12); text contrast ≥ 4.5:1 (§3 values,
  A-6); targets ≥ 44 × 44 CSS px; native buttons (REQ-057.2); focus to the new heading (A-4).
- Layout: no horizontal scroll at 1280 × 720 (REQ-060.1), measured in SPEC-12.
- Bundle: no new image bytes (D-1 reuses `src/assets/tlh-logo.jpg`).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview` then open `http://localhost:4173` (or `npm run dev`)
- New tests: `e2e/home.spec.ts` → SPEC-01..06, SPEC-12; `tests/ui/home.acceptance.test.tsx` → SPEC-07, SPEC-08;
  `tests/table/session-config.acceptance.test.ts` → SPEC-09; `tests/table/session-config.test.ts` → SPEC-10;
  `tests/unit/app.test.tsx` → SPEC-11. Browser e2e: `npm run e2e` (SPEC-13).
- E2E notes for the builder: install the paused fake clock before `page.goto` and advance in 50 ms slices (as in
  `e2e/table.spec.ts:61-72`); clicks work under the paused clock (React click updates need no timers).
- Judge scenario: `npm run build && npm run preview`, open `http://localhost:4173` at 1280 × 720 in Chrome and
  Safari: Home shows the logo, "TLH Trainer" and a red New game on charcoal; New game → "New game" screen with the
  fixed session and no table; Cancel → Home; New game → ← Home → Home; New game → Start game → table with Ava,
  Ben, Cal, Dee, Eli, You at $160, blinds posted, your cards face up; play the hand; reload → Home.

## 11. Open questions
None. Q-1..Q-4 answered by the user on 2026-11-18 (see `doit/TASK-2.1/qa.md`).

## 12. Clarifications log
See `doit/TASK-2.1/qa.md`.

## 13. Follow-ups (become tasks)
- F-1: TASK-2.2/2.3/2.4/2.5/2.11 replace the read-only Game Config rows with selectors writing the same `SessionConfig` fields; TASK-2.4 widens `GameType` to a cash/sit-and-go union without `stake` for sit-and-go.
- F-2: TASK-2.13 draws `userSeat` and `button` per session start and replaces "You — Seat 5" with the storyboard's random-seat text.
- F-3: Decide browser Back/forward behaviour once sessions persist (TASK-2.14 or TASK-2.6): History API entries per screen, Back from Table pauses to Home.
- F-4: Add `assertSessionConfig` (players 2–10 = seats.length, one user seat at `userSeat`, `button` among seats, known vocabularies) in the first story that loads a stored config (TASK-2.6 / TASK-3.10).
- F-5: TASK-2.14 adds the Table header Home control; until then the only way back to Home from the Table is reload.
- F-6: TASK-2.16/2.17 add the right-hand Home column (snapshot / first-use message) and drop A-8's fixed menu width if needed.
