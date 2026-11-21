# Spec: TASK-1.9 — Let a short-stacked player call all-in

Status: READY (approved 2026-11-20)
Task: TASK-1.9 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: REQ-014.4, REQ-014.6, REQ-018.1, REQ-018.4 · Dream: limit-holdem-trainer

## 1. Summary
The engine gets all-in calls. A player who cannot match a bet calls for whatever they have left. They are marked
all-in, are never asked to act again, and stay in to showdown. A betting round closes once every player who is
neither folded nor all-in has acted and matched the bet. When at most one such player is left, the rest of the
board is dealt with no more betting. Any part of the top bet that nobody called goes back to the bettor and is not
part of the award. This also covers blinds and fold-outs, so "wins $X" now counts only chips won from others plus
the winner's matched chips. `createHand` lowers its stack floor so a short stack can actually happen. The invariant
checker learns about all-in calls and returned chips, and still catches wrong amounts.

## 2. Scope
- In scope:
  - `src/engine/hand.ts`:
    - Call amount = `min(owe, stack)`.
    - Set the `allIn` flag.
    - Skip all-in seats for `toAct` and for closing a round.
    - Run out the board when at most one seat can still bet.
    - Return the uncalled bet and record it as `HandResult.returned`.
    - New stack floor `bigBlind + 1`.
  - `src/engine/invariants.ts`:
    - Chips rules C3/C4 account for `returned`.
    - New step check: the returned amount must equal the uncalled amount.
  - `src/playtest/runner.ts`: `Largest pot` counts returned chips, so a clean playtest report stays byte-identical
    (D-5).
  - New tests for AC#1–AC#7. Amount and message updates in earlier stories' tests (D-6, E1–E8, plus unit edits U1–U4).
- Not doing:
  - Side pots and per-pot awards (TASK-1.10). Until then, a pot with a short all-in and two or more covering
    players stays one pot, paid to the best hand among all unfolded seats (A-1).
  - Short all-in bets and raises, and the half-bet reopening rule (TASK-1.14). A seat that can cover the call but
    not a full raise is offered fold/call only. A seat with less than one unit and no bet facing is offered check
    only.
  - All-in blinds. The floor keeps every blind fully posted with at least $1 behind (TASK-1.16).
  - The 4-bet cap (TASK-1.12), showdown order and mucking (TASK-1.15), action-bar "Call all-in" labels (TASK-3.7),
    side-pot display (TASK-3.8), and the action log (TASK-4.1).
  - The TEMPORARY $160 top-up in `src/table/session.ts` (removed by TASK-3.21) and the playtest's $160 reset
    (TASK-1.16). `src/table/session.ts` is not touched.
  - Any change to the text format of `formatHand` / replay output, `src/table/hand-result.ts`, or the `cards`,
    `bet-cap` and `pot-eligibility` checks.
  - Removing or loosening any assertion in an earlier story's test. E1–E8 and U1–U4 only change amounts or messages
    to the new rule, or add the `returned` key that `toEqual` requires.
- Scope budget: files=18, lines=750   (hand.ts ~90, invariants.ts ~45, runner.ts ~3; new
  all-in.acceptance ~260, all-in-invariants.acceptance ~150, hand-result-uncalled.acceptance ~70; 8 locked edits
  ~20; 4 unit/support edits ~10; hand.test.ts new unit tests ~60)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Until TASK-1.10, a short all-in facing two or more covering players stays in the single main pot and can win all of it. In practice this happens only in engine tests, or in the app if someone raises past the 4-bet cap (no cap until TASK-1.12). Playtest and session stacks never fall below $96, and $96 covers a capped hand | yes | Side pots are TASK-1.10, which depends on this task. Chips are still conserved and every invariant still holds | Refuse multi-way all-ins (impossible: the call is legal); build side pots now (TASK-1.10 scope) |
