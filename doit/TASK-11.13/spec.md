# Spec: TASK-11.13 — Strengthen Statistics trend tests (ordering, fallback, speed wait)

Status: READY (approved 2026-11-26)
Task: TASK-11.13 · Parent/epic: TASK-11 · Requirements: n/a (follow-ups from doc-134, doc-137, doc-138 on REQ-048) · Dream: limit-holdem-trainer

## 1. Summary
This task closes the review follow-ups that TASK-11.1, 11.4 and 11.5 left open on the Statistics trends. It adds
repo tests for out-of-order input and for the earliest-`completedAt` fallback of a session that has no record. It
removes the unused `TEMPLATE_DECISIONS` export and makes the opt-in speed check stop its timer only when the 6th
point is visible. It adds an App-level test that the G-2 target comes from every stored hand under every
filter, and it maps an unknown filter select value to All. It removes the unreachable `data === undefined`
guard in `App.tsx`. Last, the Vitest day-grouping tests run in a pinned non-UTC time zone, so a UTC-date day key
fails `npm test` on CI.

## 2. Scope
- In scope:
  - `src/stats/trends.ts`: two small exported helpers. `filteredStatisticsView(data, filter, grouping)` is the one
    place App computes a view. `filterOption(options, value)` maps a select value to a known option id, else
    `'all'`.
  - `src/ui/App.tsx`: the `stats` screen state becomes two union members. One is loading or failed, with no
    `data`. The other is loaded, with `data` required. Every view is computed through `filteredStatisticsView`,
    and both `if (data === undefined) return;` guards are gone.
  - `src/ui/stats/StatisticsScreen.tsx`: the Table size, Game type and Line-up `onChange` handlers use
    `filterOption` instead of `as` casts.
  - `tests/support/stat-records.ts`: remove `TEMPLATE_DECISIONS` and add a deterministic `shuffled` helper.
  - `tests/support/time-zone.ts` (new): `pinTimeZone(zone)` for Vitest files.
  - `e2e/statistics-speed.spec.ts` (opt-in, stays opt-in): the timer stops when the 6th point is visible.
  - New tests: `tests/stats/trend-order.acceptance.test.tsx` and `e2e/statistics-hardening.spec.ts`. Add unit
    cases to `tests/stats/trends.test.ts`. Pin the zone in the two day-grouping Vitest files.
  - `docs/stats/trends.md`: the unknown-value rule, the time-zone pin and the new tests.
- Not doing:
  - The "Group by" select is not a filter, so AC#5 does not apply to it. Its handler keeps its `as TrendGrouping`
    cast and nothing else changes there. See scope concerns.
  - `filterTrendData` keeps its semantics. The unknown-value mapping happens where the select value enters, in
    `StatisticsScreen`.
  - No change to ordering, grouping, G-2, BB/100 rules, texts, stored formats, storage, engine, bots or advice.
  - No global `TZ` in `vite.config.ts` or `package.json`. Only the day-grouping files are pinned.
  - The speed check stays opt-in (`TLH_SLOW_TESTS=1`, `npm run e2e:slow`). Its budget (1,000 ms) and data
    (3,000 hands) stay as they are.
  - No edit to locked tests other than the one listed in §3 "Locked tests".
  - The `Math.max/min` spread (doc-138) and the `screenType()` parser NIT (doc-137) are out of scope here.
