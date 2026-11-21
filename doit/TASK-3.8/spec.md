# Spec: TASK-3.8 — See each side pot and who wins it

Status: READY (approved 2026-11-21)
Task: TASK-3.8 · Parent/epic: TASK-3 · Requirements: REQ-021.5, REQ-024.1 · Dream: limit-holdem-trainer

## 1. Summary
The engine already builds a main pot and side pots and awards each one separately (TASK-1.10), but the table
shows only one "Pot $N" total and the result block adds every seat's winnings into one line. This story shows
each pot amount on the felt while side pots exist, and adds one result line per pot (from `result.awards`) naming
who won it and how much. Hands without side pots look exactly as they do today.

Live play can't reach an all-in yet. The TEMPORARY $160 top-up (TASK-3.21, `src/table/session.ts:175`) keeps
every stack at $160 or more, so a $20 short stack never happens in the browser. Scripted table states prove the
behaviour instead. Render tests (Vitest, `renderToString`) and the Playwright scene harness
(`e2e/support/table-scenes.tsx`) both use them.

## 2. Scope
- In scope:
  - `tableView` gains `pots`: one line per collected pot when more than one pot exists and the hand isn't over.
    The existing `pot` total is unchanged.
  - `handResultView` gains `pots`: one line per award when `result.awards` has more than one entry. The existing
    `winners` and `shown` are unchanged.
  - `TableView` renders the pot lines in place of `Pot $N`, and renders a "Pot winners" list in the result block.
  - Two new scripted states (`SIDE_POT_RIVER`, `SIDE_POT_SHOWDOWN`) and two harness scenes, plus unit, render and
    Playwright tests.
- Not doing:
  - Any engine change (`src/engine/**` untouched). Pot building, awards, uncalled returns and odd chips stay as
    they are in the engine.
  - Removing or changing the TEMPORARY top-up (TASK-3.21), or making all-ins reachable in live play.
  - Chip graphics for pots or bets (TASK-4.5), animation (TASK-4.6), the hand log (REQ-023) and the Hand Review
    panel's content.
  - Changing the single-pot `Pot $N` text, the `Winners` list or the `Shown hands` list. No existing assertion is
    edited, loosened or deleted.
- Scope budget: files=9, lines=450

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The felt shows separate pots only when `view.pots.length > 1` and the hand is not over. When a short stack goes all-in partway through a street, the total stays a single `Pot $N` until that street's betting ends. | yes | The engine creates side pots only when a street ends (`gather`/`buildPots`, `src/engine/hand.ts:391-415`). This matches AC#1's "When the betting ends". | Rebuild the pots in the UI from each seat's total contribution on every action. That duplicates engine logic. |
| A-2 | After the hand ends, the felt shows the single total `Pot $0`, as today. The per-pot breakdown appears only in the result block. | yes | The engine empties every pot at the end of the hand (`emptied`, `src/engine/hand.ts:452`, 576), and the locked TASK-3.4 test expects `Pot $0` (`tests/ui/hand-result.acceptance.test.tsx:78`). A list of "$0" pots would mean nothing. | Show the paid pots on the felt too, which duplicates the result block. |
| A-3 | `handResultView(...).pots` is `[]` when `result.awards` has exactly one entry. Fold-outs always have one award, because `foldOut` rebuilds the pots from the single remaining seat (`src/engine/hand.ts:461-466`). | yes | AC#4 asks for per-pot lines only "given side pots". Single-pot results keep their locked markup. | Always render pot lines. That would break the locked `status()` markup in `tests/ui/hand-result.acceptance.test.tsx:22-26`. |
| A-4 | Pot lines come from engine `awards` in ascending `pot` index: main pot first, then side pots by contribution level. Winners inside a line keep the engine's `splitPot` order. | yes | The `HandResult.awards` doc says it is ordered this way (`src/engine/hand.ts:76`). | Sort by amount. |

