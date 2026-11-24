# Spec: TASK-9.4 — See the hand number, my cards, position, result and replay code in the review

Status: READY (approved 2026-11-24)
Task: TASK-9.4 · Parent/epic: TASK-9 · Requirements: REQ-043 (043.3, 043.4), REQ-013 (013.4, 013.5) · Dream: limit-holdem-trainer

## 1. Summary
The Hand Review panel header now sums up the hand. Under the existing "Hand #N review" heading, a subtitle shows
the user's net result for the hand ("You lost $48"), the user's two hole cards and the user's position name
("Cutoff"). A small-text line in the panel shows the hand number and the hand's replay code, the same code the hand
record stores, so the user knows which hand they are reviewing and can quote it in a bug report. All values come
from the finished hand that is already in memory; nothing is stored or graded again.

## 2. Scope
- In scope:
  - A pure model in `src/table/review.ts`: `netResult(hand)`, `resultText(net)` and
    `reviewSummary(hand, handNumber)`.
  - `ReviewPanel` renders the subtitle and the replay-code line from an optional `summary` prop. `TableView`
    builds the summary from `completedHand(table)` and `table.handNumber` while the panel is shown.
  - Styles for the subtitle (14 px), its two small drawn cards and the replay line (12 px, wraps).
  - Two new test fixtures (`REVIEW_LOST_48` at hand 133, `REVIEW_WON_56`), a `review-header` table scene, unit,
    acceptance and Playwright tests, and docs.
- Not doing:
  - Any change to the review entries, the heading text "Hand #N review", Close or Deal next hand.
  - Opponents' shown cards (TASK-9.5), the "hinted" tag (TASK-9.6), the grade summary badge and auto-open
    (TASK-9.7), the 1-second timing (TASK-9.8), approximate/short-stack labels (TASK-9.9).
  - Chip amounts without `$` in sit-and-go (TASK-5.3); the result text uses `$` in every game type (A-4).
  - A copy-to-clipboard button for the replay code, or replaying a hand from its code.
  - Any change to the persisted hand-record format, `parseHandRecord`, the engine, bots, advice or stats.
  - A review rebuilt from a stored `HandRecord` (history screens).
  - Edits to any locked test (none is needed, see A-6).
