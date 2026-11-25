# Spec: TASK-11.1 — See my Major errors per 100 hands trend on the Statistics screen

Status: READY (approved 2026-11-25)
Task: TASK-11.1 · Parent/epic: TASK-11 · Requirements: REQ-002 (002.3), REQ-004 (004.8), REQ-040 (040.3), REQ-048 (048.1, 048.6, 048.7, 048.10, 048.11, 048.14), REQ-057 (057.1), REQ-061 (061.1) · Dream: limit-holdem-trainer

## 1. Summary
Home gets a Statistics entry. It opens a new Statistics screen with a "← Home" back control, the title, a totals
line ("1,840 hands over 9 sessions") and a Major-error trend chart. The chart plots one point for each complete
group of 500 stored hands. Hands are ordered by session start, then hand number. A point's value is the user's
unhinted Major-graded decisions in the group × 100 / 500, read from the stored decision records. Nothing is
re-graded. With 1–499 hands the chart is replaced by "Play <n> more hands to see your first trend point.", and
with 0 hands by "Play your first hand to see trends.". The trend maths lives in a pure `src/stats/trends.ts`.
The store reads every hand and session in one read-only transaction, and the screen only renders.

## 2. Scope
- In scope:
  - `src/stats/trends.ts` (new, headless): the per-hand aggregate `TrendHand`, ordering, 500-hand grouping,
    totals and all the screen's text builders.
  - `src/storage/hand-store.ts`: a new `trendData()` read on the object `openHandStore` returns.
  - `src/ui/stats/StatisticsScreen.tsx` (new): renders a `StatisticsView`. Also the Home entry
    (`HomeScreen.tsx`), the `stats` route and read in `App.tsx`, and styles.
  - Registering the screen in `e2e/support/screen-list.ts` and visiting it in the play-money walk.
  - Tests: unit, acceptance, a fake-indexeddb 3,000-hand store test, a Playwright flow with axe in Chromium and
    WebKit, and an opt-in speed check (`TLH_SLOW_TESTS=1`). Docs.
- Not doing:
  - Filter row / table-size, game-type or line-up filters (TASK-11.4, TASK-11.7) and per-session / per-day
    grouping (TASK-11.5). No filter row at all in this story (D-5, Q-1).
  - BB/100 chart (TASK-11.2), G-2 target line and its goal caption (TASK-11.3), style stats section
    (TASK-11.8), sit-and-go results (TASK-11.9), Report → Statistics link (TASK-11.6).
  - 100,000-hand / 2-second performance work (TASK-11.12). No per-hand aggregate store, index or DB version change.
  - Settings entry on Home (TASK-12.1).
  - Any chart library or other new dependency.
  - Re-grading or calling the advice engine.
  - Browser-history entries for the Statistics screen.