## 3. Current system
- The felt pot: `TableViewModel.pot` = collected pots + this street's bets (`potTotal`, `src/table/table-view.ts:124-129`).
  It is rendered as `<p class="table-pot">Pot $N</p>` right after the Board group (`src/ui/table/Table.tsx:184`).
  Locked regexes depend on that `</div><p class="table-pot">` adjacency
  (`tests/ui/table-display.acceptance.test.tsx:71`), so the single-pot markup must stay byte-for-byte the same.
- The result: `handResultView` adds each seat's shares over all awards into one `WinnerView`
  (`src/table/hand-result.ts:93-98`). `TableView` renders the `status` block with the title, the `Winners` list
  and the optional `Shown hands` list (`src/ui/table/Table.tsx:88-136`).
- Engine data (read only): `Pot {amount, eligible}` (`src/engine/hand.ts:45-48`);
  `PotAward {pot, amount, winners[{seat, amount}]}` (`src/engine/hand.ts:62-66`). Award amounts exclude the
  returned uncalled bet (`src/engine/hand.ts:76-79`). `PlayerView.pots` copies `state.pots`
  (`src/engine/player-view.ts:92`).
- Scenario helpers: `userTableAfter(fixed, moves, button, stacks)` sends the user's moves (seat 5) through
  `applyUserAction` (`tests/support/table-scenarios.ts:178-205`). Deck index `k-1` / `k+5` deals seat k's hole
  cards; 13–15 is the flop, 17 the turn, 19 the river (see `REVIEW_DECK`, `SHOWN_HANDS`). Default session:
  $4/$8, blinds $2/$4, six seats at $160, user seat 5 "You"; bots Ava 1, Ben 2, Cal 3, Dee 4, Eli 6.
- Scene harness: `e2e/support/table-scenes.tsx` maps scene names to `TableState`s from `table-scenarios.ts`.
  `buildTableScenes` / `openTableScene` load them (`e2e/showdown-shown.spec.ts:1-14`). The axe helper is
  `e2e/support/axe.ts` (`expectNoSeriousAxeViolations`).
- Playwright runs every `*.spec.ts` under Chromium and WebKit (`playwright.config.ts:13-15`).
- Locked tests that touch this area: TASK-3.3 `tests/ui/table-display.acceptance.test.tsx` and
  `e2e/table-display.spec.ts`; TASK-3.4 `tests/ui/hand-result.acceptance.test.tsx`,
  `tests/table/next-hand.acceptance.test.ts` and `e2e/next-hand.spec.ts`; TASK-1.15
  `tests/ui/hand-result-shown.acceptance.test.tsx` and `e2e/showdown-shown.spec.ts`; TASK-1.9
  `tests/table/hand-result-uncalled.acceptance.test.ts`; TASK-3.22
  `tests/table/hand-result-edges.acceptance.test.ts`. None of their scenarios has more than one pot, so none
  needs to change. They must pass byte-identical (SPEC-08).
- Existing code to reuse:
  - `src/table/table-view.ts` `potTotal` → the total the pot lines must add up to.
  - `src/table/hand-result.ts` `nameOf` closure and the `You win $N` / `<Name> wins $N` wording (TASK-3.4 Q-2)
    → the winner text in each pot line.
  - `tests/support/table-scenarios.ts` `userTableAfter`, `fixedDeck` → the new scripted states.
  - `e2e/support/table-harness-bundle.ts` `buildTableScenes`/`openTableScene`, `e2e/support/axe.ts` → the e2e
    spec.
  - The `.hand-result ul` / `li` styles (`src/ui/styles.css:466-490`) → the result list. The `.table-pot` font
    (`src/ui/styles.css:294-298`) → the felt pot lines.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | While side pots exist, the felt shows a list named "Pots" in place of "Pot $N", with items "Main pot $60" and "Side pot $80" ("Side pot 1", "Side pot 2" when there are several), in the same place and the `.table-pot` font. A single pot stays "Pot $N" exactly. | Keep "Pot $140" with "(main $60 · side $80)" beneath; show collected pots only | Clear and matches the existing styling | yes | user (Q-1, auto-accepted) |
