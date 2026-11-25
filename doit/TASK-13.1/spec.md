# Spec: TASK-13.1 — Return Home from an unexpected error without losing completed hands

Status: READY (approved 2026-11-25)
Task: TASK-13.1 · Parent/epic: TASK-13 · Requirements: REQ-056.3, REQ-057.1, REQ-057.2, REQ-057.4 · Dream: limit-holdem-trainer

## 1. Summary
Today any unexpected error unmounts the whole React root and leaves a blank page. A rejected bot decision is
already rethrown in a `setTable` updater (`src/ui/table/useTableSession.ts:232-237`), and nothing catches it. This
story adds a top-level error boundary and `window` `error` / `unhandledrejection` handlers. They show one error
screen with a short message and a native `Return Home` button. Return Home remounts App on Home. Nothing is written,
so the session record stored after the last completed hand stays paused and Resume continues from there, exactly as
after closing the app mid-hand (REQ-004.2). The shared advice client is also replaced once its worker has failed
(TASK-3.6 judge J-1-01), so a new game works without a reload.

## 2. Scope
- In scope:
  - `AppRoot`, a class error boundary above `App`. It also listens for `window` `error` and `unhandledrejection`.
    On an error it renders `ErrorScreen`. Return Home remounts `App` (new key) on Home with the heading focused.
  - `ErrorScreen`, the presentational error screen: heading, one sentence, `Return Home`. No error details.
  - A pure classifier that decides which window events count as unexpected errors.
  - `sharedAdviceClient` replaces a client whose worker has failed. Return Home prewarms the replacement.
  - `App` takes an optional `returned` prop for its first Home screen.
  - Tests: Vitest markup, classifier and client tests, plus a Playwright spec through the real built App. It uses
    test-only fault injection from Playwright init scripts.
  - `docs/ui/navigation.md`: the error screen, and how Return Home and Resume behave after an error.
- Not doing:
  - No change to how or when hands and sessions are stored (`src/storage/hand-store.ts`, `useTableSession` writes).
    No write on error or on Return Home.
  - Failed hand writes and failed decision grades (stuck table after a write fails). Those belong to TASK-13.3
    and TASK-9.10.
  - No telemetry or error reporting off the device. No new dependency.
  - No new App route. `type Screen` in `App.tsx` is unchanged, so the play-money screen list and its locked tests are
    unchanged (A-3).
  - No fault-injection code under `src/`. The production bundle carries no test hook (D-3).
  - No retry or "Try again" control. No error details or "copy error" disclosure.
- Scope budget: files=13, lines=700

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | A window `error` event counts only when `event.error` is not null/undefined. A `unhandledrejection` always counts, whatever its `reason`. | yes | Cross-origin "Script error." and Chrome's benign "ResizeObserver loop…" events carry `error: null`. The app never leaves a rejection unhandled on purpose: every store and advice promise has a handler (`App.tsx:85-94`, `useTableSession.ts:190,261`). | Count every error event, which risks false error screens from benign browser noise. Count only `Error` reasons. |
| A-2 | While the error screen is shown, further errors are ignored. The first error wins and is the only one logged by AppRoot. | yes | The App is unmounted then, so later errors are stragglers (e.g. a reply to an unmounted table) and say nothing new to the user. | Log every one. |
| A-3 | The error screen is rendered by `AppRoot`, outside App's `type Screen` union, so it is not added to `e2e/support/screen-list.ts`. Its play-money text check and axe scan run in the new `e2e/error-recovery.spec.ts`. | yes | App cannot catch its own render errors, so an `error` route in App would never be the one shown. Adding a SCREEN_LIST entry with no matching route fails `unlistedScreens` (`e2e/support/play-money.ts:72-92`), and the locked `e2e/play-money.spec.ts` would have to provoke an error. | Add an `error` route to `type Screen` and edit the locked `tests/ui/screen-list.acceptance.test.ts` and `e2e/play-money.spec.ts` (owner TASK-2.15). |
| A-4 | Return Home steps back off the Table's history entry when the current entry is one (`history.state.tlhTable` set), and then remounts App. | yes | The new App has no table key, so its popstate handler ignores that step (`App.tsx:174-179`). Browser Back from Home then behaves as after the Home control. | Leave the stale entry, which makes Back from Home do nothing once. |
| A-5 | Return Home calls `sharedAdviceClient()` so a failed client is replaced and its worker warmed before the next table, like `main.tsx:13`. | yes | The first bot step of the next game does not wait for a cold worker. | Replace it lazily on the next request only. |
| A-6 | Return Home after an error on the busy `ending` screen does not wait for the pending `endSession`. Home reads after `tableWritesSettled()` as usual. | yes | `endSession` is not in the table-write chain today (`App.tsx:159`). This race needs an error during the few ms of ending, and it only decides whether Home shows Resume for that session. | Track `endSession` in the chain. |

