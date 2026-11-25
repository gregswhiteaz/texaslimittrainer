# Spec: TASK-11.2 — See my BB/100 trend from cash hands against a break-even line

Status: READY (approved 2026-11-25)
Task: TASK-11.2 · Parent/epic: TASK-11 · Requirements: REQ-048 (048.1, 048.4, 048.11, 048.12, 048.13, 048.14), REQ-057 (057.1), REQ-058 (058.1) · Dream: limit-holdem-trainer

## 1. Summary
The Statistics screen gets a second chart card, "Big bets won per 100 hands". It uses cash-game hands only. Each
point is one complete group of 500 cash hands, taken in the same order the Major-error chart uses. A point's value is
the sum of each hand's net result in big bets of that hand's stake, divided by the hands in the group, × 100. It is
rounded exactly like the Session Report's BB/100, so a group made of one session's hands equals that session's
report. A dashed line marks 0 (break-even). With 1–499 cash hands the card shows "Play <n> more cash hands to see
your first trend point.", and with no cash hands it shows "No cash-game hands yet.". The work extends TASK-11.1's
`src/stats/trends.ts` and `StatisticsScreen.tsx`. The store read (`trendData()`) needs no change, because the per-hand
cash summary is built by `trendHand` from the same stored records.

## 2. Scope
- In scope:
  - `src/stats/trends.ts`: an optional `cash` summary (net chips, big bet) on `TrendHand`, filled by `trendHand` from
    the stored record. Also the group value `bb100Value`, the BB/100 points, the `bb100` chart state on
    `StatisticsView`, and the new text constants and builders.
  - `src/table/review.ts`: widen `netResult`'s parameter type to the fields it reads, so a `HandRecord` can be passed.
    There is no behaviour change.
  - `src/ui/stats/StatisticsScreen.tsx`: the second chart card with a dashed break-even line. `src/ui/styles.css`.
  - `tests/support/stat-records.ts`: a builder for real cash records at mixed stakes and real sit-and-go records.
  - Tests: unit, acceptance (module and `renderToString`), a store-level check that `trendData()` carries the cash
    summary, and a Playwright flow with axe in Chromium and WebKit. Docs.
- Not doing:
  - The game-type and table-size filter UI (TASK-11.4) or per-session / per-day grouping UI (TASK-11.5). This story
    provides `bb100Value`, which TASK-11.5 reuses for per-session points (Q-1).
  - Sit-and-go results / finishing positions (TASK-11.9). The G-2 target line on the Major-error chart (TASK-11.3).
  - Any change to `trendData()`, the IndexedDB schema or version, or the stored record format.
  - Any change to the Major-error chart's markup, text, classes or `data-point` markers.
  - Axis labels or ticks. Any chart library or new dependency.
  - New timing or scale checks. The existing opt-in `e2e/statistics-speed.spec.ts` and
    `tests/storage/trend-data-3000.acceptance.test.ts` are left as they are.
