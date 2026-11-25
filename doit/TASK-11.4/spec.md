# Spec: TASK-11.4 — Filter my trends by table size and game type

Status: READY (approved 2026-11-25)
Task: TASK-11.4 · Parent/epic: TASK-11 · Requirements: REQ-048 (048.2, 048.4, 048.6, 048.7, 048.9, 048.10, 048.12), REQ-005.4, REQ-057 (057.1), REQ-058 (058.1) · Dream: limit-holdem-trainer

## 1. Summary
The Statistics screen gains a filter row with two labelled selects, "Table size" (All, Heads-up, 6-max, Full ring)
and "Game type" (All, Cash, Sit-and-go), both defaulting to All. Changing a filter recomputes the totals line, the
Major-error chart and the BB/100 chart (and their empty-state messages) from the matching hands only. The G-2 target
stays computed from every stored hand (`statisticsView(filtered, all)`, TASK-11.3), and the BB/100 chart keeps
TASK-11.2's cash-only behaviour, so Sit-and-go shows "No cash-game hands yet.". This lets the learner compare like
with like.

## 2. Scope
- In scope:
  - A pure filter in `src/stats/trends.ts`: `TrendFilter`, the option lists with their exact labels, and
    `filterTrendData(data, filter)`. Table size is the session's reference size by REQ-005.4 through the existing
    `referenceSizeOf` (`src/advice/preflop.ts:60`). It is not duplicated.
  - `trendHand` also records the hand's dealt-in seat count (`dealtIn`), which the table-size rule needs.
  - The filter row on `StatisticsScreen` (storyboard `Stats.dc.html:26-32`), shown once the data has loaded.
  - App wiring: keep the loaded `TrendData` and the current filter in the stats screen state, and recompute
    `statisticsView(filterTrendData(data, filter), data)` whenever a select changes.
  - Tests (unit, renderToString acceptance, Playwright in Chromium and WebKit with axe) and `docs/stats/trends.md`.
- Not doing:
  - The "Group by" select (per session / per day) from the storyboard. That is TASK-11.5 (REQ-048.1, 048.10).
  - The line-up filter (REQ-048.8, TASK-11.7) and sit-and-go finishing positions (REQ-048.5, TASK-11.9).
  - Style stats per table size (TASK-11.10), and the 100,000-hand speed target (TASK-11.12).
  - Persisting the filter selection across visits or reloads (Q-1: not remembered).
  - Any change to the stored hand or session record format, `hand-store.ts`, engine, bots or advice.
  - Changing any locked TASK-11.1/11.2/11.3 test.
- Scope budget: files=9, lines=640

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | A hand whose `dealtIn` is unknown (a `TrendHand` built without it) and whose session has no hand with a known `dealtIn` matches only Table size = All. | yes | Every hand read through `trendHand` has `dealtIn`. Only hand-built test literals lack it (`tests/ui/statistics.acceptance.test.tsx:20-25`). | Throw; treat as 6-max |
| A-2 | The filter row renders only when the view has loaded (not while it is loading or after a read failure). | yes | Filtering has nothing to act on before the data arrives. The locked loading and failure markup tests (`tests/ui/statistics.acceptance.test.tsx:70-85`) stay exactly as they are. | Render disabled selects in every state |
| A-3 | The filter row sits between the header and the first chart card, as in the storyboard. The selects reuse the Game Config select look (`src/ui/styles.css:311-321`, 44px min-height) through a new `.stats-filters` rule set. | yes | Storyboard `Stats.dc.html:26-35`; existing select styling. | New styling |
| A-4 | The select `value`s are the code ids (`all`, `heads-up`, `6-max`, `full-ring`, `cash`, `sit-and-go`), and the visible labels are as in §5. | yes | Matches `ReferenceSize` (`src/advice/preflop-chart.ts:3`) and `GameType` (`src/table/session.ts:87`). | Label text as value |
| A-5 | When a filter leaves 0 hands, the Major card shows the existing "Play your first hand to see trends." and the totals read "0 hands over 0 sessions". | yes | The task description says the filters apply to the empty-state messages, including the zero-hand message (REQ-048.10). | A filter-specific message |

