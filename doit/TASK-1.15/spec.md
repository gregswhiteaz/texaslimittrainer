# Spec: TASK-1.15 — Show and muck cards at showdown in casino order

Status: READY (approved 2026-11-21)
Task: TASK-1.15 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: REQ-019.4, REQ-019.5, REQ-019.6, REQ-019.8, REQ-025.1 · Dream: limit-holdem-trainer

## 1. Summary
At showdown the engine reveals hands in casino order. The last player to bet or raise on the river shows first;
if nobody bet on the river, the first active seat left of the button shows first. Each later hand is shown only if
it beats or ties the best hand already face up, and otherwise it is mucked. With side pots, the last side pot is
resolved first and the main pot last, so a hand that wins a side pot is never lost by mucking in the main pot.
Mucked cards are removed from `HandResult.showdown`, so `showdownOf` and every later `PlayerView` lose them too.
The hand result lists shown losing hands after the winners. Pot awards don't change, and the 10,000-hand playtest
report stays byte-identical.

## 2. Scope
- In scope:
  - `src/engine/hand.ts`: showdown order (REQ-019.4), pot-by-pot show/muck (REQ-019.5, REQ-019.8). Pots are awarded
    among shown hands. `HandResult.showdown` holds only the shown hands, in showdown order. Doc comment updates.
  - `src/engine/player-view.ts`: doc comment of `showdownOf` (no logic change; it copies `result.showdown`).
  - `src/table/hand-result.ts`: a new `shown` list on `HandResultView` with the shown losing hands in showdown order.
  - `src/ui/table/Table.tsx` and `src/ui/styles.css`: render that list in the "Hand over" block
    (layout and wording per Q-3, auto-accepted).
  - Tests: new acceptance, unit, property, UI and e2e tests (§10). Four locked tests need one-line edits
    (E1-E4, approved by Q-4, auto-accepted), plus one unlocked unit test.
- Not doing:
  - Letting the user choose Show or Muck (no new control). The user's hand follows the automatic rule
    (Q-1, auto-accepted).
  - Automatic tabling of every hand when a player is all-in (TDA-style); all-in hands follow the same rule (Q-2, auto-accepted).
  - Changing the order of the `awards` array (stays ascending pot index, main pot first, `hand.ts:74`), award
    amounts, odd-chip rules, `PotAward`/`EarlierShowdown`/`PlayerView` shapes, or the playtest report format.
  - Passing `earlierShowdowns` to bots in the session or the playtest runner (not wired today; no task AC).
  - Opponents' cards in the hand review (TASK-9.5). Per-player earlier-showdown keys (TASK-6.19).
  - A new invariant-checker clause for show/muck (`src/engine/invariants.ts` unchanged).
  - Deleting or loosening any assertion in a locked test.
