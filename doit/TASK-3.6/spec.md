# Spec: TASK-3.6 — Keep the table responsive while bots and advice compute

Status: READY (approved 2026-11-21)
Task: TASK-3.6 · Parent/epic: TASK-3 (Play hands at the table) · Requirements: REQ-055 (REQ-055.6; also REQ-025.1, REQ-059.2) · Dream: limit-holdem-trainer

## 1. Summary
Today every bot decision (`stepBot` → `tagPolicy` → `recommend` → `computeEquity`) runs on the browser main
thread inside a React state updater (`src/ui/table/useTableSession.ts:53-56`), so a slow equity run freezes the
table. This story moves bot decisions into a dedicated Web Worker. The worker is a thin browser host around a
new headless advice service, and it receives only the deciding seat's `PlayerView`. The same service and
client also answer `recommend` (hint, E08) and `grade` (review, E09) requests, so those stories reuse this
worker. Nothing on screen changes. Proof is Playwright tests driven through a test-only slow worker:
no long task, prompt repaints, p95 frame time, and bot actions identical to the headless playtest.
The timing-bound checks are opt-in (`npm run e2e:slow`, which sets `TLH_SLOW_TESTS=1`). Every push still runs
a structural guard (each bot decision is served by the worker) and the AC#3 determinism test.

## 2. Scope
- In scope:
  - `src/table/advice-service.ts` (new, headless). Message types `AdviceRequest` / `AdviceResponse` and the
    pure `handleAdviceRequest`, with three kinds: `bot`, `recommend` and `grade`.
  - `src/table/session.ts`. Split `stepBot` into `botTurn` (the PlayerView and style of the bot to act),
    `applyBotDecision` (applies an action only if the hand is still at that turn) and the existing `stepBot`,
    whose behaviour is unchanged.
  - `src/ui/advice/` (new, browser): `AdviceClient` (promise API over a worker), `installAdviceWorker`
    (the worker-side host), `advice.worker.ts` (production worker entry) and `createAdviceWorker()` (the
    Vite `new Worker(new URL(...))` factory).
  - `src/ui/table/useTableSession.ts`. It owns one advice worker per mounted table, and each bot step asks
    the worker instead of computing on the main thread. New optional option `createAdviceWorker` (a test seam
    that `Table` passes through, since `TableProps` already spreads `TableSessionOptions`).
  - e2e support. The existing table harness gets the real worker. A new advice harness has a test-only slow
    worker and instrumentation. Both harness pages load at the app's http origin, so workers can start.
  - `package.json`: new script `"e2e:slow": "TLH_SLOW_TESTS=1 playwright test e2e/responsive-table.spec.ts"`.
    `README.md`: document it next to `npm run test:slow` (`README.md:184-187`).
  - New tests: unit, acceptance (Vitest) and acceptance (Playwright).
- Not doing:
  - The Hint button or hint card (E08, TASK-8.1). Moving review grading off the main thread: `Table` still calls
    `reviewEntries` → `gradeView` synchronously (`src/ui/table/Table.tsx:214-217`). The worker's `grade` kind
    exists for TASK-9.3 to adopt, and nothing in the UI calls it yet.
  - Bot randomness or seeding (TASK-6.18). No seed, replay code or RNG state crosses the boundary (D-6).
  - Bot pacing or "Realistic" speed (TASK-3.13 / TASK-2.11). The per-step `setTimeout(0)` cadence stays.
  - Any change to engine, bots or advice logic, and any user-visible text or layout.
  - Caching or reusing equity results across requests, worker pools, and cancelling an in-flight computation.
  - Error UI or recovery when the worker fails (REQ-056 recovery story). Failures surface as they do today (D-7).
  - Changes to locked tests. None need to change (§3, "Locked tests").
