# Spec: TASK-10.7 — See how many of my decisions used a hint in the report

Status: READY (approved 2026-11-24)
Task: TASK-10.7 · Parent/epic: TASK-10 · Requirements: REQ-040 (040.4), REQ-044 (044.3) · Dream: limit-holdem-trainer

## 1. Summary
The Session Report already shows the result, the error rates (unhinted decisions only), the style stats and the
leaks (TASK-10.1–10.6). This story adds hint usage: how many of the user's decisions in the session were hinted,
and that number as a percentage of all the user's decisions, with one decimal (e.g. `40 of 320 decisions
(12.5%)`). As with `errors` and `leakCounts`, the two counts are read once from the stored decision records
when the session ends, stored write-once on the report, validated on read, and absent on older reports.

## 2. Scope
- In scope:
  - `src/table/session-report.ts`: a `HintCounts` type, an optional `hints` field on `SessionReport`, counting
    it in `sessionReport`, validating it in `parseSessionReport`, and a `hintTile(report)` view helper.
  - `src/ui/report/ReportScreen.tsx`: one hint-usage tile in the existing "Volume and errors" list.
  - `src/ui/styles.css`: the tile's style.
  - Tests (acceptance, unit, storage, e2e) and `docs/storage/reports.md`.
- Not doing:
  - Any change to grading, the `hinted` flag, the Hint card, hand records, `src/storage/*`, the engine, bots or
    advice. The flag is read as stored (TASK-8.2 sets it).
  - Back-filling `hints` into stored reports. No DB version change.
  - Changing the error rates, the leak counts or `rateTiles` (they keep excluding hinted decisions, REQ-040.3).
  - Hint usage on the Statistics screen or over many sessions (TASK-11.x).
  - Editing any locked test (D-3: none needs editing).
- Scope budget: files=9, lines=560

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | "All the user's decisions" means every stored decision record of the session's hands, whatever its grade and street. A forced fold after Leave table has no decision record (TASK-10.2), so it counts in neither number. | yes | Same base as `errors` (`src/table/session-report.ts:178-184`) and the AC#4 wording "stored decision records". | Count actions from `actions` |
| A-2 | The percentage is rounded half up to one decimal with the existing integer helper: `bbPer100(hinted, 1, decisions).toFixed(1)` (e.g. 1 of 16 → `6.3`, 1 of 3 → `33.3`, 2 of 3 → `66.7`). | yes | Reuses the rate-tile rounding (`src/table/session-report.ts:132-136`, `:326`), so the report rounds one way everywhere and avoids float errors such as `(0.125*100).toFixed(1)`. | `Math.round(1000*h/d)/10` (float) |
| A-3 | `hints` is present exactly when `errors` is present (at least one hand and every hand carries `decisions`). It is appended after `leakCounts`, so the key order of existing fields is unchanged. | yes | Same presence rule as `leakCounts` (TASK-10.5 A-5). Keeps every locked test that renders hand-built reports without `hints` unchanged (D-3). | Always present |
| A-4 | `parseSessionReport` checks `hints` on its own: an object with whole `decisions ≥ 0` and `0 ≤ hinted ≤ decisions`. It does not cross-check `hints` against `errors` or `leakCounts`. | yes | `errors` and `leakCounts` are not cross-checked either (`src/table/session-report.ts:282-284`). | Also require `errors.major + errors.minor ≤ decisions − hinted` |
| A-5 | A report stored before this story (no `hints`) shows no hint tile; the other tiles are unchanged. | yes | Write-once reports (REQ-052.5) can't be back-filled; same rule as `errors`/`leakCounts` (TASK-10.4 A-3, TASK-10.5 A-4). | Show "—" |

## 3. Current system
- `src/table/session-report.ts`:
  - `SessionReport` with optional `style`, `errors`, `leakCounts` (`:35-57`).
  - `ReportDecision { grade, hinted, street?, action? }` (`:60-66`); `HandRecordDecision` satisfies it and has
    `hinted: boolean` (`src/table/hand-record.ts:70`), validated on read (`src/table/hand-record.ts:432`).
  - `sessionReport` returns early without `errors` unless every hand carries `decisions` (`:177`), then counts
    unhinted Major/Minor (`:178-184`) and `leakCounts` (`:185-189`), returning `{ ...report, style, errors,
    leakCounts }` (`:190`).
  - `parseErrors` / `parseLeakCounts` / `whole` / `object` / `invalid` (`:126-128`, `:195-252`);
    `parseSessionReport` validates the optional fields when present (`:282-284`) and ignores unknown properties.
  - `bbPer100` (`:132-136`) and `rateTiles` (`:323-332`), which return exactly three tiles.
- `src/ui/report/ReportScreen.tsx:100-109`: the `<dl class="report-kpis report-rates" aria-label="Volume and
  errors">` list of `<div class="report-rate" data-rate=…><dt>…</dt><dd>…</dd></div>` tiles.
- `src/ui/styles.css:118-147`: `.report-kpis` grid (`minmax(160px, 1fr)`) and `.report-kpi, .report-rate` tile
  styles (dd 26px bold).
- Ending: `endSession` in `src/storage/hand-store.ts` passes the stored, validated `HandRecord`s to
  `sessionReport` in the end transaction (`docs/storage/reports.md` "Ending"). No storage change is needed.
- Locked tests that touch the report (owners TASK-10.1/10.3/10.4/10.5/10.6, from `doit/TASK-10.*/state.json`):
  - `tests/ui/report-errors.acceptance.test.tsx` matches only `<div class="report-rate" …>` tiles (`:72-78`),
    and its hand-built sit-and-go report without `hints` expects one `<dl` (`:174-182`).
  - `e2e/report-errors.spec.ts:46-64` expects exactly three `.report-rate dt` / `dd` texts in "Volume and errors".
  - `e2e/session-report.spec.ts:114`, `e2e/report-style.spec.ts`, `e2e/report-leaks.spec.ts`,
    `tests/storage/session-end*.acceptance.test.ts` compare stored reports with `sessionReport(…, records)` of the
    same records, so both sides gain the same `hints`.
- Unit test `tests/table/session-report-errors.test.ts:77` asserts
  `Object.keys(report).slice(-3)` is `['style', 'errors', 'leakCounts']`. It is not hook-locked: it is absent from
  `locked_tests` in `doit/TASK-10.4/state.json` and `doit/TASK-10.5/state.json` (and every other `doit/*/state.json`);
  it appears there only under `test_snapshot`. The builder may edit it (D-3).
- Tests: `npm test` = `vitest run --coverage`; acceptance files are `*.acceptance.test.*`; Playwright `npm run e2e`
  in Chromium and WebKit. Slow/speed checks are opt-in via `TLH_SLOW_TESTS=1` (none added here).
- Existing code to reuse:
  - `src/table/session-report.ts:132` → `bbPer100(hinted, 1, decisions)` for the percentage (A-2).
  - `src/table/session-report.ts:195-203` → `object` and `whole` for `parseHints`.
  - `src/ui/report/ReportScreen.tsx:100-109` → the existing rates `<dl>`; the hint tile is one more child.
  - `tests/ui/report-errors.acceptance.test.tsx:17-70` → `session`, `act`, `decision`, `hand`, `hands`, `render`
    helpers (copy into the new test file).
  - `tests/storage/session-end-errors.acceptance.test.ts:20-45` → the fake-indexeddb `playSession` +
    `endSession` pattern for AC#4.
  - `e2e/report-errors.spec.ts:1-40` and `e2e/hinted.spec.ts:14-27` (`button.hint-toggle`, ready hint card
    wait) for the e2e flow.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | New optional stored field `hints: { hinted: number; decisions: number }` on `SessionReport`, appended after `leakCounts`: `decisions` = number of the user's stored decision records in the session, `hinted` = how many of those have `hinted: true`. Present iff `errors` is present (A-3). No DB version change. Alternatives: (b) add `hinted` and `decisions` into `errors` (breaks locked `toEqual({ major, minor })` checks on `report.errors`, e.g. `tests/storage/session-end-errors.acceptance.test.ts:50`, `tests/ui/report-errors.acceptance.test.tsx:112`); (c) store only `hinted` (unworkable: the report does not store the hands). | (b), (c) | Separate field follows the `style`/`errors`/`leakCounts` pattern; total decisions is not derivable from any stored report field. Persisted format → ask. | yes | user (Q-1) |
| D-2 | Display: one tile added as the 4th item of the "Volume and errors" list, after "Minor errors /100": `<div class="report-hints" data-hints="hinted"><dt>Hints used</dt><dd>40 of 320 decisions (12.5%)</dd></div>`. Value format `` `${hinted} of ${decisions} ${decisions === 1 ? 'decision' : 'decisions'} (${pct}%)` `` with `pct` per A-2, and `0.0` when `decisions` is 0 (`0 of 0 decisions (0.0%)`). The class is not `report-rate`, so `rateTiles` and the three locked rate-tile checks are unchanged. The tile shares the tile box style; its `dd` uses 18px so the longer text fits a 160px column. | (b) a sentence below the tiles `Hints used on 40 of 320 decisions (12.5%).`; (c) tile value `12.5%` with `40 of 320 decisions` as a smaller second line; (d) `—` instead of `0.0%` for 0 decisions | Matches the task's example text and sits with volume and errors as REQ-044 groups them. User-visible text → ask. | yes | user (Q-2) |
| D-3 | No locked test needs editing. Hand-built reports in locked UI tests have no `hints` → no hint tile. Locked e2e and storage tests compare stored reports with `sessionReport` of the same records or select `.report-rate` only. The non-locked unit assertion `tests/table/session-report-errors.test.ts:77` is updated to `Object.keys(report).slice(-4)` = `['style', 'errors', 'leakCounts', 'hints']`. | Insert `hints` before `leakCounts` (still changes that unit line) | Appending keeps existing key order. | no | n/a |
| D-4 | The view helper `hintTile(report)` lives in `src/table/session-report.ts` next to `rateTiles` (headless); `ReportScreen` only renders it. | Format in the component | Testable without React, same as `rateTiles`. | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/session-report.ts` — modify: `HintCounts`, `SessionReport.hints?`, counting in `sessionReport`, `parseHints`, `HintTile`, `hintTile`.
- `src/ui/report/ReportScreen.tsx` — modify: render the hint tile inside the "Volume and errors" `<dl>`.
- `src/ui/styles.css` — modify: `.report-hints` tile style (shares the `.report-rate` rules; `dd` 18px).
- `tests/ui/report-hints.acceptance.test.tsx` — new (SPEC-01, SPEC-02, SPEC-03).
- `tests/storage/session-end-hints.acceptance.test.ts` — new (SPEC-04).
- `tests/table/session-report-hints.test.ts` — new (SPEC-05, SPEC-06, SPEC-07).
- `tests/table/session-report-errors.test.ts` — modify (unit, D-3): key-order assertion.
- `e2e/report-hints.spec.ts` — new (SPEC-08).
- `docs/storage/reports.md` — modify: `hints` field row, a "hints" section, the read validation, the Tests list.

### Components, interfaces and data
`src/table/session-report.ts` (additions):
```ts
/** The user's decisions in the session and how many were hinted (REQ-044.3, REQ-040.4). */
export interface HintCounts {
  /** Decision records with hinted true; 0 ≤ hinted ≤ decisions. */
  readonly hinted: number;
  /** All of the user's decision records in the session's stored hands; ≥ 0. */
  readonly decisions: number;
}

