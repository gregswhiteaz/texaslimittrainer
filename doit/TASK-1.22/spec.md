# Spec: TASK-1.22 — Close engine test gaps found in review

Status: READY (approved 2026-11-19)
Task: TASK-1.22 · Parent/epic: TASK-1 · Requirements: n/a (follow-up; feeds REQ-019.x and the TASK-1.4 engine rules) · Dream: limit-holdem-trainer

## 1. Summary
Test-only chore. Three engine behaviours are correct today but not pinned by any test: the third kicker of a
one-pair hand decides the comparison (TASK-1.2 judge J-1-01), a folded seat drops out of every pot's
`eligible` list while its chips stay in the pot (TASK-1.4 code review round 1, MINOR
`fold-eligible-and-total-contribution-untested`), and `smallBlind == bigBlind` is accepted (TASK-1.4 code
review round 2, MINOR `sb-equals-bb-boundary-untested`). One new test file pins all three. No product code
changes.

## 2. Scope
- In scope: one new Vitest file `tests/engine/review-gaps.acceptance.test.ts` with three tests (SPEC-01..03).
- Not doing:
  - No change to anything under `src/`. If a test exposes a real bug, stop and raise it as an `ask`; do not
    fix the engine inside this task.
  - No edits to existing test files (`tests/engine/hand.test.ts`, `hand-evaluator.test.ts`, or the locked
    `hand.acceptance.test.ts` / `hand.property.test.ts` / `hand-evaluator.acceptance.test.ts`).
  - No side-pot work (TASK-1.10), no changes to the "Invalid stakes" rule, no fix for the NIT
    `fold-out-resets-bet-counters`.
  - No doc edits (spec §5 wording of TASK-1.4 is locked history).
- Scope budget: files=1, lines=120

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | All three gaps go into one new file `tests/engine/review-gaps.acceptance.test.ts` instead of extending `hand.test.ts` / `hand-evaluator.test.ts` | yes | Caller asked to prefer new files over editing other stories' tests; keeps the diff isolated | Append to the two existing unit files |
| A-2 | Verifications are `acceptance`, so the test file is locked after the first green build (orchestrator decision, overriding the earlier `unit` choice) | yes | These tests pin behaviour that later stories must not silently drop | `unit` (unlocked), as first drafted |
| A-3 | AC#3 is pinned as "accept" (SB == BB is valid) | yes | The documented rule is `smallBlind <= bigBlind <= smallBet < bigBet` (doc-10 line 46; `src/engine/hand.ts:142`), so equality is allowed | n/a — the rule decides it |

## 3. Current system
- TypeScript strict, Vitest 5 (`package.json` scripts `test`, `lint`, `typecheck`, `format`). Tests live in
  `tests/engine/*.test.ts` and import from `../../src/engine/...` (`tests/engine/hand.test.ts:1-13`).
- Evaluator: `evaluate(cards)` returns a dense rank 1..7462, higher is stronger; `compareHands(a, b)` returns
  -1/0/1; `handCategory(rank)` returns e.g. `'one-pair'` (`src/engine/hand-evaluator.ts:5-25`). One pair
  packs the pair then the top three kickers (`src/engine/hand-evaluator.ts:97`).
- Hand engine (`src/engine/hand.ts`):
  - Stakes rule: `smallBlind > bigBlind || bigBlind > smallBet || smallBet >= bigBet` throws
    `RangeError('Invalid stakes')` (`src/engine/hand.ts:140-149`). Documented in doc-10 line 46.
  - Blinds post `streetContribution` and `totalContribution`; `currentBet = bigBlind`
    (`src/engine/hand.ts:190-215`).
  - A fold removes the actor from every pot's `eligible` list (`src/engine/hand.ts:411-418`); chips added
    are tracked in `totalContribution` (`src/engine/hand.ts:401`). Street contributions move into
    `pots[0]` when a round ends (`gather`, `src/engine/hand.ts:271-283`). At completion `pots[0].amount`
    is zeroed and the pot appears in `result.awards` (TASK-1.4 A-13; `src/engine/hand.ts:315-320, 346-357`).
  - `legalActions` when owe is 0 and `currentBet > 0` gives `[check, raise to currentBet + unit]`
    (`src/engine/hand.ts:251-253`).
  - The engine currently only ever builds one pot (`pots[0]`), so "any pot" means every entry of `pots`.
