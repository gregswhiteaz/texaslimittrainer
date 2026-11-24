# Spec: TASK-10.3 — See my five style stats against healthy ranges for my table size

Status: READY (approved 2026-11-24)
Task: TASK-10.3 · Parent/epic: TASK-10 · Requirements: REQ-044 (044.4, 044.10, 044.11), REQ-045, REQ-046, REQ-061 (061.2), REQ-005.4 · Dream: limit-holdem-trainer

## 1. Summary
The Session Report gains a section "Your style vs healthy range (<reference size>)" with one row each for VPIP,
PFR, Aggression, WTSD and W$SD. Each row shows the user's value over the session's stored hands (one decimal),
the authored healthy range for the session's reference size, and a label: "in range", "too high", "too low", or
"not enough data" for a "—" value. The 15 healthy ranges (5 stats × heads-up, 6-max, full ring) ship as an
original data file with a one-sentence justification each. The style counts are computed from the session's
hand records when the session ends and are stored in the write-once report.

## 2. Scope
- In scope:
  - `src/stats/healthy-ranges.json`: the 15 authored ranges with justifications (§5 table).
  - `src/stats/healthy-ranges.ts`: load and validate the file, map table size to reference size, label rule,
    build the section view.
  - `src/table/session-report.ts`: optional `style` (StyleCounts) on `SessionReport`; `sessionReport(…)` takes
    the session's hand records; `parseSessionReport` validates `style` when present.
  - `src/storage/hand-store.ts`: `endSession` reads the session's hand records in its transaction and stores the
    user's style counts in the report.
  - `src/ui/report/ReportScreen.tsx` + `src/ui/styles.css`: the style section.
  - Tests (unit, acceptance, one opt-in slow 100,000-hand check, one Playwright flow with axe) and docs.
- Not doing:
  - Error rates, hint usage, hands tile (TASK-10.4); leaks (TASK-10.5+); sit-and-go finishing position (TASK-10.12).
  - Statistics screen / lifetime stats against ranges (TASK-11.8, TASK-11.10).
  - The storyboard's coloured band-and-dot bar per row (A-6).
  - Showing the justification sentences on the report (A-5).
  - Back-filling `style` into reports already stored without it (A-4); no DB version change.
  - Any change to bots, advice, engine or the style-stat formulas (`src/stats/style-stats.ts` unchanged).
  - Reopening reports from Home (REQ-044.7 Home snapshot is a later story).
- Scope budget: files=18, lines=1150

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Values are shown and labelled at one decimal. `tenths = floor((2000 × part + whole) / (2 × whole))` (integer, half-up; all inputs ≥ 0), displayed as `(tenths/10).toFixed(1) + '%'`, e.g. `25.0%`. The label compares the same rounded tenths with `low × 10` and `high × 10` (both inclusive), so the shown value and its label always agree. | yes | AC#3 asks `25.0%`; AC#4 uses 28.0/28.1. Same integer rounding style as `bbPer100` (`src/table/session-report.ts:82-86`). `formatStat` (`src/stats/style-stats.ts:122-124`) is whole-number, used by the HUD; left unchanged. | Compare the unrounded value (a shown `28.0%` could then read "too high") |
| A-2 | Reference size comes from the session's configured table size (`report.players`, i.e. `config.players`), not the number of seats dealt in on a given hand. Approximate iff players ∈ {3, 4, 5, 7, 8} (REQ-005.4; same exact set as `playersNote`, `src/ui/config/GameConfigScreen.tsx:63-67`). Mapping reuses `referenceSizeOf` (`src/advice/preflop.ts:60-65`). | yes | The task says "table sizes map to reference sizes"; the session is configured at one size. | Majority dealt-in count over the session's hands |
| A-3 | Section text. Heading `<h2>`: `Your style vs healthy range (6-max)`; approximate: `Your style vs healthy range (6-max, approximate)`. Size names `heads-up`, `6-max`, `full ring` (as `TABLE_SIZE_NAMES`, `src/ui/config/GameConfigScreen.tsx:45-49`). Row names `VPIP`, `PFR`, `Aggression`, `WTSD`, `W$SD`. Row text `VPIP You 25.0% · healthy 20–28% · in range` (storyboard `Report.dc.html:40`; en dash in the range). A "—" row: `WTSD You — · healthy 30–42% · not enough data`. | yes | Task gives the heading pattern; storyboard gives the row pattern; the approximate marker wording is new. | A separate note line "Approximate: 4 players use the 6-max ranges." |
| A-4 | Reports stored before this story have no `style`; `parseSessionReport` accepts that and the screen omits the section for them. `sessionReport(session, endedAt)` with `hands` omitted or empty also omits `style` (key absent). | yes | Write-once reports (REQ-052.5) cannot be back-filled; the absent key keeps the locked TASK-10.1/TASK-2.7/TASK-10.2 report assertions that build reports without hands unchanged (§5 "Locked tests"). | Recompute legacy reports from hand records on open |
| A-5 | The report row shows value, range and label only; the justifications live in the data file and `docs/stats/healthy-ranges.md`. | yes | AC#3 and REQ-044.4 list exactly value, range, label. | A tooltip or expandable "why" per row |
| A-6 | No band-and-dot bar (storyboard `Report.dc.html:42-45`). | yes | The app uses no inline styles (`grep 'style={{' src/ui` is empty); a bar adds no information beyond the text and label. Can be added with the Statistics screen. | Render the bar with CSS custom properties |
| A-7 | When ending a session, a hand record that fails `parseHandRecord` or is missing is skipped (not counted); the session still ends. So `style.handsDealt` may be below `handsPlayed`; validation allows `1 ≤ handsDealt ≤ handsPlayed`. | yes | A corrupt hand record must not make the session impossible to end (Leave table would fail forever). Records are written with the session record in one transaction (`src/storage/hand-store.ts:120-131`), so in practice all are present. | Abort the end (RangeError) like an invalid session record |
| A-8 | `endSession` reads hand records with one `get([sessionId, n])` per n = 1…handsPlayed in the same transaction, not `getAll(IDBKeyRange…)`. | yes | The Vitest environment is `node` (`vite.config.ts:8`) with no global `IDBKeyRange`; the tests pass a fake-indexeddb factory only (`tests/storage/session-end.acceptance.test.ts:61-62`). | Inject a key-range constructor into `openHandStore` |
| A-9 | The AC#2 100,000-hand check runs in the opt-in slow group (`TLH_SLOW_TESTS=1`, added to `npm run test:slow`); it takes about 2 minutes. No fast sampled variant. | yes | Standing rule: multi-minute scale checks are opt-in. Same pattern as `tests/bots/style-bands.acceptance.test.ts:13,99-103`. | A 5,000-hand fast check with wider tolerance |
| A-10 | Healthy-range limits are whole percents 0–100 with `low < high`; a justification is one sentence: trimmed, non-empty, ends with `.`, and contains no `.`, `!` or `?` followed by whitespace. | yes | AC#1 wording; whole numbers match the storyboard `20–28%`. | One-decimal limits |
| A-11 | The data file follows the bot style file convention: `{"format": "tlh-healthy-ranges", "version": 1, "ranges": {...}}`, imported with `with { type: 'json' }` and validated at module load (`src/bots/tag.ts:12-15`). | yes | Existing convention for shipped strategy data. | TS constant |

