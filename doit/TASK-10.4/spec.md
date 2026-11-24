# Spec: TASK-10.4 — See my hands played and error rates per 100 hands in the report

Status: READY (approved 2026-11-24)
Task: TASK-10.4 · Parent/epic: TASK-10 · Requirements: REQ-044 (044.2), REQ-040 (040.3) · Dream: limit-holdem-trainer

## 1. Summary
The Session Report gains three KPI tiles: "Hands played", "Major errors /100" and "Minor errors /100". The two
rates count the user's unhinted decisions graded Major (or Minor) in the session's stored hand records, divided
by hands played × 100, shown with one decimal. The counts are read from the stored decision records (grade and
hinted flag) once, when the session ends, inside the same transaction that writes the report (the TASK-10.3
`style` pattern), and are stored in the write-once report. The advice engine is never re-run.

## 2. Scope
- In scope:
  - `src/table/session-report.ts`: optional `errors` field (`{ major, minor }`) on `SessionReport`; counting in
    `sessionReport(…)` from the hands' `decisions`; validation in `parseSessionReport`; a new `rateTiles(report)`
    view function.
  - `src/ui/report/ReportScreen.tsx` + `src/ui/styles.css`: the three tiles in their own `<dl>`.
  - Tests (acceptance, unit, one 200-hand storage acceptance test, one Playwright flow with axe) and docs.
- Not doing:
  - Hint usage count / % (REQ-044.3, TASK-10.7); leaks (TASK-10.5+); Statistics trends and the G-2 line
    (TASK-11.x).
  - Changing `reportView` or the existing Result / BB/100 / Rebuys tiles (locked tests pin them exactly, §5).
  - Back-filling `errors` into reports stored without it (A-3); no DB version change.
  - Any change to `src/storage/hand-store.ts` (it already passes the parsed hand records to `sessionReport`),
    the advice engine, grading, hand records or the hint.
  - Re-grading or "recomputing with the advice engine" anywhere.
- Scope budget: files=8, lines=600

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Rate = `bbPer100(count, 1, handsPlayed).toFixed(1)` — i.e. tenths = `floor((2000 × count + hands) / (2 × hands))` (half-up, integer arithmetic), shown as e.g. `6.0`, `14.0`, `0.0`. The denominator is the report's `handsPlayed`. | yes | Task: "count / hands played × 100, one decimal". Reuses the existing half-up helper (`src/table/session-report.ts:95-99`); with `bigBet = 1` it is exactly that formula. | `Math.round` on floats; denominator = number of records read |
| A-2 | The three tiles are a second `<dl class="report-kpis report-rates" aria-label="Volume and errors">` placed after the cash KPI `<dl>` (after the header for a sit-and-go) and before the style section, with tile class `report-rate` (not `report-kpi`). Visually the same tile style, on its own grid row. | yes | The storyboard puts the error tiles in the same row as Result/BB/100 (`dreams/limit-holdem-trainer/storyboards/Report.dc.html:78-82`), but locked tests pin the `.report-kpi` set to exactly Result/BB/100/Rebuys (`e2e/session-report.spec.ts:95`, `tests/ui/report-screen.acceptance.test.tsx:32-49`) and `reportView` to `{header, tiles}` (`tests/table/session-report.acceptance.test.ts:107-110`). A separate list keeps every locked test unchanged. | Merge into `.report-kpi` and edit 3 locked tests (TASK-10.1) |
| A-3 | Reports stored before this story have no `errors`; `parseSessionReport` accepts that and the screen shows none of the three tiles for them (the header line still shows "N hands"). | yes | Write-once reports (REQ-052.5) can't be back-filled. Keeps the locked TASK-10.1/10.3 renders of hand-built reports without `errors` unchanged (`tests/ui/report-screen.acceptance.test.tsx:65-80` sit-and-go has no `<dl`; `tests/ui/report-style.acceptance.test.tsx:112-132`). | Show "Hands played" alone for legacy reports |
| A-4 | `errors` is present iff `hands` has ≥ 1 element and every element carries a `decisions` array. `ReportHand.decisions` is optional. | yes | Stored `HandRecord`s always have `decisions` (`src/table/hand-record.ts:98,444`). The locked TASK-10.3 test builds `ReportHand`s without `decisions` and asserts `{ ...report, style: undefined }` equals a hand-less report (`tests/table/session-report-style.acceptance.test.ts:31-48,91`); a required field or an always-present `errors` would break its typecheck or that assertion. | Required `decisions` + edit the locked TASK-10.3 test |
| A-5 | A hand record skipped at session end (missing or failing `parseHandRecord`, TASK-10.3 A-7) contributes no errors; the denominator stays `handsPlayed`. | yes | Same rule as `style`; in practice every record is present (written with the session in one transaction). | Use `style.handsDealt` as denominator |
| A-6 | Hands played tile value is `String(handsPlayed)` with no thousands separator (e.g. `200`, `1500`). | yes | AC#1 asks `"200"`; header line uses the same plain number (`src/table/session-report.ts:230`). | `1,500` |

