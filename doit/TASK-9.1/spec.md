# Spec: TASK-9.1 — Review each decision of the hand I just played

Status: READY (approved 2026-11-18 by user via Q-1)
Task: TASK-9.1 · Parent/epic: TASK-9 · Requirements: REQ-024.2, REQ-024.3, REQ-043.2, REQ-043.7, REQ-043.10, REQ-043.12, REQ-057.1, REQ-057.3 · Dream: limit-holdem-trainer

## 1. Summary
When a hand ends in which the user did anything other than a single preflop fold, a Hand Review panel opens
beside the table. It lists every user decision in order. Each entry shows the street, the board at that point,
the user's action, the advised action and a grade (Correct, Minor error or Major error) as text on a coloured
badge. The grade is computed with the TASK-7.4 grader on the PlayerView captured at that decision. While a
reviewed hand is on the table, the 1.5 s auto-deal is held. The next hand comes only from Deal next hand, which
sits on the table side under the result and stays there after the panel's Close. Hands with no user decision, or
with only a preflop fold, keep the TASK-3.4 auto-deal.

## 2. Scope
- In scope:
  - A headless review model (`src/table/review.ts`): `opensReview(hand)` (REQ-043.12) and
    `reviewEntries(hand)`, which grades every user decision of a `CompletedHand`.
  - `dealNext()` on `useTableSession` (AC#9, the TASK-3.4 follow-up in doc-25).
  - Wiring in `Table`: open the panel at hand end, hold the next hand while a reviewed hand is on the table,
    Close, and Deal next hand.
  - `ReviewPanel` component, the Deal next hand button, and their styles. The table makes room for the panel at
    1280 × 720 (A-4).
  - Scripted review hands in `tests/support/table-scenarios.ts`, Vitest and Playwright tests.
- Not doing:
  - Equity %, required equity %, explanation, chart basis and per-opponent basis (TASK-9.3, M2). No placeholder,
    label or empty slot for them is rendered.
  - Panel subtitle with hole cards, position, net result and replay code (TASK-9.4). The heading carries the
    hand number only because the storyboard's heading text is "Hand #133 review" (D-5).
  - Opponents' shown cards in the panel (TASK-9.5), the "hinted" tag (TASK-9.6), the grade summary badge and the
    auto-open setting (TASK-9.7, TASK-12.6), the 1 s p95 timing test (TASK-9.8), approximate/short-stack labels
    (TASK-9.9), Continue at $0 (TASK-9.2).
  - Moving grading off the main thread or reading stored decision entries (TASK-9.3 / E03-S12).
  - Storing graded entries in a hand record (TASK-3.9).
  - The final 1280 × 720 fit of the Table screen and the theme pass (TASK-3.16).
  - Any change to `src/engine`, `src/bots`, `src/advice` or `src/table/session.ts`.
  - Grading at tables other than 6-max (TASK-7.6). The app only seats the default 6-max table today (A-7).
- Scope budget: files=10, lines=1000

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Grades are computed once, eagerly, in the hand-complete callback: one `gradeView(view, action.type)` per user decision. The result is kept in `Table` state until the next hand. | yes | The panel shows every entry at once, so lazy grading gains nothing. Measured on the pinned e2e hand: 0.1 + 10.1 + 7.0 + 1.7 ms ≈ 19 ms for 4 decisions (Node, this machine). A 10-decision worst case stays near 100 ms, far below TASK-9.8's 1 s. TASK-9.3 moves this off the main thread. | Grade lazily on render; grade per decision while playing (adds work during the user's turn) |
| A-2 | The panel is a complementary landmark (`<aside aria-labelledby>`), as in the storyboard, not a dialog. Focus is not trapped. When it opens, focus moves to its heading (`useHeadingFocus`, `tabIndex=-1`). After Close, focus moves to Deal next hand. After Deal next hand, focus is not moved (same as the auto-deal today). | yes | The table stays usable (Leave table, reading the result) while the panel is open, so it is not modal. Moving focus to the heading tells keyboard and screen-reader users the panel appeared. The Close button unmounts, so focus needs a new home. | `role="dialog"` non-modal; no focus move |
| A-3 | Deal next hand is shown only while a reviewed hand is held: from the moment the panel opens until the next deal. Hands that auto-deal (no decision, or a single preflop fold) show no Deal next hand button. | yes | REQ-024.3 deals those hands by itself after 1.5 s. The storyboard shows the button only with the review. A button that lives for 1.5 s would invite misclicks. | Show it after every hand as a "deal now" shortcut |
| A-4 | Layout: header full width; below it a row with the table column (Table section, then Deal next hand) and the 400 px panel, gap 16 px. While the panel is open `.table-screen` widens from 1040 px to 1280 px max (`:has(.review-panel)`), so at a 1280 px window the table column is 832 px wide. When the panel closes, the table returns to 1040 px. | yes | The storyboard gives the panel `flex: 1 1 400px` and the table `flex: 999 1 560px`. 832 px keeps all six seats inside the ring without overlap (slot centres at 15.4 % and 84.6 % of 832 px ± 66 px). TASK-3.16 owns the final fit. | Shrink the table permanently; overlay the panel on the table |
| A-5 | `reviewEntries` lets grader errors propagate. No try/catch and no "could not grade" text. | yes | Every stored view was captured on the user's turn with the action legal, at 6-max (A-7), so `gradeView` cannot throw. A silent fallback would hide a bug. | Catch and show "Not graded" |
| A-6 | The board shown in an entry is the full board in that decision's view (`view.board`): none preflop, 3 cards on the flop, 4 on the turn, 5 on the river, drawn with `PlayingCard` at 30 × 42 px (the size the result block uses, `src/ui/styles.css:477-479`). The group is labelled "Community cards". | yes | AC#1 and REQ-043.1 say "board at that point". The name must not contain "Board": `e2e/table.spec.ts` resolves `getByRole('group', { name: 'Board' })` after the hand, and a second match would break strict mode. | Only the newly dealt card on turn/river (storyboard sample text); board as text |
| A-7 | No handling for non-6-max tables. `App` always starts `DEFAULT_SESSION_CONFIG` (`src/ui/App.tsx:26`) and the Config screen has no player-count control, so every hand has 6 seats and `positionOf` cannot throw (`src/advice/preflop.ts:49-53`). | yes | Out of scope until TASK-2.2 / TASK-7.6 (follow-up). | Skip grading at other sizes |
| A-8 | The e2e for AC#4 reaches a big-blind walk in the real app by pinning a different replay code for the 4th draw: hands 1–3 use `9e3779b9 00000001 00000002 00000003` and the user folds at the first turn; hand 4 (button seat 3, user is big blind) uses `9e3779b9 00000001 00000002 00000007`, where all five bots fold. Checked by running the session functions with TAG bots (§5). | yes | No test harness can mount the hook in Vitest (`vite.config.ts:8` environment `node`). Reaching the BB in the shipped app also exercises AC#3 three times. | A new harness page with a custom config |

