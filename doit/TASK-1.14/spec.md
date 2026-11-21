# Spec: TASK-1.14 — Allow short all-in bets and raises under the half-bet reopening rule

Status: READY (approved 2026-11-21)
Task: TASK-1.14 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: REQ-016.5, REQ-017.7 · Dream: limit-holdem-trainer

## 1. Summary
A player whose stack is larger than the call amount but too small for a full bet or raise is offered a bet or raise
all-in for the whole stack (REQ-017.7). A stack equal to or below the call amount still gets only fold or call. An
all-in bet or raise that adds less than half a full bet over the street's last full bet level doesn't count toward
the cap. It also doesn't reopen betting for players who have already acted: they may only call or fold. An all-in of
half a bet or more counts as a full bet or raise, and the next raise goes one full bet above it (REQ-016.5, task
Notes). The invariant checker's bet-size and bet-cap checks learn the same rule. With $160 stacks the playtest never
produces a short all-in, so its report stays byte-identical.

## 2. Scope
- In scope:
  - `src/engine/hand.ts`: a private `fullBetLevel(state)` derived from the street's action records; `legalActions`
    offers the all-in bet/raise amount and withholds bet/raise from players who already acted; `applyAction` counts
    a bet/raise toward `betCount` and clears others' `hasActed` only when it is a counted (full or ≥ half) one. Doc
    comments on `PlayerState.hasActed`, `HandState.betCount` and `legalActions`.
  - `src/engine/invariants.ts`: the bet-size clause accepts an all-in short bet/raise. `betCapMessage` counts only
    counted bets, using the checker's own derivation of the rule (independent of the engine, TASK-1.8 A-4).
  - `tests/engine/hand.test.ts` (not locked): update the one assertion that expected no raise for a $6 stack facing a
    $4 bet (it now contradicts AC#6).
  - New acceptance, unit and property tests (§10).
- Not doing:
  - Action-bar labels "Bet all-in $X" / "Raise all-in to $X" / "Call all-in $X" and any UI change (TASK-3.7). The
    table session tops stacks up to `minimumStack` (`src/table/session.ts:168-171`), so the UI never reaches a short
    all-in today.
  - New fields on `Action`, `ActionRecord`, `PlayerState`, `HandState` or `PlayerView` (A-2, D-1).
  - All-in blinds and short blinds (TASK-1.16); `createHand`'s floor stays `bigBlind + 1`.
  - Changing `STREET_BET_CAP`, `MAX_BETS_PER_STREET`, bet-cap/legal-action message wording, the playtest runner,
    policies, bots, advice or report format.
  - Editing any locked test file (none needs to change; checked against a patched copy, see §3).
- Scope budget: files=6, lines=650

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Short all-ins are measured **cumulatively** against the street's last full bet level, not against the previous all-in. Example: seat 2 bets $4, seat 3 goes all-in to $5 (+$1, not counted), seat 4 goes all-in to $6. Seat 4's all-in is +$2 over the $4 level, so it counts as a full raise: `betCount` 2, the next raise is to $10, and it reopens betting for everyone, seat 2 included. | yes (engine-only rule, no stored data) | Matches the common casino/TDA principle that several short all-ins which together make a full (here: half) raise reopen betting. It also falls out of the same "level + unit" rule that gives AC#4's raise to $8. One rule covers bets, raises, completions and cumulative cases. | Measure each all-in against the current bet (then $6 is +$1 and not counted; the next raise would be to $8). Or a per-player TDA test (reopen only for players facing ≥ half a bet since their own last action). |
| A-2 | No "all-in" marker is added to `Action`/`ActionRecord`. An all-in bet/raise is an ordinary `bet`/`raise` whose amount is the to-amount (`streetContribution + stack`). After it, the actor's `PlayerState.allIn` is `true`, and `added` equals the stack it had. This is how all-in calls already work (TASK-1.9, `tests/engine/all-in.acceptance.test.ts:93-107`). | yes | Keeps the public types unchanged. TASK-3.7 can label the button from `amount === streetContribution + stack`. | Add `allIn: true` to `Action` (public interface change; nothing needs it yet). |
| A-3 | After a short (< half) all-in **bet**, a player who hasn't acted may fold, call the all-in, or "complete": a `raise` to `level + unit` (e.g. a $1 all-in bet on a $4 street → raise to $4). The completion counts as the street's first bet (`betCount` 0 → 1). Players who already checked may only call or fold until someone completes. | yes | Falls out of the uniform rule (`fullBetLevel` 0 + unit). It is the standard casino "complete the bet" option, and it keeps `bet` meaning "no bet facing" (`src/advice/grade.ts:60-67` relies on bet never appearing with fold/call/raise). | Offer completion as type `bet` (would put bet next to fold/call and break the A-5 pairs in grade.ts). |
| A-4 | "Has already acted" is the existing `PlayerState.hasActed`. A counted bet/raise clears it for every other unfolded seat, as today. A short uncounted all-in leaves it alone. A seat to act with `hasActed === true` and a bet to call may therefore only fold or call. Before this task, `hasActed && owe > 0` never happened, because every bet/raise cleared `hasActed`. So the new `!hasActed` condition changes no existing legal set. | yes | No new state field. Blinds have `hasActed === false` (`src/engine/hand.ts:231`), so the small and big blind may still raise over a short preflop all-in (they haven't acted voluntarily). | A new public `HandState` field listing who may raise (public data change; not needed). |
| A-5 | The property test uses 20,000 hands, seed `20261121`, 2–10 seats, stacks uniform in $5..$40, a random button and a uniformly random legal action. | yes | Measured on a patched copy: ~1.0 s, and it produced 3,869 uncounted short all-ins, 3,786 short all-in bets, 1,963 "already acted, may only call/fold" decisions and 407 completions, so it isn't vacuous. | The existing $5..$192 side-pot property (already passes; too few short spots to assert counts on). |

## 3. Current system
- `legalActions` (`src/engine/hand.ts:266-292`): `raiseTo = currentBet + unit` (`:276`). `canRaise` checks only the
  cap and that the full raise fits the stack (`:277-278`). A bet is offered only if `unit <= stack` (`:289`). So
  today a $6 stack facing $4 gets fold/call only, and a $3 stack with no bet gets check only.
- `applyAction` (`src/engine/hand.ts:497-559`): accepts only actions in the legal set (`:502-505`). Every bet/raise
  clears `hasActed` for every other unfolded seat (`:528`), sets `currentBet = amount` (`:541`) and increments
  `betCount` (`:542`). The round ends when every open seat has acted and matched `currentBet` (`:550-552`). The next
  actor is the next open seat clockwise (`:554-558`). `allIn` is set when the stack reaches 0 (`:524`).
- Field docs: `hasActed` "Acted since the last bet/raise on this street (blinds do not count)" (`:40-41`). `betCount`
  "Bets + raises this street; the big blind counts as 1 preflop" (`:94-95`). `currentBet` "Highest
  streetContribution" (`:92-93`).
- `STREET_BET_CAP = 4` (`:128-129`). `createHand` floor: every stack ≥ `bigBlind + 1` (`:175-181`). The big-blind
  record's amount is `bigBlind` (`:254-260`).
- Invariant checker (`src/engine/invariants.ts`): `legalActionMessage` (`:61-101`) checks the legal set, then its
  own size clause (bet = unit, raise = `currentBet + unit`, `:75-84`). The comment there says "TASK-1.14 … must
  revisit it". `betCapMessage` (`:188-207`) counts every big-blind/bet/raise record per street, so a short
  uncounted all-in would show up as a false fifth bet. `BETTING_STREETS` is at `:186`.
- Consumers of `legalActions`: `player-view.ts:103`, `table/session.ts:212`, `playtest/policy.ts:15`, `bots/tag.ts`,
  `advice/preflop.ts:92`, `advice/postflop.ts:74,104`. All of them pick from the set, and none assumes a raise amount
  of `currentBet + unit`.
- Playtest: every stack is reset to `CASH_BUY_IN = 160` before each hand (`src/playtest/runner.ts:28,137`). One
  player can put in at most $96 in a hand (`minimumStack`, `src/engine/hand.ts:133-135`), so `sc + stack ≥ 64 >
  level + unit` always holds and no short all-in can occur.
- Prototype check (spec research, scratch copy at /tmp, not in the repo): with the §5 rules applied, all of
  `tests/engine`, `tests/playtest`, `tests/table`, `tests/advice` and `tests/bots` pass, except the unlocked
  `tests/engine/hand.test.ts:289-293`, which needs the D-3 update. Every locked test passes unchanged, including
  `side-pots.property.test.ts` (TASK-1.10) and `invariants.test.ts` (TASK-1.12). `npm run playtest -- --hands
  10000 --seed 42 --size 6` and `--size 2` were byte-identical to `main`.
- Tests: Vitest (`npm test` = `vitest run --coverage`), engine coverage threshold 90% lines (`vite.config.ts:16-19`).
- Existing code to reuse:
  - `tests/engine/all-in.acceptance.test.ts:15-82` → copy the `STAKES`, identity `DECK`, `newHand`, `apply`, `play`,
    `trace`, `playerAt`, `Step` and `LIMP_6` scripting pattern (they aren't exported). Button 1, so SB 2, BB 3,
    preflop opens at seat 4 and the flop opens at seat 2.
  - `tests/engine/side-pots.property.test.ts:16-56` → `dealHand`/`playOut` loop shape with `Xoshiro128`,
    `shuffledDeck(replayCodeFromWords(words))` and `checkStep({ before, action, result })`.
  - `checkStep` / `checkState` from `src/engine/invariants.ts` for invariant assertions.

### Locked tests touched
None. No locked file needs editing (prototype above). The only existing assertion that changes is in the unlocked
`tests/engine/hand.test.ts` (no `doit/*/state.json` lists it in `locked_tests`). It is changed to the new rule, not
deleted or loosened (D-3).

### Playtest baseline
Byte-identical: `npm run playtest -- --hands 10000 --seed 42 --size 6` must still report `Ended by fold: 5470`,
`Ended at showdown: 4530`, `Player actions: 88831`, `Streets capped at 4 bets: 244`, `Largest pot: $70`,
`Invariant violations: 0`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The street's **full bet level** is derived on demand from `state.actions` by a private `fullBetLevel(state)` in `hand.ts`, not stored in `HandState`. | A public `HandState.fullBet` field. | No public data-shape change. The records already hold every bet/raise amount, and a street has at most ~20 records. | no | n/a |
| D-2 | The checker re-derives the level and the counted bets itself (a private helper in `invariants.ts`) and doesn't import the engine's helper. | Export `fullBetLevel` from `hand.ts`. | Keeps the checker independent of the engine (TASK-1.8 A-4, TASK-1.12 A-1). | no | n/a |
| D-3 | Update `tests/engine/hand.test.ts:289-293` to expect `[fold, call 4, raise 6]` for the $6 stack facing $4, with the comment "$6 behind: a raise all-in to $6 (REQ-017.7)". | Leave it (it would fail); delete it (loosening). | The old expectation is the pre-REQ-017.7 behaviour that AC#6 replaces. The new assertion is just as strict. | no | n/a |

## 5. Design

### Files to create / modify
- `src/engine/hand.ts` — `fullBetLevel`, `legalActions` and `applyAction` changes; doc comments.
- `src/engine/invariants.ts` — size clause and `betCapMessage` follow REQ-016.5; update the `:75-78` comment.
- `tests/engine/hand.test.ts` — the D-3 assertion update only.
- `tests/engine/short-all-in.acceptance.test.ts` — new: SPEC-01..07.
- `tests/engine/short-all-in.test.ts` — new: SPEC-08..12 (engine and checker unit cases).
- `tests/engine/short-all-in.property.test.ts` — new: SPEC-13.

### Components, interfaces and data
- No exported signature or type changes. `legalActions(state)` and `applyAction(state, action)` keep their
  signatures, ordering (fold, check, call, bet, raise) and error codes.
- `unit` = `stakes.smallBet` on preflop/flop, `stakes.bigBet` on turn/river (as today, `hand.ts:271-274`). It may
  become a small private helper shared by `legalActions`, `applyAction` and `fullBetLevel`.
- `fullBetLevel(state): number` (private): start at 0. Walk `state.actions` whose `street === state.street`:
  - a `big-blind` record sets level = its amount;
  - a `bet`/`raise` record with `2 * (amount - level) >= unit` sets level = its amount (it is "counted");
  - anything else leaves level unchanged.
- Doc updates: `hasActed` → "Acted since the last counted bet/raise on this street (blinds do not count); a short
  all-in under half a bet does not clear it (REQ-016.5)". `betCount` → "Counted bets + raises this street (full, or
  all-in of at least half a bet); the big blind counts as 1 preflop". `legalActions` → mention the all-in amount
  and the already-acted rule.

### Rules and algorithms
For the seat to act (`player`), with `owe = currentBet − sc`, `maxTo = sc + stack`, `fullTo = fullBetLevel + unit`:
- `to = min(fullTo, maxTo)`.
- `canAggress = betCount < STREET_BET_CAP && !player.hasActed && maxTo > currentBet`.
- `owe > 0` → `fold`, `call min(owe, stack)`, and `raise to` if `canAggress`.
- `owe == 0 && currentBet > 0` (big-blind option) → `check`, and `raise to` if `canAggress`.
- `currentBet == 0` → `check`, and `bet to` if `canAggress`.
- In `applyAction`, for a bet/raise to `amount`: `counted = 2 * (amount − fullBetLevel(before)) >= unit`.
  `currentBet = amount` always. `betCount += 1` only if counted. Other unfolded seats' `hasActed` is cleared only if
  counted. The actor's `hasActed = true` and `allIn` as today.
- An uncounted (< half) bet/raise is always all-in: legal amounts below `fullTo` are only offered when
  `maxTo < fullTo`.
- Checker size clause: a `bet` is valid iff `currentBet === 0` and (`amount === unit` or (`amount < unit` and
  `amount === sc + stack`)). A `raise` is valid iff `amount === level + unit` or (`currentBet < amount < level + unit`
  and `amount === sc + stack`), where `level` is the checker's own derivation for `before`.
- Checker bet-cap: per street, count the big-blind record plus each counted bet/raise (same `2 × increment ≥ unit`
  test against that street's running level). The message is unchanged (`<street> has <n> bets (at most 4)`).

Worked examples. Stakes $2/$4 blinds, $4/$8 limits. Seats 1–6, button 1 (SB 2, BB 3). Identity deck. Preflop
`LIMP_6` = 4 call 4, 5 call 4, 6 call 4, 1 call 4, 2 call 2, 3 check: every seat has $4 in and the pot is $24.
The flop opens at seat 2 with `currentBet 0`, `betCount 0`. All stacks are $160 except the one named, and that
seat's starting stack is its flop stack + $4. Below, "sc" = streetContribution and "lvl" = fullBetLevel.

- **AC#1** (seat 4 starts $9 → $5 on the flop): 2 bet 4 (cb 4, bc 1, lvl 4). 3 call 4. Seat 4: owe 4, maxTo 5,
  fullTo 8, so legal `[fold, call 4, raise 5]`. 4 raise 5: added 5, stack 0, allIn. 2×(5−4)=2 < 4, not counted:
  cb 5, bc 1, lvl 4, and seats 2 and 3 keep `hasActed true`. Seat 5 (not acted): `[fold, call 5, raise 8]`. 5 call 5,
  6 call 5, 1 call 5. Seat 2 to act (sc 4, hasActed): **`[fold, call 1]`**. `raise 9` and `raise 8` are rejected
  `illegal-action`. 2 call 1 → seat 3: `[fold, call 1]`. 3 call 1 → street `turn`, `toAct 2`, `betCount 0`, one pot
  of $54.
- **AC#2 / AC#6** (seat 4 starts $10 → $6): 2 bet 4, 3 call 4. Seat 4: **`[fold, call 4, raise 6]`**. `raise 8` is
  rejected (`illegal-action`, state unchanged). 4 raise 6: 2×(6−4)=4 ≥ 4, counted: cb 6, **bc 2**, lvl 6, and seats 2
  and 3 have `hasActed` cleared. Seat 5: `[fold, call 6, raise 10]`. 5/6/1 call 6. Seat 2 (sc 4): **`[fold, call 2,
  raise 10]`**. 2 raise 10 → bc 3, cb 10. Seat 3 (sc 4): `[fold, call 6, raise 14]`.
- **AC#3** (seat 4 starts $14 → $10): 2 bet 4 (bc 1, lvl 4). Seat 3: `[fold, call 4, raise 8]`. 3 raise 8 (bc 2,
  lvl 8). Seat 4: `[fold, call 8, raise 10]` (fullTo 12 > maxTo 10). 4 raise 10: 2×2=4 ≥ 4, counted: **bc 3**, lvl 10,
  allIn. Seat 5: `[fold, call 10, raise 14]`. 5 raise 14: **bc 4** (the fourth bet), lvl 14. Seat 6: **`[fold, call
  14]`**. `raise 18` is rejected `illegal-action`. 6 call 14. Seat 1: `[fold, call 14]`. 1 call 14. Seat 2 (sc 4):
  `[fold, call 10]`. 2 call 10. Seat 3 (sc 8): `[fold, call 6]`. 3 call 6 → `turn`. The flop records are bet 4,
  raise 8, raise 10, raise 14: four counted bets.
- **AC#4** (seat 3 starts $9 → $5; seat 4 $160): 2 bet 4. Seat 3: `[fold, call 4, raise 5]`. 3 raise 5: not counted
  (bc 1, cb 5, lvl 4), allIn. Seat 4 (not acted): **`[fold, call 5, raise 8]`**. 4 raise 8: counted, bc 2, cb 8, lvl
  8, seat 2's `hasActed` cleared. Seat 5: `[fold, call 8, raise 12]`. 5/6/1 call 8. Seat 2 (sc 4): `[fold, call 4,
  raise 12]`.
- **AC#5** (seat 4 starts $7 → $3): 2 check, 3 check. Seat 4: **`[check, bet 3]`**. `bet 4` is rejected
  `illegal-action`. 4 bet 3: 2×3=6 ≥ 4, counted: bc 1, cb 3, lvl 3, seats 2 and 3 have `hasActed` cleared, seat 4
  allIn. Seat 5: `[fold, call 3, raise 7]`. 5/6/1 call 3. Seat 2: `[fold, call 3, raise 7]`.
- **AC#7** (seat 4 starts $8 → $4): 2 bet 4, 3 call 4. Seat 4: owe 4, maxTo 4, not > cb 4, so **`[fold, call 4]`**.
  `raise 8` is rejected. 4 call 4 → seat 4 `allIn true`, stack 0.
- **Short bet under half** (seat 4 starts $5 → $1): 2 check, 3 check. Seat 4: `[check, bet 1]`. 4 bet 1: 2×1 < 4,
  not counted: bc 0, cb 1, lvl 0, and seats 2 and 3 keep `hasActed true`. Seat 5: `[fold, call 1, raise 4]` (the A-3
  completion). (a) 5/6/1 call 1 → seat 2: `[fold, call 1]` → 2 call 1 → seat 3: `[fold, call 1]`. (b) Instead, 5
  raise 4 → bc 1, cb 4, lvl 4, all cleared. Seat 6: `[fold, call 4, raise 8]`. 6/1 call 4. Seat 2: `[fold, call 4,
  raise 8]`.
- **Cumulative (A-1)** (seat 3 starts $9 → $5; seat 4 starts $10 → $6): 2 bet 4. 3 raise 5 (not counted, bc 1,
  cb 5). Seat 4: `[fold, call 5, raise 6]`. 4 raise 6: 2×(6−4)=4 ≥ 4, counted: bc 2, cb 6, lvl 6, seat 2 cleared.
  Seat 5: `[fold, call 6, raise 10]`. 5/6/1 call 6. Seat 2 (sc 4): `[fold, call 2, raise 10]`.
- **Turn threshold, big bet $8** (seat 4 flop stack after a checked-around flop: starts $15 → turn $11, or $16 → $12).
  Preflop `LIMP_6`, flop 2/3/4/5/6/1 check. Turn: 2 bet 8, 3 call 8. With $11, seat 4 `[fold, call 8, raise 11]`;
  4 raise 11: 2×3=6 < 8, not counted (bc 1). Seat 5 `[fold, call 11, raise 16]`. 5/6/1 call 11. Seat 2 (sc 8):
  `[fold, call 3]`. With $12, seat 4 `[fold, call 8, raise 12]`; 4 raise 12: 2×4=8 ≥ 8, counted (bc 2). Seat 5
  `[fold, call 12, raise 20]`. 5/6/1 call 12. Seat 2: `[fold, call 4, raise 20]`.
- **Odd unit** (stakes $1/$2 blinds, $5/$10 limits; seats 1–3, button 1, so SB 2, BB 3, preflop opens at seat 1):
  1 call 2, 2 call 1, 3 check. Flop: 2 bet 5 (lvl 5). Seat 3 flop stack $7 (starts $9): `[fold, call 5, raise 7]`.
  3 raise 7: 2×2=4 < 5, not counted (bc 1). Seat 1: `[fold, call 7, raise 10]`. 1 call 7. Seat 2 (sc 5): `[fold,
  call 2]`. With flop stack $8 (starts $10): 3 raise 8: 2×3=6 ≥ 5, counted (bc 2, lvl 8). Seat 1: `[fold, call 8,
  raise 13]`. 1 call 8. Seat 2: `[fold, call 3, raise 13]`.
- **Preflop, blinds not yet acted** (seat 4 starts $5): seat 4: owe 4, maxTo 5 → `[fold, call 4, raise 5]`. 4 raise
  5: not counted (bc 1, cb 5). Seat 5: `[fold, call 5, raise 8]`. 5/6/1 call 5. Seat 2 (SB, sc 2): `[fold, call 3,
  raise 8]`. 2 call 3. Seat 3 (BB, sc 4): `[fold, call 1, raise 8]`.
- **Short raise one below the cap** (seat 5 starts $17 → $13): 2 bet 4, 3 raise 8, 4 raise 12 (bc 3, lvl 12). Seat
  5: `[fold, call 12, raise 13]`. 5 raise 13: not counted (bc 3, cb 13). Seat 6: `[fold, call 13, raise 16]`. 6 raise
  16 → bc 4. Seat 1: `[fold, call 16]`. The flop has five bet/raise records (4, 8, 12, 13, 16), `betCount` 4, and
  `checkState` returns `[]`.

### Error handling and configuration
- Unchanged: anything outside the legal set is rejected with `illegal-action` and the input state is untouched
  (`hand.ts:502-505`). No new error codes, messages or configuration.

## 6. Behaviour specification

### SPEC-01: An all-in raise under half a bet doesn't reopen betting for the bettor
- Verifies: AC#1
- Behaviour: Given the §5 AC#1 script (seat 4 has $5 on the flop at $4/$8; 2 bet 4, 3 call 4, 4 raise 5, 5/6/1 call
  5), When action returns to seat 2, Then `toAct` is 2, `currentBet` 5, `betCount` 1, and `legalActions` equals
  exactly `[{seat:2,type:'fold'},{seat:2,type:'call',amount:1}]`. `applyAction` with `raise 9` and with `raise 8`
  each returns `ok:false` with code `illegal-action`. After 2 call 1, seat 3's set is exactly `[fold, call 1]`.
- Verification: acceptance `tests/engine/short-all-in.acceptance.test.ts::AC#1 an all-in raise to $5 over a $4 bet lets seat 2 only call $1 or fold`

### SPEC-02: An all-in raise of half a bet counts and reopens betting
- Verifies: AC#2
- Behaviour: Given the §5 AC#2 script (seat 4 has $6; 2 bet 4, 3 call 4, 4 raise 6, 5/6/1 call 6), When action
  returns to seat 2, Then `betCount` is 2, `currentBet` 6, and seat 2's legal set equals exactly `[fold, call 2,
  raise 10]`. After 2 raise 10, `betCount` is 3.
- Verification: acceptance `tests/engine/short-all-in.acceptance.test.ts::AC#2 an all-in raise to $6 over a $4 bet lets seat 2 call, fold or raise to $10`

### SPEC-03: A counted half-bet all-in counts toward the cap
- Verifies: AC#3
- Behaviour: Given the §5 AC#3 script (seat 4 has $10; 2 bet 4, 3 raise 8, 4 raise 10, 5 raise 14), Then
  `betCount` is 3 after seat 4's all-in and 4 after seat 5's raise. Seat 5's set before raising is exactly `[fold,
  call 10, raise 14]`. When action reaches seat 6, seat 6's set equals exactly `[fold, call 14]`, and `raise 18` is
  rejected `illegal-action`.
- Verification: acceptance `tests/engine/short-all-in.acceptance.test.ts::AC#3 a $10 all-in after a raise to $8 is the third bet, so after a raise to $14 seat 6 may only call $14 or fold`