## 3. Current system
- `src/stats/trends.ts` (TASK-11.1–11.3):
  - `TrendHand` (`:15-23`); `cash` is present iff the hand is a cash hand (`:21-22`, `:110`).
  - `TrendSource` (`:33-46`) is the subset of `HandRecord` that `trendHand` reads (`:104-117`).
  - `TrendData = { hands, sessionStarts }` (`:48-52`).
  - `statisticsView(data, all = data)` (`:198-221`) computes the totals, the Major chart (`no-hands` /
    `more-hands` / `points`) and the BB/100 chart (`no-cash` / `more-cash` / `points`, cash only through
    `bb100Points`, `:174-185`) from `data`. It computes `g2Target` from `all` (`:216-219`). When `all === data` it
    reuses one ordering.
  - Messages: `NO_HANDS_MESSAGE`, `moreHandsMessage`, `NO_CASH_MESSAGE`, `moreCashHandsMessage`, `totalsLine`
    (`:92-251`).
- `src/ui/stats/StatisticsScreen.tsx`:
  - Props are `{ view: StatisticsView | undefined | null; onHome }` (`:23-27`).
  - The header holds the totals (`:126-132`). The Major card (`:133-147`) renders `MajorErrorTrend` only for
    `chart.kind === 'points'`. That component alone draws the G-2 caption, the target line and the aria-label suffix
    (`:37-74`). The BB/100 card is at `:148-159`.
- `src/ui/App.tsx`:
  - The stats state is `{ name: 'stats'; view }` (`:26`).
  - The load effect (`:82-101`) calls `sharedHandStore().trendData()` and then `statisticsView(data)` (`:90`).
  - The render is at `:288-294`, and the Home button sets `view: undefined` (`:246`).
- `src/storage/hand-store.ts:141-160`: `trendData()` reads every valid hand through `trendHand(parseHandRecord(v))`.
  It is not changed.
- `HandRecord.seats` holds the dealt-in seats (`src/table/hand-record.ts:92-93`), and `gameType` is stored
  (`:82`). `SessionRecord.config.players` holds the configured size (`src/table/session-record.ts:42-43`), but the
  test fixtures' session records always say 6-player cash (`tests/support/stat-records.ts:66-78`), whatever their
  pool. That is why D-2 derives the size from the hands.
- Session report precedent: the report shows `config.players` as "N players" (`src/table/session-report.ts:184,333`).
- Tests:
  - Vitest with coverage: `npm test`. `*.acceptance.test.*` files run in `npm test` and `test:sweeps`
    (`package.json` scripts).
  - UI tests use `renderToString` only (there is no jsdom). Interaction is tested in Playwright (`npm run e2e`;
    Chromium and WebKit projects, `playwright.config.ts:13-15`).
  - E2E data is seeded with `seedStoredRecords` / `seedStoredSessions` (`e2e/support/hand-records.ts:32,58`).
- Coverage gate: `src/{…,stats,…}/**` at 90% lines (`vite.config.ts:18`).
- Existing code to reuse:
  - `src/advice/preflop.ts:60` `referenceSizeOf(n)` → the REQ-005.4 mapping (task note: do not duplicate). Stats
    already imports it (`src/stats/healthy-ranges.ts:1`).
  - `src/advice/preflop-chart.ts:3` `ReferenceSize` and `src/table/session.ts:87` `GameType` → filter value types.
  - `statisticsView(data, all)`, `majorErrorPoints`, `bb100Points`, `orderHands`, `totalsLine` → test oracles and
    the view, with no new chart maths.
  - `tests/support/stat-records.ts`: `cashPool(stake, hands, players)` (`:146`),
    `sitAndGoPool(hands, players)` (`:160`), `cloneRecords` (`:165`), `statRecords` (`:82`) → fixtures with real
    dealt-in counts.
  - `e2e/support/axe.ts` `expectNoSeriousAxeViolations` and the origin check pattern in
    `e2e/statistics-target.spec.ts:12-50`.

