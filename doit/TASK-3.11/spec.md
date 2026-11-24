# Spec: TASK-3.11 — Rebuy or leave when my stack runs out

Status: READY (approved 2026-11-24)
Task: TASK-3.11 · Parent/epic: TASK-3 · Requirements: REQ-007 (REQ-007.1, REQ-007.2, REQ-007.3, REQ-007.4) · Dream: limit-holdem-trainer

## 1. Summary
In a cash game, when a hand ends with the user's stack at $0, the Table shows a modal Rebuy / Leave table
dialog and stops dealing until the user chooses. Rebuy sets the user's stack to the buy-in (20 big bets, $160 at
$4/$8), adds 1 to the session's `rebuys` count and deals the next hand. Leave table takes the existing Leave
table path, which goes Home and leaves the session paused. Ending the session and the Session Report come with
E10. The user's $0 seat is no longer topped up by the temporary short-stack rule, and the session record can now
store it (D-1), so a busted session that is left and later resumed opens the dialog again. No rebuy or add-chips
control exists while the user has $1 or more.

## 2. Scope
- In scope:
  - `src/table/session.ts` (headless): `TableState.rebuys`. `userBusted(table)` and `rebuy(table)`. A new
    `'rebuy'` value of `NextStep`. `nextHandDelay` returns null on a bust. `nextHand` carries a cash user's $0
    instead of topping it up.
  - `src/table/session-record.ts`: `rebuys` is written from `TableState.rebuys` and restored from it, with a
    `MAX_SESSION_COUNT` cap. A cash record may hold the user seat at stack 0 (D-1).
  - `src/ui/table/useTableSession.ts`: a `rebuy()` action. `dealNext()` does not deal on a bust.
  - `src/ui/table/BustDialog.tsx` (new), `src/ui/table/Table.tsx`, `src/ui/styles.css`: the dialog.
  - Tests: headless acceptance and unit tests, a render test, and one every-push Playwright spec (Chromium and
    WebKit, with axe). `tests/support/table-scenarios.ts` gets `rebuys: 0`. The user-at-$0 expectation in
    `tests/table/next-hand.test.ts:100-107` (unit, not locked) is re-pinned to the new rule (the user on $0
    stays at $0 and no hand is dealt): only the expected values change; the number of checks stays the same.
  - Docs: `docs/storage/sessions.md` (the `rebuys` field, the user's $0 stack, the bust state) and
    `docs/ui/navigation.md` (Leave table in the dialog).
- Not doing:
  - Removing the TEMPORARY top-up (TASK-3.21). A user who ends a hand with $1–$95 is still topped up to $160, and
    a sit-and-go seat still gets the 800 top-up. The comment and the `< minimum ? buyIn(` line stay unchanged,
    because `tests/table/next-hand.acceptance.test.ts:102-112` pins them. The new $0 branch goes before them.
  - The review panel's "Continue" label (TASK-9.2, REQ-007.6). See A-3 for how Deal next hand behaves on a bust
    here.
  - Ending the session, `endedAt`, the Leave-now dialog and the Session Report, including showing the rebuy count
    in the result (E10, TASK-10.1). Leave table in the dialog only pauses to Home, as the header's Leave table
    does today.
  - Sit-and-go busts (E05). `userBusted` is false in a sit-and-go.
  - Any change to the engine, bots, advice or stats, and no database version bump.
- Scope budget: files=16, lines=950

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | A rebuy is stored only with the next completed hand's write (`handWrite` → `sessionRecord(nextHand(t))` carries `table.rebuys`). Clicking Rebuy writes nothing. If the app closes or the user goes Home after Rebuy but before that hand completes, the stored record still says $0 with the old count. Resume then shows the dialog again, and a second Rebuy counts once. | yes | AC#3 reads the count "after the next completed hand". The single-transaction rule of TASK-3.10 D-2 (hand and session together) stays intact. A rebuy can never be counted without a hand played on it. | Put the session record at Rebuy, which needs a second write path and its own failure handling. |
| A-2 | Rebuy deals the next hand right away, through the same path as Deal next hand (after the bust hand's write has settled, with a new replay code). There is no 1.5 s pause. If that write failed, Rebuy does nothing, because a failed write deals nothing more (TASK-3.10 D-2). | yes | AC#2 says "the next hand is dealt". The 1.5 s pause (REQ-024.3) is the pause between a result and an automatic deal, and this deal is a user choice. | Rebuy, then the 1.5 s auto-deal timer. |
| A-3 | When the Hand Review panel is held on a bust, the dialog is not shown while the review is held (`review !== null`). Deal next hand clears the review and does not deal (`dealNext` is a no-op on a bust), so the dialog appears. The control keeps the label "Deal next hand" until TASK-9.2 relabels it Continue. | yes | A modal over the review would block reading it, against the intent of REQ-007.6. Dealing would throw on a $0 stack. This is the smallest behaviour that is safe and leaves TASK-9.2 only the label. | Show the dialog over the review at once, and let TASK-9.2 change it. |
| A-4 | The dialog is a native `<dialog>` opened with `showModal()` in an effect. It is labelled by its heading, and Rebuy comes first so it gets initial focus. The page behind it is inert, including the header's Home and Leave table. Escape is ignored (the `cancel` event's default is prevented), so the only ways out are Rebuy, Leave table and browser Back (pause to Home, TASK-2.14 D-2). The buttons are native `<button type="button">`s at least 44 px high, with Rebuy styled like `.deal-next` and Leave table like `.table-leave`. | yes | This is the first dialog in the app. A native modal gives focus handling and inertness for free in Chromium and WebKit. The node-environment render tests only read the markup. | `<div role="dialog" aria-modal="true">` with hand-written focus handling. |
| A-5 | `parseSessionRecord` caps `rebuys` at `MAX_SESSION_COUNT` (`Invalid session record: rebuys`), like the other counters (TASK-2.14 AC#7). | yes | It keeps `rebuys + 1` a safe integer. A rebuy needs a completed bust hand, so a real count never exceeds `handsPlayed`. | No cap, or `rebuys <= handsPlayed`. |
| A-6 | The e2e spec sets up a bust by seeding a stored cash session (default 6-max seats, all TAG, `handsPlayed: 12`) in which the user has $4 and sits in the big blind for the next hand. It resumes that session and pins the replay code with `stubReplayWords` to words for which a bot wins and the user ends on $0. The headless acceptance test proves those words bust the user (see SPEC-04). | yes | With the TEMPORARY top-up in place (TASK-3.21), live play can bust the user only from exactly $96, after capping all four streets. A seeded short stack is the only quick, deterministic way to bust in a browser. | An opt-in slow spec that plays until a bust. |

## 3. Current system
- Toolchain: strict TypeScript, React 19 under StrictMode, Vite, Vitest in the node environment with v8 coverage.
  UI tests use `renderToString`. Playwright runs Chromium and WebKit with axe (`package.json:9-31`,
  `playwright.config.ts:13-16`, `vite.config.ts:8-19`). Table code needs 90% line coverage.
- Buy-in: `buyIn(stake) = 20 × bigBet` (`src/table/session.ts:51-54`). Cash seats start with it
  (`startingStack`, `:133-136`).
- `nextHand` (`src/table/session.ts:474-520`) replaces a cash bot on $0 (`:484-497`). Every other seat goes
  through the TEMPORARY top-up (`:498-503`), so the user on $0 is topped up to $160 today. The engine accepts any
  stack of at least 1 and rejects 0 (`src/engine/hand.ts:196-201`). `minimumStack` is 96 at $4/$8
  (`:137-139`), and it is now used only by that top-up.
- `nextStep` (`:421-426`) returns `deal | bot | user | done`. `nextHandDelay` (`:454-456`) gates the automatic
  deal. `useTableSession` deals on `'deal'` (`src/ui/table/useTableSession.ts:130-137`). After a done hand it
  writes and then deals `dealHand(nextHand(t))` after the delay (`:160-197`). `dealNext` (`:207-215`) does the
  same for the review's Deal next hand.
- Session record: `rebuys` is hard-coded to 0 (`src/table/session-record.ts:48,110`) and parsed as a whole number
  ≥ 0 with no cap (`:177`). Every seat's stack goes through `assertChips`, which needs at least 1
  (`:206-210`). `restoreSession` (`:216-236`) has no rebuys yet. `handWrite` stores `sessionRecord(nextHand(t))`
  (`:119-135`).
- Table UI: `TableView` (`src/ui/table/Table.tsx:148-231`) shows the result (`role="status"`) and Deal next hand
  while a review is held (`:215-219`). `Table` holds the review with `holdNextHand` (`:245-270`). Leave table
  calls `onLeave`, which is App's `goHome` (`src/ui/App.tsx:76-82,125`). The app has no dialog yet.
- Locked tests from earlier stories that this story must keep green unchanged:
  `tests/ui/table.acceptance.test.tsx:30-33` (seated table: exactly one button),
  `tests/table/next-hand.acceptance.test.ts:88-113` (TEMPORARY marker and the top-up line),
  `tests/table/session-restore.acceptance.test.ts:105-123` (a bot seat's 0 stack is still rejected).
- Existing code to reuse:
  - `tests/support/table-scenarios.ts:161-173` → `KINGS_SHOWDOWN` and `withFinalStacks([...])` give a finished
    hand with any final stacks (user = index 4, seat 5).
  - `tests/table/replace-bot.acceptance.test.ts:21-24` → the `finishedWith` pattern for a second finished hand
    after `dealHand`.
  - `src/storage/hand-store.ts:53` `openHandStore(new IDBFactory())` with `fake-indexeddb` → a stored-record
    round trip.
  - `e2e/support/hand-records.ts:56-90,128-160` → `seedStoredSessions`, `storedRecords`, `storedSessions`,
    `handOver`, `header`, `playToResult`. `e2e/support/paused-clock.ts` → `runUntil`, `axeWithPausedClock`.
    `e2e/support/table-harness-bundle.ts` → `stubReplayWords`. `e2e/home-control.spec.ts:40-120` → the flow of
    seeding a session, opening Home, Resume and the paused clock.
  - `src/table/session-record.ts:89` `sessionRecord(table, meta)` → builds the seeded record from a
    `seatSession` table with the user's stack set to $4.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | A cash session record may hold the **user** seat at stack 0, meaning "busted, waiting at Rebuy / Leave table". `parseSessionRecord` leaves that one seat out of `assertChips`. Bots, and every seat in a sit-and-go, still need at least 1. `restoreSession` returns the table with the user on $0, `nextStep` = `'rebuy'`, and Resume opens the dialog without dealing. Approved by Q-1 (qa.md: auto-accepted, recommended option). | (b) Write no session record for the bust hand: this breaks "handsPlayed = highest stored hand" (TASK-3.10). (c) Store $160 at the bust: this rebuys without the user's choice and gets the count wrong. (d) Treat a $0 record as invalid: Home would log it and hide Resume, so the session would be lost. | Persisted data format and user-visible Resume behaviour. Only (a) keeps the one-transaction write and makes "no hand until the user chooses" hold across a close or reload. | yes | user (Q-1) |
| D-2 | Dialog text: heading `Out of chips`, body `Your stack is $0. Rebuy for $160 to keep playing, or leave the table.` (the amount is `buyIn(config.stake)`, so `$40` at $1/$2… and `$400` at $10/$20), buttons `Rebuy` and `Leave table`. Approved by Q-2 (qa.md: auto-accepted, recommended option). | Heading `You're out of chips`; or a body without the amount; or a button `Rebuy $160`. | User-visible text with no storyboard (the storyboards have no bust dialog). The button labels are fixed by REQ-007.2 and AC#1. | yes | user (Q-2) |
| D-3 | Bust state is derived, not stored: `userBusted(table)` is true iff the game is cash and the user's chips are 0, which is the final stack of a finished hand, or `table.stacks` when no hand is dealt. Mid-hand it is always false, because an all-in user with $0 behind is not busted. | A `busted` flag in `TableState`. | One source of truth. It needs no new persisted field beyond D-1. | no | n/a |
| D-4 | `NextStep` gains `'rebuy'` (no hand, user busted). `dealHand` throws `RangeError('The user has no chips: rebuy first')` on it, and `nextHandDelay` returns null for a done hand that busted the user. | Only the UI checks. | REQ-007.2 ("no further hand is dealt") is enforced headless, so no timer or caller can deal past it. | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/session.ts` — `rebuys`, `userBusted`, `rebuy`, `'rebuy'` step, `nextHandDelay`, `dealHand` guard, `nextHand` $0 branch
- `src/table/session-record.ts` — write/restore `rebuys`, cap, user $0 in cash records
- `src/ui/table/useTableSession.ts` — `rebuy()` action; `dealNext` no-op on a bust
- `src/ui/table/BustDialog.tsx` — new: the Rebuy / Leave table dialog
- `src/ui/table/Table.tsx` — render the dialog; wire `onRebuy`
- `src/ui/styles.css` — dialog and backdrop styles
- `tests/support/table-scenarios.ts` — `rebuys: 0` in `tableAt`
- `tests/table/next-hand.test.ts` — re-pin the user-at-$0 case (`:100-107`) to stay at $0 with no hand dealt; replace the expected values only, keep the number of checks
- `tests/table/rebuy.acceptance.test.ts` — new headless acceptance (SPEC-01..05, 07)
- `tests/table/rebuy.test.ts` — new unit tests (SPEC-08, SPEC-09)
- `tests/ui/bust-dialog.acceptance.test.tsx` — new render test (SPEC-06, SPEC-10)
- `e2e/rebuy.spec.ts` — new every-push Playwright spec (SPEC-11..14)
- `docs/storage/sessions.md` — `rebuys`, user $0, bust state
- `docs/ui/navigation.md` — the dialog's Leave table

### Components, interfaces and data
- `TableState.rebuys: number`: the user's rebuys in this session. It is 0 from `seatSession`, set from
  `record.rebuys` by `restoreSession`, kept by `nextHand` and incremented only by `rebuy`.
- `export function userBusted(table: TableState): boolean`: `config.gameType === 'cash'` and either (hand done
  and the user's `hand.players[].stack === 0`) or (`hand === null` and the user's `stacks[].stack === 0`).
  Otherwise false.
- `export function rebuy(table: TableState): TableState`: requires `table.hand === null` and
  `userBusted(table)`. Otherwise it throws `RangeError('No rebuy: the user has chips')`. If a hand is dealt it
  throws `RangeError('No rebuy during a hand')`. It returns `{ ...table, stacks: <user> = buyIn(config.stake),
  rebuys: table.rebuys + 1 }` and leaves everything else unchanged.
- `NextStep = 'deal' | 'bot' | 'user' | 'done' | 'rebuy'`. `nextStep` returns `'rebuy'` when `hand === null` and
  `userBusted(table)`.
- `nextHandDelay(table, hold)`: null when `userBusted(table)`; otherwise as today.
- `dealHand`: throws `RangeError('The user has no chips: rebuy first')` when `nextStep === 'rebuy'`. The existing
  `'Not a deal step'` check covers the other steps.
- `nextHand`: in cash, a non-bot seat (the user) whose final stack is 0 is carried as `{ seat, stack: 0 }`, before
  the TEMPORARY line. Bots, sit-and-go seats and a user on $1–$95 are unchanged.
- `sessionRecord`: `rebuys: table.rebuys`. `SessionRecordSeat.stack` doc: "at least 1, except 0 for the user seat
  of a cash session waiting at Rebuy / Leave table (D-1)".
- `parseSessionRecord`: `whole(record.rebuys, 'rebuys', 0, MAX_SESSION_COUNT)`. `assertChips` runs over every
  seat except the user seat when the game is cash and its stack is `0`. A sit-and-go user on 0 and any bot on 0
  are still rejected with the engine's message.
- `useTableSession` returns `{ table, act, dealNext, rebuy }`. `rebuy()` waits for `write.current`, then with a
  fresh `newCode()` runs `setTable(t => userBusted(t) ? dealHand(rebuy(t.hand === null ? t : nextHand(t)), code)
  : t)`. A rejected write does nothing. `dealNext()` changes nothing when `userBusted(t)`.
- `BustDialog({ amount, onRebuy, onLeave })`: renders `<dialog className="bust-dialog"
  aria-labelledby="bust-heading">` with `<h2 id="bust-heading">Out of chips</h2>`, the body `<p>` and two buttons
  in order: `<button type="button" class="bust-rebuy">Rebuy</button>` and
  `<button type="button" class="bust-leave">Leave table</button>`. It calls `showModal()` in a layout effect if
  the dialog is not open, and prevents `cancel`.
- `TableViewProps.onRebuy?: () => void`. `TableView` renders `<BustDialog>` iff `userBusted(table) && review ===
  null`, after the layout `<div>`. `amount = buyIn(config.stake)`, and Leave table calls `onLeave`. `Table` passes
  `onRebuy={rebuy}` from the hook.

### Rules and algorithms
- At $4/$8: hand 12 ends with the user's final stack 0. Then `nextStep` = `'done'`, `userBusted` = true and
  `nextHandDelay` = null. `handWrite` stores record 12 and a session with `handsPlayed: 12`, the user's stack 0 and
  `rebuys: r`. The dialog is shown. Rebuy gives hand 13 with the user's `startingStack` 160, and
  `TableState.rebuys` becomes r + 1. When hand 13 completes, the stored session has `rebuys: r + 1`.
- Two rebuys: bust → Rebuy → hand completes → bust → Rebuy → next hand completes. The stored `rebuys` is 2
  (AC#3).
- Leave at the dialog: Home opens and nothing is written. The stored session is still hand 12's (user $0). Resume
  restores `nextStep` = `'rebuy'`, deals nothing and shows the dialog.
- A user on $1–$95 is still topped up to $160 (TEMPORARY, TASK-3.21). This is not a rebuy: `rebuys` is unchanged
  and no control is shown.

### Error handling and configuration
- New RangeErrors (headless, never caught in the UI): `'No rebuy: the user has chips'`, `'No rebuy during a
  hand'`, `'The user has no chips: rebuy first'`, and `'Invalid session record: rebuys'` (above the cap).
- No new configuration. The buy-in is always `buyIn(config.stake)` (REQ-007.1).

## 6. Behaviour specification

### SPEC-01: A cash hand that leaves the user on $0 deals nothing more
- Verifies: AC#1, DoD#1
- Behaviour: Given `withFinalStacks([160, 222, 160, 160, 0, 165])` (cash $4/$8, the user is seat 5), When the hand is
  done, Then `userBusted` is true, `nextHandDelay(t)` is null (also with `hold = false`), `nextHand(t)` keeps
  the user's stack 0 with the other seats as today, `nextStep(nextHand(t))` is `'rebuy'`, and
  `dealHand(nextHand(t), code)` throws `RangeError('The user has no chips: rebuy first')`. With the user's
  final stack at 1, or in a sit-and-go with the user on 0, `userBusted` is false and the old behaviour holds
  (`nextHandDelay` 1500).
- Verification: acceptance `tests/table/rebuy.acceptance.test.ts::a cash hand that leaves the user on $0 stops dealing until the user chooses`

### SPEC-02: Rebuy sets the stack to $160, deals and counts 1
- Verifies: AC#2, DoD#1
- Behaviour: Given the busted table from SPEC-01 after `nextHand`, When `rebuy` is applied, Then the user's
  stack is 160, every other stack, seat, button and hand number is unchanged, `rebuys` goes from 0 to 1, and
  `dealHand(…, code)` gives a hand whose user `startingStack` is 160. At $10/$20 the stack is 400.
- Verification: acceptance `tests/table/rebuy.acceptance.test.ts::rebuy sets the user to the buy-in, deals the next hand and counts one rebuy`

### SPEC-03: Two rebuys are stored as 2 after the next completed hand
- Verifies: AC#3, DoD#1
- Behaviour: Given a session that busts, rebuys, completes a hand, busts again and rebuys again, When the next
  hand completes and `handWrite` runs, and the result is stored with `openHandStore(new IDBFactory()).add` and
  read back with `getSession`, Then the record's `rebuys` is 2 and `restoreSession` gives `rebuys` 2. The
  record written for each bust hand has the user's stack 0 and the count from before that bust (0, then 1).
- Verification: acceptance `tests/table/rebuy.acceptance.test.ts::a user who rebought twice has rebuys 2 in the session record after the next completed hand`

### SPEC-04: A stored bust resumes into the dialog state (D-1)
- Verifies: AC#1, AC#4, DoD#1
- Behaviour: Given the session record written for a cash bust hand (user stack 0), When it is parsed and
  restored, Then `parseSessionRecord` accepts it, `restoreSession` gives the user stack 0 and `nextStep`
  `'rebuy'`, and `restoreSession(sessionRecord(nextHand(t)))` deep-equals `nextHand(t)`. A bot seat on 0, or the
  user on 0 in a sit-and-go record, is still rejected with `'Stack at seat <n> must be an integer of at least 1'`.
  The test also pins A-6's e2e precondition: from the seeded record, dealing with the pinned replay words and
  playing the bots by their styles ends with the user on $0.
- Verification: acceptance `tests/table/rebuy.acceptance.test.ts::a stored cash bust restores with the user on $0 waiting to rebuy`

### SPEC-05: No rebuy while the user has chips (headless)
- Verifies: AC#5, DoD#1
- Behaviour: Given any table where the user has $1 or more (seated, mid-hand, done with a final stack of 1 or
  95, after the TEMPORARY top-up), or any dealt hand, When `rebuy` is called, Then it throws
  `RangeError('No rebuy: the user has chips')` or `RangeError('No rebuy during a hand')`, and `rebuys` never
  changes. A top-up from $95 to $160 leaves `rebuys` at 0.
- Verification: acceptance `tests/table/rebuy.acceptance.test.ts::no rebuy is possible while the user has chips`

### SPEC-06: The dialog markup on a bust
- Verifies: AC#1, DoD#1
- Behaviour: Given `TableView` with the busted table (done, user on $0) and no review, When it is rendered, Then
  the markup contains one `<dialog class="bust-dialog" aria-labelledby="bust-heading">` with the heading
  `Out of chips`, the D-2 body with `$160`, and exactly two buttons in order, `Rebuy` and `Leave table`. The hand
  result `role="status"` is still rendered. With a held review (`review` non-null), no dialog is rendered and
  Deal next hand is shown. With the restored `'rebuy'` table (no hand), the dialog is rendered.
- Verification: acceptance `tests/ui/bust-dialog.acceptance.test.tsx::a bust shows the Rebuy and Leave table dialog over the result`

### SPEC-07: Deal next hand on a held bust review does not deal (A-3)
- Verifies: AC#1, DoD#1
- Behaviour: Given a done table with the user on $0, When the review's deal path runs (the hook's `dealNext`
  rule: no change when `userBusted`), Then the table is unchanged (`nextStep` still `'done'`), so clearing the
  review leaves the dialog shown and no hand dealt.
- Verification: acceptance `tests/table/rebuy.acceptance.test.ts::deal next hand on a bust deals nothing`

### SPEC-08: userBusted edge cases
- Verifies: AC#1, AC#5
- Behaviour: `userBusted` is false mid-hand even when the user is all-in with stack 0, false for a seated
  table, and false in a sit-and-go. It is true for a done cash hand with the user on 0 and for a `hand === null`
  cash table with the user's stack at 0.
- Verification: unit `tests/table/rebuy.test.ts::userBusted is true only for a cash user on $0 between hands`

### SPEC-09: rebuys cap and record fields
- Verifies: AC#3
- Behaviour: `parseSessionRecord` accepts `rebuys` 0..1,000,000,000. It rejects 1,000,000,001, -1, 1.5, `"2"`
  and `{}` with `Invalid session record: rebuys`. `sessionRecord` writes `table.rebuys`.
- Verification: unit `tests/table/rebuy.test.ts::rebuys is written from the table and capped at MAX_SESSION_COUNT`

### SPEC-10: No rebuy or add-chips control while the user has chips (render)
- Verifies: AC#5, DoD#1
- Behaviour: Given `TableView` rendered for every scripted table where the user has $1 or more (`seatSession()`,
  the storyboard states from `PREFLOP` to `SHOWDOWN`, `FLOP_BET`, `KINGS_SHOWDOWN`, `withFinalStacks` with the
  user on 1 and 95, a review held, a sit-and-go table with the user on 0), Then the markup has no `<dialog`, no
  `bust-` class and no button or text matching `/rebuy|add chips|top up|buy in/i`.
- Verification: acceptance `tests/ui/bust-dialog.acceptance.test.tsx::no rebuy or add-chips control while the user has chips`

### SPEC-11: Browser — bust shows the dialog and nothing is dealt after 1.5 s
- Verifies: AC#1, DoD#7, DoD#8
- Behaviour: Given the A-6 seeded session (user $4 in the big blind, hand 13 next) resumed from Home with the
  pinned replay words and a paused clock, When hand 13's result is shown, Then a modal dialog named `Out of
  chips` shows the buttons `Rebuy` and `Leave table`, the user's seat shows `$0`, and the dialog has focus on
  `Rebuy`. After `page.clock.runFor(5000)` the header still reads `Hand #13`, the hands store holds exactly
  one record, hand 13 (only the session record is seeded), and the stored session has `handsPlayed: 13`, the user's stack 0 and
  `rebuys: 0`. Pressing Escape leaves the dialog open. axe reports no serious or critical violations with the
  dialog open, and every request is same-origin.
- Verification: acceptance `e2e/rebuy.spec.ts::a bust opens the Rebuy and Leave table dialog and no hand is dealt after 1.5 s`

### SPEC-12: Browser — Rebuy gives $160, deals the next hand and stores rebuys 1
- Verifies: AC#2, AC#3, DoD#7
- Behaviour: Given the SPEC-11 dialog, When the user chooses Rebuy, Then the dialog closes, the header reads
  `Hand #14`, and the user's seat stack plus its `This street` amount equals $160. When hand 14 completes (the
  user folds at its first turn), the stored hand record 14 has the user's `startingStack` 160 and the stored
  session has `rebuys: 1`.
- Verification: acceptance `e2e/rebuy.spec.ts::Rebuy sets the stack to $160, deals the next hand and counts one rebuy`

### SPEC-13: Browser — Leave table closes the dialog and deals nothing; Resume shows it again
- Verifies: AC#4, DoD#7
- Behaviour: Given the SPEC-11 dialog (a fresh seeded context), When the user chooses Leave table in the dialog,
  Then Home is shown with focus on its heading and no dialog. After `page.clock.runFor(5000)` the hands store
  still holds only record 13 and the session record is byte-for-byte unchanged (no `endedAt`). When Resume session
  is chosen, the Table opens with the dialog shown, the header reads `Hand #14` and no hand is dealt after a
  further 5,000 ms of fake time.
- Verification: acceptance `e2e/rebuy.spec.ts::Leave table in the bust dialog deals nothing more and Resume reopens the dialog`

### SPEC-14: Browser — no rebuy control while the user has chips
- Verifies: AC#5, DoD#7
- Behaviour: Given a new default session (Start game), When the Table is shown at the user's first turn, at
  the hand result and after the next deal, Then `getByRole('button', { name: /rebuy|add chips/i })` and
  `getByRole('dialog')` both have count 0.
- Verification: acceptance `e2e/rebuy.spec.ts::no rebuy or add-chips control while the user has chips`

### SPEC-15: Repo checks, coverage, boundary, golden suite, playtest N/A
- Verifies: DoD#1, DoD#2, DoD#3, DoD#4, DoD#5, DoD#6
- Behaviour: `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors, including the locked tests
  listed in section 3. The golden-spot suite (part of `npm test`) passes 100%. Coverage holds (at least 90% for
  engine/bots/advice/stats/playtest/table, at least 70% overall). `src/table/session.ts` and
  `session-record.ts` import nothing from `src/ui` or `src/storage` (headless-boundary lint). DoD#6 is N/A: no
  engine, bot or advice change (`git diff --stat main -- src/engine src/bots src/advice` is empty).
- Verification: command `npm run lint && npm run typecheck && npm test && git diff --stat main -- src/engine src/bots src/advice`

### SPEC-16: Browsers, network, N/A items, CI
- Verifies: DoD#7, DoD#8, DoD#9, DoD#10, DoD#12
- Behaviour: The full Playwright suite (`npm run e2e`, Chromium and WebKit) passes. SPEC-11 asserts same-origin
  requests only. DoD#9 is N/A (no strategy content). DoD#12 is N/A (no service worker yet, E13-S07). CI is
  green on `doit/TASK-3.11`.
- Verification: command `npm run build && npm run e2e && gh run list --branch doit/TASK-3.11 --limit 1`

### SPEC-17: Documentation
- Verifies: DoD#11
- Behaviour: `docs/storage/sessions.md` changes as follows.
  - The `rebuys` row reads "integer 0..`MAX_SESSION_COUNT`: the user's rebuys, stored with the next completed
    hand (A-1)".
  - The seat entry notes the user's 0 stack in a cash bust (D-1).
  - "The state stored" says the user's $0 is carried, not topped up.
  - The validation list has the user-$0 exception and the `rebuys` cap.
  - Resume describes reopening the dialog.
  - The new tests are listed.

  `docs/ui/navigation.md` says that Leave table in the bust dialog pauses to Home like the header's Leave table.
  The story doc is published to Backlog.md by the doit docs step.
- Verification: manual read of `docs/storage/sessions.md` and `docs/ui/navigation.md` against this list; `backlog doc list --plain` shows the story doc

## 7. Edge cases
- Bot and user bust in the same hand: the bot is replaced as today and the user is carried at 0 (SPEC-01 uses a
  bot on 0 as well).
- An all-in user mid-hand with $0 behind: not busted (SPEC-08). The dialog appears only once the hand is done.
- A bust with the review held: A-3, SPEC-06, SPEC-07.
- Rebuy double-click: the second updater finds `userBusted` false and returns `t`. A second replay code is drawn
  and discarded, which is harmless. StrictMode's doubled updater is pure.
- Rebuy after a failed bust-hand write: nothing happens (A-2). Dealing had already stopped (TASK-3.10 D-2).
- Close, reload or Home at the dialog: the stored record holds the bust, and Resume reopens the dialog (D-1,
  SPEC-04, SPEC-13).
- Rebuy, then closing before the next hand completes: the count is not stored and the dialog returns on Resume
  (A-1).
- Browser Back at the dialog: pauses to Home like the header's Home control. Same outcome as SPEC-13.
- Sit-and-go user on 0: unchanged (TEMPORARY 800 top-up, E05/TASK-3.21). `userBusted` is false and no dialog is
  shown.
- Escape: ignored (A-4, SPEC-11).
- Other stakes: the amount and stack follow `buyIn(config.stake)` (SPEC-02 at $10/$20).

## 8. Security considerations
- Trust boundary: stored session values. The relaxed check allows exactly one value, `0`, on exactly the user
  seat of a cash record. Everything else still goes through `assertChips`. `rebuys` is capped (A-5) and checked
  with `Number.isSafeInteger`, never coerced. No restored state can reach `createHand` with a 0 stack, because
  `dealHand` refuses the `'rebuy'` step (D-4).
- No new dependency and no network (SPEC-11 asserts same-origin). No randomness is added. Rebuy uses the existing
  `newReplayCode` draw.
- Hidden information: unchanged. The dialog shows only the user's own stack and the buy-in.

## 9. Non-functional
- No perf test (standing rule: speed checks are opt-in, and nothing here is scale-sensitive).
- Every-push cost: one Playwright spec with about four short flows (each resumes a seeded session and plays one
  or two hands), about 15 s per browser. The new Vitest files are fast (well under 1 s).
- Coverage: `src/table/session.ts` and `session-record.ts` stay at or above 90%.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`. A live bust is rare until TASK-3.21 (A-6), so seed one. In DevTools → IndexedDB →
  `tlh-trainer` → `sessions`, edit the paused record's user seat `stack` to `4`. Then choose Resume and play
  (call) until a hand ends with the user on $0. The Out of chips dialog appears and no hand is dealt. Choose
  Rebuy and see the next hand with $160. Or choose Leave table, then Resume, and see the dialog again.
- New tests (path → SPEC ids):
  - `tests/table/rebuy.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05, SPEC-07
  - `tests/table/rebuy.test.ts` → SPEC-08, SPEC-09
  - `tests/ui/bust-dialog.acceptance.test.tsx` → SPEC-06, SPEC-10
  - `e2e/rebuy.spec.ts` → SPEC-11, SPEC-12, SPEC-13, SPEC-14
- Judge end-to-end scenario: `npm run build && npx playwright test e2e/rebuy.spec.ts`. Then the Run command
  steps with `npm run preview`. Check in DevTools that after Rebuy and one completed hand the `sessions` record
  shows `rebuys: 1`.

## 11. Open questions
None. Q-1 (D-1) and Q-2 (D-2) are answered in `doit/TASK-3.11/qa.md` (recommended options, auto-accepted;
both listed for review as a persisted-format change and user-visible copy).

## 12. Clarifications log
See `doit/TASK-3.11/qa.md`.