## 3. Current system
- Style stats: `src/stats/style-stats.ts` — `StatHand` (`:5-13`), `StyleCounts` (`:15-32`), `EMPTY_STYLE_COUNTS`
  (`:34-43`), `handStyleCounts(hand, seat)` (`:46-73`), `styleCounts(hands, seat)` (`:89-93`), `NO_STAT` `'—'`
  (`:119`). Rules documented in `docs/stats/style-stats.md`. A forced fold (TASK-10.2) is an ordinary `fold`
  `ActionRecord` of the user (`src/table/hand-record.ts:98-101,231`), so it counts as a fold with no change.
- Hand records: `HandRecord` (`src/table/hand-record.ts:73-108`) has `userSeat`, `seats`, `actions`, `board`,
  `result` — it satisfies `StatHand`. `parseHandRecord` at `src/table/hand-record.ts:463`. Key
  `[sessionId, handNumber]` (`src/storage/hand-store.ts:28`).
- Report: `SessionReport`, `sessionReport`, `parseSessionReport`, `reportView` in `src/table/session-report.ts`
  (`:21-36`, `:90-118`, `:144-171`, `:186-204`). TASK-10.1 A-1 (`doit/TASK-10.1/spec.md:42`) planned a later
  `hands` argument. TASK-10.1 D-1 (approved Q-1) stores computed values in the write-once report rather than
  recomputing at display.
- Ending: `ended(db, sessionId, endedAt)` (`src/storage/hand-store.ts:64-104`), one strict transaction over
  `sessions` and `reports`; all steps inside request callbacks.
- Screen: `src/ui/report/ReportScreen.tsx:5-35` (h1, header line, `<dl class="report-kpis">`, one button);
  CSS `src/ui/styles.css:102-150`. Storyboard `dreams/limit-holdem-trainer/storyboards/Report.dc.html:34-47`.
- Reference sizes: `ReferenceSize` (`src/advice/preflop-chart.ts:3`), `referenceSizeOf` (`src/advice/preflop.ts:60-65`).
- Bot bands: REQ-027 TAG band VPIP 18–26, PFR 14–22, Aggression 45–65 (`src/playtest/style-check.ts:29-34`); no
  bands exist for WTSD or W$SD. No healthy ranges exist anywhere in `src` or `docs`.
- Measured TAG harness stats (all-TAG cash table, `runPlaytest({hands, seed, size, game:'cash'})`, every seat,
  shared style-stat functions; measured for this spec):

  | Size, hands, seed | VPIP | PFR | Aggression | WTSD | W$SD |
  |---|---|---|---|---|---|
  | 6, 100,000, 42 | 22.20 | 16.22 | 63.12 | 94.39 | 49.91 |
  | 6, 100,000, 7 | 22.32 | 16.26 | 63.36 | 94.27 | 49.95 |
  | 2, 30,000, 42 | 79.63 | 47.21 | 63.15 | 86.04 | 52.39 |
  | 10, 30,000, 42 | 14.05 | 10.42 | 62.49 | 94.58 | 48.00 |
  | 9, 30,000, 42 | 15.16 | 11.26 | 62.95 | 94.59 | 48.61 |

  TAG bots fold after the flop in about 3.4% of the hands in which they see it (3,000 6-max hands: 98 folds in
  2,855 seat-hands that saw the flop). This is why WTSD is ~94% (see Q-2).