- Scope budget: files=11, lines=650

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | `TableView` builds the summary itself with `reviewSummary(completedHand(table), table.handNumber)` when it renders the panel. `ReviewState` and `HeldReview` do not change. If `completedHand(table)` is null, no subtitle and no replay line are drawn. | yes | While a review is held the next hand is held too (`src/ui/table/Table.tsx:327`), so `table.hand` is the reviewed hand. Locked tests pass `review={{ entries, open }}` without a hand (`tests/ui/review-panel.acceptance.test.tsx:12`), so a new required `ReviewState` field would break them. | Add `hand` or `summary` to `ReviewState` |
| A-2 | Net result = the user's share of every pot award + the uncalled amount returned to the user − every chip the user put in (`ActionRecord.added`, blinds included). It always equals the user's final stack minus starting stack. | yes | `CompletedHand` has `actions`, `result.awards` and `result.returned` (`src/table/session.ts:699-718`, `src/engine/hand.ts:53-80`); awards exclude the returned amount (`src/engine/hand.ts:76`). Checked on 10 fixtures, e.g. `RAISE_TAKES_BLINDS`: put 8, award 10, returned 4 → +6. | Store final stacks on `CompletedHand` |
| A-3 | The position name is `positionName(hand.userSeat, <the hand's seat numbers ascending>, hand.button)`, the same name the table shows on the user's seat (`src/ui/table/Table.tsx:98`). | yes | One source for position names; it gives "Cutoff" for the AC example. Heads-up gives "Small blind" / "Big blind". | `CHART_POSITIONS` / `SEAT_NAMES` wording ("the cutoff") |
| A-4 | The result text uses `$` in cash and sit-and-go alike. | yes | Review entries and the hand result already use `$` in both; TASK-5.3 changes every sit-and-go amount at once. | Chips wording now |
| A-5 | The subtitle's hole cards are drawn at 24 × 34 px; the group is `role="group"` with `aria-label="Your hole cards"`. | yes | Smaller than the entries' 30 × 42 board cards so the subtitle stays one line beside the 18 px heading. "Your cards" is already the user seat's group (`src/ui/table/Table.tsx:104`) and is matched by locked tests. | 30 × 42; reuse "Your cards" |
| A-6 | No locked test needs an edit. Checked: `tests/ui/review-panel.acceptance.test.tsx` (TASK-9.1/9.3: aside tag, `<h2 …>Hand #1 review</h2>`, entry regexes scoped to `<ol aria-label="Decisions">`, banned `TBD`, `…`, `undefined`, `null`, `[object` over the panel text), `tests/ui/review-numbers.acceptance.test.tsx` (TASK-9.3: `%` banned only inside the preflop entry), `tests/ui/table-display.acceptance.test.tsx:234` (TASK-3.3: no replay code during the hand), `tests/ui/bust-continue.acceptance.test.tsx` (TASK-9.2), `e2e/review.spec.ts` (TASK-9.1: `getByRole('complementary', { name: 'Hand #1 review' })`, heading focus, `getByRole('status')` count 0), `e2e/review-numbers.spec.ts` (TASK-9.3: ten-seat panel no horizontal overflow), `e2e/bust-continue.spec.ts` (TASK-9.2), `e2e/showdown-shown.spec.ts:25` (TASK-1.15: page-wide no `5h`/`5s` card; that scene opens no review). The new markup keeps `aria-labelledby="review-heading"`, adds no `role="status"`, no `li[data-seat]`, no "Your cards" group, and no banned text; the replay code is 32 hex digits, which cannot spell `null` or `undefined`. | yes | Grep of every `doit/*/state.json` `locked_tests` entry naming review, table or e2e files. | — |

## 3. Current system
- React 19 + Vite, strict TS. Vitest runs in `node` with v8 coverage; `src/{engine,bots,advice,stats,playtest,table}`
  need 90 % lines, 70 % overall (`vite.config.ts:7-19`). UI tests render `TableView` with `renderToString`
  (`tests/ui/review-panel.acceptance.test.tsx:10-15`). Playwright runs Chromium and WebKit at 1280 × 720; axe
  through `e2e/support/axe.ts`. Scripted screens render through `e2e/support/table-scenes.tsx` and
  `openTableScene` (`e2e/support/table-harness-bundle.ts:228-248`).
- The panel: `src/ui/table/ReviewPanel.tsx:13-63` (heading at :18, `.review-head` with Close at :17-24, entries
  `<ol aria-label="Decisions">` at :25). `TableView` renders it at `src/ui/table/Table.tsx:279-285` with
  `handNumber={table.handNumber}`.
- The finished hand: `CompletedHand` (`src/table/session.ts:699-718`) has `replayCode`, `button`, `seats`
  (every dealt-in seat), `userSeat`, `userHoleCards`, `actions`, `result`. `completedHand(table)`
  (`src/table/session.ts:721`) returns null until the hand has a result. The hand record copies
  `hand.replayCode` (`src/table/hand-record.ts:224`) and its `handNumber` is `TableState.handNumber`
  (`src/table/hand-record.ts:77-78`).
- Replay code: 32 lowercase hex characters (`src/engine/deck.ts:5-8`). It is never shown during the hand
  (locked `tests/ui/table-display.acceptance.test.tsx:234`).
- Styles: `.review-panel` is 400 px wide with 20 px padding (`src/ui/styles.css:713-724`); entry moves are 15 px,
  chart/numbers/explanation 14 px (`src/ui/styles.css:819-844`); muted text colour `#a7aeb8` (:782).
