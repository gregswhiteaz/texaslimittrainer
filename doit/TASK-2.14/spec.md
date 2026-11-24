# Spec: TASK-2.14 — Pause the session from the Table header Home control

Status: READY (approved 2026-11-24)
Task: TASK-2.14 · Parent/epic: TASK-2 · Requirements: REQ-004 (REQ-004.2, REQ-004.6, REQ-004.9) · Dream: limit-holdem-trainer

## 1. Summary
The Table header gets a Home control next to Leave table. Choosing it unmounts the Table and opens Home, where
the Resume session entry (TASK-2.6) shows the paused session. The session is never ended: no `endedAt` is
written and no report is created. Between hands nothing is lost. Mid-hand, the unfinished hand is dropped the
same way as closing the app, because only completed hands are ever written (TASK-3.10). The story also decides
how browser Back and Forward behave on Home, Game Config and the Table (AC#6), and caps `nextBotName` in
`parseSessionRecord` (AC#7, a TASK-2.6 security follow-up).

## 2. Scope
- In scope:
  - `src/ui/table/Table.tsx`: an optional `onHome` prop on `TableView` and `Table`. The `Home` button in the
    header is rendered only when `onHome` is given (D-1).
  - `src/ui/table/TableScreen.tsx`: passes `onHome` through.
  - `src/ui/table/useTableSession.ts`: a module-level `tableWritesSettled()`, so Home's read waits for any
    session or hand write that is still running (A-2).
  - `src/ui/App.tsx`: the Home control's handler, Home's read waiting on `tableWritesSettled()`, and the
    browser-history handling for D-2.
  - `src/ui/styles.css`: a `.table-header-actions` group and the Home button using the `.table-leave` look.
  - `src/table/session-record.ts`: `nextBotName` capped at `MAX_SESSION_COUNT` (AC#7).
  - Tests: one headless acceptance test for the cap, one render test for the header, two every-push Playwright
    specs (Chromium and WebKit, with axe), and a shared `axeWithPausedClock` helper in `e2e/support`.
  - Docs: `docs/storage/sessions.md` (the Home control, the `nextBotName` cap) and a new `docs/ui/navigation.md`
    (screens and browser Back/Forward, D-2).
- Not doing:
  - Leave table keeps its interim behaviour: it goes Home and the session stays paused (TASK-2.6 D-1). Ending a
    session, the Leave-now dialog (REQ-004.7/8) and the Session Report belong to E10 (TASK-10.1).
  - No Settings control in the header (REQ-050, E12). The header order leaves room for it (D-1).
  - No confirm dialog for New game while a session is paused (TASK-2.7). Nothing here changes how many paused
    sessions exist.
  - No URL routes, router library, hash fragments or deep links. The URL stays `/` on every screen.
  - No history entry for Game Config. The locked `e2e/home.spec.ts:196-211` requires `history.length` to stay
    the same across New game, then Cancel or ← Home (D-2).
  - No change to the engine, bots, advice or stats code, and no database version bump.
  - No caps on `rebuys` (not in the ACs; rebuys are always 0 until TASK-3.11).
- Scope budget: files=13, lines=900

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | "Pauses the session" needs no new write. The stored session record is already the paused state: it holds the state ready for the next hand after the last completed hand (TASK-3.10 D-3). Choosing Home writes nothing and the record stays byte-for-byte unchanged. An abandoned hand is dropped by unmounting the Table: its deal and bot timers are cleared and late worker replies are ignored (`src/ui/table/useTableSession.ts:113-143`), and no code path writes a hand in progress (`sessionRecord` throws on a dealt table, `src/table/session-record.ts:86`). | yes | This is exactly "as when the app is closed" (REQ-004.9). Rewriting the record would move `updatedAt`, which orders paused sessions (TASK-2.6 A-1). | Re-put the record with `updatedAt` = now. |
| A-2 | Home reads the paused session only after every table write that has been issued has settled. `useTableSession.ts` keeps a module-level chain of its start-record puts and hand writes, and `tableWritesSettled()` resolves once all of them have settled. It never rejects; a failed write is already logged. App's Home effect runs `tableWritesSettled().then(() => sharedHandStore().pausedSession())`. This covers the Home control, Leave table and browser Back alike. | yes | A hand's write is chained after the start-record put (`useTableSession.ts:154-156`). A Home click right after hand 1 or hand 10 completes could otherwise read the record from before that write and show 0 or 9 hands, even though the write commits a moment later. AC#1 needs exactly 10. | Await only in the Home control's handler. That would leave Back and Leave table racy. |
| A-3 | The control is a native `<button type="button" class="table-home">Home</button>`, the same size and look as Leave table (min-height 44 px, `1px solid #4A515C`, `#F2F3F5` text). Both buttons sit in a `<div class="table-header-actions">` (flex, 8 px gap, as in the storyboard's button group). After Home, focus moves to Home's `<h1>`, as it does after Leave table (`returned: true`, `src/ui/App.tsx:88`). | yes | The storyboard has no Home control. The header buttons there are 40 px `<a>`s styled like this (`dreams/limit-holdem-trainer/storyboards/Table.dc.html:22-25`). TASK-2.1 A-3 uses buttons of at least 44 px. | An icon-only house button with `aria-label="Home"`. |
| A-4 | AC#1–AC#5's "after hand 10" is set up in the browser by seeding records 1–9 and the session after hand 9 (from headless `playSession` + `handWrite`, as `e2e/resume.spec.ts:128-146` does). The user then resumes and plays hand 10 in the browser, so "between hands after hand 10" is a real completed hand at the real Table. Hand 11 is dealt in the browser and abandoned with the Home control. | yes | Ten real browser hands per browser would add about 40 s to every push (TASK-2.6 A-7). The rule does not depend on the hand count. | Play all 10 hands in the browser in an opt-in slow spec. |
| A-5 | AC#5's stats check runs in the e2e spec, in Node. The stored values are read with `storedRecords`, parsed with `parseHandRecord`, and compared seat by seat as `styleStats(styleCounts(records, seat))`, before hand 11 and again after it is abandoned. | yes | Stats are computed only from stored records (`src/stats/style-stats.ts:89,108`). Identical records give identical stats, and the record list is also compared directly. | A headless-only check (TASK-2.6 SPEC-05 already covers abandonment by closing). |
| A-6 | The `Home` button is rendered only when `onHome` is passed. App passes it. The e2e harnesses and the existing render tests do not, so their markup is unchanged. | yes | The locked `tests/ui/table.acceptance.test.tsx:30-33` expects exactly one button (Leave table) in `<Table/>` and `<TableScreen config/>`. The locked `e2e/table.spec.ts:18,155-158` allows only known button names on the harness table. | Always render it and edit two locked tests. |

## 3. Current system
- Toolchain: strict TypeScript, React 19 under `StrictMode` (`src/main.tsx:15-19`), Vite, Vitest in the node
  environment with v8 coverage (no DOM: UI tests use `renderToString`), and Playwright in Chromium and WebKit
  with axe (`package.json:9-31`, `playwright.config.ts:13-16`). Table code must stay at or above 90% coverage.
- Screens: `App` holds `home | config | table` in state. The comment at `src/ui/App.tsx:11` says screen changes
  add no history entries (TASK-2.1 A-2, follow-up F-3 assigned to this story). Leave table calls `onLeave`,
  which sets `{ name: 'home', returned: true }` (`src/ui/App.tsx:88`). Home's paused-session read is an effect
  keyed on `onHome` (`src/ui/App.tsx:24-45`). Resume restores the session and opens the Table with `resume`
  (`:47-61`).
- Header: `TableView` renders `<header class="table-header">` with the header line and one
  `<button type="button" class="table-leave">Leave table</button>` (`src/ui/table/Table.tsx:160-165`). Styles are at
  `src/ui/styles.css:321-349`.
- Table lifecycle: `useTableSession` clears deal and bot timers and drops worker replies on cleanup
  (`src/ui/table/useTableSession.ts:113-143`). It writes the start record at mount unless resumed (`:98-105`). It
  writes each completed hand with `handWrite` + `store.add(record, session)`, chained after the start write
  (`:144-161`). A hand in progress is never stored (`src/table/session-record.ts:86`, and `parseSessionRecord`
  rejects `hand`/`actions` at `:160-161`).
- Storage: `HandStore.add` awaits the database before it opens its readwrite transaction
  (`src/storage/hand-store.ts:59-69`), and `pausedSession` does one readonly `getAll` (`:80-83`). There are only two
  object stores, `hands` and `sessions` (`:7-8`), and no report store.
- Cap: `parseSessionRecord` bounds `handsPlayed` and `nextBotId` at `MAX_SESSION_COUNT` but `nextBotName` only at
  ≥ 0 (`src/table/session-record.ts:174-177`). `nextReplacementName` loops `p++` past seated names and
  `replacementName` throws on an unsafe position (`src/bots/lineup.ts:147-164`), which is the mid-session crash
  AC#7 names.
- Locked tests this story must keep passing unchanged:
  - `e2e/home.spec.ts:196-211`: `history.length` is unchanged across New game, then Cancel or ← Home.
  - `tests/ui/table.acceptance.test.tsx:30-33`: exactly one button in `<Table/>` and `<TableScreen config/>`.
  - `tests/ui/table-display.acceptance.test.tsx:224-231`: the header contains the Leave table button markup
    (`toContain`, so a wrapper div is fine).
  - `e2e/table.spec.ts:155-158`: the harness table allows only known button names (the harness passes no
    `onHome`, `e2e/support/table-harness.tsx:18`).
  - `e2e/resume.spec.ts`: Leave table → Home → `3 hands` (`:199-202`).
  - `e2e/table-display.spec.ts:195-210`: Leave table → Home with focus on the heading.
- Existing code to reuse:
  - `playSession`, `checkOrCall` (`tests/support/session-play.ts`) and `handWrite` → the seeded records 1–9 and
    the session after hand 9.
  - `seedStoredRecords`, `seedStoredSessions`, `storedRecords`, `storedSessions`, `advanceToHand`,
    `playToResult`, `header`, `handOver` (`e2e/support/hand-records.ts`) → the e2e specs.
  - `stubReplayWords`, `runUntilMyTurn`, `expectNoSeriousAxeViolations` → the e2e specs.
  - `useWorkerTimers`, `restorePausedTimers`, `axeWithPausedClock` (`e2e/resume.spec.ts:40-82`) → move copies into
    `e2e/support/paused-clock.ts` as exports for the new specs. `e2e/resume.spec.ts` is locked and keeps its own
    copies.
  - `parseHandRecord` (`src/table/hand-record.ts`), `styleCounts`, `styleStats` (`src/stats/style-stats.ts:89,108`)
    → AC#5.
  - `whole` and `MAX_SESSION_COUNT` (`src/table/session-record.ts:59,142`) → AC#7.
  - The `.table-leave` rule (`src/ui/styles.css:339-349`) → share it with `.table-home`. Do not copy it.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | A text button `Home` placed before Leave table in the header's button group (header order: `Home`, then later `Settings`, then `Leave table`). Same outline style as Leave table (A-3). | (b) An icon-only house symbol with `aria-label="Home"`. (c) The label `Pause` or `Pause & go Home`. (d) Place it after Leave table. | The storyboard has no Home control. REQ-004.9 calls it "Home". Putting the non-destructive action first and Leave table last follows the storyboard's Settings-then-Leave order. | yes | Q-1 |
| D-2 | (a) Opening the Table (Start game or Resume) pushes one history entry `{ tlhTable: <key> }`, where the key is unique per push (`${performance.timeOrigin}:${counter}`). Browser Back on the Table pauses to Home, exactly like the Home control. Home and Game Config add no entries, so Back on them leaves the app (the session stays paused, as when the app is closed) and the locked `history.length` check holds. Forward never reopens the Table; the user uses Resume session. Leaving the Table in the app (Home control or Leave table) calls `history.back()` if the current entry is this Table's entry, so it does not linger. | (b) No history entries anywhere (today's TASK-2.1 A-2): Back on any screen leaves the app and the session stays paused. Documented and tested as such. (c) One entry per screen including Game Config. That breaks the locked `e2e/home.spec.ts:209` and needs a locked-test edit. Forward would reopen screens. | (a) gives the AC's example ("Back from the Table pauses to Home"). It avoids the surprise of Back throwing the user out of a hand, keeps the locked test intact and needs no router. (b) is smaller but means Back from the Table exits the app. (c) costs a locked edit, and Forward into a Table would have to mean Resume. Reverses TASK-2.1 A-2 for the Table only. | yes | Q-2 |
| D-3 | `nextBotName` is validated as `whole(record.nextBotName, 'nextBotName', 0, MAX_SESSION_COUNT)`. | A separate, tighter cap | The AC names `MAX_SESSION_COUNT`. With at most 9 skipped names per bust, `next` stays below `MAX_SESSION_COUNT + 10`, far below `MAX_SAFE_INTEGER`. | no | n/a |
| D-4 | `tableWritesSettled(): Promise<void>` is exported from `src/ui/table/useTableSession.ts`, and module state there holds the pending chain (A-2). App imports it. | A prop callback from Table to App; a wrapper around `HandStore` | Covers every way of leaving the Table (Home control, Leave table, Back) with one call. No new interface on `HandStore`. | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/session-record.ts` — `nextBotName` capped at `MAX_SESSION_COUNT` (D-3); doc comment on the field
- `src/ui/table/Table.tsx` — `onHome?` on `TableViewProps` and `TableProps`; the `Home` button in a `.table-header-actions` group
- `src/ui/table/TableScreen.tsx` — `onHome?` prop passed to `Table`
- `src/ui/table/useTableSession.ts` — `tableWritesSettled()` and the module-level pending chain (A-2, D-4)
- `src/ui/App.tsx` — `goHome` handler for the Home control and Leave table; Home read after `tableWritesSettled()`; history entry, `popstate` handling (D-2)
- `src/ui/styles.css` — `.table-header-actions`; `.table-home` shares the `.table-leave` rule
- `tests/table/session-cap.acceptance.test.ts` — new: SPEC-08
- `tests/ui/table-home.acceptance.test.tsx` — new: SPEC-01
- `e2e/home-control.spec.ts` — new, every push: SPEC-02, SPEC-03, SPEC-04, SPEC-05, SPEC-06
- `e2e/history.spec.ts` — new, every push: SPEC-07, SPEC-09
- `e2e/support/paused-clock.ts` — export `axeWithPausedClock` (moved copies of `useWorkerTimers`/`restorePausedTimers`)
- `docs/storage/sessions.md` — "Pause from the Table" section; `nextBotName` row and cap text; Tests list
- `docs/ui/navigation.md` — new: screens, the Home control, browser Back/Forward (D-2)

### Components, interfaces and data
`src/ui/table/Table.tsx`:
```ts
export interface TableViewProps {
  /* …unchanged… */
  /** Pauses to Home (REQ-004.9). The Home button is rendered only when given (A-6). */
  readonly onHome?: () => void;
}
export type TableProps = TableSessionOptions & { readonly onLeave?: () => void; readonly onHome?: () => void };
```
The header markup with `onHome` (Leave table markup unchanged):
```html
<header class="table-header">
  <p class="table-header-line">…</p>
  <div class="table-header-actions">
    <button type="button" class="table-home">Home</button>
    <button type="button" class="table-leave">Leave table</button>
  </div>
</header>
```
Without `onHome`, the group holds only Leave table.

`src/ui/table/TableScreen.tsx`: props gain `readonly onHome?: () => void`, passed to `Table`.

`src/ui/table/useTableSession.ts`:
```ts
/** Resolves once every start-record put and hand write issued so far by any table has settled. Never
 *  rejects (failures are already logged). Home awaits it before reading the paused session (A-2). */
export function tableWritesSettled(): Promise<void>;
```
Each `putSession(...)` promise at `:100-104` and each `write.current` at `:154-156` is added to the chain with its
rejection swallowed: `pending = Promise.all([pending, p.then(noop, noop)]).then(noop)`.

`src/ui/App.tsx`:
- `goHome()`: if `history.state` is the current Table entry, call `history.back()`. Then
  `setPaused(undefined)` and `setScreen({ name: 'home', returned: true })`. Both `onLeave` and `onHome` on
  `TableScreen` use it. Nothing is written.
- The Home effect: `tableWritesSettled().then(() => sharedHandStore().pausedSession())`, with the same
  logging, `cancelled` guard and `setPaused` logic as today (`:28-41`).
- History (D-2 (a), approved by Q-2): `openTable(screen)` is used by Start game and Resume. It runs
  `history.pushState({ tlhTable: key }, '')` with a fresh key, stores the key in a ref, and then sets the
  screen. A `popstate` listener is added once in an effect and removed on cleanup. When the Table is shown
  (checked through a ref that is updated in the same handler that changes the screen) and
  `event.state?.tlhTable !== currentKey`, it pauses to Home the same way as `goHome`, without calling
  `history.back()`. Any other `popstate` is ignored. Pushing happens in event handlers, not in effects, so
  StrictMode's double effects push nothing twice.

`src/table/session-record.ts` line 176 becomes `whole(record.nextBotName, 'nextBotName', 0, MAX_SESSION_COUNT)`.
`findPausedSession` already collects that RangeError in `rejected`, so Home logs it and shows no entry.

### Rules and algorithms
1. **Home between hands.** Hand 10 completes and its write (record 10 + session with `handsPlayed: 10`) is
   issued. The user chooses Home before or after it commits. Home waits for `tableWritesSettled()`, then reads
   the paused session: `10 hands`. Resume runs `restoreSession` → `handNumber 11` with the stored stacks, which
   are `nextHand(t10)`'s stacks.
2. **Home mid-hand.** Hand 11 is dealt and some actions are applied. Choosing Home unmounts the Table: timers
   are cleared and late bot replies are dropped. No write was issued for hand 11, so the stored record is still
   the one after hand 10 and `hands` holds records 1–10. Resume deals a new hand 11 from the same stacks and
   button. Its replay code is newly drawn, so it is a new hand.
3. **History (D-2 (a)).** Page loads at `[…, app]`. Start game: `[…, app, T1*]`. Back: `[…, app*, T1]`,
   `popstate` with state `null` while on the Table → pause to Home. Forward: `[…, app, T1*]`, `popstate` with
   `T1` while on Home → ignored (Home stays). Resume: push `T2`, which truncates the forward entries:
   `[…, app, T1, T2*]`. Home control: the current state is `T2`, so `history.back()` →
   `[…, app, T1*, T2]`; the `popstate` arrives while on Home → ignored. A reload keeps `history.state`. A Table
   entry from an earlier load never equals the current key, so Back to it from a new Table pauses to Home.
4. **Cap.** `nextBotName` in `0..1e9`: `1e9` parses; `1e9 + 1`, `MAX_SAFE_INTEGER - 1` and `MAX_SAFE_INTEGER`
   throw `RangeError('Invalid session record: nextBotName')`.

### Error handling and configuration
- No new error messages or log lines. The Home read keeps TASK-2.6's logs (`Session record could not be read`,
  `Paused session could not be read`). A rejected `nextBotName` record is logged with the first of them.
- `history.pushState` / `history.back()` are called only in event handlers. No configuration, setting or
  dependency is added.

## 6. Behaviour specification

### SPEC-01: The Table header offers Home before Leave table when App provides it
- Verifies: AC#1, AC#3, DoD#1
- Behaviour: Given `renderToString(<TableView table={…} onAct onLeave onHome/>)` for a seated table and for a
  hand in progress, When the header is read, Then `<header class="table-header">` holds the header line and
  then a `<div class="table-header-actions">` with exactly two buttons in order:
  `<button type="button" class="table-home">Home</button>` and
  `<button type="button" class="table-leave">Leave table</button>`. `renderToString(<TableScreen config={DEFAULT_SESSION_CONFIG} onHome/>)`
  also contains the Home button. Without `onHome`, `<Table/>` and `<TableView … onLeave/>` render no element
  with class `table-home` and still exactly one button.
- Verification: acceptance `tests/ui/table-home.acceptance.test.tsx::the table header offers Home before Leave table only when onHome is given`

### SPEC-02: Home between hands after hand 10 shows Resume with 10 hands and ends nothing
- Verifies: AC#1, DoD#7, DoD#8
- Behaviour: Given the real app (Chromium and WebKit, paused clock, stubbed replay words) and storage seeded
  (A-4) with hand records 1–9 and the session record after hand 9 of a default 6-max $4/$8 session (id
  `'d'.repeat(32)`), When the user resumes, plays hand 10 to its result (`playToResult`), waits until the stored
  session has `handsPlayed: 10`, reads that stored session, and chooses `Home` while the hand-10 result is shown
  and before hand 11 is dealt, Then the `TLH Trainer` heading is visible and focused, the Table region is gone,
  the Main menu has `data-paused="shown"`, and the Resume subtitle is `Cash · 6 players · $4/$8 · 10 hands · paused`.
  The `sessions` store holds exactly one record. It deep-equals the record read before Home and has no `endedAt`
  property. The database's object store names are exactly `['hands', 'sessions']`, so no report exists. axe
  reports no serious or critical violations on the Table (at the user's turn, with the Home button visible) or
  on Home. Every request goes to the app's own origin.
- Verification: acceptance `e2e/home-control.spec.ts::Home between hands after hand 10 opens Home with Resume showing 10 hands and the session not ended`

### SPEC-03: Resume after Home deals hand 11 from the end-of-hand-10 stacks
- Verifies: AC#2, DoD#7
- Behaviour: Given SPEC-02's Home after hand 10, When the user chooses Resume session, Then the header reads
  `Cash · 6 players · $4/$8 · Hand #11`. Before the deal, every seat's name and stack text equal the stored
  session's seats and stacks (`storedRows`), which are the stacks at the end of hand 10. Once hand 11 is dealt,
  the dealer marker is on the stored `button` seat. The stored session id is unchanged.
- Verification: acceptance `e2e/home-control.spec.ts::Resume after Home deals hand 11 with every stack as at the end of hand 10`

### SPEC-04: Home in the middle of hand 11 shows 10 hands and creates no report
- Verifies: AC#3, DoD#7
- Behaviour: Given SPEC-03's resumed Table with hand 11 dealt, at the user's turn after the blinds and at least
  one bot action (`data-action-count` ≥ 3), with no `Hand over` status, When the user chooses `Home`, Then Home
  opens with the heading focused and Resume subtitle `Cash · 6 players · $4/$8 · 10 hands · paused`. After a
  further 5,000 ms of fake time, the `sessions` store still holds exactly one record. It deep-equals the
  after-hand-10 record and has no `endedAt`. The object store names are still `['hands', 'sessions']`.
- Verification: acceptance `e2e/home-control.spec.ts::Home in the middle of hand 11 opens Home with Resume showing 10 hands and no report`

### SPEC-05: Resuming the abandoned hand 11 deals a new hand 11 from the end-of-hand-10 stacks
- Verifies: AC#4, DoD#7
- Behaviour: Given SPEC-04's Home after hand 11 was abandoned, When the user chooses Resume session, Then the
  header reads `Hand #11`, and before the deal every seat's name and stack text equal the after-hand-10 stored
  session (the same as in SPEC-03). When this hand 11 is played to its result, Then a record with
  `handNumber: 11` and the original `sessionId` is stored, and the stored session has `handsPlayed: 11`.
- Verification: acceptance `e2e/home-control.spec.ts::resuming after Home mid-hand deals a new hand 11 with the end-of-hand-10 stacks`

### SPEC-06: The abandoned hand leaves no record and no trace in the stats
- Verifies: AC#5
- Behaviour: Given SPEC-04's state after Home mid-hand and the 5,000 ms wait, When the `hands` store is read
  (`storedRecords`), Then the `handNumber`s are exactly `[1, …, 10]`, all with the original `sessionId`, and the
  list deep-equals the list read before hand 11 was dealt. For every seat 1–6,
  `styleStats(styleCounts(parsed, seat))` over the parsed stored records equals the same value computed from
  the records read before hand 11 (A-5).
- Verification: acceptance `e2e/home-control.spec.ts::the hand abandoned with Home has no record and the stats equal those of hands 1 to 10`

### SPEC-07: Browser Back and Forward on the Table, Home and Game Config
- Verifies: AC#6, DoD#7
- Behaviour: (D-2 (a), approved by Q-2) Given a fresh context and the real app,
  (1) When the user starts the default game and, at the user's turn in hand 1, presses the browser Back button,
  Then Home opens (same document, URL path `/`) with the heading focused, `data-paused="shown"` and subtitle
  `… · 0 hands · paused`. No hand record is stored, and the session record deep-equals the start record read
  before Back. When the user then presses Forward, Then Home is still shown and no Table region exists.
  (2) Given a fresh page, When the user starts a game, chooses the `Home` control and presses Back, Then the page
  leaves the app (`page.url()` is `about:blank`, the page before the app). Opening `/` again shows the Resume
  entry for that session.
  (3) Given a fresh page, When the user opens Game Config and presses Back, Then the page leaves the app
  (`about:blank`). Opening `/` again shows `data-paused="none"`, because no session was started.
  (4) Given a fresh page on Home, When the user presses Back, Then the page leaves the app.
  (5) When the user starts a game, resumes after a reload, and presses Back on the Table, Then Home opens (a Table
  entry from an earlier load does not keep the Table open).
- Verification: acceptance `e2e/history.spec.ts::browser Back on the Table pauses to Home, Forward never reopens it, and Back on Home or Game Config leaves the app`

### SPEC-08: nextBotName above MAX_SESSION_COUNT is rejected
- Verifies: AC#7, DoD#1
- Behaviour: Given a valid stored session from `sessionRecord(seatSession(), …)`, When `nextBotName` is
  `MAX_SESSION_COUNT + 1`, `Number.MAX_SAFE_INTEGER - 1` or `Number.MAX_SAFE_INTEGER`, Then `parseSessionRecord`
  and `restoreSession` throw `RangeError` with message exactly `Invalid session record: nextBotName`, and
  `findPausedSession([bad])` returns `session: null` with that RangeError in `rejected` (it does not throw).
  `findPausedSession([bad, good])` returns `good`. `nextBotName: MAX_SESSION_COUNT` parses, and `0` parses. A
  restored table with `nextBotName: MAX_SESSION_COUNT` whose bot busts goes through `nextHand` without throwing,
  and the replacement name position stays a safe integer.
- Verification: acceptance `tests/table/session-cap.acceptance.test.ts::nextBotName above MAX_SESSION_COUNT is rejected with RangeError and the paused-session read skips it`

### SPEC-09: Browser — a stored session with an out-of-range nextBotName leaves Home usable
- Verifies: AC#7, DoD#7
- Behaviour: Given storage seeded with only a start record whose `nextBotName` is `MAX_SESSION_COUNT + 1`, When
  Home loads, Then the Main menu reaches `data-paused="none"`, no Resume button exists, the console has a
  `Session record could not be read` error, there is no uncaught page error, and New game → Start game deals
  hand 1 of a new session.
- Verification: acceptance `e2e/history.spec.ts::a stored session with nextBotName above the cap is skipped and Home stays usable`

### SPEC-10: Repo checks, coverage, boundary, golden suite, playtest N/A
- Verifies: DoD#1, DoD#2, DoD#3, DoD#4, DoD#5, DoD#6
- Behaviour: `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors, including every locked
  test listed in section 3. The golden-spot suite (part of `npm test`) passes 100%. Coverage holds: at least 90%
  for engine/bots/advice/stats/playtest/table and at least 70% overall. `src/table/session-record.ts` imports
  nothing from `src/ui` or `src/storage` (headless-boundary lint). DoD#6 is N/A: no engine, bot or advice code
  changes (`git diff --stat main -- src/engine src/bots src/advice` is empty).
- Verification: command `npm run lint && npm run typecheck && npm test && git diff --stat main -- src/engine src/bots src/advice`

### SPEC-11: Browsers, network, N/A items, CI
- Verifies: DoD#7, DoD#8, DoD#9, DoD#10, DoD#12
- Behaviour: The full Playwright suite (`npm run e2e`, Chromium and WebKit) passes, including the existing Home,
  Leave table, table and resume specs. SPEC-02 asserts same-origin requests only. DoD#9 is N/A (no strategy
  content). DoD#12 is N/A (no service worker exists yet; E13-S07). CI is green on `doit/TASK-2.14`.
- Verification: command `npm run build && npm run e2e && gh run list --branch doit/TASK-2.14 --limit 1`

### SPEC-12: Documentation
- Verifies: AC#6, DoD#11
- Behaviour: `docs/ui/navigation.md` describes the three screens, the Home control (pauses, never ends, an
  unfinished hand is dropped as on close) and the decided Back/Forward behaviour, with rule 3's history example.
  `docs/storage/sessions.md` gains a "Pause from the Table" section (no write on Home, Home waits for pending
  writes, abandoned hand). It shows `nextBotName` as `integer 0..MAX_SESSION_COUNT` in the field table and the
  cap text, and lists the new tests. The story doc is published to Backlog.md by the doit docs step.
- Verification: manual read of `docs/ui/navigation.md` and `docs/storage/sessions.md` against this list; `backlog doc list --plain` shows the story doc

## 7. Edge cases
- Home while hand 10's write is still running (the click comes right after the result): A-2, rule 1. Home waits
  for the write and then shows 10.
- Home while a bot decision is pending in the advice worker: the reply is dropped on unmount
  (`useTableSession.ts:128,140`). SPEC-04 waits 5,000 ms of fake time and checks that nothing was written.
- Home during the Review panel hold (`holdNextHand`): the same as between hands. The header is always rendered.
- Home during hand 1 of a new session (0 completed hands): Home shows `0 hands` once the start-record put has
  settled (A-2, SPEC-07 (1) via Back, which takes the same path).
- A failed hand write before Home: dealing had already stopped (TASK-3.10 D-2). Home shows the last stored state;
  `tableWritesSettled` does not reject.
- Repeated Home → Resume → Home: each Resume pushes a new history entry with a new key and truncates the forward
  entries (rule 3). The session id stays the same throughout.
- Double click on Home: the first click unmounts the Table, so the second has no target.
- StrictMode double effects: the `popstate` listener is added and removed symmetrically. `pushState` happens only
  in handlers. The Home read effect is already cancel-safe.
- Two tabs: out of scope (single-user app). The existing ConstraintError behaviour applies (TASK-2.6 edge cases).
- Hostile stored `nextBotName`: SPEC-08, SPEC-09.

## 8. Security considerations
- Trust boundary: stored session values stay untrusted. The `nextBotName` cap closes TASK-2.6's MINOR finding: a
  record that would crash `nextHand` at a later bot bust is now rejected at read time (SPEC-08, SPEC-09).
- History state holds only an opaque key (`performance.timeOrigin` and a counter). No session data, replay code
  or hole cards are written to history, and the URL does not change.
- Hidden information (REQ-025): unchanged. Home writes nothing and shows only `resumeSummary`.
- No new dependency and no network (SPEC-02 asserts same-origin). No randomness is added; the existing session id
  and replay-code draws are unchanged.

## 9. Non-functional
- Home after the Home control: the read waits at most for one in-flight IndexedDB transaction (a few ms), then
  one `getAll`. No perf test (standing rule: speed checks are opt-in, and nothing here is scale-sensitive).
- Every-push cost: two new Playwright specs. `home-control.spec.ts` plays about 2 browser hands plus seeding,
  about 15–20 s per browser. `history.spec.ts` has about six short page flows, about 10 s per browser. Two
  fast Vitest files.
- Coverage: `src/table/session-record.ts` stays at or above 90% (SPEC-08 covers the new bound).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`. Start a game, play two hands, choose Home in the Table header between hands, and
  check that Resume says "2 hands". Resume, choose Home in the middle of hand 3, and check that it still says
  "2 hands". Resume and see "Hand #3" with the end-of-hand-2 stacks. On the Table, press the browser Back
  button and see Home with Resume.
- New tests (path → SPEC ids):
  - `tests/ui/table-home.acceptance.test.tsx` → SPEC-01
  - `e2e/home-control.spec.ts` → SPEC-02, SPEC-03, SPEC-04, SPEC-05, SPEC-06
  - `e2e/history.spec.ts` → SPEC-07, SPEC-09
  - `tests/table/session-cap.acceptance.test.ts` → SPEC-08
- Judge end-to-end scenario: `npm run build && npx playwright test e2e/home-control.spec.ts e2e/history.spec.ts`.
  Then by hand with `npm run preview`: play 3 hands, choose Home between hands and check `3 hands`. Resume, choose
  Home in the middle of hand 4, and in DevTools → IndexedDB check that `hands` has records 1–3 only and the
  `sessions` record has no `endedAt`. Resume, check Hand #4 with the end-of-hand-3 stacks, then press Back and
  check that Home opens with Resume.

## 11. Open questions
None. Q-1 (D-1) and Q-2 (D-2, AC#6) were answered with the recommended option (Q-2: option (a)); see `doit/TASK-2.14/qa.md`.

## 12. Clarifications log
See `doit/TASK-2.14/qa.md`.