## 3. Current system
- Report model: `SessionReport` (`src/table/session-report.ts:28-46`) with optional `style` (TASK-10.3);
  `ReportHand = StatHand & { userSeat }` (`:49`); `sessionReport(session, endedAt, hands = [])` (`:103-140`)
  adds `style` only when `hands` is non-empty (`:135-139`); `parseSessionReport` (`:181-209`) validates
  `style` via `parseStyle` (`:165-177`) with `whole`/`object`/`invalid` helpers (`:89-91,144-152`);
  `reportView` returns exactly `{ header, tiles }` (`:224-242`); `bbPer100` half-up helper (`:95-99`).
- Ending: `ended` in `src/storage/hand-store.ts` already reads hand records 1…handsPlayed in the end
  transaction, skips invalid ones and calls `sessionReport(session, endedAt, records)` (TASK-10.3 D-1/A-7/A-8;
  `docs/storage/reports.md:66-72`). So `errors` computed inside `sessionReport` needs no storage change.
- Decision records: `HandRecordDecision.grade.grade: Grade` (`'correct' | 'minor' | 'major'`,
  `src/advice/grade.ts:10`) and `hinted: boolean` (`src/table/hand-record.ts:51-71`); `HandRecord.decisions`
  "one per user decision" (`:97-98`), validated by `parseHandRecord` (`:444-445`). A forced fold (TASK-10.2)
  is not a decision: it has no entry in `decisions` (`:99-101,226-231`), so it can never count as an error.
- Hinted rule: REQ-044.2 "Major errors per 100 hands and Minor errors per 100 hands (unhinted decisions)" and
  REQ-040.3 (`dreams/limit-holdem-trainer/requirements.md:724,801`); the task description says the same. Settled:
  hinted decisions are excluded from both rates.
- Screen: `src/ui/report/ReportScreen.tsx:43-76` (header, cash `<dl class="report-kpis" aria-label="Result">`,
  optional style `<section>`, one button). CSS `src/ui/styles.css:118-144` (`.report-kpis`, `.report-kpi`).
  No hooks beyond `useHeadingFocus`; the view is computed during render.
- Tests: `npm test` = `vitest run --coverage`; acceptance files `*.acceptance.test.*`; e2e `playwright test`
  (Chromium + WebKit) with `axeWithPausedClock` (`e2e/support/paused-clock`).
- Measured for this spec: `playSession(seatSession(), 200, codeFor)` + `handWrite` grading of every user decision
  (as `tests/storage/session-end-style.test.ts:18-31`) takes about 5.7 s and yields 906 decisions: 379 Major,
  126 Minor (codes `[0x9e3779b9, n, 2, 3]`). Correctness check of seconds → normal suite.
- Existing code to reuse:
  - `src/table/session-report.ts:95` → `bbPer100(count, 1, hands)` for the rate tenths.
  - `src/table/session-report.ts:144-152` → `object`, `whole` for `errors` validation.
  - `tests/table/session-report-style.acceptance.test.ts:15-48` → `session(n)` / synthetic `ReportHand` builder
    pattern (copy, add `decisions`).
  - `tests/storage/session-end-style.test.ts:18-31` → `play` loop with `seatSession`, `playSession`, `handWrite`,
    `store.add` (`tests/support/session-play.ts:44`).
  - `e2e/report-style.spec.ts:21-44,57-62` → paused-clock flow, `storedReports`/`storedRecords`/`storedSessions`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Persisted format: the report gains optional `errors: { major: number; minor: number }` = counts of the user's **unhinted** decisions graded Major / Minor over the session's stored hands, written once at session end. Rates are derived at display from these counts and `handsPlayed`. No DB version change. | (b) store rates; (c) recompute on open; (d) store more counts | Same pattern as TASK-10.1 D-1 and TASK-10.3 D-1 (computed once, stored in the write-once report). Counts are the minimum that reproduces every shown number and stay exact; TASK-10.7 can add its own hint counts. | yes | user (Q-1) |
