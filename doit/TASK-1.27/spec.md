# Spec: TASK-1.27 — Tighten the playtest invariant checker and its messages

Status: READY (approved 2026-11-19)
Task: TASK-1.27 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: n/a (follow-up of TASK-1.8, doc-16) · Dream: limit-holdem-trainer

## 1. Summary
This task is a follow-up to TASK-1.8 that tightens `src/engine/invariants.ts` and its playtest tooling. Two messages
that can mislead get new wording: the hole-card count (K2) and the award-share mismatch (C3). The checker gains a
deal-order check (cards come from the D-5 deck positions) and two history-shape checks (an empty history, or a
record on a non-betting street). The test-only fault engines get a hard per-hand action limit, so a runner that
fails to stop a violating hand makes the suite fail instead of hang. In the CLI, action wording comes from
`describeAction`, and the unreachable null guard in the violation block is removed.

## 2. Scope
- In scope:
  - `src/engine/invariants.ts`: split K2 into K2a (hole-card count, new message) and K2b (board/burn, unchanged).
    Split C3 into C3a (totals, unchanged message) and C3b (per-award shares, new message). Add K4 (deal order) and
    H1/H2 (history shape, reported by `checkState` as `legal-action`). P3 stops casting, so it can't throw. Update
    `checkStep` so it still returns at most one `legal-action`.
  - `src/playtest/runner.ts`: export `toAction`. Add an exported `ViolatingHand` type, and type
    `PlaytestSummary.firstViolation` as `ViolatingHand | null`.
  - `src/playtest/cli.ts`: `actionText` delegates player actions to `describeAction`. `formatReport` prints the
    violation block when `firstViolation !== null`, and the null guard is removed.
  - `tests/support/faulty-engine.ts`: every `FAULTS` engine is wrapped in a per-hand action limit.
  - Tests: one new acceptance file, plus updates to three unit test files.
- Not doing:
  - Any change to `src/engine/hand.ts` (engine rules, `clockwiseAfter` stays private), the TASK-1.8 L4 comment
    follow-up, or messages other than K2's hole-card case and C3's per-award case.
  - Any change to the locked acceptance files `tests/playtest/invariants.acceptance.test.ts`,
    `tests/playtest/playtest.acceptance.test.ts`, `tests/playtest/runner.acceptance.test.ts` or
    `tests/playtest/summary.acceptance.test.ts`. They must pass unchanged.
  - A production action limit in `playHand` (A-4).
  - Checking that the first two history records are the blinds, or that the deck itself is a valid permutation.
  - Any change to CLI output for real runs. Clean and violating runs stay byte-identical except where a K2/C3
    message changes.
