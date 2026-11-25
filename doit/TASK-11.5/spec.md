# Spec: TASK-11.5 — Group my trends per session or per day

Status: READY (approved 2026-11-25)
Task: TASK-11.5 · Parent/epic: TASK-11 · Requirements: REQ-048 (048.1, 048.2, 048.3, 048.10, 048.12, 048.13), REQ-052.7 · Dream: limit-holdem-trainer

## 1. Summary
The Statistics screen gains a third select, "Group by". It offers Every 500 hands (the default, today's behaviour),
Session and Day. Session and Day re-group both trend charts (Major errors per 100 hands and BB/100). They plot one
point per session or local calendar day that has hands, from the first hand on, with no minimum group size. The
values use the existing formulas: `bbPer100(majors, 1, n)` and TASK-11.2's `bb100Value`. Changing the grouping
keeps the table size and game type filters, and changing a filter keeps the grouping. The Stats storyboard's
"Every 100 hands" default is corrected to REQ-048.1's per-500 default.

## 2. Scope
- In scope:
  - `src/stats/trends.ts`: the `TrendGrouping` type, option list and label; per-session and per-day grouping of the
    ordered hands; the optional `group` on points; `statisticsView(data, all, grouping)`; texts (point titles,
    chart aria-labels, notes) for each grouping.
  - `src/ui/stats/StatisticsScreen.tsx`: the "Group by" select in the filter row; grouping-dependent notes and labels.
  - `src/ui/App.tsx`: the stats state carries `grouping`. It is reset to `hands` on every opening and passed on every
    recompute.
  - The storyboard `dreams/limit-holdem-trainer/storyboards/Stats.dc.html`: the Group by options become Every 500
    hands (selected), Session, Day (AC#7).
  - `docs/stats/trends.md`: a grouping section.
  - Tests: a new acceptance file, unit cases in `tests/stats/trends.test.ts`, and a new Playwright spec.
- Not doing:
  - No persistence of the grouping (or filters) across visits. It resets to Every 500 hands on every opening, like
    the filters (TASK-11.4 D-5).
  - No sit-and-go finishing-position chart (TASK-11.9) and no line-up filter (REQ-048.8).
  - No performance work for 100,000 hands (TASK-11.12). The grouping must stay linear in hands plus a sort of groups.
  - No change to the stored hand or session record format. In particular, no stored time-zone offset.
  - No change to the per-500 behaviour, texts, point shape or messages (REQ-048.7, 048.11 stay as they are).
  - No change to the G-2 target rule (REQ-048.3/048.9). It stays computed from all stored hands under every
    grouping.
  - No edit to `dreams/limit-holdem-trainer/storyboards/canvas.json` (its q7 note is a historical open question).
  - No locked test is edited (see §3 "Locked tests").
- Scope budget: files=8, lines=760

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | "Local calendar day" is the date of `completedAt` in the time zone of the device viewing Statistics, read through `Date#getFullYear/getMonth/getDate`. DST needs no special case because a day is a calendar date, not 24 h. | yes | Records store `completedAt` as UTC ISO only (`src/table/hand-record.ts:235`, validated at `:469-475`), so the zone at play time is not known. The story says "local calendar day". | Store the offset with each hand (a persisted-format change, out of scope); use UTC days (not "local"). |
| A-2 | A session's per-session point is placed and numbered by the same session start as `orderHands`: its record's `startedAt`, else its earliest `completedAt` (`src/stats/trends.ts:181-201`). The label's date is that start's local day. | yes | Reuses the existing ordering. The story says "in session start order". | Order by first stored hand only. |
| A-3 | Within a day, hands keep `orderHands` order. Days ascend by date. A point's `firstHand`/`lastHand` are 1-based positions in that grouping's concatenated sequence (all hands for the Major chart, cash hands for BB/100), so they stay unique React keys. | yes | Keeps the existing point shape and the `key={point.firstHand}` rendering (`StatisticsScreen.tsx:77,115`). | Add a separate key field. |
| A-4 | Session numbers in labels count the sessions plotted on the Major chart under the current filter (1…k in start order). The same session carries the same number on the BB/100 chart. | yes | Numbers match the points the user sees. A global numbering would show gaps under a filter. | Global numbering over all stored sessions. |
| A-5 | Under Session or Day grouping the G-2 caption and dashed line still show whenever the Major chart has points and `g2Target` is non-null. | yes | REQ-048.3 ties the line to 1,000 stored hands, not to the grouping. The screen already does this (`StatisticsScreen.tsx:196-198`). | Hide the target under non-default groupings. |
| A-6 | A BB/100 group (session or day) with no cash hands forms no BB/100 point. A session is all cash or all sit-and-go, so the per-session BB/100 chart plots exactly the cash sessions. | yes | `bb100Value` throws on non-cash or empty input (`trends.ts:224-233`). REQ-048.4 is cash only. | — |

## 3. Current system
- Toolchain: TypeScript strict + React 19 + Vite. Vitest (`environment: 'node'`, `vite.config.ts:6-9`), tests in
  `tests/**`. Playwright (Chromium + WebKit, `playwright.config.ts:13-15`) in `e2e/**`, with axe via
  `e2e/support/axe`. Commands are in `package.json` (`test`, `lint`, `typecheck`, `format`, `e2e`). Coverage
  thresholds: 70% overall, 90% on `src/{engine,bots,advice,stats,playtest,table}/**` (`vite.config.ts:16-19`).
- `src/stats/trends.ts`:
  - `TrendHand`/`TrendData`, with `sessionStarts: Map<sessionId, startedAt ISO>` (`:17-58`).
  - `TrendPoint {firstHand,lastHand,majorPer100}` (`:64-69`), `Bb100Point` (`:76-81`).
  - The chart unions `no-hands | more-hands | points` (`:71-74`) and `no-cash | more-cash | points` (`:83-86`).
  - `filterTrendData` (`:158-179`) keeps input order. `orderHands` sorts by session start, then sessionId, then hand
    number (`:181-201`).
  - `majorErrorPoints` uses `bbPer100(majors, 1, GROUP_SIZE)` (`:204-218`). `bb100Value` (`:224-233`).
    `bb100Points` (`:236-247`). `g2Target` (`:251-256`).
  - `statisticsView(data, all = data)` (`:260-283`).
  - Texts: `CHART_NOTE` (`:100`), `BB100_NOTE` (`:105-106`), `pointLabel` (`:300-302`), `chartLabel` (`:305-309`),
    `bb100PointLabel` (`:315-317`), `bb100ChartLabel` (`:319-322`). `countText` (`:286-288`).
- `src/ui/stats/StatisticsScreen.tsx`:
  - Props `view`, `onHome`, optional `filter`/`onFilterChange` (`:31-38`).
  - The filter row renders two `<label>Text<select id=…>` only when `view` is truthy (`:149-184`).
  - The charts take `CHART_NOTE` and `BB100_NOTE` directly (`:82,126`), and `key={point.firstHand}` (`:77,115`).
- `src/ui/App.tsx`:
  - The stats screen state is `{view, data?, filter}` (`:35-39`).
  - Load: `statisticsView(data)` with `ALL_TRENDS` (`:96-116`).
  - Open from Home sets `filter: ALL_TRENDS` (`:259-262`).
  - Filter change: `statisticsView(filterTrendData(data, filter), data)` (`:305-320`).
- Session Report: `bbPer100(result, bigBet, hands)` (`src/table/session-report.ts:148-152`). The cash result is
  `finalStack − buyIn × (1 + rebuys)` (`:165-177`). Error rates per 100 use `bbPer100(count, 1, handsPlayed)` (`:350`).
- Stored `completedAt` is `Date#toISOString()` (UTC, `src/table/hand-record.ts:235`), validated at `:469-475`.
- Test fixtures (`tests/support/stat-records.ts`):
  - `statRecords` gives `completedAt = startedAt + n s` (`:48-49`, `:82-101`). `nineSessions` (`:107-117`).
    `mixedGrades` (`:120-125`).
  - `cashPool`/`sitAndGoPool` (`:146-162`) and `cloneRecords` (`:165-176`).
  - e2e seeding: `seedStoredRecords`/`seedStoredSessions` (`e2e/support/hand-records`), as used in
    `e2e/statistics-filters.spec.ts:38-50`.
- The TASK-11.2 per-session equality pattern is `playSession` + `handWrite` + `sessionReport` compared with
  `bb100Value` (`tests/stats/bb100.acceptance.test.tsx:209-231`).
- Existing code to reuse (path → what to reuse instead of writing new):
  - `src/stats/trends.ts` `orderHands` → the base order for both groupings. Factor its session-start map into a
    module-private helper that the session grouping also uses for the start day. Do not duplicate it.
  - `src/table/session-report.ts` `bbPer100` → the Major value of every group: `bbPer100(majors, 1, n)`.
  - `src/stats/trends.ts` `bb100Value` → every BB/100 group value (AC#8).
  - `countText`, `signedTenths` → the value text in titles.
  - `filterTrendData` → unchanged. Grouping applies after filtering.
  - `tests/support/stat-records.ts` `statRecords`/`nineSessions`/`mixedGrades`/`cashPool`/`sitAndGoPool`/`cloneRecords`,
    `tests/support/session-play.ts` `playSession` → fixtures.
  - The `options(html, label)` regex pattern of `tests/stats/trend-filters.acceptance.test.tsx:93-100` → copy it into
    the new test. It is locked, so do not import from it.
- Locked tests that pin Statistics markup, point titles, aria-labels or view shape. These were grepped. All must
  pass unedited, and none needs to change:
  - TASK-11.1:
    - `tests/ui/statistics.acceptance.test.tsx:62-66` pins `data-point` circles and the exact
      `<p class="stats-note">Each point is 500 hands. Lower is better.</p>`.
    - `tests/stats/trend-view.acceptance.test.tsx:48-56` pins per-500 `<title>` texts `Hands 1–500: x`.
    - `tests/stats/trends.acceptance.test.ts`, `tests/storage/trend-data-3000.acceptance.test.ts` pin `TrendPoint`
      results.
    - `e2e/statistics.spec.ts`, `e2e/play-money.spec.ts`, `tests/ui/home-statistics.acceptance.test.tsx`,
      `tests/ui/screen-list.acceptance.test.ts`.
  - TASK-11.2:
    - `tests/stats/bb100.acceptance.test.tsx` pins `bb100Value` and per-500 BB/100 titles.
    - `e2e/statistics-bb100.spec.ts:74` pins `BB100_NOTE`.
  - TASK-11.3: `tests/stats/g2-target.acceptance.test.tsx:150,170` pins `view.chart` `toEqual({kind:'points',points:[{firstHand,lastHand,majorPer100}…]})`
    and the aria-label `Major errors per 100 hands, one point per 500 hands: 6.2, 6.2. Dashed target line at 3.1`.
    `e2e/statistics-target.spec.ts` is also locked.
  - TASK-11.4:
    - `tests/stats/trend-filters.acceptance.test.tsx:107-132` pins the two filter selects' options via
      `<label>Table size<select…>`, and `not.toContain('<select')` for `view` undefined/null.
    - `:173,217,235,241,300` pin `view.chart`/`view.bb100` with `toEqual`.
    - `e2e/statistics-filters.spec.ts` locates comboboxes by name.
  - Consequences:
    - Under the default grouping, points must have exactly the existing keys (no `group` key at all).
    - `statisticsView(data)` and `statisticsView(data, all)` must return exactly what they return today.
    - `CHART_NOTE`, `BB100_NOTE`, `pointLabel(p)`, `chartLabel(points, target)`, `bb100PointLabel(p)` and
      `bb100ChartLabel(points)` keep their current output when called without a grouping.
    - The Group by select renders only when `view` is truthy.
    - No test owner needs to change.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | `statisticsView(data, all = data, grouping: TrendGrouping = 'hands')`. `StatisticsView` keeps its shape. Session and Day points carry an optional `group`. Per-500 points carry no `group` key. | New view type per grouping. Put grouping in the view. | Every locked `toEqual`/markup pin stays valid (§3). | no | n/a |
| D-2 | The grouping lives in App's stats state next to `filter`, and is passed to `StatisticsScreen` as optional `grouping`/`onGroupingChange` props, mirroring TASK-11.4's `filter`/`onFilterChange`. | Grouping inside `StatisticsView`. | The same pattern as the filters, and the view shape stays fixed. | no | n/a |
| D-3 | Session and Day groupings never produce `more-hands`. With 0 hands in the filter the Major chart is `no-hands`, otherwise `points` (REQ-048.10). | — | Fixed by REQ-048.10 and AC#5/AC#6. | no | n/a |
| D-4 | Session and Day BB/100: 0 cash hands in the filter → `no-cash` (REQ-048.12). Otherwise `points`, one per group with ≥ 1 cash hand, with no "Play n more cash hands" message. REQ-048.13's "Play <n> more cash hands…" message applies to per-500 only. | Keep the 500-cash-hand minimum message under every grouping. | User-visible, and a contradiction between requirement clauses. | yes | user (Q-1) |
| D-5 | User-visible texts as in §5 "Texts": option labels and order, point titles, chart aria-labels, notes and date format. Labels in REQ order; dates `D Mon YYYY` in fixed English, locale-independent; session numbers within the current filter (A-4). | Storyboard order (Session first). "Per 500 hands / Per session / Per day" wording. Locale-formatted dates. | User-visible text. | yes | user (Q-2) |
| D-6 | The day key is computed in `src/stats/trends.ts` with plain `Date` local getters (no `Intl`, no browser API), so `src/stats/**` stays headless (DoD#5). | `Intl.DateTimeFormat` with an explicit zone. | It is the simplest option and is deterministic given the process/browser zone. Tests build times from local-time constructors (Vitest) or a fixed `timezoneId` (Playwright). | no | n/a |

## 5. Design

### Files to create / modify
- `src/stats/trends.ts` — grouping type/options/label, `localDay`, `dayText`, grouping functions, `statisticsView` 3rd param, grouping-aware texts.
- `src/ui/stats/StatisticsScreen.tsx` — "Group by" select; `grouping`/`onGroupingChange` props; notes/labels by grouping.
- `src/ui/App.tsx` — `grouping` in stats state; reset on open/load; passed on filter and grouping changes.
- `dreams/limit-holdem-trainer/storyboards/Stats.dc.html` — Group by options: Every 500 hands (selected), Session, Day.
- `docs/stats/trends.md` — grouping section (rules, texts, A-1 time zone, Q-1 outcome).
- `tests/stats/trend-grouping.acceptance.test.tsx` — new: AC#1–AC#8 at module and renderToString level (acceptance).
- `tests/stats/trends.test.ts` — unit cases for the new helpers and texts.
- `e2e/statistics-grouping.spec.ts` — new: App-wired flow in Chromium and WebKit, axe, network origin.

### Components, interfaces and data
In `src/stats/trends.ts` (all exported unless noted):
```ts
export type TrendGrouping = 'hands' | 'session' | 'day';
export const DEFAULT_GROUPING: TrendGrouping = 'hands';
export const GROUPING_LABEL = 'Group by';
export const GROUPING_OPTIONS: readonly (readonly [TrendGrouping, string])[] = [
  ['hands', 'Every 500 hands'], ['session', 'Session'], ['day', 'Day'],
];
/** Present only on Session/Day points. day: 'YYYY-MM-DD' local (A-1); for a session, its start's local day (A-2). */
export type TrendGroup =
  | { readonly kind: 'session'; readonly number: number; readonly day: string }
  | { readonly kind: 'day'; readonly day: string };
// TrendPoint and Bb100Point each gain: readonly group?: TrendGroup;
export function localDay(at: string | number): string;           // ISO string or epoch ms → 'YYYY-MM-DD' in local time
export function dayText(day: string): string;                    // '2026-11-10' → '10 Nov 2026'
export function statisticsView(data: TrendData, all?: TrendData, grouping?: TrendGrouping): StatisticsView;
export function pointLabel(point: TrendPoint): string;           // unchanged signature; uses point.group
export function bb100PointLabel(point: Bb100Point): string;      // unchanged signature; uses point.group
export function chartLabel(points: readonly TrendPoint[], target?: number | null, grouping?: TrendGrouping): string;
export function bb100ChartLabel(points: readonly Bb100Point[], grouping?: TrendGrouping): string;
export function chartNote(grouping: TrendGrouping): string;      // 'hands' → CHART_NOTE
export function bb100Note(grouping: TrendGrouping): string;      // 'hands' → BB100_NOTE
```
- Module-private helpers:
  - `sessionStartTimes(data): (sessionId) => number` is factored out of `orderHands`. Its behaviour is unchanged.
  - `groupHands(ordered, grouping, start)` returns `{ group, hands }[]` in plotted order.
- Session and Day point builders (export them if handy for unit tests):
  - Major: one `TrendPoint` per group, with `majorPer100 = bbPer100(Σ unhintedMajors, 1, hands.length)`.
  - BB/100: one `Bb100Point` per group that has ≥ 1 cash hand, with `bb100 = bb100Value(group's cash hands)`.
- `StatisticsScreenProps` gains `readonly grouping?: TrendGrouping` (default `'hands'`) and
  `readonly onGroupingChange?: (grouping: TrendGrouping) => void`.
- App stats state gains `readonly grouping: TrendGrouping`:
  - Every `setScreen({name:'stats', …})` on opening and on load sets `grouping: DEFAULT_GROUPING`.
  - Filter change: `view: statisticsView(filterTrendData(data, filter), data, screen.grouping)`.
  - Grouping change: `{...screen, grouping, view: statisticsView(filterTrendData(data, screen.filter), data, grouping)}`.
    It is ignored while `data` is undefined.

### Rules and algorithms
1. `ordered = orderHands(data)`. `data` is the filtered data, in any input order.
2. Grouping `hands`: exactly today's code path (`majorErrorPoints`/`bb100Points`, `more-hands`/`more-cash`). The
   result is identical to the current `statisticsView`.
3. Grouping `session`:
   - Split `ordered` into runs of equal `sessionId`. They are contiguous because `orderHands` sorts by start, then
     id.
   - Number the runs 1…k. `day = localDay(session start ms)`, where the start is the record's `startedAt`, else the
     earliest `completedAt` (A-2).
4. Grouping `day`:
   - Bucket `ordered` by `localDay(hand.completedAt)`, keeping `ordered` order within each bucket. Emit the buckets
     in ascending day-key order.
   - Example: a session starts 23:58 local on 10 Nov, and its hand n completes at start + n s. Hands 1–119 go to
     10 Nov, and hands 120 onwards (00:00:00 and later) go to 11 Nov.
5. Major points:
   - Walk the groups, keeping a running position `pos` (starting at 0).
   - Each group gives `firstHand = pos + 1`, `lastHand = pos + n`, `majorPer100 = bbPer100(majors, 1, n)`, and its
     `group`.
   - Example: a session of 12 hands with 1 unhinted Major gives `majorPer100 = 8.3` (8.33… rounded half away from
     zero).
6. BB/100 points:
   - Within each group, take the cash hands (`cash !== undefined`) and skip groups that have none.
   - A running position over cash hands gives `firstHand`/`lastHand`. The value is `bb100 = bb100Value(cashHands)`.
   - `group` is the same object value as that group's Major point (so session numbers match, A-4).
7. Chart kinds for `session`/`day`:
   - `chart`: `no-hands` if `data.hands.length === 0`, else `points`.
   - `bb100`: `no-cash` if there are no cash hands, else `points` (D-4, approved by Q-1).
8. `g2Target` is unchanged: computed from `all` (`trends.ts:278-281`) under every grouping (A-5).
9. `localDay`: `const d = new Date(at)`, then `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`.
   `dayText` uses a fixed `['Jan',…,'Dec']` array and the day without padding: `'2026-11-05' → '5 Nov 2026'`.

### Texts (approved by Q-2)
| Item | hands (unchanged) | session | day |
|---|---|---|---|
| Option label | `Every 500 hands` | `Session` | `Day` |
| Major point `<title>` | `Hands 1–500: 6.2` | `Session 3, 10 Nov 2026: 4.2` | `10 Nov 2026: 4.2` |
| BB/100 point `<title>` | `Cash hands 1–500: +1.5` | `Session 3, 10 Nov 2026: +1.5` | `10 Nov 2026: −0.8` (signedTenths) |
| Major aria-label | `Major errors per 100 hands, one point per 500 hands: …` | `…, one point per session: …` | `…, one point per day: …` |
| BB/100 aria-label | `Big bets won per 100 hands, one point per 500 cash hands: …` | `…, one point per session: …` | `…, one point per day: …` |
| Major note | `Each point is 500 hands. Lower is better.` | `Each point is one session. Lower is better.` | `Each point is one day. Lower is better.` |
| BB/100 note | `Each point is 500 cash hands. Above the dashed line means you are winning.` | `Each point is one session's cash hands. Above the dashed line means you are winning.` | `Each point is one day's cash hands. Above the dashed line means you are winning.` |

- The G-2 suffix `. Dashed target line at T` is appended in every grouping, as today.
- The select is `<label>Group by<select id="stats-group-by" …>`, placed after Game type in `.stats-filters`, with
  option values `hands`, `session`, `day`.

### Error handling and configuration
- No new errors. `bb100Value` is only called on non-empty all-cash groups, so its `RangeError` cannot fire.
- An unknown `grouping` value cannot reach `statisticsView`, because the select only offers the three typed values.
- No configuration and no persistence.

## 6. Behaviour specification

### SPEC-01: Group by options and default
- Verifies: AC#1, DoD#1
- Behaviour: Given a loaded view rendered by `StatisticsScreen` without a `grouping` prop, When the markup is read,
  Then:
  - It contains `<label>Group by<select id="stats-group-by" …>` whose options are exactly
    `[['hands','Every 500 hands',selected], ['session','Session',not], ['day','Day',not]]`.
  - With `grouping="day"`, only `Day` is selected.
  - With `view` `undefined` or `null`, there is no Group by select.
  - `GROUPING_OPTIONS` and `DEFAULT_GROUPING === 'hands'` match.
- Verification: acceptance `tests/stats/trend-grouping.acceptance.test.tsx::AC#1 lists Every 500 hands, Session and Day with Every 500 hands selected`

### SPEC-02: Per-session Major points over 3,000 hands in 9 sessions
- Verifies: AC#2, DoD#1
- Behaviour: Given `statRecords(nineSessions(3000), mixedGrades)` (unequal sizes, start order ≠ id order), with the
  records fed to `statisticsView` in reversed (non-chronological) order via `trendHand`, When the grouping is
  `session`, Then:
  - `view.chart.kind === 'points'` with 9 points.
  - Point i (sessions sorted by `startedAt`) has `majorPer100 === bbPer100(unhinted Majors of session i's records, 1, its hand count)`.
    This is recomputed by the test from the `HandRecord.decisions`.
  - Point i has `group.number === i+1`.
  - The rendered Major `<title>`s equal `Session ${i+1}, ${start.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}: ${value.toFixed(1)}`.
  - At least two values differ.
- Verification: acceptance `tests/stats/trend-grouping.acceptance.test.tsx::AC#2 per session plots 9 points recomputed from each session's records`

### SPEC-03: Per-day points with a session past midnight
- Verifies: AC#3, DoD#1
- Behaviour: Given four sessions whose `startedAt` are built with local-time constructors:
  - `new Date(2026,10,10,23,58,0)` with 300 hands (1 s apart, so it crosses local midnight at hand 120).
  - `new Date(2026,10,11,14,0)` with 100 hands.
  - `new Date(2026,10,12,9,0)` with 50 hands.
  - `new Date(2026,10,14,20,0)` with 40 hands.
  - Grades come from `mixedGrades`, and the records are shuffled deterministically before `trendHand`.

  When the grouping is `day`, Then:
  - The Major chart has 4 points with days `2026-11-10`, `2026-11-11`, `2026-11-12`, `2026-11-14`.
  - Their hand counts (`lastHand − firstHand + 1`) are 119, 281, 50 and 40.
  - Each `majorPer100` equals `bbPer100(unhinted Majors of the records whose local completion date is that day, 1, n)`.
  - The test partitions by `new Date(r.completedAt).toLocaleDateString('en-CA')`.
  - The Major `<title>`s start with `10 Nov 2026: `, `11 Nov 2026: `, `12 Nov 2026: `, `14 Nov 2026: `.
- Verification: acceptance `tests/stats/trend-grouping.acceptance.test.tsx::AC#3 per day plots 4 points and counts each hand on its completion date`

### SPEC-04: Grouping keeps the filter (module and screen)
- Verifies: AC#4, DoD#1
- Behaviour: Given data with 6-player cash sessions and a heads-up sit-and-go session on overlapping days, When the
  view is `statisticsView(filterTrendData(data,{tableSize:'6-max',gameType:'all'}), data, 'day')`, Then:
  - The Major points equal per-day values recomputed from the 6-max hands only, and differ from the unfiltered
    per-day points.
  - The markup rendered with `filter={6-max}` and `grouping="day"` shows Table size `6-max` selected and Group by
    `Day` selected.
- Verification: acceptance `tests/stats/trend-grouping.acceptance.test.tsx::AC#4 per day under 6-max uses only 6-max hands and keeps the filter`

### SPEC-05: One small session plots one point
- Verifies: AC#5, DoD#1
- Behaviour: Given 1 stored session of 12 hands, all on one local day (start `new Date(2026,10,10,12,0)`), with one
  unhinted Major, When the grouping is `session` and then `day`, Then:
  - Each time, `view.chart` is `points` with 1 point, `firstHand 1`, `lastHand 12`, `majorPer100 8.3`.
  - The markup has exactly one `data-point` circle and contains no `more hand`.
  - Under the default grouping the same data still shows `Play 488 more hands to see your first trend point.`, which
    proves the grouping is applied.
- Verification: acceptance `tests/stats/trend-grouping.acceptance.test.tsx::AC#5 one 12-hand session plots one point with no play-more message`

### SPEC-06: Zero hands in the filter
- Verifies: AC#6, DoD#1
- Behaviour: Given (a) no stored hands, and (b) only 6-max hands with the Full ring filter, When the grouping is
  `session` or `day`, Then:
  - `view.chart` is `{kind:'no-hands'}` and `view.bb100` is `{kind:'no-cash'}`.
  - The markup shows `Play your first hand to see trends.` and has no Major `<svg>`.
- Verification: acceptance `tests/stats/trend-grouping.acceptance.test.tsx::AC#6 zero hands show the first-hand message under Session and Day`

### SPEC-07: Storyboard default matches REQ-048.1
- Verifies: AC#7, DoD#1
- Behaviour: Given `dreams/limit-holdem-trainer/storyboards/Stats.dc.html`, When its `Group by` select's options are
  parsed, Then:
  - Their texts equal `GROUPING_OPTIONS` labels in order (`Every 500 hands`, `Session`, `Day`).
  - Only the first is `selected`.
  - The file no longer contains `Every 100 hands`.
- Verification: acceptance `tests/stats/trend-grouping.acceptance.test.tsx::AC#7 the storyboard's Group by default is Every 500 hands`

### SPEC-08: Per-session BB/100 equals each session's report
- Verifies: AC#8, DoD#1
- Behaviour: Given three really played sessions (`playSession` + `handWrite`, records through
  `parseHandRecord(structuredClone(…))`), stored out of order:
  - cash at bigBet 4 for 15 hands.
  - a sit-and-go session for 10 hands, started between them.
  - cash at bigBet 20 for 20 hands, with ≥ 1 rebuy, as in `bb100.acceptance.test.tsx:209-231`.

  When the grouping is `session`, Then:
  - `view.bb100` has 2 points.
  - Each `bb100 === sessionReport(lastSessionRecord, endedAt, records).cash.bbPer100` for its session, and
    `=== bb100Value(that session's trend hands)`.
  - Their `group.number`s are 1 and 3, matching that session's Major point.
  - The BB/100 `<title>`s end with `signedTenths(report BB/100)`.
- Verification: acceptance `tests/stats/trend-grouping.acceptance.test.tsx::AC#8 per-session BB/100 equals each cash session's report BB/100`

### SPEC-09: BB/100 under Session/Day below 500 cash hands
- Verifies: AC#8
- Behaviour: Given 30 cash hands and 20 sit-and-go hands across 2 days, When the grouping is `day`, Then:
  - `view.bb100` is `points`, one per day that has cash hands, each `bb100Value` of that day's cash hands.
  - No `more cash hand` text is rendered.
  - Under `hands` grouping it stays `{kind:'more-cash', needed: 470}`.
  - This is the rule approved by Q-1 (D-4).
- Verification: acceptance `tests/stats/trend-grouping.acceptance.test.tsx::Session and Day BB/100 plot from the first cash hand`

### SPEC-10: Default grouping is byte-for-byte unchanged
- Verifies: AC#1, DoD#2
- Behaviour: Given any data, When `statisticsView(data)`, `statisticsView(data, all)` and
  `statisticsView(data, all, 'hands')` are computed, Then:
  - The three are deep-equal, and per-500 points have no `group` key (`Object.keys` is exactly
    `firstHand,lastHand,majorPer100`).
  - `pointLabel`, `chartLabel(points, target)`, `bb100PointLabel`, `bb100ChartLabel(points)` and
    `chartNote('hands') === CHART_NOTE`, `bb100Note('hands') === BB100_NOTE` give their current texts.
  - Every locked TASK-11.1–11.4 test passes unedited.
- Verification: unit `tests/stats/trends.test.ts::default grouping matches the per-500 view and texts`

### SPEC-11: Day keys, labels and session start fallback
- Verifies: AC#2, AC#3
- Behaviour: Given the grouping helpers, When called directly, Then:
  - `localDay(new Date(2026,10,5,0,0,0).toISOString()) === '2026-11-05'`, and
    `localDay(new Date(2026,10,4,23,59,59,999).toISOString()) === '2026-11-04'`.
  - `dayText('2026-11-05') === '5 Nov 2026'` and `dayText('2027-01-31') === '31 Jan 2027'`.
  - A session with no `sessionStarts` entry is placed and labelled by its earliest `completedAt`.
  - Equal starts order by sessionId.
  - Session and Day `pointLabel`/`bb100PointLabel`/`chartLabel`/`bb100ChartLabel`/`chartNote`/`bb100Note` give the
    §5 texts. A G-2 target appends `. Dashed target line at T` under `day`.
  - `firstHand`/`lastHand` are contiguous across groups (A-3).
- Verification: unit `tests/stats/trends.test.ts::session and day grouping helpers and texts`

### SPEC-12: App wiring: default on open, grouping and filters kept, G-2 from all hands
- Verifies: AC#1, AC#3, AC#4, DoD#7, DoD#8
- Behaviour: Setup:
  - `test.use({ timezoneId: 'America/New_York' })`.
  - Records are seeded with `seedStoredSessions`/`seedStoredRecords`, then the page reloads. The seed is 1,000
    hands:
    - 6-player cash, 300 hands, started `2026-11-10T23:58:00-05:00`. It crosses midnight New York time at hand 120.
    - Heads-up sit-and-go `sitAndGoPool(3, 2)`, 400 hands, started `2026-11-12T10:00:00-05:00`.
    - 6-player cash, 300 hands, started `2026-11-13T10:00:00-05:00`.

  When Statistics opens from Home, Then:
  - The combobox "Group by" lists `Every 500 hands`, `Session`, `Day`, with `Every 500 hands` checked. The Major card
    has 2 points. axe has no serious/critical issues.
  - Select Table size `6-max`, then Group by `Day`:
    - Table size still shows `6-max`.
    - The Major card has 3 points (titles start `10 Nov 2026`, `11 Nov 2026`, `13 Nov 2026`).
    - The totals read `600 hands over 2 sessions`.
    - The G-2 caption is visible, and the Major svg aria-label ends with `Dashed target line at T`, where T is
      `statisticsView(all seeded trend hands).g2Target`, computed in the test from the same records.
  - Select Table size `All`: Group by still shows `Day` and the Major card has 4 points.
  - Select Group by `Session`: 3 Major points and 2 BB/100 points.
  - Go `← Home`, then Statistics: Group by shows `Every 500 hands` again.
  - axe is run after each grouping change.
  - Every request's origin is the app's own origin.
- Verification: acceptance `e2e/statistics-grouping.spec.ts::Statistics groups the trends per session and per day`

### SPEC-13: Checks, coverage and boundaries
- Verifies: DoD#2, DoD#4, DoD#5, DoD#10
- Behaviour: Given the finished change, When the project checks run, Then:
  - `npm run lint` (including the headless import boundary on `src/stats/**`), `npm run typecheck` and `npm test`
    pass with zero errors.
  - `src/stats/**` stays ≥ 90% lines and overall stays ≥ 70%.
  - `src/stats/trends.ts` imports no UI or browser-only module.
  - CI is green on `doit/TASK-11.5`.
  - The new Vitest tests add < 3 s to `npm test` (see §9).
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-14: Documentation
- Verifies: DoD#11
- Behaviour: Given the story is done, When the docs are read, Then:
  - `docs/stats/trends.md` has a "Grouping" section covering:
    - the three options and the default.
    - the session and day rules (start order, local completion day per A-1, past-midnight split).
    - no minimum group size, and the zero-hand message.
    - the BB/100 rule (D-4/Q-1 outcome) and the §5 texts.
    - G-2 is unchanged.
    - grouping and filters reset on every opening.
  - The story doc is published to Backlog.
- Verification: manual `docs/stats/trends.md` Grouping section and the TASK-11.5 entry in `backlog doc list --plain`

### SPEC-15: Not-applicable DoD items
- Verifies: DoD#3, DoD#6, DoD#9, DoD#12
- Behaviour: These DoD items do not apply to this story:
  - There is no engine, bots or advice change, so the golden-spot suite (run by `npm test`) and the 10,000-hand
    playtest are unaffected.
  - There is no strategy content.
  - No service worker exists yet (E13-S07).
- Verification: command `npm test` (golden-spot suite included); `git diff --stat main -- src/engine src/bots src/advice` is empty

## 7. Edge cases
- Empty filter → SPEC-06. One hand / one session → SPEC-05. Groups smaller than 500 → SPEC-05, SPEC-09.
- A session past midnight → SPEC-03 and SPEC-12. A paused session resumed on a later day: per-day uses each hand's
  own `completedAt` (rule 4), as in SPEC-03. Per-session keeps it as one point.
- A session with no stored session record → start fallback (SPEC-11).
- A day or session without cash hands → no BB/100 point (A-6, SPEC-08).
- Non-chronological input order → SPEC-02, SPEC-03 (reversed or shuffled input).
- DST: dates in tests (10–14 Nov 2026) avoid transitions in US and EU zones. Calendar-day keys are DST-safe by
  construction (A-1).
- Invalid `completedAt`: cannot occur, because `parseHandRecord` rejects it (`hand-record.ts:469-475`). N/A.
- Concurrency/interruption: a grouping change before the load finishes is ignored, because the select is not
  rendered until `view` exists and App guards `data === undefined`.
- Permissions / dependency failure: the existing load-failure path is unchanged (`LOAD_FAILED_MESSAGE`). N/A.

## 8. Security considerations
- Trust boundaries: the only new input is the select value, from a fixed option list. No free text and no
  injection surface. Stored records are already validated on read (`parseHandRecord`).
- authn/authz, secrets, logging, randomness: N/A.
- New dependencies: none. Network: no new requests (SPEC-12 checks origins).

## 9. Non-functional
- Complexity: grouping is O(n) over the ordered hands plus a sort of at most #days keys. `orderHands` is already
  O(n log n). No extra full sort is added for `day` beyond sorting the bucket keys.
- `npm test` speed: SPEC-02 builds 3,000 in-memory records, like the existing `trend-view.acceptance.test.tsx`. The
  others use ≤ 600 records or ≤ 45 played hands. Target: the new acceptance file runs in < 3 s locally. No IndexedDB
  in Vitest, and no new slow/opt-in test.
- e2e: one new spec seeding 1,000 records, comparable to `e2e/statistics-target.spec.ts`.
- Accessibility: the select has a visible label (`Group by`), a 44 px min height via the existing
  `.stats-filters select` CSS (`src/ui/styles.css:313-321`), and axe shows zero serious/critical issues (SPEC-12).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev` → Home → Statistics → change "Group by" to Session, then Day, and change "Table size" → read both cards → "← Home" → Statistics (Group by is back to Every 500 hands)
- New tests:
  - `tests/stats/trend-grouping.acceptance.test.tsx` → SPEC-01..SPEC-09
  - `tests/stats/trends.test.ts` (added cases) → SPEC-10, SPEC-11
  - `e2e/statistics-grouping.spec.ts` → SPEC-12
- Judge's end-to-end scenario:
  1. Run `npx playwright test e2e/statistics-grouping.spec.ts e2e/statistics-filters.spec.ts e2e/statistics.spec.ts e2e/statistics-bb100.spec.ts e2e/statistics-target.spec.ts`.
     All pass in Chromium and WebKit.
  2. `npm run dev`:
     - Play a few cash hands, leave, and open Statistics. Group by shows Every 500 hands and the card says
       `Play … more hands`.
     - Choose Session: one point appears on each chart, and its tooltip reads `Session 1, <today>: …`.
     - Choose Day: one point for today.
     - Choose Table size Heads-up: `Play your first hand to see trends.`, and Group by still reads Day.
     - Home and back: both are reset.

## 11. Open questions
- None. Q-1 and Q-2 were answered (recommended options); see `doit/TASK-11.5/qa.md`.

## 12. Clarifications log
See `doit/TASK-11.5/qa.md`.
