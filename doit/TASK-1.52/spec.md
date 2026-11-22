# Spec: TASK-1.52 — Remove timing-fragile tests that turn CI red on slow runners

Status: READY (approved 2026-11-22)
Task: TASK-1.52 · Parent/epic: TASK-1 · Requirements: n/a · Dream: limit-holdem-trainer

## 1. Summary
Main CI #174 (run 44990101974, attempt 1) failed on two timing races that passed on re-run. The first was a 31 s
unit test under coverage that hit the 30 s timeout. The second was an e2e test that advanced a paused clock by a
fixed 1,000 ms before seat 4's bot reply had come back from the advice worker. This task moves the two slow unit
tests (> 10 s) to the sweep group, where they still run on every push but without coverage, and keeps smaller
versions in unit. It also replaces every fixed paused-clock budget that waits for a worker reply with one shared,
bounded "advance until it is my turn" helper, and proves that helper by delaying worker replies on purpose. No
assertion is removed or loosened. Only the way each test reaches its state changes.

## 2. Scope
- In scope:
  - `tests/playtest/policy.test.ts` `lineUpPolicyFactory` test → full 200/500-hand version moved unchanged to a
    sweep file; a smaller version with the same assertions stays in unit.
  - `tests/bots/calling-station.test.ts` 'Calling station draws once only at deviating decisions' (14.4 s in
    unit on the green run, 22.4 s on the slow one) → moved unchanged to a sweep file; its cheap `drawDeviation`
    stub checks are also kept in unit.
  - New `e2e/support/paused-clock.ts` with `runUntilMyTurn` and `delayWorkerReplies`.
  - Each e2e site in the §5 audit table marked "fix" switches to `runUntilMyTurn` (locked files are unlocked
    per file, see D-3).
  - New `e2e/worker-delay.spec.ts`, which proves AC#2 with delayed worker replies.
- Not doing:
  - No change under `src/`, `playwright.config.ts`, `vite.config.ts`, `package.json` scripts or the CI workflow.
  - No raised or added timeouts on the tests that are being fixed, and no `retries`.
  - Conditional 400-slice loops and fixed budgets whose subject is the app's own timers are justified, not
    rewritten (§5 table).
  - No changes to the opt-in slow group (`test:slow`, `e2e:slow`) or the tooling group.
  - The parked CI-speed plan is not part of this task.
- Scope budget: files=12, lines=600   (≈170 lines are moved between files and count on both sides)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The "story doc" in AC#3 is this spec's §5 audit table, copied into the task's implementation notes at the docs step | yes | No backlog doc exists for this task. The spec is where the measurement is recorded | A separate `backlog doc` |
| A-2 | Every-push unit versions: 6-max Tough 40 hands, 9-max Tough 100 hands, Soft 20 hands (unchanged). If `tough !== all-TAG` does not hold at 40 hands, use the smallest multiple of 20 at which it does | yes | Keeps every assertion and cuts the run to about 1/5 | Opt-in slow group instead of sweep (rejected: sweep still runs on every push) |
| A-3 | `runUntilMyTurn` bounds: 50 ms fake slices, at most 60,000 ms of fake time and 10,000 ms of real time, then throws | yes | Same slice size as the existing loops (`e2e/action-bar-limits.spec.ts:40-41`). 10 s of real time is well inside Playwright's 30 s default | Counting in-flight worker posts like `meterBotAction` (more code, not needed when the target is the user's turn) |
| A-4 | Extra fake time while a reply is in flight is harmless. With a paused clock, no app timer is pending then (the bot step timer has already fired, `src/ui/table/useTableSession.ts:78-94`), and the user's turn starts no timer (`e2e/table.spec.ts:260-272`, "ten idle minutes change nothing") | yes | Lets the helper stay simple | — |
| A-5 | AC#4's "CI on the branch" means a push of `doit/TASK-1.52` (done by the orchestrator or the user, never by the builder) | yes | `doit.py commit` never pushes | — |

## 3. Current system
- Vitest 5.1, global `testTimeout: 30_000` (`vite.config.ts:10`). Groups (`package.json`):
  - `test:unit`: with coverage, excludes `*.acceptance|perf|property.test.*`.
  - `test:sweeps`: no coverage, runs those patterns, sharded 2 ways in CI (`.github/workflows/ci.yml:131-150`), every push.
  - `test:slow`: opt-in through `TLH_SLOW_TESTS=1`.
