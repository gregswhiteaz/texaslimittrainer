# Spec: TASK-1.57 — Make the players-choice table-size e2e test reliable on WebKit after Leave table

Status: READY (approved 2026-11-27, autopilot)
Task: TASK-1.57 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: n/a (CI follow-up) · Dream: limit-holdem-trainer

## 1. Summary
The table-size e2e test failed once on WebKit at `e2e/players-choice.spec.ts:143`. The Session report opened
instead of Home: the heads-up table had played one whole hand before Leave table was clicked. The cause is a
race in the test, not in the app. `startGame` opens the Table from a promise callback (`src/ui/App.tsx:264-271`),
so React runs the Table's passive effects in a later scheduler task. Usually that is before the test's axe scan.
When it runs during the scan, the first-deal `setTimeout(…, 0)` (`src/ui/table/useTableSession.ts:220`) goes to
the scan's real worker timers, not the paused fake clock. The hand is then dealt and played out for real. This
task makes the test wait until the Table's mount effects have run before it swaps in the worker timers. It waits
on an observable fact: the session's start record is in IndexedDB. No assertion is changed.

## 2. Scope
- In scope:
  - `e2e/players-choice.spec.ts`, test `each table size from 2 to 10 starts with that many players and the right
    advice note`: before each table-screen axe scan (n = 2 and n = 10), wait until the new session's start
    record is stored. Only then call `axeWithPausedClock`.
- Not doing:
  - No change to app code (`src/**`). The app behaves as specified: between hands Leave table leaves at once,
    and a session with a completed hand shows its report (`src/ui/table/Table.tsx:488-493`,
    `src/ui/App.tsx:166-184`).
  - No change to any assertion, locator, timeout or the order of steps in the test. No retries and no
    conditional handling of the Leave dialog or the report. The Leave dialog cannot open here once the race is
    gone, because no hand is dealt.
  - No change to the shared `e2e/support/paused-clock.ts` helper or to the other ~28 specs that call it. They
    scan at Home or at the user's turn, where nothing is unscheduled.
  - No replacement of the test's local `axeWithPausedClock` copy with the shared import.
  - No change to the second test in the file (`a heads-up table puts the small blind on the button`).
- Scope budget: files=1, lines=15

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The wait is added only before the two table-screen axe scans (n = 2, n = 10), not on every iteration. | yes | Only those iterations swap in real timers. Without the swap, a late effect still schedules its deal on the paused fake clock and nothing fires (`e2e/players-choice.spec.ts:61-74`). | Wait on every iteration (adds 9 IndexedDB polls for no gain). |
| A-2 | The wait reuses `storedSessions` from `e2e/support/hand-records.ts:125`. It polls with `expect.poll` until exactly one session record is stored. | yes | Each test runs in a fresh browser context. Each earlier iteration's zero-hand session is deleted when it ends (`src/storage/hand-store.ts:118-121`), and the test reaches Home only after that. So exactly one record means this Table's start-record effect has run. | Flush the React scheduler with a page-side `MessageChannel` round trip. That relies on task-ordering details and is not an observable condition. |

## 3. Current system
- Failure evidence (CI run 45978923317, attempt 1, job 140437576070, artifact `playwright-report`,
  error-context `players-choice-each-table--7dd1a-s-and-the-right-advice-note-webkit/error-context.md`). The page
  at :143 showed `heading "Session report"`, `Cash · 2 players · $4/$8 · 1 hand`, Result `+$2`, VPIP 0.0%. So the
  heads-up iteration (n = 2) dealt and finished one hand: Ava (button/SB) folded to the user's big blind, and the
  user never acted. Leave table then went straight to the report.