export interface SessionReport {
  …existing fields…
  /** Absent iff `errors` is absent (TASK-10.7 A-3). */
  readonly hints?: HintCounts;
}

export interface HintTile {
  readonly label: 'Hints used';
  /** "40 of 320 decisions (12.5%)", "1 of 1 decision (100.0%)", "0 of 0 decisions (0.0%)". */
  readonly value: string;
}

/** The hint-usage tile, or null for a report without `hints`. */
export function hintTile(report: SessionReport): HintTile | null;
```
In `sessionReport`, after the `errors` loop, over the same `decisions` array:
```ts
const hints = { hinted: decisions.filter((d) => d.hinted).length, decisions: decisions.length };
return { ...report, style, errors, leakCounts, hints };
```
`parseSessionReport` adds `if (report.hints !== undefined) parseHints(report.hints);` after the `leakCounts`
check, where `parseHints` does, in order: `object(value, 'hints')`; `decisions = whole(h.decisions,
'hints.decisions', 0, Number.MAX_SAFE_INTEGER)`; `whole(h.hinted, 'hints.hinted', 0, decisions)`.

`ReportScreen`: the "Volume and errors" `<dl>` is rendered when `rates.length > 0` as today; inside it, after the
three rate tiles, `hintTile(report)` (when not null) renders
`<div className="report-hints" data-hints="hinted"><dt>{label}</dt><dd>{value}</dd></div>`. No new `<dl>`,
`<section>` or heading.

### Rules and algorithms
- `pct = decisions === 0 ? '0.0' : bbPer100(hinted, 1, decisions).toFixed(1)`; `bbPer100` gives
  `floor((2000·hinted + d) / (2d)) / 10` for non-negative `hinted` with `d = decisions`.
- Worked examples:
  - AC#1: 40 of 320 → floor((80000 + 320) / 640) = 125 → `40 of 320 decisions (12.5%)`.
  - AC#2: 0 of 320 → `0 of 320 decisions (0.0%)`.
  - AC#3: 25 of 25 → floor((50000 + 25) / 50) = 1000 → `25 of 25 decisions (100.0%)`.
  - 1 of 16 → floor((2000 + 16) / 32) = 63 → `6.3%`; 1 of 3 → `33.3%`; 2 of 3 → `66.7%`.
  - 1 decision, hinted → `1 of 1 decision (100.0%)`. No decisions (one hand ended by Leave table before the user
    acted) → `0 of 0 decisions (0.0%)`.

### Error handling and configuration
- Stored `hints` that is not an object → `RangeError('Invalid session report: hints')`; bad `decisions` →
  `…: hints.decisions`; `hinted` not whole, negative or above `decisions` → `…: hints.hinted`. `getReport`
  rejects with that error as for the other fields. No configuration.

## 6. Behaviour specification

### SPEC-01: 40 of 320 decisions hinted
- Verifies: AC#1, DoD#1
- Behaviour: Given a 6-player cash session record with 160 hands, each built with two decision records, 40 of
  the 320 with `hinted: true` (grades mixed), When `sessionReport` builds the report and `ReportScreen` renders
  it, Then `report.hints` equals `{ hinted: 40, decisions: 320 }`, `hintTile(report)` equals
  `{ label: 'Hints used', value: '40 of 320 decisions (12.5%)' }`, and the "Volume and errors" list contains
  `<div class="report-hints" data-hints="hinted"><dt>Hints used</dt><dd>40 of 320 decisions (12.5%)</dd></div>`
  after the three `report-rate` tiles, which are unchanged.
- Verification: acceptance `tests/ui/report-hints.acceptance.test.tsx::AC#1 shows 40 of 320 decisions hinted as 12.5%`