### SPEC-04: A player who hasn't acted may raise a short all-in to the full level
- Verifies: AC#4
- Behaviour: Given the §5 AC#4 script (seat 3 has $5; 2 bet 4, 3 raise 5), When seat 4 is to act, Then
  `betCount` is 1, `currentBet` 5, and seat 4's set equals exactly `[fold, call 5, raise 8]`. After 4 raise 8,
  `betCount` is 2.
- Verification: acceptance `tests/engine/short-all-in.acceptance.test.ts::AC#4 seat 4, not yet acted, may fold, call $5 or raise to $8 over a $5 all-in`

### SPEC-05: A short stack with no bet facing may bet all-in
- Verifies: AC#5
- Behaviour: Given the §5 AC#5 script (seat 4 has $3; 2 check, 3 check), When the engine lists seat 4's actions,
  Then they equal exactly `[{seat:4,type:'check'},{seat:4,type:'bet',amount:3}]`, and `bet 4` is rejected
  `illegal-action`. Applying `bet 3` leaves seat 4 with `stack 0`, `allIn true`, and a last record `{street:'flop',
  seat:4, type:'bet', amount:3, added:3}`.
- Verification: acceptance `tests/engine/short-all-in.acceptance.test.ts::AC#5 a $3 stack with no bet facing may check or bet all-in $3`