- Scope budget: files=17, lines=850

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The "last player to bet or raise on the river" is the seat of the last river `ActionRecord` of type `bet` or `raise`, **counted or not**. A short all-in raise under half a bet (TASK-1.14) also makes its seat show first. | yes (one predicate) | The record is labelled "raise" in the action list and review, so the user sees that seat as the last raiser. REQ-019.4 says "bet or raise", with no exception. | Only counted bets/raises (then the full bettor before the short all-in shows first) |
| A-2 | "Resolved and awarded first" (AC#5) means the order in which pots are settled: the show/muck decisions and each pot's winner are worked out from the last side pot down to the main pot. The `awards` array keeps its documented order (ascending pot index, `src/engine/hand.ts:74`). | yes | Reversing the array would change the playtest `Result:` lines (`src/playtest/cli.ts:185-190`) and many locked award assertions (e.g. `tests/engine/side-pots.acceptance.test.ts`) without any user-visible gain. The settle order can still be seen: AC#6's side-pot award depends on it. | Emit `awards` in settle order (last side pot first) |
| A-3 | A pot only one seat is eligible for is awarded to that seat **without a show**. Such pots exist when a folded player put in more than the second-largest live contribution (worked example in SPEC-10). | yes | Casino practice: an uncontested pot needs no show. Showing would reveal cards no rule requires. | Treat the lone seat as the first shower of that pot |
| A-4 | "Showdown order" for listing shown hands (AC#7, AC#8, `HandResult.showdown`) is the seat order around the table, starting with the first shower (REQ-019.4), with mucked seats left out. It is not the order in which pots were settled. | yes | For a single pot the two orders are the same. With side pots, seat order is stable and readable, and it keeps the locked `tests/engine/all-in.acceptance.test.ts:146` (`[2, 3, 1]`) unchanged. | List hands in reveal sequence (side-pot contenders first). That would also need an edit to the TASK-1.9 locked test. |
| A-5 | A hand mucked in one pot is dead for every lower pot. This never costs a pot. Eligibility is nested (a lower pot's eligible seats include every higher pot's), and a seat mucks only when a face-up hand in that pot beats it. That face-up hand is also eligible for every lower pot. | yes | Real-table rule (a mucked hand can't be retrieved), and it is what "mucking in one pot never forfeits another pot it can win" requires once pots are settled side-first. | Allow re-showing a mucked hand in a lower pot (makes no difference to any award) |

## 3. Current system
- Engine (`src/engine/hand.ts`, pure TS, no UI imports):
  - `endRound` (`hand.ts:467-513`) runs the showdown after the river or after a D-7 runout (`open.length <= 1`,
    `hand.ts:476`). `active` = non-folded seats, clockwise from left of the button (`hand.ts:470-473`). All-in
    seats are included.
  - Today every active seat is shown, in that clockwise order (`hand.ts:479-483`). Each pot goes to the best rank
    among its `eligible` seats, split with `splitPot` (`hand.ts:484-493`, `hand.ts:391-404`).
  - `HandResult.showdown` (`hand.ts:69-73`) holds `{seat, holeCards, rank}`. Pots are built by `buildPots`
    (`hand.ts:332-352`): one pot per distinct live contribution level. `eligible` is ascending and nested.
  - River actions are in `state.actions` with `street: 'river'` (`hand.ts:53-61`). A short all-in raise is recorded
    with type `raise` even when it isn't counted (`hand.ts:540-570`).
- `showdownOf` (`src/engine/player-view.ts:120-129`) copies every `result.showdown` entry into
  `EarlierShowdown.shown`. `playerView` passes `earlierShowdowns` through unchanged (`player-view.ts:64-108`).
  `PlayerView` has no field for the current hand's showdown, so a hand's own views never held other players'
  cards.
- `handResultView` (`src/table/hand-result.ts:74-97`) lists only winners. A winner's `holeCards`/`handName` come from
  `result.showdown`. `Table.tsx:83-112` renders `<ul aria-label="Winners">` with `<li data-seat>` lines. CSS is
  `src/ui/styles.css:431-479`: a flex row, with 30x42 cards inside `.hand-result`.
- The user's own cards are always drawn at their seat from their PlayerView (`src/table/table-view.ts:172`).
  REQ-019.6 is met independently of the showdown.
- `CompletedHand.shown = showdownOf(hand)` and `result` (`src/table/session.ts:225,252`) inherit the filtering.
- Playtest: `formatHand` prints only awards (`src/playtest/cli.ts:185-190`), and neither the runner nor the session
  passes `earlierShowdowns` to policies (no use in `src/playtest`, `src/bots`). Awards are unchanged (A-5, §5),
  so the 10,000-hand report is byte-identical. Checked on a patched scratch copy: `diff` of
  `npm run playtest -- --hands 10000 --seed 42` before and after is empty (`Ended by fold: 5470`,
  `Ended at showdown: 4530`, `Player actions: 88831`, `Streets capped at 4 bets: 244`, `Largest pot: $70`,
  `Invariant violations: 0`).
- Tests: Vitest (`npm test` = `vitest run --coverage`), Playwright (`npm run e2e`, Chromium + WebKit, build +
  preview on port 4173). Scripted hands use `fixedDeck` and `play` from `tests/support/table-scenarios.ts:61-73,134-141`.
  `userTableAfter` (`table-scenarios.ts:177`) builds a session table: user at seat 5, names 1 Ava, 2 Ben, 3 Cal,
  4 Dee, 5 You, 6 Eli, stakes $2/$4 blinds with $4/$8 bets, $160 stacks. With 6 seats the hole cards are deck
  indexes 0-11 (seat at deal position j gets j and j+6, deal order starting left of the button). Burns are at 12,
  16 and 18, the flop at 13-15, the turn at 17 and the river at 19.
- e2e scene harness: `e2e/support/table-scenes.tsx` (SCENES map → `TableView`), `buildTableScenes`/`openTableScene`
  (`e2e/support/table-harness-bundle.ts`), `expectNoSeriousAxeViolations` (`e2e/support/axe.ts`).
- Existing code to reuse:
  - `src/engine/hand.ts` `clockwiseAfter`, `splitPot`, `evaluate` → showdown order and awards.
  - `src/table/hand-result.ts` `handName` → hand names of shown losing hands.
  - `src/ui/cards/PlayingCard.tsx` and the `.hand-result .table-cards` styles → the cards of shown losing hands.
  - `tests/support/table-scenarios.ts` `fixedDeck`, `play`, `userTableAfter` → every scripted hand below.
  - `e2e/support/table-scenes.tsx`, `table-harness-bundle.ts`, `axe.ts` → the e2e scene.
- Prototype check: the §5 algorithm was applied to a scratch copy, with the §5 locked edits E1-E4. Result:
  `npm test` all green (except the unlocked unit assertion U1), and `e2e/next-hand`, `review`, `table` and
  `table-display` specs all pass in Chromium and WebKit.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The engine applies the show/muck rule to every seat. It has no user/bot concept (`HandState` has no user seat). | Special-case a "user seat" in the engine | Engine stays UI-free (DoD#5). The user's treatment is Q-1. | yes | user (Q-1, auto-accepted) |
| D-2 | `HandResult.showdown` keeps its shape but holds only shown hands, in showdown order (A-4). Mucked hands appear nowhere in `HandResult`. | Add a `mucked` list or a `shown: boolean` flag | AC#4 says mucked cards are absent from the hand result. `showdownOf` and `CompletedHand` filter automatically. | yes | n/a (AC#4 states it) |
| D-3 | When there was no river bet or raise, including every D-7 runout where the river is dealt with no betting, the first active (non-folded, all-in included) seat left of the button shows first. | Last aggressor on any street | REQ-019.4 wording ("on the river"). | no | n/a (REQ-019.4) |
| D-4 | Each pot goes to the best **shown** eligible hand (ties split as today). By construction this is always the best eligible hand, so award amounts are unchanged. | Keep ranking hidden hands | The rule and the award can't disagree, and a wrong side-first implementation shows up as a wrong award (AC#6). | no | n/a |
| D-5 | `HandResultView` gains `shown: readonly ShownHandView[]`. `winners` is unchanged. | Fold losers into `winners` | AC#8 says losing hands are listed after the winners. The existing winner tests and `li[data-seat]` locators stay valid. | no | n/a |

## 5. Design

### Files to create / modify
- `src/engine/hand.ts` — showdown order, pot-by-pot show/muck, awards among shown; doc comments on `HandResult.showdown`.
- `src/engine/player-view.ts` — `showdownOf` doc comment: "only the hands shown at showdown, in showdown order".
- `src/table/hand-result.ts` — `ShownHandView`, `HandResultView.shown`.
- `src/ui/table/Table.tsx` — render the "Shown hands" list (Q-3).
- `src/ui/styles.css` — muted style for the shown-hands lines (Q-3).
- `tests/engine/showdown-order.acceptance.test.ts` — new, SPEC-01..07.
- `tests/engine/showdown-order.test.ts` — new, SPEC-09..11.
- `tests/engine/showdown-order.property.test.ts` — new, SPEC-12.
- `tests/ui/hand-result-shown.acceptance.test.tsx` — new, SPEC-08.
- `tests/support/table-scenarios.ts` — export `SHOWN_HANDS` (the SPEC-08 table).
- `e2e/support/table-scenes.tsx` — scene `'shown-hands'` → `SHOWN_HANDS`.
- `e2e/showdown-shown.spec.ts` — new, SPEC-14.
- `tests/table/hand-result.test.ts` — U1: add `shown: []` to the expected KINGS_SHOWDOWN view (line 62-75; not locked).
- `tests/engine/hand.acceptance.test.ts` — locked edit E1 (Q-4).
- `tests/engine/hand.property.test.ts` — locked edit E2 (Q-4).
- `tests/engine/side-pots.acceptance.test.ts` — locked edit E3 (Q-4).
- `tests/ui/user-shown-cards.acceptance.test.tsx` — locked edit E4 (Q-4).

### Components, interfaces and data
- `hand.ts` (private helpers; no new exports needed):
  - `showdownOrder(state, active): PlayerState[]`. `active` is the non-folded seats clockwise from left of the
    button. If `state.actions` has a `street === 'river'` record of type `bet` or `raise`, rotate `active` so the
    seat of the **last** such record comes first (A-1). Otherwise return `active` unchanged (D-3).
  - `revealShown(ranked, pots)` takes `ranked` (`{seat, holeCards, rank}` in showdown order) and the gathered
    `pots`. It returns the shown subset of `ranked`, in `ranked` order (A-4).
  - `endRound` computes `ranked`, then `showdown = revealShown(...)`. Pot k goes to the best rank among
    `showdown ∩ pots[k].eligible`. When `pots[k].eligible.length === 1` the pot goes to that seat (A-3).
    `splitPot` is used exactly as today.
  - `HandResult.showdown` doc: "Hands shown at showdown, in showdown order (REQ-019.4/.5/.8). Mucked hands are
    absent. Empty after a fold-out."
- `hand-result.ts`:
  ```ts
  export interface ShownHandView {
    readonly seat: SeatNumber;
    readonly name: string;
    readonly isUser: boolean;
    /** "Dee shows" | "You show" (Q-3). */
    readonly text: string;
    readonly handName: string;
    readonly holeCards: readonly [Card, Card];
  }
  export interface HandResultView {
    readonly endedBy: 'fold' | 'showdown';
    readonly winners: readonly WinnerView[];
    /** Shown hands of seats that won nothing, in showdown order; [] after a fold-out. Never a mucked hand. */
    readonly shown: readonly ShownHandView[];
  }
  ```
  `shown` = `result.showdown` filtered to seats with no award share, mapped like winners: the name comes from
  `table.seats` (RangeError `Seat <n> is not at the table` as for winners), and `handName([...holeCards, ...board])`.
- `Table.tsx` `HandResult`: after the Winners `<ul>`, when `result.shown.length > 0`, render
  `<ul aria-label="Shown hands">`. Each line is `<li data-shown-seat="<n>">` (not `data-seat`, so existing
  `li[data-seat]` winner/seat locators keep their meaning) and contains `<span data-part="shown">{text}</span>`,
  `<span aria-hidden="true"> · </span>`, `<span data-part="hand-name">{handName}</span>` and
  `<div role="group" aria-label={isUser ? 'Your shown cards' : `${name}'s cards`} className="table-cards">` with two
  `PlayingCard`s (Q-3).
- `styles.css`: `.hand-result ul[aria-label='Shown hands'] li { color: #a7aeb8; font-weight: 400; }`
  (Q-3; contrast 8.1:1 on `#1a1d22`).

### Rules and algorithms
- Showdown order O: the active seats clockwise from left of the button, rotated to start at the last river
  bettor/raiser if there is one.
- Show/muck. Every seat starts undecided. For each pot k from the last (highest index) down to 0:
  - if `eligible.length === 1`, skip it (A-3);
  - otherwise, for each undecided seat c in O that is eligible for k:
    - `faceUp` = the shown seats eligible for k;
    - if `faceUp` is empty or `rank(c) ≥ max rank(faceUp)`, c is **shown**;
    - otherwise c is **mucked**, and stays mucked for every later pot (A-5).
  - Shown seats stay shown.
  - Seats left undecided at the end are only ever the lone seat of an A-3 pot. They are not shown.
- Single pot: the first seat in O always shows, then each later seat shows iff it ties or beats the best shown so
  far (REQ-019.5). With side pots, O's first seat can be mucked when a hand already face up from a higher pot beats
  it (SPEC-05 seat 3). REQ-019.8's pot-by-pot order governs.
- Worked examples (board `2c 7d 9h Jc 3s` at deck indexes 13,14,15,17,19; stakes $2/$4, $4/$8; 6 seats; stacks
  $160 unless stated):
  - **W1 (AC#1)**: button 6. Seat 2 has Kh Kd (idx 1,7), seat 3 Ah Ad (2,8), seat 5 4h 4s (4,10).
    - Moves: `3:call 4:fold 5:call 6:fold 1:fold 2:check`, flop and turn `2:check 3:check 5:check`, river
      `2:bet 3:call 5:raise 2:call 3:call`.
    - O = [5,2,3]. 5 shows (first), 2 (KK ≥ 44) shows, 3 (AA ≥ KK) shows → showdown `[5,2,3]`.
    - Award `{pot:0, amount:62, winners:[{seat:3, amount:62}]}`. Stacks 2:140, 3:202, 5:140. The old order
      would have been `[2,3,5]`.
  - **W2 (AC#2, AC#4)**: button 3, deal order 4,5,6,1,2,3. Seat 4 has 4h 4s (idx 0,6), seat 5 8h 8s (1,7), seat 1
    5h 5s (3,9), seat 2 Kh Ks (4,10).
    - Moves: `6:fold 1:call 2:call 3:fold 4:call 5:check`, then `4:check 5:check 1:check 2:check` on each of flop,
      turn and river.
    - O = [4,5,1,2]. 4 shows, 5 (88 ≥ 44) shows, 1 (55 < 88) mucks, 2 (KK) shows → showdown `[4,5,2]`.
    - Award `{pot:0, amount:16, winners:[{seat:2, amount:16}]}`. Stacks 1:156, 2:172, 4:156, 5:156.
  - **W3 (AC#3 tie)**: W2 with seat 1 holding 8c 8d (idx 3,9). It ties 88 → showdown `[4,5,1,2]`. Same award.
  - **W4 (AC#5)**: button 2, deal order 3,4,5,6,1,2, seat 3 stack $8. Seat 3 has Qh Qs (idx 0,6), seat 5 Kh Ks
    (2,8), seat 1 Ah As (4,10).
    - Moves: `5:raise 6:fold 1:call 2:fold 3:call 4:fold` (seat 3 is all-in for $8), flop `5:bet 1:call`, turn
      `5:check 1:check`, river `5:check 1:check`.
    - Pots: main $28 eligible [1,3,5], side $8 eligible [1,5].
    - O = [3,5,1]. Side pot first: 5 shows, 1 (AA ≥ KK) shows. Main: 3 (QQ < AA face up) mucks → showdown
      `[5,1]`.
    - Awards `[{pot:0, amount:28, winners:[{seat:1, amount:28}]}, {pot:1, amount:8, winners:[{seat:1, amount:8}]}]`.
      Stacks 1:184, 3:0, 5:148.
  - **W5 (AC#6)**: W4 with seat 3 Ah As, seat 5 Kh Ks, seat 1 Qh Qs.
    - Side pot first: 5 shows, 1 (QQ < KK) mucks. Main: 3 (AA ≥ KK face up) shows; 5 is already shown;
      1 is already mucked → showdown `[3,5]`.
    - Awards `[{pot:0, amount:28, winners:[{seat:3, amount:28}]}, {pot:1, amount:8, winners:[{seat:5, amount:8}]}]`.
      Stacks 1:148, 3:28, 5:156.
    - Settling main-first would muck 5 behind seat 3's aces and lose 5 the side pot. The award catches that.
  - **W6 (A-1)**: button 6, seat 5 stack $15. Seat 2 has Kh Kd (idx 1,7), seat 5 4h 4s (4,10).
    - Moves: `3:fold 4:fold 5:call 6:fold 1:fold 2:check`, flop and turn `2:check 5:check`, river
      `2:bet 5:raise 2:call` (the raise is to $11 all-in, +$3: not counted).
    - O = [5,2] → showdown `[5,2]`. Award `{pot:0, amount:32, winners:[{seat:2, amount:32}]}`. Stacks 2:177, 5:0.
    - Under the counted-only alternative, the showdown would have been `[2]`.
  - **W7 (A-3)**: button 6, seat 3 stack $6. Seat 3 has Ah As (idx 2,8), seat 5 Kh Ks (4,10).
    - Moves: `3:call 4:fold 5:call 6:fold 1:fold 2:check`, flop `2:bet 3:call 5:raise 2:call` (3 is all-in for
      $2), turn `2:check 5:bet 2:fold`.
    - Seat 5's $8 turn bet is returned (`result.returned` `{seat:5, amount:8}`). Pots: main $20 eligible [3,5],
      side $12 eligible [5].
    - Runout, O = [3,5]. The side pot is skipped (one eligible seat). Main: 3 shows, 5 (KK < AA) mucks →
      showdown `[3]`.
    - Awards `[{pot:0, amount:20, winners:[{seat:3, amount:20}]}, {pot:1, amount:12, winners:[{seat:5, amount:12}]}]`.
      Stacks 2:148, 3:20, 5:160.
  - **W8 (D-3)**: button 6, seat 3 stack $8. Seat 3 has 4h 4s (idx 2,8), seat 5 Kh Ks (4,10).
    - Moves: `3:call 4:fold 5:raise 6:fold 1:fold 2:fold 3:call` (3 is all-in; runout, no river action).
    - O = [3,5] → showdown `[3,5]`. Award `{pot:0, amount:22, winners:[{seat:5, amount:22}]}`. Stacks 3:0, 5:174.
    - The last preflop raiser (5) does not show first.
  - **W9 (AC#8, table)**: `userTableAfter(W2 deck, W2 moves, 3)`.
    - `handResultView` gives `winners` = `[{seat:2, name:'Ben', isUser:false, amount:16, text:'Ben wins $16',
      handName:'Pair of kings', holeCards:[Kh, Ks]}]`.
    - It gives `shown` = `[{seat:4, name:'Dee', isUser:false, text:'Dee shows', handName:'Pair of fours',
      holeCards:[4h, 4s]}, {seat:5, name:'You', isUser:true, text:'You show', handName:'Pair of eights',
      holeCards:[8h, 8s]}]`.
- Locked-test edits (Q-4). Each was checked on the prototype, and none deletes or weakens an assertion:
  - **E1** `tests/engine/hand.acceptance.test.ts:454` (owner TASK-1.4): `toEqual([2, 5])` → `toEqual([2])`.
    In the `single` hand, seat 5 (Ah Qs) loses to seat 2 (Ad Kc), who shows first after a checked river with
    button 1, so seat 5 now mucks.
  - **E2** `tests/engine/hand.property.test.ts:73-74` (owner TASK-1.4): the check "shown seats == all active seats"
    becomes "shown seats == the exact REQ-019.4/.5 list". The test computes that list itself: active seats
    clockwise from left of the button, rotated to the last river bet/raise seat (`state.actions.findLast`), keeping a
    seat iff its `evaluate` rank ≥ the best kept so far. The failure string stays `'showdown seats differ'`, and
    exact equality is kept. These hands have $160 stacks, so there is always one pot.
  - **E3** `tests/engine/side-pots.acceptance.test.ts:151` (owner TASK-1.10):
    `expect(result.showdown.map((s) => s.seat).sort(...)).toEqual([1, 3, 4])` →
    `expect(result.showdown.map((s) => s.seat)).toEqual([3])`. With button 1, the river is checked by 3 and 4, and
    seat 3 (KK) beats 4 (QQ) in the side pot and 1 (JJ) in the main, so both mucked. The assertion gets stricter
    (exact order).
  - **E4** `tests/ui/user-shown-cards.acceptance.test.tsx:45` (owner TASK-3.22): `[1, 2, 3, 5]` → `[1, 2, 3]`.
    The line-16 comment also changes to "seat 5 (Kh Kd) loses to the user's aces and mucks, so 1, 2, 3 are shown".
    The UI assertions in that test are unchanged and pass: shown losers use `data-shown-seat`, so its
    `li data-seat` regex still finds only the user's winner line.
  - **U1** (not locked) `tests/table/hand-result.test.ts:62-75`: the expected KINGS_SHOWDOWN view gains
    `shown: []`. Seat 5's pair of nines mucks behind Ben's last-raiser kings.

### Error handling and configuration
- No new errors. `handResultView` throws the existing `RangeError('Seat <n> is not at the table')` for a shown
  seat missing from `table.seats` (same code path as winners). No configuration.

## 6. Behaviour specification

### SPEC-01: The last river bettor or raiser shows first
- Verifies: AC#1
- Behaviour: Given W1 (seat 5 made the last river raise), When the river closes, Then `result.showdown` seats are
  `[5, 2, 3]` with holeCards 4h 4s, Kh Kd, Ah Ad, and `result.awards` is
  `[{pot:0, amount:62, winners:[{seat:3, amount:62}]}]`.
- Verification: acceptance `tests/engine/showdown-order.acceptance.test.ts::the last river raiser shows first`

### SPEC-02: A checked-through river starts left of the button
- Verifies: AC#2
- Behaviour: Given W2 (river checked through, button 3), When the river closes, Then `result.showdown[0].seat` is 4
  (the first active seat left of the button) and the showdown seats are `[4, 5, 2]`.
- Verification: acceptance `tests/engine/showdown-order.acceptance.test.ts::a checked-through river shows first from the first active seat left of the button`

### SPEC-03: A later hand that beats or ties the best shown hand is shown
- Verifies: AC#3
- Behaviour: Given W2, Then seat 5 (88 beats 44) and seat 2 (KK) are shown. Given W3, Then seat 1 (8c 8d, which ties
  88) is also shown: seats `[4, 5, 1, 2]`, and seat 1's entry has holeCards 8c 8d.
- Verification: acceptance `tests/engine/showdown-order.acceptance.test.ts::a later hand that beats or ties the best shown hand is shown`

### SPEC-04: A losing later hand is mucked and hidden everywhere
- Verifies: AC#4
- Behaviour: Given W2, When the hand completes, Then:
  - no `result.showdown` entry has seat 1, and no entry's holeCards contain 5h or 5s;
  - `showdownOf(end)` has no seat 1 entry;
  - for every seat 1..6, `playerView(later, seat, [showdownOf(end)])` has no `earlierShowdowns` entry for seat 1 and
    no shown card 5h or 5s, where `later` = `createHand({stakes, seats: six at $160, button: 4, deck: fixedDeck({})})`;
  - for every seat other than 1, `playerView(end, seat)` (the completed hand) does not contain seat 1's cards in
    any field other than seat 1's own `holeCards`.
- Verification: acceptance `tests/engine/showdown-order.acceptance.test.ts::a losing hand is mucked and absent from the result and later views`

### SPEC-05: Side pot settled before the main pot, each among its eligible seats
- Verifies: AC#5
- Behaviour: Given W4 (main $28 eligible [1,3,5], side $8 eligible [1,5]), When showdown is resolved, Then the
  showdown seats are `[5, 1]`: all-in seat 3's QQ mucks behind the AA already face up from the side pot. The awards
  are `[{pot:0, amount:28, winners:[{seat:1, amount:28}]}, {pot:1, amount:8, winners:[{seat:1, amount:8}]}]`, and the
  stacks are 1:184, 3:0, 5:148. Given W5, Then seat 3 (eligible only for the main pot) is in no side-pot award.
- Verification: acceptance `tests/engine/showdown-order.acceptance.test.ts::the side pot is resolved before the main pot, each among its eligible seats`

### SPEC-06: A bot shows for the side pot it wins, and the all-in seat wins the main pot
- Verifies: AC#6
- Behaviour: Given W5 (seat 3 all-in with AA, seat 5 KK, seat 1 QQ), When showdown is resolved, Then:
  - the showdown seats are `[3, 5]` (seat 5 shown; seat 1 mucked, and no entry holds Qh/Qs);
  - the awards are `[{pot:0, amount:28, winners:[{seat:3, amount:28}]}, {pot:1, amount:8, winners:[{seat:5, amount:8}]}]`
    (seat 5 wins the side pot, and the main pot goes to seat 3);
  - the stacks are 1:148, 3:28, 5:156.
- Verification: acceptance `tests/engine/showdown-order.acceptance.test.ts::a bot shows for the side pot it wins and the all-in seat wins the main pot`

### SPEC-07: showdownOf keeps shown hands in showdown order and omits mucked hands
- Verifies: AC#7
- Behaviour: Given W2 completed, When `showdownOf(end)` builds the entry, Then it equals
  `{shown: [{seat:4, holeCards:[4h,4s]}, {seat:5, holeCards:[8h,8s]}, {seat:2, holeCards:[Kh,Ks]}]}`. For every
  seat, `playerView(later, seat, [entry]).earlierShowdowns` equals `[entry]`. Given W5 completed, Then
  `showdownOf` gives seats `[3, 5]` and no seat 1 entry.
- Verification: acceptance `tests/engine/showdown-order.acceptance.test.ts::showdownOf keeps shown hands in showdown order and omits mucked hands`

### SPEC-08: The hand result lists shown losing hands after the winners and never a mucked hand
- Verifies: AC#8
- Behaviour: Given `SHOWN_HANDS` (= W9) and When `handResultView` runs, Then it returns exactly W9's `winners` and
  `shown`.
  When `TableView` renders, Then the status block holds, in this order:
  - the Winners list with one `li[data-seat="2"]`, text `Ben wins $16 · Pair of kings`, cards Kh Ks in
    "Ben's cards";
  - then `<ul aria-label="Shown hands">` with `li[data-shown-seat="4"]` text `Dee shows · Pair of fours`, cards 4h 4s
    in "Dee's cards";
  - then `li[data-shown-seat="5"]` text `You show · Pair of eights`, cards 8h 8s in "Your shown cards".
  No `data-card` of 5h or 5s appears anywhere in the rendered HTML. Given KINGS_SHOWDOWN (seat 5 mucked) and
  AVA_UNCONTESTED (fold-out), Then `shown` is `[]` and no "Shown hands" list is rendered.
- Verification: acceptance `tests/ui/hand-result-shown.acceptance.test.tsx::shown losing hands follow the winners in showdown order and mucked hands never appear`

### SPEC-09: A short all-in river raise makes its seat show first
- Verifies: AC#1
- Behaviour: Given W6, When the river closes, Then the showdown seats are `[5, 2]` and the award is
  `{pot:0, amount:32, winners:[{seat:2, amount:32}]}` (A-1).
- Verification: unit `tests/engine/showdown-order.test.ts::a short all-in raise on the river makes its seat show first`

### SPEC-10: A pot only one seat can win is awarded without a show
- Verifies: AC#5
- Behaviour: Given W7, When the runout completes, Then the showdown seats are `[3]` (seat 5's KK is never shown),
  `result.returned` is `{seat:5, amount:8}`, the awards are
  `[{pot:0, amount:20, winners:[{seat:3, amount:20}]}, {pot:1, amount:12, winners:[{seat:5, amount:12}]}]`, and the
  stacks are 2:148, 3:20, 5:160 (A-3).
- Verification: unit `tests/engine/showdown-order.test.ts::a pot only one seat can win is awarded without a show`

### SPEC-11: A runout with no river betting starts left of the button
- Verifies: AC#2
- Behaviour: Given W8 (seat 5 raised preflop, seat 3 called all-in, board run out), Then the showdown seats are
  `[3, 5]` and the award is `{pot:0, amount:22, winners:[{seat:5, amount:22}]}` (D-3).
- Verification: unit `tests/engine/showdown-order.test.ts::a runout with no river betting starts left of the button`

### SPEC-12: Random all-in hands follow the pot-by-pot show/muck rule
- Verifies: AC#3, AC#4, AC#5, AC#6, DoD#1
- Behaviour: Given 5,000 seeded random hands (`Xoshiro128` seeded as in `tests/engine/short-all-in.property.test.ts:17-26` with seed `1115`, decks from `shuffledDeck`, 2-6 seats, stacks $5..$60, random button,
  uniformly random legal action), When each completes at showdown, Then:
  - the `result.showdown` seats are distinct, active, and in O order (O computed by the test as in §5);
  - every winner of a pot with ≥ 2 eligible seats is shown;
  - every active seat not shown is strictly out-ranked, in every pot with ≥ 2 eligible seats it is eligible for, by
    a shown seat eligible for that pot;
  - every award equals `splitPot(amount, best-rank seats among all eligible seats, button, seats)` (no pot is
    forfeited by a muck);
  - for one-pot hands, the shown list equals the running-max rule exactly;
  - `checkState(end)` (`src/engine/invariants.ts:416`) is `[]`.
  Each of these is non-zero: hands with ≥ 2 pots, hands with a muck, and hands where a seat shows for a side pot
  but wins nothing in the main pot.
- Verification: unit `tests/engine/showdown-order.property.test.ts::5,000 random all-in hands follow the pot-by-pot show and muck rule`

### SPEC-13: Locked tests change only as approved and still pass
- Verifies: DoD#1, DoD#2
- Behaviour: Given edits E1-E4 and U1 exactly as §5 states (no assertion removed or loosened), When `npm test` runs,
  Then `tests/engine/hand.acceptance.test.ts`, `tests/engine/hand.property.test.ts`,
  `tests/engine/side-pots.acceptance.test.ts`, `tests/ui/user-shown-cards.acceptance.test.tsx` and
  `tests/table/hand-result.test.ts` pass. Every other locked test file is byte-unchanged.
- Verification: command `npm test && git diff --stat main -- tests e2e`

### SPEC-14: The result block with shown hands works in Chromium and WebKit, fits and is axe clean
- Verifies: DoD#7, DoD#8
- Behaviour: Given scene `'shown-hands'` opened with `openTableScene`, When the page renders at 1280x720, Then:
  - `getByRole('list', {name: 'Winners'})` has one item with text "Ben wins $16 · Pair of kings";
  - `getByRole('list', {name: 'Shown hands'})` items read in order "Dee shows · Pair of fours" and
    "You show · Pair of eights";
  - the groups "Dee's cards" and "Your shown cards" each hold two cards;
  - no `svg[data-card="5h"]` or `svg[data-card="5s"]` exists on the page;
  - the status block's right edge is ≤ 1280 and `document.documentElement.scrollWidth` ≤ 1280;
  - `expectNoSeriousAxeViolations` passes;
  - every request is same-origin.
- Verification: acceptance `e2e/showdown-shown.spec.ts::shown losing hands appear after the winner, mucked cards never, axe clean`

### SPEC-15: Checks pass and the playtest baseline is byte-identical
- Verifies: DoD#2, DoD#4, DoD#5, DoD#6, DoD#10
- Behaviour: Given the change, When `npm run lint`, `npm run typecheck` and `npm test` run, Then each exits 0 and the
  coverage thresholds hold (engine ≥ 90%). The boundary tests pass: no UI import in `src/engine`.
  `npm run playtest -- --hands 10000 --seed 42 --size 6` exits 0 with output byte-identical to `main`
  (`Ended by fold: 5470`, `Ended at showdown: 4530`, `Player actions: 88831`, `Streets capped at 4 bets: 244`,
  `Largest pot: $70`, `Invariant violations: 0`). `npm run e2e` passes, and CI on `doit/TASK-1.15` is green.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run playtest -- --hands 10000 --seed 42 --size 6 && npm run e2e`

### SPEC-16: Story documentation and N/A DoD items
- Verifies: DoD#3, DoD#9, DoD#11, DoD#12
- Behaviour: Given the task is done, Then a Backlog doc describes the order rule, the pot-by-pot show/muck rule with
  W4/W5, A-1..A-5, the Q-1..Q-4 answers and the locked-test edits. The N/A items are recorded: DoD#3 (golden-spot
  suite not yet created), DoD#9 (no strategy content) and DoD#12 (the service worker doesn't exist yet).
- Verification: manual `backlog doc list --plain` shows the TASK-1.15 doc

## 7. Edge cases
- Single pot, all tie: every seat ties the first shown hand, so all are shown, and the pot splits as today
  (`hand.acceptance` tieOne/tieThree stay `[2,5]`/`[5,2]`). SPEC-03.
- The first shower in O is all-in and mucked in a side-pot hand: SPEC-05 (seat 3).
- A pot with one eligible seat: SPEC-10.
- A short all-in raise as the last river raise: SPEC-09.
- Runout with no river action: SPEC-11.
- Fold-out: `showdown` stays `[]`, and `handResultView.shown` is `[]` (SPEC-08, AVA_UNCONTESTED).
- Three or more pots: SPEC-12 (random stacks give multiple side pots).
- The user's own hand mucked: their cards stay at their seat (`table-view.ts:172`) and are absent from the result
  (Q-1). Covered by E4's scenario, where the user wins, and by SPEC-08's user-shown line.
- Invalid input, concurrency, permissions: N/A (pure functions over already-validated state).

## 8. Security considerations
- Hidden information (REQ-025.1) is the point of this task. Mucked hole cards leave `HandResult`, so they can't
  reach `showdownOf`, `CompletedHand`, `EarlierShowdown` or later `PlayerView`s (SPEC-04, SPEC-07, SPEC-12).
  `PlayerView` keeps copying fields by name (`player-view.ts:70`).
- No new trust boundary, dependency, network request (SPEC-14 checks same-origin) or randomness (the property test
  uses the existing `Xoshiro128`).

## 9. Non-functional
- Showdown work is O(pots × seats²) with ≤ 10 seats and ≤ 10 pots: negligible. The playtest's 10,000 hands stay
  within the existing `tests/ci/speed-limits` budgets. No new performance target.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 10000 --seed 42 --size 6`
- New tests (path → SPEC ids):
  - `tests/engine/showdown-order.acceptance.test.ts` → SPEC-01..07
  - `tests/ui/hand-result-shown.acceptance.test.tsx` → SPEC-08
  - `tests/engine/showdown-order.test.ts` → SPEC-09..11
  - `tests/engine/showdown-order.property.test.ts` → SPEC-12
  - `e2e/showdown-shown.spec.ts` → SPEC-14
  - Edits E1-E4, U1 → SPEC-13
- End-to-end scenario for the Judge:
  1. `npm run dev`, play hands at the default table checking or calling to showdown. Several hands in, confirm:
     losing bots behind a better shown hand show no cards, and any shown losing hand appears as "<Name> shows · <hand>"
     after the winner line.
  2. `npm run e2e -- e2e/showdown-shown.spec.ts` → passes in Chromium and WebKit.
  3. `npm run playtest -- --hands 10000 --seed 42 --size 6` → the §3 numbers, and byte-identical to `main`.
  4. `python3 ~/.claude/skills/doit/scripts/doit.py test-integrity TASK-1.15` → only E1-E4 changed among locked files.

## 11. Open questions
- None. Resolved in `doit/TASK-1.15/qa.md` (all auto-accepted with the Recommended option, 2026-11-21):
  - Q-1: the user's hand follows the same automatic show/muck rule as bots (D-1). Their own cards stay face up at
    their seat (REQ-019.6), and a shown user hand reads "You show · <hand>".
  - Q-2: no automatic tabling of all-in hands. All-in hands follow the pot-by-pot show/muck rule (W4 seat 3 mucks).
  - Q-3: the "Shown hands" list after Winners, as specified in §5 and SPEC-08/SPEC-14.
  - Q-4: locked-test edits E1-E4 are approved, with unlocks recorded under TASK-1.4, TASK-1.10 and TASK-3.22.

## 12. Clarifications log
See `doit/TASK-1.15/qa.md`.