### SPEC-02: No hint opened
- Verifies: AC#2, DoD#1
- Behaviour: Given the same 320 decisions with none hinted, When rendered, Then `report.hints` is
  `{ hinted: 0, decisions: 320 }` and the tile reads `Hints used` / `0 of 320 decisions (0.0%)`.
- Verification: acceptance `tests/ui/report-hints.acceptance.test.tsx::AC#2 shows 0 hinted decisions as 0.0%`

### SPEC-03: Every decision hinted
- Verifies: AC#3, DoD#1
- Behaviour: Given a session whose user made 25 decisions, all hinted, When rendered, Then `report.hints` is
  `{ hinted: 25, decisions: 25 }`, the tile reads `25 of 25 decisions (100.0%)`, and `report.errors` is
  `{ major: 0, minor: 0 }` even though some of the 25 are graded Major (hinted decisions stay out of the
  error rates, REQ-040.3).
- Verification: acceptance `tests/ui/report-hints.acceptance.test.tsx::AC#3 shows 25 of 25 decisions hinted as 100.0%`

### SPEC-04: Scripted session matches the stored records
- Verifies: AC#4, DoD#1
- Behaviour: Given a fake-indexeddb store and a 50-hand session played with `playSession` whose stored decision
  records have `hinted` set to `(handNumber + i) % 3 === 0`, When `endSession` runs and the report is read back
  with `getReport`, Then `hints.hinted` equals the number of stored decision records (read with `store.get`)
  with `hinted` true, `hints.decisions` equals the number of stored decision records, `hinted > 0`, the read-back
  report equals the returned one, and the rendered tile value equals
  `` `${hinted} of ${decisions} decisions (${bbPer100(hinted, 1, decisions).toFixed(1)}%)` ``.
