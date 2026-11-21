# Spec: TASK-1.11 — Play heads-up hands with heads-up blinds and order

Status: READY (approved 2026-11-20)
Task: TASK-1.11 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: REQ-015.1, REQ-015.2, REQ-015.3, REQ-062.1 · Dream: limit-holdem-trainer

## 1. Summary
The engine accepts hands with exactly two dealt-in seats and plays them by heads-up casino rules. The button posts
the small blind, the other player posts the big blind, the button acts first preflop and the non-button player acts
first on the flop, turn and river. The playtest CLI accepts `--size 2`, so `npm run playtest -- --size 2` plays
10,000 seeded heads-up hands and reports zero invariant violations. Hands with 3 to 10 seats do not change, so the
6-max baseline report stays byte-identical.

## 2. Scope
- In scope:
  - `src/engine/hand.ts`:
    - `validate` accepts 2..10 seats. The error message becomes `Hand needs 2 to 10 seats, got <n>`.
    - `createHand` makes the button the small blind and the other seat the big blind when `n === 2`.
    - Fix the `HandConfig.seats` doc comment ("2..10").
  - `src/playtest/cli.ts`: `--size` range becomes 2..10 in `parseArgs`, `SIZE_ERROR` and `USAGE`.
  - New acceptance tests for AC#1–AC#5. Unit-test updates for the changed range and message (U1, U2 in §3).
- Not doing:
  - Choosing the table size in the app (Game Config / session). That is TASK-2.2 "Choose how many players sit at
    the table". `SessionConfig.players` already documents 2..10 (`src/table/session.ts:74`), but no screen offers 2.
  - Going heads-up mid-session when players bust, and moving the button past busted seats (TASK-1.16, REQ-020.3).
  - All-in blinds for short stacks (TASK-1.16). The `bigBlind + 1` stack floor stays as it is.
  - Heads-up bet cap rules or any change to the cap (TASK-1.12). Heads-up uses the same cap as other sizes.
  - A heads-up preflop chart or a TAG bot for 2 players. `--size 2` uses the existing random-move policy
    (`src/playtest/runner.ts:104-106`), like every size other than 6.
  - A new invariant id for blind or actor positions. Position order is proved by the acceptance tests (D-4).
  - Changing deal order or odd-chip order. Both already fit heads-up rules (D-2, D-3).
- Scope budget: files=6, lines=280

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The CLI messages change only in the range: `Error: --size must be a whole number from 2 to 10.` and `[--size <2-10>]` in both usage lines | yes | Same wording as today, with the new lower bound. AC#4/AC#5 require `--size 2` to run. This is developer CLI text, not app UI | Keep 3..10 and add a separate `--heads-up` flag (conflicts with AC#4 wording) |
| A-2 | The engine error for a bad seat count becomes `Hand needs 2 to 10 seats, got <n>` | yes | Keeps the existing message pattern (`src/engine/hand.ts:135`) | Separate messages for too few and too many seats |
| A-3 | A heads-up `--size 2` run uses the same $4/$8 stakes, $160 reset stacks and alternating button `((k-1) % 2) + 1` as other sizes | yes | Reuses `runPlaytest` unchanged (`src/playtest/runner.ts:262`). AC#1 states $4/$8 | Heads-up-specific stakes or stacks |