## 3. Current system
- Stack and tests: TypeScript strict, React 19, Vite. Vitest in the `node` environment, so UI tests use
  `renderToString` (`vite.config.ts:4-17`; e.g. `tests/ui/hand-result.acceptance.test.tsx:15-17`). Coverage: 70 %
  overall, 90 % for `src/{engine,bots,advice,stats}`. Playwright runs Chromium and WebKit at 1280 × 720 against
  `vite preview` on port 4173 (`playwright.config.ts:3-25`). The headless-boundary lint covers engine, bots,
  advice and stats (`tools/lint/headless-boundary.js:6`); `src/table` may import `src/advice`.
- `src/table/session.ts`:
  - `applyUserAction` captures `playerView(hand, userSeat)` before applying the action and appends
    `{ view, action }` to `userDecisions` (`:196-208`). Bot actions never touch `userDecisions` (`stepBot`,
    `:189-194`).
  - `completedHand(table)` returns the plain record with `userDecisions` (`:215-256`).
  - `nextHand`, `nextHandDelay(table, hold)`, `NEXT_HAND_DELAY_MS = 1500` (`:157-186`).
- `src/ui/table/useTableSession.ts`:
  - `holdNextHand` option; while true no timer is pending; turning it off starts a fresh 1.5 s (`:22-23`,
    `:58-65`).
  - `onHandComplete` fires once per `handNumber`, inside the effect, before the delay is scheduled (`:53-57`). It
    is in the effect's dependency list (`:67`), so an unstable callback would restart the 1.5 s timer on every
    render.
  - The auto-deal runs `dealHand(nextHand(t), code)` with `code = newCode()` drawn in the timer callback
    (`:60-63`). `dealNext` must do the same (AC#9).
- `src/advice/grade.ts`: `gradeView(view, userAction, options?)` → `GradeResult` with `grade`
  (`'correct' | 'minor' | 'major'`), `ruleId`, `recommendation` (`:125-135`); `GRADE_LABELS` gives the approved
  labels Correct / Minor error / Major error (`:8-12`). `ActionType` equals the engine's `Action['type']`
  (`:4`, `src/engine/hand.ts:49-51`).
- `src/advice/recommend.ts:10-14`: preflop → chart, postflop → equity. Both recommendations carry `move`, the
  legal `Action` for the advised type with its exact amount (`src/advice/preflop.ts:33-34`,
  `src/advice/postflop.ts:19-20`).
- `src/table/action-bar.ts:23-36`: `actionLabel(action)` gives "Fold", "Check", "Call $4", "Bet $4",
  "Raise to $8" — the same text as the action buttons.
- `src/ui/table/Table.tsx`: `TableView` (presentational, `:103-144`) renders the header and the
  `section aria-label="Table"` with the felt, seats, action bar and the `role="status"` result. `Table`
  (`:148-151`) wires `useTableSession`.
- `src/ui/cards/PlayingCard.tsx:40-95`: card SVG with `role="img"`, an accessible name and `data-card`.
- `src/ui/useHeadingFocus.ts:7-16`: focuses a heading after mount with `tabIndex=-1`.
- `src/ui/styles.css`: `.table-screen` max 1040 px (`:202-207`); ring padding `68px 96px 72px` (`:245-249`);
  seats `min-width: 132px` (`:290-307`); small cards in the result `30 × 42` (`:477-479`); `.button-primary`
  red `#D7262E` (`:192-200`); `h1[tabindex='-1']:focus { outline: none }` (`:9-11`).
- Storyboard `dreams/limit-holdem-trainer/storyboards/Review.dc.html`:
  - Header full width; below it the table column (`<main>`, felt, then a red "Deal next hand", 52 px high,
    `padding 0 28px`, radius 10, 16 px/600) and `<aside aria-labelledby="rev">`, `flex: 1 1 400px`,
    `max-width: 480px`, `#1A1D22`, border `1px #343A43`, radius 10, padding 20, gap 14 (`:25-36`).
  - Panel heading `<h2>` "Hand #133 review" 18 px/700; a Close icon button `aria-label="Close review"`,
    44 × 44 (`:37-44`).
  - Entry: border `1px #343A43`, radius 8, padding 12, gap 6; street label 13 px/600 `#A7AEB8`; grade badge;
    "**You:** … · **Advice:** …" at 15 px (`:45-55`).
  - Badge: 12 px/700 `#FFFFFF`, padding `3px 10px`, radius 12; Correct `#2F6FE0`, Minor error `#9A5B00`, Major
    error `#A3151C` (`:61-67`). White-text contrast: 4.70:1, 5.43:1 and 7.83:1, all ≥ 4.5:1 (WCAG AA for
    12 px text). Every badge shows its text label (REQ-057.3).
- Requirements: REQ-024.2/.3 (`requirements.md:458-459`), REQ-043.2/.7/.10/.12 (REQ-043 block), REQ-057.1/.3.
  REQ-043.1's numbers and explanation are TASK-9.3.
- Earlier e2e specs that play past a user's non-fold decision to the end of a hand (all checked; none needs an
  edit, see D-6):
  - `e2e/next-hand.spec.ts:212-248` (check/call to showdown, then axe; then a fresh page that folds). Every
    `expectNextDeal` path uses `foldToResult` (single preflop fold, `:151-155`), so the auto-deal is unchanged.
  - `e2e/table.spec.ts:189-237` (check/call to showdown; then 28 × 50 ms with no deal — still true while held;
    `getByRole('group', { name: 'Board' })` after the hand — must stay unique, A-6; face-up cards in the Table
    section outside the status = 7 — the panel is outside the section) and `:278-303` (real timers; axe at the
    hand end — now with the panel open).
  - `e2e/action-bar.spec.ts:134-148` (real timers, stops at the hand end) and `:233-257` (axe at the hand end).
  - `e2e/table-display.spec.ts:217-236` (stops at the hand end) and `:284-310` (`expectSeatsFit` + axe at the hand
    end — now with the panel open, so A-4 must keep no horizontal scroll and no seat overlap).
  - `e2e/home.spec.ts` never reaches a hand end.
  - Locators these files use that the panel must not match: `[role="status"]`, `getByRole('status')`,
    `li[data-seat]`, `getByRole('group', { name: 'Board' })`, list "Seats", group "Your actions",
    `.table-header-line`, `section[aria-label="Table"]` contents.