- Existing code to reuse:
  - `src/table/table-view.ts:108` `positionName` → the position name (A-3).
  - `src/ui/cards/PlayingCard.tsx:40` `PlayingCard` → the two hole cards (`data-card`, `aria-label` "Ace of hearts").
  - `src/table/session.ts:721` `completedHand` → the hand the summary is built from.
  - `tests/support/table-scenarios.ts:271` `userTableAfter` and `:309` `REVIEW_DECK` → the new fixtures.
  - `e2e/support/table-scenes.tsx:55-58` `openReview` → the scene's open review.
  - `e2e/support/hand-records.ts:80,128` `storedRecords`, `playToResult`; `e2e/support/table-harness-bundle.ts:52`
    `stubReplayWords`; `e2e/support/paused-clock.ts:10,119` `runUntil`, `axeWithPausedClock` → the live e2e.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Summary computed in `TableView` from `completedHand(table)` (A-1). | New `ReviewState` field | No locked-test edits; same hand object | no | n/a |
| D-2 | Subtitle reads `<result> · <two drawn cards> · <position>`, e.g. "You lost $48 · A♥ 9♠ · Cutoff". | Storyboard text "You lost $48 · A♥ 9♠ in the cutoff" with suit glyphs as text | Drawn cards match every other card on screen and follow the deck-colour setting; position as the seat shows it | yes | user (Q-1) |
| D-3 | Zero net reads "You broke even". | "You won $0"; "Even" | Plain English, no "$0" | yes | user (Q-3) |
| D-4 | Replay line "Hand #133 · Replay code 9e3779b9000000010000000200000003" in 12 px under the subtitle, inside the panel header area. | At the panel foot; code only | Visible without scrolling, small text with the hand number as REQ-013.5 words it | yes | user (Q-2) |

## 5. Design

### Files to create / modify
- `src/table/review.ts` — `ReviewSummary`, `netResult`, `resultText`, `reviewSummary`.
- `src/ui/table/ReviewPanel.tsx` — optional `summary` prop; subtitle and replay line.
- `src/ui/table/Table.tsx` — pass `summary` from `completedHand(table)`.
- `src/ui/styles.css` — `.review-title`, `.review-summary`, `.review-replay`; `.review-head` aligns to the top.
- `tests/support/table-scenarios.ts` — `REVIEW_LOST_48`, `REVIEW_WON_56`.
- `e2e/support/table-scenes.tsx` — `review-header` scene (REVIEW_LOST_48 with its open review).
- `e2e/support/table-harness-bundle.ts` — add `'review-header'` to `TableScene`.
- `tests/table/review-summary.test.ts` (new) — unit tests of the model.
- `tests/ui/review-header.acceptance.test.tsx` (new) — rendered header tests.
- `e2e/review-header.spec.ts` (new) — scene and live app, Chromium and WebKit, axe.
- `docs/ui/review.md` — a "Header" section (title becomes "Hand Review panel (TASK-9.1, TASK-9.3, TASK-9.4)").

### Components, interfaces and data
In `src/table/review.ts`:
```ts
export interface ReviewSummary {
  readonly handNumber: number;
  readonly holeCards: readonly [Card, Card];   // hand.userHoleCards, a copy
  readonly position: string;                    // positionName(...)
  readonly net: number;                         // netResult(hand)
  readonly resultText: string;                  // resultText(net)
  readonly replayCode: ReplayCode;              // hand.replayCode
}
/** The user's net chips for the hand: award shares + returned − put in. */
export function netResult(hand: CompletedHand): number;
/** 'You won $<n>' (n > 0) | 'You lost $<-n>' (n < 0) | 'You broke even' (0). */
export function resultText(net: number): string;
export function reviewSummary(hand: CompletedHand, handNumber: number): ReviewSummary;
```
`reviewSummary` lets `positionName`'s RangeError propagate (cannot happen for a hand built by `completedHand`).

