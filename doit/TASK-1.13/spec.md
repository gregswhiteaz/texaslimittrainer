# Spec: TASK-1.13 — Reject illegal actions without changing the game

Status: READY (approved 2026-11-20)
Task: TASK-1.13 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: REQ-017.4 · Dream: limit-holdem-trainer

## 1. Summary
The engine's `applyAction` already returns a typed `ApplyResult` and rejects, without mutating anything, a move
from the wrong seat (`out-of-turn`), any move on a finished hand (`hand-complete`), and any move that isn't in
`legalActions` (`illegal-action`): wrong amount, raise on a capped street, fold when no bet is faced. This story
proves that with one new locked acceptance test file: scripted cases for AC#1–AC#4 and a seeded 100,000-state
injection run for AC#5. Each check deep-freezes the input state and action and compares a JSON snapshot taken
before and after. The only source change is the `applyAction` doc comment, which states the rejection contract.
Engine behaviour, error shapes and the playtest output stay exactly as they are.

## 2. Scope
- In scope:
  - New `tests/engine/illegal-actions.acceptance.test.ts` (SPEC-01..06).
  - `src/engine/hand.ts`: expand the doc comment on `applyAction` (and on `ApplyErrorCode`) to document the
    three codes, their precedence and the no-mutation guarantee. No logic change.
- Not doing:
  - New or renamed error codes, a changed `ApplyResult` shape, or changed error messages (D-1).
  - User-facing rejection wording or any UI change. The action bar already offers only `legalActions`
    (REQ-017.1–017.3, .5, .6 belong to the Table stories).
  - Guarding against non-object or malformed `Action` values (`null`, a missing `seat`). The TypeScript type
    excludes them and the AC asks for illegal *actions*, not malformed input.
  - Short all-in bets/raises (REQ-016.5 / REQ-017.7; TASK-1.14).
  - The playtest runner, policies, invariant checker or the report format.
  - Editing any existing test, locked or not.