- Scope budget: files=11, lines=750

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | A hand's net = `netResult(record)` (`src/table/review.ts:189-197`): the user's award shares + returned chips − every chip the user put in (blinds included). Its big bet = `record.stake.bigBet`. A rebuy is never in a hand record, so it is never a result. | yes | This is the task's formula ("chips won − chips put in" / "big bet of that hand's stake"). The helper already exists. A probe of 200 real hands with 8 rebuys gave Σ net = the report's `result` (−3,350). | Read stack deltas from the session (wrong across rebuys). |
| A-2 | Group value = the exact rational Σ(net_i / bigBet_i) / n × 100, rounded by the report's `bbPer100`. It is computed as `bbPer100(Σ net_i × (L / bigBet_i), L, n)`, with L = the least common multiple of the group's big bets. With one stake, L = bigBet, so the formula is the report's own `bbPer100(result, bigBet, hands)`. | yes | Integer arithmetic gives no float drift, and AC#4 equality is exact. `CASH_STAKES` (`src/table/session.ts:63-64`) bounds L at 120. | Float sum then `Math.round` (could differ from the report by 0.1). |
| A-3 | The BB/100 chart takes the hands in TASK-11.1's order (`orderHands`), keeps the cash ones and groups them in 500s. A point's `firstHand`/`lastHand` are 1-based positions among the cash hands. | yes | Same ordering as the Major-error chart (TASK-11.1 A-2). REQ-048.11 together with the task text means "counts cash hands only". | Positions among all hands. |
| A-4 | `TrendHand.cash` is optional: present iff the stored record's `gameType` is `'cash'`. `TrendSource` gains the optional fields `gameType`, `stake`, `userSeat`, `actions` and `result` (`HandRecord` satisfies them). A source without `gameType: 'cash'` gives a hand with no `cash`. | yes | Existing `TrendHand`/`TrendSource` literals in TASK-11.1's tests (locked `tests/ui/statistics.acceptance.test.tsx:18-27`, and `tests/stats/trends.test.ts:17-34,66-78`) keep compiling and keep their meaning. | A required field (breaks a locked test's typecheck). |
| A-5 | Geometry: the same 400×160 viewBox and x positions as the Major-error chart (TASK-11.1 A-9). hi = max(1, largest value), lo = min(−1, smallest value), y(v) = 150 − (v − lo)/(hi − lo) × 140, rounded to 1 decimal. The break-even `line` runs from x 0 to x 400 at y(0) with `stroke-dasharray="6 5"`. The stroke colour comes from the storyboard's dashed line (#F0A030). There is no y=150 baseline. | yes | Values can be negative. Keeping 0 inside the plot means the break-even line is always visible. The storyboard draws a dashed line (`Stats.dc.html:46`). | Symmetric scale around 0. |
| A-6 | While loading or after a read failure, the BB/100 card shows only its h2 (with `aria-busy="true"` while loading). The single failure message stays in the Major-error card. | yes | One failure message per screen. The locked `tests/ui/statistics.acceptance.test.tsx:70-84` checks the first card only. | Repeat the failure text. |
| A-7 | The BB/100 card's markers use distinct names: messages are `p.stats-bb100-message`, points are `circle[data-bb100-point]`, and the h2 id is `stats-bb100-title`. CSS styles them like `.stats-message` / `.stats-dot`. | yes | Locked tests locate the Major chart page-wide by `.stats-message` (`e2e/play-money.spec.ts:109`, `e2e/statistics.spec.ts:41,56`) and `circle[data-point]` (`e2e/statistics-speed.spec.ts:23,31`, `tests/ui/statistics.acceptance.test.tsx:62`, `tests/stats/trend-view.acceptance.test.tsx:52`). Reusing those names would break them (a Playwright strict-mode violation, or doubled counts). | Reuse the names and edit 5 locked tests. |
| A-8 | Test fixtures: a small pool of real hands played with `playSession` (`tests/support/session-play.ts:44`) at 3 cash stakes, plus a few real sit-and-go hands, written with `handWrite`. The pool is cloned to the needed counts with a new `sessionId`/`handNumber`/`completedAt`, as `statRecords` does. The normal suite plays at most ~80 real hands in total (about 25 ms each, measured). | yes | 2,000 real played hands take about 50 s, which is too slow for the normal suite (memory: slow tests opt-in). Clones are real, parseable records. | Play every hand (slow group only). |

## 3. Current system
- TASK-11.1 (doc-134) built `src/stats/trends.ts`: `TrendHand {sessionId, handNumber, completedAt, unhintedMajors}`
  (`:9-15`), `TrendSource` (`:18-26`), `orderHands` (`:74-92`), `majorErrorPoints` (`:95-111`),
  `statisticsView` (`:113-123`), `countText`/`counted` (`:126-131`), messages and labels (`:57-60, :137-152`).
  `trendData()` in `src/storage/hand-store.ts:139-170` calls `trendHand(parseHandRecord(value))` on every stored hand,
  so whatever `trendHand` derives from a `HandRecord` reaches the screen with no store change.
- `StatisticsScreen` (`src/ui/stats/StatisticsScreen.tsx:22-73`): `MajorErrorTrend` hand-written SVG, one
  `section.panel.stats-chart`. App read effect `src/ui/App.tsx:82-101` sets `view: statisticsView(data)` and needs no change.
- `HandRecord` has `gameType`, `stake {smallBet,bigBet}`, `userSeat`, `actions` (with `added`) and `result`
  (`src/table/hand-record.ts:74-105`). `parseHandRecord` checks `gameType ∈ {cash, sit-and-go}`, a whole
  `stake.bigBet ≥ 1`, and `level` null iff cash (`:478-484`).
- Report BB/100: `bbPer100(result, bigBet, hands)` (`src/table/session-report.ts:146-150`). It rounds half away from
  zero to tenths with integer arithmetic and never returns −0. The report's `cash.bbPer100 = bbPer100(finalStack −
  buyIn×(1+rebuys), bigBet, handsPlayed)` (`:162-175`). The display is `signedTenths` (`:316-319`): "+2.7", "-5.0", "0.0".
- Per-hand net: `netResult(hand: CompletedHand)` (`src/table/review.ts:189-197`) reads only `userSeat`, `result` and
  `actions`.
- Headless rule: `src/stats` may import `src/table` but not UI (`tools/lint/headless-boundary.js:7`). `trends.ts`
  already imports `../table/session-report`.
- Tests: Vitest `npm test` (with coverage, `src/stats/**` ≥ 90%). Acceptance files are `*.acceptance.test.*`.
  Playwright runs Chromium and WebKit, with axe via `e2e/support/paused-clock.ts::axeWithPausedClock`. Seeding uses
  `e2e/support/hand-records.ts::seedStoredRecords`/`seedStoredSessions`. e2e may import `tests/support/*`. Opt-in slow
  tests use `TLH_SLOW_TESTS=1` (`package.json` `test:slow`, `e2e:slow`).
- Storyboard `dreams/limit-holdem-trainer/storyboards/Stats.dc.html:75`: title "Big bets won per 100 hands", goal
  caption "Dashed line: break-even (G-3)", note "Above the dashed line means you are winning against this line-up.",
  and a dashed line (`:46`) with stroke #F0A030 and `stroke-dasharray="6 5"`.
- Tests that pin the screen's markup, chart count or `TrendHand` shape:

  | Test | Locked (owner) | Pins | Effect of this design |
  |---|---|---|---|
  | `tests/ui/statistics.acceptance.test.tsx` | yes (TASK-11.1) | first `p.stats-message`, `circle[data-point]` ×3, `section.panel.stats-chart` aria-busy, no `<svg` for 0/320/499 hands; builds `TrendHand` literals | Unchanged: the literals have no `cash`, so the BB/100 card shows a message, not an SVG (A-4, A-7) |
  | `tests/stats/trend-view.acceptance.test.tsx` | yes (TASK-11.1) | `circle…data-point` titles | Unchanged (A-7) |
  | `tests/stats/trends.acceptance.test.ts` | yes (TASK-11.1) | Major points | Unchanged |
  | `e2e/statistics.spec.ts` | yes (TASK-11.1) | `.stats-message` text and count 0, `circle[data-point]` in the Major img | Unchanged (A-7) |
  | `e2e/play-money.spec.ts:109` | yes (TASK-2.15/10.2/11.1) | `.stats-message` text on an empty store | Unchanged (A-7) |
  | `tests/ui/home-statistics…`, `tests/ui/screen-list…` | yes (TASK-11.1, TASK-2.15) | Home entry, routes | Unaffected |
  | `tests/stats/trends.test.ts:103-108` | no (TASK-11.1 unit) | `toEqual` on the whole empty `StatisticsView` | **Must change**: the expected object gains `bb100: { kind: 'no-cash' }` (D-3) |
  | `tests/stats/trends.test.ts:66-78` | no | `trendHand` output `toEqual` | Unchanged (no `cash` key when the source has no `gameType`) |
  | `tests/storage/trend-data.test.ts:54`, `trend-data-3000…:54` | no / opt-in | `trendHand` parity, `view.chart` | Unchanged (same `trendHand` on both sides, `chart` is untouched) |
  | `e2e/statistics-speed.spec.ts:23,31` | no (opt-in) | page-wide `circle[data-point]` count | Unchanged (A-7) |

- Existing code to reuse:
  - `src/table/review.ts::netResult` → the per-hand net (A-1). Only its parameter type is widened.
  - `src/table/session-report.ts::bbPer100` → group rounding (A-2). `::signedTenths` → value text.
  - `src/stats/trends.ts::orderHands`, `GROUP_SIZE`, `countText`, `counted` → order, grouping and wording.
  - `src/ui/stats/StatisticsScreen.tsx::MajorErrorTrend` x-position rule and `round` → the BB/100 SVG (share one helper).
  - `tests/support/stat-records.ts` clone pattern, `tests/support/session-play.ts::playSession`,
    `src/table/session-record.ts::handWrite`, `src/table/session-report.ts::sessionReport` → fixtures and the AC#4 oracle.
  - `e2e/support/hand-records.ts::seedStoredRecords`/`seedStoredSessions`, `e2e/support/paused-clock.ts::axeWithPausedClock`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Extend TASK-11.1's `TrendHand`/`trendHand`/`statisticsView` with an optional `cash` summary and a `bb100` chart state. No parallel module and no store change. | A new `bb100.ts` and a second store read. | One read and one ordering. TASK-11.1 D-2 planned this aggregate to grow. | no | n/a |
| D-2 | The AC wording "game type All / Sit-and-go" and "per-session point" is met here by pure functions: `statisticsView` over the hands the screen is given (today that is All), the SNG-only hand set for the Sit-and-go case, and `bb100Value(session's cash hands)` for the per-session value. The filter and grouping UI stay in TASK-11.4/11.5. | Build a game-type select or per-session switch now. | Those UIs are other stories' scope (TASK-11.1 D-5). | yes (AC interpretation) | user (Q-1, option a; TASK-11.4/11.5 gained ACs to wire their UI to these functions) |
| D-3 | `StatisticsView` gains `bb100: Bb100Chart`. The TASK-11.1 unit test `tests/stats/trends.test.ts:103-108` (not locked) is edited to add `bb100: { kind: 'no-cash' }` to its expected empty view. No other existing test changes. | Put the BB chart outside `StatisticsView` (a second prop). | One view object per screen. The edit only adds the new field. | no | n/a |
| D-4 | Chart copy: goal caption `Dashed line: break-even` (`p.stats-goal`, above the SVG). Note `Each point is 500 cash hands. Above the dashed line means you are winning.` Point `<title>`: `Cash hands <first>–<last>: <signedTenths>`, e.g. `Cash hands 501–1,000: +2.7` (en dash U+2013, counts via `countText`). SVG `aria-label`: `Big bets won per 100 hands, one point per 500 cash hands: <v1>, <v2>, …` (each `signedTenths`, joined by `, `), e.g. `…: +2.7, -1.3`. | Storyboard verbatim incl. "(G-3)" and "against this line-up"; note only. | Storyboard text without internal goal ids or the line-up clause. | yes (user-visible) | user (Q-2) |

## 5. Design

### Files to create / modify
- `src/stats/trends.ts` — `CashSummary`, optional `TrendHand.cash`, extended `TrendSource`, `bb100Value`, `bb100Points`,
  `Bb100Chart`, `StatisticsView.bb100`, text constants and builders.
- `src/table/review.ts` — `netResult` parameter type → `Pick<CompletedHand, 'userSeat' | 'result' | 'actions'>`.
- `src/ui/stats/StatisticsScreen.tsx` — second `section` with `Bb100Trend` (SVG with a dashed break-even line).
- `src/ui/styles.css` — `.stats-bb100-message`, `.stats-break-even`, `.stats-goal` (and reuse of existing chart styles).
- `tests/support/stat-records.ts` — `cashPool(...)`, `sitAndGoPool(...)`, `cloneRecords(...)` (A-8).
  **Builder, first step:** before other work, confirm that a real sit-and-go hand (`seatSession({ gameType: 'sit-and-go' })` → `playSession` → `handWrite`) gives a record that passes `parseHandRecord` with `gameType: 'sit-and-go'` and `level: 1`. If it doesn't, stop and escalate; don't hand-forge sit-and-go records.
- `tests/stats/bb100.acceptance.test.tsx` — new: AC#1–AC#7 at module + `renderToString` level.
- `tests/stats/trends.test.ts` — the D-3 edit plus unit cases for `trendHand` cash, `bb100Value`, messages and geometry.
- `tests/storage/trend-data.test.ts` — add one case: `trendData()` returns `cash` for a stored cash record and no
  `cash` for a stored sit-and-go record.
- `e2e/statistics-bb100.spec.ts` — new Playwright flow (Chromium, WebKit, axe, network).
- `docs/stats/trends.md` — the BB/100 section (formula, cash-only, messages, break-even line).
- `src/table/session-report.ts` is not edited (helpers only imported).

### Components, interfaces and data
`src/stats/trends.ts` additions (still headless. It imports `netResult` from `../table/review` and `signedTenths` from
`../table/session-report`):
```ts
export interface CashSummary {
  /** The user's net chips in the hand: netResult(record). */
  readonly net: number;
  /** The hand's stake big bet (record.stake.bigBet), ≥ 1. */
  readonly bigBet: number;
}
export interface TrendHand { /* existing four fields */ readonly cash?: CashSummary; } // present iff cash hand
export interface TrendSource {
  /* existing fields */
  readonly gameType?: GameType;
  readonly stake?: { readonly bigBet: number };
  readonly userSeat?: SeatNumber;
  readonly actions?: readonly ActionRecord[];
  readonly result?: HandResult;
}
export interface Bb100Point { readonly firstHand: number; readonly lastHand: number; readonly bb100: number; }
export type Bb100Chart =
  | { readonly kind: 'no-cash' }
  | { readonly kind: 'more-cash'; readonly needed: number }            // 1..499
  | { readonly kind: 'points'; readonly points: readonly Bb100Point[] }; // length ≥ 1
