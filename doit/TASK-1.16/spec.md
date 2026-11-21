# Spec: TASK-1.16 — Move the button and blinds past busted seats

Status: READY (approved 2026-11-21)
Task: TASK-1.16 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: REQ-018.5, REQ-020.1–020.4, REQ-056.1, REQ-062.1, REQ-008.1, REQ-013.3 · Dream: limit-holdem-trainer

## 1. Summary
Between hands, the button moves to the next seat that has chips, and the next two such seats post the blinds.
Seats with no chips are skipped, and nobody posts a missed or dead blind. A player who can't cover a blind posts
everything they have and is all-in. If nobody is left to bet against, the hand is dealt out with no betting.
`createHand`'s stack floor drops from `bigBlind + 1` to $1. The playtest stops resetting every stack to $160:
stacks carry over, and in cash only a seat at $0 rebuys for $160. A new `--game sng` mode starts every seat with
1,500 chips at 20/40, never refills busted seats, and starts a new sit-and-go when one player has all the chips.
Replay-code word 2 tells the two modes apart (cash 0, sng 1). A deal-time check confirms that each seat starts
with the stack it finished the previous hand with.

## 2. Scope
- In scope:
  - `src/engine/hand.ts`: stack floor $1. All-in blinds (REQ-020.4). The short big blind rule (D-1). A hand
    with nobody left to bet against is dealt out at the deal (D-2). A lone player with chips who owes nothing gets
    no option (D-3). New `nextButton` (REQ-020.1/020.2). Doc comment updates.
  - `src/engine/invariants.ts`: new `checkDeal`. It runs `checkState` on the dealt hand, the C5 returned-chips
    rule if the hand finished at the deal, and the cross-hand chip check (AC#9).
  - `src/playtest/runner.ts`: game types (`cash`, `sng`), carried stacks, cash rebuy, sit-and-go restart, the
    button from `nextButton`, replay-code word 2, the deal check, and the policy chosen per hand by the number
    of seats dealt in.
  - `src/playtest/cli.ts`: `--game`, and `--stacks` in replay mode. New Table lines and the Options/Replay line
    additions. Blinds are printed with the chips actually posted, and a violation found at the deal is reported
    as "at the deal".
  - Tests: two new acceptance files, two new unit files, three updated unit files, and five locked-test edits
    (E1–E6, Q-4).
- Not doing:
  - `src/table/session.ts` is not touched. Its TEMPORARY top-up to the buy-in (`session.ts:168-174`) stays.
    Removing it is TASK-3.21, which also needs rebuy in the app. The session never deals a stack below $96, so
    the new $1 floor changes nothing there. The locked comment check `tests/table/next-hand.acceptance.test.ts:111`
    stays green.
  - The rising sit-and-go level schedule (REQ-008.2/008.3, TASK-5.4). sng stays at Level 1 (20/40).
    TASK-5.4 extends this same mode rather than adding a second one.
  - Sit-and-go finishing positions, the user busting, and chips shown without `$` (TASK-5.x). The playtest
    keeps `$` (A-4).
  - New playtest report lines or counters. The locked `tests/playtest/invariants.acceptance.test.ts` AC#3 allows
    only the existing labels between the header and `Invariant violations:`.
  - CI workflow changes. CI keeps running the cash 10,000-hand playtest (`.github/workflows/ci.yml:44`). The sng
    run is covered by the vitest acceptance test (SPEC-10).
  - TAG chart changes. TAG is still used only when exactly 6 seats are dealt in (A-5).
  - Deleting or loosening any assertion in a locked test.
- Scope budget: files=16, lines=1250

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Cash rebuy happens between hands. A seat that ends a hand on $0 starts the next hand with $160 and is dealt in normally: it posts a blind if its turn comes, with no waiting for the button. | yes | Playtest bots always rebuy (REQ-007.5 replaces a busted bot with a fresh buy-in before the next hand). No missed-blind concept exists (REQ-020.2). | Make the rebought seat wait for the big blind |
| A-2 | The first hand of every table has the button at seat 1. A table starts at the start of the run, at each new sit-and-go, and after a hand with a violation. | yes | Matches today's hand 1 (`runner.ts:257`, TASK-1.6 A-2). Simple and deterministic. | Carry the rotation into the new sit-and-go |
| A-3 | After a hand with any violation (the hand is abandoned or flagged), the table restarts: every seat at the starting stack, button at seat 1, and no cross-hand check for the next hand. | yes | An abandoned hand has no settled final stacks, since chips are still in the middle. Carrying them would cause false chip violations later. | Stop the run at the first violation |
| A-4 | The playtest prints sit-and-go chip amounts with `$`, as it does for cash (`Seat 1 ($1500)`, `Largest pot: $…`). Only the Table line says "chips". | yes | REQ-008.7 is about the app UI (TASK-5.3). Keeping one formatter keeps the CLI change small. | Drop `$` in sng output |
| A-5 | The default policy is chosen per hand from the number of seats dealt in: TAG when exactly 6 are dealt in, the seeded random-move policy otherwise. | yes | The 6-max chart throws unless exactly 6 seats are dealt in (`src/advice/preflop.ts:48-51`). In sng, busts reduce the seat count. Cash at 6 is unchanged (always 6 dealt in). | Random policy for all of sng |
| A-6 | `checkDeal` problems are reported like action violations (same counts, same `Violations by invariant:` line), with the line `First violation: hand N, at the deal`. A hand with deal violations isn't played. | yes | Hands that finish at the deal (D-2) have no actions, so without this they would never be checked. A cross-hand mismatch is found before any action. | Report deal problems as part of action 1 |
| A-7 | The Replay line and the replay Options line include `--stacks` only when some seat differs from the game's starting stack. They include `--game sng` only for sng. | yes | Keeps the locked Replay line in `tests/playtest/invariants.acceptance.test.ts:167` unchanged for hands dealt at the buy-in. | Always print `--game` and `--stacks` |
| A-8 | `nextButton` lives in `src/engine/hand.ts` next to `createHand`. The playtest runner is its only caller in this task. | yes | REQ-020 says "the engine shall move the button". The session keeps its own rotation until TASK-3.21/TASK-5.2. | A new `src/engine/table.ts` |

## 3. Current system
- Engine `createHand` (`src/engine/hand.ts:191-261`): validates config (`validate`, `hand.ts:145-189`). The stack
  floor is `bigBlind + 1` (`hand.ts:178-185`, TASK-1.9 D-1, deferred here). Heads-up, the button posts the small
  blind (`hand.ts:213-215`). Blind records hold `amount` = blind size and `added` = chips moved (`hand.ts:53-61`).
  `currentBet` is `stakes.bigBlind` and `toAct` is the first seat after the big blind (`hand.ts:242-244`).
- `applyAction` (`hand.ts:563-630`): `open` = unfolded seats that aren't all-in. The round ends when every open
  seat has acted and matched `currentBet` (`hand.ts:620-623`). `endRound` deals the remaining board when
  `open.length <= 1` (`hand.ts:476`). `fullBetLevel` and the checker's `countedBets` take the bet level from the
  big-blind record's `amount` (`hand.ts:271-283`, `invariants.ts:66-85`).
- Checker (`src/engine/invariants.ts`): `checkState` (`:416-433`) and `checkStep` (`:438-455`) give at most one
  violation per id, in INVARIANTS order. `returnedMessage` (C5, `:186-210`) runs on completed hands.
- Runner (`src/playtest/runner.ts`): every seat starts every hand with `CASH_BUY_IN` (`:136`). The button is
  `((k-1) % size) + 1` (`:257`). `handReplayCode` uses words `[seed hi, seed lo, 0, k]` (`:111-116`). The
  default policy is TAG at size 6 (`:103-106`). `playHand` stops at the first violating action (`:146-167`).
- CLI (`src/playtest/cli.ts`): `parseArgs` (`:44-114`), `USAGE` (`:34-37`), the Table line (`:192-195`),
  the violation block and Replay line (`:141-162`), and blind text from `record.amount` (`:166-170`).
- TAG crashes on a BB "unopened" spot. The chart has no `('BB','unopened')` spot
  (`src/advice/charts/six-max.json`), and `chartCell` throws (`src/advice/preflop-chart.ts:219-221`). That spot
  happens if a small blind is all-in from the blind and everyone folds to the big blind. D-3 removes that BB
  decision.
- Tests: `npm test` = `vitest run --coverage` (`package.json`). `src/playtest` and `src/engine` have a 90% line
  threshold (`vite.config.ts:16-19`). Tests are typechecked (`tsconfig.json` includes `tests`). Playtest
  acceptance tests spawn `npm run playtest` through `tests/support/sandbox.ts`.
- Current cash baseline (`npm run playtest -- --hands 10000 --seed 42`, run 2026-11-21): `Ended by fold: 5470`,
  `Ended at showdown: 4530`, `Player actions: 88831`, `Streets capped at 4 bets: 244`, `Largest pot: $70`,
  `Invariant violations: 0`, 0.7 s. This baseline changes on purpose (AC#7).
- Existing code to reuse:
  - `src/engine/hand.ts` `clockwiseAfter` → blind seats, `toAct` among open seats, and `nextButton`.
  - `src/engine/hand.ts` `endRound` → dealing out a hand at the deal (D-2) and the lone-player close (D-3).
  - `src/engine/invariants.ts` `checkState`, `returnedMessage` → inside `checkDeal`.
  - `src/engine/deck.ts` `replayCodeFromWords` → word 2.
  - `src/playtest/policy.ts` `randomMovePolicy`/`seatGenerator` → default policy below 6 dealt-in seats.
  - `tests/support/faulty-engine.ts` pattern (wrapping `createHand`) → the AC#9 fault seam.
  - `tests/support/sandbox.ts` `REPO_ROOT`, `sandboxEnv` → spawning `npm run playtest`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Short big blind: the blind record keeps `amount` = full blind size, `added` = chips posted. `currentBet` stays `stakes.bigBlind`, so everyone else must call the full big blind, and the part above the all-in becomes a side pot or is returned. Short small blind: same record shape. | (b) The bet level drops to the posted amount (call $3, raises to $7) | Standard casino and TDA practice. Bet sizes stay on the fixed-limit grid. The engine and checker already read the level from the big-blind record's `amount`, so there is no new path. | yes | user (Q-1, `doit/TASK-1.16/qa.md`, auto-accepted) |
| D-2 | At the deal, if no seat is left to bet against (every seat all-in, or one seat not all-in whose street contribution is ≥ every other seat's), `createHand` returns a completed hand: board dealt out, showdown, `toAct: null`, no player actions. | Give the lone player a pointless option | Nobody can respond, so there is no decision. This matches what `endRound` already does at street starts (`hand.ts:476`). | yes | user (Q-1, `doit/TASK-1.16/qa.md`, auto-accepted) |
| D-3 | The same rule applies mid-round: after an action, if exactly one seat is not all-in and it has the largest street contribution among unfolded seats, the betting round ends even if that seat hasn't acted. In practice this removes the big blind's option when every other live player is all-in for no more than the blind. | Keep the option. TAG would then need a new chart spot (BB unopened), which is strategy content out of scope. | Correct poker (betting needs two players with chips). Prevents a TAG crash (§3) once all-in blinds are real. | yes | user (Q-1, `doit/TASK-1.16/qa.md`, auto-accepted) |
| D-4 | Stack floor is $1: `Stack at seat N must be an integer of at least 1`. Busted seats are left out of `HandConfig.seats` by the caller. | Floor 0 with seats sitting out inside the engine | Keeps `HandState.players` = dealt-in seats (TASK-1.4 A-2). Changes two locked message assertions (E1, E2). | yes | user (Q-4, `doit/TASK-1.16/qa.md`, auto-accepted) |
| D-5 | Replay-code word 2 = 0 for cash (unchanged) and 1 for sng. `handReplayCode(seed, k, game = 'cash')`. | Another constant (e.g. 2, or ASCII "SNG") | Word 2 was reserved for the game type (TASK-1.6 follow-up). A small integer leaves room for later game types. | yes | user (Q-3, `doit/TASK-1.16/qa.md`, auto-accepted) |
| D-6 | CLI interface and text: `--game <cash\|sng>` (both modes) and `--stacks` (replay only), with the USAGE, Options, Table and Replay lines and the error messages exactly as in §5. | Print `--game cash` always (changes two more locked lines). A separate `--sng` flag. | Smallest change that keeps every unchanged locked line intact (A-7). | yes | user (Q-2, `doit/TASK-1.16/qa.md`, auto-accepted) |
| D-7 | `PlayedHand` gains `dealViolations`. `HandRecord` gains `game` and `size`. `PlaytestSummary.firstViolation` becomes `PlayedHand \| null`. `HandViolation` and `ViolatingHand` are unchanged. | Make `HandViolation.action` nullable | A nullable `action` breaks the typecheck of locked `tests/playtest/invariants.acceptance.test.ts:163` (`describeAction(violation.action)`). | no | n/a |
| D-8 | Carry rule: after a completed hand with no violations, each seat's next stack is its final stack. A cash seat at $0 gets $160. An sng seat at $0 stays out. If only one seat has chips, a new sit-and-go starts. The next button is `nextButton(nextStacks, final.button)`. | — | AC#6, AC#7, AC#9; A-1..A-3. | no | n/a |

## 5. Design

### Files to create / modify
- `src/engine/hand.ts` — floor $1, all-in blinds, D-1..D-3, `nextButton`, doc comments.
- `src/engine/invariants.ts` — `checkDeal`.
- `src/playtest/runner.ts` — games, carried stacks, `HandSetup`, deal check, word 2, per-hand default policy.
- `src/playtest/cli.ts` — `--game`, `--stacks`, USAGE, Options/Table/Replay lines, blind text, deal block.
- `tests/engine/button-blinds.acceptance.test.ts` — new: AC#1–AC#5 (SPEC-01..07).
- `tests/engine/all-in-blinds.test.ts` — new: the lone-player rule, floor, `nextButton` errors, small-stack grid (SPEC-08, SPEC-09).
- `tests/engine/check-deal.test.ts` — new: `checkDeal` cases (SPEC-14).
- `tests/playtest/games.acceptance.test.ts` — new: AC#6–AC#9 (SPEC-10..13).
- `tests/playtest/cli.test.ts` — update for the new fields, flags and lines (SPEC-15).
- `tests/playtest/runner.test.ts` — update for `HandSetup`, word 2, restarts (SPEC-15).
- `tests/engine/hand.test.ts` — floor cases now use stack 0 (`:165-166`, `:249-252`).
- `tests/engine/chip-safety.acceptance.test.ts` — E1 (locked, TASK-1.31).
- `tests/engine/input-hardening.acceptance.test.ts` — E2 (locked, TASK-1.21).
- `tests/playtest/playtest.acceptance.test.ts` — E3 (locked, TASK-1.6).
- `tests/playtest/heads-up.acceptance.test.ts` — E4 (locked, TASK-1.11).
- `tests/playtest/runner.acceptance.test.ts` — E5, E6 (locked, TASK-1.6).

### Components, interfaces and data
Engine (`src/engine/hand.ts`):
```ts
/** The first seat clockwise after `previous` (wrapping, increasing seat number) whose stack is above 0.
 *  `previous` need not have chips. Throws RangeError('Need at least 2 seats with chips') if fewer than 2 do. */
export function nextButton(stacks: readonly SeatConfig[], previous: SeatNumber): SeatNumber;
```
- `validate`: every stack must be a safe integer ≥ 1, or throw
  `RangeError('Stack at seat ${seat} must be an integer of at least 1')`. No other validation changes.
- `createHand`: the blind seats are chosen as today from the dealt-in seats. Blind posted =
  `min(blind, stack)`. The record is `{street:'preflop', seat, type, amount: <blind size>, added: <posted>}`.
  Player `stack -= posted`, `streetContribution = totalContribution = posted`, `allIn = (stack - posted === 0)`.
  `currentBet = stakes.bigBlind`, `betCount = 1` (unchanged). Then:
  - if `bettingOver(players)` (below) → return `endRound(dealt, dealt.players)`, a completed hand;
  - else `toAct = clockwiseAfter(<open seats>, bb)[0]`.
- `bettingOver(players)` (private): `open` = unfolded and not all-in. True iff `open.length === 0`, or
  `open.length === 1` and `open[0].streetContribution ≥` every other unfolded player's `streetContribution`.
- `applyAction`: after the existing fold-out check, the round ends (`endRound`) if the existing every-open-seat
  condition holds **or** `bettingOver(players)` (D-3).
- `minimumStack` is unchanged (the session top-up and the A-4 stakes bound still use it). Its doc comment says
  the floor is now $1.

Checker (`src/engine/invariants.ts`):
```ts
/** Checks a hand right after createHand: checkState(state); the C5 returned rule if state.result !== null and
 *  chips is clean; and, when `previous` is given (the last hand's final {seat, stack} for each seat dealt into it),
 *  the cross-hand chip check. ≤ 1 violation per id, INVARIANTS order; the cross-hand message takes the chips
 *  slot. [] when clean. Never throws. */
export function checkDeal(
  state: HandState,
  previous?: readonly SeatConfig[],
  rebuy: number | null = null,
): readonly Violation[];
```
Cross-hand rule. For every seat in `previous` or `state.players`, in ascending order:
- `expected` = the previous stack if it is > 0. If it is 0, `expected` = `rebuy ?? 0`. A seat not in
  `previous` has `expected` 0.
- `actual` = the dealt `startingStack`, or 0 if the seat isn't dealt in.
- The first seat where they differ gives `{invariant:'chips', message:'seat S starts with $A but should start with $E'}`.
- A value of 0 means "not dealt in".

Runner (`src/playtest/runner.ts`):
```ts
export type GameType = 'cash' | 'sng';
export const SNG_STAKES: Stakes = { smallBlind: 10, bigBlind: 20, smallBet: 20, bigBet: 40 }; // REQ-008.2 L1
export const SNG_STARTING_CHIPS = 1500; // REQ-008.1
export interface GameRules { readonly stakes: Stakes; readonly startingStack: number; readonly rebuy: boolean; readonly codeWord: number }
export const GAMES: Readonly<Record<GameType, GameRules>>;
//   cash: { stakes: PLAYTEST_STAKES, startingStack: CASH_BUY_IN, rebuy: true, codeWord: 0 }
//   sng:  { stakes: SNG_STAKES, startingStack: SNG_STARTING_CHIPS, rebuy: false, codeWord: 1 }
export interface PlaytestOptions { hands; seed; size; readonly game?: GameType }   // default 'cash'
export interface HandSetup {
  readonly game?: GameType;                    // default 'cash'
  /** One per seat 1..size; 0 = not dealt in. Default: every seat at GAMES[game].startingStack. */
  readonly stacks?: readonly number[];
  /** Previous hand's final {seat, stack} for each seat dealt into it, on the same table; enables the AC#9 check. */
  readonly previous?: readonly SeatConfig[];
}
export interface HandRecord { replayCode; stakes; seats /* dealt-in only */; button; actions;
  readonly game: GameType; readonly size: number }
export interface PlayedHand { …existing; /** [] when clean. Non-empty ⇒ no actions were played. */
  readonly dealViolations: readonly Violation[] }
// PlaytestSummary.firstViolation: PlayedHand | null  (earliest hand with violations > 0)
export function handReplayCode(seed: number, handNumber: number, game: GameType = 'cash'): ReplayCode;
//   replayCodeFromWords([floor(seed / 2^32), seed >>> 0, GAMES[game].codeWord, handNumber])
export function playHand(code, size, button, number = 1, seams = {}, setup: HandSetup = {}): PlayedHand;
```
- `playHand`:
  - `stacks.length !== size` throws `RangeError('Stacks must list one stack per seat')`.
  - `seats` = `{seat: i+1, stack}` for each stack > 0. The default `makePolicy` is
    `defaultPolicyFactory(seats.length)` (A-5).
  - After `engine.createHand`, `dealViolations = checkDeal(state, setup.previous, rules.rebuy ? rules.startingStack : null)`.
    If that is non-empty, no action is played.
  - `violations = dealViolations.length + (violation?.violations.length ?? 0)`.
- `summarize`: a hand counts as violating if `violations > 0`. It counts the ids of `dealViolations` and the
  action violations (each id once per hand).
- `runPlaytest` loop (D-8, A-2, A-3). `fresh` = all seats at the starting stack, button 1, no `previous`. For
  k = 1..hands:
  - play hand k with `handReplayCode(seed, k, game)` and the current stacks, button and previous;
  - if the hand had violations or `final.result === null`, the next table is `fresh`;
  - otherwise `next[s]` = the seat's final stack (0 if not dealt in). In cash a 0 becomes 160. If fewer than 2
    seats have chips, the next table is `fresh` (new sit-and-go). Otherwise the next button is
    `nextButton(next, final.button)` and `previous` = `final.players.map(({seat, stack}) => ({seat, stack}))`.
- `replayHand(record)` is unchanged. It already uses `record.seats`, `record.stakes` and `record.button`.

CLI (`src/playtest/cli.ts`):
- `ParsedArgs` run → `options: {hands, seed, size, game}`. Replay → `{replayCode, size, button, game, stacks}`,
  where `stacks` is always filled (default: all at the starting stack).
- `USAGE` =
  ```
  Usage: npm run playtest -- [--hands <1-1000000000>] [--seed <0-9007199254740991>] [--size <2-10>] [--game <cash|sng>]
         npm run playtest -- --replay-code <32 lowercase hex characters> [--size <2-10>] [--button <seat>] [--game <cash|sng>] [--stacks <one stack per seat, comma-separated, 0 = empty seat>]
  Defaults: --hands 10000 --seed 42 --size 6 --button 1 --game cash; --stacks gives every seat $160 (cash) or 1500 (sng)
  ```
- Table lines (D-6):
  - cash: `Table: ${size} players, cash $4/$8, stacks carry over, a busted seat rebuys for $160`
  - sng: `Table: ${size} players, sit-and-go 20/40 (blinds 10/20), 1500 chips each, busted seats sit out, a new sit-and-go starts when one player has all the chips`
- Options lines:
  - run: `Options: --hands H --seed S --size N`, plus ` --game sng` for sng.
  - replay: `Options: --replay-code C --size N --button B`, plus ` --game sng` for sng, plus ` --stacks a,b,…`
    if any seat differs from the starting stack (A-7).
- Replay line: `Replay: npm run playtest -- --replay-code C --size ${record.size} --button B`, with the same
  ` --game sng` / ` --stacks …` suffixes. `--stacks` lists `size` values: each dealt-in seat's starting stack,
  and 0 for seats not dealt in.
- Violation block:
  - for a deal violation, the `First violation:` line reads `First violation: hand N, at the deal`, followed by a
    `Violation:` line for each entry of `dealViolations`;
  - everything else is unchanged.
- Blind text uses `added`: `seat 2 posts small blind $1`. Full blinds print exactly as today.

### Rules and algorithms
Worked examples. Stakes $2/$4/$4/$8 unless stated. `DECK` = cards 0..51 in order. "6 seats" means seats 1–6.
- **W1 (AC#1).** `createHand` with 6 seats at $160, button 1: SB 2, BB 3, `toAct` 4. Seats 4, 5, 6 and 1
  fold, then seat 2 folds. Seat 3 wins: `returned {seat:3, amount:2}`, award $4. Final stacks:
  `{1:160, 2:158, 3:162, 4:160, 5:160, 6:160}`. `nextButton(finals, 1)` = 2. `createHand(finals, button 2)`
  gives records `{seat:3, small-blind, amount:2, added:2}` and `{seat:4, big-blind, amount:4, added:4}`, with
  `toAct` 5.
- **W2 (AC#2).** Stacks `{1:160, 2:160, 3:0, 4:160, 5:160, 6:160}`, previous button 1. `nextButton` = 2.
  `createHand` gets seats 1, 2, 4, 5, 6 with button 2: SB 4, BB 5, `toAct` 6. `players` are seats `[1,2,4,5,6]`.
- **W3 (AC#3).** Seat 4 (due to post the big blind after button 1 → 2) has busted. Stacks
  `{1:160, 2:160, 3:160, 4:0, 5:160, 6:160}`. `nextButton(…, 1)` = 2. Seats 1, 2, 3, 5, 6 with button 2: the
  actions are exactly `[{3, small-blind, 2, 2}, {5, big-blind, 4, 4}]`. Total contributions = 6. Every other
  seat's `totalContribution` is 0.
- **W4 (AC#4).** Stacks `{2:200, 4:280, 6:0}`, previous button 2. `nextButton` = 4. `createHand` with seats 2
  and 4, button 4: SB record seat 4 ($2), BB record seat 2 ($4), `toAct` 4. `legalActions` = fold, call 2,
  raise 8. Seat 4 calls 2, so `toAct` is 2 and `legalActions` = check, raise 8.
- **W5 (AC#5).** 6 seats, seat 2 has $1, the others $160, button 1. SB record `{2, small-blind, amount 2, added 1}`.
  Seat 2 has `stack 0`, `allIn true`, `totalContribution 1`. BB is seat 3 with $4, `currentBet` 4, `toAct` 4.
  Seats 4, 5, 6 and 1 fold. The hand is then complete without seat 3 acting (D-3): `toAct null`,
  `endedBy 'showdown'`, board of 5, `returned {seat:3, amount:3}`, `awards[0].amount` 2. Final seat 2 + seat 3
  stacks = 161.
- **W6 (D-1).** 6 seats, seat 3 has $3, button 1. BB record `{3, big-blind, amount 4, added 3}`, seat 3 all-in,
  `currentBet` 4, `toAct` 4. `legalActions` = fold, call 4, raise 8. Seats 4, 5, 6 and 1 fold. Seat 2 then owes
  2 (`toAct` 2) and calls 2. The hand completes: `returned {seat:2, amount:1}`, one pot of $6 with eligible
  `[2,3]`. Final seat 2 + seat 3 = 163.
- **W7 (D-2).** Heads-up seats `{1:1, 2:160}`, button 1. The SB is seat 1 ($1, all-in) and the BB seat 2 ($4).
  `createHand` returns a complete hand: `toAct null`, actions = the 2 blind records only, board 5, burned 3,
  `returned {seat:2, amount:3}`, awards `[{pot:0, amount:2, …}]`. Final stacks sum to 161, and
  `checkDeal(state)` is `[]`.
- **W8 (D-1, D-2).** Heads-up `{1:160, 2:3}`, button 1: `toAct` 1, `legalActions` = fold, call 2, raise 8.
  Seat 1 calls 2, so `returned {seat:1, amount:1}` and the pot is 6. Heads-up `{1:160, 2:1}`, button 1: complete
  at the deal, `returned {seat:1, amount:1}`, pot 2.
- **W9 (both blinds all-in).** `{1:160, 2:1, 3:3}`, button 1: SB 2 posts 1 (all-in), BB 3 posts 3 (all-in),
  `toAct` 1, `legalActions` = fold, call 4, raise 8. Seat 1 folds → complete, `returned {seat:3, amount:2}`,
  pot 2.
- **W10 (D-3, mid-round).** 6 seats, seat 4 has $3, button 1. Seat 4's legal actions are fold, call 3 (no
  raise); it calls 3 (all-in). Seats 5, 6 and 1 fold, then seat 2 folds. The hand completes without seat 3
  acting: `returned {seat:3, amount:1}`, one pot of $8 with eligible `[3,4]`.
- **W11 (cross-hand, `checkDeal`).**
  - `previous [{1,160},{2,158},{3,162}]`, next = `createHand({1:160, 2:158, 3:162}, button 2)`, rebuy 160 →
    `[]`.
  - Same, but seat 2 dealt with 159 → `[{chips, 'seat 2 starts with $159 but should start with $158'}]`.
  - `previous [{1,0},{2,318},{3,162}]`, rebuy 160: next `{1:160, 2:318, 3:162}` → `[]`. Next with only seats 2
    and 3 → `'seat 1 starts with $0 but should start with $160'`.
  - sng stakes, `previous [{1,0},{2,3000},{3,1500}]`, rebuy null: next `{2:3000, 3:1500}` → `[]`. Next with
    seat 1 dealt in at 1500 → `'seat 1 starts with $1500 but should start with $0'`.
  - `previous [{1,160},{2,160}]`, next seats 1, 2, 4 at 160 → `'seat 4 starts with $160 but should start with $0'`.
- **W12 (word 2).** `handReplayCode(42, 1, 'sng')` = `000000000000002a0000000100000001`. `handReplayCode(42, 1)`
  = `000000000000002a0000000000000001`. Hand 10000 sng = `000000000000002a0000000100002710`.

### Error handling and configuration
- Engine: `createHand` throws `RangeError('Stack at seat N must be an integer of at least 1')`. `nextButton`
  throws `RangeError('Need at least 2 seats with chips')`.
- Runner: `playHand` throws `RangeError('Stacks must list one stack per seat')`.
- CLI (exit 2, message + `\n` + USAGE on stderr). Checks run in this order: `--help` rules → `--game`
  (`Error: --game must be cash or sng.`) → existing replay-code checks → size → button range.
  - Replay mode, after the button range: `--stacks`. The value must match `/^[0-9]+(,[0-9]+)*$/`, have exactly
    `size` entries each ≤ 9007199254740991, have at least 2 entries > 0, and sum to ≤ 9007199254740991.
    Otherwise: `Error: --stacks must be one whole number per seat (0 for an empty seat), at least two above 0, totalling at most 9007199254740991.`
    Then the button seat must have chips, or `Error: --button must be a seat with chips.`
  - Run mode: `--button` (existing message), then `Error: --stacks is only valid with --replay-code.`, then the
    hands, seed and size checks as today.
- Defaults: `--game cash`. `--stacks` gives every seat the game's starting stack.

## 6. Behaviour specification

### SPEC-01: The button and blinds move one seat when everyone has chips
- Verifies: AC#1
- Behaviour: Given W1, When the next hand is created from the final stacks with `nextButton(finals, 1)`, Then the
  button is 2, the blind records are exactly `{seat 3, small-blind, 2, 2}` and `{seat 4, big-blind, 4, 4}`, and
  `toAct` is 5.
- Verification: acceptance `tests/engine/button-blinds.acceptance.test.ts::AC#1 the button moves to seat 2 and seats 3 and 4 post the blinds`

### SPEC-02: A seat with no chips is skipped
- Verifies: AC#2
- Behaviour: Given W2, Then `nextButton` returns 2, the hand's seats are `[1,2,4,5,6]`, the small blind is seat 4,
  the big blind is seat 5, and `toAct` is 6.
- Verification: acceptance `tests/engine/button-blinds.acceptance.test.ts::AC#2 a busted seat 3 is skipped for the button and blinds`

### SPEC-03: No missed or dead blinds after a bust
- Verifies: AC#3
- Behaviour: Given W3, Then `actions` holds exactly two records (one `small-blind` by seat 3 adding 2, one
  `big-blind` by seat 5 adding 4), contributions total 6, and no other seat has contributed.
- Verification: acceptance `tests/engine/button-blinds.acceptance.test.ts::AC#3 a bust before the big blind posts no dead or missed blind`

### SPEC-04: Down to two players, the button posts the small blind and acts first
- Verifies: AC#4
- Behaviour: Given W4, Then `nextButton` returns 4, seat 4 posts the $2 small blind, seat 2 posts the $4 big blind,
  `toAct` is 4, and after seat 4 calls 2, `toAct` is 2.
- Verification: acceptance `tests/engine/button-blinds.acceptance.test.ts::AC#4 three players down to two play heads-up from the next hand`

### SPEC-05: A player who can't cover the small blind posts everything and is all-in
- Verifies: AC#5
- Behaviour: Given W5, Then seat 2's record has `added: 1`, seat 2 has `stack 0`, `allIn true` and
  `totalContribution 1`. After seats 4, 5, 6 and 1 fold, the hand is complete with
  `returned {seat:3, amount:3}`, `awards[0].amount` 2, and seat 2 + seat 3 final stacks = 161.
- Verification: acceptance `tests/engine/button-blinds.acceptance.test.ts::AC#5 a $1 stack posts $1 of the $2 small blind and is all-in`

### SPEC-06: A short big blind is all-in and the others still call the full blind
- Verifies: AC#5
- Behaviour: Given W6, Then seat 3's record is `{big-blind, amount 4, added 3}`, seat 3 is all-in, and
  `legalActions` for seat 4 is fold, call 4, raise 8. After the scripted actions, `returned {seat:2, amount:1}`
  and the single pot is 6 with eligible `[2,3]`. W9 (both blinds all-in) gives `toAct` 1 and, after the fold,
  `returned {seat:3, amount:2}` and a pot of 2.
- Verification: acceptance `tests/engine/button-blinds.acceptance.test.ts::a short big blind is all-in and the others call the full blind`

### SPEC-07: A hand with nobody to bet against is dealt out at the deal
- Verifies: AC#5
- Behaviour: Given W7 and the second case of W8, When `createHand` runs, Then the hand is complete with the
  `returned` and awards stated there, no player actions, and `checkDeal(state)` = `[]`. Given the first case of
  W8, Then seat 1 must act (fold, call 2 or raise 8).
- Verification: acceptance `tests/engine/button-blinds.acceptance.test.ts::a hand where nobody can bet is dealt out at once`

### SPEC-08: Lone player rule, floor and nextButton errors
- Verifies: AC#3, AC#5, DoD#1
- Behaviour: Given the cases below, Then each holds:
  - Given W10, Then the hand completes after seat 2's fold with `toAct null`, `returned {seat:3, amount:1}`, and
    a pot of $8 with eligible `[3,4]`.
  - `createHand` with seat 3 at 0 throws `RangeError('Stack at seat 3 must be an integer of at least 1')`, and
    with seat 3 at 1 it succeeds.
  - `nextButton([{1,160},{2,0}], 1)` throws `RangeError('Need at least 2 seats with chips')`.
  - `nextButton([{1,5},{2,0},{3,0},{4,9}], 4)` = 1 (wrap). `nextButton(stacks, 3)` = 4 when seat 3 has 0.
- Verification: unit `tests/engine/all-in-blinds.test.ts::lone player rule, floor and nextButton`

### SPEC-09: Every small-stack deal is valid and plays out cleanly
- Verifies: AC#5, DoD#1
- Behaviour: Given every combination of n ∈ {2, 3}, each seat's stack ∈ {1, 2, 3, 4, 5, 9} and button ∈ seats
  (stakes $2/$4), When the hand is created and then played to the end with `randomMovePolicy(seatGenerator(code, seat))`
  (code = `handReplayCode(1, i+1)` for combination i), Then:
  - `createHand` never throws, and `checkDeal(state)` = `[]`;
  - `toAct === null` iff `result !== null` at the deal;
  - every step's `checkStep` = `[]`;
  - the final stacks sum to the starting total;
  - at least one combination completes at the deal and at least one has a short big blind (`added < amount`).
- Verification: unit `tests/engine/all-in-blinds.test.ts::all small-stack deals play out with clean invariants`

### SPEC-10: Sit-and-go playtest
- Verifies: AC#6, DoD#6
- Behaviour: Given `runPlaytest({hands: 10000, seed: 42, size: 6, game: 'sng'}, onHand)`. The test keeps its
  own seat→chips table. A sit-and-go starts on hand 1 and on any hand after one where a single seat finished
  with chips. Then:
  - every `record.stakes` = `{10,20,20,40}`;
  - each sit-and-go's first hand has `record.seats` = 6 seats at 1500 and button 1;
  - every other hand's `record.seats` = the seats with chips in the test's table, at exactly those stacks (no
    refill, no busted seat dealt in);
  - its button = the first seat clockwise after the previous button with chips, computed by the test without
    `nextButton`. The small/big blind records are at the next one/two such seats, or button/other when 2 remain.
    There is exactly one record of each;
  - `summary.violations` = 0;
  - counts that must be > 0: sit-and-gos completed ≥ 2, hands with < 6 seats dealt in, heads-up hands, and
    hands where a seat with 0 chips lies clockwise between the previous button and the new big blind;
  - `npm run playtest -- --hands 10000 --game sng --seed 42` exits 0, and its stdout contains the lines
    `Options: --hands 10000 --seed 42 --size 6 --game sng`, the sng Table line for 6 players (§5),
    `Hands played: 10000` and `Invariant violations: 0`.
- Verification: acceptance `tests/playtest/games.acceptance.test.ts::AC#6 sit-and-go playtest restarts at 1,500 chips, never refills busted seats and skips them`

### SPEC-11: Cash playtest carries real stacks
- Verifies: AC#7, DoD#6
- Behaviour: Given `runPlaytest({hands: 10000, seed: 42, size: 6})` (cash), Then:
  - hand 1's `record.seats` are 6 seats at 160;
  - every later hand's `record.seats` = the previous hand's final stacks with $0 replaced by $160;
  - `record.stakes` = `{2,4,4,8}`;
  - counts that must be > 0: rebuys (a $0 final), hands where some player ends `allIn`, and hands with
    `result.awards.length > 1` (side pots);
  - `summary.violations` = 0;
  - `main(['--hands','10000','--seed','42'])` returns 0, and its output contains
    `Table: 6 players, cash $4/$8, stacks carry over, a busted seat rebuys for $160` and
    `Invariant violations: 0`.
- Verification: acceptance `tests/playtest/games.acceptance.test.ts::AC#7 cash playtest keeps real stacks, rebuys only busted seats and has all-ins and side pots`

### SPEC-12: Replay-code word 2 tells cash from sng
- Verifies: AC#8
- Behaviour: For seed ∈ {0, 42, 2^32+5, 9007199254740991} and k ∈ {1, 2, 255, 10000}:
  - `handReplayCode(seed,k,'sng')` and `(seed,k,'cash')` are equal outside characters 16–23;
  - characters 16–23 are `00000001` (sng) and `00000000` (cash);
  - characters 24–31 are `k.toString(16).padStart(8,'0')`;
  - `handReplayCode(seed,k)` = the cash code.
  W12 holds exactly. A 3-hand sng run at seed 42 records `handReplayCode(42,k,'sng')` for k = 1..3. The sng CLI
  run prints `First replay code: 000000000000002a0000000100000001` and
  `Last replay code: 000000000000002a0000000100002710`.
- Verification: acceptance `tests/playtest/games.acceptance.test.ts::AC#8 sng and cash replay codes differ only in word 2`

### SPEC-13: Cross-hand chip check
- Verifies: AC#9
- Behaviour: Given the runs below, Then each holds:
  - Given 2,000-hand runs at seed 9, size 4, for cash and for sng: every `dealViolations` is `[]`. For every hand
    that continues a table, each dealt seat's `startingStack` equals its final stack in the previous hand (cash
    $0 → $160). Seats that finished on $0 in sng are not dealt in.
  - Given the seam `engine: {createHand: (c) => createHand({...c, seats: c.seats.map((s) => s.seat === 1 ? {...s, stack: s.stack + 1} : s)}), applyAction}`
    and `runPlaytest({hands: 3, seed: 42, size: 6}, …)`: let f = hand 1's final seat 1 stack (160 if 0).
    - Hand 1 has 0 violations.
    - Hand 2 has `dealViolations` = `[{invariant:'chips', message:`seat 1 starts with $${f+1} but should start with $${f}`}]`,
      `final.result` null, and only the 2 blind records.
    - Hand 3 has 0 violations and `record.seats` all at 160.
    - `summary.violations` = 1, `violationCounts.chips` = 1, `firstViolation` = hand 2.
  - `main` with the same seam and `--hands 3 --seed 42` exits 1. The output contains
    `First violation: hand 2, at the deal`, that `Violation: chips: …` line, and a line starting
    `Replay: npm run playtest -- --replay-code 000000000000002a0000000000000002 --size 6 --button 2 --stacks `.
- Verification: acceptance `tests/playtest/games.acceptance.test.ts::AC#9 each seat starts with its previous final stack and a mismatch is reported at the deal`

### SPEC-14: checkDeal cases
- Verifies: AC#9
- Behaviour: Given the inputs below, Then `checkDeal` returns the stated results:
  - Each W11 case returns exactly the stated result.
  - `checkDeal` on W7's completed state (with no `previous`) = `[]`.
  - On a dealt state whose seat 2 hole card duplicates seat 1's, `checkDeal` returns a single `cards` violation.
  - Given both a cross-hand mismatch and a `cards` problem, it returns `[chips, cards]` in that order.
- Verification: unit `tests/engine/check-deal.test.ts::checkDeal reports cross-hand chip mismatches and deal-time invariants`

### SPEC-15: CLI flags, lines and replay with stacks
- Verifies: AC#6, AC#7, AC#9, DoD#1
- Behaviour: Given the CLI and runner inputs below, Then each holds:
  - `parseArgs` defaults `game` to 'cash'.
  - Each §5 error message is returned for: `--game poker`; `--stacks 1,2` without `--replay-code`;
    and, each with `--replay-code C --size 3`: `--stacks 160,160`, `--stacks 0,0,160`,
    `--stacks 160,x,160`, `--stacks 9007199254740991,1,0`, and `--button 2 --stacks 160,0,160`.
  - `USAGE` equals §5.
  - The replay `main(['--replay-code', C, '--size','3','--button','2','--game','sng','--stacks','0,2900,100'])`
    exits 0. It prints `Options: --replay-code C --size 3 --button 2 --game sng --stacks 0,2900,100`, the sng
    Table line, and `Seat 2 ($2900)` and `Seat 3 ($100)` lines. Stakes are 20/40, and seat 3 posts the big blind
    `$20`.
  - `formatHand` of W5 prints `seat 2 posts small blind $1`.
  - The violation block for a deal violation prints `First violation: hand N, at the deal`.
  - The Replay line adds ` --game sng` / ` --stacks …` only as A-7 says.
  - `runner.test.ts` covers the `playHand` stacks-length error, `handReplayCode` with `'sng'`, a restart after
    a violating hand (button 1, all at the starting stack), and the per-hand default policy (random below 6
    dealt in).
- Verification: unit `tests/playtest/cli.test.ts::game and stacks options` and `tests/playtest/runner.test.ts::carried stacks and restarts`

### SPEC-16: Locked tests change only as approved and still pass
- Verifies: DoD#1, DoD#2
- Behaviour: Given exactly edits E1–E6 below (no assertion removed or loosened; E5 becomes stricter), When
  `npm test` runs, Then those files pass and every other locked test file is byte-unchanged. The edits are
  approved by Q-4 (auto-accepted; unlocks recorded under TASK-1.31, TASK-1.21, TASK-1.6, TASK-1.11):
  - E1 `tests/engine/chip-safety.acceptance.test.ts:131` (TASK-1.31): `'Stack at seat 3 must be an integer of at least 5'` → `… at least 1`.
  - E2 `tests/engine/input-hardening.acceptance.test.ts:89` (TASK-1.21): the same text change.
  - E3 `tests/playtest/playtest.acceptance.test.ts:72` (TASK-1.6): the Table line →
    `'Table: 6 players, cash $4/$8, stacks carry over, a busted seat rebuys for $160'`.
  - E4 `tests/playtest/heads-up.acceptance.test.ts:27` (TASK-1.11): `TABLE_LINE` →
    `'Table: 2 players, cash $4/$8, stacks carry over, a busted seat rebuys for $160'`.
  - E5 `tests/playtest/runner.acceptance.test.ts:28-40` (TASK-1.6, AC#1): the title becomes "hands are real
    engine hands at $4/$8 starting at $160 and carrying stacks". `record.seats` must be all 160 for hand 1 and,
    for each later hand, equal the previous hand's final stacks with $0 → $160. Every other assertion is kept.
  - E6 `tests/playtest/runner.acceptance.test.ts:91-95` (TASK-1.6, AC#5): add
    `'--stacks', fourth.record.seats.map((s) => s.stack).join(',')` to the replay argv. Every assertion is kept.
 
- Verification: command `npm test && git diff --stat main -- tests e2e`

### SPEC-17: Checks pass and both 10,000-hand playtests are clean and deterministic
- Verifies: DoD#2, DoD#4, DoD#5, DoD#6, DoD#10
- Behaviour: Given the change, When lint, typecheck and tests run, Then each exits 0, coverage thresholds hold
  (engine and playtest ≥ 90%), and the boundary tests pass (no UI import in `src/engine`/`src/playtest`).
  `npm run playtest -- --hands 10000 --seed 42` and `… --game sng` each exit 0 with `Invariant violations: 0`,
  and two runs of each are byte-identical. The cash baseline changes on purpose (AC#7). The builder records the
  new cash and sng outputs, every report line, in the build notes and the story doc. Those outputs become the new
  baseline. CI on `doit/TASK-1.16` is green.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run playtest -- --hands 10000 --seed 42 && npm run playtest -- --hands 10000 --seed 42 --game sng`

### SPEC-18: Story documentation and N/A DoD items
- Verifies: DoD#3, DoD#7, DoD#8, DoD#9, DoD#11, DoD#12
- Behaviour: Given the task is done, Then a Backlog doc describes the button/blind rules (W1–W4), all-in blinds
  and D-1..D-3 (W5–W10), the cash/sng playtest rules (D-8, A-1..A-8), the new baselines, the Q-1..Q-4 answers,
  E1–E6, and the TASK-3.21 note (session top-up untouched). The N/A items are recorded:
  - DoD#3: no golden-spot suite yet.
  - DoD#7: no screen changes.
  - DoD#8: headless code, no network.
  - DoD#9: no strategy content.
  - DoD#12: no service worker yet.
- Verification: manual `backlog doc list --plain` shows the TASK-1.16 doc

## 7. Edge cases
- The button seat busts: `nextButton` searches from the old button seat even though it has no chips (SPEC-08).
- Wrap-around past seat `size`: SPEC-08.
- Down to two players: SPEC-04, SPEC-10 (heads-up hands > 0).
- Down to one player: a new sit-and-go (SPEC-10). In cash a $0 seat always rebuys (SPEC-11).
- Short small blind, short big blind, both blinds all-in, and stack exactly equal to the blind: SPEC-05/06/09
  (the grid includes 2 and 4).
- Nobody left to bet against at the deal or mid-round: SPEC-07, SPEC-08.
- A hand that is abandoned or has a violation: the table restarts (A-3, SPEC-13, SPEC-15).
- Invalid CLI input (`--game`, `--stacks` format/count/zero/total, button on an empty seat): SPEC-15.
- Odd-chip splits leave stacks that aren't multiples of the blind. The grid and the 10,000-hand runs cover them.
- Concurrency, permissions and persistence: N/A (pure functions and a single-process CLI).

## 8. Security considerations
- Trust boundary: CLI arguments. `--game` is an exact-match enum. `--stacks` is a strict digits/commas regex with
  per-value and total bounds, so every stack stays a safe integer and `createHand`'s total bound is never hit.
  The bad value is never echoed (existing pattern).
- No new dependency, network request, secret or randomness source. Bot randomness stays seeded from the replay
  code (REQ-028.1). Word 2 makes sng codes distinct from cash codes.

## 9. Non-functional
- `checkDeal` adds one `checkState` per hand, against about 9 per hand today (88,831 actions / 10,000 hands).
  The cash 10,000-hand run takes 0.7 s today and should stay under 2 s. The new acceptance tests use the
  existing 120 s timeouts.
- REQ-062.4 determinism: SPEC-17's byte-identical re-runs, plus the locked TASK-1.6 AC#3.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 10000 --seed 42 --game sng`
- New tests (path → SPEC ids):
  - `tests/engine/button-blinds.acceptance.test.ts` → SPEC-01..07
  - `tests/engine/all-in-blinds.test.ts` → SPEC-08, SPEC-09
  - `tests/engine/check-deal.test.ts` → SPEC-14
  - `tests/playtest/games.acceptance.test.ts` → SPEC-10..13
  - Updates: `tests/playtest/cli.test.ts`, `tests/playtest/runner.test.ts`, `tests/engine/hand.test.ts` → SPEC-15, SPEC-08
  - Locked edits E1–E6 → SPEC-16

## 11. Open questions
None. Q-1..Q-4 were answered with the recommended options on 2026-11-21 (`doit/TASK-1.16/qa.md`, auto-accepted).

### Builder instructions: stop and report (never loosen a test)
- If any locked test scripts a big-blind option against only all-in or folded opponents and fails because of D-3,
  stop and report it.
- If the seed-42 runs give zero side pots or zero rebuys/all-ins (SPEC-11), or zero busted-seat skips,
  heads-up hands or fewer than 2 completed sit-and-gos (SPEC-10), stop and report. Don't change the seed or
  weaken the assertion.
- If the locked `tests/playtest/summary.acceptance.test.ts` "last pot < largest" assertion (TASK-1.26) shifts
  because stacks now carry over, stop and report.

## 12. Clarifications log
See `doit/TASK-1.16/qa.md`.