| A-2 | `allIn` becomes true whenever a call, bet or raise leaves the actor's stack at $0. That includes an exact-stack call, bet or raise | yes | REQ-018.1: a player with no chips cannot act. TASK-1.14 AC#7 already calls an exact-stack call "call $4 (all-in)" | Only short calls set it |
| A-3 | An all-in call is recorded as an ordinary `call` whose `amount` and `added` equal the chips put in (e.g. $3). `ActionRecord` and `describeAction` are unchanged ("seat 3 calls $3") | yes | `hand.ts:48`: "call = chips added". Keeps the legal-action history check (`invariants.ts:85-100`) unchanged | New `all-in` action type (TASK-1.14 owns all-in marking of bets/raises) |
| A-4 | `formatHand` (`cli.ts:186-188`) and the replay output keep their format. Fold-out `Result:` amounts become the award without the returned chips (e.g. "seat 5 wins $4" for a walk). No "returned" line is added | yes | Smallest change. The amount now means what "wins" means in the UI (AC#7) | Append ", $2 returned to seat 5" |
| A-5 | In the engine, the uncalled amount is the top street contribution minus the second-highest one (all seats, folded included), at the gather that ends the hand. The checker recomputes it separately from total contributions | yes | Street level is how a dealer sees it. Total level gives the checker a second, independent formula | Use the same formula in both (circular) |

## 3. Current system
- TypeScript 6 strict, Vitest + v8 coverage, with a 90% line threshold on `src/{engine,…,playtest,table}`
  (`vite.config.ts:16-18`). Playwright on Chromium and WebKit (`playwright.config.ts:13-15`). Scripts are in
  `package.json:10-21`.
- Engine (`src/engine/hand.ts`):
  - `PlayerState.allIn` exists and is always false ("Always false until TASK-1.9", `:34-35`). `createHand` sets it
    (`:214`), and `player-view.ts:87` already exposes it.
  - `validate` rejects stacks below `minimumStack(stakes)` = 8 small bets + 8 big bets ($96) (`:120-123`, `:163-168`).
    $96 is exactly the most one player can put into a capped hand, so no all-in can occur today.
  - `legalActions` offers `call` only when `owe <= stack` (`:265-268`). A short seat can only fold.
  - `gather` moves all street contributions into `pots[0]` (`:288-300`).
  - `foldOut` pays the whole gathered pot, including the winner's own uncalled bet, to the last seat (`:335-351`).
  - `endRound` deals the next street, or holds the showdown after the river (`:353-395`). Burn and board indices
    follow D-5 (`:381-392`).
  - `applyAction` closes a round when every unfolded seat has acted and matched `currentBet`. The next actor is
    the next unfolded seat clockwise (`:446-457`).
  - `HandResult` (`:66-75`) has `endedBy`, `showdown` and `awards`.
- Checker (`src/engine/invariants.ts`):
  - `chipsMessage` (`:104-154`):
    - C1: valid counts.
    - C2: table total equals starting total.
    - C3: pots equal completed streets, or awards equal the sum of `totalContribution`.
    - C4: per seat, `stack + total − won = startingStack`.
  - `checkStep` (`:326-336`) runs the legal-action check, then `checkState`. It returns at most one violation per
    id, in `INVARIANTS` order.
- Consumers of awards:
  - `handResultView` sums each seat's award shares into "X wins $N" (`src/table/hand-result.ts:75-92`).
  - `summarize` computes `largestPot` as the sum of awards (`src/playtest/runner.ts:214`).
  - `formatHand` prints the `Result:` line (`src/playtest/cli.ts:186-188`).
- The session tops seats below `minimumStack` back up to $160 (TEMPORARY, `src/table/session.ts:168-173`). The
  playtest resets every seat to $160 (`runner.ts:27`). So neither produces a short stack today.
- Baseline `npm run playtest -- --hands 10000 --seed 42` at base `9ccffbc` (run 2026-11-20): `Ended by fold: 5470`,
  `Ended at showdown: 4530`, `Player actions: 88831`, `Streets capped at 4 bets: 244`, `Largest pot: $70`,
  `Invariant violations: 0`.
- Existing code to reuse:
  - `src/engine/hand.ts` → `clockwiseAfter` (`:110`) for the actor order and the runout, `splitPot` (`:303`) and
    `payOut` (`:318`) for awards, and `gather` (extend it rather than add a second collector).
  - `src/engine/hand.ts:381-392` → the D-5 burn/board index rule. Factor it into a helper that deals one street, and
    call that helper in a loop for the runout.
  - `tests/support/table-scenarios.ts` → `AVA_UNCONTESTED` (`:162`) and `BB_WALK` (`:235`) for AC#7.
  - `tests/engine/invariants.test.ts:21-41` → the `act` / `play` / `withPlayers` helper shapes. Copy them into the new
    tests (each test file is self-contained).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | `createHand` accepts any safe-integer stack ≥ `bigBlind + 1` ($5 at $4/$8). The message template is unchanged: `Stack at seat N must be an integer of at least 5`. `minimumStack` stays exported and unchanged. It is still used by the session top-up and by the A-4 stakes bound. Only its doc comment changes | (a) floor $1, which brings in all-in blinds now (TASK-1.16 scope); (b) keep $96, which makes every AC reachable only through hand-built states | Needed for AC#1–#4 to happen in real hands. Blinds are always fully posted, so all-in blinds stay in TASK-1.16 | yes | user (Q-1, `doit/TASK-1.9/qa.md`, auto-accepted) |
| D-2 | Uncalled chips are returned at every hand end, blinds included. In a walk the big blind gets back the unmatched $2 of the blind, and the result reads "You win $4" (was $6) | Treat blinds as dead money (walk stays "$6") | REQ-018.4 says "any bet". One rule for every case keeps the checker formula simple (C5) | yes | user (Q-2, `doit/TASK-1.9/qa.md`, auto-accepted) |
| D-3 | The return is recorded as the optional `HandResult.returned?: { readonly seat: SeatNumber; readonly amount: number }`. It is present only when amount > 0. `totalContribution` keeps meaning "put in this hand" and still includes the returned chips. Awards exclude them | (a) Lower the bettor's contributions instead. This breaks 2 more locked assertions (`invariant-messages.acceptance.test.ts:90,101`) and the meaning of `totalContribution`; (b) a new `ActionRecord` type `return`. This breaks the history checks (`invariants.ts:293-302`) and the review/CLI formatting | Optional, so existing `HandResult` literals in tests still typecheck. Public engine data, later persisted by TASK-3.9 | yes | user (Q-3, `doit/TASK-1.9/qa.md`, auto-accepted) |
| D-4 | The "returned = uncalled" rule (C5) runs in `checkStep`, on the step that completes the hand. It is reported under `chips` only when `checkState` found no chips violation. `checkState` uses `returned` only in C3/C4 | Put C5 in `checkState`. Three unit fixtures in `invariants.test.ts:176-200,293-301` that rebuild `result` without `returned` would then gain an extra violation | AC#6 says "after that action", which is a step check. The playtest runs `checkStep` after every action, so coverage is the same | no | n/a |
| D-5 | `largestPot` = sum of awards + `returned.amount` (all chips put in the middle) | Awards only | Keeps the clean 10,000-hand report byte-identical to the baseline. Also keeps the locked `tests/playtest/summary.acceptance.test.ts:33-53`, which compares against the sum of `totalContribution`, true for every seed | no | n/a |
| D-6 | Cross-story edits to locked tests (amounts or messages only, nothing removed or loosened): E1–E8 in §5 | None workable. AC#5 and AC#7 require these amounts to change, and D-1 changes the floor message | Required by AC#5, AC#7 and D-1 | yes | user (Q-4, `doit/TASK-1.9/qa.md`, auto-accepted) |
| D-7 | The runout happens inside the one `applyAction` call that closes the round. It deals every remaining street by D-5 and goes straight to the showdown. No intermediate states and no action records exist for the skipped streets | Stop on each street with `toAct = null` | No caller can act there. The `cards` invariant still checks every dealt card's deck position | no | n/a |

## 5. Design

### Files to create / modify
- `src/engine/hand.ts` — all-in calls, `allIn`, round closing, actor order, runout, uncalled return,
  `HandResult.returned`, stack floor, doc comments (`allIn`, `minimumStack`, `HandResult`)
- `src/engine/invariants.ts` — C3/C4 with `returned`, C5 in `checkStep`
- `src/playtest/runner.ts` — `largestPot` includes `returned` (D-5)
- `tests/engine/all-in.acceptance.test.ts` — new: SPEC-01..SPEC-07
- `tests/engine/all-in-invariants.acceptance.test.ts` — new: SPEC-08, SPEC-09
- `tests/table/hand-result-uncalled.acceptance.test.ts` — new: SPEC-10
- `tests/engine/hand.test.ts` — U1: the floor case `95` becomes `4` with message `…at least 5`; new unit tests for SPEC-11
- `tests/engine/hand.acceptance.test.ts` — E1 (locked)
- `tests/engine/fold-out.acceptance.test.ts` — E2 (locked)
- `tests/table/review.acceptance.test.ts` — E3 (locked)
- `tests/ui/hand-result.acceptance.test.tsx` — E4 (locked)
- `e2e/next-hand.spec.ts` — E5 (locked)
- `e2e/review.spec.ts` — E6 (locked)
- `tests/engine/input-hardening.acceptance.test.ts` — E7 (locked)
- `tests/engine/chip-safety.acceptance.test.ts` — E8 (locked)
- `tests/table/next-hand.test.ts` — U2
- `tests/playtest/cli.test.ts` — U3
- `tests/support/table-scenarios.ts` — U4

### Components, interfaces and data
```ts
// hand.ts — only additions/changes shown
export interface PlayerState { /* … */ /** True once a call, bet or raise left stack at 0; never acts again. */ readonly allIn: boolean; }
export interface HandResult {
  readonly endedBy: 'fold' | 'showdown';
  readonly showdown: readonly { seat; holeCards; rank }[];
  /** One entry per pot (exactly one until TASK-1.10). Amounts exclude `returned`. */
  readonly awards: readonly PotAward[];
  /** The uncalled part of the top bet, given back to its bettor (REQ-018.4). Present only when amount > 0. */
  readonly returned?: { readonly seat: SeatNumber; readonly amount: number };
}
/** The most one player can put into a capped hand ($96 at $4/$8). Used by the session's TEMPORARY top-up
 *  (TASK-3.21) and the A-4 stakes bound. createHand's own floor is bigBlind + 1 (D-1). */
export function minimumStack(stakes: Stakes): number; // unchanged body
```
No other exported signature changes. `checkState` and `checkStep` keep their signatures.

### Rules and algorithms
Terms: *active* = not folded. *Open* = active and not all-in. *Owe* = `currentBet − streetContribution`.

1. **Floor (D-1).** `validate` uses `min = stakes.bigBlind + 1`. Everything else in `validate` is unchanged.
2. **Legal actions.** If owe > 0, the call is `{type: 'call', amount: Math.min(owe, stack)}`. It is offered
   whenever owe > 0, because the actor is open and so has stack ≥ 1. Raise stays `canRaise` (stack ≥ full raise
   cost). Bet stays `unit <= stack`. Order: fold, check, call, bet, raise.
3. **Apply.** `added` is computed as today. The actor's new `allIn` = `type !== 'fold' && stack − added === 0`.
   - Then:
     - If exactly one active seat remains → `foldOut`.
     - Else if every open seat has `hasActed && streetContribution === currentBet` → `endRound`. This is true
       when no seats are open.
     - Else `toAct` = first open seat clockwise after the actor.
   - Example: flop, seat 2 bets $4 and seat 3 (stack $3) calls $3 → seat 3 has `allIn: true`, `stack: 0`, and
     `toAct` is the next open seat.
4. **Gather with return (A-5).**
   - Let `top` be the highest `streetContribution` and `second` the next-highest, over all seats including folded
     ones.
   - If exactly one seat has `top` and `top > second`, then `back = top − second` for that seat, otherwise
     `back = 0`.
   - The pot gains `Σ streetContribution − back`, the bettor's `stack` gains `back`, and street fields reset as
     today.
   - `back` can be > 0 only at the gather that ends the hand. A round that continues has at least two open seats
     at `currentBet` = `top`.
   - Examples:
     - Walk with blinds 2/4: back = 2 to the BB, award 4.
     - Turn: $8 bet, all-in call of $5: back = 3.
     - Flop: bet 4, raise to 8, all fold: back = 4 to the raiser.
5. **Fold-out.** As today, but the award is the gathered amount net of `back`. Set `result.returned` when
   back > 0.
6. **Round end and runout (D-7).**
   - After gathering, if `street === 'river'` or there are ≤ 1 open seats, deal every remaining street up to the
     river with the D-5 helper, then hold the showdown.
   - The showdown is as today: active seats clockwise from the left of the button, best rank wins, `splitPot`.
     The award amount is the pot net of `back`.
   - Set `returned` when back > 0, plus `street: 'showdown'`, `toAct: null`, `currentBet: 0`, `betCount: 0`.
   - Otherwise, advance one street as today, with `toAct` = first open seat clockwise after the button.
7. **Checker (invariants.ts).** `back(state)` = `state.result?.returned`.
   - C3 (complete): `awarded !== total − back.amount` → `awards pay $${awarded} but players put in $${total − backAmount}`.
   - C4: `stack + totalContribution − won − backFor(seat) !== startingStack` → the message is unchanged, with
     `should have $${startingStack − totalContribution + won + backFor(seat)}`.
   - C5 (`checkStep` only, when `result.ok`, `result.state.result !== null`, and `checkState` reported no `chips`
     violation):
     - Over all seats' `totalContribution`, let `top` and `second` be the two largest values, counting
       duplicates.
     - The due seat is the unique top seat when `top > second`, with `due = top − second`. Otherwise no seat is
       due.
     - If `returned` is present and (its seat is not the due seat, or its amount is not `due`) → violation. The
       message names `returned.seat` and `returned.amount`, and gives the due amount for that seat (0 if it is not
       the due seat).
     - If `returned` is absent and a seat is due → violation for the due seat with $0 back.
     - Message: `seat ${seat} got $${got} back but $${dueForSeat} was uncalled`. It is inserted as the `chips`
       violation, first in `INVARIANTS` order.
8. **Playtest (D-5).** `pot = Σ award.amount + (final.result?.returned?.amount ?? 0)`.

### Locked test edits (D-6) — exactly these. Nothing else in these files changes.
- **E1** `tests/engine/hand.acceptance.test.ts:327-331`. The preflop fold-out result becomes `{ endedBy: 'fold',
  showdown: [], awards: [{ pot: 0, amount: 4, winners: [{ seat: 3, amount: 4 }] }], returned: { seat: 3, amount: 2 } }`.
  `:351-353`: the award becomes `amount: 24` / winner `amount: 24`. Stack assertions are unchanged.
- **E2** `tests/engine/fold-out.acceptance.test.ts:56-58`: `36` → `32` (both places).
- **E3** `tests/table/review.acceptance.test.ts:73`: `{ seat: 5, amount: 6 }` → `{ seat: 5, amount: 4 }`.
- **E4** `tests/ui/hand-result.acceptance.test.tsx:95`: `'Ava wins $16'` → `'Ava wins $12'` (AC#7 recheck).
- **E5** `e2e/next-hand.spec.ts:241,256`: `'Ava wins $12'` → `'Ava wins $8'`. `:266`: `'Ben wins $12'` → `'Ben wins $8'`.
  Each is a preflop raise to $8 that the big blind folds to. Stack assertions are unchanged.
- **E6** `e2e/review.spec.ts:316`: `'You win $6'` → `'You win $4'` (big-blind walk).
- **E7** `tests/engine/input-hardening.acceptance.test.ts:89`: `'…at least 96'` → `'…at least 5'`.
- **E8** `tests/engine/chip-safety.acceptance.test.ts:131`: `'…at least 96'` → `'…at least 5'`.

Owning tasks of the locked files (from `doit/*/state.json` `locked_tests`, for unlock records):
E1 `tests/engine/hand.acceptance.test.ts` → TASK-1.4; E2 `tests/engine/fold-out.acceptance.test.ts` → TASK-1.44;
E3 `tests/table/review.acceptance.test.ts` → TASK-9.1; E4 `tests/ui/hand-result.acceptance.test.tsx` → TASK-3.4;
E5 `e2e/next-hand.spec.ts` → TASK-3.4; E6 `e2e/review.spec.ts` → TASK-9.1;
E7 `tests/engine/input-hardening.acceptance.test.ts` → TASK-1.21; E8 `tests/engine/chip-safety.acceptance.test.ts` → TASK-1.31.

If any other assertion in a locked file fails, the builder stops and escalates. Such a failure is not edited.
For E5, the builder confirms the computed `$8` values by running the spec, and escalates if they differ.

### Unit/support edits (not locked)
- **U1** `tests/engine/hand.test.ts:163-166`: `{ seat: 3, stack: 95 }` → `{ seat: 3, stack: 4 }`, message
  `'Stack at seat 3 must be an integer of at least 5'`.
- **U2** `tests/table/next-hand.test.ts:89`: stacks `[95, 160, 160]` → `[4, 160, 160]`. The `minimumStack`
  assertions at `:87-88` stay.
- **U3** `tests/playtest/cli.test.ts:187`: `'Result: seat 5 wins $6'` → `'Result: seat 5 wins $4'`.
- **U4** `tests/support/table-scenarios.ts:161`: the comment "she wins $16 uncontested" → "she wins $12 uncontested
  ($4 bet returned)".

### Error handling and configuration
- `createHand` keeps the `RangeError` and its template (D-1). `applyAction` error codes and messages are unchanged.
  `call` with any amount other than `min(owe, stack)` is `illegal-action`.
- No configuration.

## 6. Behaviour specification

Shared setup for the new engine tests:
- Stakes `{2, 4, 4, 8}`, button 1, deck `0..51` (ascending).
- With 3 seats the deal order is 2, 3, 1. Seat 2 holds `2c 2s`, seat 3 holds `2d 3c`, seat 1 holds `2h 3d`.
- Board `3s 4c 4d 4s 5d`, burns `3h 4h 5c`.

### SPEC-01: A short seat facing a bet is offered a call for its whole stack
- Verifies: AC#1, DoD#1
- Behaviour: Given / When / Then as listed below.
  - Given scenario **S-A**: stacks `{1:160, 2:160, 3:7}`. Preflop: 1 call 4, 2 call 2, 3 check. Flop: seat 2
    bets 4.
  - When seat 3 is to act, Then `legalActions` is exactly `[{seat 3, fold}, {seat 3, call, 3}]`.
  - `{call, 4}` is rejected with `illegal-action`.
- Verification: acceptance `tests/engine/all-in.acceptance.test.ts::a seat with $3 facing a $4 bet may only fold or call $3`

### SPEC-02: The all-in caller puts in $3, is all-in and never acts again
- Verifies: AC#1, DoD#1
- Behaviour: Given / When / Then as listed below.
  - Given S-A, When seat 3 calls $3, Then:
    - seat 3 has `stack 0`, `allIn true`, `streetContribution 3`, `totalContribution 7`;
    - the last record is `{street 'flop', seat 3, type 'call', amount 3, added 3}`;
    - `toAct` is 1.
  - After 1 calls 4, then turn and river are checked by 2 then 1 (2 is first on the turn):
    - `toAct` is never 3 in any state;
    - seat 3 has no record after its call;
    - the hand ends at showdown.
- Verification: acceptance `tests/engine/all-in.acceptance.test.ts::the all-in caller puts in $3, is marked all-in and is never asked to act again`

### SPEC-03: An all-in player who has not folded is in the showdown
- Verifies: AC#2, DoD#1
- Behaviour: Given / When / Then as listed below.
  - Given S-A played to the end as in SPEC-02, When the result is read, Then `result.endedBy` is `'showdown'`.
  - `result.showdown` seats are `[2, 3, 1]`.
  - Seat 3's entry has its hole cards and `rank === evaluate([...holeCards, ...board])`.
  - Awards are not asserted (side pots are TASK-1.10, A-1).
- Verification: acceptance `tests/engine/all-in.acceptance.test.ts::an all-in player who has not folded is included in the showdown`

### SPEC-04: With one seat left able to bet, the board runs out without betting
- Verifies: AC#3, DoD#1
- Behaviour: Given / When / Then as listed below.
  - Given **S-B**: stacks `{1:160, 2:160, 3:9}`.
    - Preflop: 1 fold, 2 call 2, 3 check.
    - Flop: 2 check, 3 check.
    - Turn: 2 bets 8.
  - When seat 3 calls $5 (all-in), Then that one action returns a state with:
    - `street 'showdown'`, board `3s 4c 4d 4s 5d`, burned `3h 4h 5c`;
    - `toAct null`, `currentBet 0`, `betCount 0`, `legalActions` `[]`;
    - no record on the river;
    - `checkState` `[]`.
- Verification: acceptance `tests/engine/all-in.acceptance.test.ts::when all but one remaining player are all-in the rest of the board is dealt with no betting`

### SPEC-05: Runout from preflop, and with nobody left able to bet
- Verifies: AC#3, AC#4, DoD#1
- Behaviour: Given / When / Then as listed below.
  - **S-C**: stacks `{1:160, 2:12, 3:9}`.
    - As S-B up to the turn. Seat 2 bets 8 (its whole stack, so `allIn true`), and seat 3 calls 5.
    - Then the hand is at showdown with board length 5.
    - `returned` is `{seat 2, amount 3}`. Awards are `[{pot 0, amount 18, winners [{seat 3, amount 18}]}]`.
    - Final stacks `{1:160, 2:3, 3:18}`.
  - **S-D**: stacks `{1:160, 2:160, 3:5}`.
    - Preflop: 1 raises to 8, 2 folds, 3 calls $1 (all-in).
    - Then the flop, turn and river are dealt in that one action (board `3s 4c 4d 4s 5d`, burned `3h 4h 5c`).
    - `returned` is `{seat 1, amount 3}`. Awards are `[{pot 0, amount 12, winners [{seat 3, amount 6}, {seat 1, amount 6}]}]`
      (both full house, fours over threes).
    - Final stacks `{1:161, 2:158, 3:6}`.
- Verification: acceptance `tests/engine/all-in.acceptance.test.ts::the board also runs out from preflop and when no player can still bet`

### SPEC-06: The uncalled part of a bet called all-in goes back before the showdown
- Verifies: AC#4, DoD#1
- Behaviour: Given / When / Then as listed below.
  - Given S-B, When seat 3 calls $5 all-in against the $8 bet and the hand reaches showdown, Then
    `result.returned` is `{seat 2, amount 3}`.
  - `result.awards` is `[{pot 0, amount 18, winners [{seat 3, amount 18}]}]`. Seat 3 wins with fours full of
    threes over seat 2's fours full of twos.
  - Final stacks are `{1:160, 2:151, 3:18}`. Their total equals the starting $329.
  - `totalContribution` is 12 for seat 2 and 9 for seat 3.
- Verification: acceptance `tests/engine/all-in.acceptance.test.ts::the uncalled $3 of an $8 bet called all-in for $5 is returned to the bettor`

### SPEC-07: A bet everyone folds to is returned, not won
- Verifies: AC#5, DoD#1
- Behaviour: Given / When / Then as listed below.
  - Given 6 seats at $160, button 1.
  - (a) When 4, 5, 6, 1 and 2 fold preflop:
    - `returned` is `{seat 3, amount 2}`;
    - awards are `[{pot 0, amount 4, winners [{seat 3, amount 4}]}]`;
    - seat 3's stack is 162.
  - (b) When 4, 5, 6, 1 call 4, 2 calls 2, 3 checks, then on the flop 2 bets 4 and 3, 4, 5, 6, 1 fold:
    - `returned` is `{seat 2, amount 4}`;
    - awards are `[{pot 0, amount 24, winners [{seat 2, amount 24}]}]`;
    - seat 2's stack is 180.
  - (c) When, after the same preflop, 2 bets 4, 3 raises to 8, and 4, 5, 6, 1, 2 fold:
    - `returned` is `{seat 3, amount 4}`;
    - the award is 32.
  - In every case `checkState` is `[]`.
- Verification: acceptance `tests/engine/all-in.acceptance.test.ts::a bet that every other player folds to is returned and not counted as won`

### SPEC-08: The checker accepts an all-in call and catches a wrong call amount
- Verifies: AC#6, DoD#1
- Behaviour: Given S-A just before seat 3's call (`before`), When `checkStep` runs on:
  - (a) `{before, action: call 3, result: applyAction(before, call 3)}` → `[]`.
  - (b) `{before, action: call 4, result: applyAction(before, call 4)}` → `[{legal-action, 'engine rejected seat 3 calls $4 (illegal-action)'}]`.
  - (c) action `call 4` with a forged `ok` result:
    - the real (a) state, with seat 3 patched to `stack −1`, `streetContribution 4`, `totalContribution 8`;
    - the last record's `amount` and `added` set to 4.
    - Expected: `[{chips, 'seat 3 has an invalid stack or contribution'}, {legal-action, 'seat 3 calls $4 is not in the legal set'}]`.
- Verification: acceptance `tests/engine/all-in-invariants.acceptance.test.ts::legal-action and chips accept an all-in call and catch a wrong amount`

### SPEC-09: The checker accepts a returned uncalled bet and catches a wrong return
- Verifies: AC#6, DoD#1
- Behaviour: Given S-B just before seat 3's call (`before`) and its real completing result `done`, When
  `checkStep` runs with action `call 5` and:
  - (a) `done` → `[]`. The final fold steps of SPEC-07(a) (walk) and SPEC-07(b) → `[]` as well.
  - (b) `done` with `returned {seat 2, amount 4}`, seat 2 stack 152, award `{pot 0, amount 17, winners [{seat 3, amount 17}]}`,
    seat 3 stack 17 → `[{chips, 'seat 2 got $4 back but $3 was uncalled'}]`.
  - (c) `done` without `returned`, seat 2 stack 148, award 21 to seat 3, seat 3 stack 21 →
    `[{chips, 'seat 2 got $0 back but $3 was uncalled'}]`.
  - (d) `done` with seat 2 stack 148, `returned` kept → `[{chips, 'table holds $326 but the hand started with $329'}]`.
  - (e) `checkState(done)` → `[]`.
- Verification: acceptance `tests/engine/all-in-invariants.acceptance.test.ts::chips accepts a returned uncalled bet and catches a wrong return`

### SPEC-10: "Wins $X" counts only chips won from others plus the winner's matched chips
- Verifies: AC#7, AC#5, DoD#1
- Behaviour: When `handResultView` runs on:
  - (a) `AVA_UNCONTESTED`:
    - winners `[{seat 1, amount 12, text 'Ava wins $12', handName null, holeCards null}]` (was $16);
    - `hand.result.returned` is `{seat 1, amount 4}`;
    - Ava's stack is 168.
  - (b) `BB_WALK`: text `'You win $4'`, `returned {seat 5, amount 2}`.
  - (c) `{...AVA_UNCONTESTED, hand: <S-B final state>}`: one winner `{seat 3, amount 18, text 'Cal wins $18',
    handName 'Full house, fours over threes'}`.
- Verification: acceptance `tests/table/hand-result-uncalled.acceptance.test.ts::wins amounts exclude returned uncalled bets`

### SPEC-11: Engine internals — floor, exact-stack all-in, actor order
- Verifies: AC#1, AC#3, DoD#1
- Behaviour: Given / When / Then as listed below.
  - (a) `createHand` accepts a stack of 5 and rejects 4 with `Stack at seat 3 must be an integer of at least 5`.
  - (b) A call, bet or raise that uses the exact stack sets `allIn`. A call that leaves $1 does not.
  - (c) The first actor on a new street skips an all-in seat.
  - (d) A seat whose stack is between the call and a full raise gets `[fold, call owe]` with no raise.
- Verification: unit `tests/engine/hand.test.ts::all-in flags, floor and actor order`

### SPEC-12: Earlier stories' tests pass with only the E1–E8 / U1–U4 edits
- Verifies: AC#5, AC#7, DoD#1, DoD#2
- Behaviour: Given the edits listed in §5, When the full suite runs, Then every test passes.
  - `git diff 9ccffbc -- <locked files>` shows only the E1–E8 line changes.
  - `tests/engine/invariant-messages.acceptance.test.ts` and `tests/playtest/summary.acceptance.test.ts` are
    unchanged.
- Verification: command `npm test && git diff --stat 9ccffbc -- tests/engine/invariant-messages.acceptance.test.ts tests/playtest/summary.acceptance.test.ts`

### SPEC-13: Lint, typecheck, coverage and the headless boundary
- Verifies: DoD#2, DoD#4, DoD#5
- Behaviour: Given / When / Then as listed below.
  - Given the change, When the checks run, Then each exits 0.
  - Coverage holds at ≥ 90% for engine/bots/advice/stats (and playtest/table, per `vite.config.ts`) and ≥ 70%
    overall.
  - `src/engine/*` imports no UI code.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-14: The 10,000-hand playtest is clean and its report is unchanged
- Verifies: DoD#6
- Behaviour: Given / When / Then as listed below.
  - Given seats reset to $160 each hand, so no all-in arises, When `npm run playtest -- --hands 10000 --seed 42`
    runs, Then it exits 0.
  - The output is byte-identical to the baseline in §3 (`Ended by fold: 5470` … `Largest pot: $70` …
    `Invariant violations: 0`).
- Verification: command `npm run playtest -- --hands 10000 --seed 42`

### SPEC-15: Changed result text still passes in the browsers
- Verifies: AC#7, DoD#7, DoD#8
- Behaviour: Given / When / Then as listed below.
  - Given E5 and E6, When the result and review specs run in Chromium and WebKit, Then they pass.
  - Their existing axe and same-origin request assertions also pass.
- Verification: integration `npx playwright test e2e/next-hand.spec.ts e2e/review.spec.ts`

### SPEC-16: CI green and story documentation published
- Verifies: DoD#10, DoD#11
- Behaviour: Given / When / Then as listed below.
  - Given branch `doit/TASK-1.9`, When CI runs, Then the workflow is green.
  - `backlog doc list --plain` lists a TASK-1.9 story doc that records D-1..D-7, the Q answers, the E1–E8 edits,
    A-1 (no side pots yet) and the follow-ups.
- Verification: manual CI run on branch `doit/TASK-1.9` and `backlog doc list --plain`

### SPEC-17: Not-applicable DoD items
- Verifies: DoD#3, DoD#9, DoD#12
- Behaviour: Given the golden-spot suite (TASK-7.11) and the service worker (TASK-13.4) are not done, and this
  story adds no strategy content and no screen, When the Judge checks, Then the diff touches nothing under
  `src/advice` or `src/ui`.
- Verification: manual Judge confirms that TASK-7.11 and TASK-13.4 are not Done and that `git diff --stat 9ccffbc -- src/advice src/ui` is empty

## 7. Edge cases
- **Exact-stack call, bet or raise.** The seat goes all-in (A-2). Covered by SPEC-05 S-C and SPEC-11(b).
- **No open seats left.** The board runs out (SPEC-05 S-C).
- **All-in on preflop.** The board runs out from the flop (SPEC-05 S-D).
- **Two seats tie at the top street contribution.** Nothing is returned. This is the normal case, pinned by the
  unchanged showdown tests.
- **SB = BB walk (stakes 2/2).** Nothing is returned, and the award is 4. Pinned by `review-gaps.acceptance` (unchanged).
- **Short all-in with two or more covering players.** One pot (A-1, TASK-1.10). This can reach the app only past
  the missing cap (TASK-1.12).
- **Open seat that owes nothing and has not acted, with every other seat all-in.** Not reachable: the floor keeps
  every blind poster with ≥ $1, and a later street always starts with ≥ 2 open seats. Revisit with all-in blinds in
  TASK-1.16.
- **Seat with $0 offered actions.** Impossible: it is never `toAct`.
- **Invalid input.** Unchanged `createHand` validation, plus the new floor (SPEC-11a).
- **Concurrency, permissions, network.** N/A: pure functions.

## 8. Security considerations
- No new trust boundary, dependency, network request, storage or randomness. `createHand` input validation stays
  in force. Only the numeric floor changes, and it is still a safe-integer check.
- Fairness: dealing is unchanged, and the runout uses the same D-5 deck positions. The `cards` invariant checks
  these positions after every action.

## 9. Non-functional
- Checker cost: C5 runs once per hand, and C3/C4 add O(1) per seat. The existing
  `tests/engine/invariants.perf.test.ts` budget (≤ 10 µs/action locally) must still pass.
- Playtest throughput is unchanged, because the report is identical (SPEC-14).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 10000 --seed 42`
- New tests:
  - `tests/engine/all-in.acceptance.test.ts` → SPEC-01..07
  - `tests/engine/all-in-invariants.acceptance.test.ts` → SPEC-08, 09
  - `tests/table/hand-result-uncalled.acceptance.test.ts` → SPEC-10
  - `tests/engine/hand.test.ts` → SPEC-11
  - e2e: `npx playwright test e2e/next-hand.spec.ts e2e/review.spec.ts` (SPEC-15)
- Judge scenario:
  1. Run `npx vitest run tests/engine tests/table tests/playtest`.
  2. Script S-B in a Node REPL via `createHand` / `applyAction`, and confirm: one call to `applyAction` deals the
     river, `returned {seat 2, amount 3}`, seat 3 wins $18.
  3. Run the 10,000-hand playtest and diff it against the §3 baseline.
  4. Check `git diff 9ccffbc` on the 8 locked files: only the E1–E8 lines change.

## 11. Open questions
-
-
-
-

## 12. Clarifications log
See `doit/TASK-1.9/qa.md`.