| D-2 | A list named "Pot winners" goes before Winners, one line per award: "Main pot $60 · You win $60", "Side pot $80 · Ben wins $80". A split reads "Side pot $81 · Ben wins $41, Ava wins $40". Winners and Shown hands are unchanged. | Per-pot lines replacing Winners; "You win the main pot ($60)" | Keeps the locked single-pot markup and avoids showing cards twice | yes | user (Q-2, auto-accepted) |
| D-3 | This street's bets are added to the last pot line, so the felt's pot lines always add up to `potTotal`. | Show only collected pots; show bets as a separate "Bets" line | Same chips-in-play meaning as the single total (A-4 of TASK-3.3), with no engine logic duplicated | yes | user (Q-1, auto-accepted) |
| D-4 | Pure model functions (`tableView`, `handResultView`) compute every string; `TableView` only renders them (D-7 of TASK-3.3). | Format in JSX | Unit-testable and consistent with the existing split | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/table-view.ts` — add `PotLineView`, `potLines()`, `TableViewModel.pots`.
- `src/table/hand-result.ts` — add `PotResultView`, `HandResultView.pots`.
- `src/ui/table/Table.tsx` — render the felt `Pots` list and the result `Pot winners` list.
- `src/ui/styles.css` — `.table-pots` and, if needed, `flex-wrap: wrap` on `.hand-result`.
- `tests/support/table-scenarios.ts` — add `SIDE_POT_RIVER`, `SIDE_POT_SHOWDOWN`.
- `e2e/support/table-scenes.tsx` — register scenes `side-pot-river`, `side-pot-showdown`.
- `tests/table/side-pots.test.ts` (new, unit) — model rules and edges.
- `tests/ui/side-pots.acceptance.test.tsx` (new, acceptance) — rendered felt and result.
- `e2e/side-pots.spec.ts` (new, acceptance) — browser scenes in Chromium and WebKit, layout, axe and network.

### Components, interfaces and data
```ts
// src/table/table-view.ts
export interface PotLineView {
  /** Index into PlayerView.pots (0 = main pot). */
  readonly pot: number;
  /** "Main pot" | "Side pot" | "Side pot 1", "Side pot 2", … (Q-1). */
  readonly label: string;
  readonly amount: number;
  /** `${label} $${amount}`, e.g. "Main pot $60". */
  readonly text: string;
}
/** Pot labels for `count` pots: index 0 "Main pot"; one side pot "Side pot"; several "Side pot k". */
export function potLabel(index: number, count: number): string;
/** [] unless view has ≥ 2 pots and the hand is not over (A-1, A-2); street bets go to the last line (D-3). */
export function potLines(view: PlayerView | null, handOver: boolean): PotLineView[];
// TableViewModel gains:
/** REQ-021.5: one line per pot while side pots exist; [] = show the single `pot` total. */
readonly pots: readonly PotLineView[];

