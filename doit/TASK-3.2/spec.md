# Spec: TASK-3.2 — Choose only legal actions with their exact amounts

Status: READY (approved 2026-11-18 by user via Q-1)
Task: TASK-3.2 · Parent/epic: TASK-3 (Play hands at the table) · Requirements: REQ-017.1, REQ-017.2, REQ-017.5, REQ-017.6, REQ-022.1, REQ-022.3, REQ-022.4 (REQ-017.3/.7 all-in and capped labels are TASK-3.7; REQ-022.2 Hint button is TASK-8.1) · Dream: limit-holdem-trainer

## 1. Summary
The plain verb buttons of TASK-3.1 become the action bar: on the user's turn it offers exactly the engine's
legal actions, each labelled with its exact amount ("Check", "Bet $4", "Fold", "Call $4", "Raise to $8"), as
native buttons at least 44 × 44 CSS px in the storyboard's dark style. While it is not the user's turn, or once
the hand has ended, the bar stays on screen but disabled, so no action can be submitted. The labels come from a
pure, headless function of the user's `PlayerView`, which a 10,000-state test compares with `legalActions`.
There are no keyboard shortcuts.

## 2. Scope
- In scope:
  - `src/table/action-bar.ts` (headless, no React/DOM): `actionLabel`, `actionBar(view)`, `userActionBar(table)`
    and the idle (disabled) button set.
  - `src/ui/table/ActionBar.tsx`: renders the model as a `role="group"` "Your actions" of native `<button>`s.
  - `src/ui/table/Table.tsx`: replace the inline verb buttons and `ACTION_LABELS` with `<ActionBar>`; render it
    whenever a hand has been dealt (enabled or disabled), not only on the user's turn.
  - `src/ui/styles.css`: action bar styles from the Table storyboard (≥ 44 px targets, disabled look).
  - Tests: Vitest acceptance for AC#1–#4 and #6 (rendered bar from crafted engine states) and AC#5 (10,000
    seeded states); Vitest unit for labels, wiring and headless imports; a new Playwright spec for AC#1, #2,
    #6, #7, #8 with axe in Chromium and WebKit; the limited edits to TASK-3.1's `e2e/table.spec.ts` in D-4.
- Not doing:
  - The Hint button and hint card (TASK-8.1 owns REQ-022.2; its AC#1 checks the Hint button on every enabled
    bar). No placeholder Hint button here (D-2).
  - Capped-street behaviour, "Call all-in $X", "Bet all-in $X", "Raise all-in to $X" (TASK-3.7, engine
    TASK-1.12/E01-S12) and chip numbers without $ in a sit-and-go (TASK-3.7/TASK-5.3).
  - Tab/Enter/Space activation tests of focused buttons and 44 px checks of non-action controls (TASK-3.17).
  - Table layout (bar below the oval felt), the red primary accent and theme checks (TASK-3.16, A-3).
  - Pre-action ("Check/Fold", "Call any") controls, confirmation dialogs, money formatting (E03-S19).
  - Any change to `src/engine`, `src/bots`, `src/advice`, `src/playtest`, `src/table/session.ts`, the lint or
    test config, or TASK-3.1's other tests (`tests/table/session*.test.ts`, `tests/ui/table.acceptance.test.tsx`,
    `tests/unit/app.test.tsx`).