### Tests that pin Statistics markup, totals or view shape (checked for impact)
Locked by TASK-11.1: `e2e/play-money.spec.ts`, `e2e/statistics.spec.ts`, `tests/stats/trend-view.acceptance.test.tsx`,
`tests/stats/trends.acceptance.test.ts`, `tests/ui/home-statistics.acceptance.test.tsx`,
`tests/ui/screen-list.acceptance.test.ts`, `tests/ui/statistics.acceptance.test.tsx`. Locked by TASK-11.2:
`e2e/statistics-bb100.spec.ts`, `tests/stats/bb100.acceptance.test.tsx`. Locked by TASK-11.3:
`e2e/statistics-target.spec.ts`, `tests/stats/g2-target.acceptance.test.tsx`. Unlocked: `tests/stats/trends.test.ts`,
`tests/storage/trend-data.test.ts`, `tests/storage/trend-data-3000.acceptance.test.ts` (slow),
`e2e/statistics-speed.spec.ts` (slow), `e2e/home.spec.ts`, `e2e/resume.spec.ts`, `tests/ui/home.acceptance.test.tsx`.

None must change. The design keeps every pinned contract:
- `StatisticsScreen`'s `view`/`onHome` props stay, and the new props are optional.
- `TrendHand`'s new field is optional. The literal at `tests/ui/statistics.acceptance.test.tsx:20-25` still
  typechecks.
- `TrendData` and `StatisticsView` do not change shape. `tests/storage/trend-data.test.ts:39` `toEqual({ hands: [],
  sessionStarts })` still holds, and `:63` compares with `trendHand` itself.
- No filter markup appears while loading or after a failure (A-2).
- The filter row adds no `.stats-message`, `.stats-totals`, `<svg>`, `<circle>`, `<title>` or G-2 caption text. So
  the regexes in the locked tests are unaffected: `message`/`totals` at `tests/ui/statistics.acceptance.test.tsx:28-31`,
  `majorCard`/`targetLines` at `tests/stats/g2-target.acceptance.test.tsx:63-69`, and the e2e `.stats-message`
  locators at `e2e/statistics.spec.ts:41`, `e2e/play-money.spec.ts:109`.

If the builder finds otherwise, the owner is the locking task's test (TASK-11.1/11.2/11.3). It may change only
through the locked-edit procedure, with the reason recorded.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Exact labels: the selects are labelled "Table size" and "Game type". The options, in this order, are All, Heads-up, 6-max, Full ring and All, Cash, Sit-and-go. Both default to All. | — | Fixed by REQ-048.2, AC#1 and storyboard `Stats.dc.html:27-31`. | no | n/a (requirements) |
| D-2 | A hand's table size is its session's size: the largest `dealtIn` among that session's stored hands, mapped through `referenceSizeOf`. Every hand of a session therefore falls in one size bucket. | Per-hand dealt-in count (a sit-and-go moves from 6-max to Heads-up as players bust); `SessionRecord.config.players` (needs a `TrendData`/hand-store change, and fixture session records are always 6-player) | AC#2 and AC#4 speak of "4- and 6-player sessions" and "700 hands over 3 sessions". Cash deals every seat each hand (busted bots are replaced; TASK-6.8), and a sit-and-go deals every seat on hand 1, so the maximum equals the configured players. No storage change. | yes | user (Q-2) |
| D-3 | Game type: a hand is Cash iff `hand.cash !== undefined`, otherwise Sit-and-go. | Add `gameType` to `TrendHand` | `trendHand` sets `cash` iff `gameType === 'cash'` (`src/stats/trends.ts:110`). | no | n/a |
| D-4 | App keeps `{ data, filter, view }` in the stats screen state and recomputes `view = statisticsView(filterTrendData(data, filter), data)` on change. `filterTrendData` returns `data` itself for All/All, so the default view is computed exactly as today. | Screen-local state with a `data` prop (breaks the locked `view` prop contract) | Keeps `StatisticsScreen` presentational and the locked render tests valid. AC#7 contract. | no | n/a |
| D-5 | Filter persistence: not persisted. Every opening of Statistics starts at All / All, and the selection lives only while the screen is open. | Remember for the browser session (memory); persist in localStorage | User-visible behaviour. | yes | user (Q-1) |