// src/table/hand-result.ts
export interface PotResultView {
  readonly pot: number;            // award.pot
  readonly label: string;          // potLabel(award.pot, awards.length)
  readonly amount: number;         // award.amount
  /** award.winners in order, each `You win $N` / `<Name> wins $N`. */
  readonly winners: readonly { readonly seat: SeatNumber; readonly isUser: boolean; readonly text: string }[];
  /** e.g. "Main pot $60 · You win $60"; split: "Side pot $81 · Ben wins $41, Ava wins $40" (Q-2). */
  readonly text: string;
}
// HandResultView gains:
/** One per result.awards entry when there are ≥ 2 (AC#4); [] for a single pot (A-3). */
readonly pots: readonly PotResultView[];
```
- `hand-result.ts` may import `potLabel` from `./table-view`. Both live in `src/table`, which has no UI imports
  (boundary test `tests/table/hand-result.test.ts:122-128` stays green).
- Invariants:
  - `sum(model.pots[i].amount) === model.pot` whenever `model.pots.length > 0`.
  - `sum(result.pots[i].amount) === sum(result.awards[i].amount)`.
  - Every seat's total over `result.pots` equals its `WinnerView.amount`.

### Rendering (`src/ui/table/Table.tsx`)
- Felt:
  - When `model.pots.length === 0`, render the existing `<p className="table-pot">{`Pot $${model.pot}`}</p>`,
    unchanged.
  - Otherwise render, in the same place,
    `<ul aria-label="Pots" className="table-pots">` with one `<li data-pot={line.pot}>{line.text}</li>` per line.
- Result block, when `result.pots.length > 0`: right after the `Hand over` title and before `Winners`, render
  `<ul aria-label="Pot winners">` with one `<li data-pot={p.pot}>` per pot line. Each line contains
  `<span data-part="pot">{label} ${amount}</span><span aria-hidden="true"> · </span><span data-part="pot-winners">{winner texts joined by ", "}</span>`,
  so its text content equals `p.text`. The `Winners` and `Shown hands` lists are unchanged.
- CSS:
  - `.table-pots`: `display: flex; gap: 16px; margin: 0; padding: 0; list-style: none;` with the `.table-pot`
    font (16px/600).
  - The result list inherits `.hand-result ul/li`.
  - If the side-pot result block would overflow the 1280 px viewport, add `flex-wrap: wrap` to `.hand-result`.
    `e2e/side-pots.spec.ts` checks this.

### Rules and algorithms
- `potLines(view, handOver)`:
  - Return `[]` if `view === null`, `handOver`, or `view.pots.length < 2`.
  - Otherwise `bets = Σ players.streetContribution`, and for each pot k the amount is
    `pots[k].amount + (k === last ? bets : 0)`.
  - Labels come from `potLabel(k, pots.length)`.
- `potLabel(0, n)` = "Main pot"; `potLabel(1, 2)` = "Side pot"; for n ≥ 3, `potLabel(k, n)` = `Side pot ${k}`
  for k ≥ 1.
- Pots that a fold left with a single eligible seat stay listed. Their chips are still in play.
- `SIDE_POT_DECK = { 4: 'Ah', 10: 'As', 1: 'Kh', 7: 'Ks', 0: 'Qh', 6: 'Qs', 13: '2c', 14: '7d', 15: '9h', 17: 'Jc', 19: '3s' }`
  (used for every side-pot state).
- Worked example (AC#1; verified against the engine during drafting):
  - Setup: `userTableAfter(SIDE_POT_DECK, moves, 6, { 5: 20 })`, $4/$8, button 6, Ava seat 1 SB, Ben seat 2 BB,
    You seat 5 with $20. The other seats keep $160.
  - Preflop `3:fold 4:fold 5:raise 6:fold 1:raise 2:raise 5:call 1:call`: each of seats 1, 2 and 5 has $16 in
    (capped at 4 bets).
  - Flop `1:bet 2:raise 5:call 1:raise 2:call`: You call all-in for $4 (total $20). Ava and Ben reach $28. The
    turn starts with pots main $60 {1,2,5} and side $16 {1,2}.
  - Turn `1:bet 2:raise 1:raise 2:raise 1:call`: Ava and Ben reach $60. The folded seats put in $0. The river
    starts with `pots = [{60,[1,2,5]},{80,[1,2]}]`, Ava to act, and stacks Ava $100, Ben $100, You $0.
  - Felt: "Main pot $60", "Side pot $80"; `pot` = 140. No uncalled chips are returned (all three street totals
    matched), so the amounts aren't changed.
  - If Ava then bets $8 on the river (still mid-street), the lines show "Main pot $60" and "Side pot $88"
    (`pot` = 148).
- Showdown (AC#2/#4), `SIDE_POT_SHOWDOWN` = the same moves + `1:check 2:check`.
  - Deck: You Ah As (index 4, 10), Ben Kh Ks (1, 7), Ava Qh Qs (0, 6); board 2c 7d 9h Jc 3s (13, 14, 15, 17, 19).
  - `awards = [{pot 0, 60, [{5,60}]}, {pot 1, 80, [{2,80}]}]` (verified).
  - Result pot lines: "Main pot $60 · You win $60", "Side pot $80 · Ben wins $80".
  - Winners, unchanged: "You win $60 · Pair of aces", "Ben wins $80 · Pair of kings".
  - Shown hands: "Ava shows · Pair of queens".
  - Felt: `Pot $0` (A-2).
- Uncalled check: if instead Ava bets the river and Ben folds, the engine returns Ava's $8
  (`returned {seat 1, 8}`). The awards are still main $60 → You and side $80 → Ava (verified). The pot amounts
  never include returned chips.

### Error handling and configuration
- A seat in an award that isn't seated throws `RangeError('Seat N is not at the table')`, the same as `nameOf`
  today (`src/table/hand-result.ts:88-92`). No configuration.

## 6. Behaviour specification

### SPEC-01: Felt shows main pot $60 and side pot $80 once the betting ends (AC#1)
- Verifies: AC#1, DoD#1
- Behaviour: Given `SIDE_POT_RIVER` (stacks put in $20/$60/$60 as worked in §5), When the table renders, Then:
  - the felt has a list named "Pots" whose items read exactly `["Main pot $60", "Side pot $80"]`, with
    `data-pot` 0 and 1;
  - there is no `<p class="table-pot">`;
  - `tableView(SIDE_POT_RIVER).pot === 140`.
- Verification: acceptance `tests/ui/side-pots.acceptance.test.tsx::the table shows a $60 main pot and an $80 side pot separately after a $20/$60/$60 all-in`

### SPEC-02: Each pot's winner and amount in the result (AC#2)
- Verifies: AC#2, DoD#1
- Behaviour: Given `SIDE_POT_SHOWDOWN` (You, the $20 short stack, win the main pot with Pair of aces; Ben wins
  the side pot with Pair of kings), When the result renders, Then:
  - the `status` block has a list named "Pot winners" whose items read exactly
    `["Main pot $60 · You win $60", "Side pot $80 · Ben wins $80"]`;
  - the `Winners` list still reads `["You win $60 · Pair of aces", "Ben wins $80 · Pair of kings"]`;
  - the felt shows `Pot $0`.
- Verification: acceptance `tests/ui/side-pots.acceptance.test.tsx::the result names each pot's winner and amount when the short stack wins the main pot`

