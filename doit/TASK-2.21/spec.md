# Spec: TASK-2.21 — Harden the end-paused-session path: in-transaction recheck, focus after failure, early-open test

Status: READY (approved 2026-11-25)
Task: TASK-2.21 · Parent/epic: TASK-2 · Requirements: REQ-004.1, REQ-004.4, REQ-044.7, REQ-044.8 (via TASK-2.7, doc-123) · Dream: limit-holdem-trainer

## 1. Summary
Three follow-ups from TASK-2.7 (doc-123). (1) `ended()` in `src/storage/hand-store.ts` never checks whether
the session it reads is already ended, so an ended record whose report is missing would get a new `endedAt`
and a report; it must write nothing instead. (2) When "End session and start" fails, App removes the dialog
without a native close, so focus falls to `<body>`; it must return to Start game (Chromium and WebKit) with
Game Config's values kept. (3) No test fails if the Table opens before the end finishes; a new e2e holds the
end transaction open, proves the Table waits, then polls the new 0-hand session before hand 1 and checks its
id after hand 1.

## 2. Scope
- In scope:
  - `ended()` re-checks `isEnded` on the record it reads inside its own transaction and, if ended, aborts
    with a `ConstraintError` DOMException, writing nothing (D-1, A-1).
  - `SessionEnder` doc comment and `docs/storage/reports.md` say an already-ended session is rejected.
  - `GameConfigScreen` focuses Start game whenever an open end prompt is cleared while Game Config stays
    mounted (covers the failure path; Cancel/Escape already do this).
  - `e2e/support/hold-writes.ts`: the existing hold can be armed for a given transaction scope (default
    unchanged: exactly `['sessions']`).
  - New tests: `tests/storage/end-recheck.acceptance.test.ts`, `e2e/end-session-hardening.spec.ts`.
  - `docs/ui/navigation.md`: the failure sentence says focus returns to Start game.
- Not doing:
  - No change to user-visible text, the dialog markup, `App.tsx` control flow, `endPausedSessions`'s
    outside-transaction `isEnded` pre-filter (kept as a cheap skip), the DB version or stored formats.
  - No inline error message after a failed Confirm (A-5 of TASK-2.7 stands: logged only).
  - No edit to any locked test (see §3 "Locked tests"). SPEC-08 of TASK-2.7 (`e2e/new-game-confirm.spec.ts`)
    is left as is; the stronger check is added in the new file.
  - No removal of the NIT `error instanceof Error ? …` wrapper (out of scope).
  - No new slow/opt-in suite; nothing added to `test:slow` / `e2e:slow`.
- Scope budget: files=8, lines=330

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | An already-ended session makes `ended()` reject with `new DOMException('Session already ended', 'ConstraintError')`, nothing written. This applies to `endSession` and to the confirmed id in `endPausedSessions`. | yes | Locked `tests/storage/session-end.acceptance.test.ts:111` (TASK-10.1) requires a second `endSession` of an ended session (with report) to reject with name `ConstraintError` and change nothing; the recheck now runs before the report add, so it must reject the same way. One rule ("already ended → ConstraintError") then covers both report-present and report-missing records. | Resolve `null` with no write (breaks the locked test; would need a locked edit). |
| A-2 | If another tab ends the confirmed paused session in the gap, Confirm now fails like any other failure (logged `Paused session could not be ended`, dialog closes, focus to Start game, no game starts); the next Start game finds no paused session and starts at once. An older session ended in the gap lands in `rejected` and is logged. | yes | Follows from A-1 with no new App branch; the race needs two tabs and is rare. | Treat "already ended" as success and open the Table (needs an error-type branch in App). |
| A-3 | The AC#2 failure is produced deterministically by seeding a stored report for the unended paused session, so the end transaction's report `add` fails with `ConstraintError` (real code path, no injection hook). | yes | Matches the "report exists" failure documented at `docs/storage/reports.md:124-126`; no init script needed. | Throw from `IDBDatabase.prototype.transaction` like `e2e/session-end-retry.spec.ts:30-46`. |
| A-4 | AC#3 is made deterministic by holding the end transaction (scope `hands, reports, sessions`) open with the TASK-2.20 hold, generalised by scope. While held, the test asserts the dialog is still shown with disabled buttons and no Table header; after release it polls the 0-hand record. | yes | Without the hold an early-opened Table's start record and the end race, and the test would only fail sometimes. With the hold, an early open shows the header at once, and the start record (queued behind the held transaction) is then deleted as a 0-hand session, so the 0-hand poll also times out. | Delay via a timer in the init script (paused clock interferes). |
| A-5 | New tests go in new files that run on every push; each e2e case plays at most one hand under the paused clock. | yes | Keeps locked TASK-2.7 files untouched and the normal suite fast (seconds per case). | Add cases to locked `e2e/new-game-confirm.spec.ts` (locked edit). |