- Tests: `npm test` = `vitest run --coverage` (`package.json`); acceptance tests are `*.acceptance.test.*`;
  slow opt-in via `TLH_SLOW_TESTS=1` and the `test:slow` script list; e2e `playwright test` in Chromium and
  WebKit (`playwright.config.ts:13-15`), axe via `axeWithPausedClock` (`e2e/support/paused-clock`).
- Existing code to reuse:
  - `src/stats/style-stats.ts` → `styleCounts`, `handStyleCounts`, `StyleCounts`, `EMPTY_STYLE_COUNTS`, `NO_STAT`.
  - `src/advice/preflop.ts:60` → `referenceSizeOf`; `src/advice/preflop-chart.ts:3` → `ReferenceSize`.
  - `src/table/hand-record.ts:162` → `isWhole` for count validation; `:463` `parseHandRecord`.
  - `src/table/session.ts:407` → `MAX_SESSION_COUNT`.
  - `tests/support/session-play.ts:44` `playSession` + `handWrite` (`src/table/session-record.ts:119`) → real
    stored hands in storage tests (as `tests/storage/session-end.acceptance.test.ts:25-41`).
  - `e2e/session-report.spec.ts:36-60` flow (`openPausedClock`, `startGame`, `playToResult`, Leave table) and
    `e2e/support/hand-records` (`storedRecords`, `storedReports`) → copy into the new e2e file.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Persisted format: the report gains optional `style: StyleCounts` (the user's 8 counts over the session's stored hands), written once at session end. Ranges, labels and reference size are derived at display from `players` and the shipped data file. No DB version change. | (b) Also snapshot the 5 ranges used into the report so an old report never changes if ranges are revised. (c) Store nothing; read the hand records each time the report opens. | Matches TASK-10.1 D-1 (store computed values once). Counts are the minimum that reproduces every shown number; ranges are versioned app data ("Strategy data … new app version only", requirements.md:963). | yes | user (Q-1) |
| D-2 | AC#2 vs WTSD: the TAG harness WTSD is ~94% (6-max). WTSD ranges are authored realistically (heads-up 40–55, 6-max 30–42, full ring 28–40); AC#2 (reworded in Backlog) checks only VPIP, PFR, Aggression and W$SD against the 6-max ranges. The WTSD bot check moves to TASK-7.32, which investigates the near-zero postflop folding. | (b) Keep AC#2 for all five and set WTSD to include the bots (HU 80–95, 6-max 88–98, full ring 88–98). (c) Block this story until the postflop advice folds more. | (b) would teach that reaching showdown with 9 of 10 flops is healthy. A user who follows the advice will see WTSD "too high" until the follow-up lands; that mismatch is the signal the follow-up investigates. | yes | user (Q-2) |
| D-3 | Locked tests the build must edit (owner in brackets), both caused by D-1: (1) `tests/storage/session-end.acceptance.test.ts:68` [TASK-10.1] — compare with `sessionReport(stored, ended, hands)` where `hands` = the 3 stored records (`await store.get(SESSION_A, n)` for n = 1..3). (2) `e2e/session-report.spec.ts:113` [TASK-10.1] — compare with `sessionReport(ended, new Date(endedAt), await storedRecords(page) as HandRecord[])`. Nothing else in those tests changes. | Keep `style` out of stored reports (D-1 c) | These two compare a store-written report (now with `style`) to a hand-less `sessionReport(…)`. Checked unchanged (no `style` because no hands are passed or stored, A-4): `tests/table/session-report.acceptance.test.ts` [TASK-10.1], `tests/storage/end-paused.acceptance.test.ts` [TASK-2.7] (seeds sessions without hand records), `tests/table/leave-mid-hand.acceptance.test.ts` [TASK-10.2] (`.handsPlayed`/`.cash` only), `tests/ui/report-screen.acceptance.test.tsx` [TASK-10.1] (reports without `style`: no section; one button after `</dl>` holds), `e2e/leave-mid-hand.spec.ts` [TASK-10.2] (`handsPlayed` only), `e2e/play-money.spec.ts` [TASK-2.15/10.2] (section text has no offer phrase), `tests/ui/screen-list.acceptance.test.ts` [TASK-2.15] (no new screen). `.report-kpi dt` list (`e2e/session-report.spec.ts:94`) unchanged: the section uses its own classes. | yes (locked edits) | user (Q-1; both tests unlocked under TASK-10.1) |
| D-4 | The 15 ranges and justifications in §5 are authored for this project (original text). | Derive from published charts | REQ-061.2, DoD#1/#10. | yes | user (Q-2) |

## 5. Design

### Files to create / modify
- `src/stats/healthy-ranges.json` — new: the 15 ranges (A-11 format).
- `src/stats/healthy-ranges.ts` — new: types, `parseHealthyRanges`, `HEALTHY_RANGES`, `statTenths`,
  `rangeLabel`, `styleSection`.
