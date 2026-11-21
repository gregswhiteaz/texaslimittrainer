# TASK-1.14: Allow short all-in bets and raises under the half-bet reopening rule

Status: Done · Completed: 2026-11-21 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-1 · Requirements: REQ-016.5, REQ-017.7 · Branch: doit/TASK-1.14

## What was asked
A player whose stack exceeds the call amount but is too small for a full bet or raise is now offered a bet or raise all-in for the whole stack. A stack equal to or below the call still gets only fold or call. An all-in that adds less than half a full bet over the street's last full bet level does not count toward the 4-bet cap and does not reopen betting: players who already acted may only call or fold. An all-in of half a bet or more counts as a full bet/raise, and the next raise goes one full bet above it. The invariant checker learned the same rule. With $160 stacks the playtest never produces a short all-in, so its report stays byte-identical. Spec: doit/TASK-1.14/spec.md.

## Assumptions made without asking — please review
These are poker-rule choices. A-1 and A-3 matter most.
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| **A-1** | Short all-ins are measured **cumulatively** against the street's last full bet level, not against the previous all-in. Example: seat 2 bets $4, seat 3 all-in to $5 (+$1, uncounted), seat 4 all-in to $6 (+$2 over the $4 level, so counted): `betCount` 2, next raise to $10, betting reopens for everyone including seat 2. | Yes (engine-only, no stored data) | Matches the casino/TDA idea that several short all-ins which together make a full (here half) raise reopen betting. Same "level + unit" rule gives all cases. | Measure each all-in against the current bet (then $6 is +$1, uncounted, next raise to $8), or use a per-player TDA test. |
| **A-3** | After a short (< half) all-in **bet**, a player who hasn't acted may fold, call, or "complete": a raise to `level + unit`, which counts as the street's first bet (`betCount` 0 to 1). Players who already checked may only call or fold. | Yes | Falls out of the uniform rule; standard "complete the bet" option. | Withhold the completion raise, or let checkers re-raise. |
| A-2 | No all-in marker on `Action`/`ActionRecord`. An all-in bet/raise is an ordinary `bet`/`raise` whose amount is `streetContribution + stack`; `allIn` is set afterwards. | Yes | Public types unchanged; TASK-3.7 can derive the label. | Add `allIn: true` to `Action`. |
| A-4 | "Already acted" is the existing `PlayerState.hasActed`; a counted bet/raise clears it, an uncounted short all-in leaves it. No new state field. Existing legal sets unchanged (`hasActed && owe > 0` never occurred before). | Yes | Minimal change. | New state field. |
| A-5 | Property test: 20,000 hands, seed 20261121, 2–10 seats, stacks $5..$40. | Yes | Measured non-vacuous in the spec (thousands of short all-ins, completions). | Other ranges. |

## Clarifications and decisions
No questions asked (autopilot). Decisions: D-1 private `betUnit`/`fullBetLevel` derived from street action records in the engine. D-2 the checker derives the counted level independently (`unitOf`/`countedBets`), per TASK-1.8 A-4. D-3 the one existing `hand.test.ts` assertion (a $6 stack facing $4 had no raise) was updated to `[fold, call 4, raise 6]` because it contradicts AC#6.

## What was built
- `src/engine/hand.ts`: `fullBetLevel`; `legalActions` offers a bet/raise to `min(fullBetLevel + unit, streetContribution + stack)` and withholds it from seats that already acted or whose stack doesn't exceed the call; `applyAction` counts a bet/raise toward `betCount` and clears others' `hasActed` only when `2 x (amount - level) >= unit`. Doc comments updated on `hasActed`, `betCount`, `legalActions`.
- `src/engine/invariants.ts`: bet-size clause accepts an all-in short bet/raise; `betCapMessage` counts only counted bets.
- `tests/engine/hand.test.ts`: D-3 update.
- New tests: `tests/engine/short-all-in.acceptance.test.ts` (AC#1–7), `short-all-in.test.ts` (completion, cumulative, thresholds, blinds/cap, checker), `short-all-in.property.test.ts` (20,000 seeded hands).
- No new dependencies. No UI, table, e2e or chart files touched (DoD N/A below).

## How it was verified
Final gate (fix-3): PASS. `npm test` 437 passed, 6 skipped, 122 files; lint and typecheck pass; spec unchanged; test integrity pass. Scope-budget warning: 759 changed lines vs budget 650 (fail threshold 1300); files 6/6.
Locked tests: acceptance (56 asserts) and property (4 asserts) suites, hashes unchanged.
Judge: see doit/TASK-1.14/judge/.
Judge round 1: PASS 15/15 (2.3M holdout checks, 13/13 reachable mutants caught).

| SPEC item | Covers | Result | Evidence |
|---|---|---|---|
| SPEC-01..07 | AC#1–7: short/half-bet/all-in amounts, reopening, cap | Pass | short-all-in.acceptance.test.ts |
| SPEC-08..12 | completion, cumulative (A-1), turn/odd-unit thresholds, blinds and cap, checker | Pass | short-all-in.test.ts |
| SPEC-13 | chip safety and checker agreement over 20,000 hands | Pass | short-all-in.property.test.ts |
| SPEC-14 | playtest byte-identical at $160 | Pass | gates/*.json, reviews/round-1/code.json |
| SPEC-15 | documentation and N/A DoD items | This doc | see below |

DoD N/A items: DoD#3 golden-spot suite not yet created; DoD#7 and DoD#12 no screen added or changed; DoD#8 no network code touched; DoD#9 no strategy content.

## Review
Round 1: 0 blocking findings. Security: no findings; trust boundary unchanged (applyAction still requires an exact match against `legalActions`), chip conservation and strict raise increase argued. Reviewer checked edge cases (heads-up blinds, consecutive short all-ins, fold-around return, side pots): all correct.
Resolved in-story: MINOR — the checker's bet-clause exemption had no test; a test was added (forged non-all-in short bet rejected, genuine short all-in accepted; mutant caught).

### Non-blocking review notes (deliberately not fixed)
- MINOR: only the `=== allInTo` sub-condition of the checker's raise-clause exemption is unreachable through `legalActions`; it is kept as a guard, not tracked. The exemption itself is used by every short all-in raise.
- NIT: the property test does not check the offered all-in amount itself; not tracked.

## How to try it
`npm test` (or `npx vitest run tests/engine/short-all-in`), `npm run lint`, `npm run typecheck`.

## Run metrics
Questions 0 · assumptions logged 5 (spec) · review rounds 1 · judge rounds 1 · gate runs 3 (build, 2 fix) · escalations 0 · changed lines 759 (src+tests).

## Known limitations and follow-ups
- [trainer] Action labels such as "Raise all-in to $X" (derive from `amount === streetContribution + stack`): owned by TASK-3.7 (planned).

## Lessons for the factory (proposals — not applied)
- Scope budget was 650 lines and the build landed at 759 (warn). Spec estimates for tasks with a checker plus three test files should budget tests higher.
