---
id: doc-33
title: 'TASK-1.27: Tighten the playtest invariant checker and its messages'
type: other
created_date: '2026-11-19T21:53:00Z'
updated_date: '2026-11-19T21:53:00Z'
---
# TASK-1.27: Tighten the playtest invariant checker and its messages

Status: Done · Completed: 2026-11-19 · Epic: TASK-1 - Prove the game headlessly · Milestone: m-0 · Requirements: n/a (follow-up of TASK-1.8, doc-16) · Branch: doit/TASK-1.27

## What was asked
Follow-up to TASK-1.8. Two violation messages could mislead (the hole-card count reused the board/burn wording; the award-share message could read "$20 but players put in $20"). The checker also did not verify deal order, ignored an empty or non-betting-street history, and a runner that never stopped a violating hand would hang the suite. The CLI repeated `describeAction`'s wording and kept an unreachable null guard. Six ACs. Spec: doit/TASK-1.27/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | History checks H1/H2 run in `checkState` under the id `legal-action`; in `checkStep` the step's own L1-L5 message wins, so there is still at most one violation per id | yes | AC#4 names `legal-action`; TASK-1.8 rule "at most one per id" | New id `history` (changes the "Violations by invariant" line; needs approval) |
| A-2 | (user-approved, Q-3) H1 `history is empty after the deal`; H2 `history record <i> is on <street>, which is not a betting street` (1-based, first offender) | yes | Same shape as existing messages | Reword in `historyMessage` |
| A-3 | (user-approved, Q-3) K4 `<slot> is <card> but the deck deals <expected>`; slots `seat <s> hole card <1\|2>`, `burn card <j>`, `board card <j>`; `no card` if the deck position is empty. Hole cards ascending by seat, then burns, then board; first mismatch reported | yes | Names slot and both cards | Reword in `dealOrderMessage` |
| A-4 | AC#5 is met on the test side: each `FAULTS` engine counts `applyAction` calls per hand and throws on call 1001 (`runner kept playing a hand past 1000 actions; it must stop at the first violation`). No production limit in `playHand` | yes | Only fault engines can loop forever; a throw fails at once, a sync loop can't be timed out by vitest | Add a limit to `playHand` (needs a new violation id) |
| A-5 | K4 recomputes the D-5 layout itself and does not import the private `clockwiseAfter`; `hand.ts` untouched | yes | A checker shouldn't share code with what it checks | Export `clockwiseAfter` |
| A-6 | The null guard is removed by narrowing the type (`ViolatingHand`), not by `!`. The block prints iff `firstViolation !== null` | yes | No unreachable branch; output unchanged | Keep `violations > 0` plus `!` |
| A-7 | (added during build, accepted by the orchestrator, confirmed by reviewer and judge) SPEC-05's second example ("clean step with an empty result history gives only H1") is unreachable: an empty result history always fails L5, so the step's message wins. The builder replaced it with: (a) the L5 case asserts exactly one legal-action (the step's own); (b) the L3 + chips case asserts `['chips','legal-action']`; (c) a clean step whose result has a record-1 `showdown` record passes L1-L5 and checkState's H2 entry is returned as is | yes | The original example cannot occur; the replacements fail if the `checkStep` merge breaks (reviewer removed the `.filter` and (a) and (b) failed) | Rewrite the spec example |

## Clarifications and decisions
- Q-1 (user: recommended) hole-card message `seat <s> has <k> hole card(s) but should have 2` -> D-1.
- Q-2 (user: recommended) `award <i> (<pot>) is $<amount> but its winners get $<shares>`; totals mismatch keeps `awards pay $<a> but players put in $<c>` -> D-2.
- Q-3 (user: approve as drafted) H1, H2 and K4 messages -> D-5.
- D-3 New checks run after the existing sub-checks of their invariant (K4 after K3), so existing exact-message rows and locked TASK-1.8 expectations keep their messages.
- D-4 `PlaytestSummary.firstViolation: ViolatingHand | null`; `summarize` narrows with a type guard and keeps object identity.

## What was built
- `src/engine/invariants.ts`: K2 split into K2a (hole-card count, new message) and K2b (board/burn, unchanged); C3 split into C3a (totals, unchanged) and C3b (per-award shares, new message); new K4 deal-order check; new H1/H2 history checks reported by `checkState` as `legal-action`; P3 no longer casts `playerAt`; `checkStep` drops checkState's `legal-action` when the step has its own.
- `src/playtest/runner.ts`: exports `toAction` and `ViolatingHand`; `firstViolation` typed `ViolatingHand | null`.
- `src/playtest/cli.ts`: player actions printed via `describeAction(toAction(record))` (blinds keep their own text); `formatReport` prints the violation block iff `firstViolation !== null`; null guard removed.
- `tests/support/faulty-engine.ts`: `MAX_ACTIONS_PER_HAND = 1000` and a `bounded` wrapper on every `FAULTS` engine.
- Tests: new `tests/engine/invariant-messages.acceptance.test.ts` (SPEC-01..04, locked); updated `tests/engine/invariants.test.ts`, `tests/playtest/runner.test.ts`, `tests/playtest/cli.test.ts`.
- No new dependencies. `hand.ts` and the locked TASK-1.8 acceptance files are unchanged.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | acceptance: seat and hole-card count | PASS | exact messages for 1/3/0 cards, ordering, board-length case |
| SPEC-02 | AC#2 | acceptance: mismatched award | PASS | exact message; never says "players put in" |
| SPEC-03 | AC#3 | acceptance: cards not from deck position | PASS | 5 corruptions; clean runs of sizes 3..10 give 0 violations |
| SPEC-04 | AC#4 | acceptance: broken history | PASS | H1 and H2 messages; clean states give `[]` |
| SPEC-05 | AC#4 | unit: history merges into checkStep | PASS (adapted, A-7) | first example exact; second replaced |
| SPEC-06 | AC#5 | unit: fault engines fail fast | PASS | exact error, time bound |
| SPEC-07 | AC#5 | manual mutant: delete `break` in `playHand` | PASS | fails within the bound, mentions `past 1000 actions`, no hang |
| SPEC-08 | AC#6 | unit: describeAction wording | PASS | text equals `describeAction(toAction(record))`; no wording literals left in cli.ts |
| SPEC-09 | AC#6 | unit: block only on violations | PASS | clean summary prints no block |
| SPEC-10 | AC#6 | manual mutant: remove P1 clause | PASS | assertion diff, no TypeError |
| SPEC-11 | all | lint, typecheck, test, playtest | PASS | below |

- `npm test`: 84 files, 309 passed, 3 skipped, exit 0. Lint and typecheck exit 0. `invariants.ts` coverage 99.42% lines. Perf tests pass.
- `npm run playtest -- --hands 10000 --seed 42`: `Invariant violations: 0`, exit 0, 0.7 s. Output is byte-identical to the base commit for clean runs, other sizes, replay codes, the usage error, and violating runs through every FAULTS engine.
- Gates: build-1 PASS, fix-2 PASS (455 changed lines, 8 files).
- Judge round 1: PASS, 11/11, no failed items. The judge ran extra holdout checks (several wrong seats, split awards, short deck, odd buttons) and nine mutants, all caught.

## Review
Round 1: no blocking findings from the code or security reviewers. Security found no new trust boundary; the 1000-action limit is test-only.

### Non-blocking review notes (deliberately not fixed)
- MINOR `src/engine/invariants.ts:326`: in `checkStep`, `rest` and `others` don't say what they hold. Proposed names: `stateChecks` and `afterChips`.
- NIT `tests/engine/invariants.test.ts:334`: SPEC-05's second example can't occur (A-7); no code change.

## How to try it
- `npm run lint && npm run typecheck && npm test`
- `npm run playtest -- --hands 10000 --seed 42`

## Run metrics
Questions 3 · assumptions logged 7 (A-1..A-6 in the spec, A-7 during build) · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 455 (8 files; spec budget was 400 lines).

## Known limitations and follow-ups
- Rename `rest`/`others` in `checkStep` (`src/engine/invariants.ts:326`) to `stateChecks`/`afterChips`. No existing task owns it.
- Add a comment explaining the L4 raise clause in `src/engine/invariants.ts` (TASK-1.8 follow-up, listed as out of scope here). A search of the backlog found no existing task owning it; TASK-1.8's summary only says it was "implied" by TASK-1.27, which excluded it.
- No production action limit in `playHand` (A-4): a runner that never stops is caught only by the test-side fault engines.
- Not checked: that the first two history records are the blinds, or that the deck is a valid permutation.

## Lessons for the factory (proposals — not applied)
- The spec contained an unreachable example (SPEC-05) that was only found at build time. Proposal: have the spec writer run each exact example against the code (or name the rule that makes it reachable) before approval.
- The change came to 455 lines against a 400-line budget with no escalation. Proposal: the spec scope budget should count test lines the same way the gate does.
- A follow-up the spec excluded (L4 comment) had no owning task, so it fell through. Proposal: when a spec lists a follow-up under "Not doing", the spec stage should name its owning task or create it.
