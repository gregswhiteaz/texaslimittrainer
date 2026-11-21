# Spec: TASK-3.13 — Play at Rapid bot pace

Status: READY (approved 2026-11-21)
Task: TASK-3.13 · Parent/epic: TASK-3 · Requirements: REQ-011.1, REQ-024.3, REQ-024.6 · Dream: limit-holdem-trainer

## 1. Summary
Every session already plays at Rapid speed (`Speed = 'rapid'`, `src/table/session.ts:73`). The table hook
already runs each bot step on the next macrotask (`setTimeout(…, 0)`, `src/ui/table/useTableSession.ts:90`)
and then asks the shared advice worker for the decision (TASK-3.6). So this story is mostly proof plus a
guard. It names the Rapid bot delay (0 ms) in one place that the hook uses. It adds a deterministic check that
runs on every push and fails if a bot waits on an artificial timer. It adds a deterministic hands-per-hour
model that includes the fixed 1.5 s between-hands delay. The real-time checks (300 ms per bot action at 6-max
and 10-max, 200 hands in under 60 minutes) go in the opt-in slow group.

## 2. Scope
- In scope:
  - `RAPID_BOT_DELAY_MS = 0` and `botActionDelayMs(speed)` in `src/table/session.ts`, used by the bot step in
    `useTableSession` in place of the literal `0`.
  - An every-push Playwright check on a paused fake clock: each bot action appears after no more than 100 ms
    of fake time. A self-test shows the same check catches a 400 ms artificial wait.
  - An every-push Vitest model of 200 Rapid hands with a scripted folding user. It totals the scheduled waits
    (1.5 s between hands, 0 ms per bot step) and a worst case that charges the full 300 ms per bot action. The
    worst case must stay under 60 minutes.
  - Opt-in real-time Playwright checks (`TLH_SLOW_TESTS=1`, `npm run e2e:slow`): bot action gaps of at most
    300 ms at 6-max (the app) and at 10-max (a new test-only pace harness), and 200 real hands in under 60
    minutes.
  - The `e2e:slow` script runs the new spec too, and the README performance section documents it.
- Not doing:
  - Any speed choice UI, Realistic pace, Settings default or in-session speed change (E02-S11 / TASK-2.11,
    TASK-3.18, TASK-12.5, TASK-3.15). `Speed` stays `'rapid'` only.
  - Turning off Hand Review auto-open (E12). The scripted user works around the panel (A-2).
  - Changing `NEXT_HAND_DELAY_MS` (1500, fixed for every speed, TASK-3.4 D-6) or any between-hands behaviour.
  - Making bot decisions faster, or touching the advice worker or its protocol.
  - Editing any locked test (`e2e/table.spec.ts`, `e2e/next-hand.spec.ts`, `e2e/responsive-table.spec.ts`, …).
    None needs to change.
  - Running timing checks on every push or in CI.