- Scope budget: files=8, lines=400   (invariants.ts ~80, runner.ts ~15, cli.ts ~20, faulty-engine.ts ~25, new acceptance test ~140, unit test edits ~120)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The H1/H2 history checks run in `checkState` under the id `legal-action`. In `checkStep`, the step's own L1–L5 message wins when both fire, so there is still at most one violation per id | yes | AC#4 says `checkState` reports `legal-action`. TASK-1.8 rule "≤ 1 per id" (`invariants.ts:265`) | A new id `history` (changes the `Violations by invariant` line and needs approval) |
| A-2 | (user-approved, Q-3) New messages: H1 `history is empty after the deal`. H2 `history record <i> is on <street>, which is not a betting street`, where `<i>` is 1-based over all records including blinds and the first offending record is reported | yes | Same shape as the existing `<pot> lists seat <s>, which …` messages | `action history is empty`; `record <i> has street <street>` |
| A-3 | (user-approved, Q-3) New K4 message: `<slot> is <card> but the deck deals <expected>`. `<slot>` is `seat <s> hole card <1\|2>`, `burn card <j>` or `board card <j>`. `<expected>` is `formatCard(deck[p])`, or `no card` when `deck[p]` is not a card 0..51. Check order: hole cards by ascending seat (card 1, then card 2), then burns, then board. The first mismatch is reported | yes | It names the slot and both cards, so the fault is easy to locate. It runs after K1–K3, so `formatCard` is always safe on the dealt card | `<card> is not from deck position <p>` (needs a 0-based index the user never sees) |
| A-4 | AC#5 is met on the test side. Each `FAULTS` engine counts `applyAction` calls per hand (reset by its `createHand`) and throws `Error('runner kept playing a hand past 1000 actions; it must stop at the first violation')` on call 1001. 1000 is well above any legal hand (10 seats, 4 streets, 4-bet cap ≈ 184) | yes | The suite only hangs on a fault engine: `illegalAccepted` + `alwaysCheck` loops forever if the runner doesn't stop. Real-engine runs always end. A sync loop can't be timed out by vitest, but a throw fails at once | A limit in `playHand` (changes production behaviour and needs a new violation id) |
| A-5 | K4 recomputes the D-5 layout itself (`hand.ts:186-194`, `:355-366`) and doesn't import the engine's private `clockwiseAfter` | yes | An invariant shouldn't share the code it checks, and `hand.ts` stays untouched | Export `clockwiseAfter` from `hand.ts` |
| A-6 | The removed null guard is replaced by narrowing the type, not by a non-null assertion. `formatReport` prints the block iff `summary.firstViolation !== null`, which for every real summary is the same as `violations > 0` (`runner.ts:212-215`) | yes | No unreachable branch is left, and output is unchanged | Keep `violations > 0` and add `!` (lint-sensitive, leaves the same unreachable state) |

## 3. Current system
- `src/engine/invariants.ts:99-152` `chipsMessage`. C3 at `:127-140` prints `paid` when only the per-award balance fails,
  which gives `awards pay $20 but players put in $20` (pinned in `tests/engine/invariants.test.ts:112-126`).
- `src/engine/invariants.ts:228-248` `cardsMessage`. K2 at `:235-241` folds the hole-card count into the board/burn
  message (pinned in `tests/engine/invariants.test.ts:209-214`: `flop has 3 board and 1 burn cards`).
- `src/engine/invariants.ts:190-198` P3 casts `playerAt(...) as PlayerState`. If P1's not-dealt-in clause is removed,
  the P1 row `withPot(S, 16, [2,3,4,5,7])` (`invariants.test.ts:155-159`) fails with a TypeError, not a message
  mismatch.
- `src/engine/invariants.ts:251-273` `checkState` / `checkStep`, with report order `INVARIANTS` (`:13-19`).
- D-5 deal layout: `src/engine/hand.ts:186-194` (seat at deal position `i` in `clockwiseAfter(seats, button)` gets
  `[deck[i], deck[i+n]]`) and `:355-366` (burn at `2n`, `2n+4`, `2n+6`; flop `2n+1..2n+3`, turn `2n+5`, river
  `2n+7`). `clockwiseAfter` is at `hand.ts:110-114`.
- `src/playtest/runner.ts:145-165` stops the hand at the first violation (`break` at `:162`). Without it,
  `tests/support/faulty-engine.ts:49-66` (`illegalAccepted`) with `alwaysCheck` loops forever.
- `src/playtest/cli.ts:133-152` `violationBlock` has the unreachable guard at `:135`. `actionText` at `:156-167`
  repeats `describeAction` (`invariants.ts:38-51`).
- Tests: vitest 5 (`vite.config.ts:6-14`, `testTimeout: 30_000`), with `npm test` = `vitest run --coverage`. Unit tests
  pin exact messages in table rows (`tests/engine/invariants.test.ts:79-219`).