## 3. Current system
- Engine (`src/engine/hand.ts`):
  - `validate` rejects fewer than 3 seats: `if (seats.length < 3 || seats.length > 10)` (`src/engine/hand.ts:134-135`).
  - `createHand` sets `dealOrder = clockwiseAfter(seats, button)`, `sb = dealOrder[0]`, `bb = dealOrder[1]`
    (`src/engine/hand.ts:206-208`). With 2 seats this makes the **non-button** seat the small blind and the button
    the big blind. That is the bug this task fixes.
  - The first preflop actor is `clockwiseAfter(seats, bb)[0]` (`src/engine/hand.ts:235`). With 2 seats this is the
    seat that is not `bb`. Once `bb` is the non-button seat, it is the button. So AC#2 needs no change beyond the
    blind fix.
  - Later streets start at the first open player clockwise from the button (`endRound`, `src/engine/hand.ts:405-439`).
    With 2 seats this is the non-button seat, so AC#3 already holds.
  - The next actor is the next open seat clockwise from the actor (`src/engine/hand.ts:501-504`). With 2 seats this
    means the two players alternate.
  - Hole cards go one at a time clockwise from the left of the button (`dealOrder.indexOf(seat)`,
    `src/engine/hand.ts:210,216`). The invariant K4 checks the same order (`src/engine/invariants.ts:294-319`).
  - `splitPot` gives odd dollars clockwise from the left of the button (`src/engine/hand.ts:332-345`).
  - `minimumStack($4/$8) = $96` (`src/engine/hand.ts:124-126`) is below the $160 playtest stack, so playtest hands
    never go all-in.
- Playtest CLI (`src/playtest/cli.ts`):
  - `--size` is parsed by `whole('--size', 6, 3, 10)` (`src/playtest/cli.ts:78`). The error is
    `SIZE_ERROR` (`:43`) and the usage text says `[--size <3-10>]` (`:35-36`).
  - `--button` is limited to `1..size` (`:90`), so with size 2 it accepts 1 or 2 with no change.
  - The table line prints `Table: <size> players, ...` (`:194-197`).
  - The task's Implementation Notes record "--size is limited to 3..10 until heads-up exists" (TASK-1.6 follow-up).
- Runner (`src/playtest/runner.ts`): `playHand` seats `1..size` at $160 (`:136`). `runPlaytest` moves the button
  `((k-1) % size) + 1` (`:262`). `defaultPolicyFactory(size)` uses random-move for any size other than 6 (`:104-106`).
  No change needed.
- Tests: vitest (`npm test` = `vitest run --coverage`). Engine acceptance helpers in
  `tests/engine/hand.acceptance.test.ts:14-60` (`STAKES_4_8`, `scriptedDeck`, `newHand`, `play`); the new files copy
  the small helpers they need (that file is locked by TASK-1.4). CLI subprocess helper `playtest()` in
  `tests/playtest/playtest.acceptance.test.ts:16-30` uses `sandboxEnv`/`REPO_ROOT` from `tests/support/sandbox`.
- Tests that assert the old 3..10 range. None of them is locked; `doit/*/state.json` `locked_tests` lists neither file:
  - U1 `tests/engine/hand.test.ts:149` expects `seats([1, 2])` to throw `Hand needs 3 to 10 seats, got 2`. Change
    this case to `seats([1])` → `Hand needs 2 to 10 seats, got 1`. Change line 150 to `... 2 to 10 seats, got 11`.
    The assertion keeps its strength: it still checks a rejected lower bound and a rejected upper bound.
  - U2 `tests/playtest/cli.test.ts:36-40,70-71`: `--size 2` error cases and the usage text. Change the `--size 2`
    cases to `--size 1` (and `--size 1` with `--replay-code`). Update the expected message to `from 2 to 10`. Update
    the usage lines to `<2-10>`.
  - Locked `tests/engine/hand.property.test.ts:161` (TASK-1.4) generates 3..10 seats only. It is unaffected.
- Baseline `npm run playtest -- --hands 10000 --seed 42` at base `f237fab` (run 2026-11-20): `Ended by fold: 5470`,
  `Ended at showdown: 4530`, `Player actions: 88831`, `Streets capped at 4 bets: 244`, `Largest pot: $70`,
  `First replay code: 000000000000002a0000000000000001`, `Last replay code: 000000000000002a0000000000002710`,
  `Invariant violations: 0`. The run takes about 0.7 s.