- Scope budget: files=22, lines=1100

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | "Sessions" in the totals = distinct `sessionId`s among the valid stored hand records. A session record with 0 stored hands is not counted. | yes | REQ-048.6 counts sessions "in the current filter". Only hands carry filter fields, so a session with no hands can't be in any filter. | Count every session record (would count a just-started, 0-hand paused session). |
| A-2 | Hand order: session start = the session record's `startedAt`. If a session's record is missing or fails `parseSessionRecord`, the earliest `completedAt` among its hands is used instead. Ties go to the smaller `sessionId`, then hand number. | yes | The task fixes "session start, then hand number". The fallback keeps orphan hands plotted. | Drop hands without a valid session record. |
| A-3 | A stored hand value that fails `parseHandRecord` is skipped. It isn't counted in totals or groups and the screen shows no error. | yes | Same rule as the report's hand reads (`src/storage/hand-store.ts:98-102`, TASK-10.3 A-7). | Fail the whole screen. |
| A-4 | The Home entry is a `menu-secondary` button (title "Statistics", subtitle from the storyboard) placed after Resume session. `HomeScreen` renders it only when the `onStatistics` prop is given, and `App` always gives it. | yes | The storyboard order is New game, Resume session, Statistics (`Home.dc.html:30-41`). This follows the optional `onResume` prop pattern (`src/ui/home/HomeScreen.tsx:10,35`). It also keeps the locked `tests/ui/home.acceptance.test.tsx` and `tests/ui/home-resume.acceptance.test.tsx` (which render `HomeScreen` without it) unchanged. | Always render it, which means editing two more locked tests. |
| A-5 | Opening Statistics adds no browser-history entry. Back behaves as on Game Config. | yes | Only the Table pushes history (`src/ui/App.tsx:13-15`, `docs/ui/navigation.md` "Browser Back and Forward"). | Push an entry. |
| A-6 | The totals line uses the singular for 1: "1 hand over 1 session". Otherwise "<n> hands over <m> sessions", including "0 hands over 0 sessions". | yes | REQ-048.14 (count messages use the singular for 1). AC#7 fixes the 0 form. | Always plural. |
| A-7 | Counts are formatted with comma thousands separators by an own `countText(n)` function ("1,840"). It doesn't use `toLocaleString`. | yes | The output then doesn't depend on the browser locale. The task and storyboard show "1,840". There is no existing formatter (`grep toLocaleString src` is empty). | `Intl.NumberFormat('en-US')`. |
| A-8 | A point's value = `bbPer100(majors, 1, 500)` (`src/table/session-report.ts:146-152`), the same per-100 rounding as the report's tiles (`rateTiles`, `:347-357`). It is shown with `toFixed(1)`. For 500 hands it is exact (majors / 5). | yes | Same rule and format as the Session Report (E10-S02). | Unrounded float. |
| A-9 | Chart geometry comes from the storyboard SVG (`Stats.dc.html`): `viewBox="0 0 400 160"`, baseline y=150, top y=10. yMax = max(1, largest value). y = 150 − value/yMax × 140. One point → x=200. Otherwise x = 10 + i × 380/(n−1). Coordinates are rounded to 1 decimal. Points are joined by a polyline with a circle marker at each point. There are no axis labels. | yes | Hand-written SVG as in the storyboard. No dependency. | Axis ticks/labels (more copy). |
| A-10 | While the read is pending, the screen shows the back control and h1. The chart section is `aria-busy="true"` and has no message, and the totals line is absent. The read runs after `tableWritesSettled()` (as Home's read, `src/ui/App.tsx:56-76`) and runs again each time the screen opens. | yes | Existing pattern. Hands written just before opening are included. | A loading text. |
| A-11 | The opt-in speed check: 3,000 stored hands over 9 sessions. The time from clicking Statistics on Home to the 6th point being visible must be ≤ 1,000 ms in Chromium and WebKit. It lives in `e2e/statistics-speed.spec.ts` and runs only with `TLH_SLOW_TESTS=1` (added to `npm run e2e:slow`). | yes | The orchestrator said "a 3,000-hand seeded set must open quickly", and timing checks are opt-in only (memory: slow tests opt-in). 1 s is half the 100k-hand target of TASK-11.12. | 2,000 ms. |
| A-12 | The Statistics h1 takes focus on open (`useHeadingFocus(true)`). "← Home" returns to Home with `returned: true`, so Home's h1 takes focus. | yes | Same as Game Config and Report (`src/ui/useHeadingFocus.ts`, `src/ui/App.tsx:225-229`). | — |

## 3. Current system
- Stack: React 19 + Vite + strict TypeScript; Vitest (+ fake-indexeddb) for unit/acceptance; Playwright (Chromium, WebKit;
  `playwright.config.ts:13-16`) with axe (`e2e/support/axe.ts::expectNoSeriousAxeViolations`,
  `e2e/support/paused-clock.ts::axeWithPausedClock`). Scripts in `package.json`.
- Routing: `src/ui/App.tsx:16-22` holds a `Screen` union, and `switch (screen.name)` at `:208-259` renders it. Home is
  `{ name: 'home', returned }`. Every screen is a `<main className="screen">`.
- Home: `src/ui/home/HomeScreen.tsx:26-41`. A `nav aria-label="Main menu"` holds `menu-primary` New game and an
  optional `menu-secondary` Resume session. The menu styles are in `src/ui/styles.css:55-100`.
- Back control pattern: `src/ui/config/GameConfigScreen.tsx:181-186` (`header.config-header`, `button.link-button`
  "← Home", then `h1`). Styles are in `src/ui/styles.css:244-261`.
- Store: `src/storage/hand-store.ts`. `hands` is keyed `[sessionId, handNumber]` (`:28`) and `sessions` is keyed
  `sessionId` (`:32`). The `getAll` read pattern is at `:173-176`. Values are validated on read by
  `parseHandRecord` (`src/table/hand-record.ts:463`) and `parseSessionRecord` (`src/table/session-record.ts:162`).
  `sharedHandStore()` is at `:219`.
- Decision records: `HandRecordDecision.grade.grade` and `.hinted` (`src/table/hand-record.ts:51-71`).
  `forcedFold?: true` marks a hand left mid-hand, and its fold has no decision record (`:99-101`, REQ-004.8). So "never
  counted" holds automatically when only `decisions` are read.
- The report's unhinted-Major rule is `if (hinted) continue; if (grade.grade === 'major') major++`
  (`src/table/session-report.ts:189-195`).
- Headless rule: `src` dirs `engine, bots, advice, stats, playtest, table` may not import UI/browser code
  (`tools/lint/headless-boundary.js:7`). The coverage gate is ≥ 90% lines for `src/{…,stats,…}` (`vite.config.ts:18`).
- Play-money: `e2e/support/screen-list.ts:7-16` lists every route/dialog. `tests/ui/screen-list.acceptance.test.ts`
  parses `App.tsx` routes and pins the exact route list (`:20-23`). `e2e/play-money.spec.ts` visits each entry and fails
  on any unvisited one (`:155-156`).
- Opt-in slow tests: `const SLOW = process.env.TLH_SLOW_TESTS !== '1'` + skip (`e2e/rapid-pace.spec.ts:15`), listed in
  `npm run e2e:slow` (`package.json`).
- Fixtures: real records come from `handWrite(...)` (`src/table/session-record.ts:119`) over scripted tables
  (`tests/support/table-scenarios.ts`, `tests/support/session-play.ts::playSession`). A forced-fold record comes from
  `foldUserToLeave` + bot steps (`tests/table/leave-mid-hand.acceptance.test.ts:41-45`). e2e may import
  `tests/support/*` (`e2e/home-control.spec.ts:8`). Raw IndexedDB seeding in the page is done by
  `e2e/support/hand-records.ts::seedStoredRecords`, `seedStoredSessions`.
- Storyboards: `dreams/limit-holdem-trainer/storyboards/Stats.dc.html` (header: "← Home", h1 "Statistics", totals
  span; chart card: h2 title, goal caption, SVG `viewBox 0 0 400 160` `role="img"` with polyline, note "Lower is
  better.") and `Home.dc.html:38-41` (Statistics entry, subtitle "Your progress across sessions").
- Existing code to reuse:
  - `src/table/session-report.ts::bbPer100` → per-100 value with the report's rounding (A-8).
  - `src/storage/hand-store.ts::requested`, `readOnly` pattern → the new `trendData()` read.
  - `src/ui/useHeadingFocus.ts` → focus the h1.
  - `src/ui/App.tsx` Home-read effect (`:56-76`) → the Statistics read effect (cancel on unmount, after
    `tableWritesSettled()`).
  - `.link-button`, `.config-header`, `.panel`, `.visually-hidden` CSS → the header and chart card.
  - `e2e/support/hand-records.ts::seedStoredRecords`/`seedStoredSessions`, `e2e/support/paused-clock.ts::axeWithPausedClock`
    (or `expectNoSeriousAxeViolations`).
  - `tests/support/table-scenarios.ts`, `tests/support/session-play.ts`, `handWrite` → the record template for fixtures.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Hand-written SVG chart (polyline + circles) in `StatisticsScreen.tsx`, no chart library. | A chart library (new dependency). | The storyboard is a plain SVG polyline. No dependency or bundle cost, and REQ-058.1 (no network) is trivially met. | no | n/a |
| D-2 | A slim per-hand aggregate `TrendHand { sessionId, handNumber, completedAt, unhintedMajors }` is built by the store as it reads. The pure module groups these. | Pass full `HandRecord`s to the screen. | The task notes ask for cheap per-hand aggregates (E11-S12). Later stories add fields (net BB, game type, size, line-up) to the same aggregate. | no | n/a |
| D-3 | `trendData()` is added to the object `openHandStore` returns (type `HandStore & SessionEnder & TrendReader`), not to the `HandStore` interface. | Extend `HandStore`. | Other `HandStore` implementations (the e2e records harness) stay untouched. | no | n/a |
| D-4 | Locked tests the build must edit (owner in brackets). Each edit only adds the new screen/entry: (1) `e2e/home.spec.ts:90` [TASK-2.1]: the Main-menu button count becomes 2 and a `Statistics` button is visible. (2) `tests/ui/screen-list.acceptance.test.ts:21` [TASK-2.15]: routes become `['config', 'ending', 'home', 'report', 'stats', 'table']`. (3) `e2e/play-money.spec.ts` [TASK-2.15, TASK-10.2]: after the `home` check, click Statistics, `checkPlayMoney(page, 'statistics')`, click "← Home", then continue unchanged. | Avoid (1) by hiding the entry (contradicts AC#1). | AC#1 and AC#9 require these. The `HomeScreen` unit tests stay unchanged by A-4. | yes (locked edits) | user (Q-4; unlocked under TASK-2.1, TASK-2.15, TASK-10.2; every existing check kept, only expected values updated) |
| D-5 | No filter row in this story. Each later story (TASK-11.4, 11.5, 11.7) adds its own select. | Disabled row; Group by with one option. | Selects that do nothing would mislead. | yes (user-visible) | user (Q-1) |
| D-6 | Chart copy: card h2 `Major errors per 100 hands`. Note under the chart: `Each point is 500 hands. Lower is better.` Each point's `<title>` (hover): `Hands <first>–<last>: <value>`, e.g. `Hands 501–1,000: 1.8` (en dash U+2013, counts via `countText`, value `toFixed(1)`). SVG `aria-label`: `Major errors per 100 hands, one point per 500 hands: <v1>, <v2>, …` (all values in order, `toFixed(1)`, joined by `, `). | Visible value list; axis labels; storyboard note only. | Values are available as text (REQ-057) without extra visible copy. | yes (user-visible) | user (Q-2) |
| D-7 | Read failure: `p.stats-message` `Your statistics could not be loaded.` in place of the chart, no totals line; `console.error('Statistics could not be read', error)`. | Empty state + log only. | Showing "Play your first hand" on a failure would be wrong. | yes (user-visible) | user (Q-3) |
| D-8 | AC#2 test cost: the normal suite proves AC#2 through the pure module on 3,000 plain `TrendSource` records (no IndexedDB), plus a small store-level `trendData()` test. The 3,000-record store read runs only in the opt-in slow group (`TLH_SLOW_TESTS=1`, `npm run test:slow`). No long timeouts in the normal suite. | 3,000-record fake-indexeddb test in every run. | Scale checks are opt-in and must not slow CI coverage (TASK-1.56). | no | orchestrator note in qa.md |

## 5. Design

### Files to create / modify
- `src/stats/trends.ts` — new: types, `trendHand`, `orderHands`, `majorErrorPoints`, `statisticsView`, text builders.
- `src/storage/hand-store.ts` — `trendData()` on the opened store; export `TrendReader` usage in the return type.
- `src/ui/stats/StatisticsScreen.tsx` — new screen component (renders a `StatisticsView`, SVG chart).
- `src/ui/home/HomeScreen.tsx` — optional `onStatistics` prop and the Statistics menu entry.
- `src/ui/App.tsx` — `{ name: 'stats' }` screen, the read effect, Home → Statistics → Home wiring.
- `src/ui/styles.css` — `.stats-*` styles (header, totals, chart card, message, SVG stroke colours from the storyboard).
- `e2e/support/screen-list.ts` — `{ id: 'statistics', kind: 'screen', route: 'stats' }`.
- `tests/support/stat-records.ts` — new fixture builder (no test-runner imports): `statRecords(...)` clones a real
  `handWrite` template record per (session, hand) with the given grades/hinted flags; `forcedFoldRecord(...)`.
- `tests/stats/trends.test.ts` — new unit tests.
- `tests/stats/trends.acceptance.test.ts` — new acceptance tests (AC#3–AC#6 at module level).
- `tests/stats/trend-view.acceptance.test.tsx` — new: AC#2 through the pure module and the screen on 3,000 records (D-8).
- `tests/storage/trend-data.test.ts` — new: small store-level `trendData()` test (fake-indexeddb).
- `tests/storage/trend-data-3000.acceptance.test.ts` — new, opt-in (`TLH_SLOW_TESTS=1`): the 3,000-record store read (D-8).
- `tests/ui/statistics.acceptance.test.tsx` — new: screen markup (AC#6, AC#7, AC#8, loading).
- `tests/ui/home-statistics.acceptance.test.tsx` — new: Home renders the Statistics entry when given `onStatistics`.
- `e2e/statistics.spec.ts` — new Playwright flow (AC#1, AC#7, AC#8, axe, network).
- `e2e/statistics-speed.spec.ts` — new opt-in speed check (A-11).
- `package.json` — add `e2e/statistics-speed.spec.ts` to `e2e:slow` and `tests/storage/trend-data-3000.acceptance.test.ts` to `test:slow`.
- `e2e/home.spec.ts`, `tests/ui/screen-list.acceptance.test.ts`, `e2e/play-money.spec.ts` — locked edits (D-4).
- `docs/stats/trends.md` — new: grouping rule, value rule, ordering, messages.
- `docs/ui/navigation.md` — the Statistics screen and its Home control.

### Components, interfaces and data
`src/stats/trends.ts` (imports only `src/table/session-report` for `bbPer100` and `src/advice/grade` types; no UI):
```ts
export const GROUP_SIZE = 500;
/** One stored hand as the trends need it. */
export interface TrendHand {
  readonly sessionId: string;
  readonly handNumber: number;
  readonly completedAt: string;      // ISO-8601
  readonly unhintedMajors: number;   // ≥ 0
}
/** Decisions as stored; HandRecord satisfies it. */
export interface TrendSource {
  readonly sessionId: string; readonly handNumber: number; readonly completedAt: string;
  readonly decisions: readonly { readonly grade: { readonly grade: Grade }; readonly hinted: boolean }[];
}
export interface TrendData {
  readonly hands: readonly TrendHand[];
  /** sessionId → session startedAt (ISO) for every valid stored session record. */
  readonly sessionStarts: ReadonlyMap<string, string>;
}
export interface TrendReader { trendData(): Promise<TrendData>; }
export interface TrendPoint {
  readonly firstHand: number;   // 1-based position in the ordered hands, e.g. 501
  readonly lastHand: number;    // e.g. 1000
  readonly majorPer100: number; // bbPer100(sum unhintedMajors, 1, GROUP_SIZE)
}
export type MajorErrorChart =
  | { readonly kind: 'no-hands' }
  | { readonly kind: 'more-hands'; readonly needed: number }   // 1..499
  | { readonly kind: 'points'; readonly points: readonly TrendPoint[] }; // length ≥ 1
export interface StatisticsView {
  readonly hands: number; readonly sessions: number;
  readonly totals: string;            // totalsLine(hands, sessions)
  readonly chart: MajorErrorChart;
}
export function trendHand(record: TrendSource): TrendHand;
export function orderHands(data: TrendData): readonly TrendHand[];
export function majorErrorPoints(ordered: readonly TrendHand[]): readonly TrendPoint[];
export function statisticsView(data: TrendData): StatisticsView;
export function countText(n: number): string;             // 0 → "0", 1840 → "1,840", 100000 → "100,000"
export function totalsLine(hands: number, sessions: number): string;
export function moreHandsMessage(needed: number): string;
export const NO_HANDS_MESSAGE = 'Play your first hand to see trends.';
export function pointLabel(point: TrendPoint): string;     // "Hands 501–1,000: 1.8" (D-6)
export function chartLabel(points: readonly TrendPoint[]): string; // D-6 aria-label
export const CHART_TITLE = 'Major errors per 100 hands';
export const CHART_NOTE = 'Each point is 500 hands. Lower is better.';
export const LOAD_FAILED_MESSAGE = 'Your statistics could not be loaded.';
```
- `trendHand`: `unhintedMajors` = the number of `decisions` with `!hinted && grade.grade === 'major'`. A forced fold has
  no decision entry, so it never counts (REQ-004.8).
- `trendData()` in `hand-store.ts`: one `readonly` transaction over `[HANDS_STORE, SESSIONS_STORE]` with `getAll()` on
  each. Hands: `trendHand(parseHandRecord(v))`, skipping values that throw (A-3). Sessions: `parseSessionRecord(v)` →
  `startedAt`, skipping values that throw. It rejects only if the database can't be read.
- `StatisticsScreen` props: `{ view: StatisticsView | undefined | null; onHome: () => void }`. `undefined` = loading
  (A-10) and `null` = read failed (D-7). Markup:
  `<main className="screen stats-screen">` →
  `<header className="stats-header">` [`button.link-button` "← Home", `h1` "Statistics" (focused),
  `p.stats-totals` totals (absent while loading)] →
  `<section className="panel stats-chart" aria-labelledby="stats-major-title">` [`h2#stats-major-title`
  "Major errors per 100 hands"; then one of: `p.stats-message` with the no-hands or more-hands text; or the SVG
  chart (`role="img"`, `aria-label` = `chartLabel` (D-6), `polyline`, one `circle[data-point]` per point with `<title>` =
  `pointLabel`) followed by `p.stats-note` `CHART_NOTE`]. No filter row (D-5).
- `HomeScreen`: new optional `onStatistics?: () => void`. When given, a third entry `button.menu-secondary`
  [`span.menu-title` "Statistics", `span.menu-subtitle` "Your progress across sessions"] comes after Resume session
  (or after New game when there is no Resume).
- `App`: `Screen` gains `{ readonly name: 'stats'; readonly view: StatisticsView | undefined | null }`. Home's
  `onStatistics` sets `{ name: 'stats', view: undefined }` and resets `paused` (as New game does). An effect keyed on
  the stats screen runs `tableWritesSettled().then(() => sharedHandStore().trendData())` and sets `view` to
  `statisticsView(data)`. On rejection it logs `console.error('Statistics could not be read', error)` and sets
  `view: null`. It is cancelled when the screen is left. `onHome` → `{ name: 'home', returned: true }`.

### Rules and algorithms
- Order (A-2): `start(s)` = `sessionStarts.get(s)` ?? the minimum `completedAt` of s's hands. Sort the hands by
  `Date.parse(start)` ascending, then `sessionId` ascending, then `handNumber` ascending.
- Groups (REQ-048.1, REQ-048.11): with N ordered hands, `k = floor(N / 500)` points. Point i (0-based) covers
  positions `500i+1 … 500i+500`, and its value is `bbPer100(Σ unhintedMajors, 1, 500)`. The trailing `N mod 500`
  hands form no point.
- Chart choice: N = 0 → `no-hands`; 1 ≤ N ≤ 499 → `more-hands` with `needed = 500 − N`; N ≥ 500 → `points`.
- Messages (exact, from AC#6/AC#7/REQ-048.7/.10/.14):
  - `moreHandsMessage(180)` = `Play 180 more hands to see your first trend point.`
  - `moreHandsMessage(1)` = `Play 1 more hand to see your first trend point.`
  - `NO_HANDS_MESSAGE` = `Play your first hand to see trends.`
- Totals (REQ-048.6, A-1, A-6, A-7): `sessions` = the number of distinct `sessionId` in `hands`.
  `totalsLine(1840, 9)` = `1,840 hands over 9 sessions`; `totalsLine(0, 0)` = `0 hands over 0 sessions`;
  `totalsLine(1, 1)` = `1 hand over 1 session`.
- Worked examples: 1,200 hands → 2 points (1–500, 501–1,000) and 200 left over. A group with 5 unhinted + 5 hinted
  Majors → `bbPer100(5, 1, 500)` = 1.0. A group whose only non-Correct-looking event is a forced fold → 0 unhinted
  Majors → 0.0. 3,000 hands → 6 points.
- Point text: the value is shown as `majorPer100.toFixed(1)` and the hand range uses `countText`, e.g. "Hands 501–1,000:
  1.8" (D-6).

### Error handling and configuration
- A store read failure shows `Your statistics could not be loaded.` in place of the chart, with no totals line
  (D-7). It logs `console.error('Statistics could not be read', error)`.
- Invalid stored values are skipped silently (A-3).
- No configuration. `GROUP_SIZE` = 500 is a constant.

## 6. Behaviour specification

### SPEC-01: Home → Statistics → Home
- Verifies: AC#1, DoD#9
- Behaviour: Given the Home screen with no stored data, When the user clicks the "Statistics" button in the Main
  menu, Then a screen with h1 "Statistics" (focused) and a "← Home" button is shown, and no Table section is shown.
  When the user clicks "← Home", Then the Home screen's h1 "TLH Trainer" is shown and focused, with the Main menu
  holding New game and Statistics. This runs in Chromium and WebKit.
- Verification: acceptance `e2e/statistics.spec.ts::Statistics opens from Home and Home returns`

### SPEC-02: Home menu entry markup
- Verifies: AC#1
- Behaviour: Given `HomeScreen` rendered with `onNewGame`, `onStatistics` and `paused={null}`, Then the Main menu has
  exactly 2 buttons: New game, then `button.menu-secondary` with `span.menu-title` "Statistics" and `span.menu-subtitle`
  "Your progress across sessions". With a paused summary there are 3 buttons in the order New game, Resume session,
  Statistics.
- Verification: acceptance `tests/ui/home-statistics.acceptance.test.tsx::home offers Statistics after New game and Resume session`

### SPEC-03: 3,000 hands over 9 sessions → 6 recomputed points
- Verifies: AC#2, DoD#3
- Behaviour: Given 3,000 plain hand records over 9 sessions (`TrendSource` shape: sessionId, handNumber,
  completedAt and decisions with grade and hinted; built in memory by `tests/support/stat-records.ts`, no IndexedDB),
  with uneven session sizes, at least one group spanning two sessions, session start order different from
  `sessionId` order, and a varying mix of unhinted and hinted Major / Minor / Correct grades, When
  `statisticsView({ hands: records.map(trendHand), sessionStarts })` is rendered by `StatisticsScreen`, Then the
  chart has exactly 6 points. Each point's `<title>` equals `Hands <a>–<b>: <v>` where v is what the test recomputes
  itself from the records: order by session start then hand number, take 500-hand slices, count
  `!hinted && grade === 'major'`, × 100 / 500, `toFixed(1)`. At least two points differ. The test runs in well under
  5 s with no custom timeout (D-8).
- Verification: acceptance `tests/stats/trend-view.acceptance.test.tsx::AC#2 3,000 hands over 9 sessions plot 6 points recomputed from the hand records`

### SPEC-20: 3,000 stored records through the store (opt-in)
- Verifies: AC#2
- Behaviour: With `TLH_SLOW_TESTS=1`, given a fake-indexeddb store seeded in one transaction with 9 session records
  (one paused, the rest ended) and 3,000 real-shaped hand records (cloned from a `handWrite` template), When
  `statisticsView(await store.trendData())` is computed, Then it has 6 points equal to the values recomputed from
  `store.get` of each record, and totals `3,000 hands over 9 sessions`. Without the variable it is skipped.
- Verification: integration `TLH_SLOW_TESTS=1 npx vitest run tests/storage/trend-data-3000.acceptance.test.ts`

### SPEC-04: Hinted Majors are excluded
- Verifies: AC#3
- Behaviour: Given 500 hands whose decisions include exactly 5 unhinted and 5 hinted Major grades (others Correct or
  Minor), When `statisticsView` is computed, Then there is 1 point with `majorPer100` = 1 and text "1.0".
- Verification: acceptance `tests/stats/trends.acceptance.test.ts::AC#3 a group with 5 unhinted and 5 hinted Majors plots 1.0`

### SPEC-05: A forced fold after Leave table counts nothing
- Verifies: AC#4
- Behaviour: Given 500 hands where every decision record is graded Correct and one hand is a real forced-fold record
  (`forcedFold: true`, built by `foldUserToLeave` + `handWrite`, and it passes `parseHandRecord`), When the point is
  computed, Then its value is 0 and its text is "0.0".
- Verification: acceptance `tests/stats/trends.acceptance.test.ts::AC#4 a group whose only non-Correct event is a forced fold plots 0.0`

### SPEC-06: Only complete groups are plotted
- Verifies: AC#5
- Behaviour: Given 1,200 hands, When the view is computed, Then `chart.points` has length 2, with
  `{firstHand:1,lastHand:500}` and `{firstHand:501,lastHand:1000}`. A Major placed only in hands 1,001–1,200 changes
  neither point.
- Verification: acceptance `tests/stats/trends.acceptance.test.ts::AC#5 1,200 hands plot exactly 2 points and the last 200 form none`

### SPEC-07: Fewer than 500 hands → "Play <n> more hands" message
- Verifies: AC#6
- Behaviour: Given 320 hands, When the Statistics screen renders, Then it shows `Play 180 more hands to see your first
  trend point.` and no SVG. Given 499 hands, Then it shows `Play 1 more hand to see your first trend point.` and no SVG.
- Verification: acceptance `tests/ui/statistics.acceptance.test.tsx::AC#6 320 and 499 hands show the play-more message instead of a chart`

### SPEC-08: Zero hands → first-hand message and 0 totals
- Verifies: AC#7
- Behaviour: Given no stored hands, When the Statistics screen renders, Then it shows `Play your first hand to see
  trends.` and `0 hands over 0 sessions`, contains no "more hand" text and no SVG.
- Verification: acceptance `tests/ui/statistics.acceptance.test.tsx::AC#7 no hands shows the first-hand message and 0 totals`

### SPEC-09: Totals line
- Verifies: AC#8
- Behaviour: Given 1,840 hands over 9 sessions, When the Statistics screen renders, Then `p.stats-totals` reads
  `1,840 hands over 9 sessions` and the chart has 3 points.
- Verification: acceptance `tests/ui/statistics.acceptance.test.tsx::AC#8 1,840 hands over 9 sessions are totalled`

### SPEC-10: Browser flow with data and empty state, axe, network
- Verifies: AC#7, AC#8, DoD#1, DoD#9, DoD#10
- Behaviour: Given the page with an empty store, When Statistics opens, Then `Play your first hand to see trends.` and
  `0 hands over 0 sessions` are visible, and axe reports zero serious/critical violations. Given 1,840 hand records
  over 9 sessions seeded with `seedStoredRecords`/`seedStoredSessions` and a reload, When Statistics opens, Then
  `1,840 hands over 9 sessions` and 3 chart points are visible, and axe reports zero serious/critical violations.
  Every request has the app's origin. This runs in Chromium and WebKit.
- Verification: acceptance `e2e/statistics.spec.ts::Statistics shows totals and the trend from stored hands, and the empty state, with no axe violations`

### SPEC-11: Play-money registration and walk
- Verifies: AC#9, DoD#2
- Behaviour: Given `SCREEN_LIST` contains `{ id: 'statistics', kind: 'screen', route: 'stats' }`, When the play-money
  walk runs, Then it visits Statistics from Home, finds no real-money offer, and the "not visited" check is empty. The
  screen-list test finds the `stats` route in `App.tsx`.
- Verification: acceptance `e2e/play-money.spec.ts::every listed screen and dialog shows only play money`

### SPEC-12: Screen list names the new route
- Verifies: AC#9
- Behaviour: Given `src/ui/App.tsx` with a `case 'stats'`, When the screen-list test runs, Then the found routes equal
  `['config', 'ending', 'home', 'report', 'stats', 'table']` and none are unlisted.
- Verification: acceptance `tests/ui/screen-list.acceptance.test.ts::the screen list names every App screen and every dialog component`

### SPEC-13: Ordering, totals and text rules
- Verifies: AC#2, AC#8, DoD#6
- Behaviour: Hands are ordered by session `startedAt`. A session without a valid record falls back to its earliest
  `completedAt`, and ties go to `sessionId` then `handNumber` (A-2). `trendHand` counts only `!hinted` Majors.
  `sessions` counts distinct ids (A-1). `countText(0)`="0", `countText(999)`="999", `countText(1840)`="1,840",
  `countText(100000)`="100,000". `totalsLine(1,1)`="1 hand over 1 session". `moreHandsMessage` boundaries hold at
  needed 1 and 499. N = 500 → 1 point, and N = 499 → `more-hands` with needed 1.
- Verification: unit `tests/stats/trends.test.ts::orders, groups, counts and words the trend view`

### SPEC-14: Store read skips invalid values and reads in one transaction
- Verifies: AC#2, DoD#6
- Behaviour: Given a fake-indexeddb store holding a small set (about 12 valid hand records over 3 sessions, one of
  them a forced-fold record, plus one invalid raw hand value and one invalid session value), When `trendData()` runs,
  Then it resolves with exactly the valid hands as `trendHand(record)` and the valid sessions' `startedAt`. An empty
  store → `{ hands: [], sessionStarts: empty }`.
- Verification: unit `tests/storage/trend-data.test.ts::trendData reads valid hands and sessions and skips invalid values`

### SPEC-15: Loading and read-failure states
- Verifies: AC#1, DoD#1
- Behaviour: Given `view={undefined}`, Then the screen shows h1 and "← Home", the chart section has
  `aria-busy="true"` and no message, and there is no totals line. Given `view={null}`, Then `Your statistics could not be loaded.` is
  shown with no chart and no totals.
- Verification: unit `tests/ui/statistics.acceptance.test.tsx::loading and read-failure states`

### SPEC-16: Opt-in speed check (3,000 hands)
- Verifies: AC#2
- Behaviour: With `TLH_SLOW_TESTS=1`, given 3,000 hand records over 9 sessions seeded in the page, When the user
  clicks Statistics on Home, Then the 6th chart point is visible within 1,000 ms (A-11), in Chromium and WebKit.
  Without the variable the test is skipped.
- Verification: integration `TLH_SLOW_TESTS=1 npx playwright test e2e/statistics-speed.spec.ts`

### SPEC-17: Project checks
- Verifies: DoD#3, DoD#4, DoD#6, DoD#7, DoD#12
- Behaviour: Lint (including the headless-boundary rule on `src/stats/trends.ts`), typecheck and the full test suite
  with coverage pass with zero errors. `src/stats/**` stays ≥ 90% lines. CI is green on the branch.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run e2e`

### SPEC-18: Documentation
- Verifies: DoD#13
- Behaviour: `docs/stats/trends.md` documents ordering, grouping, value rule, messages and the speed check.
  `docs/ui/navigation.md` adds the Statistics screen. The story doc is published to Backlog.
- Verification: manual `docs/stats/trends.md`, `docs/ui/navigation.md` and `backlog doc list --plain` entry for TASK-11.1

### SPEC-19: Not-applicable DoD items
- Verifies: DoD#5, DoD#8, DoD#11, DoD#14
- Behaviour: No engine, bots or advice change, so the golden-spot suite (run by `npm test`) and the 10,000-hand
  playtest are unaffected. No strategy content is added. No service worker exists yet (E13-S07).
- Verification: manual `git diff --stat main -- src/engine src/bots src/advice` is empty

## 7. Edge cases
- 0 hands: SPEC-08. 1–499: SPEC-07 (boundaries 1 and 499 in SPEC-13). Exactly 500: one point (SPEC-13).
  Non-multiple of 500: SPEC-06.
- A group spanning sessions, and session start order vs id order: SPEC-03, SPEC-13.
- A session record missing or invalid for stored hands: SPEC-13 (A-2). An invalid stored hand: SPEC-14 (A-3).
- A 0-hand paused session record: not counted (A-1, SPEC-13).
- Hinted Majors: SPEC-04. Forced fold: SPEC-05. Minor grades never count: SPEC-03, SPEC-13.
- Hands written just before opening Statistics: the read waits for `tableWritesSettled()` (A-10).
- Leaving Statistics before the read resolves: the effect is cancelled and the late result is ignored (Design: App).
- Read failure: SPEC-15 (D-7).
- Concurrency with writes: not possible. Statistics is reached only from Home, and the read is a read-only transaction.

## 8. Security considerations
- Trust boundary: values read from IndexedDB, which may be invalid or old. Each is validated by
  `parseHandRecord`/`parseSessionRecord` and skipped on failure (A-3).
- React escapes all text. No HTML injection or `dangerouslySetInnerHTML`.
- No new dependencies and no network (DoD#10 checked in SPEC-10). No secrets, authn/authz or randomness.

## 9. Non-functional
- 3,000 stored hands: click → 6th point visible ≤ 1,000 ms, Chromium and WebKit. Opt-in only (SPEC-16, A-11). The
  100,000-hand / 2 s target is TASK-11.12.
- One IndexedDB read-only transaction per opening (two `getAll`s). No per-hand requests.
- Accessibility: WCAG 2.1 AA via axe (SPEC-10). The SVG has `role="img"` with an accessible name. Text colours reuse
  the storyboard's (#F2F3F5, #A7AEB8 / #C9CED6 on #1A1D22).
- Coverage ≥ 90% lines for `src/stats/**` and ≥ 70% overall.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev` → Home → Statistics → read the totals line and the chart (or message) → "← Home"
- New tests:
  - `tests/stats/trends.acceptance.test.ts` → SPEC-04, SPEC-05, SPEC-06
  - `tests/stats/trends.test.ts` → SPEC-13
  - `tests/stats/trend-view.acceptance.test.tsx` → SPEC-03 (in memory, no custom timeout)
  - `tests/storage/trend-data.test.ts` → SPEC-14 (fake-indexeddb, small set)
  - `tests/storage/trend-data-3000.acceptance.test.ts` (opt-in, `npm run test:slow`) → SPEC-20
  - `tests/ui/statistics.acceptance.test.tsx` → SPEC-07, SPEC-08, SPEC-09, SPEC-15 (`renderToString`)
  - `tests/ui/home-statistics.acceptance.test.tsx` → SPEC-02
  - `e2e/statistics.spec.ts` → SPEC-01, SPEC-10
  - `e2e/statistics-speed.spec.ts` (opt-in) → SPEC-16
  - Locked edits (D-4): `e2e/home.spec.ts`, `tests/ui/screen-list.acceptance.test.ts` (SPEC-12),
    `e2e/play-money.spec.ts` (SPEC-11)
- Judge's end-to-end scenario: `npm run dev`, play ~10 hands (use Hint on some), go Home, open Statistics. It should show
  "<n> hands over 1 session" and "Play <500−n> more hands to see your first trend point.". Click "← Home" and confirm
  Home is shown. Then run `npx playwright test e2e/statistics.spec.ts` for the 1,840-hand view.

## 11. Open questions
None. Q-1..Q-4 answered in `doit/TASK-11.1/qa.md` (D-4..D-7); test-cost note applied (D-8).

## 12. Clarifications log
See `doit/TASK-11.1/qa.md`.