## 3. Current system
- Stack: React 19 + Vite 8 + TypeScript 6 strict, Vitest 5 (node environment, `renderToString` for UI;
  `vite.config.ts:9-24`), Playwright 1.65 against `npm run build && npm run preview` on :4173 in Chromium and WebKit
  (`playwright.config.ts:12-22`). Lint is ESLint + Prettier + `tools/lint/sync-copies.js` (`package.json:30`).
- Root: `src/main.tsx` renders `<StrictMode><App/></StrictMode>` and prewarms the advice worker
  (`src/main.tsx:13-19`). There is no error boundary or window error handler anywhere in `src/`.
- App screens: `type Screen` union (`src/ui/App.tsx:29-46`). The initial state is Home `returned: false`
  (`App.tsx:69`). Home reads the paused session after `tableWritesSettled()` on each entry to Home (`App.tsx:101-121`).
  `returned: true` focuses Home's heading (`App.tsx:301`, `src/ui/useHeadingFocus.ts`).
- Where errors arise today:
  - Bot decision rejected (worker `error` / `messageerror`, or `ok:false` reply) → `setTable(() => { throw error })`
    → render error with no boundary (`useTableSession.ts:228-239`).
  - Illegal bot action → `applyBotDecision` throws RangeError inside the updater (`src/table/session.ts:652-656`).
  - Worker failure enters the client's permanent failed state and rejects all pending requests
    (`src/ui/advice/advice-client.ts:62-68,126-135`). `sharedAdviceClient` keeps returning that failed client
    (`advice-client.ts:149-152`): J-1-01 in `doit/TASK-3.6/judge/round-1.json:102`.
  - Hint failures are handled (`src/ui/table/Table.tsx:446-449`). Store reads, writes and settings are logged and
    handled (`App.tsx:89-93,112-116,166-169`, `useTableSession.ts:190,261`).
- Persistence: each completed hand's record and the next-hand session record are committed in one IndexedDB
  transaction (`src/storage/hand-store.ts:194-204`). The next hand is dealt only after that write resolves
  (`useTableSession.ts:284-292`), so during hand N hands 1..N-1 are stored and the session record holds handsPlayed
  N-1. A session with 0 hands is not offered for Resume (`hand-store.ts:101`). Resume restores the record and deals
  the next hand (`App.tsx:212-226`). Home's subtitle is `resumeSummary` (`src/table/table-view.ts:75-79`).
- Locked tests touching this area (from `doit/*/state.json` `locked_tests`). None must change under this design:
  - `tests/ui/screen-list.acceptance.test.ts` (TASK-2.15, 11.1, 12.1): pins the App routes and dialogs. Unchanged
    because `type Screen` is unchanged.
  - `e2e/play-money.spec.ts` (TASK-10.2/2.15): visits every SCREEN_LIST id. Unchanged (A-3).
  - `tests/ui/advice-worker.acceptance.test.ts` (TASK-3.6): "every table shares one app-wide client whose worker is
    created once" still holds, because a healthy client is reused.
  - `tests/ui/home.acceptance.test.tsx`, `e2e/home.spec.ts` (TASK-2.1), `tests/ui/home-resume.acceptance.test.tsx`
    (TASK-2.6), `e2e/home-first-load.spec.ts` (TASK-2.18), `e2e/home-control.spec.ts` (TASK-2.14),
    `e2e/worker-delay.spec.ts` (TASK-1.52): Home at launch, the Resume rendering and the Worker wrapper are
    unchanged.
  - `tests/unit/app.test.tsx` (not locked) renders `<App />`, which stays valid because `returned` is optional.