- Existing test gaps confirmed: `hand-evaluator.test.ts` and `hand-evaluator.acceptance.test.ts` examples
  differ only in the first/second kicker (J-1-01). `hand.test.ts` never asserts `eligible` or
  `totalContribution`. `hand.test.ts:190-192` accepts `{1,1,1,2**40}` (equal blinds), but only incidentally
  as a large-stakes case, not as the stated boundary.
- Existing code to reuse:
  - `tests/engine/hand.test.ts:15-38` → copy the `STAKES`, `DECK`, `config()`, `apply`/`play` helper
    pattern (do not import from another test file; duplicate the ~20 lines).
  - `src/engine/cards.ts` `parseCards` → build hands from text.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Third-kicker example uses two seven-card hands whose best five are K-K-A-9-7 vs K-K-A-9-6 and whose two unused cards have the same ranks | The judge's five-card K-K-A-9-4 vs K-K-A-9-3 | AC#1 asks for seven-card hands; with seven cards a third kicker of 3 is impossible (only the 2 is lower). Also include the judge's five-card pair as a second assertion | no | n/a |
| D-2 | AC#2 is checked mid-hand (after the turn is dealt) and at completion via `result.awards` | Only at completion | `pots[0].amount` is zeroed at completion (A-13), so the "counted in pot amounts" claim is only visible mid-hand or in the award | no | n/a |

## 5. Design

### Files to create / modify
- `tests/engine/review-gaps.acceptance.test.ts` — new; three `it` blocks inside `describe('engine review gaps')`.

### Components, interfaces and data
- No new interfaces. Local helpers mirror `tests/engine/hand.test.ts:15-38`: `STAKES = {2,4,4,8}`,
  `DECK = 0..51`, six seats 1..6 with stack 160, button 1 (so SB = 2, BB = 3, first to act = 4).

### Rules and algorithms
- Third kicker (SPEC-01):
  - A = `Kc Kd Ah 9s 7h 3d 2c` → best five K K A 9 7.
  - B = `Ks Kh Ad 9c 6h 3s 2d` → best five K K A 9 6.
  - Both `handCategory` = `'one-pair'`; `compareHands(evaluate(A), evaluate(B)) === 1` and the reverse is -1.
  - Five-card: `Kc Kd Ah 9s 4h` beats `Ks Kh Ad 9c 3h` (compare = 1).
- Fold after contributing (SPEC-02), worked example at $2/$4 (blinds 2/4), six seats, button 1:
  - Preflop: 4 call 4, 5 call 4, 6 call 4, 1 call 4, 2 call 2, 3 check → flop, `pots[0].amount = 24`.
  - Flop: 2 bet 4, 3 call 4, 4 fold. Now seat 4 `folded`, `totalContribution = 4`, and every pot's
    `eligible` = `[1, 2, 3, 5, 6]`; `pots[0].amount` still 24.
  - 5 call 4, 6 call 4, 1 call 4 → turn. `pots[0].amount = 44` = sum of `totalContribution` over all six
    players (4×6 + 4×5), which includes seat 4's 4. Every pot's `eligible` still excludes 4.
  - Turn and river all check (order 2, 3, 5, 6, 1) → showdown. `result.awards` total 44; seat 4 is not in
    `result.showdown` nor in any award's `winners`.
  - Blind variant: from `createHand(config())`, 4, 5, 6, 1 call 4, then 2 (SB, put in 2) folds → every
    pot's `eligible` = `[1, 3, 4, 5, 6]`, seat 2 `totalContribution = 2`.
- Worked examples above were checked against the current engine on 2026-11-19 (scratch script, deleted): all values match, including a five-way showdown split of 44 at completion.
- Equal blinds (SPEC-03): stakes `{ smallBlind: 2, bigBlind: 2, smallBet: 4, bigBet: 8 }`:
  - `createHand` does not throw; seat 2 and seat 3 each have `streetContribution = 2`; `currentBet = 2`.
  - 4, 5, 6, 1 call 2 → seat 2 to act with `legalActions` = `[{seat:2,type:'check'},{seat:2,type:'raise',amount:6}]`.
  - 2 check, 3 check → street `'flop'`, `pots[0].amount = 12`.
  - Contrast pinned in the same test: `{ smallBlind: 3, bigBlind: 2, smallBet: 4, bigBet: 8 }` throws
    `RangeError('Invalid stakes')`.

