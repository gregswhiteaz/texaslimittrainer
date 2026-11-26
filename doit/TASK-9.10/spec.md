# Spec: TASK-9.10 — Handle a failed decision grade cleanly and test the pending-grades state

Status: READY (approved 2026-11-26)
Task: TASK-9.10 · Parent/epic: TASK-9 · Requirements: n/a (follow-up from TASK-9.3, doc-117; AC#3 from TASK-13.1, doc-143) · Dream: limit-holdem-trainer

## 1. Summary
Each user decision is graded by the advice worker as soon as it is made (TASK-9.3 A-1). If one grade request
rejects mid-hand, nothing handles that promise until the hand ends, so the browser fires `unhandledrejection`.
Since TASK-13.1 that event shows the app error screen mid-hand, instead of the intended outcome: the hand plays
out, its record write fails with the `Hand record could not be saved` log and no review panel opens (TASK-9.3
A-3, `docs/storage/hand-records.md:125-131`, `docs/ui/review.md:126-129`). This task marks each grade promise as
handled when it is requested, so the failure surfaces only through the hand's record write. It adds tests for the
failed grade (unit and Chromium/WebKit e2e) and for the pending-grades table state (panel hidden, Deal next hand
shown), and states the user-visible outcome in `docs/ui/navigation.md`.

## 2. Scope
- In scope:
  - `src/table/decision-grades.ts`: `requestNewGrades` attaches a no-op rejection handler to each new request
    promise. The tracked promise stays the original one, so `gradedDecisions` still rejects with the grade's
    error.
  - A test-only `reject-grade` fault in `e2e/support/fault-injection.ts` and a new e2e spec through the built app.
  - A Vitest unit test for the tracker and a Vitest acceptance test of `TableView` with pending grades.
  - Docs: `docs/ui/navigation.md` (what the user sees after a failed grade), `docs/ui/review.md` (Timing
    paragraph: no error screen, no unhandled rejection).
- Not doing:
  - No visible message, Retry or other new UI for a failed write or grade. TASK-13.3 owns the "last hand could not
    be saved" message with Retry and Leave table.
  - No main-thread fallback grading (TASK-9.3 AC#7 / A-3 forbid it). No re-request of a failed grade.
  - No change to the store-write failure path (`store.add` rejects). Its behaviour is pinned by the locked
    `e2e/hand-records.spec.ts::a failed write stops dealing` (TASK-3.9 / TASK-1.55).
  - No change to `AppRoot`, `ErrorScreen` or `unexpected-error.ts`. The classifier stays "every unhandled
    rejection counts" (TASK-13.1 A-1).
  - No change to bot-decision failure handling (a rejected bot decision still shows the error screen).
  - No edit to any locked test file.
- Scope budget: files=7, lines=240

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The handler is attached in `requestNewGrades` (pure tracker in `src/table/`), not in `requestDecisionGrade`. | yes | Covers every request function, including any future one, and also covers the hand that never ends (Home mid-hand unmounts the table, so `gradedDecisions` is never called). It is unit-testable under Vitest's `node` environment. | `.catch(() => undefined)` inside `requestDecisionGrade` (the TASK-9.3 reviewer's suggestion). |
| A-2 | The e2e fault answers the next `grade` request with an `ok:false` reply (`Injected grade failure`) on a microtask, the same way `reject-bot` answers a bot request. The worker itself stays healthy. | yes | A grade failure that also kills the worker would make the next bot request fail and show the error screen through the bot path, which hides the behaviour under test. | A worker `error` event on the grade request. |
| A-3 | The e2e test makes the faulted decision Call or Check on the user's first preflop turn. | yes | A preflop Call or Check never ends the hand, so the rejection is certainly mid-hand. A Fold can end it at once (for example, SB folding when everyone else has folded). | Fold, with a check that the hand is still running. |
| A-4 | The new tests are not marked slow. They run on every `npm test` and `npm run e2e`. | yes | They are behaviour checks, not speed or scale checks (standing rule: only speed/scale checks are opt-in slow). | — |

## 3. Current system
- Grade tracker: `src/table/decision-grades.ts:16-31` (`requestNewGrades`) stores the bare request promises.
  `gradedDecisions` (`:35-46`) runs `Promise.all(grades.pending)` only at hand end.
- Table session hook: `src/ui/table/useTableSession.ts:212-216` requests grades in the table effect after every
  commit. `:249-273` at hand end chains the record write on `gradedDecisions` and logs
  `console.error('Hand record could not be saved', error)` (`:268-270`). A rejected `write.current` stops the
  auto-deal (`:287-299`), `dealNext` (`:329-338`) and `rebuy` (`:342-351`). `requestDecisionGrade` is at
  `:127-137`.
- Between `onHandComplete` and `onHandGraded`, `Table` holds `review = { hand, entries: null, open: true }`
  (`src/ui/table/Table.tsx:408-411`). `TableView` shows Deal next hand when `review !== null` and a result exists
  (`:336-340`), and the panel only when `review.open && review.entries !== null` (`:353-360`). After a failed
  grade, `onHandGraded` is never called, so the state stays pending. This is the A-2 state in TASK-9.3, which has
  no test.
- Since TASK-13.1, `src/ui/AppRoot.tsx:34-41` listens for `unhandledrejection` and shows the error screen for
  every unhandled rejection (`src/ui/error/unexpected-error.ts:9-12`). So today a grade rejecting mid-hand
  replaces the table with the error screen before the hand ends (doc-143, review MINOR). A rejected bot decision
  is deliberately rethrown through `setTable` into the error boundary (`useTableSession.ts:229-240`). That path is
  unchanged.
- Documented intent: a failed grade fails the record write, the result stays on screen, no further hand is dealt,
  and Leave table still works (`docs/storage/hand-records.md:125-131`, `docs/ui/review.md:126-129`). The error
  screen section of `docs/ui/navigation.md:149-176` says nothing about grades (doc-143 follow-up).
- Tests: Vitest in the `node` environment (`vite.config.ts:9-11`). UI markup tests use `renderToString`
  (`tests/ui/review-panel.acceptance.test.tsx:1-15`). Playwright runs against `vite preview` of the built app in
  Chromium and WebKit (`playwright.config.ts:13-21`).
- Existing code to reuse:
  - `e2e/support/fault-injection.ts` → `installFaults`/`armFault` and the `reject-bot` reply shape (`:35-56`).
    Add `reject-grade` beside it.
  - `e2e/support/paused-clock.ts` → `runUntil`, `runUntilMyTurn`.
  - `e2e/support/hand-records.ts` → `header`, `handOver`, `headerHand`, `storedRecords`/`storedCount`.
  - `e2e/hand-records.spec.ts:288-305` → the pattern for asserting the `Hand record could not be saved` console
    log, no page errors, and the table staying on hand 1 (copy the pattern; the file is locked).
  - `e2e/error-recovery.spec.ts:30-40` → how to start a game and locate the error heading (`ERROR_HEADING` from
    `src/ui/error/ErrorScreen.tsx`). Helpers there are not exported, so copy the few one-liners needed.
  - `tests/ui/review-panel.acceptance.test.tsx:9-25` → `render`, `DEAL_NEXT` regex and `REVIEW_FOUR`
    (`tests/support/table-scenarios.ts`) for the pending-grades markup test.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Each grade promise gets a no-op rejection handler when requested. The failure is handled once, at hand end, by the existing record-write path. | Rethrow into the error boundary at once, as for bot decisions (contradicts AC#1). | AC#1 requires the hand to reach its end and log the write failure. | no | n/a |
| D-2 | What the user sees after a failed grade (Q-1 answer A): the hand plays to its result, the result stays on screen, no review panel or badge, no next hand is dealt (Deal next hand does nothing), and Leave table and Home still work. Resume re-deals that hand number. No error screen. TASK-13.3 must know a write can fail because grading failed (its Retry must re-request grades). | (B) show the error screen at hand end, after the log; (C) keep today's error screen mid-hand. | Matches the documented write-failure rule and the locked store-failure behaviour. TASK-13.3 later adds the visible message. | yes | Approved by Q-1 |

## 5. Design

### Files to create / modify
- `src/table/decision-grades.ts` — `requestNewGrades` marks each new request promise handled. Doc comment updated.
- `tests/table/decision-grades-rejection.test.ts` — new unit tests (SPEC-03, SPEC-04).
- `tests/ui/review-pending.acceptance.test.tsx` — new acceptance test of the pending-grades markup (SPEC-02).
- `e2e/support/fault-injection.ts` — add the `reject-grade` fault (test-only, never imported from `src/`).
- `e2e/grade-failure.spec.ts` — new e2e spec, Chromium and WebKit (SPEC-01).
- `docs/ui/navigation.md` — "Failed decision grade" paragraph and a Tests-list line (SPEC-05).
- `docs/ui/review.md` — Timing paragraph: no unhandled rejection and no error screen (SPEC-05).

### Components, interfaces and data
- `requestNewGrades(grades, table, request)` keeps its signature and return value. For each new
  `p = request(decision)` it calls `p.catch(noop)` (or `p.then(undefined, noop)`) and stores `p` itself, not the
  derived promise, in `pending`. Invariant: `gradedDecisions` resolves or rejects exactly as before (rejects with
  the first failed request's error), and no rejection of a request promise is ever unhandled.
- `Fault` union in `e2e/support/fault-injection.ts` gains `'reject-grade'`. While it is armed, the next posted
  message with `kind === 'grade'` is not forwarded. On a microtask the worker dispatches
  `{ id, ok: false, error: { name: 'Error', message: 'Injected grade failure' } }`, then the fault disarms (one-shot,
  like the others). The init script also sets `window.__tlhGradeFaulted = true` when it fires, so the test can
  prove the rejection happened before the hand ended.
- No production interface, persisted data or user-visible text changes (text only in docs).

### Rules and algorithms
- Example: the user calls preflop in hand 1 with `reject-grade` armed. The grade promise rejects within a
  microtask. `requestNewGrades` has already attached its handler, so no `unhandledrejection` fires and no error
  screen shows. The bots play on. At the result, `gradedDecisions` rejects with `Error: Injected grade failure`. The
  write chain rejects. The existing handler logs `Hand record could not be saved` with that error. `onHandGraded` is
  never called, so `review.entries` stays `null`: no `<aside>`. The auto-deal and Deal next hand are no-ops on the
  rejected write, so the header stays `Hand #1`. Nothing is stored for hand 1.

### Error handling and configuration
- The only log is the existing `console.error('Hand record could not be saved', error)`. There is no
  `Unexpected error` log, because the error screen is not reached (D-2, Q-1).
- Leaving mid-hand (TASK-10.2) after a failed grade: the write rejects, `onLeft` is still called
  (`useTableSession.ts:275-285`) and the session ends with the hands that were stored. This is unchanged.

## 6. Behaviour specification

### SPEC-01: A grade that fails mid-hand is handled and the hand still ends with the write-failure log
- Verifies: AC#1, AC#3
- Behaviour: Given the built app in Chromium and WebKit, with an init script counting `window` `unhandledrejection` events and the `reject-grade` fault armed just before the user's first action of Hand #1, When the user calls or checks preflop (the grade reply is `ok:false`, so `window.__tlhGradeFaulted === true` while the hand has no result yet) and the paused clock runs on, folding at any later user turn, until the console shows `Hand record could not be saved`, Then the `unhandledrejection` count is 0, no page error was raised, the console has no `Unexpected error` line, the error heading (`ERROR_HEADING`) never appears, `aside.review-panel` (and any `<aside>`) has count 0 at every polled slice, and the `Hand over` result is visible. After a further 100 × 50 ms of the paused clock the header still reads `Hand #1`, Leave table is enabled, and no hand record is stored (`storedCount` is 0). (The last three checks follow D-2, approved by Q-1.)
- Verification: acceptance `e2e/grade-failure.spec.ts::a grade that fails mid-hand logs the failed save at hand end with no unhandled rejection or review panel`

### SPEC-02: Pending grades: no review panel, Deal next hand present
- Verifies: AC#2
- Behaviour: Given the finished hand `REVIEW_FOUR` (a result is shown), When `TableView` renders with `review = { entries: null, open: true }`, Then the markup contains no `<aside`, and it contains exactly one `<button type="button" class="deal-next" …>Deal next hand</button>`. With `review = { entries: null, open: false }` the result is the same (no `<aside`, one Deal next hand).
- Verification: acceptance `tests/ui/review-pending.acceptance.test.tsx::a finished hand whose grades are pending shows Deal next hand and no review panel`

### SPEC-03: A rejected grade request is never an unhandled rejection, even if the hand never ends
- Verifies: AC#3
- Behaviour: Given a `process` `unhandledRejection` listener and a table with one user decision, When `requestNewGrades(NO_GRADES, table, () => Promise.reject(new Error('x')))` runs and `gradedDecisions` is never called (the hand never ends), and then two macrotasks pass (`setTimeout` 0, twice), Then the listener has seen 0 rejections, and the tracker's `pending` has length 1.
- Verification: unit `tests/table/decision-grades-rejection.test.ts::a rejected grade request is handled when requested`

### SPEC-04: The hand end still sees the failed grade
- Verifies: AC#1, AC#3
- Behaviour: Given the tracker from SPEC-03 (with a request that rejects with `Error('x')`) for a done table with the same decisions, When `gradedDecisions(grades, table)` is awaited, Then it rejects with that same `Error('x')` instance. Given a second decision whose request resolves, the tracker's `pending` holds the original promises: the resolving one resolves to its entry, and `gradedDecisions` still rejects with `Error('x')`.
- Verification: unit `tests/table/decision-grades-rejection.test.ts::gradedDecisions still rejects with the failed grade's error`

### SPEC-05: Docs state what the user sees after a failed grade
- Verifies: AC#3
- Behaviour: Given `docs/ui/navigation.md`, When read, Then it has a "Failed decision grade (TASK-9.10)" paragraph saying: a grade request that fails mid-hand does not show the error screen and is not an unhandled rejection; the hand plays to its result; `Hand record could not be saved` is logged; no Hand Review or review badge opens; no further hand is dealt (Deal next hand does nothing); Leave table and Home still work; and Resume deals that hand number again, because it has no record. The error screen list (`docs/ui/navigation.md:155-160`) says a failed decision grade is not one of its causes. The Tests list names `e2e/grade-failure.spec.ts`. `docs/ui/review.md`'s Timing paragraph says the failure shows no error screen.
- Verification: manual read `docs/ui/navigation.md` §"Error screen" and §"Tests", `docs/ui/review.md` §"Timing"

### SPEC-06: Repository checks stay green and no locked test changes
- Verifies: AC#1, AC#2, AC#3
- Behaviour: Given the change, When the five commands run, Then lint, typecheck and format check are clean, `npm test` passes with coverage thresholds met, `npm run e2e` passes (Chromium and WebKit, including the locked `e2e/error-recovery.spec.ts`, `e2e/hand-records.spec.ts`, `e2e/review*.spec.ts`), and `doit.py test-integrity` reports no locked file modified.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run e2e`

## 7. Edge cases
- Grade fails after the hand already ended (the request was in flight at the result): the same write-failure path. The handler from `requestNewGrades` and the write's own catch both exist. Covered by SPEC-04 (rejection still propagates) and SPEC-01's log.
- The hand never ends (Home mid-hand unmounts the Table, or the page closes): no unhandled rejection. SPEC-03.
- More than one grade fails in a hand: `Promise.all` rejects with the first. One log line. Covered by SPEC-04's first-error rule.
- Leave table mid-hand with a failed grade: the session still ends (unchanged path, `useTableSession.ts:275-285`). N/A for new tests. The behaviour is documented and unchanged.
- The worker itself fails (an `error` event): the next bot request rejects and shows the error screen through the bot path. This is unchanged and out of scope (A-2).
- Tracker mismatch (`RangeError('Grades do not match the decisions')`): already handled by the write catch. Unchanged.
- Concurrency: the request runs in the effect after commit. React StrictMode double-effects return the same tracker (`requestNewGrades` returns its input when nothing is new). No new case.

## 8. Security considerations
- Trust boundaries: none new. Worker replies are already parsed by `AdviceClient`.
- Fault injection is test-only: it lives in `e2e/support/` and is installed by a Playwright init script. Nothing under `src/` imports it, and the locked `e2e/error-recovery.spec.ts` already asserts that no `__tlhFault` marker is in `dist/`. The new `__tlhGradeFaulted` flag lives in the same init script.
- Sensitive data in logs: no change. The existing local `console.error` only, nothing sent or stored.
- New dependencies: none. Randomness: N/A.

## 9. Non-functional
- No performance target. The change adds one `.catch` per user decision. There are no speed or scale checks, so nothing goes in the opt-in slow groups.
- The e2e test uses the paused clock, so it does not depend on real time. Expected under 10 s per browser.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview` (then play a hand; to fail a grade, run `npx playwright test e2e/grade-failure.spec.ts`)
- New tests:
  - `e2e/grade-failure.spec.ts` → SPEC-01 (acceptance; Chromium and WebKit)
  - `tests/ui/review-pending.acceptance.test.tsx` → SPEC-02 (acceptance)
  - `tests/table/decision-grades-rejection.test.ts` → SPEC-03, SPEC-04 (unit)
- End-to-end scenario for the Judge: with the fault script installed, start a new game, arm `reject-grade`, and call preflop in Hand #1. Confirm the table stays up (no error screen) while the bots play on, and finish the hand. Confirm: the `Hand record could not be saved` log, no `unhandledrejection`, no review panel or badge, the header stays on Hand #1, Leave table works and opens the Session report path (0 hands → Home), and nothing is stored for hand 1. Holdout: revert the `src/table/decision-grades.ts` change. SPEC-01 must then fail, because the error screen appears mid-hand.
- Locked tests whose values change: none. Checked: `e2e/error-recovery.spec.ts` (TASK-13.1) has no grade fault and only gains an unused union member in the support file it imports. `e2e/hand-records.spec.ts` (TASK-3.9, TASK-1.55) covers store failure, which is unchanged. `tests/ui/review-panel.acceptance.test.tsx` (TASK-9.1, TASK-9.3), `tests/ui/review-numbers.acceptance.test.tsx` and `e2e/review-numbers.spec.ts` (TASK-9.3) use only resolving grades.

## 11. Open questions
- None. Q-1 resolved (answer A, see D-2 and `doit/TASK-9.10/qa.md`).

## 12. Clarifications log
See `doit/TASK-9.10/qa.md`.