export interface StatisticsView { /* existing */ readonly bb100: Bb100Chart; }

/** BB/100 of a set of cash hands (A-2); RangeError if empty or any hand lacks `cash`. */
export function bb100Value(hands: readonly TrendHand[]): number;
/** One point per complete 500-cash-hand group of the ordered hands' cash hands (A-3). */
export function bb100Points(ordered: readonly TrendHand[]): readonly Bb100Point[];
export function moreCashHandsMessage(needed: number): string;
export const NO_CASH_MESSAGE = 'No cash-game hands yet.';
export const BB100_TITLE = 'Big bets won per 100 hands';
export const BB100_GOAL = 'Dashed line: break-even';
export const BB100_NOTE = 'Each point is 500 cash hands. Above the dashed line means you are winning.';
export function bb100PointLabel(point: Bb100Point): string;   // "Cash hands 501–1,000: +2.7" (D-4)
export function bb100ChartLabel(points: readonly Bb100Point[]): string; // D-4 aria-label
```
- `trendHand(record)`: as before, plus when `record.gameType === 'cash'` it sets
  `cash: { net: netResult(record), bigBet: record.stake.bigBet }`. Otherwise there is no `cash` key (no `undefined`
  property either).
- `statisticsView`: `bb100` is built from `c` = the number of hands with `cash`. c = 0 → `no-cash`. 1 ≤ c ≤ 499 →
  `more-cash` with `needed = 500 − c`. c ≥ 500 → `points: bb100Points(orderHands(data))`. `orderHands` runs at most
  once per view.
- `StatisticsScreen`: after the existing Major section, a second
  `<section className="panel stats-chart" aria-labelledby="stats-bb100-title" aria-busy={loading}>` holds
  `h2#stats-bb100-title` `BB100_TITLE`. Then, when `view` is set, one of:
  `p.stats-bb100-message` (`NO_CASH_MESSAGE` or `moreCashHandsMessage(needed)`), or `Bb100Trend`. `Bb100Trend` is
  `p.stats-goal` `BB100_GOAL`, then `svg.stats-trend[role=img][aria-label=bb100ChartLabel]` containing
  `line.stats-break-even` (dashed, A-5), `polyline.stats-line` and one `circle[data-bb100-point].stats-dot` per point
  with `<title>` = `bb100PointLabel`, then `p.stats-note` `BB100_NOTE`. When `view` is `undefined` or `null`, only
  the h2 is shown (A-6). The x-position and `round` code is shared with `MajorErrorTrend`.