- Verification: acceptance `tests/storage/session-end-hints.acceptance.test.ts::AC#4 the hinted count equals the stored decision records with the hinted flag`

### SPEC-05: Presence, key order and older reports
- Verifies: AC#1, AC#2, DoD#2
- Behaviour: Given hands that all carry `decisions`, Then `hints` is present and is the last key. Given no hands,
  or a hand without `decisions`, Then `hints` is absent (as `errors`). Given a stored report without `hints`
  (from before this story), When rendered, Then there is no `report-hints` element, the rate tiles are unchanged,
  and `hintTile` returns null. `tests/table/session-report-errors.test.ts` key-order line is updated (D-3).
- Verification: unit `tests/table/session-report-hints.test.ts::hints is present exactly when errors is and old reports show no tile`

### SPEC-06: Rounding and wording edges
- Verifies: AC#1, AC#2, AC#3, DoD#2
- Behaviour: `hintTile` gives `1 of 16 decisions (6.3%)`, `1 of 3 decisions (33.3%)`, `2 of 3 decisions (66.7%)`,
  `1 of 1 decision (100.0%)`, `0 of 1 decision (0.0%)` and `0 of 0 decisions (0.0%)`.
- Verification: unit `tests/table/session-report-hints.test.ts::hintTile rounds half up to one decimal and handles one and zero decisions`

