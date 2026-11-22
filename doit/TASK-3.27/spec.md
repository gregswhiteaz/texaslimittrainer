# Spec: TASK-3.27 — Make the Rapid-pace 400 ms self-test deterministic in WebKit

Status: READY (approved 2026-11-21)
Task: TASK-3.27 · Parent/epic: TASK-3 (Play hands at the table) · Requirements: n/a (follow-up from main CI #155, run 44962301903; covers TASK-3.13 SPEC-02) · Dream: limit-holdem-trainer

## 1. Summary
`e2e/rapid-pace.spec.ts::the paused-clock pace check catches a 400 ms wait` failed once in WebKit on main CI #155.
The meter returned `null` ("a bot is to act"). The task's hypothesis was that the 50 ms start-up slices let bot
actions finish before metering starts. Reproduction **refutes** it. The true cause is a check-order race in the
shared helper `meterBotAction` (`e2e/rapid-pace.spec.ts:202-215`). When the bot being metered is the last one
before the user's turn, its worker reply can land between the helper's `actionCount` read (`:206`) and its
"user's turn / hand over" read (`:207`). The helper then returns `null` for a bot action that did happen. This
task changes the helper to check the worker-post counter before deciding it is the user's turn. It also makes
the self-test's start-up stop exactly at the deal and assert that both pre-user bots are still to act. The same
fix stops the every-push guard from silently dropping samples.

### Evidence (reproduced 2026-11-21, local macOS, Playwright WebKit)
- CI error-context snapshot (`playwright-report` artifact of run 44962301903): Hand #1, Cal (seat 3) and Dee
  (seat 4) both `Folded`, You (seat 5) `To act` with Fold / Call $4 / Raise to $8 enabled. So both bot actions
  had happened, and the helper returned `null` on the second one.
- Unmodified test: 50/50 passed in WebKit (`--repeat-each 50`), and 200/200 of an instrumented copy passed with
  16 workers and 10 `yes` CPU burners. Every run's start-up stopped after 8 slices with `data-action-count` = 2
  (blinds only), seat 3 to act and 0 worker posts. Start-up never consumed a bot action. That is expected: the
  stretched bot timer is 400 ms, longer than a 50 ms slice, so a bot action needs 8 more slices after the deal
  while the loop stops at the first slice that shows the deal.
- Instrumented copy with worker replies delayed by a random 0–4000 `MessageChannel` hops (to mimic a slow CI
  worker):
  - Current check order: 1 failure in 100 runs. With a 15 ms pause between the two reads, 3 failures in 30 runs.
    Every failure was `start=2, samples=400,<null>`, the same signature as CI.
  - Worker-post check moved before the turn check: 0 failures in 100 runs, and 0 in 30 with the 15 ms pause.
- Guard test (`each bot action appears on the next tick of a paused clock`): it uses the same helper. On the race,
  `null` is skipped (`:236`) rather than failing, so the last bot before the user's turn goes unmetered. With
  the pinned words it records 8 samples, all 1 ms. Each street's last-bot-before-user (seat 4 preflop, seat 2
  after the flop) is exposed, so up to 4 samples could be lost, which is below the 5-sample minimum (`:240`). A
  silently unmetered action is also a hole in the guard.

## 2. Scope
- In scope (test-only, all in `e2e/rapid-pace.spec.ts`, a file locked by TASK-3.13: strengthen-only edits, approved by the user in Q-2; unlock recorded under TASK-3.13):
  - `meterBotAction`: check `workerPosts > posts` (then poll for the action, unchanged) **before** the
    user's-turn / hand-over check that returns `null`. Update its doc comment.
  - The 400 ms self-test's start-up: advance the paused clock 1 ms at a time until the deal shows
    (`data-action-count` > 0), capped at 2 000 fake ms (the old 40 × 50 bound). Replace the bare
    `> 0` check with exact assertions: action count is `2` (blinds only), and seat 3's row shows `To act`.
  - One-off AC#1 verification (50× per browser locally, one green CI run, mutants). It is recorded in the build
    log and not committed as a test.
