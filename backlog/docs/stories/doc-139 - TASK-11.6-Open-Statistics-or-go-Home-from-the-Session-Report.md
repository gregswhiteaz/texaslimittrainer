---
id: doc-139
title: 'TASK-11.6: Open Statistics or go Home from the Session Report'
type: other
created_date: '2026-11-25T14:22:00Z'
updated_date: '2026-11-25T14:22:00Z'
---
# TASK-11.6: Open Statistics or go Home from the Session Report

Status: Done · Completed: 2026-11-25 · Epic: TASK-11 · Milestone: m-1 · Requirements: REQ-044 (044.6) · Branch: doit/TASK-11.6

## What was asked
The Session Report gets a second control, "View statistics", next to the existing "Back to Home". View statistics opens Statistics (All / All / Every 500 hands) with totals that include the session that just ended. Back to Home keeps its behaviour: Home opens with no Resume for the ended session. Leaving the report writes nothing. Spec: doit/TASK-11.6/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | View statistics opens Statistics through the same state reset as Home's entry (default filters and grouping, fresh read of the store). | yes | Same path as today. The session was written before the report showed, so the totals include it. | Pass the report's session into Statistics. |
| A-2 | Statistics' `← Home`, when reached from the report, goes to Home with no Resume (the session has `endedAt`). | yes | Existing handler, unchanged. | Add a Back-to-report control (out of scope). |
| A-3 | Focus on opening the report is unchanged (the heading). Tab order is View statistics, then Back to Home. | yes | Matches the storyboard and the existing focus rule. | Focus Back to Home on open. |

## Clarifications and decisions
Both questions were auto-accepted at the recommended option (autopilot).
- Q-1: `ReportScreen` takes an optional `onStatistics` prop and shows the button only when it is given. App always passes it. No locked test is edited. The alternative was to always render it and edit five assertions in four locked TASK-10.x files.
- Q-2: Label, order and placement follow the storyboard `Report.dc.html`. View statistics (outlined) comes first, then Back to Home (red), in one right-aligned row at the bottom.
- D-2: One `openStatistics()` in App serves Home and the report.
- D-4: No browser-history entry (only the Table adds them, TASK-2.14 D-2).

## What was built
- `src/ui/report/ReportScreen.tsx`: the optional `onStatistics` prop, and a `.report-actions` row at the end of `<main>`.
- `src/ui/App.tsx`: `openStatistics()` is used by Home's Statistics entry and the report's View statistics. The `Screen` union is unchanged.
- `src/ui/styles.css`: the `.report-actions` right-aligned flex row.
- `docs/ui/navigation.md`: the Session report and Statistics rows, and a paragraph on View statistics.
- `tests/ui/report-navigation.acceptance.test.tsx` (new) and `e2e/report-navigation.spec.ts` (new).

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01, 02 | Buttons and order, and only Back to Home without the handler | `tests/ui/report-navigation.acceptance.test.tsx` | PASS | npm test |
| SPEC-03 | Opens Statistics with the ended session in the totals, Tab order, axe, nothing written | `e2e/report-navigation.spec.ts` (Chromium and WebKit) | PASS | judge round 1 |
| SPEC-04 | Back to Home shows no Resume | same | PASS | judge round 1 |
| SPEC-05 | Filters reset on opening | same | PASS | judge round 1 |
| SPEC-06..08 | Checks, coverage, docs, N/A DoD items | lint, typecheck, npm test | PASS | gates/build-1, gates/fix-2 |

- `npm test`: 1383 tests passed, 46 skipped. Overall line coverage is 94.02%. Lint and typecheck exit 0.
- Judge round 1 ran the repo e2e in both browsers against the production preview: 64 passed, 2 skipped (existing opt-in slow tests), 0 failed. Branch CI at HEAD is green.
- Judge verdict: PASS 8/8. No failed items and no sendbacks.

## Review
No blocking findings (review round 1: code and security).

### Non-blocking review notes (deliberately not fixed)
- MINOR (code, judge J-1-01): the comment in `e2e/report-navigation.spec.ts` says WebKit needs Alt+Tab. That is a macOS Full Keyboard Access setting. The test could fail on a Mac with it on.
- MINOR (code): the placement block at `tests/ui/report-navigation.acceptance.test.tsx:67-74` is redundant.
- NIT: `.report-actions` duplicates the `.config-actions` CSS.
- Scope: 313 changed lines against a budget of 230. The reviewer judged it justified (mostly tests).

## How to try it
`npm run dev`, then New game, Start game, play a hand, Leave table. On the report press View statistics (totals include the session), then `← Home` (no Resume). To run the checks: `npm test && npx playwright test e2e/report-navigation.spec.ts`.

## Run metrics
Questions 2 (auto-accepted) · assumptions 3 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 313 (budget 230).

## Known limitations and follow-ups
- Statistics has no way back to the report. Reopening stored reports from Home is E02-S16 (M3). `ReportScreen` already takes both handlers as props.
- [trainer] Make the WebKit Tab-order step in `e2e/report-navigation.spec.ts` robust: use Alt+Tab only on darwin WebKit, or reword the comment (judge J-1-01). Owner: TASK-11.6.
- [trainer] Remove the redundant placement block at `tests/ui/report-navigation.acceptance.test.tsx:67-74`. Owner: TASK-11.6.
- Not tracked (trivial NIT): the `.report-actions` and `.config-actions` CSS duplication.

## Lessons for the factory (proposals — not applied)
- The build exceeded the line budget (313 vs 230) because the spec budget did not count the test files. Proposal: have the spec template state whether the budget includes tests.