- Scope budget: files=11, lines=520

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | AC#5 applies to Table size, Game type and Line-up. An unknown value sets only that field to `'all'` and keeps the other fields. The select then shows All. | yes | Normal use cannot produce an unknown value. Only DOM editing can, so nobody sees this in normal use. The doc-137 security NIT named these filters. | Also map an unknown Group by value to Every 500 hands. |
| A-2 | The mapping happens in `StatisticsScreen`'s `onChange` through a pure `filterOption` in `src/stats/trends.ts`. `filterTrendData` is unchanged. | yes | The value enters the app at that point. The helper also replaces the `as` casts and keeps `src/stats` headless. | Treat unknown values inside `filterTrendData`. |
| A-3 | The pinned zone is `Pacific/Kiritimati` (UTC+14, no DST). It is set in `process.env.TZ` when the file loads and restored in `afterAll`. | yes | Node applies a runtime `TZ` change at once. I checked this in a Vitest 5.1 worker: offset -840 in the pinned file, unchanged in another file. Both files already pass under this zone and under UTC. With no DST, there are no transition-day surprises. A local hour below 14 falls on the previous UTC day, so a UTC-getter `localDay` breaks the existing expectations. | `America/New_York`, which the e2e already uses. A Vitest `projects` split with `test.env.TZ`. |
| A-4 | The AC#4 App-level proof is a Playwright test that renders the real App with 1,200 seeded hands. It is backed by a Vitest unit test of `filteredStatisticsView`. | yes | Vitest runs `environment: 'node'` with only `renderToString` (`vite.config.ts:11`). No DOM library is installed, and adding one would be a new dependency. App tests can only render Home (`tests/unit/app.test.tsx:7`). | Add jsdom plus Testing Library (new dependency). |
| A-5 | The AC#4/AC#5 e2e uses Group by = Session, so every non-empty filter draws a chart and its target line. Six sessions of 200 hands cover {Heads-up, 6-max, Full ring} × {Cash, Sit-and-go}, so all 12 combinations have hands. | yes | Under Every 500 hands, most subsets of under 500 hands show no chart. The target still shows under Session (TASK-11.5 A-5). | Seed 500+ hands per category (3,000+ hands, slower). |
| A-6 | "Visible" for the speed timer means the 6th `circle[data-point]` exists, `checkVisibility({ visibilityProperty: true })` is true, and its bounding box has a non-zero width and height. It is checked on every DOM mutation and on every animation frame until true. | yes | This matches Playwright's own `toBeVisible` rule (non-empty box, not `visibility:hidden`). Polling each frame also catches a layout or style change that comes without a DOM mutation. | Stop the timer at the first `requestAnimationFrame` after presence. |

## 3. Current system
- Trends module: `src/stats/trends.ts`.
  - `filterTrendData` (`:198`) returns `data` itself for All/All/All. An unknown `tableSize` matches no session
    (`:211-214`). An unknown `gameType` acts as Sit-and-go (`:215-216`). An unknown `lineUp` matches nothing
    (`:220`).
  - `sessionStartTimes` (`:226-238`) uses the record's `startedAt`, else the **earliest** `completedAt` of a
    session with no record.
  - `orderHands` (`:241`) sorts by start, then sessionId, then hand number.
  - `statisticsView(data, all = data, grouping)` (`:415`) takes G-2 from `all` (`:449-452`).
  - The option lists are `TABLE_SIZE_OPTIONS` `:161`, `GAME_TYPE_OPTIONS` `:167`, `LINE_UP_OPTIONS` `:172` and
    `GROUPING_OPTIONS` `:183`. `localDay` (`:318`) uses local `Date` getters.
- App: `src/ui/App.tsx`.
  - The `Screen` union is at `:29-46`. The `stats` member has `view: StatisticsView | undefined | null` and an
    optional `data?: TrendData` (`:42`).
  - The read effect (`:132-159`) sets `{ data, view: statisticsView(data) }` on success and `view: null` on
    failure.
  - `openStatistics` (`:312-315`) sets `view: undefined`.
  - The render (`:383-408`) has `if (data === undefined) return;` at `:391` and `:401`. These are unreachable,
    because `StatisticsScreen` renders the selects only when `view` is truthy (`StatisticsScreen.tsx:169`), and
    `view` is truthy only in the state that also has `data`.
  - The locked screen-list parser (`e2e/support/play-money.ts:41-52`, used by
    `tests/ui/screen-list.acceptance.test.ts`) cuts `type Screen =` at the first `;` at brace depth 0, even
    one inside a comment. The new union must have no `;` outside braces before its end, and that includes
    comments. Its routes stay `['config','ending','home','report','settings','stats','table']`.