### SPEC-03: One result line per award (AC#4)
- Verifies: AC#4, DoD#1
- Behaviour: Given `SIDE_POT_SHOWDOWN`, When the result renders, Then:
  - the number of `<li data-pot>` items in "Pot winners" equals `hand.result.awards.length` (2);
  - item k's `data-pot` equals `awards[k].pot`;
  - its `data-part="pot"` text is `${label} $${awards[k].amount}`.
- Verification: acceptance `tests/ui/side-pots.acceptance.test.tsx::there is one result line per pot from result.awards`

### SPEC-04: No all-in → single pot total, no pot lists (AC#3)
- Verifies: AC#3, DoD#1
- Behaviour: Given every state in `STORYBOARD_HISTORY` plus `KINGS_SHOWDOWN`, `SPLIT_STRAIGHT` and
  `AVA_UNCONTESTED`, When each renders, Then:
  - exactly one `<p class="table-pot">` reads `Pot $<potTotal>`;
  - there is no list named "Pots" or "Pot winners";
  - `tableView(t).pots` and `handResultView(t)?.pots ?? []` are `[]`.
- Verification: acceptance `tests/ui/side-pots.acceptance.test.tsx::a hand with no all-in shows a single pot total`

### SPEC-05: Model rules — labels, street bets, hand over, splits
- Verifies: AC#1, AC#4, DoD#1
- Behaviour: Given the side-pot states and crafted awards below, When `tableView`/`handResultView` run, Then:
  - `potLabel`: `potLabel(0,2)` = "Main pot", `potLabel(1,2)` = "Side pot", `potLabel(2,3)` = "Side pot 2".
  - Street bets: `SIDE_POT_RIVER` + `1:bet` gives pot lines `[60, 88]` and `pot` 148. The sum of line amounts
    equals `pot` for every intermediate state of that hand.
  - Single pot mid-street: the flop state right after `5:call` (the all-in, before the street ends) has
    `pots === []`.
  - Hand over: `SIDE_POT_SHOWDOWN` has `pots === []`.
  - Crafted awards (via a `withAwards` helper on `SIDE_POT_SHOWDOWN`):
    - a 3-pot split gives labels "Main pot", "Side pot 1", "Side pot 2";
    - a split side pot `{pot 1, 81, [{2,41},{1,40}]}` gives the text "Side pot $81 · Ben wins $41, Ava wins $40";
    - each seat's sum over `pots` equals its `WinnerView.amount`.
  - Single award: a single award gives `pots === []`.
  - Uncalled: the river variant `1:bet 2:fold` gives result lines "Main pot $60 · You win $60" and
    "Side pot $80 · Ava wins $80".
