# Spec: TASK-1.10 — Split the pot into side pots for unequal all-ins

Status: READY (approved 2026-11-20)
Task: TASK-1.10 · Parent/epic: TASK-1 · Requirements: REQ-018, REQ-019 · Dream: limit-holdem-trainer

## 1. Summary
Today every hand has exactly one pot (`src/engine/hand.ts:314`, `:371`, `:427`, `:439`). TASK-1.9 added all-in
calls but kept that single pot (its A-1). This story builds one pot per all-in contribution level. Each pot
records exactly the non-folded seats that matched it, and each pot is awarded only among those seats (best hand,
ties split with the existing odd-chip rule). The invariant checker also learns to check each pot's level and
layer. The existing `Pot`, `PotAward` and `HandResult` shapes already allow several pots, so no public type
changes.

## 2. Scope
- In scope:
  - `src/engine/hand.ts`: build pots from contributions at every round end (`gather`) and award every pot
    separately at showdown and on a fold-out. Update the "exactly one pot until TASK-1.10" doc comments
    (`hand.ts:73`, `hand.ts:90`).
  - `src/engine/invariants.ts`: new pot-structure checks (pot count, level eligibility, layer amount) under the
    existing `pot-eligibility` id.
  - New tests: scripted side-pot hands, a 100,000-hand random-stack property test, and side-pot invariant
    tests.
- Not doing:
  - Showing side pots or per-pot winners on screen (TASK-3.8) and sit-and-go chip display without `$`
    (TASK-5.3). The table/UI code is not touched.
  - Show/muck order, including resolving pots last side pot first (REQ-019.4/.5/.8). Award amounts do not
    depend on show order.
  - Enforcing the 4-bet cap (TASK-1.12), short all-in raises (TASK-1.14), all-in blinds and busted seats
    (TASK-1.16), and the 1,000,000-hand run (TASK-1.17).
  - Changing `Pot`, `PotAward`, `HandResult`, `HandState` or `PlayerState` shapes, `splitPot`'s signature, or the
    uncalled-bet return rule (TASK-1.9 A-5 / C5).
  - Editing any locked test file (see §3).
- Scope budget: files=5, lines=700   (hand.ts ~60 changed, invariants.ts ~70, three new test files ~570)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | AC#6 ("sit-and-go hand") is tested at engine level with chip stakes `{smallBlind: 25, bigBlind: 50, smallBet: 50, bigBet: 100}` and seats 1, 2, 3, 5. The engine has no currency, so chips are the same plain integers as dollars. | yes | The sit-and-go mode is another story; the engine rule (odd chip to the first tied seat left of the button) is the same in both modes. These are real sit-and-go blind levels, and they make a 1,255-chip side pot possible within the limit betting structure. | Wait for the sit-and-go story (blocks AC#6). |
| A-2 | AC#4's "four-way all-in at four different stack sizes" means four seats each put in their whole stack ($10, $20, $30, $32). The largest seat's unmatched $2 is returned (REQ-018.4), which leaves a main pot and two side pots, each won by a different seat. | yes | A seat can never be matched above the second-largest stack, so four distinct all-ins give three pots plus a return. | Add a fifth covering seat (that case is already AC#1's shape). |
| A-3 | AC#7 (a $29 pot tied three ways) is tested through the exported `splitPot` (`hand.ts:333`), which is the exact function both award paths call. | yes | Reaching an exact $29 three-way tie through legal $2/$4 actions needs contrived dead money. AC#6 already proves the same rule end to end through a real side pot. | Script a full hand that reaches $29. |
| A-4 | The AC#5 random stacks are uniform in [bigBlind + 1, 2 × minimumStack] = [$5, $192] at $2/$4, with 2–10 seats and a random button. The random policy drops bet/raise once `betCount >= 4`, the same as `tests/engine/hand.property.test.ts:31-35` and `src/playtest/policy.ts`, because the engine does not enforce the cap yet (TASK-1.12). | yes | $5 is `createHand`'s floor (`hand.ts:166-171`). A probe with this generator (seed 20261120) found 13,927 hands with at least one side pot and 1,350 with at least two, in about 1.1 s. | Fixed stack menus. |
| A-5 | The new pot-structure checks run only when side pots exist, meaning `pots.length > 1` or the contributions make more than one level. In the single-pot case the existing chips and eligibility checks (`invariants.ts:123-145`, `:209-236`) already imply the same conditions. | yes | This keeps the exact single-violation outputs of the locked crafted-state tests (`invariant-messages`, `all-in-invariants`, `tests/playtest/invariants.acceptance.test.ts` faults) unchanged. | Always run them (risks extra violations in locked tests). |

