# Spec: TASK-13.13 — Pin error-recovery history handling and decide on empty paused sessions

Status: READY (approved 2026-11-27)
Task: TASK-13.13 · Parent/epic: TASK-13 · Requirements: REQ-002.4, REQ-004, REQ-044.8 (context only) · Dream: limit-holdem-trainer

## 1. Summary
TASK-13.1 left three loose ends (doc-143). First, no repo test pins that Return Home after an error steps off
the Table's history entry (`history.back()`, TASK-13.1 A-4). Second, a paused session with 0 completed hands
(an error, reload, Home or Back during hand 1) is offered for Resume as "0 hands · paused", and the user has not
decided whether it should be. Third, `AppRoot` keys `App` with a `generation` counter that does nothing. This task
adds a new e2e file for the history behaviour and for the 0-hand decision, and removes the redundant key.

## 2. Scope
- In scope:
  - New e2e file `e2e/error-recovery-history.spec.ts`. After an error during hand 1, Return Home leaves
    `history.state.tlhTable` unset, and one browser Back leaves the app instead of showing the dead Table.
  - Pin the 0-hand paused-session behaviour after an error in hand 1, as approved in Q-1 (option A: keep offering it).
  - Remove `generation` from `AppRoot` (D-1).
  - Update `docs/ui/navigation.md` (Return Home paragraph and Tests list).
- Not doing:
  - No edits to locked test files (`e2e/error-recovery.spec.ts` is owned by TASK-13.1, `e2e/session-report.spec.ts`
    by TASK-10.1, `e2e/new-game-confirm.spec.ts` by TASK-2.7, `e2e/pause-history.spec.ts` by TASK-2.20,
    `e2e/history.spec.ts` by TASK-2.14/TASK-2.20).
  - No change to `history.back()` logic, the error screen, its text, fault injection or the advice worker.
  - No change to how a session record is stored, parsed or ended (`src/storage/hand-store.ts`,
    `src/table/session-record.ts`).
  - No change to Leave table, the Home control, browser Back or reload behaviour.
- Scope budget: files=3, lines=170

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | "Does not return to the dead table" is shown by one `page.goBack()` from Home reaching `about:blank` (the entry before the app). This is the same check as `e2e/pause-history.spec.ts:150-153`. Before that, the test asserts `history.state.tlhTable` is `undefined`. | yes | Without the `history.back()` in `AppRoot`, the Table entry stays current: `tlhTable` stays set, and Back stops on the `/` entry without leaving the app. Both assertions fail, so the test pins A-4. | Assert only `tlhTable`, which pins less. Assert that Back shows Home, which also passes without the fix. |
| A-2 | The hand-1 error is the `illegal-bot` fault (`e2e/support/fault-injection.ts:6-7`), armed after the start record is stored (`storedSessions` length 1) and before any bot acts. This reuses `runUntilErrorScreen`'s approach (copied, not imported, from the locked `e2e/error-recovery.spec.ts:102-119`). | yes | This fault is already proven in TASK-13.1. Arming after the start record makes sure a 0-hand session exists to test. | `reject-bot` or `worker-error`: same outcome, but a worker failure adds a worker-restart side path. |
| A-3 | The new tests run in both Playwright projects (chromium, webkit; `playwright.config.ts:13-15`) on every `npm run e2e`. They are not opt-in. | yes | Each is a short single-hand scenario under the paused clock, not a speed or scale check. | Chromium only. |
| A-4 | The `App.tsx:72` comment "survives AppRoot's remount of App" stays. App still remounts, because the ErrorScreen branch unmounts it. | yes | The comment is still accurate. | Reword it. |

## 3. Current system
- `src/ui/AppRoot.tsx:63-77`: `#returnHome` calls `history.back()` when `history.state` has `tlhTable` (A-4 of
  TASK-13.1), restarts the advice client, then `setState({ error:false, generation:+1, returned:true })`.
  `render()` (`:79-86`) returns `<ErrorScreen>` when `error`, otherwise `<App key={generation} returned>`.
- `src/ui/App.tsx:72-78`: module-level `lastTableKey` and `entryKey(state)` read `history.state.tlhTable`.
  `openTable` (`:211-223`) pushes `{ tlhTable: key }`, or replaces after a reload. The popstate handler
  (`:196-210`) with `tableKey.current === null` only steps back when Forward lands on `lastTableKey`. Otherwise it
  ignores the event, so a stale Table entry makes Back from Home do nothing once.
