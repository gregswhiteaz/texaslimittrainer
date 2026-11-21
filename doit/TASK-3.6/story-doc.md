# TASK-3.6: Keep the table responsive while bots and advice compute

Status: Done · Completed: 2026-11-21 · Epic: TASK-3 — Play hands at the table · Milestone: m-1 · Requirements: REQ-055 (REQ-055.6), REQ-025.1, REQ-059.2 · Branch: doit/TASK-3.6

## What was asked
Bot decisions (`stepBot` → `tagPolicy` → `recommend` → `computeEquity`) ran on the browser main thread, so a slow equity run froze the table. The story moves them into a Web Worker so that: no main-thread long task occurs while a bot computes (AC#1), hover and resize still repaint promptly (AC#2), and bot actions stay identical to the headless playtest (AC#3). The same worker also serves hint (`recommend`) and review (`grade`) requests for E08 and E09. Nothing changes on screen. Spec: doit/TASK-3.6/spec.md.

## Assumptions made without asking — please review
All reversible. Autopilot run; 0 questions asked.

| ID | Assumption | Why | To reverse |
|---|---|---|---|
| A-1 | Each bot request carries `{ view, style }` only. `style` is public table info; every style still decides with `decideTag` until E06. | `SessionSeat.style` is shown on screen. Saves E06 a protocol change. | Send the view only and look the style up in the worker |
| A-2 | Long-task and p95-frame tests run in Chromium only; hover/resize repaint and worker-equals-headless run in Chromium and WebKit. | WebKit has no Long Tasks API. REQ-055's reference machine is Chrome. | Also run p95 frames in WebKit |
| A-3 | In the slow harness every bot decision (preflop too) takes at least the configured time. | Superset of AC#1's precondition; more frame samples per hand. | Slow down postflop only |
| A-4 | A "repaint" is the second `requestAnimationFrame` callback after the event's `timeStamp`. | rAF runs once per rendered frame and shares the `performance.now()` time base. | First rAF only; a paint-timing heuristic |
| A-5 | "During the computation" = from the harness's `postMessage` of a bot request to the main-thread `message` event carrying its reply. | That is when the main thread waits on the worker. | Instrument inside the worker |
| A-6 | One DoD#1 sample is one rAF interval whose start lies inside a computation window; the test plays hands until it has 200 or more. | Makes "p95 over 200 samples" measurable. | Count frames over the whole hand |
| A-7 | AC#3's headless side is `playHand` with `button = 6`, `size = 6`; the user's recorded actions replay at seat 5, TAG plays the rest. | The app's default table equals the playtest cash table (2/4 blinds, $160 stacks, button 6). | Replay through `stepBot` |

## Clarifications and decisions
No questions asked. Decisions (D-1 to D-7 internal/reversible, "n/a autopilot"):
- D-1 Protocol: plain structured-clone data, no dependency. Request `{ id } & ({ kind:'bot', view, style } | { kind:'recommend', view } | { kind:'grade', view, userAction })`. Response `{ id, ok:true, value }` or `{ id, ok:false, error:{ name, message } }`. Requests carry `PlayerView` only, never `HandState`.
- D-2 (original: one worker per mounted `Table`) was deviated from, see below.
- D-3 The bot step keeps its `setTimeout(0)` macrotask, then posts the request. `applyBotDecision(t, turn, action)` returns `t` unchanged unless `t.hand === turn.hand`, so stale replies (unmount, new hand) are dropped.
- D-4 Harness pages load at `http://localhost:4173/__harness/<name>` and inline workers with `?worker&inline`. Production uses `new Worker(new URL('./advice.worker.ts', import.meta.url), { type: 'module' })`, a same-origin hashed asset (no new origins).
- D-5 Slow seam: `e2e/support/slow-advice.worker.ts` is test-only; it busy-waits `Number(self.name)` ms per `bot` request. It contains the marker `tlh-test-slow-advice`, and nothing under `src/` imports it, so the marker never reaches `dist/` (SPEC-10).
- D-6 Bot randomness, guidance for TASK-6.18: no seed crosses the boundary now (TAG has no randomness). TASK-6.18 must add a numeric per-decision seed derived on the main thread from (replay code, seat) to the `bot` request. It must never send the replay code to the worker, because the code determines the whole deck and would leak hidden cards (REQ-025.1).
- D-7 Failures: a throw in the service becomes an `ok:false` reply and the client rejects that request (`error.name` preserved). A worker `error`/`messageerror` rejects all pending and later requests with `Advice worker failed: <message>`. No silent main-thread fallback; error UI belongs to REQ-056.
- D-8 Timing-bound checks (SPEC-01 long tasks, SPEC-02 p95 frames, SPEC-03 hover/resize) are opt-in via `npm run e2e:slow` (sets `TLH_SLOW_TESTS=1`), per the user's standing rule of 2026-11-21 (timing checks opt-in unless a requirement says every push; REQ-055.6 doesn't). Every push keeps two non-timing guards: SPEC-15 (every bot action is served by a worker `bot` request, fails if decisions move back to the main thread) and SPEC-04 (AC#3 determinism).

### Recorded deviation: D-2 → one app-wide shared worker, prewarmed in `src/main.tsx`
- Why: with a per-table worker, its cold start (~30 ms) outlasted the locked paused-clock e2e tests' 20 `runFor(50)` slices (~35 ms real), so later bot steps waited on a paused fake timer (11 of 36 failed in a serial run). Build stopped (blocked), and the fix brief chose Option A.
- What changed: `sharedAdviceClient(create?)` creates the worker once; `main.tsx` calls it at app load; both e2e harnesses create it before mounting the table. The hook no longer owns a worker; unmount only drops that table's pending replies.
- Consequence: a request from a table left mid-decision keeps the worker busy, so the next table's first bot request queues behind it. Harmless at real speed (reviewer NIT, not fixed).

## What was built
- `src/table/advice-service.ts` (new, headless): `AdviceRequest`/`AdviceResponse` and pure `handleAdviceRequest` for `bot`, `recommend`, `grade`. Never throws; malformed envelopes (null, non-object, no id) get `{ id: null, ok:false, TypeError }`.
- `src/table/session.ts`: `stepBot` split into `botTurn` (the acting seat's PlayerView and style), `applyBotDecision` (applies only if the hand is still at that turn) and the unchanged `stepBot`.
- `src/ui/advice/advice-client.ts`: `AdviceClient` (promise API, id correlation, loud failure, terminates its worker once on failure, `dispose`), `createAdviceWorker()` factory, `sharedAdviceClient`.
- `src/ui/advice/worker-host.ts` (`installAdviceWorker`) and `advice.worker.ts` (production entry).
- `src/ui/table/useTableSession.ts`: bot step = `setTimeout(0)` → `requestBotDecision` → worker → `applyBotDecision`, with a cancelled flag. Exported `requestBotDecision` routes synchronous worker-creation failures into the rejection path. `createAdviceWorker` option is used only if no shared client exists yet.
- `src/main.tsx`: prewarms the shared client.
- Tests and harness: `e2e/responsive-table.spec.ts`, `e2e/support/{advice-harness.tsx,slow-advice.worker.ts,table-harness.tsx,table-harness-bundle.ts}`, `tests/table/{advice-service,bot-turn}.test.ts`, `tests/ui/{advice-worker.acceptance,advice-robustness}.test.ts`.
- `package.json` adds `e2e:slow`; `README.md` documents it next to `test:slow`. No new dependencies.

Usage: `sharedAdviceClient().decideBot(turn.view, turn.style)` for bots; E08/E09 use the same client's `recommend` and `grade` requests.

## How it was verified
Judge: see doit/TASK-3.6/judge/. Evidence below is from gate and build-log artifacts.

| SPEC item | Covers | Verification | Result |
|---|---|---|---|
| SPEC-01, 02, 03 | AC#1, AC#2, DoD#1 | `e2e/responsive-table.spec.ts` via `npm run e2e:slow` (opt-in; SPEC-01/02 Chromium only) | 8 passed, 2 skipped (WebKit, per A-2) |
| SPEC-04, 15 | AC#3 | same spec, every push, Chromium and WebKit | pass in `npm run e2e` (114 passed, 6 skipped) |
| SPEC-05, 09 | AC#3, failures | `tests/ui/advice-worker.acceptance.test.ts` (Node MessageChannel, 50 hands vs `playHand`) | pass |
| SPEC-06, 07, 08 | hidden info, stale replies, service | `tests/table/bot-turn.test.ts`, `advice-service.test.ts` | pass |
| SPEC-10 | production bundle | build, no `tlh-test-slow-advice` in `dist`, exactly one `advice.worker-*.js` | pass (build-log) |
| SPEC-11 | lint, typecheck, tests | final gate fix-3: 139 files passed / 1 skipped; 488 tests passed / 7 skipped; coverage 96.73% stmts; table/session.ts 100% lines | PASS |
| SPEC-12 | e2e | `npm run e2e` and `npm run e2e:slow`; locked paused-clock files (action-bar, table-display, table) 36 passed with `--workers=1` | pass |
| SPEC-13 | playtest | `npm run playtest -- --hands 10000 --seed 42 --size 6`: 0 invariant violations (5461 folds, 4539 showdowns) | pass (build round 2) |
| SPEC-14 | documentation | this doc published as a Backlog doc and linked to the task | done |

- Gates: build-1 PASS, fix-2 PASS, fix-3 PASS (warns only on scope budget and files outside spec). Locked tests unchanged; test integrity pass.
- Build round 1 was blocked on SPEC-12 (the D-2 deviation above), resolved in round 2. The first `e2e:slow` run also failed SPEC-01's sanity step (a CDP busy loop isn't reported as a long task); fixed by running the loop in a page task.
- DoD#4 (golden-spot suite) is N/A: the suite does not exist yet. DoD#10 is N/A: no strategy content. DoD#13 is N/A: no new screen and no service worker yet.
- Judge rounds: not yet run when this doc was written.

## Review
Round 1 (code and security): 0 blocking. 3 MINORs and 1 NIT were fixed in-story (fix gate 3), each with a test:
- Security MINOR `advice-service.ts`: request-shape check moved inside the `try`.
- Code MINOR `useTableSession.ts`: synchronous factory failure escaped the timer; now goes through `requestBotDecision`'s rejection path.
- Code MINOR `useTableSession.ts`: inert `createAdviceWorker` option documented as first-use-only; harness pass-through removed.
- Code NIT `advice-client.ts`: failed worker now terminated.

### Non-blocking review notes (deliberately not fixed)
- NIT `useTableSession.ts`: leaving a table mid-computation only drops the reply; the shared worker finishes that computation first (consequence of the app-wide worker).

## How to try it
- `npm run e2e` (every-push guards), `npm run e2e:slow` (timing checks), `npm test`.
- `npm run build && ls dist/assets | grep advice.worker`.

## Run metrics
Questions 0 · assumptions 7 · review rounds 1 · judge rounds 0 at doc time · gate runs 3 · escalations 0 · sendbacks 0 · changed lines 1226 (gate fix-3).

## Known limitations and follow-ups
- [trainer] Review grading still runs on the main thread. TASK-9.3 (planned; AC#6 already says computed at decision time off the main thread) should add an AC that it uses the advice worker's `grade` request. Owner: TASK-9.3.
- [trainer] TASK-6.18 must follow D-6: add an AC that its per-decision seed is derived on the main thread from (replay code, seat) and sent in the `bot` request, and that the replay code is never sent to the worker. Owner: TASK-6.18.
- Worker failure has no UI or recovery (REQ-056 recovery story).

## Lessons for the factory (proposals — not applied)
- The spec's D-2 (per-table worker) contradicted the locked paused-clock e2e tests' real-time budget (spec §3 noted the timing model but not worker start cost), which blocked the build and forced a deviation. Proposal: when a spec adds async infrastructure under locked paused-clock tests, the spec step should probe cold-start cost against them first.