### SPEC-07: Stored hints are validated
- Verifies: AC#4, DoD#2
- Behaviour: Given a valid report with `hints`, When JSON round-tripped through `parseSessionReport`, Then it is
  returned equal. Given `hints` = `null`, `[]`, `{ hinted: 1 }` (no `decisions`), `decisions: -1`,
  `decisions: 2.5`, `hinted: 5, decisions: 4`, `hinted: -1` or `hinted: '3'`, Then it throws `RangeError` with
  message `Invalid session report: hints`, `…: hints`, `…: hints.decisions`, `…: hints.decisions`,
  `…: hints.decisions`, `…: hints.hinted`, `…: hints.hinted` and `…: hints.hinted` respectively.
- Verification: unit `tests/table/session-report-hints.test.ts::parseSessionReport validates hints`

### SPEC-08: Screen flow in the browser
- Verifies: DoD#7, DoD#8, DoD#1
- Behaviour: Given the app with a paused clock and replay words for which the user acts in hand 1, When the user
  starts a 6-player cash game, opens Hint (`button.hint-toggle`, ready card) before their first action, plays
  hand 1 to the result and selects Leave table, Then the Session Report's "Volume and errors" list shows the
  `Hints used` tile whose value equals the text built from the stored report's `hints`; the stored `hints` equals
  `sessionReport(storedSession, endedAt, storedRecords).hints` and has `hinted ≥ 1`; axe reports no serious or
  critical violations; and every request is to the app's own origin. Runs in Chromium and WebKit.
- Verification: acceptance `e2e/report-hints.spec.ts::Leave table shows how many decisions used a hint`

### SPEC-09: Project checks
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#10
- Behaviour: Given the change, When the checks run, Then `npm run lint`, `npm run typecheck` and `npm test`
  (including the golden-spot suite and coverage thresholds) pass and the CI workflow is green on the branch.
  `src/table/session-report.ts` gains no UI or browser import; no engine, bots, advice or statistics file changes.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-10: Documentation