- `src/table/session-report.ts` — modify: `style?` field, `sessionReport` `hands` parameter, `style` validation.
- `src/storage/hand-store.ts` — modify: `ended` reads hand records and passes them to `sessionReport`.
- `src/ui/report/ReportScreen.tsx` — modify: render the style section when `report.style` is present.
- `src/ui/styles.css` — modify: section styles (dark panel as `.report-kpi`; label colours by `data-label`).
- `tests/stats/healthy-ranges.acceptance.test.ts` — new (SPEC-01, 04, 05, 06, 07).
- `tests/stats/healthy-ranges.test.ts` — new (SPEC-08, SPEC-09).
- `tests/stats/healthy-ranges-tag.acceptance.test.ts` — new, slow opt-in (SPEC-02).
- `tests/table/session-report-style.acceptance.test.ts` — new (SPEC-03, SPEC-10, SPEC-11).
- `tests/ui/report-style.acceptance.test.tsx` — new (SPEC-03, SPEC-06, SPEC-07, SPEC-12).
- `tests/storage/session-end-style.test.ts` — new (SPEC-13).
- `e2e/report-style.spec.ts` — new (SPEC-14).
- `tests/storage/session-end.acceptance.test.ts` — locked edit (D-3 (1)).
- `e2e/session-report.spec.ts` — locked edit (D-3 (2)).
- `package.json` — add `tests/stats/healthy-ranges-tag.acceptance.test.ts` to `test:slow`.
- `docs/stats/healthy-ranges.md` — new: the ranges table with justifications, label rule, mapping.
- `docs/storage/reports.md` — modify: `style` field, ending reads hand records, legacy reports.

### Components, interfaces and data
`src/stats/healthy-ranges.ts` (headless; imports only `../advice/preflop`, `../advice/preflop-chart` types,
`./style-stats`, the JSON):
```ts
export type StyleStatKey = 'vpip' | 'pfr' | 'aggression' | 'wtsd' | 'wsd';
export const STYLE_STAT_KEYS: readonly StyleStatKey[] = ['vpip', 'pfr', 'aggression', 'wtsd', 'wsd'];
export const STYLE_STAT_NAMES: Readonly<Record<StyleStatKey, string>> =
  { vpip: 'VPIP', pfr: 'PFR', aggression: 'Aggression', wtsd: 'WTSD', wsd: 'W$SD' };
export interface HealthyRange { readonly low: number; readonly high: number; readonly justification: string }
export type HealthyRanges = Readonly<Record<ReferenceSize, Readonly<Record<StyleStatKey, HealthyRange>>>>;
/** RangeError('Invalid healthy ranges: <path>'), path e.g. 'format', 'ranges', 'ranges.6-max',
 *  'ranges.6-max.vpip.low', 'ranges.6-max.vpip.justification'. Exactly the 3 sizes and 5 stats; no extra keys. */
export function parseHealthyRanges(value: unknown): HealthyRanges;
export const HEALTHY_RANGES: HealthyRanges; // parseHealthyRanges(json) at module load
/** floor((2000·part + whole) / (2·whole)); null when whole === 0. */
export function statTenths(part: number, whole: number): number | null;
export type RangeLabel = 'in range' | 'too high' | 'too low' | 'not enough data';
export function rangeLabel(tenths: number | null, range: HealthyRange): RangeLabel;
export interface StyleRow {
  readonly key: StyleStatKey; readonly name: string;
  readonly value: string;   // '25.0%' or '—'
  readonly range: string;   // '20–28%'
  readonly label: RangeLabel;
}
export interface StyleSection {
  readonly reference: ReferenceSize; readonly approximate: boolean;
  readonly title: string;   // 'Your style vs healthy range (6-max)' / '(6-max, approximate)'
  readonly rows: readonly StyleRow[]; // STYLE_STAT_KEYS order
}
/** RangeError from referenceSizeOf for players outside 2..10. */
export function styleSection(players: number, counts: StyleCounts, ranges?: HealthyRanges): StyleSection;
```
Numerators/denominators per row: vpip `voluntary/handsDealt`, pfr `preflopRaised/handsDealt`, aggression
`postflopAggressive/(postflopAggressive+postflopCalls)`, wtsd `showdowns/sawFlop`, wsd `showdownsWon/showdowns`
(same as `styleStats`, `src/stats/style-stats.ts:108-116`).

`src/table/session-report.ts`:
```ts
export interface SessionReport { …existing…; /** Absent on reports without stored hands (A-4). */ readonly style?: StyleCounts }
export type ReportHand = StatHand & { readonly userSeat: SeatNumber }; // HandRecord satisfies it
export function sessionReport(session: SessionRecord, endedAt: Date, hands?: readonly ReportHand[]): SessionReport;
```
`style` = sum over `hands` of `handStyleCounts(hand, hand.userSeat)`; key present iff `hands` has ≥ 1 element.
`parseSessionReport` when `style !== undefined`: object; each of the 8 fields whole (`isWhole`), ≥ 0, ≤
`Number.MAX_SAFE_INTEGER`; `1 ≤ handsDealt ≤ handsPlayed`; `voluntary ≤ handsDealt`; `preflopRaised ≤ voluntary`;
`sawFlop ≤ handsDealt`; `showdowns ≤ sawFlop`; `showdownsWon ≤ showdowns`. Failure →
`RangeError('Invalid session report: style.<field>')` (`style` for a non-object), checked in the field order of
`StyleCounts` with each inequality reported on its left-hand field.

