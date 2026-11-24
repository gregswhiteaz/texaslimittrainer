# Spec: TASK-10.2 — Leave the table in the middle of a hand

Status: READY (approved 2026-11-24)
Task: TASK-10.2 · Parent/epic: TASK-10 · Requirements: REQ-004 (004.5, 004.7, 004.8) · Dream: limit-holdem-trainer

## 1. Summary
Leave table pressed while a hand is in progress no longer drops the unfinished hand (TASK-10.1 D-2 interim). It
opens a modal dialog, "Leave now? Your hand will be folded.", with Cancel and Confirm, and play (bots included)
is frozen while it is open. Cancel resumes play unchanged. Confirm folds the user's hand at once, even out of
turn (unless the user is all-in or has already folded). Bots then play the hand out, it is graded and stored like
any completed hand, and the session ends through the existing TASK-10.1 path, so its Session Report opens. The
forced fold is not a user decision: it has no grade and no decision entry, so it never counts in error rates,
hint usage or leaks.

## 2. Scope
- In scope:
  - `src/engine/hand.ts`: `forceFold(state, seat)`, a fold of any seat that still holds cards and is not
    all-in, in turn or out of turn. The round-settling tail of `applyAction` is extracted into a private
    helper so both functions share it. `applyAction` behaviour does not change.
  - `src/table/session.ts`: `handInProgress(table)` and `foldUserToLeave(table)` (pure).
  - `src/table/hand-record.ts`: the record marks a forced-fold hand and `parseHandRecord` accepts it
    with an optional `forcedFold: true` (D-2, approved by Q-1).
  - `src/ui/table/LeaveDialog.tsx` (new), plus `Table.tsx`, `useTableSession.ts` and styles: the prompt, the
    freeze while it is open, the leaving play-out, and the hand-off to `onLeave(sessionId)` once the hand's
    write has settled.
  - Register the dialog in the play-money screen list and the walk. The locked-test edits in D-5. Tests. Docs.