- Existing code to reuse:
  - `src/ui/useHeadingFocus.ts` → focus the error heading on show.
  - `.screen`, `.screen button` (44px minimum, `src/ui/styles.css:22,38-43`) and the `.screen .report-home` rule
    (`styles.css:240-249`) → add `.screen .error-home` to that selector instead of new button CSS.
  - `e2e/support/hand-records.ts` → `seedStoredRecords`, `seedStoredSessions`, `storedRecords`, `storedSessions`,
    `header`, `handOver`, `playToResult`, `advanceToHand`.
  - `e2e/support/paused-clock.ts` → `runUntil`, `runUntilMyTurn`, `axeWithPausedClock`. The `delayWorkerReplies`
    Worker-subclass pattern (`paused-clock.ts:50-81`) is the model for the fault wrapper.
  - `e2e/support/play-money.ts` → `realMoneyOffers` for the error screen's text.
  - `tests/support/session-play.ts::playSession` + `src/table/session-record.ts::handWrite` → seeded completed hands,
    as in `e2e/resume.spec.ts:132-146`. Copy `seatRows`/`storedRows` from `e2e/resume.spec.ts:101-122`.
  - `e2e/support/table-harness-bundle.ts::stubReplayWords` → pinned deals.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Error screen text: heading `Something went wrong`, paragraph `The app hit an unexpected problem. Every completed hand is saved, and a paused session resumes from its last completed hand.`, button `Return Home`. | Shorter sentence; "Unexpected error" heading (Q-1) | User-visible text. | yes | user (Q-1) |
| D-2 | On an error the session is left as stored. Nothing is written or ended, so it shows as paused on Home and the unfinished hand is not stored. | End the session and show its report; store a partial hand (Q-2) | AC#2/#3 and REQ-004.2 match the existing "close mid-hand" path. | yes | user (Q-2) |
| D-3 | Faults are injected only by Playwright init scripts in `e2e/support/fault-injection.ts`. A `Worker` subclass replaces a bot request's reply with an illegal action, an `ok:false` reply or a worker `error` event. A one-shot `HTMLElement.prototype.focus` patch throws when the focused element's text is `Session report`, which is ReportScreen's mount effect (`ReportScreen.tsx:84,91`) and is caught by the boundary like a render error. Nothing ships in `dist/`. | A global `window.__TLH_FAULT__` hook read in `src/` (ships an inert hook to production). A separate `vite build --mode e2e` (a second build and server, and the play-money bundle check would read a non-production build). | The task asks for an error-injection hook. Browser-level injection exercises the real code paths with no test seam in production. | no | n/a |
| D-4 | Logging: AppRoot logs `console.error('Unexpected error', error)` once per shown error screen. There is no telemetry, storage of errors or network call. | Local IndexedDB error log; no logging (Q-3) | Matches the app's existing logging pattern (`App.tsx:91`). DoD#8 forbids network. | yes | user (Q-3) |
| D-5 | `AdviceClient` gains `get failed(): boolean` (true once `#failure` is set). `sharedAdviceClient` creates a new client when none exists or the current one has failed. | Reset only on Return Home (an explicit `resetSharedAdviceClient`). | Fixes J-1-01 wherever the next request comes from, keeps the locked "created once" test true, and is 3 lines. | no | n/a |

## 5. Design

### Files to create / modify
- `src/ui/AppRoot.tsx` — new: `AppRoot` class error boundary + window listeners, renders `App` or `ErrorScreen`.
- `src/ui/error/ErrorScreen.tsx` — new: the error screen markup.
- `src/ui/error/unexpected-error.ts` — new: pure classifiers for window events.
- `src/ui/App.tsx` — modify: optional `returned` prop for the initial Home screen. `type Screen` is untouched, and
  no `;` is added inside its comments.
- `src/main.tsx` — modify: render `<AppRoot />` instead of `<App />`.
- `src/ui/advice/advice-client.ts` — modify: `failed` getter, and `sharedAdviceClient` replaces a failed client.
- `src/ui/styles.css` — modify: `.screen .error-home` joins the `.screen .report-home` rule, plus a small
  `.error-screen` layout rule.
- `tests/ui/error-screen.acceptance.test.tsx` — new (acceptance): ErrorScreen markup.
- `tests/ui/unexpected-error.test.ts` — new (unit): classifiers.
- `tests/ui/advice-client-recovery.test.ts` — new (unit): failed shared client is replaced. It is a separate file
  so module state stays isolated from the locked advice-worker test.
