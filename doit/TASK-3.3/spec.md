# Spec: TASK-3.3 — See every seat, the board, the pot and the button at a glance

Status: READY (approved 2026-11-18 by user via Q-1..Q-4)
Task: TASK-3.3 · Parent/epic: TASK-3 (Play hands at the table) · Requirements: REQ-010.3, REQ-013.4, REQ-021.1, REQ-021.3–REQ-021.8 (REQ-021.2 style hiding is TASK-12.2; separate side pots in REQ-021.5 are TASK-3.8) · Dream: limit-holdem-trainer

## 1. Summary
TASK-3.1's plain seat list becomes the real table display from the Table storyboard. Bot seats sit around an
oval felt with the user at the bottom centre. Each bot seat shows name, style label, stack, chips put in this
street, last action and a small card-back marker while it holds cards. The user's seat shows both hole cards,
stack and position name. The felt shows the board with empty placeholders up to five cards and the pot total.
The button seat carries a dealer marker and the seat to act is highlighted and labelled. A header shows
"Cash · 6 players · $4/$8 · Hand #1" and a Leave table control. All of this comes from a pure, headless view
model built from the user's `PlayerView`, so the display cannot show a bot's hole cards or the replay code.
TASK-3.1's `data-to-act` test hook gives way to the visible "To act" text.

## 2. Scope
- In scope:
  - `src/table/table-view.ts` (new, headless): `tableView(table)` view model, `lastActionText`, `positionName`,
    `seatSlot`/`slotPosition`, `potTotal`, `headerText`.
  - `src/table/session.ts`: `BotStyle` union (Q-1) and `TableState.handNumber` (A-3).
  - `src/ui/table/Table.tsx`: split into a presentational `TableView` and the stateful `Table`. Render the
    header, the seats in their slots, the felt with board, placeholders and pot, the action bar and "Hand over".
  - `src/ui/table/TableScreen.tsx` and `src/ui/App.tsx`: wire Leave table (Q-4).
  - `src/ui/cards/PlayingCard.tsx`: `CardBack` `size` prop with a `'small'` marker variant (AC#9).
  - `src/ui/config/GameConfigScreen.tsx`: labels for the widened style union (needed for the type to compile).
  - `src/ui/styles.css`: table layout from the storyboard.
  - Tests: scripted scenarios (`tests/support/table-scenarios.ts`), Vitest unit and acceptance tests, a Playwright
    scene harness, a new Playwright spec, and the listed edits to earlier stories' tests (D-5, Q-5).
- Not doing:
  - Hiding style labels (TASK-12.2), the Settings and Home header controls (E12 / TASK-2.14). The storyboard's
    Settings link is not drawn.
  - The Session Report, a mid-hand "Leave now? Your hand will be folded." dialog and the forced fold
    (TASK-10.1, E10-S05, REQ-004.5/.7/.8).
  - Winners, showdown cards, the next-hand deal and incrementing the hand number (TASK-3.4).
  - Side pots shown separately (TASK-3.8). Chip art, chips in front of seats, avatars, drawn dealer button
    (E04: TASK-4.4, TASK-4.5, TASK-4.7). Action log (TASK-4.1). Hint (TASK-8.1). SNG level in the header (E05).
  - The final branded 1280 × 720 fit with 10 seats and the theme checks (TASK-3.16). Here: 6 seats, no
    horizontal scroll at 1280 × 720.
  - Thousands separators and locale money formatting (TASK-3.19). Amounts stay `$<integer>`.
  - Playing the Calling station, Maniac or Rock styles. Every bot still decides with `tagPolicy` (E06). Users
    cannot pick a style yet (Game Config is read-only), so only tests create non-TAG seats.
  - Any change to `src/engine`, `src/bots`, `src/advice`, `src/playtest`, `src/table/action-bar.ts`,
    `src/ui/table/ActionBar.tsx`, `src/ui/table/useTableSession.ts`, the card gallery or the lint/test config.
- Scope budget: files=19, lines=1400   (table-view.ts ~170, session.ts ~15, Table.tsx ~150, TableScreen.tsx ~6, App.tsx ~4, PlayingCard.tsx ~12, GameConfigScreen.tsx ~6, styles.css ~150, tests/support/table-scenarios.ts ~120, tests/table/table-view.test.ts ~170, tests/ui/table-display.acceptance.test.tsx ~260, e2e/table-display.spec.ts ~200, e2e/support/table-scenes.tsx ~35, e2e/support/table-harness-bundle.ts ~25, e2e/support/table-locators.ts ~25, e2e/table.spec.ts ~20, e2e/action-bar.spec.ts ~15, e2e/home.spec.ts ~4, tests/ui/table.acceptance.test.tsx ~8)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The card-back marker is one `CardBack size="small"`, drawn at 30 × 42 CSS px (half of 60 × 84, same 60 × 84 `viewBox`, so the logo scales with it). Its accessible name stays "Face-down card". The default `CardBack()` stays 60 × 84. | yes | AC#9 says "a smaller CardBack marker" (singular). One code path keeps TASK-3.5's locked size tests valid. | Two overlapping backs; 36 × 50 |
| A-2 | Position names (user seat only) are counted from the dealt seats and the button: "Button", "Small blind", "Big blind", then counting back from the button "Cutoff" and "Hijack", and the remaining seats from the first seat after the big blind "Under the gun", "Under the gun +1", "Under the gun +2", … At 6 seats this gives exactly the task's names. Other sizes cannot be chosen by users yet (Game Config is fixed at 6). | yes | REQ-021.3 and the task description name the 6-max positions. The engine allows 3–10 seats, so the function must be total. | "UTG+1"-style short names; "Lojack"/"Middle position" at 7+ |
| A-3 | `TableState` gains `handNumber: number`, the 1-based number of the current hand (the next hand before the deal). `seatSession` sets 1. Nothing in this story increments it, so the app always shows "Hand #1". AC#7's "Hand #133" is a scripted `TableState`. | yes | The app plays one hand per load until TASK-3.4. REQ-004.3 later restores a hand count into the same field. In-memory only, not persisted yet. | Put a hand count in `SessionConfig`; derive it from completed hands |
| A-4 | Pot total = sum of `pots[].amount` + sum of every player's `streetContribution` (REQ-021.5, storyboard "Pot $30" = $26 + Ben's $4). Before the deal and after the hand is awarded it is `$0`. TASK-3.4 shows the amount won. | yes | This is the engine's own split (`hand.ts:88-89, 252-265`). After the award, the chips are already in the winner's stack. | Show the awarded amount after the hand |
| A-5 | The `<h1>TLH Trainer</h1>` stays above the header line. The header is a `<header>` inside the Table component holding the line of text and the Leave table `<button>`. | yes | `tests/ui/table.acceptance.test.tsx:43` and `e2e/home.spec.ts:211` assert the h1 and its focus. TASK-3.16 owns the final look. | Make the header line the h1 (breaks two locked tests) |
| A-6 | `data-street` and `data-action-count` stay on `section[aria-label="Table"]`. Only `data-to-act` is removed. | yes | AC#10 removes hooks "where visible text covers them". No visible text names the street (the board count cannot tell river from showdown), and no visible text counts actions (the action log is TASK-4.1). The e2e specs use the count to wait for clicks. | Show the street name as text |
| A-7 | Header game-type word is "Cash" (header form "Cash · 6 players · $4/$8 · Hand #133" from the task description and `Table.dc.html:21`). Game Config keeps "Cash game". | yes | Both are approved texts in their own screens. | "Cash game" in the header |
| A-8 | After the hand ends, no seat shows "Waiting" or "To act". Seats keep their last action from the final street. Bots that did not fold keep their card-back marker. | yes | Nobody waits once the hand is over. Showing cards at showdown is TASK-3.4. | Clear every seat's action |