`ReviewPanelProps` gains `readonly summary?: ReviewSummary | null` (default null). With a summary the markup is:
```html
<div class="review-head">
  <div class="review-title">
    <h2 id="review-heading" tabindex="-1">Hand #133 review</h2>          <!-- unchanged -->
    <div class="review-summary" data-part="summary">
      <span data-part="result">You lost $48</span> ·
      <span role="group" aria-label="Your hole cards" class="table-cards"><svg data-card="Ah"…/><svg data-card="9s"…/></span> ·
      <span data-part="position">Cutoff</span>
    </div>
    <p class="review-replay" data-part="replay">Hand #133 · Replay code <span data-part="replay-code">9e3779b9000000010000000200000003</span></p>
  </div>
  <button … aria-label="Close review">…</button>                            <!-- unchanged -->
</div>
<ol aria-label="Decisions" …>                                               <!-- unchanged -->
```
The separators are the text `' · '`. Without a summary the panel is exactly as today apart from the
`.review-title` wrapper around the heading. All values are rendered as React text (no HTML injection).

`TableView` (`src/ui/table/Table.tsx:279`): inside the existing `review?.open === true && review.entries !== null`
branch, `const hand = completedHand(table)` and pass
`summary={hand === null ? null : reviewSummary(hand, table.handNumber)}`.

### Rules and algorithms
- `netResult(hand)` = Σ `w.amount` for every `award.winners` entry with `w.seat === hand.userSeat`
  + (`hand.result.returned?.seat === hand.userSeat ? returned.amount : 0`)
  − Σ `a.added` for every `a` in `hand.actions` with `a.seat === hand.userSeat`.
- Seat numbers for the position: `hand.seats.map((s) => s.seat)` sorted ascending.
- Worked examples (all checked by running the fixtures; stakes $4/$8, six seats at $160, button 6, user seat 5 =
  Cutoff, `SCENARIO_CODE` = `9e3779b9000000010000000200000003`):
  - `REVIEW_LOST_48` = `{ ...userTableAfter(REVIEW_DECK, '3:fold 4:fold 5:raise 6:fold 1:fold 2:raise 5:raise 2:call 2:bet 5:raise 2:call 2:bet 5:raise 2:call 2:bet 5:call'), handNumber: 133 }`.
    User A♥ 9♠ puts in 16 + 8 + 16 + 8 = 48; Ben (K♦ 7♣) wins the $98 pot with kings → net −48,
    "You lost $48", position "Cutoff", 5 user decisions.
  - `REVIEW_WON_56` = `userTableAfter({ 0: 'Qc', 6: 'Jd', 1: 'Kd', 7: '7c', 2: 'Tc', 8: 'Th', 3: '5c', 9: '5d', 4: 'Ah', 10: 'As', 13: 'Ks', 14: '9d', 15: '4c', 17: '2h', 19: '6s' }, '3:raise 4:call 5:raise 6:fold 1:raise 2:call 3:call 4:fold 5:call' + ' 1:check 2:check 3:check 5:check'.repeat(3))`.
    User, Ava, Ben and Cal each put in 16, Dee 8: the user puts in $16 and wins the whole $72 pot with aces →
    net +56, "You won $56".
  - `REVIEW_FOUR`: put 20, nothing won → "You lost $20". `RAISE_TAKES_BLINDS`: put 8, award 10, returned 4 →
    "You won $6".
  - `resultText(0)` → "You broke even"; `resultText(1)` → "You won $1"; `resultText(-4)` → "You lost $4".

### Error handling and configuration
- No new errors. `completedHand(table) === null` → panel without subtitle and replay line (A-1).
- CSS: `.review-head { align-items: flex-start }`; `.review-title { display: flex; flex-direction: column;
  gap: 4px; min-width: 0 }`; `.review-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
  color: #a7aeb8; font-size: 14px }`; `.review-summary svg[data-card] { width: 24px; height: 34px }`;
  `.review-replay { margin: 0; color: #a7aeb8; font-size: 12px; overflow-wrap: anywhere }`;
  `[data-part='replay-code'] { font-family: ui-monospace, monospace }`.