- Existing code to reuse:
  - `src/engine/hand.ts` `clockwiseAfter` → seat ordering; no new ordering helper.
  - `src/playtest/runner.ts` `runPlaytest` / `playHand` with its `onHand` callback → walk every played hand in the
    AC#4 test.
  - `src/playtest/cli.ts` `main` with a capturing `CliIo` → in-process CLI checks.
  - `tests/support/sandbox` `REPO_ROOT`, `sandboxEnv` → the subprocess `npm run playtest` test.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | In `createHand`, when `n === 2`: `sb = button`, `bb = dealOrder[0]` (the other seat). Otherwise keep `dealOrder[0]`/`dealOrder[1]`. Leave the preflop first actor rule (`clockwiseAfter(seats, bb)[0]`) as it is | Rotate `dealOrder` for 2 seats | Smallest change. The 3..10-seat path stays byte-identical, and the existing first-actor rule already picks the button | no | n/a |
| D-2 | Keep the deal order for heads-up: the first card goes to the non-button (big blind) seat, the button gets the last | Deal the button first | Standard casino practice: the dealer deals to the player on their left first. Invariant K4 (`src/engine/invariants.ts:294-319`) already assumes this order, so no invariant change is needed | no | n/a |
| D-3 | Keep the odd-dollar order: in a heads-up split, the odd dollar goes to the non-button seat | Give it to the button | Same rule as other sizes (`splitPot`). It matches the common "first seat left of the button" rule. The task does not ask for a change | no | n/a |
| D-4 | Prove heads-up blinds and order in tests that walk every hand of the 10,000-hand `--size 2` run. Do not add a new invariant id | Add a `position` invariant to `INVARIANTS` | A new id would change the violation report lines and the locked invariant tests (TASK-1.8, TASK-1.27). AC#4 asks for "every hand is heads-up" plus zero violations, which a hand-walk test proves | no | n/a |

## 5. Design

### Files to create / modify
- `src/engine/hand.ts` — accept 2 seats; heads-up blind seats (D-1); doc comment.
- `src/playtest/cli.ts` — `--size` range 2..10, `SIZE_ERROR`, `USAGE`.
- `tests/engine/heads-up.acceptance.test.ts` — new; SPEC-01..SPEC-04.
- `tests/playtest/heads-up.acceptance.test.ts` — new; SPEC-05, SPEC-06.
- `tests/engine/hand.test.ts` — U1 (range message) plus SPEC-07, SPEC-08 unit cases.
- `tests/playtest/cli.test.ts` — U2 (range message, usage) plus the SPEC-09 parse case.

### Components, interfaces and data
- No signature or type changes. `HandConfig.seats` now allows 2..10 entries. `HandState` and `ActionRecord` keep
  their shape: a heads-up hand's `actions` starts with `{type:'small-blind', seat: button}` and then
  `{type:'big-blind', seat: other}`.
- `parseArgs` returns `size` in 2..10. `PlaytestOptions.size` is unchanged in type.

### Rules and algorithms
- Heads-up blinds (n = 2, $4/$8, seats {1, 2}, button 1):
  - Seat 1 (button) posts the small blind $2 and has $158 behind. Seat 2 posts the big blind $4 and has $156.
  - `currentBet` is 4, `betCount` is 1 and `toAct` is 1.
- Preflop order: button first. If the button calls ($2), the big blind gets its option: `toAct` = 2 with legal
  actions `check`, `raise to 8`. If the big blind checks, the round closes and the flop is dealt.
- Flop, turn, river: `toAct` is the non-button seat first. After it acts, the button acts.
- Button on seat 2 (seats {1, 2}): seat 2 posts the small blind and acts first preflop; seat 1 posts the big blind
  and acts first postflop. Non-adjacent seats (e.g. {3, 7}, button 7) follow the same rule.
- Deal positions (n = 2, button 1, deck d): seat 2 gets d[0], d[2]; seat 1 gets d[1], d[3]. Burns are at d[4],
  d[8], d[10]; the flop is d[5..7], the turn d[9], the river d[11]. These are the D-5 offsets from 2n = 4.