- Verification: unit `tests/table/side-pots.test.ts::pot lines and pot results follow the engine pots and awards`

### SPEC-06: Unknown award seat throws
- Verifies: DoD#1
- Behaviour: Given `SIDE_POT_SHOWDOWN` with seat 2 removed from `seats`, When `handResultView` runs, Then it
  throws `RangeError('Seat 2 is not at the table')`.
- Verification: unit `tests/table/side-pots.test.ts::an award to an unseated seat throws RangeError`

### SPEC-07: Browser — side-pot scenes in Chromium and WebKit, layout, axe, no outside requests
- Verifies: AC#1, AC#2, AC#3, AC#4, DoD#7, DoD#8
- Behaviour: At a 1280×720 viewport:
  - Scene `side-pot-river`: `getByRole('list', {name: 'Pots'}).getByRole('listitem')` has text
    `["Main pot $60", "Side pot $80"]`.
  - Scene `side-pot-showdown`: list "Pot winners" has `["Main pot $60 · You win $60", "Side pot $80 · Ben wins $80"]`.
    The `status` block's right edge is ≤ 1280 and `document.documentElement.scrollWidth` ≤ 1280.
  - Scene `flop-bet`: the "Pots" list has count 0 and the text `Pot $30` is visible.
  - Each scene: `expectNoSeriousAxeViolations` passes, and no `http(s)` request is made.
  - Runs in both Playwright projects.
- Verification: acceptance `e2e/side-pots.spec.ts::side pots and their winners are shown separately, single pot otherwise, axe clean`

### SPEC-08: Locked tests unchanged and passing
- Verifies: DoD#1, DoD#2
- Behaviour: Given the locked files listed in §3, When they run, Then they pass. Each is byte-identical to its
  recorded SHA-256 in `doit/TASK-3.3/state.json`, `doit/TASK-3.4/state.json`, `doit/TASK-1.15/state.json`,
  `doit/TASK-1.9/state.json` and `doit/TASK-3.22/state.json` `locked_tests`.
- Verification: integration `npx vitest run tests/ui/table-display.acceptance.test.tsx tests/ui/hand-result.acceptance.test.tsx tests/ui/hand-result-shown.acceptance.test.tsx tests/table/next-hand.acceptance.test.ts tests/table/hand-result-uncalled.acceptance.test.ts tests/table/hand-result-edges.acceptance.test.ts && npx playwright test e2e/table-display.spec.ts e2e/next-hand.spec.ts e2e/showdown-shown.spec.ts`