- Not doing:
  - Any change to `src/`. `RAPID_BOT_DELAY_MS`, `botActionDelayMs` and `useTableSession` are correct.
  - Removing or loosening any assertion: the `>= 400` sample check, `samples.length < 2` metering, cap 1000,
    the guard's `<= 100` cap and `>= 5` sample minimum, the same-origin check, and `expect.poll`'s 10 s timeout
    all stay.
  - Changing the pinned replay words. No replay code can put 3 bots before the user in hand 1 (Q-1).
  - Metering more than 2 bot actions in the self-test, or acting for the user inside it.
  - The guard's own start-up loop (`:223-225`, 1 ms steps). In theory it can lose seat 3's sample if a deal
    render lags past one step, but it cannot fail (8 samples against a minimum of 5). Listed as a scope concern.
  - Retries, `waitForTimeout` sleeps, a permanent repeat/stress test, or a new regression file. The stress
    harness needs an injected worker delay and is a one-off proof (A-2).
  - `playwright.config.ts` and the CI workflow.
- Scope budget: files=1, lines=30

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | AC#1's mutant ("still fails if RAPID_BOT_DELAY_MS is set to 400") applies to the every-push guard test that uses the fixed helper. The self-test passes under that mutant by design, because it already expects ≥ 400. A second mutant (drop the self-test's `setTimeout` stretch) shows the self-test itself still has teeth. | yes | TASK-3.13's judge scenario uses the same mutant on the guard (`doit/TASK-3.13/spec.md:303-304`). The self-test asserts `>= 400` (`e2e/rapid-pace.spec.ts:269`), so a 400 ms product delay cannot make it fail. | Treat the self-test as the mutant's target (impossible as written) |
| A-2 | No permanent regression test for the race. Proof is the ordering argument (§5) plus a one-off stress run with injected worker latency (SPEC-05), as in the Evidence section. | yes | A deterministic reproduction needs the worker reply to land between two Playwright round-trips. That needs an injected delay and a pause, which is a stress harness, not a behaviour test. Keeping it would add slow every-push time. | New unlocked file `e2e/rapid-pace-meter.spec.ts` with the jittered worker |
| A-3 | The 50× local runs use `-g "paused"`, which selects both paused-clock tests (the guard and the self-test), in both projects. The slow tests stay skipped. | yes | Both tests use the changed helper. The slow tests are opt-in by the standing rule. | Self-test only |

## 3. Current system
- `e2e/rapid-pace.spec.ts` (locked by TASK-3.13, SPEC-02):
  - `installPausedClock` `:149-152`: `clock.install({ time: 0 })`, `pauseAt(1000)`. Fake time only moves in
    `clock.runFor`.
  - `countWorkerPosts` `:68-75`: `window.__workerPosts` counts every `Worker.postMessage`. The only poster is
    the bot decision path, `requestBotDecision` → `sharedAdviceClient(...).decideBot`
    (`src/ui/table/useTableSession.ts:48-53`, `src/ui/advice/advice-client.ts:95`).
  - `meterBotAction` `:202-215`: current order is (1) count > before → fake; (2) enabled user buttons or
    `Hand over` → `null`; (3) posts > posts0 → poll ≤ 10 s → fake; (4) cap; (5) `runFor(1)`.
  - Guard test `:217-246`. Self-test `:248-270`: stretches every 0 ms / missing `setTimeout` delay to 400 ms
    after New game, then start-up `:257-259` (`runFor(50)` up to 40 times while count is 0), then meters 2 bot
    actions with cap 1000 and expects each `>= 400`.
- App timing: the deal and every bot step are `setTimeout(…, 0)` at Rapid (`src/ui/table/useTableSession.ts:71,80-94`,
  `RAPID_BOT_DELAY_MS = 0` at `src/table/session.ts:195`). Under the self-test's stretch, each is 400 fake ms.
  The bot timer is only set after React commits the previous action. The decision then waits for the worker
  reply in real time.
