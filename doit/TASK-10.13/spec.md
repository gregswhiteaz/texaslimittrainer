# Spec: TASK-10.13 — Decide how a forced fold of the top bettor is settled (dead money vs refund)

Status: READY (approved 2026-11-26)
Task: TASK-10.13 · Parent/epic: TASK-10 · Requirements: REQ-004 (004.7, 004.8), REQ-018 (018.4, 018.5) · Dream: limit-holdem-trainer

## 1. Summary
When Leave table force-folds the user (TASK-10.2), today's `forceFold` keeps the user's bet as the amount the
others must match, and if only one seat is left it gives the uncalled part back to the user. The user chose
option (a), forfeit (Q-1), with a dead-big-blind floor preflop (Q-2). Every chip the
leaver put in stays in the pot as dead money and is never returned. If the leaver held the top bet, the amount
to match drops to the highest bet still live, and bet sizes and the bet cap follow that lower level. The task
also makes several forced folds in one hand keep `checkState` clean (J-1-02), with a property test. It also
makes the bot-freeze e2e check wait for worker replies instead of passing on timing.

## 2. Scope
- In scope:
  - `src/engine/hand.ts`: `forceFold` applies the dead-money rule (§5 R1–R4). `gather` never returns chips to
    a folded seat. `fullBetLevel` ignores voided bet levels.
  - `src/engine/invariants.ts`: the independent checker follows the same rule. Bet levels are void-aware, the
    uncalled part is computed per street and only for a live seat, pot layers are matched without capping
    dead money, and a fold-out to a sole survivor who put in $0 is allowed (J-1-02).
  - New tests: `tests/engine/force-fold-top-bet.acceptance.test.ts` (AC#2) and
    `tests/engine/force-fold.property.test.ts` (AC#3, normal suite).
  - Locked edit (owner TASK-10.2, Q-4): `e2e/leave-mid-hand.spec.ts` bot-freeze check (AC#4).
  - Docs: `docs/ui/navigation.md` records the decision (AC#1), and its Tests list gains the TASK-10.2 and
    TASK-10.13 test files (TASK-10.2 NIT).
  - Requirements text (Q-3 yes): REQ-004.8 and REQ-018.4 wording plus changelog row 1.15 in
    `dreams/limit-holdem-trainer/requirements.md`.
  - Orchestrator at finish (CLI only): record the Q-1..Q-4 answers in the TASK-10.13 implementation notes
    (AC#1).
- Not doing:
  - Any change to `applyAction`, `createHand`, `legalActions`' signature, `BetContext`, `PlayerView` or the
    hand-record format. Under normal play (no forced fold of a strict top bettor) engine output stays
    byte-identical.
  - Changing bot or advice logic. The preflop situation classifier still counts a voided raise in the history
    (A-2).
  - Forcing folds of bots, or more than one forced fold per hand, in the product. Only the engine supports it,
    and the property test pins it.
  - Changing the dialog, the freeze, the leaving flow, grading or stats. The TASK-10.2 NITs other than the
    navigation.md Tests list (`|| leaving`, `userMade` placement) stay open.
  - Editing `tests/engine/force-fold.acceptance.test.ts` (locked, TASK-10.2). It still passes unchanged
    (prototype run, §3).
- Scope budget: files=8, lines=650

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | When a void lowers the amount to match, live seats' `hasActed` is recomputed from the street's history. A seat counts as having acted if it has a non-blind record at or after the last surviving counted bet (R3). A limper is therefore not asked again after the raise over it is voided. | yes | This plays the street as if the voided bet had never been made. With a plain reset, players who already acted would get an extra turn, and a limper could raise again. | Leave `hasActed` as it is, so a limper would get one extra turn. |
| A-2 | Bots and advice keep reading the history as is. `situationOf` (`src/advice/preflop.ts:104-118`) still counts a voided raise, so a bot may use its "facing a raise" chart cell while only the big blind is to call. Legal actions and owed chips come from `currentBet`, so every bot action stays legal. | yes | The user has left and cannot see these decisions. Changing advice is outside this task. | Filter voided records out of `situationOf` (a follow-up). |
| A-3 | An all-in call recorded below a voided raise stays a call. It is never turned into a raise after the void, so bet levels come only from `bet`/`raise` records. | yes | This is the existing level rule (REQ-016.5). It cannot change an amount to match, which comes from contributions. | Treat an all-in of at least half a bet over the new level as a counted raise. |
| A-4 | J-1-02 is fixed in the checker, not by rejecting forced folds. A fold-out winner who put in $0 is valid when it is the only seat left with cards, because it wins dead blinds. | yes | The break in J-1-02 comes from an ordinary fold after the forced folds, so there is no forced fold to reject. Dead blinds won by the last player are normal poker. | Make `forceFold` throw when it would leave only seats with $0 in. That case is reachable only through later ordinary folds, so the throw would not prevent it. |
| A-5 | The checker's uncalled-bet rule (C5) and pot-structure matching are worked out from the records of the last betting street. They no longer use hand totals. | yes | Dead money on an earlier street breaks the totals shortcut. Example: seat A raises to $8 preflop and is force-folded, B and C call $4, B bets $4 on the flop and C folds. B is owed $4 back. The totals rule says $0, because A and B both have $8 in. | Keep totals and subtract dead money per street (more code, same result). |
| A-6 | New tests go in new files rather than in the locked `force-fold.acceptance.test.ts`. | yes | That file needs no change. | Unlock and extend it. |
| A-7 | No record or stats change. A left hand's `result.returned` is absent when the user held the top bet, so `netResult` (`src/table/review.ts:189-197`) gives the user −(all chips put in). The report's cash result, BB/100 and the stored record follow from that. Earlier decisions in the hand were graded when they were made, and the forced fold is still never graded. | yes | The record stores the engine result as is (`src/table/hand-record.ts:352-372`, shape-only). | — |
| A-8 | The e2e worker-traffic counter (posts and replies) is an init script defined in `e2e/leave-mid-hand.spec.ts`, modelled on `countWorkerPosts` in `e2e/rapid-pace.spec.ts:67-75`. | yes | It keeps the locked edit inside one file. | Add it to `e2e/support/paused-clock.ts`. |

## 3. Current system
- `forceFold` (`src/engine/hand.ts:702-727`) marks the seat folded and gives it `hasActed: true`. It drops the
  seat from every pot's `eligible` and appends `{type:'fold', amount:0, added:0}`, then calls `settle`
  (`hand.ts:679-694`). It never changes `currentBet` or `betCount`, so the next seat still faces the folded
  seat's bet (J-1-01).
- `gather` (`hand.ts:411-441`) returns `top − second` of the street contributions to the top seat without
  checking whether that seat has folded. That is the refund to the leaver. `foldOut` (`hand.ts:478-499`) and
  `endRound` (`hand.ts:558-608`) both use it.
- `legalActions` (`hand.ts:348-370`): owed chips come from `currentBet`, the raise target from
  `fullBetTarget` = `fullBetLevel` + one unit (`hand.ts:321-340`), and the cap from `betCount`
  (`STREET_BET_CAP` 4). `fullBetLevel` walks the street's `actions` only (`BetContext`, `hand.ts:313`).
  `PlayerView` satisfies `BetContext` and `src/table/action-bar.ts:61` calls `fullBetTarget(view)`.
- Checker (`src/engine/invariants.ts`): `countedBets` (68-86) is used for the bet-cap invariant (217-230) and
  for legal sizes (`legalActionMessage` 105). `returnedMessage` (C5, 188-213) works from hand totals.
  `potEligibilityMessage` (232-270) rejects any winner with `totalContribution <= 0` (265), which is J-1-02.
  `potStructureMessage` (277-328) caps matched chips at the second-highest total.
- Evidence (scratchpad probe, 20,000 random 6-max hands, a forced fold at random points at 15% per step, several per
  hand):
  - With today's code, the only `checkState` violation is `main pot paid seat N, which is not eligible`, 57
    times. Every time the winner had $0 in, the hand ended by fold and it was preflop.
  - 6,460 forced folds held a strict top bet, 3,189 left the others facing the folded bet, and 2,580 refunded
    the folded seat.
- Prototype of this spec's rule (scratchpad copies of `hand.ts`/`invariants.ts`):
  - 36,569 forced folds gave 0 `checkStep`/`checkDeal` violations.
  - Over 20,000 hands without a void, `applyAction` output and checker output were byte-identical to today.
  - The existing suites under `tests/engine`, `tests/table`, `tests/playtest`, `tests/bots`, `tests/golden`,
    `tests/advice`, `tests/stats` and `tests/storage` all pass against it (1167 passed, 50 skipped, locked
    files included). So no locked test needs re-pinning except the AC#4 e2e edit.
- Only caller: `foldUserToLeave` (`src/table/session.ts:497-504`), once per hand for the user seat.
- Bots read `view.currentBet` for owed chips (`src/bots/rock.ts:26`, `calling-station.ts:39`, `style.ts:452`,
  `src/advice/preflop.ts:141`, `postflop.ts:127`), and `playerView` copies `currentBet`, `betCount` and
  `hasActed` (`src/engine/player-view.ts:85-96`). Bots therefore see the lowered amount to match with no view
  change.
- e2e freeze: `useTableSession.ts:218` returns early while `paused`, and the bot timer plus worker request are at
  `useTableSession.ts:227-243`. The check at `e2e/leave-mid-hand.spec.ts:134-137` is one `runFor(1000)` and an
  immediate read. A broken freeze would post a request whose real-time reply lands after the read, so the
  check passes anyway (code review MINOR, doc-125).
- Tests: `npm test` runs every vitest file, including `*.property.test.*`. The opt-in slow group is
  `npm run test:slow` (`TLH_SLOW_TESTS=1`). It is for speed and scale checks only, and none are added here.
  Playwright runs `chromium` and `webkit` (`playwright.config.ts:13-15`).
- Existing code to reuse:
  - `src/engine/hand.ts` `clockwiseAfter`, `settle`, `betUnit`, `buildPots` → reuse; no new settling path.
  - `src/engine/seeded-random.ts` `Xoshiro128` and the deal/choose pattern of
    `tests/engine/side-pots.property.test.ts:16-35` → the property test's generator.
  - `src/engine/invariants.ts` `checkStep`, `checkDeal` (checkState + C5 on a completed hand) → property-test
    assertions.
  - `e2e/rapid-pace.spec.ts:67-75` `countWorkerPosts` → pattern for the worker-traffic counter.
  - `e2e/support/paused-clock.ts` `runUntil` → unchanged helper.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Settlement rule for a forced fold: (a) forfeit, with the amount to match dropping to the highest live bet. | (b), (c) | Standard rule for a player who abandons a hand. No one has to call a player who is no longer in it. | yes | user (Q-1) |
| D-2 | Under (a), voiding also lowers the bet level and `betCount` to the surviving bets, and recomputes `hasActed` (R2, R3). | Lower only `currentBet` | If the level is not lowered, the next raise would jump two bets ($4 to call, raise to $12). A void is only consistent if the street plays as if the voided bet never happened. | no | n/a |
| D-3 | Preflop, the amount to match never drops below the big blind, even when the big blind is the leaver (dead big blind). | Drop to the highest live contribution (the small blind's $2, or $0) | Dead-blind convention: a posted big blind sets the price even when its owner's hand is dead. | yes | user (Q-2) |
| D-4 | The decision is recorded in the TASK-10.13 notes (orchestrator, CLI) and in `docs/ui/navigation.md`. REQ-004.8 and REQ-018.4 are reworded with changelog row 1.15 (Q-3). | Docs only | REQ-018.4 ("any bet that no other player called is returned to the bettor") contradicts (a) for a leaver as written. | yes | user (Q-3) |
| D-5 | Locked edit of `e2e/leave-mid-hand.spec.ts` (owner TASK-10.2) for AC#4 only. The freeze assertion is not loosened: it gains a wait and a second clock advance. | Leave the flaky check | AC#4 names this file and line. | yes | user (Q-4) |

## 5. Design

### Files to create / modify
- `src/engine/hand.ts` — dead-money rule in `forceFold`, `gather`, `fullBetLevel` (R1–R5); doc comments for
  `currentBet` and `forceFold`.
- `src/engine/invariants.ts` — void-aware `countedBets`, street-based uncalled part (C5 and pot structure),
  sole-survivor exemption for P5 (R6).
- `tests/engine/force-fold-top-bet.acceptance.test.ts` — new; SPEC-02..SPEC-06.
- `tests/engine/force-fold.property.test.ts` — new; SPEC-07.
- `e2e/leave-mid-hand.spec.ts` — locked edit (Q-4); SPEC-08.
- `docs/ui/navigation.md` — decision bullet and Tests list; SPEC-01.
- `dreams/limit-holdem-trainer/requirements.md` — REQ-004.8, REQ-018.4 wording and changelog row 1.15 (Q-3); SPEC-01.

### Components, interfaces and data
- No exported signature changes. `HandState`, `PlayerState`, `ActionRecord`, `PlayerView`, `BetContext`,
  `HandResult` and the hand record are unchanged. The history is unchanged too: a forced fold still appends
  one `fold` record, and voided bets stay in `actions`.
- `HandState.currentBet` doc becomes: "The amount to match: the highest street contribution of a seat still in
  the hand. Preflop it is at least the big blind." In normal play this equals today's value.
- Private helper in `hand.ts` (name free, e.g. `liveLevels(state: BetContext): {level, at}[]`): the street's
  surviving counted bet levels in order, with the index of the record that set each (R2). `fullBetLevel`
  returns the last level, or 0.

### Rules and algorithms
Notation: *live* = not folded. *Live top* = max(street contribution of live seats, preflop ? `stakes.bigBlind`
: 0). The leaver is the seat passed to `forceFold`.

- R1 Void trigger. In `forceFold`, after marking the seat folded: if the leaver's `streetContribution` >
  live top, the leaver held a strict top bet and the hand is *voided down to live top*. Otherwise behaviour is
  today's, except R4.
- R2 Bet levels. The street's counted levels are found by walking `actions` on the current street:
  - `big-blind` pushes its `amount`.
  - A `bet`/`raise` pushes its `amount` when `2 × (amount − last level) ≥ unit` (as today).
  - A `fold` by seat s pushes nothing. If s's chips added on this street (sum of `added`) exceed the live top at
    that point, every level above the live top is popped. Here the live top uses the chips added by seats with
    no fold record anywhere in the hand, and the big-blind floor preflop.
  
  A normal `applyAction` fold always owes chips, so it never pops. The walk works on `BetContext` alone, so
  `fullBetTarget(view)` stays correct for any `PlayerView`. On a void, set `currentBet` = live top and
  `betCount` = number of surviving levels.
- R3 Who still acts. On a void, every live seat's `hasActed` = it has a non-blind record on this street at an
  index ≥ the index of the last surviving level (−1 when none survive). The leaver keeps `hasActed: true`.
  Then `settle` runs as today on the lowered state. If the round does not close, `toAct` is the first open seat
  clockwise, starting at the previous `toAct` (inclusive), that still has to act (`!hasActed ||
  streetContribution < currentBet`). If the leaver was to act, the search starts after it, as today. In the
  prototype this was always the previous `toAct`.
- R4 No refund to a folded seat. In `gather`, the uncalled part (top − second street contribution) is returned
  only when the top seat has not folded. Otherwise it stays in the pot (`buildPots` keeps it, because the last
  pot is uncapped). Dead money counts as calling up to its amount. Example: a live raise to $12 over a leaver's
  dead $8 returns $4.
- R5 Chips. Nothing else moves. The leaver's stack stays at start − `totalContribution`, and the leaver never
  appears in `awards` or `returned`. REQ-018.5 conservation holds.
- R6 Checker (independent re-statement, `invariants.ts`):
  - `countedBets` applies R2 with its own walk.
  - The uncalled part is due on the street of the last history record: top − second of the chips each seat
    added on that street. It is due only when that top seat has not folded. C5 compares `result.returned` with
    it, using the same messages as today.
  - Pot structure: during play the matched amount is the completed-street chips (no cap). On a completed hand
    the due seat's chips are reduced by the uncalled part.
  - P5: a winner with `totalContribution` 0 is valid only when `result.endedBy` is `'fold'` and it is the only
    live seat. The existing "P5 winner contributed nothing" case in `tests/engine/invariants.test.ts` keeps
    failing as before, because seat 2 is also live there.

Worked examples. Stakes $2/$4/$4/$8, seats 1–6 at $160, button 6 (SB 1, BB 2, UTG 3), any deck. All values
were computed with the prototype, and "today" is the current engine.
- E1, preflop raise then fold-out. Moves 3 raise 8, 4 fold, 5 fold, 6 fold, 1 fold, then `forceFold(3)`.
  - Rule (a): the hand ends by fold, award `{pot 0, amount 14, winner 2}`, no `returned`, stacks
    `158,170,152,160,160,160`.
  - Today: award $10, `returned {seat 3, amount 4}`, seat 3 at $156.
- E2, preflop raise, play goes on. Moves 3 call 4, 4 raise 8, 5 fold, 6 fold (seat 1 to act), then
  `forceFold(4)`.
  - Rule (a): `currentBet` 4, `betCount` 1, `toAct` 1, legal `fold`, `call 2`, `raise 8`, and `hasActed` is 1
    false, 2 false, 3 true.
  - Then 1 call 2 and 2 check close the round. Flop, pot `[{amount 20, eligible [1,2,3]}]`, stacks
    `156,156,156,152,160,160`.
  - Today: `currentBet` 8, seat 1 legal `fold`, `call 6`, `raise 12`.
- E3, flop bet, play goes on. Preflop 3 call 4, 4 call 4, 5 fold, 6 fold, 1 call 2, 2 check. Flop 1 check, 2
  check, 3 bet 4 (seat 4 to act), then `forceFold(3)`.
  - Rule (a): `currentBet` 0, `betCount` 0, `toAct` 4, legal `check`, `bet 4`, and `hasActed` is 1 true, 2
    true, 4 false.
  - Then 4 check closes the flop. Turn, pot `[{amount 20, eligible [1,2,4]}]`.
- E4, flop bet then fold-out. As E3, but after 3 bet 4 come 4 fold and 1 fold, then `forceFold(3)`.
  - Rule (a): award $20 to seat 2, no `returned`, stacks `156,176,152,156,160,160`.
  - Today: award $16, `returned {seat 3, amount 4}`.
- E5, big blind leaves, small blind alone. Moves 3, 4, 5, 6 fold, then `forceFold(2)`.
  - Rule (a): award $6 to seat 1, no `returned`, stacks `164,156,160,160,160,160`.
  - Today: award $4, `returned {seat 2, amount 2}`.
- E6, big blind leaves multiway (D-3 floor). Fresh deal, then `forceFold(2)`. Under rule (a) and today alike:
  `currentBet` 4, `toAct` 3, legal `fold`, `call 4`, `raise 8`.
- E7, voided raise on a capped street. Moves 3 raise 8, 4 raise 12, 5 raise 16, 6 fold, 1 fold, 2 fold (seat 3
  to act), then `forceFold(5)`.
  - Rule (a): `currentBet` 12, `betCount` 3, legal `fold`, `call 4`, `raise 16`, and seat 4 `hasActed` true.
  - Then 3 raise 16 is accepted. `betCount` 4, seat 4 to act with legal `fold`, `call 4`, and `checkState` is
    `[]`.
  - Today: `currentBet` 16, seat 3 legal `fold`, `call 8`.

### Error handling and configuration
- `forceFold`'s RangeErrors are unchanged (`Cannot force a fold: …` for a complete hand, a seat not dealt in, a
  folded seat or an all-in seat). No new errors and no configuration.

## 6. Behaviour specification

### SPEC-01: The decision is recorded in the task and in the navigation doc
- Verifies: AC#1
- Behaviour: Given the user's Q-1..Q-4 answers in qa.md, the decision is recorded as follows.
  - Given the user's Q-1..Q-4 answers in `doit/TASK-10.13/qa.md`, When the task finishes, Then the TASK-10.13
    implementation notes (orchestrator, `backlog task edit`) state the chosen rule with "Q-1".
  - `docs/ui/navigation.md`'s "Leave table during a hand" list gains this bullet (wording for (a) with the
    D-3 floor, as approved by Q-1 and Q-2):
    "- The forced fold forfeits every chip the user has put in. The chips stay in the pot and are never given
    back, even if no one called them. If the user held the top bet, the others need only match the highest bet
    of a player still in the hand (preflop, never less than the big blind), and later bets, raises and the
    four-bet cap count only the bets up to that amount (TASK-10.13 Q-1)."
  - Its `## Tests` list names `tests/engine/force-fold.acceptance.test.ts`,
    `tests/engine/force-fold-top-bet.acceptance.test.ts`, `tests/engine/force-fold.property.test.ts`,
    `tests/table/leave-mid-hand.acceptance.test.ts`, `tests/ui/leave-dialog.acceptance.test.tsx` and
    `e2e/leave-mid-hand.spec.ts`.
  - Per Q-3, REQ-004.8 gains the sentence "The forced fold forfeits the user's chips already in the pot;
    if the user held the top bet, the others need only match the highest bet still live (preflop at least the
    big blind)." REQ-018.4 reads "Any bet that no other player called is returned to the bettor before
    showdown, unless the bettor has been folded by Leave table (REQ-004.8)." Changelog row 1.15 dated the day
    of the build reads "TASK-10.13: REQ-004.8 forced fold forfeits chips; REQ-018.4 exception | User (TASK-10.13
    Q-3)".
- Verification: command `grep -n "TASK-10.13 Q-1" docs/ui/navigation.md && grep -n "force-fold.property.test.ts" docs/ui/navigation.md && backlog task view TASK-10.13 --plain | grep -n "Q-1"`

### SPEC-02: A preflop forced fold of the top raiser is dead money and lowers the amount to match
- Verifies: AC#2
- Behaviour: Given the E2 hand, When `forceFold(hand, 4)`, Then `currentBet` is 4, `betCount` is 1, `toAct` is
  1 and `legalActions` is exactly `[fold, call 2, raise 8]` for seat 1. Seat 4 is folded with stack 152 and
  `streetContribution` 8, and `checkState` is `[]`. When seat 1 calls 2 and seat 2 checks, Then the street is
  `flop`, `pots` is `[{amount: 20, eligible: [1, 2, 3]}]`, stacks are `156,156,156,152,160,160` and `checkState`
  is `[]`. Given E1, When `forceFold(hand, 3)`, Then the result is a fold-out with awards
  `[{pot: 0, amount: 14, winners: [{seat: 2, amount: 14}]}]`, `returned` is absent, stacks are
  `158,170,152,160,160,160` and `checkDeal` is `[]`.
- Verification: acceptance `tests/engine/force-fold-top-bet.acceptance.test.ts::a preflop raiser who leaves forfeits the raise and the others match the big blind`

### SPEC-03: A flop forced fold of the bettor reopens the street at no bet
- Verifies: AC#2
- Behaviour: Given the E3 hand, When `forceFold(hand, 3)`, Then `currentBet` is 0, `betCount` is 0, `toAct` is
  4, `legalActions` is `[check, bet 4]`, and seats 1 and 2 have `hasActed` true while seat 4 has it false. When
  seat 4 checks, Then the street is `turn` with `pots` `[{amount: 20, eligible: [1, 2, 4]}]`. Given E4, When
  `forceFold(hand, 3)`, Then seat 2 wins $20, `returned` is absent, stacks are `156,176,152,156,160,160` and
  `checkDeal` is `[]`.
- Verification: acceptance `tests/engine/force-fold-top-bet.acceptance.test.ts::a flop bettor who leaves forfeits the bet and the street goes on unbet`

### SPEC-04: A big blind that leaves is dead and still sets the preflop price
- Verifies: AC#2
- Behaviour: Given E5, When `forceFold(hand, 2)`, Then seat 1 wins $6 with no `returned` and stacks are
  `164,156,160,160,160,160`. Given E6, When `forceFold(hand, 2)`, Then `currentBet` is 4, `toAct` is 3 and
  `legalActions` is `[fold, call 4, raise 8]`. `checkDeal` is `[]` in both.
- Verification: acceptance `tests/engine/force-fold-top-bet.acceptance.test.ts::a big blind who leaves is dead money and still sets the price`

### SPEC-05: A voided raise frees its place under the bet cap
- Verifies: AC#2
- Behaviour: Given E7, When `forceFold(hand, 5)`, Then `currentBet` is 12, `betCount` is 3 and seat 3's
  `legalActions` is `[fold, call 4, raise 16]`. When seat 3 raises to 16, Then the step's `checkStep` is `[]`,
  `betCount` is 4 and seat 4's `legalActions` is `[fold, call 4]`.
- Verification: acceptance `tests/engine/force-fold-top-bet.acceptance.test.ts::a voided raise frees its place under the bet cap`

### SPEC-06: Normal play and non-top forced folds are unchanged
- Verifies: AC#2
- Behaviour: Given 500 seeded 6-max hands (`shuffledDeck(replayCodeFromWords([i, 5, 6, 7]))`, stacks 160,
  button `1 + i % 6`), each played with a seeded policy, When each is replayed by `applyAction` only, Then:
  - Every state passes `checkStep`, and every completed hand passes `checkDeal`.
  - The `currentBet` before every action equals the highest live street contribution, or `stakes.bigBlind`
    preflop if that is higher.
  - Whenever a `result.returned` exists, its seat has not folded.

  The existing `tests/engine/force-fold.acceptance.test.ts` passes unchanged. `npm run -s playtest -- --hands
  10000 --seed 42` reports 0 invariant violations and prints output identical to `main`.
- Verification: acceptance `tests/engine/force-fold-top-bet.acceptance.test.ts::play without a voided bet is unchanged`

### SPEC-07: Several forced folds in one hand keep every invariant
- Verifies: AC#3
- Behaviour: Given 2,000 hands from `Xoshiro128` seed 0x10d13 (2–10 seats, random button, stacks $5..$192,
  random deck, as in `side-pots.property.test.ts`), When each hand is played to completion by repeatedly doing
  one step, Then:
  - Each step either `forceFold`s a random seat that is live and not all-in (with probability 0.2, any number
    of times per hand, the seat to act included) or applies a uniformly random legal action.
  - After every `applyAction` step `checkStep` is `[]`, after every `forceFold` step `checkState` is `[]`, and
    on completion `checkDeal` is `[]`.
  - When the hand is still running, the seat to act has a non-empty `legalActions`, and either `hasActed` is
    false or `streetContribution < currentBet`.
  - Chips are conserved, so the sum of stacks equals the start.
  - No folded seat appears in `awards` or `returned`.
  - Every hand completes within 400 steps.
  - At least 200 forced folds were of a strict top bettor, so the void path is exercised (the 6-max prototype gave 587 in 2,000 hands).

  It runs in the normal suite in under 5 s.
- Verification: acceptance `tests/engine/force-fold.property.test.ts::several forced folds in one hand keep every invariant`

### SPEC-08: The bot-freeze e2e check waits for worker replies before asserting
- Verifies: AC#4
- Behaviour: Given the "Cancel resumes…" test at the point where seat 6 is to act and the dialog is open, When
  the check runs, Then:
  - It advances the clock 1000 ms.
  - It then polls until every Worker `postMessage` made so far has had a reply `message` event. The counts
    come from an init script added in `openPausedClock`, with polling of at most 10 s real time.
  - It then advances the clock 1000 ms again, and only then asserts that the action count is unchanged and
    that seat 6 has no action.
  - With the freeze intact the test passes in chromium and webkit, and the rest of the file is unchanged.
  - Mutation check (manual): with `paused &&` removed from `src/ui/table/useTableSession.ts:218`, the test fails
    on both browsers. Revert the mutation afterwards.
- Verification: acceptance `e2e/leave-mid-hand.spec.ts::Cancel resumes the hand with the same cards, stack and player to act`

### SPEC-09: All checks stay green
- Verifies: AC#2, AC#3, AC#4
- Behaviour: Given the change, When lint, typecheck, the full vitest suite, the golden spots, the 10,000-hand
  playtest and the Playwright suite run, Then all pass with no new skips, and the coverage thresholds hold
  (`src/engine` at least 90% lines).
- Verification: command `npm run lint && npm run typecheck && npm test && npx vitest run tests/golden/ && npm run -s playtest -- --hands 10000 --seed 42 && npx playwright test`

## 7. Edge cases
- The leaver ties the live top (e.g. a big blind whose hand was limped to): no void, same as today (R1 `>`).
  SPEC-04 (E6) and the unchanged `force-fold.acceptance.test.ts` (c) cover it.
- The leaver is the only seat with chips above an all-in player: the live top includes all-in seats, so the
  amount to match is the all-in amount, and its short excess over the level is not a counted raise (A-3).
  SPEC-07 covers it.
- Every seat but one leaves preflop before putting chips in: the sole survivor wins the dead blinds (J-1-02,
  A-4). SPEC-07 covers it.
- A void closes the round at once (everyone left already acted at the lower level): `settle` deals the next
  street or runs out. SPEC-03 (E3 after the check) and SPEC-07 cover it.
- The leaver was to act: `toAct` moves on as today (R3). SPEC-07 covers it.
- Capped street: SPEC-05.
- Invalid seats or complete hands: the RangeErrors are unchanged, pinned by the locked
  `force-fold.acceptance.test.ts`.
- Concurrency and interruption: N/A. The engine is pure, and the e2e change only adds waiting.

## 8. Security considerations
- No new trust boundary, input, storage format, dependency or secret. The hand-record parser is unchanged.
- Randomness: the tests use the existing seeded `Xoshiro128` and `shuffledDeck`. The product's shuffle and bot
  randomness are untouched.
- The e2e init script runs only in the test page.

## 9. Non-functional
- `fullBetLevel` stays linear in the hand's action count, at most a few dozen records. The locked
  `tests/engine/invariants.perf.test.ts` budget must still pass; it passed against the prototype.
- `force-fold.property.test.ts` takes under 5 s, so it stays in the normal suite (a correctness check, not
  speed or scale). Nothing is added to `npm run test:slow`.
- The e2e edit adds at most about 1 s of fake time and the reply wait, which is real time and normally under
  200 ms.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`. Start a game. On your turn preflop, raise. While a bot is to act, choose Leave
  table and Confirm. The next bot is asked to call only the big blind, the hand finishes, and the Session report
  shows the raise lost.
- New tests (path → SPEC ids):
  - `tests/engine/force-fold-top-bet.acceptance.test.ts` → SPEC-02, SPEC-03, SPEC-04, SPEC-05, SPEC-06
  - `tests/engine/force-fold.property.test.ts` → SPEC-07
  - `e2e/leave-mid-hand.spec.ts` (locked edit, Q-4) → SPEC-08
- End-to-end for the Judge: `npx playwright test e2e/leave-mid-hand.spec.ts --repeat-each 5` (both
  projects), then the SPEC-08 mutation check. Then manually: `npm run dev`, raise preflop, Leave table and
  Confirm while a bot is to act. The next bot's action is to call $4 (not $8), and the report's Result
  includes the full raise lost.

## 11. Open questions
None. Q-1 (a) dead money, Q-2 dead big blind floor, Q-3 reword REQ-004.8/REQ-018.4 with changelog 1.15, and Q-4
approval of the locked `e2e/leave-mid-hand.spec.ts` edit are answered in `doit/TASK-10.13/qa.md` (2026-11-26).

## 12. Clarifications log
See `doit/TASK-10.13/qa.md`.