- Existing code to reuse:
  - `src/playtest/runner.ts:114-117` `toAction` → export it and use it in `cli.ts` to turn a player record into an
    `Action` for `describeAction`.
  - `src/engine/invariants.ts` `potName`, `isCard`, `playerAt`, `BETTING_STREETS`, `formatCard` → for the new
    messages and checks.
  - `tests/engine/invariants.test.ts:47-60` fixture recipe (6 seats, button 1, deck `0..51`, states `S`,
    `foldOut`) → copy it into the new acceptance file.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | K2a hole-card message: `seat <s> has <k> hole card(s) but should have 2`, singular `card` when k = 1 (e.g. `seat 3 has 1 hole card but should have 2`, `seat 3 has 3 hole cards but should have 2`, `seat 5 has 0 hole cards but should have 2`). Board/burn errors keep `<street> has <b> board and <n> burn cards` | `seat <s> holds <k> hole cards (2 expected)` | Names the seat and count; TASK-1.8 D-2 messages were user-approved | yes | user (Q-1) |
| D-2 | C3b per-award message: `award <i> (<pot>) is $<amount> but its winners get $<shares>` (e.g. `award 1 (main pot) is $12 but its winners get $8`). Totals mismatch keeps `awards pay $<a> but players put in $<c>` | `<pot> award <i> pays winners $<shares> of its $<amount>` | Names the award and never repeats equal totals | yes | user (Q-2) |
| D-3 | New checks are ordered after the existing sub-checks of their invariant: K4 after K3, H1/H2 alone under `legal-action` in `checkState` | Run K4 before K3 | Existing exact-message rows (K3 `3d dealt twice` also breaks deal order) and the locked TASK-1.8 fault expectations keep their messages | no | n/a |
| D-5 | New A-2/A-3 messages (H1, H2, K4) as drafted in the Assumptions table | see A-2, A-3 alternatives | User-visible text | yes | user (Q-3) |
| D-4 | `PlaytestSummary.firstViolation: ViolatingHand \| null`, where `ViolatingHand = PlayedHand & { readonly violation: HandViolation }`. `summarize` narrows with a type guard and keeps object identity (`toBe` assertions in locked tests) | Leave the type and keep a guard | Removes the unreachable guard while type-checking | no | n/a |

## 5. Design

### Files to create / modify
- `src/engine/invariants.ts` — K2a, C3b, K4, H1/H2, P3 without cast, `checkStep` merge
- `src/playtest/runner.ts` — export `toAction`, `ViolatingHand`, typed `firstViolation`
- `src/playtest/cli.ts` — `actionText` via `describeAction`; guard removed
- `tests/support/faulty-engine.ts` — per-hand action limit on every `FAULTS` engine
- `tests/engine/invariant-messages.acceptance.test.ts` — new acceptance tests (SPEC-01..04)
- `tests/engine/invariants.test.ts` — update the K2 hole-card and C3 award-share rows; add `checkStep` merge row
- `tests/playtest/runner.test.ts` — action-limit test (SPEC-05)
- `tests/playtest/cli.test.ts` — `ViolatingHand` typing, clean summary with `firstViolation: null`, wording test

### Components, interfaces and data
- `checkState(state)` returns violations in `INVARIANTS` order and now may include `legal-action` (H1/H2). It still
  never throws or mutates. Update the doc comment.
- `checkStep(step)`: if the step's L1–L5 gives a message, that is the only `legal-action` entry. Any `legal-action`
  from `checkState` is dropped, and the result keeps `INVARIANTS` order. If L1–L5 pass, `checkState`'s entries are
  returned as is.
- `runner.ts`: `export type ViolatingHand = PlayedHand & { readonly violation: HandViolation }` and `export function
  toAction(record: ActionRecord): Action` (body unchanged).
- `faulty-engine.ts`: `export const MAX_ACTIONS_PER_HAND = 1000` and a `bounded(engine)` wrapper applied to every
  `FAULTS[*].seams.engine` (A-4). `alwaysCheck` and `raiseWheneverOffered` are unchanged.

### Rules and algorithms
Fixture for all examples: 6 seats at $160, button 1, deck `0..51`. Deal order is 2,3,4,5,6,1, so seat 2 holds
`[2c, 3h]` (deck 0, 6), seat 3 holds `[2d, 3s]` (1, 7) and seat 1 holds `[3d, 4s]` (5, 11). `S` is the flop state
after seat 2 bets $4: burned `[5c]` (12), board `[5d 5h 5s]` (13–15), 9 history records.
- K1 (unchanged), then:
- K2a. For each player in array order, `holeCards.length !== 2` → D-1 message. Example: seat 3 with
  `[10]` gives `seat 3 has 1 hole card but should have 2`.