- Existing code to reuse (path → what to reuse instead of writing new):
  - `src/advice/grade.ts` → `gradeView`, `GRADE_LABELS`, `Grade`, `GradeResult`.
  - `src/table/action-bar.ts` → `actionLabel` for both the user's and the advised action text.
  - `src/table/session.ts` → `CompletedHand`, `UserDecision`, `nextHand`, `dealHand`, `nextStep`.
  - `src/ui/cards/PlayingCard.tsx` → `PlayingCard` for board cards.
  - `src/ui/useHeadingFocus.ts` → focus the panel heading on open.
  - `tests/support/table-scenarios.ts` → `fixedDeck`, `SCENARIO_CODE`, `play` style.
  - E2E helpers to copy into the new spec (TASK-3.16 dedupes): `installPausedClock`, `useWorkerTimers` /
    `axeWithPausedClock`, `countReplayDraws`, `recordResults`, `slicesUntil`, `clickAction`, `checkOrCall`,
    `expectNextDeal` (`e2e/next-hand.spec.ts:24-210`), `expectSeatsFit` (`e2e/table-display.spec.ts:128-150`).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | A pure model `src/table/review.ts` (`opensReview`, `reviewEntries`) holds every rule; `ReviewPanel` only renders `ReviewEntry` data. | Grade inside the component | Testable in Vitest without a DOM; TASK-9.3/9.7 reuse it. | no | n/a |