- Screen: `src/ui/stats/StatisticsScreen.tsx`. The `onChange` handlers at `:176-178`, `:192-194`, `:208-210` and
  `:224` cast `e.target.value as …`. The select ids are `#stats-table-size`, `#stats-game-type`, `#stats-line-up`
  and `#stats-group-by`. Totals are in `p.stats-totals`.
- Test support: `tests/support/stat-records.ts`. `TEMPLATE_DECISIONS` (`:46`) has no users. I grepped `src`,
  `tests`, `e2e`, `tools` and `docs`, and the only hit is its definition. `TEMPLATE` itself stays in use (`:85`).
  The file also provides `statRecords`, `nineSessions` (start order ≠ id order, `:96-113`), `mixedGrades`,
  `cashPool`, `sitAndGoPool`, `cloneRecords` and `withGrades`. It has no test-runner imports (header `:19-21`),
  and that stays true.
- Speed check: `e2e/statistics-speed.spec.ts`. A MutationObserver resolves once there are 6 or more
  `circle[data-point]` (`:28-35`), which is presence only. The test is skipped unless `TLH_SLOW_TESTS=1` (`:8`)
  and runs through `npm run e2e:slow` (`package.json` scripts).
- Day-grouping Vitest tests:
  - `tests/stats/trend-grouping.acceptance.test.tsx` (AC#1–AC#8, local-time fixtures such as
    `new Date(2026, 10, 10, 23, 58)` at `:185`).
  - `tests/stats/trends.test.ts` `'session and day grouping helpers and texts'` (`:438-540`).
  - Both pass today under `TZ=UTC` and under `TZ=Pacific/Kiritimati` (I ran both, 22 tests each).
  - The e2e `e2e/statistics-grouping.spec.ts:14` already pins `America/New_York` through `timezoneId`.
- Test runner: Vitest 5.1, `environment: 'node'` and the default forks pool (`vite.config.ts:9-24`).
  - `npm test` runs `vitest run --coverage`, with at least 90% lines required for `src/stats/**`.
  - CI runs `test:unit` (no `*.acceptance.*`), `test:sweeps` (acceptance files) and `npm run e2e` in
    Chromium and WebKit (`.github/workflows`).
  - `npm run e2e` builds and previews on port 4173 (`playwright.config.ts`).
- Existing code to reuse:
  - `tests/support/stat-records.ts` → `statRecords`, `nineSessions`, `mixedGrades`, `cashPool`, `sitAndGoPool`,
    `cloneRecords`, `withGrades`.
  - `e2e/support/hand-records.ts` → `seedStoredRecords`, `seedStoredSessions`.
  - `tests/stats/trend-view.acceptance.test.tsx` → the pattern for the independent 500-hand recomputation and the
    `<circle … data-point><title>` extraction.
  - `tests/stats/trend-grouping.acceptance.test.tsx:84-94` → the LCG shuffle. Copy it into `stat-records.ts` as
    `shuffled`. The locked file keeps its own copy.
  - `src/stats/trends.ts` → `statisticsView`, `filterTrendData`, `orderHands`, `trendHand`, `ALL_TRENDS`,
    `DEFAULT_GROUPING`, the option lists.
  - `e2e/statistics-filters.spec.ts` → the locators (`combobox` by label, `.stats-totals`, region by card title)
    and the seeding flow.
- Locked tests:
  - `tests/stats/trend-grouping.acceptance.test.tsx` (owner TASK-11.5) must change for AC#6. The only change is an
    added `import { pinTimeZone } from '../support/time-zone';` and one top-level `pinTimeZone('Pacific/Kiritimati');`
    right after the imports. No assertion is removed or altered.
  - No other locked file changes. `trend-view.acceptance.test.tsx` (TASK-11.1), `trend-filters.acceptance.test.tsx`
    (TASK-11.4), `e2e/statistics-target.spec.ts` (TASK-11.3) and `e2e/statistics-filters.spec.ts` (TASK-11.4)
    stay untouched. The new coverage goes into new files.
  - `e2e/statistics-speed.spec.ts`, `tests/stats/trends.test.ts` and `tests/support/stat-records.ts` are not
    locked by any `doit/*/state.json`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | AC#1 and AC#2 go in a new acceptance file, `tests/stats/trend-order.acceptance.test.tsx`. | Edit the locked `trend-view.acceptance.test.tsx`. | No unlock is needed, and every existing assertion stays. | no | n/a |