- K2b (unchanged). Board/burn lengths per street → `<street> has <b> board and <n> burn cards`.
- K3 (unchanged).
- K4. Let `seats` = player seats ascending, `n` = count, `start` = index of the first seat > `button` (0 if none).
  The player at ascending index `i` has deal position `p = (i − start + n) % n`, and its hole card 1 must equal
  `deck[p]` and hole card 2 `deck[p+n]`. Burn `j` (1-based) must equal `deck[2n + [0,4,6][j−1]]`. Board `j` must
  equal `deck[2n + [1,2,3,5,7][j−1]]`. Message per A-3. Examples on `S`: seat 3 hole card 1 → 40 gives
  `seat 3 hole card 1 is Qc but the deck deals 2d`. Swapping seat 2's and seat 3's first hole cards gives
  `seat 2 hole card 1 is 2d but the deck deals 2c`. Burn 1 → 40 gives `burn card 1 is Qc but the deck deals 5c`.
  Board 1 → 40 gives `board card 1 is Qc but the deck deals 5d`. Use no allocation per call (perf budget).
- C3a. When complete: Σ award amounts ≠ Σ `totalContribution` → `awards pay $<Σ amounts> but players put in $<c>`
  (unchanged template; `<a>` is now always the award total, so the two amounts always differ).
- C3b. Otherwise, the first award (1-based index `i`, in `result.awards` order) whose winner shares don't sum to its
  `amount` → D-2 message. Example: awards `[{pot 0, $12, seat 2 gets $8}, {pot 0, $8, seat 2 gets $12}]`
  → `award 1 (main pot) is $12 but its winners get $8`.
- H1. `actions.length === 0` → `history is empty after the deal` (A-2).
- H2. Else the first record whose `street` is not one of preflop/flop/turn/river → `history record <i> is on
  <street>, which is not a betting street`. Example: `S` + a `showdown` check record →
  `history record 10 is on showdown, which is not a betting street`.
- P3. `const p = playerAt(state, seat)` with "not contributed" true when `p === undefined` (no cast). Messages
  unchanged.
- CLI `actionText(record)`: blinds keep `seat <s> posts small blind $<a>` / `posts big blind $<a>`. Every other
  record returns `describeAction(toAction(record))`. Output is byte-identical.
- CLI `formatReport` appends `violationBlock(summary.firstViolation, summary.violationCounts, mode)` iff
  `summary.firstViolation !== null`. `violationBlock` takes a `ViolatingHand` and has no null check.

### Error handling and configuration
- None of the checks throw. The fault-engine limit throws only in tests (A-4). No new options or exit codes.

## 6. Behaviour specification

### SPEC-01: Hole-card count message names the seat and count
- Verifies: AC#1
- Behaviour: Given `S` with seat 3's hole cards set to `[10]` (and, separately, seat 3 with 3 cards and seat 5 with 0 cards), When `checkState` runs, Then it returns exactly one `cards` violation whose message is `seat 3 has 1 hole card but should have 2` (respectively `seat 3 has 3 hole cards but should have 2`; `seat 5 has 0 hole cards but should have 2`, with seat 3 reported first when both are wrong), and the board/burn message is no longer used for it. A board-length error (`S` with 2 board cards) still gives `flop has 2 board and 1 burn cards`.
- Verification: acceptance `tests/engine/invariant-messages.acceptance.test.ts::names the seat and hole-card count`

### SPEC-02: Award-share message names the award and never contradicts itself
- Verifies: AC#2
- Behaviour: Given `foldOut` with awards `[{pot 0, $12, [{seat 2, $8}]}, {pot 0, $8, [{seat 2, $12}]}]` (totals $20 = $20), When `checkState` runs, Then exactly one `chips` violation has the message `award 1 (main pot) is $12 but its winners get $8`, and the message never contains `players put in`. Given a single award of $21 against $20 put in, Then the message stays `awards pay $21 but players put in $20`.
- Verification: acceptance `tests/engine/invariant-messages.acceptance.test.ts::names the mismatched award`

