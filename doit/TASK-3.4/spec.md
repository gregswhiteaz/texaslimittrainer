# Spec: TASK-3.4 — See who won each hand and get the next hand dealt automatically

Status: READY (approved 2026-11-18 by user via Q-1..Q-4)
Task: TASK-3.4 · Parent/epic: TASK-3 · Requirements: REQ-019.7, REQ-024.1, REQ-024.3 (REQ-007.1, REQ-007.4, REQ-020.1 touched by AC#5) · Dream: limit-holdem-trainer

## 1. Summary
When a hand ends, the table shows a result: each winner, the amount they won and, after a showdown, the winning
hand's name ("Pair of kings"). A pot won uncontested shows the winner and the amount only. A split pot shows each
winner with their share. Then, with no input from the user, the next hand is dealt 1.5 s after the result appears.
Stacks carry over, the button moves one seat and the header counts up (Hand #2, #3, …). This replaces TASK-3.1's
"one hand per load" (TASK-3.1 Q-1/D-3). The next-hand timer has a hold input, so E09 (TASK-9.1) can suspend it
while the Hand Review panel is open (REQ-024.2).

## 2. Scope
- In scope:
  - A headless result model and hand names (new `src/table/hand-result.ts`).
  - `nextHand` / `nextHandDelay` in `src/table/session.ts`: stack carry-over, the button moving one seat,
    `handNumber + 1`, and the below-minimum stack rule (Q-4).
  - A next-hand timer in `useTableSession` with a hold input.
  - The result block in `Table.tsx`, which replaces the bare "Hand over" status.
  - Removing or covering the unreachable fallbacks named in AC#6 and AC#7.
  - Tests, plus the listed edits to earlier stories' tests (D-2).
- Not doing:
  - The Hand Review panel, the Deal next hand button and auto-open (E09, TASK-9.1). This story only provides the
    hold input.
  - Casino show/muck order and losers' cards at showdown (TASK-1.15). Opponents' shown cards in the review are
    TASK-9.5.
  - Side-pot display (TASK-3.8). One line per winner is summed over all awards.
  - All-in support and a relaxed `createHand` minimum (TASK-1.9, TASK-1.10, TASK-1.14). Skipping busted seats
    for the button (TASK-1.16).
  - The Rebuy / Leave table dialog at $0 (TASK-3.11). Replacing a busted bot with a new bot (TASK-6.8).
  - Storing the completed hand (TASK-3.9). Saving the session (TASK-3.10).
  - Realistic pacing (TASK-3.18). Chip and deal animation (TASK-4.6). Branded layout (TASK-3.16).
  - Uncalled-bet return (TASK-1.9 AC#5). The uncontested amount is the engine's award today (A-6).
  - Any change to bots, advice or the playtest runner.
- Scope budget: files=15, lines=1150

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The 1.5 s timer moves to the next hand and deals it in one state update (`dealHand(nextHand(t), code)`), so no empty "between hands" table ever renders. The replay code is drawn inside the timer callback. | yes | The deal lands exactly 1500 ms after the result appears (AC#4). No code is drawn while the result is shown. | Two steps: `nextHand`, then a 0 ms deal step (adds up to one macrotask) |
| A-2 | The button moves to the next session seat clockwise (next higher seat number, wrapping). No seat is ever skipped, because the Q-4 rule leaves every seat at least at the engine minimum. | yes | AC#5 says "moves one seat". Skipping busted seats is TASK-1.16. | Skip seats below the minimum |
| A-3 | The E09 seam is `nextHandDelay(table, hold)` (pure) plus a `holdNextHand?: boolean` option on `useTableSession` (default `false`). While `true`, no timer is pending. When it turns `false` a fresh 1.5 s timer starts. | yes | TASK-9.1's notes say "gate the same next-hand timer". A pure function can be unit-tested, and the hook has no test harness (Vitest env is `node`, `vite.config.ts:8`). | A `dealNext()` callback now (no consumer until E09) |
| A-4 | `onHandComplete` fires once per hand, keyed on `handNumber` instead of `replayCode` (`useTableSession.ts:45`). | yes | Hands can now share a code: the e2e stub returns the same words for every draw (`e2e/support/table-harness-bundle.ts:15-24`). | Keep the replayCode key |
| A-5 | AC#6 and AC#7 fallbacks become explicit throws covered by unit tests. `completedHand`'s `?? 0` and its user throw become one helper, which throws `RangeError('Seat <n> is not dealt in')`. `tableView`'s `?? 0` becomes a helper that throws `RangeError('Seat <n> has no stack')`. | yes | AC#6/#7 allow "removed or covered". A silent `0` would be a wrong value, and a throw states the invariant. | Delete the lookups with non-null casts |
| A-6 | A winner's amount is the engine's award share (`PotAward.winners[].amount`), which includes the winner's own chips. Example: Ava's uncontested $4 flop bet is inside "Ava wins $16". | yes | Matches the storyboard ("Ben wins $122" = the whole pot). TASK-1.9 AC#5 changes uncalled bets later. | Show only the opponents' chips |
| A-7 | Winners are listed in the engine's award order: clockwise from the left of the button, the same order `splitPot` uses (`hand.ts:266-280`). A seat in several awards gets one line with the sum. | yes | Deterministic. Per-pot lines are TASK-3.8. | Ascending seat order |
| A-8 | `minimumStack(stakes) = 8 × smallBet + 8 × bigBet` is exported from `src/engine/hand.ts`, and `validate` uses it, so the session and the engine share one number. | yes | It removes a duplicated constant. The refactor does not change behaviour. | Duplicate the formula in `session.ts` |
| A-9 | The result block sits where "Hand over" was: inside the Table section, after the action bar. Colours are `#F2F3F5` / `#A7AEB8` text on `#1A1D22`, with a `1px solid #343A43` border and 10 px radius (already used for the action bar). | yes | Earlier e2e locators find `[role="status"]` in the section. The branded layout is TASK-3.16. | Put it on the felt as in the Review storyboard |
| A-10 | Scripted result states for Vitest are built in `tests/support/table-scenarios.ts` with a fixed-deck helper. Expected e2e values for the pinned words `9e3779b9 00000001 00000002 00000003` are listed in §5 and were checked by running the engine. | yes | Deterministic tests. Every new hand reuses the same pinned deck, and only the button moves. | Compute the expected values inside the e2e test |

## 3. Current system
- Stack and tests:
  - TypeScript (strict), React 19 and Vite. Vitest runs in the `node` environment with v8 coverage
    (`vite.config.ts:4-17`): 70% lines overall, 90% for `src/{engine,bots,advice,stats}`.
  - Playwright runs Chromium and WebKit at 1280 × 720 (`playwright.config.ts:13-15`) against
    `vite preview` on `http://localhost:4173`.
  - The headless boundary lint covers `engine`, `bots`, `advice` and `stats` (`tools/lint/headless-boundary.js:6`).
- `src/table/session.ts`:
  - `TableState` (`:103-115`) has `stacks` (chips before the hand) and `handNumber` (always 1 today; TASK-3.3 A-3).
  - `nextStep` returns `'done'` once `hand.result` is set (`:133-138`).
  - `dealHand` always uses `config.button` (`:145`). That is why the button never moves today.
  - `completedHand` (`:196-217`) has the AC#6 fallbacks: `?? 0` at `:200` and the throw at `:203`.
  - `buyIn` = 20 × big bet (`:39-41`).
- `src/engine/hand.ts`:
  - `createHand` rejects any stack below `8 × smallBet + 8 × bigBet` ($96 at $4/$8) with a RangeError
    (`:151-156`). $96 is the most one seat can put in under the 4-bet cap: 4×$4 + 4×$4 + 4×$8 + 4×$8. So no
    all-in can happen, and `allIn` is always false (`:34`).
  - `HandResult` (`:66-75`) holds `endedBy`, `showdown` (every unfolded seat with hole cards and rank; no
    mucking yet) and `awards` (one pot).
  - `foldOut` awards the whole gathered pot to the last seat (`:292-308`). `endRound` splits ties through
    `splitPot`, giving odd units clockwise from the left of the button (`:317-336`).
  - After the award, `pots[0].amount` is 0 and every `streetContribution` is 0.
- `src/engine/hand-evaluator.ts`: `evaluate` (5–7 cards, `:168`) and `handCategory` (nine categories, `:206-213`).
  Hand names with rank detail were left to a later story (doc-7 "Known limitations"). No task other than this one
  covers REQ-019.7 (`dreams/limit-holdem-trainer/rtm.md:113`), so this story owns the names.
- `src/engine/player-view.ts`: `playerView` gives the viewer only their own hole cards (`:62-110`). `showdownOf`
  (`:122-129`) is the shown-hands record.
- `src/table/table-view.ts`:
  - `tableView` reads the hand only through the user's `PlayerView` (TASK-3.3 D-1, `:140-185`).
  - The button comes from `view?.button ?? config.button` (`:145`). The stack fallback `?? 0` (AC#7) is at `:160`.
  - `potTotal` = pots + street bets, which is $0 after the award (TASK-3.3 A-4, `:124-129`).
  - `headerText` prints `Hand #<handNumber>` (`:46-49`).
- `src/ui/table/useTableSession.ts:31-51`:
  - Deal and bot steps each run on a 0 ms timer. `'done'` schedules nothing.
  - The `onHandComplete` guard is keyed on `replayCode` (`:45`).
- `src/ui/table/Table.tsx:106-107`: after the action bar, `{model.handOver && <p role="status">Hand over</p>}`.
- Requirements:
  - REQ-007.2 and REQ-007.5 act only at **$0** (rebuy dialog, TASK-3.11; bot replacement, TASK-6.8). REQ-007.4:
    "The user cannot add chips while their stack is above $0" (`requirements.md:153-160`).
  - None of them covers a stack that is above $0 but below the engine minimum. That gap exists only until
    all-ins land (TASK-1.9 to 1.16).
  - The playtest resets every seat to $160 before each hand until TASK-1.16 (`src/playtest/runner.ts:28, :135`).
- Measured drift (engine run, check/call user, TAG bots, real carry-over, 200 seeded sessions): 115 of 200
  sessions had a seat below $96 within 50 hands. The median was hand 33 and the earliest hand 9. At 200 hands per
  hour that is minutes of play, so AC#5 needs a rule now.
- Storyboard (`dreams/limit-holdem-trainer/storyboards/Review.dc.html:27-31`) has these lines on the felt:
  - "Showdown: Ben shows K♦ 7♣, pair of kings"
  - "Ben wins $122"
  - "Board K♠ 9♦ 4♣ 2♥ 6♠"
  - a "Deal next hand" button (E09)

  The header reads "Hand #133 finished".
- Existing code to reuse (path → what to reuse instead of writing new):
  - `src/engine/hand-evaluator.ts` → `evaluate`, `handCategory` for the category. `src/engine/cards.ts` →
    `cardRank` for rank counts.
  - `src/engine/hand.ts` → `HandResult`/`PotAward` as the source of winners and amounts. Never recompute a split.
  - `src/table/session.ts` → `buyIn`, `dealHand`, `nextStep`, `seatSession`.
  - `src/ui/cards/PlayingCard.tsx` → `PlayingCard` for shown winner cards.
  - `tests/support/table-scenarios.ts` → `play(hand, moves)`, `SHOWDOWN` (storyboard: You win $54 with a pair
    of nines), `SCENARIO_CODE`.
  - E2E helpers to copy (TASK-3.16 dedupes them):
    - `installPausedClock` and `runFor1000` (50 ms slices)
    - the `axeWithPausedClock` worker-timer scan
    - `countReplayDraws` (`e2e/table-display.spec.ts:19-26`)
    - `stubReplayWords`, `expectToAct` (`e2e/support/*`)
    - the slice loop that plays to the end of the hand (`e2e/action-bar.spec.ts:243-247`)

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The result model is a separate pure function, `handResultView(table)`, in `src/table/hand-result.ts`. `TableView` renders it next to `tableView`. It reads `hand.result` only once the hand is complete. It exposes only winners, amounts, hand names and (Q-3) the showdown winners' hole cards, never a losing hand. | Put the result inside `tableView` | Keeps TASK-3.3 D-1 intact: `tableView` reads only the user's `PlayerView`. The one new read of hidden state is isolated, filtered and tested (SPEC-06). | yes | user (Q-3, qa.md: winners' cards only) |
| D-2 | Edit earlier stories' locked tests only as listed in §5, "Planned edits to earlier stories' tests". E1 is required by REQ-024.3: TASK-3.1 SPEC-14 asserts no new deal 3 s after the hand. E2 and E3 move hand-end checks onto the paused clock, so the 1.5 s deal cannot race them. E4 adds a field to a support literal. No assertion is removed or weakened. | Keep real timers and hope the checks finish within 1.5 s; drop the 3 s check | REQ-024.3 contradicts the old check. Fake time makes the rest deterministic. Same precedent as TASK-3.3 D-5, TASK-3.2 D-4 and TASK-2.1 Q-3. | yes | orchestrator (D-2 in qa.md, on precedent: TASK-2.1 Q-3, TASK-3.2 Q-1, TASK-3.3 D-5) |
| D-3 | Hand names: §5 "Rules", wording per Q-1. | see Q-1 | User-visible text | yes | user (Q-1, qa.md) |
| D-4 | Result text and layout: "Hand over" title line, one line per winner, "You win" for the user, and the pot line after the award. Per Q-2. | see Q-2 | User-visible text and UX | yes | user (Q-2, qa.md) |
| D-5 | Seats below the engine minimum before the next hand, per Q-4. | see Q-4 | Fairness and user-visible chip changes, plus REQ-007.4 | yes | user (Q-4, qa.md; interim) |
| D-6 | The timer delay is the constant `NEXT_HAND_DELAY_MS = 1500` (REQ-024.3). Realistic speed does not change it. | Tie the delay to speed | REQ-024.3 gives 1.5 s for every speed. | no | n/a |

## 5. Design

### Files to create / modify
- `src/engine/hand.ts` — modify: export `minimumStack(stakes)`; `validate` uses it (A-8).
- `src/table/session.ts` — modify:
  - add `TableState.button`; `seatSession` sets it to `config.button`, and `dealHand` uses `table.button`
  - add `NEXT_HAND_DELAY_MS`, `nextHandDelay`, `nextHand` and the below-minimum rule
  - `completedHand` helper (A-5)
- `src/table/hand-result.ts` — create: `handName`, `handResultView`, `WinnerView`, `HandResultView`.
- `src/table/table-view.ts` — modify: dealer marker from `table.button`; stack helper replaces `?? 0` (A-5).
- `src/ui/table/useTableSession.ts` — modify: next-hand timer, `holdNextHand` option, `handNumber`-keyed
  report guard (A-1, A-3, A-4).
- `src/ui/table/Table.tsx` — modify: the `HandResult` block replaces `<p role="status">Hand over</p>`.
- `src/ui/styles.css` — modify: `.hand-result` styles (A-9).
- `tests/support/table-scenarios.ts` — modify:
  - add `button: 6` to `tableAt` (E4)
  - add the `fixedDeck` helper and the result states `KINGS_SHOWDOWN`, `AVA_UNCONTESTED` and `SPLIT_STRAIGHT`
- `tests/table/hand-result.test.ts` — create: unit tests for names and result rules (SPEC-05, SPEC-06).
- `tests/table/next-hand.test.ts` — create: unit tests for `nextHand`/`nextHandDelay` errors, the seam and the
  fallbacks (SPEC-08, SPEC-12, SPEC-13 part, SPEC-15).
- `tests/table/next-hand.acceptance.test.ts` — create: AC#5 and AC#7 at session level (SPEC-09, SPEC-10,
  SPEC-11, SPEC-13).
- `tests/ui/hand-result.acceptance.test.tsx` — create: rendered results for AC#1 to AC#3 (SPEC-01 to SPEC-03).
- `e2e/next-hand.spec.ts` — create: browser result, auto-deal timing, Hand #2 and #3, Leave during the result,
  axe, same-origin (SPEC-04, SPEC-07, SPEC-14).
- `e2e/table.spec.ts` — modify (TASK-3.1, D-2): edits E1 and E2.
- `e2e/action-bar.spec.ts` — modify (TASK-3.2, D-2): edit E3.

### Components, interfaces and data
`src/engine/hand.ts`:
```ts
/** Least stack createHand accepts: the most one seat can put in under the 4-bet cap. $96 at $4/$8. */
export function minimumStack(stakes: Stakes): number; // 8 * smallBet + 8 * bigBet
```
`src/table/session.ts`:
```ts
export interface TableState { /* existing fields */ readonly button: SeatNumber; } // button of the current/next hand
export const NEXT_HAND_DELAY_MS = 1500;
/** ms until the next hand is dealt: NEXT_HAND_DELAY_MS when nextStep is 'done' and !hold; else null. */
export function nextHandDelay(table: TableState, hold?: boolean): number | null;
/** The session ready for the next deal. RangeError('Not a next-hand step') unless nextStep(table) === 'done'. */
export function nextHand(table: TableState): TableState;
```
`nextHand` returns `{ ...table, stacks, button, handNumber: handNumber + 1, hand: null, replayCode: null, userDecisions: [] }`:
- `stacks`: each `hand.players[i].stack`, in ascending seat order, after the below-minimum rule (§ Rules).
- `button`: the session seat after `hand.button` (A-2).
- `config` is unchanged: `config.button` stays the starting button.

`src/table/hand-result.ts` (headless: imports only `src/engine/*` and `./session` types):
```ts
export interface WinnerView {
  readonly seat: SeatNumber;
  readonly name: string;             // SessionSeat.name
  readonly isUser: boolean;
  readonly amount: number;           // sum of this seat's shares over result.awards (A-6, A-7)
  readonly text: string;             // "Ben wins $122" | "You win $54" (Q-2)
  readonly handName: string | null;  // showdown only (Q-1); null when endedBy === 'fold'
  readonly holeCards: readonly [Card, Card] | null; // showdown winners only (Q-3); null when uncontested
}
export interface HandResultView {
  readonly endedBy: 'fold' | 'showdown';
  readonly winners: readonly WinnerView[]; // award order (A-7), at least one
}
/** Name of the best five-card hand among 5–7 cards (Q-1). RangeError as evaluate() on bad input. */
export function handName(cards: readonly Card[]): string;
/** Null unless table.hand has a result. */
export function handResultView(table: TableState): HandResultView | null;
```
- A winner's `handName` = `handName([...holeCards, ...hand.board])`, using that winner's entry in `result.showdown`.
- Only seats in `result.awards[].winners` appear. No loser's hole cards are read into the output.

`src/ui/table/useTableSession.ts`:
- `TableSessionOptions` gains `holdNextHand?: boolean`.
- When `nextHandDelay(table, holdNextHand)` is a number, the effect:
  1. calls `onHandComplete` once for that `handNumber` (A-4);
  2. sets a timer for that delay, whose callback draws `const code = newCode()` and then runs
     `setTable((t) => (nextStep(t) === 'done' ? dealHand(nextHand(t), code) : t))`.
- The effect cleanup clears the timer on unmount, Leave table and StrictMode re-runs. `onHandComplete` also
  fires when the hand is held.

`src/ui/table/Table.tsx`, rendered when `handResultView(table) !== null`, in place of the old `<p role="status">`.
The wording is per Q-2:
```html
<div role="status" class="hand-result">
  <p class="hand-result-title">Hand over</p>
  <ul aria-label="Winners">
    <li data-seat="2">
      <span data-part="winner">Ben wins $122</span>
      <span aria-hidden="true"> · </span><span data-part="hand-name">Pair of kings</span>   <!-- showdown only -->
      <div role="group" aria-label="Ben's cards" class="table-cards"> <PlayingCard/> <PlayingCard/> </div> <!-- Q-3 -->
    </li>
  </ul>
</div>
```
Card groups in the result are labelled `"<name>'s cards"` for bots (e.g. "Ben's cards") and `"Your shown cards"`
for the user, so no group name repeats the user's seat group "Your cards" (TASK-3.3 locators).

### Rules and algorithms
1. **Hand names (Q-1, approved).** Take the category from `handCategory(evaluate(cards))`. The ranks come from the counts of
   `cardRank` over the given cards. Plural rank words are twos, threes, fours, fives, sixes, sevens, eights,
   nines, tens, jacks, queens, kings, aces. Singular capitalised words are Two … Ace.

   | Category | Name | Ranks used |
   |---|---|---|
   | high-card | `<Top> high` | highest rank present |
   | one-pair | `Pair of <p>` | the rank with count 2 |
   | two-pair | `Two pair, <hi> and <lo>` | the two highest ranks with count 2 |
   | three-of-a-kind | `Three of a kind, <t>` | the rank with count 3 |
   | straight | `Straight` | — |
   | flush | `Flush` | — |
   | full-house | `Full house, <t> over <p>` | t = highest rank with count ≥ 3; p = highest other rank with count ≥ 2 |
   | four-of-a-kind | `Four of a kind, <q>` | the rank with count 4 |
   | straight-flush | `Straight flush` | — |

   Worked examples:
   - `Kd 7c` + `Ks 9d 4c 2h 6s` → "Pair of kings"
   - `3h 8h` + `Jd 6h 9h 3c 8s` → "Two pair, eights and threes"
   - `Kc Kd` + `5c 6d 7h 8s 9c` → "Straight"
   - `Ah 9s` + `Ks 9d 4c 2h 7c` → "Pair of nines"
   - `Ah Kd` + `Qs 9d 4c 2h 7c` → "Ace high"
   - Three pairs `Kh Kd` + `Qs Qd 4c 4h 7c` → "Two pair, kings and queens"
   - Two trips `7h 7d` + `7s 9d 9c 9h 2c` → "Full house, nines over sevens"
   - `Ah 2d` + `3s 4d 5c 9h Kc` (wheel) → "Straight"
   - `Ad Kd` + `Qd Jd Td 2c 3h` → "Straight flush"
   - `7h 7d` + `7s 7c 9d 2h 3c` → "Four of a kind, sevens"
   - `7h 7d` + `7s 9d 2c 4h Kc` → "Three of a kind, sevens"
   - `Ah 2h` + `5h 9h Kh 3c 4d` → "Flush"
2. **Winner text (Q-2, approved).** A "Hand over" title line, then one line per winner:
   - A bot winner reads `<name> wins $<amount>`. The user reads `You win $<amount>`.
   - At a showdown, ` · <hand name>` follows the winner text.
   - Uncontested: no hand name, no " · " and no cards.
   - The pot line keeps TASK-3.3 A-4: "Pot $0" after the award, because the winner's stack already includes
     the chips.
   - Examples: KINGS_SHOWDOWN → "Ben wins $122 · Pair of kings"; SPLIT_STRAIGHT → "Ava wins $30 · Straight",
     then "Ben wins $30 · Straight"; AVA_UNCONTESTED → "Ava wins $16"; storyboard SHOWDOWN → "You win $54 ·
     Pair of nines".
3. **Shown cards (Q-3, approved: winners only).**
   - At a showdown, each winner's two hole cards are shown face up in its result line, the user
     included. A losing hand is never shown, so this is a strict subset of what TASK-1.15's casino order will
     show. Bot seats keep their card backs (TASK-3.3 A-8).
   - An uncontested winner's cards are never shown (AC#2).
4. **Next hand (AC#5).** The button moves to `seats[(indexOf(hand.button) + 1) % n]` over the ascending session
   seats: 6 → 1 → 2 → … at 6 seats. Example: stacks after the first pinned fold hand are
   `[164,156,160,160,160,160]`. After `nextHand`, `button` is 1 and `handNumber` is 2. `dealHand` then posts SB
   seat 2 and BB seat 3, giving `[164,154,156,160,160,160]`.
5. **Below-minimum rule (Q-4, approved as interim).**
   - Until all-ins exist: in `nextHand`, every seat, user or bot, whose final stack is
     `< minimumStack(stakes)` is set to `buyIn(config.stake)`. The bot keeps its name and style. Nothing else
     changes.
   - Example at $4/$8: `[158, 222, 160, 160, 95, 165]` → `[158, 222, 160, 160, 160, 165]`, and 96 stays 96.
   - The top-up code in `nextHand` must carry this comment, verbatim apart from line wrapping:
     `// TEMPORARY (TASK-3.4 Q-4): tops seats below minimumStack back to the buy-in because the engine has no`
     `// all-in yet. Removal is an acceptance criterion on TASK-1.16 / TASK-3.11 (whichever lands last).`
     SPEC-10 checks the comment.
   - This bends REQ-007.4 for now. Nothing is stored or reported yet (qa.md Q-4).
6. **Timer (AC#4).** The result renders at commit time T0. The effect then registers one timer with
   `NEXT_HAND_DELAY_MS`. At T0 + 1500, the next hand's deal commits in the same update (A-1). Under the paused
   Playwright clock, the result commit happens at a slice boundary, so the measured gap is 1500 ms.
7. **Hand number (AC#7).** `handNumber` rises by exactly 1 per `nextHand`. The header shows `… · Hand #2` from
   the commit that deals hand 2.

Pinned-words reference values (A-10; engine run, TAG bots, default table, button 6 at hand 1). The same deck is
used every hand.

| Path | Result | Stacks after the hand | Next deal |
|---|---|---|---|
| Hand 1, user check/call | showdown. Ben (seat 2, `3h 8h`) wins $10 with "Two pair, eights and threes" over You (`4c Qd`, high card). Board `Jd 6h 9h 3c 8s`. | `[158,166,160,160,156,160]` | — |
| Hand 1, user folds at first turn | fold-out, "Ava wins $12" | `[164,156,160,160,160,160]` | hand 2: button 1, `[164,154,156,160,160,160]`, Dee (4) to act |
| Hand 2, user folds at first turn | fold-out, "Ben wins $12" | `[164,160,156,160,160,160]` | hand 3: button 2, `[164,160,154,156,160,160]`, You (5) to act |

Scripted Vitest states (`tests/support/table-scenarios.ts`). Each uses the default 6 seats, every stack $160,
button 6, `handNumber` 1, and `fixedDeck(fixed)`. `fixedDeck` places the given deck indexes and fills the rest
in ascending card order. Index map: seat k gets indexes k−1 and k+5, flop is 13–15, turn 17, river 19.
- `KINGS_SHOWDOWN`:
  - Deck: `{1:'Kd',7:'7c',4:'Ah',10:'9s',13:'Ks',14:'9d',15:'4c',17:'2h',19:'6s'}`.
  - Moves: `3:fold 4:fold 5:raise 6:fold 1:fold 2:raise 5:call 2:bet 5:raise 2:call 2:bet 5:raise 2:call 2:bet
    5:raise 2:raise 5:call`.
  - Result: showdown, one award $122 to seat 2. Stacks `[158,222,160,160,100,160]`.
- `AVA_UNCONTESTED`:
  - Deck: `{}`, so Ava holds `2c 3h`.
  - Moves: `3:fold 4:fold 5:call 6:fold 1:call 2:check 1:bet 2:fold 5:fold`.
  - Result: fold-out, $16 to seat 1. Flop `5d 5h 5s`.
- `SPLIT_STRAIGHT`:
  - Deck: `{0:'Kc',6:'Kd',1:'Qc',7:'Qd',13:'5c',14:'6d',15:'7h',17:'8s',19:'9c'}`.
  - Moves: `3:call 4:fold 5:fold 6:fold 1:raise 2:call 3:fold 1:bet 2:call 1:bet 2:call 1:bet 2:call`.
  - Result: showdown, $60 split 30/30 to seats 1 and 2, both straight.

### Planned edits to earlier stories' tests (D-2) — nothing else in these files changes
- **E1** `e2e/table.spec.ts:178-220`, "check or call at every decision plays to showdown with my cards face up".
  TASK-3.1 SPEC-14 conflicts with REQ-024.3.
  1. Call `installPausedClock(page)` first.
  2. Add a file-local helper `nextTurnPaused(page)`. It runs up to 400 × `page.clock.runFor(50)` until an
     enabled "Your actions" button (→ `'user'`) or `handOver(page)` (→ `'done'`) is present. The loop at `:185`
     uses it instead of `nextTurn`.
  3. `:212`: count face-up cards outside the result:
     `evaluateAll(svgs => svgs.filter(s => s.closest('[role="status"]') === null).length)` on
     `tableSection(page).locator('svg[data-card]:not([data-card="back"])')`. It stays `7`.
  4. `:214-217`: replace `waitForTimeout(3000)` with 28 × `page.clock.runFor(50)` (1400 ms of app time). Then
     `actionCount` is unchanged, `handOver` is visible, the user's cards are unchanged, and the header still ends
     `Hand #1`.
  - Every other assertion stays as is.
- **E2** `e2e/table.spec.ts:222-239`, "after a preflop fold the bots finish the hand without me".
  1. Call `installPausedClock(page)` first.
  2. `:224`: `expect(await nextTurnPaused(page)).toBe('user')`.
  3. After `clickAction(page, 'Fold')`, run `nextTurnPaused(page)` and expect `'done'`.
  - The checks that follow are unchanged: `turns` length 1, counts strictly increasing, last `toAct` `''`.
- **E3** `e2e/action-bar.spec.ts:170-188`, the "real" second context in "the bar is disabled and submits nothing
  off-turn or after the hand".
  1. Change the comment to "Second context on its own paused clock".
  2. Call `installPausedClock(real)` before `openApp(real)`.
  3. `:177`: `await runFor1000(real)`, then `await expectToAct(real, '5')`.
  4. After `clickAction(real, 'Fold')`, run the slice loop `for (slice < 400 && handOver(real).count() === 0)
     await real.clock.runFor(50)` before `expect(handOver(real)).toBeVisible()`.
  - The `waitForTimeout(500)` (real time, for click effects) and every assertion stay.
- **E4** `tests/support/table-scenarios.ts:68-78` `tableAt`: add `button: 6` (new required `TableState` field).
  No assertion lives in this file.
- Compatible without edits:
  - The `handOver` locators (`getByRole('status').filter({ hasText: 'Hand over' })`) in `e2e/table.spec.ts:88`,
    `e2e/action-bar.spec.ts:79` and `e2e/table-display.spec.ts:92` still match, because the result keeps
    "Hand over" (Q-2).
  - The locked `tests/ui/table-display.acceptance.test.tsx:185-192` (pot = pots + street bets for every state,
    $0 at SHOWDOWN) still holds, because the pot line keeps A-4 (Q-2).
  - `tests/table/table-view.test.ts:184` (`pot` 0 at SHOWDOWN) still holds.
  - The locked `tests/table/session.acceptance.test.ts:194` `record.button` 6 for hand 1 still holds.
  - The real-timer e2e tests that stop at the hand end or earlier stay valid. Two of them run an axe scan right
    after "Hand over" (`e2e/table.spec.ts:279-281`), and the next deal cannot fail that scan.
  - If Q-2's answer drops "Hand over" or Q-2 changes the pot line, the edit list grows. The `handOver` locator
    changes in 3 files, or the locked `table-display.acceptance.test.tsx:185-192` changes for the final state.

### Error handling and configuration
- `nextHand` throws `RangeError('Not a next-hand step')` unless `nextStep(table) === 'done'`. `dealHand` keeps
  `'Not a deal step'`.
- `completedHand` and `tableView` throw the A-5 messages for impossible tables (seat not dealt in, or seat with no
  stack).
- `handName` propagates `evaluate`'s RangeError (fewer than 5 or more than 7 cards, duplicates).
- After Q-4's rule, `createHand`'s minimum RangeError cannot be reached from the app.
- Configuration: `NEXT_HAND_DELAY_MS = 1500` and `holdNextHand` (default `false`).

## 6. Behaviour specification

### SPEC-01: Showdown result shows the winner, amount and hand name
- Verifies: AC#1, DoD#1
- Behaviour: Given `KINGS_SHOWDOWN` (Ben, seat 2, `Kd 7c`, wins the $122 pot over You `Ah 9s`), When
  `renderToString(<TableView table={KINGS_SHOWDOWN} …/>)` is parsed, Then:
  - the `role="status"` block contains "Hand over" and exactly one winner `li[data-seat="2"]`
  - its `data-part="winner"` text is "Ben wins $122" and its `data-part="hand-name"` text is "Pair of kings"
  - per Q-3, its cards group holds exactly `data-card="Kd"` and `data-card="7c"`
  - the pot text is "Pot $0", and Ben's seat stack is "$222"
  - storyboard `SHOWDOWN` renders "You win $54" with "Pair of nines"
- Verification: acceptance `tests/ui/hand-result.acceptance.test.tsx::a showdown result shows Ben, $122 and Pair of kings`

### SPEC-02: Uncontested result shows no hand name and no hole cards
- Verifies: AC#2, DoD#1
- Behaviour: Given `AVA_UNCONTESTED` (all fold to Ava's $4 flop bet; Ava holds `2c 3h`), When rendered, Then:
  - the status has exactly one winner line, `li[data-seat="1"]`, whose winner text is "Ava wins $16"
  - the status has no `data-part="hand-name"`, no " · " and no `svg`
  - the whole markup contains neither `data-card="2c"` nor `data-card="3h"`
  - its face-up cards are exactly the user's two plus the flop `5d 5h 5s`
- Verification: acceptance `tests/ui/hand-result.acceptance.test.tsx::an uncontested pot shows Ava and the amount with no hand name and none of her cards`

### SPEC-03: Split pot shows both winners with their shares
- Verifies: AC#3, DoD#1
- Behaviour: Given `SPLIT_STRAIGHT` ($60 pot; Ava `Kc Kd` and Ben `Qc Qd` both play the `5c 6d 7h 8s 9c`
  straight), When rendered, Then:
  - the status lists two winner lines in award order: seat 1 "Ava wins $30", then seat 2 "Ben wins $30"
  - each line has `data-part="hand-name"` "Straight" and, per Q-3, its own two cards (`Kc Kd`, then `Qc Qd`)
  - Cal's (seat 3, folded) cards appear nowhere in the markup
- Verification: acceptance `tests/ui/hand-result.acceptance.test.tsx::a split pot shows both winners with $30 each and Straight`

### SPEC-04: Results in the live app
- Verifies: AC#1, AC#2, DoD#7, DoD#8
- Behaviour: Given the app with the paused clock and the pinned words, in Chromium and WebKit:
  - (a) When the user checks or calls at every turn of hand 1, using 50 ms slices, Then:
    - the status shows "Hand over" and one winner line, "Ben wins $10 · Two pair, eights and threes" (Q-1)
    - per Q-3, the status holds exactly `data-card` `3h` and `8h`
    - outside the status there are exactly 7 face-up cards: You `4c Qd` and the board `Jd 6h 9h 3c 8s`
    - the axe scan (worker timers) reports no serious or critical violations
  - (b) When, in a fresh page, the user folds at the first turn, Then:
    - the status shows the winner line "Ava wins $12", with no " · " and no `svg`
    - axe is clean
  - Every request in both runs has origin `http://localhost:4173`.
- Verification: acceptance `e2e/next-hand.spec.ts::the result shows the winner, amount and hand name, and nothing of an uncontested winner`

### SPEC-05: Hand names for every category
- Verifies: AC#1, AC#3
- Behaviour: Given `handName`, When called with each worked example in §5 Rules 1, Then it returns exactly that
  name.
  - The cases include three pairs, two trips, the wheel and both straight flushes.
  - For every one of the 9 categories, at least one 7-card example matches `handCategory(evaluate(cards))`.
  - `handName` of 4 cards throws `RangeError`.
- Verification: unit `tests/table/hand-result.test.ts::handName names every category with its ranks`

### SPEC-06: Result model rules and hidden information
- Verifies: AC#1, AC#2, AC#3, DoD#5
- Behaviour: Given `handResultView`, When called on these states, Then:
  - A seated, dealt-in-progress or bot-turn table gives `null`.
  - With `KINGS_SHOWDOWN`, the only cards in the output are Ben's (`JSON.stringify` holds no `holeCards` other
    than `[Kd,7c]` as card numbers), and You's `Ah 9s` is not in it.
  - A crafted completed `HandState` with `result.awards = [{ amount: 61, winners: [{ seat: 2, amount: 31 }, { seat: 4, amount: 30 }] }]`
    lists 2 before 4 with $31 and $30.
  - Two awards that both pay seat 2 give one line with the sum.
  - The user winner's text starts "You win $".
  - The output never contains the replay code.
  - `src/table/hand-result.ts` imports nothing from `react`, `react-dom` or `src/ui`. This is a source scan, as
    in `tests/table/action-bar.test.ts`.
- Verification: unit `tests/table/hand-result.test.ts::the result model lists winners in award order and exposes only winners' cards`

### SPEC-07: The next hand is dealt 1.5 s after the result, with no input
- Verifies: AC#4, AC#5, AC#7, DoD#7
- Behaviour: Given the app with the paused clock, pinned words and a recorder, When the user folds at the first
  turn of hand 1 and gives no further input:
  - Setup:
    - The recorder is an init script. A MutationObserver logs `performance.now()` when a `[role="status"]`
      appears and when `.table-header-line` text changes.
    - The draw counter counts 4-word `getRandomValues` calls.
  - Steps:
    1. Advance in 50 ms slices until the status appears, at T0.
    2. Then advance 28 more slices, to T0 + 1400.
    3. Then advance slice by slice until the header changes, at most 4 slices (T0 + 1600).
  - Then:
    - At T0 + 1400 the header still ends "Hand #1", the status ("Ava wins $12") is visible, `data-action-count`
      is unchanged and the draw count is 1.
    - The header becomes `Cash · 6 players · $4/$8 · Hand #2`, and the recorded gap is within [1400, 1600] ms.
  - At that same slice:
    - the status is gone
    - `data-action-count` is 2
    - the dealer marker is in seat 1
    - the stacks of seats 1–6 read `$164, $154, $156, $160, $160, $160` (hand 1's final stacks minus the new
      blinds)
    - the draw count is 2
  - When hand 2 is played the same way (fold at the user's first turn), Then:
    - the status shows "Ben wins $12"
    - after a gap within [1400, 1600] ms the header ends "Hand #3"
    - the dealer marker is in seat 2, and the stacks read `$164, $160, $154, $156, $160, $160`
    - `expectToAct(page, '5')` holds
- Verification: acceptance `e2e/next-hand.spec.ts::the next hand is dealt 1.5 s after the result with stacks carried and the button moved`

### SPEC-08: The next-hand timer can be held (E09 seam)
- Verifies: AC#4
- Behaviour: Given `nextHandDelay`, When called, Then:
  - It returns `NEXT_HAND_DELAY_MS` (1500) for a completed hand with `hold` omitted or `false`.
  - It returns `null` for a completed hand with `hold = true`.
  - It returns `null` for seated, bot-turn and user-turn tables.
  - `NEXT_HAND_DELAY_MS === 1500`.
- Verification: unit `tests/table/next-hand.test.ts::nextHandDelay is 1500 ms after a hand unless held`

### SPEC-09: Stacks carry over and the button moves one seat
- Verifies: AC#5, DoD#1
- Behaviour: Given each of 20 seeded codes `replayCodeFromWords([i, 1, 2, 3])` played to the end with
  check/call, When `nextHand` is applied and the next hand is dealt, Then:
  - Each seat's `stacks` entry equals its final `hand.players` stack (none is below $96 in these hands), or the
    Q-4 rule value.
  - The new hand's `startingStack`s equal those stacks.
  - `button` and the new `hand.button` are 1, and `config.button` is still 6.
  - `hand`, `replayCode` and `userDecisions` were reset before the deal.
  - Over six consecutive `nextHand` calls the button runs 1, 2, 3, 4, 5, 6.
  - `seatSession({ button: 3 })` moves to 4.
- Verification: acceptance `tests/table/next-hand.acceptance.test.ts::stacks carry over and the button moves one seat each hand`

### SPEC-10: A seat below the engine minimum is handled by the Q-4 rule
- Verifies: AC#5, DoD#1
- Behaviour: Given a completed $4/$8 table (`KINGS_SHOWDOWN`) copied with its `hand.players[].stack` replaced by
  `[158, 222, 160, 160, 95, 165]` (and, in a second case, seat 5 at 96 and seat 1 at 0), When `nextHand` runs
  and the next hand is dealt, Then:
  - no RangeError is thrown
  - per the Q-4 rule, the stacks are `[158, 222, 160, 160, 160, 165]`
  - a seat with exactly 96 keeps 96
  - the topped-up bot keeps its name and style
  - `src/table/session.ts` contains the §5 Rule 5 comment: it has a line matching
    `/TEMPORARY \(TASK-3\.4 Q-4\)/` and the text `TASK-1.16 / TASK-3.11` within 3 lines of the top-up code
- Verification: acceptance `tests/table/next-hand.acceptance.test.ts::a seat below the minimum stack is handled before the next hand instead of a RangeError`

### SPEC-11: Many hands in a row never hit the engine minimum error
- Verifies: AC#5, AC#7
- Behaviour: Given `seatSession()` and 60 consecutive hands, each played with check/call and dealt with
  `replayCodeFromWords([7, k, 2, 3])` via `nextHand`, When the loop runs, Then:
  - no hand throws
  - `handNumber` goes 1…60
  - the button cycles
  - after every hand the chip total equals 960 plus the chips added by the Q-4 rule, counted by the test
  - at least one Q-4 top-up happens in the run. If none does, the builder picks a seed range where one does and
    records it.
- Verification: acceptance `tests/table/next-hand.acceptance.test.ts::sixty hands in a row carry stacks and never raise the minimum-stack error`

### SPEC-12: completedHand fallbacks are gone or covered
- Verifies: AC#6
- Behaviour: Given `src/table/session.ts`, When it is read, Then `completedHand` has no `?? 0`. Given a
  completed table whose `seats` include a seat 7 that the hand did not deal in, When `completedHand` is called,
  Then it throws `RangeError('Seat 7 is not dealt in')`. A table missing the user seat throws the same message
  for seat 5.
- Verification: unit `tests/table/next-hand.test.ts::completedHand throws for a seat that was not dealt in`

### SPEC-13: Header counts hands and the pot line after the award
- Verifies: AC#7, DoD#1
- Behaviour: Given a completed hand 1, When `nextHand` and `dealHand` run, Then `tableView(...).header` is
  `Cash · 6 players · $4/$8 · Hand #2`, and after the next hand it is `… Hand #3`. Given `KINGS_SHOWDOWN` (after
  the award), Then `tableView(...).pot` is 0 (Q-2; A-4 kept) and seat 2's `stack` is 222. Given a seated table
  whose `stacks` lack seat 6, When `tableView` runs, Then it throws `RangeError('Seat 6 has no stack')`, and
  `table-view.ts` has no `?? 0` on the stack line.
- Verification: acceptance `tests/table/next-hand.acceptance.test.ts::the header counts each hand and the pot line reads the decided value after the award`

### SPEC-14: No early deal, and Leave table during the result deals nothing
- Verifies: AC#4, DoD#7
- Behaviour: Given the app with the paused clock, the draw counter and pinned words, When hand 1 ends by the
  user folding and the user clicks "Leave table" 500 ms (10 slices) after the status appears, Then:
  - Home's h1 is focused and the Table region is gone
  - after 60 more slices (3000 ms) the draw count is still 1 and no Table region has returned
- Verification: acceptance `e2e/next-hand.spec.ts::leaving during the result deals no further hand`

### SPEC-15: nextHand refuses a hand in progress
- Verifies: AC#5
- Behaviour: Given seated, bot-turn and user-turn tables, When `nextHand` is called, Then it throws
  `RangeError('Not a next-hand step')` and does not change its input (deep-frozen compare). `minimumStack` is
  96 for $4/$8 and 240 for $10/$20, and `createHand` still rejects 95 at $4/$8.
- Verification: unit `tests/table/next-hand.test.ts::nextHand works only after a completed hand`

### SPEC-16: Earlier stories' flows still pass with the listed edits
- Verifies: AC#4, DoD#7
- Behaviour: Given only edits E1–E4, When `e2e/table.spec.ts`, `e2e/action-bar.spec.ts`,
  `e2e/table-display.spec.ts`, `e2e/home.spec.ts` and `e2e/cards.spec.ts` run in Chromium and WebKit, Then every
  test passes. Every locked Vitest file (`tests/table/session.acceptance.test.ts`,
  `tests/ui/table.acceptance.test.tsx`, `tests/ui/table-display.acceptance.test.tsx`,
  `tests/table/action-bar.acceptance.test.ts`, `tests/ui/action-bar.acceptance.test.tsx`,
  `tests/table/session-config.acceptance.test.ts`, `tests/ui/home.acceptance.test.tsx`) passes unchanged.
- Verification: integration `npx playwright test e2e/table.spec.ts e2e/action-bar.spec.ts e2e/table-display.spec.ts e2e/home.spec.ts e2e/cards.spec.ts`

### SPEC-17: Lint, typecheck, unit tests, coverage and the headless boundary pass
- Verifies: DoD#2, DoD#4, DoD#5
- Behaviour: Given the change, When the checks run, Then:
  - each exits 0
  - coverage is ≥ 90% for engine/bots/advice/stats and ≥ 70% overall
  - the headless-boundary lint passes: `src/engine/hand.ts` gains only `minimumStack` and imports no UI code
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-18: Playtest stays clean after the engine refactor
- Verifies: DoD#6
- Behaviour: Given `minimumStack` is extracted in `hand.ts`, When the 10,000-hand playtest runs, Then it reports
  zero invariant violations and exits 0.
- Verification: command `npm run playtest -- --hands 10000 --seed 42`

### SPEC-19: CI green and story documentation published
- Verifies: DoD#10, DoD#11
- Behaviour: Given branch `doit/TASK-3.4`, When CI runs and the story doc is written, Then the workflow is green.
  `backlog doc list --plain` lists a TASK-3.4 doc that records D-1..D-6 with their Q answers, the D-2 test edits
  and the follow-ups in §13.
- Verification: manual CI run on branch `doit/TASK-3.4` and `backlog doc list --plain`

### SPEC-20: Not-applicable DoD items
- Verifies: DoD#3, DoD#9, DoD#12
- Behaviour: Given the golden-spot suite (E07-S14, TASK-7.11) and the offline service worker (E13-S07,
  TASK-13.4) are not done, and this story adds no strategy content, When the Judge checks, Then the diff touches
  no file under `src/advice`, no golden spot and no strategy text.
- Verification: manual Judge confirms there is no strategy content and that TASK-7.11 and TASK-13.4 are not Done

## 7. Edge cases
- **Split pot with an odd dollar.** Shares come from the engine, e.g. $31/$30, listed clockwise from the left of
  the button. SPEC-06.
- **The user wins.** The text is "You win $X" (SPEC-01 storyboard, SPEC-06).
- **Everyone folds to the user's big blind.** This is a fold-out, with the same rendering as SPEC-02. The user
  made no decision, and the timer still runs. TASK-9.1 AC#4 relies on this.
- **Seat at exactly the minimum, and seat at $0.** A stack at the minimum is kept. A stack at $0 is possible
  when a $96 stack loses everything, and the Q-4 rule handles it (SPEC-10).
- **Leave table, unmount and StrictMode during the result.** The timer is cleared by the effect cleanup and no
  code is drawn (SPEC-14). StrictMode's double effect leaves one timer: cleanup runs between the two runs
  (`src/main.tsx:11-15`).
- **Hold turned on and off.** The pending timer is cleared and a fresh 1.5 s starts (A-3, SPEC-08). There is no
  in-app consumer until E09.
- **Same replay code on consecutive hands (e2e stub).** `onHandComplete` is keyed on `handNumber` (A-4).
- **User clicks during the result.** The bar is disabled (TASK-3.2), and `act` ignores non-user steps
  (`useTableSession.ts:53-55`). The result neither speeds up nor slows down the timer.
- **Showdown losers.** Their cards are never shown (Q-3). The bots' card backs stay (TASK-3.3 A-8).
- **Long sessions.** `handNumber` has no upper bound below `Number.MAX_SAFE_INTEGER`. 60 hands are checked in
  SPEC-11.
- **Side pots and all-ins.** These cannot occur yet (`hand.ts:151-156`). Lines are summed per seat for TASK-3.8.

## 8. Security considerations
- **Hidden information.** `handResultView` is the only new reader of non-`PlayerView` state. It outputs:
  - winners' seats, names and amounts, which are public
  - at showdown only (Q-3), the winners' hole cards and hand names
  
  Losing showdown hands, folded hands and the deck are never read into the output (SPEC-02, SPEC-03, SPEC-04,
  SPEC-06). `tableView` keeps reading through `PlayerView` only (TASK-3.3 D-1).
- **Replay code.** It is never shown. A new code is drawn only when the timer fires (A-1), and TASK-3.3's
  replay-code tests still run over the finished hand (SPEC-16).
- **Fairness.** The Q-4 rule changes chips between hands. It is deterministic and applies equally to every seat
  (Q-4). No randomness is added. Bot replacement styles drawn at random are TASK-6.8.
- **Trust boundaries, storage, network, authn/authz and secrets.** None. There are no new dependencies.

## 9. Non-functional
- **Between-hands delay.** 1500 ms from the result commit to the next deal commit. It is measured with
  Playwright's paused clock within [1400, 1600] ms (SPEC-07). One timer is pending at most.
- **Pace.** With Rapid bots, about 1.5 s per hand plus the user's own time keeps G-5 (200 hands per hour)
  reachable. TASK-3.13 measures it.
- **Render cost.** One `evaluate` per showdown winner per render, on 7 cards, which is negligible.
- **Accessibility.** The result is a `role="status"` live region with text winners. The shown cards keep
  `PlayingCard`'s accessible names. Axe must report zero serious or critical violations at the result in both
  browsers (SPEC-04). The A-9 colours meet contrast: `#F2F3F5` on `#1A1D22` is 15.4:1 and `#A7AEB8` on
  `#1A1D22` is 7.6:1.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview` then open `http://localhost:4173`, choose New game, then Start game (or `npm run dev`)
- New tests (path → SPEC ids):
  - `tests/ui/hand-result.acceptance.test.tsx` → SPEC-01, 02, 03
  - `tests/table/next-hand.acceptance.test.ts` → SPEC-09, 10, 11, 13
  - `tests/table/hand-result.test.ts` → SPEC-05, 06
  - `tests/table/next-hand.test.ts` → SPEC-08, 12, 15
  - `e2e/next-hand.spec.ts` (Chromium and WebKit) → SPEC-04, 07, 14
  - Edited earlier-story tests (D-2: E1–E4) → SPEC-16
  - Commands → SPEC-17, 18
- End-to-end scenario for the Judge:
  1. Run `npm run build && npm run preview`, open `http://localhost:4173`, then New game → Start game. The
     header reads "… · Hand #1".
  2. Fold at your first turn. The bots finish, and a "Hand over" block shows "<name> wins $<amount>" with no
     hand name and no cards.
  3. Without touching anything, about 1.5 s later a new hand is dealt. The header reads "Hand #2", the "D" disc
     has moved one seat clockwise (seat 6 → seat 1), and the stacks are the previous hand's final stacks minus
     the new blinds.
  4. Check or call to showdown. The result shows the winner, the amount and the hand name (e.g. "Ben wins $10 ·
     Two pair, eights and threes"). Per Q-3, the winner's two cards are shown, and no losing bot's cards appear.
  5. Let it run for several hands. "Hand #3, #4, …" count up and no error appears. When a stack drops below
     $96 (after a big loss), the Q-4 rule applies before the next deal.
  6. Click Leave table during a result. Home opens and nothing more is dealt.

## 11. Open questions
- None. The user answered Q-1..Q-4 with the recommended options on 2026-11-18 (`doit/TASK-3.4/qa.md`). They are
  folded into D-1, D-3, D-4, D-5 and §5 Rules 1, 2, 3 and 5. D-2 was decided by the orchestrator on precedent
  (qa.md D-2).

## 12. Clarifications log
See `doit/TASK-3.4/qa.md`.

## 13. Follow-ups (become tasks)
- TASK-9.1: pass `holdNextHand` from the Hand Review panel to `useTableSession`. Add a `dealNext()` for Deal next
  hand that runs `dealHand(nextHand(t), newCode())`, and keep the hold after Close (REQ-043.10).
- TASK-1.16 or TASK-3.11 (whichever lands last): add this AC (committed to the user in qa.md Q-4): "Given a
  seat below the old $96 minimum, When the next hand is dealt, Then its stack is not topped up — it plays its
  chips (or goes to Rebuy / bot replacement at $0) — and the interim top-up in nextHand is removed." The test
  must deal a hand after a seat ends at $95 and assert that the seat starts the next hand with $95. It must also
  assert that `src/table/session.ts` no longer contains `TEMPORARY (TASK-3.4 Q-4)`. Update SPEC-10 and
  SPEC-11 of this story at the same time.
- TASK-6.8: replace a $0 bot in `nextHand` with a new bot (style from the preset, unique name, $160) instead of
  the interim top-up.
- TASK-1.15: when casino show/muck order lands, extend `handResultView` to list the shown losing hands in order.
  Keep winners first.
- TASK-1.9: after uncalled bets are returned, check that "wins $X" uses the award amount (A-6) and update
  SPEC-02's $16 if it changes.
- TASK-3.8: split the result into one line per pot (main pot, side pot 1, …) using `result.awards`.
- TASK-3.9: add a test that `onHandComplete` fires exactly once per hand, including two hands with the same
  replay code (A-4).
- TASK-3.16: place the result on the felt as in the Review storyboard. Move the duplicated e2e helpers
  (`installPausedClock`, `runFor1000`, `axeWithPausedClock`, `nextTurnPaused`, `countReplayDraws`) into
  `e2e/support/`.
- TASK-3.13: assert the 200-hands-per-hour pace with the 1.5 s between-hands delay included.
