# Spec: TASK-2.7 — Confirm ending a paused session before starting a new game

Status: READY (approved 2026-11-24)
Task: TASK-2.7 · Parent/epic: TASK-2 · Requirements: REQ-004 (004.1, 004.4), REQ-044 (044.7, 044.8) · Dream: limit-holdem-trainer

## 1. Summary
Start game on Game Config now checks storage first. If a paused (not ended) session exists, a modal dialog asks
the user to confirm ending it. Confirm ends it with TASK-10.1's session-end operation (report saved, or the
record deleted when it has 0 hands), also ends any older unended sessions left from before this story (A-1),
and then opens the Table for the new game. Cancel closes the dialog and changes nothing. With no paused session,
Start game opens the Table as today, with no dialog. Afterwards exactly one stored session is not ended: the new one.

## 2. Scope
- In scope:
  - `src/storage/hand-store.ts`: a new store operation `endPausedSessions(sessionId, endedAt)` (D-3) that
    reuses the private `ended(...)` transaction once per session.
  - `src/table/session-report.ts`: add `endPausedSessions` and its result type to the `SessionEnder`
    interface.
  - `src/table/session-record.ts`: export the existing `isEnded` predicate (no behaviour change).
  - `src/ui/config/EndSessionDialog.tsx` (new): the confirmation dialog. `GameConfigScreen` gets one
    optional prop `endPrompt` and renders the dialog only while it is set. `App` checks for a paused session
    on Start game, holds the prompt state, and runs Confirm and Cancel.
  - Dialog styles in `src/ui/styles.css`, reusing the bust dialog's rules.
  - Unit, acceptance and Playwright tests. Docs: `docs/ui/navigation.md`, `docs/storage/sessions.md`,
    `docs/storage/reports.md`.
- Not doing:
  - No confirmation on New game, or on Home's Resume session. Cancelling Game Config never ends anything.
  - No Session Report screen after Confirm. The report is saved, and the Table opens for the new game.
  - No change to Leave table, the Home control, browser Back, `endSession`, the record or report formats, or
    the DB version (still 3).
  - Invalid stored session records (those `parseSessionRecord` rejects) are not repaired, ended or deleted.
  - No multi-tab coordination.
  - No change to Home's read of the paused session, and no Home snapshot or report reopening (TASK-2.16).
- Scope budget: files=13, lines=800

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Older unended sessions (more than one can exist from before this story, see TASK-2.6) are ended on Confirm too, through the same per-session end operation. A session with hands gets `endedAt` = its own `updatedAt` (the time it was last played) plus a saved report. A 0-hand session is deleted with no report. The confirmed paused session is ended first, with `endedAt` = now. | no (writes reports) | AC#4 needs exactly one unended session after the new game. Ending them loses no data, because hands keep their reports. Using `updatedAt` stops an abandoned old session from looking like the latest ended one, and its playing time stays honest. The user only sees the latest (paused) session, and it is the only one ended "now". | Delete the older ones with no report (loses data). Leave them unended (fails AC#4, and they would resurface as "paused" one by one). End them all at now (the last-session order becomes ambiguous). |
| A-2 | The dialog's default focus is Cancel. Escape acts as Cancel. After Cancel or Escape, focus returns to Start game. | yes | The safe default for a destructive confirmation. Escape-to-close is the native `<dialog>` behaviour. | Focus the confirm button. Ignore Escape, as BustDialog does. |
| A-3 | Start game reads the paused session again at click time, after `tableWritesSettled()`. It does not reuse Home's earlier read. | yes | Home's read may still be pending when the user is quick (e2e helpers click New game and then Start game without waiting). A click-time read is always current. | Pass Home's `paused` into the config screen, and disable Start until it is known. |
| A-4 | If the click-time read rejects, the error is logged (`console.error('Paused session could not be read', error)`) and the game starts without a dialog. | yes | Starting ends nothing, so the paused session is not lost. This matches today's behaviour. | Block Start game and show an error. |
| A-5 | If ending the confirmed session fails, `console.error('Paused session could not be ended', error)` is logged, the dialog closes, Game Config stays with its values, and no game starts. The transaction is strict, so nothing changed. Failures ending an **older** session are returned in `rejected`, logged as `console.error('Session could not be ended', error)` and do not block the start. | yes | A broken old record must never block every future Start game. The confirmed session's failure must not lead to two unended sessions. | Start anyway. Show an inline error text (user-visible copy, a separate story). |
| A-6 | Start-time reads do not log records rejected by `parseSessionRecord`. Home already logs them (TASK-2.6). | yes | Avoids duplicate noise. | Log them again. |