- Hand 1 seating: button is `DEFAULT_BUTTON = 6` (`src/table/session.ts:59,101`) and the user is seat 5
  (`:58`). Blinds are seats 1 and 2, so preflop exactly 2 bots (seats 3 and 4) act before the user, whatever
  the replay code. Blinds are recorded actions, so `data-action-count` is 2 right after the deal
  (`src/table/table-view.ts:225`, `src/engine/hand.ts:56`).
- Playwright clock `runFor`: each due timer is run, then a real `postTask` is awaited. Timers created during
  the run fire only if due by the target tick (`node_modules/playwright-core/lib/coreBundle.js`, `_runTo` /
  `_callFirstTimer`). So a 400 ms timer set inside a 50 ms slice cannot fire in that slice.
- Tests: `npm run e2e` (= `playwright test`, both `chromium` and `webkit` projects, `retries: 0`,
  `playwright.config.ts:10,13-16`). CI runs `npm run e2e` on every push (`.github/workflows/ci.yml:85-86`) and
  uploads `playwright-report` on failure.
- Existing code to reuse:
  - `e2e/rapid-pace.spec.ts` `actionCount`, `workerPosts`, `enabledActions`, `handOver`, `tableSection`,
    `header` → keep using them; add no new helpers beyond an inline seat locator.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Fix the race in `meterBotAction` by moving the worker-post check before the `null` (user's turn / hand over) check. | (a) Read all four signals in one `page.evaluate` snapshot. (b) Re-read the count after the turn check. (c) Retry the test. | Reordering is the smallest change and makes the result exact (§5 proof). (a) also works and is faster, but touches more lines in a locked file. (c) hides the race. | yes (cross-story edit to a locked file) | user (Q-2) |
| D-2 | Self-test start-up advances 1 ms at a time until the deal shows (cap 2 000), then asserts count `2` and seat 3 `To act`. | Keep the 50 ms slices (proven harmless); a single `runFor(400)` (couples the test to the stretch value). | Follows AC#2 as rewritten in Q-1 (1 ms steps until the deal shows). The new assertions make "both pre-user bots are still to act" explicit, so any future start-up overrun fails with a clear message instead of a `null` meter. | yes (rewrites AC#2's mechanism) | user (Q-1) |
| D-3 | Keep the pinned words `[0x9e3779b9, 1, 2, 3]` and the 2-sample self-test. | Pick a code where ≥ 3 bots act first (impossible: §3 hand-1 seating); act for the user and meter seats 6/1/2 too. | The seating, not the deal, fixes how many bots act before the user. Two samples with no start-up loss is enough once the race is gone. | no | n/a |

## 5. Design

### Files to create / modify
- `e2e/rapid-pace.spec.ts` — reorder the checks in `meterBotAction` (+ doc comment); new start-up loop and
  assertions in `the paused-clock pace check catches a 400 ms wait`.

### Components, interfaces and data
- `meterBotAction(page, cap): Promise<number | null>` keeps its signature and return meanings: fake ms, `cap + 1`
  (as today, via `fake > cap`), or `null` only when it is the user's turn or the hand is over **and no bot
  decision has been posted since metering began**.
- New loop body, in this order:
  1. `actionCount > before` → return `fake`.
  2. `workerPosts > posts` → `expect.poll(actionCount, { timeout: 10_000 }).toBeGreaterThan(before)` → return `fake`.
  3. enabled user action or `Hand over` → return `null`.
  4. `fake > cap` → return `fake`.
  5. `page.clock.runFor(1)`.

### Rules and algorithms
- Why this order is exact: fake time moves only in step 5, so a bot timer can only fire, and a bot decision can
  only be posted, inside `runFor`. Steps 1–4 run between `runFor` calls.
  - If step 2 sees no new post, no decision for this meter is in flight, so no bot action can land before the
    next `runFor`. Step 3's `null` is then genuine: the user's turn (or hand end) came without a bot action.
  - If step 2 sees a new post, the action will land (or has already landed), and the poll waits for it in real
    time with the clock still paused. The fake count is unchanged.
  - The CI case: post seen, reply lands after step 1 → step 2 polls (count is already +1) → returns `fake`
    (400). Before the fix, the reply landing after step 1 made step 2, the old turn check, see the user's
    enabled buttons → `null`.
- Self-test start-up: `for (let ms = 0; ms < 2000 && (await actionCount(page)) === 0; ms++) await page.clock.runFor(1);`
  The deal timer (stretched to 400) fires at fake ms 400. The loop stops on the first read that shows the deal.
  The next bot timer is due 400 ms after the deal commits, which is 399+ steps away. Then:
  - `await expect(header(page)).toHaveText(/Hand #1$/)` (kept)
  - `expect(await actionCount(page)).toBe(2)` (was `toBeGreaterThan(0)`: strengthened)
  - `await expect(tableSection(page).locator('li[data-seat="3"]')).toContainText('To act')` (new)
  - Metering is unchanged: `while (samples.length < 2)` with cap 1000, `not.toBeNull()` with message
    `'a bot is to act'`, and each sample `>= 400`.

### Error handling and configuration
- No new configuration. A lagging worker still has the existing 10 s `expect.poll` bound, which fails loudly
  rather than flaking. If a future feature posts to the worker on the user's turn, step 2's poll times out with a
  clear failure instead of returning a silent `null`.

## 6. Behaviour specification

### SPEC-01: The meter records the last bot action before the user's turn even when its reply lands between reads
- Verifies: AC#2, AC#1
- Behaviour: Given the self-test setup (paused clock, 0 ms timers stretched to 400 ms, words
  `[0x9e3779b9, 1, 2, 3]`), When the 2nd metered bot action (seat 4, the last bot before seat 5) gets its worker
  reply at any moment after the helper's count read, Then `meterBotAction` returns a fake time `>= 400` (never
  `null`), and the test passes with samples `[≥400, ≥400]`.