| D-2 | `filteredStatisticsView(data, filter, grouping) = statisticsView(filterTrendData(data, filter), data, grouping)`. App uses it for the first view and for every recompute. | Keep three inline call sites. | One audited place passes all hands as `all`. A unit test covers it, and the App e2e covers its wiring. | no | n/a |
| D-3 | The `stats` state is a two-member union: `{ name:'stats'; view: undefined \| null; filter; grouping }` and `{ name:'stats'; view: StatisticsView; data: TrendData; filter; grouping }`. The render narrows with `'data' in screen` and passes `onFilterChange`/`onGroupingChange` only for the loaded member. | Keep `data?` and use a non-null assertion. | This removes the unreachable guard by construction, without `!` or casts (AC#5). | no | n/a |
| D-4 | `pinTimeZone` is a tiny Vitest-side helper. It sets the zone when called, throws if the zone did not take effect, and restores the original zone in `afterAll`. | Inline lines in each file. A Vitest `projects` split. | It is one line per file, and the locked file needs only a two-line edit. Other files are not affected. | no | n/a |

## 5. Design

### Files to create / modify
- `src/stats/trends.ts` — add `filteredStatisticsView` and `filterOption`.
- `src/ui/App.tsx` — split the stats state, compute views only through `filteredStatisticsView`, and remove both guards.
- `src/ui/stats/StatisticsScreen.tsx` — the three filter `onChange` handlers use `filterOption`.
- `tests/support/stat-records.ts` — remove `TEMPLATE_DECISIONS` and add `shuffled`.
- `tests/support/time-zone.ts` — new: `pinTimeZone`.
- `tests/stats/trend-order.acceptance.test.tsx` — new: AC#1 and AC#2.
- `tests/stats/trends.test.ts` — the zone pin, plus unit cases for `filteredStatisticsView` and `filterOption`.
- `tests/stats/trend-grouping.acceptance.test.tsx` — locked (TASK-11.5). Add the zone pin only.
- `e2e/statistics-speed.spec.ts` — the visibility-based timer stop.
- `e2e/statistics-hardening.spec.ts` — new: AC#4 and AC#5 in the real App.
- `docs/stats/trends.md` — document the unknown-value rule, the zone pin and the new tests.

### Components, interfaces and data
- `export function filteredStatisticsView(data: TrendData, filter: TrendFilter, grouping: TrendGrouping): StatisticsView`
  returns `statisticsView(filterTrendData(data, filter), data, grouping)`. `data` is every stored hand.
- `export function filterOption<T extends string>(options: readonly (readonly [T, string])[], value: string): T | 'all'`
  returns `value` (typed as `T`) when some `options[i][0] === value`, else `'all'`. It is pure and never throws.
- `StatisticsScreen` handlers:
  - `tableSize: filterOption(TABLE_SIZE_OPTIONS, e.target.value)`
  - `gameType: filterOption(GAME_TYPE_OPTIONS, e.target.value)`
  - `lineUp: filterOption(LINE_UP_OPTIONS, e.target.value)`
  - The other fields of `filter` are kept, and the Group by handler is unchanged.
- App `Screen` `stats` members follow D-3. Constraints:
  - `openStatistics` and the failure path build the loading or failed member.
  - The success path builds `{ name:'stats', data, filter: ALL_TRENDS, grouping: DEFAULT_GROUPING, view: filteredStatisticsView(data, ALL_TRENDS, DEFAULT_GROUPING) }`.
  - Neither `src/ui/App.tsx` nor `StatisticsScreen` has `data === undefined`, `data!` or `as TrendData`.
  - App calls `statisticsView` only through `filteredStatisticsView`, so App.tsx no longer imports
    `statisticsView` or `filterTrendData`.
  - The comment and type text inside `type Screen = …` contain no `;` at brace depth 0 before the union's end.
- `tests/support/time-zone.ts`: `export function pinTimeZone(zone: string): void`.
  - It saves `process.env.TZ` and sets `process.env.TZ = zone`.
  - It throws `Error('time zone ' + zone + ' not applied')` unless
    `Intl.DateTimeFormat().resolvedOptions().timeZone === zone`.
  - It registers `afterAll`, which restores the saved value, or deletes `TZ` if it was unset.
  - It imports `afterAll` from `vitest`. That is fine here: it is a separate file from `stat-records.ts`, which
    stays runner-free.
- `tests/support/stat-records.ts`: `export function shuffled<T>(items: readonly T[]): T[]`. It is the same LCG as
  `trend-grouping.acceptance.test.tsx:84-94` (seed 12345, `seed = (seed * 1103515245 + 12345) % 2147483648`,
  Fisher–Yates from the end).

### Rules and algorithms
- AC#2 fallback, with a worked example. Session `A` has no session record. Its hands are A#1 at
  `2026-11-01T10:00:00Z` and A#2 at `12:00:00Z`. Session `B` has a record that started at `11:00:00Z`, with
  hands B#1 at `11:00:01Z` and B#2 at `11:00:02Z`. The input order is `[A#2, B#2, A#1, B#1]`.
  - Earliest rule (correct): order A#1, A#2, B#1, B#2.
  - Latest rule (wrong): B#1, B#2, A#1, A#2.
  - First-in-input rule (wrong): also B before A.
- Unknown filter value: `filterOption(GAME_TYPE_OPTIONS, 'bogus') === 'all'`,
  `filterOption(GAME_TYPE_OPTIONS, 'cash') === 'cash'` and `filterOption(TABLE_SIZE_OPTIONS, '') === 'all'`.
- Speed timer: `started` is taken just before `button.click()`. `check()` resolves with
  `performance.now() - started` the first time the 6th `circle[data-point]` passes the A-6 test. It runs from the
  MutationObserver callback and from a `requestAnimationFrame` loop. Both stop once resolved.

### Error handling and configuration
- No new errors are visible to the user. Leaving Statistics while the read is pending is still cancelled
  (`App.tsx:155-157`).
- `pinTimeZone` fails the file at load if the runtime ignores `TZ`, so a no-op pin cannot pass silently.

## 6. Behaviour specification

### SPEC-01: Shuffled input gives the sorted-order view
- Verifies: AC#1
- Behaviour: Given / When / Then as listed:
  - Given 3,000 records over `nineSessions(3000)` with `mixedGrades`. The sessions' start order differs from
    sessionId order, which the test asserts.
  - Given they are reduced with `trendHand` and supplied in `shuffled` order. The test asserts that order differs
    from the session-start / hand-number order.
  - When `statisticsView` is computed for each grouping `'hands'`, `'session'` and `'day'`.
  - Then each view `toEqual`s the view of the same hands supplied pre-sorted by the test's own rule (session
    `startedAt` rank, then hand number).
  - Then, for `'hands'`, the rendered point titles equal the test's independent recomputation:
    `Hands 1–500: x.y` … `Hands 2,501–3,000: x.y`. At least one slice spans two sessions, and at least two
    values differ.
  - Then the totals are `3,000 hands over 9 sessions`.
