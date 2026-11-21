# Spec: TASK-7.22 — Pin postflop advice rounding and reach the river in its property test

Status: READY (approved 2026-11-20)
Task: TASK-7.22 · Parent/epic: TASK-7 (Get trustworthy advice) · Requirements: n/a (follow-up from the TASK-7.3 review and judge, doc-17, J-1-01/J-1-02) · Dream: limit-holdem-trainer

## 1. Summary
The TASK-7.3 review and judge left two test gaps in postflop advice. (1) No test needs the `+ 1e-9` nudge in
`toPct`, so removing it leaves every test green, even though it changes shown percentages for inputs such as
0.5005 (50.1 with the nudge, 50.0 without). (2) The AC#3 hidden-card property never folds and stops at
decision 11 or earlier, so it only reaches flop and turn decisions with 6 live players, and its `fc.pre` discard never
runs. This chore keeps the nudge and pins it with tests, and adds a second property in a new test file. The new
property lets seats fold and stops anywhere from postflop decision 0 to 23, and it asserts that its runs reached
flop, turn and river decisions, folded non-acting seats, and discarded runs. No production code changes.

## 2. Scope
- In scope:
  - New test file `tests/advice/postflop-coverage.acceptance.test.ts` with two tests: the `toPct` nudge pin
    (SPEC-01) and the widened property with its coverage assertions (SPEC-02, SPEC-03).
- Not doing:
  - No change to `src/advice/postflop.ts`. The nudge stays (D-1), and so do `toPct`'s signature and JSDoc.
  - No edit to `tests/advice/postflop.acceptance.test.ts` (locked by TASK-7.3). Its AC#3 property stays as it is
    and still covers 6-live-player flop and turn spots. No `doit.py unlock` is needed (D-2).
  - No edit to `tests/advice/postflop.test.ts`. Its `toPct` cases stay. The new pin goes in the new file.
  - No change to `docs/advice/postflop-rules.md`. Its "rounded half up" wording (`:26`) is still correct.
  - No edit to doc-17 or the TASK-7.3 spec (their A-4 rationale cites 0.1665, which does not depend on the nudge).
    See scope concerns.
  - No new dependencies, and no change to `vite.config.ts` or the CI workflow.
