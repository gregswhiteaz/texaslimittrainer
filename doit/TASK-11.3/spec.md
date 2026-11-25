# Spec: TASK-11.3 — See the G-2 target line on my Major-error trend

Status: READY (approved 2026-11-25)
Task: TASK-11.3 · Parent/epic: TASK-11 · Requirements: REQ-040 (040.3), REQ-048 (048.3, 048.9), REQ-004.8, REQ-057 (057.1), REQ-058 (058.1) · Dream: limit-holdem-trainer

## 1. Summary
The Major-error chart on the Statistics screen gets a dashed target line once 1,000 hands of any kind are stored.
The target is half the G-2 baseline. The baseline is the unhinted Major errors per 100 hands over the user's first
1,000 hands in chronological order (session start, then hand number), and it does not depend on any filter. A
caption above the chart explains the line. With 999 or fewer stored hands there is no line and no caption. The work
extends TASK-11.1/11.2's `src/stats/trends.ts` and `StatisticsScreen.tsx` and reuses the BB/100 chart's dashed-line
pattern (TASK-11.2 A-5).

## 2. Scope
- In scope:
  - `src/stats/trends.ts`: `G2_BASELINE_HANDS` (1,000), `g2Target(ordered)`, `StatisticsView.g2Target`, an optional
    second argument `all` on `statisticsView` (the full stored set that the target is computed from), the caption
    constant, and an optional target on `chartLabel`.
  - `src/ui/stats/StatisticsScreen.tsx`: the caption plus a dashed `line.stats-target` in `MajorErrorTrend`, with the
    y scale widened to include the target. `src/ui/styles.css`: `.stats-target` (same stroke as `.stats-break-even`).
  - `tests/support/stat-records.ts`: export the existing `graded` helper as `withGrades`, and add an optional
    `players` argument to `cashPool` / `sitAndGoPool`.
  - Tests: acceptance (module and `renderToString`), unit, and a Playwright flow with axe in Chromium and WebKit. Docs.