- Scope budget: files=9, lines=460

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The Rapid bot wait is a named constant `RAPID_BOT_DELAY_MS = 0`, read through `botActionDelayMs(speed: Speed): number`. The hook's bot `setTimeout` uses `botActionDelayMs(table.config.speed)`. The deal step keeps its literal `0`. | yes | One place states "Rapid adds no wait", the unit test pins it, and TASK-3.18 can add Realistic there. Timing is unchanged (still 0 ms, so the locked paused-clock tests are unaffected, TASK-3.6 D-3). | Leave the literal `0` and rely only on the e2e guard |
| A-2 | Scripted user, used by both 200-hand checks: click Fold when it is enabled, otherwise Check. If the Hand Review panel opens anyway (the user checked as big blind and saw a later street), wait 1.5 s and then click Deal next hand. Every hand then includes the 1.5 s gap. | yes | Fold is only legal when the user owes chips (`src/engine/hand.ts:341-344`). The panel opens on any user decision other than a lone preflop fold (`src/table/review.ts:31-35`). Auto-open can't be switched off until E12. Waiting 1.5 s makes those hands time like REQ-024.3 hands. | Click Deal next hand at once (would undercount the gap); add an auto-open seam now (E12's scope) |
| A-3 | "200 hands complete" means hand #201 has been dealt. So 200 between-hands delays are counted: the model adds 200 × 1500 ms, and the real run stops when the header reads `Hand #201`. | yes | This is the conservative reading: it includes one extra 1.5 s gap. | Stop at the 200th result (199 gaps) |
| A-4 | The real-time checks run in Chromium only (`test.skip(browserName !== 'chromium', …)`). The every-push paused-clock check runs in both projects. | yes | Matches TASK-3.6 A-2 (timing measured in Chromium). WebKit-under-Playwright worker timing does not stand in for Safari. The deterministic guard does not depend on the engine. | Time both engines |
| A-5 | Every-push bound: at most 100 ms of fake clock per bot action, with the fake clock advanced in 1 ms steps and never while a worker request is in flight. | yes | Today's code needs about 1 ms. 100 ms leaves room for React commit races between steps. Anything at or above Rapid's 300 ms budget, including the AC's 400 ms example, fails. | 1–2 ms (fragile to commit races); 299 ms |
| A-6 | 10-max pace harness seats: 1 Ava, 2 Ben, 3 Cal, 4 Dee, 5 You (user), 6 Eli, 7 Fay, 8 Gus, 9 Hal, 10 Ivy. All bots are TAG. Stakes $4/$8 cash, button seat 6, pinned replay words. | yes | Extends `DEFAULT_SEATS` (`src/table/session.ts:59-66`) with four new names. The Game Config UI can't seat 10 yet, so a test-only harness does it, as TASK-3.6 D-4/D-5 harnesses do. | Add a players choice to Game Config (TASK-2 scope) |
| A-7 | The model's worst case charges 300 ms for every bot action (the REQ-011.1 cap) and 0 ms for the scripted user's actions. | yes | It turns REQ-024.6 into a deterministic every-push bound: even if every bot used its full Rapid budget, 200 hands fit in 60 minutes. | Model the measured worker latency (machine-dependent) |

## 3. Current system
- Bot stepping: `src/ui/table/useTableSession.ts:63-109`. The deal step is `setTimeout(…, 0)` (`:66-71`). The bot
  step is `setTimeout(…, 0)` (`:74-90`), which calls `requestBotDecision` (shared advice worker, `:48-50`) and
  applies the reply with `applyBotDecision`. The next hand is dealt after `nextHandDelay(table, holdNextHand)`
  (`:101-106`). No other wait exists between bot actions.
- `src/table/session.ts`: `Speed = 'rapid'` (`:73`, with a comment that TASK-2.11 / TASK-3.18 will widen it);
  `speed: 'rapid'` in `DEFAULT_SESSION_CONFIG` (`:101`); `nextStep` (`:175-180`); `NEXT_HAND_DELAY_MS = 1500`
  and `nextHandDelay` (`:194-199`); `nextHand` (`:202`); `botTurn` / `applyBotDecision` / `stepBot`
  (`:233-255`, `stepBot` runs `tagPolicy` synchronously); `applyUserAction` (`:257`).
- Hand Review opens unless the user's only decision was a preflop fold (`src/table/review.ts:31-35`). While a
  review is held, `Table` passes `holdNextHand` (`src/ui/table/Table.tsx:225-245`) and shows the Deal next hand
  button (`Table.tsx` TableView).
- The DOM exposes `data-action-count` on the Table section (`src/ui/table/Table.tsx:172`). The header is
  `Cash · N players · $s/$b · Hand #n` (`src/table/table-view.ts:64`, shown at `.table-header-line`).
- Paused-clock e2e pattern: `page.clock.install({ time: 0 }); page.clock.pauseAt(1000)`. React commits in a real
  (unfaked) task, so each bot timer is scheduled only after the previous `runFor` returns
  (`e2e/table.spec.ts:64-77`, `e2e/next-hand.spec.ts:61-64`). MutationObserver recorders for action-count and
  header changes are at `e2e/table.spec.ts:36-60` and `e2e/next-hand.spec.ts:36-51`.
- Harnesses: `e2e/support/table-harness-bundle.ts` builds IIFE bundles (`buildIife`) and opens them at
  `http://localhost:4173/__harness/<name>` (`openHarnessPage`, `openTableHarness` `:105-113`).
  `e2e/support/table-harness.tsx` creates the inline real worker via `sharedAdviceClient` before mounting
  `Table`.
- Opt-in slow group: `package.json` `test:slow` / `e2e:slow` set `TLH_SLOW_TESTS=1`. Playwright tests skip
  with `test.skip(process.env.TLH_SLOW_TESTS !== '1', 'timing check: run npm run e2e:slow')`
  (`e2e/responsive-table.spec.ts:19-20,86`). The README documents both (`README.md:184-201`).