- `e2e/support/fault-injection.ts` — new: init script + `armFault(page, kind)` + `workerCount(page)`.
- `e2e/error-recovery.spec.ts` — new (acceptance): five flows through the real App.
- `docs/ui/navigation.md` — modify: Error screen row and section.

### Components, interfaces and data
- `src/ui/error/unexpected-error.ts`
  - `unexpectedFromErrorEvent(event: { readonly error?: unknown }): unknown | null`: returns `event.error` if it is
    neither `null` nor `undefined`, else `null` (A-1).
  - `unexpectedFromRejection(event: { readonly reason?: unknown }): unknown`: returns `event.reason` (A-1).
- `src/ui/error/ErrorScreen.tsx`: `ErrorScreen({ onHome }: { readonly onHome: () => void })`. It renders exactly:
  `<main class="screen error-screen"><h1>{HEADING}</h1><p class="error-message">{MESSAGE}</p><button type="button"
  class="error-home">Return Home</button></main>`. The h1 uses `useHeadingFocus(true)`. Exported constants
  `ERROR_HEADING`, `ERROR_MESSAGE` hold the D-1 text. No props carry the error, so it can never be shown.
- `src/ui/AppRoot.tsx`: `export class AppRoot extends React.Component<{}, { error: boolean; generation: number;
  returned: boolean }>`.
  - `static getDerivedStateFromError(): Partial<State>` → `{ error: true }`.
  - `componentDidCatch(error)` logs per D-4.
  - `componentDidMount` adds `window` listeners for `error` and `unhandledrejection`. `componentWillUnmount` removes
    them. Each listener does nothing if `state.error` is already true (A-2). Otherwise, if its classifier returns
    non-null, it logs per D-4 and sets `{ error: true }`.
  - `returnHome()`: does A-4's history step, then A-5's `sharedAdviceClient()` (in try/catch, logged on failure),
    then `setState({ error: false, generation: generation + 1, returned: true })`.
  - `render()`: `error ? <ErrorScreen onHome={returnHome}/> : <App key={generation} returned={returned}/>`.
- `src/ui/App.tsx`: `export default function App({ returned = false }: { readonly returned?: boolean } = {})`. The
  initial screen is `{ name: 'home', returned }`.
- `src/ui/advice/advice-client.ts`: `get failed(): boolean`. `sharedAdviceClient(create)`: `if (shared === null ||
  shared.failed) shared = new AdviceClient(create()); return shared;`. A throwing `create` still leaves `shared`
  as it was and throws, as today.
- `e2e/support/fault-injection.ts`
  - `installFaults(): void` (init script). It counts Worker constructions in `window.__tlhWorkers`. It wraps
    `window.Worker` with a subclass whose `postMessage(msg)` checks `window.__tlhFault`. When that is
    `'illegal-bot' | 'reject-bot' | 'worker-error'` and `msg.kind === 'bot'`, it clears the arm (one-shot), does not
    forward the message, and on a microtask:
    - illegal-bot: dispatches `MessageEvent('message', { data: { id: msg.id, ok: true, value: { type: 'fold',
      seat: 0 } } })`. Seat 0 is never to act, so `applyBotDecision` throws RangeError.
    - reject-bot: dispatches `{ id: msg.id, ok: false, error: { name: 'Error', message: 'Injected bot failure' } }`.
    - worker-error: dispatches `ErrorEvent('error', { message: 'Injected worker failure' })`.

    It also patches `HTMLElement.prototype.focus`: when `__tlhFault === 'report-render'` and
    `this.textContent === 'Session report'`, it clears the arm and throws `Error('Injected report failure')`.
  - `armFault(page, kind)` sets `window.__tlhFault`. `workerCount(page)` reads `window.__tlhWorkers`.

### Rules and algorithms
- Error-to-screen: any render, commit or effect error below AppRoot, any counted window `error`, and any
  `unhandledrejection` → ErrorScreen replaces the whole app. App unmounts, along with its table timers and pending
  bot replies (the existing `cancelled` flags, `useTableSession.ts:241-244`).
