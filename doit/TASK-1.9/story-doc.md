# TASK-1.9: Let a short-stacked player call all-in

Status: Done · Completed: 2026-11-20 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-1 · Requirements: REQ-014.4, REQ-014.6, REQ-018.1, REQ-018.4 · Branch: doit/TASK-1.9

## What was asked
The engine must let a player who cannot match a bet call for the chips they have left. That player is marked all-in, is never asked to act again, and stays in to showdown. When at most one player can still bet, the rest of the board is dealt with no more betting. Any part of the top bet nobody called goes back to the bettor and is not counted as won. The invariant checker must accept all-in calls and returned chips and still catch wrong amounts. The hand-result "wins $X" must exclude returned chips (TASK-3.4's $16 uncontested example is rechecked). Spec: doit/TASK-1.9/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Until TASK-1.10, a short all-in facing two or more covering players stays in the single main pot and can win all of it. This only happens in engine tests, or in the app past the 4-bet cap (no cap until TASK-1.12). Playtest and session stacks never fall below $96. | yes | Side pots are TASK-1.10, which depends on this task. Chips are still conserved and all invariants hold. | Refuse multi-way all-ins, or build side pots now |
| A-2 | `allIn` is true whenever a call, bet or raise leaves the actor's stack at $0, including exact-stack ones. | yes | REQ-018.1; TASK-1.14 AC#7 already calls an exact-stack call "call $4 (all-in)". | Only short calls set it |
| A-3 | An all-in call is an ordinary `call` record whose `amount` and `added` equal the chips put in (e.g. $3). `ActionRecord` and `describeAction` are unchanged. | yes | Keeps the legal-action history check unchanged. | New `all-in` action type (TASK-1.14) |
| A-4 | `formatHand` and replay output keep their format. Fold-out `Result:` amounts are now the award without the returned chips (a walk shows "wins $4"). No "returned" line added. | yes | Smallest change; matches the UI meaning of "wins". | Append ", $2 returned to seat 5" |
| A-5 | The engine computes the uncalled amount per street (top street contribution minus second highest, folded seats included) at the gather that ends the hand. The checker recomputes it from total contributions. | yes | Gives the checker an independent second formula. | Use one formula in both (circular) |

## Clarifications and decisions
Autopilot run: Q-1 to Q-4 were auto-accepted with the recommended option. Please review them.
- **Q-1 (auto-accepted):** `createHand` stack floor becomes `bigBlind + 1` ($5 at $4/$8); message template unchanged ("at least 5"). Rejected: floor $1 (pulls all-in blinds into TASK-1.16) and keeping $96 (ACs only testable on hand-built states). `minimumStack` is unchanged; only its doc comment changed.
- **Q-2 (auto-accepted):** Blinds count as bets for the uncalled-bet return, so a walk returns the big blind's unmatched $2 and shows "You win $4" instead of $6.
- **Q-3 (auto-accepted):** New optional `HandResult.returned?: {seat, amount}`, present only when chips are returned. `totalContribution` keeps its meaning and awards exclude returned chips.
- **Q-4 (auto-accepted):** Earlier stories' locked tests were edited (E1–E8, U1–U4) for changed amounts/messages only. Nothing removed or loosened; unlock records exist under TASK-1.4, 1.21, 1.31, 1.44, 3.4 and 9.1.
- D-1 floor `bigBlind + 1` (Q-1); D-5 `largestPot` in playtest includes returned chips; D-7 the board runs out when at most one open seat remains.

## What was built
- `src/engine/hand.ts`: call amount `min(owe, stack)`; derived `allIn` flag (stack is 0 after the action); all-in seats skipped for `toAct` and round closing; `gather` returns the uncalled top bet; `dealNextStreet` helper and runout; `HandResult.returned`; floor `bigBlind + 1`.
- `src/engine/invariants.ts`: C3/C4 account for `returned`; new C5 in `checkStep` recomputes the returned amount independently.
- `src/playtest/runner.ts`: `largestPot` includes returned chips (reporting only).
- Tests: new `tests/engine/all-in.acceptance.test.ts` (7), `all-in-invariants.acceptance.test.ts` (2), `tests/table/hand-result-uncalled.acceptance.test.ts` (1), plus additions in `tests/engine/hand.test.ts` and `tests/playtest/runner.test.ts`. Locked tests, support scenarios and two e2e specs (`next-hand`, `review`) updated for the new amounts.
- No changes under `src/ui`, `src/advice`, `src/table`.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..11 | all-in call, flag, showdown inclusion, runout, uncalled return, fold-out, checker | acceptance + unit tests, mutant checks (11 of 12 mutants killed), holdouts | PASS | judge round 1 |
| SPEC-12 | locked edits E1–E8/U1–U4 only change amounts/messages | `doit.py test-integrity` exit 0, diff review | PASS | judge round 1 |
| SPEC-13 | lint, typecheck, tests, coverage | `npm test` | PASS | 112 files, 394 passed, 6 skipped |
| SPEC-14 | playtest unchanged | `npm run playtest -- --hands 10000 --seed 42` byte-identical to base | PASS | fold 5470, showdown 4530, capped 244, 0 violations |
| SPEC-15 | e2e next-hand and review | Playwright chromium + webkit | PASS | 12 passed |
| SPEC-16 | CI green and this doc | Branch CI run 44866667944 green; doc published | PASS (on publish) | CI run above |
| SPEC-17 | no ui/advice changes | diff | PASS | judge round 1 |

- Judge round 1: 16/17 PASS, SPEC-16 pending this doc. LOW J-1-01 (`largestPot` including returned chips was not pinned) and J-1-02 (exact-stack all-in to hand end not pinned) were fixed in-story with test-only additions. Judge also ran a 6000-hand short-stack fuzz: 0 violations.
- Gates: build, fix-2, fix-3 all PASS. Fix-3 warned on scope budget (795 lines vs 750, 19 files vs 18).

## Review
No blocking findings. Security review: no reachable vulnerability; trust boundary and chip conservation unchanged.

### Non-blocking review notes (deliberately not fixed)
- NIT `src/engine/invariants.ts`: local `backed` in C4 reads like a past-tense verb; rename not done (fix round was test-only).
- MINOR (exact-stack all-in played to hand end, no test): addressed by the J-1-02 fix, so no longer open.
- Security note for TASK-3.10: restored HandState fields (allIn, stack, contribution) become untrusted and need validation at load.

## How to try it
- `npm test`, `npm run lint`, `npm run typecheck`
- `npm run playtest -- --hands 10000 --seed 42`
- `npx playwright test e2e/next-hand.spec.ts e2e/review.spec.ts`

## Run metrics
Questions 4 (auto-accepted) · assumptions logged 5 (A-1..A-5; state.json shows 0) · review rounds 1 · judge rounds 1 · gate runs 3 · escalations 0 · changed lines 795 (19 files, gate fix-3).

## Known limitations and follow-ups
- A-1: no side pots; a short all-in can win the whole single pot when two or more players cover it. Owned by TASK-1.10.
- [trainer] Validate restored `HandState` at load (e.g. `checkState`) because allIn/stack/contribution become untrusted — owned by TASK-3.10.
- [trainer] Optionally rename `backed` in the C4 invariant to a noun (e.g. `returnedToSeat`) — owned by TASK-1.10 (it touches the same code).

Not tracked (infra, below the value bar): none.

## Lessons for the factory (proposals — not applied)
- The scope budget (750 lines / 18 files) was exceeded (795 / 19) because locked-test edits and e2e updates count toward it. Consider excluding unlock-approved amount edits from the budget, or raising it for stories that change engine-wide amounts.
- `state.json` `assumptions` stayed 0 although the spec lists A-1..A-5; the counter should read the spec's table.