- Why no hand is dealt normally: the test installs a paused fake clock (`e2e/players-choice.spec.ts:99-100`).
  The first deal waits on `setTimeout(…, 0)` in the Table's effect (`src/ui/table/useTableSession.ts:217-226`).
  So after Start game the table stays at "Hand #1" with no hand. `handInProgress` is false
  (`src/table/session.ts:492-495`), so Leave table leaves at once (`src/ui/table/Table.tsx:489-493`). The
  zero-hand session is deleted and Home is shown (`src/ui/App.tsx:172-178`, `src/storage/hand-store.ts:118-121`).
- The race: `startGame` reads the paused session first and opens the Table in a promise callback
  (`src/ui/App.tsx:262-271`). That render is not a discrete-event render, so React 19.3.1 runs its passive effects
  in a later scheduler task. The scheduler yields after a commit that requested paint (`needsPaint`,
  `node_modules/scheduler/cjs/scheduler.production.js:114-115,251`) and reposts through `MessageChannel`
  (`:197`). The DOM assertions at `e2e/players-choice.spec.ts:137-139` can pass between the commit and the effect
  flush. `axeWithPausedClock` (`:67-74`) then replaces `window.setTimeout` with Web-Worker real timers. If the
  effect flushes inside that window, the deal and the bot's turns (`useTableSession.ts:228-243`, Rapid delay 0,
  `src/table/session.ts:522`) run on real time. The result is either a finished hand (report at :143) or the
  user's turn (the Leave dialog opens at :142). Both fail :143.
- The shared helper already states the rule this test breaks: "Run it only where nothing is due (Home, or the
  user's turn)" (`e2e/support/paused-clock.ts:117-118`).
- Effect order: the start-record effect (`useTableSession.ts:189-197`, `putSession`) is declared before the
  deal/bot effect (`:214`) in the same hook. React runs both in the same synchronous passive-effect flush. So a
  stored start record shows that the deal effect has already scheduled its timer on the paused fake clock.
- TASK-7.37 (short-handed TAG) is not involved. The failing iteration was heads-up (2 players), and without the
  race no bot ever acts in this test, at any table size.
- Lock: `e2e/players-choice.spec.ts` is a locked acceptance file owned by TASK-2.2
  (`doit/TASK-2.2/state.json` `locked_tests`; listed at `doit/TASK-2.5/spec.md:312,328`).
- Tests run with Playwright 1.65.1, projects `chromium` and `webkit` (`playwright.config.ts:14-15`), via
  `npm run e2e`.
- Existing code to reuse:
  - `e2e/support/hand-records.ts:125` `storedSessions(page)` → reads the `sessions` store (pattern:
    `e2e/bust-continue.spec.ts:121` `expect.poll(async () => (await storedSessions(page))…)`).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Fix the test by waiting for the start record before the axe scan, not by changing the app. | Make the first deal synchronous in the app; open the Table synchronously in `startGame`. | The app's behaviour is correct and specified (A-3 paused-session read). The defect is the test swapping timers before the Table's effects run. | no | n/a |
| D-2 | Edit the TASK-2.2-locked test file, adding only a wait. | Leave it flaky; move the axe scans elsewhere (loses table-screen a11y coverage at 2 and 10 seats). | This is the only place the race lives. No assertion is removed or loosened. | yes | Approved (Q-1, autopilot) |

## 5. Design

### Files to create / modify
- `e2e/players-choice.spec.ts` — import `storedSessions`, and add the start-record wait before the n = 2 / n = 10
  table axe scans.

### Components, interfaces and data
- Import: `import { storedSessions } from './support/hand-records';`
- At `e2e/players-choice.spec.ts:140`, replace
  `if (n === 2 || n === 10) await axeWithPausedClock(page);` with:
  ```ts
  if (n === 2 || n === 10) {
    // The Table opens from a promise callback, so its mount effects (start record, first-deal timer) can run
    // after the DOM asserts above. Swap in real timers only once they have run, so the deal stays on the
    // paused clock and no hand is played (TASK-1.57).
    await expect.poll(async () => (await storedSessions(page)).length).toBe(1);
    await axeWithPausedClock(page);
  }
  ```
