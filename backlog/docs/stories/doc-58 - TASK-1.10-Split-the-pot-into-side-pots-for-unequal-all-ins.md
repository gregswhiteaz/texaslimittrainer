---
id: doc-58
title: 'TASK-1.10: Split the pot into side pots for unequal all-ins'
type: other
created_date: '2026-11-21T06:02:00Z'
updated_date: '2026-11-21T06:02:00Z'
---
# TASK-1.10: Split the pot into side pots for unequal all-ins

Status: Done · Completed: 2026-11-20 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-1 · Requirements: REQ-018, REQ-019 · Branch: doit/TASK-1.10

## What was asked
When players go all-in for different amounts, the engine must build one pot per contribution level. Each pot is won only among the non-folded seats that matched it, and ties split with the odd-chip rule (odd chips one each clockwise from the first seat left of the button). The invariant checker must also verify each pot's level and layer. Spec: doit/TASK-1.10/spec.md. Before this story every hand had one pot; TASK-1.9's A-1 limitation (single pot) is now resolved.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | AC#6 (sit-and-go hand) is tested at engine level with chip stakes 25/50/50/100 and seats 1, 2, 3, 5. The engine has no currency, so chips and dollars are the same integers. | yes | Sit-and-go mode is another story. The odd-chip rule is the same in both modes. These are real sit-and-go blind levels and allow a 1,255-chip side pot. | Wait for the sit-and-go story. |
| A-2 | AC#4's "four-way all-in at four stack sizes" means stacks $10, $20, $30, $32 all in. The largest seat's unmatched $2 is returned, leaving a main pot and two side pots, each won by a different seat. | yes | A seat can never be matched above the second-largest stack. | Add a fifth covering seat. |
| A-3 | AC#7 (a $29 pot tied three ways) is tested through the exported `splitPot`, the function both award paths call. | yes | Reaching an exact $29 three-way tie through legal $2/$4 play needs contrived dead money. AC#6 proves the rule end to end. | Script a full hand reaching $29. |
| A-4 | AC#5 random stacks are uniform in [$5, $192] at $2/$4, 2-10 seats, random button. The random policy drops bet/raise once `betCount >= 4` (the engine does not enforce the cap until TASK-1.12). | yes | $5 is `createHand`'s floor. A probe found 13,927 hands with a side pot and 1,350 with two or more. | Fixed stack menus. |
| A-5 | The new pot-structure checks run only when side pots exist (`pots.length > 1` or contributions make more than one level). | yes | Existing chips and eligibility checks already imply the same conditions for a single pot, and this keeps locked crafted-state tests' exact outputs unchanged. | Always run them. |