- Return Home → App remounts on Home `returned: true`. Home's effect waits for `tableWritesSettled()`, then reads
  `pausedSession()` (`App.tsx:104-105`). Hands written before the error are therefore visible.
- Worked example (AC#1-#3): the session holds hands 1-14 stored, and the session record has handsPlayed 14 with the
  stacks at the end of hand 14. Hand 15 is dealt and a bot step throws. The error screen shows and hand 15 is not
  stored. Return Home shows `Resume session` with subtitle `Cash · 6 players · $4/$8 · 14 hands · paused`. Resume
  shows header `Cash · 6 players · $4/$8 · Hand #15`, every seat's stack equals the stored record's stack, and records
  1-14 are byte-identical to before the error.
- Error during hand 1: the 0-hand session is not offered for Resume (`hand-store.ts:101`), so Home shows no Resume
  entry. This is existing behaviour (task Notes).

### Error handling and configuration
- Log text: `Unexpected error` (D-4). No configuration. If prewarming the client throws, it is logged as
  `Advice worker could not be started` and Return Home still proceeds.

## 6. Behaviour specification

### SPEC-01: A thrown bot action in hand 15 shows the error screen
- Verifies: AC#1, AC#5, DoD#7
- Behaviour: Given a 6-max $4/$8 session resumed with hands 1-13 seeded, and hand 14 played to its result through
  the App so that hand 14 is stored, When `illegal-bot` is armed and hand 15's first bot decision is applied, Then the
  table is gone and the only `main` shows heading `ERROR_HEADING`, paragraph `ERROR_MESSAGE` and a button named
  `Return Home`. The `main`'s innerText equals exactly those three texts. It does not contain `Injected`, `Error`,
  ` at `, `.ts`, `.tsx` or `.js`. `realMoneyOffers` finds nothing. One Tab from the focused heading focuses a
  `BUTTON` element named Return Home. `axeWithPausedClock` reports zero serious or critical violations. All
  requests are same-origin.
- Verification: acceptance `e2e/error-recovery.spec.ts::an error during a bot action in hand 15 shows the error screen and Resume continues from hand 14`

### SPEC-02: Return Home shows Resume with 14 hands
- Verifies: AC#2
- Behaviour: Given the error screen from SPEC-01, When Return Home is activated by keyboard (Enter on the focused
  button), Then Home's `TLH Trainer` heading is focused and the Main menu shows `Resume session` with subtitle
  `Cash · 6 players · $4/$8 · 14 hands · paused`.
- Verification: acceptance `e2e/error-recovery.spec.ts::an error during a bot action in hand 15 shows the error screen and Resume continues from hand 14`

### SPEC-03: Resume deals hand 15 fresh from the end of hand 14 with records 1-14 unchanged
- Verifies: AC#3
- Behaviour: Given SPEC-02's Home, and snapshots of the stored hand records and session record taken after hand 14
  was stored and before arming, When Resume session is chosen, Then the header reads
  `Cash · 6 players · $4/$8 · Hand #15` and the seat rows equal the snapshot session's seats (copied
  `seatRows`/`storedRows`). Stored records are exactly the 14 snapshot records (hand numbers 1-14, deep-equal), with
  no hand-15 record. The stored session record deep-equals the snapshot (handsPlayed 14).
- Verification: acceptance `e2e/error-recovery.spec.ts::an error during a bot action in hand 15 shows the error screen and Resume continues from hand 14`

### SPEC-04: An error while the Session Report mounts shows the error screen
- Verifies: AC#4
- Behaviour: Given a resumed seeded session with at least one completed hand, When `report-render` is armed and the
  user chooses Leave table and confirms, Then the error screen shows, not the Session report. Return Home opens Home
  with the `TLH Trainer` heading. The ended session is not offered for Resume, because the report was stored by
  `endSession` before rendering.
- Verification: acceptance `e2e/error-recovery.spec.ts::an error while the Session Report renders shows the error screen and Return Home opens Home`

### SPEC-05: Worker failure while a bot decides, then a fresh worker for a new game
- Verifies: AC#6, AC#7
- Behaviour: Given a session seeded at hand 15 (14 records) and resumed, When `worker-error` is armed and the first
  bot request of hand 15 is posted, Then the error screen shows. Return Home shows Resume with `14 hands`, and the 14
  records are unchanged. When the user then chooses New game → Start game → End session and start (ending the paused
  session), Then `workerCount` is exactly one more than before Return Home, and the new table reaches the user's turn
  (`runUntilMyTurn`) with at least one bot action applied (`data-action-count` > 2). A `window` marker set before the
  error is still present, which shows there was no page reload.