- Tests: Vitest in the node environment (`npm test` = `vitest run --coverage`, no DOM; UI tests use
  `renderToString`); Playwright against `vite preview` (`playwright.config.ts`, chromium + webkit).
- Replay codes: `replayCodeFromWords` (`src/engine/deck.ts:24`); legal actions: `legalActions`
  (`src/engine/hand.ts:331`).
- Existing code to reuse:
  - `src/table/session.ts` → `seatSession`, `dealHand`, `nextStep`, `stepBot`, `applyUserAction`, `nextHand`,
    `nextHandDelay`, `NEXT_HAND_DELAY_MS` for the Vitest model (no reimplementation of the loop rules).
  - `src/engine/hand.ts` → `legalActions` for the scripted user's Fold-else-Check.
  - `e2e/support/table-harness-bundle.ts` → `buildIife`, `openHarnessPage`, `stubReplayWords` for the pace
    harness.
  - `e2e/support/table-harness.tsx` → the inline-worker harness pattern for `pace-harness.tsx`.
  - `e2e/table.spec.ts:36-60` / `e2e/next-hand.spec.ts:36-51` → recorder shape. Copy it into the new spec,
    because locked spec files can't export it.
  - `e2e/support/axe.ts` is not needed (no new UI).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The real-time checks (SPEC-04, SPEC-05, SPEC-06) run only when `TLH_SLOW_TESTS=1`, via `npm run e2e:slow`. That script grows to `TLH_SLOW_TESTS=1 playwright test e2e/responsive-table.spec.ts e2e/rapid-pace.spec.ts`. | Run them on every push | User standing rule: pure speed/timing checks are opt-in unless a requirement says every push. REQ-011.1 and REQ-024.6 don't. | yes | user standing rule (2026-11-21, via coordinator) |