## Clarifications and decisions
No questions were asked (autopilot run). Decisions, all non-material:
- D-1: Rebuild `pots` from scratch at every round end from each seat's effective contribution (`totalContribution` minus any returned amount) and folded flag, one pot per distinct level among non-folded seats, ascending. Stateless; no-all-in hands get the same single pot as before.
- D-2: `result.awards` has one `PotAward` per pot in ascending pot index (main first). Each pot goes to the best rank among its eligible seats, ties split by `splitPot`. Show order is left to the showdown stories.
- D-3: A completed hand keeps every built pot with `amount: 0` and its eligible list, extending the existing convention.
- D-4: A pot with a single eligible seat (holding folded seats' chips) is kept and awarded to that seat, not merged down, so lower-level seats cannot win chips they did not match.
- D-5: New invariant checks live under `pot-eligibility`, run after P1-P5, skip the one-pot/one-level case, and recompute levels independently of engine code so the checker can catch engine bugs.
- D-6: AC#9 is met by running the locked `review-gaps` test unchanged plus a new test repeating its folded-contributor checks on a hand with a side pot.

## What was built
- `src/engine/hand.ts`: new private `buildPots`; `gather` returns rebuilt `pots`; `endRound` awards each pot to the best hand among its eligible seats via `splitPot`; `foldOut` awards every pot to the last seat (always one pot); `payOut` sums a seat's shares across all awards; doc comments updated. No exported signature or type changes.
- `src/engine/invariants.ts`: new `potStructureMessage`, run at the end of `potEligibilityMessage`.
  - P6 pot count: `there are N pots but contributions make M`
  - P7 level eligibility:
    - `<pot> lists seat S, which has not matched its $L level`
    - `seat S matched the $L level of <pot> but is not eligible for it`
  - P8 layer amount, held while the hand is in progress, paid once complete:
    - `<pot> holds $X but its layer is $Y`
    - `<pot> paid $X but its layer is $Y`
  - Example: `main pot holds $41 but its layer is $40`.
- Worked example (S1): contributions $10/$30/$50/$50 after a $6 return give main $40 [1,2,3,4], side 1 $60 [1,2,3], side 2 $40 [2,3].
- Tests: `tests/engine/side-pots.acceptance.test.ts` (SPEC-01..07), `tests/engine/side-pots.property.test.ts` (SPEC-08), `tests/engine/side-pot-invariants.acceptance.test.ts` (SPEC-09).
- No UI, table, advice or e2e files touched. No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | S1 acceptance test | PASS | pots 40/60/4 at turn, return {3,6}, three awards to seat 2, stacks 0/140/150/0 |
| SPEC-02 | AC#2, AC#9 | S2 acceptance test | PASS | folded seat in no pot, paid 52 equals contributions |
| SPEC-03 | AC#9 | locked review-gaps unchanged | PASS | test passes, git diff empty |
| SPEC-04 | AC#3 | S3 | PASS | shortest all-in wins only main pot (30), side 40 to seat 2 |
| SPEC-05 | AC#4 | S4 | PASS | awards to seats 4/1/3, per-pot best-hand cross-check |
| SPEC-06 | AC#6 | S5, 25/50 stakes | PASS | 1,255-chip pot splits 628/627 |
| SPEC-07 | AC#7 | `splitPot(29,[3,5,6],4,...)` | PASS | 10/10/9 clockwise from left of button |
| SPEC-08 | AC#5, AC#8 | 100,000-hand property test | PASS | conserves chips, `checkStep` clean, about 2.7 s |
| SPEC-09 | AC#8 | crafted checker cases (a)-(f) | PASS | one `pot-eligibility` violation each with the P6-P8 text |
| SPEC-10 | locked tests | `npm test` plus git diff over locked files | PASS | diff empty |
| SPEC-11 | lint/typecheck/test | commands | PASS | 117 files, 410 passed, 6 skipped; coverage 96.84% overall, engine 99.87% |
| SPEC-12 | playtest | 10,000 hands seed 42 | PASS | byte-identical to 791d900 baseline (Largest pot $70, 0 violations) |
| SPEC-13 | CI + docs | CI and this doc | CI PASS; doc = this document | branch CI run 44872609015 success at 9f4594e |
| SPEC-14 | N/A items | git diff over ui/table/advice/e2e | PASS | empty |

- Judge round 1: 13/14 PASS; SPEC-13 was pending only on this doc. No findings.
- Judge extras: a 300,000-hand independent-oracle fuzz (4.27M actions, 3 stake levels, 2-10 seats) found 0 mismatches. It covered 64,264 multi-pot hands and 30,772 single-eligible side pots, and no fold-out had more than one pot. 13 mutants were run and 12 were killed; the survivor (capping the last pot) is equivalent and unreachable.
- Gates: build and two fix runs PASS (646, 646, 649 changed lines).

## Review
Round 1 (code and security): no BLOCKER or MAJOR findings. Security: no new trust boundary; chip conservation and award eligibility checked. Both code MINORs were applied in-story:
- Case (f) added to the invariant tests (one pot of $104 vs 3 levels gives `there are 1 pots but contributions make 3`), pinning the A-5 guard. The test file was unlocked for strengthening only.
- Renamed `level` to `matched` in `potStructureMessage` for readability.

### Non-blocking review notes (deliberately not fixed)
- NIT: `potStructureMessage` repeats the top/second scan that `returnedMessage` already does; a shared `secondHighest` helper was not extracted (would add lines). Not tracked.

## How to try it
- `npm test`, `npm run lint`, `npm run typecheck`
- `npx vitest run tests/engine/side-pots.acceptance.test.ts tests/engine/side-pot-invariants.acceptance.test.ts tests/engine/side-pots.property.test.ts`
- `npm run playtest -- --hands 10000 --seed 42` (no all-ins occur with $160 resets, so output is unchanged)

## Run metrics
Questions asked: 0 · assumptions logged: 5 (in spec) · review rounds: 1 · judge rounds: 1 · gate runs: 3 · escalations: 0 · changed lines: 649 (budget 700).

## Known limitations and follow-ups
- Side pots and per-pot winners are not shown on screen. [trainer] Owned by TASK-3.8 (already planned).
- Show/muck order and last-side-pot-first resolution (REQ-019.4/.5/.8) remain with TASK-1.15. Sit-and-go chip display without `$` remains with TASK-5.3. Out of scope here.
- The playtest never produces all-ins (stacks reset to $160), so side pots are exercised only by the property test, not the playtest.

## Lessons for the factory (proposals — not applied)
- The judge's SPEC-13 requires a published doc, so every run shows 13/14 with one pending item in round 1. Proposal: have the orchestrator treat a doc-only pending SPEC-13 as expected, or run the Documentor before the judge's final check.
- The code review found the A-5 guard untested, which needed unlocking a locked test. Proposal: the spec template's skip-guard assumptions should require a test for each half of the guard.