| D-2 | `errors` is computed inside `sessionReport` from `hands[*].decisions`; `ended` is unchanged. | Compute in `ended` and pass separately | `ended` already passes parsed records (TASK-10.3); locked comparisons call `sessionReport(stored, ended, records)` with the stored records, so they keep matching (D-3). | no | n/a |
| D-3 | No locked test needs editing. Checked (owner in brackets): `tests/storage/session-end.acceptance.test.ts:69-71` [TASK-10.1] and `e2e/session-report.spec.ts:114-120` [TASK-10.1] compare the stored report with `sessionReport(…, records)` of real records → both sides gain the same `errors`. `e2e/session-report.spec.ts:95` `.report-kpi dt` = 3 labels [TASK-10.1] → new tiles use class `report-rate`. `tests/ui/report-screen.acceptance.test.tsx:32-80` [TASK-10.1] (exact `report-kpi` regex; button after first `</dl>`; sit-and-go without `errors` has no `<dl`). `tests/table/session-report.acceptance.test.ts:40,64-110` [TASK-10.1] (`reportView` unchanged; hand-less reports have no `errors`). `tests/table/session-report-style.acceptance.test.ts:88-139` [TASK-10.3] (hands without `decisions` → no `errors`, A-4). `tests/ui/report-style.acceptance.test.tsx:112-132` [TASK-10.3] (reports without `errors`: no new `<dl`/`<h2`; section after first `</dl>`, button after first `</section>`). `e2e/report-style.spec.ts:62` [TASK-10.3] compares `.style` only. `tests/storage/end-paused.acceptance.test.ts:105-160` [TASK-2.7] seeds no hand records → no `errors`. `tests/table/leave-mid-hand.acceptance.test.ts`, `e2e/leave-mid-hand.spec.ts` [TASK-10.2] read `handsPlayed`/`cash` only. | Merge tiles into `.report-kpi` (3 locked edits) | Avoids locked edits entirely. | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/session-report.ts` — modify: `ReportDecision`, optional `ReportHand.decisions`, `ErrorCounts`,
  `SessionReport.errors?`, counting in `sessionReport`, `parseErrors`, `RateTile`, `rateTiles`.
- `src/ui/report/ReportScreen.tsx` — modify: render the rates `<dl>` when `report.errors` is present.
- `src/ui/styles.css` — modify: `.report-rate` shares the `.report-kpi` tile rules (selector lists).
- `tests/ui/report-errors.acceptance.test.tsx` — new (SPEC-01, SPEC-02, SPEC-03, SPEC-06).
- `tests/table/session-report-errors.test.ts` — new (SPEC-05, SPEC-07, SPEC-08).
- `tests/storage/session-end-errors.acceptance.test.ts` — new (SPEC-04).
- `e2e/report-errors.spec.ts` — new (SPEC-09).
- `docs/storage/reports.md` — modify: `errors` field row, rule, legacy reports, validation, tests list.

### Components, interfaces and data
`src/table/session-report.ts` (headless; new imports only `type Grade` from `../advice/grade`):
```ts
/** The part of a stored decision the report reads; HandRecordDecision satisfies it. */
export interface ReportDecision {
  readonly grade: { readonly grade: Grade };
  readonly hinted: boolean;
}
/** A stored hand as the report needs it; HandRecord satisfies it. `decisions` absent → no `errors` (A-4). */
export type ReportHand = StatHand & {
  readonly userSeat: SeatNumber;
  readonly decisions?: readonly ReportDecision[];
};
/** Counts of the user's unhinted decisions graded Major / Minor (REQ-044.2, REQ-040.3). */
export interface ErrorCounts { readonly major: number; readonly minor: number }
export interface SessionReport { …existing…;
  /** Absent on reports without stored decision records (A-3, A-4). */
  readonly errors?: ErrorCounts }