## 3. Current system
- **Engine pots today:**
  - `gather` (`src/engine/hand.ts:296-330`) moves street contributions into `state.pots[0]` and returns the
    uncalled top-minus-second excess. It does not reduce that seat's `totalContribution`. The C5 rule
    (`invariants.ts:159-184`) and the per-seat chips check (`invariants.ts:146-155`) both rely on that.
  - `foldOut` (`hand.ts:365-382`) and `endRound` (`hand.ts:403-442`) each emit exactly one `PotAward` (`pot: 0`).
    When the hand completes they leave `pots: [{ amount: 0, eligible }]`.
  - A fold removes the seat from every pot's `eligible` (`hand.ts:482-488`).
  - `splitPot` (`hand.ts:332-346`) already gives the odd units one each clockwise from the left of the button.
  - Types: `Pot { amount, eligible }` (`hand.ts:43-47`), `PotAward { pot, amount, winners }` (`hand.ts:61-65`),
    `HandResult.awards` "one entry per pot" (`hand.ts:73`). They need no change.
- **Invariants:** `potEligibilityMessage` (`src/engine/invariants.ts:209-247`) checks:
  - P1: each eligible list is ascending and holds dealt seats.
  - P2: no folded seat is eligible.
  - P3: every eligible seat contributed to a non-empty pot.
  - P4: every unfolded seat is in the main pot.
  - P5: award winners are eligible for `pots[award.pot]`.

  `potName` (`invariants.ts:57`) already names `side pot k`.
- **Consumers already handle several awards and pots:** `src/table/hand-result.ts:76` loops awards,
  `src/playtest/runner.ts:216` sums awards, `src/advice/postflop.ts:70` and `src/table/table-view.ts:127` sum
  pots, and `src/engine/player-view.ts:92` copies every pot.
- **Tests:** vitest (`npm test` = `vitest run --coverage`).
  - The 100,000-hand pattern is `tests/engine/hand.property.test.ts:161-174`. It runs in about 1.5 s with a
    300,000 ms timeout.
  - Scripted-hand helpers (`play`, `apply`, `player`) are in `tests/engine/review-gaps.acceptance.test.ts:28-38`.
  - `parseCards` is in `src/engine/cards.ts`.
- **Locked tests this story must keep green without editing:**
  - `tests/engine/review-gaps.acceptance.test.ts` (TASK-1.22)
  - `tests/engine/all-in.acceptance.test.ts`, `tests/engine/all-in-invariants.acceptance.test.ts`,
    `tests/table/hand-result-uncalled.acceptance.test.ts` (TASK-1.9)
  - `tests/engine/invariant-messages.acceptance.test.ts` (TASK-1.27)
  - `tests/engine/fold-out.acceptance.test.ts` (TASK-1.44)
  - `tests/engine/hand.acceptance.test.ts`, `tests/engine/hand.property.test.ts` (TASK-1.4)
  - `tests/engine/chip-safety.acceptance.test.ts` (TASK-1.31)
  - `tests/engine/player-view.acceptance.test.ts` (TASK-1.5)
  - `tests/playtest/invariants.acceptance.test.ts` (TASK-1.8)
  - `tests/playtest/summary.acceptance.test.ts` (TASK-1.26)
  - `tests/engine/heads-up.acceptance.test.ts` (TASK-1.11)

  Every all-in in those files has a single contribution level once the uncalled part is returned. Example:
  `all-in.acceptance.test.ts:179-205`: totals 12/9 → 9/9, and the folded seat's $2 is below the $5 level.
  So their expected single award is still correct.
- **Playtest baseline** (`npm run playtest -- --hands 10000 --seed 42` at 791d900). Stacks reset to $160, which
  is more than the $96 a seat can put in, so no all-in occurs:
  ```
  Hands played: 10000
  Ended by fold: 5470
  Ended at showdown: 4530
  Player actions: 88831
  Streets capped at 4 bets: 244
  Largest pot: $70
  First replay code: 000000000000002a0000000000000001
  Last replay code: 000000000000002a0000000000002710
  Invariant violations: 0
  ```