- Button folds preflop at $4/$8: the big blind wins. Award amount $4, and `returned` = {seat: bb, amount: 2}
  (the uncalled $2 of the big blind). The big blind ends with $162 and the button with $158.

### Error handling and configuration
- `createHand` with 1 or 11 seats throws `RangeError('Hand needs 2 to 10 seats, got <n>')`.
- `--size 1`, `--size 0` and `--size 11` exit 2 with `Error: --size must be a whole number from 2 to 10.` followed by the
  usage text.

## 6. Behaviour specification

### SPEC-01: Heads-up blinds: button posts the small blind
- Verifies: AC#1, DoD#1
- Behaviour: Given a heads-up $4/$8 hand (seats 1 and 2, $160 each), When it is created with the button on seat 1,
  Then `actions[0]` is `{street:'preflop', seat:1, type:'small-blind', amount:2, added:2}` and `actions[1]` is
  `{street:'preflop', seat:2, type:'big-blind', amount:4, added:4}`. Seat 1 has stack 158 and seat 2 has stack 156.
  The same holds mirrored with the button on seat 2, and with seats {3, 7} and the button on 7 (seat 7 posts $2,
  seat 3 posts $4).
- Verification: acceptance `tests/engine/heads-up.acceptance.test.ts::AC#1 heads-up the button posts the $2 small blind and the other player the $4 big blind`

### SPEC-02: Heads-up preflop: the button acts first and the big blind keeps its option
- Verifies: AC#2, DoD#1
- Behaviour: Given a heads-up $4/$8 hand with the button on seat 1, When preflop betting begins, Then `toAct` is 1
  and `legalActions` is fold, call 2, raise to 8. When seat 1 calls $2, Then `toAct` is 2 and `legalActions` is
  check, raise to 8. When seat 2 checks, Then the street is `flop`. The same holds mirrored with the button on seat 2
  (`toAct` is 2 first).
- Verification: acceptance `tests/engine/heads-up.acceptance.test.ts::AC#2 heads-up the button acts first preflop`

### SPEC-03: Heads-up flop, turn and river: the non-button player acts first
- Verifies: AC#3, DoD#1
- Behaviour: Given a heads-up hand with the button on seat 1 where preflop goes call then check, When the flop,
  turn and river are each dealt, Then `toAct` is 2 at the start of each street, and after seat 2 checks `toAct` is 1.
  In a scripted line where seat 2 bets the flop, seat 1 raises and seat 2 calls, the turn still starts with seat 2.
  The same holds mirrored with the button on seat 2 (seat 1 acts first postflop).
- Verification: acceptance `tests/engine/heads-up.acceptance.test.ts::AC#3 heads-up the non-button player acts first on flop turn and river`

### SPEC-04: Heads-up hands deal and finish like other hands
- Verifies: AC#1, AC#3
- Behaviour: Given a heads-up hand with the button on seat 1 and a scripted deck, When it is played check-down to
  showdown, Then seat 2's hole cards are deck[0], deck[2], seat 1's are deck[1], deck[3], the board is deck[5], deck[6],
  deck[7], deck[9], deck[11], `checkState` returns [] after every action, the result is `endedBy:'showdown'`, and the
  stacks total $320.
- Verification: acceptance `tests/engine/heads-up.acceptance.test.ts::heads-up hands deal from the D-5 positions and reach showdown with chips conserved`

### SPEC-05: 10,000 seeded heads-up playtest hands are all heads-up and clean
- Verifies: AC#4, DoD#1, DoD#6
- Behaviour: Given `runPlaytest({hands: 10000, seed: 42, size: 2}, onHand)`, When it runs, Then every hand has
  exactly 2 players. In each hand, the `small-blind` record's seat equals `final.button` and the `big-blind` record's
  seat is the other seat. The first non-blind preflop record is by the button. On every later street that has
  records, the first record is by the non-button seat. The summary reports `handsPlayed` 10000 and `violations` 0.
  Separately, the subprocess `npm run playtest -- --hands 10000 --size 2 --seed 42` exits 0, and its stdout contains
  `Options: --hands 10000 --seed 42 --size 2`, `Table: 2 players, cash $4/$8, every stack reset to $160 before each hand`,
  `Hands played: 10000` and `Invariant violations: 0`.