- Coverage thresholds: lines 70 overall, 90 for `src/{engine,bots,advice,stats,playtest,table}/**` (`vite.config.ts:16-19`).
- Playwright 1.65.1, default 30 s per-test timeout, `retries: 0`, Chromium and WebKit (`playwright.config.ts`).
- Bots in the app always decide in the advice worker (`src/ui/table/useTableSession.ts:42-47`). The worker is
  created with `new Worker(new URL('./advice.worker.ts', import.meta.url), { type: 'module' })`
  (`src/ui/advice/advice-client.ts:114`), and the client listens with
  `worker.addEventListener('message', …)` (`src/ui/advice/advice-client.ts:62`). A bot step is
  `setTimeout(botActionDelayMs)` → worker request → reply → apply (`useTableSession.ts:78-94`). So under a paused
  clock, the next bot timer exists only after a real-time worker reply.
- The failure is reproduced from the CI log: `expectToAct(page,'5')` received "4" (`e2e/support/table-locators.ts:15`,
  called from `e2e/action-bar-limits.spec.ts:42`).
- Existing code to reuse:
  - `e2e/support/table-locators.ts` → `expectToAct`, `toActSeats`.
  - `e2e/next-hand.spec.ts:70-74` → the pattern of a blob Web Worker as a real-time timer that the page's fake
    clock does not touch (reused inside `delayWorkerReplies`).
  - `e2e/rapid-pace.spec.ts:67-72` → the pattern of patching `Worker` in an init script (`__workerPosts`).
  - `e2e/support/table-harness-bundle.ts` → `stubReplayWords`.
  - `tests/bots/calling-station.test.ts:14-39` → `stub`, `owed`, `seatOneViews` (moved with the test).
  - `TOOLCHAIN_TIMEOUT_MS`-style constant `TEST_TIMEOUT_MS = 120_000` (`tests/bots/calling-station.test.ts:11`).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Slow unit tests move to new `*.acceptance.test.ts` files (sweep group, every push, no coverage) with `TEST_TIMEOUT_MS = 120_000` | Raise the timeout in unit; the opt-in slow group | The standing rule keeps correctness runs of a few seconds on every push. Sweep drops the coverage overhead (≈2×). Raising timeouts hides the margin problem | no | n/a |