- Verification: acceptance `tests/stats/trend-order.acceptance.test.tsx::AC#1 shuffled hands across sessions give the sorted-order points and totals`

### SPEC-02: A session with no record orders by its earliest completedAt
- Verifies: AC#2
- Behaviour: Given / When / Then as listed:
  - Given the §5 worked example: session A has no record, with hands at 10:00 and 12:00 UTC. Session B's record
    starts at 11:00 UTC. The input is `[A#2, B#2, A#1, B#1]`.
  - When `orderHands` runs, Then the result is `[[A,1],[A,2],[B,1],[B,2]]`.
  - When `statisticsView(data, data, 'session')` runs, Then point 1 is session A: hands 1–2, with A's Major rate.
    Give A#1 one unhinted Major, so the rate is `50`.
  - Then point 2 is session B, with `majorPer100: 0`.
- Verification: acceptance `tests/stats/trend-order.acceptance.test.tsx::AC#2 a session without a record orders by its earliest completedAt`

### SPEC-03: Unused support export removed
- Verifies: AC#3
- Behaviour: Given the repo, When `TEMPLATE_DECISIONS` is searched for in `src tests e2e tools docs`, Then there is
  no match. `npm run typecheck` and `npm run lint` pass.
- Verification: command `grep -rn TEMPLATE_DECISIONS src tests e2e tools docs; test $? -eq 1`