### Rules and algorithms
- Net (A-1): net = Σ award shares to `userSeat` + `returned.amount` if returned to `userSeat` − Σ `added` of the
  user's actions.
- Group value (A-2): L = lcm(bigBet_i), N = Σ net_i × (L / bigBet_i), value = `bbPer100(N, L, n)`.
  - Worked example: net +12 at $4/$8 and −20 at $10/$20 over 2 hands → L = 40, N = 60 − 40 = 20,
    `bbPer100(20, 40, 2)` = 25.0 (= (1.5 − 1) / 2 × 100).
  - Single stake: 500 hands at $4/$8 with Σ net = −52 → `bbPer100(−52, 8, 500)` = −1.3.
- Grouping (A-3, REQ-048.11): cash = `orderHands(data).filter(h => h.cash)`. k = ⌊c/500⌋ points, and point i covers cash
  positions 500i+1 … 500i+500. The remainder forms no point. 2,000 cash → 4 points. 1,000 cash + 500 SNG → 2 points.
  800 hands of which 300 are cash → `more-cash` 200 (the Major chart has 1 point).
- Messages (exact, from the task, REQ-048.12/.13/.14): `moreCashHandsMessage(200)` =
  `Play 200 more cash hands to see your first trend point.`; `moreCashHandsMessage(1)` =
  `Play 1 more cash hand to see your first trend point.`; `NO_CASH_MESSAGE` = `No cash-game hands yet.`. Counts use
  `counted` (`countText` with comma thousands).
