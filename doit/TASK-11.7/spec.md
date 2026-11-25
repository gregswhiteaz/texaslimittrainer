# Spec: TASK-11.7 — Filter my trends by line-up

Status: READY (approved 2026-11-25)
Task: TASK-11.7 · Parent/epic: TASK-11 · Requirements: REQ-048 (048.2, 048.3, 048.6, 048.8, 048.9, 048.10) · Dream: limit-holdem-trainer

## 1. Summary
The Statistics screen gains a fourth select, "Line-up", with the options All (default), Mixed, Tough, Soft and Custom
(REQ-048.8). It filters on the line-up name stored on every hand record. It works together with the table size and
game type filters and with every grouping. It applies to both charts, the totals line and the empty-state messages.
The G-2 target stays computed from every stored hand (AC#5). The filter lives in the existing `TrendFilter`, which the
App already resets on every opening and passes through `filterTrendData`. So the App needs no code change.

## 2. Scope
- In scope:
  - `src/stats/trends.ts`:
    - `TrendHand` and `TrendSource` gain an optional `lineUp`, and `trendHand` copies it.
    - `TrendFilter` gains an optional `lineUp`. `ALL_TRENDS` gains `lineUp: 'all'`.
    - The `LINE_UP_LABEL` and `LINE_UP_OPTIONS` constants.
    - `filterTrendData` filters by line-up.
  - `src/ui/stats/StatisticsScreen.tsx`: the Line-up select in `.stats-filters`, between Game type and Group by.
  - `dreams/limit-holdem-trainer/storyboards/Stats.dc.html`: add the Line-up select (All selected) after Game type,
    so the storyboard matches the screen.
  - `docs/stats/trends.md`: a line-up filter section.
  - Tests:
    - a new acceptance file, `tests/stats/trend-lineup.acceptance.test.tsx`.
    - unit cases in `tests/stats/trends.test.ts`.
    - a new Playwright spec, `e2e/statistics-lineup.spec.ts`, which goes through the real App wiring.
- Not doing:
  - No change to the stored hand or session record format, and no migration. Every valid stored hand record already
    carries `lineUp` (§3).
  - No change to `src/ui/App.tsx`. Its stats state already holds a `TrendFilter`. It resets that filter to
    `ALL_TRENDS` on load (`App.tsx:108-113`), on failure (`:120`) and on every opening (`:260-263`). It recomputes
    `statisticsView(filterTrendData(data, filter), data, grouping)` on every filter change (`:324-331`) and grouping
    change (`:334-341`).
  - No persistence of the line-up filter across visits. It resets to All on every opening, like the other filters
    (TASK-11.4 D-5, TASK-11.6 D-2).
  - No line-up filter on the style-stats section (TASK-11.8 owns REQ-049 and will consume `TrendFilter`).
  - No breakdown of Custom line-ups by bot composition. Custom is one bucket (REQ-009.6, `src/table/session.ts:88-90`).
  - No change to the G-2 rule (REQ-048.3/048.9), the grouping rules, the texts of the other selects or any chart
    text.
  - No edit to any locked test (see §3 "Locked tests").
- Scope budget: files=7, lines=560

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The filter reads each hand record's own `lineUp`, not the session record's `config.lineUp`. Totals count the distinct `sessionId`s among the matching hands (the existing `statisticsView` rule). | yes | `handWrite` stamps `lineUp: config.lineUp` on every hand (`src/table/hand-record.ts:241`). The session's config does not change during a session (a replacement bot keeps its style, REQ-007.5), so every hand of a session has the same name. Trend data already comes from hand records (`src/storage/hand-store.ts:141-164`). | Look up `config.lineUp` from the session record. That needs a second read path, and a session record may be missing or invalid while its hands are valid. |
| A-2 | A `TrendHand` without `lineUp` matches only All. Such a hand can only come from synthetic test input, never from storage. | yes | Mirrors TASK-11.4's handling of a missing `dealtIn` (`trends.ts:186-191`). | Treat a missing name as Custom. |
| A-3 | `TrendFilter.lineUp` is optional, and a missing value means All. `ALL_TRENDS` sets it explicitly to `'all'`. | yes | Locked TASK-11.4 and TASK-11.5 tests build `TrendFilter` literals with only `tableSize` and `gameType` (for example `tests/stats/trend-filters.acceptance.test.tsx:122,142,171,265`, `tests/stats/trend-grouping.acceptance.test.tsx:233,290`). A required field would fail `npm run typecheck`. | A separate `lineUp` prop and state field. That needs App changes and a second callback. |
| A-4 | Option values are `all`, `Mixed`, `Tough`, `Soft`, `Custom`: the stored `LineUpName` itself, plus `all`. | yes | No mapping is needed, and the values equal `LINE_UPS` (`src/table/session.ts:94`). | Lower-case ids. |
| A-5 | Test records for Custom sessions are real `handWrite` clones (`cashPool`/`sitAndGoPool`/`statRecords`) with `lineUp` overridden to `'Custom'`. Mixed and Tough cash sessions use `cashPool(stake, 3, players, preset)`, which seats them through `configForLineUp`. | yes | `parseHandRecord` only checks that `lineUp` is one of `LINE_UPS` (`hand-record.ts:489`). Building a real Custom table needs seat-style edits and adds nothing to what the filter tests. | Seat Custom via `configWithSeatStyle`. |

## 3. Current system
- Toolchain and conventions:
  - TypeScript strict, React 19 and Vite.
  - Vitest runs in `tests/**`. Playwright runs `e2e/**` in Chromium and WebKit, with axe via `e2e/support/axe`.
  - Scripts are in `package.json`: `test`, `lint`, `typecheck`, `format`, `e2e`.
  - Coverage must be ≥ 90% on `src/stats/**` and ≥ 70% overall.
- Line-up storage (codebase):
  - `LineUpName = 'Mixed' | 'Tough' | 'Soft' | 'Custom'` and `LINE_UPS` (`src/table/session.ts:90-94`). Custom means
    that some bot's style differs from the chosen preset (`:88-89`).
  - `HandRecord.lineUp: LineUpName` (`src/table/hand-record.ts:89`) is written from `config.lineUp` (`:241`).
  - `parseHandRecord` rejects a record without a valid `lineUp` (`:489`). `lineUp` has been in the hand record since
    the record was introduced in TASK-3.9 (`git log -S"lineUp: config.lineUp"` → `2219800 doit(TASK-3.9): build`). So
    no valid stored record lacks it. Invalid records are already skipped by `trendData` (`src/storage/hand-store.ts:148-153`).
  - The session record also carries `config.lineUp` (`src/table/session-record.ts:43`). It is not used here (A-1).
- `src/stats/trends.ts`:
  - `TrendHand` (`:18-28`) and `TrendSource` (`:38-52`).
  - `trendHand` (`:114-136`) adds `dealtIn` only when `seats` is present (`:125`). `lineUp` follows the same pattern.
    `tests/stats/trends.test.ts:91-103` pins `trendHand` of a minimal source with `toEqual` and no extra keys.
  - `TrendFilter`/`ALL_TRENDS`/`*_LABEL`/`*_OPTIONS` (`:136-158`). Grouping constants are at `:157-163`.
  - `filterTrendData` (`:176-198`) returns `data` itself for All/All, and that identity matters for
    `statisticsView`'s `all === data` shortcut (`trends.ts:408`). Otherwise it filters with AND and
    keeps input order.
  - `statisticsView(data, all = data, grouping)`: `g2Target` comes from `all` under every filter and grouping.
- `src/ui/stats/StatisticsScreen.tsx`:
  - `filter`/`onFilterChange` props (`:39-41`).
  - The filter row (`:166-213`): `<label>Text<select id=…>` for Table size, Game type and Group by. It renders only
    when `view` is truthy.
- The App wiring is as described in §2 "Not doing". Nothing changes there, and the `type Screen` union in `App.tsx`
  is not touched.
- The term "Line-up" is already the user-visible label of the Game Config line-up chooser
  (`src/ui/config/GameConfigScreen.tsx:217`) and its button "Randomise line-up" (`:209`).
- The storyboard (`dreams/limit-holdem-trainer/storyboards/Stats.dc.html:27-35`) shows Table size, Game type and
  Group by, with no line-up select.
- Test fixtures:
  - `tests/support/stat-records.ts`:
    - `statRecords` (`:82-100`) and `nineSessions`/`mixedGrades` (`:107-125`).
    - `cashPool(stake, hands, players, preset?)` seats by `configForLineUp` (`:146-157`).
    - `sitAndGoPool` (`:160-162`), `cloneRecords` (`:165-176`) and `withGrades` (`:52-63`).
  - e2e seeding uses `seedStoredSessions`/`seedStoredRecords` (`e2e/support/hand-records.ts:32,58`), as in
    `e2e/statistics-filters.spec.ts:38-50`.
  - The 62-Majors-in-1,000 pattern for a 3.1 target is in `e2e/statistics-target.spec.ts:18-30`.
- Existing code to reuse (path → what to reuse instead of writing new):
  - `src/stats/trends.ts` `filterTrendData`: extend it with the line-up predicate. Do not add a second filter
    function.
  - `src/table/session.ts` `LineUpName`, `LINE_UPS`: build the filter type and options from these.
  - `src/stats/trends.ts` `orderHands`, `majorErrorPoints`, `bb100Value`, `g2Target`, `totalsLine` are the
    recompute helpers in tests. `src/table/session-report.ts` `bbPer100` is for Major values recomputed from
    records.
  - `tests/support/stat-records.ts` fixtures (above), with `cashPool(..., preset)` for Mixed and Tough.
  - The `options(html, label)` regex of `tests/stats/trend-filters.acceptance.test.tsx:93-100`: copy it into the
    new test. That file is locked, so do not import from it.
- Locked tests that pin the filter row, selects, filter literals or view shape. These were grepped across every
  `locked_tests` entry of `doit/TASK-11.1..11.6/state.json`. All must pass unedited. **None needs to change, so no
  owner is affected.**
  - TASK-11.4:
    - `tests/stats/trend-filters.acceptance.test.tsx` uses `TrendFilter` literals without `lineUp` (A-3). It also
      pins `<label>Table size<select…>…</select></label>` and the Game type options by regex, so the new label must
      be a separate sibling `<label>`. It checks `not.toContain('<select')` for `view` undefined/null, so the
      Line-up select must also render only when `view` is truthy. It uses `ALL_TRENDS` only as a filter argument.
    - `e2e/statistics-filters.spec.ts:55-62` gets comboboxes by name and checks their option texts. There is no
      count of selects.
  - TASK-11.5:
    - `tests/stats/trend-grouping.acceptance.test.tsx:69-71,140,233,290,308` pins the Group by select by its own
      label and uses filter literals without `lineUp`.
    - `e2e/statistics-grouping.spec.ts:62-63` gets comboboxes by name.
  - TASK-11.6:
    - `e2e/report-navigation.spec.ts:29-31` gets comboboxes by name.
    - `tests/ui/report-navigation.acceptance.test.tsx` checks that filters reset on opening.
  - TASK-11.3: `tests/stats/g2-target.acceptance.test.tsx:269-290` already checks that G-2 is unchanged under
    record subsets split by `lineUp` (by filtering records by hand, not through `filterTrendData`). It stays valid.
  - TASK-11.1 and TASK-11.2: `tests/ui/statistics.acceptance.test.tsx`, `tests/stats/trend-view.acceptance.test.tsx`,
    `tests/stats/trends.acceptance.test.ts`, `tests/stats/bb100.acceptance.test.tsx` and the e2e files pin chart
    markup, texts and `TrendPoint` results. None of these depends on the filter row's composition.
  - Unlocked `tests/stats/trends.test.ts:91-103` pins `trendHand` with `toEqual`. Because `lineUp` is added only
    when the source has it, this test keeps passing.
  - Consequences:
    - `trendHand` of a source without `lineUp` returns no `lineUp` key.
    - `filterTrendData(data, {tableSize:'all', gameType:'all'})` and `filterTrendData(data, ALL_TRENDS)` both return
      `data` itself.
    - The new select is its own `<label>` and renders only when `view` is truthy.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The line-up is a third field of `TrendFilter` (`lineUp?: LineUpFilter`), applied inside `filterTrendData` with AND, per hand. | A separate `filterByLineUp` helper and App state. | The App, the reset-on-open path and TASK-11.8's future use of `TrendFilter` get it for free. No App change is needed. | no | n/a |
| D-2 | The select is labelled `Line-up` and has the id `stats-line-up`. It is placed after Game type and before Group by, with the options `All`, `Mixed`, `Tough`, `Soft`, `Custom` in that order. | Label "Opponents" or "Line-up filter". Place it last, after Group by. | The option labels are fixed by AC#1. The label reuses the Game Config term (`GameConfigScreen.tsx:217`). The position keeps the three filters together, ahead of the grouping. The label and position are user-visible. | yes | user (Q-1) |
| D-3 | `ALL_TRENDS = { tableSize: 'all', gameType: 'all', lineUp: 'all' }`. | Leave `ALL_TRENDS` without `lineUp`. | The default is explicit for the select's `value`. The All/All/All shortcut still returns `data`. | no | n/a |

## 5. Design

### Files to create / modify
- `src/stats/trends.ts` — `lineUp` on `TrendHand`/`TrendSource`/`TrendFilter`, `LineUpFilter`, `LINE_UP_LABEL`, `LINE_UP_OPTIONS`, `ALL_TRENDS`, `trendHand`, `filterTrendData`.
- `src/ui/stats/StatisticsScreen.tsx` — Line-up select.
- `dreams/limit-holdem-trainer/storyboards/Stats.dc.html` — Line-up select (All selected) after Game type.
- `docs/stats/trends.md` — "Filter: line-up (TASK-11.7)" section, plus the Tests list.
- `tests/stats/trend-lineup.acceptance.test.tsx` — new: AC#1–AC#5 at module and `renderToString` level (acceptance).
- `tests/stats/trends.test.ts` — unit cases for `trendHand` and `filterTrendData` line-up handling.
- `e2e/statistics-lineup.spec.ts` — new: App-wired flow in Chromium and WebKit, axe, network origin.

### Components, interfaces and data
In `src/stats/trends.ts`:
```ts
import type { GameType, LineUpName } from '../table/session';   // extends the existing type import
// TrendHand gains:   /** The hand record's line-up name; absent only in synthetic input (A-2). */ readonly lineUp?: LineUpName;
// TrendSource gains: readonly lineUp?: LineUpName;
export type LineUpFilter = 'all' | LineUpName;
// TrendFilter gains: /** Absent means All (A-3). */ readonly lineUp?: LineUpFilter;
export const ALL_TRENDS: TrendFilter = { tableSize: 'all', gameType: 'all', lineUp: 'all' };
export const LINE_UP_LABEL = 'Line-up';
export const LINE_UP_OPTIONS: readonly (readonly [LineUpFilter, string])[] = [
  ['all', 'All'], ['Mixed', 'Mixed'], ['Tough', 'Tough'], ['Soft', 'Soft'], ['Custom', 'Custom'],
];
```
- `trendHand`: `base` adds `...(record.lineUp && { lineUp: record.lineUp })` next to `dealtIn`.
- `filterTrendData(data, filter)`:
  - `const lineUp = filter.lineUp ?? 'all'`.
  - Short-circuit: return `data` when `tableSize`, `gameType` and `lineUp` are all `'all'`.
  - Otherwise keep each hand where `typeMatches && sizeMatches && (lineUp === 'all' || hand.lineUp === lineUp)`, in
    input order, with `sessionStarts` unchanged.
- `StatisticsScreen`: a `<label>{LINE_UP_LABEL}<select id="stats-line-up" value={filter.lineUp ?? 'all'}
  onChange={(e) => onFilterChange?.({ ...filter, lineUp: e.target.value as LineUpFilter })}>`, rendering
  `LINE_UP_OPTIONS`. It sits inside the existing `{view && <div className="stats-filters">…}` block, between Game
  type and Group by (D-2).

### Rules and algorithms
1. A hand matches line-up `L` iff `L === 'all'` or `hand.lineUp === L` (A-1, A-2). Table size and game type keep
   their TASK-11.4 rules, and all three combine with AND.
2. Everything downstream is unchanged: `statisticsView(filtered, all, grouping)` gives the totals (`hands`, distinct
   sessions), both charts, their messages and `g2Target` from `all`.
3. Example: the stored sessions are Tough (1,000 hands, first), Custom (300), Mixed (200) and Custom (250).
   - Line-up Custom gives `550 hands over 2 sessions`. The Major chart has one point (hands 1–500 of the Custom
     hands in session-start order).
   - Line-up Soft gives `0 hands over 0 sessions` and `Play your first hand to see trends.`
   - Under every line-up the G-2 target is computed from all 1,750 hands.

### Error handling and configuration
- No new errors. The select only offers typed values. A filter with an unknown `lineUp` string cannot be built
  from the UI. If it were, it would match no hands, which is harmless.
- No configuration and no persistence.

## 6. Behaviour specification

### SPEC-01: Line-up options and default
- Verifies: AC#1, DoD#1
- Behaviour: Given a loaded view rendered by `StatisticsScreen` without a `filter` prop, When the markup is read,
  Then:
  - It contains `<label>Line-up<select id="stats-line-up"`. Its options, read as `[value, label, selected]`, are
    exactly `[['all','All',true], ['Mixed','Mixed',false], ['Tough','Tough',false], ['Soft','Soft',false], ['Custom','Custom',false]]`.
  - The Line-up label appears after the Game type label and before the Group by label in the markup.
  - With `filter={{tableSize:'all', gameType:'all', lineUp:'Custom'}}`, only `Custom` is selected.
  - With `view` `undefined` or `null` there is no `Line-up` select.
  - `LINE_UP_OPTIONS.map(([, l]) => l)` equals `['All','Mixed','Tough','Soft','Custom']`, and `ALL_TRENDS.lineUp === 'all'`.
- Verification: acceptance `tests/stats/trend-lineup.acceptance.test.tsx::AC#1 lists All, Mixed, Tough, Soft and Custom with All selected`

### SPEC-02: Custom counts only Custom sessions
- Verifies: AC#2, DoD#1
- Behaviour: Given stored 6-player cash sessions, all built with `cloneRecords`:

  | Session id | Line-up | Hands | Pool |
  |---|---|---|---|
  | `'7'.repeat(32)` | Mixed | 300 | `cashPool(stake, 3, 6, 'Mixed')` |
  | `'2'.repeat(32)` | Tough | 400 | `cashPool(stake, 3, 6, 'Tough')` |
  | `'9'.repeat(32)` | Custom | 300 | the Mixed pool with `lineUp: 'Custom'` (A-5) |
  | `'4'.repeat(32)` | Custom | 250 | the Mixed pool with `lineUp: 'Custom'` (A-5) |

  - The sessions start an hour apart in that order, which differs from id order.
  - Grades vary via `withGrades` and a `mixedGrades`-style function.
  - The records are fed to `trendHand(parseHandRecord(r))` in reversed order.

  When the view is `statisticsView(filterTrendData(data, {...ALL_TRENDS, lineUp:'Custom'}), data)`, Then:
  - `view.hands === 550` and `view.sessions === 2`. The rendered totals read `550 hands over 2 sessions`.
  - `view.chart` is `points` with one point. Its `majorPer100` equals
    `bbPer100(unhinted Majors of the first 500 Custom records in session-start then handNumber order, 1, 500)`,
    recomputed from the `HandRecord.decisions`.
  - `view.bb100` is `points` with one point equal to `bb100Value` of those 500 records' trend hands.
  - The Major point differs from the All-line-ups view's first point.
- Verification: acceptance `tests/stats/trend-lineup.acceptance.test.tsx::AC#2 Custom counts only the Custom sessions in charts and totals`

### SPEC-03: Line-up and table size together
- Verifies: AC#3, DoD#1
- Behaviour: Given stored sessions (start order ≠ id order, input reversed, grades varied):

  | Line-up | Table | Game type | Hands | Pool |
  |---|---|---|---|---|
  | Mixed | 6-max | cash | 600 | `cashPool(stake, 3, 6, 'Mixed')` |
  | Mixed | heads-up | cash | 300 | `cashPool(stake, 3, 2, 'Mixed')` |
  | Tough | 6-max | cash | 400 | `cashPool(stake, 3, 6, 'Tough')` |
  | Mixed | 6-max | sit-and-go | 500 | `sitAndGoPool(3, 6)` with `lineUp: 'Mixed'` |

  When the filter is `{tableSize:'6-max', gameType:'all', lineUp:'Mixed'}`, Then:
  - `view.hands === 1100` and `view.sessions === 2`.
  - The Major chart has 2 points. Each `majorPer100` equals the value recomputed with `bbPer100(majors, 1, 500)`
    over the matching records (Mixed and `seats.length` 3–7) in session-start then handNumber order.
  - The BB/100 chart has 1 point, equal to `bb100Value` of the 500 first matching cash hands.
  - These points differ from those of `{tableSize:'all', gameType:'all', lineUp:'Mixed'}` (1,400 hands) and from
    those of `{tableSize:'6-max', gameType:'all', lineUp:'all'}`. This shows that both filters apply.
  - The same equality holds under the `session` grouping, with one point per matching session.
- Verification: acceptance `tests/stats/trend-lineup.acceptance.test.tsx::AC#3 Mixed and 6-max together recompute from hands that are both`

### SPEC-04: No Soft sessions
- Verifies: AC#4, DoD#1
- Behaviour: Given the SPEC-02 data (no Soft hands), When the filter is `{...ALL_TRENDS, lineUp:'Soft'}`, Then:
  - `view.chart` is `{kind:'no-hands'}`, `view.bb100` is `{kind:'no-cash'}`, and
    `view.totals === '0 hands over 0 sessions'`.
  - The rendered markup contains `Play your first hand to see trends.` and the totals `0 hands over 0 sessions`.
    The filter row is still shown, with Line-up `Soft` selected.
  - The same holds under the `session` and `day` groupings.
- Verification: acceptance `tests/stats/trend-lineup.acceptance.test.tsx::AC#4 Soft with no Soft sessions shows the first-hand message and 0 totals`

### SPEC-05: G-2 target from all hands under any line-up filter
- Verifies: AC#5, DoD#1
- Behaviour: Given `statRecords` data whose `lineUp` is overridden per session:

  | Line-up | Hands | Start | Grades |
  |---|---|---|---|
  | Tough | 1,000 | earliest | exactly 62 unhinted Majors |
  | Custom | 1,000 | later | 150 unhinted Majors |
  | Mixed | 200 | — | — |

  The records are fed shuffled (deterministic, non-chronological). When the view is
  `statisticsView(filterTrendData(data, {...ALL_TRENDS, lineUp: L}), data)` for each `L` in `LINE_UP_OPTIONS`,
  Then:
  - `view.g2Target === 3.1` for every `L`, which equals `g2Target(orderHands(data))`.
  - For `L = 'Custom'`, `statisticsView(filterTrendData(data, …Custom))` (without `all`) gives `g2Target === 7.5`.
    This shows the filtered set would give a different target.
  - The Custom view's rendered Major `<svg>` aria-label ends with `Dashed target line at 3.1`, and the G-2 caption
    is present.
  - The same holds with `grouping = 'session'`.
- Verification: acceptance `tests/stats/trend-lineup.acceptance.test.tsx::AC#5 the G-2 target comes from all stored hands under every line-up filter`

### SPEC-06: trendHand and filterTrendData line-up rules
- Verifies: AC#2, AC#3
- Behaviour: Given the module functions, When called directly, Then:
  - `trendHand` of a source with `lineUp: 'Tough'` has `lineUp === 'Tough'`. `trendHand` of a source without
    `lineUp` has no `lineUp` key (`'lineUp' in h === false`).
  - `filterTrendData(data, ALL_TRENDS)` and `filterTrendData(data, {tableSize:'all', gameType:'all'})` both return
    `data` itself (`toBe`).
  - `{tableSize:'all', gameType:'all', lineUp:'Tough'}` keeps only the Tough hands, in input order. A hand with no
    `lineUp` is dropped by every named line-up and kept by All.
  - `sessionStarts` is the same Map.
  - Combined with `gameType:'cash'`, hands that are Tough but sit-and-go are dropped.
- Verification: unit `tests/stats/trends.test.ts::line-up filter keeps matching hands and carries lineUp from records`

### SPEC-07: App wiring end to end
- Verifies: AC#1, AC#2, AC#4, AC#5, DoD#7, DoD#8
- Behaviour: Setup:
  - The data is seeded with `seedStoredSessions` and `seedStoredRecords` from `statRecords`, with `lineUp`
    overridden per session, and then the page reloads.
  - The seed has 1,500 hands:
    - Tough, 1,000 hands, earliest start, 62 unhinted Majors (target 3.1).
    - Custom, 300 hands.
    - Mixed, 200 hands.

  When Statistics opens from Home, Then:
  - The combobox "Line-up" lists `All`, `Mixed`, `Tough`, `Soft`, `Custom`, with `All` selected. The totals read
    `1,500 hands over 3 sessions`, and axe reports no serious or critical violations.
  - Select Line-up `Custom`:
    - The totals read `300 hands over 1 session`.
    - The Major card shows `Play 200 more hands to see your first trend point.`
    - Table size and Game type still show `All`.
  - Select Group by `Session`:
    - The Major card has 1 point, and the G-2 caption is visible.
    - The Major svg aria-label ends with `Dashed target line at 3.1`.
    - Line-up still shows `Custom`.
  - Select Line-up `Soft`:
    - The Major card shows `Play your first hand to see trends.`
    - The totals read `0 hands over 0 sessions`.
    - axe still passes.
  - Go `← Home`, then Statistics: Line-up shows `All` again and the totals read `1,500 hands over 3 sessions`.
  - Every request's origin is the app's own origin.
- Verification: acceptance `e2e/statistics-lineup.spec.ts::Statistics filters the trends by line-up`

### SPEC-08: Checks, coverage and boundaries
- Verifies: DoD#2, DoD#4, DoD#5, DoD#10
- Behaviour: Given the finished change, When the project checks run, Then:
  - `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors.
  - `src/stats/**` stays ≥ 90% and overall stays ≥ 70%.
  - `src/stats/trends.ts` imports only the type `LineUpName` from `src/table/session` (no UI or browser module).
  - Every locked test of TASK-11.1..11.6 passes unedited.
  - CI is green on `doit/TASK-11.7`.
  - The new Vitest file adds < 2 s to `npm test`. It uses record clones from 3-hand pools, not played sessions.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-09: Documentation
- Verifies: DoD#11
- Behaviour: Given the story is done, When the docs are read, Then `docs/stats/trends.md` has a line-up section that
  covers:
  - the options and the default.
  - the per-hand match on the stored `lineUp` (A-1), with Custom as one bucket.
  - the AND with the other filters, and that the filter works under every grouping.
  - G-2 from all hands, and the reset on every opening.

  The story doc is published to Backlog.
- Verification: manual `docs/stats/trends.md` line-up section and the TASK-11.7 entry in `backlog doc list --plain`

### SPEC-10: Not-applicable DoD items
- Verifies: DoD#3, DoD#6, DoD#9, DoD#12
- Behaviour: These DoD items do not apply to this story:
  - There is no engine, bots or advice change, so the golden-spot suite (run by `npm test`) and the 10,000-hand
    playtest are unaffected.
  - There is no strategy content.
  - No service worker exists yet (E13-S07; no `serviceWorker` in `src/`).
- Verification: command `npm test` (golden-spot suite included); `git diff --stat main -- src/engine src/bots src/advice` is empty

## 7. Edge cases
- Zero hands in the line-up → SPEC-04 (all groupings). Fewer than 500 hands in the line-up → SPEC-07 (`Play 200 more hands…`).
- A line-up combined with another filter → SPEC-03. Combined with a grouping → SPEC-03, SPEC-05, SPEC-07.
- Records without `lineUp`: not possible from storage, because `parseHandRecord` rejects them and they are skipped
  (§3). A synthetic `TrendHand` without it → SPEC-06 (A-2).
- Filter literals without `lineUp` (locked tests, older callers) → SPEC-06 (identity and treated as All).
- Non-chronological input → SPEC-02, SPEC-03, SPEC-05 feed reversed or shuffled records.
- Reset on reopen → SPEC-07.
- Concurrency and interruption: N/A. The filter is a pure recompute over data already in memory.

## 8. Security considerations
- Trust boundary: stored IndexedDB records are already validated by `parseHandRecord`, including `lineUp` against
  `LINE_UPS`. The select value is typed and comes only from `LINE_UP_OPTIONS`.
- No authn, secrets, injection, logging, new dependencies, randomness or network use. SPEC-07 checks the network
  origin.

## 9. Non-functional
- Filtering stays linear in hands (one extra comparison per hand). No new pass over the data.
- Test speed: the new Vitest file runs in < 2 s, because records are cloned from 3-hand pools. The e2e seeds 1,500
  records (similar to `e2e/statistics-target.spec.ts`) and needs no slow-test opt-in.
- Accessibility: the select is a labelled `<label>` with the existing 44 px `.stats-filters` styling. axe runs in
  SPEC-07.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev` → Home → Statistics → choose "Line-up" Custom, then Soft, combine with Table size and Group by → "← Home" → Statistics (Line-up is back to All)
- New tests:
  - `tests/stats/trend-lineup.acceptance.test.tsx` → SPEC-01..SPEC-05
  - `tests/stats/trends.test.ts` (added cases) → SPEC-06
  - `e2e/statistics-lineup.spec.ts` → SPEC-07
- Judge's end-to-end scenario:
  1. Run `npx playwright test e2e/statistics-lineup.spec.ts e2e/statistics-filters.spec.ts e2e/statistics-grouping.spec.ts e2e/statistics-target.spec.ts e2e/report-navigation.spec.ts`.
     All pass in Chromium and WebKit.
  2. `npm run dev`:
     - Play a few hands with the Tough preset and leave.
     - Start a game with one bot's style edited (Custom), play a few hands and leave.
     - Open Statistics. Line-up shows All, and the totals count both sessions.
     - Choose Custom: the totals count only the Custom session.
     - Choose Soft: `Play your first hand to see trends.` and `0 hands over 0 sessions`.
     - Home and back: Line-up is All.

## 11. Open questions
- None. Q-1 was answered (recommended option: "Line-up" between Game type and Group by, storyboard addition kept); see `doit/TASK-11.7/qa.md`.

## 12. Clarifications log
See `doit/TASK-11.7/qa.md`.