### SPEC-04: The speed timer stops when the 6th point is visible
- Verifies: AC#3
- Behaviour: Given / When / Then as listed:
  - Given the opt-in speed check, still skipped unless `TLH_SLOW_TESTS=1`.
  - When Statistics is clicked with 3,000 stored hands, Then the measured time ends at the first moment the 6th
    `circle[data-point]` passes the A-6 visibility test.
  - DOM presence alone does not resolve it, and the check runs on mutations and on animation frames.
  - The elapsed time is `<= 1000` ms in Chromium and WebKit.
  - With `TLH_SLOW_TESTS` unset, the test is reported as skipped.
- Verification: command `TLH_SLOW_TESTS=1 npx playwright test e2e/statistics-speed.spec.ts` (passes in both
  projects), and `npx playwright test e2e/statistics-speed.spec.ts` (2 skipped). Judge also reads the observer
  code against A-6.

### SPEC-05: App shows the all-hands G-2 target under every Table size and Game type filter
- Verifies: AC#4
- Behaviour: Given / When / Then as listed:
  - Given 1,200 stored hands seeded through `cloneRecords`, in 6 sessions of 200 started an hour apart:
    cash heads-up (2 seated), cash 6, cash 10, sit-and-go 2, sit-and-go 6 and sit-and-go 10.
  - Given every decision of each hand `n` with `n % 10 === 0` is an unhinted Major (`withGrades`), and every
    other decision is unhinted Correct.
  - Given the test computes `expected = statisticsView({ hands: records.map(trendHand), sessionStarts }).g2Target`
    and asserts it is non-null and `> 0`.
  - When the App opens Statistics, Then with All/All and Every 500 hands, the Major card's chart `img` aria-label
    ends `Dashed target line at <expected.toFixed(1)>`, with one `line.stats-target`.
  - When Group by is set to Session, and Table size × Game type is set in turn to each of the 4 × 3 combinations,
    Then for each combination:
    - The totals read 1,200/6 (All/All), 400/2 (one size, All types), 600/3 (All sizes, one type) or 200/1
      (both named): `1,200 hands over 6 sessions`, `400 hands over 2 sessions`, `600 hands over 3 sessions`,
      `200 hands over 1 session`.
    - The G-2 caption `Dashed line: half your first-1,000 rate (G-2)` is visible.
    - The aria-label ends with the same `expected` value, and there is one `line.stats-target`.
  - A view computed from only the filtered hands would have no target under any non-All filter, because every
    such subset has under 1,000 hands.
- Verification: acceptance `e2e/statistics-hardening.spec.ts::App takes the G-2 target from every stored hand under every filter`

### SPEC-06: filteredStatisticsView passes all hands as the G-2 source
- Verifies: AC#4
- Behaviour: Given / When / Then as listed:
  - Given 1,200 synthetic `TrendHand`s over 6 sessions covering dealtIn 2, 6 and 10 × cash and non-cash, with
    Majors on hands 10, 20, ….
  - When `filteredStatisticsView(data, { tableSize, gameType, lineUp: 'all' }, grouping)` runs for all 12
    filters × 3 groupings, Then it `toEqual`s `statisticsView(filterTrendData(data, f), data, grouping)`.
  - Then its `g2Target` equals `statisticsView(data).g2Target`, which is non-null.
  - For every non-All filter, `statisticsView(filterTrendData(data, f)).g2Target` is `null`, so the test can tell
    the two apart.
- Verification: unit `tests/stats/trends.test.ts::filteredStatisticsView keeps the all-hands G-2 target under every filter`