## 6. Behaviour specification

### SPEC-01: Lost hand header shows hand number, cards, position and loss
- Verifies: AC#1, AC#4, DoD#1
- Behaviour: Given `REVIEW_LOST_48` (hand 133, user A♥ 9♠ in the cutoff, net −48) and its open review
  (`storedReviewEntries(hand, hand.userDecisions.map(decisionRecord))`), When `TableView` renders it, Then the
  panel heading is `Hand #133 review`; directly under it (inside `.review-title`, after the `</h2>`) the
  `data-part="summary"` element's parts are: `data-part="result"` = `You lost $48`, the group
  `aria-label="Your hole cards"` holds exactly `svg[data-card]` `Ah`, `9s` in that order, and
  `data-part="position"` = `Cutoff`; the summary text (tags stripped) is `You lost $48 ·  · Cutoff`
  (D-2, approved by Q-1). The panel text contains none of `TBD`, `…`, `undefined`, `null`, `[object`.
- Verification: acceptance `tests/ui/review-header.acceptance.test.tsx::hand 133 header shows the cards, Cutoff and You lost $48`

### SPEC-02: Won hand header shows the net win
- Verifies: AC#2, AC#4, DoD#1
- Behaviour: Given `REVIEW_WON_56` (user put in $16, won the $72 pot) and its open review, When rendered, Then
  `data-part="result"` = `You won $56`, the hole-card group holds `Ah`, `As`, and `data-part="position"` = `Cutoff`.
- Verification: acceptance `tests/ui/review-header.acceptance.test.tsx::a $16 stake that wins the $72 pot shows You won $56`

### SPEC-03: Replay code equals the hand record's and is in small text
- Verifies: AC#3, AC#4, DoD#1
- Behaviour: Given `REVIEW_LOST_48`, its record `handRecord(completedHand(table), meta)` with
  `meta.handNumber = 133`, When `TableView` renders the open review, Then the panel has exactly one
  `data-part="replay"` element with text `Hand #133 · Replay code 9e3779b9000000010000000200000003` (D-4, approved by Q-2),
  its `data-part="replay-code"` text equals `record.replayCode`, and the element has class `review-replay`. With
  `review` null, closed (`open: false`) or `entries: null`, the markup contains neither the replay code nor
  `data-part="summary"`. In `src/ui/styles.css`, `.review-replay`'s `font-size` (12px) is smaller than every
  entry text size (`[data-part='moves']` 15px, `[data-part='chart']`/`.review-numbers`/`[data-part='explanation']`
  14px), parsed from the stylesheet.
- Verification: acceptance `tests/ui/review-header.acceptance.test.tsx::the replay code equals the hand record's, in small text, only while the panel is open`

### SPEC-04: Net result model
- Verifies: AC#1, AC#2, DoD#1, DoD#4
- Behaviour: `netResult(completedHand(T))` is −48 for `REVIEW_LOST_48`, +56 for `REVIEW_WON_56`, −20 for
  `REVIEW_FOUR`, +6 for `RAISE_TAKES_BLINDS` (returned $4 counted), −8 for `CALL_THEN_FOLD`, and for each equals
  the user's final `stack − startingStack` in `T.hand.players`. `resultText` gives `You won $56`, `You lost $48`,
  `You broke even` (0), `You won $1`, `You lost $4`.
- Verification: unit `tests/table/review-summary.test.ts::netResult is award shares plus returned minus chips put in`
  and `tests/table/review-summary.test.ts::resultText words a win, a loss and a zero`