## 5. Design

### Files to create / modify
- `src/stats/trends.ts` — `dealtIn` on `TrendSource`/`TrendHand`/`trendHand`; filter types, option lists, `filterTrendData`.
- `src/ui/stats/StatisticsScreen.tsx` — the filter row (two labelled selects); optional `filter` / `onFilterChange` props.
- `src/ui/App.tsx` — stats state carries `data` and `filter`; recompute the view on filter change.
- `src/ui/styles.css` — `.stats-filters` row and its select styling.
- `tests/stats/trend-filters.acceptance.test.tsx` — new: AC#1–AC#8 at module and renderToString level.
- `tests/stats/trends.test.ts` — unit cases for `filterTrendData` and `trendHand().dealtIn`.
- `tests/support/stat-records.ts` — optional: a small helper to build `TrendData` from pools with per-session layouts
  (≤ 30 lines), if the acceptance test needs it.
- `e2e/statistics-filters.spec.ts` — new: browser flow in Chromium and WebKit, axe, network origin.
- `docs/stats/trends.md` — the filter section.

### Components, interfaces and data
In `src/stats/trends.ts` (it may import `referenceSizeOf` from `../advice/preflop` and the type `ReferenceSize` from
`../advice/preflop-chart`; no UI imports):
```ts
// TrendSource gains:  readonly seats?: readonly unknown[];
// TrendHand gains:    /** Dealt-in seats in the hand (record.seats.length), 2–10. */ readonly dealtIn?: number;
export type TableSizeFilter = 'all' | ReferenceSize;          // 'heads-up' | '6-max' | 'full-ring'
export type GameTypeFilter = 'all' | GameType;                // 'cash' | 'sit-and-go'
export interface TrendFilter { readonly tableSize: TableSizeFilter; readonly gameType: GameTypeFilter }
export const ALL_TRENDS: TrendFilter = { tableSize: 'all', gameType: 'all' };
export const TABLE_SIZE_LABEL = 'Table size';
export const GAME_TYPE_LABEL = 'Game type';
export const TABLE_SIZE_OPTIONS: readonly (readonly [TableSizeFilter, string])[] =
  [['all', 'All'], ['heads-up', 'Heads-up'], ['6-max', '6-max'], ['full-ring', 'Full ring']];
export const GAME_TYPE_OPTIONS: readonly (readonly [GameTypeFilter, string])[] =
  [['all', 'All'], ['cash', 'Cash'], ['sit-and-go', 'Sit-and-go']];
/** The hands matching `filter`, keeping sessionStarts; `data` itself when filter is All / All. */
export function filterTrendData(data: TrendData, filter: TrendFilter): TrendData;
```
- `trendHand(record)` sets `dealtIn: record.seats.length` when `record.seats` is present, in both the cash and
  non-cash branches. `HandRecord` satisfies `TrendSource` as before.
- `StatisticsScreenProps` gains `readonly filter?: TrendFilter` (default `ALL_TRENDS`) and
  `readonly onFilterChange?: (filter: TrendFilter) => void`.
- When `view` is a `StatisticsView`, a `<div className="stats-filters">` renders between `</header>` and the first
  card. It holds two `<label>`s, each wrapping its text and a controlled `<select>`:
  - `id="stats-table-size"`, value `filter.tableSize`, one `<option value={id}>{label}</option>` per
    `TABLE_SIZE_OPTIONS`.
  - `id="stats-game-type"`, the same for `GAME_TYPE_OPTIONS`.
  - `onChange` calls `onFilterChange?.({ ...filter, tableSize | gameType: e.target.value })`.