- Scope budget: files=9, lines=700   (action-bar.ts ~70, ActionBar.tsx ~40, Table.tsx ~20, styles.css ~35, tests/table/action-bar.test.ts ~70, tests/table/action-bar.acceptance.test.ts ~110, tests/ui/action-bar.acceptance.test.tsx ~130, e2e/action-bar.spec.ts ~200, e2e/table.spec.ts ~25)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The bar is not rendered before the first hand is dealt (the one-macrotask "seated" table of TASK-3.1 A-2); from the deal on it is always rendered, enabled or disabled. | yes | Nobody can act before a deal; keeps TASK-3.1's locked seated-table checks (no `<button>` in `tests/ui/table.acceptance.test.tsx:31`, `tests/unit/app.test.tsx`) valid without unlocking them. | Disabled bar on the seated table too (needs those two tests unlocked) |
| A-2 | Buttons follow the storyboard's neutral style: `min-height: 52px`, `min-width: 120px`, `padding: 0 16px`, 16 px / 600 text `#F2F3F5` on `#1A1D22`, `1px solid #4A515C` border, radius 10 px, centred row, gap 12 px, wrapping (`storyboards/Table.dc.html:67-69`). Disabled buttons: `opacity: 0.45; cursor: not-allowed`. | yes | The storyboard is the approved look; 52 × 120 px exceeds 44 × 44 at any label. | Keep TASK-3.1's white buttons; other disabled treatment |
| A-3 | No button carries the red accent in this story; the storyboard's red "Raise to $8" (`Table.dc.html:70`, an `<a>` linking to the Review storyboard) is not copied. | yes | TASK-3.16 AC#2 owns "the primary action accent is red #D7262E"; colouring one poker action as primary could nudge a learner toward it — a TASK-3.16 decision. | Red Raise now, as drawn |
| A-4 | The bar stays inside the felt section, after the board and before the "Hand over" status, where TASK-3.1 put the buttons. | yes | Moving it below the oval felt is TASK-3.16's layout; TASK-3.1's e2e hooks read `section[aria-label="Table"]`. | Move it below the felt now |
| A-5 | The group keeps TASK-3.1's accessible name "Your actions" (storyboard says "Your action"). | yes | Existing e2e locators and the recorder in `e2e/table.spec.ts:51-54` use it; not visible text. | Rename to "Your action" (touches the locked e2e) |
| A-6 | Amounts are written `$<integer>` with no separator, from `Action.amount`. | yes | Same as stacks today (`src/ui/table/Table.tsx:39`, TASK-3.1 A-3); formatting is E03-S19. | Locale formatting now |

## 3. Current system
- Engine: `legalActions(state)` returns the exact legal set for `state.toAct` in the order fold, check, call,
  bet, raise, `[]` when complete (`src/engine/hand.ts:216-241`). `Action.amount` is "the number on the action
  bar": call = chips added (the owed delta, `owe = currentBet - streetContribution`, `hand.ts:226,231`), bet =
  bet size (`hand.ts:238`), raise = "raise to" street total (`raiseTo = currentBet + unit`, `hand.ts:227,232`);
  documented at `hand.ts:48`. Unit is the small bet preflop/flop and the big bet turn/river (`hand.ts:221-224`).
  The engine does not cap streets yet (no `betCount` check in `legalActions`; cap is TASK-1.12), and the
  minimum stack of `8 × smallBet + 8 × bigBet` (`hand.ts:151-156`) means short stacks cannot occur yet.
- `PlayerView.legalActions` = copied `legalActions(state)` when `seat === toAct`, else `[]`
  (`src/engine/player-view.ts:53-54,102`).
- Session: `nextStep`, `applyUserAction` (throws `RangeError` off-turn, `src/table/session.ts:121-135`),
  `userActions` (`session.ts:138-140`), `USER_SEAT = 5`, `DEFAULT_BUTTON = 6` (`session.ts:56-57`).
- UI: `Table.tsx:60-68` renders verb buttons only when `step === 'user'`; `useTableSession.act` already ignores
  calls when it is not the user's turn (`src/ui/table/useTableSession.ts:54-56`). No key handlers exist anywhere
  in `src/` (grep for `keydown|keyup|keypress|onKey` is empty). Styles: `src/ui/styles.css:46-58`.
- Tests: Vitest in the `node` environment, React rendered with `renderToString` (`vite.config.ts:7-9`,
  `tests/ui/table.acceptance.test.tsx`); Playwright at 1280 × 720 in Chromium and WebKit against
  `npm run build && npm run preview` (`playwright.config.ts:3-23`); axe via `e2e/support/axe.ts`; replay-code
  stub and paused-clock helpers in `e2e/support/table-harness-bundle.ts` and `e2e/table.spec.ts:60-75`.