- Existing code to reuse:
  - `src/engine/hand.ts::splitPot` → split each pot (odd chips).
  - `src/engine/hand.ts::payOut` → apply each pot's shares. Call it once with all shares, or once per pot.
  - `src/engine/hand.ts::gather` → keep its return computation and replace only its pot step.
  - `src/engine/invariants.ts::potName`, `playerAt` → message text and lookups.
  - `tests/engine/hand.property.test.ts:18-50` pattern (`Xoshiro128`, `shuffledDeck(replayCodeFromWords(...))`,
    capped random choice) → AC#5 property test. Copy it; test files do not import each other.
  - `src/engine/cards.ts::parseCards` → scripted decks.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Rebuild `pots` from scratch at every round end from each seat's effective contribution and folded flag. The effective contribution is `totalContribution` minus `returned.amount` for the returned seat. Build one pot per distinct effective contribution among non-folded seats, ascending. | Keep a running pot list and split it when an all-in happens. | Stateless and simple to verify. Hands with no all-in still get one pot with the same amount and eligible list, so outputs stay byte-identical. | no | n/a |
| D-2 | `result.awards` has one `PotAward` per pot, in ascending pot index (main pot first). Each pot goes to the best `rank` among its eligible seats. Ties are split by `splitPot` within that pot alone. | Order awards last side pot first (REQ-019.8 show order). | `PotAward.pot` already indexes `pots`. Show order belongs to the showdown-reveal stories, and amounts are the same in either order. | no | n/a |
| D-3 | When the hand completes, `pots` keeps every built pot with `amount: 0` and its eligible list. | Drop the pots. | Extends today's single-pot convention (`hand.ts:371`, `:427`). The chips check counts pots as still holding chips, and P5 needs `pots[award.pot].eligible`. | no | n/a |
| D-4 | A pot with a single eligible seat is kept as its own pot and awarded to that seat. It can only arise when it holds folded seats' chips, because an unmatched excess is returned first. | Merge it into the pot below. | Merging would let lower-level seats win chips they did not match (REQ-018). | no | n/a |
| D-5 | New invariant checks go in `pot-eligibility` and run after P1–P5. They are skipped when there is one pot and one level (A-5). They recompute levels on their own and do not call engine code. | Put them under `chips`, or share a helper with `hand.ts`. | Keeps one violation per id and keeps existing message precedence. A checker that reuses the engine's algorithm could not catch the engine's bugs. | no | n/a |
| D-6 | AC#9 is met by running the locked `review-gaps` file unchanged, plus a new test that repeats its folded-contributor checks on a hand that has a side pot. | Edit the locked test. | Locked files cannot change, and the new test proves the same property "for every pot". | no | n/a |

## 5. Design

### Files to create / modify
- `src/engine/hand.ts`: pot building in `gather`, per-pot awards in `endRound` and `foldOut`, and the updated doc
  comments.