- `App`: the stats state becomes
  `{ name: 'stats'; view: StatisticsView | undefined | null; data?: TrendData; filter: TrendFilter }`.
  - On load: `{ data, filter: ALL_TRENDS, view: statisticsView(data) }`.
  - Home → Statistics sets `{ view: undefined, filter: ALL_TRENDS }`.
  - `onFilterChange(f)` sets `{ ...screen, filter: f, view: statisticsView(filterTrendData(data, f), data) }`.

### Rules and algorithms
- Game type keep rule: `all` → every hand; `cash` → `hand.cash !== undefined`; `sit-and-go` → `hand.cash === undefined`.
- Table size keep rule:
  - `all` → every hand.
  - Otherwise compute the session size per sessionId: `size(s) = max(dealtIn)` over `data.hands` of session `s`
    with a defined `dealtIn`.
  - Keep a hand iff `size(hand.sessionId)` is defined and `referenceSizeOf(size) === filter.tableSize`.
  - Sizes 3–7 → 6-max and 8–10 → full ring through `referenceSizeOf`. A size outside 2–10 cannot be stored
    (`parseHandRecord`). The filter must not throw on it: such a session simply matches no size filter.
- Both rules apply (AND). The kept hands keep their input order, and `sessionStarts` passes through unchanged.
- The view is `statisticsView(filtered, data)`, so the totals, both charts and their messages come from `filtered`
  and `g2Target` from every stored hand.
- Worked examples:
  - Sessions with 2, 4, 6, 8 and 10 dealt-in seats of 100 hands each. 6-max keeps the 4- and 6-player sessions'
    200 hands. Full ring keeps the 8- and 10-player sessions' 200 hands. Heads-up keeps 100.
  - A 6-player sit-and-go whose hands 1–40 deal 6 seats and hands 41–60 deal 2. Its size is 6, so all 60 hands
    are 6-max and none are Heads-up.
  - 300 heads-up hands among 3,000. Heads-up gives `chart = { kind: 'more-hands', needed: 200 }`, so the card shows
    "Play 200 more hands to see your first trend point.". `g2Target` is non-null (from 3,000), but no caption, line
    or aria suffix renders.

### Error handling and configuration
- No new errors. `filterTrendData` is total over any `TrendData`. A select value outside the option ids cannot occur
  (controlled options). The handler casts `e.target.value` to the option id type.
- A read failure keeps the existing `LOAD_FAILED_MESSAGE` path, with no filter row (A-2).

## 6. Behaviour specification

### SPEC-01: Filter options, labels and defaults
- Verifies: AC#1, DoD#1
- Behaviour: Given a loaded view rendered by `StatisticsScreen` without a `filter` prop, When the markup is read,
  Then:
  - It contains a select labelled "Table size" whose options are exactly All, Heads-up, 6-max, Full ring (values
    `all`, `heads-up`, `6-max`, `full-ring`), in that order, with All selected.
  - It contains a select labelled "Game type" whose options are exactly All, Cash, Sit-and-go (values `all`,
    `cash`, `sit-and-go`), with All selected.
  - With `filter={{ tableSize: 'full-ring', gameType: 'cash' }}`, Full ring and Cash are the selected options.
  - While loading (`view` undefined) or after a failure (`null`) there is no `<select>`.
- Verification: acceptance `tests/stats/trend-filters.acceptance.test.tsx::AC#1 lists the table size and game type options, each defaulting to All`

### SPEC-02: Table size by reference size
- Verifies: AC#2, DoD#1
- Behaviour: Given stored hands from cash sessions at 2, 4, 6, 8 and 10 players (real `cashPool` records cloned
  through `trendHand(parseHandRecord(r))`, counts 50, 60, 70, 80 and 90), When filtering:
  - 6-max keeps exactly the 4- and 6-player sessions' 130 hands (their sessionIds only).
  - Full ring keeps the 8- and 10-player sessions' 170 hands.
  - Heads-up keeps 50, and All keeps 350.
  - In each case the view's totals equal `totalsLine(kept, sessions)`.
