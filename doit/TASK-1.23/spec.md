# Spec: TASK-1.23 — Harden CI child-process cleanup

Status: READY
Task: TASK-1.23 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: n/a (follow-up from TASK-1.19 / TASK-1.20 reviews and TASK-1.29, doc-11, doc-12, doc-27) · Dream: limit-holdem-trainer

## 1. Summary
CI run #68 (run id 44461319182, main @ 9ba77c8, attempt 1) failed in "Install Playwright system dependencies".
Attempt 1 of `tools/ci/retry.js` timed out at 240 s, but its root `apt-get` (pid 5507) survived. It held
`/var/lib/dpkg/lock-frontend`, so attempts 2 and 3 each waited 150 s in `apt-lock.js` and then refused to run.
This is the second CI failure with this cause. This task makes `retry.js` really stop a timed-out attempt: if a
plain group kill is refused (EPERM), it sends the signal again with `sudo -n kill` and waits until the process
group is gone before the next attempt starts (AC#4). If the group still cannot be stopped, it ends at once with a
`::error::` line instead of waiting for the step timeout (AC#1). It also makes two tests clean up their child
processes: the sudo test kills its `sudo sleep` in `finally` (AC#2), and the nested Vitest run in the speed-limits
test is killed as a whole process group (AC#3).

## 2. Scope
- In scope:
  - `tools/ci/retry.js`: `killGroup` returns an outcome. Add a sudo fallback (`sudoKillGroup`) and a bounded
    "reap" wait after every attempt. An attempt that cannot be stopped ends the helper with `::error::` and exit 1.
    `runWithRetry` takes an optional second parameter (the sudo fallback) so that tests can replace it.
  - `tests/ci/retry.sudo.test.ts`: unit tests for the stop logic (mocked `process.kill`, fake sudo fallback). One
    new Linux-CI-only acceptance test with a real root process that holds a real lock. `try/finally` cleanup in
    both Linux-CI-only tests.
  - `tests/support/process-group.ts` (new): a small async helper that runs a command in its own process group and
    kills the whole group at a timeout. Plus its unit test `tests/support/process-group.test.ts`.
  - `tests/ci/speed-limits.acceptance.test.ts`: use the helper instead of `spawnSync`.
  - `README.md`: one sentence in the CI paragraph.
- Not doing:
  - Changing `.github/workflows/ci.yml`, retry's flags or defaults, the step `timeout-minutes: 13`, the job
    timeout, or `tools/ci/apt-lock.js`.
  - Repairing dpkg after a kill (`sudo dpkg --configure -a`). See scope concerns in the final report.
  - Walking `/proc` to find descendants that left the process group. The evidence shows that the orphaned
    `apt-get` stays in the attempt's group (§3).
  - Adding a sudo fallback to the cancellation path (`onSignal`, SIGINT/SIGTERM sent to retry.js itself).
  - Changing `tests/support/sandbox.ts::runInSandbox` (it also uses `spawnSync` with a timeout). AC#3 names only
    the speed-limits test.
  - New dependencies or new CLI flags.
- Scope budget: files=6, lines=330   (retry.js ~+75/−15, retry.sudo.test.ts ~+120/−30, process-group.ts ~45, process-group.test.ts ~40, speed-limits ~+15/−12, README +2/−1)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The reap wait is at most **2 s**. It checks every **250 ms** (constants `REAP_SECONDS = 2`, `REAP_POLL_MS = 250` in retry.js) and adds no new flag | yes | SIGKILL takes effect in milliseconds. 2 s is negligible next to the 240 s attempt. Polling every 250 ms limits how often sudo runs and logs (at most 8 times) | Reuse `--kill-after-seconds` (10 s default) as the bound; add a `--reap-seconds` flag |
| A-2 | An attempt that cannot be stopped ends the **whole helper** with exit 1. No further attempts run | yes | Run #68 shows that later attempts only wait out the lock (2×150 s) and fail anyway. Ending at once is what AC#1 asks for | Log the error and keep retrying |
| A-3 | Exact new log lines are listed in §5. They follow the existing `retry:` / `::warning::` / `::error::` style (`tools/ci/retry.js:33,103-109`) | yes | Consistent with the existing helper | Other wording |
| A-4 | The sudo fallback runs `sudo -n kill -s <NAME> -- -<pgid>` with `stdio: 'ignore'` and a 10 s `spawnSync` timeout. Exit 0 counts as sent. Any other result (no sudo, a password is needed, timeout) counts as not sent and is never thrown | yes | `-n` never prompts. GitHub ubuntu runners have passwordless sudo. On a dev machine without cached credentials it fails fast and harmlessly | `sudo -n pkill -g <pgid>`; no fallback off Linux |
| A-5 | The speed-limits nested run gets its own timeout of **100 s**, below the 120 s Vitest test timeout | yes | The helper is async, so the Vitest test timeout could fire first. That would leave the nested run alive. The nested timeout must fire first. The two passing runs take well under 100 s | Raise the test timeout to 140 s |
| A-6 | The sudo tests clean up with `sudo -n pkill -KILL -f <pattern>`. `<pattern>` is the marker with its first digit in a bracket class (e.g. `[1]000[.]123456789`). They also kill the helper child if it is still running and remove any temp dir | yes | The bracket pattern matches the marker but not the text of the `pkill`/`sudo` command lines, so the cleanup cannot kill itself | Record pids and `sudo kill` them |

## 3. Current system
- **What failed (CI logs).**
  - Run 44461319182 attempt 1 (`gh run view 44461319182 --attempt 1 --log`). Attempt 1 starts at 04:56:53 and
    logs `timed out after 240 s` at 05:00:53. Attempts 2 and 3 log `apt-lock: waiting up to 150 s for
    /var/lib/dpkg/lock-frontend (held by process 5507 (apt-get))`, then `::error::apt lock … is still held by
    process 5507 (apt-get) after 150 s`. The run ends with `::error::Install Playwright system dependencies failed
    after 3 attempts`.
  - This attempt's log has **no** `retry: could not send … (EPERM)` line. The likely reason: retry's final group
    SIGKILL in `finish` (`tools/ci/retry.js:64`) ran while the runner-owned `sudo` front end was still alive. A group
    kill succeeds if it can signal any member (Linux semantics), so the root `apt-get` was never signalled, and no
    second kill followed.
  - In the earlier failing run 44434902016 that line does appear: `retry: could not send SIGKILL to process group
    4430 (EPERM)` (recorded in `doit/TASK-1.29/spec.md` §3). EPERM on a group kill means the group still exists
    and holds only processes we may not signal. So the orphaned root `apt-get` **stays in the attempt's process
    group**, and `sudo -n kill -- -<pgid>` reaches it.
  - The re-run (attempt 2 of run 68) shows the same orphan (pid 5585) still downloading after the timeout. That
    time attempt 2's 150 s lock wait was long enough.
- **How apt gets there:** Playwright runs `sudo -- sh -c "apt-get update&& apt-get install -y …"` as a normal,
  non-detached child (`node_modules/playwright-core/lib/coreBundle.js:33787-33799,34034-34041`). retry spawns
  each attempt `detached: true`, so the attempt leads its own process group (`tools/ci/retry.js:46`). sudo, sh,
  apt-get and apt's helpers all inherit that group. retry's SIGTERM reaches the runner-owned processes and
  `sudo`. sudo passes the signal on to its direct child `sh` only, so `apt-get` is left running as root, as an
  orphan.
- `tools/ci/retry.js`:
  - `killGroup` (`:27-36`) swallows ESRCH and logs EPERM.
  - `runAttempt` (`:44-73`): SIGTERM at the timeout and SIGKILL after `killAfterSeconds`. On `exit`/`error`,
    `finish` sends one more group SIGKILL and resolves. If the direct child can never be killed, `exit` never
    fires, so the attempt waits for the step timeout (AC#1).
  - `runWithRetry` (`:79-115`) logs the warning and error lines and is exported.
- `tests/ci/retry.sudo.test.ts`:
  - `killGroup` unit tests use `vi.spyOn(process, 'kill')` (`:16-36`).
  - The Linux-CI-only test (`:40-78`) runs `sudo -n sh -c 'exec sleep "$1"'` with a unique marker and checks
    `pgrep -f marker`. It has no `finally`, so a failed assertion leaves the root sleep running (AC#2).
  - `onLinuxCi` is defined at `:38`.
- `tests/ci/speed-limits.acceptance.test.ts:23-28`: `spawnSync('npx', …, { timeout: TIMEOUT_MS })`. At the timeout
  this signals only `npx`. The nested Vitest and its workers survive (AC#3). The test timeout equals the spawn
  timeout (120 s, `:11,43,54`).
- Tests run with Vitest (`vite.config.ts:6-17`, includes `tests/**/*.test.{ts,tsx}`, default timeout 30 s).
  `tools/**/*.js` is type-checked (`tsconfig.json` `allowJs`/`checkJs`, includes `tools`, `tests`).
- Existing code to reuse:
  - `tools/ci/retry.js::killGroup` → the group signal in retry and in the new test helper.
  - `tests/ci/fixtures/flaky-command.js` `hang-tree` mode → a parent plus grandchild for the helper test. It
    writes the grandchild pid to `<state>.child`.
  - `tests/support/sandbox.ts::REPO_ROOT`, `sandboxEnv` → paths and env for the nested Vitest run.
  - The `isAlive` / `waitUntilGone` pattern in `tests/ci/retry.test.ts:53-67` → the same polling check in the new
    tests (copy it; do not export it from a test file).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Escalate to `sudo -n kill -s <SIG> -- -<pgid>` only when the plain group kill returns EPERM. The reap loop below keeps re-sending SIGKILL until that happens | Always also run sudo on timeout; walk `/proc` for descendants and kill them by pid; run retry itself under sudo | The AC itself suggests "sudo -n kill on the process group". EPERM is the exact signal that only unsignalable members remain (§3). There is no extra sudo call on normal runs or on a dev machine | no | n/a (AC#4 text) |
| D-2 | After **every** attempt, retry waits (at most `REAP_SECONDS`) until the process group no longer exists before it logs the attempt result and starts the next attempt. This is the answer to "should a stopped attempt wait for the lock to be released". A process's fcntl locks are released when it exits, so "group gone" means "dpkg lock released". retry stays generic, with no apt knowledge | Make retry poll the dpkg lock; rely on apt-lock's 150 s wait only | Keeps the lock logic in apt-lock.js (still the backstop). retry only guarantees that its own processes are gone | no | n/a |
| D-3 | An attempt is "stuck" when the group still exists at the end of a reap wait. A stuck attempt ends the helper (A-2) | Keep retrying | AC#1 | no | n/a |
| D-4 | `runWithRetry(options, sudoKill = sudoKillGroup)`. The second parameter exists for tests. The CLI path always uses the default | Env var to disable sudo; module-level mutable hook | Smallest seam. No new CLI or env surface | no | n/a |
| D-5 | AC#3 uses a new test helper `tests/support/process-group.ts` (spawn `detached`, kill the group at the timeout and after close) | Inline in the speed-limits test | It can be unit-tested with the existing `hang-tree` fixture without running the slow perf suites | no | n/a |

## 5. Design

### Files to create / modify
- `tools/ci/retry.js` — `killGroup` outcome, `groupExists`, `sudoKillGroup`, the reap wait, stuck handling,
  header comment.
- `tests/ci/retry.sudo.test.ts` — new unit tests (SPEC-01, SPEC-04, SPEC-05), new Linux-CI acceptance test
  (SPEC-02), `finally` cleanup (SPEC-03).
- `tests/support/process-group.ts` — new helper `runProcessGroup`.
- `tests/support/process-group.test.ts` — unit tests of the helper (SPEC-06, SPEC-07).
- `tests/ci/speed-limits.acceptance.test.ts` — use `runProcessGroup` (SPEC-08).
- `README.md` — CI paragraph: one sentence on how timed-out attempts are stopped.

### Components, interfaces and data
`tools/ci/retry.js` (all new exports are JSDoc-typed, Node built-ins only):
- `export function killGroup(pid, signal): 'sent' | 'gone' | 'denied'`. `pid === undefined` → `'gone'`. Otherwise
  `process.kill(-pid, signal)`: success → `'sent'`; ESRCH → `'gone'`; EPERM → logs the existing line
  `retry: could not send <signal> to process group <pid> (EPERM)` and returns `'denied'`; any other error is
  rethrown. The existing `killGroup` tests stay valid.
- `export function groupExists(pid): boolean`. Calls `process.kill(-pid, 0)`. Success or EPERM → `true`; ESRCH →
  `false`; other errors are rethrown.
- `export function sudoKillGroup(pid, signal): boolean`. Runs
  `spawnSync('sudo', ['-n', 'kill', '-s', signal.replace(/^SIG/, ''), '--', `-${pid}`], { stdio: 'ignore', timeout: 10_000 })`
  and returns `status === 0`. It logs `retry: sent <signal> to process group <pid> with sudo` on success, else
  `retry: sudo could not send <signal> to process group <pid>`. It never throws.
- Internal `stopGroup(pid, signal, sudoKill)`: `if (killGroup(pid, signal) === 'denied') sudoKill(pid, signal)`.
- Internal `reap(pid, sudoKill): Promise<boolean>`. Loop until `REAP_SECONDS` have passed: if
  `!groupExists(pid)`, return `true`; else `stopGroup(pid, 'SIGKILL', sudoKill)`, then wait `REAP_POLL_MS`. After
  the loop, return `!groupExists(pid)`.
- `runAttempt(options, onSpawn, sudoKill)` resolves to `{ failure: string | null, stuck: boolean }`. It settles
  only once (guard flag).
  - At the timeout: `timedOut = true; stopGroup(pid, 'SIGTERM', sudoKill)`.
  - At the kill grace: `stopGroup(pid, 'SIGKILL', sudoKill)`, then `await reap(...)`. If `reap` returned `false`
    and the child has not exited, settle `{ failure: 'timed out after <t> s', stuck: true }` and call
    `child.unref()`, so the helper process can exit.
  - On `exit`/`error`: clear both timers, `await reap(...)`, then settle with the existing failure text. Set
    `stuck: !reaped && failure !== null`; a successful attempt ignores a failed reap.
- `runWithRetry(options, sudoKill = sudoKillGroup)`. If `stuck`, log `::warning::<prefix> <failure>`, then
  `::error::<label>: attempt <n> of <m> could not be stopped; process group <pid> is still running`, and return 1
  at once (no delay, no further attempts). Otherwise behaviour and lines are unchanged.

`tests/support/process-group.ts`:
- `export function runProcessGroup(command: string, args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs: number }): Promise<{ exitCode: number; output: string; timedOut: boolean }>`
- It spawns with `detached: true, stdio: ['ignore', 'pipe', 'pipe']` and collects stdout then stderr into one
  string per stream. `output = stdout + stderr`.
- At `timeoutMs`: `timedOut = true; killGroup(pid, 'SIGKILL')`.
- On `close`: clear the timer, then `killGroup(pid, 'SIGKILL')` (this reaps leftovers such as Vitest workers;
  ESRCH is silent). Resolve with `exitCode = code ?? -1`.
- On `error`: resolve `{ exitCode: -1, output: error.message, timedOut }`.

### Rules and algorithms
- Worked example (run #68 under the new code): t=240 s → SIGTERM to the attempt's group (pgid P). The node processes die. sudo
  passes the signal to `sh`, `sh` dies, sudo exits, and the attempt's child exits. `finish` → `reap`:
  `groupExists` is true (apt-get) → `killGroup(SIGKILL)` → EPERM → `sudo -n kill -s KILL -- -P` → apt-get
  dies. On the next poll `groupExists` is false. The attempt logs `timed out after 240 s; retrying in 10 s`.
  Attempt 2's apt-lock finds the lock free.
- Worked example (AC#1): `--timeout-seconds 0.3 --kill-after-seconds 0.3`, every kill EPERM, sudo fails.
  t=0.3 s SIGTERM denied, sudo fails. t=0.6 s SIGKILL denied, sudo fails, then reap. t≤2.6 s reap gives up →
  `::warning::L: attempt 1 of 3 timed out after 0.3 s`, then
  `::error::L: attempt 1 of 3 could not be stopped; process group <pid> is still running`, exit code 1. There is
  no attempt 2.

### Error handling and configuration
- No new flags. Constants: `REAP_SECONDS = 2`, `REAP_POLL_MS = 250`, sudo `spawnSync` timeout 10 000 ms.
- sudo failures are logged and never thrown. Unknown `process.kill` errors are still rethrown (existing
  behaviour).

## 6. Behaviour specification

### SPEC-01: An attempt that cannot be stopped ends at once with an error naming the step
- Verifies: AC#1
- Behaviour: Given `runWithRetry` with label `Install Playwright system dependencies`, `attempts: 3`,
  `timeoutSeconds: 0.3`, `killAfterSeconds: 0.3`, `delaySeconds: 0`, a real hanging child
  (`process.execPath -e "setInterval(() => {}, 1000)"`), `process.kill` mocked to throw EPERM for every call, and a
  fake sudo fallback that returns `false`, When it runs, Then it resolves to `1` in under 5 000 ms. The written
  output contains `::error::Install Playwright system dependencies: attempt 1 of 3 could not be stopped; process group <pid> is still running`
  and no `attempt 2 of 3`. The fake sudo was called with `(<pid>, 'SIGTERM')` and `(<pid>, 'SIGKILL')`. The test
  restores the mocks and SIGKILLs the real child's group in `finally`.
- Verification: acceptance `tests/ci/retry.sudo.test.ts::stopping an attempt > ends at once with an error when the attempt cannot be killed`

### SPEC-02: A root process left behind by its sudo parent is stopped before the next attempt (real sudo)
- Verifies: AC#4
- Behaviour: Given Linux CI, a temp lock file `<dir>/lock` and a unique marker, When retry.js runs
  `--attempts 2 --timeout-seconds 2 --delay-seconds 0 -- sudo -n sh -c 'flock -n "$1" sleep "$2"; true' sh <dir>/lock <marker>`,
  Then both attempts log `timed out after 2 s` (exactly 2 matches of `/::warning::.*timed out after 2 s/`). The
  output has no `failed with exit code`, so attempt 2 got the lock. The exit code is 1, the last line is
  `::error::Install Playwright system dependencies failed after 2 attempts`, it finishes in under 20 000 ms, and
  within 2 000 ms after exit `pgrep -f <marker>` finds nothing. (Before this change, the root `flock`/`sleep`
  survive sudo's SIGTERM relay to `sh`, and attempt 2's `flock -n` fails with exit code 1.)
- Verification: acceptance `tests/ci/retry.sudo.test.ts::retry helper around a hanging sudo command (Linux CI only) > stops a root process left behind by its sudo parent before the next attempt`

### SPEC-03: The sudo tests always kill what they started
- Verifies: AC#2
- Behaviour: Given either Linux-CI-only test in `tests/ci/retry.sudo.test.ts`, When the test body throws or an
  assertion fails at any point after the helper is spawned, Then a `finally` block runs that (1) SIGKILLs the
  helper child if `child.exitCode === null && child.signalCode === null`, (2) runs
  `spawnSync('sudo', ['-n', 'pkill', '-KILL', '-f', <bracket pattern of the marker>])` (A-6), and (3) removes the
  temp dir if one was made. The assertions stay in the `try` block.
- Verification: manual Judge reads `tests/ci/retry.sudo.test.ts`. Both Linux-CI-only tests wrap everything after `spawn` in `try { … } finally { … }` with steps (1)–(3). `npm test` passes.

### SPEC-04: A denied kill is retried with sudo and the attempt ends without waiting out the grace
- Verifies: AC#4
- Behaviour: Given `runWithRetry` with `attempts: 1`, `timeoutSeconds: 0.3`, `killAfterSeconds: 5`, a real hanging
  child, `process.kill` mocked to throw EPERM until the fake sudo has been called (then it calls the real
  `process.kill`), and a fake sudo that sends the signal with the real `process.kill(-pid, signal)` and returns
  `true`, When it runs, Then the fake sudo's first call is `(<pid>, 'SIGTERM')`. It resolves to `1` in under
  3 000 ms (well before the 5 s grace). The last line written is
  `::error::Install Playwright system dependencies failed after 1 attempts`, and no `could not be stopped` line
  appears.
- Verification: unit `tests/ci/retry.sudo.test.ts::stopping an attempt > sends the signal with sudo when the group kill is denied`

### SPEC-05: killGroup reports its outcome; groupExists probes the group
- Verifies: AC#1, AC#4
- Behaviour: Given `process.kill` mocked, When `killGroup(4242, 'SIGTERM')` succeeds / throws ESRCH / throws
  EPERM, Then it returns `'sent'` / `'gone'` / `'denied'`, and `killGroup(undefined, 'SIGKILL')` returns `'gone'`.
  When `groupExists(4242)` sees success / EPERM / ESRCH, Then it returns `true` / `true` / `false`, and it calls
  `process.kill(-4242, 0)`. EINVAL is rethrown by both.
- Verification: unit `tests/ci/retry.sudo.test.ts::killGroup > returns sent, gone or denied` and `tests/ci/retry.sudo.test.ts::groupExists > treats EPERM as existing and ESRCH as gone`

### SPEC-06: The test helper kills the whole process group at its timeout
- Verifies: AC#3
- Behaviour: Given `runProcessGroup(process.execPath, [<repo>/tests/ci/fixtures/flaky-command.js, <state>, '1', 'hang-tree'], { timeoutMs: 500 })`,
  When the timeout expires, Then it resolves with `timedOut: true` and `exitCode: -1` in under 5 000 ms. The
  grandchild pid in `<state>.child` is gone within 2 000 ms.
- Verification: unit `tests/support/process-group.test.ts::runProcessGroup > kills the command and its children at the timeout`

### SPEC-07: The test helper returns exit code and output of a command that finishes
- Verifies: AC#3
- Behaviour: Given `runProcessGroup(process.execPath, ['-e', "process.stdout.write('out'); process.stderr.write('err'); process.exit(3)"], { timeoutMs: 10_000 })`,
  When it finishes, Then it resolves `{ exitCode: 3, output: 'outerr', timedOut: false }`.
- Verification: unit `tests/support/process-group.test.ts::runProcessGroup > returns the exit code and output`

### SPEC-08: The speed-limits nested Vitest runs as a killable group
- Verifies: AC#3
- Behaviour: Given `tests/ci/speed-limits.acceptance.test.ts`, When it runs the perf suites, Then it calls
  `runProcessGroup('npx', ['vitest', 'run', ...PERF_FILES], { cwd: REPO_ROOT, env, timeoutMs: NESTED_TIMEOUT_MS })`
  with `NESTED_TIMEOUT_MS = 100_000` < the 120 000 ms test timeout. It no longer uses `spawnSync`. Both existing
  tests still pass with their existing assertions.
- Verification: acceptance `tests/ci/speed-limits.acceptance.test.ts::speed limits in CI > CI=true reports but does not enforce the perf limits`

## 7. Edge cases
- Direct child cannot be killed, sudo unavailable → SPEC-01.
- Root member left after its runner-owned parents died (run #68 / 44434902016) → SPEC-02, SPEC-04.
- Plain kill succeeds on some members while root members survive (the timing case in run #68) → the reap loop
  re-sends SIGKILL every 250 ms. As soon as only root members remain, the kill returns EPERM and sudo is used
  (SPEC-02 exercises it with real sudo).
- Successful attempt with a leftover that cannot be killed → reap result ignored, exit 0 (§5). No new test, since
  the success path's lines are unchanged and are covered by the existing `tests/ci/retry.test.ts` cases.
- No sudo / password needed (dev macOS) → `sudoKillGroup` returns false and logs. It only runs after EPERM, which
  never happens with runner-owned stubs, so the existing `tests/ci/retry.test.ts` behaviour is unchanged.
- Killing apt/dpkg part-way can leave dpkg "interrupted" → not handled here (Not doing; scope concern).
- Nested Vitest that never closes its pipes → the group SIGKILL at `timeoutMs` closes them. SPEC-06 covers it
  with a grandchild.

## 8. Security considerations
- New privileged action: `sudo -n kill -s <SIG> -- -<pgid>`. `<pgid>` is the pid of a child that retry itself
  spawned (a number from `child.pid`, passed as an argv element with no shell), so there is no injection. It is
  used only after EPERM on that same group, and while the group still exists (checked each poll), so pgid reuse
  is negligible within the ≤2 s window.
- `-n` never prompts and never reads a password. No secrets are logged; log lines contain only signal names and
  pids.
- No new dependencies. No untrusted input.

## 9. Non-functional
- A stuck attempt ends at most `killAfterSeconds + 2 s` after its timeout, instead of at the 13-minute step
  timeout (SPEC-01 asserts < 5 s with 0.3 s/0.3 s settings).
- Normal attempts gain no delay: when the group is already gone, `reap` returns on its first check.
- The reap wait adds at most 2 s per attempt.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `node tools/ci/retry.js --label demo --attempts 2 --timeout-seconds 1 --kill-after-seconds 1 --delay-seconds 0 -- node -e "setInterval(() => {}, 1000)"` (two `timed out after 1 s` warnings, then `::error::demo failed after 2 attempts`, exit 1, in about 2–3 s)
- New tests:
  - `tests/ci/retry.sudo.test.ts` → SPEC-01, SPEC-02 (Linux CI only), SPEC-03, SPEC-04, SPEC-05
  - `tests/support/process-group.test.ts` → SPEC-06, SPEC-07
  - `tests/ci/speed-limits.acceptance.test.ts` (modified) → SPEC-08
- End-to-end for the Judge:
  1. Locally run the Run command above, and `npx vitest run tests/ci tests/support`.
  2. SPEC-02 runs only on Linux CI. Check it in the task branch's CI run: the test is listed as passed (not
     skipped) in the "Test" step, and "Install Playwright system dependencies" passes.

## 11. Open questions
- (none)

## 12. Clarifications log
See `doit/TASK-1.23/qa.md`.