| D-2 | Every push keeps deterministic guards that need no wall clock: SPEC-01 (unit, Rapid adds 0 ms), SPEC-02 (paused fake clock, at most 100 ms of fake time per bot action, plus a self-test that catches 400 ms), and SPEC-03 (the 200-hand model). | Only the slow checks | AC#4 asks for a test that fails on an artificial wait. A fake clock makes that independent of machine speed, so it can run on every push. | no | n/a |
| D-3 | The 10-max checks use a new test-only `e2e/support/pace-harness.tsx`. Its bundle is built by `buildPaceHarness()` and opened by `openPaceHarness(page, bundle, words)` in `table-harness-bundle.ts`. Nothing under `src/` imports it. | Add a players field to Game Config | The app can only seat 6 today. Harness pages are the established seam (TASK-3.6 D-4). | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/session.ts` — add `RAPID_BOT_DELAY_MS` and `botActionDelayMs` (A-1).
- `src/ui/table/useTableSession.ts` — the bot step's `setTimeout` delay becomes
  `botActionDelayMs(table.config.speed)`. Update the doc comment.
- `tests/table/pace.test.ts` — unit test for SPEC-01.
- `tests/table/pace.acceptance.test.ts` — the 200-hand model (SPEC-03).
- `e2e/rapid-pace.spec.ts` — SPEC-02 (every push), SPEC-04/05/06 (opt-in).
- `e2e/support/pace-harness.tsx` — test-only 10-max table with the inline real advice worker (A-6, D-3).
- `e2e/support/table-harness-bundle.ts` — `buildPaceHarness()`, `openPaceHarness()`.
- `package.json` — extend `e2e:slow` (D-1).
- `README.md` — add one "Rapid pace" bullet to the performance section, next to the responsive-table bullet.

### Components, interfaces and data
- `src/table/session.ts`:
  ```ts
  /** REQ-011.1: at Rapid a bot acts on the next scheduler tick; no artificial wait. */
  export const RAPID_BOT_DELAY_MS = 0;
  /** ms the table waits before starting a bot's decision at `speed` (TASK-3.18 adds Realistic). */
  export function botActionDelayMs(speed: Speed): number;   // 'rapid' → RAPID_BOT_DELAY_MS
  ```
- `e2e/support/pace-harness.tsx`: like `table-harness.tsx`. It calls `sharedAdviceClient(() => new
  AdviceWorker())` (inline worker) before rendering
  `<StrictMode><main><h1>Pace harness</h1><Table config={{ players: 10, seats: TEN_SEATS, button: 6 }} /></main></StrictMode>`.
  `TEN_SEATS` follows A-6, with `userSeat` left at the default 5.
- `table-harness-bundle.ts`: `buildPaceHarness(): Promise<string>` (`buildIife(PACE_ENTRY, 'TlhPaceHarness')`) and
  `openPaceHarness(page, bundle, words)`. The latter opens `__harness/pace` with `HARNESS_HTML`-style markup,
  stubs the replay words and adds the script tag, the same way `openTableHarness` does.
- `e2e/rapid-pace.spec.ts` instrumentation (init scripts):
  - Recorder (as in `e2e/table.spec.ts:36-60`): for every `data-action-count` change it records
    `{ count, toAct, at: performance.now() }`. `toAct` is the seat marked "To act" just before the change. It
    also records header-text changes (`.table-header-line`).
  - Worker-post counter (SPEC-02 only): wraps `Worker.prototype.postMessage` to increment
    `window.__workerPosts`.

### Rules and algorithms
- **Bot action**: a `data-action-count` increase during a hand where the seat to act just before the change is
  not the user's seat. The first change of a hand is the deal, which shows the blinds. Every bot action has a
  previous change in the same hand: the deal, a bot action or a user action.
- **SPEC-02 fake-time meter** (paused clock, per bot action):
  ```
  fake = 0; before = actionCount; posts0 = __workerPosts
  loop until actionCount > before:
    if user's turn (enabled buttons): not a bot action → the script acts, restart
    if __workerPosts > posts0: wait in real time (expect.poll, ≤ 10 s) for actionCount > before; stop
    if fake ≥ cap: stop (recorded as fake = cap)
    clock.runFor(1); fake += 1
  record fake
  ```
  The fake clock is never advanced while a decision is in flight, so `fake` counts only timer waits. Today's
  code gives about 1 ms per bot action. A 400 ms timer gives ≥ 400.
- **SPEC-03 model** (pure, no timers): `t = seatSession()` (6-max default, Rapid); `scheduled = 0`; `botActions = 0`;
  for hand i = 1..200: `t = dealHand(t (or nextHand(t)), replayCodeFromWords([0x9e3779b9, 1, 2, i]))`. Then
  while `nextStep(t) !== 'done'`:
  - `'bot'` → `t = stepBot(t)`, `botActions += 1`, `scheduled += botActionDelayMs(t.config.speed)`.
  - `'user'` → `applyUserAction(t, fold if legalActions(t.hand) contains fold else check)`.

  At `'done'`, `d = nextHandDelay(t, false)` must be `1500`, and `scheduled += d`.
  `worstCase = scheduled + 300 × botActions`. Worked example: `scheduled = 200 × 1500 = 300 000` ms. If
  `botActions` were 3 000, `worstCase = 300 000 + 900 000 = 1 200 000` ms = 20 min, which is 600 hands/hour.
- **Hands per hour** is reported as `200 × 3 600 000 / ms`. Both the model and the real run include the 1.5 s
  gap per hand (A-3).

### Error handling and configuration
- `botActionDelayMs` is total over `Speed` and never throws. It has no runtime input to validate.
- `TLH_SLOW_TESTS=1` turns on the real-time tests. Their skip reason is `'timing check: run npm run e2e:slow'`.
  Chromium only (A-4): `'timing measured in Chromium (A-4)'`.
- Failure messages name the offending gap: seat, hand number and gap in ms (attached as a JSON annotation
  `{ samples, max, median }` on the slow tests).

## 6. Behaviour specification

### SPEC-01: Rapid adds no wait before a bot acts
- Verifies: AC#4
- Behaviour: Given speed `'rapid'`, When `botActionDelayMs('rapid')` is called, Then it returns `0`, and
  `RAPID_BOT_DELAY_MS === 0`.
- Verification: unit `tests/table/pace.test.ts::Rapid adds no wait before a bot acts`

### SPEC-02: On a paused clock, each bot acts on the next tick, and a 400 ms wait is caught
- Verifies: AC#4, DoD#1, DoD#8
- Behaviour: Given the app (6-max, Rapid) opened with the pinned words `[0x9e3779b9, 1, 2, 3]`, the paused clock
  (`install({ time: 0 })`, `pauseAt(1000)`) and the worker-post counter, When the user clicks Check or Call at
  each turn until the first hand's result shows, Then every bot action in the hand is metered (§5) at ≤ 100 ms
  of fake time, at least 5 bot actions are metered, the result (`Hand over`) is shown, and every request the
  page made (`page.on('request')`) has origin `http://localhost:4173` (DoD#8).
  Self-test in the same file: Given the same setup, but before Start game is clicked, `page.evaluate`
  replaces `window.setTimeout` with a wrapper that turns a 0 ms (or missing) delay into 400 ms. When the first
  2 bot actions are metered with cap 1000, Then each meters at ≥ 400 ms. This shows the guard fails on an
  artificial 400 ms wait. In the self-test the deal is delayed too: the test first advances the clock in 50 ms
  slices until the header shows `Hand #1`, and only then starts metering. Runs on every push, in both projects.