`src/storage/hand-store.ts` `ended`: transaction scope `[SESSIONS_STORE, REPORTS_STORE, HANDS_STORE]`. After the
session parses with handsPlayed ≥ 1: issue `hands.get([sessionId, n])` for n = 1…handsPlayed; when the last
callback has fired, collect values that parse with `parseHandRecord` (others skipped, A-7) in hand-number order,
then `report = sessionReport(session, endedAt, records)`, put the session with `endedAt`, add the report — all
in request callbacks of the same transaction (as today). A `sessionReport` throw aborts as today.

`ReportScreen` adds, after the KPI `<dl>` (or after the header for a sit-and-go) and before the button, only
when `report.style` is defined:
```html
<section class="report-style" aria-labelledby="report-style-title">
  <h2 id="report-style-title">Your style vs healthy range (6-max)</h2>
  <ul class="report-style-rows">
    <li class="report-style-row" data-stat="vpip"><span class="report-style-name">VPIP</span> <span class="report-style-value">You 25.0%</span> · <span class="report-style-range">healthy 20–28%</span> · <strong class="report-style-label" data-label="in-range">in range</strong></li>
    … one li per stat, STYLE_STAT_KEYS order …
  </ul>
</section>
```
`data-label` is `in-range | too-high | too-low | no-data`. No hooks, no effects; the view is computed during
render from props.

### Rules and algorithms
- Reference size (A-2): 2 → heads-up; 3–7 → 6-max; 8–10 → full ring. Approximate iff players ∈ {3,4,5,7,8}.
- Label (A-1, REQ-044.11, REQ-044.10): `tenths === null` → `not enough data`; `tenths > high×10` → `too high`;
  `tenths < low×10` → `too low`; else `in range`.
- Worked example AC#3 (6-max, counts `{handsDealt 100, voluntary 25, preflopRaised 18, postflopAggressive 11,
  postflopCalls 9, sawFlop 20, showdowns 6, showdownsWon 3}`): VPIP 250 tenths `25.0%`; PFR 180 `18.0%`;
  Aggression 11/20 → 550 `55.0%`; WTSD 6/20 → 300 `30.0%`; W$SD 3/6 → 500 `50.0%`. With the §5 6-max ranges:
  VPIP 20–28 in range, PFR 14–22 in range, Aggression 50–66 in range, WTSD 30–42 in range (Q-2), W$SD 47–57 in range.
- AC#3 hand set (100 synthetic `ReportHand`s, userSeat 1, 6 seats): H1–H18 user preflop `raise`; H19–H25 user
  preflop `call`; H26–H100 user preflop `fold` (board `[]`, endedBy `fold`). H16–H18 and H24–H25 then `fold`
  preflop to a re-raise (board `[]`). H1–H15 and H19–H23 see the flop (20). Postflop: H1–H11 one flop `bet` each
  (11); H12–H15 and H19–H23 one flop `call` each (9). H1–H6 end by showdown with a 5-card board and no user fold
  (6); in H1–H3 an award lists seat 1 with amount > 0 (3 won), in H4–H6 another seat wins. H7–H15 and H19–H23 the
  user `fold`s on the turn (endedBy `fold`). Totals give exactly the counts above.
- AC#4 counts (fixture 6-max VPIP 20–28, other ranges from `HEALTHY_RANGES`): handsDealt 1000 with voluntary 280,
  200, 281, 199 (preflopRaised 0) → 280, 200, 281, 199 tenths → `in range`, `in range`, `too high`, `too low`.
- AC#7 counts: `{handsDealt 10, voluntary 2, preflopRaised 1, postflopAggressive 0, postflopCalls 0, sawFlop 0,
  showdowns 0, showdownsWon 0}` → Aggression, WTSD, W$SD `—` / `not enough data`; VPIP `20.0%`, PFR `10.0%`.

Healthy ranges (whole percents; WTSD per Q-2):

| Size | Stat | Low–high | Justification (exact text for the data file) |
|---|---|---|---|
| heads-up | VPIP | 65–90 | Heads-up you post a blind in every hand against a single opponent, so most starting hands are worth playing and folding much more than a third of them gives your blinds away. |
| heads-up | PFR | 40–75 | With only one opponent the first raise often takes the pot straight away, so you should raise most hands you play from the button and a fair share from the big blind. |
| heads-up | Aggression | 50–70 | One opponent misses the flop most of the time, so your bets and raises should clearly outnumber your calls, while some calls with strong hands let a bluffer keep betting. |
| heads-up | WTSD | 40–55 | Heads-up even ace-high often wins, so you should reach showdown in a large share of the flops you see, but not with every hand that misses. |
| heads-up | W$SD | 46–56 | Heads-up you should win about half of your showdowns, since a much higher rate means you fold too often and a much lower one means you call with too little. |
| 6-max | VPIP | 20–28 | At six players about one hand in four is strong enough to play, because the blinds come round often but several opponents still act after you. |
| 6-max | PFR | 14–22 | Most hands worth playing at six players are worth a raise, so your raising rate should sit only a few points below your VPIP. |
| 6-max | Aggression | 50–66 | In fixed limit the bettor wins the pot whenever everyone folds, so after the flop a solid player bets and raises more often than they call. |
| 6-max | WTSD | 30–42 | At six players you should go to showdown with roughly a third of the flops you see, folding the hands that miss and cannot pay the price of a bet. |
| 6-max | W$SD | 47–57 | A sound six-player style wins about half of its showdowns or a little more, and a much lower rate means you call down with too many weak hands. |
| full ring | VPIP | 13–20 | With nine or ten players someone behind you holds a strong hand more often, so only about one hand in six is worth playing. |
| full ring | PFR | 9–16 | At a full table you should still raise most of the hands you play, so your raising rate stays only a few points below your VPIP. |
| full ring | Aggression | 50–66 | A full table does not change the value of betting first after the flop, so your bets and raises should still outnumber your calls. |
| full ring | WTSD | 28–40 | At a full table you see flops with stronger hands but against more opponents, so reaching showdown with about a third of your flops is a healthy balance. |
| full ring | W$SD | 47–57 | Because you enter full-ring pots with stronger hands, you should win about half of the showdowns you reach or slightly more. |

AC#2 margins (6-max vs measured TAG, two seeds): VPIP 22.2–22.3 in 20–28; PFR 16.2–16.3 in 14–22; Aggression
63.1–63.4 in 50–66; W$SD 49.9–50.0 in 47–57; WTSD 94.3–94.4 is outside 30–42 and not part of AC#2 (Q-2; TASK-7.32).

### Error handling and configuration
- Invalid data file → `parseHealthyRanges` throws at module load (`RangeError('Invalid healthy ranges: <path>')`),
  same fail-fast as bot style files; a unit test parses the shipped file.
- Invalid stored `style` → `parseSessionReport` RangeError (`getReport` rejects, as for other fields).
- Corrupt or missing hand record at session end → skipped (A-7).

## 6. Behaviour specification

### SPEC-01: The shipped data file holds exactly 15 valid ranges with justifications
- Verifies: AC#1, DoD#1, DoD#10
- Behaviour: Given `src/stats/healthy-ranges.json`, When parsed by `parseHealthyRanges`, Then it has exactly the
  keys `heads-up`, `6-max`, `full-ring`, each with exactly `vpip`, `pfr`, `aggression`, `wtsd`, `wsd` (15
  ranges); each has whole `0 ≤ low < high ≤ 100` and a one-sentence justification (A-10); and the values equal
  the §5 table.
- Verification: acceptance `tests/stats/healthy-ranges.acceptance.test.ts::AC#1 the data file holds 15 ranges, each low < high with a justification sentence`