### Error handling and configuration
- None added. Tests use the existing `apply` helper that throws on a rejected action.

## 6. Behaviour specification

### SPEC-01: Third kicker decides a one-pair comparison
- Verifies: AC#1
- Behaviour: Given seven-card hands `Kc Kd Ah 9s 7h 3d 2c` and `Ks Kh Ad 9c 6h 3s 2d` (both one pair of kings, A and 9 as first and second kickers, differing only in the third kicker 7 vs 6), When compared with `compareHands(evaluate(a), evaluate(b))`, Then the result is 1 (and -1 reversed), both categories are `'one-pair'`, and the five-card pair `Kc Kd Ah 9s 4h` vs `Ks Kh Ad 9c 3h` also compares 1.
- Verification: acceptance `tests/engine/review-gaps.acceptance.test.ts::the third kicker decides between equal pairs`

### SPEC-02: A folded seat is ineligible but its chips stay in the pot
- Verifies: AC#2
- Behaviour: Given the six-seat $2/$4 hand in §5, When seat 4 folds on the flop after calling 4 preflop, Then every pot's `eligible` is `[1, 2, 3, 5, 6]`, seat 4's `totalContribution` is 4, after the turn is dealt `pots[0].amount` is 44 and equals the sum of all players' `totalContribution`, and at showdown the awards total 44 with seat 4 absent from `result.showdown` and from every award's winners. And Given the SB folds preflop after posting 2, Then every pot's `eligible` is `[1, 3, 4, 5, 6]` and seat 2's `totalContribution` is 2.
- Verification: acceptance `tests/engine/review-gaps.acceptance.test.ts::a folded seat leaves every pot but its chips stay in`

### SPEC-03: Small blind equal to big blind is accepted
- Verifies: AC#3
- Behaviour: Given stakes `{2, 2, 4, 8}`, When `createHand` validates them, Then it does not throw, both blinds have `streetContribution` 2 and `currentBet` is 2; after 4, 5, 6, 1 call 2 the SB's legal actions are exactly check and raise to 6; after SB and BB check the street is `'flop'` with `pots[0].amount` 12. Given stakes `{3, 2, 4, 8}`, Then `createHand` throws `RangeError('Invalid stakes')`.
- Verification: acceptance `tests/engine/review-gaps.acceptance.test.ts::small blind equal to big blind is accepted`

## 7. Edge cases
- Boundary SB == BB: SPEC-03. SB == BB + 1 rejection: SPEC-03 contrast.
- Folding a blind (chips posted without acting): SPEC-02 blind variant.
- Multiple pots: N/A — the engine builds only `pots[0]` until TASK-1.10; assertions use `pots.every(...)`
  so they keep holding when side pots arrive.
- Invalid input, concurrency, I/O, permissions: N/A — pure functions, test-only change.

## 8. Security considerations
N/A — test-only; no new input paths, dependencies, secrets, logging or randomness. `DECK` is the fixed
0..51 order, so tests are deterministic.

## 9. Non-functional
- The new file runs in under 1 s (three small deterministic tests); measured by Vitest's reported duration.
- Coverage thresholds unaffected (no `src/` change).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx vitest run tests/engine/review-gaps.acceptance.test.ts`
- New tests: `tests/engine/review-gaps.acceptance.test.ts` (acceptance, locked after first green build) → SPEC-01, SPEC-02, SPEC-03.
- Judge scenario / mutation probes (each must make exactly the named test fail, then be reverted):
  - Make one-pair ranking ignore the lowest (third) kicker (TASK-1.2 spec mutation probe; `src/engine/hand-evaluator.ts:97`) → SPEC-01 fails.
  - In `src/engine/hand.ts:411-418` keep `state.pots` on fold → SPEC-02 fails.
  - In `src/engine/hand.ts:401` leave `totalContribution` unchanged → SPEC-02 fails.
  - In `src/engine/hand.ts:142` change `>` to `>=` → SPEC-03 fails.
  - `git diff --stat main -- src` is empty.

## 11. Open questions
- none

## 12. Clarifications log
See `doit/TASK-1.22/qa.md`.