| D-2 | The hold is `holdNextHand = review !== null` in `Table`. `review` is set in a referentially stable `onHandComplete` (`useCallback`) when `opensReview` is true, and cleared only by Deal next hand (or unmount). Close sets `open: false` and keeps `review`, so the hold remains (REQ-043.10). | Track hold inside the hook | Uses the TASK-3.4 seam unchanged; AC#9 names it. The one render between hand end and the state update schedules a 1.5 s timer that the next render's effect cleanup clears long before it fires. | no | n/a |
| D-3 | `dealNext()` returned by `useTableSession`: draws `newCode()` outside the updater, then `setTable(t => nextStep(t) === 'done' ? dealHand(nextHand(t), code) : t)`. Deal next hand calls `setReview(null)` and `dealNext()` in one click handler, so one render deals the hand and drops the hold. | Toggle the hold off and let the 1.5 s timer deal | AC#6/AC#9: the click deals now. Same code path as the auto-deal. | no | n/a |
| D-4 | Entry text and look (Q-1, qa.md): street label Preflop / Flop / Turn / River (uppercase by CSS); the full board at that decision drawn as small cards (30 × 42, none preflop, A-6); the grade badge (text plus colour) on the right; second line "You: Call $4 · Advice: Fold" using the action-bar labels with exact amounts. | Storyboard text without amounts; "Recommended:" wording; board as text; only the new card on turn/river | User-visible text | yes | user (Q-1, qa.md) |
| D-5 | Panel heading "Hand #<n> review" (`table.handNumber`), Close icon button named "Close review", red "Deal next hand" button on the table side, badge colours and sizes — all exactly as the storyboard (§3). | Plain "Hand review" heading until TASK-9.4 | Settled by `Review.dc.html:25-67`; avoids changing text twice. TASK-9.4 adds the subtitle and replay code. | no | n/a (storyboard) |
| D-6 | No earlier-story test is edited. Every e2e that ends a hand after a non-fold user decision was checked (§3); none expects the auto-deal after such a hand, and the panel is built not to match their locators (outside the Table section; no `role="status"`; no `data-seat`; group name without "Board"; entries in a list named "Decisions"). | Edit tests to fold | Nothing conflicts; locked Vitest files keep passing because the new `TableView` props are optional and the server render of `<Table />` has no hand. | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/review.ts` — create: `ReviewEntry`, `STREET_LABELS`, `opensReview`, `reviewEntries`.
- `src/ui/table/ReviewPanel.tsx` — create: the panel component.
- `src/ui/table/Table.tsx` — modify: optional review props on `TableView`, layout wrapper, Deal next hand button;
  `Table` holds review state and wires the hold.
- `src/ui/table/useTableSession.ts` — modify: return `dealNext`.
- `src/ui/styles.css` — modify: layout row, panel, entry, badge, Deal next hand styles.
- `tests/support/table-scenarios.ts` — modify: `userTableAfter` helper and the scripted review states.
- `tests/table/review.acceptance.test.ts` — create: model acceptance (SPEC-01, SPEC-02, SPEC-04, SPEC-08).
- `tests/table/review.test.ts` — create: model unit edges (SPEC-09).
- `tests/ui/review-panel.acceptance.test.tsx` — create: rendered panel and table side (SPEC-03, SPEC-07 markup).
- `e2e/review.spec.ts` — create: browser flows (SPEC-05, SPEC-06, SPEC-07, SPEC-10, SPEC-11).

### Components, interfaces and data
`src/table/review.ts` (headless: imports `src/advice/grade`, `src/table/action-bar`, `src/table/session` types,
`src/engine` types only):
```ts
export type ReviewStreet = 'preflop' | 'flop' | 'turn' | 'river';
export const STREET_LABELS: Readonly<Record<ReviewStreet, string>>; // Preflop, Flop, Turn, River
export interface ReviewEntry {
  readonly street: ReviewStreet;            // decision.view.street
  readonly streetLabel: string;             // STREET_LABELS[street]
  readonly board: readonly Card[];          // decision.view.board (copy)
  readonly userAction: Action;              // decision.action
  readonly userActionText: string;          // actionLabel(decision.action)      e.g. "Call $4"
  readonly adviceText: string;              // actionLabel(result.recommendation.move) e.g. "Fold"
  readonly grade: Grade;                    // result.grade
  readonly gradeLabel: string;              // GRADE_LABELS[result.grade]
  readonly result: GradeResult;             // gradeView(decision.view, decision.action.type, options)
}
/** False iff the user made no decision, or exactly one decision that was a preflop fold (REQ-043.12). */
export function opensReview(hand: CompletedHand): boolean;
/** One entry per hand.userDecisions element, same order. Errors from gradeView propagate (A-5). */
export function reviewEntries(hand: CompletedHand, options?: RecommendOptions): readonly ReviewEntry[];
```
`src/ui/table/useTableSession.ts`: return type becomes
`{ table: TableState; act: (action: Action) => void; dealNext: () => void }` (D-3). `dealNext` is a stable
`useCallback` over `newCode`.

`src/ui/table/Table.tsx`:
```ts
export interface ReviewState { readonly entries: readonly ReviewEntry[]; readonly open: boolean }
export interface TableViewProps {
  readonly table: TableState; readonly onAct: (a: Action) => void; readonly onLeave: () => void;
  /** Non-null while a reviewed hand is held (A-3). Optional: earlier callers render as before. */
  readonly review?: ReviewState | null;
  readonly onDealNext?: () => void;
  readonly onCloseReview?: () => void;
}
```
`TableView` markup (outer fragment keeps the header first; everything inside the section is unchanged):
```html
<header class="table-header">…</header>
<div class="table-layout">
  <div class="table-main">
    <section aria-label="Table" class="table" …>…unchanged…</section>
    <!-- only when review != null and the hand has a result -->
    <button type="button" class="deal-next">Deal next hand</button>
  </div>
  <!-- only when review?.open -->
  <ReviewPanel handNumber={table.handNumber} entries={review.entries} onClose={onCloseReview} />
</div>
```
`ReviewPanel` (wording per Q-1, approved in qa.md):
```html
<aside class="review-panel" aria-labelledby="review-heading">
  <div class="review-head">
    <h2 id="review-heading" tabindex="-1">Hand #1 review</h2>
    <button type="button" class="review-close" aria-label="Close review"><svg aria-hidden="true">×</svg></button>
  </div>
  <ol aria-label="Decisions" class="review-entries">
    <li data-entry="1" data-street="flop">
      <div class="review-entry-top">
        <span data-part="street">Flop</span>
        <div role="group" aria-label="Community cards" class="table-cards"><PlayingCard/>×3</div> <!-- absent preflop -->
        <span data-part="grade" data-grade="correct" class="grade-badge">Correct</span>
      </div>
      <p data-part="moves"><strong>You:</strong> <span data-part="you">Check</span> · <strong>Advice:</strong> <span data-part="advice">Check</span></p>
    </li>
  </ol>