- Scope budget: files=1, lines=130

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | In AC#2, "hero" means the seat the property asks advice for, which is the seat to act at the stop point (`state.toAct`). "Non-hero seats folding" means at least one run's view has a folded player whose seat is not `view.seat`. | yes | The AC#3 property advises whoever is to act (`tests/advice/postflop.acceptance.test.ts:186`), not the fixed `HERO = 3` of the example tests | Fix the hero to seat 3 and stop only on its decisions (more discards, same coverage) |
| A-2 | "Discard path is exercised" is shown by counting runs where `state.toAct === null` just before `fc.pre(state.toAct !== null)`, and asserting the count is at least 1 after `fc.assert` | yes | `fc.pre` gives no public skip count. A counter beside the guard shows the guard returned false | Read `fc.check(...).numSkips` (changes the assertion style from `fc.assert`) |
| A-3 | Folds are chosen like any other legal action: `options = legalActions(state)` (fold included), index `choices[step] % options.length`. | yes | Simplest change from the locked property. Measured: across 6 seeds × 40 runs, every seed reached flop, turn and river with folded seats and 66–93 discards | Fold with a fixed lower probability (also measured to work) |
| A-4 | `numRuns: 60, seed: 7322`, with `choices` of length 80 | yes | Measured at 40 runs: about 0.3 s, 3–6 river stops per seed. 60 runs adds margin and stays under 1 s locally. 80 choices cover the longest capped hand (each street at most about 21 decisions) | 40 runs (enough on every measured seed) |
| A-5 | The nudge pin uses all twelve inputs where the nudge changes the result in [0, 1] at x.xxx5 points: 0.5005, 0.5015, …, 0.5115 → 50.1, 50.2, …, 51.2. A guard asserts that `Math.round(0.5005 * 1000) / 10` is 50, so the pinned case keeps depending on the nudge. | yes | Measured with Node: these are the only (n + 0.5)/1000 points that differ with and without the nudge | Pin only 0.5005 → 50.1 (the AC's example) |

## 3. Current system
- `src/advice/postflop.ts:39-42`: `toPct(fraction) = Math.round(fraction * 1000 + 1e-9) / 10`. It is used for
  `equityPct` (`:88`) and `requiredEquityPct` (`:89`). Both are shown to the user and compared by the rules
  (`:95`, a tie calls).
- Nudge evidence: in Node, `Math.round(0.5005 * 1000)` is 500 and `Math.round(0.5005 * 1000 + 1e-9)` is 501
  (`doit/TASK-7.3/reviews/round-1/code.json:44`). A scan of every (n + 0.5)/1000 for n in 0..999 finds exactly
  0.5005, 0.5015, …, 0.5115 as the points where the nudge changes the result (run while writing this spec).
- `tests/advice/postflop.test.ts:146-158`: the `toPct` cases (4/24, 0.1665, 0.16649, 0, 1, 0.5). None needs the
  nudge (`doit/TASK-7.3/judge/round-1.json:39`, J-1-02). The file is not locked.
- `tests/advice/postflop.acceptance.test.ts:163-206`: the AC#3 property. It has a 52-card shuffled deck, 40
  `choices`, `stopAt = fc.nat({ max: 11 })`, filters out folds (`:179`), uses `fc.pre(state.toAct !== null)`
  (`:185`), and runs with `numRuns: 40, seed: 7303`. It is locked by TASK-7.3 (`doit/TASK-7.3/state.json`,
  `locked_tests`). J-1-01 (`doit/TASK-7.3/judge/round-1.json:38`) found 0 river stops and 0 discards.
- Engine API: `createHand`, `applyAction`, `legalActions` (`src/engine/hand.ts:179,398,253`), `playerView`
  (`src/engine/player-view.ts`), types `Action`, `HandState`, `SeatNumber` (`src/engine/hand.ts:49,76,5`).
  `PlayerView.players[]` entries have `seat` and `folded`.
- Tests run with Vitest (`vite.config.ts:7`, includes `tests/**/*.test.{ts,tsx}`, `testTimeout: 30_000`).
  Property tests use `fast-check` 4.10.2 (`package.json`).
- Existing code to reuse:
  - `tests/advice/postflop.acceptance.test.ts:19-21,56-70,163-206` → copy the stakes/seats setup (`STAKES_4_8`,
    seats 1..6, stack 160, button 1) and the property's body and assertions. That file exports nothing and is
    locked, so copy rather than import.
  - `src/advice/postflop.ts` → `toPct`, `recommendPostflop`, `POSTFLOP_RULE_IDS`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Keep the `+ 1e-9` nudge and pin it (SPEC-01) | Remove the nudge and pin the unnudged result (0.5005 → 50) | Removing it changes advice the user sees: equity 0.5005 would show 50.0 instead of 50.1 and could flip a tie-call to a fold. Pinning changes no output. The caller recommended pinning | no (no behaviour change) | n/a |
| D-2 | The widened property goes in a new file `tests/advice/postflop-coverage.acceptance.test.ts`. The locked TASK-7.3 file is not edited | Unlock and widen the AC#3 property in place (strengthen-only, cross-story unlock) | No cross-story locked-test edit, and the original 6-live-player property keeps running. The caller preferred a new file | no | n/a |
| D-3 | The new file is tagged `acceptance`, so it is locked after the first green build | `unit` (unlocked) | Both tests state observable behaviour (shown percentages, legal advice on every street), so later stories should not quietly weaken them | no | n/a |

## 5. Design

### Files to create / modify
- `tests/advice/postflop-coverage.acceptance.test.ts` — new: the `toPct` nudge pin and the widened
  every-street property with coverage assertions.

### Components, interfaces and data
- One `describe('postflop advice coverage (TASK-7.22)', …)` with two `it` blocks, named exactly:
  - `'AC#1 toPct rounds the half-way points the nudge decides up: 0.5005 is 50.1'`
  - `'AC#2 decisions on the flop, turn and river, with folded seats, all get legal advice'`
- No exports and no new helpers outside the file.

### Rules and algorithms
SPEC-01 (AC#1):
- Guard: `expect(Math.round(0.5005 * 1000) / 10).toBe(50)`. Without it, a later JS change could make the case pass
  without the nudge.
- For k = 0..11: `expect(toPct(0.5005 + k / 1000 rounded to 4 decimals), label).toBe(50.1 + k / 10 rounded to 1
  decimal)`. Write the twelve pairs as literals: `[0.5005, 50.1], [0.5015, 50.2], … [0.5115, 51.2]`.
- Mutation check: deleting `+ 1e-9` from `toPct` must fail this test (0.5005 → 50).

SPEC-02/03 (AC#2), the property:
- Arbitraries: `fc.shuffledSubarray([...ALL_CARDS], { minLength: 52, maxLength: 52 })`,
  `fc.array(fc.nat(), { minLength: 80, maxLength: 80 })`, `fc.nat({ max: 23 })` (stopAt).
- Hand: `createHand({ stakes: { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 }, seats: 1..6 at stack 160,
  button: 1, deck })`.
- Loop while `state.toAct !== null`. On a non-preflop street, `if (postflopDecisions === stopAt) break;` and then
  `postflopDecisions++`. `options = legalActions(state)` (fold included), and
  `action = options[(choices[step++] ?? 0) % options.length]`. Apply it, and throw on `!result.ok`.
- After the loop: `if (state.toAct === null) discards++;` then `fc.pre(state.toAct !== null)`.
- Advise: `view = playerView(state, state.toAct)`, `advice = recommendPostflop(view)`. Assert everything the
  locked AC#3 property asserts:
  - the action is in {fold, check, call}
  - `view.legalActions` contains `advice.move`, and `advice.move.type === advice.action`
  - `ruleId ∈ POSTFLOP_RULE_IDS`
  - both percentages are in [0, 100] with one decimal
  - `requiredEquityPct === toPct(callAmount / (pot + callAmount))` when `callAmount > 0`
  Also assert that the rule matches the rounded comparison: `callAmount === 0` ⇒ `check-free`. Otherwise
  `equityPct >= requiredEquityPct` ⇒ `pot-odds-call`, else `pot-odds-fold`. Also `advice.street === view.street`.
- Record coverage in closure variables: `streets.add(view.street)`. If
  `view.players.some(p => p.folded && p.seat !== view.seat)`, then `foldedSeatRuns++`.
- `fc.assert(..., { numRuns: 60, seed: 7322 })`, then:
  `expect([...streets].sort()).toEqual(['flop', 'river', 'turn'])`, `expect(foldedSeatRuns).toBeGreaterThan(0)`,
  `expect(discards).toBeGreaterThan(0)`.
- Worked example (measured with seed 7322 at 40 runs): 28 flop, 6 turn and 6 river stops; 38 runs with a folded
  non-acting seat; 85 discards; 1 to 5 opponents.

### Error handling and configuration
- No production errors change. If an engine action is rejected, the test throws `Error(result.error.message)`, the
  same as the locked property.

## 6. Behaviour specification

### SPEC-01: toPct's nudge is pinned at the points where it matters
- Verifies: AC#1
- Behaviour: Given `toPct` with its `+ 1e-9` nudge, When it is called with 0.5005, 0.5015, …, 0.5115, Then it
  returns 50.1, 50.2, …, 51.2, while `Math.round(0.5005 * 1000) / 10` (no nudge) is 50. Removing the nudge makes
  the test fail.
- Verification: acceptance `tests/advice/postflop-coverage.acceptance.test.ts::AC#1 toPct rounds the half-way points the nudge decides up: 0.5005 is 50.1`

### SPEC-02: every-street property reaches the flop, turn and river with folded seats
- Verifies: AC#2
- Behaviour: Given random 6-max hands where any seat may fold, check, call, bet or raise, stopping at postflop
  decision 0..23, When `recommendPostflop` runs for the seat to act, Then every result is legal (the move is in
  `view.legalActions` and its type equals the action, which is fold, check or call), its rule id is documented and
  matches the rounded comparison, and both percentages are in [0, 100] with one decimal. Across the 60 runs (seed
  7322), the advised streets are exactly {flop, turn, river}, and at least one advised view has a folded seat
  other than the one advised.
- Verification: acceptance `tests/advice/postflop-coverage.acceptance.test.ts::AC#2 decisions on the flop, turn and river, with folded seats, all get legal advice`

### SPEC-03: runs whose hand ends before the stop point are discarded
- Verifies: AC#2
- Behaviour: Given the same property, When a hand ends (everyone else folds, or showdown) before reaching the stop
  point, Then the run is discarded through `fc.pre(state.toAct !== null)` and no advice is requested. Across the
  60 runs the discard counter is at least 1.
- Verification: acceptance `tests/advice/postflop-coverage.acceptance.test.ts::AC#2 decisions on the flop, turn and river, with folded seats, all get legal advice`

## 7. Edge cases
- Hand ends preflop or before stopAt: discarded (SPEC-03).
- Heads-up postflop (one opponent left): reached by folds, and `opponents` = 1 gives an exact equity method. The
  same assertions apply (SPEC-02).
- Capped raising on a street: `choices` length 80 covers it, and `?? 0` keeps the old fallback.
- Too many discards: fast-check allows up to 100 skips per run by default. The measured rate is about 2 per run.
- Folded hero: impossible, because `state.toAct` is never a folded seat.
- Invalid input / concurrency / permissions: N/A (tests only, no inputs).

## 8. Security considerations
N/A. The change is test-only, with no new inputs, dependencies, secrets or randomness in production (fast-check is
seeded).

## 9. Non-functional
- Runtime: the new property takes under 2 s on a developer machine (measured: about 0.3 s for 40 runs) and stays
  well inside Vitest's 30 s `testTimeout`. Checked from the verbose reporter's per-test time.
- Determinism: a fixed seed (7322), so CI results are reproducible.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: N/A — test-only chore; run `npx vitest run tests/advice/postflop-coverage.acceptance.test.ts`
- New tests: `tests/advice/postflop-coverage.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03.
- Judge scenario: run the new file and check it passes. Delete `+ 1e-9` in `src/advice/postflop.ts:41`, confirm
  the AC#1 test fails, and revert. Change the property's `stopAt` max to 11 and filter out folds in a scratch copy,
  confirm the coverage assertions fail (no river, no folded seats, no discards), and delete the copy. Confirm
  `doit.py test-integrity TASK-7.3`-locked `tests/advice/postflop.acceptance.test.ts` is byte-unchanged.

## 11. Open questions
- none

## 12. Clarifications log
See `doit/TASK-7.22/qa.md`.
