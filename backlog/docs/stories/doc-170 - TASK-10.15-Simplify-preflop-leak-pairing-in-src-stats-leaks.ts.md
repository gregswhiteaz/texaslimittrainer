---
id: doc-170
title: 'TASK-10.15: Simplify preflop leak pairing in src/stats/leaks.ts'
type: other
created_date: '2026-11-26T18:38:00Z'
updated_date: '2026-11-26T18:38:00Z'
---
# TASK-10.15: Simplify preflop leak pairing in src/stats/leaks.ts

Status: Done · Completed: 2026-11-26 · Epic: TASK-10 - Read the session report · Milestone: m-1 · Requirements: n/a · Branch: doit/TASK-10.15

## What was asked
Follow-up from the TASK-10.6 review (doc-131). `handCategoryDecisions` rebuilt the seat list and the user's position group for every paired preflop decision, and copied the "user's non-blind action" test from `userMade` in `src/table/hand-record.ts`. AC#1: compute seat list and group once per hand, existing leak tests unchanged. AC#2: reuse the hand-record helper with the same results. Spec: doit/TASK-10.15/spec.md.

## Assumptions made without asking - please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Group is computed lazily on the first preflop decision that pairs, not eagerly | yes | Eager would throw RangeError for a hand whose user seat is not dealt in even when nothing pairs; today it does not throw | Compute before the loop when `button` is set |
| A-2 | Reuse by exporting `userMade` as is; pair by matching records by reference against its output | yes | One-word change; behaviour identical | Export a per-record predicate that `userMade` calls |
| A-3 | New test in a new file, `tests/stats/preflop-pairing.test.ts` | yes | Keeps existing test files byte-identical | Move the cases into `preflop-leaks.test.ts` |

## Clarifications and decisions
No questions asked. D-1: `leaks.ts` imports `userMade` at runtime from `../table/hand-record` (precedent: `stats/trends.ts`; no import cycle; headless lint allows it).

## What was built
- `src/table/hand-record.ts`: `userMade` exported, body unchanged.
- `src/stats/leaks.ts`: `handCategoryDecisions` pairs over `userMade(hand.actions, userSeat)`; seat list and `positionGroup` computed once, lazily. No `'small-blind'`/`'big-blind'` literals remain.
- `tests/stats/preflop-pairing.test.ts`: new, 8 assertions.
No output, error, type or existing test changed. No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | unit: seats read exactly once across 3 paired decisions | PASS | judge round 1 |
| SPEC-02 | AC#1 | unit: no seat read when nothing pairs; RangeError kept only when a preflop decision pairs | PASS | judge round 1 |
| SPEC-03 | AC#2 | grep + unit: import present, no blind literals, user's blind skipped | PASS | judge round 1 |
| SPEC-04 | AC#1 | existing test files unchanged, suite green | PASS | judge round 1 |
- Judge round 1 PASS (4/4). A base-vs-head differential over 200k fuzzed hands and 60 generated sessions gave identical results. CI run 45876467250 green. Gate runs: 1.

## Review
No findings in review round 1.

### Non-blocking review notes (deliberately not fixed)
None.

## How to try it
`npx vitest run tests/stats/preflop-pairing.test.ts tests/stats/preflop-leaks.test.ts`

## Run metrics
Questions 0 · assumptions 3 · review rounds 1 · judge rounds 1 · gate runs 1 · escalations 0 · sendbacks 0.

## Known limitations and follow-ups
None.

## Lessons for the factory (proposals - not applied)
None; the run was clean.