- Verification: acceptance `tests/stats/trend-filters.acceptance.test.tsx::AC#2 6-max counts 4- and 6-player sessions and Full ring 8- and 10-player sessions`

### SPEC-03: Sit-and-go Major-error points recomputed from sit-and-go hands only
- Verifies: AC#3, DoD#1
- Behaviour: Given 2,000 cash hands and 600 sit-and-go hands with differing unhinted Major rates, When the game type
  filter is Sit-and-go, Then:
  - `statisticsView(filterTrendData(data, {all, sit-and-go}), data).chart` equals
    `{ kind: 'points', points: majorErrorPoints(orderHands(<the 600 sit-and-go hands only>)) }`, i.e. 1 point.
  - It differs from the All view's first point.
  - The rendered Major card has 1 `circle[data-point]`, whose `<title>` is the recomputed `pointLabel`.
- Verification: acceptance `tests/stats/trend-filters.acceptance.test.tsx::AC#3 Sit-and-go points equal values recomputed from the sit-and-go hands`

### SPEC-04: Totals follow the filter
- Verifies: AC#4, DoD#1
- Behaviour: Given 1,840 hands over 9 sessions of which 3 sessions (200 + 250 + 250 = 700 hands) are heads-up and 6
  are 6-max or full ring, When the table size filter is Heads-up, Then:
  - The rendered `<p class="stats-totals">` reads `700 hands over 3 sessions`.
  - With All it reads `1,840 hands over 9 sessions`.
- Verification: acceptance `tests/stats/trend-filters.acceptance.test.tsx::AC#4 Heads-up totals read 700 hands over 3 sessions`

### SPEC-05: Play-more message under a filter
- Verifies: AC#5, DoD#1
- Behaviour: Given 300 heads-up hands among 3,000 stored hands, When the table size filter is Heads-up, Then:
  - The Major card's `.stats-message` reads `Play 200 more hands to see your first trend point.`
  - The Major card has no `<svg>`.
  - The totals read `300 hands over <n> sessions`, where n is the number of heads-up sessions.
- Verification: acceptance `tests/stats/trend-filters.acceptance.test.tsx::AC#5 300 heads-up hands among 3,000 show Play 200 more hands`

### SPEC-06: BB/100 under the game type filter stays cash-only
- Verifies: AC#6, DoD#1
- Behaviour: Given 1,000 cash hands and 600 sit-and-go hands:
  - When the game type is Sit-and-go, Then `view.bb100` is `{ kind: 'no-cash' }` and the BB/100 card shows
    `No cash-game hands yet.`
  - When it is All, Then `view.bb100` equals `{ kind: 'points', points: bb100Points(orderHands(all)) }`, which also
    equals the result computed from the cash hands alone (2 points), and does not count the sit-and-go hands.
  - When it is Cash, Then `view.bb100` equals the All result.
- Verification: acceptance `tests/stats/trend-filters.acceptance.test.tsx::AC#6 BB/100 shows no-cash for Sit-and-go and cash hands only for All`

### SPEC-07: G-2 target from all stored hands under every filter
- Verifies: AC#7, DoD#1
- Behaviour: Given 1,600 stored hands whose first 1,000 overall yield target T, while the first 1,000 of the
  1,100-hand Cash subset yield a different value T′ ≠ T, When each of the 7 non-default filter combinations with
  ≥ 500 hands is applied through `statisticsView(filterTrendData(data, f), data)`, Then:
  - `view.g2Target === T` for every one, and `T ≠ statisticsView(filterTrendData(data, cash)).g2Target`.
  - For a filter that leaves points, the rendered `line.stats-target` has `y1 = y2 = round(150 − T/yMax·140, 1)`.