</aside>
```
- The heading is focused on mount with `useHeadingFocus(true)` (A-2).
- `Table`:
  - `const [review, setReview] = useState<ReviewState | null>(null)`.
  - `onHandComplete = useCallback((hand) => { external?.(hand); if (opensReview(hand)) setReview({ entries: reviewEntries(hand), open: true }); }, [])`,
    where `external` is the caller's `onHandComplete` read through a ref so the callback stays stable.
  - `useTableSession({ ...options, onHandComplete, holdNextHand: options.holdNextHand === true || review !== null })`.
  - Close: `setReview(r => r && { ...r, open: false })`, then focus Deal next hand (A-2).
  - Deal next hand: `setReview(null); dealNext();` (D-3).

### Rules and algorithms
1. **Opens (REQ-043.12).** `d = hand.userDecisions`. `opensReview = d.length > 1 || (d.length === 1 &&
   !(d[0].action.type === 'fold' && d[0].view.street === 'preflop'))`. Examples: `[]` → false; `[fold@preflop]`
   → false; `[raise@preflop]` → true; `[call@preflop, fold@preflop]` → true.
2. **Entries.** Map `d` in order; bot actions are never read (they are not in `userDecisions`). Grade =
   `gradeView(view, action.type)` with default options (6-max chart, `computeEquity`).
3. **Hold.** Held from the hand-complete callback of a reviewed hand until Deal next hand. Close does not
   release it. Hands that do not open the review leave `holdNextHand` false → TASK-3.4 auto-deal 1500 ms after
   the result.
4. **Layout (A-4).** `.table-layout { display: flex; gap: 16px; align-items: flex-start }`,
   `.table-main { flex: 1 1 0; min-width: 0 }`, `.review-panel { flex: 0 0 400px; box-sizing: border-box }`,
   `.table-screen:has(.review-panel) { max-width: 1280px }`. `.deal-next`: as the storyboard (min-height 52 px,
   red `#D7262E`, white 16 px/600, radius 10, centred under the section, margin-top 12 px).
5. **Badge.** `.grade-badge[data-grade='correct'] { background: #2F6FE0 }`, `minor` `#9A5B00`, `major`
   `#A3151C`; all `color: #FFFFFF; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 12px`.
   Street label `text-transform: uppercase` (Q-1). Entry board cards 30 × 42 px.

Scripted Vitest states (`tests/support/table-scenarios.ts`). New helper `userTableAfter(fixed, moves, button = 6)`:
`seatSession({ button })` with `hand = createHand({ …, button, deck: fixedDeck(fixed) })` and
`replayCode: SCENARIO_CODE`; each `seat:type` move for seat 5 goes through `applyUserAction` (so the view is
captured), every other move through `applyAction`. Deck `D = { 1:'Kd', 7:'7c', 4:'Ah', 10:'9s', 13:'Ks',
14:'9d', 15:'4c', 17:'2h', 19:'6s' }` (user `Ah 9s`, Ben `Kd 7c`). Values below were produced by running the
engine, `gradeView` and `actionLabel`:

| State | Moves | User / bot decisions | Entries (street · board · You · Advice · grade) |
|---|---|---|---|
| `REVIEW_FOUR` | `3:fold 4:fold 5:raise 6:fold 1:fold 2:call 2:check 5:bet 2:call 2:check 5:check 2:bet 5:call` | 4 / 9; showdown, Ben wins $42 | Preflop · – · Raise to $8 · Raise to $8 · Correct; Flop · Ks 9d 4c · Bet $4 · Check · Minor error; Turn · Ks 9d 4c 2h · Check · Check · Correct; River · Ks 9d 4c 2h 6s · Call $8 · Call $8 · Correct |
| `CALL_THEN_FOLD` | `3:raise 4:fold 5:call 6:fold 1:fold 2:raise 3:call 5:fold 2:check 3:bet 2:fold` | 2 / 9; Cal wins $38 | Preflop · – · Call $8 · Fold · Major error; Preflop · – · Fold · Fold · Correct |
| `PREFLOP_FOLD_ONLY` | `3:fold 4:fold 5:fold 6:fold 1:fold` | 1 / 4; Ben wins $6 | none (no review) |
| `BB_WALK` (button 3) | `6:fold 1:fold 2:fold 3:fold 4:fold` | 0 / 5; You win $6 | none (no review) |
| `RAISE_TAKES_BLINDS` | `3:fold 4:fold 5:raise 6:fold 1:fold 2:fold` | 1 / 5; You win $14 | Preflop · – · Raise to $8 · Raise to $8 · Correct |

Pinned e2e hand (words `9e3779b9 00000001 00000002 00000003`, user checks or calls every turn; engine run):
4 user decisions, 8 bot decisions, showdown "Ben wins $10", stacks after `[158,166,160,160,156,160]`.
Entries: Preflop · – · Call $4 · Fold · Major error; Flop · Jd 6h 9h · Check · Check · Correct; Turn ·
Jd 6h 9h 3c · Check · Check · Correct; River · Jd 6h 9h 3c 8s · Check · Check · Correct. After Deal next hand:
Hand #2, dealer seat 1, stacks `[158,164,156,160,156,160]`, one more replay-code draw.

Big-blind walk path (A-8): hands 1–3 with the pinned words, user folds at the first turn (one decision each, no
review). Hand 4: button 3, user (seat 5) is the big blind, words `9e3779b9 00000001 00000002 00000007`: actions
`4:small-blind 5:big-blind 6:fold 1:fold 2:fold 3:fold 4:fold`, "You win $6", no user decision.

### Error handling and configuration
- `reviewEntries` propagates `gradeView`'s `RangeError` (A-5); it cannot occur from the app (§3, A-7).
- `dealNext` when the hand is not done leaves the table unchanged (the updater guard); the button is only
  rendered at hand end.
- No new configuration. The auto-open setting (REQ-050.2) is TASK-9.7/TASK-12.6; until then the panel always
  opens.

## 6. Behaviour specification

