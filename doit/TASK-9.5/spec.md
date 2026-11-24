# Spec: TASK-9.5 — See opponents' cards in the review only when they were shown at showdown

Status: READY (approved 2026-11-24)
Task: TASK-9.5 · Parent/epic: TASK-9 · Requirements: REQ-043 (043.6), REQ-025 (hidden information) · Dream: limit-holdem-trainer

## 1. Summary
The Hand Review panel gets a short "shown at showdown" list: one line for each opponent who turned their cards
face up at showdown, in showdown order, with the two drawn cards and the hand name (e.g. "Ben showed K♦ 7♣ · Pair
of kings"). The list is built only from the finished hand's shown-hands field, the same data the hand record
stores, so mucked and folded hands never reach the panel: not in its text, its accessible names, its image labels
or the data passed to it. Nothing is ever dealt again from the replay code to show cards.

## 2. Scope
- In scope:
  - A pure model in `src/table/review.ts`: `ShownOpponent` and `shownOpponents(hand)`, read only from
    `CompletedHand.shown`.
  - `ReviewPanel` renders an optional `shown` prop as a list between the header and the Decisions list.
    `TableView` passes `shownOpponents(completedHand(table))` while the panel is shown.
  - Styles for the list (14 px text, 24 × 34 px cards, wraps).
  - One new fixture (`REVIEW_DEE_MUCKS`), two new table scenes, unit, acceptance and Playwright tests, and docs.
- Not doing:
  - Any change to the table's own showdown display (the "Hand over" block, seats), the engine's show/muck rules
    (TASK-1.15), the hand-record format or `parseHandRecord`.
  - The user's own shown cards in this list (the header already shows them, A-2).
  - A review rebuilt from a stored `HandRecord` (history screens); the "hinted" tag (TASK-9.6) or any other
    TASK-9.x item.
  - Showing a mucked or folded hand on request ("show me what they had"): never, per REQ-043.6 / Q-33.
  - Edits to any locked test (none is needed, see A-6).
- Scope budget: files=11, lines=600

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The shown cards come from `CompletedHand.shown` (`showdownOf(hand)`), the field the hand record copies as `shown` (`src/table/hand-record.ts:247`). `result.showdown` holds the same seats and cards, so either would do; `shown` is the one the record keeps for exactly this purpose. | yes | One source, identical to the stored record (AC#4). `CompletedHand` carries no other opponent hole cards (`src/table/session.ts:699-718`). | `result.showdown` |
| A-2 | The user's own seat is left out of the list even when the user showed; the user's cards stay in the header (TASK-9.4). | yes | The story is about opponents' cards; repeating the user's cards adds noise. | A "You showed …" line |
| A-3 | `TableView` computes `shown` from `completedHand(table)` alongside `reviewHeader` (`src/ui/table/Table.tsx:199-203`); `ReviewState`/`HeldReview` do not change. With `completedHand(table) === null` the list is absent. | yes | Same pattern as TASK-9.4 A-1; locked tests pass `review={{ entries, open }}` only. | New `ReviewState` field |
| A-4 | The list sits between `.review-head` and `<ol aria-label="Decisions">`, outside `.review-title`. | yes | Locked parsers read `.review-title` up to `</div><button` (`tests/ui/review-header.acceptance.test.tsx:44`) and the Decisions list greedily to the last `</ol>` (`tests/ui/review-panel.acceptance.test.tsx:49`, `tests/ui/review-numbers.acceptance.test.tsx:118`); this spot touches neither. Approved by Q-1. | Panel foot |
| A-5 | New markup uses its own hooks: `ul[aria-label="Shown at showdown"]`, `li[data-review-shown="<seat>"]`, `data-part="review-shown-name"` / `"review-shown-hand"`, group `aria-label="<Name>'s shown cards"`. It never uses `data-entry`, `data-opponent`, `data-shown-seat`, `data-part="explanation"`, `"position"`, `"shown"`, `"hand-name"`, or the group name `"<Name>'s cards"`. | yes | Those hooks are matched by locked tests (`e2e/review-numbers.spec.ts:233` counts `li[data-opponent]` and `[data-part="explanation"]` in the panel; `e2e/review-header.spec.ts:79`; `e2e/showdown-shown.spec.ts:22-23`, `e2e/next-hand.spec.ts:238` use "<Name>'s cards"). Playwright's substring name match does not make "Ben's cards" match "Ben's shown cards". | Reuse hand-result hooks |
| A-6 | No locked test needs an edit. Checked every `doit/*/state.json` `locked_tests` entry touching review/table/showdown: `tests/ui/review-panel.acceptance.test.tsx` (TASK-9.1/9.3; REVIEW_FOUR, where Ben shows: entry parsing is inside the `<ol>`, banned `TBD`/`…`/`undefined`/`null`/`[object` over panel text — "Ben showed · Pair of kings" has none), `tests/ui/review-numbers.acceptance.test.tsx` (TASK-9.3; SHOWDOWN fixture, entries parsed inside `<ol>`; `%` ban scoped to the preflop entry; no `<img>/<b>/<i>`), `tests/ui/review-header.acceptance.test.tsx` (TASK-9.4; `summaryOf` regex unaffected per A-4; exactly one "Your hole cards" group), `tests/ui/bust-continue.acceptance.test.tsx`, `e2e/review.spec.ts` (TASK-9.1: Decisions-scoped card reads, `getByRole('status')` count 0 only after the panel is gone), `e2e/review-numbers.spec.ts` (TASK-9.3 ten-seat scene, which will now show Fay and Ivy: no horizontal overflow, `li[data-opponent]` count ≥ 31 — unchanged because the new rows do not use that hook), `e2e/review-header.spec.ts` (TASK-9.4: summary box above the first entry — still true; panel no overflow), `e2e/bust-continue.spec.ts` (TASK-9.2), `e2e/hinted.spec.ts` (TASK-8.2), `e2e/showdown-shown.spec.ts:25` (TASK-1.15, page-wide no `5h`/`5s`: its `shown-hands` scene opens no review, `e2e/support/table-scenes.tsx:64-66`), `e2e/next-hand.spec.ts:167-175` (face-up cards counted inside `region "Table"`, which does not contain the `<aside>`, `src/ui/table/Table.tsx:239-297`). | yes | Grep of locked tests for review-panel markup, banned-text lists, page-wide card checks, closed lists and `count()` probes. | — |

## 3. Current system
- React 19 + Vite, strict TS. Vitest (`npm test` = `vitest run --coverage`, `package.json:13`) runs `node`; UI
  acceptance tests render `TableView` with `renderToString`. `src/table` needs 90 % line coverage. Playwright runs
  Chromium and WebKit; axe via `e2e/support/axe.ts`; scripted screens via `e2e/support/table-scenes.tsx` and
  `openTableScene` (`e2e/support/table-harness-bundle.ts:228-248`).
- The panel: `src/ui/table/ReviewPanel.tsx:15-94` — `.review-head` (:24-52) holds `.review-title` (heading,
  summary, replay line) and Close; then `<ol aria-label="Decisions">` (:53). `TableView` renders it at
  `src/ui/table/Table.tsx:297-303` with `summary={reviewHeader(table)}` (:199-203).
- Showdown data: `HandResult.showdown` holds only hands shown at showdown, in showdown order; mucked hands are
  absent (`src/engine/hand.ts:69-75`, show/muck in `revealShown` :526-552). `showdownOf(state)` copies them into
  `EarlierShowdown { shown: ShownHand[] }`, null for a fold-out (`src/engine/player-view.ts:124-132`).
  `CompletedHand.shown = showdownOf(hand)` (`src/table/session.ts:713-714, 744`); the hand record stores
  `shown: structuredClone(hand.shown)` (`src/table/hand-record.ts:101, 247`). `CompletedHand` has no other
  opponent hole cards; the full deal lives only in `TableState.hand.players[].holeCards` / `hand.deck`.
- The replay code can rebuild the whole deal via `shuffledDeck(code)` (`src/engine/deck.ts:41`), used only by
  `src/table/session.ts:2`. `src/table/review.ts` imports only the `ReplayCode` type (:7).
- The table already shows shown hands at showdown in the "Hand over" block with present-tense lines
  ("Dee shows · Pair of fours", `src/table/hand-result.ts:137-149`; locked `e2e/showdown-shown.spec.ts:20`).
- Existing code to reuse:
  - `src/table/hand-result.ts:62` `handName(cards)` → the shown hand's name ("Pair of kings").
  - `src/ui/cards/PlayingCard.tsx:40` `PlayingCard` → drawn cards (`data-card`, `aria-label` "King of diamonds").
  - `src/ui/cards/card-art.ts:65` `cardLabel` → card names for the hidden-card search in tests.
  - `src/engine/cards.ts:74` `formatCard` → card codes.
  - `tests/support/table-scenarios.ts:271` `userTableAfter`, `:309` `REVIEW_DECK`, `:334` `REVIEW_LOST_48`,
    `:382` `SHOWN_HANDS`, `:403` `RAISE_TAKES_BLINDS`; `TEN_SEAT_SHOWDOWN` (:190).
  - `e2e/support/table-scenes.tsx:55-58` `openReview`; `e2e/support/hand-records.ts` `storedRecords`,
    `playToResult`; `e2e/support/table-harness-bundle.ts` `stubReplayWords`; `e2e/support/paused-clock.ts`
    `runUntil`, `axeWithPausedClock` (pattern: `e2e/review-header.spec.ts:31-56`).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Shown cards are read only from `CompletedHand.shown` (A-1); `src/table/review.ts`, `ReviewPanel.tsx` and `Table.tsx` never call `shuffledDeck`/`createHand`/`dealHand` and never read `table.hand.players` or `hand.deck` for the review. | Re-deal from the replay code | REQ-043.6 / Q-33; the TASK-3.9 security review | no | n/a |
| D-2 | Shown hands are a list between the header and the decisions, one line per opponent who showed, in showdown order: "Ben showed" + two drawn cards + " · Pair of kings". | (b) same without the hand name; (c) the list after the decisions, at the panel foot; (d) one storyboard-style text line "Showdown: Ben shows K♦ 7♣, pair of kings" with suit glyphs as text | Drawn cards match the header and the table; the hand name tells the learner what beat them; near the top so it is read before the decisions | yes | user (Q-1) |

## 5. Design

### Files to create / modify
- `src/table/review.ts` — `ShownOpponent`, `shownOpponents`.
- `src/ui/table/ReviewPanel.tsx` — optional `shown` prop; the list.
- `src/ui/table/Table.tsx` — pass `shown` from `completedHand(table)`.
- `src/ui/styles.css` — `.review-shown` rules.
- `tests/support/table-scenarios.ts` — `REVIEW_DEE_MUCKS`.
- `e2e/support/table-scenes.tsx` — scenes `review-shown` (REVIEW_DEE_MUCKS) and `review-fold-out`
  (RAISE_TAKES_BLINDS), both with an open review.
- `e2e/support/table-harness-bundle.ts` — add both names to `TableScene`.
- `tests/table/review-shown.test.ts` (new) — unit tests of the model.
- `tests/ui/review-shown.acceptance.test.tsx` (new) — rendered panel and panel data.
- `e2e/review-shown.spec.ts` (new) — scenes and the live app, Chromium and WebKit, axe.
- `docs/ui/review.md` — a "Shown hands" section; title "Hand Review panel (TASK-9.1, TASK-9.3, TASK-9.4, TASK-9.5)".

### Components, interfaces and data
In `src/table/review.ts`:
```ts
/** An opponent's hand shown at showdown (TASK-9.5). */
export interface ShownOpponent {
  readonly seat: SeatNumber;
  readonly name: string;                       // hand.seats name
  readonly holeCards: readonly [Card, Card];   // a copy of the shown cards
  readonly handName: string;                   // handName([...holeCards, ...hand.board])
}
/** Opponents in hand.shown (showdown order), the user's seat left out; [] when hand.shown is null.
 *  Reads nothing else that holds hole cards and never deals from the replay code. */
export function shownOpponents(hand: CompletedHand): readonly ShownOpponent[];
```
`handName` is imported from `./hand-result`. A shown seat missing from `hand.seats` throws
`RangeError('Seat <n> is not at the table')` (cannot happen for a hand built by `completedHand`).

`ReviewPanelProps` gains `readonly shown?: readonly ShownOpponent[]` (default `[]`). With a non-empty `shown`,
between `.review-head`'s closing `</div>` and `<ol aria-label="Decisions"`:
```html
<ul aria-label="Shown at showdown" class="review-shown">
  <li data-review-shown="2">
    <span data-part="review-shown-name">Ben showed</span>
    <span role="group" aria-label="Ben's shown cards" class="table-cards"><svg data-card="Kd" aria-label="King of diamonds"…/><svg data-card="7c" aria-label="Seven of clubs"…/></span>
    <span aria-hidden="true"> · </span>
    <span data-part="review-shown-hand">Pair of kings</span>
  </li>
</ul>
```
(Wording per D-2, approved by Q-1.) With `shown` empty the panel markup is byte-for-byte as today. All values render
as React text.

`TableView`: inside the existing open-panel branch, `const hand = completedHand(table)` is computed once and
passed as `summary={hand === null ? null : reviewSummary(hand, table.handNumber)}` and
`shown={hand === null ? [] : shownOpponents(hand)}` (replacing the `reviewHeader` helper or extending it).

### Rules and algorithms
- `shownOpponents(hand)` = `(hand.shown?.shown ?? [])` filtered to `seat !== hand.userSeat`, mapped in order to
  `{ seat, name, holeCards: [c0, c1], handName: handName([c0, c1, ...hand.board]) }`.
- Worked examples (all produced by running the fixtures on 2026-11-24; default six seats Ava 1, Ben 2, Cal 3,
  Dee 4, You 5, Eli 6; button 6 unless stated):
  - `REVIEW_DEE_MUCKS` = `userTableAfter({ ...REVIEW_DECK, 3: '5c', 9: '5d' }, '3:fold 4:call 5:raise 6:fold
    1:fold 2:call 4:call 2:check 4:check 5:check 2:check 4:check 5:check 2:bet 4:call 5:call')`. Board Ks 9d 4c 2h
    6s. Ben bets the river, so Ben shows first: Kd 7c, "Pair of kings"; Dee (5c 5d, pair of fives) and the user
    (Ah 9s, pair of nines) cannot beat it and muck. `hand.shown.shown` = `[{seat 2, Kd 7c}]`; Ben wins the $50
    pot; user net −16; 4 user decisions (raise, check, check, call). Folded: Ava 2c 3c, Cal 2d 3d, Eli 2s 3h.
    → `shownOpponents` = `[{ seat: 2, name: 'Ben', holeCards: [Kd, 7c], handName: 'Pair of kings' }]`.
  - `REVIEW_LOST_48` (hand 133): `shown` = `[Ben Kd 7c]` (the user mucks) → one line, Ben, "Pair of kings".
  - `SHOWN_HANDS` (button 3): `shown` = Dee 4h 4s, You 8h 8s, Ben Kh Ks; Ava 5h 5s mucked → `shownOpponents` =
    Dee ("Pair of fours"), Ben ("Pair of kings") in that order; the user's seat left out (A-2).
  - `TEN_SEAT_SHOWDOWN`: `shown` = Fay (7) Js Qd, Ivy (10) Qh Jd, both "Full house, kings over jacks".
  - `RAISE_TAKES_BLINDS`: everyone folds to the user's raise; `shown` is null → `[]`. Hidden: Ava 2c 3d, Ben
    Kd 7c, Cal 2d 3h, Dee 2s 3s, Eli 3c 4d.

### Error handling and configuration
- No new user-facing errors. `completedHand(table) === null` → no list (A-3).
- CSS: `.review-shown { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 4px;
  font-size: 14px; color: #a7aeb8 }`; `.review-shown li { display: flex; flex-wrap: wrap; align-items: center;
  gap: 6px; min-width: 0 }`; `.review-shown svg[data-card] { width: 24px; height: 34px }`.

## 6. Behaviour specification

### SPEC-01: An opponent who showed appears with his cards
- Verifies: AC#1, DoD#1
- Behaviour: Given `REVIEW_DEE_MUCKS` with its open review (`storedReviewEntries(hand,
  hand.userDecisions.map(decisionRecord))`), When `TableView` renders it, Then the panel (`<aside>`) has exactly one
  `<ul aria-label="Shown at showdown">`, placed after `.review-head` and before `<ol aria-label="Decisions"`; it
  has exactly one `li[data-review-shown]`, value `2`, whose text (tags stripped, `<!-- -->` removed) is
  `Ben showed · Pair of kings` and whose group `aria-label="Ben&#x27;s shown cards"` holds exactly
  `svg[data-card]` `Kd`, `7c` in that order, with `aria-label`s `King of diamonds`, `Seven of clubs` (wording per
  Q-1). The same holds for `REVIEW_LOST_48` (hand 133).
- Verification: acceptance `tests/ui/review-shown.acceptance.test.tsx::Ben's shown K♦ 7♣ appear in the review`

### SPEC-02: A mucked hand appears nowhere in the panel
- Verifies: AC#2, DoD#1
- Behaviour: Given `REVIEW_DEE_MUCKS` (Dee mucks 5c 5d) rendered with its open review, When the panel is searched,
  Then for each of Dee's cards `5c`, `5d`: no `data-card` value in the panel equals it; no text (tags stripped),
  no `aria-label`, `title` or `alt` attribute value and no `<title>` element text contains its name
  (`cardLabel`: `Five of clubs`, `Five of diamonds`), its glyph form (`5♣`, `5♦`) or its code as a whole word
  (`/\b5c\b/`, `/\b5d\b/`); and the panel text does not contain `Pair of fives`. The panel's `data-card` values
  are exactly the user's `Ah`, `9s`, the entries' boards and Ben's `Kd`, `7c` — every one in
  {Ah, 9s, Ks, 9d, 4c, 2h, 6s, Kd, 7c}. The same search also finds none of the folded Ava (2c 3c), Cal (2d 3d)
  and Eli (2s 3h) cards.
- Verification: acceptance `tests/ui/review-shown.acceptance.test.tsx::Dee's mucked hand appears nowhere in the panel`

### SPEC-03: A fold-out shows no opponent cards
- Verifies: AC#3, DoD#1
- Behaviour: Given `RAISE_TAKES_BLINDS` (every opponent folds to the user's preflop raise) with its open review,
  When rendered, Then the panel has no `aria-label="Shown at showdown"` list, its `data-card` values are exactly
  `['Ah', '9s']` (the header), and the SPEC-02 search finds none of the five opponents' cards (Ava 2c 3d, Ben Kd
  7c, Cal 2d 3h, Dee 2s 3s, Eli 3c 4d) in text, `aria-label`/`title`/`alt` values, `<title>` text or `data-card`.
- Verification: acceptance `tests/ui/review-shown.acceptance.test.tsx::a hand every opponent folded shows no opponent cards`

### SPEC-04: The data passed to the panel holds only shown cards
- Verifies: AC#2, AC#3, AC#4, DoD#1
- Behaviour: Given `REVIEW_DEE_MUCKS`, `RAISE_TAKES_BLINDS`, `SHOWN_HANDS` and `TEN_SEAT_SHOWDOWN`, When the panel's
  props are built as `TableView` builds them (`summary = reviewSummary(hand, n)`, `shown = shownOpponents(hand)`,
  `entries = storedReviewEntries(hand, decisions)` with `hand = completedHand(T)`), Then a deep walk of those
  props finds no key named `deck`, `players` or `burned`; every value under a key `holeCards` or `board`, formatted
  with `formatCard`, is in the user's cards ∪ the hand's board ∪ the cards in `handRecord(hand, meta).shown.shown`;
  and `ReviewPanel` rendered directly with those props passes the SPEC-02/03 search for every seat not in
  `record.shown.shown`.
- Verification: acceptance `tests/ui/review-shown.acceptance.test.tsx::the panel's data holds no hole cards but the shown ones`

### SPEC-05: Shown cards come from the record's shown hands, never from the replay code
- Verifies: AC#4, DoD#1
- Behaviour: Given `hand = completedHand(REVIEW_DEE_MUCKS)` and its record `handRecord(hand, meta)` (whose
  `replayCode` is `9e3779b9000000010000000200000003`), Then `shownOpponents(hand)` seats/cards equal
  `record.shown.shown` without the user's seat; for `{ ...hand, shown: { shown: [{ seat: 4, holeCards: [Qh, Qs]
  }] } }` (cards the replay code never dealt to Dee) `ReviewPanel` rendered with `shown={shownOpponents(variant)}` shows Dee's `Qh`, `Qs` and no
  `5c`/`5d`/`Kd`/`7c` in the shown list; for `{ ...hand, shown: null }` (replay code intact) the panel has no shown
  list and no opponent card. The sources of `src/table/review.ts`, `src/ui/table/ReviewPanel.tsx` and
  `src/ui/table/Table.tsx` contain none of `shuffledDeck`, `createHand`, `dealHand`.
- Verification: acceptance `tests/ui/review-shown.acceptance.test.tsx::the review reads the stored shown hands and never deals from the replay code`

### SPEC-06: shownOpponents model
- Verifies: AC#1, AC#2, AC#3, AC#4, DoD#4
- Behaviour: `shownOpponents(completedHand(T))` is `[{ seat: 2, name: 'Ben', holeCards: [Kd, 7c], handName: 'Pair
  of kings' }]` for `REVIEW_DEE_MUCKS` and `REVIEW_LOST_48`; `[Dee 4h 4s 'Pair of fours', Ben Kh Ks 'Pair of
  kings']` in that order for `SHOWN_HANDS` (user seat 5 left out, Ava absent); `[Fay 7 Js Qd, Ivy 10 Qh Jd]` both
  `'Full house, kings over jacks'` for `TEN_SEAT_SHOWDOWN`; `[]` for `RAISE_TAKES_BLINDS`. Mutating the returned
  `holeCards` array does not change `hand.shown`. A `shown` entry for a seat not in `hand.seats` throws
  `RangeError('Seat 9 is not at the table')`.
- Verification: unit `tests/table/review-shown.test.ts::shownOpponents lists opponents who showed, in showdown order`
  and `tests/table/review-shown.test.ts::shownOpponents is empty for a fold-out and rejects an unknown seat`

### SPEC-07: Scenes in the browser — shown, mucked, folded
- Verifies: AC#1, AC#2, AC#3, DoD#7, DoD#8
- Behaviour: Given the `review-shown` scene (REVIEW_DEE_MUCKS, open review) at 1280 × 720 in Chromium and WebKit,
  Then `panel.getByRole('list', { name: 'Shown at showdown' }).getByRole('listitem')` has text
  `['Ben showed · Pair of kings']` (per Q-1) and `getByRole('group', { name: "Ben's shown cards" })` holds `Kd`,
  `7c`; inside the panel, collected with `evaluate` over every element: no `data-card` in {5c, 5d, 2c, 3c, 2d, 3d,
  2s, 3h}, no `aria-label`/`title`/`alt`/`<title>` text or `innerText` containing their names or glyph forms;
  page-wide, `svg[data-card="5c"], svg[data-card="5d"]` count is 0; the panel has no horizontal overflow and the
  list's right edge is inside it; axe reports no serious or critical violations; no http(s) request. Given the
  `review-fold-out` scene (RAISE_TAKES_BLINDS), the panel has no "Shown at showdown" list, its `svg[data-card]`
  values are exactly `['Ah', '9s']`, and axe is clean.
- Verification: acceptance `e2e/review-shown.spec.ts::the review shows Ben's shown cards and never Dee's mucked or folded cards`
  and `e2e/review-shown.spec.ts::a fold-out review shows no opponent cards`

### SPEC-08: Live hand — the panel's opponent cards equal the stored record's shown hands
- Verifies: AC#1, AC#2, AC#3, AC#4, DoD#7, DoD#8
- Behaviour: Given the app with replay words pinned to `[0x9e3779b9, 1, 2, 3]` and a paused clock, When the user
  calls/checks hand 1 to its result (`playToResult(page, 1, advance, { play: 'call' })`) and the panel
  `Hand #1 review` and one stored record exist, Then the panel's shown rows (`li[data-review-shown]`, seat and
  `data-card`s) equal `record.shown?.shown ?? []` without the user's seat, in order; every `svg[data-card]` in the
  panel is in the user seat's cards ∪ `record.board` ∪ those shown cards; and no `aria-label` in the panel names
  a card outside that set. The assertion holds whether the hand ends at showdown or by folds. axe is clean; every
  request is same-origin.
- Verification: acceptance `e2e/review-shown.spec.ts::a live review shows only the stored record's shown opponent cards`

### SPEC-09: Repo checks, golden suite, coverage, boundaries, playtest
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#6, DoD#8
- Behaviour: lint, typecheck and `npm test` pass with zero errors; `tests/golden/` passes 100 %; coverage holds
  (new `src/table/review.ts` code is unit-tested); no engine, bot, advice or stats source changes (engine boundary
  test unchanged) and no new network API; the 10,000-hand playtest reports 0 invariant violations.
- Verification: command `npm run lint && npm run typecheck && npm test && npx vitest run tests/golden/ && npm run -s playtest -- --hands 10000 --seed 42`

### SPEC-10: Existing review and showdown flows still pass
- Verifies: DoD#7, DoD#10
- Behaviour: The full Playwright suite passes in Chromium and WebKit, including the locked `e2e/review.spec.ts`,
  `e2e/review-numbers.spec.ts` (ten-seat review now listing Fay and Ivy, still no horizontal overflow),
  `e2e/review-header.spec.ts`, `e2e/bust-continue.spec.ts`, `e2e/showdown-shown.spec.ts`, `e2e/next-hand.spec.ts`;
  CI is green on `doit/TASK-9.5`.
- Verification: command `npm run e2e && gh run list --branch doit/TASK-9.5 --limit 1`

### SPEC-11: Docs and N/A items
- Verifies: DoD#9, DoD#11, DoD#12
- Behaviour: `docs/ui/review.md` has a "Shown hands" section: which opponents are listed (shown at showdown, in
  showdown order, user left out), that the cards come only from the finished hand's / record's `shown` field, that
  mucked and folded hands never appear (text, names, labels), and that the replay code is never used to deal cards
  for display. The "Security" section gains a line on it. The story doc is published to Backlog.md. DoD#9 N/A: no
  strategy content. DoD#12 N/A: no service worker exists yet.
- Verification: manual read `docs/ui/review.md`; `backlog doc list --plain` lists the TASK-9.5 doc

## 7. Edge cases
- Fold-out (no showdown): no list (SPEC-03, SPEC-06).
- Showdown where only the user shows / every opponent mucks: list absent (`shown` minus user is empty; same code
  path as SPEC-06's filtering; covered by the `{ ...hand, shown: null }` and SHOWN_HANDS user-filter cases).
- Several opponents show (side pots, ties): every shown opponent listed in showdown order (SPEC-06 SHOWN_HANDS,
  TEN_SEAT_SHOWDOWN with a split pot).
- Opponent shows in a side pot but mucks nothing else: comes through `hand.shown` like any other (engine rule,
  TASK-1.15).
- Ten seats: two full-house rows still fit without horizontal overflow (SPEC-10 locked ten-seat layout).
- User busted with the review held: list renders the same; Continue unchanged (SPEC-10).
- Panel closed / next hand dealt: list unmounts with the panel.
- Concurrency, permissions, dependency failure: N/A — pure rendering of in-memory data.

## 8. Security considerations
- Hidden information (REQ-025, REQ-043.6) is the point of this story. Trust boundary: the full deal
  (`TableState.hand.players[].holeCards`, `hand.deck`, and anything rebuilt from the replay code) must not cross
  into the review. Mitigation: the review reads `CompletedHand`, which carries only the user's cards and the
  shown hands (`src/table/session.ts:699-718`); `shownOpponents` reads only `hand.shown`; SPEC-04 deep-walks the
  panel's data, SPEC-02/03/07/08 search the rendered panel's text, accessible names, image labels and `data-card`
  values, and SPEC-05 bans dealing calls in the review sources.
- Names and hand names render as React text (no HTML injection). No secrets, logging, new dependencies or
  randomness.

## 9. Non-functional
- Rendering cost: at most 9 shown rows, one `handName` evaluation each; negligible.
- Accessibility: list and card groups are named; card images have names; text `#a7aeb8` on `#1a1d22` ≈ 8:1; axe
  zero serious/critical (SPEC-07, SPEC-08).
- Layout: no horizontal scroll at 1280 × 720 with six or ten seats (SPEC-07, SPEC-10).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`, start a game, play hands to a showdown and to a fold-out, and read the review panel.
- New tests (path → SPEC ids):
  - `tests/ui/review-shown.acceptance.test.tsx` → SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05
  - `tests/table/review-shown.test.ts` → SPEC-06
  - `e2e/review-shown.spec.ts` → SPEC-07, SPEC-08
- All new tests run in seconds and stay in the normal suite (no `TLH_SLOW_TESTS` gating).
- Locked tests the build must edit: none (A-6).
- End-to-end for the Judge: `npx playwright test e2e/review-shown.spec.ts e2e/review.spec.ts e2e/review-numbers.spec.ts e2e/review-header.spec.ts e2e/showdown-shown.spec.ts`.
  Then in `npm run dev`, play until a hand reaches showdown: the panel lists exactly the opponents whose cards the
  table showed, with the same cards; after a hand everyone folds, the panel shows no opponent cards; inspect the
  panel's accessible names (browser accessibility tree) for any other card.

## 11. Open questions
None. Q-1 was answered in `doit/TASK-9.5/qa.md` (recommended option); see D-2.

## 12. Clarifications log
See `doit/TASK-9.5/qa.md`.