### SPEC-05: Summary model fields
- Verifies: AC#1, AC#3, DoD#1, DoD#4
- Behaviour: `reviewSummary(completedHand(REVIEW_LOST_48), 133)` equals `{ handNumber: 133, holeCards: [Ah, 9s],
  position: 'Cutoff', net: -48, resultText: 'You lost $48', replayCode: '9e3779b9000000010000000200000003' }`.
  For `SHOWN_HANDS` (button 3, user seat 5) the position is `Big blind` and the net −4, and for
  `TEN_SEAT_SHOWDOWN` the position is `Cutoff`; in both cases the position equals `tableView(T)`'s user seat
  `position`, the name the table shows on the user's seat.
- Verification: unit `tests/table/review-summary.test.ts::reviewSummary reads the hand number, cards, position, result and replay code`

### SPEC-06: Live hand shows the stored record's replay code and the seat's cards and position
- Verifies: AC#3, AC#4, DoD#1, DoD#7, DoD#8
- Behaviour: Given the app with replay words pinned to `[0x9e3779b9, 1, 2, 3]` (`stubReplayWords`) and a paused
  clock, When the user calls/checks hand 1 to its result (`playToResult(page, 1, …, { play: 'call' })`) and the
  panel `getByRole('complementary', { name: 'Hand #1 review' })` appears and one hand record is stored, Then
  `[data-part="replay-code"]` text = the stored record's `replayCode` = `9e3779b9000000010000000200000003`; the
  replay line reads `Hand #1 · Replay code 9e3779b9000000010000000200000003`; the "Your hole cards" `data-card`s
  equal the user seat's (`li[data-user] svg[data-card]`); `data-part="position"` in the summary equals the user
  seat's `[data-part="position"]` text; `data-part="result"` equals `You lost $<160 − s>` / `You won $<s − 160>` /
  `You broke even` where `s` is the user seat's stack shown at the result (the user posts no blind in hand 1:
  button 6). The replay line's computed `font-size` is smaller than every `[data-part="explanation"]`'s. axe
  reports no serious or critical violations; every request is same-origin. Runs in Chromium and WebKit.
- Verification: acceptance `e2e/review-header.spec.ts::the review header of a live hand matches the seat and the stored record`

### SPEC-07: Scene header layout at 1280 × 720
- Verifies: AC#1, AC#3, AC#4, DoD#7, DoD#8
- Behaviour: Given the `review-header` scene (REVIEW_LOST_48, open review) at 1280 × 720, Then the panel's
  heading reads `Hand #133 review`, the summary shows `You lost $48`, cards `Ah` `9s` and `Cutoff`, and the replay
  line `Hand #133 · Replay code 9e3779b9000000010000000200000003`; the summary's bounding box starts below the
  heading's and above the first `li[data-entry]`; the replay line's computed font size (12px) is smaller than the
  first entry's `[data-part="moves"]` (15px) and `[data-part="explanation"]` (14px); the panel has no horizontal
  overflow (`scrollWidth − clientWidth ≤ 0`) and the replay line's right edge is inside the panel; axe reports no
  serious or critical violations; no http(s) request is made. Chromium and WebKit.
- Verification: acceptance `e2e/review-header.spec.ts::the hand 133 header shows result, cards, position and the replay code in small text`

### SPEC-08: Repo checks, golden suite, coverage, boundaries, playtest
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#6, DoD#8
- Behaviour: lint, typecheck and `npm test` pass with zero errors; `tests/golden/` passes 100 %; coverage holds
  (new `src/table/review.ts` code is unit-tested); no engine, bot, advice or stats source changes and no new
  network API (SPEC-06/07 assert same-origin); the 10,000-hand playtest reports 0 invariant violations.
- Verification: command `npm run lint && npm run typecheck && npm test && npx vitest run tests/golden/ && npm run -s playtest -- --hands 10000 --seed 42`

### SPEC-09: Existing review flows still pass
- Verifies: DoD#7, DoD#10
- Behaviour: The full Playwright suite passes in Chromium and WebKit (including the locked `e2e/review.spec.ts`,
  `e2e/review-numbers.spec.ts` ten-seat layout, `e2e/bust-continue.spec.ts`, `e2e/showdown-shown.spec.ts`), and
  CI is green on `doit/TASK-9.4`.