- Verification: acceptance `tests/stats/trend-filters.acceptance.test.tsx::AC#7 the G-2 target is computed from all stored hands under every filter`

### SPEC-08: No G-2 caption, line or aria suffix when the filtered Major chart has no points
- Verifies: AC#8, DoD#1
- Behaviour: Given 1,200+ stored hands (so the unfiltered `g2Target` is non-null):
  - When a filter leaves 300 hands (`more-hands`): `view.g2Target` is non-null, and the rendered markup contains no
    `Dashed line: half your first-1,000 rate (G-2)`, no `class="stats-target"` and no `Dashed target line`.
  - When a filter leaves 0 hands (`no-hands`, e.g. Full ring with no full-ring sessions): the same holds, and the card
    shows `Play your first hand to see trends.` and the totals `0 hands over 0 sessions` (A-5).
- Verification: acceptance `tests/stats/trend-filters.acceptance.test.tsx::AC#8 no G-2 caption, line or label suffix when the filtered chart has no points`

### SPEC-09: filterTrendData internals
- Verifies: AC#2, AC#3
- Behaviour: Given hand-built and pool-built trend data, When `filterTrendData` runs, Then `filterTrendData(data, ALL_TRENDS)` returns the same object (`toBe(data)`); `trendHand(record).dealtIn === record.seats.length` for a cash and a sit-and-go record; a session whose hands deal 6 then 2 seats is wholly 6-max and absent from Heads-up; hands without `dealtIn` match only table size All (A-1); Heads-up + Cash keeps only heads-up cash hands (AND); `sessionStarts` passes through unchanged; kept hands keep their input order.
- Verification: unit `tests/stats/trends.test.ts::filters trend data by table size and game type`

### SPEC-10: Browser flow, axe and network
- Verifies: AC#1, AC#4, AC#6, DoD#7, DoD#8
- Behaviour: Given seeded records via `seedStoredRecords`/`seedStoredSessions` and a reload (500 6-player cash
  hands in 2 sessions plus 200 heads-up sit-and-go hands in 1 session), When Statistics opens from Home, Then:
  - The comboboxes named "Table size" and "Game type" show `All`, with the options of SPEC-01, and the totals read
    `700 hands over 3 sessions`.
  - Selecting Heads-up gives the totals `200 hands over 1 session`, the Major card's
    `Play 300 more hands to see your first trend point.`, and the BB/100 card's `No cash-game hands yet.`
  - Selecting Table size All and Game type Sit-and-go shows the same `No cash-game hands yet.`
  - Selecting Cash shows `500 hands over 2 sessions` and one Major `circle[data-point]`.
  - axe reports zero serious or critical violations.
  - Every request is to the app's own origin.
  - This runs in Chromium and WebKit.
- Verification: acceptance `e2e/statistics-filters.spec.ts::Statistics filters the trends by table size and game type`

### SPEC-11: Project checks
- Verifies: DoD#2, DoD#4, DoD#5, DoD#10
- Behaviour: Lint (including the headless boundary on `src/stats/**`), typecheck and the full Vitest suite with
  coverage pass with zero errors. `src/stats/**` stays ≥ 90% lines and overall ≥ 70%. Every locked TASK-11.1/11.2/11.3
  test passes unedited. CI is green on the branch. The added tests keep `npm test` fast (see §9).
- Verification: command `npm run lint && npm run typecheck && npm test && npm run e2e`

### SPEC-12: Documentation
- Verifies: DoD#11
- Behaviour: Given the story is done, When the docs are read, Then `docs/stats/trends.md` has a filters section covering the options and defaults, table size as the session's largest dealt-in count through `referenceSizeOf` (D-2), game type by `cash` (D-3), that the filters apply to the totals, both charts and their messages, `statisticsView(filtered, all)` for G-2, and no persistence (D-5); and the story doc is published to Backlog.
- Verification: manual `docs/stats/trends.md` filters section and the TASK-11.4 entry in `backlog doc list --plain`