### SPEC-09: Lint, typecheck, tests, coverage and boundary
- Verifies: DoD#1, DoD#2, DoD#4, DoD#5
- Behaviour: Given the change, When the checks run, Then:
  - lint, typecheck, Vitest (coverage ≥ 90% engine/bots/advice/statistics, ≥ 70% overall) and Playwright pass
    with zero errors;
  - `tests/toolchain/boundary*.test.ts` pass;
  - `src/table/*.ts` imports no React or `src/ui` module.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run e2e`

### SPEC-10: CI green and story documentation published
- Verifies: DoD#10, DoD#11
- Behaviour: Given branch `doit/TASK-3.8`, When CI runs and the story doc is written, Then:
  - the workflow is green;
  - `backlog doc list --plain` lists a TASK-3.8 doc that records the pot wording (Q-1/Q-2), A-1, A-2, and that
    side pots are proven by scenes only until TASK-3.21 removes the top-up.
- Verification: manual CI run on branch `doit/TASK-3.8` and `backlog doc list --plain`

### SPEC-11: Not-applicable DoD items
- Verifies: DoD#3, DoD#6, DoD#9, DoD#12
- Behaviour: Given that the golden-spot suite (E07-S14) and the offline service worker (E13-S07) don't exist yet,
  that this story touches no engine, bot or advice code, and that it adds no strategy content, When the Judge
  checks, Then the diff touches nothing under `src/engine`, `src/bots` or `src/advice`.
- Verification: manual Judge runs `git diff --stat main...doit/TASK-3.8 -- src/engine src/bots src/advice` (empty) and confirms E07-S14 and E13-S07 are not Done

## 7. Edge cases
- More than one side pot: the labels become "Side pot 1", "Side pot 2" (SPEC-05).
- A split pot inside a side pot: the winners are joined with ", " in engine order (SPEC-05).
- The same seat wins several pots: one line per pot, and the `Winners` total equals the sum (SPEC-05).
- An all-in partway through a street: the felt keeps the single total until the street ends (A-1, SPEC-05).
- Street bets on top of side pots: they are added to the last line (D-3, SPEC-05).
- An uncalled bet is returned: the awards exclude it, so the lines do too (SPEC-05).
- The hand is over: the felt shows `Pot $0` and the breakdown appears only in the result (A-2, SPEC-02/05).
- A fold-out: always a single award, so no pot lines (A-3, SPEC-04 `AVA_UNCONTESTED`).
- An unknown seat: `RangeError` (SPEC-06).
- Concurrency, permissions and network failure: N/A. This is a pure render of an in-memory state.

## 8. Security considerations
- There is no new input, storage, dependency or randomness. Names in the text come from the session config and
  are rendered as React text (escaped). There are no new network requests (SPEC-07).

## 9. Non-functional
- Layout: at 1280×720 the side-pot result block causes no horizontal scroll (SPEC-07).
- Accessibility: the pot lists are named lists (`Pots`, `Pot winners`), and axe reports zero serious or critical
  violations (SPEC-07).
- No speed checks are added, so nothing goes in the slow group.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview`, then open `http://localhost:4173`, choose New game → Start. Live
  play shows the single pot total (all-ins aren't reachable until TASK-3.21). Run `npx playwright test e2e/side-pots.spec.ts --headed` to see the side-pot scenes.
- New tests:
  - `tests/ui/side-pots.acceptance.test.tsx` → SPEC-01, 02, 03, 04
  - `tests/table/side-pots.test.ts` → SPEC-05, 06
  - `e2e/side-pots.spec.ts` → SPEC-07
- Judge's end-to-end scenario: run `npx playwright test e2e/side-pots.spec.ts` in both projects. Then open the
  `side-pot-river` scene and check that the felt reads "Main pot $60" and "Side pot $80", and open
  `side-pot-showdown` and check the "Pot winners" lines.

## 11. Open questions
- None. Q-1 and Q-2 are resolved in `doit/TASK-3.8/qa.md` (auto-accepted recommended options, recorded as D-1, D-2 and D-3).

## 12. Clarifications log
See `doit/TASK-3.8/qa.md`.