export interface RateTile {
  readonly key: 'hands' | 'major' | 'minor';
  readonly label: string;   // 'Hands played' | 'Major errors /100' | 'Minor errors /100'
  readonly value: string;   // '200' | '6.0' | '14.0'
}
/** [] when report.errors is undefined; else the three tiles in key order hands, major, minor. */
export function rateTiles(report: SessionReport): readonly RateTile[];
```
`sessionReport`: after `style`, when `hands.length ≥ 1` and `hands.every((h) => h.decisions !== undefined)`,
add `errors = { major, minor }` where `major` = number of decisions over all hands with
`grade.grade === 'major' && hinted !== true`; `minor` likewise for `'minor'`.
Key order of the returned object: existing keys, `style`, `errors`. `reportView` is unchanged.

`parseSessionReport`: after the `style` check, `if (report.errors !== undefined) parseErrors(report.errors)`:
`object(value, 'errors')`; `whole(errors.major, 'errors.major', 0, Number.MAX_SAFE_INTEGER)`; same for
`'errors.minor'`. Failure → `RangeError('Invalid session report: errors' | 'errors.major' | 'errors.minor')`.

`ReportScreen`, between the cash `<dl>` block and the style section, only when `rateTiles(report)` is non-empty:
```html
<dl class="report-kpis report-rates" aria-label="Volume and errors">
  <div class="report-rate" data-rate="hands"><dt>Hands played</dt><dd>200</dd></div>
  <div class="report-rate" data-rate="major"><dt>Major errors /100</dt><dd>6.0</dd></div>
  <div class="report-rate" data-rate="minor"><dt>Minor errors /100</dt><dd>14.0</dd></div>
</dl>
```
No hooks or effects are added; tiles are computed during render from props.

### Rules and algorithms
- Count rule: a decision counts as Major iff `grade.grade === 'major'` and `hinted` is not `true`; Minor
  likewise. Correct decisions and hinted decisions count toward neither. Forced folds have no decision entry.
- Rate (A-1): `bbPer100(count, 1, handsPlayed).toFixed(1)`.
- Worked examples:
  - AC#1: 200 hands, 12 unhinted Major, 28 unhinted Minor → tenths `floor((24000+200)/400) = 60` → `6.0`;
    `floor((56000+200)/400) = 140` → `14.0`; hands `200`.
  - AC#2: 12 unhinted + 5 hinted Major → `errors.major = 12` → `6.0`.
  - AC#3: 50 hands, all Correct → `{ major: 0, minor: 0 }` → `bbPer100(0,1,50) = 0` → `0.0` (never `-0.0`).
  - Rounding: 1 Major in 3 hands → `floor((2000+3)/6) = 333` → `33.3`; 1 in 8 → `floor(2008/16) = 125` → `12.5`.

### Error handling and configuration
- Invalid stored `errors` → `parseSessionReport` throws `RangeError('Invalid session report: errors…')`, as for
  other fields; `getReport` callers already handle that. No configuration.

## 6. Behaviour specification

### SPEC-01: Hands played and both rates from unhinted counts
- Verifies: AC#1, DoD#1
- Behaviour: Given a 6-player cash `SessionRecord` with `handsPlayed` 200 and 200 synthetic `ReportHand`s whose
  `decisions` hold, in total, 12 unhinted Major, 28 unhinted Minor and some Correct decisions, When
  `sessionReport(session, ENDED, hands)` is rendered with `ReportScreen`, Then the markup contains the
  `report-rate` tiles `[hands, Hands played, 200]`, `[major, Major errors /100, 6.0]`,
  `[minor, Minor errors /100, 14.0]` in that order, and `report.errors` equals `{ major: 12, minor: 28 }`.
- Verification: acceptance `tests/ui/report-errors.acceptance.test.tsx::AC#1 shows hands played 200 and error rates 6.0 and 14.0`

### SPEC-02: Hinted decisions are excluded
- Verifies: AC#2, DoD#1
- Behaviour: Given a 200-hand session with 12 unhinted and 5 hinted Major decisions (and 3 hinted Minor), When its
  report is rendered, Then Major errors /100 shows `6.0`, Minor errors /100 shows `0.0`, and `report.errors` is
  `{ major: 12, minor: 0 }`.
