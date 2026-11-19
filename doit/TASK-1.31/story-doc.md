# TASK-1.31: Keep every chip amount a safe integer

Status: Done · Completed: 2026-11-19 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: n/a (follow-up to TASK-1.21 / doc-29, judge J-1-01) · Branch: doit/TASK-1.31

## What was asked
`createHand` accepted configs whose legal play could produce chip amounts above `Number.MAX_SAFE_INTEGER`. In TASK-1.21's judge run, 10 seats of `MAX_SAFE_INTEGER` produced 11 unsafe numbers. The task asked for four things.
- Keep every chip amount safe for any accepted config, with a worst-case test (AC#1).
- Pin the factor 10 in the A-4 stakes bound (AC#2).
- Pin that each config field is read exactly once (AC#3).
- Remove the false "4-bet cap" claim from `minimumStack`'s doc comment (AC#4).

Spec: doit/TASK-1.31/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The total-stack check runs after every per-seat stack check, so existing invalid configs fail with their existing message. | yes | Keeps every existing error message and its precedence byte-identical. | Move the total check before the per-seat loop in `validate`. |
| A-2 | The worst-case test uses stakes `{s, s, s, s+1}` with `s = 2**45`, 10 seats, stacks totalling exactly `MAX_SAFE_INTEGER`, and an always-raise policy. | yes | Units near stack/26 end the hand in a few hundred actions while every seat puts in nearly all its chips. J-1-01's smallBet 1 would need about 10^15 raises. | Change the stakes or policy in `tests/engine/chip-safety.acceptance.test.ts`. |
| A-3 | "Each field" in AC#3 means `stakes`, `seats`, `button`, `deck`, the four stake fields, and `seat`/`stack` on each seat. Array index and `length` reads are not counted. | yes | These are the fields `createHand` reads. | Also count array index reads in the SPEC-05 test. |

## Clarifications and decisions
- Q-1 (user: recommended): the new error is `RangeError('Stacks must total at most 9007199254740991')` (D-2).
- Q-2 (user: recommended): the builder may edit TASK-1.21's locked assertion. Seat 3 at `MAX_SAFE_INTEGER - 800` (total exactly MAX) is accepted. Seat 3 at `MAX_SAFE_INTEGER` throws the new error. Nothing else in that file changes.
- D-1: bound the sum of starting stacks by `Number.MAX_SAFE_INTEGER` in `validate`. By chip conservation, every stack, contribution, pot, award and offered amount is at most that sum.
  - Rejected: enforcing the 4-bet cap (TASK-1.12 scope, and it would still let a `MAX_SAFE` stack win an overflowing pot).
  - Rejected: a per-seat cap of `floor(MAX_SAFE/10)` (needs a changed per-seat message and rejects more configs).
- D-2: the error text above.

## What was built
- `src/engine/hand.ts`
  - `validate` now sums the snapshot stacks after the per-seat loop and throws the D-2 error if the total exceeds `MAX_SAFE_INTEGER`. The check is exact: once every stack is a positive safe integer, float partial sums only grow, and the first sum above the limit rounds to at least 2^53.
  - The `minimumStack` doc comment is now `Least stack createHand accepts: 8 small bets + 8 big bets ($96 at $4/$8).`
  - The A-4 comment no longer claims a cap.
- `tests/engine/chip-safety.acceptance.test.ts` (new, locked) holds SPEC-01..05.
- `tests/engine/input-hardening.acceptance.test.ts` is TASK-1.21's locked file. Only the seat-3 `MAX_SAFE_INTEGER` assertion (lines 92-93) changed, per Q-2.
- No signature, type or dependency changes. UI-producible configs (stakes $4/$8, buy-in 160, at most 10 seats) total a few thousand chips, so none is newly rejected.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | Always-raise 10-seat hand at the exact total bound; every chip field safe, chips conserved, showdown reached | PASS | Judge: a `>` to `>=` mutation fails it; holdouts with other policies, sizes and buttons found only safe integers. |
| SPEC-02 | AC#1 | fast-check, 100 runs of random legal play | PASS | Judge ran a 200-run holdout with uneven stacks; no unsafe numbers. |
| SPEC-03 | AC#1 | Total of MAX+1 and J-1-01 rejected; per-seat message precedence kept | PASS | Removing the check or moving it first is caught. |
| SPEC-04 | AC#2 | A-4 boundary on both sides | PASS | Mutating the factor to 9 or 11 is caught. |
| SPEC-05 | AC#3 | One-shot getters and a counting Proxy | PASS | A second `config.button` read is caught; the snapshot defeats a getter that changes value. |
| SPEC-06 | AC#4 | `grep -niE "cap\|at most 10 seats" src/engine/hand.ts` | PASS | No output, exit 1. |
| SPEC-07 | AC#1, AC#2 | `npm test`, lint, typecheck, playtest | PASS | 318 passed, 3 skipped (pre-existing); playtest `Invariant violations: 0` and byte-identical to base. |

- Gates: build-1 PASS and fix-2 PASS. The only warning is scope lines, 211 against a budget of 190 (fail above 380); the excess is test code.
- Judge round 1: verdict PASS, no failed items, no unproven AC.
- Judge finding J-1-01 (LOW): the cross-story edit had no recorded unlock, so `test-integrity TASK-1.21` flagged tampering. The orchestrator then ran `doit.py unlock TASK-1.21 tests/engine/input-hardening.acceptance.test.ts` with the Q-2 reason. `test-integrity TASK-1.21` now passes.

## Review
There were no blocking findings in either review. The security review found nothing. It confirmed that the sum check cannot be evaded by float rounding and that validation runs on the snapshot.

### Non-blocking review notes (deliberately not fixed)
- Code MINOR (stale TASK-1.21 lock, `doit/TASK-1.21/state.json`): resolved as described above. The unlock was done by the orchestrator, not by a code change.
- Scope warning: 211 changed lines against a budget of 190.

## How to try it
- `npm test`, `npm run lint`, `npm run typecheck`
- `npm run playtest` (expect `Invariant violations: 0`)
- `npx vitest run tests/engine/chip-safety.acceptance.test.ts tests/engine/input-hardening.acceptance.test.ts`

## Run metrics
Questions asked: 2 · assumptions logged: 3 · review rounds: 1 · judge rounds: 1 · gate runs: 2 · escalations: 0 · changed lines: 211 across 3 files.

## Known limitations and follow-ups
- The 4-bet cap is still not enforced in `legalActions`/`applyAction`. That is TASK-1.12; the stack-total bound makes chip safety independent of it.
- Security review follow-up: if a restored session's `seats` is not an array, `createHand` throws TypeError instead of RangeError. This is owned by TASK-1.32, AC#2 ("createHand receives a null config or non-array seats, Then RangeError('Invalid hand config')"). TASK-3.10 AC#5/#6 covers session-config validation but not this `createHand` guard.
- Session and UI stakes/stack validation was out of scope. TASK-3.10 AC#6 already covers restored stakes and stacks.

## Lessons for the factory (proposals — not applied)
- The spec said "unlock with a reason" for a cross-story locked-test edit, but the builder had no way to do it. The orchestrator had to unlock afterwards, and the judge and reviewer both raised it. The doit skill now documents the step; the build prompt should also point to it whenever a spec lists a locked-file edit.
- The builder could have been told up front that the line budget excludes new acceptance test files, or the budget could have been sized larger. The 190-line budget produced a warning for a 211-line change that was mostly tests.