## 3. Current system
- `src/storage/hand-store.ts:91-160` `ended(db, sessionId, endedAt)`: one strict readwrite transaction over
  `sessions`, `reports`, `hands`. Reads the session; absent → writes nothing, resolves null; parse failure →
  abort; `handsPlayed === 0` → delete; else reads hand records, then `sessions.put({...value, endedAt})` and
  `reports.add(report)`. There is **no** `isEnded` check: an ended record with a report is only stopped by the
  `add` ConstraintError; one without a report is overwritten (the security MINOR).
- `src/storage/hand-store.ts:244-266` `endSession` / `endPausedSessions`. The latter ends the confirmed id
  with `ended()` (no pre-check), then `getAll` + `isEnded` filter **outside** each later `ended()` transaction
  (line 258) — the gap named in the task.
- `src/table/session-record.ts:241` `isEnded(record)` — reuse inside `ended()` (already imported at
  `hand-store.ts:5`).
- `src/table/session-report.ts:100-110` `SessionEnder` contract doc (update one sentence).
- `src/ui/App.tsx:271-290` `confirmEnd`: on rejection logs `Paused session could not be ended` and calls
  `setEndPrompt(null)` only — the dialog unmounts without `close()`, so `EndSessionDialog`'s `onClose`
  (`src/ui/config/GameConfigScreen.tsx:278-286`, which focuses Start game via the `start` ref at line 91) never
  runs. On success it calls `setEndPrompt(null)` and `openTable(...)` together, so Game Config unmounts.
- `src/ui/config/EndSessionDialog.tsx:25-29` shows the modal and focuses Cancel; buttons disabled while
  `ending`.
- `e2e/support/hold-writes.ts` (TASK-2.20): init script `holdSessionsWrite` holds the next armed readwrite
  transaction whose scope is exactly `['sessions']` open with a `count()` chain; `armSessionsHold`,
  `sessionsHoldState`, `releaseSessionsHold`. Used only by `e2e/pause-history.spec.ts:4-5,41,72`.
- `e2e/new-game-confirm.spec.ts` (TASK-2.7, locked): helpers `record`, `openPausedClock`, `homeWith`,
  `askToEnd`, locators; SPEC-08 test at lines 158-186.
- `e2e/support/hand-records.ts`: `seedStoredSessions` (84), `storedSessions` (125), `storedReports` (128),
  `header` (134), `playToResult` (173). No report-seeding helper exists.
- `tests/storage/end-paused.acceptance.test.ts:46-80` `inDatabase`/`seed(factory, sessions, reports)` pattern
  with `fake-indexeddb`.
- Tests: `npm test` (vitest incl. `*.acceptance.test.*`), `npx playwright test` (projects `chromium`,
  `webkit`, `playwright.config.ts:14-15`), lint `npm run lint`, typecheck `npm run typecheck`.