### SPEC-01: Four user decisions give four entries in order, none for bots
- Verifies: AC#1, DoD#1
- Behaviour: Given `REVIEW_FOUR` (4 user decisions, 9 bot decisions) and `completedHand` of it, When
  `opensReview` and `reviewEntries` run, Then `opensReview` is true and there are exactly 4 entries whose
  `(streetLabel, board as formatCard, userActionText, adviceText)` are, in order: (Preflop, [], Raise to $8,
  Raise to $8), (Flop, [Ks 9d 4c], Bet $4, Check), (Turn, [Ks 9d 4c 2h], Check, Check), (River,
  [Ks 9d 4c 2h 6s], Call $8, Call $8); every entry's `userAction.seat` is 5.
- Verification: acceptance `tests/table/review.acceptance.test.ts::a hand with 4 user and 9 bot decisions gives 4 entries in order and none for bots`

### SPEC-02: Each grade equals the grader's output on that decision's view
- Verifies: AC#2, DoD#1
- Behaviour: Given `REVIEW_FOUR`, When `reviewEntries` runs, Then for each i, `entries[i].result` deep-equals
  `gradeView(userDecisions[i].view, userDecisions[i].action.type)` and `gradeLabel` is
  `GRADE_LABELS[result.grade]`: Correct, Minor error, Correct, Correct.
- Verification: acceptance `tests/table/review.acceptance.test.ts::each entry's grade is the grader output for that decision's view`

### SPEC-03: The panel renders beside the table with text grades and no M2 placeholders
- Verifies: AC#1, AC#2, AC#6, AC#7, DoD#1
- Behaviour: Given `TableView` rendered (`renderToString`) with `table = REVIEW_FOUR` and
  `review = { entries: reviewEntries(REVIEW_FOUR), open: true }`, Then:
  - after `</section>` and outside it there is one `<aside class="review-panel" aria-labelledby="review-heading">`
    with `<h2 id="review-heading">` text "Hand #1 review" and one button with `aria-label="Close review"`
  - its `ol[aria-label="Decisions"]` has 4 `li[data-entry]`; their `data-part="street"` texts are Preflop, Flop,
    Turn, River; their `svg[data-card]` codes are [], [Ks 9d 4c], [Ks 9d 4c 2h], [Ks 9d 4c 2h 6s]; their
    `data-part="you"` / `data-part="advice"` texts are as SPEC-01, with "You:" and "Advice:" labels (Q-1)
  - each entry has one `data-part="grade"` whose text is its label (Correct, Minor error, Correct, Correct) and
    whose `data-grade` is correct / minor / correct / correct
  - the panel text contains none of "%", "equity", "Equity", "Why", "explanation", "basis", "…", "TBD"
  - the Table section still contains the `role="status"` result, and a `<button … class="deal-next">Deal next
    hand</button>` follows the section inside `.table-main`
  - with `review.open = false`: no `aside`, the result and Deal next hand are still rendered
  - with `review = null` (or omitted): no `aside`, no Deal next hand
- Verification: acceptance `tests/ui/review-panel.acceptance.test.tsx::the review panel lists 4 graded entries beside the table with Close and Deal next hand`

### SPEC-04: A single preflop fold, or no decision, opens no review
- Verifies: AC#3, AC#4, DoD#1
- Behaviour: Given `PREFLOP_FOLD_ONLY` (one decision, fold, preflop) and `BB_WALK` (user is the big blind,
  every bot folds, `userDecisions` empty), When `opensReview(completedHand(state))` runs, Then it is false for
  both, and `nextHandDelay(state, false)` is 1500.
- Verification: acceptance `tests/table/review.acceptance.test.ts::a lone preflop fold or a big-blind walk opens no review`

### SPEC-05: No review hands still auto-deal after 1.5 s in the app
- Verifies: AC#3, AC#4, DoD#7
- Behaviour: Given the app on Playwright's paused clock with the replay-code draws pinned to the A-8 sequence,
  When the user folds at the first turn of hands 1, 2 and 3, and hand 4 is a big-blind walk, Then after each
  result no `complementary` region and no "Deal next hand" button exist, and the next hand is dealt 1400–1600 ms
  after the result appears (header "Hand #2", "#3", "#4", "#5"; one replay-code draw per deal). Hand 4's result
  reads "You win $6" and the user had no enabled action during hand 4.
- Verification: acceptance `e2e/review.spec.ts::a preflop fold or a big-blind walk opens no review and the next hand deals after 1.5 s`

### SPEC-06: The panel opens in the app, holds the next hand and Deal next hand deals it
- Verifies: AC#1, AC#2, AC#5, AC#6, AC#9, DoD#7, DoD#8
- Behaviour: Given the app on the paused clock with the pinned words, in Chromium and WebKit, When the user
  checks or calls every turn to the showdown, Then:
  - the complementary region "Hand #1 review" is visible, its heading is focused, and it holds 4 entries matching
    the pinned e2e hand in §5 (street text, card codes, You, Advice, grade text)
  - the Major error badge's computed background is `rgb(163, 21, 28)` and the Correct badges'
    `rgb(47, 111, 224)`, each with text visible
  - the panel's left edge is ≥ the Table section's right edge, their vertical ranges overlap, the page has no
    horizontal scroll and the six seats fit without overlap (`expectSeatsFit`)
  - axe reports no serious or critical violation (worker-timer scan)
  - after 200 × 50 ms (10 s) the header still ends "Hand #1", the result is visible and the replay-code draw
    count is unchanged (1)
  - clicking "Deal next hand" removes the panel and the button, the header reads "Hand #2", draws are 2, the
    dealer is seat 1, the stacks are `[158,164,156,160,156,160]` and no `role="status"` remains
  - every request URL has origin `http://localhost:4173`