- Nothing else in the file changes. Prettier may reflow these lines.

### Rules and algorithms
- Invariant: when `axeWithPausedClock` starts on the table screen, exactly one session record is stored, and the
  Table's first-deal timer is pending on the paused fake clock. So no hand is dealt during the scan, and Leave
  table goes to Home (:142-143) as the test expects.
- Example: n = 2. Start game → header "Hand #1", 2 seats. The poll sees 1 session. The axe scan runs. Leave
  table → no hand in progress, 0 hands played → session deleted → "TLH Trainer" heading.

### Error handling and configuration
- If the start record never appears, `expect.poll` fails after the default 5 s expect timeout
  (`playwright.config.ts`) with a message about the session count. That is a clear signal, not a hang.

## 6. Behaviour specification

### SPEC-01: Table-size test reaches Home after every Leave table, on both browsers, repeatedly
- Verifies: AC#1
- Behaviour: Given the table-size test with its paused clock, When it runs 10 times each on Chromium and WebKit,
  Then every run passes. Each Leave table click (n = 2…10) shows the `TLH Trainer` level-1 heading. All
  assertions are byte-identical to the current test, and the diff to the test body only adds the start-record
  poll before the two table axe scans.
- Verification: acceptance `e2e/players-choice.spec.ts::each table size from 2 to 10 starts with that many players and the right advice note`

### SPEC-02: Repeat-run proof on both engines
- Verifies: AC#1
- Behaviour: Given the fix, When the repeat command runs, Then it reports 20 passed, 0 failed and 0 flaky for this
  test (10 × chromium, 10 × webkit, `--retries=0`).
- Verification: command `npx playwright test e2e/players-choice.spec.ts -g "each table size" --repeat-each 10 --retries=0 --project=chromium --project=webkit`

### SPEC-03: No assertion removed or loosened
- Verifies: AC#1
- Behaviour: Given `git diff main -- e2e/players-choice.spec.ts`, Then it has no removed lines containing
  `expect(` and no changed timeouts. The only additions are the import, the braces, the comment and the
  `expect.poll(...storedSessions...).toBe(1)` line.
- Verification: command `git diff main -- e2e/players-choice.spec.ts | grep -E '^-[^-].*expect\(' ; test $? -eq 1`

## 7. Edge cases
- Previous iteration's session still stored when the poll runs: cannot happen. The test reaches Home (:143) only
  after the ending effect has deleted it (`src/ui/App.tsx:172-178`), and the next Start game comes after that.
- Start-record write fails: the app logs it and keeps dealing (`useTableSession.ts:192-195`). The poll would then
  time out with a clear failure. This does not happen in a healthy run, and the test should fail if it does.
- Effects already flushed before the poll (the common case): the poll passes on its first read.
- n = 3…9: no timer swap, so no wait is needed (A-1).

## 8. Security considerations
N/A. This is a test-only change. It adds no dependencies, no untrusted input and no randomness.

## 9. Non-functional
- The test duration grows by at most two IndexedDB reads per run (~tens of ms). The test's 3–5 s runtime
  (CI log) is otherwise unchanged.

## 10. Test plan
- Test command: `npm run e2e`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx playwright test e2e/players-choice.spec.ts --repeat-each 10 --retries=0 --project=chromium --project=webkit`
- New tests: none. The existing test `e2e/players-choice.spec.ts::each table size…` covers SPEC-01, SPEC-02 and
  SPEC-03. Judge scenario: run the Run command and confirm 40 passed (both tests × 10 × 2 browsers), 0 flaky.
  Then read the diff and confirm that only the wait was added.

## 11. Open questions
None. Q-1 answered yes (autopilot, recommended): see doit/TASK-1.57/qa.md; unlocked under TASK-2.2.

## 12. Clarifications log
See `doit/TASK-1.57/qa.md`.
