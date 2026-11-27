---
id: doc-192
title: 'TASK-7.47: Make the short-handed TAG postflop test cover river raises'
type: other
created_date: '2026-11-27T13:23:00Z'
updated_date: '2026-11-27T13:23:00Z'
---
# TASK-7.47: Make the short-handed TAG postflop test cover river raises

Status: Review (not set Done) · Completed: 2026-11-27 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: n/a (follow-up of TASK-7.46 judge finding J-1-03, doc-185) · Branch: doit/TASK-7.47

## What was asked
The locked 3-seat TAG postflop check plays 50 hands (seed 42), and that sample has no river view where TAG raises. A mutation in `decideTag` that turns a river raise into a call therefore passed. The task: add a targeted river-raise check so that mutation fails a test. Spec: doit/TASK-7.47/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | AC#1 is met by a NEW acceptance file next to the locked one, not an edit to the locked file. | yes | Avoids a cross-story unlock of TASK-7.46's locked test. The outcome is the same: the river raise->call mutation fails a test. | Enlarge the locked file's sample (50 -> 500 hands) via `doit.py unlock TASK-7.46`. |
| A-2 | Sample: cash, 3 seats, seed 3, 200 hands, TAG in every seat. | yes | Probe found 6 TAG river-raise views (hands 35, 78, 182) in about 125 ms. | Seed 42 / 500 hands (8 raises), or seed 3 / 200 hands at 4 seats (9 raises). |
| A-3 | The non-vacuity guard is `riverRaises > 0`, not an exact count. | yes | An exact count would break on any legitimate advice-engine tuning. | Use `>= 6`. |

## Clarifications and decisions
No questions asked (autopilot, no ask items). D-1: new file, locked file untouched. D-2: besides comparing to the engine move, assert `decideTag(...).type === 'raise'` where the engine raises.

## What was built
- `tests/bots/tag-short-handed-river.acceptance.test.ts` (36 lines), one test. It runs `runPlaytest({hands: 200, seed: 3, size: 3})` and captures every river view. For each view it replays `decideTag` with that view's bot decision seed and expects the move to equal `recommend(view, {...BOT_ADVICE, equity: BOT_EQUITY}).move`. Where the engine raises, it also expects a TAG `raise`. It asserts 0 playtest violations, `river.length > 0` and `riverRaises > 0`.
- No changes under `src/` or to the locked `tag-short-handed.acceptance.test.ts`. No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | New acceptance test | PASS | build-log.md; judge round-1: new file and the locked short-handed file, 2 files / 4 tests pass |
| SPEC-02 | AC#1 | Mutation: `decideTag` returns `call` on river when engine raises | PASS | With the mutation: 1 failed (`river seat 2: expected call 8 to equal raise 16`). After revert: passes. `git diff main -- src/` and the locked file are empty. The judge repeated the mutation in a scratch worktree. |
- `npm test`: 349 files passed / 11 skipped; 1546 tests passed / 60 skipped. The new test took 1136 ms under coverage (budget 3 s). Lint, typecheck and format are clean.
- Judge: PASS in round 1, no failed items, no unproven AC.

## Review
Round 1 (code and security): no findings.

### Non-blocking review notes (deliberately not fixed)
None.

## How to try it
`npx vitest run tests/bots/tag-short-handed-river.acceptance.test.ts tests/bots/tag-short-handed.acceptance.test.ts`

## Run metrics
Questions 0 · assumptions logged 3 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines: 1 new test file (36 lines).

## Known limitations and follow-ups
- The sample is tied to seed 3 / 200 hands. If advice tuning removes all river raises from it, the test fails loudly and the seed or hand count must be re-chosen (intended).
- Only 3 seats are covered. 4 seats and turn/flop raises were out of scope (turn/flop raises are covered by the locked file's sample).
- No follow-ups.

## Lessons for the factory (proposals — not applied)
None. The run had no send-backs, failures or slowdowns.