| D-2 | One shared helper `runUntilMyTurn(page)`, whose predicate is "an enabled button in Your actions" | Per-file loops; a predicate per seat | Every fixed-budget site waits for the user's turn, and the existing assertions after it (`expectToAct`, counts, labels) stay as they are | no | n/a |
| D-3 | Locked files are edited only to swap the clock-advance call, after `doit.py unlock <OWNER> <file> --reason "TASK-1.52: reach state via bounded runUntilMyTurn; assertions unchanged"` | Leave locked files (fails AC#2/#3) | Changes how the state is reached, not what is asserted. Covers all six files: action-bar-limits (TASK-3.7), action-bar (TASK-3.2), table-display (TASK-3.3), table (TASK-3.1), home (TASK-2.1), game-type-choice (TASK-2.4); unlocks recorded under those owners | yes | user (Q-1) |
| D-4 | AC#2 proof: an init script delays every advice-worker reply by a fixed real-time delay. A negative control shows the old fixed budget fails under the delay, and the helper passes | `page.route` rewriting the worker bundle (whether worker requests are routed differs between engines) | Deterministic on both engines. Reuses existing in-page patterns | no | n/a |

## 5. Design

### Files to create / modify
- `tests/playtest/policy.test.ts` — the `lineUpPolicyFactory` test uses the A-2 hand counts. Every
  `expect` stays.
- `tests/playtest/policy-lineup.acceptance.test.ts` — new. The current `lineUpPolicyFactory` test moved verbatim
  (200 / 500 / 20 hands), with timeout `120_000`.
- `tests/bots/calling-station.test.ts` — the long test is removed from here. A new fast test,
  `'drawDeviation draws once and compares against p'`, keeps the current stub block (lines 45-56) verbatim.
  `seatOneViews` and `owed` go if they are no longer used.
- `tests/bots/calling-station-draws.acceptance.test.ts` — new. Takes 'Calling station draws once only at
  deviating decisions' verbatim with `stub`, `owed`, `seatOneViews` and `TEST_TIMEOUT_MS`.
- `e2e/support/paused-clock.ts` — new. `runUntilMyTurn`, `delayWorkerReplies`.
- `e2e/worker-delay.spec.ts` — new. The AC#2 proof (SPEC-04, SPEC-05).
- `e2e/action-bar-limits.spec.ts` (locked: TASK-3.7) — line 41 → `await runUntilMyTurn(page)`.
- `e2e/action-bar.spec.ts` (locked: TASK-3.2) — `runFor1000` at 156, 178, 217, 226, 238 → `runUntilMyTurn`.
  Drop `runFor1000` if it is no longer used.
- `e2e/table-display.spec.ts` (locked: TASK-3.3) — `runFor1000` at 269, 291 → `runUntilMyTurn`.
- `e2e/table.spec.ts` (locked: TASK-3.1) — `runFor1000` at 263 ("ten idle minutes") → `runUntilMyTurn`.
- `e2e/home.spec.ts` (locked: TASK-2.1) — line 234 → `runUntilMyTurn`. The blind/stack/card assertions after it
  stay.
- `e2e/game-type-choice.spec.ts` (locked: TASK-2.4) — the loop at 95-98, capped at 5,000 ms → `runUntilMyTurn`.


### Components, interfaces and data
```ts
// e2e/support/paused-clock.ts
/** Under a paused clock: runs 50 ms fake slices until a Your actions button is enabled.
 *  Throws Error(`runUntilMyTurn: not my turn after ${fake} ms fake / ${real} ms real`) past either bound. */
export async function runUntilMyTurn(page: Page, opts?: { maxFakeMs?: number; maxRealMs?: number }): Promise<void>;
/** Init script (page.addInitScript(delayWorkerReplies, ms)): every `message` event from a Worker the page
 *  creates is held back and dispatched again after `ms` real milliseconds. */
export function delayWorkerReplies(ms: number): void;
```
- `runUntilMyTurn` loop: check `page.locator('[aria-label="Your actions"] button:not(:disabled)').count() > 0`
  → return. Otherwise, if fake ≥ maxFakeMs (default 60,000) or real elapsed ≥ maxRealMs (default 10,000, measured
  with Node's `Date.now()`, which the page clock does not fake) → throw. Otherwise `page.clock.runFor(50)`;
  `fake += 50`. It checks before every slice, so it never advances once the user's turn is reached.
- `delayWorkerReplies(ms)` in the page:
  - Keep `RealWorker = window.Worker`.
  - Create one timer worker `new RealWorker(blobURL('onmessage=e=>setTimeout(()=>postMessage(e.data),' + ms + ')'))`.
    Its timers are real, because the page clock does not reach workers (`e2e/next-hand.spec.ts:70`).
  - Replace `window.Worker` with a subclass. Its constructor adds a first `message` listener that calls
    `event.stopImmediatePropagation()` on any event without the marker, queues `event.data` under an id and posts
    the id to the timer worker.
  - When the timer worker answers, the subclass dispatches `new MessageEvent('message', { data })` and marks it
    (a WeakSet of re-dispatched events), so its own listener lets it through.
  - Delivery stays in FIFO order. `error`/`messageerror` are not touched.

### Rules and algorithms
- AC#3 audit (green run = 44990101974 attempt 2). Timeout use = duration / effective timeout.

| Group | Test | CI ms | Timeout | Use | Action |
|---|---|---|---|---|---|
| unit | policy.test.ts › lineUpPolicyFactory plays the preset… | 20,045 (31,483 on attempt 1) | 30,000 | 67% | fix: SPEC-01 |
| unit | calling-station.test.ts › draws once only at deviating decisions | 14,377 (22,378) | 120,000 | 12%, but > 10 s | fix: SPEC-02 (AC#1 10 s limit) |
| unit | calling-station.test.ts › seated Calling stations… | 6,983 | 120,000 | 6% | justified (< 10 s) |
| unit | cli.test.ts › rejects every invalid argument | 5,491 | 30,000 | 18% | justified |
| sweep | sandbox-timeout.acceptance › kills a grandchild… | 15,104 | 120,000 | 13% | justified: it waits on an intended 15 s sandbox timeout |
| sweep | million.acceptance › byte-identical | 8,674 | 30,000 | 29% | justified |
| sweep | all other sweep tests | ≤ 8,083 | ≥ 30,000 | < 27% | justified |
| e2e | rapid-pace.spec.ts:249 catches a 400 ms wait | 10,700 | 30,000 | 36% | justified (< 50%; already bounded by `meterBotAction`) |
| e2e | all other e2e | ≤ 6,200 | 30,000 | < 21% | see clock table |

  Paused-clock fixed budgets (fake time advanced, then the test asserts a state that needs a worker reply):

| Site | Owner (lock) | Waits for a worker reply? | Action |
|---|---|---|---|
| action-bar-limits.spec.ts:41 | TASK-3.7 | yes, seats 3 and 4 (failed in CI) | fix |
| action-bar.spec.ts:156, 178, 217, 226, 238 | TASK-3.2 | yes | fix |
| table-display.spec.ts:269, 291 | TASK-3.3 | yes | fix |
| table.spec.ts:263 | TASK-3.1 | yes: it captures labels and count, so a late reply changes the count during the 600 s idle | fix |
| home.spec.ts:234 | TASK-2.1 | yes: `expectToAct(page,'5')` at :244 | fix |
| game-type-choice.spec.ts:95-98 (5,000 ms cap) | TASK-2.4 | yes, the fake cap is only a few real ms per slice | fix |
| table.spec.ts:167, 182; stake-choice.spec.ts:76 | TASK-3.1, 2.3 | no: they assert only blinds, stacks and that the bar is visible (deal timer, no worker) | justified |
| table.spec.ts:231; next-hand/review `slices(n)` | 3.1, 3.4, 9.1 | no: the subject is the app's own result/auto-deal timer | justified |
| 400-slice conditional loops (table.spec:124, table-display:302, action-bar:182, next-hand/review `slicesUntil`) | various | condition-bounded; 400 slices take several real seconds | justified |

- Examples: in the delayed run (2,000 ms per reply), the old 20 × 50 ms loop finishes in under 1 s of real
  time, while seat 3's reply alone needs 2 s, so it is not the user's turn and fewer than 4 actions exist.
  `runUntilMyTurn` keeps slicing until both replies (≥ 4 s real) land, and then seat 5 is to act with 4 actions.

### Error handling and configuration
- `runUntilMyTurn` throws a plain `Error` with the message in the signature above. Defaults are in A-3.
- New sweep files use `TEST_TIMEOUT_MS = 120_000`.

## 6. Behaviour specification

### SPEC-01: lineUpPolicyFactory checks keep every assertion, with a fast unit version and the full sweep version
- Verifies: AC#1, AC#4
- Behaviour: Given the unit group, When `tests/playtest/policy.test.ts` runs, Then the `lineUpPolicyFactory` test
  makes the same 6 `expect` calls as today with A-2 hand counts and takes ≤ 3,000 ms locally under coverage.
  And given the sweep group, When `tests/playtest/policy-lineup.acceptance.test.ts` runs, Then the original
  200/500/20-hand test passes verbatim with a 120,000 ms timeout.
- Verification: unit `tests/playtest/policy.test.ts::lineUpPolicyFactory plays the preset at 6 seats and random moves otherwise` and `tests/playtest/policy-lineup.acceptance.test.ts::lineUpPolicyFactory plays the preset at 6 seats and random moves otherwise`

### SPEC-02: the Calling-station draw test moves to sweep unchanged
- Verifies: AC#1, AC#4
- Behaviour: Given the sweep group, When `tests/bots/calling-station-draws.acceptance.test.ts` runs, Then
  'Calling station draws once only at deviating decisions' passes with the same body as before. Given the
  unit group, Then `'drawDeviation draws once and compares against p'` passes, and `npm run test:unit` still meets
  the coverage thresholds.
- Verification: unit `tests/bots/calling-station-draws.acceptance.test.ts::Calling station draws once only at deviating decisions` and `tests/bots/calling-station.test.ts::drawDeviation draws once and compares against p`

### SPEC-03: no unit test over 10 s on CI
- Verifies: AC#1, AC#3
- Behaviour: Given the branch's green CI run, When per-test durations in the "Unit tests with coverage" job are
  listed, Then none is ≥ 10,000 ms, and no unit or sweep test uses more than 50% of its timeout.
- Verification: command `gh run view <branch-run-id> --log | sed 's/\x1b\[[0-9;]*m//g' | perl -ne 'print if /^Unit tests with coverage\t.*[✓×].*\s(\d+)ms\s*$/ && $1 >= 10000'` prints nothing

### SPEC-04: a late worker reply no longer breaks action-bar-limits
- Verifies: AC#2
- Behaviour: Given a paused clock, `delayWorkerReplies(2000)`, the pinned words `[0x9e3779b9,1,2,3]` and
  New game → Start game, When `runUntilMyTurn(page)` returns, Then seat '5' is to act, `data-action-count` is 4,
  clicking 'Call $4' makes the count 5, seat '6' is to act and the buttons read Fold, Call, Raise. These are the
  same steps and assertions as `e2e/action-bar-limits.spec.ts:33-47`.
- Verification: acceptance `e2e/worker-delay.spec.ts::with every worker reply 2 s late the bounded advance still reaches my turn`

### SPEC-05: negative control — the delay really reproduces the CI race
- Verifies: AC#2
- Behaviour: Given the same setup as SPEC-04, When the old fixed loop (20 × `clock.runFor(50)`) runs, Then no
  Your-actions button is enabled and `data-action-count` < 4. When `runUntilMyTurn` then runs, Then seat '5' is to
  act.
- Verification: acceptance `e2e/worker-delay.spec.ts::with every worker reply 2 s late a fixed 1,000 ms budget is not enough`

### SPEC-06: the fixed-budget sites use the bounded helper and assert the same things
- Verifies: AC#2, AC#3, AC#4
- Behaviour: Given each "fix" site in the §5 clock table, When its spec runs on Chromium and WebKit, Then it
  passes, and the diff of each locked file changes only the clock-advance lines and imports (no `expect` line is
  removed or changed).
- Verification: command `npx playwright test e2e/action-bar-limits.spec.ts e2e/action-bar.spec.ts e2e/table-display.spec.ts e2e/table.spec.ts e2e/home.spec.ts e2e/game-type-choice.spec.ts e2e/worker-delay.spec.ts && git diff main -- e2e/ tests/ | grep -E '^-.*expect' ` (the grep prints nothing except lines moved verbatim to the new sweep files)

### SPEC-07: the helper fails loudly when the user's turn never comes
- Verifies: AC#2
- Behaviour: Given a paused clock on the home page (no table), When `runUntilMyTurn(page, { maxRealMs: 500 })`
  runs, Then it rejects with a message that starts `runUntilMyTurn: not my turn after`.
- Verification: unit `e2e/worker-delay.spec.ts::runUntilMyTurn throws when my turn never comes`

### SPEC-08: the whole CI is green on the branch
- Verifies: AC#4
- Behaviour: Given the pushed branch, When CI runs, Then every job (lint/typecheck/build, unit, both sweep
  shards, tooling, e2e) succeeds on the first attempt.
- Verification: command `gh run list --branch doit/TASK-1.52 --limit 1 --json conclusion,attempt` shows `success` with attempt 1

## 7. Edge cases
- Reply arrives between the check and `runFor`: harmless. The next check sees the user's turn (A-4).
- The user's turn never comes (bug): SPEC-07 bounds it at 10 s real time, before the 30 s test timeout.
- Hand ends before the user's turn: not reachable with the pinned words (seat 5 always acts preflop). The bound
  throws.
- WebKit: `delayWorkerReplies` uses only `Worker`, `Blob`, `MessageEvent` and `stopImmediatePropagation`, which
  both engines support. SPEC-04 and SPEC-05 run on both projects.
- Coverage drop from moving tests out of unit: checked by `npm run test:unit` thresholds (SPEC-02).

## 8. Security considerations
Test-only code. `delayWorkerReplies` is never imported under `src/`, so it doesn't reach `dist/`. No new
dependencies, no untrusted input, no secrets. Randomness: N/A.

## 9. Non-functional
- Unit group: each test < 10 s on CI (SPEC-03). The `lineUpPolicyFactory` unit version takes ≤ 3 s locally
  under coverage.
- Sweep: the moved tests use < 50% of their 120 s timeout.
- e2e: `worker-delay.spec.ts` adds about 10 s of real time per engine. Other specs keep their duration within ±1 s.

## 10. Test plan
- Test command: `npm run test:unit && npm run test:sweeps && npm run e2e`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx playwright test e2e/worker-delay.spec.ts e2e/action-bar-limits.spec.ts`
- New tests:
  - `e2e/worker-delay.spec.ts` → SPEC-04, SPEC-05, SPEC-07
  - `tests/playtest/policy-lineup.acceptance.test.ts` → SPEC-01
  - `tests/bots/calling-station-draws.acceptance.test.ts` → SPEC-02
- Judge scenario:
  1. Run `npx playwright test e2e/worker-delay.spec.ts` (both engines green).
  2. Temporarily set the delay in SPEC-04 to 4,000 ms and re-run; it is still green.
  3. Run `npm run test:unit` and confirm that no test line shows ≥ 10,000 ms.

## 11. Open questions
- None.

## 12. Clarifications log
See `doit/TASK-1.52/qa.md`. Q-1 (2026-11-22): the user approved editing all six locked e2e files (D-3).