- Not doing:
  - Filter UI of any kind: table size / game type (TASK-11.4) and line-up (TASK-11.8). The filter ACs (#4, #5) are met
    through `statisticsView(filtered, all)` (D-2, approved Q-1).
  - Stating whether G-2 was met after 5,000 hands (TASK-11.11). Per-session / per-day grouping (TASK-11.5).
  - Any change to `trendData()`, the IndexedDB schema, the stored record format, or the BB/100 card.
  - Any change to the Major chart's existing markup when there is no target: same `circle[data-point]`, titles,
    `stats-baseline`, `stats-note`, and `chartLabel(points)` text.
  - Axis labels or ticks. Any chart library or new dependency. New timing or scale checks.
- Scope budget: files=8, lines=560

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Target = `bbPer100(m, 2, 1000)`, where m = Σ `unhintedMajors` of the first 1,000 ordered hands. This is m / 20 rounded half away from zero to tenths (62 → 3.1, 63 → 3.2, 0 → 0). The line is drawn at this rounded value. | yes | It is the same integer-exact rounding the Major points already use (`majorErrorPoints` → `bbPer100(majors, 1, 500)`, `src/stats/trends.ts:147`). The shown value and the line agree. | Unrounded m/20 (the label would need its own rounding). |
| A-2 | "1,000 hands exist" counts every hand `trendData()` returns: all valid stored hands, of any game type, table size or line-up, hinted or not, forced folds included (REQ-048.3). | yes | `trendData()` already skips invalid records (TASK-11.1 A-3), and the screen counts exactly those hands everywhere else. | Count raw IndexedDB rows. |
| A-3 | The line is drawn only when the Major chart plots points. If a filter (later, TASK-11.4) leaves 1–499 or 0 hands, the message shows and there is no line or caption. `view.g2Target` still carries the value. | yes | There is no plot to draw a line on. | Draw an empty plot with only the target. |
| A-4 | Scale: yMax = max(1, every point value, target). Without a filter the target never exceeds the largest point (points 1 and 2 cover exactly the baseline hands, and their mean is about twice the target), so today's geometry does not change. With a filtered set whose points sit below the target, the line stays inside the plot. | yes | This is the same idea as TASK-11.2 A-5, which keeps 0 in range so break-even is always visible. | Clip the line when it is above every point. |
| A-5 | Markers: the caption is `p.stats-goal` (an existing class, already axe-clean in amber) placed above the Major SVG. The line is `line.stats-target` with `stroke-dasharray="6 5"` from x 0 to 400. The storyboard's stroke is #F0A030, width 1.5 (`Stats.dc.html:46`). | yes | The locked `tests/stats/bb100.acceptance.test.tsx:206` asserts the Major card has no `stats-break-even`, so the line needs a different class. | Reuse `stats-break-even` (breaks a locked test). |
| A-6 | Test fixtures follow TASK-11.2 A-8: grades are set on `statRecords` template clones (4 decisions each), and game-type and table-size mixes use small real pools (≤ 10 hands each, ≤ 40 real hands in total for this story) cloned to the counts needed. Grades on pool clones are set with `withGrades`, using only hands that have decisions. | yes | This keeps the normal suite fast (memory: slow tests opt-in). | Play every hand (too slow). |

## 3. Current system
- `src/stats/trends.ts` (TASK-11.1/11.2): `TrendHand.unhintedMajors` counts only unhinted Majors. A forced fold has no
  decision entry, so it never counts (`:98-103`, REQ-040.3, REQ-004.8). `orderHands` sorts by session start, then
  sessionId, then hand number (`:114-134`). `majorErrorPoints` uses `bbPer100(majors, 1, GROUP_SIZE)` (`:137-151`).
  `statisticsView(data)` orders lazily at most once (`:182-201`). `chartLabel(points)` (`:222-225`).
  `StatisticsView` = {hands, sessions, totals, chart, bb100} (`:80-86`).
- `bbPer100(result, bigBet, hands)` rounds half away from zero to tenths with integer arithmetic and never returns −0
  (`src/table/session-report.ts:146-151`).
- `StatisticsScreen.tsx`: `MajorErrorTrend` uses yMax = max(1, values) and y = round(150 − v/yMax × 140) (`:35-56`).
  `Bb100Trend` draws `p.stats-goal`, then the SVG with a dashed `line` (`strokeDasharray="6 5"`) (`:60-100`). The
  App calls `statisticsView(data)` with every stored hand (`src/ui/App.tsx:90`). Nothing filters today, so the
  default `all = data` makes the App need no change.
- CSS: `.stats-goal` amber #f0a030 (`src/ui/styles.css:1232-1246`), `.stats-break-even` stroke #f0a030 / 1.5 (`:1269-1272`).
- Storyboard: `dreams/limit-holdem-trainer/storyboards/Stats.dc.html:74` has the caption "Dashed line: half your
  first-1,000 rate (G-2)". `:46` has the dashed line, #F0A030, width 1.5, `6 5`.
- G-2 (`dreams/limit-holdem-trainer/requirements.md:8`, `vision.md:29`): the rate in hands 4,001–5,000 is at most half
  the rate in the first 1,000 hands. REQ-048.3/.9 (`requirements.md:881,887`). REQ-040.3 (`:724`).
- Fixtures: `tests/support/stat-records.ts` provides `statRecords(sessions, gradeFor)` (template clones with 4
  decisions), `nineSessions`, `forcedFoldRecord`, `cashPool(stake, hands)`, `sitAndGoPool(hands)` and `cloneRecords`.
  `graded` (`:47-56`) is private. `seatSession` accepts `players` (`src/table/session.ts:341-348`).
- Tests: Vitest `npm test` (with coverage, `src/stats/**` ≥ 90%). Acceptance files are `*.acceptance.test.*`.
  Playwright runs Chromium and WebKit. e2e uses `expectNoSeriousAxeViolations` and
  `seedStoredRecords`/`seedStoredSessions` (`e2e/statistics.spec.ts:1-4,45-47`).
- Tests that pin the Major chart's markup, scale, text or `StatisticsView` shape:

  | Test | Locked (owner) | Pins | Effect of this design |
  |---|---|---|---|
  | `tests/ui/statistics.acceptance.test.tsx` | yes (TASK-11.1) | `circle[data-point]` ×3, aria-label prefix `Major errors per 100 hands, one point`, exact `p.stats-note`, first `p.stats-message`; 1,840 hands → target present | Unchanged: the label only gains a suffix, the note is untouched, and the caption is a separate `p.stats-goal` |
  | `tests/stats/trend-view.acceptance.test.tsx` | yes (TASK-11.1) | `circle[data-point]` `<title>`s | Unchanged |
  | `tests/stats/trends.acceptance.test.ts` | yes (TASK-11.1) | Major points | Unchanged (`majorErrorPoints` untouched) |
  | `e2e/statistics.spec.ts` | yes (TASK-11.1) | img name prefix, 3 `circle[data-point]`, `.stats-message` count 0 (1,840 hands → the line appears) | Unchanged; axe still runs on that page with the new caption |
  | `e2e/play-money.spec.ts:109` | yes (TASK-2.15/10.2/11.1) | `.stats-message` on an empty store | Unchanged |
  | `tests/stats/bb100.acceptance.test.tsx` | yes (TASK-11.2) | `{...base, bb100}` spread (`:176`); Major card has no `stats-break-even` (`:206`) | Unchanged: the spread keeps `g2Target`, and the class is `stats-target` (A-5) |
  | `e2e/statistics-bb100.spec.ts` | yes (TASK-11.2) | BB card-scoped texts; Major img name prefix (`:77`) | Unchanged (1,500 hands → the Major card gains the line; all BB locators are card-scoped) |
  | `tests/stats/trends.test.ts:116-122` | no (TASK-11.1/11.2 unit) | `toEqual` on the whole empty `StatisticsView` | **Must change**: add `g2Target: null` |
  | `tests/stats/trends.test.ts:224-235` | no (TASK-11.2 unit) | a `StatisticsView` literal | **Must change**: add `g2Target: null` (required field) |
  | `tests/stats/trends.test.ts:123-160` | no | `.chart` `toEqual` | Unchanged (the target is not inside `chart`, D-1) |
  | `tests/storage/trend-data-3000.acceptance.test.ts:54` | no (opt-in slow) | `view.chart` `toEqual` with 3,000 hands | Unchanged (D-1) |
  | `e2e/statistics-speed.spec.ts` | no (opt-in) | `circle[data-point]` count | Unchanged |

- Existing code to reuse:
  - `src/stats/trends.ts::orderHands` → chronological order. `bbPer100` → target rounding (A-1). `countText` → none needed.
  - `src/ui/stats/StatisticsScreen.tsx::Bb100Trend` → the dashed-line and `p.stats-goal` pattern. `round`/`xOf` stay shared.
  - `tests/support/stat-records.ts::statRecords`, `nineSessions`, `forcedFoldRecord`, `cashPool`, `sitAndGoPool`,
    `cloneRecords`, `graded` (exported as `withGrades`) → fixtures.
  - `e2e/support/hand-records.ts::seedStoredRecords`/`seedStoredSessions`, `e2e/support/axe.ts::expectNoSeriousAxeViolations`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | `StatisticsView` gains a top-level `g2Target: number \| null` (null below 1,000 stored hands). `MajorErrorChart` is unchanged. | Put `target` inside the `points` chart variant. | `.chart` `toEqual` checks (`trends.test.ts:133,154`, `trend-data-3000…:54`) keep passing. The target belongs to all stored hands, not to the filtered chart. Only two unlocked unit lines change. | no | n/a |
| D-2 | `statisticsView(data, all = data)`. `g2Target` is computed from `all` (ordered by `orderHands`), while the chart, totals and BB/100 come from `data`. ACs #4/#5 ("filter set to …") are verified by passing filtered `TrendData` (records filtered by their real `gameType`, `seats.length` reference size, or `lineUp`) as `data` and every stored hand as `all`. TASK-11.4 and TASK-11.8 must call `statisticsView(filtered, all)`. | Build a game-type filter now; defer ACs #4/#5. | The filter UI is owned by TASK-11.4/11.8, the same as TASK-11.2 D-2 / Q-1. The signature fixes the contract that the target ignores filters. | yes (AC interpretation) | user (Q-1; ACs added to TASK-11.4 and TASK-11.8) |
| D-3 | Chart text: caption `Dashed line: half your first-1,000 rate (G-2)` (`p.stats-goal` above the Major SVG, only when the line is drawn). SVG aria-label gains the suffix `. Dashed target line at <t>` (t with one decimal, e.g. `…: 6.2, 6.2. Dashed target line at 3.1`). The note, point titles and existing label prefix are unchanged. | Drop "(G-2)" to match the BB card's "Dashed line: break-even" (TASK-11.2 D-4); no aria-label suffix. | The caption is quoted verbatim in the task description and the storyboard. The suffix lets screen-reader users hear the target value, which the visible chart only shows as a line. | yes (user-visible) | user (Q-2) |

## 5. Design

### Files to create / modify
- `src/stats/trends.ts` — `G2_BASELINE_HANDS`, `G2_CAPTION`, `g2Target`, `StatisticsView.g2Target`,
  `statisticsView(data, all?)`, `chartLabel(points, target?)`.
- `src/ui/stats/StatisticsScreen.tsx` — pass `view.g2Target` to `MajorErrorTrend`. Draw the caption and the dashed
  line, and widen yMax.
- `src/ui/styles.css` — add `.stats-target` to the `.stats-break-even` rule.
- `tests/support/stat-records.ts` — `export const withGrades = graded` (or rename and export it), plus an optional
  `players` on `cashPool(stake, hands, players = 6)` and `sitAndGoPool(hands, players = 6)`, passed to
  `seatSession`. **Builder, first step:** confirm that `sitAndGoPool(n, 2)` and `cashPool(stake, n, 9)` give records
  that pass `parseHandRecord` with `seats.length` 2 and 9. If not, stop and escalate; don't hand-forge records.
  Check what the existing default player count is first, and keep the default unchanged.
- `tests/stats/g2-target.acceptance.test.tsx` — new: AC#1–AC#5 at module + `renderToString` level.
- `tests/stats/trends.test.ts` — the two `g2Target: null` edits, plus unit cases (SPEC-06).
- `e2e/statistics-target.spec.ts` — new Playwright flow (Chromium, WebKit, axe, network).
- `docs/stats/trends.md` — G-2 target section.

### Components, interfaces and data
```ts
/** Hands in the G-2 baseline (REQ-048.9). */
export const G2_BASELINE_HANDS = 1000;
export const G2_CAPTION = 'Dashed line: half your first-1,000 rate (G-2)';   // D-3
export interface StatisticsView { /* existing */ readonly g2Target: number | null; }
/** Half the unhinted Major errors per 100 hands over the first G2_BASELINE_HANDS of `ordered` (all stored hands in
 *  orderHands order), rounded to tenths (A-1); null when fewer than G2_BASELINE_HANDS hands. */
export function g2Target(ordered: readonly TrendHand[]): number | null;
/** `data` drives totals and charts; `all` (every stored hand, default `data`) drives the G-2 target (D-2). */
export function statisticsView(data: TrendData, all?: TrendData): StatisticsView;
/** Existing text; with a non-null target, appends `. Dashed target line at ${target.toFixed(1)}` (D-3). */
export function chartLabel(points: readonly TrendPoint[], target?: number | null): string;
```
- `statisticsView`: `g2Target` is null when `all.hands.length < 1000`. Otherwise it is `g2Target(all === data ?
  order() : orderHands(all))`, so the ordering is reused when there is no filter.
- `MajorErrorTrend({ points, target })`: when `target !== null`, it renders `p.stats-goal` `G2_CAPTION` before the SVG.
  Inside the SVG, after `line.stats-baseline` and before the polyline, it draws
  `<line x1="0" y1={ty} x2="400" y2={ty} strokeDasharray="6 5" className="stats-target" />`. The SVG `aria-label` is
  `chartLabel(points, target)`. When `target === null`, the output is byte-identical to today's.

### Rules and algorithms
- Baseline order: `orderHands(all)` (session start, else earliest completedAt, then sessionId, then hand number).
  Take the first 1,000 and sum `unhintedMajors`. Hinted decisions and forced folds contribute 0 (`trendHand`).
- Target (A-1): `bbPer100(m, 2, 1000)`. Examples: m = 62 → 3.1; m = 63 → 3.2 (3.15 rounds away from zero); m = 0 → 0;
  m = 62 unhinted + 20 hinted → 3.1.
- Threshold: 999 hands → null; 1,000 → value. Hands 1,001+ never change the value.
- Geometry (A-4): yMax = max(1, values…, target). ty = round(150 − target / yMax × 140).
  - Points [6.2, 6.2], target 3.1 → yMax 6.2, ty = 80, points at y 10.
  - Points [1.0] (a filtered set), target 3.1 → yMax 3.1, ty = 10, point y = 104.8.
  - Target 0 → ty = 150 (on the baseline, still drawn).

### Error handling and configuration
- No new errors. `g2Target` of fewer than 1,000 hands returns null. A read failure or loading state is unchanged
  (TASK-11.1 D-7, A-10): no chart, no caption.
- No configuration.

## 6. Behaviour specification

### SPEC-01: 999 stored hands → no target line
- Verifies: AC#1, DoD#1
- Behaviour: Given 999 stored hands (`statRecords` template clones over 2 sessions, with some unhinted Majors), When the view is computed and `StatisticsScreen` renders, Then `view.g2Target` is null, the Major
  card plots 1 `circle[data-point]`, contains no `stats-target` line and no `Dashed line: half your first-1,000 rate
  (G-2)` text, and its aria-label has no `Dashed target line`.
- Verification: acceptance `tests/stats/g2-target.acceptance.test.tsx::AC#1 999 stored hands draw no target line`

### SPEC-02: 1,000 hands with 62 unhinted Majors → dashed line at 3.1
- Verifies: AC#2
- Behaviour: Given exactly 1,000 stored hands whose decisions hold 62 unhinted Majors (31 in each 500-hand group) and
  otherwise Correct/Minor grades, When rendered, Then `view.g2Target` = 3.1, and the Major SVG contains exactly one
  `line.stats-target` with `stroke-dasharray="6 5"`, x1 = 0, x2 = 400, y1 = y2 = 80 (points [6.2, 6.2], §5).
  `G2_CAPTION` appears once in the Major card as `p.stats-goal`, and the aria-label ends with
  `. Dashed target line at 3.1`.
- Verification: acceptance `tests/stats/g2-target.acceptance.test.tsx::AC#2 1,000 hands with 62 unhinted Majors draw a dashed target line at 3.1`

### SPEC-03: Hinted Majors, later hands and forced folds don't move the target
- Verifies: AC#3
- Behaviour: Given 1,500 hands over sessions whose sessionId order differs from their start order (`nineSessions`-
  style), where the first 1,000 chronological hands hold 62 unhinted and 20 hinted Majors and one forced-fold record
  (`forcedFoldRecord`), and hands 1,001–1,500 hold 40 more unhinted Majors, When the target is computed
  (`statisticsView(...).g2Target`), Then it is 3.1. The test also recomputes it independently from the records: sort
  by session `startedAt` then hand number, take 1,000, count decisions with `grade.grade === 'major' && !hinted`,
  ÷ 1,000 × 100 ÷ 2.
- Verification: acceptance `tests/stats/g2-target.acceptance.test.tsx::AC#3 the target counts only unhinted Majors in the first 1,000 chronological hands`

### SPEC-04: The threshold counts all stored hands, not the filter
- Verifies: AC#4
- Behaviour: Given 1,000 stored hands, 600 cash clones of a real cash pool and 400 clones of a real sit-and-go pool,
  where 60 hands have a hinted decision (`withGrades`), When the view is `statisticsView(cashOnly, all)` with `cashOnly`
  = the records with `gameType === 'cash'` (600 hands, game type Cash), Then the Major card plots 1 point, draws one
  `line.stats-target` and shows `G2_CAPTION`, and `view.g2Target` is not null. Given the same records minus one
  (999 in `all`), the Cash view has no target line.
- Verification: acceptance `tests/stats/g2-target.acceptance.test.tsx::AC#4 with a Cash filter of 600 hands the line still shows once 1,000 hands are stored`

### SPEC-05: The target ignores every filter
- Verifies: AC#5
- Behaviour: Given, in chronological order, 600 cash 6-max hands, then 400 sit-and-go heads-up hands (first 1,000:
  62 unhinted Majors, baseline 6.2), then 200 more sit-and-go heads-up hands and 500 cash full-ring (9-player) hands,
  each with many unhinted Majors, When `statisticsView(filtered, all)` is computed for each filter (game type All /
  Cash / Sit-and-go; table size Heads-up (2 seats) / 6-max (3–7) / Full ring (8–10); line-up = each `lineUp` value
  present in the records), Then every view has `g2Target` = 3.1, and every view whose chart has points renders
  `line.stats-target` at y = round(150 − 3.1 / yMax × 140) for that view's own yMax (A-4).
- Verification: acceptance `tests/stats/g2-target.acceptance.test.tsx::AC#5 the target stays at 3.1 under every table size, game type and line-up filter`

### SPEC-06: Unit rules
- Verifies: AC#1, AC#2, AC#3
- Behaviour: `g2Target` of 999 ordered hands → null. Of 1,000 hands with m = 62 → 3.1, m = 63 → 3.2, m = 0 → 0. Of
  1,200 hands with all extra Majors in 1,001+ → unchanged. `statisticsView(data)` equals
  `statisticsView(data, data)`. `G2_CAPTION` equals the D-3 text. `chartLabel(points)` is unchanged and
  `chartLabel(points, 3.1)` = `Major errors per 100 hands, one point per 500 hands: 6.2, 6.2. Dashed target line at 3.1`.
  The geometry examples in §5 hold (ty 80, 10, 150), and with `g2Target: null` the Major SVG markup equals the
  pre-change markup (no `stats-target`, no `stats-goal` in the Major card). The two `g2Target: null` edits in
  `trends.test.ts:116-122,224-235` are made.
- Verification: unit `tests/stats/trends.test.ts::computes the G-2 target, its label and line geometry`

### SPEC-07: Browser flow, axe and network
- Verifies: AC#2, DoD#7, DoD#8
- Behaviour: Given 1,000 records with 62 unhinted and 20 hinted Majors seeded with
  `seedStoredRecords`/`seedStoredSessions` and a reload, When Statistics opens from Home, Then the Major region shows
  `Dashed line: half your first-1,000 rate (G-2)`, its img's name ends with `Dashed target line at 3.1`, and the img
  contains one `line.stats-target`. axe reports zero serious/critical violations, and every request has the app's
  origin. This runs in Chromium and WebKit.
- Verification: acceptance `e2e/statistics-target.spec.ts::Statistics draws the G-2 target line once 1,000 hands are stored`

### SPEC-08: Project checks
- Verifies: DoD#2, DoD#4, DoD#5, DoD#10
- Behaviour: Lint (including the headless boundary on `src/stats/trends.ts`), typecheck, and the full Vitest suite
  with coverage pass with zero errors. `src/stats/**` stays ≥ 90% lines and overall ≥ 70%. Every locked Statistics
  test (TASK-11.1, TASK-11.2) passes unedited. CI is green on the branch.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run e2e`

### SPEC-09: Documentation
- Verifies: DoD#11
- Behaviour: `docs/stats/trends.md` documents the G-2 baseline (first 1,000 chronological hands, unhinted only,
  filter-independent), the target rounding (A-1), the 1,000-hand threshold, the caption and the `statisticsView(data,
  all)` contract for filters. The story doc is published to Backlog.
- Verification: manual `docs/stats/trends.md` G-2 target section and the TASK-11.3 entry in `backlog doc list --plain`

### SPEC-10: Not-applicable DoD items
- Verifies: DoD#3, DoD#6, DoD#9, DoD#12
- Behaviour: No engine, bots or advice change, so the golden-spot suite (run by `npm test`) and the 10,000-hand
  playtest are unaffected. No strategy content. No service worker exists yet (E13-S07).
- Verification: manual `git diff --stat main -- src/engine src/bots src/advice` is empty

## 7. Edge cases
- 999 / 1,000 boundary: SPEC-01, SPEC-02, SPEC-04 (999 in `all`), SPEC-06.
- Hinted Majors, forced folds, Majors after hand 1,000, session order ≠ id order: SPEC-03, SPEC-06.
- Target 0 (no unhinted Majors in the first 1,000): SPEC-06 (line on the baseline). Half-tenth rounding: SPEC-06.
- Target above every filtered point: SPEC-05, SPEC-06 (A-4).
- Filter with fewer than 500 hands: no chart, so no line (A-3). Reachable only once TASK-11.4 exists.
- Loading or read failure: unchanged, no caption (covered by locked TASK-11.1 tests).
- Concurrency: none (a read-only transaction).

## 8. Security considerations
- Trust boundary: stored hand values, already validated by `parseHandRecord` in `trendData()`. The target uses only
  `unhintedMajors`.
- React escapes all text. No `dangerouslySetInnerHTML`.
- No new dependencies and no network (SPEC-07). No secrets, authn/authz or randomness.

## 9. Non-functional
- Per opening: no extra IndexedDB reads. The target is one O(1,000) sum on the existing ordering, and no second sort
  when `all === data`.
- Normal suite cost: ≤ 40 real played hands (pools), with the rest cloned. No custom timeouts and no new slow checks.
- Accessibility: the target value is in the SVG's accessible name, and the caption is visible text in the existing
  axe-clean amber style. axe is clean (SPEC-07).
- Coverage ≥ 90% lines for `src/stats/**`, ≥ 70% overall.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev` → Home → Statistics → read the "Major errors per 100 hands" card → "← Home"
- New tests:
  - `tests/stats/g2-target.acceptance.test.tsx` → SPEC-01..SPEC-05
  - `tests/stats/trends.test.ts` (added cases + two `g2Target: null` edits) → SPEC-06
  - `e2e/statistics-target.spec.ts` → SPEC-07
- Judge's end-to-end scenario: run `npx playwright test e2e/statistics-target.spec.ts e2e/statistics.spec.ts
  e2e/statistics-bb100.spec.ts`. With 1,000 seeded hands the Major card shows the caption and a dashed amber line at
  3.1, and the 1,840- and 1,500-hand pages still pass. Then `npm run dev`, play a few hands, and open Statistics:
  with fewer than 1,000 hands there is no caption or line.

## 11. Open questions
None. Q-1 (D-2) and Q-2 (D-3) answered in `doit/TASK-11.3/qa.md`. The G-2 "met" check in TASK-11.11 compares the
exact rate, not the rounded target (note added to TASK-11.11).

## 12. Clarifications log
See `doit/TASK-11.3/qa.md`.