- The pinned TASK-3.1 code (words `9e3779b9 00000001 00000002 00000003`, `e2e/table.spec.ts:10`) gives, with
  check-or-call, these user decisions (probed with the current engine and TAG bots): preflop Fold / Call 4 /
  Raise to 8 after Cal and Dee fold; flop Check / Bet 4; turn Check / Bet 8; river Check / Bet 8.
- Existing code to reuse:
  - `src/engine/player-view.ts` `playerView` → the bar's only input; no new engine query.
  - `src/engine/hand.ts` `createHand`, `applyAction`, `legalActions` → crafted states and the AC#5 oracle.
  - `src/playtest/policy.ts` `randomMovePolicy`, `seatGenerator` → cheap seeded moves for AC#5 state generation.
  - `src/engine/deck.ts` `replayCodeFromWords`, `shuffledDeck` → seeded decks.
  - `e2e/support/table-harness-bundle.ts` `stubReplayWords`; `e2e/support/axe.ts` `expectNoSeriousAxeViolations`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The bar model is a pure function of the user's `PlayerView` in headless `src/table/action-bar.ts`; React only renders it. | Compute labels in the component; read `HandState` directly | The bar can only show what the user can see; testable without a DOM; TASK-3.7 and TASK-8.1 extend one function. | no | n/a |
| D-2 | No Hint button in this story. | Disabled "Hint" placeholder now | TASK-8.1's description and AC#1 own the Hint button on the bar (REQ-022.2); a dead button would be user-visible clutter for one story. | no | n/a (plan: TASK-8.1 AC#1) |
| D-3 | Whenever it is not the user's turn (bot to act, or the hand has ended), the bar shows three disabled buttons "Fold", "Call", "Raise" with no amounts and no actions; after the hand ends the bar stays shown and disabled and "Hand over" still appears. At the user's decision this supersedes TASK-3.1 D-3 ("buttons disappear when the hand ends"), as AC#6 requires a disabled bar then (`doit/TASK-3.2/qa.md` Q-1). | (b) keep the last decision's buttons greyed with their amounts; (c) hide the bar off-turn (contradicts REQ-017.5 and AC#6) | One fixed rule; no stale amounts that could be misread as current prices; the row does not vanish and reappear. | yes | user (Q-1) |
| D-4 | Edit TASK-3.1's locked acceptance test `e2e/table.spec.ts`, only as listed in §5 "Planned edits to e2e/table.spec.ts". Reason: its assertions encode TASK-3.1 A-4 (plain verbs) and D-3 (buttons removed at hand end), which TASK-3.1 said this story replaces; AC#6 and REQ-022.1 here contradict them. No assertion is removed and none is weakened beyond the new labels. If the gate holds the file locked, the orchestrator runs `python3 SKILL_DIR/scripts/doit.py unlock TASK-3.2 e2e/table.spec.ts --reason "TASK-3.2 replaces plain verbs and removed-at-end buttons (TASK-3.1 A-4/D-3) with exact-amount labels and a disabled bar (AC#6, REQ-022.1)"`. | Weaken it with `try`/skips; leave it failing | Keeps TASK-3.1's flows as regression tests. | yes | user (Q-1) |
| D-5 | Labels: fold → `Fold`, check → `Check`, call → `Call $<amount>`, bet → `Bet $<amount>`, raise → `Raise to $<amount>`, with `amount` taken unchanged from the engine action; buttons in engine order. | Recompute amounts in the UI | The engine's `amount` is already the label number (`hand.ts:48`); the call amount is the owed delta, as the ACs require. Engine order (fold, check, call, bet, raise) matches the storyboard's Fold, Call, Raise. | no | n/a (codebase) |

## 5. Design

