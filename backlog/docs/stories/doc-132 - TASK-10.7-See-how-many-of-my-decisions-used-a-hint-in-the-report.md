---
id: doc-132
title: 'TASK-10.7: See how many of my decisions used a hint in the report'
type: other
created_date: '2026-11-25T07:27:00Z'
updated_date: '2026-11-25T07:27:00Z'
---
# TASK-10.7: See how many of my decisions used a hint in the report

Status: Done · Completed: 2026-11-25 · Epic: TASK-10 — Read the session report · Milestone: m-1 · Requirements: REQ-040 (040.4), REQ-044 (044.3) · Branch: doit/TASK-10.7

## What was asked
The Session Report shows how many of the user's decisions used a hint, and that as a percentage of all the user's decisions, to one decimal (for example `40 of 320 decisions (12.5%)`). Cases covered: some hinted, none hinted, all hinted, and a scripted session whose count matches the stored decision records. Spec: doit/TASK-10.7/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | "All decisions" means every stored decision record of the session's hands, whatever grade or street. A forced fold after Leave table has no record, so it counts in neither number. | yes | Same base as `errors`. | Count from `actions` instead |
| A-2 | Percentage is rounded half up to one decimal with the existing `bbPer100(hinted, 1, decisions).toFixed(1)` (1 of 16 = 6.3, 1 of 3 = 33.3, 2 of 3 = 66.7). | yes | Same rounding as the rate tiles; no float error. | Use float rounding |
| A-3 | `hints` is present exactly when `errors` is, and is appended after `leakCounts`. | yes | Same presence rule as `leakCounts`; keeps locked tests unchanged. | Always write it |
| A-4 | `parseSessionReport` checks `hints` alone (whole `decisions` >= 0, 0 <= `hinted` <= `decisions`); no cross-check against `errors`/`leakCounts`. | yes | `errors` and `leakCounts` are not cross-checked either. | Add a cross-check |
| A-5 | A report stored before this story (no `hints`) shows no hint tile. | yes | Reports are write-once and not back-filled. | Show "—" |

## Clarifications and decisions
Both questions were auto-accepted with the recommended option (autopilot); please review them.
- Q-1 (stored format): separate optional `hints: { hinted, decisions }` after `leakCounts` (D-1). Nesting in `errors` would break locked `toEqual({major, minor})` checks; storing only `hinted` can't give a percentage.
- Q-2 (screen text): a 4th tile in "Volume and errors": `Hints used` / `40 of 320 decisions (12.5%)`; singular `1 of 1 decision`; `0 of 0 decisions (0.0%)` when there are none; value text 18px (D-2).
- D-3: no locked test edited; two non-locked key-order unit assertions changed to `slice(-4)` ending in `'hints'`.
- D-4: `hintTile(report)` is headless, in `src/table/session-report.ts`, next to `rateTiles`.

## What was built
- `src/table/session-report.ts`: `HintCounts`, optional `SessionReport.hints`, counting in `sessionReport`, `parseHints` in `parseSessionReport` (RangeError `Invalid session report: hints[.decisions|.hinted]`), `hintTile(report)` returning `{label:'Hints used', value}` or null.
- `src/ui/report/ReportScreen.tsx`: renders `<div class="report-hints" data-hints="hinted">` as the 4th item in the "Volume and errors" list. The class is not `report-rate`, so `rateTiles` and the locked rate-tile checks are unchanged.
- `src/ui/styles.css`: `.report-hints` shares the tile rules; `dd` is 18px.
- `docs/storage/reports.md`: `hints` row, "hints" section, read validation, test list.
- Tests: new `tests/ui/report-hints.acceptance.test.tsx`, `tests/storage/session-end-hints.acceptance.test.ts`, `tests/table/session-report-hints.test.ts`, `e2e/report-hints.spec.ts`; modified `tests/table/session-report-errors.test.ts` and `tests/table/session-report-leaks.test.ts` (key order).
- No grading, engine, bots, advice, storage or DB version change; no new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..03 | AC#1-3 (40/320, 0/320, 25/25) | acceptance `tests/ui/report-hints.acceptance.test.tsx` | PASS | judge round 1 |
| SPEC-04 | AC#4 stored records match | acceptance `tests/storage/session-end-hints.acceptance.test.ts` (50 hands, fake-indexeddb) | PASS | judge round 1 |
| SPEC-05..07 | presence, rounding, validation | unit `tests/table/session-report-hints.test.ts` | PASS | judge round 1 |
| SPEC-08 | screen flow, axe, own origin | e2e `e2e/report-hints.spec.ts` (Chromium, WebKit) | PASS | judge round 1 |
| SPEC-09..11 | lint, typecheck, tests, docs, N/A items | `npm run lint && npm run typecheck && npm test` | PASS | gates/fix-2.json |

- `npm test`: 1329 passed, 45 skipped; lint and typecheck clean; coverage thresholds met. Related e2e (report-hints, report-errors, report-style, report-leaks, session-report, hinted) 22/22 in both browsers.
- Judge round 1: PASS 11/11, test-integrity clean. Independent end-to-end on the production build: Chromium 15 of 44 decisions hinted, tile `15 of 44 decisions (34.1%)`; WebKit `13 of 38 decisions (34.2%)`; both matched the stored records, tile is the 4th item, report unchanged after reload.

## Review
Round 1: code reviewer 1 MINOR plus a NIT, security reviewer none. No blocking findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR (code, J-1-01): `e2e/report-hints.spec.ts` takes its expected tile text from `hintTile` itself, so it checks wiring, not wording. The unit tests and the judge's independent run cover the format.
- NIT: the spec missed `tests/table/session-report-leaks.test.ts` (key-order assertion), so 10 files were changed against a budget of 9. Handled the same way as D-3.
- Security note: a stored report with `hints` but no `errors` validates but shows no tile (the app always writes them together). No security impact.

## How to try it
`npm run dev`, New game, Start game, open Hint before some actions, play hands, Leave table, read "Hints used" under "Volume and errors". Tests: `npm test`; `npm run e2e -- e2e/report-hints.spec.ts`.

## Run metrics
Changed lines: 476 added, 11 removed in src/tests/e2e/docs. Questions 2 (auto-accepted) · assumptions 5 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · sendbacks 0.

## Known limitations and follow-ups
- [trainer] Make `e2e/report-hints.spec.ts` assert the literal wording (build the expected text without `hintTile`). Owner: none known; fits an AC on TASK-10.7's area or a small new task.
- [trainer] Show the tile (or reject the report) when stored `hints` exists without `errors`; today it validates but renders nothing. Low value, app never writes that combination.
- Hint usage across sessions is out of scope here (TASK-11.x).

## Lessons for the factory (proposals — not applied)
- The spec's file list missed a non-locked test with the same key-order assertion (`session-report-leaks.test.ts`), giving 10 files against a budget of 9. Proposal: the spec step should grep for the assertion pattern it plans to change (here `Object.keys(report).slice(-3)`) and list every hit.