### SPEC-07: An unknown filter select value is treated as All
- Verifies: AC#5
- Behaviour: Given / When / Then as listed:
  - Given the SPEC-05 store on Statistics, with Table size Heads-up and Game type Cash: `200 hands over 1 session`.
  - When the Game type `sit-and-go` option's `value` is changed in the DOM to `bogus` and that option is selected:
    - Then Game type has value `all` and Table size is still `heads-up`.
    - Then the totals read `400 hands over 2 sessions`.
  - When the Table size `full-ring` option's value becomes `bogus` and is selected:
    - Then Table size has value `all`.
    - Then the totals read `1,200 hands over 6 sessions`.
  - When Game type is set to Cash (`600 hands over 3 sessions`), and the Line-up `Custom` option's value becomes
    `bogus` and is selected:
    - Then Line-up has value `all` and Game type is still `cash`.
    - Then the totals read `600 hands over 3 sessions`.
- Verification: acceptance `e2e/statistics-hardening.spec.ts::an unknown filter value is treated as All`

### SPEC-08: filterOption maps unknown ids to All
- Verifies: AC#5
- Behaviour: Given / When / Then as listed:
  - Given each of `TABLE_SIZE_OPTIONS`, `GAME_TYPE_OPTIONS` and `LINE_UP_OPTIONS`, When `filterOption` is called
    with each listed id, Then it returns that id.
  - When it is called with `'bogus'`, `''`, `'All'` or `'CASH'` (case matters), Then it returns `'all'`.
- Verification: unit `tests/stats/trends.test.ts::filterOption keeps known ids and maps others to all`

### SPEC-09: The unreachable data guard is gone
- Verifies: AC#5
- Behaviour: Given / When / Then as listed:
  - Given `src/ui/App.tsx`, When searched, Then it contains no `data === undefined`, no `data!` and no
    `as TrendData`.
  - The stats state's loaded member has a required `data` (D-3).
  - `npm run typecheck` passes.
  - The locked screen-list test still finds routes `config, ending, home, report, settings, stats, table`.
- Verification: command `! grep -nE "data === undefined|data!|as TrendData" src/ui/App.tsx && npm run typecheck && npx vitest run tests/ui/screen-list.acceptance.test.ts`

### SPEC-10: Day-grouping Vitest tests run in a pinned non-UTC zone
- Verifies: AC#6
- Behaviour: Given / When / Then as listed:
  - Given `tests/stats/trend-grouping.acceptance.test.tsx` and `tests/stats/trends.test.ts`, each calls
    `pinTimeZone('Pacific/Kiritimati')` at top level, right after its imports. `pinTimeZone` throws at file load
    if the zone did not take effect.
  - When they run under `TZ=UTC`, Then `trends.test.ts` asserts
    `new Date(Date.UTC(2026, 10, 10)).getTimezoneOffset() === -840`, and every test in both files passes.
  - The zone is restored in `afterAll`. No other file calls `pinTimeZone`, and `vite.config.ts` and
    `package.json` set no `TZ`.
- Verification: unit `tests/stats/trends.test.ts::day-grouping tests run in a pinned non-UTC time zone`, plus
  command `TZ=UTC npx vitest run tests/stats/trend-grouping.acceptance.test.tsx tests/stats/trends.test.ts`

### SPEC-11: A UTC-date day key fails npm test
- Verifies: AC#6
- Behaviour: Given / When / Then as listed:
  - Given `localDay` in `src/stats/trends.ts` temporarily changed to `getUTCFullYear/getUTCMonth/getUTCDate`,
    When the two pinned files run under `TZ=UTC`, Then at least one test in each file fails.
  - Revert the change afterwards.
- Verification: manual Judge applies the mutation in a scratch working copy, then runs
  `TZ=UTC npx vitest run tests/stats/trend-grouping.acceptance.test.tsx tests/stats/trends.test.ts` (expect
  failures). Then it reverts and reruns (expect pass).