### Files to create / modify
- `src/table/action-bar.ts` — new: action bar model (pure, headless).
- `src/ui/table/ActionBar.tsx` — new: renders the model.
- `src/ui/table/Table.tsx` — modify: use `userActionBar` + `<ActionBar>`; drop `ACTION_LABELS` and the `userActions` import.
- `src/ui/styles.css` — modify: replace `.table-actions` rules with the action bar styles (A-2).
- `tests/table/action-bar.test.ts` — new: unit tests.
- `tests/table/action-bar.acceptance.test.ts` — new: AC#5 10,000-state test.
- `tests/ui/action-bar.acceptance.test.tsx` — new: AC#1–#4, #6 on the rendered bar.
- `e2e/action-bar.spec.ts` — new: browser checks for AC#1, #2, #6, #7, #8, axe.
- `e2e/table.spec.ts` — modify (TASK-3.1 acceptance test, D-4): limited edits listed below.

### Components, interfaces and data
`src/table/action-bar.ts` (imports only `../engine/hand`, `../engine/player-view` and `./session`; no React,
no DOM):
```ts
export interface ActionButton {
  readonly label: string;
  /** The engine action this button submits; null on a disabled (idle) bar. */
  readonly action: Action | null;
}
export interface ActionBarModel {
  readonly enabled: boolean;
  readonly buttons: readonly ActionButton[];
}
/** Disabled bar content (D-3, approved by Q-1). */
export const IDLE_BUTTONS: readonly ActionButton[]; // [{label:'Fold',action:null},{label:'Call',action:null},{label:'Raise',action:null}]
export function actionLabel(action: Action): string;
/** Enabled iff view !== null && view.toAct === view.seat && view.legalActions.length > 0. */
export function actionBar(view: PlayerView | null): ActionBarModel;
/** null before the first deal (A-1); else actionBar(playerView(table.hand, USER_SEAT)). */
export function userActionBar(table: TableState): ActionBarModel | null;
```
- Enabled: `buttons = view.legalActions.map((a) => ({ label: actionLabel(a), action: a }))`, same order.
- Disabled: `{ enabled: false, buttons: IDLE_BUTTONS }`.
- Never mutates its input; returns fresh arrays for the enabled case.

`src/ui/table/ActionBar.tsx`:
```tsx
export function ActionBar(props: { model: ActionBarModel; onAct: (action: Action) => void }): React.JSX.Element
```
Renders `<div role="group" aria-label="Your actions" className="action-bar">` with one
`<button type="button" disabled={!model.enabled} onClick={...}>{label}</button>` per model button (React key =
index), where `onClick` calls `onAct(button.action)` only if `model.enabled && button.action !== null`. No
keyboard listeners, no `accessKey`, no `tabIndex` changes (native focus/activation stays, Q-46).

`Table.tsx`: `const bar = userActionBar(table);` and `{bar !== null && <ActionBar model={bar} onAct={act} />}` in
place of `Table.tsx:60-68`. Everything else in the table is unchanged.