- Verification: acceptance `tests/playtest/heads-up.acceptance.test.ts::AC#4 10,000 seeded --size 2 hands are all heads-up with heads-up blinds and order and zero violations`

### SPEC-06: `npm run playtest -- --size 2` with defaults plays heads-up and reports 0 violations
- Verifies: AC#5, DoD#1
- Behaviour: Given `npm run playtest -- --size 2` with no other options, When it runs, Then it exits 0 and stdout contains
  `Options: --hands 10000 --seed 42 --size 2`, `Table: 2 players, cash $4/$8, every stack reset to $160 before each hand`
  and `Invariant violations: 0`. Also, `npm run playtest -- --replay-code <the run's first replay code> --size 2 --button 1`
  exits 0. Its printed hand shows `seat 1 posts small blind $2` followed by `seat 2 posts big blind $4` on the `Preflop:` line.
- Verification: acceptance `tests/playtest/heads-up.acceptance.test.ts::AC#5 npm run playtest -- --size 2 plays heads-up hands and reports 0 violations`

### SPEC-07: createHand accepts 2 to 10 seats and rejects 1 and 11
- Verifies: AC#1
- Behaviour: Given a config with 1 seat, When `createHand` runs, Then it throws `RangeError` with message `Hand needs 2 to 10 seats, got 1`.
  With 11 seats the message is `Hand needs 2 to 10 seats, got 11`. With 2 seats it returns a state with 2 players
  (U1).
- Verification: unit `tests/engine/hand.test.ts::createHand rejects invalid configs with fixed messages`

### SPEC-08: Heads-up fold-out returns the uncalled big blind
- Verifies: AC#2
- Behaviour: Given a heads-up $4/$8 hand with the button on seat 1, When seat 1 folds preflop, Then the result is
  `endedBy:'fold'`, `awards[0]` is `{pot:0, amount:4, winners:[{seat:2, amount:4}]}`, `returned` is `{seat:2, amount:2}`,
  seat 2 has $162 and seat 1 has $158, and `checkStep` reports no violations for that action.
- Verification: unit `tests/engine/hand.test.ts::heads-up button fold preflop returns the uncalled $2 to the big blind`

### SPEC-09: CLI --size range is 2 to 10
- Verifies: AC#4, AC#5
- Behaviour: Given `parseArgs(['--size', '2'])`, Then it returns `{kind:'run', options:{hands:10000, seed:42, size:2}}`.
  `parseArgs(['--replay-code', <valid>, '--size', '2', '--button', '2'])` returns a replay with size 2 and button 2.
  With `--button 3` it returns `Error: --button must be a seat number from 1 to the table size.` `--size 1` (with and
  without `--replay-code`) and `--size 11` return `Error: --size must be a whole number from 2 to 10.`. `USAGE` shows
  `[--size <2-10>]` on both lines (U2).
- Verification: unit `tests/playtest/cli.test.ts::parseArgs accepts --size 2 and rejects sizes outside 2 to 10`

### SPEC-10: Hands with 3 to 10 seats are unchanged and the 6-max baseline is byte-identical
- Verifies: DoD#6
- Behaviour: Given the change, When `npm run playtest -- --hands 10000 --seed 42` runs, Then it exits 0 and prints
  output byte-identical to the §3 baseline (`Ended by fold: 5470`, `Ended at showdown: 4530`, `Player actions: 88831`,
  `Streets capped at 4 bets: 244`, `Largest pot: $70`, `Invariant violations: 0`, same replay codes). The locked
  6-max and 3..10-seat tests (`tests/engine/hand.acceptance.test.ts`, `tests/engine/hand.property.test.ts`,
  `tests/playtest/*.acceptance.test.ts`) still pass unmodified.