- Verification: acceptance `tests/ui/report-errors.acceptance.test.tsx::AC#2 hinted Major errors are not counted`

### SPEC-03: All-correct session shows 0.0
- Verifies: AC#3, DoD#1
- Behaviour: Given a 50-hand session whose every decision is graded Correct (some hinted), When its report is
  rendered, Then Hands played shows `50` and both rates show `0.0`.
- Verification: acceptance `tests/ui/report-errors.acceptance.test.tsx::AC#3 an all-correct session shows 0.0 for both rates`

### SPEC-04: Scripted 200-hand session matches its stored hand records
- Verifies: AC#4, DoD#1
- Behaviour: Given a fake-indexeddb store with a start record and 200 hands played by `playSession(seatSession(),
  200, codeFor)` and written with `handWrite` (graded by the hint path), where before `store.add` each record's
  decision `i` gets `hinted = (handNumber + i) % 3 === 0`, When `store.endSession(SESSION, ENDED)` resolves,
  Then (recomputing independently in the test from `store.get(SESSION, n)` for n = 1..200) `report.handsPlayed`
  is 200, `report.errors.major` / `.minor` equal the counts of unhinted Major / Minor decisions in those
  records, at least one unhinted Major, one unhinted Minor and one hinted non-Correct decision exist, and the
  rendered `ReportScreen` of `store.getReport(SESSION)` shows `200`, `(major / 2).toFixed(1)` and
  `(minor / 2).toFixed(1)` in the three `report-rate` tiles.
- Verification: acceptance `tests/storage/session-end-errors.acceptance.test.ts::AC#4 a scripted 200-hand session's tiles equal the values recomputed from its stored hand records`

### SPEC-05: Count rule details
- Verifies: AC#2, DoD#2
- Behaviour: Given hands where (a) a hand has `forcedFold: true` and `decisions: []`, (b) a hand has a hinted
  Minor and an unhinted Major, (c) a hand has three Correct decisions, When `sessionReport` runs, Then `errors`
  is `{ major: 1, minor: 0 }`; and `rateTiles` gives `33.3` for 1 Major in 3 hands and `12.5` for 1 in 8.
- Verification: unit `tests/table/session-report-errors.test.ts::counts only unhinted decisions and rounds half up`

### SPEC-06: Legacy reports and placement
- Verifies: AC#1, DoD#7
- Behaviour: Given a cash report without `errors`, When rendered, Then it contains no `report-rate` and
  `rateTiles` returns `[]`. Given a cash report with `errors` and `style`, When rendered, Then the rates `<dl`
  starts after the first `</dl>` (cash tiles), the style `<section` starts after the rates `</dl>`, and there is
  exactly one `<button`. Given a sit-and-go report with `errors`, Then the rates `<dl` starts after `</header>`
  and contains Hands played and both rates.
- Verification: acceptance `tests/ui/report-errors.acceptance.test.tsx::the tiles are absent without errors and sit between the cash tiles and the style section`

### SPEC-07: errors presence rule
- Verifies: DoD#2
- Behaviour: Given `sessionReport` called with no hands, `[]`, or hands any of which lacks `decisions`, Then the
  result has no `errors` key (`'errors' in report === false`); given hands that all carry `decisions` (even all
  empty), Then `errors` is present (`{ major: 0, minor: 0 }` for empty).
- Verification: unit `tests/table/session-report-errors.test.ts::errors is present only when every hand carries decisions`

### SPEC-08: Stored errors are validated
- Verifies: DoD#2
- Behaviour: Given a valid report with `errors`, When `parseSessionReport` gets a JSON round trip, Then it returns
  an equal value; with `errors` = `null` or `[1]` it throws `RangeError('Invalid session report: errors')`; with
  `major` = `-1`, `1.5`, `'2'` or missing it throws `… errors.major`; `minor` likewise `… errors.minor`; a report
  without `errors` parses unchanged.
- Verification: unit `tests/table/session-report-errors.test.ts::parseSessionReport validates errors and accepts reports without it`

