---
id: doc-133
title: 'TASK-10.8: See my three most costly leaks first'
type: other
created_date: '2026-11-25T08:10:00Z'
updated_date: '2026-11-25T08:10:00Z'
---
# TASK-10.8: See my three most costly leaks first

Status: Done · Completed: 2026-11-25 · Epic: TASK-10 — Read the session report · Milestone: m-1 · Requirements: REQ-044.5, REQ-047.3 · Branch: doit/TASK-10.8

## What was asked
The Session Report's "Biggest leaks this session" lists at most three leaks, ranked by unhinted Major errors (most first), then by error rate. Before this story, every qualifying leak was listed in category data order. Spec: doit/TASK-10.8/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | `sessionLeaks` itself ranks and caps at 3. There is no separate uncapped function. | yes | Its only production caller is `ReportScreen`, and REQ-044.5 caps the report at 3. | Add `topLeaks(counts)` and keep `sessionLeaks` uncapped. |
| A-2 | The list stays a `<ul>` with the same item markup. Rank is shown by order only. | yes | Locked tests assert the exact markup, and the storyboard has no rank numbers. | Switch to `<ol>`. This needs two locked-test edits. |
| A-3 | DoD#7 (Playwright in both browsers plus axe) is met by the unchanged locked `e2e/report-leaks.spec.ts`. Ranking and cap are proven by server-rendered acceptance tests. | yes | Same approach as TASK-10.6. No e2e helper can seed a multi-leak session. | Add an e2e that seeds about 45 hand records. |
| A-4 | Ranking does not depend on the order of stored `leakCounts`. | yes | `sessionLeaks` already looks counts up by category. | n/a |

## Clarifications and decisions
- Q-1 (tie-break when Major count and error rate are equal): auto-accepted the recommended option. More errors first, then category data order.
- Q-2 (new text such as "N more leaks"): auto-accepted the recommended option. No new text.
- D-1: ranking is computed at display time from the stored `leakCounts`. The stored format is unchanged, so older reports are ranked too.

## What was built
- `src/stats/leaks.ts`: adds `MAX_SHOWN_LEAKS = 3` and a non-exported `compareLeaks`. It sorts by Major descending, then exact integer error rate descending, then errors descending, then data order. `sessionLeaks` now ranks and caps.
- `src/ui/report/ReportScreen.tsx`: doc comment only.
- `tests/ui/report-leak-ranking.acceptance.test.tsx` (new, locked): rendered-report tests for Major-first, rate-second and the top-3 cap.
- `tests/stats/leaks.test.ts`: unit test for tie-breaks, preflop and postflop mixed, the cap, input order and immutability, and ignored categories.
- `docs/stats/leaks.md`: ranking rule with example and the cap.
- No stored-format, detection or text changes. No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..03 | AC#1-#3 | New acceptance test on the rendered report | PASS | tests/ui/report-leak-ranking.acceptance.test.tsx |
| SPEC-04 | Rule details and cap | Unit test | PASS | tests/stats/leaks.test.ts |
| SPEC-05..09 | Format unchanged, project checks, e2e, docs, N/A DoD | `npm test`, locked tests, e2e | PASS | gates/fix-2.json |

- Judge round 1: PASS, 9/9 spec items, no blocking findings, no unproven AC or DoD (judge/verdict-1.json).
- Gate runs: 2 (build, fix), both PASS.

## Review
No blocking findings. 1 review round.

### Non-blocking review notes (deliberately not fixed)
- NIT (tests/stats/leaks.test.ts:155): the "equal in all three: data order" case would still pass without the category-position step. Candidates are generated in data order and the sort is stable. The output is correct either way.

## How to try it
`npm test`, or `npm run e2e` for the report flow. Finish a session with 3 or more leak categories, then open the Session Report.

## Run metrics
Questions 2 · assumptions 4 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 288.

## Known limitations and follow-ups
- None needed. The NIT above is accepted.
- TASK-2.16 "Top leak" can take element 0 of `sessionLeaks` (A-1).

## Lessons for the factory (proposals — not applied)
None. The run had no failures, send-backs or slow steps.