- `src/engine/invariants.ts`: pot-structure checks (count, level eligibility, layer amount).
- `tests/engine/side-pots.acceptance.test.ts` (new): scripted hands for AC#1, 2, 3, 4, 6, 7 and 9.
- `tests/engine/side-pots.property.test.ts` (new): the 100,000 random-stack hands (AC#5).
- `tests/engine/side-pot-invariants.acceptance.test.ts` (new): invariant checks on side pots (AC#8).

### Components, interfaces and data
- No exported signature changes.
- New private helper in `hand.ts`:
  `buildPots(players: readonly PlayerState[], returned?: { seat; amount }): Pot[]`. It is pure and returns pots
  in ascending level order.
- `gather` returns `pots: Pot[]` instead of `{ amount, eligible }`. Its `players` and `returned` outputs are
  unchanged.
- `endRound`:
  - Not complete: `pots = gathered.pots`.
  - Showdown: for each pot `k`, the winners are the eligible seats whose `showdown` rank equals the best rank
    among that pot's eligible seats. Then `winners = splitPot(pot.amount, winnerSeats, button, seats)` and the
    award is `{ pot: k, amount: pot.amount, winners }`. All shares are paid to stacks. `pots` is set to
    `gathered.pots` with each amount 0.
- `foldOut`: same as the showdown path but every pot's sole winner is the last seat. Exactly one pot exists in
  practice (see Rules).
- Updated comments: `hand.ts:73` "One entry per pot, ascending pot index (main pot first). Amounts exclude
  `returned`." and `hand.ts:90` "Chips from completed streets: the main pot then side pots, ascending
  contribution level (TASK-1.10)."

### Rules and algorithms
**Pot building (engine and checker use the same rule, implemented separately):**
- `c(p)` is the seat's chips in completed streets, after any return.
  - Engine: `totalContribution − (p.seat === returned?.seat ? returned.amount : 0)`, computed after `gather`
    zeroes street contributions.
  - Checker: `totalContribution − streetContribution`, capped at the second-highest such value over all
    seats. This is the C5 top-minus-second rule (`invariants.ts:160-175`), so the checker does not depend on
    `result.returned`.
- Levels `L₀ < L₁ < … < L_m` are the distinct `c(p)` of non-folded seats. Before the first round end every
  `c` is 0, so there is one level of 0.
- Pot `k` has eligible = non-folded seats with `c(p) ≥ L_k`, in ascending seat order.
- Pot `k`'s amount is the layer `Σ_p (min(c(p), L_k) − min(c(p), L_{k−1}))` with `L_{−1} = 0`. For the last pot
  `k = m`, use `c(p)` in place of `min(c(p), L_m)`, so no chip can drop out. A folded seat's chips cannot exceed
  `L_m` after the return, but the rule keeps them if they did.
- A hand with no all-in has one level, so it gets one pot with the same amount and eligible list as today.
- A fold-out leaves one non-folded seat, so there is one level and one pot.

**Worked example (AC#1):** final effective contributions 4:$10, 1:$30, 2:$50, 3:$50 after a $6 return to seat 3.

| Pot | Level | Amount | Eligible |
|---|---|---|---|
| main | $10 | $40 | [1,2,3,4] |
| side 1 | $30 | $60 | [1,2,3] |
| side 2 | $50 | $40 | [2,3] |

**Odd chips:** unchanged. `splitPot` gives one each, clockwise from the first seat left of the button
(REQ-019.3, REQ-019.9), separately in each pot.

**New invariant checks (D-5, A-5).** These run in `potEligibilityMessage` after the existing checks. Let
`levels` be the checker's levels. If `pots.length > 1 || levels.length > 1`, check in this order and return the
first failure:
- P6: if `pots.length !== levels.length`:
  `there are ${pots.length} pots but contributions make ${levels.length}`
- P7: for each pot `k` in order:
  - Any eligible seat with `c < L_k`:
    `${potName(k)} lists seat ${s}, which has not matched its $${L_k} level`
  - Any non-folded seat with `c ≥ L_k` that is missing from the list:
    `seat ${s} matched the $${L_k} level of ${potName(k)} but is not eligible for it`
- P8: for each pot `k` in order:
  - Hand in progress (`result === null`) and `pot.amount !== layer_k`:
    `${potName(k)} holds $${pot.amount} but its layer is $${layer_k}`
  - Hand complete and paid `!== layer_k`, where paid is the sum of `award.amount` over awards with
    `award.pot === k`: `${potName(k)} paid $${paid} but its layer is $${layer_k}`

### Error handling and configuration
- No new errors or config. `checkState` and `checkStep` still never throw.

## 6. Behaviour specification

Shared test setup (side-pots files):
- Stakes `$2/$4` = `{smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8}` unless stated.
- Seats are dealt clockwise from the left of the button. The deck has `n` first cards, then `n` second cards,
  then the burn at `2n`, flop `2n+1..2n+3`, burn `2n+4`, turn `2n+5`, burn `2n+6`, river `2n+7` (D-5 of
  TASK-1.4).
- A test helper builds a 52-card deck from these named cards and fills the remaining positions with the other
  cards in ascending card order.
- Steps use the `[seat, type, amount?]` form from `review-gaps.acceptance.test.ts:28`. Every step must be
  accepted (`ok: true`).

**Scenario S1 (AC#1, AC#8):**
- Seats 1–4, button 1 (SB seat 2, BB seat 3). Stacks 1:$30, 2:$50, 3:$200, 4:$10.
- Hole cards in deal order 2,3,4,1: seat 2 `As Ah`, seat 3 `Kc Kd`, seat 4 `Qc Qd`, seat 1 `Jc Jd`.
- Board `2s 7h 9d 4c 3h`.
- Preflop: `[4,raise,8] [1,raise,12] [2,raise,16] [3,call,12] [4,call,2] [1,call,4]`
- Flop: `[2,bet,4] [3,raise,8] [1,raise,12] [2,raise,16] [3,call,8] [1,call,2]` → this state is `S1turn`
  (street `turn`).
- Turn: `[2,check] [3,bet,8] [2,raise,16] [3,raise,24] [2,call,2]` → this state is `S1end`.

**Scenario S2 (AC#2, AC#9):**
- Seats 1–4, button 1. Stacks 1:$8, 2–4: $160.
- Cards: seat 2 `Ac Ad`, seat 3 `Kc Kd`, seat 4 `Qc Qd`, seat 1 `Jc Jh`. Board `2s 7h 9d 4c 3h`.
- Preflop: `[4,call,4] [1,raise,8] [2,call,6] [3,call,4] [4,call,4]`
- Flop: `[2,bet,4] [3,call,4] [4,raise,8] [2,fold]` → this state is `S2fold`. Then `[3,call,4]` → `S2turn`.
- Turn and river: `[3,check] [4,check]` twice → `S2end`.

**Scenario S3 (AC#3):**
- Seats 1–3, button 1 (SB 2, BB 3). Stacks 1:$10, 2:$30, 3:$160.
- Cards in deal order 2,3,1: seat 2 `Ks Kh`, seat 3 `Qs Qh`, seat 1 `As Ah`. Board `2c 7d 9h Jc 3d`.
- Preflop: `[1,raise,8] [2,raise,12] [3,raise,16] [1,call,2] [2,call,4]`
- Flop: `[2,bet,4] [3,raise,8] [2,raise,12] [3,raise,16] [2,call,2]` → `S3end` (the board runs out).

**Scenario S4 (AC#4):**
- Seats 1–4, button 1. Stacks 1:$20, 2:$30, 3:$32, 4:$10.
- Cards in deal order 2,3,4,1: seat 2 `Js Jh`, seat 3 `Qs Qh`, seat 4 `As Ah`, seat 1 `Ks Kh`.
- Board `2c 7d 9h 4c 3d`.
- Preflop: `[4,raise,8] [1,raise,12] [2,raise,16] [3,call,12] [4,call,2] [1,call,4]`
- Flop: `[2,bet,4] [3,raise,8] [1,call,4] [2,raise,12] [3,raise,16] [2,call,2]` → `S4end`.

**Scenario S5 (AC#6):**
- Stakes `{25, 50, 50, 100}` (A-1). Seats 1, 2, 3, 5, button 1 (SB 2, BB 3). Stacks 1:1000, 2:1000, 3:65,
  5:1000.
- Cards in deal order 2,3,5,1: seat 2 `Kh 9s`, seat 3 `Ah Ac`, seat 5 `Kc 9d`, seat 1 `7h 6h`.
- Board `As Kd 8c 4h 2s`.
- Preflop: `[5,raise,100] [1,call,100] [2,call,75] [3,call,15]`
- Flop: `[2,bet,50] [5,call,50] [1,call,50]`
- Turn: `[2,bet,100] [5,raise,200] [1,fold] [2,raise,300] [5,call,100]`
- River: `[2,bet,100] [5,raise,200] [2,call,100]` → `S5end`.

### SPEC-01: Three all-ins and a covering seat build a main pot and two side pots
- Verifies: AC#1, DoD#1
- Behaviour: Given S1, When pots are built at each round end, Then the following hold.
  - `S1turn.pots` equals
    `[{amount: 40, eligible: [1,2,3,4]}, {amount: 60, eligible: [1,2,3]}, {amount: 4, eligible: [2,3]}]`.
  - `S1end.result.returned` equals `{seat: 3, amount: 6}`.
  - `S1end.pots` equals
    `[{amount: 0, eligible: [1,2,3,4]}, {amount: 0, eligible: [1,2,3]}, {amount: 0, eligible: [2,3]}]`.
  - `S1end.result.awards` equals the three awards
    `{pot: 0, amount: 40, winners: [{seat: 2, amount: 40}]}`, `{pot: 1, amount: 60, winners: [{seat: 2, amount: 60}]}`,
    and `{pot: 2, amount: 40, winners: [{seat: 2, amount: 40}]}`.
  - Final stacks are 1:0, 2:140, 3:150, 4:0.
  - `checkState(S1end)` is `[]`.
- Verification: acceptance `tests/engine/side-pots.acceptance.test.ts::three all-ins for $10, $30 and $50 with a covering seat make a main pot and two side pots`

### SPEC-02: A folded contributor is eligible for no pot, and its chips stay in (AC#9 replay)
- Verifies: AC#2, AC#9, DoD#1
- Behaviour: Given S2, When pots are built and awarded, Then the following hold.
  - In `S2fold` every pot's eligible list is `[1,3,4]`, and seat 2's `totalContribution` is 12.
  - `S2turn.pots` equals `[{amount: 32, eligible: [1,3,4]}, {amount: 20, eligible: [3,4]}]`.
  - In `S2end`:
    - Every `pots[k].eligible` excludes seat 2.
    - `result.showdown` seats are `[1,3,4]` in some order, without seat 2.
    - No award winner is seat 2.
    - The award amounts sum to $52, which equals the sum of `totalContribution` (no return).
    - `result.awards` equals `[{pot: 0, amount: 32, winners: [{seat: 3, amount: 32}]}, {pot: 1, amount: 20, winners: [{seat: 3, amount: 20}]}]`.
    - Stacks are 1:0, 2:148, 3:196, 4:144.
    - `checkState(S2end)` is `[]`.
- Verification: acceptance `tests/engine/side-pots.acceptance.test.ts::a folded contributor is eligible for no pot but its chips stay in every pot it reached`

### SPEC-03: The locked review-gaps folded-contributor test still passes
- Verifies: AC#9, DoD#1
- Behaviour: Given the side-pot engine, When `tests/engine/review-gaps.acceptance.test.ts` runs unchanged, Then
  all of its tests pass, including "a folded seat leaves every pot but its chips stay in". `git diff 791d900 --
  tests/engine/review-gaps.acceptance.test.ts` is empty.
- Verification: command `npx vitest run tests/engine/review-gaps.acceptance.test.ts && git diff --exit-code 791d900 -- tests/engine/review-gaps.acceptance.test.ts`

### SPEC-04: The shortest all-in with the best hand wins only the main pot
- Verifies: AC#3, DoD#1
- Behaviour: Given S3, where seat 1 (all-in for $10) holds the best hand, When pots are awarded, Then the
  following hold.
  - `S3end.result.returned` equals `{seat: 3, amount: 2}`.
  - `S3end.pots` eligible lists are `[1,2,3]` and `[2,3]`.
  - `S3end.result.awards` equals
    `[{pot: 0, amount: 30, winners: [{seat: 1, amount: 30}]}, {pot: 1, amount: 40, winners: [{seat: 2, amount: 40}]}]`.
  - Stacks are 1:30, 2:40, 3:130.
  - `checkState(S3end)` is `[]`.
- Verification: acceptance `tests/engine/side-pots.acceptance.test.ts::the shortest all-in with the best hand wins only the main pot`

### SPEC-05: A four-way all-in pays each pot to its expected winner
- Verifies: AC#4, DoD#1
- Behaviour: Given S4 (A-2), When the hand ends, Then the following hold.
  - `S4end.result.returned` equals `{seat: 3, amount: 2}`.
  - `S4end.pots` eligible lists are `[1,2,3,4]`, `[1,2,3]` and `[2,3]`.
  - `S4end.result.awards` equals
    `[{pot: 0, amount: 40, winners: [{seat: 4, amount: 40}]}, {pot: 1, amount: 30, winners: [{seat: 1, amount: 30}]}, {pot: 2, amount: 20, winners: [{seat: 3, amount: 20}]}]`.
  - For each pot, the test also derives the expected winner as the eligible seat with the highest
    `result.showdown` rank, and it matches that pot's sole winner.
  - Stacks are 1:30, 2:0, 3:22, 4:40.
  - `checkState(S4end)` is `[]`.
- Verification: acceptance `tests/engine/side-pots.acceptance.test.ts::a four-way all-in at four stack sizes pays each pot to the best eligible hand`

### SPEC-06: A tied side pot splits its odd chip left of the button (sit-and-go chips)
- Verifies: AC#6, DoD#1
- Behaviour: Given S5 (A-1), where seat 3 holds trip aces and seats 2 and 5 tie with kings, When pots are
  awarded, Then the following hold.
  - `S5end.result.awards` equals
    `[{pot: 0, amount: 260, winners: [{seat: 3, amount: 260}]}, {pot: 1, amount: 1255, winners: [{seat: 2, amount: 628}, {seat: 5, amount: 627}]}]`.
  - `S5end.pots` eligible lists are `[2,3,5]` and `[2,5]`.
  - `result.returned` is undefined.
  - Stacks are 1:850, 2:978, 3:260, 5:977.
  - `checkState(S5end)` is `[]`.
- Verification: acceptance `tests/engine/side-pots.acceptance.test.ts::a 1,255-chip side pot tied by seats 2 and 5 pays 628 and 627`

### SPEC-07: Two odd dollars go one each clockwise from the left of the button
- Verifies: AC#7, DoD#1
- Behaviour: Given seats 1–6 and the button at seat 4, When `splitPot(29, [3, 5, 6], 4, [1,2,3,4,5,6])` runs
  (A-3), Then it returns `[{seat: 5, amount: 10}, {seat: 6, amount: 10}, {seat: 3, amount: 9}]`.
- Verification: acceptance `tests/engine/side-pots.acceptance.test.ts::a $29 pot tied by seats 3, 5 and 6 pays $10, $10 and $9 from the left of button 4`

### SPEC-08: 100,000 random-stack hands conserve chips
- Verifies: AC#5, AC#8, DoD#1
- Behaviour: Given generator `new Xoshiro128(20261120)` and, for each of 100,000 hands, the following draws:
  - `n = 2 + nextInt(9)` seats numbered 1..n;
  - `button = 1 + nextInt(n)`;
  - each stack `5 + nextInt(188)` ($5..$192, A-4), drawn in seat order;
  - a deck `shuffledDeck(replayCodeFromWords([4 × nextUint32()]))`;
  - each action uniform over `legalActions` minus bet/raise when `betCount >= 4`.

  When each hand ends (at most 400 actions, else fail), Then the following hold.
  - The sum of final `stack` equals the sum of starting stacks (REQ-018.5).
  - `checkStep` returned `[]` for every action of the hand.
  - Across the run, at least 1,000 hands end with `awards.length >= 2` and at least 100 with
    `awards.length >= 3`, which proves side pots were exercised.
  - On any failure the message names the hand index.
  - The test has a 300,000 ms timeout.
- Verification: acceptance `tests/engine/side-pots.property.test.ts::AC#5 100,000 random-stack hands keep the table total and pass every invariant`

### SPEC-09: The invariant checker accepts real side pots and names each structural fault
- Verifies: AC#8, DoD#1
- Behaviour: Given S1 (built as in SPEC-01), When `checkState` runs, Then `checkState(S1turn)` and
  `checkState(S1end)` are `[]`, and each crafted copy below yields exactly one violation, with this
  `invariant: 'pot-eligibility'` and message:
  - (a) `S1turn` with pot 1 eligible `[2,3]` → `seat 1 matched the $30 level of side pot 1 but is not eligible for it`
  - (b) `S1turn` with pot 2 eligible `[1,2,3]` → `side pot 2 lists seat 1, which has not matched its $32 level`
  - (c) `S1turn` with pot amounts 41/59/4 → `main pot holds $41 but its layer is $40`
  - (d) `S1turn` with pots `[{40,[1,2,3,4]}, {64,[1,2,3]}]` → `there are 2 pots but contributions make 3`
  - (e) `S1end` with award amounts and seat-2 shares changed to 41/59/40 → `main pot paid $41 but its layer is $40`
- Verification: acceptance `tests/engine/side-pot-invariants.acceptance.test.ts::pot-eligibility checks each side pot's level and layer`

### SPEC-10: Single-pot hands are unchanged
- Verifies: AC#5, AC#9, DoD#1, DoD#2
- Behaviour: Given hands with no unmatched all-in, When the full suite runs, Then every locked test listed in §3
  passes unedited. `git diff --exit-code 791d900 --` over those files is empty.
- Verification: command `npm test && git diff --exit-code 791d900 -- tests/engine/review-gaps.acceptance.test.ts tests/engine/all-in.acceptance.test.ts tests/engine/all-in-invariants.acceptance.test.ts tests/engine/invariant-messages.acceptance.test.ts tests/engine/fold-out.acceptance.test.ts tests/engine/hand.acceptance.test.ts tests/engine/hand.property.test.ts tests/engine/chip-safety.acceptance.test.ts tests/playtest/invariants.acceptance.test.ts tests/playtest/summary.acceptance.test.ts tests/table/hand-result-uncalled.acceptance.test.ts`

### SPEC-11: Lint, typecheck, tests and coverage pass
- Verifies: DoD#2, DoD#4, DoD#5
- Behaviour: Given the change, When the checks run, Then the following hold.
  - Each command exits 0.
  - Coverage holds at ≥ 90% for engine/bots/advice/statistics and ≥ 70% overall, as configured in
    `vite.config.ts`. P6–P8 are each hit by SPEC-09.
  - `src/engine/*` imports no UI code.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-12: The 10,000-hand playtest is clean and byte-identical to the baseline
- Verifies: DoD#6
- Behaviour: Given stacks reset to $160 each hand, so no all-in arises, When
  `npm run playtest -- --hands 10000 --seed 42` runs, Then it exits 0 and its output matches the §3 baseline
  byte for byte (`Largest pot: $70`, `Invariant violations: 0`).
- Verification: command `npm run playtest -- --hands 10000 --seed 42`

### SPEC-13: CI green and story documentation published
- Verifies: DoD#10, DoD#11
- Behaviour: Given branch `doit/TASK-1.10`, When CI runs, Then the workflow is green. `backlog doc list --plain`
  lists a TASK-1.10 story doc that records D-1..D-6, A-1..A-5 and the P6–P8 messages.
- Verification: manual CI run on branch `doit/TASK-1.10` and `backlog doc list --plain`

### SPEC-14: Not-applicable DoD items
- Verifies: DoD#3, DoD#7, DoD#8, DoD#9, DoD#12
- Behaviour: Given the golden-spot suite (TASK-7.11) and the service worker are not done, and this story adds no
  screen, no strategy content and no network code, When the Judge checks, Then the diff touches nothing under
  `src/ui`, `src/table`, `src/advice` or `e2e`.
- Verification: manual Judge confirms `git diff --stat 791d900 -- src/ui src/table src/advice e2e` is empty

## 7. Edge cases
- **No all-in / everyone equal:** one level, so one pot, the same as today (SPEC-10, SPEC-12).
- **Uncalled top bet:** returned first, so the largest all-in is capped at the second-largest contribution
  (SPEC-01, SPEC-04, SPEC-05).
- **Folded seat above some levels:** its chips fill each layer it reached, and it is eligible for none
  (SPEC-02).
- **Side pot with one eligible seat** (it holds folded chips): kept and awarded to that seat (D-4). It is
  exercised by the random run (SPEC-08) and checked by P6–P8.
- **Odd chips in a side pot:** SPEC-06. **More than one odd unit:** SPEC-07.
- **Fold-out with all-ins earlier:** impossible. An all-in seat never folds, so a fold-out leaves exactly one
  non-folded seat and one pot.
- **All seats all-in preflop / runout:** S4 and S1 end in a runout. Covered by SPEC-05 and SPEC-01.
- **Chips above the top level from a folded seat:** cannot occur after the return. The last pot is uncapped,
  so it would still conserve chips (Rules).
- Invalid input, concurrency, permissions: N/A. These are pure functions on already-validated state.

## 8. Security considerations
- No new trust boundary. `createHand` validation (`hand.ts:132-177`) still bounds every chip amount to a safe
  integer, and layers are differences of those amounts.
- No secrets, no logging, no new dependencies, no randomness in the engine. The test generator is the existing
  seeded `Xoshiro128`, which is not used for fairness here.

## 9. Non-functional
- The SPEC-08 property test should finish in < 15 s locally. The probe without checks took 1.1 s, and
  `checkStep` per action fits the `invariants.perf` budget. It keeps a 300,000 ms timeout for slow CI runners.
- The playtest is no slower: `buildPots` is O(n²) for n ≤ 10, once per round end.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 10000 --seed 42`
- New tests:
  - `tests/engine/side-pots.acceptance.test.ts` → SPEC-01..07
  - `tests/engine/side-pots.property.test.ts` → SPEC-08
  - `tests/engine/side-pot-invariants.acceptance.test.ts` → SPEC-09
- Judge end-to-end:
  1. Run `npx vitest run tests/engine/side-pots.acceptance.test.ts tests/engine/side-pot-invariants.acceptance.test.ts tests/engine/side-pots.property.test.ts tests/engine/review-gaps.acceptance.test.ts`.
  2. Run the 10,000-hand playtest and diff it against the §3 baseline.
  3. Confirm the locked files are unchanged (SPEC-10).

## 11. Open questions
- None.

## 12. Clarifications log
See `doit/TASK-1.10/qa.md`.