### SPEC-03: Cards not from their deck position are reported
- Verifies: AC#3
- Behaviour: Given `S`, When each of these corruptions is checked by `checkState`, Then exactly one `cards` violation results with the exact K4 message from §5: seat 3 hole card 1 → Qc; seat 2 and seat 3 first hole cards swapped (no duplicate); burn 1 → Qc; board 1 → Qc; the turn state (`S` + three calls) with board card 4 → Qc gives `board card 4 is Qc but the deck deals 6d`. Given clean real-engine states for sizes 3..10 and every button (one 20-hand `runPlaytest` per size with `onAction: checkStep`), Then 0 violations.
- Verification: acceptance `tests/engine/invariant-messages.acceptance.test.ts::reports cards not dealt from their deck position`

### SPEC-04: History shape is checked by checkState
- Verifies: AC#4
- Behaviour: Given `{...S, actions: []}`, When `checkState` runs, Then it returns `[{invariant: 'legal-action', message: 'history is empty after the deal'}]`. Given `S` plus a record `{street: 'showdown', seat: 3, type: 'check', amount: 0, added: 0}`, Then `[{invariant: 'legal-action', message: 'history record 10 is on showdown, which is not a betting street'}]`. Clean `dealt`, `flop`, `S`, `foldOut`, `showdown` still give `[]`.
- Verification: acceptance `tests/engine/invariant-messages.acceptance.test.ts::reports a broken action history`

### SPEC-05: checkStep keeps one legal-action entry
- Verifies: AC#4
- Behaviour: Given the L3 step (`seat 2 bets $8`) whose result state also has an empty history and a stack +1, When `checkStep` runs, Then the invariants are `['chips', 'legal-action']` and the legal-action message is `seat 2 bets $8 is not in the legal set`. Given the clean step with a result state that has an empty history, Then `[legal-action: history is empty after the deal]`.
- Verification: unit `tests/engine/invariants.test.ts::history violations merge into checkStep`

### SPEC-06: A runner that never stops a violating hand fails fast
- Verifies: AC#5
- Behaviour: Given `FAULTS.illegalAccepted.seams` and a test loop that keeps applying `alwaysCheck` actions through its engine while `toAct !== null`, ignoring violations (a runner that never stops), When the test runs, Then it throws `runner kept playing a hand past 1000 actions; it must stop at the first violation` well inside 30 s. Given the real `playHand` with every `FAULTS` entry, Then the hand still stops at action ≤ 1000 with the expected invariant (no false trips).
- Verification: unit `tests/playtest/runner.test.ts::fault engines fail fast when a runner keeps playing a violating hand`

### SPEC-07: Mutant runner fails instead of hanging
- Verifies: AC#5
- Behaviour: Given a scratch copy of the repo where the `break` in `playHand` (`runner.ts:162`) is deleted, When `npx vitest run tests/playtest` runs, Then the process exits non-zero within 120 s with at least one failure mentioning `past 1000 actions`, and does not hang. Restore the file afterwards.
- Verification: manual `sed -i '' '/^      break;$/d' src/playtest/runner.ts && npx vitest run tests/playtest; git checkout src/playtest/runner.ts` (expect non-zero exit, wall time < 120 s)

### SPEC-08: CLI action text comes from describeAction and output is unchanged
- Verifies: AC#6
- Behaviour: Given `scripted` hands covering fold, check, call, bet and raise, When `formatHand` prints them, Then each player-action entry equals `describeAction(toAction(record))` and the existing exact report/hand expectations in `cli.test.ts` pass unchanged. `src/playtest/cli.ts` contains none of the literals `'folds'`, `'checks'`, `calls $`, `bets $`, `raises to $`.
- Verification: unit `tests/playtest/cli.test.ts::prints player actions with describeAction wording`