### Locked tests touching end-session / Home paused flows (none must change)
| File | Owner | Why it still passes |
|---|---|---|
| `tests/storage/session-end.acceptance.test.ts` (AC#6, line 98-116) | TASK-10.1 | Ended session with report: recheck rejects with name `ConstraintError`, nothing changed (A-1). |
| `tests/storage/end-paused.acceptance.test.ts` | TASK-2.7 | Its ConstraintError cases (lines 133-150, 152-174) seed **unended** A/C with an existing report; the recheck does not fire, `add` still fails as before. `RECORD_D` (ended) is skipped by the outside filter as before. |
| `e2e/new-game-confirm.spec.ts` | TASK-2.7 | No change to dialog, copy or success path; Cancel/Escape focus unchanged. |
| `e2e/session-report.spec.ts`, `e2e/rebuy.spec.ts`, `e2e/bust-continue.spec.ts` | TASK-10.1 | Leave table ends unended sessions only. |
| `e2e/resume.spec.ts`, `tests/storage/resume.acceptance.test.ts`, `tests/ui/home-resume.acceptance.test.tsx` | TASK-2.6 | No change to `pausedSession` or Home. |
| `e2e/home-control.spec.ts`, `e2e/history.spec.ts` | TASK-2.14 / TASK-2.20 | No change to App navigation. |
| `e2e/pause-history.spec.ts` | TASK-2.20 | Uses `armSessionsHold(page)` with the default scope, behaviour identical. |
| `e2e/error-recovery.spec.ts` | TASK-13.1 | Untouched path. |

- Existing code to reuse:
  - `src/table/session-record.ts:241` `isEnded` → the in-transaction check.
  - `e2e/support/hold-writes.ts` → generalised hold for the end transaction (AC#3).
  - `e2e/support/hand-records.ts` → `seedStoredSessions`, `storedSessions`, `storedReports`, `header`,
    `playToResult`.
  - `src/table/session-report.ts` `sessionReport` → build the seeded report (unit and e2e).
  - `e2e/new-game-confirm.spec.ts` helper shapes (`record`, `openPausedClock`, `homeWith`, locators) — copy
    the few lines needed into the new spec (do not import from a spec file).
  - `tests/storage/end-paused.acceptance.test.ts` `inDatabase`/`seed` shape → copy into the new unit test.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | In `ended()`'s `read.onsuccess`, right after `parseSessionRecord` succeeds and before the 0-hand delete, if `isEnded(session)`: set `failure = new DOMException('Session already ended', 'ConstraintError')`, `transaction.abort()`, return. | Check before the transaction (that is the bug); resolve null (A-1). | Same transaction as every write, so no other tab can end it in between; ordering before the 0-hand branch also protects an ended 0-hand record from deletion. | no | n/a |
| D-2 | Focus fix lives in `GameConfigScreen`: a ref remembers whether an end prompt was shown; when `endPrompt` becomes null/undefined while it was shown, a layout effect focuses `start.current`. | Close the dialog natively in App's failure branch (App has no dialog ref); `EndSessionDialog` unmount cleanup calling `close()` (close event fires after unmount, handler gone). | Covers every way the prompt is cleared while Config stays mounted; success unmounts Config, so no stray focus. | no | n/a |
| D-3 | `hold-writes.ts`: `armSessionsHold(page, scope = ['sessions'])` stores the sorted, comma-joined scope in `window.__tlhSessionsHoldScope`; the init script holds the next readwrite transaction whose sorted scope string equals it (default `'sessions'`). The keep-alive chain stays on the `sessions` store, so the scope must include `sessions` (documented). | A second init script for the end transaction. | One mechanism; existing caller unchanged. | no | n/a |
| D-4 | New tests in new files (A-5); no locked-test edits. | Edit `e2e/new-game-confirm.spec.ts` SPEC-08. | Lock stays intact. | no | n/a |

## 5. Design

### Files to create / modify
- `src/storage/hand-store.ts` — in-transaction `isEnded` recheck in `ended()` (D-1); update its doc comment.
- `src/table/session-report.ts` — `SessionEnder.endSession` doc: "Rejects (nothing changed) … if the stored
  session is already ended or a report for the id exists (DOMException 'ConstraintError')".
- `src/ui/config/GameConfigScreen.tsx` — focus Start game when a shown end prompt is cleared (D-2).
- `e2e/support/hold-writes.ts` — scope-parameterised hold (D-3).
- `tests/storage/end-recheck.acceptance.test.ts` — new (SPEC-01, SPEC-02).
- `e2e/end-session-hardening.spec.ts` — new (SPEC-03, SPEC-04).
- `docs/storage/reports.md` — Ending bullet: an already-ended session is rejected inside the transaction.
- `docs/ui/navigation.md` — line ~107: "the dialog closes, focus returns to Start game and no game starts".

### Components, interfaces and data
- `ended(db, sessionId, endedAt): Promise<SessionReport | null>` — signature unchanged. New rejection:
  `DOMException` name `ConstraintError`, message `Session already ended`, when the record read in the
  transaction has `endedAt` a non-null string.
- `armSessionsHold(page: Page, scope?: readonly string[]): Promise<void>` — default `['sessions']`.
  `HoldWindow` gains `__tlhSessionsHoldScope?: string`.
- No data format change; DB version stays 5.

### Rules and algorithms
- Recheck order in `read.onsuccess`: absent → nothing (resolve null) · parse fails → abort with parse error ·
  ended → abort with `ConstraintError` · 0 hands → delete · else report path.
- Worked example (SPEC-01): stored `{sessionId: A, handsPlayed: 4, endedAt: '2026-11-22T09:00:00.000Z', …}`,
  reports store empty. `endSession(A, 2026-11-24T09:00Z)` rejects `ConstraintError`; sessions store
  byte-identical (`endedAt` still `2026-11-22T09:00:00.000Z`); reports store still `[]`.

### Error handling and configuration
- App already logs `Paused session could not be ended` / `Session could not be ended`; no new messages.

## 6. Behaviour specification

### SPEC-01: An ended session with no report is not re-ended
- Verifies: AC#1
- Behaviour: Given a stored session A with 4 hands and `endedAt` `2026-11-22T09:00:00.000Z` and no report,
  When `endSession(A, 2026-11-24T09:00:00.000Z)` runs, Then it rejects with a DOMException named
  `ConstraintError`, the `sessions` store values are JSON-identical to before and the `reports` store is still
  empty. The same holds for an ended 0-hand session (record not deleted) and for an ended session that has a
  report (report JSON unchanged).
- Verification: acceptance `tests/storage/end-recheck.acceptance.test.ts::an already-ended session is not ended again`

### SPEC-02: endPausedSessions writes nothing for a confirmed id that is already ended
- Verifies: AC#1
- Behaviour: Given stored ended session A (no report) and unended session C (2 hands), When
  `endPausedSessions(A, NOW)` runs, Then it rejects with `ConstraintError`, A's stored value is unchanged, C is
  unchanged (still unended) and no report exists.
- Verification: acceptance `tests/storage/end-recheck.acceptance.test.ts::endPausedSessions rejects an already-ended confirmed session and changes nothing`

### SPEC-03: A failed Confirm returns focus to Start game and keeps the config
- Verifies: AC#2
- Behaviour: Given Home with stored unended paused session A (4 hands) and a stored report for A (A-3), and
  on Game Config players `9` and stakes `$10 / $20` chosen, When Start game → "End session and start" is
  clicked and ending fails, Then the dialog is gone (`getByRole('dialog')` count 0), Start game is focused,
  players reads `9` and stakes `$10 / $20`, no Table header shows after `page.clock.runFor(2000)`, the
  sessions and reports stores are JSON-identical to before Confirm, and a console error containing
  `Paused session could not be ended` was logged. Runs in both Playwright projects (chromium, webkit).
- Verification: acceptance `e2e/end-session-hardening.spec.ts::a failed end returns focus to Start game and keeps the chosen values`

### SPEC-04: The Table opens only after the end finishes, and its session survives hand 1
- Verifies: AC#3
- Behaviour: Given Home with stored paused session A (4 hands) and the hold init script, When Start game is
  clicked, the hold is armed with scope `['hands', 'reports', 'sessions']`, and "End session and start" is
  clicked, Then once the hold state is `held` and after `page.clock.runFor(2000)` the dialog is still visible
  with both buttons disabled and the Table header count is 0. When the hold is released, Then the header
  shows `Cash · 6 players · $4/$8 · Hand #1`; a poll finds exactly one stored session other than A with
  `handsPlayed` 0 and no `endedAt` (its `sessionId` S recorded) before any hand is played; after
  `playToResult(page, 1, …)` a poll finds S with `handsPlayed` 1, S is the only unended session, A has a
  string `endedAt` and exactly one report (for A) exists.
- Verification: acceptance `e2e/end-session-hardening.spec.ts::the Table opens only after the paused session is ended`

### SPEC-05: Gates stay green
- Verifies: AC#1, AC#2, AC#3
- Behaviour: Given the change, When the gates run, Then the full vitest suite, lint, typecheck and the full
  Playwright run (both projects) pass with no locked test edited.
- Verification: command `npm test && npm run lint && npm run typecheck && npx playwright test`

## 7. Edge cases
- Ended 0-hand record: recheck runs before the delete branch, so it is not deleted (SPEC-01).
- Ended record with report: still `ConstraintError`, unchanged (SPEC-01; locked TASK-10.1 test).
- Concurrency (another tab ends between pre-filter and transaction): reduced to the in-transaction recheck,
  covered by SPEC-01/02 because `endSession`/the confirmed id have no outer check at all.
- Dependency failure on Confirm: SPEC-03.
- Interruption of the end (slow IDB): SPEC-04.
- Success path focus: Config unmounts with the Table opening; the focus effect does not run (no SPEC needed;
  existing `e2e/new-game-confirm.spec.ts` success tests stay green).
- Empty/invalid input, permissions: N/A (no new input).

## 8. Security considerations
- Closes the security MINOR `ended-no-recheck-in-transaction`: the ended check and every write share one
  strict transaction.
- Test hooks stay in `e2e/support` init scripts; nothing imported from `src/`, so the bundle carries no hook.
- No new dependencies, secrets, logging of sensitive data, or randomness.

## 9. Non-functional
- New vitest file runs in < 1 s (fake-indexeddb). Each new e2e case plays at most one hand under the paused
  clock (target < 15 s per project). Nothing added to slow/opt-in suites.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev` (then the scenario below); e2e: `npx playwright test e2e/end-session-hardening.spec.ts`
- New tests: `tests/storage/end-recheck.acceptance.test.ts` → SPEC-01, SPEC-02;
  `e2e/end-session-hardening.spec.ts` → SPEC-03, SPEC-04.
- Judge scenario: `npm run dev`; play 2 hands, Home, New game, Start game, "End session and start": Table
  opens. In DevTools put a report for a fresh paused session into `tlh-trainer/reports`, then New game, pick 9
  players, Start game → "End session and start": dialog closes, Start game has focus, 9 players kept.

## 11. Open questions
(none)

## 12. Clarifications log
See `doit/TASK-2.21/qa.md`.