## 3. Current system
- Session: `SessionConfig` (`src/table/session.ts:68-80`) holds `gameType`, `players`, `stake`, `seats`
  (`SessionSeat {seat, name, kind, style: 'TAG' | null}`, `session.ts:43-48`), `userSeat`, `button`.
  `TableState` (`session.ts:101-111`) holds `config`, `stakes`, `seats`, `stacks`, `hand`, `replayCode` and
  `userDecisions`. `seatSession`, `dealHand`, `stepBot` (always `tagPolicy`, `session.ts:147`),
  `applyUserAction`, `nextStep`. No hand counter exists.
- Engine: `HandState` (`src/engine/hand.ts:76-100`). `pots` holds chips from completed streets only
  (`hand.ts:88`, `gather` at `:252-265`). `streetContribution` is per street. `toAct` is null when the hand is
  complete. `actions` are `ActionRecord {street, seat, type: 'small-blind'|'big-blind'|'fold'|'check'|'call'|'bet'|'raise', amount, added}`
  (`hand.ts:52-60`). Call `amount` is the chips added, raise `amount` is the raise-to total (`hand.ts:226-238`).
  Seats ascending are clockwise (`clockwiseAfter`, `hand.ts:110-114`). Blinds are the two seats after the button
  (`hand.ts:166-168`). On a fold-out or showdown, pots and street contributions go to 0 and stacks are paid
  (`hand.ts:292-352`).
- `playerView(state, seat)` (`src/engine/player-view.ts:62-106`) copies only public fields plus the viewer's own
  hole cards. It has no replay code and no other seat's cards.
- UI: `Table.tsx:9-53` renders `section[aria-label="Table"]` with `data-street`/`data-to-act`/`data-action-count`,
  `ul[aria-label="Seats"]` with bots first then the user (`li[data-seat][data-user]`,
  `span[data-part="name"|"stack"]`), the user's cards in `group "Your cards"`, the `group "Board"`, the
  `ActionBar` ("Your actions", `src/ui/table/ActionBar.tsx:12`) and `<p role="status">Hand over</p>`.
  `TableScreen.tsx:5-13` renders `<main><h1>TLH Trainer</h1><Table/></main>`. `App.tsx:31-32` shows it.
  `GameConfigScreen.tsx:18` maps `TAG` to "Tight-aggressive".
- Cards: `PlayingCard` 60 × 84 `svg[role=img][data-card]` (`src/ui/cards/PlayingCard.tsx:40-95`). `CardBack()`
  is fixed at 60 × 84, `aria-label="Face-down card"`, `data-card="back"`, with `image[data-part="logo"]`
  (`PlayingCard.tsx:97-130`). TASK-3.5's locked tests assert the default back is 60 × 84
  (`tests/ui/playing-card.acceptance.test.tsx:112-115`, `e2e/cards.spec.ts:85-86`). The gallery must keep exactly
  one back (`e2e/cards.spec.ts:75`).
- Storyboard (`dreams/limit-holdem-trainer/storyboards/Table.dc.html`):
  - header "Cash · 6 players · $4/$8 · Hand #133" with Settings and Leave table (`:21-26`)
  - felt `#2F6B4F` with a 14 px `#24543E` rim, radius 200 px, height 360 px (`:30`)
  - board slots 52 × 72, with dashed `#6FA287` placeholders (`:36-37`); "Pot $30" (`:39`)
  - seat card `#1A1D22` / `1px #343A43`, min-width 132 px: name, "{style} · {stack}" in `#A7AEB8`, action in
    `#FF6B70` (`:42-46`)
  - user seat at the bottom centre with a 2 px `#D7262E` border while to act, "You · Cutoff" and "Stack $184"
    (`:49-58`)
  - seat data: TAG / Calling station / Maniac / Rock labels, "Bet $4", "Folded", "Waiting" (`:94-98`)
- Requirements: bot style names TAG, Calling station, Maniac, Rock (REQ-009.2, glossary line 28). Leave table
  ends the session and opens the report (REQ-004.5). Mid-hand it asks first (REQ-004.7).
- Tests: Vitest in `node` with `renderToString` (`vite.config.ts:7-9`). Playwright at 1280 × 720, Chromium and
  WebKit, against the built preview (`playwright.config.ts`). axe through `e2e/support/axe.ts`. The replay-code
  stub is `stubReplayWords`, and test-only IIFE harnesses are built with Vite (`e2e/support/table-harness-bundle.ts`).
  Locked earlier-story tests: TASK-3.1 `e2e/table.spec.ts`, `tests/ui/table.acceptance.test.tsx`,
  `tests/table/session.acceptance.test.ts`. TASK-3.2 `e2e/action-bar.spec.ts`, `tests/ui/action-bar.acceptance.test.tsx`.
  TASK-2.1 `e2e/home.spec.ts`, `tests/ui/home.acceptance.test.tsx`, `tests/table/session-config.acceptance.test.ts`.
  TASK-3.5 `e2e/cards.spec.ts`, `tests/ui/playing-card.acceptance.test.tsx`.
- Markup constraints from those locked tests that the new markup must keep:
  - `tests/ui/table.acceptance.test.tsx:15-21` parses `<ul aria-label="Seats"…>(.*?)</ul>` and
    `<li…>(.*?)</li>` non-greedily, so there is no nested `ul`/`li` inside the seat list. It also needs
    `<span data-part="name">` and `<span data-part="stack">` with no other attributes, the li order bots
    ascending then the user (`:27`), `data-user=""` on the user li only, `<section aria-label="Table"` with
    aria-label first (`:30`), and no `data-card=` before the deal (`:32`).
  - `e2e/table.spec.ts` / `e2e/home.spec.ts`: `li[data-seat="N"] [data-part="stack"]` text is exactly `$<n>`.
    `li[data-user] svg[data-card]` is exactly the two hole cards. Board cards are
    `group "Board" svg[data-card]`.