- Verification: acceptance `e2e/rapid-pace.spec.ts::each bot action appears on the next tick of a paused clock` and `e2e/rapid-pace.spec.ts::the paused-clock pace check catches a 400 ms wait`

### SPEC-03: 200 Rapid hands with a folding user fit in 60 minutes, counting the 1.5 s between hands
- Verifies: AC#3, AC#5, DoD#1
- Behaviour: Given the model in §5 (6-max default config, Rapid, the scripted Fold-else-Check user, 200 hands),
  When it completes, Then:
  - 200 hands reached `'done'`, and every `nextHandDelay(t, false)` returned `1500`.
  - `scheduled === 200 × NEXT_HAND_DELAY_MS === 300 000`, so the between-hands delay is included and bot steps
    add 0 ms.
  - `botActions > 0`.
  - `worstCase = scheduled + 300 × botActions` is `< 3 600 000`, and hands/hour = `200 × 3 600 000 / worstCase`
    is `≥ 200`.

  The run is deterministic (fixed replay codes) and fast (< 5 s).
- Verification: acceptance `tests/table/pace.acceptance.test.ts::200 rapid hands with a folding user fit in 60 minutes including the 1.5 s between hands`

### SPEC-04: Real-time 6-max: each bot action within 300 ms of the previous action (opt-in)
- Verifies: AC#1, DoD#1
- Behaviour: Given `TLH_SLOW_TESTS=1`, Chromium, the app with real timers and the pinned words, When the user
  clicks Check or Call at every turn for 10 hands (clicking Deal next hand as soon as it appears), Then:
  - Every bot action (§5) is recorded at most 300 ms after the previous `data-action-count` change in the same
    hand.
  - At least 30 bot actions are measured.
  - `{ samples, max, median }` is attached.
- Verification: acceptance `e2e/rapid-pace.spec.ts::each bot action at 6-max shows within 300 ms of the previous action`

### SPEC-05: Real-time 10-max with the user folding preflop: no bot action later than 300 ms (opt-in)
- Verifies: AC#2, DoD#1
- Behaviour: Given `TLH_SLOW_TESTS=1`, Chromium and the pace harness (10 players, A-6, real timers, pinned
  words), When the user clicks Fold at their first turn in each of 5 hands (or has no turn), Then:
  - Every bot action in those hands, including all actions after the user's fold, is at most 300 ms after the
    previous change.
  - At least 9 bot actions are measured.
  - The header reads `Cash · 10 players · $4/$8 · Hand #1` at the start.
- Verification: acceptance `e2e/rapid-pace.spec.ts::at 10 players every bot action after the user folds shows within 300 ms`

### SPEC-06: Real-time 200 hands complete in under 60 minutes, including the 1.5 s gaps (opt-in)
- Verifies: AC#3, AC#5, DoD#1
- Behaviour: Given `TLH_SLOW_TESTS=1`, Chromium, the app with real timers and default replay codes, and the
  scripted user (A-2), When it plays from `Hand #1` until the header reads `Hand #201`, Then:
  - The elapsed wall time is `< 3 600 000` ms and `≥ 200 × 1500 = 300 000` ms, so the 1.5 s delays are
    included.
  - The annotation reports `{ hands: 200, elapsedMs, handsPerHour }`.
  - The test timeout is 65 minutes.
- Verification: acceptance `e2e/rapid-pace.spec.ts::200 rapid hands with a folding user finish in under 60 minutes`

### SPEC-07: Lint, typecheck, tests, coverage and headless boundary
- Verifies: DoD#2, DoD#4, DoD#5
- Behaviour: Given the change, When `npm run lint` (with the headless-boundary rule and prettier),
  `npm run typecheck` and `npm test` run, Then each exits 0 with zero errors. Coverage stays at or above 90% for
  the engine, bots, advice and table code and at or above 70% overall. `src/table/session.ts` gains no UI or
  browser import.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-08: Playtest stays clean