- Scope budget: files=16, lines=1150

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Each bot request carries `{ view, style }` only. `style` is the seat's `BotStyle` (public table info). Every style still decides with `decideTag` until E06. | yes | `SessionSeat.style` is shown on screen (`src/table/session.ts:52-57`), so it isn't hidden info. Carrying it now saves E06 a protocol change. | Send the view only and look the style up in the worker |
| A-2 | The long-task (AC#1) and p95-frame (DoD#1) tests run in Chromium only. The hover/resize repaint (AC#2) and worker-equals-headless (AC#3) tests run in both Chromium and WebKit. | yes | WebKit doesn't implement the Long Tasks API (`PerformanceObserver.supportedEntryTypes` has no `longtask`). REQ-055's reference machine is Chrome. The rAF-based checks are meaningful in both engines. | Also run p95 frames in WebKit |
| A-3 | In the slow harness every bot decision (preflop too) takes at least the configured time. AC#1 needs this only postflop. | yes | It's a superset of the AC's precondition, and it gives more frame samples per hand toward the 200 that DoD#1 needs. | Slow down postflop decisions only |
| A-4 | A "repaint" after an event is the second `requestAnimationFrame` callback after the event's `timeStamp`, which proves at least one frame was produced after the event. | yes | rAF runs once per rendered frame, and its timestamp shares `performance.now()`'s time base with `event.timeStamp`. | First rAF only; a paint-timing heuristic |
| A-5 | "During the computation" means between the harness's `postMessage` of a bot request and the main-thread `message` event carrying its response, both recorded with `performance.now()` by the harness wrapper. | yes | That is exactly the period when the main thread waits on the worker. | Instrument inside the worker and post timestamps back |
| A-6 | One sample (DoD#1) is one rAF interval (consecutive rAF timestamps) whose start lies inside a computation window. The test plays hands until it has 200 samples or more. | yes | This states "p95 main-thread frame time over 200 samples" in a way a test can measure. | Count frames over the whole hand |
| A-7 | AC#3's headless side is `playHand` from the playtest runner with `button = 6` and `size = 6`. The user's recorded actions are replayed at seat 5, and TAG plays every other seat. | yes | The app's default table is the playtest cash table. Both use blinds 2/4, bets 4/8, $160 stacks and button 6 (`src/table/session.ts:90-99`, `src/playtest/runner.ts:29-30`), and `stakesFor({4,8})` gives 2/4/4/8. | Replay through `stepBot` in `session.ts` |

## 3. Current system
- Stack: React 19, Vite 8, TypeScript 6 strict, with `lib` including DOM (`tsconfig.json:4`) and `types`
  including `vite/client` (`tsconfig.json:9`). The `vite/client` types declare `*?worker` and `*?worker&inline`
  modules. Vitest 5 runs in the `node` environment with no jsdom, and UI tests use `renderToString`
  (`vite.config.ts:7-8`, `tests/ui/table.acceptance.test.tsx:1-5`). Effects never run there, so nothing creates
  a worker in Vitest. Playwright runs Chromium and WebKit against `npm run build && npm run preview` on port
  4173 (`playwright.config.ts:12-21`). Vite has built-in worker support, so no new dependency is needed.
- Bot step today. `useTableSession` schedules `setTimeout(() => setTable((t) => stepBot(t)), 0)` per bot turn
  (`src/ui/table/useTableSession.ts:53-56`). `stepBot` calls `actWith(hand, tagPolicy)`
  (`src/table/session.ts:193-199`), which builds `playerView(state, state.toAct)` and calls the policy
  (`src/engine/player-view.ts:109-118`).
- Determinism (`codebase`). `decideTag` is a pure function of the `PlayerView`
  (`src/bots/tag.ts:13-21`). The postflop equity sampler is seeded only from the canonical input:
  `deriveSeed(c)` (`src/advice/equity.ts:132`), used at `src/advice/equity.ts:293`, and `computeEquity`'s
  contract is "sampled with a seed that depends only on the canonical input" (`src/advice/equity.ts:340`).
  The same view therefore gives the same action in any thread, and no bot RNG exists to seed.
- Hidden info. `playerView` copies only the viewer's own hole cards and public fields
  (`src/engine/player-view.ts:62-106`). `PlayerView`, `Action`, `Recommendation` and `GradeResult` are plain
  data (numbers, strings, arrays), so they survive structured clone.
- Headless boundary: `src/{engine,bots,advice,stats,playtest,table}` must not use browser globals or import
  `src/ui` (`tools/lint/headless-boundary.js:7-60`). The worker host uses `self`, so it lives in `src/ui/advice/`.
- e2e harness. `table-harness.tsx` is built as an IIFE by `vite.build` (lib mode, `write: false`) and injected
  into `about:blank` with `page.setContent` (`e2e/support/table-harness-bundle.ts:27-66`). A worker emitted as
  a separate chunk would not exist there. Hence D-4.
- Existing timing e2e. `e2e/table.spec.ts` uses `page.clock` paused timers and steps bots with
  `clock.runFor(50)` slices (`e2e/table.spec.ts:64-127`). Keeping the `setTimeout(0)` before each request (D-3)
  keeps those tests' timing model: a bot step still needs the clock to advance, and the worker reply is a real
  event that arrives between slices.
- Locked tests (`doit/*/state.json` `locked_tests`). Affected files: `e2e/table.spec.ts`,
  `e2e/next-hand.spec.ts`, `e2e/review.spec.ts`, `e2e/replay-seed.spec.ts`, `e2e/table-display.spec.ts`,
  `tests/table/session.test.ts`, `tests/table/session.acceptance.test.ts` and `tests/ui/table.acceptance.test.tsx`.
  None needs editing. `stepBot` keeps its signature and behaviour, the SSR markup is unchanged, and the app
  flows are unchanged. Only the unlocked support file `e2e/support/table-harness*.ts(x)` changes.
- Existing code to reuse:
  - `src/engine/player-view.ts` → `playerView` builds the only data sent to the worker.
  - `src/bots/tag.ts` → `decideTag(view)` for `bot` requests, unchanged.
  - `src/advice/recommend.ts` → `recommend(view)`; `src/advice/grade.ts:139` → `gradeView(view, userAction)`.
  - `src/playtest/runner.ts:171` → `playHand(code, size, button, number, { makePolicy })` for AC#3's
    headless side; `:161` → `toAction(record)` to compare actions.
  - `src/engine/deck.ts` → `replayCodeFromWords` (used in tests).
  - `e2e/support/table-harness-bundle.ts` → `buildIife` and `stubReplayWords`; `e2e/support/axe.ts` →
    `expectNoSeriousAxeViolations`.
  - `e2e/table.spec.ts:129-140` → the check-or-call click pattern. Copy it into the new spec, because spec
    files are locked and can't be imported from.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Message protocol. Request `{ id: number } & ({ kind: 'bot', view, style } \| { kind: 'recommend', view } \| { kind: 'grade', view, userAction })`. Response `{ id, ok: true, value }` or `{ id, ok: false, error: { name, message } }`. Requests carry `PlayerView` (plus `ActionType` / `BotStyle`) and no options or functions. | Comlink (new dependency); one worker per kind | Plain structured-clone data with no dependency. A single protocol serves bots, E08 hints and E09 grading, as the story asks. | yes | n/a (autopilot: internal API, no user-visible effect, reversible) |
| D-2 | One worker per mounted `Table`, created in a `useEffect` and terminated on unmount. Requests are answered in order, one at a time. | Module-level singleton; worker pool | The effect lifecycle works with SSR (no worker during `renderToString`) and StrictMode (create, terminate, create). The table makes one bot request at a time anyway. | no | n/a |
| D-3 | The bot step keeps the existing `setTimeout(0)` macrotask and then posts the request. The response is applied by `applyBotDecision(t, turn, action)`, which returns `t` unchanged unless `t.hand === turn.hand` (same object). | Post straight from the effect | Keeps the timing model of the locked paused-clock e2e tests (§3). A reference check rejects stale replies after unmount, StrictMode re-runs or a new hand. | no | n/a |
| D-4 | Harness pages load at `http://localhost:4173/__harness/<name>`, fulfilled with `page.route`, instead of `about:blank`. Harness entries import worker entries with Vite's `?worker&inline` (Blob URL, falling back to a data: URL) and pass them as `createAdviceWorker`. Production uses `new Worker(new URL('./advice.worker.ts', import.meta.url), { type: 'module' })`, a separate same-origin file. | Blob workers from `about:blank` (opaque origin, engine-dependent); inline worker in production | A real http origin starts Blob workers reliably in both engines. Production keeps a normal asset, so a future CSP and the offline service worker (E13) see an ordinary file. REQ-058.1: no new origins. | no | n/a |
| D-5 | Slow seam. `e2e/support/slow-advice.worker.ts` is test-only. It wraps `handleAdviceRequest` so that each `bot` request busy-waits in the worker until `Number(self.name)` ms have passed, then answers. The harness sets `name` from `data-slow-ms`. The file contains the marker string `tlh-test-slow-advice`. Nothing under `src/` imports `e2e/`, so the marker never reaches `dist/` (SPEC-10). | A `?slow` URL flag in production code; a slow policy inside `src` behind an env var | The production bundle stays free of test seams. Busy-waiting in the worker models real computation (the worker thread is busy), so the main thread is shown to stay free. | no | n/a |
| D-6 | Bot randomness. No seed crosses the boundary now, because TAG has no randomness (§3). When TASK-6.18 lands, it adds a numeric per-decision seed derived on the main thread from (replay code, seat) to the `bot` request. The replay code itself is never sent, because it determines the whole deck and would leak hidden cards (REQ-025.1). | Send the replay code now | Avoids doing TASK-6.18's work and keeps its option open. Sending the code would break REQ-025. | no | n/a (noted for TASK-6.18) |
| D-7 | Failures. An error thrown in the service becomes an `ok: false` response, and the client rejects that request with `new Error(message)` with `error.name` set to the thrown name. A worker `error` or `messageerror` event rejects every pending request and every later one with `Error('Advice worker failed: <message>')`. The hook rethrows a rejection inside a `setTable` updater, so it surfaces exactly like today's `stepBot` throw. | Fall back to computing on the main thread; show an error banner | No silent fallback, which would hide a broken worker behind freezes. Error UI and recovery belong to REQ-056. | no | n/a |
| D-8 | The timing-bound tests (SPEC-01 long tasks, SPEC-02 p95 frames, SPEC-03 hover/resize repaint) run only when `TLH_SLOW_TESTS=1`. Each calls `test.skip(process.env.TLH_SLOW_TESTS !== '1', 'timing check: run npm run e2e:slow')`. They run with `npm run e2e:slow`, documented in README next to `npm run test:slow`. Every push keeps a non-timing guard: SPEC-15 (every bot action is served by a worker `bot` request) and SPEC-04 (AC#3 determinism) run in normal `npm run e2e`. | Run the timing tests on every push | User's standing rule (2026-11-21): timing-bound checks are opt-in unless a requirement says every push, and REQ-055.6 doesn't. SPEC-15 still fails on every push if bot decisions move back onto the main thread, without depending on machine speed. | yes | user standing rule (2026-11-21, via coordinator) |

## 5. Design

### Files to create / modify
- `src/table/advice-service.ts` — new. Request/response types and `handleAdviceRequest`.
- `src/table/session.ts` — modify. Add `BotTurn`, `botTurn` and `applyBotDecision`; `stepBot` reimplemented on
  them with behaviour unchanged.
- `src/ui/advice/advice-client.ts` — new. `AdviceClient`, `WorkerLike` and `createAdviceWorker`.
- `src/ui/advice/worker-host.ts` — new. `installAdviceWorker(scope, handle)`.
- `src/ui/advice/advice.worker.ts` — new production worker entry (two statements).
- `src/ui/table/useTableSession.ts` — modify. Worker lifecycle and asynchronous bot step.
- `e2e/support/table-harness.tsx` — modify. Pass the inline real worker.
- `e2e/support/table-harness-bundle.ts` — modify. Open harness pages at a routed http origin; add
  `buildAdviceHarness` and `openAdviceHarness`.
- `e2e/support/advice-harness.tsx` — new. Default-config `Table` with an instrumented slow worker; exposes
  `window.__tlhAdvice`.
- `e2e/support/slow-advice.worker.ts` — new. Test-only slow worker entry.
- `e2e/responsive-table.spec.ts` — new. Playwright acceptance for AC#1, AC#2, AC#3 and DoD#1 (timing tests
  gated by `TLH_SLOW_TESTS`, D-8), plus the structural worker guard (SPEC-15).
- `package.json` — modify. Add the `e2e:slow` script.
- `README.md` — modify. Document `npm run e2e:slow` next to `npm run test:slow`.
- `tests/table/advice-service.test.ts` — new unit tests.
- `tests/table/bot-turn.test.ts` — new unit tests (hidden info, stale replies, `stepBot` parity).
- `tests/ui/advice-worker.acceptance.test.ts` — new. Client plus host over a Node `MessageChannel`: protocol,
  errors and determinism against `playHand`.

### Components, interfaces and data
- `src/table/advice-service.ts` (headless):
  ```ts
  export type AdviceRequest =
    | { readonly id: number; readonly kind: 'bot'; readonly view: PlayerView; readonly style: BotStyle }
    | { readonly id: number; readonly kind: 'recommend'; readonly view: PlayerView }
    | { readonly id: number; readonly kind: 'grade'; readonly view: PlayerView; readonly userAction: ActionType };
  export type AdviceValue = Action | Recommendation | GradeResult<Recommendation>;
  export type AdviceResponse =
    | { readonly id: number; readonly ok: true; readonly value: AdviceValue }
    | { readonly id: number; readonly ok: false; readonly error: { readonly name: string; readonly message: string } };
  export interface AdviceDeps { readonly decideBot?: (view: PlayerView, style: BotStyle) => Action }
  /** Never throws: every error (thrown by advice code or an unknown kind) becomes ok:false. */
  export function handleAdviceRequest(request: AdviceRequest, deps?: AdviceDeps): AdviceResponse;
  ```
  - Default `decideBot = (view) => decideTag(view)` (A-1). `recommend` → `recommend(view)`; `grade` →
    `gradeView(view, userAction)`.
  - Unknown kind → `{ ok: false, error: { name: 'RangeError', message: 'Unknown advice request kind: <kind>' } }`.
  - A non-Error throw → `name: 'Error'`, `message: String(thrown)`.
- `src/table/session.ts`:
  ```ts
  export interface BotTurn { readonly hand: HandState; readonly view: PlayerView; readonly style: BotStyle }
  /** The bot to act: its view (playerView(hand, hand.toAct)) and its seat's style ('TAG' if null). Throws RangeError 'Not a bot turn'. */
  export function botTurn(table: TableState): BotTurn;
  /** Applies `action` iff table.hand === turn.hand; else returns `table` unchanged. Throws RangeError(engine message) if illegal. */
  export function applyBotDecision(table: TableState, turn: BotTurn, action: Action): TableState;
  export function stepBot(table: TableState, policy: SeatPolicy = tagPolicy): TableState; // = applyBotDecision(table, t, policy(t.view)) with t = botTurn(table)
  ```
  Only `turn.view` and `turn.style` are sent to the worker. `turn.hand` stays on the main thread as the
  staleness token.
- `src/ui/advice/advice-client.ts`:
  ```ts
  export type WorkerLike = Pick<Worker, 'postMessage' | 'addEventListener' | 'removeEventListener' | 'terminate'>;
  export class AdviceClient {
    constructor(worker: WorkerLike);
    decideBot(view: PlayerView, style: BotStyle): Promise<Action>;
    recommend(view: PlayerView): Promise<Recommendation>;
    grade(view: PlayerView, userAction: ActionType): Promise<GradeResult<Recommendation>>;
    /** Removes listeners, terminates the worker, rejects pending requests with Error('Advice client disposed'). */
    dispose(): void;
  }
  export function createAdviceWorker(): Worker; // new Worker(new URL('./advice.worker.ts', import.meta.url), { type: 'module' })
  ```
  - Ids increase from 1 per client. Responses are matched by id, and a response with an unknown id is ignored.
  - After `dispose()` or a worker failure, new calls reject immediately and never post.
- `src/ui/advice/worker-host.ts`:
  ```ts
  export interface WorkerScope {
    addEventListener(type: 'message', listener: (event: MessageEvent<AdviceRequest>) => void): void;
    postMessage(message: AdviceResponse): void;
  }
  export function installAdviceWorker(scope: WorkerScope, handle: (r: AdviceRequest) => AdviceResponse = handleAdviceRequest): void;
  ```
- `src/ui/advice/advice.worker.ts`: `installAdviceWorker(self as unknown as WorkerScope);`
- `useTableSession` adds the option `createAdviceWorker?: () => WorkerLike`, which defaults to the production
  factory. On mount an effect creates `new AdviceClient(createAdviceWorker())` into state, and the cleanup
  disposes it. While the client is null, bot steps wait. The rest of the hook's API is unchanged.
- Advice harness (`e2e/support/advice-harness.tsx`) renders `<Table />` with the default config (A-7) and
  `onHandComplete` pushing each `CompletedHand` to `window.__tlhAdvice.hands`. Its `createAdviceWorker`
  builds the inline slow worker with `{ name: root.dataset.slowMs }` and wraps it. On every `postMessage` of a
  `bot` request it pushes `{ id, seat: view.seat, street: view.street, start: performance.now(), end: null,
  reply: null }` to `window.__tlhAdvice.windows` and sets `computing = true`. On every response `message` it
  sets `end`, sets `reply` to the returned action (`value` when `ok`), and sets `computing = false`. An init script installs a `PerformanceObserver({ type: 'longtask', buffered: true })`
  into `window.__tlhAdvice.longTasks` when supported, a continuous rAF loop into `window.__tlhAdvice.frames`,
  and `pointerover` (capture, on the seats list) and `resize` listeners that push
  `{ type, at: event.timeStamp, repaint: <second rAF timestamp> }` to `window.__tlhAdvice.events`.

### Rules and algorithms
- Bot step (hook). When `nextStep(table) === 'bot'` and the client exists: `setTimeout(0)` → `turn =
  botTurn(table)` → `client.decideBot(turn.view, turn.style)`. On success, if the effect has not been cleaned
  up, `setTable((t) => applyBotDecision(t, turn, action))`. On rejection, if not cleaned up,
  `setTable(() => { throw error; })`. Cleanup clears the timer and marks the step cancelled.
- Staleness example. Request for hand H1 at seat 3. The user leaves the table, or StrictMode re-runs the effect,
  before the reply. Either the cancelled flag drops the reply, or `applyBotDecision` sees `t.hand !== H1` and
  returns `t`. No action is applied twice.
- Long-task overlap: task `[s, s + d]` overlaps window `[a, b]` iff `s < b && s + d > a`.
- p95: sort the sample durations ascending; p95 = `samples[ceil(0.95 × n) − 1]`.

### Error handling and configuration
- Messages are listed in D-7 and §5 Components. No user-visible text is added.
- `data-slow-ms` defaults to `0` in the advice harness (real speed). Tests set 300 (AC#1 and DoD#1) or 1000 (AC#2).

## 6. Behaviour specification

### SPEC-01: No long main-thread task while slow bot decisions compute
- Verifies: AC#1, DoD#2
- Behaviour: Given the advice harness in Chromium with pinned replay words `[0x9e3779b9, 1, 2, 3]` and
  `data-slow-ms="300"`, When the user clicks Check or Call at every turn until the hand ends, Then:
  `PerformanceObserver.supportedEntryTypes` includes `longtask`; at least one recorded window has street
  flop, turn or river; every window lasts at least 300 ms; and no recorded long task with `duration > 100`
  overlaps any window. Sanity check in the same test: a 200 ms busy loop run in the page with `page.evaluate`
  afterwards is recorded as a long task of at least 150 ms, which shows the observer is live. WebKit: skipped,
  reason "WebKit has no Long Tasks API" (A-2).
  Opt-in: skipped unless `TLH_SLOW_TESTS=1` (D-8).
- Verification: acceptance `e2e/responsive-table.spec.ts::slow bot decisions never block the main thread for more than 100 ms`

### SPEC-02: p95 frame time during computation over 200 samples
- Verifies: DoD#1, AC#1
- Behaviour: Given the Chromium advice harness at `data-slow-ms="300"` with the pinned words, When the user
  checks or calls at every turn, clicking "Deal next hand" whenever it shows, until at least 200 rAF intervals
  have started inside computation windows (A-6; at most 6 hands), Then at least 200 samples are collected, the
  p95 of those intervals is ≤ 100 ms, and the test attaches `{ samples, p95, max }` as a JSON annotation.
  WebKit: skipped (A-2). Opt-in: skipped unless `TLH_SLOW_TESTS=1` (D-8).
- Verification: acceptance `e2e/responsive-table.spec.ts::p95 frame time during bot computation is at most 100 ms over 200 samples`

### SPEC-03: Hover and resize repaint within 100 ms while a bot computes
- Verifies: AC#2, DoD#8
- Behaviour: Given the advice harness at `data-slow-ms="1000"` in Chromium and in WebKit, When
  `window.__tlhAdvice.computing` becomes true and the test hovers seat 1's list item and then resizes the
  viewport from 1280×720 to 1100×700, Then `events` holds a `pointerover` and a `resize` entry. Each `at`
  falls inside a computation window (window `start ≤ at < end`), and each has `repaint − at ≤ 100`. After the
  window ends the table still shows a bot action, and axe reports no serious or critical violations.
  Opt-in: skipped unless `TLH_SLOW_TESTS=1` (D-8). Axe on the table flow is also covered on every push by the
  locked `e2e/table.spec.ts`.
- Verification: acceptance `e2e/responsive-table.spec.ts::hovering a seat and resizing repaint within 100 ms while a bot decides`

### SPEC-04: Worker bot actions equal the headless playtest, in the browser
- Verifies: AC#3, DoD#9
- Behaviour: Runs on every push (normal `npm run e2e`). Given the advice harness at real speed (`data-slow-ms="0"`) with the pinned words, in Chromium and
  WebKit, When the user checks or calls to the end of hand 1, Then `hands[0].replayCode ===
  replayCodeFromWords([0x9e3779b9, 1, 2, 3])`. The record's non-blind actions mapped with `toAction` deep-equal
  `playHand(code, 6, 6, 1, { makePolicy })` `.record.actions`, where `makePolicy` gives seat 5 a policy that
  returns the user's recorded actions in order and every other seat `tagPolicy`. The hand includes at least one
  bot action on the flop or later. Every request the page made has the app origin `http://localhost:4173`.
- Verification: acceptance `e2e/responsive-table.spec.ts::bot actions computed in the worker match the headless playtest`

### SPEC-05: Worker protocol gives the headless actions for many hands
- Verifies: AC#3
- Behaviour: Given `installAdviceWorker` on one port of a Node `MessageChannel` and an `AdviceClient` on the
  other port (with structured clone), When 50 six-max hands with codes `handReplayCode(7, k)`, k = 1..50 and
  button 6 are played with every seat's decision taken through `client.decideBot(view, 'TAG')`, Then each
  hand's actions deep-equal `playHand(code, 6, 6, k)` with the default all-TAG policies.
- Verification: acceptance `tests/ui/advice-worker.acceptance.test.ts::worker-hosted bot decisions equal the headless playtest for 50 hands`

### SPEC-06: Only the acting seat's PlayerView crosses the boundary
- Verifies: AC#3, DoD#6
- Behaviour: Given a dealt default table on a bot's turn, When `botTurn` is built, Then `turn.view` deep-equals
  `playerView(table.hand, table.hand.toAct)`, and `JSON.stringify({ view, style })` contains no other seat's
  hole card. Given the same table with every other seat's hole cards and the undealt deck permuted (fast-check,
  100 runs), Then the `{ view, style }` payload is deep-equal and `decideTag` returns the same action. The
  message posted by `AdviceClient.decideBot` has exactly the keys `id`, `kind`, `view` and `style`.
- Verification: unit `tests/table/bot-turn.test.ts::the bot request carries only the acting seat's view and style`

### SPEC-07: Stale bot replies are ignored; stepBot is unchanged
- Verifies: AC#3
- Behaviour: Given `turn = botTurn(table)` and then `table2 = stepBot(table)`, When
  `applyBotDecision(table2, turn, action)` runs, Then it returns `table2` (the same object). Given the current
  table, Then `applyBotDecision(table, turn, decideTag(turn.view))` deep-equals `stepBot(table)`. An illegal
  action throws `RangeError` with the engine's message. `botTurn` on a user turn throws
  `RangeError('Not a bot turn')`.
- Verification: unit `tests/table/bot-turn.test.ts::applyBotDecision applies only to the turn it was asked for`

### SPEC-08: The advice service answers bot, recommend and grade requests and never throws
- Verifies: AC#3, DoD#5
- Behaviour: For a preflop and a flop view, `handleAdviceRequest({ id: 4, kind: 'bot', … })` returns
  `{ id: 4, ok: true, value: decideTag(view) }`. `recommend` returns `recommend(view)`. `grade` with a legal
  `userAction` returns `gradeView(view, userAction)`. `grade` with an illegal action returns
  `{ ok: false, error: { name: 'RangeError', message: '<type> is not legal for seat <n>' } }`. Kind `'nope'`
  returns `error.message === 'Unknown advice request kind: nope'`. An injected `decideBot` that throws
  `'boom'` (a string) returns `{ name: 'Error', message: 'boom' }`.
- Verification: unit `tests/table/advice-service.test.ts::handleAdviceRequest maps each kind and turns throws into error responses`

### SPEC-09: The client matches replies by id and fails loudly
- Verifies: AC#1, AC#3
- Behaviour: Given a fake `WorkerLike`, When two requests are posted and their responses arrive in reverse
  order, Then each promise resolves to its own value. An `ok: false` response rejects with that message and
  name. Responses with unknown ids are ignored. A worker `error` event rejects all pending requests with
  `Advice worker failed: <message>`, later calls reject without posting, and `messageerror` behaves the same.
  `dispose()` terminates the worker once, rejects pending requests with `Advice client disposed`, and removes
  its listeners.
- Verification: acceptance `tests/ui/advice-worker.acceptance.test.ts::client correlates replies and rejects on errors, worker failure and dispose`

### SPEC-10: The slow test seam is not in the production bundle
- Verifies: AC#1, DoD#9
- Behaviour: Given `npm run build`, Then no file in `dist/` contains `tlh-test-slow-advice`, and `dist/assets/`
  contains exactly one worker chunk whose name starts with `advice.worker`.
- Verification: command `npm run build && ! grep -rq tlh-test-slow-advice dist && ls dist/assets | grep -c '^advice.worker' | grep -qx 1`

### SPEC-11: Checks, coverage and headless boundary
- Verifies: DoD#3, DoD#5, DoD#6, DoD#2
- Behaviour: Given the change, When lint, typecheck and the full Vitest suite run, Then all exit 0 with
  coverage ≥ 90% for `src/{engine,bots,advice,stats,playtest,table}` and ≥ 70% overall. The headless lint
  passes for `src/table/advice-service.ts`, and no `src/{engine,bots,advice}` file imports `src/ui`.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-12: Existing and new browser flows pass in both engines
- Verifies: DoD#8, DoD#11, DoD#2
- Behaviour: Given the change, When the whole Playwright suite runs in Chromium and WebKit, Then every test
  passes. That includes the locked `e2e/table.spec.ts`, `e2e/next-hand.spec.ts`, `e2e/review.spec.ts`,
  `e2e/replay-seed.spec.ts` and `e2e/table-display.spec.ts` unchanged, and the new spec. Without
  `TLH_SLOW_TESTS` the three timing tests (SPEC-01..03) are skipped and SPEC-04 and SPEC-15 run in both
  engines. With `npm run e2e:slow` all new tests run, SPEC-01 and SPEC-02 in Chromium only. CI is green on the
  branch.
- Verification: command `npm run e2e && npm run e2e:slow`

### SPEC-13: 10,000-hand playtest stays clean
- Verifies: DoD#7
- Behaviour: Given the session refactor, When `npm run playtest -- --hands 10000 --seed 42 --size 6` runs,
  Then it exits 0 and reports zero invariant violations.
- Verification: command `npm run playtest -- --hands 10000 --seed 42 --size 6`

### SPEC-14: Story documentation and non-applicable DoD items
- Verifies: DoD#12, DoD#4, DoD#10, DoD#13
- Behaviour: The story doc records the worker API (D-1), the slow seam (D-5) and the TASK-6.18 hook (D-6), and
  is published to Backlog.md. DoD#4 is not applicable because the golden-spot suite (E07-S14) does not exist
  yet. DoD#10 is not applicable because there is no strategy content. DoD#13 is not applicable because no
  screen is added and there is no service worker yet.
- Verification: manual `backlog doc list --plain` shows the TASK-3.6 story doc; Judge confirms the N/A items.

### SPEC-15: Every bot decision is served by the advice worker (every-push guard)
- Verifies: AC#1, AC#3, DoD#2
- Behaviour: Runs on every push in Chromium and WebKit, with no timing assertion. Given the advice harness at
  real speed (`data-slow-ms="0"`) with the pinned words, When the user checks or calls to the end of hand 1,
  Then the hand's non-blind actions by seats other than 5, in order, correspond one-to-one with
  `window.__tlhAdvice.windows`. Each window's `seat` equals the acting seat, its `reply` deep-equals that
  action, and its `end` is non-null. The window count equals the bot action count, so no bot action was
  decided without a worker reply. If decisions moved back onto the main thread, the log would be empty or
  shorter and the test would fail.
- Verification: acceptance `e2e/responsive-table.spec.ts::every bot decision is served by the advice worker`

## 7. Edge cases
- Concurrency and staleness: replies arriving after unmount, a StrictMode double effect, or a new hand →
  SPEC-07 and D-3. Out-of-order replies → SPEC-09.
- Dependency failure: the worker script fails to load or a reply can't be deserialised → SPEC-09 (D-7).
- Interruption: Leave table during a computation. The unmount disposes the client and the reply is dropped →
  SPEC-09 (dispose) and SPEC-07.
- First bot turn before the worker exists: the step waits for the client state (§5); exercised by
  SPEC-04 and SPEC-12 (the locked "buttons within 100 ms" test).
- Invalid input: requests come only from our own main thread (§8). An unknown kind or an illegal grade action
  → SPEC-08.
- Empty, max or duplicate inputs: N/A. The protocol carries exactly one view per request, and ids are unique per
  client.

## 8. Security considerations
- Trust boundary: main thread ↔ dedicated worker in the same origin. Both sides are our own code, and no
  external input enters. The service still never throws (SPEC-08).
- Hidden information (REQ-025.1): only `PlayerView` (own hole cards, public state) plus style or user action is
  posted. Hidden cards and the replay code never cross (SPEC-06, D-6).
- No new dependencies and no new network origins: the worker is an own-origin asset (SPEC-04, SPEC-10).
- Randomness: none added. Equity sampling is seeded deterministically (§3). CSPRNG is N/A, because no fairness
  decision draws randomness here.
- Logs and secrets: N/A. Nothing is logged.
- authn/authz, injection: N/A. There is no server and no string-built markup.

## 9. Non-functional
- REQ-055.6: no main-thread task over 100 ms during computation (SPEC-01), p95 frame time ≤ 100 ms over at least
  200 samples (SPEC-02), and repaint ≤ 100 ms after hover or resize (SPEC-03). All measured in Playwright
  Chromium. SPEC-03 is also measured in WebKit.
- Worker overhead: one structured-clone round trip per bot decision. The locked test "my buttons are enabled
  within 100 ms of the bot action" (`e2e/table.spec.ts:278`) must still pass.
- Test cost (D-8): every push adds only SPEC-04 and SPEC-15, about 2 s per engine. The opt-in
  `npm run e2e:slow` takes about 10 s in Chromium and 4 s in WebKit. No `page.clock` in the new spec, because
  the timings are real.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview` then open `http://localhost:4173`, New game → Start game, and
  play. DevTools → Sources → Threads shows `advice.worker`.
- New tests:
  - `e2e/responsive-table.spec.ts` → SPEC-01, SPEC-02, SPEC-03 (opt-in: `npm run e2e:slow`), SPEC-04, SPEC-15
    (every push)
  - `tests/ui/advice-worker.acceptance.test.ts` → SPEC-05, SPEC-09
  - `tests/table/bot-turn.test.ts` → SPEC-06, SPEC-07
  - `tests/table/advice-service.test.ts` → SPEC-08
- Slow (opt-in) command: `npm run e2e:slow`.
- End-to-end scenario for the Judge: run `npm run e2e -- e2e/responsive-table.spec.ts`. Each engine shows 2
  passes (SPEC-04, SPEC-15) and 3 skips. Then run `npm run e2e:slow`: Chromium shows 5 passes, and WebKit
  shows 3 passes (SPEC-03, SPEC-04, SPEC-15) and 2 skips. Then, in the preview app, play a hand while dragging the
  window edge during bot turns. The table never freezes, and DevTools Performance shows the equity work on the
  worker thread.

## 11. Open questions
(none)

## 12. Clarifications log
See `doit/TASK-3.6/qa.md`.