### SPEC-13: Not-applicable DoD items
- Verifies: DoD#3, DoD#6, DoD#9, DoD#12
- Behaviour: There is no engine, bots or advice change (`referenceSizeOf` is only imported). So the golden-spot suite
  (run by `npm test`) and the 10,000-hand playtest are unaffected. There is no strategy content. No service worker
  exists yet (E13-S07).
- Verification: manual `git diff --stat main -- src/engine src/bots src/advice` is empty

## 7. Edge cases
- Filter leaves 0 hands → `no-hands` message, `0 hands over 0 sessions`, BB/100 `no-cash`, no G-2 elements
  (SPEC-08).
- Filter leaves 1–499 hands → play-more message (SPEC-05, SPEC-08).
- Fewer than 1,000 stored hands → `g2Target` null under every filter (unchanged TASK-11.3 behaviour; locked
  g2-target AC#4 covers it).
- A sit-and-go session that shrinks to heads-up → stays in its starting size (SPEC-09, D-2).
- Hands without `dealtIn` → only under All (SPEC-09, A-1).
- Filter changed while loading → N/A: there are no selects until loaded (A-2).
- Home and back → filter resets to All / All (D-5, SPEC-10 starts fresh each test).
- Invalid stored values → already skipped by `trendData()` (TASK-11.1 A-3), so they cannot reach the filter.
- Concurrency → N/A: a single-user, in-memory recompute.

## 8. Security considerations
- Trust boundaries: the select values are fixed option ids. Stored hands are already validated by
  `parseHandRecord`. No new input path.
- No authn/authz, secrets, injection, logging, randomness or new dependencies. No network requests (SPEC-10 checks
  origins).

## 9. Non-functional
- The normal suite stays fast:
  - The new acceptance file builds `TrendHand`s once per pool record (`trendHand(parseHandRecord(r))`) and clones
    the resulting small objects with new `sessionId`/`handNumber`/`completedAt`. It does not structured-clone full
    `HandRecord`s per hand, except where a rendered fixture needs records. Its total stored hands across all cases are
    ≤ 12,000.
  - Target: the file runs in < 3 s locally (measure with `npx vitest run tests/stats/trend-filters.acceptance.test.tsx`).
  - No perf/scale checks are added to `npm test` or the default `npm run e2e`.
- A filter change recomputes the view synchronously. At the current scale (thousands of hands) this is well under one
  frame. The 100,000-hand target belongs to TASK-11.12.
- Accessibility: each select has a visible `<label>`, a 44px min-height target (storyboard), and axe reports zero
  serious or critical violations.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev` → Home → Statistics → change "Table size" and "Game type" → read the totals and both cards → "← Home"
- New tests:
  - `tests/stats/trend-filters.acceptance.test.tsx` → SPEC-01..SPEC-08
  - `tests/stats/trends.test.ts` (added cases) → SPEC-09
  - `e2e/statistics-filters.spec.ts` → SPEC-10
- Judge's end-to-end scenario:
  1. Run `npx playwright test e2e/statistics-filters.spec.ts e2e/statistics.spec.ts e2e/statistics-bb100.spec.ts
     e2e/statistics-target.spec.ts`. All pass in Chromium and WebKit.
  2. Then `npm run dev`. Play a few hands at a 6-player cash table, leave, and open Statistics. Choose Heads-up: the
     totals read `0 hands over 0 sessions` and the card says `Play your first hand to see trends.`. Choose 6-max: the
     hands reappear. Choose Sit-and-go: BB/100 shows `No cash-game hands yet.`. Go Home and back: both selects show All.

## 11. Open questions
None. Q-1 (D-5: not remembered, All / All on every opening) and Q-2 (D-2: session size from the largest dealt-in
count through `referenceSizeOf`) answered in `doit/TASK-11.4/qa.md`.

## 12. Clarifications log
See `doit/TASK-11.4/qa.md`.