### SPEC-06: A stack above the call but below a raise may raise all-in
- Verifies: AC#6
- Behaviour: Given the §5 AC#2/AC#6 prefix (seat 4 has $6; 2 bet 4, 3 call 4), When the engine lists seat 4's
  actions, Then they equal exactly `[fold, call 4, raise 6]`. `applyAction(state, raise 8)` returns `ok:false` with
  `illegal-action`, and `state` deep-equals a `structuredClone` taken before the call. Applying `raise 6` leaves seat
  4 with `stack 0`, `allIn true`, and a last record `{street:'flop', seat:4, type:'raise', amount:6, added:6}`.
- Verification: acceptance `tests/engine/short-all-in.acceptance.test.ts::AC#6 a $6 stack facing a $4 bet may fold, call $4 or raise all-in to $6, and a raise to $8 is illegal`

### SPEC-07: A stack equal to the call gets no raise
- Verifies: AC#7
- Behaviour: Given the §5 AC#7 prefix (seat 4 has exactly $4; 2 bet 4, 3 call 4), When the engine lists seat 4's
  actions, Then they equal exactly `[fold, call 4]`, and `raise 8` and `raise 4` are rejected `illegal-action`.
  After `call 4`, seat 4 has `stack 0` and `allIn true`.
- Verification: acceptance `tests/engine/short-all-in.acceptance.test.ts::AC#7 a $4 stack facing a $4 bet may only fold or call $4 all-in`