### SPEC-12: Project checks and docs
- Verifies: AC#1, AC#2, AC#3, AC#4, AC#5, AC#6
- Behaviour: Given / When / Then as listed:
  - Given the change, `npm run lint`, `npm run typecheck`, `npm test` and `npm run e2e` pass, and `src/stats`
    coverage stays at or above 90% lines.
  - `docs/stats/trends.md` has these additions:
    - The unknown-value rule (an unknown Table size, Game type or Line-up value counts as All).
    - The `Pacific/Kiritimati` pin for the day-grouping Vitest tests.
    - The three new test files in its "Tests" list.
  - `TEMPLATE_DECISIONS` does not appear in the docs.
  - `git diff` shows no change under `src/engine`, `src/bots`, `src/advice` or `src/storage`.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run e2e`

## 7. Edge cases
- Empty or boundary: a filter that leaves 0 hands is already covered by TASK-11.4 A-5. SPEC-05 keeps every
  combination non-empty, so the target is always checked.
- Invalid input: an unknown select value is covered by SPEC-07 and SPEC-08. The empty string is the value of a
  select with no matching option, covered by SPEC-08.
- Duplicates and ties: a session start tie is already covered by `trends.test.ts:65`.
- Ordering: covered by SPEC-01 and SPEC-02.
- Concurrency and interruption: leaving during the read keeps the existing cancel (`App.tsx:155-157`). The state
  split does not change it.
- Time zone: covered by SPEC-10 and SPEC-11. DST is N/A, because the pinned zone has none.
- Dependency failure: a read failure gives `view: null` (TASK-11.1 D-7). This is unchanged, and the failed member
  has no `data`.
- Permissions: N/A, no new capability.

## 8. Security considerations
- Trust boundary: select values from the DOM. They now pass through `filterOption`, so a DOM-edited value can no
  longer reach `filterTrendData` (closes the doc-137 security NIT for filters).
- `process.env.TZ` is changed only inside test workers and restored afterwards. It is not app code.
- No authn/authz, secrets, injection surface, logging change, new dependency or randomness. The test shuffle is a
  fixed LCG and is not used for fairness.

## 9. Non-functional
- `tests/stats/trend-order.acceptance.test.tsx` should run in under 3 s (it handles 3,000 in-memory records, like
  `trend-view`).
- `e2e/statistics-hardening.spec.ts` should run in under 30 s per browser project.
- No change to the opt-in speed budget (1,000 ms). The speed check stays out of `npm test` and the CI push run.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`, then seed or play some hands, then Home, then Statistics, then change Table size,
  Game type and Group by. Optionally, in devtools, change an option's `value` and select it, and the select falls
  back to All.
- New tests:
  - `tests/stats/trend-order.acceptance.test.tsx` → SPEC-01, SPEC-02
  - `tests/stats/trends.test.ts` (added cases plus the pin) → SPEC-06, SPEC-08, SPEC-10
  - `tests/stats/trend-grouping.acceptance.test.tsx` (pin only) → SPEC-10
  - `e2e/statistics-hardening.spec.ts` → SPEC-05, SPEC-07
  - `e2e/statistics-speed.spec.ts` (modified, opt-in) → SPEC-04
- Judge's end-to-end scenario:
  1. `npx playwright test e2e/statistics-hardening.spec.ts e2e/statistics-filters.spec.ts e2e/statistics-target.spec.ts e2e/statistics-grouping.spec.ts e2e/statistics-lineup.spec.ts e2e/statistics.spec.ts`. All must pass in Chromium and WebKit.
  2. `TLH_SLOW_TESTS=1 npx playwright test e2e/statistics-speed.spec.ts`. Both browsers must pass.
  3. `TZ=UTC npx vitest run tests/stats` must pass. Then apply the SPEC-11 mutation and confirm the failures,
     then revert.
  4. `npm run dev`, open Statistics with more than 1,000 hands, and set Group by to Session. Change the filters
     and confirm the dashed target value never changes. In devtools, set an option's value to `x` and select it:
     the select shows All.

## 11. Open questions
(none)

## 12. Clarifications log
See `doit/TASK-11.13/qa.md`.