### SPEC-02: TAG bots' 6-max VPIP, PFR, Aggression and W$SD fall inside the 6-max ranges
- Verifies: AC#2
- Behaviour: Given a 100,000-hand all-TAG 6-max cash playtest (`runPlaytest({hands: 100000, seed: 42, size: 6, game: 'cash'})`, every seat counted with `handStyleCounts`), When VPIP, PFR, Aggression and W$SD are computed with `styleStats` and rounded to tenths, Then each is within `HEALTHY_RANGES['6-max']` inclusive (expected ≈ 22.2, 16.2, 63.1, 49.9). WTSD is not asserted here (Q-2; TASK-7.32). Opt-in slow (A-9).
- Verification: acceptance `tests/stats/healthy-ranges-tag.acceptance.test.ts::AC#2 TAG 6-max VPIP, PFR, Aggression and W$SD are inside the 6-max healthy ranges (100,000 hands, seed 42)`

### SPEC-03: The report shows the AC#3 values next to the 6-max ranges
- Verifies: AC#3, DoD#2
- Behaviour: Given the §5 AC#3 hand set and a 6-player session record of 100 hands, When `sessionReport(session, endedAt, hands)` runs, Then `report.style` equals `{handsDealt 100, voluntary 25, preflopRaised 18, postflopAggressive 11, postflopCalls 9, sawFlop 20, showdowns 6, showdownsWon 3}`; and When that report is rendered by `ReportScreen`, Then the rows read, in order, `VPIP You 25.0% · healthy 20–28% · …`, `PFR You 18.0% · healthy 14–22% · …`, `Aggression You 55.0% · healthy 50–66% · …`, `WTSD You 30.0% · healthy <6-max WTSD range> · …`, `W$SD You 50.0% · healthy 47–57% · …`, with each range taken from `HEALTHY_RANGES['6-max']`.
- Verification: acceptance `tests/table/session-report-style.acceptance.test.ts::AC#3 the report stores the user's style counts from the session's hands`; acceptance `tests/ui/report-style.acceptance.test.tsx::AC#3 rows show VPIP 25.0%, PFR 18.0%, Aggression 55.0%, WTSD 30.0%, W$SD 50.0% with the 6-max ranges`