- Verification: acceptance `e2e/error-recovery.spec.ts::a worker failure while a bot decides shows the error screen and a new game gets a fresh worker`

### SPEC-06: A rejected bot decision takes the same path
- Verifies: AC#6
- Behaviour: Given a session seeded at hand 15 and resumed, When `reject-bot` is armed and hand 15's first bot
  request is answered `ok:false`, Then the error screen shows. Return Home shows Resume with `14 hands`, and stored
  records 1-14 are unchanged.
- Verification: acceptance `e2e/error-recovery.spec.ts::a rejected bot decision shows the error screen and Return Home keeps completed hands`

### SPEC-07: Uncaught errors and unhandled rejections outside React
- Verifies: AC#5
- Behaviour: Given Home, When the page runs `queueMicrotask(() => { throw new Error('Injected uncaught') })`, Then the
  error screen shows, and Return Home opens Home. When the page then runs `void Promise.reject(new Error('Injected
  rejection'))`, Then the error screen shows again, and Return Home opens Home.
- Verification: acceptance `e2e/error-recovery.spec.ts::an uncaught error and an unhandled rejection show the error screen`

### SPEC-08: Error screen markup has no details and one native button
- Verifies: AC#5
- Behaviour: `renderToString(<ErrorScreen onHome={noop} />)` equals
  `<main class="screen error-screen"><h1>Something went wrong</h1><p class="error-message">The app hit an unexpected problem. Every completed hand is saved, and a paused session resumes from its last completed hand.</p><button type="button" class="error-home">Return Home</button></main>`,
  (the D-1 text, approved by Q-1).
- Verification: acceptance `tests/ui/error-screen.acceptance.test.tsx::the error screen shows a heading, one sentence and a native Return Home button only`

### SPEC-09: Which window events count
- Verifies: AC#5
- Behaviour: `unexpectedFromErrorEvent({ error: e })` returns `e` for an `Error` and for a thrown string `'x'`.
  `{ error: null }` and `{}` return `null`. `unexpectedFromRejection({ reason: r })` returns `r` for an `Error`, for
  `'x'` and for `undefined`.
- Verification: unit `tests/ui/unexpected-error.test.ts::error events without an error object are ignored and every rejection counts`

### SPEC-10: The shared advice client is replaced after its worker fails
- Verifies: AC#7
- Behaviour: Given `sharedAdviceClient(create)` with a fake worker, When that worker emits `error`, Then the client
  reports `failed === true`, and the next `sharedAdviceClient(create)` returns a different client built on a second
  fake worker. That client answers a `decideBot` reply, and further calls return it, with `create` called exactly
  twice. A healthy client is never replaced (three calls, one `create`).
- Verification: unit `tests/ui/advice-client-recovery.test.ts::a failed shared client is replaced by one fresh client and a healthy one is kept`

### SPEC-11: Project checks
- Verifies: DoD#1, DoD#2, DoD#4, DoD#5, DoD#10
- Behaviour: Lint (including the headless boundary), typecheck, the full Vitest suite with coverage (≥ 90%
  engine/bots/advice/stats/playtest/table, ≥ 70% overall) and the e2e suite pass with zero errors. No locked test is
  changed. CI is green on the branch.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run e2e`

### SPEC-12: No network beyond the app's own files
- Verifies: DoD#8
- Behaviour: In SPEC-01 and SPEC-05 every request URL's origin is `http://localhost:4173`. `dist/` contains no
  `__tlhFault` marker (the fault code is never imported from `src/`).
- Verification: acceptance `e2e/error-recovery.spec.ts::an error during a bot action in hand 15 shows the error screen and Resume continues from hand 14`

### SPEC-13: Documentation
- Verifies: DoD#11
- Behaviour: `docs/ui/navigation.md` gains an "Error screen (TASK-13.1)" row and section. It covers what triggers the
  screen (render, effect and window errors, A-1), its text, Return Home (remount on Home with focus, history step,
  fresh advice worker) and Resume after an error (from the last completed hand, the unfinished hand not stored, no
  Resume after an error in hand 1). The story doc is published to Backlog.
