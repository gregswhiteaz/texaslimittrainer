# TASK-7.43: Resize the authored opponent range and rank hands by three-way equity when scaling observed opponents

Status: In review (not set Done) · Completed: 2026-11-26 · Epic: TASK-7 · Milestone: not recorded in the artifacts · Requirements: REQ-035 (035.2, 035.6), REQ-061.2 · Branch: doit/TASK-7.43

## What was asked
After 30 observed hands, `estimateOpponentRanges` used the strongest `width` % of a hand order ranked by equity against ONE random hand. That put K2o, Q2o and J2o above 87s, 76s and 65s. This story carries out decision-5 (TASK-7.29 Q-1 B, Q-2 B). The observed range is now the authored default range resized to the scaled width (rule A-5), and `hand-order.json` is regenerated using seeded `computeEquity` against three random hands. Locked expectations that change are re-pinned and docs updated. Spec: doit/TASK-7.43/spec.md. Re-raise scaling is out of scope (TASK-7.44).

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| Q-1 (auto-accepted) | Golden spot `6max-turn-bb-call-a6s` (locked, owner TASK-7.14) re-tuned to opponent stats hands 100 / vpip 22 / pfr 18 (call, equity 45.3, margins 19.7/21.1). Stands in for the AC#6 user sign-off. | yes | The spot stopped being clear-cut under the new order. Alternatives were: mark raise acceptable, replace the spot, or use 80/22/14. | Edit the spot stats or pick another option in `tests/golden/postflop-spots.json`. |
| Q-2 (auto-accepted) | `tests/ui/review-numbers.acceptance.test.tsx` (locked, owner TASK-9.3): two observed equities re-pinned from 29.9% / 30.1% to 34.3%. No assertion dropped. | yes | Ben's observed range changes with the new rule. Alternative was to change Ben's snapshot stats. | Revert the two numbers and change the snapshot stats. |
| A-1 | New export `resizeRange(classes, widthPct)` in `src/advice/ranges.ts`; `strongestClasses` stays exported and unchanged. | yes | Locked tests still call `strongestClasses`. | Wrap or inline it. |
| A-2 | `OpponentRange.widthPct` stays the formula width, not the resized range's actual combo width. | yes | Locked tests assert the formula width. | Report actual width. |
| A-3 | Combo target uses the `widthPct/100 × 1326 − 1e-9` tolerance, as `strongestClasses` does. | yes | A default's own width gives back exactly the default. | Other epsilon. |
| A-4 | Class equity = `computeEquity` hero vs three opponents drawn from the unseen combos, sorted descending, ties by grid index. | yes | Extends the TASK-7.13 procedure to three opponents. Ranks match TASK-7.29 §3 (87s #68, 76s #81, 65s #93, K2o #112, Q2o #131, J2o #144). | Distinct per-opponent ranges. |
| A-5 | The normal suite spot-checks 7 classes. The full 169-class recomputation is opt-in (`TLH_SLOW_TESTS=1`, in `test:slow`). | yes | Standing rule: slow checks are never in every push. | Move it into the normal suite. |
| A-6 | New acceptance tests live in a new file; locked files can't be extended. | yes | TASK-7.30 precedent. | Shared test-support module. |
| A-7 | `range-model.md` gains a known-limit sentence: small pairs rank low against three random hands (22 is #116). | yes | A measured trade-off. | Remove the sentence. |

## Clarifications and decisions
- Q-1 and Q-2: see the table above. Both were auto-accepted under autopilot and recorded in `doit/TASK-7.43/qa.md`. No human was asked.
- `state.json` counters show questions 0 and assumptions 0. The real figures are 2 and 9 (see Run metrics).

## What was built
- `src/advice/ranges.ts`: new exported `resizeRange`. `estimateOpponentRanges` resizes the authored default to the scaled width instead of calling `strongestClasses`. Doc comments updated. A width equal to the default's own width returns exactly the default.
- `src/advice/ranges/hand-order.json`: regenerated against three random hands, with a new justification. Format v1 and path unchanged. AA is first (63.9), 32o last (14.1).
- `tests/advice/observed-resize.acceptance.test.ts`: new (AC#1..4 plus the opt-in slow full recomputation).
- `tests/advice/observed-ranges.test.ts`: "hand order" test now uses three opponents.
- Locked re-pins: `tests/advice/observed-ranges.acceptance.test.ts` AC#2 (TASK-7.13), `tests/golden/postflop-spots.json` (TASK-7.14), `tests/ui/review-numbers.acceptance.test.tsx` (TASK-9.3).
- `docs/advice/range-model.md`: "Hand order" and "Known limits" updated.
- `package.json`: `test:slow` lists the new file.
- No new dependencies. Typical-player advice and bots are unaffected (the order was used only inside `ranges.ts`).

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..05 | resize rule, new order, slow recomputation | `tests/advice/observed-resize.acceptance.test.ts` (29 assertions) | PASS | Slow run 5/5 in 1.7 s |
| SPEC-06 | observed-ranges AC#2 re-pin | locked acceptance test | PASS | judge r1 |
| SPEC-08 | golden spot re-tune | golden suites | PASS | judge r1 |
| SPEC-09 | review-numbers re-pin | locked UI acceptance test | PASS | judge r1 |
| SPEC-10 | docs | grep for stale text | PASS | 3 matching lines, none stale |
| SPEC-11 | unit test update | `observed-ranges.test.ts` | PASS | judge r1 |
- `npm test`: 337 files passed (9 skipped), 1507 tests passed (57 skipped). Format, lint and typecheck clean.
- Gates: build-1 PASS, fix-2 PASS. Judge round 1: PASS, no failed items, no unproven AC or DoD, no escalation. End-to-end PASS.

## Review
Round 1 (code and security): no blocking findings. No sendbacks.

### Non-blocking review notes (deliberately not fixed)
- MINOR: `tests/advice/observed-resize.acceptance.test.ts:143` has a tautological assertion. The file is locked now and assertions can't be deleted from locked tests. The real superset check is at lines 149-150.
- NIT: the empty-default branch at `src/advice/ranges.ts:378` is untested. The spec says it is unreachable (every default range on a scaled line has at least 8 classes).

## How to try it
- `npm test`
- `TLH_SLOW_TESTS=1 npx vitest run tests/advice/observed-resize.acceptance.test.ts` (full 169-class recomputation)

## Run metrics
Questions 2 (auto-accepted) · assumptions 9 (7 in the spec plus 2 auto-accepted questions) · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 658 (gate count).

## Known limitations and follow-ups
- Small pairs rank low against three random hands (22 is #116), so a widened range adds them late and a narrowed range drops them early. This is documented in `range-model.md`.
- [trainer] Re-raise scaling (`three-bet` / `four-bet` relative to typical PFR) is owned by TASK-7.44.
- [trainer] Remove or replace the tautological assertion at `tests/advice/observed-resize.acceptance.test.ts:143` the next time that file is unlocked (owner TASK-7.43 test file; low value).
- [trainer] Add a test (or remove the branch) for the unreachable empty-default branch at `src/advice/ranges.ts:378`.

## Lessons for the factory (proposals — not applied)
- `state.json` shows `questions: 0` and `assumptions: 0` although 2 questions and 9 assumptions were recorded. The orchestrator should update those counters when it auto-accepts questions or logs spec assumptions.
- The new acceptance file got locked with a tautological assertion in it. A check for assertions that restate their own inputs before locking would avoid a permanent MINOR.