- Verifies: DoD#11
- Behaviour: `docs/storage/reports.md` lists `hints` in the Fields table, has a "hints" section (what is counted,
  presence rule, the tile text and rounding with the worked examples, older reports show no tile), adds the
  `hints` checks to "Reading", and lists the new tests. The story doc is published to Backlog.md.
- Verification: manual `docs/storage/reports.md` section "hints" and `backlog doc list --plain` entry for TASK-10.7

### SPEC-11: Not-applicable DoD items
- Verifies: DoD#6, DoD#9, DoD#12
- Behaviour: DoD#6 does not apply: no engine, bots or advice change, so no playtest is needed. DoD#9 does not
  apply: no strategy content. DoD#12 does not apply: the offline service worker (E13-S07, TASK-13.4/13.8) is not
  done, and no screen or dialog is added.
- Verification: manual `git diff --stat main -- src/engine src/bots src/advice src/stats` is empty

## 7. Edge cases
- Zero decisions in the session (a single hand ended by Leave table before the user acted, or only walks):
  `0 of 0 decisions (0.0%)` (SPEC-06, D-2).
- One decision: singular `decision` (SPEC-06).
- All hinted / none hinted (SPEC-02, SPEC-03). Rounding at .x5 (SPEC-06).
- Reports stored before this story, or hand-built reports without `hints`: no tile (SPEC-05).
- Corrupt stored `hints` (SPEC-07).
- A skipped missing/invalid hand record contributes nothing to either count (same as `errors`, docs "Ending").
- Sit-and-go: the tile appears in the same list (the list already appears for sit-and-go reports with `errors`).
- Concurrency, interruption, permissions, dependency failure: N/A. No new I/O; the report is still written once
  in the existing transaction.

## 8. Security considerations
- Stored reports from IndexedDB are untrusted: `parseSessionReport` validates `hints` (SPEC-07). Hand records are
  validated by `parseHandRecord` (including `hinted`, `src/table/hand-record.ts:432`) before they reach
  `sessionReport`.
- All text renders as React text. No authn, secrets, network, randomness or new dependencies: N/A.

## 9. Non-functional
- Counting is O(decisions) once at session end. No measurable cost.
- New unit/acceptance tests use synthetic hands; SPEC-04 plays 50 hands (well under the 200-hand TASK-10.4 test).
  No speed or scale check is added, so nothing goes in the `TLH_SLOW_TESTS=1` group.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`, then New game → Start game → open Hint before some actions → play hands → Leave
  table → read the "Hints used" tile
- New tests (path → SPEC ids):
  - `tests/ui/report-hints.acceptance.test.tsx` → SPEC-01, SPEC-02, SPEC-03
  - `tests/storage/session-end-hints.acceptance.test.ts` → SPEC-04
  - `tests/table/session-report-hints.test.ts` → SPEC-05, SPEC-06, SPEC-07
  - `e2e/report-hints.spec.ts` → SPEC-08 (`npm run e2e -- e2e/report-hints.spec.ts`)
  - Modified: `tests/table/session-report-errors.test.ts` (D-3)
- Judge scenario:
  1. `npm run dev`, start a 6-player cash game, play about 10 hands, opening Hint before roughly a third of your
     actions.
  2. Leave table; note the "Hints used" tile.
  3. In DevTools → IndexedDB → `tlh-trainer` → `hands`, count this session's decision records and those with
     `hinted: true`; confirm the tile shows `<hinted> of <total> decisions (<pct>%)` with pct to one decimal and
     that the stored report's `hints` matches.
  4. Reload and reopen the report; confirm it is unchanged.

## 11. Open questions
- None. Q-1 (separate `hints` field, D-1) and Q-2 (4th "Hints used" tile as specified, D-2) answered with the recommended options; see `doit/TASK-10.7/qa.md`.

## 12. Clarifications log
See `doit/TASK-10.7/qa.md`.