### SPEC-08: Short all-in bets — counted at half, completion under half
- Verifies: AC#5, AC#1
- Behaviour: Given the §5 AC#5 continuation, After 4 bet 3, `betCount` is 1 and seat 5's set is `[fold, call 3,
  raise 7]`; after 5/6/1 call 3, seat 2's set is `[fold, call 3, raise 7]`. Given the §5 "short bet under half"
  script (seat 4 has $1), seat 4's set is `[check, bet 1]`. After 4 bet 1, `betCount` is 0, `currentBet` 1, and seat
  5's set is `[fold, call 1, raise 4]`. Path (a): after 5/6/1 call 1, seat 2's set is `[fold, call 1]`. Path (b):
  after 5 raise 4, `betCount` is 1, and after 6/1 call 4, seat 2's set is `[fold, call 4, raise 8]`.
- Verification: unit `tests/engine/short-all-in.test.ts::short all-in bets count at half a bet and can be completed under half`

### SPEC-09: Cumulative short all-ins are measured from the last full level
- Verifies: AC#2, AC#4
- Behaviour: Given the §5 "Cumulative (A-1)" script, Then seat 4's set is `[fold, call 5, raise 6]`. After 4 raise
  6, `betCount` is 2 and seat 5's set is `[fold, call 6, raise 10]`. After 5/6/1 call 6, seat 2's set is `[fold, call
  2, raise 10]`.
- Verification: unit `tests/engine/short-all-in.test.ts::two short all-ins that together reach half a bet count as a raise`

### SPEC-10: The half-bet threshold on the turn and with an odd unit
- Verifies: AC#1, AC#2
- Behaviour: Given the §5 "Turn threshold" scripts, Then +$3 on an $8 street is not counted (seat 2 later gets
  `[fold, call 3]`), and +$4 is counted (`betCount` 2; seat 2 later gets `[fold, call 4, raise 20]`). Given the §5
  "Odd unit" scripts at $5/$10, Then +$2 is not counted (seat 2 later gets `[fold, call 2]`), and +$3 is counted
  (`betCount` 2; seat 1 gets `[fold, call 8, raise 13]`, seat 2 later gets `[fold, call 3, raise 13]`).
- Verification: unit `tests/engine/short-all-in.test.ts::half a bet is measured as twice the increment against the unit on every street`

### SPEC-11: Blinds and the cap with short all-ins
- Verifies: AC#3, AC#4
- Behaviour: Given the §5 "Preflop, blinds not yet acted" script, Then seat 4's set is `[fold, call 4, raise 5]`.
  After 4 raise 5, `betCount` is 1. Seat 2 (SB) gets `[fold, call 3, raise 8]`, and seat 3 (BB) gets `[fold, call 1,
  raise 8]`. Given the §5 "Short raise one below the cap" script, Then seat 5's set is `[fold, call 12, raise 13]`.
  After 5 raise 13, `betCount` is 3 and seat 6's set is `[fold, call 13, raise 16]`. After 6 raise 16, `betCount` is
  4 and seat 1's set is `[fold, call 16]`.
- Verification: unit `tests/engine/short-all-in.test.ts::blinds may raise over a short preflop all-in and an uncounted all-in leaves room for the fourth bet`

### SPEC-12: The checker accepts short all-ins and counts only counted bets
- Verifies: AC#3, DoD#6
- Behaviour: Given every step of the SPEC-01..07 and SPEC-11 scripts, Then `checkStep({before, action, result})`
  returns `[]`. Given the end state of the "Short raise one below the cap" script (five flop bet/raise records,
  `betCount` 4), Then `checkState` returns `[]`. Given that state with one more record `{street:'flop', seat:1,
  type:'raise', amount:20, added:0}` appended to `actions`, Then `checkState` returns exactly `[{invariant:'bet-cap', message:'flop has 5 bets (at most
  4)'}]`.
- Verification: unit `tests/engine/short-all-in.test.ts::the invariant checker accepts short all-ins and does not count them toward the cap`

### SPEC-13: Random short-stack hands obey the rule and every invariant
- Verifies: AC#1, AC#4, AC#5, AC#6, AC#7, DoD#1
- Behaviour: Given 20,000 hands (A-5: seed `20261121`, 2–10 seats, stacks $5..$40, random button, uniformly random
  legal action), When each step is applied, Then:
  - `checkStep` returns `[]` and `applyAction` never rejects;
  - every hand completes in ≤ 400 actions, and the table's chip total is conserved;
  - `betCount ≤ 4` throughout;
  - whenever the seat to act has `hasActed === true` and owes chips, the legal set has no `bet`/`raise`;
  - every offered `bet`/`raise` amount is either `fullBetLevel + unit` or exactly `streetContribution + stack`;
  - stack ≤ owe never offers bet/raise.
  Counters for uncounted all-ins (`betCount` unchanged after a bet/raise), short all-in bets, "already acted, may
  only call/fold" decisions and completions (raise with `betCount` 0) are each ≥ 1. The test computes its own level
  from the records, as in §5.
- Verification: acceptance `tests/engine/short-all-in.property.test.ts::20,000 random short-stack hands follow the half-bet rule and pass every invariant`

### SPEC-14: Checks pass and the playtest baseline is byte-identical
- Verifies: DoD#1, DoD#2, DoD#4, DoD#5, DoD#6, DoD#10
- Behaviour: Given the change, When `npm run lint`, `npm run typecheck` and `npm test` run, Then each exits 0
  (coverage thresholds included, the existing boundary tests pass, and every locked test file is byte-unchanged).
  When `npm run playtest -- --hands 10000 --seed 42 --size 6` runs, Then it exits 0 with `Ended by fold: 5470`,
  `Ended at showdown: 4530`, `Player actions: 88831`, `Streets capped at 4 bets: 244`, `Largest pot: $70`,
  `Invariant violations: 0`. CI on `doit/TASK-1.14` is green.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run playtest -- --hands 10000 --seed 42 --size 6`

### SPEC-15: Story documentation and N/A DoD items
- Verifies: DoD#3, DoD#7, DoD#8, DoD#9, DoD#11, DoD#12
- Behaviour: Given the task is done, Then a Backlog doc describes the half-bet rule, the all-in amounts, the
  already-acted rule, A-1..A-4 and the checker change. The N/A items are recorded as such: DoD#3 (golden-spot suite
  not yet created), DoD#7 and DoD#12 (no screen added or changed), DoD#8 (no network code touched) and DoD#9 (no
  strategy content).
- Verification: manual `backlog doc list --plain` shows the TASK-1.14 doc; `git diff --stat main` touches no `src/ui`, `src/table`, `e2e` or chart file

## 7. Edge cases
- Stack < owe → call all-in only (unchanged; TASK-1.9 locked tests) and covered in SPEC-13.
- Stack == owe → SPEC-07.
- owe < stack < full raise → SPEC-06, SPEC-01, SPEC-02.
- Exactly half (boundary) → SPEC-02 ($2 of $4), SPEC-10 ($4 of $8). Just under half → SPEC-01, SPEC-10. Odd unit → SPEC-10.
- Short bet with nothing facing, counted and uncounted → SPEC-05, SPEC-08.
- Several short all-ins on one street → SPEC-09 (A-1).
- Short all-in at `betCount` 3 → SPEC-11. A full raise that exactly empties the stack → counted (existing
  `hand.test.ts` `exactRaise`).
- Preflop, unacted blinds → SPEC-11. Heads-up → SPEC-13 (2 seats included).
- Round end and turn order after an uncounted all-in → SPEC-01 (seat 3 then the turn).
- All-in blinds: N/A (`createHand` floor `bigBlind + 1`; TASK-1.16).
- Concurrency, permissions, dependency failure: N/A (pure synchronous functions).

## 8. Security considerations
- Trust boundary: `applyAction` stays the single gate. It still accepts only exact members of `legalActions`, so
  the new amounts can't be abused (SPEC-06 rejects `raise 8` and leaves the state unchanged).
- Authn/authz, secrets, injection, logging, sensitive data: N/A. New dependencies: none.
- Randomness: tests use the existing seeded `Xoshiro128` for reproducibility. Dealing and fairness are unchanged.

## 9. Non-functional
- `fullBetLevel` is O(records on the street) (≤ ~25) per call. The 10,000-hand playtest's run time stays
  comparable (it already calls `legalActions` per action).
- SPEC-13 runs in under 10 s under coverage (measured ≈1.0 s without coverage on the prototype).
- Engine coverage stays ≥ 90% lines. The playtest stays byte-identical (SPEC-14).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 10000 --seed 42 --size 6`
- New tests (path → SPEC ids):
  - `tests/engine/short-all-in.acceptance.test.ts` → SPEC-01..07
  - `tests/engine/short-all-in.test.ts` → SPEC-08..12
  - `tests/engine/short-all-in.property.test.ts` → SPEC-13
  - `tests/engine/hand.test.ts` → D-3 assertion update (existing test "all-in flags, floor and actor order")
- End-to-end scenario for the Judge:
  1. `npm run playtest -- --hands 10000 --seed 42 --size 6` → exit 0 and the exact §3 baseline numbers; also
     `--size 2` and `--size 10` → `Invariant violations: 0`.
  2. Before and after the change, compare `npm run playtest -- --hands 10000 --seed 42 --size 2` with `main`'s
     output → byte-identical.
  3. `npm test` → all pass. `python3 ~/.claude/skills/doit/scripts/doit.py test-integrity TASK-1.14` → no locked
     file changed.
  4. Optionally, in a Vitest scratch test, replay the §5 AC#1 script and print `legalActions` for seat 2 →
     `[fold, call 1]`.

## 11. Open questions
- None.

## 12. Clarifications log
See `doit/TASK-1.14/qa.md`.