- Value text: `signedTenths(bb100)` → "+2.7", "-1.3", "0.0" (same as the report's BB/100 tile).
- Geometry (A-5): values [+2, −1] → hi = 2, lo = −1, y(2) = 10, y(−1) = 150, break-even y(0) = 103.3. Value [0] →
  hi 1, lo −1, y(0) = 80, x = 200.

### Error handling and configuration
- `bb100Value([])` or a hand without `cash` → `RangeError('bb100Value needs cash hands')`. The screen never calls it
  that way (grouping guarantees 500 cash hands).
- Invalid stored values are already skipped by `trendData()` (TASK-11.1 A-3). A read failure is TASK-11.1 D-7, and
  the BB card shows only its h2 (A-6).
- No configuration. `GROUP_SIZE` = 500 is shared.

## 6. Behaviour specification

### SPEC-01: 2,000 mixed-stake cash hands → 4 recomputed points
- Verifies: AC#1, DoD#1
- Behaviour: Given 2,000 real-shaped cash `HandRecord`s cloned from a pool of real hands played at $2/$4, $4/$8 and
  $10/$20 (A-8), spread over 4 sessions (at least one 500-group spans two stakes, and nets are both positive and
  negative), When `statisticsView({ hands: records.map(trendHand), sessionStarts })` is rendered by
  `StatisticsScreen`, Then there are exactly 4 `circle[data-bb100-point]`. Each point's value equals what the test
  recomputes itself from the records: order by session start then hand number, take 500-hand slices, compute each
  hand's net from `result.awards`/`returned`/`actions` of `userSeat` divided by `stake.bigBet` as an exact fraction,
  sum, divide by 500, × 100, round half away from zero to 1 decimal. The value is compared as `signedTenths` text
  inside each `<title>`. At least two points differ.
- Verification: acceptance `tests/stats/bb100.acceptance.test.tsx::AC#1 2,000 cash hands at mixed stakes plot 4 points recomputed from the records`

### SPEC-02: Sit-and-go hands never enter the BB/100 chart
- Verifies: AC#2
- Behaviour: Given 1,000 cash records and 500 real sit-and-go records (`gameType: 'sit-and-go'`, `level: 1`)
  interleaved in the order, When the view is computed, Then `bb100` has 2 points. Their values equal `bb100Value` of
  cash positions 1–500 and 501–1,000 as recomputed by the test from the cash records only. The Major chart has 3
  points (1,500 hands).
- Verification: acceptance `tests/stats/bb100.acceptance.test.tsx::AC#2 1,000 cash and 500 sit-and-go hands plot 2 points from the cash hands only`

### SPEC-03: Dashed break-even line at 0
- Verifies: AC#3
- Behaviour: Given a view whose `bb100` points have values of both signs (e.g. +2.0 and −1.0), When rendered, Then
  the BB/100 SVG contains exactly one `line.stats-break-even` with `stroke-dasharray="6 5"`, x1=0, x2=400 and
  y1 = y2 = y(0) per A-5 (103.3 for [+2, −1]). Given all-positive values, the line is still drawn inside the plot
  (y between 10 and 150). The Major-error SVG has no `stats-break-even` line.
- Verification: acceptance `tests/stats/bb100.acceptance.test.tsx::AC#3 the BB/100 chart draws a dashed break-even line at 0`

### SPEC-04: A session's BB/100 value equals its report
- Verifies: AC#4
- Behaviour: Given a real cash session played with `playSession` at $10/$20 for a hand count and seed chosen so the
  stored session has `rebuys ≥ 1` (asserted), each hand written with `handWrite`, When `bb100Value(records.map(trendHand))`
  is computed, Then it equals `sessionReport(lastSession, endedAt, records).cash.bbPer100`. The same check is repeated
  for a 1-hand session. The test plays at most 60 hands.
- Verification: acceptance `tests/stats/bb100.acceptance.test.tsx::AC#4 a cash session's BB/100 value equals its report's BB/100`

### SPEC-05: No cash hands → "No cash-game hands yet."
- Verifies: AC#5
- Behaviour: Given 600 sit-and-go records and no cash records, When the screen renders the view of all stored hands
  (game type All), and again the view of the hands a Sit-and-go filter would keep (the same 600), Then both show
  `p.stats-bb100-message` `No cash-game hands yet.` and no `data-bb100-point`. The Major chart has 1 point. Given 0
  hands, the BB card also shows `No cash-game hands yet.`.
- Verification: acceptance `tests/stats/bb100.acceptance.test.tsx::AC#5 sit-and-go-only hands show No cash-game hands yet`

### SPEC-06: 300 cash of 800 → play-more-cash message while the Major chart plots
- Verifies: AC#6
- Behaviour: Given 800 hands of which 300 are cash, When the screen renders, Then the BB card shows
  `Play 200 more cash hands to see your first trend point.` and no BB SVG, and the Major chart has exactly 1
  `circle[data-point]`.
- Verification: acceptance `tests/stats/bb100.acceptance.test.tsx::AC#6 300 cash hands of 800 show the play-more-cash message while the Major chart plots 1 point`

### SPEC-07: Singular form at 499
- Verifies: AC#7
- Behaviour: Given 499 cash hands, When the screen renders, Then the BB card shows
  `Play 1 more cash hand to see your first trend point.`.
- Verification: acceptance `tests/stats/bb100.acceptance.test.tsx::AC#7 499 cash hands show the singular play-more-cash message`

### SPEC-08: Unit rules
- Verifies: AC#1, AC#4, AC#6, AC#7
- Behaviour: `trendHand` of a real cash record has `cash = { net: netResult(record), bigBet: record.stake.bigBet }`.
  For a sit-and-go record, or a source without `gameType`, it has no `cash` key. `bb100Value` gives the worked
  examples in §5 (25 and −1.3) and throws `RangeError` on `[]`. c = 500 → 1 point, and c = 499 → `more-cash` 1.
  `moreCashHandsMessage(1500)` uses "1,500". The geometry examples in §5 hold. `bb100PointLabel({firstHand:501,lastHand:1000,bb100:2.7})` = `Cash hands 501–1,000: +2.7`; `bb100ChartLabel` of [+2.7, −1.3] = `Big bets won per 100 hands, one point per 500 cash hands: +2.7, -1.3`; `BB100_GOAL` and `BB100_NOTE` equal the D-4 text. The TASK-11.1 empty-view `toEqual`
  includes `bb100: { kind: 'no-cash' }` (D-3).
- Verification: unit `tests/stats/trends.test.ts::computes cash net, BB/100 groups, messages and break-even geometry`

### SPEC-09: Store read carries the cash summary
- Verifies: AC#1, AC#2
- Behaviour: Given a fake-indexeddb store with 2 real cash records and 1 real sit-and-go record, When `trendData()`
  runs, Then the cash hands carry `cash` equal to `trendHand(record).cash`, and the sit-and-go hand has no `cash`.
- Verification: unit `tests/storage/trend-data.test.ts::trendData carries each cash hand's net and big bet`

### SPEC-10: Browser flow, axe and network
- Verifies: AC#2, AC#3, AC#5, DoD#7, DoD#8
- Behaviour: Given 1,000 cash and 500 sit-and-go records seeded with `seedStoredRecords`/`seedStoredSessions` and a
  reload, When Statistics opens from Home, Then the region named "Big bets won per 100 hands" shows an img whose
  name starts with "Big bets won per 100 hands", with 2 `circle[data-bb100-point]` and one `line.stats-break-even`, and the texts `Dashed line: break-even` and `Each point is 500 cash hands. Above the dashed line means you are winning.` are visible.
  The Major chart shows 3 points, and axe reports zero serious/critical violations. Given an empty store, Then
  `No cash-game hands yet.` is visible, with axe clean. Every request has the app's origin. This runs in Chromium and WebKit.
- Verification: acceptance `e2e/statistics-bb100.spec.ts::Statistics shows the cash-only BB/100 trend with a break-even line, and the no-cash state`

### SPEC-11: Project checks
- Verifies: DoD#2, DoD#4, DoD#5, DoD#10
- Behaviour: Lint (including the headless boundary on `src/stats/trends.ts`), typecheck, and the full Vitest suite
  with coverage pass with zero errors. `src/stats/**` stays ≥ 90% lines and overall ≥ 70%. All existing locked
  Statistics tests pass unedited. CI is green on the branch.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run e2e`

### SPEC-12: Documentation
- Verifies: DoD#11
- Behaviour: `docs/stats/trends.md` documents the BB/100 formula (A-1, A-2) with the worked example, cash-only
  grouping, the messages and the break-even line. The story doc is published to Backlog.
- Verification: manual `docs/stats/trends.md` BB/100 section and the TASK-11.2 entry in `backlog doc list --plain`

### SPEC-13: Not-applicable DoD items
- Verifies: DoD#3, DoD#6, DoD#9, DoD#12
- Behaviour: No engine, bots or advice change, so the golden-spot suite (run by `npm test`) and the 10,000-hand
  playtest are unaffected. No strategy content. No service worker exists yet (E13-S07).
- Verification: manual `git diff --stat main -- src/engine src/bots src/advice` is empty

## 7. Edge cases
- 0 hands: SPEC-05. Cash 1–499: SPEC-06, SPEC-07. Exactly 500 cash: SPEC-08. A remainder of cash hands: SPEC-01
  (2,000 = 4 points), SPEC-02.
- Sit-and-go hands mixed into the order: SPEC-02. Only sit-and-go: SPEC-05.
- A group spanning stakes and sessions: SPEC-01. A rebuy within a session: SPEC-04 (A-1).
- A hand left mid-hand (forced fold): its net is the chips the user put in, negative, which matches the stack change.
  It is covered by A-1's rule. No extra item, since `netResult` is unchanged.
- Negative, zero and positive values: SPEC-03, SPEC-08 (geometry, `signedTenths` never shows "-0.0").
- Big-bet lcm growth: bounded by `CASH_STAKES` (A-2). Stored values are validated as whole numbers ≥ 1.
- Loading or read failure: A-6 (covered by the locked TASK-11.1 tests for the first card, and the BB card shows only its h2).
- Concurrency: none (a read-only transaction, as TASK-11.1).

## 8. Security considerations
- Trust boundary: stored hand values, already validated by `parseHandRecord` in `trendData()`. The net uses only
  validated fields.
- React escapes all text. No `dangerouslySetInnerHTML`.
- No new dependencies and no network (SPEC-10). No secrets, authn/authz or randomness.

## 9. Non-functional
- Per opening: no extra IndexedDB reads. The BB/100 work is O(n) on top of TASK-11.1's single ordering.
- Normal suite cost: the new tests play at most ~80 real hands (about 2 s) and clone the rest. No custom timeouts and no new slow checks.
- Accessibility: the new card is a labelled region, and its SVG has `role="img"` with an accessible name listing
  every value. axe is clean (SPEC-10).
- Coverage ≥ 90% lines for `src/stats/**`, ≥ 70% overall.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev` → Home → Statistics → read the "Big bets won per 100 hands" card → "← Home"
- New tests:
  - `tests/stats/bb100.acceptance.test.tsx` → SPEC-01..SPEC-07
  - `tests/stats/trends.test.ts` (added cases + D-3 edit) → SPEC-08
  - `tests/storage/trend-data.test.ts` (added case) → SPEC-09
  - `e2e/statistics-bb100.spec.ts` → SPEC-10
- Judge's end-to-end scenario: `npm run dev`, play ~10 cash hands, go Home, open Statistics. The BB card should show
  "Play <500−n> more cash hands to see your first trend point.". Then run `npx playwright test
  e2e/statistics-bb100.spec.ts` for the 1,000-cash + 500-SNG view (2 points, dashed break-even line).

## 11. Open questions
None. Q-1 (D-2) and Q-2 (D-4) answered in `doit/TASK-11.2/qa.md`.

## 12. Clarifications log
See `doit/TASK-11.2/qa.md`.
