---
id: doc-127
title: 'TASK-10.4: See my hands played and error rates per 100 hands in the report'
type: other
created_date: '2026-11-24T22:39:00Z'
updated_date: '2026-11-24T22:39:00Z'
---
# TASK-10.4: See my hands played and error rates per 100 hands in the report

Status: Done · Completed: 2026-11-24 · Epic: TASK-10 — Read the session report · Milestone: m-1 · Requirements: REQ-044 (044.2), REQ-040 (040.3) · Branch: doit/TASK-10.4

## What was asked
The Session Report shows three KPI tiles: Hands played, Major errors /100 and Minor errors /100. Each rate is the count of the user's unhinted decisions graded Major (or Minor) divided by hands played, times 100, with one decimal. Hinted decisions are excluded. Values come from stored decision records, never from re-running the advice engine. Spec: doit/TASK-10.4/spec.md.

## Assumptions made without asking — please review
All six were auto-accepted (qa.md), as was Q-1 below.

| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Rate = `bbPer100(count, 1, handsPlayed).toFixed(1)` (half-up integer arithmetic); denominator is the report's `handsPlayed`. | yes | Reuses the existing half-up helper. | Swap the formula in `rateTiles`. |
| A-2 | The three tiles sit in their own `<dl class="report-kpis report-rates" aria-label="Volume and errors">` after the cash tiles, with class `report-rate`. The storyboard shows them in the same row as Result/BB/100. | yes | Locked tests pin `.report-kpi` to exactly Result/BB/100/Rebuys and `reportView` to `{header, tiles}`. | Merge into `.report-kpi` and edit 3 locked TASK-10.1 tests. |
| A-3 | Reports stored before this story have no `errors`. They parse fine and show none of the three tiles. | yes | Reports are write-once and can't be back-filled. | Show "Hands played" alone for old reports. |
| A-4 | `errors` is present only if there is at least 1 hand and every hand carries `decisions`. `ReportHand.decisions` is optional. | yes | Keeps locked TASK-10.3 tests that build hands without `decisions` valid. | Make `decisions` required and edit the locked test. |
| A-5 | A hand record skipped at session end (missing or invalid) adds no errors. The denominator stays `handsPlayed`. | yes | Same rule as `style`. | Use `style.handsDealt` as denominator. |
| A-6 | Hands played is shown as a plain number, no thousands separator. | yes | Matches the header line. | Format as `1,500`. |

## Clarifications and decisions
- Q-1 (persisted format): optional `errors: { major, minor }` counts on the stored report, written once at session end in the existing end transaction. Auto-accepted as the recommended option. This is a persisted-format change, so please review it.
- D-1: that format. Rates are derived at display time from the counts and `handsPlayed`. No DB version change.
- D-2: counting happens inside `sessionReport`, so `ended` and the hand store are unchanged.
- D-3: no locked test edits (each checked in spec §4).
- Build notes (auto-accepted): the SPEC-04 test has an explicit 120 s timeout. SPEC-09 finds the tiles with `getByLabel("Volume and errors")` because `<dl>` has no ARIA list role.

## What was built
- `src/table/session-report.ts`: `ReportDecision`, optional `ReportHand.decisions`, `ErrorCounts` and optional `SessionReport.errors`. `sessionReport` counts unhinted Major and Minor decisions. `parseErrors` validates stored values (whole numbers, 0 to MAX_SAFE_INTEGER). `rateTiles(report)` returns `[]` without `errors`, otherwise the hands, major and minor tiles.
- `src/ui/report/ReportScreen.tsx`: renders the "Volume and errors" list between the cash tiles and the style section.
- `src/ui/styles.css`: `.report-rate` shares the `.report-kpi` rules.
- `docs/storage/reports.md`: field, count rule, rate formula, legacy reports, validation.
- Forced folds (TASK-10.2) have no decision entry, so they never count as errors.
- Worked example: 12 unhinted Major in 200 hands gives `6.0`. 28 Minor gives `14.0`.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..03, 06 | AC#1-3, placement, legacy | `tests/ui/report-errors.acceptance.test.tsx` | pass | judge round 1 |
| SPEC-04 | AC#4 | `tests/storage/session-end-errors.acceptance.test.ts` (scripted 200 hands, fake-indexeddb) | pass | judge round 1 |
| SPEC-05, 07, 08 | count rule, presence, validation | `tests/table/session-report-errors.test.ts` | pass | judge round 1 |
| SPEC-09 | browser flow, axe, same-origin | `e2e/report-errors.spec.ts` (Chromium + WebKit) | pass | judge round 1 |
| SPEC-10..12 | lint, typecheck, tests, docs, N/A DoD | `npm run lint && npm run typecheck && npm test` | pass | gates build-1, fix-2 |

- `npm test`: 1291 passed, 0 failed. Lint and typecheck exit 0. CI runs for build and review r1 were green.
- Judge end-to-end on the real app (both browsers): a 6-hand session with 4 hinted decisions, then Leave table with a forced fold. The tiles showed `6`, `100.0`, `0.0`. This matched the stored records, and the report was unchanged after reload.
- Judge round 1 passed 12/12. No send-backs, no escalations, 2 gate runs.

## Review
Round 1: no blocking findings. Security review had no findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR (`src/table/session-report.ts:166`): `hand.decisions as readonly ReportDecision[]` is an unneeded cast. Iterating `hand.decisions ?? []` would remove it.
- NIT (`tests/table/session-report-errors.test.ts:77`): the rounding cases (1/3, 1/8, 1/1500) never hit an exact half boundary. A case like 1 in 16 hands (6.25 gives `6.3`) would pin half-up.

## How to try it
`npm run dev`, then New game, Start game, play a hand and click Leave table. Read the "Volume and errors" tiles. Run the tests with `npm test` and `npm run e2e`.

## Run metrics
Questions 1 · assumptions 6 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 558.

## Known limitations and follow-ups
- [trainer] Remove the unneeded cast in `sessionReport` (MINOR, code review). Owner: TASK-10.4 follow-up or any TASK-10 report story.
- [trainer] Add an exact half-up boundary test for the rates, for example 1 Major in 16 hands giving `6.3` (NIT).
- [trainer] Rate tiles sit in their own row rather than the storyboard's single row (A-2). Merging needs 3 locked TASK-10.1 test edits.
- [trainer] Reports stored before this story show no tiles (A-3).
- [infra] SPEC-04 adds about 40 s to local `npm test` under coverage; it runs uncovered on CI. It has not caused a failure, so it is not a follow-up.

### Not tracked (infra, below the value bar)
- SPEC-04 local runtime under coverage (see above).

## Lessons for the factory (proposals — not applied)
- The spec measured SPEC-04 at about 5.7 s uncovered, but it ran about 27 s alone and 44 s under local coverage. Proposal: spec time estimates should be measured under `npm test` coverage.