- Verification: manual `docs/ui/navigation.md` and the `backlog doc list --plain` entry for TASK-13.1

### SPEC-14: Not-applicable DoD items
- Verifies: DoD#3, DoD#6, DoD#9, DoD#12
- Behaviour: No engine, bots or advice change, so the golden-spot suite (run by `npm test`) and the 10,000-hand
  playtest are unaffected. There is no strategy content. There is no service worker yet (no `serviceWorker` in
  `src/`; E13-S07 not done).
- Verification: manual `git diff --stat main -- src/engine src/bots src/advice` is empty

## 7. Edge cases
- Error in hand 1: no Resume, because the 0-hand session is skipped (`hand-store.ts:101`). This is existing
  behaviour, described in docs. No new test.
- Error while hand N-1's write is still in flight: this cannot happen during a bot step of hand N, because hand N is
  dealt only after the write resolves. An error during hand N-1's result display is still safe: Home waits for
  `tableWritesSettled()` before reading.
- Error while a dialog is open (bust, leave, end-session): the whole app is replaced. The same session rules apply.
  Covered by the boundary design; no separate test.
- Repeated errors: ignored while the screen shows (A-2). A new error after Return Home shows the screen again
  (SPEC-07 does two in a row).
- Worker `messageerror`: the same client failure path as `error` (`advice-client.ts:62-68`, covered by the locked
  `tests/ui/advice-worker.acceptance.test.ts`). The e2e covers `error` (SPEC-05).
- Benign browser error events with `error: null` (ResizeObserver, cross-origin): ignored (SPEC-09).
- Error during the `ending` screen: A-6.
- Error with the Table's history entry current: A-4.
- Concurrency across tabs, permissions, empty/max input: N/A, since there is no new input or storage.

## 8. Security considerations
- No error message, stack or file name is rendered (SPEC-01, SPEC-08). Errors are only logged to the local console
  (D-4). There is no network, telemetry or persistence of error data (SPEC-12).
- The fault injection is test-only, under `e2e/`, and absent from `dist/` (D-3, SPEC-12).
- No new dependency, input, secret or randomness.

## 9. Non-functional
- Accessibility: native `<button>` with at least 44×44 (`.screen button`), heading focused on show, axe zero serious
  or critical in Chromium and WebKit (SPEC-01). The text uses existing screen colours (`#f2f3f5` on the app
  background), and `.error-home` reuses the `.report-home` colours already passed by axe on the Session report.
- Suite speed: the Vitest additions are in-memory and run in well under 1 s. The e2e spec has 5 tests on the paused
  clock. Four seed their hands (only SPEC-01 plays one hand, folding), so each should take under 10 s per browser.
  Nothing joins `e2e:slow` or `test:slow`.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview` → New game → Start game, then in devtools run `queueMicrotask(() => { throw new Error('x') })` → error screen → Return Home → Resume session
- New tests (path → SPEC ids):
  - `e2e/error-recovery.spec.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05, SPEC-06, SPEC-07, SPEC-12
  - `tests/ui/error-screen.acceptance.test.tsx` → SPEC-08
  - `tests/ui/unexpected-error.test.ts` → SPEC-09
  - `tests/ui/advice-client-recovery.test.ts` → SPEC-10
  - Locked tests changed: none (A-3, §3).
- Judge end-to-end: `npm run build && npm run preview`. Start a game and play 3 hands. During hand 4, run
  `queueMicrotask(() => { throw new Error('boom') })` in devtools. The table is replaced by "Something went wrong",
  with no "boom" text and no stack. Tab reaches Return Home, and Enter opens Home with "… · 3 hands · paused". Resume:
  the header shows Hand #4 with the stacks from the end of hand 3. In devtools > IndexedDB > tlh-trainer > hands there
  are exactly 3 records. Then run `npx playwright test e2e/error-recovery.spec.ts` for the
  injected worker failure and the fresh-worker flow.

## 11. Open questions
None. Q-1, Q-2 and Q-3 were answered with the recommended options (`doit/TASK-13.1/qa.md`).

## 12. Clarifications log
See `doit/TASK-13.1/qa.md`.