### SPEC-09: Null guard removed; block keyed on firstViolation
- Verifies: AC#6
- Behaviour: Given the source, When inspected, Then `violationBlock` has no `=== null` check and takes a `ViolatingHand`. Given a summary with `violations: 0, firstViolation: null`, Then `formatReport` prints no block. Given the existing violating summary, Then output is byte-identical to today's expectation. The 10,000-hand playtest prints `Invariant violations: 0` and exits 0.
- Verification: unit `tests/playtest/cli.test.ts::appends the violation block only when there are violations`

### SPEC-10: P1 row fails by assertion, not by throw
- Verifies: AC#6
- Behaviour: Given P3 without the cast, When the P1 not-dealt-in clause (`playerAt(state, seat) !== undefined &&`) is removed in a scratch copy, Then `tests/engine/invariants.test.ts` fails on the `P1 seat not dealt in` row with an assertion diff (`main pot lists seat 7, which has not contributed to it` vs `main pot has a malformed eligible list`) and no `TypeError`. Restore the file afterwards.
- Verification: manual `sed -i '' 's/playerAt(state, seat) !== undefined && //' src/engine/invariants.ts && npx vitest run tests/engine/invariants.test.ts 2>&1 | grep -c TypeError; git checkout src/engine/invariants.ts` (expect test failure and count 0)

### SPEC-11: Whole suite and checks stay green
- Verifies: AC#1, AC#2, AC#3, AC#4, AC#5, AC#6
- Behaviour: Given the finished change, When the gates run, Then `npm run lint`, `npm run typecheck` and `npm test` pass with all locked acceptance files unchanged, `src/engine/invariants.ts` keeps ≥ 90% coverage, the perf test passes, and `npm run playtest -- --hands 10000 --seed 42` prints `Invariant violations: 0` and exits 0.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run playtest -- --hands 10000 --seed 42`

## 7. Edge cases
- Several seats with wrong hole-card counts: the first in player array order is reported (SPEC-01).
- Several mismatched awards: the first by index (SPEC-02). Totals mismatch and share mismatch together: C3a wins.
- Button not a dealt-in seat (corrupt state): `start` = first seat > button still defines an order, so no throw. A
  short or corrupt `deck`: `<expected>` = `no card` (A-3). Order-only swaps that K3 can't see: SPEC-03.
- K4 vs K3: a duplicate also breaks order, but K3's message wins (D-3).
- H1 and H2 together are impossible (H2 needs a record). Both step and state legal-action: the step's message wins
  (SPEC-05).
- Concurrency, permissions, interruption: N/A (pure synchronous functions).

## 8. Security considerations
N/A. No new trust boundary, input, dependency, secret or randomness. The checker reads in-memory state only.

## 9. Non-functional
- Checker cost stays ≤ 2 µs/action on the reference machine and passes the 10 µs local floor
  (`tests/engine/invariants.perf.test.ts`). K4 adds ≤ 2n + 8 comparisons and no allocations.
- `npm run playtest -- --hands 10000 --seed 42` stays < 60 s (locked TASK-1.6 timeout).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 10000 --seed 42`
- New tests: `tests/engine/invariant-messages.acceptance.test.ts` → SPEC-01..04; `tests/engine/invariants.test.ts`
  → SPEC-05 (plus the updated K2 hole-card and C3 award-share rows); `tests/playtest/runner.test.ts` → SPEC-06;
  `tests/playtest/cli.test.ts` → SPEC-08, SPEC-09.
- Judge scenario: run `npm run playtest -- --hands 10000 --seed 42` (0 violations, exit 0). Then run the two
  scratch mutations in SPEC-07 and SPEC-10 and confirm fail-fast with assertion failures, not a hang or TypeError.

## 11. Open questions
None. Q-1 → D-1, Q-2 → D-2, Q-3 → A-2/A-3 approved (D-5); see `doit/TASK-1.27/qa.md`.

## 12. Clarifications log
See `doit/TASK-1.27/qa.md`.
