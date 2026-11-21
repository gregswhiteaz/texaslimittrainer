# TASK-3.22: Pin the hand-result edge cases

Status: Done · Completed: 2026-11-20 · Epic: TASK-3 — Play hands at the table · Milestone: m-0 · Requirements: n/a (follow-up from TASK-3.4 review, doc-25, and TASK-2.18, doc-50) · Branch: doit/TASK-3.22

## What was asked
Three correct but untested behaviours of `src/table/hand-result.ts` needed tests. The behaviours were: high-card naming uses the highest rank, the `Seat <n> is not at the table` invariant throw, and "Your shown cards" showing the user's own hole cards. This was a test-only chore. Spec: doit/TASK-3.22/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | AC#2 is met by covering the throw with a test, not by removing it. | yes | TASK-3.4 A-5 chose explicit `RangeError` throws over non-null casts. | Remove the throw and use a non-null assertion, then drop the test. |
| A-2 | AC#3 uses a crafted session: user at seat 3, seats 1, 2, 3 and 5 shown at showdown. | yes | The user's cards then differ from the first-shown seat and from seat 5. This catches the "first shown", "last shown" and "hard-coded seat 5" mutants. | Use the user at seat 1, which misses the `showdown[0]` mutant. |
| A-3 | AC#1 uses `9c 2d` with board `Ks Jd 6c 4h 3s`, which should read "King high". | yes | The example comes from doc-25. It has no straight and no flush. | Any high-card hand whose top rank is on the board. |

## Clarifications and decisions
No questions asked. D-1: new test files only; existing and locked tests are untouched. D-2: keep the throw and cover it (A-1).

## What was built
Tests only; no change under `src/` and no new dependencies.
- `tests/table/hand-result-edges.acceptance.test.ts` (new) covers SPEC-01 (King high, with the top card on the board) and SPEC-02 (a winner missing from `table.seats` throws `RangeError('Seat 2 is not at the table')`).
- `tests/ui/user-shown-cards.acceptance.test.tsx` (new) covers SPEC-03 (seat-3 user showdown; "Your shown cards" holds the user's own Ac Ad).

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | New test, shown to fail on two mutants | PASS | M1a failed with `'Nine high'` and M1b with `'Two high'`, each against `'King high'` |
| SPEC-02 | AC#2 | New test, shown to fail on a mutant | PASS | M2 failed with a `TypeError` instead of the `RangeError` |
| SPEC-03 | AC#3 | New test, shown to fail on four mutants | PASS | M3a to M3d showed `7c 2d` or `Kh Kd` instead of `Ac Ad` |

- Gate run 1 passed. `npm test` ran 106 files: 370 passed, 6 skipped. Lint and typecheck were clean. `git diff --stat src` was empty after the mutants were reverted.
- Judge round 1: PASS. All three ACs are proven, with no blocking findings.

## Review
Round 1 (code and security) found no blocking findings.

### Non-blocking review notes (deliberately not fixed)
- NIT: the throw test calls the function twice, once for the error class and once for the message. This is intentional, so it was not changed.

## How to try it
`npx vitest run tests/table/hand-result-edges.acceptance.test.ts tests/ui/user-shown-cards.acceptance.test.tsx`

## Run metrics
Questions 0 · assumptions logged 3 · review rounds 1 · judge rounds 1 · gate runs 1 · escalations 0 · changed lines 79 (2 files).

## Known limitations and follow-ups
None new. Other doc-25 and doc-50 follow-ups are out of scope and are tracked elsewhere.

## Lessons for the factory (proposals — not applied)
None. The run was clean.