### SPEC-04: Inclusive limits decide the label
- Verifies: AC#4
- Behaviour: Given ranges equal to `HEALTHY_RANGES` but with 6-max VPIP `{low 20, high 28}`, When `styleSection(6, counts, fixture)` runs for VPIP 28.0, 20.0, 28.1 and 19.9 (§5 AC#4 counts), Then the VPIP row label is `in range`, `in range`, `too high`, `too low` and its value `28.0%`, `20.0%`, `28.1%`, `19.9%`.
- Verification: acceptance `tests/stats/healthy-ranges.acceptance.test.ts::AC#4 VPIP 28.0 and 20.0 are in range, 28.1 too high, 19.9 too low`

### SPEC-05: Exact sizes use their own ranges and are not approximate
- Verifies: AC#5
- Behaviour: Given counts with every denominator > 0, When `styleSection(2, …)` and `styleSection(10, …)` run, Then the first has reference `heads-up`, `approximate: false`, title `Your style vs healthy range (heads-up)` and row ranges from `HEALTHY_RANGES['heads-up']`; the second `full-ring`, `false`, `Your style vs healthy range (full ring)`, ranges from `HEALTHY_RANGES['full-ring']`. Sizes 6 and 9 are also not approximate.
- Verification: acceptance `tests/stats/healthy-ranges.acceptance.test.ts::AC#5 2 and 10 players use heads-up and full-ring ranges, not approximate`

### SPEC-06: Mapped sizes are marked approximate and name the reference size
- Verifies: AC#6, DoD#8
- Behaviour: Given counts, When `styleSection(4, …)` and `styleSection(8, …)` run, Then they use the 6-max and full-ring ranges with `approximate: true` and titles `Your style vs healthy range (6-max, approximate)` and `Your style vs healthy range (full ring, approximate)`; sizes 3, 5, 7 are approximate 6-max. And a rendered 4-player report's `<h2>` reads `Your style vs healthy range (6-max, approximate)`.
- Verification: acceptance `tests/stats/healthy-ranges.acceptance.test.ts::AC#6 4 and 8 players use 6-max and full-ring ranges marked approximate`; acceptance `tests/ui/report-style.acceptance.test.tsx::AC#6 the approximate section heading names the reference size`

### SPEC-07: "—" stats show "not enough data" and no range label
- Verifies: AC#7
- Behaviour: Given the §5 AC#7 counts (user never saw the flop) at 6 players, When the section is built and rendered, Then the WTSD and W$SD rows show `You —` with label `not enough data` (`data-label="no-data"`) and contain none of `in range`, `too high`, `too low`; Aggression is also `—`/`not enough data`; VPIP `20.0%` and PFR `10.0%` carry range labels.
- Verification: acceptance `tests/stats/healthy-ranges.acceptance.test.ts::AC#7 a session without a flop shows WTSD and W$SD as — with not enough data`; acceptance `tests/ui/report-style.acceptance.test.tsx::AC#7 — rows render not enough data and no range label`

### SPEC-08: Invalid data files are rejected with the failing path
- Verifies: AC#1
- Behaviour: Given the shipped JSON altered one way at a time — wrong `format`; a missing size; an extra stat; `low` 28 / `high` 28; `low` 20.5; `high` 101; empty justification; a two-sentence justification (`"One. Two."`) — When parsed, Then each throws `RangeError` whose message starts `Invalid healthy ranges:` and names the path (e.g. `ranges.6-max.vpip.high`).
- Verification: unit `tests/stats/healthy-ranges.test.ts::parseHealthyRanges rejects each invalid file with its path`

### SPEC-09: Tenths rounding is half-up integer arithmetic
- Verifies: AC#3, AC#4
- Behaviour: `statTenths(1, 3)` = 333 (33.3%), `statTenths(2, 3)` = 667, `statTenths(1, 8)` = 125 (12.5%), `statTenths(1, 16)` = 63 (6.25 → 6.3), `statTenths(281, 1000)` = 281, `statTenths(0, 5)` = 0, `statTenths(3, 0)` = null.
- Verification: unit `tests/stats/healthy-ranges.test.ts::statTenths rounds half up to tenths and returns null for a zero denominator`

### SPEC-10: A forced fold counts as a user fold
- Verifies: AC#3
- Behaviour: Given one hand record whose user actions are a preflop `call` then a forced preflop `fold` (`forcedFold: true`), When `sessionReport` runs with it, Then `style` is `{handsDealt 1, voluntary 1, preflopRaised 0, postflopAggressive 0, postflopCalls 0, sawFlop 0, showdowns 0, showdownsWon 0}`.
- Verification: acceptance `tests/table/session-report-style.acceptance.test.ts::a forced fold counts as the user's fold`

### SPEC-11: Stored `style` is validated on read; legacy reports without it parse
- Verifies: AC#3
- Behaviour: Given a valid report with the AC#3 `style`, When `parseSessionReport` reads it with one field changed at a time — `style: null`, `handsDealt: 0`, `handsDealt: handsPlayed + 1`, `voluntary: 101`, `preflopRaised: 26`, `postflopCalls: -1`, `sawFlop: 1.5`, `showdowns: 21`, `showdownsWon: 7` — Then it throws `RangeError('Invalid session report: style[.<field>]')` naming that field; and a report without `style`, and `sessionReport(session, endedAt)` / `sessionReport(session, endedAt, [])`, have no `style` key.
- Verification: acceptance `tests/table/session-report-style.acceptance.test.ts::parseSessionReport validates style and accepts reports without it`

### SPEC-12: Reports without `style` render no style section
- Verifies: AC#3
- Behaviour: Given a report without `style`, When rendered, Then the markup contains no `report-style` and no `<h2>`, and still exactly one button; with `style`, the section comes after `</dl>` and before the button, and there is still exactly one button.
- Verification: acceptance `tests/ui/report-style.acceptance.test.tsx::the section is absent without style and sits before the only button`

### SPEC-13: Ending a session stores the user's style counts from the stored hand records
- Verifies: AC#3
- Behaviour: Given a fake-indexeddb store with 3 hands of a session played and written as the app does (`playSession` + `handWrite`), When `endSession` runs, Then the stored and returned report's `style` equals `sessionReport(stored, ended, records).style` with `records` = the 3 stored records, and `style.handsDealt` = 3; and Given hand 2's stored value replaced by an invalid object, Then the session still ends, `style.handsDealt` = 2 and the counts equal those of hands 1 and 3.
- Verification: integration `tests/storage/session-end-style.test.ts::endSession stores style counts from the session's valid hand records`

### SPEC-14: End-to-end: Leave table shows the style section from the stored hands
- Verifies: AC#3, DoD#8, DoD#9
- Behaviour: Given the default game ($4/$8, 6 players) and hand 1 played to its result (as `e2e/session-report.spec.ts` `leaveAfterHand1`), When Leave table is chosen, Then the report shows a level-2 heading `Your style vs healthy range (6-max)`, five `.report-style-row` items whose `.report-style-name` texts are `VPIP, PFR, Aggression, WTSD, W$SD`, each row's text equals the row built by `styleSection(6, stored.style)` from the stored report, the stored report's `style` equals `sessionReport(…, storedRecords)` `.style`, all requests stay on the app origin, and axe reports zero serious or critical violations; in Chromium and WebKit.
- Verification: acceptance `e2e/report-style.spec.ts::Leave table shows my style against the 6-max healthy ranges`

### SPEC-15: Checks pass
- Verifies: DoD#3, DoD#4, DoD#5, DoD#6, DoD#7, DoD#11, DoD#12, DoD#13
- Behaviour: `npm run lint`, `npm run typecheck`, `npm test` (includes the golden-spot suite and coverage thresholds ≥ 90% for `src/stats` and `src/table`, ≥ 70% overall) and `npm run e2e` pass; `src/stats/healthy-ranges.ts` imports nothing from `src/ui` or browser globals; the story doc is published to Backlog. DoD#7: N/A — no engine, bot or advice code changes. DoD#13: N/A — no service worker exists yet (`grep -r serviceWorker src index.html` is empty).
- Verification: command `npm run lint && npm run typecheck && npm test && npm run e2e`

## 7. Edge cases
- Zero denominators (no flop, no postflop calls/bets, no showdown) → SPEC-07.
- Values exactly at a limit, just above/below → SPEC-04; rounding boundary (x.x5) → SPEC-09.
- Every table size 2–10 → SPEC-05, SPEC-06.
- Forced fold on Leave mid-hand → SPEC-10.
- Legacy report without `style`; session with no stored hand records → SPEC-11, SPEC-12.
- Corrupt stored `style` → SPEC-11; corrupt/missing hand record at end → SPEC-13.
- Sit-and-go: same section, reference size from `players` (A-2); covered by the same pure functions — no
  separate case.
- Concurrency/interruption: the end stays one strict transaction; a failure changes nothing (existing
  TASK-10.1 behaviour, unchanged).
- Permissions / network: N/A — local only.

## 8. Security considerations
- Trust boundary: stored IndexedDB values (reports, hand records) are untrusted — validated by
  `parseSessionReport` (new `style` checks) and `parseHandRecord`. The data file is shipped code, validated at
  load.
- Rendering: all text goes through React escaping; no `dangerouslySetInnerHTML`, no inline styles.
- No new dependencies, network requests, secrets, logging or randomness.

## 9. Non-functional
- Ending a 1,000-hand session reads 1,000 records in one transaction; no new timing target (the TASK-10.1 end
  flow already waits on writes). No new speed tests.
- Accessibility: the section is a labelled region with an `<h2>`; labels are text, never colour-only; axe zero
  serious/critical (SPEC-14).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`, start a default game, play a few hands, choose Leave table: the report shows
  "Your style vs healthy range (6-max)" with five rows. Slow AC#2 check: `npm run test:slow` (or
  `TLH_SLOW_TESTS=1 npx vitest run tests/stats/healthy-ranges-tag.acceptance.test.ts`).
- New tests: `tests/stats/healthy-ranges.acceptance.test.ts` → SPEC-01, 04, 05, 06, 07;
  `tests/stats/healthy-ranges.test.ts` → SPEC-08, 09; `tests/stats/healthy-ranges-tag.acceptance.test.ts` →
  SPEC-02; `tests/table/session-report-style.acceptance.test.ts` → SPEC-03, 10, 11;
  `tests/ui/report-style.acceptance.test.tsx` → SPEC-03, 06, 07, 12; `tests/storage/session-end-style.test.ts`
  → SPEC-13; `e2e/report-style.spec.ts` → SPEC-14.
- Judge end-to-end: play 5–10 hands at 6 players and Leave table; check the five rows, ranges 20–28 / 14–22 /
  50–66 / (WTSD) / 47–57, labels consistent with the shown values; repeat at 4 players and see
  "(6-max, approximate)"; fold every hand preflop and see WTSD/W$SD/Aggression "—" with "not enough data".

## 11. Open questions
- None. Q-1 and Q-2 answered in `doit/TASK-10.3/qa.md`.

## 12. Clarifications log
See `doit/TASK-10.3/qa.md`.