## 3. Current system
- `src/ui/App.tsx:16-22` — the screens union. `config` renders `GameConfigScreen` with
  `onStart={(config) => openTable({ name: 'table', config })}` (`App.tsx:155-161`). `openTable` pushes the
  Table's history entry (`App.tsx:98-103`). The Leave-table end runs in an `ending` effect guarded for
  StrictMode (`App.tsx:66-85`). This story runs its work in **event handlers and promise callbacks**, not in
  effects, so `react-hooks/set-state-in-effect` does not apply.
- `src/ui/App.tsx:147-150` — New game resets `paused` and opens config. Home reads the paused session after
  `tableWritesSettled()` (`App.tsx:44-64`).
- `src/ui/config/GameConfigScreen.tsx:24-28` — props `config`, `onStart`, `onCancel`. Start game is the
  `button-primary` at `:264-270`. All chosen values live in this component's state (`:87-98`), so it must stay
  mounted while the dialog is shown (AC#3).
- `src/ui/table/BustDialog.tsx:11-40` — the native `<dialog>` pattern: `useLayoutEffect` → `showModal()`,
  `aria-labelledby` its h2. Styles at `src/ui/styles.css:1022-1077`.
- `src/storage/hand-store.ts:61-100` — `ended(db, sessionId, endedAt)`: one strict transaction. Absent → null.
  0 hands → delete. Otherwise put `endedAt` and add the report (a report that already exists → ConstraintError,
  nothing changed). `pausedSession()` at `:137-140` uses `findPausedSession`.
- `src/table/session-record.ts:241-242` — private `isEnded`. `:255-269` — `findPausedSession` returns the
  latest valid unended record and the rejected errors.
- `src/table/session-report.ts:38-47` — `SessionEnder` (only implemented by `openHandStore`;
  `grep -rln SessionEnder` finds only `hand-store.ts` and `session-report.ts`).
- `src/table/table-view.ts:75-79` — `resumeSummary(record)`, e.g. `Cash · 6 players · $4/$8 · 4 hands · paused`.
- `src/ui/table/useTableSession.ts:100-104` — `tableWritesSettled()`. The Table writes its start record
  (`handsPlayed: 0`) on mount (`docs/storage/sessions.md` "When it is written"), so ending must finish
  **before** `openTable`. Otherwise the new start record would be the latest unended session.
- Tests: `npm test` (vitest + coverage; `fake-indexeddb` for storage, e.g.
  `tests/storage/session-end.acceptance.test.ts:1-60`). UI unit tests are static `renderToString`
  (`tests/ui/bust-dialog.acceptance.test.tsx:24-37`). Playwright runs Chromium and WebKit
  (`playwright.config.ts:13-15`). E2E helpers: `seedStoredSessions`, `storedSessions`, `storedReports`,
  `header`, `playToResult` (`e2e/support/hand-records.ts`). `axeWithPausedClock`
  (`e2e/support/paused-clock.ts:119`). Records are seeded via `sessionRecord(table, meta)` with
  `handNumber: hands + 1` (`e2e/session-report.spec.ts:183-193`).
- Existing code to reuse:
  - `src/storage/hand-store.ts` `ended(...)` → the per-session end. Do not write a second end transaction.
  - `src/table/session-record.ts` `parseSessionRecord`, `isEnded` → classifying stored values.
  - `src/table/table-view.ts` `resumeSummary` → the dialog's session line.
  - `src/ui/table/BustDialog.tsx` → the dialog structure (showModal in a layout effect, labelled by h2).
  - `src/ui/styles.css` `.bust-dialog*` rules → extend the selectors. Do not copy them.
  - `src/ui/table/useTableSession.ts` `tableWritesSettled` → before both reads and ending.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The dialog is rendered by `GameConfigScreen` through an optional prop `endPrompt`. App owns the state. | Render it in App as a sibling (needs a fragment, and focus restore is harder). | GameConfigScreen stays mounted with its values. Native `close()` restores focus to Start game. Static tests can render it. | no | n/a |
| D-2 | `App.startGame` uses a request token (`useRef<number>`). Every Start game click and every config Cancel / ← Home bumps it, and a resolved read acts only if its token is still current. | A boolean `starting` ref. | It ignores a read that resolves after the user left config, and a double click opens one Table. | no | n/a |
| D-3 | New `SessionEnder.endPausedSessions(sessionId, endedAt): Promise<PausedSessionsEnd>` in the store, reusing `ended(...)` per session (A-1, A-5). | Loop `pausedSession()` + `endSession()` in App (cannot skip a failing record without looping forever). One transaction for all (one broken record would block every start). | Per-session strict transactions keep TASK-10.1's guarantees, and a failure on an old record is isolated. | no | n/a |
| D-4 | The dialog copy is the text in §5 "Dialog copy". | Shorter copy without the report line; a confirm button reading "Start new game". | It states what happens, including that a 0-hand session gets no report. | yes | user (Q-1) |
| D-5 | No locked test needs editing. Checked: every locked e2e that clicks Start game does so with no valid unended session stored. Fresh contexts, Leave table first, or only invalid seeded sessions (`e2e/resume.spec.ts:255-290`, `e2e/history.spec.ts:148-185`; invalid records are not "paused", so no dialog, and their `storedSessions` count of 2 holds). The closed button list in `tests/ui/home.acceptance.test.tsx:81` and the Game Config list in `e2e/stake-choice.spec.ts:100-105` stay valid because the dialog is not rendered without `endPrompt`. | — | Grep of `doit/*/state.json` locked_tests against `Start game` usage. | no | n/a |

## 5. Design

### Files to create / modify
- `src/storage/hand-store.ts` — `endPausedSessions` on the object returned by `openHandStore`.
- `src/table/session-report.ts` — `PausedSessionsEnd` type, and `endPausedSessions` on `SessionEnder`.
- `src/table/session-record.ts` — `export` the existing `isEnded`.
- `src/ui/config/EndSessionDialog.tsx` — new dialog component.
- `src/ui/config/GameConfigScreen.tsx` — optional `endPrompt` prop, and renders the dialog when it is set.
- `src/ui/App.tsx` — `startGame`, `confirmEnd`, `cancelEnd`, the `endPrompt` state and the request token.
- `src/ui/styles.css` — `.end-session-dialog` added to the `.bust-dialog` rule selectors, plus action-button classes.
- `tests/storage/end-paused.acceptance.test.ts` — new (SPEC-04, SPEC-05, SPEC-06).
- `tests/ui/end-session-dialog.acceptance.test.tsx` — new (SPEC-07).
- `e2e/new-game-confirm.spec.ts` — new (SPEC-01, SPEC-02, SPEC-03, SPEC-08, SPEC-09, SPEC-10).
- `docs/ui/navigation.md` — the Game Config row and the dialog.
- `docs/storage/sessions.md`, `docs/storage/reports.md` — `endPausedSessions`, and `endedAt` written by it.

### Components, interfaces and data
- `src/table/session-report.ts`:
  ```ts
  export interface PausedSessionsEnd {
    /** The confirmed session's report; null if it had 0 hands (deleted) or was absent. */
    readonly report: SessionReport | null;
    /** One error per older unended session that could not be ended (left unchanged). */
    readonly rejected: readonly Error[];
  }
  // in SessionEnder:
  /** Ends `sessionId` at `endedAt` (as endSession), then every other valid unended stored session at its own
   *  updatedAt. Rejects (nothing changed) only if ending `sessionId` fails. */
  endPausedSessions(sessionId: string, endedAt: Date): Promise<PausedSessionsEnd>;
  ```
- `src/ui/config/EndSessionDialog.tsx`:
  ```ts
  export interface EndPrompt {
    readonly summary: string;      // resumeSummary(record)
    readonly handsPlayed: number;  // picks the report line
    readonly ending: boolean;      // true while Confirm runs: both buttons disabled, Escape ignored
    readonly onConfirm: () => void;
    readonly onCancel: () => void;
  }
  export function EndSessionDialog(props: EndPrompt): React.JSX.Element;
  ```
  - `useLayoutEffect` → `showModal()` if not open, then focus the Cancel button (A-2).
  - The Cancel button calls `dialog.close()`. The dialog's `onClose` calls `props.onCancel()`. Native close
    restores focus to Start game. Escape fires the native `cancel` → close → `onClose`. While `ending`,
    `onCancel` (the event) and Escape `keydown` call `preventDefault()`, as in `BustDialog.tsx:22-26`.
  - Confirm calls `props.onConfirm()` and does not close the dialog.
- `GameConfigScreenProps` gains `readonly endPrompt?: EndPrompt | null`. When it is set, `<EndSessionDialog {...endPrompt} />`
  is rendered after `.config-actions`, inside `<main>`. Nothing else changes.
- `App`:
  - state `endPrompt: { config: SessionConfig; sessionId: string; summary: string; handsPlayed: number; ending: boolean } | null`.
  - `startGame(config)`: bump the token and capture it. Run `tableWritesSettled().then(() => sharedHandStore().pausedSession())`.
    On resolve, if the token is stale, do nothing. If `session === null`, call `openTable({ name: 'table', config })`.
    Otherwise call `setEndPrompt({ config, sessionId, summary: resumeSummary(session), handsPlayed, ending: false })`.
    On reject: A-4.
  - `confirmEnd()`: ignore if the prompt is null or already ending. Otherwise `setEndPrompt({...p, ending: true})`, then
    `tableWritesSettled().then(() => store.endPausedSessions(p.sessionId, new Date()))`. On resolve, log each
    `rejected` entry (A-5), `setEndPrompt(null)` and `openTable({ name: 'table', config: p.config })`. On reject,
    log (A-5) and `setEndPrompt(null)`.
  - `cancelEnd()`: ignore while `ending`. Otherwise `setEndPrompt(null)`.
  - Config `onCancel` (Cancel and ← Home) also bumps the token and clears `endPrompt`.

### Rules and algorithms
- `endPausedSessions(id, now)`:
  1. `await ended(db, id, now)`. If it rejects, reject.
  2. Read all values in `sessions` (readonly `getAll`). Keep those that `parseSessionRecord` accepts, that are
     not `isEnded`, and whose `sessionId !== id`. Parse failures are skipped silently.
  3. For each kept record in any order: `ended(db, record.sessionId, new Date(record.updatedAt))`. A rejection is
     pushed to `rejected` (as an `Error`) and the next record follows.
  4. Resolve `{ report, rejected }`.
- Worked example (SPEC-04). Stored sessions, all `$4/$8` 6-max from `seatSession()`:
  - A: `'a'.repeat(32)`, 4 hands, updatedAt `2026-11-23T10:10:00.000Z`.
  - B: `'b'`, 0 hands, `…10:05…`.
  - C: `'c'`, 2 hands, `…10:01…`.
  - D: `'d'`, 3 hands, `endedAt '2026-11-22T09:00:00.000Z'`.
  - E: invalid, `'e'`, a seat with `kind: 'robot'`.

  `endPausedSessions(A, 2026-11-24T09:00:00.000Z)` gives:
  - A.endedAt is `2026-11-24T09:00:00.000Z`, and the report for A has handsPlayed 4 with the same endedAt.
  - B is deleted, with no report.
  - C.endedAt is `2026-11-23T10:01:00.000Z`, and the report for C has handsPlayed 2.
  - D and E are byte-identical to before.
  - The `reports` keys are exactly `[A, C]`, and the result is `{ report: <A's report>, rejected: [] }`.
  - Afterwards `pausedSession()` is `{ session: null, rejected: [1 error] }`.

### Error handling and configuration
- Console messages: A-4, A-5. No new user-visible error text.
- No configuration.

### Dialog copy
Approved by Q-1 (`doit/TASK-2.7/qa.md`).
- h2 (and the dialog's accessible name): `End your paused session?`
- p: `Starting a new game ends this paused session:`
- p (class `end-session-summary`): `resumeSummary(record)`, e.g. `Cash · 6 players · $4/$8 · 4 hands · paused`
- p: `Its Session Report will be saved.` when handsPlayed ≥ 1, otherwise
  `It has no completed hands, so no report is saved.`
- Buttons in DOM order: `Cancel` (outline) and `End session and start` (red primary).

## 6. Behaviour specification

### SPEC-01: Start game with a paused session asks first and starts nothing
- Verifies: AC#1, DoD#1, DoD#7, DoD#8
- Behaviour: Given seeded session A (4 hands, valid, not ended) and Home reloaded, When the user chooses New game,
  then Start game, Then:
  - a modal dialog named `End your paused session?` is visible, showing
    `Cash · 6 players · $4/$8 · 4 hands · paused` and `Its Session Report will be saved.`
  - its buttons are exactly `['Cancel', 'End session and start']`, and Cancel is focused
  - after `page.clock.runFor(2000)` there is no Table (`header(page)` count 0)
  - `storedSessions` deep-equals the seeded `[A]`, and `storedReports` is `[]`
  - axe reports no serious or critical violations with the dialog open, and every request is same-origin.
- Verification: acceptance `e2e/new-game-confirm.spec.ts::Start game with a paused session asks first and starts nothing`

### SPEC-02: Cancel and Escape keep the paused session and the chosen values
- Verifies: AC#3, DoD#1, DoD#7
- Behaviour: Given seeded A and Game Config set to 9 players and stake `$10 / $20`, When the user chooses Start game
  and then Cancel, Then:
  - the dialog is gone and Start game is focused
  - the players select shows `9` and the stake select shows `$10 / $20`
  - after `runFor(2000)` there is no Table
  - `JSON.stringify(storedSessions)` equals its value before Start game, and `storedReports` is `[]`.

  When the user chooses Start game again and presses Escape, Then the same holds. When the user chooses ← Home,
  Then Home shows Resume with `Cash · 6 players · $4/$8 · 4 hands · paused`.
- Verification: acceptance `e2e/new-game-confirm.spec.ts::Cancel and Escape keep the paused session and the chosen values`

### SPEC-03: Confirm ends the paused session, saves its report and starts the new game
- Verifies: AC#2, DoD#1, DoD#7
- Behaviour: Given seeded A (4 hands) and Game Config set to 9 players, When the user chooses Start game and then
  `End session and start`, Then:
  - the Table opens with header `Cash · 9 players · $4/$8 · Hand #1`
  - the stored A has a string `endedAt`
  - `storedReports` has exactly one report, with sessionId A, `handsPlayed` 4 and `endedAt` equal to A's
  - there is a second stored session whose id ≠ A, with `handsPlayed` 0 and no `endedAt`.
- Verification: acceptance `e2e/new-game-confirm.spec.ts::Confirm ends the paused session, saves its report and starts the new game`

### SPEC-04: endPausedSessions ends the confirmed session now and older unended ones at their updatedAt
- Verifies: AC#2, AC#4, DoD#1
- Behaviour: The worked example in §5 "Rules and algorithms", against `fake-indexeddb` through `openHandStore`,
  with stores read raw. Also: a relaunched store (new `openHandStore` on the same factory) returns the same reports
  from `getReport(A)` and `getReport(C)`.
- Verification: acceptance `tests/storage/end-paused.acceptance.test.ts::ends the confirmed session now and older unended sessions at their updatedAt`

### SPEC-05: A failure ending the confirmed session changes nothing
- Verifies: AC#2, DoD#1
- Behaviour: Given A (4 hands, unended), C (2 hands, unended), and a report already stored under A's id, When
  `endPausedSessions(A, now)` runs, Then:
  - it rejects with a `DOMException` named `ConstraintError`
  - every value in `sessions` and `reports` is byte-identical to before (C is not ended).

  Given the confirmed id is absent and C is unended, Then it resolves `{ report: null, rejected: [] }` and C is ended.
- Verification: acceptance `tests/storage/end-paused.acceptance.test.ts::a failure ending the confirmed session changes nothing`

### SPEC-06: A failure ending an older session is returned and does not stop the others
- Verifies: AC#4, DoD#1
- Behaviour: Given A (4 hands), C (2 hands, a report already stored under C's id) and F (`'f'.repeat(32)`,
  3 hands), all unended, When `endPausedSessions(A, now)` runs, Then:
  - it resolves with `report.sessionId === A` and `rejected.length === 1`
  - A and F are ended, and C's stored value is byte-identical to before.
- Verification: acceptance `tests/storage/end-paused.acceptance.test.ts::a failure ending an older session is returned and the others still end`

### SPEC-07: The dialog renders only with a prompt, with its copy and states
- Verifies: AC#1, DoD#1
- Behaviour: Given `GameConfigScreen` rendered with `renderToString`:
  - with `endPrompt` `{ summary: 'Cash · 6 players · $4/$8 · 4 hands · paused', handsPlayed: 4, ending: false }`,
    the HTML has exactly one `<dialog`, labelled by an h2 `End your paused session?`. It holds the summary,
    `Its Session Report will be saved.`, and buttons `Cancel` and `End session and start`, neither disabled.
  - with `handsPlayed: 0`, it says `It has no completed hands, so no report is saved.`
  - with `ending: true`, both dialog buttons have `disabled=""`.
  - without `endPrompt`, or with `null`, there is no `<dialog`.
- Verification: unit `tests/ui/end-session-dialog.acceptance.test.tsx::renders the dialog only with a prompt`

### SPEC-08: After a confirmed new game only the new session is not ended
- Verifies: AC#4, DoD#1, DoD#7
- Behaviour: Given seeded sessions A (4 hands, updatedAt latest), B (0 hands) and C (2 hands, oldest), When the user
  chooses New game, Start game and `End session and start`, and plays hand 1 to its result, Then:
  - the dialog showed A's summary (`… · 4 hands · paused`)
  - after `storedSessions` shows the new session with `handsPlayed` 1, the stored sessions without a string
    `endedAt` are exactly one: the new one (id not in {A, B, C})
  - B is absent, and C.endedAt equals C.updatedAt
  - the report sessionIds sorted are `[A, C]`.
- Verification: acceptance `e2e/new-game-confirm.spec.ts::after a confirmed new game only the new session is not ended`

### SPEC-09: A 0-hand paused session is discarded on Confirm
- Verifies: AC#2, DoD#1, DoD#7
- Behaviour: Given seeded A with 0 hands, When the user chooses Start game, Then the dialog says
  `It has no completed hands, so no report is saved.` When the user then chooses `End session and start`, Then:
  - the Table opens at `Hand #1`
  - A is absent from `storedSessions`
  - `storedReports` is `[]` (REQ-044.8).
- Verification: acceptance `e2e/new-game-confirm.spec.ts::a 0-hand paused session is discarded on Confirm`

### SPEC-10: With no paused session Start game starts at once
- Verifies: AC#5, DoD#1, DoD#7
- Behaviour: Given (a) empty storage, and (b) only a seeded **ended** session D, When the user chooses New game and
  Start game, Then:
  - the Table header `Cash · 6 players · $4/$8 · Hand #1` appears
  - `page.getByRole('dialog')` has count 0 throughout (checked right after the click and once the header shows)
  - in (b), D is byte-identical and `storedReports` is unchanged.
- Verification: acceptance `e2e/new-game-confirm.spec.ts::with no paused session Start game starts at once`

### SPEC-11: Checks, boundaries and documentation
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#6, DoD#8, DoD#9, DoD#10, DoD#11, DoD#12
- Behaviour: Given the finished build, When the gates run, Then all of the following hold.
  - Lint, typecheck and the full unit suite pass. The golden suite passes 100 %. Coverage holds.
  - `src/table/*` gains no UI or browser import.
  - There are no engine, bot or advice changes, so the 10,000-hand playtest still reports 0 violations
    (DoD#6 is run for completeness).
  - No new network requests (SPEC-01).
  - No strategy content (DoD#9 N/A). No service worker yet (DoD#12 N/A). CI is green on the branch.
  - `docs/ui/navigation.md`, `docs/storage/sessions.md` and `docs/storage/reports.md` describe the dialog and
    `endPausedSessions`, and are published to Backlog.md.
- Verification: command `npm run lint && npm run typecheck && npm test && npx vitest run tests/golden/ && npm run -s playtest -- --hands 10000 --seed 42 && npx playwright test`

## 7. Edge cases
- Double-click Start game, or a click while the read is pending: the D-2 token means one read acts → SPEC-01/10 (the single-Table check is implicit in the header and session count).
- The user leaves config (Cancel / ← Home) while the read is pending: the token is stale and nothing opens. This is code-level only (sub-ms window). No dedicated test.
- Double-click Confirm, or Escape while ending: ignored (`ending`) → SPEC-07 (disabled buttons).
- 0-hand paused session → SPEC-09. Older unended sessions → SPEC-04, SPEC-08. An already-ended session is ignored → SPEC-04, SPEC-10.
- Invalid stored records: not paused and never touched → SPEC-04 (E), and the existing locked `e2e/resume.spec.ts`, `e2e/history.spec.ts`.
- Storage failures → SPEC-05, SPEC-06 (A-5). A read failure (A-4) only logs.
- Multiple tabs: out of scope.

## 8. Security considerations
- Trust boundary: stored IndexedDB values. They are validated by `parseSessionRecord` before use, and invalid ones
  are skipped (§5 step 2). No new dependency. No randomness. No secrets or logging of sensitive data.
  No network (SPEC-01 same-origin check).

## 9. Non-functional
- No speed or scale checks in this story, so nothing is added to the slow group. All new tests run in seconds in
  the normal suite and in the normal Playwright run.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`. Start a game and play 2 hands, then choose Home. Choose New game, set 9 players,
  then Start game. The dialog shows. Cancel keeps the values. Start game again, then `End session and start`:
  the 9-player Table opens. Reload: Home has no Resume for the old session.
- New tests (path → SPEC ids):
  - `tests/storage/end-paused.acceptance.test.ts` → SPEC-04, SPEC-05, SPEC-06
  - `tests/ui/end-session-dialog.acceptance.test.tsx` → SPEC-07
  - `e2e/new-game-confirm.spec.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-08, SPEC-09, SPEC-10
- Locked tests the build must edit: none (D-5).
- End-to-end for the Judge: `npx playwright test e2e/new-game-confirm.spec.ts e2e/resume.spec.ts e2e/history.spec.ts e2e/home.spec.ts e2e/players-choice.spec.ts e2e/session-report.spec.ts e2e/stake-choice.spec.ts`,
  then the manual Run command above.

## 11. Open questions
- None. Q-1 is answered in `doit/TASK-2.7/qa.md` (the recommended copy).

## 12. Clarifications log
See `doit/TASK-2.7/qa.md`.