- Verification: acceptance `e2e/review.spec.ts::after a played hand the review opens beside the table, holds the next hand and Deal next hand deals hand 2`

### SPEC-07: Close keeps the result and the hold until Deal next hand
- Verifies: AC#7, AC#9, DoD#7
- Behaviour: Given the panel open after the pinned check/call hand, When the user clicks "Close review", Then the
  complementary region is gone, the "Hand over" result and the "Deal next hand" button stay visible and Deal
  next hand is focused; after 200 × 50 ms the header still ends "Hand #1" and draws are 1; then clicking Deal
  next hand shows "Hand #2" with draws 2. The Deal next hand button is at least 44 × 44 px.
- Verification: acceptance `e2e/review.spec.ts::Close keeps the result and Deal next hand and nothing is dealt until it is clicked`

### SPEC-08: Calling then folding preflop opens the review with two entries
- Verifies: AC#8, DoD#1
- Behaviour: Given `CALL_THEN_FOLD` (user calls $8 preflop, then folds to the re-raise), When the model runs,
  Then `opensReview` is true, so the table holds the hand (rule 3), and `reviewEntries` gives exactly 2 entries:
  (Preflop, [], Call $8, Fold, Major error) and (Preflop, [], Fold, Fold, Correct). `RAISE_TAKES_BLINDS` (a lone
  preflop raise) also opens a review with 1 entry.
- Verification: acceptance `tests/table/review.acceptance.test.ts::calling then folding preflop opens a review with the call and the fold`

### SPEC-09: Model edges
- Verifies: AC#1, AC#3
- Behaviour: Given `CompletedHand` values derived from the scripted states by replacing `userDecisions`, When
  the model runs, Then: `[CALL_THEN_FOLD's fold]` alone does not open a review; `[CALL_THEN_FOLD's call]` alone,
  `[REVIEW_FOUR's flop bet]` alone and `[REVIEW_FOUR's flop view with action fold]` alone (a fold that is not
  preflop) each open one; `STREET_LABELS` maps the four streets to Preflop/Flop/Turn/River; each entry's `board`
  is a copy (mutating it does not change the stored view); `reviewEntries` of `[]` is `[]`; the flop view
  (check is free) paired with a fold makes `reviewEntries` throw `RangeError` (A-5).
- Verification: unit `tests/table/review.test.ts::review model edges`

### SPEC-10: Earlier stories' flows pass unchanged with the panel present
- Verifies: AC#3, DoD#7
- Behaviour: Given no edits to earlier tests (D-6), When `e2e/next-hand.spec.ts`, `e2e/table.spec.ts`,
  `e2e/action-bar.spec.ts`, `e2e/table-display.spec.ts`, `e2e/home.spec.ts` and `e2e/cards.spec.ts` run in Chromium
  and WebKit, Then every test passes; every locked Vitest acceptance file passes unchanged.
- Verification: integration `npx playwright test e2e/next-hand.spec.ts e2e/table.spec.ts e2e/action-bar.spec.ts e2e/table-display.spec.ts e2e/home.spec.ts e2e/cards.spec.ts`

### SPEC-11: dealNext is the auto-deal's code path
- Verifies: AC#9
- Behaviour: Given the diff, When reviewed, Then `useTableSession` returns `dealNext`, which draws `newCode()`
  once outside the state updater and applies `dealHand(nextHand(t), code)` only when `nextStep(t) === 'done'`;
  `Table` passes `holdNextHand` true from the reviewed hand's completion until Deal next hand, Close does not
  clear it, and the `onHandComplete` passed to the hook is stable across renders. SPEC-06/07 observe the effect
  (exactly one draw per Deal next hand; no draw while held).
- Verification: manual Reviewer reads `src/ui/table/useTableSession.ts` and `src/ui/table/Table.tsx` against this item

### SPEC-12: Lint, typecheck, unit tests, coverage and the headless boundary pass
- Verifies: DoD#2, DoD#4, DoD#5
- Behaviour: Given the change, When the checks run, Then each exits 0; coverage ≥ 90 % for
  engine/bots/advice/stats and ≥ 70 % overall; no file under `src/engine`, `src/bots`, `src/advice` changes and
  `src/table/review.ts` imports no React or DOM code.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-13: CI green and story documentation published
- Verifies: DoD#10, DoD#11
- Behaviour: Given branch `doit/TASK-9.1`, When CI runs and the story doc is written, Then the workflow is green
  and `backlog doc list --plain` lists a TASK-9.1 doc recording D-1..D-6, the Q-1 answer, A-1..A-8 and §13.
- Verification: manual CI run on branch `doit/TASK-9.1` and `backlog doc list --plain`

### SPEC-14: Not-applicable DoD items
- Verifies: DoD#3, DoD#6, DoD#9, DoD#12
- Behaviour: Given the golden-spot suite (TASK-7.11) and the offline service worker (TASK-13.4) are not done,
  this story changes no engine, bot or advice file (so no playtest is required) and adds no strategy content,
  When the Judge checks, Then the diff touches nothing under `src/engine`, `src/bots`, `src/advice`, no golden
  spot and no strategy text.
- Verification: manual Judge confirms the diff scope and that TASK-7.11 and TASK-13.4 are not Done

## 7. Edge cases
- **No user decision (big-blind walk).** No review; auto-deal (SPEC-04, SPEC-05).
- **Single preflop fold.** No review (SPEC-04, SPEC-05). A single fold is always preflop: every dealt-in seat
  acts preflop unless the hand ends before its turn; the rule still checks the street.
- **Single non-fold decision (a raise that takes the blinds).** Review opens with one entry (SPEC-08,
  SPEC-09). A lone check cannot end a hand: the checker always faces another turn unless everyone else folds,
  and nobody can fold when checking is free.