### SPEC-09: Browser flow
- Verifies: AC#1, DoD#7, DoD#8
- Behaviour: Given the app with paused clock and replay words `[0x9e3779b9, 1, 2, 3]` (as `e2e/report-style.spec.ts`),
  When the user starts the default game, plays hand 1, and clicks Leave table, Then the list named
  "Volume and errors" shows `.report-rate dt` = `['Hands played', 'Major errors /100', 'Minor errors /100']`, the
  `dd` values equal `['1', …]` computed from the stored report's `errors` with `bbPer100(count, 1, 1).toFixed(1)`,
  the stored `errors` equals `sessionReport(ended, new Date(endedAt), records).errors` of the stored records, axe
  reports no serious/critical violations, and every request goes to the app's own origin. Runs in Chromium and
  WebKit.
- Verification: acceptance `e2e/report-errors.spec.ts::Leave table shows hands played and error rates from the stored decisions`

### SPEC-10: Project checks
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#10
- Behaviour: Given the change, When the checks run, Then `npm run lint`, `npm run typecheck`, `npm test` (incl.
  golden-spot suite and coverage thresholds) and the CI workflow pass; `src/table/session-report.ts` imports no
  UI code.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-11: Documentation
- Verifies: DoD#11
- Behaviour: `docs/storage/reports.md` documents the `errors` field, the count rule (unhinted only), the rate
  formula, legacy reports and validation; the story doc is published to Backlog.md.
- Verification: manual `docs/storage/reports.md` section "errors" and `backlog doc list --plain` entry for TASK-10.4

### SPEC-12: Not-applicable DoD items
- Verifies: DoD#6, DoD#9, DoD#12
- Behaviour: DoD#6 — no engine/bots/advice change, so no playtest run is required (golden suite still runs in
  `npm test`). DoD#9 — no strategy content. DoD#12 — no new screen or dialog (existing screen only; the service
  worker story E13-S07 is not done).
- Verification: manual `git diff --stat main -- src/engine src/bots src/advice` is empty

## 7. Edge cases
- Empty: 0 hands → no report (existing, REQ-044.8). Hands with no user decisions (all forced/walks) → counts 0 →
  `0.0` (SPEC-05, SPEC-07).
- Boundary/rounding: half-up at x.x5 (SPEC-05); never `-0.0` (SPEC-03).
- Legacy reports without `errors` (SPEC-06); corrupt stored `errors` (SPEC-08).
- Skipped corrupt hand record at end: contributes nothing (A-5), covered by existing TASK-10.3 skip path; no new
  test.
- Duplicates / concurrency / interruption: report is written once in the existing end transaction; unchanged.
- Dependency failure / permissions: N/A (no new dependency, no I/O added).

## 8. Security considerations
- Trust boundary: stored report values read from IndexedDB are untrusted → `parseSessionReport` validates
  `errors` (SPEC-08). Values render as React text (no HTML injection).
- No authn/secrets/network/randomness/new dependencies. N/A.

## 9. Non-functional
- `sessionReport` counting is O(total decisions); no measurable cost at session end.
- The SPEC-04 test takes about 6–8 s (measured 5.7 s for play + grading); it is a correctness check and stays in
  the normal suite (not `test:slow`).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev` → New game → Start game → play a hand → Leave table → read the "Volume and errors" tiles
- New tests (path → SPEC ids):
  - `tests/ui/report-errors.acceptance.test.tsx` → SPEC-01, 02, 03, 06
  - `tests/storage/session-end-errors.acceptance.test.ts` → SPEC-04
  - `tests/table/session-report-errors.test.ts` → SPEC-05, 07, 08
  - `e2e/report-errors.spec.ts` → SPEC-09 (`npm run e2e`)
- Judge scenario: run the app, play 3–5 hands (open the Hint before some actions), Leave table; check Hands played
  equals the header's hand count and the two rates equal unhinted Major/Minor counts in the stored hand records
  (DevTools → IndexedDB `hands`) ÷ hands × 100 to one decimal; reload and confirm the stored report is unchanged.

## 11. Open questions
- None. Q-1 answered (optional stored `errors: { major, minor }` approved; see D-1 and `doit/TASK-10.4/qa.md`).

## 12. Clarifications log
See `doit/TASK-10.4/qa.md`.