- Not doing:
  - Any change to Leave table between hands (no hand dealt yet, or the result is showing), the bust dialog's
    Leave table, the Home control or browser Back. These keep TASK-10.1 / TASK-2.14 behaviour.
  - Any `App.tsx` change. `leave(sessionId)` → `ending` → `tableWritesSettled` → `endSession` is reused as is.
  - Error-rate, hint-usage or leak figures in the report (TASK-10.3..10.11). They don't exist yet. This story
    only guarantees that the forced fold leaves no trace in `decisions`, which is the data those figures read.
  - Sit-and-go finishing position on leaving (TASK-5.11). The mechanics here are the same for both game types.
  - DB version bump or migration (Q-1's approved format needs none).
  - Changes to bot logic, advice or grading.
- Scope budget: files=19, lines=950

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | "Hand in progress" means `nextStep(table)` is `'user'` or `'bot'`: dealt and no result yet. Before the deal (`'deal'`, e.g. right after Start game or Resume) and once the result shows (`'done'`) count as between hands, so there is no dialog. | yes | The story says "from the hand's deal until its result is shown". This keeps every existing pre-deal and result-time Leave test as it is. | Treat the pre-deal moment as in progress. |
| A-2 | The dialog freezes the table: while it is open no bot step is scheduled and a bot reply already in flight is dropped. On Cancel or Confirm the same turn is asked again; bot seeds are deterministic, so the decision is the same. | yes | AC#2 asks for "the same player to act" after Cancel, and AC#7 asks for the fold "before that bot acts". Both only hold if bots wait. | Let bots keep acting behind the dialog. |
| A-3 | Dialog markup: `<dialog class="leave-dialog" aria-labelledby="leave-heading">` with `<h2 id="leave-heading">Leave now? Your hand will be folded.</h2>`, then buttons `Cancel` (first, focused on open) and `Confirm`. Escape acts as Cancel. Cancel returns focus to the header's Leave table button, set by the Table (WebKit does not focus a clicked button; same as `GameConfigScreen.tsx:281-284`). | yes | The story gives the text and "Confirm / Cancel". Cancel-focused and Escape-as-Cancel follow EndSessionDialog (TASK-2.7 A-2). A single heading makes the dialog's accessible name the exact AC text. | `<h2>Leave now?</h2><p>Your hand will be folded.</p>`; Confirm labelled "Leave". |
| A-4 | Confirm closes the dialog at once. The table then shows the fold and the bots' play-out. While leaving, the header's Home and Leave table buttons are `disabled`, and the bust dialog, Hand Review panel, review badge and Deal next button are not rendered. `rebuy` and `dealNext` are no-ops. | yes | No hand 26 may be dealt (AC#3), so Rebuy must not be reachable after a losing all-in. A second Leave or Home must not race the session end. | Keep the dialog open with disabled buttons until the report shows. |
| A-5 | If the user has already folded earlier in the hand, Leave table still opens the same dialog. Confirm folds nothing more, and the hand plays out, is stored and the session ends. | yes | This is the literal story ("during a hand"). AC#3/#7 qualify only the fold itself ("while the user holds cards"). | No dialog when the user holds no cards. |
| A-6 | If the leaving hand's write fails, the session still ends once that write settles. The report then counts only the stored hands, and the failure is logged "Hand record could not be saved" as today. | yes | The user asked to leave. TASK-10.1's `endSession` already ends at the last stored hand. | Stay on the table after a failed write. |
| A-7 | `handInProgress` is read from the table as last rendered, when Leave table is clicked. | yes | Same rule as every other Table click handler. `e2e/session-end-order.spec.ts` (leave in the Hand over microtask) then stays a between-hands leave. | Read it in a state updater. |

## 3. Current system
- Leave table today: `TableView` header button → `Table`'s `onLeave={() => onLeave(sessionId)}`
  (`src/ui/table/Table.tsx:248-250, 452`). That reaches `App.leave` (`src/ui/App.tsx:132-136`): `closeTable()`
  and the `ending` screen. The `ending` effect (`App.tsx:81-97`) awaits `tableWritesSettled()` and then calls
  `endSession`, which opens the report, or Home if there are 0 hands. Mid-hand, the unfinished hand is dropped
  because no write was ever queued for it (TASK-10.1 D-2, `docs/ui/navigation.md:29-37`).
- The play loop is one effect in `useTableSession` (`src/ui/table/useTableSession.ts:191-268`). It schedules a
  `setTimeout(0)` deal (`'deal'`), or a `setTimeout(botActionDelayMs)` then worker bot decision (`'bot'`). A
  cleanup `cancelled` flag drops late replies. On `'done'` it writes the hand once, via `reported`, and
  `track`s the write, then schedules the next deal through `nextHandDelay(table, holdNextHand)`.
- Engine: `applyAction` rejects out-of-turn actions and a fold when no bet is faced (`src/engine/hand.ts:618-685`).
  Its tail decides fold-out (`foldOut`), round end (`endRound`) or the next `toAct`. `checkState(state)`
  (`src/engine/invariants.ts:417`) checks the state-only invariants.
- User decisions exist only through `applyUserAction` (`src/table/session.ts:667-693`), which appends to
  `table.userDecisions`. Grades are requested per `userDecisions` entry, and `handRecord` requires
  `decisions.length === hand.userDecisions.length` (`src/table/hand-record.ts:216`). `parseHandRecord` requires
  the decisions to match the user's non-blind actions one to one (`hand-record.ts:422-441`). **A forced fold
  with no decision would therefore make the stored record unreadable** unless the format marks it (D-2, Q-1).
- Table action labels: a folded seat reads `Folded` (`src/table/table-view.ts:181`), and
  `data-action-count` = actions so far (`table-view.ts:237`).
- Dialog pattern: `EndSessionDialog` (`src/ui/config/EndSessionDialog.tsx`) uses `showModal` in a layout
  effect, focuses Cancel, has `onClose` → `onCancel`, and Cancel calls `dialog.close()`. `BustDialog`
  (`src/ui/table/BustDialog.tsx`) is the table's modal.
- Screen list: `e2e/support/screen-list.ts` must list every `<dialog` component. `appScreens` detects
  `/<dialog\b|role=["']?(alert)?dialog\b/` (`e2e/support/play-money.ts:54`). The test
  `tests/ui/screen-list.acceptance.test.ts` also pins the exact list `['BustDialog', 'EndSessionDialog']`.
- Vitest runs in `environment: 'node'` (`vite.config.ts:8`): UI tests use `renderToString`, and hook behaviour
  is covered in Playwright. Playwright runs Chromium and WebKit (`playwright.config.ts:14-15`).
- Existing code to reuse:
  - `src/engine/hand.ts` `foldOut`, `endRound`, `bettingOver`, `clockwiseAfter` → the shared settle step of
    `forceFold`.
  - `src/table/session.ts` `nextStep`, `completedHand`. `src/table/session-record.ts` `handWrite`.
    `src/table/session-report.ts` `sessionReport`.
  - `src/ui/config/EndSessionDialog.tsx` → structure of `LeaveDialog` (layout-effect `showModal`, Cancel
    focus, `onClose`).
  - `tests/support/table-scenarios.ts` `userTableAfter`, `REVIEW_DECK`, `SIDE_POT_RIVER`, `play`,
    `SIDE_POT_DECK`. `tests/support/session-play.ts` `checkOrCall`.
  - `e2e/support/hand-records.ts` (`seedStoredSessions`, `storedRecords`, `storedSessions`, `storedReports`,
    `header`, `handOver`). `e2e/support/paused-clock.ts` (`runUntil`, `runUntilMyTurn`,
    `axeWithPausedClock`). `e2e/support/table-locators.ts` `expectToAct`.
    `e2e/support/table-harness-bundle.ts` `stubReplayWords`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The forced fold is an engine operation, `forceFold`, recorded as an ordinary `fold` `ActionRecord` (amount 0, added 0, current street) at the moment of confirm. It is not added to `userDecisions`. | Auto-fold when the user's turn comes (fails AC#7: the bot would act first). A `forced` flag on `ActionRecord` (engine type change visible to bots' views). | It is the only way to fold "before that bot acts". Keeping it out of `userDecisions` means it is never graded (AC#8). | yes | user (Q-1) |
| D-2 | Persisted mark (approved by Q-1): an optional top-level `forcedFold: true` on the hand record. It is written only on a hand where the user's non-blind actions outnumber `userDecisions` by exactly one and the extra one is the last of them and is a `fold`. Absent on every other record. `parseHandRecord`: `forcedFold` absent, or exactly `true`. When `true`, the made actions are the decisions plus one final `fold`. | Always write `forcedFold: false/true` (changes every record's JSON and breaks locked exact-record tests). Relax the validator with no flag (can't tell a forced fold from a corrupt record). A decision entry with no grade (breaks review and grade consumers). | No DB version bump and no migration. Every existing v3 record stays valid and byte-identical. | yes | user (Q-1) |
| D-3 | The leave flow lives in `Table` and `useTableSession`. `App` only receives the usual `onLeave(sessionId)`, called after the leaving hand is done and its write has settled. | A new App screen or state for "leaving". | TASK-10.1's `ending` effect already orders `endSession` after every tracked write (`App.tsx:78-97`). | no | n/a |
| D-4 | The dialog renders only while prompted (conditional element, not a hidden one). | An always-mounted closed `<dialog>`. | A closed `<dialog>`'s buttons would still be in `getByRole('button')` (`e2e/table.spec.ts:156-160` `BUTTON_NAME`) and in `renderToString` snapshots. | no | n/a |
| D-5 | Locked tests the build must edit (none others are expected; see §7). (1) `tests/ui/screen-list.acceptance.test.ts` (owner TASK-2.15): `dialogs` becomes `['BustDialog', 'EndSessionDialog', 'LeaveDialog']`. (2) `e2e/play-money.spec.ts` (owner TASK-2.15): during hand 14, after `checkPlayMoney(page, 'table')` with the hint open and before `playToResult(page, 14, …)`, click `Leave table`, expect the dialog `Leave now? Your hand will be folded.`, `checkPlayMoney(page, 'leave-dialog')`, click `Cancel`, expect it hidden. (3) `e2e/table-display.spec.ts:195` (owner TASK-3.3, real clock, user to act in hand 1): after `Leave table`, click `Confirm` in the dialog. Then expect the h1 `Session report` focused, the report line `Cash · 6 players · $4/$8 · 1 hand`, the table section count 0, and after 1000 ms `__tableDisplayDraws` still 1. Retitle it "the header shows the session and Leave table during hand 1 ends it after that hand". | Make those tests leave between hands. | They exercise the exact path this story changes. (2) is required by the screen-list rule. | no | user (Spec Detective notes, qa.md) |

## 5. Design

### Files to create / modify
- `src/engine/hand.ts` — `forceFold` and the shared private settle helper extracted from `applyAction`.
- `src/table/session.ts` — `handInProgress`, `foldUserToLeave`.
- `src/table/hand-record.ts` — `forcedFold?: true` on `HandRecord`, written by `handRecord`, checked by
  `parseHandRecord`.
- `src/ui/table/LeaveDialog.tsx` — new modal dialog component.
- `src/ui/table/useTableSession.ts` — `paused` and `onLeft` options. Returns `leaving` and `leave()`.
- `src/ui/table/Table.tsx` — prompt state, freeze, leaving rendering rules (A-4), focus return. New
  `TableView` props.
- `src/ui/styles.css` — `.leave-dialog` styles, matching `.end-session-dialog` and `.bust-dialog`.
- `e2e/support/screen-list.ts` — add `{ id: 'leave-dialog', kind: 'dialog', component: 'LeaveDialog' }`
  after `bust-dialog`.
- `tests/ui/screen-list.acceptance.test.ts` — locked edit D-5 (1).
- `e2e/play-money.spec.ts` — locked edit D-5 (2).
- `e2e/table-display.spec.ts` — locked edit D-5 (3).
- `tests/engine/force-fold.acceptance.test.ts` — new (SPEC-01, SPEC-02, SPEC-03).
- `tests/table/leave-mid-hand.acceptance.test.ts` — new (SPEC-04, SPEC-05, SPEC-06, SPEC-07).
- `tests/ui/leave-dialog.acceptance.test.tsx` — new (SPEC-08).
- `e2e/leave-mid-hand.spec.ts` — new (SPEC-09 … SPEC-13).
- `docs/ui/navigation.md` — the "Leave table ends the session" section: the mid-hand dialog replaces the
  "(the Leave-now dialog comes with TASK-10.2)" interim at line 37. Add the Leave-now dialog to the screen and
  dialog list.
- `docs/storage/hand-records.md` — the `forcedFold` field (Record fields table) and the validation rule
  (Validation on read). Note that error rates, hint usage and leaks read `decisions` only.
- `docs/ui/play-money.md` — add the leave dialog to the screen list section, if that doc lists the entries
  (check it; otherwise leave it unchanged).

### Components, interfaces and data
```ts
// src/engine/hand.ts
/** REQ-004.8: folds `seat` now, whether or not it is to act and even when it could check. Same history entry
 *  and pot-eligibility change as a fold through applyAction, and hasActed true. Then the hand settles exactly
 *  as after applyAction: one seat left with cards → foldOut; betting closed (every open seat has acted
 *  and matched currentBet, or bettingOver) → endRound (runout and showdown when ≤ 1 open seat); otherwise
 *  toAct is unchanged if another seat was to act, or the next open seat clockwise if `seat` was to act.
 *  RangeError('Cannot force a fold: <reason>') if the hand is complete, `seat` is not dealt in, has folded or
 *  is all-in. Never mutates `state`. */
export function forceFold(state: HandState, seat: SeatNumber): HandState;

// src/table/session.ts
/** A-1: true iff a hand is dealt and has no result (nextStep is 'user' or 'bot'). */
export function handInProgress(table: TableState): boolean;
/** REQ-004.8: `table` with the user's hand folded by forceFold when a hand is in progress and the user holds
 *  cards and is not all-in; otherwise `table` itself (same object). userDecisions is never changed. */
export function foldUserToLeave(table: TableState): TableState;

// src/table/hand-record.ts — HandRecord gains (D-2, approved by Q-1):
/** Present (true) only on a hand the user left mid-hand: the user's last non-blind action is a fold that is
 *  not a decision (REQ-004.8). Absent otherwise. */
readonly forcedFold?: true;

// src/ui/table/LeaveDialog.tsx
export interface LeaveDialogProps {
  readonly onConfirm: () => void;
  /** Cancel button, Escape and any close of the dialog. */
  readonly onCancel: () => void;
}
export function LeaveDialog(props: LeaveDialogProps): React.JSX.Element;

// src/ui/table/useTableSession.ts — TableSessionOptions gains:
/** While true no deal or bot step is scheduled, and a bot reply in flight is dropped (A-2). */
readonly paused?: boolean;
/** Called once, after leave() was called, the hand is done and its write has settled (either way). */
readonly onLeft?: () => void;
// …and the hook returns, in addition:
leaving: boolean;   // true from leave() on
leave: () => void;  // sets leaving and applies foldUserToLeave; no-op if already leaving

// src/ui/table/Table.tsx — TableViewProps gains:
/** Non-null while the Leave-now dialog is open. */
readonly leavePrompt?: { readonly onConfirm: () => void; readonly onCancel: () => void } | null;
/** A-4: header Home and Leave table disabled; no bust dialog, review panel, badge or Deal next. */
readonly leaving?: boolean;
readonly leaveRef?: React.Ref<HTMLButtonElement>;
```

### Rules and algorithms
- `Table` Leave handler (`onLeave` given to `TableView`): if `leaving`, do nothing. Else, if
  `handInProgress(table)`, open the prompt (state set in the click handler). Else call `onLeave(sessionId)` as
  today. The bust dialog's Leave table uses the same handler. It only shows when the hand is done, so it leaves
  directly.
- While the prompt is open, `useTableSession` gets `paused: true`. In the play-loop effect, after the grade
  requests and before the `'deal'` / `'bot'` branches: `if (paused && (step === 'deal' || step === 'bot'))
  return undefined;`. `paused` is in the effect's dependency list, so opening the dialog runs the previous
  cleanup (clears the bot timer and sets `cancelled`).
- Cancel (button, Escape, or any `close` event): close the prompt and focus the Leave table button through
  `leaveRef` (A-3). The effect re-runs and the same bot turn is requested again (A-2).
- Confirm: close the prompt, then `leave()`. That calls `setLeaving(true)` and
  `setTable((t) => foldUserToLeave(t))`, both from the click handler (no setState inside an effect).
  - `nextHandDelay(table, holdNextHand || leaving)`: no next deal while leaving.
  - In the play-loop effect, when `leaving && step === 'done'`, after the existing write block:
    `write.current.then(notify, notify)`, where `notify` calls `onLeft` through a ref, at most once per mount
    (ref guard), unless the effect was cleaned up (`cancelled`). `Table` passes
    `onLeft = () => onLeave(sessionId)`.
  - `rebuy` and `dealNext` return early while leaving. The guard is in the hook's callbacks (read through a
    ref).
- `handRecord` writes `forcedFold: true` iff, with `made` = the user's non-blind entries in `hand.actions`,
  `made.length === hand.userDecisions.length + 1` and `made.at(-1).type === 'fold'`. Otherwise the field is
  left out entirely (no `undefined` key).
- `parseHandRecord`: if `forcedFold` is present and not exactly `true` → `Invalid hand record: forcedFold`. The
  expected count is `decisions.length + (forcedFold ? 1 : 0)`, else `Invalid hand record: decisions`. When
  `true`, the last made action must be a `fold`, else `Invalid hand record: forcedFold`. Decision i is still
  checked against made action i for i < decisions.length.
- Worked examples (states from `tests/support/table-scenarios.ts`, checked against the current engine):
  - `userTableAfter(REVIEW_DECK, '3:fold 4:fold 5:call')`: seat 6 to act, 5 actions, user stack $156, 1 user
    decision. `foldUserToLeave` → seat 6 still to act, 6 actions, last
    `{ street: 'preflop', seat: 5, type: 'fold', amount: 0, added: 0 }`, user `folded`, stack $156, still
    1 decision.
  - `userTableAfter(REVIEW_DECK, '3:fold 4:fold 5:call 6:fold 1:fold')`: seat 2 (BB) to act, user and seat 2
    left. `forceFold(hand, 5)` → `result.endedBy 'fold'`, awards `[{ pot: 0, amount: 10, winners: [{ seat: 2,
    amount: 10 }] }]`, seat 2 stack $166, `toAct` null.
  - `SIDE_POT_RIVER` (river, Ava seat 1 to act; pots main $60 {1,2,5}, side $80 {1,2}; user all-in):
    `forceFold(hand, 2)` (Ben, not to act) → betting is over (only Ava can bet), so showdown: `endedBy
    'showdown'`, main pot $60 to seat 5 (A♥A♠ vs Ava's Q♥Q♠), side pot $80 to seat 1 (sole eligible seat).
    `foldUserToLeave({ ...SIDE_POT_RIVER, handNumber: 25 })` returns the same object (user all-in).

### Error handling and configuration
- `forceFold` throws `RangeError` as above. `foldUserToLeave` never throws: it checks first and returns
  `table` unchanged.
- Bot-decision failures while leaving behave as today (the updater rethrows). Write failure: A-6.
- No configuration, no new dependency, no new network request.

## 6. Behaviour specification

### SPEC-01: forceFold folds a seat that is not to act and keeps the turn
- Verifies: AC#7, DoD#1, DoD#6
- Behaviour: Given `userTableAfter(REVIEW_DECK, '3:fold 4:fold 5:call').hand` (seat 6 to act), When
  `forceFold(hand, 5)`, Then `toAct` is 6, `actions.length` is 6 and the last action is
  `{ street: 'preflop', seat: 5, type: 'fold', amount: 0, added: 0 }`. Seat 5 has `folded: true`, stack 156
  and `streetContribution` 4. `checkState(result)` is `[]`, and the input state is unchanged (deep-equal to a
  `structuredClone` taken before).
- Verification: acceptance `tests/engine/force-fold.acceptance.test.ts::forceFold folds a seat that is not to act and keeps the turn`

### SPEC-02: forceFold settles the hand like a fold through applyAction
- Verifies: AC#3, DoD#1, DoD#4, DoD#6
- Behaviour: (a) Given the BB-left example of §5, When `forceFold(hand, 5)`, Then the hand ends by fold with
  seat 2 winning the $10 pot (stack 166, `toAct` null). (b) Given `SIDE_POT_RIVER.hand`, When
  `forceFold(hand, 2)`, Then `result.endedBy` is `'showdown'`, award 0 is $60 to seat 5 and award 1 is $80 to
  seat 1, and `checkState` is `[]`. (c) Given a seat to act that could check (`userTableAfter(REVIEW_DECK,
  '3:fold 4:fold 5:call 6:fold 1:call').hand`, seat 2, the big blind, to act with a check), When `forceFold(hand, 2)`, Then seat
  2 is folded and the preflop round closes as after any closing action: `street` is `'flop'` with 3 board
  cards, `toAct` is 1, and `pots` is `[{ amount: 12, eligible: [1, 5] }]`. (d) A
  seeded sweep of 500 hands (`createHand` + `shuffledDeck(replayCodeFromWords([i, 1, 2, 3]))`, six seats at
  $160, button 6). Each hand is played with `checkOrCall` for `i % 8` actions (or until it ends). At the first
  later state where a seat that is not to act holds cards and is not all-in, the lowest such seat is
  force-folded, and the hand is played out with `checkOrCall`. If no such state comes, the hand is just played
  out. Then
  `checkState` is `[]` after every step, chips are conserved (sum of final stacks = 960), and each hand ends
  with a result.
- Verification: acceptance `tests/engine/force-fold.acceptance.test.ts::forceFold settles the hand like a fold through applyAction`

### SPEC-03: forceFold rejects seats that cannot fold
- Verifies: AC#5, DoD#1
- Behaviour: Given `SIDE_POT_RIVER.hand`, When `forceFold(hand, 5)` (all-in), `forceFold(hand, 3)`
  (folded), `forceFold(hand, 7)` (not dealt in), or `forceFold(SIDE_POT_SHOWDOWN.hand, 1)` (complete), Then each
  throws `RangeError` with a message starting `Cannot force a fold`.
- Verification: unit `tests/engine/force-fold.acceptance.test.ts::forceFold rejects seats that cannot fold`

### SPEC-04: Only a hand in progress asks, and the user's fold is not a decision
- Verifies: AC#1, AC#7, AC#9, DoD#1
- Behaviour: `handInProgress` is false for `seatSession()` (before the deal) and for `KINGS_SHOWDOWN` (result
  shown). It is true for `SEAT_1_DEALT` (dealt) and for the `'3:fold 4:fold 5:call'` state (bot to act).
  `foldUserToLeave` on the bot-to-act state gives the SPEC-01 hand with `userDecisions` unchanged (length 1, the
  call). On `KINGS_SHOWDOWN`, on `seatSession()` and on `SIDE_POT_RIVER` it returns the same object (`toBe`).
- Verification: acceptance `tests/table/leave-mid-hand.acceptance.test.ts::only a hand in progress asks and the forced fold is not a decision`

### SPEC-05: The left hand is recorded like any completed hand, with forcedFold and no graded fold
- Verifies: AC#3, AC#4, AC#8, DoD#1
- Behaviour: Given `t = { ...userTableAfter(REVIEW_DECK, '3:fold 4:fold 5:call'), handNumber: 25 }`, When
  `foldUserToLeave(t)` is followed by bot steps (`stepBot` with the default policy) until `nextStep` is
  `'done'`, and `handWrite(table, meta)` (no `decisions` argument: grades the user's decisions in-process) is
  called. Then `record.handNumber` is 25, `record.forcedFold` is `true`, and `record.decisions` has length 1 with
  `action.type 'call'` (no entry for the fold). The user's last non-blind action is `fold`.
  `parseHandRecord(structuredClone(record))` returns it. `session.handsPlayed` is 25, and
  `sessionReport(session, new Date(...)).handsPlayed` is 25. A hand without a forced fold (`REVIEW_FOUR`) gives
  a record with no `forcedFold` key (`'forcedFold' in record` is false).
- Verification: acceptance `tests/table/leave-mid-hand.acceptance.test.ts::the left hand is recorded with forcedFold and no graded fold`

### SPEC-06: parseHandRecord accepts only a well-formed forcedFold
- Verifies: AC#8, DoD#1
- Behaviour: Starting from the SPEC-05 record, Then each of these throws `RangeError`:
  - `forcedFold: false` → `Invalid hand record: forcedFold`.
  - `forcedFold` removed → `Invalid hand record: decisions`.
  - The final fold record's type changed to `check` → `Invalid hand record: forcedFold`.
  - A copy of the call decision appended to `decisions` → `Invalid hand record: decisions`.

  Every record built by the existing scenario tables (`REVIEW_FOUR`, `CALL_THEN_FOLD`, `KINGS_SHOWDOWN`) still
  parses.
- Verification: unit `tests/table/leave-mid-hand.acceptance.test.ts::parseHandRecord accepts only a well-formed forcedFold`

### SPEC-07: Leaving while all-in keeps the user's cards in and pays what the user wins
- Verifies: AC#5, DoD#1
- Behaviour: Given `t = { ...SIDE_POT_RIVER, handNumber: 25 }` (user all-in for $20), When
  `foldUserToLeave(t)` (the same object), then `play(hand, '1:check 2:check')`, Then the result has seat 5 in
  `result.showdown` and wins the $60 main pot. `handWrite` gives a record with no `forcedFold` key and a session
  record whose user stack is 60. `sessionReport(session, endedAt).cash` has `finalStack` 60, `result` −100
  (60 − 160) and `bbPer100` −50.
- Verification: acceptance `tests/table/leave-mid-hand.acceptance.test.ts::leaving while all-in keeps the cards in and pays the win`

### SPEC-08: Leave dialog markup and leaving-state table
- Verifies: AC#1, AC#9, DoD#7
- Behaviour: `renderToString(<LeaveDialog onConfirm={noop} onCancel={noop} />)` contains
  `<dialog class="leave-dialog" aria-labelledby="leave-heading">` and
  `<h2 id="leave-heading">Leave now? Your hand will be folded.</h2>`. Its buttons, in order, are
  `Cancel` (class `leave-cancel`) and `Confirm` (class `leave-confirm`). `TableView` on `SEAT_1_DEALT`:
  - With `leavePrompt` it renders exactly one `<dialog`.
  - Without `leavePrompt` it renders none, and the header still contains exactly
    `<button type="button" class="table-leave">Leave table</button>`.
  - With `leaving` the header Home and Leave table buttons carry `disabled=""`.
  - With `leaving` and the cash user busted (`withFinalStacks` with user 0), no `bust-dialog` is rendered.
- Verification: acceptance `tests/ui/leave-dialog.acceptance.test.tsx::the leave dialog and the leaving table render as specified`

### SPEC-09: The dialog opens mid-hand and freezes the table (live app)
- Verifies: AC#1, AC#9, DoD#7, DoD#8
- Behaviour: Setup:
  - Paused clock and `stubReplayWords([0x9e3779b9, 1, 2, 3])`.
  - A seeded session `sessionRecord({ ...seatSession(DEFAULT_SESSION_CONFIG), handNumber: 25 }, …)`, resumed
    (Home shows `Cash · 6 players · $4/$8 · 24 hands · paused`).
  - `runUntilMyTurn` in hand 25. The user is at seat 5 with button 6, so the user always gets a preflop turn.

  When `Leave table` is clicked, Then:
  - The dialog named `Leave now? Your hand will be folded.` is visible and modal (`el.matches(':modal')`).
  - Its buttons are `['Cancel', 'Confirm']`, and `Cancel` is focused.
  - The table section is still present and no `main[aria-busy="true"]` exists.
  - After `page.clock.runFor(5000)`: `data-action-count` and the To act seat (5) are unchanged, the stored
    session has no `endedAt`, and `storedReports` is `[]`.
  - axe reports zero serious or critical violations with the dialog open (`axeWithPausedClock`).
  - Every request is to the app's origin.
- Verification: acceptance `e2e/leave-mid-hand.spec.ts::Leave table during a hand asks first and nothing moves while the dialog is open`

### SPEC-10: Cancel resumes the hand unchanged
- Verifies: AC#2, DoD#7
- Behaviour: Given the SPEC-09 setup with the dialog open, record the text of `[aria-label="Your cards"]`, the
  user's `[data-part="stack"]`, `data-action-count` and the To act seat. When `Cancel` is clicked, Then:
  - The dialog is hidden, the four values are equal, and `Leave table` is focused.
  - The user's `Call…` button is enabled, and clicking it raises `data-action-count` by 1.
  - Escape on a reopened dialog closes it the same way.
  - Second case: with seat 6 to act (after the user's Call, clock not advanced), open the dialog, Cancel,
    then `runUntil` the action count grows. The next action is seat 6's (its `data-part="action"` is no
    longer empty or `Waiting`).
- Verification: acceptance `e2e/leave-mid-hand.spec.ts::Cancel resumes the hand with the same cards, stack and player to act`

### SPEC-11: Confirm while a bot is to act folds the user at once and ends after hand 25
- Verifies: AC#3, AC#4, AC#7, AC#8, DoD#7
- Behaviour: Given the SPEC-09 setup, the user clicks `Call…`. Seat 6 is now to act (`expectToAct(page, '6')`,
  clock not advanced). Let `n` be `data-action-count`. When `Leave table` and `Confirm` are clicked:
  - At once, before any clock advance: the user's seat action reads `Folded`, seat 6 is still to act, and
    `data-action-count` is `n + 1`.
  - Then `runUntil` the h1 `Session report` is visible. It is focused, and the report line reads
    `Cash · 6 players · $4/$8 · 25 hands`.
  - No hand 26 was dealt or stored: `storedRecords` hand numbers are `[25]`.
  - Record 25 has `forcedFold: true` and `decisions.length` 1 with `action.type` `'call'`. In its `actions`,
    the first seat-5 `fold` comes right after the user's call.
  - The stored session has `handsPlayed` 25 and an ISO `endedAt`. `storedReports` has one report with
    `handsPlayed` 25.
  - After `page.clock.runFor(5000)` there is still no table header.
- Verification: acceptance `e2e/leave-mid-hand.spec.ts::Confirm while a bot is to act folds the user at once and ends after hand 25`

### SPEC-12: Confirm on the user's turn during hand 1 of a new cash game shows a 1-hand report
- Verifies: AC#3, AC#6, AC#9, DoD#7
- Behaviour: Given a paused clock, `stubReplayWords([0x9e3779b9, 1, 2, 3])` (the user acts in hand 1 under
  this code, as `e2e/table-display.spec.ts:197` pins), the default game started from Game Config and
  `runUntilMyTurn` with the header at `Hand #1`,
  When `Leave table` then `Confirm`, Then:
  - The user's seat reads `Folded` at once.
  - After `runUntil` the h1 `Session report` is visible, it is focused, and the line reads
    `Cash · 6 players · $4/$8 · 1 hand`.
  - `storedRecords` hand numbers are `[1]` with `forcedFold: true` and `decisions` `[]`.
  - `storedReports` has one report with `handsPlayed` 1.
- Verification: acceptance `e2e/leave-mid-hand.spec.ts::Confirm during hand 1 of a cash game stores and shows a 1-hand report`

### SPEC-13: The leave dialog is in the screen list and the play-money walk
- Verifies: AC#1, DoD#7, DoD#8
- Behaviour: `SCREEN_LIST` has `leave-dialog` (component `LeaveDialog`). The screen-list test finds dialogs
  `['BustDialog', 'EndSessionDialog', 'LeaveDialog']` with nothing unlisted. The play-money walk visits
  `leave-dialog` during hand 14 (D-5 (2)) and still ends at the Session report, with no unvisited entry.
- Verification: acceptance `e2e/play-money.spec.ts::every listed screen and dialog shows only play money`

### SPEC-14: Locked test from TASK-3.3 follows the new flow
- Verifies: AC#4, AC#6, DoD#7
- Behaviour: D-5 (3). With a real clock and the user to act in hand 1: `Leave table`, then `Confirm`. Then
  the `Session report` h1 is focused, the line reads `Cash · 6 players · $4/$8 · 1 hand`, the table is gone,
  and after 1000 ms exactly one replay code has been drawn (no hand 2).
- Verification: acceptance `e2e/table-display.spec.ts::the header shows the session and Leave table during hand 1 ends it after that hand`

### SPEC-15: Checks, boundaries and documentation
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#6, DoD#9, DoD#10, DoD#11, DoD#12
- Behaviour: These all pass:
  - Lint, typecheck and the full unit suite.
  - The golden suite at 100 %.
  - Coverage holds. `forceFold` is covered by SPEC-01..03, and the hand-record branches by SPEC-05/06.
  - `src/engine/hand.ts` and `src/table/session.ts` import nothing from `src/ui` or browser APIs.
  - The 10,000-hand playtest reports 0 invariant violations (`applyAction` is unchanged in behaviour).
  - CI is green on the branch.

  No strategy content (DoD#9 N/A) and no service worker yet (DoD#12 N/A). `docs/ui/navigation.md` and
  `docs/storage/hand-records.md` describe the behaviour and are published to Backlog.md.
- Verification: command `npm run lint && npm run typecheck && npm test && npx vitest run tests/golden/ && npm run -s playtest -- --hands 10000 --seed 42 && npx playwright test`

## 7. Edge cases
- Before the deal / result showing: no dialog, direct leave (A-1). Covered by the existing locked
  `e2e/session-report.spec.ts` tests:
  - Line 85: leave on Hand over.
  - Line 141: leave with the review open.
  - Lines 173 and 211: leave right after Resume under a paused clock, before the deal timer runs. These stay
    pre-deal and need no edit.
- Leave in the microtask where Hand over first renders: step is `'done'`, so it leaves directly (A-7, locked
  `e2e/session-end-order.spec.ts`).
- Other existing tests that click Leave table:
  - `e2e/players-choice.spec.ts:142` (owner TASK-2.2) runs under a paused clock and never advances it before
    Leave table, so hand 1 is not dealt and the leave is direct. Expected unchanged.
  - `e2e/hand-records.spec.ts:236` (owner TASK-3.9) now opens the dialog during hand 2 (`advanceToHand` returns
    once hand 2 is dealt). Its later assertions (1001 stored, old records intact) still hold with the dialog
    open. Expected unchanged.
  - If either fails in the build, the fix is to `Confirm` and expect the report. Record it as a locked edit
    with the owner named.
- `e2e/table.spec.ts` `BUTTON_NAME` and `getByRole('dialog')` count probes: the dialog exists only while
  prompted (D-4), and none of those tests open it.
- User all-in: no fold, cards stay in to showdown (SPEC-03, SPEC-07). User already folded: A-5.
- Bot to act at confirm: SPEC-01, SPEC-11. Forced fold leaves one player: SPEC-02 (a). Forced fold ends the
  betting: SPEC-02 (b).
- Losing all-in leaves the cash user busted: no bust dialog and no Rebuy while leaving (A-4, SPEC-08).
- Second click on Leave table or Home while leaving: disabled (A-4). Browser Back while leaving or with the
  dialog open: App's popstate goes Home as today (the Table unmounts, the hand is abandoned, the session stays
  paused). This is REQ-004.9's Home path, and its write is not affected.
- A bot reply arriving while the dialog is open: dropped by the effect cleanup and requested again afterwards
  (A-2). A reply for an old turn after confirm: dropped by `applyBotDecision`'s `table.hand !== turn.hand`
  check (`session.ts:653`).
- Write failure on the leaving hand: A-6.
- Sit-and-go: the same mechanics. `sitAndGoStopped` only gates the next deal, and none is dealt while leaving.

## 8. Security considerations
- Trust boundary: stored hand records read from IndexedDB. `parseHandRecord` validates the new `forcedFold`
  field strictly (exactly `true` or absent, consistent with `actions` / `decisions`) (SPEC-06).
- No new dependency, no network, no randomness: the forced fold draws nothing. Bot seeds stay
  `botDecisionSeed(replayCode, view)`.
- No sensitive data in logs (only the existing "Hand record could not be saved").

## 9. Non-functional
- No artificial delay. After Confirm the play-out runs at the session's Rapid pace (`botActionDelayMs` 0)
  plus worker replies. The report opens as soon as the hand's write settles (TASK-10.1 path).
- The SPEC-02 (d) sweep of 500 hands runs in under 2 s in the normal suite: correctness, not speed, so not
  opt-in slow.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`. Start a game, choose Leave table while bots or you are to act, Cancel, then
  Leave table and Confirm, and read the Session report.
- New tests (path → SPEC ids):
  - `tests/engine/force-fold.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03
  - `tests/table/leave-mid-hand.acceptance.test.ts` → SPEC-04, SPEC-05, SPEC-06, SPEC-07
  - `tests/ui/leave-dialog.acceptance.test.tsx` → SPEC-08
  - `e2e/leave-mid-hand.spec.ts` → SPEC-09, SPEC-10, SPEC-11, SPEC-12
  - Locked edits: `tests/ui/screen-list.acceptance.test.ts` and `e2e/play-money.spec.ts` (TASK-2.15) →
    SPEC-13. `e2e/table-display.spec.ts` (TASK-3.3) → SPEC-14.
- End-to-end for the Judge: `npx playwright test e2e/leave-mid-hand.spec.ts e2e/play-money.spec.ts
  e2e/table-display.spec.ts e2e/session-report.spec.ts e2e/session-end-order.spec.ts e2e/players-choice.spec.ts
  e2e/hand-records.spec.ts e2e/rebuy.spec.ts e2e/bust-continue.spec.ts`. Then manually: `npm run dev`, play to
  hand 3, choose Leave table on your turn, Cancel (play continues), act, choose Leave table while a bot is to
  act, Confirm. Your seat reads Folded at once, the hand finishes, and the report shows 3 hands. Reload: no
  Resume.

## 11. Open questions
None. Q-1 (record format) is answered in `doit/TASK-10.2/qa.md`: optional top-level `forcedFold: true` (D-2).

## 12. Clarifications log
See `doit/TASK-10.2/qa.md`.