- Verification: command `npm run playtest -- --hands 10000 --seed 42`

### SPEC-11: Checks, boundaries and CI stay green
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#7, DoD#8, DoD#9, DoD#10, DoD#12
- Behaviour: Given the change, When lint, typecheck and the full suite with coverage run, Then all pass with zero
  errors. Coverage stays at or above 90% for the engine and 70% overall. `src/engine/*` imports no UI code (the boundary
  tests pass). The CI workflow is green on `doit/TASK-1.11`. N/A items:
  - DoD#3: the golden-spot suite does not exist yet (E07-S14).
  - DoD#7 and DoD#12: no screen changes.
  - DoD#8: no network code.
  - DoD#9: no strategy content.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-12: Story documentation is published
- Verifies: DoD#11
- Behaviour: Given the story is built, When the docs step runs, Then a Backlog story document for TASK-1.11 exists.
  It records that heads-up hands are supported and that `--size 2..10` is the CLI range, and gives the heads-up
  playtest result line.
- Verification: manual `backlog doc list --plain` shows the TASK-1.11 story doc

## 7. Edge cases
- Button on the higher seat (wrap-around, seats {1,2} button 2): SPEC-01, SPEC-02, SPEC-03.
- Non-adjacent heads-up seats ({3,7}): SPEC-01.
- Button folds preflop (uncalled big blind): SPEC-08.
- Big blind option after a preflop call: SPEC-02.
- Raise and re-raise postflop heads-up (order alternates): SPEC-03. The bet cap is the existing generic one,
  exercised by SPEC-05's 10,000 hands.
- Seat count boundaries 1 / 2 / 10 / 11: SPEC-07, SPEC-09.
- Heads-up all-in: N/A in the playtest, because $160 > minimumStack $96. The engine path is the generic one from
  TASK-1.9 and has no seat-count branch.
- Concurrency, permissions, dependency failure: N/A (pure functions and a local CLI).

## 8. Security considerations
- Trust boundary: CLI arguments. `--size` keeps the same strict `^[0-9]+$` plus range validation, now with 2..10
  (`src/playtest/cli.ts:71-76`). `createHand` keeps validating seat count, seats and button.
- No new dependencies, no network, no secrets, no new randomness. Shuffles are still seeded from the replay code.

## 9. Non-functional
- The 10,000-hand `--size 2` run finishes in under 5 s locally. The 6-max run takes about 0.7 s, and heads-up hands
  have fewer actions. Measure with `time npm run playtest -- --size 2`.
- The new subprocess tests use the same 120 s per-test timeout as `tests/playtest/playtest.acceptance.test.ts:7`.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --size 2`
- New tests (path → SPEC ids):
  - `tests/engine/heads-up.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04
  - `tests/playtest/heads-up.acceptance.test.ts` → SPEC-05, SPEC-06
  - `tests/engine/hand.test.ts` → SPEC-07 (U1), SPEC-08
  - `tests/playtest/cli.test.ts` → SPEC-09 (U2)
- End-to-end scenario for the Judge:
  1. `npm run playtest -- --size 2` → exit 0, `Table: 2 players ...`, `Invariant violations: 0`.
  2. Take the `First replay code` and run `npm run playtest -- --replay-code <code> --size 2 --button 1`. Check
     that the Preflop line starts `seat 1 posts small blind $2, seat 2 posts big blind $4, seat 1 ...`. Check that
     any Flop/Turn/River line starts with seat 2.
  3. `npm run playtest -- --hands 10000 --seed 42` → byte-identical to the §3 baseline.
  4. `npm run playtest -- --size 1` → exit 2, `Error: --size must be a whole number from 2 to 10.`

## 11. Open questions
- None.

## 12. Clarifications log
See `doit/TASK-1.11/qa.md`.