- **Several preflop decisions ending in a fold.** Review opens (SPEC-08).
- **Leave table while the panel is open.** `Table` unmounts; the hook's cleanup leaves no timer; nothing is
  dealt (existing TASK-3.4 behaviour; the panel adds no timer).
- **Clicks on the disabled action bar while held.** Ignored as before (`act` guards on `'user'`).
- **Repeated Deal next hand clicks.** The button unmounts in the same render that deals; a second click cannot
  reach it. `dealNext` also guards on `'done'`.
- **StrictMode double effects.** `onHandComplete` is keyed on `handNumber` (`useTableSession.ts:53-54`), so the
  review is computed once.
- **Same replay code every hand (e2e stub).** Review state is cleared by Deal next hand, not keyed on the code.
- **Many decisions.** The panel grows vertically; the page may scroll vertically, never horizontally (A-4).
- **Non-6-max tables.** Cannot occur in the app today (A-7); follow-up for TASK-2.2/TASK-7.6.
- **User at $0 with the panel open.** Cannot occur yet: the interim top-up keeps every stack ≥ $96
  (`session.ts:168-174`). TASK-9.2 owns Continue.

## 8. Security considerations
- **Hidden information.** Entries read only the user's own captured `PlayerView`s and the user's actions; no bot
  hole cards, deck or other seat's view is read. Board cards shown are the ones that view already held.
- **Replay code.** Not shown (TASK-9.4). Deal next hand draws exactly one code, like the auto-deal.
- **Trust boundaries, storage, network, authn/authz, secrets, injection.** None; all data is in-memory and
  rendered through React text. No new dependencies; no new requests (SPEC-06).
- **Randomness.** None added; the replay code still comes from `newReplayCode` (CSPRNG).

## 9. Non-functional
- **Grading cost.** ≈ 19 ms for the pinned 4-decision hand (A-1); one synchronous batch at hand end. TASK-9.8
  owns the 1 s p95 test; TASK-9.3 moves grading off the main thread.
- **Accessibility.** Complementary landmark named by its heading; Close and Deal next hand are native buttons
  ≥ 44 × 44 px with accessible names; badges show text, contrast ≥ 4.7:1; cards keep `PlayingCard` names;
  axe zero serious/critical in both browsers with the panel open (SPEC-06) and at the existing hand-end scans
  (SPEC-10).
- **Layout.** No horizontal scroll at 1280 × 720 with the panel open; seats inside 0–1280 px without overlap
  (SPEC-06).
- **Between hands.** No-review hands: 1400–1600 ms (SPEC-05). Reviewed hands: no deal for ≥ 10 s (SPEC-06/07).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview` then open `http://localhost:4173`, choose New game, then Start game (or `npm run dev`)
- New tests (path → SPEC ids):
  - `tests/table/review.acceptance.test.ts` → SPEC-01, 02, 04, 08
  - `tests/table/review.test.ts` → SPEC-09
  - `tests/ui/review-panel.acceptance.test.tsx` → SPEC-03
  - `e2e/review.spec.ts` (Chromium and WebKit, `npm run e2e`) → SPEC-05, 06, 07
  - Earlier e2e files unchanged → SPEC-10
  - Commands / review → SPEC-11, 12, 13, 14
- End-to-end scenario for the Judge:
  1. `npm run build && npm run preview`, open `http://localhost:4173`, New game → Start game.
  2. Fold at your first turn. "Hand over" shows; no panel; about 1.5 s later "Hand #2" is dealt.
  3. Check or call every turn to the end. A "Hand #2 review" panel opens to the right of the table with one entry
     per decision: street, board cards at that point, "You: …", "Advice: …" and a coloured badge with the text
     Correct / Minor error / Major error. No equity numbers or explanation text appear. Focus is on the heading.
  4. Wait 10 s: nothing is dealt. Click the × (Close review): the panel goes, the result and the red "Deal next
     hand" stay. Wait 10 s: still nothing. Click Deal next hand: the next hand is dealt and the header counts up.
  5. Play another hand to the end and click Deal next hand straight from the open panel: the panel closes and the
     next hand is dealt.

## 11. Open questions
- None. The user chose the recommended answer to Q-1 on 2026-11-18 (`doit/TASK-9.1/qa.md`); it is folded into D-4,
  §5 Rules 5 and SPEC-03.

## 12. Clarifications log
See `doit/TASK-9.1/qa.md`.

## 13. Follow-ups (become tasks)
- TASK-3.16: fit the Table screen with the open review panel and Deal next hand inside 1280 × 720 without vertical scrolling, keep the table width stable when the panel opens and closes, and move the helpers copied into `e2e/review.spec.ts` into `e2e/support/`.
- TASK-9.3: replace `reviewEntries`' recomputation with the decision entries stored at decision time, off the main thread, and add equity/explanation/basis to `ReviewPanel` entries.
- TASK-9.4: add the subtitle (hole cards, position, net result) and the replay code under the existing "Hand #<n> review" heading.
- TASK-9.7: gate the panel's initial `open` on the auto-open setting and build the summary badge from `reviewEntries` grades, reusing `opensReview` for REQ-043.11/.13.
- TASK-9.2: show Continue instead of Deal next hand when the user's stack is $0, using the same held-review state.
- TASK-2.2 / TASK-7.6: before player counts other than 6 can be chosen, make `gradeView` work at that table size (today `positionOf` throws) and add a review test at 2 and 10 players.
- TASK-13.11: include the Table screen with the review panel open in the all-screens axe run.