- Verification: command `npm run e2e && gh run list --branch doit/TASK-9.4 --limit 1`

### SPEC-10: Docs and N/A items
- Verifies: DoD#9, DoD#11, DoD#12
- Behaviour: `docs/ui/review.md` has a "Header" section describing the heading, the summary parts
  (`result`, "Your hole cards", `position`), the net-result rule (A-2), the replay line and that the code is the
  hand record's `replayCode`, shown only after the hand ends (REQ-013.4/.5). The story doc is published to
  Backlog.md. DoD#9 N/A: no strategy content. DoD#12 N/A: there is no service worker yet (`serviceWorker` does
  not appear in `src/`).
- Verification: manual read `docs/ui/review.md`; `backlog doc list --plain` lists the TASK-9.4 doc

## 7. Edge cases
- Net zero (e.g. a chopped pot where the user's share equals what they put in): "You broke even" (SPEC-04).
- Odd-chip splits: net is the exact chip count, e.g. "You won $1" (SPEC-04).
- Uncalled bet returned to the user: counted (SPEC-04, `RAISE_TAKES_BLINDS`).
- User wins only a side pot / is all-in: awards per pot are summed (rule; covered by the general sum in SPEC-04;
  `SIDE_POT_SHOWDOWN` net +40 may be added to the same test).
- Heads-up and 7–10 seats: `positionName` handles them; the ten-seat review scene (locked
  `e2e/review-numbers.spec.ts`) must still fit (SPEC-09).
- Busted user (stack $0) with the review held: the summary shows the loss; Continue unchanged (SPEC-09,
  `e2e/bust-continue.spec.ts`).
- Panel closed then Deal next hand: summary unmounts with the panel; during the next hand no replay code is shown
  (SPEC-03 null/closed cases; locked `tests/ui/table-display.acceptance.test.tsx:234`).
- Concurrency, permissions, dependency failure: N/A — pure rendering of in-memory data.

## 8. Security considerations
- Trust boundaries: none new. All values come from the in-memory `CompletedHand` (engine output), rendered as
  React text; seat names are not shown in the header.
- No secrets, no logging, no new dependencies, no randomness. The replay code is not secret; it is already stored
  and is shown only after the hand ends (REQ-013.4).

## 9. Non-functional
- Rendering cost: one pass over the hand's actions and awards (< 60 items) per panel render; no measurable cost.
- Accessibility: subtitle text contrast `#a7aeb8` on `#1a1d22` ≈ 8:1; cards have names ("Ace of hearts"); axe
  zero serious/critical (SPEC-06/07).
- Layout: no horizontal scroll at 1280 × 720, six and ten seats (SPEC-07, SPEC-09).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`, start a game, play a hand past the preflop, and read the review panel header.
- New tests (path → SPEC ids):
  - `tests/ui/review-header.acceptance.test.tsx` → SPEC-01, SPEC-02, SPEC-03
  - `tests/table/review-summary.test.ts` → SPEC-04, SPEC-05
  - `e2e/review-header.spec.ts` → SPEC-06, SPEC-07
- End-to-end for the Judge: `npx playwright test e2e/review-header.spec.ts e2e/review.spec.ts e2e/review-numbers.spec.ts e2e/bust-continue.spec.ts e2e/showdown-shown.spec.ts`.
  Then in `npm run dev`, play a hand to the end and check: the subtitle's result matches your stack change, the
  cards match your seat, the position matches your seat's label, and the replay code appears only in the panel.

## 11. Open questions
None. Q-1, Q-2 and Q-3 were answered in `doit/TASK-9.4/qa.md` (recommended options); see D-2, D-4 and D-3.

## 12. Clarifications log
See `doit/TASK-9.4/qa.md`.