- 0-hand paused session (codebase evidence for Q-1):
  - It is created at Table mount: `useTableSession.ts:186-196` puts `sessionRecord(initialTable)` with
    `handsPlayed: table.handNumber - 1` = 0 (`session-record.ts:120-136`) before hand 1 is dealt.
  - It is offered: Home's effect (`App.tsx:124-142`) calls `pausedSession()` → `findPausedSession`
    (`session-record.ts:333-347`), which returns the latest unended record with any `handsPlayed`.
    The subtitle comes from `resumeSummary` (`table-view.ts:75-79`): `Cash · 6 players · $4/$8 · 0 hands · paused`.
  - Resume: `restoreSession` deals hand `handsPlayed + 1` = `Hand #1` with the seated line-up and stacks
    (`session-record.ts:294`). This is pinned by `e2e/session-report.spec.ts:218-238` (TASK-10.1), which covers
    a reload during hand 1, Resume, then `Hand #1`.
  - It is deleted only when it is ended: `ended()` deletes a 0-hand record with no report
    (`hand-store.ts:165-168`, REQ-044.8). This happens through Leave table (`App.tsx:180-193` goes to Home with no
    report) or through New game → "End session and start" (`App.tsx:301-319`). That dialog has dedicated 0-hand
    copy approved in TASK-2.7 Q-1 (`EndSessionDialog.tsx:48-51`: "It has no completed hands, so no report is
    saved."), pinned by `e2e/new-game-confirm.spec.ts:198-208` (TASK-2.7).
  - Other locked tests that rely on 0-hand paused sessions after Back during hand 1: `e2e/pause-history.spec.ts:143`
    (TASK-2.20) and `e2e/history.spec.ts:80,100` (TASK-2.14/TASK-2.20) call `expectPausedHome(page, 0)`.
  - Stats impact: none either way. A 0-hand session has no hand records and no report. Statistics and trends
    read `HANDS_STORE` and reports. The sessions store is read only for the hand–session join
    (`hand-store.ts:218-221`), which a session with no hands never joins.
  - Requirements: the glossary says a "Paused session" is one that "was interrupted … and has not been ended"
    (`requirements.md:18`). REQ-002.4 says Resume shows while a paused session exists. REQ-044.8 covers only
    ending. Docs already state the current behaviour (`docs/ui/navigation.md:204-205`).
- Tests: `npm test` (vitest), `npm run e2e` (Playwright, chromium + webkit, against `vite preview` on :4173).
  e2e under the paused clock must wait for real conditions (TASK-1.57): use `expect.poll` and `runUntil`, never
  fixed sleeps.
- Existing code to reuse:
  - `e2e/support/fault-injection.ts` → `installFaults`, `armFault`.
  - `e2e/support/paused-clock.ts` → `runUntil`, `runUntilMyTurn`.
  - `e2e/support/hand-records.ts` → `header`, `storedSessions`, `storedRecords`.
  - `e2e/support/table-harness-bundle.ts` → `stubReplayWords`.
  - `e2e/pause-history.spec.ts:25-26` → the `tableKey(page)` evaluate pattern (copy it, since that file is locked).
  - `src/ui/error/ErrorScreen.tsx` → `ERROR_HEADING`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Remove `generation` from `AppRoot` state, its doc comment and the `key` prop. Render `<App returned={returned} />`. | Keep it with a justifying comment. | The ErrorScreen branch already unmounts App, so leaving the error state always mounts a new App instance. The key never changes the identity of a mounted App. The existing locked `e2e/error-recovery.spec.ts` Return Home tests (fresh Home, focus, new worker) keep proving the remount. | no | n/a |
| D-2 | A paused session with 0 completed hands stays offered for Resume (`… · 0 hands · paused`; Resume deals `Hand #1` with the same line-up, seats and stacks), including after an error in hand 1. No product, text or locked-test change; this task only pins it (SPEC-02). | B: never offer it (delete on Home load; locked edits for TASK-10.1, 2.7, 2.14, 2.20). C: discard only on Return Home after an error. | Matches the glossary and REQ-002.4, keeps a configured line-up, already pinned by locked tests and documented. | yes | user (Q-1) |
| D-3 | New tests go in a new file `e2e/error-recovery-history.spec.ts`, so no locked file is edited. | Append to `e2e/error-recovery.spec.ts` (locked by TASK-13.1). | Follows the instruction to prefer new files. | no | n/a |

## 5. Design

### Files to create / modify
- `e2e/error-recovery-history.spec.ts` — new: SPEC-01 and SPEC-02.
- `src/ui/AppRoot.tsx` — remove `generation` (D-1).
- `docs/ui/navigation.md` — Return Home paragraph ("remounts App" stays true) and the Tests list entry for the
  new file. In the "Resume after an error" paragraph, add one line that this is a decided behaviour (TASK-13.13 Q-1).

### Components, interfaces and data
- `AppRoot` `State` becomes `{ error: boolean; returned: boolean }`. `#returnHome` sets `{ error: false, returned: true }`.
  No public interface or persisted data change.
- New e2e helpers live in the new file: `menu`, `newGame`, `startButton`, `resumeButton`, `homeHeading`,
  `errorHeading`, `returnHome`, `tableSection`, `enabledActions`, `tableKey(page)` (as
  `pause-history.spec.ts:25-26`), and `runUntilErrorScreen` (as `error-recovery.spec.ts:102-119`).

### Rules and algorithms
- Test scenario (shared setup, fresh context per test): `clock.install({time:0})`, `clock.pauseAt(1000)`,
  `addInitScript(stubReplayWords, [0x9e3779b9,1,2,3])`, `addInitScript(installFaults)`, `goto('/')`, wait for menu
  `data-paused` ≠ `loading`. Then New game → Start game → header `Cash · 6 players · $4/$8 · Hand #1`. Poll
  `tableKey(page)` until it matches `/^[0-9a-f]{32}$/`, poll `storedSessions` until length 1 with
  `handsPlayed` 0, `armFault(page,'illegal-bot')`, `runUntilErrorScreen`, then click Return Home and expect the
  `TLH Trainer` h1 to be focused.

### Error handling and configuration
- No new errors or messages. No user-visible text changes (Q-1).

## 6. Behaviour specification

### SPEC-01: Return Home after an error steps off the Table's history entry
- Verifies: AC#1
- Behaviour: Given a fresh context on `/` and a Table for hand 1 whose history entry has a 32-hex `tlhTable`,
  and the error screen shown after an `illegal-bot` fault, When the user clicks Return Home, Then the
  `TLH Trainer` heading is focused, no `Table` region exists, and `history.state?.tlhTable` polls to `undefined`.
  When the user then presses browser Back (`page.goBack()`), Then `page.url()` polls to `about:blank`: the app is
  left, and the dead Table is never shown again.
- Verification: acceptance `e2e/error-recovery-history.spec.ts::Return Home after an error in hand 1 steps off the Table history entry so one Back leaves the app`

### SPEC-02: A 0-hand paused session after an error follows the recorded decision
- Verifies: AC#2
- Behaviour: (Q-1 = A, approved) Given the error screen after an
  `illegal-bot` fault in hand 1 with 0 completed hands stored, When the user clicks Return Home, Then Home's
  menu has `data-paused="shown"` and the Resume session subtitle is exactly
  `Cash · 6 players · $4/$8 · 0 hands · paused`. `storedRecords` is `[]`, and one stored session has
  `handsPlayed` 0 and no `endedAt`. When the user clicks Resume session, Then the header reads
  `Cash · 6 players · $4/$8 · Hand #1`.
- Verification: acceptance `e2e/error-recovery-history.spec.ts::an error in hand 1 leaves a 0-hand paused session that Home offers for Resume`

### SPEC-03: AppRoot has no redundant generation key
- Verifies: AC#3
- Behaviour: Given `src/ui/AppRoot.tsx`, When read, Then it contains no `generation` identifier and no `key=`
  prop on `App`. Return Home still shows a fresh Home with the heading focused, and a new game gets a fresh worker.
  The existing TASK-13.1 e2e tests stay green unchanged.
- Verification: command `! grep -nE "generation|key=" src/ui/AppRoot.tsx && npm run typecheck && npm run build && npx playwright test e2e/error-recovery.spec.ts e2e/error-recovery-history.spec.ts`

## 7. Edge cases
- Return Home when the current entry is not a Table, for example an error on the Session Report: `history.back()`
  is skipped. This is already covered by the locked `e2e/error-recovery.spec.ts:194` test. N/A here.
- Return Home before `history.back()`'s popstate arrives: the new App's popstate handler ignores a `null`-state
  event (`App.tsx:197-201`). SPEC-01 polls for the final state rather than timing it.
- Start record not yet written when the error fires: avoided by polling `storedSessions` length 1 before arming
  (A-2). In real use the session would then be absent, so Home shows no Resume, which is already correct.
- Concurrency across tabs, permissions, invalid input: N/A, since nothing new is read or written.

## 8. Security considerations
- No new trust boundary, input, storage, dependency or randomness. The fault hook stays test-only, injected by
  an init script. The locked TASK-13.1 test already checks that `dist` carries no `__tlhFault`. N/A otherwise.

## 9. Non-functional
- Each new e2e test runs under the paused clock with no fixed waits, targeting under 10 s per project, using the
  default Playwright timeout.

## 10. Test plan
- Test command: `npm test && npm run build && npm run e2e`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview` → New game → Start game, then in devtools run
  `queueMicrotask(() => { throw new Error('x') })` during hand 1 → Return Home → see Resume session
  "… 0 hands · paused" → browser Back leaves the app.
- New tests: `e2e/error-recovery-history.spec.ts` → SPEC-01, SPEC-02; SPEC-03 via command plus the existing
  `e2e/error-recovery.spec.ts`.
- Judge scenario: in the preview build, start a game, force an error in hand 1, Return Home, check the Resume
  entry shows "0 hands · paused" (Q-1 A), press Back once and confirm the app is left. Reopen, then repeat after 3 hands
  (expect "3 hands · paused"; Back leaves the app).

## 11. Open questions
- None. Q-1 answered A (keep offering 0-hand paused sessions); see `doit/TASK-13.13/qa.md` and D-2.

## 12. Clarifications log
See `doit/TASK-13.13/qa.md`.
