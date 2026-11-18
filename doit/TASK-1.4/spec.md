# Spec: TASK-1.4 — Play a complete fixed-limit hand from blinds to showdown

Status: READY (approved 2026-11-17)
Task: TASK-1.4 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: REQ-014.1–014.5, REQ-016.1, REQ-019.3 (REQ-016 cap and REQ-019 side pots/order deferred to M2 stories) · Dream: limit-holdem-trainer

## 1. Summary
This task adds the core hand engine, `src/engine/hand.ts`: pure functions that start a fixed-limit Hold'em hand for
3–10 seats from a given 52-card deck order (normally `shuffledDeck(replayCode)`), list the exact legal actions for the
seat to act, and apply an action to get the next state, from the blinds through preflop, flop, turn and river betting
to showdown or a fold-out, with pot award and odd-chip splitting. Nearly every later story builds on its state and
action types (PlayerView TASK-1.5, playtest TASK-1.6, invariants TASK-1.8, all-in/side pots/cap/showdown order/button
movement in TASK-1.9–1.16, bots, advice, UI), so the public shape is designed to grow into those features by adding
fields and behaviour, not by changing existing ones (§4 D-1, open question Q-1).

## 2. Scope
- In scope:
  - `src/engine/hand.ts`: types (`Stakes`, `HandConfig`, `HandState`, `PlayerState`, `Pot`, `Action`,
    `ActionRecord`, `HandResult`, `ApplyResult`) and functions `createHand`, `legalActions`, `applyAction`, plus the
    internal-but-exported `splitPot` (odd-chip rule).
  - Blinds, hole-card deal order, board dealing, action order, fixed bet/raise sizes, round end, fold-out, showdown
    ranking with `evaluate`, pot split with odd units clockwise from the left of the button.
  - Minimal rejection of actions not in the legal set (typed error result, state unchanged).
  - Vitest acceptance tests (AC#1–AC#8) and unit tests under `tests/engine/`.
- Not doing:
  - Cap enforcement (TASK-1.12): `legalActions` still offers a raise after the 4th bet; the AC#8 policy avoids it.
  - Detailed illegal-action error codes and the 100,000-injection test (TASK-1.13); only three coarse codes here.
  - All-in, short stacks, uncalled-bet return, all-in run-out (TASK-1.9); half-bet all-in rule (TASK-1.14).
    `createHand` rejects stacks too small to finish a capped hand (§5 rule 1).
  - Side pots (TASK-1.10): `pots` always holds exactly one pot in this task.
  - Showdown order, mucking (TASK-1.15); here every remaining player's cards appear in the result.
  - Button/blind movement between hands, missed blinds, short blinds (TASK-1.16); heads-up (TASK-1.11): 2 seats is
    rejected.
  - PlayerView (TASK-1.5), playtest CLI (TASK-1.6), invariant checker (TASK-1.8), hand records/replay code storage
    (TASK-3.9), any UI, stake list constants (setup stories).
- Scope budget: files=4, lines=1250   (hand.ts ~450, hand.acceptance.test.ts ~340, hand.property.test.ts ~170, hand.test.ts ~290)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | One module `src/engine/hand.ts`; tests `tests/engine/hand.acceptance.test.ts`, `hand.property.test.ts`, `hand.test.ts` | yes | Follows TASK-1.2/1.3 layout (one module per concern, tests in `tests/engine/`) | Split types/pot award into separate files |
| A-2 | Seats are numbered 1–10 (as in the ACs). Clockwise = increasing seat number, wrapping 10→1 (or highest dealt-in seat → lowest). `HandState.players` lists only dealt-in seats in ascending seat order; seat numbers need not be contiguous | yes | Matches every AC's wording; non-contiguous seats are needed later for busted seats (TASK-1.16 AC#2) | 0-based indices; fixed 10-slot array with empty slots |
| A-3 | (Withdrawn: superseded by D-5, approved by Q-3 — burn cards as in a casino) | n/a | n/a | n/a |
| A-4 | The deck is injected through `HandConfig.deck` (any order of the 52 distinct cards). Normal play passes `shuffledDeck(code)`; tests pass a scripted deck built in the test file. The engine does not store the replay code | yes | One code path; tests need no special hook; caller (playtest/table) already holds the code | Accept `{ replayCode }` or `{ deck }` in config |
| A-5 | `createHand` throws `RangeError` with fixed messages for invalid config (programming errors); only `applyAction` returns a typed error | yes | Same style as `cards.ts`/`deck.ts` (TASK-1.3 A-6); illegal actions are a runtime path, bad config is a bug | Typed result for config too |
| A-6 | Immutability by contract: all types are `readonly`; `applyAction` never mutates its input and returns a new state object (unchanged sub-objects may be shared). No `Object.freeze` | yes | Freezing every state costs time in 100,000-hand runs; unit test proves inputs are untouched | Deep-freeze in dev builds |
| A-7 | Interim stack guard: `createHand` rejects any stack below `8 × smallBet + 8 × bigBet` ($96 at $4/$8, the most one player can put into a capped hand) | yes (TASK-1.9 lifts it) | Without all-in support a shorter stack could face a call it cannot pay; the task says no all-in can arise in M1 | Silently allow and let stacks go negative |
| A-8 | `legalActions` omits a call, bet or raise that costs more than the player's stack. In M1 this is reachable only after the 4-bet cap, which the policies never pass | yes | Keeps stacks non-negative without cap or all-in logic | Allow negative stacks |
| A-9 | Fewer than 3 or more than 10 seats throws `RangeError` (heads-up arrives with TASK-1.11) | yes | Task says "3-10 players (heads-up is E01-S09)" | Allow 2 seats with 3+-player rules |
| A-10 | The hand advances automatically: the action that ends a betting round also deals the next street (or resolves showdown) in the same `applyAction` call. There is no separate "deal" action | yes | Keeps the caller loop to "legalActions → applyAction"; cards come from the fixed deck order so nothing is decided by the caller | Explicit `advance(state)` step |
| A-11 | AC#8 seeds everything from one `new Xoshiro128(20261117)`: player count, button, the four replay-code words and each action choice (uniform among legal actions after removing bet/raise when `betCount >= 4`) | yes | Reuses the tested generator; deterministic and reproducible; no cap enforcement needed (the policy reads the engine's bet counter) | Per-seat generators (TASK-1.6 note) |
| A-12 | Every remaining player's hand is in `result.showdown`, listed clockwise from the left of the button | yes (TASK-1.15 changes it) | Showdown order and mucking are TASK-1.15 | Order by rank |

## 3. Current system
- TypeScript 6 strict (`tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`), ESLint
  `tseslint.configs.strict` + headless boundary (`eslint.config.js`, `tools/lint/headless-boundary.js:6` —
  `src/engine/**` may not import React, DOM or `src/ui`), Prettier. Vitest 5 with v8 coverage
  (`vite.config.ts:16`: ≥ 90% lines in `src/engine/**`, ≥ 70% overall), `testTimeout: 30_000` (`vite.config.ts:10`).
  fast-check 4 available. Tests live in `tests/**` (README "Conventions").
- Test naming convention: `describe('<module> acceptance')` with `it('AC#n …')` (`tests/engine/deck.acceptance.test.ts:50`).
- Wall-clock assertions in `npm test` flake on shared CI runners (TASK-1.20); this spec adds none.
- Blinds are not always half the small bet: `$3/$6 → $1/$3` (`dreams/limit-holdem-trainer/requirements.md:138`), so
  `Stakes` carries all four amounts.
- The odd-unit rule for several odd units (one each clockwise from the left of the button) is fixed by REQ-019.9 as
  quoted in TASK-1.10 AC#7; implementing the general rule now costs nothing and covers AC#7.
- Illegal actions: TASK-1.13's notes ask for "a typed result (ok/error code) rather than throwing" (`backlog task view TASK-1.13`).
- Existing code to reuse (path → what to reuse instead of writing new):
  - `src/engine/cards.ts:2` → `Card` type; `parseCards`/`formatCard` in tests.
  - `src/engine/hand-evaluator.ts:168` → `evaluate(7 cards)` for showdown ranks; `:201` `compareHands`.
  - `src/engine/deck.ts:41` → `shuffledDeck(code)` (index 0 dealt first) for normal play and AC#8; `:24`
    `replayCodeFromWords` for seeded codes.
  - `src/engine/seeded-random.ts:44` → `Xoshiro128` (`nextInt` `:83`, `nextUint32`) for the AC#8 policy.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Public state, action and API shape as in §5 "Components" | Alternatives listed in qa.md Q-1 (10-slot seat array, single pot number, separate call/raise-to fields, explicit `advance()`, pot updated per action, config by replay code) | Used by almost every later story; built to extend additively | yes | user (Q-1) |
| D-2 | `applyAction` returns `{ ok: true, state } \| { ok: false, error: { code, message } }` and never throws for an illegal action; codes `hand-complete`, `out-of-turn`, `illegal-action` | throw `IllegalActionError` | Matches TASK-1.13's note, so TASK-1.13 only adds codes, not a new signature | yes | user (Q-2) |
| D-3 | Odd units of a split pot go one each to tied winners clockwise from the left of the button | odd unit to first winner only | REQ-019.3 + REQ-019.9 (TASK-1.10 AC#7) | no | n/a (requirements) |
| D-5 | Burn one card before the flop, turn and river. 1-based deck positions: hole cards 1..2n (AC#2 order), burn 2n+1, flop 2n+2..2n+4, burn 2n+5, turn 2n+6, burn 2n+7, river 2n+8. Burned cards are kept in `HandState.burned` and never appear in `board`, `result` or `result.showdown` | no burns (former A-3) | Casino procedure; fixes the replay-code → board mapping before hand records exist (TASK-3.9) | yes | user (Q-3) |
| D-4 | AC#7 is driven through the engine at $3/$6 ($1/$3 blinds): at $4/$8 every amount is even, so a $27 pot cannot occur | test `splitPot` alone | Proves the whole path end to end; `splitPot` also has a unit test | no | n/a |

## 5. Design

### Files to create / modify
- `src/engine/hand.ts` — new: types and `createHand`, `legalActions`, `applyAction`, `splitPot`
- `tests/engine/hand.acceptance.test.ts` — new, locked: AC#1–AC#7
- `tests/engine/hand.property.test.ts` — new, locked: AC#8 and the AC#4 bet-size property
- `tests/engine/hand.test.ts` — new: config validation, illegal actions, immutability, round-end details, `splitPot`

### Components, interfaces and data
Recommended public shape (Q-1). `src/engine/hand.ts` imports only `./cards` (type), `./hand-evaluator`:
```ts
/** Seat number 1..10. Clockwise = increasing seat number, wrapping. */
export type SeatNumber = number;
/** All money is whole dollars or chips. */
export interface Stakes { readonly smallBlind: number; readonly bigBlind: number; readonly smallBet: number; readonly bigBet: number }
export interface SeatConfig { readonly seat: SeatNumber; readonly stack: number }
export interface HandConfig {
  readonly stakes: Stakes;
  readonly seats: readonly SeatConfig[];   // 3..10 dealt-in seats, any order
  readonly button: SeatNumber;             // one of seats
  readonly deck: readonly Card[];          // 52 distinct cards, index 0 dealt first
}
export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export interface PlayerState {
  readonly seat: SeatNumber;
  readonly startingStack: number;
  readonly stack: number;                  // chips behind
  readonly holeCards: readonly [Card, Card];
  readonly folded: boolean;
  readonly allIn: boolean;                 // always false until TASK-1.9
  readonly streetContribution: number;     // put in on the current street (not yet in pots)
  readonly totalContribution: number;      // put in this hand
  readonly hasActed: boolean;              // acted since the last bet/raise on this street (blinds do not count)
}
export interface Pot { readonly amount: number; readonly eligible: readonly SeatNumber[] }  // eligible ascending
export type Action =
  | { readonly seat: SeatNumber; readonly type: 'fold' | 'check' }
  | { readonly seat: SeatNumber; readonly type: 'call' | 'bet' | 'raise'; readonly amount: number };
  // amount = the number on the action bar: call = chips added; bet = bet size; raise = "raise to" street total
export interface ActionRecord {
  readonly street: Exclude<Street, 'showdown'>;
  readonly seat: SeatNumber;
  readonly type: 'small-blind' | 'big-blind' | 'fold' | 'check' | 'call' | 'bet' | 'raise';
  readonly amount: number;                 // as in Action; blind = blind size; fold/check = 0
  readonly added: number;                  // chips moved from stack by this record
}
export interface PotAward { readonly pot: number; readonly amount: number; readonly winners: readonly { readonly seat: SeatNumber; readonly amount: number }[] }
export interface HandResult {
  readonly endedBy: 'fold' | 'showdown';
  readonly showdown: readonly { readonly seat: SeatNumber; readonly holeCards: readonly [Card, Card]; readonly rank: HandRank }[];
  readonly awards: readonly PotAward[];    // one entry per pot (exactly one in this task)
}
export interface HandState {
  readonly stakes: Stakes;
  readonly button: SeatNumber;
  readonly players: readonly PlayerState[];  // ascending seat order
  readonly deck: readonly Card[];            // the full deal order (hidden from players by TASK-1.5)
  readonly board: readonly Card[];
  readonly burned: readonly Card[];          // burn cards in burn order (0..3); never revealed (TASK-1.5 hides them)
  readonly street: Street;                   // 'showdown' once river betting closes; stays put on a fold-out
  readonly pots: readonly Pot[];             // chips from completed streets; exactly one pot until TASK-1.10
  readonly currentBet: number;               // highest streetContribution
  readonly betCount: number;                 // bets + raises this street; the big blind counts as 1 preflop
  readonly toAct: SeatNumber | null;         // null once the hand is complete
  readonly actions: readonly ActionRecord[]; // blinds first, then every applied action in order
  readonly result: HandResult | null;        // non-null iff the hand is complete
}
export type ApplyErrorCode = 'hand-complete' | 'out-of-turn' | 'illegal-action';
export type ApplyResult =
  | { readonly ok: true; readonly state: HandState }
  | { readonly ok: false; readonly error: { readonly code: ApplyErrorCode; readonly message: string } };

/** Posts blinds and deals hole cards. Throws RangeError on invalid config (§ Error handling). */
export function createHand(config: HandConfig): HandState;
/** Exact legal actions for state.toAct, in the order fold, check, call, bet, raise. [] when complete. */
export function legalActions(state: HandState): readonly Action[];
/** Applies a legal action; never mutates `state`. */
export function applyAction(state: HandState, action: Action): ApplyResult;
/** @internal Splits `amount` among `winners`; odd units one each clockwise from the left of `button`. */
export function splitPot(amount: number, winners: readonly SeatNumber[], button: SeatNumber, seats: readonly SeatNumber[]): { seat: SeatNumber; amount: number }[];
```
Extension path (why this shape): `pots[]` with `eligible` (TASK-1.10), `allIn` + stack-limited actions (TASK-1.9,
1.14 add `all-in` flags/fields), `betCount` (TASK-1.12 cap reads it), `actions` history + `result.showdown`
(TASK-1.15 adds shown/mucked), `players` keyed by seat number (TASK-1.16 creates the next hand's config from this
hand's final stacks and button), `deck` for replay and invariants (TASK-1.6, 1.8), `ApplyErrorCode` union
(TASK-1.13 adds codes). Deferred, not in the state: hand number, replay code, game type, level, player names/styles.

Invariants after every call: Σ`stack` + Σ`streetContribution` + Σ`pots[].amount` = Σ`startingStack` (and at
completion Σ`stack` = Σ`startingStack`); every card in hole cards, `burned` and `board` is distinct and equals the deck card at its D-5 position; `toAct === null` ⇔ `result !== null` ⇔ `legalActions(state).length === 0`.

### Rules and algorithms
1. `createHand`: validate (§ Error handling). Order players ascending by seat. Let `order(from)` be the dealt-in seats
   clockwise starting after `from`. SB = `order(button)[0]`, BB = `order(button)[1]`. Post SB then BB (records
   `small-blind`/`big-blind`, `street: 'preflop'`; stacks reduced; `streetContribution` set; `hasActed` false).
   Deal: deck index `i` (0-based) for `i < 2n` goes to `order(button)[i mod n]`, first card when `i < n`, second card
   otherwise. `currentBet = bigBlind`, `betCount = 1`, `pots = [{ amount: 0, eligible: all seats }]`,
   `toAct = order(BB)[0]` (first seat left of the big blind), `street = 'preflop'`, `board = []`, `burned = []`.
2. Bet unit `u` = `smallBet` on preflop and flop, `bigBet` on turn and river. Let `p` = player to act,
   `owe = currentBet − p.streetContribution`. Legal set, in this order:
   - `owe > 0`: `fold`; `call` with `amount = owe`; `raise` with `amount = currentBet + u`.
   - `owe = 0` and `currentBet > 0` (big blind's option preflop): `check`; `raise` with `amount = currentBet + u`.
   - `owe = 0` and `currentBet = 0`: `check`; `bet` with `amount = u`.
   - Any call/bet/raise whose chips added exceed `p.stack` is omitted (A-8). No cap check (TASK-1.12).
   Examples at $4/$8, 6 seats, button 1: seat 4 preflop → `fold`, `call 4`, `raise 8`; seat 2 (SB) unraised →
   `fold`, `call 2`, `raise 8`; seat 3 (BB) after everyone calls → `check`, `raise 8`; seat 3 facing a raise to 8 →
   `fold`, `call 4`, `raise 12`; first to act on the turn → `check`, `bet 8`; facing a river bet of 8 → `fold`,
   `call 8`, `raise 16`. At $3/$6 ($1/$3): SB → `fold`, `call 2`, `raise 6`.
3. `applyAction(state, action)`: if `state.result !== null` → error `hand-complete`; if `action.seat !== state.toAct`
   → error `out-of-turn`; if the action does not equal (same `seat`, `type` and, where present, `amount`) one entry of
   `legalActions(state)` → error `illegal-action`. Otherwise: move chips (call: `amount`; bet: `amount`;
   raise: `amount − streetContribution`), append an `ActionRecord`, set `hasActed = true`; on bet/raise set
   `currentBet = amount`, `betCount += 1` and `hasActed = false` for every other non-folded player. On fold set
   `folded = true` and remove the seat from every pot's `eligible`.
4. After applying: if exactly one non-folded player remains → fold-out (rule 6). Else if every non-folded player has
   `hasActed` and `streetContribution === currentBet` → round ends (rule 5). Else `toAct` = next non-folded seat
   clockwise after the actor.
5. Round end: add all `streetContribution` to `pots[0].amount`, reset them to 0, `currentBet = 0`, `betCount = 0`,
   `hasActed = false`. Preflop → flop burns deck index `2n` and deals `2n+1..2n+3` (0-based); flop → turn burns `2n+4`
   and deals `2n+5`; turn → river burns `2n+6` and deals `2n+7` (D-5); burns are appended to `burned`; `toAct` = first non-folded seat in `order(button)`. River → `street = 'showdown'`,
   showdown (rule 7).
6. Fold-out: gather street contributions into `pots[0]`; the remaining player's stack += pot amount;
   `result = { endedBy: 'fold', showdown: [], awards: [{ pot: 0, amount, winners: [{ seat, amount }] }] }`;
   `toAct = null`; no further cards are dealt (board unchanged). Example: 6 seats $4/$8 button 1, seats 4, 5, 6, 1,
   2 fold → seat 3 wins $6: stacks seat 2 = 158, seat 3 = 162.
7. Showdown: for each non-folded player `rank = evaluate([...holeCards, ...board])`; winners = players with the
   highest rank; `splitPot(pot.amount, winners, button, all dealt-in seats)`; stacks += shares;
   `result = { endedBy: 'showdown', showdown: <non-folded players clockwise from left of button>, awards }`;
   `toAct = null`.
8. `splitPot(amount, winners, button, seats)`: `k = winners.length`, `base = floor(amount / k)`, `r = amount mod k`;
   each winner gets `base`; the first `r` winners in clockwise order starting with the seat after `button` get +1.
   Examples: 27 to [2, 5], button 1 → 2: 14, 5: 13; button 3 → 5: 14, 2: 13; 29 to [3, 5, 6], button 4 → 5: 10,
   6: 10, 3: 9. Returned in that clockwise order.

AC#7 scripts (6 seats 1–6, stacks 160, $3/$6 with $1/$3 blinds; seat 2 holds `Ad Kc`, seat 5 holds `Ah Ks`, board
`2c 7d 9h Jc 4s`; other hole cards any remaining cards):
- Button 1 (SB 2, BB 3): preflop 4 fold, 5 raise 6, 6 fold, 1 fold, 2 call 5, 3 fold; flop 2 check, 5 check;
  turn 2 bet 6, 5 call 6; river 2 check, 5 check → pot 27 (2: 12, 3: 3, 5: 12) → seat 2 +14, seat 5 +13.
- Button 3 (SB 4, BB 5): preflop 6 fold, 1 fold, 2 call 3, 3 fold, 4 call 2, 5 check; flop 4 check, 5 bet 3,
  2 call 3, 4 fold; turn 5 bet 6, 2 call 6; river 5 check, 2 check → pot 27 → seat 5 +14, seat 2 +13.
- Single best hand: the button-1 script with seat 5 holding `Ah Qs` → seat 2 +27.

### Error handling and configuration
- `createHand` throws `RangeError` (checked in this order):
  - `Hand needs 3 to 10 seats, got <n>`
  - `Invalid seat: <seat>` (not an integer in 1..10) / `Duplicate seat: <seat>`
  - `Button must be a dealt-in seat: <button>`
  - `Invalid stakes` (any amount not a positive integer)
  - `Deck must hold each of the 52 cards exactly once`
  - `Stack at seat <seat> must be an integer of at least <min>` (min = 8 × smallBet + 8 × bigBet, A-7)
- `applyAction` errors (state returned unchanged, input never mutated): `hand-complete` "The hand is complete";
  `out-of-turn` "Seat <s> acted but seat <t> is to act"; `illegal-action` "Illegal action for seat <s>".
- No configuration, no randomness, no clock in `hand.ts`.

## 6. Behaviour specification

### SPEC-01: Blinds are posted left of the button
- Verifies: AC#1
- Behaviour: Given 6 seats (1–6, stacks 160) at $4/$8 with the button at seat 1, When `createHand` runs, Then `actions[0]` is `{ street: 'preflop', seat: 2, type: 'small-blind', amount: 2, added: 2 }`, `actions[1]` is `{ street: 'preflop', seat: 3, type: 'big-blind', amount: 4, added: 4 }`, seat 2 has stack 158 and seat 3 stack 156; with the button at seat 6, seat 1 posts $2 and seat 2 posts $4; with seats [1, 3, 4, 7] and button 7, seat 1 posts $2 and seat 3 posts $4.
- Verification: acceptance `tests/engine/hand.acceptance.test.ts::AC#1 the two seats left of the button post the small and big blinds`

### SPEC-02: Hole cards are dealt one at a time clockwise from left of the button
- Verifies: AC#2
- Behaviour: Given a scripted deck whose 1-based positions 1..12 are distinct known cards and 6 seats with the button at seat 1, When the hand is created, Then seat 2 holds positions [1, 7], seat 3 [2, 8], seat 4 [3, 9], seat 5 [4, 10], seat 6 [5, 11] and seat 1 [6, 12]; with the button at seat 4, seat 5 holds [1, 7] and seat 4 holds [6, 12].
- Verification: acceptance `tests/engine/hand.acceptance.test.ts::AC#2 hole cards go one at a time clockwise from left of the button for two rounds`

### SPEC-03: First to act preflop and on later streets
- Verifies: AC#3
- Behaviour: Given 6 seats with the button at seat 1, When preflop begins, Then `toAct` is 4. Given everyone calls and seat 3 checks, When the flop is dealt, Then `toAct` is 2. Given a hand where seat 2 folded preflop and the others reached the flop, Then `toAct` on the flop is 3. Given all six see the flop and seats 2 and 3 check, seat 4 bets 4, seats 5, 6 and 1 call and seats 2 and 3 fold, Then `toAct` on the turn is 4, and after all check the turn, 4 again on the river. Given the button at seat 6 (SB 1, BB 2), Then `toAct` preflop is 3 and on the flop 1.
- Verification: acceptance `tests/engine/hand.acceptance.test.ts::AC#3 preflop starts left of the big blind and later streets with the first active player left of the button`

### SPEC-04: Exact legal action sets
- Verifies: AC#4
- Behaviour: Given 6 seats at $4/$8 with the button at seat 1, When `legalActions` runs, Then it returns exactly (deep-equal, in this order): preflop seat 4 → `[{seat:4,type:'fold'},{seat:4,type:'call',amount:4},{seat:4,type:'raise',amount:8}]`; after everyone limps, seat 3 (big blind) → `check`, `raise 8`; seat 2 after a raise to 8 → `fold`, `call 6`, `raise 12`; first to act on the flop → `check`, `bet 4`; first to act on the turn with no bet → `[{type:'check'},{type:'bet',amount:8}]` for that seat; facing a river bet of 8 → `fold`, `call 8`, `raise 16`. When the hand is complete, Then `[]`.
- Verification: acceptance `tests/engine/hand.acceptance.test.ts::AC#4 legal actions list exact amounts for the player to act`

### SPEC-05: Every bet and raise is exactly one small bet or one big bet
- Verifies: AC#4
- Behaviour: Given 2,000 seeded hands (3–10 seats, $4/$8, stacks 160, the A-11 policy with seed 41), When `legalActions` is listed at every decision, Then every `bet` has `amount = u` and every `raise` has `amount = currentBet + u`, with `u = 4` preflop and flop and `u = 8` turn and river, and every `call` has `amount = currentBet − streetContribution` of the player to act; and every applied bet/raise record has `added` consistent with those amounts.
- Verification: acceptance `tests/engine/hand.property.test.ts::AC#4 every bet or raise is one small bet preflop and flop and one big bet turn and river`

### SPEC-06: Rounds end when all have acted and matched, then 3, 1, 1 board cards
- Verifies: AC#5
- Behaviour: Given 6 seats, button 1, a scripted deck, When all six players call/check preflop (seat 3 checks last), Then `street` is `flop`, `burned` equals [position 13] and `board` equals deck positions 14–16 (1-based), `pots[0].amount` is 24 and every `streetContribution` is 0; When all check the flop, Then `street` is `turn` and `burned` gains position 17 and `board` gains position 18; When all check the turn, Then `river`, `burned` gains 19 and `board` gains 20; When all check the river, Then `street` is `showdown`, `result.endedBy` is `showdown` and `board` has 5 cards. Given a flop where seat 2 bets, seats 3–6 and 1 call, Then the round ends only after seat 1's call (not before), and Given seat 4 raises after seat 2's bet, Then seat 2 must act again before the round ends.
- Verification: acceptance `tests/engine/hand.acceptance.test.ts::AC#5 a round ends when every active player has acted and matched and the next street deals 3 then 1 then 1 cards`

### SPEC-18: One card is burned before each street and burned cards are never revealed
- Verifies: AC#5, AC#6
- Behaviour: Given 6 seats (n = 6), button 1, and a scripted deck with known distinct cards at 1-based positions 1–20, When the hand is checked/called down to showdown, Then `burned` is [pos 13, pos 17, pos 19] and `board` is [pos 14, 15, 16, 18, 20]; with 3 seats the board is positions [8, 9, 10, 12, 14] and `burned` [7, 11, 13]. No burned card occurs in `board`, in any `result.showdown[].holeCards`, or anywhere in `JSON.stringify(state.result)`. Given a fold-out on the flop, Then `burned` has exactly 1 card and `board` 3, and the turn burn/turn card positions are not consumed.
- Verification: acceptance `tests/engine/hand.acceptance.test.ts::burn one card before flop turn and river and never reveal burned cards`

### SPEC-07: The big blind's option and re-opened action keep the round open
- Verifies: AC#5, AC#3
- Behaviour: Given preflop at $4/$8 with seats 4, 5, 6, 1 and 2 calling, When seat 2's call is applied, Then the street is still `preflop` and `toAct` is 3 with `check`/`raise 8`; Given seat 3 raises to 8, Then `toAct` is 4 and every caller must act again; `betCount` is 1 at preflop start, 2 after the raise and 0 at the start of each later street, rising by 1 per bet or raise.
- Verification: unit `tests/engine/hand.test.ts::big blind option and raises reopen the round`

### SPEC-08: A fold-out awards the pot without showing and deals nothing more
- Verifies: AC#6
- Behaviour: Given 6 seats at $4/$8, button 1, When seats 4, 5, 6, 1 and 2 fold preflop, Then the hand is complete after seat 2's fold: `result.endedBy` is `fold`, `result.showdown` is `[]`, `result.awards` is `[{pot:0,amount:6,winners:[{seat:3,amount:6}]}]`, seat 3's stack is 162, seat 2's 158, `board` is `[]`, `toAct` is null and `legalActions` is `[]`. Given a flop where seat 2 bets 4 and all others fold, Then `board` stays at 3 cards, seat 2 wins the whole pot, and Σ stacks equals 960.
- Verification: acceptance `tests/engine/hand.acceptance.test.ts::AC#6 when all but one fold the last player wins without showing and no more cards are dealt`

### SPEC-09: Tied pots split with the odd dollar left of the button
- Verifies: AC#7
- Behaviour: Given the §5 AC#7 scripts at $3/$6, When river betting ends, Then `pots[0]`/award amount is 27 and: button 1 → seat 2 receives 14 and seat 5 receives 13 (`awards[0].winners` = `[{seat:2,amount:14},{seat:5,amount:13}]`); button 3 → seat 5 receives 14 and seat 2 receives 13; single best hand (seat 5 holds `Ah Qs`) → seat 2 receives 27. `result.showdown` lists seats 2 and 5 with their hole cards and ranks.
- Verification: acceptance `tests/engine/hand.acceptance.test.ts::AC#7 a tied pot splits equally with the odd dollar to the first tied player left of the button`

### SPEC-10: splitPot gives several odd units one each clockwise
- Verifies: AC#7
- Behaviour: Given `splitPot(29, [3, 5, 6], 4, [1..6])`, Then `[{seat:5,amount:10},{seat:6,amount:10},{seat:3,amount:9}]`; `splitPot(27, [5, 2], 1, [1..6])` → `[{seat:2,amount:14},{seat:5,amount:13}]`; `splitPot(30, [2, 4, 6], 1, [1..6])` → 10 each; a single winner gets the whole amount; shares always sum to `amount`.
- Verification: unit `tests/engine/hand.test.ts::splitPot distributes odd units clockwise from the left of the button`

### SPEC-11: 100,000 seeded random hands all reach a legal end state
- Verifies: AC#8, AC#5, AC#6
- Behaviour: Given `rng = new Xoshiro128(20261117)` and, per hand, `n = 3 + rng.nextInt(8)` seats 1..n with stack 160, `button = 1 + rng.nextInt(n)`, deck `shuffledDeck(replayCodeFromWords([4 × rng.nextUint32()]))`, stakes $4/$8, and a policy that picks `legal[rng.nextInt(legal.length)]` after removing `bet`/`raise` when `state.betCount >= 4`, When 100,000 hands are played, Then every `applyAction` returns `ok: true`, every hand completes within 400 actions, and at completion: `toAct` null, `legalActions` `[]`; `endedBy 'fold'` ⇒ exactly one non-folded player, empty `showdown`, board length in {0, 3, 4, 5}; `endedBy 'showdown'` ⇒ ≥ 2 non-folded players, 5 board cards, `showdown` seats = non-folded seats, every winner's rank is the maximum; Σ final stacks = 160 × n; no stack negative; all hole, burned and board cards distinct and at their D-5 deck positions; no burned card appears in `board` or `result`; no street records more than 4 bets (counting the big blind preflop); both end types occur at least once. The test sets its own timeout of 300,000 ms and asserts no duration.
- Verification: acceptance `tests/engine/hand.property.test.ts::AC#8 100,000 seeded random hands with 3 to 10 players end in a legal state`

### SPEC-12: Illegal actions are rejected and the state is unchanged
- Verifies: AC#4, DoD#1
- Behaviour: Given preflop with seat 4 to act at $4/$8, When seat 5 submits `call 4`, Then `{ok:false, error:{code:'out-of-turn', message:'Seat 5 acted but seat 4 is to act'}}`; When seat 4 submits `raise 12`, `call 2`, `bet 4` or `check`, Then code `illegal-action` with message `Illegal action for seat 4`; When any action is applied to a complete hand, Then code `hand-complete`; in every case the input state deep-equals a `structuredClone` taken before the call.
- Verification: unit `tests/engine/hand.test.ts::illegal actions return a typed error and leave the state unchanged`

### SPEC-13: Invalid configurations are rejected
- Verifies: DoD#1
- Behaviour: Given each invalid config in §5 "Error handling" (2 seats, 11 seats, seat 0, seat 11, seat 2.5, duplicate seat, button not dealt in, a zero or fractional stake amount, a 51-card deck, a duplicated card, stack 95 at $4/$8), When `createHand` runs, Then it throws `RangeError` with exactly the listed message; stack 96 is accepted.
- Verification: unit `tests/engine/hand.test.ts::createHand rejects invalid configs with fixed messages`

### SPEC-14: Pure and immutable
- Verifies: DoD#1, AC#8
- Behaviour: Given a state and a legal action, When `applyAction` is called twice with the same inputs, Then both results deep-equal each other and the input state deep-equals its pre-call `structuredClone`; `createHand` with the same config twice gives deep-equal states and does not mutate `config.deck`; chip-conservation invariant (§5) holds after every action of one scripted full hand.
- Verification: unit `tests/engine/hand.test.ts::applyAction is pure and never mutates its input`

### SPEC-15: Checks, coverage, headless boundary and no network
- Verifies: DoD#1, DoD#2, DoD#4, DoD#5, DoD#8
- Behaviour: Given the finished change, When `npm run lint && npm run typecheck && npm test` runs, Then each exits 0, no `ERROR: Coverage` line is printed and `src/engine/hand.ts` shows ≥ 90% lines; the grep prints nothing: `hand.ts` has no network API, dynamic import, package or Node built-in import, and none of `Math.random`, `Date`, `performance`, `crypto`, `process`.
- Verification: command `npm run lint && npm run typecheck && npm test && ! grep -nE "fetch|XMLHttpRequest|WebSocket|EventSource|import\(|from '[^.]|node:|Math\.random|Date|performance|crypto|process" src/engine/hand.ts`

### SPEC-16: CI is green on the story branch
- Verifies: DoD#10
- Behaviour: Given branch `doit/TASK-1.4` is pushed, When its latest CI run completes, Then its conclusion is `success`.
- Verification: command `gh run list -R gregswhiteaz/texaslimittrainer --branch doit/TASK-1.4 --limit 1 --json conclusion -q '.[0].conclusion'` prints `success`

### SPEC-17: Conditional DoD items that do not apply, and story documentation
- Verifies: DoD#3, DoD#6, DoD#7, DoD#9, DoD#11, DoD#12
- Behaviour: Given this task, Then: DoD#3 does not apply (golden-spot suite arrives in E07-S14); DoD#6 does not apply (playtest runner arrives in E01-S07, TASK-1.6; SPEC-11 is the stand-in); DoD#7 and DoD#12 do not apply (no screen: `git diff --stat main` shows no change under `src/ui/`, `e2e/`, `index.html` or `src/main.tsx`); DoD#9 does not apply (no strategy content). DoD#11: the TASK-1.4 story document is published with `backlog doc` and appears in `backlog doc list --plain`.
- Verification: manual check of `git diff --stat main` and `backlog doc list --plain | grep "TASK-1.4"`

## 7. Edge cases
- Boundary seat counts 3 and 10, and 2/11 rejected: SPEC-11 (3–10), SPEC-13.
- Button at the highest seat (wrap to seat 1) and non-contiguous seats: SPEC-01, SPEC-02, SPEC-03.
- Big blind's option and reopening after a raise: SPEC-07. Small blind completing at $3/$6 (call 2): SPEC-09 script.
- Fold-out preflop with blinds only, and on a later street: SPEC-08.
- First actor folded / button folded on later streets: SPEC-03.
- Odd pots, single and multiple odd units: SPEC-09, SPEC-10. Multi-way ties at showdown: SPEC-10; random ties occur in SPEC-11.
- Invalid input (config, out-of-turn, wrong amount, acting after completion): SPEC-12, SPEC-13.
- Fifth bet / unaffordable actions: not reachable in M1 (A-7, A-8); policy excludes the fifth bet (SPEC-11).
- Duplicate cards: deck validated (SPEC-13); distinctness checked in SPEC-11.
- Concurrency / interruption / permissions / dependency failure: N/A — synchronous pure functions with no I/O.

## 8. Security considerations
- Trust boundary: `HandConfig` and `Action` come from engine callers (table, playtest, later replay of stored
  records). Config is fully validated (SPEC-13); actions are accepted only if equal to a computed legal action
  (SPEC-12), so no caller can move chips the rules don't allow.
- Hidden information: `HandState` contains every hole card and the undealt deck. It must not be passed to bots or
  shown in the UI; TASK-1.5 provides the PlayerView boundary. This task logs nothing.
- Randomness: none in the engine; dealing fairness comes from `shuffledDeck` (TASK-1.3). The AC#8 test generator is
  test-only.
- Secrets, authn/authz, injection: N/A. New dependencies: none.

## 9. Non-functional
- Determinism: same config and actions → deep-equal states (SPEC-14); no clock or randomness in `hand.ts` (SPEC-15).
- Speed (not asserted, TASK-1.20): AC#8's 100,000 hands should finish in about 10 s locally under coverage; the test's
  own 300,000 ms timeout is a safety ceiling, not a target. Design note for the builder: copy only the players array
  and changed player objects per action.
- Coverage ≥ 90% lines on `src/engine/hand.ts` (SPEC-15).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: N/A — no user-facing entry point until the playtest CLI (TASK-1.6); `npx vitest run tests/engine/hand` runs the engine tests
- New tests (path → SPEC ids):
  - `tests/engine/hand.acceptance.test.ts` → SPEC-01, 02, 03, 04, 06, 08, 09, 18 (locked)
  - `tests/engine/hand.property.test.ts` → SPEC-05, SPEC-11 (locked)
  - `tests/engine/hand.test.ts` → SPEC-07, 10, 12, 13, 14
- Scripted decks are built inside each test file: place chosen cards at the positions given by rule 1/rule 5 and D-5 (burns included; AC#7's board `2c 7d 9h Jc 4s` goes to positions 14–16, 18, 20 for 6 seats), then
  fill with the remaining cards in ascending order.
- End-to-end scenario for the Judge (as a developer consuming the engine):
  1. `npm run lint && npm run typecheck && npm test` exits 0.
  2. In a scratch script, `createHand` 6 seats $4/$8 button 1 with `shuffledDeck('0123456789abcdeffedcba9876543210')`,
     loop `legalActions` → `applyAction` choosing `call`/`check` always; confirm board has 5 cards, `result.endedBy`
     is `showdown` and Σ stacks = 960.
  3. Mutation probes (revert after each): post blinds from the button instead of left of it (SPEC-01 fails); deal
     two cards per player at a time (SPEC-02 fails); start later streets left of the big blind (SPEC-03 fails); use
     `bigBet` on the flop (SPEC-04/05 fail); end the round when contributions match without checking `hasActed`
     (SPEC-06/07 fail); give the odd unit to the lowest seat number (SPEC-09 fails); deal the next street after a
     fold-out (SPEC-08 fails); skip the burns (SPEC-06/18 fail); skip the deck-duplicate check (SPEC-13 fails).
  4. Run the SPEC-15 grep and the SPEC-17 checks.

## 11. Open questions
- None. Q-1, Q-2 and Q-3 answered (see `qa.md`).

## 12. Clarifications log
See `doit/TASK-1.4/qa.md`.