- Existing code to reuse:
  - `src/engine/player-view.ts` `playerView` → the only hand input of the view model (no hidden state).
  - `src/table/session.ts` `seatSession`, `dealHand`, `stepBot`, `applyUserAction`, `nextStep` → scripted and
    seeded states in tests.
  - `src/engine/hand.ts` `createHand`, `applyAction`, `legalActions` → the scripted storyboard hand.
    `src/engine/cards.ts` `parseCard`, `formatCard` → the scripted deck.
  - `src/engine/deck.ts` `replayCodeFromWords`, `shuffledDeck` → seeded decks and the AC#8 code.
  - `src/ui/cards/PlayingCard.tsx` `PlayingCard`, `CardBack` → board, hole cards, marker.
  - `src/ui/table/ActionBar.tsx`, `src/table/action-bar.ts` `userActionBar` → unchanged bar.
  - `e2e/support/table-harness-bundle.ts` `stubReplayWords` and its Vite IIFE build → the scene harness.
    `e2e/support/axe.ts` → axe.
  - The `play(hand, 'seat:type …')` helper pattern of `tests/ui/action-bar.acceptance.test.tsx:22-34` → the
    scripted hand (copied into `tests/support/table-scenarios.ts`, not imported from a locked file).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The display comes from a pure function `tableView(table): TableViewModel` in headless `src/table/table-view.ts`. It reads the hand only through `playerView(hand, config.userSeat)` and never reads `table.replayCode`. React only renders the model. | Format inside the component from `HandState` | The model can hold only what the user may see (AC#8, no bot hole cards), and it is unit-testable without a DOM. TASK-4.1/4.5/12.2 extend one function. Same pattern as TASK-3.2 D-1. | no | n/a |
| D-2 | Bot style values: `type BotStyle = 'TAG' \| 'Calling station' \| 'Maniac' \| 'Rock'` (REQ-009.2 names as stored ids; `'TAG'` stays as it is). `SessionSeat.style: BotStyle \| null`. Table seats show the id text itself ("TAG", "Calling station", "Maniac", "Rock", per `Table.dc.html:94-98`). Game Config keeps "Tight-aggressive" for TAG and shows the other three as named. Approved as recommended (`doit/TASK-3.3/qa.md` Q-1). | kebab ids (`'calling-station'`) with a label map; "Tight-aggressive" on the table too | `SessionConfig` is the persisted session shape (TASK-2.1 Q-2), so its value set is a public format. Keeping `'TAG'` leaves TASK-2.1/3.1 locked tests valid. | yes | user (Q-1) |
| D-3 | Seat text formats (see §5 Rules). Last action: "Small blind $2", "Big blind $4", "Folded", "Checked", "Called $4", "Bet $4", "Raised to $8". "Waiting" when the seat has not acted this street and is not to act. The street amount line reads "This street $4" and is shown only when it is above 0. The user's seat shows the street amount and last action too. Approved as recommended (`qa.md` Q-2). | Button-style wording ("Call $4", "Raise to $8"); "In $4"; amount only in chips (E04) | User-visible text. The storyboard fixes only "Bet $4", "Folded" and "Waiting". Past tense matches both. REQ-021 says "for every seat". | yes | user (Q-2) |
| D-4 | Markers and seat order. The seat to act gets a 2 px `#D7262E` border (storyboard user seat) and a visible "To act" badge (white on `#D7262E`). The button seat gets a white "D" disc whose accessible text is "Dealer button" (the visible "D" is `aria-hidden`). Seats are placed clockwise in seat order from the user: the next seat clockwise sits to the user's left (screen left, bottom), then up the left side, across the top and down the right. So at the default table it is You 5 → Eli 6 (left-bottom) → Ava 1 → Ben 2 (top) → Cal 3 → Dee 4 (right-bottom). The storyboard instead lists Ava…Eli left to right, which would put Dee, who acts just before the user, across the table. Approved as recommended (`qa.md` Q-3). | Highlight only (no text, fails AC#10); "Your turn" for the user; "(dealer)" after the name as in the storyboard; storyboard order | User-visible UX. AC#10 needs visible to-act text. Clockwise order lets play move visibly round the table. | yes | user (Q-3) |
| D-5 | Edit earlier stories' locked tests only as listed in §5 "Planned edits to earlier stories' tests". The edits replace `data-to-act` reads with the visible "To act" seat, exclude card-back markers from face-card counts, and allow the one new "Leave table" button. No assertion is removed. If the gate holds a file locked, the orchestrator runs `doit.py unlock TASK-3.3 <file> --reason "AC#10 replaces data-to-act with visible To act text; AC#9 bot card-back markers; AC#7 Leave table control"`. Decided by the orchestrator on precedent, not asked (`qa.md` D-5): AC#10 requires it, and TASK-2.1 Q-3 and TASK-3.2 Q-1 approved the same kind of edit. | Keep `data-to-act` next to the text; weaken checks | AC#10 asks for the replacement. TASK-2.1 Q-3 and TASK-3.2 Q-1 set the precedent of user-approved, listed edits. | yes | orchestrator (D-5 in qa.md, on precedent) |
| D-6 | What Leave table does in this slice. Leave table returns to Home at once (focus on the Home h1, as Cancel does). This discards the in-memory session, and nothing is stored or reported because no persistence exists yet. No dialog. TASK-10.1 replaces this with ending the session and opening the Session Report, and E10-S05 adds the mid-hand dialog. Approved (`qa.md` Q-4). | Disabled button; confirm dialog now; no-op | User-visible behaviour. Mid-hand, REQ-004.7 later requires a dialog, but with no records or stats there is nothing to fold into. | yes | user (Q-4) |
| D-7 | `TableView` is exported from `Table.tsx` and takes `{ table, onAct, onLeave }`. `Table` = `useTableSession` + `TableView`. Tests and the e2e scene harness render `TableView` with scripted `TableState`s. | A test-only prop that injects state into `Table` | Scripted states (AC#1–#7) need no hook. The shipped `Table` path is unchanged. | no | n/a |
| D-8 | The e2e scene harness injects the real `src/ui/styles.css` through Vite's `?inline` import into a `<style>` tag, so layout checks (AC#3) run against the shipped CSS. | Separate CSS asset; check layout only in the app | The IIFE lib build does not inject CSS. The app cannot seat the user at seat 1 yet. | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/table-view.ts` — new: headless view model and text rules.
- `src/table/session.ts` — modify: `BotStyle`, `SessionSeat.style: BotStyle | null`, `TableState.handNumber` (set to 1 in `seatSession`).
- `src/ui/table/Table.tsx` — modify: `TableView` (header, seats, felt, board, pot, bar, status) + `Table`; drop `data-to-act`.
- `src/ui/table/TableScreen.tsx` — modify: `onLeave` prop passed to `Table`; `<main className="table-screen">`.
- `src/ui/App.tsx` — modify: `onLeave={() => setScreen({ name: 'home', returned: true })}` (D-6/Q-4).
- `src/ui/cards/PlayingCard.tsx` — modify: `CardBack({ size = 'standard' }: { size?: 'standard' | 'small' })`.
- `src/ui/config/GameConfigScreen.tsx` — modify: `STYLE_LABELS` gains `'Calling station'`, `Maniac`, `Rock`.
- `src/ui/styles.css` — modify: replace `.table-felt`/`.table-seats`/`.table-board` rules with the table layout.
- `tests/support/table-scenarios.ts` — new: the scripted storyboard hand and the seat-1 session (shared by Vitest and the e2e harness).
- `tests/table/table-view.test.ts` — new: unit tests of the view model.
- `tests/ui/table-display.acceptance.test.tsx` — new: AC#1–#10 on rendered markup.
- `e2e/table-display.spec.ts` — new: browser checks (layout, marker logo, axe, app flow, replay code, Leave table).
- `e2e/support/table-scenes.tsx` — new: test-only page rendering a named scene with the shipped CSS.
- `e2e/support/table-harness-bundle.ts` — modify: `buildTableScenes()` and `openTableScene(page, bundle, scene)` (shared IIFE build helper).
- `e2e/support/table-locators.ts` — new: `toActSeats(page)` and `expectToAct(page, seat)` used by the four e2e specs.
- `e2e/table.spec.ts` — modify (TASK-3.1, D-5): edits 1–5 below.
- `e2e/action-bar.spec.ts` — modify (TASK-3.2, D-5): edit 6.
- `e2e/home.spec.ts` — modify (TASK-2.1, D-5): edit 7.
- `tests/ui/table.acceptance.test.tsx` — modify (TASK-3.1, D-5): edit 8.

### Components, interfaces and data
`src/table/session.ts`:
```ts
/** REQ-009.2 style names; stored as-is in SessionConfig (D-2/Q-1). All play tagPolicy until E06. */
export type BotStyle = 'TAG' | 'Calling station' | 'Maniac' | 'Rock';
export interface SessionSeat { readonly seat: SeatNumber; readonly name: string; readonly kind: 'user' | 'bot'; readonly style: BotStyle | null; }
export interface TableState { /* existing fields */ readonly handNumber: number; } // A-3; seatSession → 1
```

`src/table/table-view.ts` imports only `../engine/*` and `./session` (no React, no DOM):
```ts
export interface SeatView {
  readonly seat: SeatNumber;
  readonly name: string;
  readonly isUser: boolean;
  readonly style: BotStyle | null;          // null for the user
  readonly stack: number;                   // chips behind
  readonly streetAmount: number;            // streetContribution; 0 before the deal
  readonly action: string | null;           // action-line text, null = no line (§ Rules)
  readonly holdsCards: boolean;             // bot only: hand dealt and not folded
  readonly isButton: boolean;
  readonly toAct: boolean;
  readonly position: string | null;         // user only (A-2)
  readonly holeCards: readonly [Card, Card] | null; // user only, after the deal
  /** null for the user (bottom centre); else percentages inside the table ring. */
  readonly slot: { readonly left: number; readonly top: number } | null;
}
export interface TableViewModel {
  readonly header: string;                  // "Cash · 6 players · $4/$8 · Hand #1"
  readonly seats: readonly SeatView[];      // bots ascending by seat, then the user (DOM order of TASK-3.1)
  readonly board: readonly Card[];
  readonly placeholders: number;            // 5 - board.length
  readonly pot: number;                     // A-4
  readonly street: Street | null;           // for data-street
  readonly actionCount: number;             // for data-action-count
  readonly handOver: boolean;
}
export function tableView(table: TableState): TableViewModel;
export function lastActionText(record: ActionRecord): string;
export function positionName(seat: SeatNumber, seats: readonly SeatNumber[], button: SeatNumber): string;
/** 0 = the user; k = k-th seat clockwise after the user in ascending seat order. */
export function seatSlot(seat: SeatNumber, seats: readonly SeatNumber[], userSeat: SeatNumber): number;
export function slotPosition(slot: number, count: number): { left: number; top: number };
export function potTotal(view: PlayerView | null): number;
export function headerText(config: SessionConfig, handNumber: number): string;
```
- `tableView` never mutates its input, reads `table.hand` only via `playerView(table.hand, table.config.userSeat)`,
  and does not read `table.replayCode`. Before the deal (`hand === null`), it uses `table.stacks`,
  `config.seats` and `config.button`. Then `board = []`, `pot = 0`, `streetAmount = 0`, `action = null`,
  `holdsCards = false`, `toAct = false`, `holeCards = null`.
- `positionName` and `seatSlot` throw `RangeError` if `seat`/`button`/`userSeat` is not in `seats`.

`src/ui/table/Table.tsx`:
```tsx
export interface TableViewProps { readonly table: TableState; readonly onAct: (a: Action) => void; readonly onLeave: () => void; }
export function TableView(props: TableViewProps): React.JSX.Element;
export type TableProps = TableSessionOptions & { readonly onLeave?: () => void };
export function Table(props: TableProps): React.JSX.Element; // useTableSession + <TableView onLeave={props.onLeave ?? (() => undefined)} />
```
Markup (attribute order matters where marked ★ because locked regexes read it):
```html
<header class="table-header">
  <p class="table-header-line">Cash · 6 players · $4/$8 · Hand #1</p>
  <button type="button" class="table-leave">Leave table</button>
</header>
<section aria-label="Table"★ class="table" data-street="…" data-action-count="…">
  <div class="table-ring">
    <div class="table-felt">
      <div role="group" aria-label="Board" class="table-cards table-board">
        <svg data-card…/>×board.length  <span class="board-slot" aria-hidden="true"></span>×placeholders
      </div>
      <p class="table-pot">Pot $30</p>
    </div>
    <ul aria-label="Seats" class="table-seats">            <!-- no nested ul/li ★ -->
      <li data-seat="2" class="seat[ seat-to-act]" style="left:50%;top:8%">          <!-- bot -->
        <span data-part="name">Ben</span>★
        <span class="seat-line"><span data-part="style">Calling station</span> · <span data-part="stack">$146</span>★</span>
        <span data-part="street">This street $4</span>   <!-- only if streetAmount > 0 -->
        <span data-part="action">Bet $4</span>            <!-- only if action !== null -->
        <span data-part="to-act">To act</span>            <!-- only if toAct -->
        <span data-part="dealer" class="dealer-button"><span aria-hidden="true">D</span><span class="visually-hidden">Dealer button</span></span> <!-- only if isButton -->
        <svg data-card="back" width="30" height="42" …/>  <!-- CardBack size="small", only if holdsCards -->
      </li>
      <li data-seat="5" data-user="" class="seat seat-user[ seat-to-act]">         <!-- user, always last -->
        <span data-part="name">You</span>★<span aria-hidden="true"> · </span><span data-part="position">Cutoff</span>
        <span class="seat-line">Stack <span data-part="stack">$184</span>★</span>
        (street / action / to-act / dealer spans as above)
        <div role="group" aria-label="Your cards" class="table-cards"> two PlayingCards </div> <!-- after the deal -->
      </li>
    </ul>
  </div>
  <ActionBar …/>   <!-- unchanged, "Your actions", only after the deal -->
  <p role="status">Hand over</p>   <!-- only when handOver -->
</section>
```
- The user li is positioned by CSS (`.seat-user`: `left: 50%; bottom: 0; transform: translateX(-50%)`). Bot lis
  use the inline `left`/`top` from `slot` with `transform: translate(-50%, -50%)`.
- `TableScreen({ config, onLeave })` renders `<main className="table-screen"><h1 ref={heading}>TLH Trainer</h1><Table config={config} onLeave={onLeave} /></main>`
  (the h1 stays exactly `<h1>TLH Trainer</h1>` in server markup).

`CardBack({ size = 'standard' })`: `'standard'` → `width=60 height=84` (unchanged output). `'small'` →
`width=30 height=42`. Both keep `viewBox="0 0 60 84"`, `role="img"`, `aria-label="Face-down card"`,
`data-card="back"` and the logo `<image data-part="logo">`.

### Rules and algorithms
- Header: `${GAME_LABEL[gameType]} · ${config.players} players · $${stake.smallBet}/$${stake.bigBet} · Hand #${handNumber}`
  with `GAME_LABEL = { cash: 'Cash' }`. Example: default config, handNumber 133 → `Cash · 6 players · $4/$8 · Hand #133`.
- Pot (A-4): `sum(view.pots.amount) + sum(view.players.streetContribution)`. Displayed as `Pot $<n>`.
- Board: `view.board` as `PlayingCard`s, then `5 - board.length` placeholders.
- Last action text (D-3/Q-2), from `ActionRecord`: `small-blind` → `Small blind $<amount>`, `big-blind` →
  `Big blind $<amount>`, `fold` → `Folded`, `check` → `Checked`, `call` → `Called $<amount>`, `bet` →
  `Bet $<amount>`, `raise` → `Raised to $<amount>`.
- Action line of a seat (every seat, user included, once dealt). `line` = the current street, or `'river'` when
  `view.street === 'showdown'`.
  1. If the player has folded → `Folded` (on every later street too).
  2. Else, if the seat has a record with `street === line` → `lastActionText` of the latest such record.
  3. Else, if the hand is over or the seat is to act → `null` (A-8; the "To act" badge carries the turn).
  4. Else → `Waiting`.
- Street amount line: `This street $<streetContribution>` when `streetContribution > 0`, else no line.
- `holdsCards` (bots): hand dealt and `!folded`.
- `toAct`: `view.toAct === seat`. `isButton`: `seat === (view?.button ?? config.button)`.
- Seat slots: `seats` = dealt seats ascending (config seats before the deal). `k = (idx(seat) - idx(userSeat) + n) % n`.
  For `k ≥ 1`: `φ = 90° + k·360°/n`, `left = 50 + 40·cos φ`, `top = 50 + 42·sin φ`, each rounded to 1 decimal
  (y grows downward, so φ = 90° is the bottom, 180° the left, 270° the top). Six seats, user 5:
  Eli 6 → k1 (15.4, 71), Ava 1 → k2 (15.4, 29), Ben 2 → k3 (50, 8), Cal 3 → k4 (84.6, 29), Dee 4 → k5 (84.6, 71).
- Positions (A-2): `order = seats clockwise after button` (`[SB, BB, …, Button]`). Button → `Button`, order[0] →
  `Small blind`, order[1] → `Big blind`, button−1 → `Cutoff`, button−2 → `Hijack` (each only if not already
  named), remaining seats in order from order[2]: `Under the gun`, `Under the gun +1`, …
  Examples:
  - 6 seats, button 6: 1 Small blind, 2 Big blind, 3 Under the gun, 4 Hijack, 5 Cutoff, 6 Button.
  - 3 seats: Small blind, Big blind, Button.
  - 4 seats: SB, BB, Cutoff, Button.
  - 9 seats: SB, BB, Under the gun, Under the gun +1, Under the gun +2, Under the gun +3, Hijack, Cutoff, Button.
- Scripted storyboard hand (`tests/support/table-scenarios.ts`, used by AC#1–#6):
  - Stakes $4/$8, default seats, button 6, handNumber 133, with Ben (seat 2) `'Calling station'`, Cal 3
    `'Maniac'`, Dee 4 `'Rock'`, Ava 1 and Eli 6 `'TAG'`.
  - Starting stacks: Ava 214, Ben 158, Cal 305, Dee 198, You 192, Eli 229.
  - Deck: dealing order is seats 1–6, so seat 5 gets deck[4] = A♥ and deck[10] = 9♠. The flop deck[13..15] is
    K♠ 9♦ 4♣, the turn deck[17] is 2♥ and the river deck[19] is 7♣. The other cards follow in ascending order.
  - Built with `createHand` and the `play` helper. `replayCode = replayCodeFromWords([0x9e3779b9, 1, 2, 3])`.

  | State | Moves since previous | Board | Pot | To act | Key seat texts |
  |---|---|---|---|---|---|
  | `PREFLOP` | `3:fold 4:fold 5:raise` | 0 + 5 slots | $14 | 6 | You $184 "This street $8" "Raised to $8"; Ava $212 "Small blind $2"; Ben $154 "Big blind $4"; Cal/Dee "Folded", no back |
  | `FLOP_BET` | `6:call 1:fold 2:call 2:bet` | 3 + 2 | $30 | 5 | Ben "Ben", "Calling station", "$146", "This street $4", "Bet $4", back; Ava "Folded", no back; Eli $221 "Waiting"; You "Cutoff", A♥ 9♠, $184, "To act" |
  | `TURN_BET` | `5:call 6:call 2:check 5:bet` | 4 + 1 | $46 | 6 | Ben "Checked"; You $172 "Bet $8" |
  | `RIVER` | `6:fold 2:call 2:check` | 5 + 0 | $54 | 5 | Ben "Checked"; Eli "Folded" |
  | `SHOWDOWN` | `5:check` | 5 + 0 | $0 | none | no "To act", no "Waiting" |

  The builder cross-checks each state's `toAct` while playing (as `tests/ui/action-bar.acceptance.test.tsx:26`).
- Seat-1 session (AC#3 second session) uses a `seatSession` config of six seats:
  - 1 You (user), 2 Ben, 3 Cal, 4 Dee, 5 Ava, 6 Eli (bots TAG), userSeat 1, button 6.
  - Dealt with `dealHand(…, replayCodeFromWords([0x9e3779b9, 1, 2, 3]))`.
  - The blinds are seats 1 (the user, Small blind) and 2 (Big blind), so seat 3 is first to act.

### Planned edits to earlier stories' tests (D-5/Q-5) — nothing else in these files changes
`e2e/support/table-locators.ts` (new) exports:
```ts
/** Seat list items whose visible text contains "To act". */
export const toActSeats = (page: Page) => page.getByRole('list', { name: 'Seats' }).getByRole('listitem').filter({ hasText: 'To act' });
/** seat '' = nobody to act; else exactly one seat, that seat, with its "To act" text visible. */
export async function expectToAct(page: Page, seat: string): Promise<void>;
```
1. `e2e/table.spec.ts:14` `BUTTON_NAME`: add `|Leave table` to the alternatives (the only non-action button).
2. `e2e/table.spec.ts:49` (in-page recorder): `toAct` comes from the visible text, not the attribute:
   `[...section.querySelectorAll('li[data-seat]')].find((li) => li.textContent?.includes('To act'))?.getAttribute('data-seat') ?? ''`.
3. `e2e/table.spec.ts:195` and `:206`: `tableSection(page).locator('svg[data-card]')` →
   `tableSection(page).locator('svg[data-card]:not([data-card="back"])')`. The counts 2 + board and 7 stay, so
   still no face-up bot card.
4. `e2e/table.spec.ts:225`: `toHaveAttribute('data-to-act', '')` → `await expectToAct(page, '')`.
5. `e2e/table.spec.ts:249`: `toHaveAttribute('data-to-act', '5')` → `await expectToAct(page, '5')`.
6. `e2e/action-bar.spec.ts:156, 161, 166, 185, 202, 222, 240`: each
   `await expect(tableSection(x)).toHaveAttribute('data-to-act', 'N')` → `await expectToAct(x, 'N')`, with the
   same N ('5', '6', '6', '', '5', '5', '6').
7. `e2e/home.spec.ts:243`: `toHaveAttribute('data-to-act', '5')` → `await expectToAct(page, '5')`.
8. `tests/ui/table.acceptance.test.tsx:31`: the markup has exactly one
   `<button type="button" class="table-leave">Leave table</button>`. With that one button removed, it still has
   no `<input|select|textarea|a|button`. In code:
   `expect(html.match(/<button[\s>]/g)).toHaveLength(1); expect(html.replace(/<button type="button" class="table-leave">Leave table<\/button>/, '')).not.toMatch(/<(input|select|textarea|a|button)[\s>]/);`

### Error handling and configuration
- `tableView` propagates `playerView`'s `RangeError` if the user seat is not dealt in (cannot happen through
  `dealHand`). `positionName`/`seatSlot` throw `RangeError('Seat <n> is not at the table')` for unknown seats.
- `lastActionText` is total over `ActionRecord['type']` (exhaustive `switch`, typecheck-enforced).
- No configuration. Leave table calls `onLeave` (Q-4), with no other side effect. Unmounting clears the pending
  deal/bot timer through the existing effect cleanup (`useTableSession.ts:31-51`).

## 6. Behaviour specification

### SPEC-01: Calling-station bot seat on the flop
- Verifies: AC#1, DoD#1
- Behaviour: Given the scripted `FLOP_BET` state (Ben seat 2, `'Calling station'`, $4/$8, flop, Ben bet $4), When
  `renderToString(<TableView table={FLOP_BET} …/>)` is parsed, Then `li[data-seat="2"]` has
  `data-part="name"` "Ben", `data-part="style"` "Calling station", `data-part="stack"` "$146",
  `data-part="street"` "This street $4", `data-part="action"` "Bet $4" and exactly one `svg data-card="back"`
  with `width="30" height="42"`.
- Verification: acceptance `tests/ui/table-display.acceptance.test.tsx::a calling station that bet $4 on the flop shows name, style, stack, street amount, Bet $4 and a card back`

### SPEC-02: Folded bot seat
- Verifies: AC#2, DoD#1
- Behaviour: Given `FLOP_BET`, When rendered, Then Ava (seat 1, folded preflop) and Cal and Dee (seats 3, 4) each
  show `data-part="action"` "Folded" and contain no `svg` with `data-card="back"`. In `PREFLOP`, Cal and Dee
  (folded this street) do the same.
- Verification: acceptance `tests/ui/table-display.acceptance.test.tsx::a folded bot shows Folded and no card back`

### SPEC-03: User seat content in two sessions
- Verifies: AC#3, DoD#1
- Behaviour: Given `FLOP_BET` (user seat 5, button 6), When rendered, Then the last `li` is `data-seat="5"` with
  `data-user`, its "Your cards" group holds exactly `svg data-card="Ah"` and `data-card="9s"` (no back), its
  stack is "$184" and its position is "Cutoff". Given the seat-1 session after the deal, Then the last `li` is
  `data-seat="1"` with `data-user`, two face-up cards, and position "Small blind".
- Verification: acceptance `tests/ui/table-display.acceptance.test.tsx::the user seat shows both cards face up, stack and position name at seat 5 and seat 1`

### SPEC-04: User seat drawn at the bottom centre (browser)
- Verifies: AC#3, DoD#7
- Behaviour: Given the scene harness at 1280 × 720 with scene `flop-bet` and then scene `seat-1`, When the seats'
  bounding boxes are read, Then the user li's horizontal centre is within 2 px of the felt's
  (`.table-felt`) horizontal centre, its bottom edge is lower than every other seat's bottom edge, and in
  `flop-bet` it shows "Cutoff", "$184" and two visible face-up card images (Ace of hearts, Nine of spades).
- Verification: acceptance `e2e/table-display.spec.ts::my seat is drawn at the bottom centre whatever its seat number`

### SPEC-05: Board cards and placeholders at every street
- Verifies: AC#4, DoD#1
- Behaviour: Given `PREFLOP`, `FLOP_BET`, `TURN_BET`, `RIVER`, When each is rendered, Then the "Board" group holds
  0, 3, 4, 5 `svg[data-card]` and 5, 2, 1, 0 `span.board-slot` respectively. The flop cards are `Ks 9d 4c` in
  that order, then `2h` and `7c`.
- Verification: acceptance `tests/ui/table-display.acceptance.test.tsx::the board shows dealt cards and a placeholder for each undealt card`

### SPEC-06: Pot total and dealer button at every street
- Verifies: AC#5, DoD#1
- Behaviour: Given the four street states, When rendered, Then the pot text is "Pot $14", "Pot $30", "Pot $46",
  "Pot $54". For every intermediate state of the scripted hand, it equals `Pot $` + (sum of `hand.pots` amounts +
  sum of players' `streetContribution`) computed in the test. Exactly one `[data-part="dealer"]` exists and it
  is inside `li[data-seat="6"]`. With a seat-1 session (button 6), it is again in seat 6. With
  `seatSession({ button: 3 })` dealt, it is in seat 3.
- Verification: acceptance `tests/ui/table-display.acceptance.test.tsx::the pot equals collected chips plus this street's bets and the dealer marker sits at the button`

### SPEC-07: Exactly the seat to act is highlighted
- Verifies: AC#6, AC#10, DoD#1
- Behaviour: Given the scripted hand replayed move by move from the blinds to `SHOWDOWN`, When each state is
  rendered, Then while `hand.toAct !== null` exactly one `li` has class `seat-to-act` and contains
  `<span data-part="to-act">To act</span>`, and that li's `data-seat` equals `hand.toAct`. At `SHOWDOWN`, no li
  has either. The markup never contains `data-to-act`.
- Verification: acceptance `tests/ui/table-display.acceptance.test.tsx::exactly the seat to act is highlighted and labelled To act`

### SPEC-08: Highlight is visible in the browser
- Verifies: AC#6, DoD#7
- Behaviour: Given scene `flop-bet` (user to act), When computed styles are read, Then the user li's border
  colour is `rgb(215, 38, 46)` and border width is 2 px, no other seat li has that border colour, and the
  "To act" text is visible inside the user li only.
- Verification: acceptance `e2e/table-display.spec.ts::the seat to act is highlighted in red and labelled`

### SPEC-09: Header line and Leave table control
- Verifies: AC#7, DoD#1
- Behaviour: Given `FLOP_BET` (default cash config, 6 players, $4/$8, `handNumber` 133), When rendered, Then
  `<p class="table-header-line">` text is exactly `Cash · 6 players · $4/$8 · Hand #133` and the header holds
  `<button type="button" class="table-leave">Leave table</button>`. `tableView(seatSession()).header` is
  `Cash · 6 players · $4/$8 · Hand #1`.
- Verification: acceptance `tests/ui/table-display.acceptance.test.tsx::the header reads Cash, 6 players, $4/$8 and Hand #133 and offers Leave table`

### SPEC-10: Leave table in the app
- Verifies: AC#7, DoD#7
- Behaviour: Given the app with pinned replay words at the user's first turn, When the header shows
  `Cash · 6 players · $4/$8 · Hand #1` and the user clicks "Leave table", Then (per Q-4) the Home
  h1 "TLH Trainer" is visible and focused, the Table region is gone, and after 1000 ms no new replay code has
  been drawn and no Table region has returned.
- Verification: acceptance `e2e/table-display.spec.ts::the header shows the session and Leave table returns to Home`

### SPEC-11: Replay code appears nowhere during the hand (markup)
- Verifies: AC#8, DoD#1
- Behaviour: Given `code = replayCodeFromWords([0x9e3779b9, 1, 2, 3])` dealt with `dealHand(seatSession(), code)`
  and played by `stepBot` / check-or-call `applyUserAction` until the hand ends, When `TableView` is rendered at
  every intermediate state, including at least one state on each of preflop, flop, turn and river, Then the
  markup (text and every attribute) contains neither `code` nor its upper-case form nor the substring
  `9e3779b9`. `JSON.stringify(tableView(state))` contains neither.
- Verification: acceptance `tests/ui/table-display.acceptance.test.tsx::the replay code appears nowhere on the table during the hand`

### SPEC-12: Replay code appears nowhere during the hand (browser DOM and accessibility tree)
- Verifies: AC#8, DoD#7
- Behaviour: Given the app with pinned words `9e3779b9 00000001 00000002 00000003`, When at each of the user's
  turns (preflop, flop, turn, river, via check-or-call) the test reads `page.content()`, `document.title` and
  `page.locator('body').ariaSnapshot()`, Then none contains `9e3779b9000000010000000200000003` or `9e3779b9`
  (case-insensitive).
- Verification: acceptance `e2e/table-display.spec.ts::the replay code is not in the page text, attributes or accessible names during the hand`

### SPEC-13: Small card-back marker keeps the logo (markup)
- Verifies: AC#9, DoD#1
- Behaviour: Given `renderToStaticMarkup(<CardBack size="small" />)`, Then the root svg has `width="30"`,
  `height="42"`, `viewBox="0 0 60 84"`, `role="img"`, `aria-label="Face-down card"`, `data-card="back"`, and
  contains `<image data-part="logo"` whose `href` is the imported logo URL. `renderToStaticMarkup(<CardBack />)`
  still has `width="60"` and `height="84"` (TASK-3.5's locked test also checks this).
- Verification: acceptance `tests/ui/table-display.acceptance.test.tsx::a bot seat's card back marker is a smaller card back with the logo`

### SPEC-14: Small card-back marker shows the decoded logo and passes axe (browser)
- Verifies: AC#9, DoD#7
- Behaviour: Given scene `flop-bet`, When Ben's seat's `img "Face-down card"` is measured, Then its box is about
  30 × 42 (±0.5), smaller than 60 × 84. Its `image[data-part="logo"]` box lies inside it and is at least
  24 × 24, and the logo decodes to 512 × 512. axe reports no serious or critical violations on the scene.
- Verification: acceptance `e2e/table-display.spec.ts::a bot's card back marker is small, shows the logo and passes axe`

### SPEC-15: Last action and to-act shown as visible text during play
- Verifies: AC#10, DoD#7
- Behaviour: Given the paused clock, pinned words and `runFor(1000)` in 50 ms slices to the user's preflop turn,
  When the seats are read, Then:
  - seats 3 and 4 show visible "Folded"
  - seat 1 shows "Small blind $2" and seat 2 "Big blind $4"
  - `expectToAct(page, '5')` holds
  - the Table section has no `data-to-act` attribute.

  When the user clicks "Call $4", Then seat 5 shows visible "Called $4" and "This street $4", and
  `expectToAct(page, '6')` holds.
- Verification: acceptance `e2e/table-display.spec.ts::last actions and the player to act are visible text`

### SPEC-16: View-model rules
- Verifies: AC#1, AC#3, AC#5, AC#10, DoD#5
- Behaviour: Given the view-model functions and the scripted states, When they are called directly, Then:
  - `lastActionText` maps the seven record types exactly as in §5 Rules.
  - `positionName` gives the §5 examples for 3, 4, 6 and 9 seats.
  - `seatSlot` returns 0..5 for user 5 as in §5 and `slotPosition(3, 6)` is `{ left: 50, top: 8 }`.
  - `potTotal(null)` is 0.
  - The action-line rules 1–4 hold, including "Waiting" for Eli in `FLOP_BET`, `null` for the to-act user and
    no "Waiting" at `SHOWDOWN`.
  - `tableView(seatSession())` has 6 seats ordered `[1,2,3,4,6,5]`, stacks 160, no cards, pot 0, and the dealer
    at seat 6.
  - `tableView` does not change its input (deep-frozen copy compare).
  - `src/table/table-view.ts` imports nothing from `react`, `react-dom` or `src/ui` (source scan as
    `tests/table/action-bar.test.ts:76`).
- Verification: unit `tests/table/table-view.test.ts::view model formats actions, positions, slots and pot from the user's view`

### SPEC-17: Earlier stories' flows still pass with the listed edits
- Verifies: AC#10, DoD#7
- Behaviour: Given only the D-5 edits, When `e2e/table.spec.ts`, `e2e/action-bar.spec.ts`, `e2e/home.spec.ts` and
  `e2e/cards.spec.ts` run in Chromium and WebKit, Then every test passes. These include the 100 ms turn timing
  (now with toAct read from the "To act" text), the axe scans with bot card-back markers on screen, the
  no-face-up-bot-card counts and the `$10/$20` harness. `tests/ui/table.acceptance.test.tsx` (edit 8) and every
  other locked Vitest file pass unchanged otherwise.
- Verification: integration `npx playwright test e2e/table.spec.ts e2e/action-bar.spec.ts e2e/home.spec.ts e2e/cards.spec.ts`

### SPEC-18: Table screen fits 1280 wide, is axe clean and stays same-origin
- Verifies: DoD#7, DoD#8
- Behaviour: Given the app at 1280 × 720, When the user's preflop turn, a bot's turn (paused clock) and "Hand over"
  are reached, Then:
  - `document.documentElement.scrollWidth - clientWidth ≤ 0`
  - every seat li's box lies within x ∈ [0, 1280]
  - no two seat boxes overlap
  - axe reports no serious or critical violations
  - every request made during the test has origin `http://localhost:4173`
- Verification: acceptance `e2e/table-display.spec.ts::the table fits 1280 wide, is axe clean and makes only same-origin requests`

### SPEC-19: Lint, typecheck, unit tests and coverage pass
- Verifies: DoD#2, DoD#4, DoD#5
- Behaviour: Given the change, When the checks run, Then each exits 0, coverage stays ≥ 90% for
  engine/bots/advice/stats and ≥ 70% overall, and the headless-boundary lint passes (no engine/bots/advice/stats
  file changes).
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-20: Playtest stays clean
- Verifies: DoD#6
- Behaviour: Given no engine, bots or advice change, When the 10,000-hand playtest runs, Then it reports zero
  invariant violations.
- Verification: command `npm run playtest -- --hands 10000 --seed 42`

### SPEC-21: CI green and story documentation published
- Verifies: DoD#10, DoD#11
- Behaviour: Given branch `doit/TASK-3.3`, When CI runs and the story doc is written, Then the workflow is green.
  `backlog doc list --plain` lists a TASK-3.3 doc that records D-2..D-6 with their Q answers, the D-5 test
  edits, and the follow-ups in §13.
- Verification: manual CI run on branch `doit/TASK-3.3` and `backlog doc list --plain`

### SPEC-22: Not-applicable DoD items
- Verifies: DoD#3, DoD#9, DoD#12
- Behaviour: Given the golden-spot suite (E07-S14) and the offline service worker (E13-S07) do not exist and this
  story adds no strategy content, When the Judge checks, Then the diff touches no file under `src/advice`, no
  golden spot and no strategy text.
- Verification: manual Judge confirms the diff has no strategy content and that E07-S14 and E13-S07 are not Done

## 7. Edge cases
- Before the deal (one macrotask after Start game): seats show names, styles and buy-in stacks only, with no
  cards, backs, street or action lines, and pot $0. The dealer marker is at `config.button`. Covered by
  SPEC-16; the locked `tests/ui/table.acceptance.test.tsx` checks no `data-card=` at this point.
- The hand is over (fold-out or showdown): no "To act", no "Waiting" (A-8), pot $0 (A-4), and unfolded bots keep
  backs. Covered by SPEC-07 and SPEC-16.
- A seat folds on an earlier street: "Folded" on every later street, with no back. Covered by SPEC-02.
- Big blind to act preflop with no raise: shows "Big blind $4" and "To act" together (rule 2 before rule 3).
  Covered by SPEC-16.
- User seat 1 (wrap-around slot order) is covered by SPEC-03/04. Other table sizes (3–10, reachable only from
  tests) are covered by SPEC-16 for positions and slots.
- Leave table mid-hand: per Q-4 the session is discarded and timers are cleared on unmount (SPEC-10). No
  `onHandComplete` call.
- StrictMode double render: the model is pure. No effects are added.
- A bot seat with a long name or label: the seat box grows (min-width 132 px). Names are fixed short names today.
  The 10-seat fit is TASK-3.16.
- All-in and side pots cannot occur yet (engine minimum stack, `hand.ts:151-156`). Pot = sum of all pots once
  TASK-1.10 lands; separate amounts are TASK-3.8.

## 8. Security considerations
- Hidden information: the view model reads the hand only through the user's `PlayerView` (D-1), so bot hole
  cards and the deck cannot reach the DOM. The replay code is never read (SPEC-11, SPEC-12; REQ-013.4).
- Trust boundaries: none new. All input is in-memory engine state. No storage, network, authn/authz, secrets or
  new dependencies (Vite's `?inline` is a built-in import query, used only in the test harness).
- Randomness: none added. Tests use the existing seeded generators and the `stubReplayWords` stub.

## 9. Non-functional
- Render cost: one `playerView` copy and O(seats + actions) formatting per render. This is negligible next to the
  100 ms turn budget still enforced by `e2e/table.spec.ts` (SPEC-17).
- Layout: no horizontal scroll at 1280 × 720 with 6 seats (SPEC-18). Vertical fit and 10 seats are TASK-3.16.
- Contrast and axe: zero serious or critical axe violations (SPEC-14, SPEC-18). Colours come from the storyboard:
  - `#F2F3F5` / `#A7AEB8` / `#FF6B70` on `#1A1D22`
  - white on `#D7262E` (4.99:1, doc-23 A-6)
  - `#111111` on a `#FAFAF7` dealer disc
- Leave table is a native button at least 44 px tall (REQ-057.4; TASK-3.17 measures it later).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview` then open `http://localhost:4173`, choose New game, then Start game (or `npm run dev`)
- New tests (path → SPEC ids):
  - `tests/ui/table-display.acceptance.test.tsx` → SPEC-01, 02, 03, 05, 06, 07, 09, 11, 13
  - `tests/table/table-view.test.ts` → SPEC-16
  - `e2e/table-display.spec.ts` (Chromium and WebKit) → SPEC-04, 08, 10, 12, 14, 15, 18
  - Edited earlier-story tests (D-5) → SPEC-17
  - Commands → SPEC-19, SPEC-20
- End-to-end scenario for the Judge:
  1. Run `npm run build && npm run preview`, open `http://localhost:4173`, then New game → Start game.
  2. The header reads "Cash · 6 players · $4/$8 · Hand #1" with a Leave table button.
  3. Five bot seats sit around the green oval: Eli lower left, Ava upper left, Ben top, Cal upper right, Dee lower
     right. Each shows a name, "TAG · $<stack>", its last action, and a small card back with the TLH logo while
     it holds cards.
  4. Your seat at the bottom centre shows "You · Cutoff", "Stack $160", and your two cards face up.
  5. Seat 6 has the "D" disc. The board shows five dashed slots preflop and "Pot $6" rising as blinds and bets go
     in.
  6. Cal and Dee show "Folded" and lose their backs. Your seat turns red-bordered with "To act".
  7. Call: your seat shows "Called $4" and "This street $4", and "To act" moves to Eli.
  8. Play on: the board fills 3, 4, 5 with the slots shrinking, and at "Hand over" no seat says "To act".
  9. Click Leave table: Home opens (per Q-4).
  10. No 32-hex replay code is visible anywhere.

## 11. Open questions
- None. Q-1..Q-4 were answered by the user on 2026-11-18 with the recommended options, and D-5 was decided by the orchestrator (`doit/TASK-3.3/qa.md`). All are folded into D-2..D-6.

## 12. Clarifications log
See `doit/TASK-3.3/qa.md`.

## 13. Follow-ups (become tasks)
- TASK-3.4: increment `TableState.handNumber` when the next hand is dealt, and decide what the pot line shows after the award (A-4).
- TASK-10.1: replace TASK-3.3's Leave table handler (`App.tsx` `onLeave`) with ending the session and opening the Session Report.
- E10-S05: add the mid-hand "Leave now? Your hand will be folded." dialog in front of the same `onLeave` (REQ-004.7).
- TASK-12.2: hide `data-part="style"` (and its " · " separator) on bot seats when "Show opponent styles" is off.
- TASK-2.8: give each `BotStyle` a Game Config label and selector; E06: give Calling station, Maniac and Rock their own seat policies in `stepBot` (today all play `tagPolicy`).
- TASK-2.2: confirm the position names at 2–5 and 7–10 seats (A-2), including heads-up once the engine allows 2 seats.
- TASK-3.16: fit 10 seats and the vertical layout at 1280 × 720 using `slotPosition`; move `e2e/support/table-locators.ts` helpers and the duplicated spec helpers into one support module.
- TASK-4.4: replace the CSS "D" disc with the drawn dealer button, keeping `data-part="dealer"` and its "Dealer button" accessible text.
- TASK-4.5: draw chips for `streetAmount` in front of the seat, and decide whether the "This street $X" text line stays.