- Scope budget: files=2, lines=300

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | AC#2's "$4" means a $4 raise *increment* preflop. In engine terms a raise is a "raise to" total (`src/engine/hand.ts:48`), so the only legal preflop raise is to `currentBet + 4`, and every other raise-to amount is rejected. A `bet` of any amount, $4 included, is illegal preflop because the big blind is already a live bet (`currentBet > 0`, so `legalActions` never offers `bet`; `src/engine/hand.ts:279-281`). | yes | Matches the engine's Action semantics and REQ-016's fixed-limit rule. | Read "$4" as a raise-to total (it contradicts the engine's own amount convention). |
| A-2 | "Byte-identical" is proven three ways on every rejection. First, the input state and action are deep-frozen before the call, so any write throws in ES-module strict mode. Second, `JSON.stringify(state)` after the call equals the string taken before. Third, the result is exactly `{ ok: false, error: { code, message } }` with no `state` key. The scripted cases (AC#1–AC#4) also check `toStrictEqual` against a `structuredClone` taken before the call, and check that a legal follow-up action gives the same result on the state and on the clone. | yes | JSON is a real byte-level comparison; `HandState` holds only plain JSON data (numbers, strings, booleans, null, arrays, objects; `src/engine/hand.ts:78-101`). Freezing catches mutations that are later undone. Measured cost: 100,000 injections with freeze + two stringifies took ~1.0 s locally. | `structuredClone` + `toStrictEqual` on all 100k (much slower, adds no byte-level guarantee). |
| A-3 | The AC#5 run deals seeded random hands with the existing `Xoshiro128` and `shuffledDeck(replayCodeFromWords(...))` helpers. Each hand has 2–10 seats, a random button and per-seat stacks drawn from 5..200 at $4/$8, so all-ins and short calls happen; 5 is createHand's floor of bigBlind + 1. Play is uniform over `legalActions`. Before each legal move, one illegal action is injected into the current state, until exactly 100,000 in-progress states are covered. Each finished hand also gets one injection (expected `hand-complete`), counted separately. | yes | "Random game states" are reached by legal play, so every state is a real one. Uniform play reaches capped streets and unfaced decisions often (measured: ~4.5k capped-raise and ~5k fold-unfaced picks per 100k). | fast-check-generated action scripts (slower to reach 100k, adds shrinking that isn't needed here). |
| A-4 | Message text is checked only as a non-empty string in the new locked tests. `tests/engine/hand.test.ts:118-145` already asserts the exact current wording, unlocked. | yes | Keeps internal (non-user-facing) wording free to change later without unlocking an acceptance test. | Lock the exact messages. |
| A-5 | The AC#5 seed is fixed (`new Xoshiro128(1313, 2026, 17, 4)`). Every illegal-action kind must appear at least these many times: out-of-turn, wrong-amount and unoffered-type ≥ 20,000 each; capped-raise and fold-unfaced ≥ 1,000 each; hand-complete ≥ 1,000. | yes | Deterministic CI; the minimums prove the run isn't vacuous (measured ≈30k / 30k / 30k / 4.5k / 5k / 6.3k). | Random seed per run (flaky to diagnose). |

## 3. Current system
- `ApplyErrorCode = 'hand-complete' | 'out-of-turn' | 'illegal-action'` and `ApplyResult` (`src/engine/hand.ts:103-109`).
- `applyAction` (`src/engine/hand.ts:484-547`) checks, in order: `state.result !== null` → `hand-complete`
  (`:486`); `action.seat !== state.toAct` → `out-of-turn`, "Seat <a> acted but seat <b> is to act" (`:487-489`);
  type and amount not matching an entry of `legalActions(state)` (`amountOf` strict equality, so `NaN`,
  fractions, a stray `amount` on fold/check, or a missing `amount` on call/bet/raise all fail) → `illegal-action`,
  "Illegal action for seat <a>" (`:490-493`). On success it builds new objects by spreading (`:495-546`), so
  the input is never written.
- `legalActions` (`src/engine/hand.ts:260-284`): when a bet is owed, `[fold, call min(owe, stack), raise?]`;
  when the seat owes nothing but `currentBet > 0` (the big blind's option), `[check, raise?]`; when `currentBet === 0`,
  `[check, bet?]`. Fold is offered only when a bet is owed (Q-45). Raise is withheld when
  `betCount >= STREET_BET_CAP` (4, `:123`) or the stack can't cover it.
- Existing coverage: `tests/engine/hand.test.ts:118-145` (unlocked) has one out-of-turn and four illegal-action
  examples at the opening state plus a hand-complete case, compared with `toEqual` against a `structuredClone`.
  `tests/engine/bet-cap.acceptance.test.ts::AC#6 a fifth raise is not legal` (locked, TASK-1.12) covers a single capped
  raise. No test covers fold-unfaced, a range of wrong amounts, out-of-turn postflop, freezing, or 100k states.
- Tests: Vitest (`npm test` = `vitest run --coverage`, `testTimeout: 30_000` in `vite.config.ts:10`), fast-check
  available (`package.json`). Test files are ES modules (strict mode), so writes to frozen objects throw.
- Existing code to reuse:
  - `tests/engine/bet-cap.acceptance.test.ts:22-44` → copy the `newHand` / `play` scripting pattern (don't import it,
    it isn't exported).
  - `src/engine/seeded-random.ts` `Xoshiro128` (`nextInt`, `nextUint32`) and `src/engine/deck.ts`
    `shuffledDeck` / `replayCodeFromWords` → AC#5 dealing, as in `tests/engine/hand.property.test.ts:17-28`.
  - `STREET_BET_CAP`, `legalActions`, `createHand`, `applyAction` from `src/engine/hand.ts`.

### Locked tests touched
None. No locked file is edited and no engine logic changes, so every locked test (e.g. `tests/engine/hand.test.ts` is
not locked; `tests/engine/hand.acceptance.test.ts` and `hand.property.test.ts` are locked under TASK-1.4,
`bet-cap.acceptance.test.ts` and `invariants.test.ts` under TASK-1.12) keeps passing as it is.

### Playtest baseline
Byte-identical: only comments in `src/engine/hand.ts` change. `npm run playtest -- --hands 10000 --seed 42 --size 6`
must still report fold 5470, showdown 4530, actions 88831, capped 244, largest pot $70, and zero invariant
violations (TASK-1.12 baseline).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Keep the public error interface unchanged: `out-of-turn` for AC#1, `illegal-action` for AC#2–AC#4 (wrong amount, capped raise and fold-unfaced share one code), `hand-complete` for finished hands. | Add `wrong-amount` / `street-capped` / `fold-not-allowed` codes. | AC#1 alone asks for a distinct code, and it already exists (`src/engine/hand.ts:487-489`). AC#2–AC#4 ask only for "an error". New codes would change a public engine type with no consumer that needs them and would churn `tests/engine/hand.test.ts`. Can be added later without breaking anything. | no | n/a |
| D-2 | Error precedence stays `hand-complete` > `out-of-turn` > `illegal-action`. So seat 5 submitting even an action that would be illegal for anyone gets `out-of-turn`. | Validate the action shape first. | Existing order (`src/engine/hand.ts:486-493`); AC#1 says "any action" → out-of-turn. | no | n/a |
| D-3 | All five ACs live in one new locked file, `tests/engine/illegal-actions.acceptance.test.ts`, with its own `deepFreeze` / `expectRejected` helpers. | A shared `tests/support` helper. | A helper outside the locked file could be weakened later without unlocking anything. | no | n/a |

## 5. Design

### Files to create / modify
- `tests/engine/illegal-actions.acceptance.test.ts` — new: SPEC-01..06.
- `src/engine/hand.ts` — doc comments only on `ApplyErrorCode` and `applyAction`.

### Components, interfaces and data
- Doc comment for `applyAction` (replacing "Applies a legal action; never mutates `state`."):
  "Applies a legal action and returns the next state. Never throws for a well-typed action and never mutates `state`
  or `action`. Rejections (REQ-017.4), checked in this order: `hand-complete` (the hand is over), `out-of-turn`
  (`action.seat` isn't `state.toAct`), `illegal-action` (the type and amount don't exactly match an entry of
  `legalActions(state)`, e.g. a wrong amount, a raise on a capped street, or a fold when no bet is faced)."
- Doc comment for `ApplyErrorCode`: one line per code, as above.
- Test helpers (inside the new file):
  - `deepFreeze<T>(value: T): T`: recursively `Object.freeze` every object and array.
  - `expectRejected(state, action, code)`: deep-freezes `state` and `action`, takes `before = JSON.stringify(state)`,
    calls `applyAction`, and asserts that `result` equals `{ ok: false, error: { code, message: expect.any(String) } }`,
    that `'state' in result` is false, that `error.message.length > 0`, and that `JSON.stringify(state) === before`.
  - `expectUnchanged(state, action, code)` (the scripted ACs): `clone = structuredClone(state)` first, then
    `expectRejected`, then `expect(state).toStrictEqual(clone)`. Also, for the first entry `l` of
    `legalActions(clone)`, `expect(applyAction(state, l)).toStrictEqual(applyAction(clone, l))`.

### Rules and algorithms
- Every scripted case uses $4/$8 (`{smallBlind:2,bigBlind:4,smallBet:4,bigBet:8}`), `DECK = [0..51]` and $160
  stacks unless stated otherwise.
- AC#1 setup: 6 seats, button 6, so seat 1 posts SB, seat 2 posts BB and seat 3 acts first.
  - Preflop opening state (`toAct === 3`): seat 5 submits `fold`, `check`, `call 4`, `call 0`, `bet 4`, `raise 8`,
    `raise 12`. Each gets `out-of-turn`.
  - Flop: from the same start play 3 call 4, 4 call 4, 5 call 4, 6 call 4, 1 fold, 2 check (flop), 2 check, which
    leaves `toAct === 3` with `currentBet === 0`. Seat 5 submits `check`, `bet 4`, `fold`. Each gets `out-of-turn`. Control: seat 3 `check` is accepted.
- AC#2 (6 seats, button 1, seat 4 to act facing the BB, legal raise = to 8):
  - `raise` to each of 0, 1, 4, 6, 7, 9, 10, 12, 16, 8.5, -8, NaN, Infinity → `illegal-action`.
  - `bet` with each of 0, 4, 8, 12 → `illegal-action` (A-1).
  - Property: fast-check, `numRuns: 500`. Any amount from
    `fc.oneof(fc.integer({min:-1000,max:1000}), fc.double())` other than 8, submitted as a raise or a bet →
    `illegal-action`.
  - After seat 4 raises to 8 (seat 5 to act, betCount 2, legal raise = to 12): raise to 16 (an $8 increment) and
    raise to 8 → `illegal-action`.
  - BB option (4, 5, 6, 1 call 4; 2 call 2; seat 3 to act owing 0 with currentBet 4): raise to 12 and bet 4 →
    `illegal-action`.
  - Control: seat 4 `raise 8` on the opening state is accepted.
- AC#3:
  - Preflop cap (6 seats, button 1): 4 raise 8, 5 raise 12, 6 raise 16 (betCount 4) → seat 1 raise to 20, raise to
    24 and raise to 16 → `illegal-action`. Control: `legalActions` is exactly `[fold, call 16]`.
  - Turn cap (3 seats, button 3; seat 1 SB, seat 2 BB, seat 3 first preflop): 3 call 4, 1 call 2, 2 check (flop);
    1 check, 2 check, 3 check (turn); 1 bet 8, 2 raise 16, 3 raise 24, 1 raise 32. Now `street === 'turn'`,
    `betCount === 4`, seat 2 is to act and `legalActions` is exactly `[fold, call 16]`. Seat 2 raises to 40 and to 36 →
    `illegal-action`.
- AC#4:
  - Postflop unbet: 6 seats, button 1; preflop 4, 5, 6, 1 call 4; 2 call 2; 3 check → flop, seat 2 to act,
    `currentBet === 0`. Seat 2 `fold` → `illegal-action`. After 2 check, seat 3 `fold` → `illegal-action`.
  - BB option preflop: the BB-option state from AC#2 (seat 3 owes 0) → `fold` → `illegal-action`.
  - Control: `check` is accepted in each of these states.
- AC#5 (A-3, A-5): for each in-progress state, with `seat = toAct`, `owe = currentBet - player.streetContribution`
  and `legal = legalActions(state)`, build the list of applicable kinds:
  `['out-of-turn', 'wrong-amount', 'unoffered-type']`, plus `'capped-raise'` when `betCount >= STREET_BET_CAP && owe > 0`,
  plus `'fold-unfaced'` when `owe <= 0`. Pick one with `rng.nextInt(kinds.length)`, then inject:
  - out-of-turn: seat = a value drawn from 1..10 other than `toAct` (it may be a folded, all-in or undealt seat),
    with an action copied from `legal` → expect `out-of-turn`.
  - wrong-amount: pick an amount-bearing entry of `legal` (fall back to unoffered-type if there is none). Replace its
    amount with one of `amount + 1`, `amount - 1`, `amount + unit`, `0`, `-amount`, `amount + 0.5`, `NaN`,
    `Infinity` → expect `illegal-action`.
  - unoffered-type: a type from fold/check/call/bet/raise not present in `legal`. For call/bet/raise use the amount
    `owe`, `unit` or `currentBet + unit` respectively (or `unit` if `owe` is 0) → expect `illegal-action`.
  - capped-raise: `{ seat, type: 'raise', amount: currentBet + unit }` → expect `illegal-action`.
  - fold-unfaced: `{ seat, type: 'fold' }` → expect `illegal-action`.
  Every injection goes through `expectRejected`. Count per kind; assert the A-5 minimums and that exactly 100,000
  in-progress injections ran. Then apply `legal[rng.nextInt(legal.length)]` (must be `ok`) and continue. For each
  finished hand, inject `{ seat: <any dealt seat>, type: 'check' }` → `hand-complete`.

### Error handling and configuration
- Unchanged: `{ ok: false, error: { code: 'hand-complete' | 'out-of-turn' | 'illegal-action', message } }`; nothing
  is thrown for a well-typed action. No configuration.

## 6. Behaviour specification

### SPEC-01: Acting out of turn is rejected with out-of-turn and changes nothing
- Verifies: AC#1, DoD#1
- Behaviour: Given a 6-seat $4/$8 hand with seat 3 to act (preflop opening state, and again on the flop), When seat 5
  submits fold, check, call, bet or raise of any amount listed in §5, Then each result is
  `{ ok: false, error: { code: 'out-of-turn', message: <non-empty> } }` with no `state`. The deep-frozen input is
  JSON-identical and `toStrictEqual` to its pre-call clone, and a legal follow-up gives the same result on the state
  and on the clone. Control: seat 3's legal action is accepted.
- Verification: acceptance `tests/engine/illegal-actions.acceptance.test.ts::AC#1 an action from a seat that is not to act returns out-of-turn and leaves the state byte-identical`

### SPEC-02: Preflop bets and raises of the wrong size are rejected
- Verifies: AC#2, DoD#1
- Behaviour: Given a $4/$8 preflop state, When the seat to act submits a raise to any total other than
  `currentBet + 4`, or a bet of any amount (A-1), Then the result is `illegal-action` and the state is unchanged
  (`expectUnchanged`). This covers the listed amounts, the 500-run fast-check property, the after-a-raise state and
  the BB option. Control: raise to 8 at the opening state is accepted.
- Verification: acceptance `tests/engine/illegal-actions.acceptance.test.ts::AC#2 preflop bets and raises of any size other than a $4 raise are rejected and leave the state unchanged`

### SPEC-03: A raise on a capped street is rejected
- Verifies: AC#3, DoD#1
- Behaviour: Given a preflop street with betCount 4 (seat 1 to act, legal set exactly `[fold, call 16]`) and a turn
  with betCount 4 (seat 2 to act, legal set exactly `[fold, call 16]`), When the seat to act submits a raise of any listed total, Then the result is `illegal-action` and
  the state is unchanged.
- Verification: acceptance `tests/engine/illegal-actions.acceptance.test.ts::AC#3 a raise on a capped street is rejected and leaves the state unchanged`

### SPEC-04: Folding when no bet is faced is rejected
- Verifies: AC#4, DoD#1
- Behaviour: Given the seat to act owes nothing (first to act on an unbet flop, a later checker on the same flop,
  and the big blind's preflop option), When it submits `fold`, Then the result is `illegal-action` and the state is
  unchanged. Control: `check` is accepted in each state.
- Verification: acceptance `tests/engine/illegal-actions.acceptance.test.ts::AC#4 folding when no bet is faced is rejected and leaves the state unchanged`

### SPEC-05: 100,000 random states reject every injected illegal action byte-identically
- Verifies: AC#5, DoD#1
- Behaviour: Given the seeded run in §5 (2–10 seats, stacks 5..200, uniform legal play), When one illegal action of
  an applicable kind is injected into each of exactly 100,000 in-progress states and into every finished hand, Then
  every injection returns the expected code (`out-of-turn`, `illegal-action` or `hand-complete`) with no `state`, every
  frozen state is JSON-identical afterwards, every legal follow-up is accepted, and each kind meets its A-5 minimum.
  It runs well under the 30 s test timeout (≈1 s measured outside coverage).
- Verification: acceptance `tests/engine/illegal-actions.acceptance.test.ts::AC#5 100,000 random states reject every injected illegal action and stay byte-identical`

### SPEC-06: Checks, playtest baseline and boundaries hold
- Verifies: DoD#2, DoD#4, DoD#5, DoD#6, DoD#10
- Behaviour: Given the change, When the project checks run, Then lint, typecheck and `npm test` (with its coverage
  thresholds and the existing boundary tests) pass. A 10,000-hand 6-max playtest reports zero invariant violations
  and the exact §3 baseline numbers. CI on `doit/TASK-1.13` is green.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run playtest -- --hands 10000 --seed 42 --size 6`

### SPEC-07: Story documentation and N/A DoD items
- Verifies: DoD#3, DoD#7, DoD#8, DoD#9, DoD#11, DoD#12
- Behaviour: Given the story is done, Then a Backlog doc describes the rejection contract (codes, precedence,
  no-mutation proof). DoD#3 (no golden-spot suite yet), DoD#7 and DoD#12 (no screen) and DoD#9 (no strategy
  content) are N/A and recorded as such. DoD#8 holds because no dependency or network code is added.
- Verification: manual `backlog doc list --plain` shows the TASK-1.13 doc; `git diff --stat main -- package.json package-lock.json src/ui` is empty

## 7. Edge cases
- Out-of-turn by a folded, all-in or undealt seat → SPEC-05 (seat drawn from 1..10).
- Out-of-turn with an action that would also be illegal → still `out-of-turn` (D-2; SPEC-01's `raise 12`).
- Non-integer, negative, zero, `NaN` and `Infinity` amounts → SPEC-02, SPEC-05.
- Stray `amount` on fold/check, or a missing one on call/bet/raise → rejected by strict amount matching
  (SPEC-05's unoffered-type kind builds call/bet/raise with amounts; not separately required).
- Short-stacked seat (call all-in = stack) → SPEC-05 (stacks 5..200), wrong-amount kind.
- Boundary at the cap: betCount 3 still offers a raise (TASK-1.12 locked tests); betCount 4 → SPEC-03, SPEC-05.
- Finished hand → `hand-complete`, SPEC-05.
- Heads-up → SPEC-05 (2 seats included).
- Malformed (non-object) actions, concurrency, permissions, dependency failure: N/A (outside the typed API; pure
  synchronous function).

## 8. Security considerations
- Trust boundary: `applyAction` is the single gate for every move (UI, bots, playtest). This story proves it rejects
  every illegal, well-typed action without side effects. No new input path.
- Authn/authz, secrets, injection, logging, sensitive data: N/A.
- New dependencies: none. Randomness: the test uses the existing seeded `Xoshiro128` for reproducibility; no
  fairness-relevant randomness changes.

## 9. Non-functional
- SPEC-05 completes in under 10 s under `vitest run --coverage` (measured ≈1.0 s without coverage), well within
  `testTimeout: 30_000`.
- Playtest output byte-identical to the TASK-1.12 baseline (SPEC-06).
- Engine coverage stays ≥ 90%.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 10000 --seed 42 --size 6`
- New tests:
  - `tests/engine/illegal-actions.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05
- Judge's end-to-end scenario: run `npx vitest run tests/engine/illegal-actions.acceptance.test.ts` and check that 5
  tests pass. Temporarily make `applyAction` mutate its input on rejection (e.g. write to `state.players`) and confirm
  SPEC-01..05 fail, then revert. Run the playtest command and compare it with the §3 baseline.

## 11. Open questions
- None.

## 12. Clarifications log
See `doit/TASK-1.13/qa.md`.