### Rules and algorithms
Worked examples at $4/$8 (smallBet 4, bigBet 8, blinds 2/4), six seats, button 6, user seat 5:
- Preflop, Cal and Dee fold: user owes 4 → `Fold`, `Call $4`, `Raise to $8` (AC#2).
- Flop, Ava–Dee check: no bet → `Check`, `Bet $4`, no Fold (AC#1).
- Turn, Ava bets 8, Ben–Dee fold: → `Fold`, `Call $8`, `Raise to $16` (AC#3).
- Button 3 (Dee SB, user BB), Eli, Ava, Ben, Cal call 4, Dee completes 2: user owes 0, currentBet 4 →
  `Check`, `Raise to $8`, no Fold (AC#4).
- Capped street today: the engine still offers a raise after the fourth bet (TASK-1.12 not done), so the bar
  shows that `Raise to $X`; the bar always mirrors the engine and needs no change when the cap lands
  (TASK-3.7 checks it).

### Planned edits to `e2e/table.spec.ts` (D-4) — nothing else in the file changes
1. `VERBS` / `expectNoBuyInControl` (`:13`, `:118-122`): every button name must match
   `/^(Fold|Check|Call|Raise|Call \$\d+|Bet \$\d+|Raise to \$\d+)$/` (the idle set plus the exact-amount labels).
2. `checkOrCall` (`:113-116`): click "Check" if present, else the button whose name matches `/^Call \$\d+$/`.
3. `expect(yourActions(page)).toHaveCount(0)` (`:172` and `:186`): replace each with: the group is visible, has
   at least one button, and every button in it is disabled.
The `clickAction`, `nextTurn` and recorder logic already use enabled buttons and stay as they are.

### Error handling and configuration
- No new errors. A click on a disabled bar does nothing (native `disabled` + `ActionBar` guard + the existing
  `act` guard in `useTableSession.ts:54-56`); `applyUserAction` still throws `RangeError` off-turn.
- No configuration. The stake comes from the existing `SessionConfig`.

## 6. Behaviour specification

### SPEC-01: No bet facing on the flop — Check and Bet $4, no Fold
- Verifies: AC#1, DoD#1
- Behaviour: Given a $4/$8 six-seat hand (button 6, stacks 160, deck `shuffledDeck(replayCodeFromWords([1, 2, 3, 4]))`)
  played by `applyAction` with seats 3, 4, 5, 6 and 1 calling and seat 2 checking preflop, then seats 1–4 checking on the flop, When `renderToString(<ActionBar model={actionBar(playerView(hand, 5))} onAct={() => {}} />)`
  is parsed, Then the "Your actions" group holds exactly two buttons, texts `["Check", "Bet $4"]`, none
  disabled, and no button text contains "Fold".
- Verification: acceptance `tests/ui/action-bar.acceptance.test.tsx::flop with no bet facing offers Check and Bet $4 and no Fold`

### SPEC-02: Facing the big blind preflop — Fold, Call $4, Raise to $8
- Verifies: AC#2, DoD#1
- Behaviour: Given the same hand preflop after seats 3 and 4 fold, When the bar for seat 5 is rendered, Then
  the buttons are exactly `["Fold", "Call $4", "Raise to $8"]`, all enabled.
- Verification: acceptance `tests/ui/action-bar.acceptance.test.tsx::preflop facing the big blind offers Fold, Call $4 and Raise to $8`

### SPEC-03: Facing an $8 bet on the turn — Fold, Call $8, Raise to $16
- Verifies: AC#3, DoD#1
- Behaviour: Given the same preflop, every seat checking the flop, then on the turn seat 1 betting 8 and seats 2–4 folding, When the bar for seat 5 is
  rendered, Then the buttons are exactly `["Fold", "Call $8", "Raise to $16"]`.
- Verification: acceptance `tests/ui/action-bar.acceptance.test.tsx::turn facing an $8 bet offers Fold, Call $8 and Raise to $16`

### SPEC-04: Big blind in an unraised pot — Check and Raise to $8, no Fold
- Verifies: AC#4, DoD#1
- Behaviour: Given a $4/$8 six-seat hand with button 3 (seat 5 is the big blind), seats 6, 1, 2, 3 calling 4
  and seat 4 calling 2, When the bar for seat 5 is rendered, Then the buttons are exactly
  `["Check", "Raise to $8"]` and no text contains "Fold".
- Verification: acceptance `tests/ui/action-bar.acceptance.test.tsx::big blind in an unraised pot offers Check and Raise to $8 and no Fold`

### SPEC-05: 10,000 seeded states — offered set equals the engine's legal set
- Verifies: AC#5, DoD#1
- Behaviour: Given hands generated from `replayCodeFromWords([i, 0x5eed, 2, 3])` for i = 0, 1, … with
  `3 + (i % 8)` seats, button = the seat at index `i % seats`, stakes cycling $2/$4, $4/$8, $10/$20, $15/$30
  (blinds per `stakesFor`), every stack = buy-in (20 big bets), and every seat moving by
  `randomMovePolicy(seatGenerator(code, seat))`, When at each decision the bar is built from the deciding
  seat's view (`actionBar(playerView(hand, hand.toAct))`), Then for each of the first 10,000 decision states
  `enabled` is true, `buttons.map(b => b.action)` deep-equals `legalActions(hand)`, and the labels equal the
  test's own literal mapping (`Fold`, `Check`, `Call $${n}`, `Bet $${n}`, `Raise to $${n}`); for every other
  seat's view at the same state the bar is disabled with only `null` actions; and across the run each shape
  `[check, bet]`, `[check, raise]` and `[fold, call, raise]` occurs at least once. The test finishes in under
  10 s.
- Verification: acceptance `tests/table/action-bar.acceptance.test.ts::the bar equals the engine's legal actions in 10,000 seeded states`

### SPEC-06: Disabled bar off-turn and after the hand ends — rendered model
- Verifies: AC#6, DoD#1
- Behaviour: Given a bot-to-act state and a completed hand, When `actionBar` is built for seat 5 and rendered,
  Then `enabled` is false, the buttons are `["Fold", "Call", "Raise"]` (D-3/Q-1), each `<button>` carries
  `disabled=""`, and every model action is `null`; `actionBar(null)` gives the same model.
- Verification: acceptance `tests/ui/action-bar.acceptance.test.tsx::off-turn and finished hands show a disabled bar with no actions`

### SPEC-07: Session wiring and label unit rules
- Verifies: AC#5, AC#6, DoD#1
- Behaviour: Given `seatSession()`, When `userActionBar` is called, Then it returns `null`; Given the default
  session dealt from `replayCodeFromWords([7, 1, 2, 3])`, at the user's turn `userActionBar(table)` equals
  `actionBar(playerView(table.hand, 5))` and its actions equal `userActions(table)`; at a bot turn and when
  done it is disabled; `actionLabel` maps `{type:'call', amount: 10}` → `Call $10`, `{type:'bet', amount: 20}`
  → `Bet $20`, `{type:'raise', amount: 40}` → `Raise to $40`, fold → `Fold`, check → `Check`; a deep-frozen
  view is not mutated.
- Verification: unit `tests/table/action-bar.test.ts::user action bar follows the session and labels each action`

### SPEC-08: Action bar module stays headless
- Verifies: DoD#5
- Behaviour: Given `src/table/action-bar.ts`, When its import specifiers are listed, Then none is `react`,
  `react-dom` or under `ui/`, and it runs in the Vitest `node` environment.
- Verification: unit `tests/table/action-bar.test.ts::action bar module imports no UI code`

### SPEC-09: Browser — exact labels on the pinned hand
- Verifies: AC#1, AC#2, DoD#7
- Behaviour: Given the app with the TASK-3.1 pinned replay words (`e2e/table.spec.ts:10`) and real timers, When
  the user clicks Check if offered else the `Call $<n>` button at every turn, Then the "Your actions" button
  texts at the user's preflop, flop and turn decisions are exactly `["Fold", "Call $4", "Raise to $8"]`,
  `["Check", "Bet $4"]` and `["Check", "Bet $8"]`, all enabled, in Chromium and WebKit.
- Verification: acceptance `e2e/action-bar.spec.ts::my action bar shows exact amounts at each decision`

### SPEC-10: Browser — clicking during a bot's turn or after the hand submits nothing
- Verifies: AC#6, DoD#7
- Behaviour: Given the paused fake clock (`clock.install({time: 0})` + `pauseAt(1000)`), the pinned words and
  `runFor(1000)` in 50 ms slices to the user's preflop turn, When the user clicks "Call $4" (applied:
  `data-action-count` goes 4 → 5) and then, with no timer advanced (Eli, seat 6, to act), clicks every button in
  "Your actions" with `{ force: true }`, Then every button is disabled with texts `["Fold", "Call", "Raise"]`,
  `data-action-count` stays 5 and `data-to-act` stays "6". Given real timers, When the user folds at the first
  turn and "Hand over" is shown, and every button is force-clicked, Then all are disabled, after 500 ms
  `data-action-count` is unchanged and `data-to-act` is empty.
- Verification: acceptance `e2e/action-bar.spec.ts::the bar is disabled and submits nothing off-turn or after the hand`

### SPEC-11: Browser — single keys trigger nothing
- Verifies: AC#7, DoD#7
- Behaviour: Given real timers and the user's first turn (enabled buttons), When focus is moved to the page body
  (`document.activeElement.blur()`; then `document.activeElement === document.body`) and the keys `f`, `c`,
  `r`, `h`, `k`, `b` and `Space` are each pressed with `page.keyboard.press`, Then after 500 ms
  `data-action-count` and `data-to-act` ("5") are unchanged and the same buttons are still enabled.
- Verification: acceptance `e2e/action-bar.spec.ts::single key presses take no action`

### SPEC-12: Browser — every action button is at least 44 × 44 px at 1280 × 720
- Verifies: AC#8, DoD#7
- Behaviour: Given a 1280 × 720 viewport, When the bar is measured at the user's preflop turn (3 buttons), the
  flop turn (2 buttons) and off-turn (3 idle buttons), Then each button's `boundingBox()` has width ≥ 44 and
  height ≥ 44.
- Verification: acceptance `e2e/action-bar.spec.ts::every action button is at least 44 by 44 px`

### SPEC-13: Browser — axe clean and no outside requests with the new bar
- Verifies: DoD#7, DoD#8
- Behaviour: Given the app with the pinned words, When axe runs at the user's turn (enabled bar), at a bot's
  turn (disabled bar, paused clock) and after "Hand over", Then it reports no serious or critical violations,
  and every request made during the test has origin `http://localhost:4173`.
- Verification: acceptance `e2e/action-bar.spec.ts::action bar is axe clean and makes no outside requests`

### SPEC-14: TASK-3.1 flows still pass with the edited regression test
- Verifies: DoD#7
- Behaviour: Given only the D-4 edits to `e2e/table.spec.ts`, When it runs in Chromium and WebKit, Then all six
  of its tests pass, including the hand-end checks that the bar is present with every button disabled.
- Verification: integration `npx playwright test e2e/table.spec.ts`

### SPEC-15: Lint, typecheck, unit tests and coverage pass
- Verifies: DoD#1, DoD#2, DoD#4
- Behaviour: Given the change, When the checks run, Then each exits 0, coverage stays ≥ 90% for
  engine/bots/advice/stats and ≥ 70% overall, and every existing test (including TASK-3.1's locked Vitest
  files, unchanged) passes.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run e2e`

### SPEC-16: Playtest stays clean
- Verifies: DoD#6
- Behaviour: Given no engine, bots or advice change, When the 10,000-hand playtest runs, Then it reports zero
  invariant violations.
- Verification: command `npm run playtest -- --hands 10000 --seed 42`

### SPEC-17: CI green and story documentation published
- Verifies: DoD#10, DoD#11
- Behaviour: Given branch `doit/TASK-3.2`, When CI runs and the story doc is written, Then the workflow is green
  and `backlog doc list --plain` lists a TASK-3.2 doc that records D-3/Q-1 and the D-4 edit to TASK-3.1's test.
- Verification: manual CI run on branch `doit/TASK-3.2` and `backlog doc list --plain`

### SPEC-18: Not-applicable DoD items
- Verifies: DoD#3, DoD#9, DoD#12
- Behaviour: Given the golden-spot suite (E07-S14) and the offline service worker (E13-S07) do not exist and
  this story adds no strategy content, When the Judge checks, Then the diff touches no file under
  `src/advice`, no golden spot and no strategy text.
- Verification: manual Judge confirms the diff has no strategy content and that E07-S14 and E13-S07 are not Done

## 7. Edge cases
- Double click on an action button: the first click moves the hand to a bot's turn in the same React commit,
  so the second lands on a disabled button; `act` also ignores it (`useTableSession.ts:54-56`). SPEC-10.
- Focus left on a clicked button that becomes disabled: browsers drop focus from disabled controls, so a later
  Space cannot activate it; SPEC-11 covers keys with focus on the body. Tab+Enter/Space on a focused enabled
  button still works by design (Q-46, TASK-3.17).
- User has no legal action on their turn: cannot occur (`legalActions` always includes check or fold for the
  seat to act, `hand.ts:229-240`); the model would show the disabled bar anyway.
- Capped street / short stack / all-in: capped cannot be enforced yet (engine), short stacks cannot occur
  (engine minimum stack); TASK-3.7. The bar mirrors the engine (§5).
- Window narrower than the bar: buttons wrap (flex-wrap); 1280 × 720 is the supported minimum (REQ-060).
- Seated table before the deal: no bar (A-1).
- StrictMode double render: the model is pure; no effects added.

## 8. Security considerations
- Trust boundaries: none new; the only input is in-memory engine state. User clicks submit engine actions taken
  from `legalActions`, and `applyAction` still validates (REQ-017.4).
- No authn/authz, secrets, storage, network or new dependencies. Randomness: none in production code; tests use
  the existing seeded generators. Hole cards: the bar reads only the user's `PlayerView`.

## 9. Non-functional
- Bar build cost: one `playerView` copy per render (O(players + actions)), negligible against the 100 ms
  budget of TASK-3.1 AC#7, which stays enforced by `e2e/table.spec.ts` (last test).
- AC#5 test runtime < 10 s on CI (Vitest `testTimeout` 30 s, `vite.config.ts:10`).
- Targets ≥ 44 × 44 CSS px (A-2 gives 52 × ≥ 120) — SPEC-12. Axe zero serious/critical — SPEC-13.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview` then open `http://localhost:4173` (or `npm run dev`)
- New tests (path → SPEC ids):
  - `tests/ui/action-bar.acceptance.test.tsx` → SPEC-01..SPEC-04, SPEC-06
  - `tests/table/action-bar.acceptance.test.ts` → SPEC-05
  - `tests/table/action-bar.test.ts` → SPEC-07, SPEC-08
  - `e2e/action-bar.spec.ts` → SPEC-09..SPEC-13 (Chromium and WebKit)
  - `e2e/table.spec.ts` (D-4 edits) → SPEC-14
  - Commands → SPEC-15, SPEC-16
- End-to-end scenario for the Judge: `npm run build && npm run preview`, open `http://localhost:4173`. While bots
  act the bar shows greyed "Fold", "Call", "Raise". On your turn it shows only your legal actions with amounts
  (e.g. "Fold", "Call $4", "Raise to $8" preflop; "Check", "Bet $4" on an unbet flop; "Bet $8" on the turn).
  Click with the mouse; the bar greys out at once. Press F, C, R, H, K, B, Space with nothing focused: nothing
  happens. Fold, let the hand finish: the bar stays greyed and clicking does nothing. Buttons are large (52 px
  tall).

## 11. Open questions
- None. Q-1 answered 2026-11-18 (greyed Fold / Call / Raise, see `doit/TASK-3.2/qa.md`); folded into D-3.

## 12. Clarifications log
See `doit/TASK-3.2/qa.md`.

## 13. Follow-ups (become tasks)
- TASK-3.16: decide which action button, if any, carries the red primary accent; the storyboard's red Raise could nudge learners toward raising.
- TASK-3.7: extend `actionLabel` with "Call all-in $X", "Bet all-in $X", "Raise all-in to $X" and chip labels without "$", and widen the AC#5 property to capped and short-stack states.
- TASK-8.1: add the Hint button to `ActionBar` only when `model.enabled` is true (REQ-022.2).
- TASK-3.16: when the bar moves below the felt, keep the accessible name "Your actions" or update `e2e/table.spec.ts` and `e2e/action-bar.spec.ts` together.