- Verifies: DoD#6
- Behaviour: Given `src/table/session.ts` gains only a constant and a pure function, When the 10,000-hand
  playtest runs for cash and sit-and-go, Then each reports `Invariant violations: 0` and exits 0.
- Verification: command `npm run playtest -- --hands 10000 --seed 42 && npm run playtest -- --hands 10000 --seed 42 --game sng`

### SPEC-09: CI green and story documentation published
- Verifies: DoD#10, DoD#11
- Behaviour: Given the branch `doit/TASK-3.13` is pushed, When CI runs, Then every job is green (the opt-in
  timing tests are skipped there). The story document for TASK-3.13 is published to Backlog.md and mentions
  `npm run e2e:slow` for the Rapid pace checks.
- Verification: manual CI run on branch `doit/TASK-3.13` and `backlog doc list --plain`

### SPEC-10: Not-applicable DoD items
- Verifies: DoD#3, DoD#7, DoD#9, DoD#12
- Behaviour: Given that this story adds or changes no screen or dialog (only a timer constant, plus test-only
  harnesses), adds no strategy content, and that the golden-spot suite (E07-S14) and the offline service
  worker (E13-S07) are not yet Done, When judged, Then these items are N/A. The every-push SPEC-02 still runs
  the table flow in Chromium and WebKit.
- Verification: manual Judge confirms the diff changes no screen markup or text, adds no strategy text, and that E07-S14 and E13-S07 are not Done

## 7. Edge cases
- First bot action of a hand: measured from the deal change, not from the previous hand's last action (which
  includes the 1.5 s delay). See SPEC-02, SPEC-04 and SPEC-05.
- The user has no turn in a hand (bots fold round to the user's big blind, a walk): the scripted user does
  nothing. The hand still counts (SPEC-03, SPEC-05, SPEC-06).
- Fold not legal for the user (nothing owed): Check (A-2, SPEC-03, SPEC-06).
- The review panel opens in the 200-hand run: wait 1.5 s, then click Deal next hand (A-2, SPEC-06).
- Stale or late worker replies: already dropped by `applyBotDecision` (TASK-3.6 D-3). No new handling.
- Worker failure: surfaces as today (TASK-3.6 D-7). The tests fail loudly.
- Concurrency: one bot request at a time, as today. N/A beyond that.
- Invalid input / permissions: N/A. There is no new input.

## 8. Security considerations
- No new trust boundary, input, dependency, network origin or randomness. Replay codes in tests are pinned
  words. The production code change is a constant delay. The test harness is never imported by `src/`
  (D-3), so nothing test-only reaches `dist/`. N/A otherwise.

## 9. Non-functional
- REQ-011.1: at Rapid every bot action is shown ≤ 300 ms after the previous action. Measured by SPEC-04 and
  SPEC-05 (opt-in, Chromium) and guarded on every push by SPEC-01 and SPEC-02.
- REQ-024.6 / G-5: 200 hands < 60 minutes (≥ 200 hands/hour) with the 1.5 s gap included. Shown on every push by
  SPEC-03 (worst case) and measured by SPEC-06 (opt-in).
- The every-push additions should cost under 20 s of e2e time per project and under 5 s of Vitest time.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run e2e -- e2e/rapid-pace.spec.ts && npm run e2e:slow` (play by hand: `npm run dev`, New game → Start game)
- New tests:
  - `tests/table/pace.test.ts` → SPEC-01
  - `tests/table/pace.acceptance.test.ts` → SPEC-03
  - `e2e/rapid-pace.spec.ts` → SPEC-02 (every push), SPEC-04, SPEC-05, SPEC-06 (opt-in)
- Judge's end-to-end scenario:
  1. Run `npm run e2e -- e2e/rapid-pace.spec.ts`: SPEC-02 passes in both projects, and the slow tests are
     skipped with the `npm run e2e:slow` reason.
  2. Run `npm run e2e:slow`: SPEC-04/05/06 pass in Chromium, and the hands/hour annotation is at least 200.
  3. Optionally, `npm run dev`, start a game and fold every hand: bots act without a visible pause, and the next
     hand comes about 1.5 s after each result.
  4. As a mutation check, temporarily set `RAPID_BOT_DELAY_MS = 400`. `e2e/rapid-pace.spec.ts::each bot action
     appears on the next tick of a paused clock` and `tests/table/pace.test.ts` should then fail. Revert.

## 11. Open questions
- None.

## 12. Clarifications log
See `doit/TASK-3.13/qa.md`.