- Verification: acceptance `e2e/rapid-pace.spec.ts::the paused-clock pace check catches a 400 ms wait`

### SPEC-02: The self-test's start-up stops at the deal with both pre-user bots still to act
- Verifies: AC#2
- Behaviour: Given the self-test, When Start game is clicked, Then the clock is advanced 1 ms at a time (never in
  50 ms slices) only until `data-action-count` > 0, and at that point the header ends `Hand #1`, the action count
  is exactly `2` (blinds), and seat 3's row shows `To act`. So both bots before the user (seats 3 and 4) are
  metered. (AC#2 as rewritten by the user in Q-1.)
- Verification: acceptance `e2e/rapid-pace.spec.ts::the paused-clock pace check catches a 400 ms wait`

### SPEC-03: The every-push guard meters every bot action, including each street's last bot before the user
- Verifies: AC#1
- Behaviour: Given the guard test with the pinned words and the scripted Check/Call user, When the hand plays to
  `Hand over`, Then every bot action is metered at `<= 100` fake ms, at least 5 samples are recorded (8 with the
  pinned words), and every request is same-origin. No sample is dropped by a reply landing between reads.
- Verification: acceptance `e2e/rapid-pace.spec.ts::each bot action appears on the next tick of a paused clock`

### SPEC-04: 50 consecutive passes in each browser locally and one green CI run
- Verifies: AC#1
- Behaviour: Given the fixed file, When both paused-clock tests run 50 times per project locally and the full
  suite runs once in CI, Then 100/100 (Chromium) and 100/100 (WebKit) pass locally (2 tests × 50), and the CI
  run's `E2E` step is green. Record counts and the CI run URL in the build log.
- Verification: command `npx playwright test e2e/rapid-pace.spec.ts -g "paused" --project chromium --project webkit --repeat-each 50 --reporter=line` then `gh run watch <run-id> --exit-status` on the pushed branch

### SPEC-05: The checks still catch slow bots (mutants), and the race fix holds under injected worker latency
- Verifies: AC#1
- Behaviour: one-off, nothing committed; revert each change after:
  1. M1: set `RAPID_BOT_DELAY_MS = 400` in `src/table/session.ts:195`. `each bot action appears on the next tick
     of a paused clock` fails in both projects (a sample > 100). The self-test still passes (A-1).
  2. M2: in the self-test, make the `setTimeout` wrapper pass `ms` through unchanged. `the paused-clock pace check
     catches a 400 ms wait` fails in both projects (a sample < 400, or the start-up assertions).
  3. Stress (WebKit): run an uncommitted copy of the self-test with an init script that delays every worker
     `message` event by a random 0–4000 `MessageChannel` hops (subclass `Worker`, wrap `addEventListener('message')`),
     plus `page.waitForTimeout(15)` right after the helper's count read. 30 runs give 0 failures with the fixed
     helper. As a control, the old order fails at least once in the same 30 (seen: 3 out of 30).
- Verification: manual `npx playwright test e2e/rapid-pace.spec.ts -g "paused" --project chromium --project webkit` under M1 and M2 (expect failures), and the stress copy with `--project webkit --repeat-each 30`

## 7. Edge cases
- Reply lands between reads (the CI bug): SPEC-01, SPEC-05.
- Reply lands before the count read, or after the post check: already handled (step 1, or step 2's poll). SPEC-01.
- User's turn with no bot pending: still `null` (step 3), which the guard needs in order to act. SPEC-03.
- Hand ends on a bot action: count rises → step 1/2 returns fake. SPEC-03.
- Deal render lags the start-up loop: the loop keeps stepping 1 ms. A bot timer needs ≥ 400 more steps, so a lag
  of even hundreds of round-trips is caught by `toBe(2)` with a clear message rather than a `null`. SPEC-02.
- Worker never replies: the existing 10 s poll fails loudly. N/A for new handling.
- Concurrency: tests run with `fullyParallel`, and each page has its own clock and worker. N/A.

## 8. Security considerations
N/A — test-only change. No new input, dependency, network origin (same-origin assertion unchanged), secret or
randomness.

## 9. Non-functional
- Every-push cost: the self-test start-up goes from ≤ 8 `runFor(50)` calls to about 400 `runFor(1)` + count reads.
  Expect about +0.5–1 s per project (measure: the `--reporter=line` duration of the self-test before and after,
  recorded in the build log). It must stay under 10 s per project in CI. The reorder adds no round-trips.
- Flake target: 0 failures in 50× per project locally and in the stress run (SPEC-04, SPEC-05).

## 10. Test plan
- Test command: `npm test && npm run e2e`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx playwright test e2e/rapid-pace.spec.ts -g "paused" --project chromium --project webkit`
- New tests: none. Changed acceptance tests in `e2e/rapid-pace.spec.ts` → SPEC-01, SPEC-02 (self-test), SPEC-03
  (guard, via the shared helper).
- Judge's end-to-end scenario:
  1. `npx playwright test e2e/rapid-pace.spec.ts --reporter=line`: both paused-clock tests pass in both projects.
     The slow tests are skipped with `timing check: run npm run e2e:slow`.
  2. `npx playwright test e2e/rapid-pace.spec.ts -g "paused" --project webkit --repeat-each 50`: 100 passed.
  3. Diff review: no assertion removed or loosened in `e2e/rapid-pace.spec.ts` (only the reorder, the new
     start-up loop, `toBeGreaterThan(0)` → `toBe(2)`, and the added seat-3 `To act` check).
  4. Mutant M1 (`RAPID_BOT_DELAY_MS = 400`): the guard fails. Revert.
  5. The CI run on the branch is green (URL in the build log).

## 11. Open questions
- None. Resolved in `doit/TASK-3.27/qa.md`:
  - Q-1: the user chose (a). The old AC#1 was replaced in Backlog (now renumbered AC#2; the 50-run/CI/mutant criterion is now AC#1) to the recommended wording: 1 ms start-up steps until
    the deal shows, exactly two blinds posted and seat 3 to act, and the meter returns a time for the last bot
    before the user's turn even when that bot's reply lands between its checks.
  - Q-2: the user approved the strengthen-only cross-story edit to `e2e/rapid-pace.spec.ts`. The unlock is
    recorded under TASK-3.13.

## 12. Clarifications log
See `doit/TASK-3.27/qa.md`.
