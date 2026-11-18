# Spec: TASK-3.1 — Play a complete hand against TAG bots at a default 6-max table in the browser

Status: READY (approved 2026-11-18 by user via Q-1)
Task: TASK-3.1 · Parent/epic: TASK-3 (Play hands at the table) · Requirements: REQ-007.1, REQ-019.6, REQ-024.4, REQ-024.5 (REQ-024.1–.3 result and auto-deal are TASK-3.4; REQ-010 random seat/button is TASK-2.13; REQ-021 full display is TASK-3.3) · Dream: limit-holdem-trainer

## 1. Summary
The app stops being a placeholder: it opens straight onto a default cash session (6 players, $4/$8, the user
plus five TAG bots, every stack $160 = 20 big bets) and plays one complete fixed-limit hand in the browser. A
headless table-session module (`src/table/session.ts`) seats the session, deals from a crypto replay code, steps
TAG bots through `tagPolicy` on their own `PlayerView`, applies the user's chosen legal action and produces a
plain-data `CompletedHand` record for later consumers (E09 review, TASK-3.9 persistence). A thin React layer
draws the minimal table (seat names and stacks, the user's two face-up hole cards, the dealt board, plain buttons
for the user's legal actions) and schedules bot actions with no artificial delay, never during the user's turn.

## 2. Scope
- In scope:
  - `src/table/session.ts` (headless, no React/DOM): session config, buy-in, fixed default seating, deal, bot
    step, user action, next-step query, `CompletedHand` record.
  - `src/ui/table/useTableSession.ts`: React hook that owns the session state and schedules deal/bot steps.
  - `src/ui/table/Table.tsx`: the minimal Table screen; `src/ui/App.tsx` renders it with the default config.
  - Minimal felt styling in `src/ui/styles.css`.
  - Vitest acceptance/unit tests, a Playwright spec in Chromium and WebKit with axe, and a test-only Table
    harness bundle for the $10/$20 configuration (same pattern as the TASK-3.5 card gallery, D-4 there).
- Not doing:
  - Exact-amount action labels ("Call $4", "Raise to $8"), disabled-bar state, 44 px targets, key-press
    checks (TASK-3.2). Buttons here are plain verbs.
  - Style labels, chips put in this street, last action, card-back markers, folded markers, board placeholders,
    pot, dealer button, to-act highlight, position name, header, Leave table, bottom-centre oval layout
    (TASK-3.3, TASK-3.16).
  - The hand result (winners, amounts, hand names), showing bots' showdown cards, the 1.5 s auto-deal and any
    second hand (TASK-3.4) — D-3 (Q-1) defines what this slice does when the hand ends.
  - Random user seat and button (TASK-2.13), Game Config/Home (TASK-2.1), rebuy (TASK-3.11), bot replacement
    (E06-S08), speed choice and Rapid/Realistic pacing tests (TASK-3.13/3.18), action log (REQ-023).
  - Persisting the hand record or any IndexedDB use (TASK-3.9); recording advice/grades (TASK-3.12).
  - Off-main-thread bot computation (TASK-3.6); error recovery screen (TASK-13.1); money formatting (E03-S19).
  - Any change to `src/engine`, `src/bots`, `src/advice`, the playtest, lint config or locked tests.
- Scope budget: files=12, lines=1300   (session.ts ~190, useTableSession.ts ~70, Table.tsx ~130, App.tsx ~10, styles.css ~45, session acceptance test ~260, session unit test ~130, table UI acceptance test ~80, app unit test ~15, e2e/table.spec.ts ~280, harness entry ~25, harness bundle helper ~45)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Fixed default seating copied from the Table storyboard: seat 1 Ava, 2 Ben, 3 Cal, 4 Dee, 5 You (user), 6 Eli; button at seat 6, so Ava posts the small blind, Ben the big blind and the user is in the cutoff. Bots are named without a "Bot" prefix. | yes | Storyboard `dreams/limit-holdem-trainer/storyboards/Table.dc.html` (seat list: Ava SB, Ben BB, Cal, Dee, user "You · Cutoff", Eli dealer); TASK-3.3 AC#1/#3 use "Ben" and "seat 5 of 6 in the cutoff". Random seat/button is REQ-010 / TASK-2.13. The user always acts after a bot preflop (Dee, HJ), which exercises AC#7 every hand. | User at seat 1; random seat now |
| A-2 | The table first shows the seated session (six names, every stack = buy-in, no cards), then deals hand 1 in the next macrotask (`setTimeout(…, 0)`). AC#1's "every player's stack is $160" is checked on that seated table, because once blinds post the small and big blind show $158 and $156. | yes | Only literal reading of AC#1 that can hold for all six seats; costs one frame; the same "deal" step is what TASK-3.4's auto-deal will call. | Check AC#1 only in data (startingStack) and show $158/$156 from the first paint |
| A-3 | Stacks show chips behind (`PlayerState.stack`), formatted `$<integer>` with no thousands separator. | yes | TASK-3.3 AC#1 shows "$146" stack with "$4" put in separately; formatting is E03-S19. | Show stack + street contribution |
| A-4 | Action buttons are rendered only on the user's turn, one native `<button>` per engine legal action, labelled with the plain verb: "Fold", "Check", "Call", "Bet", "Raise", in the engine's order. No buttons at other times. | yes | Story: "plain buttons for the engine's legal actions"; TASK-3.2 replaces them with the exact-amount bar and its disabled state. | Always-visible disabled buttons; amount labels now |
| A-5 | Bots act with no artificial delay: each deal and bot step is one `setTimeout(…, 0)` macrotask, one engine action per step, so the browser can paint between actions. | yes | Glossary "Rapid = bots act without artificial delay" (`requirements.md:34`) and Rapid is the default speed (REQ-012.2, REQ-050.1); AC#7 forbids delay before the user's turn. Pacing tests are TASK-3.13. | Visible delay (Realistic, TASK-3.18) |
| A-6 | Bot decisions run on the main thread. | yes | TAG facing a bet ~13 ms at 6-max (caller measurement), free postflop checks skip equity (`src/bots/tag.ts:16-19`); REQ-055.6 off-thread is TASK-3.6's AC. | Web Worker now |
| A-7 | `CompletedHand` is an in-memory, JSON-serialisable record handed to an optional `onHandComplete` callback and returned by `completedHand(table)`; its persisted format is TASK-3.9's decision. | yes | Minimal and extendable; nothing is stored in this task. | Persist now |
| A-8 | Errors thrown by the engine or a bot (none expected: buttons offer only legal actions, TAG returns legal moves at 6 players) propagate uncaught; no error UI. | yes | Recovery screen is TASK-13.1. | Inline error message |
| A-9 | Test hooks are data attributes on the table root, not user-visible text: `data-street`, `data-to-act` (seat or empty) and `data-action-count` (number of `ActionRecord`s, blinds included). | yes | AC#5–#7 need to observe bot actions that change no visible text (a check); TASK-3.3 adds visible last-action text. | Visually hidden live region announcing actions |
| A-10 | The $10/$20 configuration (AC#2) is exercised through a `config` prop on `Table`, driven in the browser by a test-only harness bundle built inside the e2e test (pattern of `e2e/support/card-gallery-bundle.ts:11-27`); nothing new ships for it. | yes | Game Config (TASK-2.1) will pass the same prop; URL parameters would be user-visible. | URL/query parameter; dev-only route |
| A-11 | e2e makes the real app deterministic by replacing `crypto.getRandomValues` in `page.addInitScript` so 4-word `Uint32Array` requests receive fixed words (other requests delegate to the original). Nothing test-only ships. | yes | Same technique as the locked `e2e/replay-seed.spec.ts:47-59`; `newReplayCode` draws exactly one `Uint32Array(4)` (`src/engine/deck.ts:15-21`); TAG is deterministic (doc-18 D-1), so a code fixes the whole hand. | Seed prop/route in the shipped app |
| A-12 | The AC#7 browser timing check (≤ 100 ms) stays enforced in CI. | yes | The bot action and the enabled buttons land in the same React commit, so the measured gap is ~0 ms regardless of runner speed; TASK-1.20's CI relaxation targets throughput limits. | Gate with `CI=true` like the perf suites |

## 3. Current system
- Toolchain: React 19 + Vite 8, TypeScript 6 strict (`tsconfig.json`), Vitest 5 in the `node` environment with
  v8 coverage (`vite.config.ts:5-18`; thresholds 70% overall, 90% for `src/{engine,bots,advice,stats}/**`),
  ESLint with `react-hooks` for `src/ui/**` (`eslint.config.js:26`), Prettier, Playwright 1.65 in Chromium and
  WebKit at 1280 × 720 against `npm run build && npm run preview` on port 4173 (`playwright.config.ts:3-22`).
  No jsdom/testing-library: UI unit tests use `renderToString` (`tests/unit/app.test.tsx:1-10`).
- Engine API: `createHand(config)` posts blinds and deals (`src/engine/hand.ts:160-214`), validates 6 seats,
  stakes and stacks ≥ 8 × small bet + 8 × big bet (`hand.ts:151-156`; buy-in 20 × big bet always satisfies it);
  `legalActions(state)` exact actions for `toAct` (`hand.ts:217-241`); `applyAction` returns `{ok, state|error}`
  and never mutates (`hand.ts:355-415`); `toAct === null` and `result !== null` once complete (`hand.ts:93-99`).
  Hole cards for seat at deal position (`hand.ts:176`); board grows on street change (`hand.ts:338-351`).
- Views and policies: `playerView(state, seat)` copies only visible fields (`src/engine/player-view.ts:62-106`);
  `SeatPolicy = (view) => Action` (`player-view.ts:59`); `actWith(state, policy)` builds the to-act view and
  applies the policy's action (`player-view.ts:109-118`); `showdownOf(state)` (`player-view.ts:121-129`).
- Deal source: `newReplayCode()` via one `crypto.getRandomValues(new Uint32Array(4))` (`src/engine/deck.ts:15-21`),
  `shuffledDeck(code)` (`deck.ts:41-55`), `replayCodeFromWords` for tests (`deck.ts:24-33`).
- Bots: `tagPolicy` (`src/bots/tag.ts:24`); deterministic, preflop chart only for exactly 6 dealt-in seats
  (doc-18 §3, `src/advice/preflop.ts:49-53`); postflop advice never bets or raises (doc-18 scope concern), so a
  bot facing no bet always checks.
- Cards: `PlayingCard({card})` renders `<svg role="img" aria-label="Ace of spades" data-card="As">`
  (`src/ui/cards/PlayingCard.tsx:40-95`).
- App shell: `src/ui/App.tsx:1-8` placeholder `<main><h1>TLH Trainer</h1>…`; `src/main.tsx:11-15` renders it in
  `StrictMode` (effects and state updaters run twice in development). `src/ui/styles.css:1-6` dark root.
- Locked tests that constrain this task: `e2e/smoke.spec.ts` (TASK-1.1) requires on `/` the title "TLH Trainer",
  a visible level-1 heading "TLH Trainer", zero serious/critical axe violations and only same-origin requests
  (`smoke.spec.ts:7-42`) — the Table page keeps that `<h1>`. `e2e/replay-seed.spec.ts` (TASK-1.3) loads `/`.
  `tests/unit/app.test.tsx` is not locked and asserts the old markup; it is updated here.
- Theme: felt base `#2F6B4F` (TASK-3.16 AC#2, REQ-060.3); white text on it has contrast ≈ 6.3:1.
- Existing code to reuse (path → what to reuse instead of writing new):
  - `src/engine/hand.ts` → `createHand`, `legalActions`, `applyAction`, types `Stakes`, `HandState`, `Action`, `ActionRecord`, `HandResult`, `SeatNumber`.
  - `src/engine/player-view.ts` → `playerView`, `actWith`, `showdownOf`, `PlayerView`, `SeatPolicy`, `EarlierShowdown`.
  - `src/engine/deck.ts` → `newReplayCode`, `shuffledDeck`, `replayCodeFromWords`, `ReplayCode`.
  - `src/bots/tag.ts` → `tagPolicy`, `decideTag` (test oracle for "bots are TAG").
  - `src/ui/cards/PlayingCard.tsx` → `PlayingCard` for hole and board cards.
  - `src/engine/cards.ts` → `formatCard` (test assertions).
  - `e2e/support/axe.ts` → `expectNoSeriousAxeViolations`.
  - `e2e/support/card-gallery-bundle.ts` → copy its in-test Vite IIFE build for the Table harness.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Game logic lives in a headless module `src/table/session.ts` (pure functions over an immutable `TableState`); React only holds the state and schedules steps. | Logic inside components; a store library | Keeps engine logic out of components, unit-testable in Node without a DOM, no new dependency. | no | n/a |
| D-2 | One scheduling rule in the hook: after each state change, `nextStep(table)` decides — `'deal'` or `'bot'` → one `setTimeout(step, 0)` (cleared on cleanup); `'user'` or `'done'` → nothing is scheduled. | Run all bots synchronously in one update; `requestAnimationFrame` | Guarantees no bot acts during the user's turn and no timer exists while waiting (AC#5); paints between bot actions; StrictMode-safe with cleanup. | no | n/a |
| D-3 | One hand per page load. When the hand ends the action buttons are removed, the final stacks and board stay, `<p role="status">Hand over</p>` appears inside the Table section, and no further hand is dealt (`nextStep` stays `'done'`, nothing is scheduled); reloading deals a new hand. | "Deal next hand" button with carried stacks; immediate auto-deal | Avoids the engine minimum-stack problem (rebuy TASK-3.11, bot replacement E06-S08); TASK-3.4 adds the result and 1.5 s auto-deal (`doit/TASK-3.1/qa.md` Q-1). | yes | user (Q-1) |

## 5. Design

### Files to create / modify
- `src/table/session.ts` — new: config, seating, deal, bot step, user action, next step, completed-hand record.
- `src/ui/table/useTableSession.ts` — new: React hook holding `TableState` and scheduling deal/bot steps.
- `src/ui/table/Table.tsx` — new: the minimal Table screen.
- `src/ui/App.tsx` — modify: render `<main><h1>TLH Trainer</h1><Table /></main>`.
- `src/ui/styles.css` — modify: felt section, seat list, card row, button row.
- `tests/table/session.acceptance.test.ts` — new: SPEC-01..SPEC-07 (locked).
- `tests/table/session.test.ts` — new: SPEC-08..SPEC-10.
- `tests/ui/table.acceptance.test.tsx` — new: SPEC-11 (locked; `renderToString`).
- `tests/unit/app.test.tsx` — modify: App renders the heading and the seated default table.
- `e2e/table.spec.ts` — new: SPEC-12..SPEC-17 (locked).
- `e2e/support/table-harness.tsx` — new: test-only entry mounting `<Table config={{ stake: { smallBet: 10, bigBet: 20 } }} />`.
- `e2e/support/table-harness-bundle.ts` — new: in-test Vite IIFE build and `openTableHarness(page, bundle)`.

### Components, interfaces and data
```ts
// src/table/session.ts — must not import React, DOM APIs or src/ui
export interface Stake { readonly smallBet: number; readonly bigBet: number }
/** Later stories (TASK-2.1+) add fields: game type, players, line-up, speed, seat, button. */
export interface SessionConfig { readonly stake: Stake }
export const DEFAULT_SESSION_CONFIG: SessionConfig; // { stake: { smallBet: 4, bigBet: 8 } }
/** REQ-006.2: small blind = floor(smallBet / 2), big blind = smallBet. */
export function stakesFor(stake: Stake): Stakes;
/** REQ-007.1: 20 × big bet. */
export function buyIn(stake: Stake): number;

export interface SessionSeat {
  readonly seat: SeatNumber;
  readonly name: string;            // 'Ava' | 'Ben' | 'Cal' | 'Dee' | 'You' | 'Eli'
  readonly kind: 'user' | 'bot';
  readonly style: 'TAG' | null;     // null for the user
}
export const DEFAULT_SEATS: readonly SessionSeat[]; // A-1, ascending seat order
export const USER_SEAT: SeatNumber;                 // 5
export const DEFAULT_BUTTON: SeatNumber;            // 6

export interface UserDecision { readonly view: PlayerView; readonly action: Action }
export interface TableState {
  readonly config: SessionConfig;
  readonly stakes: Stakes;
  readonly seats: readonly SessionSeat[];
  /** Chips per seat before the current hand (buy-in until a hand completes). */
  readonly stacks: readonly { readonly seat: SeatNumber; readonly stack: number }[]; // ascending seat order
  readonly hand: HandState | null;          // null until dealt
  readonly replayCode: ReplayCode | null;
  readonly userDecisions: readonly UserDecision[];
}
export type NextStep = 'deal' | 'bot' | 'user' | 'done';

export function seatSession(config?: SessionConfig): TableState;          // hand null, stacks = buyIn
export function nextStep(table: TableState): NextStep;
//   hand null → 'deal'; hand.result !== null → 'done'; toAct === USER_SEAT → 'user'; else 'bot'
export function dealHand(table: TableState, code: ReplayCode): TableState;
//   RangeError unless nextStep === 'deal'; createHand({stakes, seats: stacks, button: DEFAULT_BUTTON, deck: shuffledDeck(code)})
export function stepBot(table: TableState, policy?: SeatPolicy): TableState; // default tagPolicy
//   RangeError('Not a bot turn') unless nextStep === 'bot'; one actWith(); Error with the engine message if rejected
export function applyUserAction(table: TableState, action: Action): TableState;
//   RangeError unless nextStep === 'user'; records {view: playerView(hand, USER_SEAT), action} then applyAction;
//   RangeError with the engine message if illegal
export function userActions(table: TableState): readonly Action[];       // legalActions when 'user', else []

export interface CompletedHand {
  readonly replayCode: ReplayCode;
  readonly stakes: Stakes;
  readonly button: SeatNumber;
  readonly seats: readonly (SessionSeat & { readonly startingStack: number })[];
  readonly userSeat: SeatNumber;
  readonly userHoleCards: readonly [Card, Card];
  /** Blinds first, then every action in order, each tagged with its street and seat. */
  readonly actions: readonly ActionRecord[];
  readonly board: readonly Card[];
  /** Hands shown at showdown (showdownOf); null for a fold-out. */
  readonly shown: EarlierShowdown | null;
  readonly result: HandResult;
  /** One entry per user decision, in order, with the user's PlayerView at that moment. */
  readonly userDecisions: readonly UserDecision[];
}
export function completedHand(table: TableState): CompletedHand | null;   // null until result !== null
```
- Invariants: `TableState` is never mutated; every function returns a new object or throws. `completedHand` is
  plain data (no Map, class instance or function): `JSON.parse(JSON.stringify(x))` deep-equals `x`.

```ts
// src/ui/table/useTableSession.ts
export interface TableSessionOptions {
  readonly config?: SessionConfig;                       // default DEFAULT_SESSION_CONFIG
  readonly newCode?: () => ReplayCode;                   // default newReplayCode
  readonly onHandComplete?: (hand: CompletedHand) => void;
}
export function useTableSession(o: TableSessionOptions): { table: TableState; act: (a: Action) => void };
```
- State via `useState(() => seatSession(config))`. Effect keyed on `table`: per D-2. The `'deal'` timer callback
  draws the code outside the state updater (`const code = newCode(); setTable(t => dealHand(t, code))`) so
  StrictMode's double updater call cannot draw twice; the `'bot'` callback uses `setTable(stepBot)`. On
  `'done'` the effect calls `onHandComplete(completedHand(table))` at most once per replay code (ref guard).
  `act(a)` calls `setTable(t => nextStep(t) === 'user' ? applyUserAction(t, a) : t)` (stale clicks are no-ops).

```tsx
// src/ui/table/Table.tsx
export interface TableProps extends TableSessionOptions {}
export function Table(props: TableProps): React.JSX.Element;
```
Markup (roles and names are the test contract):
- `<section aria-label="Table" class="table-felt" data-street={hand?.street ?? ''} data-to-act={toAct ?? ''} data-action-count={hand?.actions.length ?? 0}>`
- `<ul aria-label="Seats">` with one `<li data-seat="<n>" data-user?>` per seat: bots in ascending seat order,
  then the user's seat last. Each `<li>` holds `<span data-part="name">Ava</span>` and
  `<span data-part="stack">$160</span>` (stack = `hand.players[].stack` once dealt, else the seated stack). The
  user's `<li>` also holds `<div role="group" aria-label="Your cards">` with two `PlayingCard`s once dealt.
- `<div role="group" aria-label="Board">` with one `PlayingCard` per dealt board card (empty preflop).
- Only when `nextStep === 'user'`: `<div role="group" aria-label="Your actions">` with one
  `<button type="button">` per `userActions(table)` (A-4 labels).
- No other controls: no input, select, textarea or link inside the Table section. No bot hole cards and no
  replay code anywhere in the DOM.
- When `nextStep === 'done'` (D-3): `<p role="status">Hand over</p>` inside the Table section; no buttons; final stacks and board stay.

### Rules and algorithms
- Buy-in: `20 × bigBet`. $4/$8 → $160; $10/$20 → $400. Blinds (REQ-006.2): $4/$8 → $2/$4; $10/$20 → $5/$10.
- Default seating and order (A-1): createHand seats `[1..6]` each with the buy-in, button 6 → SB 1 (Ava $158),
  BB 2 (Ben $156); preflop order Cal (3), Dee (4), You (5), Eli (6), Ava (1), Ben (2); postflop first to act is
  the first active seat after the button (Ava).
- Worked example of AC#7: after the deal, steps run Cal, then Dee (each a `'bot'` step in its own macrotask);
  Dee's action leaves `toAct = 5`, so the commit that shows `data-action-count` 4 (2 blinds + 2 actions) also
  renders "Your actions"; no timer is scheduled.
- Check/call at every decision always reaches showdown: the user is never first to fold, TAG never folds when it
  can check, and postflop TAG never bets, so at least the big blind (or a preflop raiser) reaches the river.

### Error handling and configuration
- `dealHand`/`stepBot`/`applyUserAction` called in the wrong step throw `RangeError` with messages
  `'Not a deal step'`, `'Not a bot turn'`, `'Not the user's turn'`. Engine rejections are rethrown as
  `RangeError(error.message)`. In the UI these cannot occur through normal use (A-8).
- Defaults: `DEFAULT_SESSION_CONFIG` = $4/$8; `newCode` = `newReplayCode`; bot policy = `tagPolicy`.

## 6. Behaviour specification

### SPEC-01: Default session seats the user and five TAG bots at $4/$8 with $160 each
- Verifies: AC#1
- Behaviour: Given `seatSession()`, When it is inspected, Then `stakes` = {2, 4, 4, 8}, seats 1–6 are Ava, Ben,
  Cal, Dee, You, Eli with kinds bot×4, user, bot and styles TAG (null for You), every seat's stack is 160,
  `hand` is null and `nextStep` is `'deal'`; and after `dealHand(…, code)` every `PlayerState.startingStack` is
  160 and the button is 6.
- Verification: acceptance `tests/table/session.acceptance.test.ts::default session seats the user and five TAG bots at $4/$8 with $160 each`

### SPEC-02: Buy-in is 20 big bets of the configured stake
- Verifies: AC#2
- Behaviour: Given `seatSession({ stake: { smallBet: 10, bigBet: 20 } })`, When the table is seated and the hand
  dealt, Then every seat's stack and every `startingStack` is 400 and stakes are {5, 10, 10, 20}; and for each
  REQ-006 stake ($2/$4 … $20/$40) `buyIn` is 20 × big bet and `stakesFor` gives the REQ-006.2 blinds.
- Verification: acceptance `tests/table/session.acceptance.test.ts::buy-in is 20 big bets of the configured stake`

### SPEC-03: Check or call at every decision plays to showdown
- Verifies: AC#3, AC#6
- Behaviour: Given the default session and each of 50 replay codes from `replayCodeFromWords([i, 1, 2, 3])`,
  When the test loops on `nextStep` — `'deal'` → `dealHand`, `'bot'` → `stepBot` (no user input), `'user'` →
  `applyUserAction` with the legal check if present else call — until `'done'`, Then `result.endedBy` is
  `'showdown'`, the board has 5 cards, the user made at least one decision on each of preflop, flop, turn and
  river, and `completedHand(table).userHoleCards` equals the user's dealt cards.
- Verification: acceptance `tests/table/session.acceptance.test.ts::check or call at every decision plays to showdown`

### SPEC-04: After a preflop fold the bots finish the hand without the user
- Verifies: AC#4, AC#6
- Behaviour: Given the default session and 50 replay codes, When the user's first decision is Fold and the loop
  continues, Then `nextStep` never returns `'user'` again, the hand reaches `'done'` using only `stepBot`, the
  user's `PlayerState.folded` is true, `userDecisions` has exactly one entry (fold, street preflop) and the
  user's hole cards in the final state and in `completedHand` are unchanged.
- Verification: acceptance `tests/table/session.acceptance.test.ts::after a preflop fold the bots finish the hand without the user`

### SPEC-05: Bots never act during the user's turn
- Verifies: AC#5, AC#7
- Behaviour: Given a dealt hand where `nextStep` is `'user'`, When `stepBot` is called, Then it throws
  `RangeError('Not a bot turn')`, the state is unchanged, `nextStep` still returns `'user'` on repeated calls
  and `userActions` equals `legalActions(hand)`; and Given `nextStep` is `'bot'`, When `applyUserAction` is
  called, Then it throws `RangeError("Not the user's turn")`.
- Verification: acceptance `tests/table/session.acceptance.test.ts::bots never act during the user's turn`

### SPEC-06: Every bot action is the TAG decision on that bot's own view
- Verifies: AC#1, AC#6
- Behaviour: Given 50 seeded hands played by the SPEC-03 loop, When each `stepBot` is applied, Then the appended
  `ActionRecord` equals `decideTag(playerView(before, before.toAct))` for the acting seat.
- Verification: acceptance `tests/table/session.acceptance.test.ts::every bot action is the TAG decision on its own view`

### SPEC-07: The completed hand is a plain-data record
- Verifies: AC#3, AC#4
- Behaviour: Given a completed seeded hand (one showdown, one fold-out), When `completedHand(table)` is read,
  Then it holds the replay code, stakes, button 6, the six seats with names, kinds, styles and startingStack,
  userSeat 5, the user's hole cards, `actions` equal to `hand.actions`, the board, `shown` equal to
  `showdownOf(hand)` (null for the fold-out), `result` and one `userDecisions` entry per user action whose
  `view` equals `playerView` at that moment; `JSON.parse(JSON.stringify(record))` deep-equals it; before
  completion it returns null.
- Verification: acceptance `tests/table/session.acceptance.test.ts::the completed hand is a plain-data record`

### SPEC-08: Wrong-step calls and illegal user actions are rejected
- Verifies: DoD#1
- Behaviour: Given a seated (undealt) table, When `stepBot` or `applyUserAction` is called, Then each throws
  `RangeError`; Given a dealt table, When `dealHand` is called, Then it throws `RangeError('Not a deal step')`;
  Given the user's turn, When `applyUserAction` gets `{seat: 5, type: 'bet', amount: 99}`, Then it throws
  `RangeError` and `userDecisions` is unchanged; inputs are never mutated (deep-frozen inputs in the test).
- Verification: unit `tests/table/session.test.ts::wrong-step calls and illegal actions are rejected`

### SPEC-09: Next step follows the hand state
- Verifies: AC#5, AC#7
- Behaviour: Given seated, bot-to-act, user-to-act and complete states, When `nextStep` is called, Then it
  returns `'deal'`, `'bot'`, `'user'`, `'done'` respectively; `userActions` is `[]` in every state but `'user'`.
- Verification: unit `tests/table/session.test.ts::next step follows the hand state`

### SPEC-10: Session module stays headless
- Verifies: DoD#5
- Behaviour: Given `src/table/session.ts`, When its import specifiers are listed, Then none is `react`,
  `react-dom` or under `src/ui`, and it runs under the Vitest `node` environment (no `document`/`window`).
- Verification: unit `tests/table/session.test.ts::session module imports no UI code`

### SPEC-11: The seated table renders names, stacks and no buy-in control
- Verifies: AC#1, AC#2
- Behaviour: Given `renderToString(<Table />)` and `renderToString(<Table config={{ stake: { smallBet: 10, bigBet: 20 } }} />)`,
  When the markup is parsed, Then each shows six seats named Ava, Ben, Cal, Dee, Eli, You with stack "$160"
  (resp. "$400") each, the user's seat last, no `<input>`, `<select>`, `<textarea>`, `<a>` or `<button>`; and
  `renderToString(<App />)` contains `<h1>TLH Trainer</h1>` and the same six "$160" seats.
- Verification: acceptance `tests/ui/table.acceptance.test.tsx::seated table shows names and buy-in stacks and no buy-in control`

### SPEC-12: Browser — the default table seats six at $160
- Verifies: AC#1, DoD#7
- Behaviour: Given `page.clock.install()` and the crypto stub (A-11) before `goto('/')`, When the table is shown
  (before any timer runs), Then the Seats list has six items named Ava, Ben, Cal, Dee, Eli, You and each stack
  reads "$160"; after `clock.runFor(1000)` the small blind (Ava) reads "$158", the big blind (Ben) "$156" and
  "Your actions" is visible.
- Verification: acceptance `e2e/table.spec.ts::default table seats the user and five bots with $160 each`

### SPEC-13: Browser — $10/$20 session starts at $400 with no buy-in control
- Verifies: AC#2, DoD#7
- Behaviour: Given the Table harness with stake $10/$20 and the crypto stub, When it is seated and then at the
  user's first turn, Then every seat shows "$400" while seated, the blinds then show "$395" and "$390", and at
  every moment checked the page has no `input`, `select`, `textarea` or link, and every button's name is one of
  Fold, Check, Call, Bet, Raise.
- Verification: acceptance `e2e/table.spec.ts::stake $10/$20 starts every stack at $400 with no buy-in control`

### SPEC-14: Browser — checking or calling plays the hand to showdown with cards face up
- Verifies: AC#3, AC#6, DoD#7
- Behaviour: Given the crypto stub with a pinned code (builder records it in the test), When the user clicks
  Check if offered else Call at every turn (no other input), Then the board shows 0, 3, 4 and 5 cards at the
  user's preflop, flop, turn and river decisions, the user's seat shows exactly two face cards (`svg[data-card]`
  not `back`) equal to the same two cards at every decision and after the hand ends, the Table section's
  `svg[data-card]` count always equals 2 + board cards, and the hand ends with `data-street="showdown"` and no
  "Your actions" group; the status "Hand over" is shown and, after 3 s of further waiting, `data-action-count`
  is unchanged and no new hand is dealt (D-3).
- Verification: acceptance `e2e/table.spec.ts::check or call at every decision plays to showdown with my cards face up`

### SPEC-15: Browser — after a preflop fold the bots finish the hand
- Verifies: AC#4, DoD#7
- Behaviour: Given the crypto stub, When the user clicks Fold at the first turn and gives no further input, Then
  `data-action-count` keeps increasing until the hand ends (`data-to-act` empty), "Your actions" never appears
  again, the user's two face cards stay shown with the same cards, and the status "Hand over" appears (D-3).
- Verification: acceptance `e2e/table.spec.ts::after a preflop fold the bots finish the hand without me`

### SPEC-16: Browser — ten idle minutes change nothing on the user's turn
- Verifies: AC#5, DoD#7
- Behaviour: Given `page.clock.install()`, the crypto stub and the table at the user's first turn (after
  `clock.runFor(1000)`), When `clock.runFor(600_000)` passes with no input, Then "Your actions" is still
  visible with the same enabled buttons, `data-to-act` is "5" and `data-action-count` is unchanged.
- Verification: acceptance `e2e/table.spec.ts::ten idle minutes on my turn change nothing`

### SPEC-17: Browser — buttons enabled within 100 ms of the preceding bot action, axe clean, same-origin only
- Verifies: AC#7, DoD#7, DoD#8
- Behaviour: Given the crypto stub, real timers and an init-script `MutationObserver` recording
  `performance.now()` for each `data-action-count` change and for the first enabled button inside "Your
  actions", When the first user turn arrives, Then the preceding action-count change is a bot's action (Dee,
  seat 4) and the gap to the enabled buttons is ≤ 100 ms; at the user's turn and after the hand ends axe reports
  no serious or critical violations; and every request during the test is to `http://localhost:4173`.
- Verification: acceptance `e2e/table.spec.ts::my buttons are enabled within 100 ms of the bot action, axe clean, no outside requests`

### SPEC-18: Lint, typecheck, unit tests and coverage pass
- Verifies: DoD#1, DoD#2, DoD#4, DoD#5
- Behaviour: Given the change, When the checks run, Then all exit 0 with coverage ≥ 90% in
  engine/bots/advice/stats and ≥ 70% overall, and the existing locked tests (incl. `e2e/smoke.spec.ts`) pass.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run e2e`

### SPEC-19: Playtest stays clean
- Verifies: DoD#6
- Behaviour: Given no engine/bots/advice change, When the 10,000-hand playtest runs, Then it reports zero
  invariant violations.
- Verification: command `npm run playtest -- --hands 10000 --seed 42`

### SPEC-20: CI green and story documentation published
- Verifies: DoD#10, DoD#11
- Behaviour: Given the branch `doit/TASK-3.1`, When CI runs and the story doc is written, Then the workflow is
  green and `backlog doc list --plain` lists a TASK-3.1 doc.
- Verification: manual CI run on branch `doit/TASK-3.1` and `backlog doc list --plain`

### SPEC-21: Not-applicable DoD items
- Verifies: DoD#3, DoD#9, DoD#12
- Behaviour: Given the golden-spot suite (E07-S14) and the offline service worker (E13-S07) do not exist yet and
  this story adds no strategy content, When the Judge checks, Then no file under `src/advice/charts`, no golden
  spot and no strategy text is added or changed.
- Verification: manual Judge confirms the diff touches no strategy content and that E07-S14 and E13-S07 are not Done

## 7. Edge cases
- Stale or double click on an action button: `act` ignores it unless it is still the user's turn (§5); the
  button group unmounts in the same commit. Covered by SPEC-05/SPEC-08 at the session level.
- StrictMode double effects/updaters in development: timers cleared in cleanup; code drawn outside the updater;
  `onHandComplete` ref-guarded (§5). Production build used by e2e has no double invocation.
- Hand that folds out preflop with the user never acting: cannot occur — the user (cutoff) always acts preflop
  after Cal and Dee unless the hand already ended, which needs four folds before seat 5 (impossible: Cal and Dee
  are the only players before the user). N/A.
- User is the only one left after bots fold: cannot happen with check/call only (§5 rules); with Bet/Raise it can
  (fold-out to the user) — covered by SPEC-07's fold-out case at the record level.
- Stack below the engine minimum for a next hand: N/A in this slice (one hand, Q-1); a scope concern for TASK-3.4.
- Bot or engine throws: A-8, not reachable at 6 players.
- Bot decision on the main thread blocking input: A-6, ≤ ~13 ms per action.

## 8. Security considerations
- Trust boundaries: no user text input, no URL parameters, no storage, no network. Config arrives only as a
  prop from code.
- Hidden information: the DOM never contains bot hole cards, the deck or the replay code (SPEC-14 counts cards;
  TASK-3.3 AC#8 later checks the code). The full `HandState` lives in React state in memory; acceptable for a
  local single-user trainer (inspecting it with devtools is the user cheating themselves).
- Randomness: real play draws each hand's code from `crypto.getRandomValues` via `newReplayCode` (CSPRNG,
  REQ-013); the e2e stub (A-11) exists only inside the test's browser page.
- New dependencies: none. Secrets/logging: none.

## 9. Non-functional
- AC#7: buttons enabled ≤ 100 ms after the preceding bot action, measured in Chromium and WebKit (SPEC-17).
- No artificial bot delay (A-5): deal and bot steps use `setTimeout(…, 0)`.
- Accessibility: zero serious/critical axe violations on the table at the user's turn and after the hand ends
  (SPEC-17) and on `/` (locked smoke test); native buttons; cards keep their accessible names.
- Network: only same-origin requests (SPEC-17, locked smoke test).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev` then open the printed URL (or `npm run build && npm run preview`), play the hand with the buttons
- New tests (path → SPEC ids):
  - `tests/table/session.acceptance.test.ts` → SPEC-01..SPEC-07
  - `tests/table/session.test.ts` → SPEC-08..SPEC-10
  - `tests/ui/table.acceptance.test.tsx` → SPEC-11
  - `tests/unit/app.test.tsx` (updated) → SPEC-11 support
  - `e2e/table.spec.ts` → SPEC-12..SPEC-17 (Chromium and WebKit)
  - Commands → SPEC-18, SPEC-19
- End-to-end scenario for the Judge: `npm run build && npm run preview`, open `http://localhost:4173`; see six
  seats (Ava, Ben, Cal, Dee, Eli, You), your two cards face up and buttons on your turn; click Check/Call each
  time and watch the board reach five cards; reload, Fold at once and watch the hand finish without you; leave a
  turn idle and confirm nothing happens.

## 11. Open questions
None. Q-1 answered with the recommended option (`doit/TASK-3.1/qa.md`), recorded as D-3.

Follow-ups (become tasks):
- TASK-3.4: settle stack carry-over, the button moving each hand and the below-minimum-stack rule (or relax the minimum in `createHand`) before auto-dealing a second hand.
- Add `src/table` to `HEADLESS_DIRS` in `tools/lint/headless-boundary.js` (check the locked boundary tests first); replaces SPEC-10's import scan.
- TASK-3.3: replace the A-9 data-attribute test hooks with visible last-action and to-act text where they overlap.
- TASK-2.1: grow `SessionConfig { stake }` into the full session configuration (game type, players, line-up, speed, seat, button).

## 12. Clarifications log
See `doit/TASK-3.1/qa.md`.
