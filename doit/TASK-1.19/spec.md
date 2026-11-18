# Spec: TASK-1.19 — Retry the stalled Playwright system-dependency install in CI

Status: READY (approved 2026-11-18)
Task: TASK-1.19 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: n/a (follow-up of TASK-1.7 judge finding J-2-01 and TASK-1.3) · Dream: limit-holdem-trainer

## 1. Summary
The two Playwright install steps in `.github/workflows/ci.yml` (`Install Playwright browsers` on a browser-cache
miss, `Install Playwright system dependencies` on a hit) both run `apt-get`. The Ubuntu mirror has stalled them for
19+ minutes until the 20-minute job timeout. This task wraps both commands in a small dependency-free Node retry
helper, `tools/ci/retry.js`. The helper gives each attempt a 4-minute timeout, kills the whole process tree of a
hung attempt, and retries up to 2 more times. The step also gets a GitHub step-level `timeout-minutes: 13`
backstop. The retry logic is proven locally by Vitest tests against a stub command that fails or hangs on
purpose. The wiring is proven by the static workflow tests. The fast path (AC#4) is proven by the normal green CI
run of this branch, so no proof branches are needed.

## 2. Scope
- In scope:
  - `tools/ci/retry.js`: a generic "run a command with per-attempt timeout and N attempts" CLI (Node built-ins only).
  - `.github/workflows/ci.yml`: wrap the two Playwright install commands in the helper and add a step-level
    `timeout-minutes` to both steps.
  - `tests/ci/retry.test.ts` + `tests/ci/fixtures/flaky-command.js`: behaviour tests of the helper with a stub
    command.
  - `tests/ci/workflow.test.ts`: update the Playwright install assertion and add the timeout/retry assertions
    (AC#5).
  - `README.md`: one sentence in "Continuous integration" about the retry.
- Not doing:
  - Retrying any other step (`npm ci`, audits, checks, E2E). A failing check must still fail at once.
  - apt tuning (`Acquire::Retries`, `Acquire::http::Timeout`, switching mirrors), the Playwright Docker image, or
    caching apt packages.
  - Changing the job `timeout-minutes: 20`, the browser cache key, the runner, or any action pin.
  - Third-party retry actions (e.g. `nick-fields/retry`). They would be a new dependency (see D-1).
  - Recovering an interrupted `dpkg` (`dpkg --configure -a`) between attempts (see §7).
  - Proof branches or extra pushes. The only push is this task branch's normal push.
- Scope budget: files=6, lines=360   (retry.js ~120, flaky-command.js ~45, retry.test.ts ~140, workflow.test.ts +35/−3, ci.yml +4/−2, README +3)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Per-attempt timeout **240 s (4 min)**, **3 attempts** (1 + 2 retries), **10 s** delay between attempts, **10 s** SIGTERM→SIGKILL grace | yes | Green runs took 32–44 s (system deps) and 45 s (browsers + deps, cache miss, run 44220276704). 240 s is more than 5× the slowest. Worst case = 3×240 + 2×10 + 3×10 = 770 s ≈ 12.8 min. With ≤ 2.2 min of steps before it (job start → install step in run 44241417083: 05:02:25 → 05:04:35), the job still ends by ~15.5 min, under the 20-min job timeout | 300 s per attempt (AC example; worst case 15.5 min + 2.2 + E2E is close to 20); 2 attempts |
| A-2 | Step-level `timeout-minutes: 13` on both install steps, as a backstop over the helper's own limits | yes | ceil(770 s / 60) = 13. Covers a helper bug. AC#1 asks for a step-level timeout well below the 20-min job timeout | No step timeout (the helper's per-attempt timeout alone) |
| A-3 | Both install steps are wrapped, not only `install-deps` | yes | AC#1 says "system-dependency (and browser) install step". `install --with-deps` also runs apt | Wrap only the cache-hit step |
| A-4 | Log lines are plain stdout lines prefixed `retry:`, plus GitHub workflow commands `::warning::` (retry) and `::error::` (final failure), so they show as annotations on the run summary page | yes | AC#3 asks for "a log line naming the install step". Annotations name it on the summary without opening the log | Plain log lines only |
| A-5 | A command that exits non-zero for any reason (including "command not found") is retried like a timeout | yes | The helper cannot tell a transient apt error (exit 100) from a permanent one. Retrying a permanent error costs at most ~20 s | Fail fast on spawn errors |
| A-6 | AC#4 is measured as **helper overhead** in the step (step duration from the GitHub API minus the command time the helper logs) ≤ 10 s, not as a total-job-time comparison | yes | Baseline green job totals vary from 1m51s to 3m12s (runs 44227089180, 44228041678, 44238485701, 44233294018, 44241417083), mostly from the Test step. A ±10 s total-time comparison cannot be measured against that noise. Overhead isolates what this task adds | Compare total job time with the baseline mean (not a meaningful signal) |

## 3. Current system
- `.github/workflows/ci.yml:18` sets job `timeout-minutes: 20`. `ci.yml:44-55` defines the browser cache and the two
  install steps. `ci.yml:50-52` is `Install Playwright browsers` (if cache-hit != 'true'),
  `run: npx playwright install --with-deps chromium webkit`. `ci.yml:53-55` is `Install Playwright system
  dependencies` (if cache-hit == 'true'), `run: npx playwright install-deps chromium webkit`. Neither has a step
  timeout. On the `ubuntu-24.04` runner the user is `runner`, so Playwright runs apt through `sudo` in a child
  process. Killing only `npx` would leave `sudo`/`apt-get` running, so the helper must kill the whole process group.
- `tests/ci/workflow.test.ts` checks the YAML text with no parser (TASK-1.7 A-10):
  - `:34-46` collects every `run: npm …` line in order. New `run: node tools/ci/retry.js …` lines do not match `npm `, so this test does not change.
  - `:48-61` forbids `continue-on-error`, `|| true` and `set +e`, and pins the exact list of `if:` lines. The helper adds no `if:` lines and none of the forbidden strings.
  - `:63-66` asserts the two bare `run: npx playwright …` lines. **These assertions must change** because the commands are now wrapped.
  - `:86-93` asserts `timeout-minutes: 20` with `toContain`. That still holds after `timeout-minutes: 13` is added.
- `tests/support/sandbox.ts:15` exports `REPO_ROOT`. Reuse it to find the script and the fixture.
- Node tool scripts are ESM `.js`, type-checked through `checkJs` (`tsconfig.json:17-18,21` includes `tools` and
  `tests`). They are linted by ESLint with no Node globals configured (`eslint.config.js`), so they import `process`
  explicitly. `tools/equity/generate-reference.js:6` has `import process from 'node:process'`, and `:186` has the
  run-as-main guard. `setTimeout`/`clearTimeout` likewise come from `node:timers`.
- Vitest picks up `tests/**/*.test.{ts,tsx}` (`vite.config.ts:7`), `testTimeout` 30 s (`vite.config.ts:10`). Coverage
  only measures `src/**` (`vite.config.ts:13`), so the new files don't affect thresholds. Prettier: `singleQuote`,
  `printWidth: 100` (`.prettierrc.json`), and it also formats `ci.yml`.
- `npm test` runs on the ubuntu-24.04 runner in CI (`ci.yml:39-40`). So the helper tests also run on Linux, where
  the real apt/sudo case happens, as well as on the local macOS machine. macOS has no `timeout`/`gtimeout`
  (checked: `which timeout gtimeout` → not found). Its `bash` is 3.2.
- Baseline (green push runs, cache hit): `Install Playwright system dependencies` took 32 s (44233294018), 44 s
  (44241417083), 35 s (44238485701), 34 s (44228041678), 34 s (44227089180). Cache-miss `Install Playwright browsers`
  took 45 s (44220276704). Stalls: 44220403675 attempt 1, step ran 02:07:43 → 02:26:41 (job timeout); 44236421395
  attempt 1, step ran 04:20:08 → 04:28:04 (cancelled by hand).
- `.claude/settings.json` denies `git push`. The user pushes the task branch as for every task. The workflow is
  already on `main`, so a push of `doit/TASK-1.19` runs the branch's own `ci.yml`.
- Existing code to reuse:
  - `tests/support/sandbox.ts` → `REPO_ROOT` for paths in the new tests.
  - `tools/equity/generate-reference.js:186` → the run-as-main guard pattern (`import.meta.url === pathToFileURL(process.argv[1]).href`).
  - `node:util` `parseArgs` (built-in) → flag parsing with the `--` terminator. No hand-written argv parser.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Write the retry as a dependency-free **Node** script `tools/ci/retry.js`, run with `node` in both install steps | (a) Inline bash `for` loop with coreutils `timeout` in `run:`; (b) a bash script `tools/ci/retry.sh` using `timeout`; (c) third-party action `nick-fields/retry` (new dependency, SHA pin, needs approval) | Node is already on the runner and on every dev machine. The dev machine is macOS and has no `timeout`, so (a)/(b) could not be tested locally, and an inline loop can't be tested at all. A Node script runs the same tests locally and in CI on Linux, is linted and type-checked like `tools/*.js`, and can kill the process group (`detached` + `process.kill(-pid)`), as coreutils `timeout` does. No new dependency | no (reversible, no new dependency, no user-visible product change) | n/a |
| D-2 | Proof: AC#2/AC#3 by Vitest tests of the helper with a stub command that fails or hangs N times (run locally and again on Linux in CI by `npm test`). AC#1/AC#5 by static workflow tests that the steps call the helper with the agreed limits. AC#4 by the normal green CI run of `doit/TASK-1.19` | Proof branches that force a real apt failure on GitHub (extra pushes by the user, ~3–15 billed minutes each) | The retry logic does not depend on apt. The stub exercises exactly the paths a stall takes (hang → kill tree → retry). The only real-run question (overhead on the fast path) is answered by the push that happens anyway | no | n/a |

## 5. Design

### Files to create / modify
- `tools/ci/retry.js` — retry CLI (create)
- `tests/ci/fixtures/flaky-command.js` — stub command that fails or hangs for its first N calls (create)
- `tests/ci/retry.test.ts` — behaviour tests of the helper (create)
- `.github/workflows/ci.yml` — wrap the two Playwright install steps; add step timeouts (modify)
- `tests/ci/workflow.test.ts` — update the Playwright install test; add the timeout/retry test (modify)
- `README.md` — one sentence on the install retry in "Continuous integration" (modify)

### Components, interfaces and data

**`tools/ci/retry.js`** (ESM, Node built-ins only: `node:child_process`, `node:process`, `node:timers`,
`node:util`, `node:url`)

CLI:
```
node tools/ci/retry.js --label <text> --attempts <int>=1..> --timeout-seconds <number >0>
                       [--delay-seconds <number >=0, default 10>] [--kill-after-seconds <number >0, default 10>]
                       -- <command> [args...]
```
- Parse with `parseArgs({ options, allowPositionals: true, strict: true })`. Everything after `--` is the command
  (`positionals`). `--label`, `--attempts`, `--timeout-seconds` are required. Numbers are parsed with `Number()`
  and must be finite. `--attempts` must be an integer ≥ 1.
- Export `export async function runWithRetry(options): Promise<number>` (returns the process exit code) for
  readability. The CLI entry (behind the run-as-main guard) calls it and sets `process.exitCode`. Tests exercise
  the CLI as a subprocess (the behaviour the workflow sees).
- Each attempt: `spawn(command, args, { stdio: 'inherit', detached: true })`. `detached` makes the child the leader
  of a new process group, so `process.kill(-child.pid, signal)` reaches `npx`, `sudo`, `apt-get` and any other
  descendants that did not change group.
- Timeout per attempt: after `timeout-seconds`, send `SIGTERM` to the group. If the child has not exited
  `kill-after-seconds` later, send `SIGKILL` to the group. Ignore `ESRCH` from `process.kill` (group already gone).
- After each attempt's child exits, also send `SIGKILL` to its group (ignoring `ESRCH`), so no orphaned descendant
  of a failed or timed-out attempt (e.g. a grandchild still holding the apt lock) survives into the next attempt.
- Outcome of an attempt: success iff exit code 0. Failure if non-zero exit code, killed by a signal, timed out, or
  spawn `error` (e.g. ENOENT).
- Between attempts, wait `delay-seconds`. There is no delay after a success or after the last attempt.
- If the helper itself receives `SIGINT` or `SIGTERM` (runner cancel, step timeout), it sends `SIGKILL` to the
  current child group and exits with code 130 (SIGINT) / 143 (SIGTERM).

### Rules and algorithms
Log lines go to stdout, one per event, in this exact format (`<label>` is the `--label` value,
`<cmd>` is the command and args joined by single spaces, `<s>` is seconds with one decimal):
- Before attempt k of n: `retry: <label>: attempt <k> of <n>: <cmd>`
- Attempt succeeded: `retry: <label>: attempt <k> of <n> succeeded in <s> s`
- Attempt failed, more attempts left: `::warning::<label>: attempt <k> of <n> <reason>; retrying in <d> s`
- Attempt failed, none left: `::warning::<label>: attempt <k> of <n> <reason>`, then
  `::error::<label> failed after <n> attempts` and exit code **1**.
- `<reason>` is one of `timed out after <timeout-seconds> s`, `failed with exit code <c>`, `was killed by <SIGNAL>`,
  `could not start: <error.message>`. `<d>` and `<timeout-seconds>` are printed as given (e.g. `240`, `0.5`).

Worked example (stub hangs twice, then succeeds; `--attempts 3 --timeout-seconds 240 --delay-seconds 10`):
```
retry: Install Playwright system dependencies: attempt 1 of 3: npx playwright install-deps chromium webkit
::warning::Install Playwright system dependencies: attempt 1 of 3 timed out after 240 s; retrying in 10 s
retry: Install Playwright system dependencies: attempt 2 of 3: npx playwright install-deps chromium webkit
::warning::Install Playwright system dependencies: attempt 2 of 3 timed out after 240 s; retrying in 10 s
retry: Install Playwright system dependencies: attempt 3 of 3: npx playwright install-deps chromium webkit
retry: Install Playwright system dependencies: attempt 3 of 3 succeeded in 34.1 s
```
→ exit 0.

**Workflow** (`ci.yml`, the two install steps become exactly; Prettier may not reflow these lines):
```yaml
      - name: Install Playwright browsers
        if: steps.playwright-cache.outputs.cache-hit != 'true'
        timeout-minutes: 13
        run: node tools/ci/retry.js --label "Install Playwright browsers" --attempts 3 --timeout-seconds 240 --delay-seconds 10 -- npx playwright install --with-deps chromium webkit
      - name: Install Playwright system dependencies
        if: steps.playwright-cache.outputs.cache-hit == 'true'
        timeout-minutes: 13
        run: node tools/ci/retry.js --label "Install Playwright system dependencies" --attempts 3 --timeout-seconds 240 --delay-seconds 10 -- npx playwright install-deps chromium webkit
```
Invariant checked by the static test: `attempts × timeout-seconds + (attempts − 1) × delay-seconds + attempts × 10`
(kill grace) ≤ `step timeout-minutes × 60` < `job timeout-minutes × 60`. With the values above: 720 + 20 + 30 = 770 ≤
780 < 1200. Also `attempts ≥ 3` (AC#2: at least 2 retries) and `timeout-seconds ≤ 300` (AC#1: e.g. 5 min per attempt).

**`tests/ci/fixtures/flaky-command.js`** (stub): `node flaky-command.js <stateFile> <failures> <mode>` where mode is
`fail` | `hang` | `hang-tree` | `hang-ignore-term`.
- Reads call count c from `<stateFile>` (0 if missing), writes c+1.
- If c < failures: `fail` → print `flaky: failing call <c+1>` and exit 3. `hang` → stay alive (interval timer).
  `hang-tree` → spawn a grandchild `node -e "setInterval(() => {}, 1000)"` (same process group), write its pid to
  `<stateFile>.child`, then stay alive. `hang-ignore-term` → install a no-op `SIGTERM` handler, then stay alive.
- Else print `flaky: ok on call <c+1>` and exit 0.

### Error handling and configuration
- Usage error (missing/invalid flag, unknown flag, empty command): print `retry: usage: <message>` to stderr and
  exit **2** without running anything.
- All-fail: exit **1** (not the child's code), so the step and the job fail. The step name and the `::error::`
  annotation name the step (AC#3).
- No environment variables or config files. All limits come from flags in `ci.yml`.

## 6. Behaviour specification

### SPEC-01: Both Playwright install steps have a per-attempt timeout and a step timeout well below the job timeout
- Verifies: AC#1, AC#5
- Behaviour: Given `.github/workflows/ci.yml`, When it is read, Then the `Install Playwright browsers` and `Install Playwright system dependencies` steps each have `timeout-minutes: 13` and `run: node tools/ci/retry.js --label "<the step's own name>" --attempts 3 --timeout-seconds 240 --delay-seconds 10 -- <the original npx playwright command>`, exactly as in §5. The parsed numbers satisfy `timeout-seconds ≤ 300`, the §5 invariant (≤ step timeout × 60) and step timeout < the job's `timeout-minutes: 20`
- Verification: acceptance `tests/ci/workflow.test.ts::CI workflow > gives each Playwright install attempt a timeout well below the job timeout and retries it`

### SPEC-02: Chromium and WebKit are still installed, through the retry helper
- Verifies: AC#5
- Behaviour: Given the workflow, When it is read, Then it contains `-- npx playwright install --with-deps chromium webkit` and `-- npx playwright install-deps chromium webkit`, each on a `run: node tools/ci/retry.js` line, and no bare `run: npx playwright` line remains
- Verification: acceptance `tests/ci/workflow.test.ts::CI workflow > installs Chromium and WebKit for the Playwright and axe tests`

### SPEC-03: A command that succeeds first time runs once, with no delay
- Verifies: AC#4
- Behaviour: Given `--attempts 3 --timeout-seconds 5 --delay-seconds 10` and the stub with failures=0 mode `fail`, When the helper runs, Then it exits 0, the state file reads `1`, stdout contains `attempt 1 of 3: node` and `attempt 1 of 3 succeeded in`, contains no `attempt 2`, and the wall time is < 3 s (no 10 s delay)
- Verification: acceptance `tests/ci/retry.test.ts::retry helper > runs a succeeding command once without delay`

### SPEC-04: A failing command is retried and the run succeeds when a later attempt succeeds
- Verifies: AC#2
- Behaviour: Given `--attempts 3 --timeout-seconds 5 --delay-seconds 0` and the stub with failures=2 mode `fail`, When the helper runs, Then it exits 0, the state file reads `3`, stdout contains `::warning::<label>: attempt 1 of 3 failed with exit code 3; retrying in 0 s`, the same for attempt 2, and `attempt 3 of 3 succeeded in`
- Verification: acceptance `tests/ci/retry.test.ts::retry helper > retries a failing command until it succeeds`

### SPEC-05: A hanging attempt is killed at its timeout and retried
- Verifies: AC#1, AC#2
- Behaviour: Given `--attempts 3 --timeout-seconds 0.5 --delay-seconds 0` and the stub with failures=2 mode `hang`, When the helper runs, Then it exits 0, the state file reads `3`, stdout contains `attempt 1 of 3 timed out after 0.5 s; retrying in 0 s` and `attempt 2 of 3 timed out after 0.5 s; retrying in 0 s`, and the wall time is < 10 s
- Verification: acceptance `tests/ci/retry.test.ts::retry helper > kills a hanging attempt at its timeout and retries`

### SPEC-06: When all attempts fail, the helper fails with an error line naming the step
- Verifies: AC#3
- Behaviour: Given `--label "Install Playwright system dependencies" --attempts 3 --timeout-seconds 0.5 --delay-seconds 0` and the stub with failures=99 mode `fail` (and separately mode `hang`), When the helper runs, Then it exits 1, the state file reads `3` (exactly 3 attempts, no more), and the last stdout line is `::error::Install Playwright system dependencies failed after 3 attempts`
- Verification: acceptance `tests/ci/retry.test.ts::retry helper > fails with an error naming the step after the last attempt fails`

### SPEC-07: A timed-out attempt's whole process tree is killed
- Verifies: AC#1
- Behaviour: Given `--attempts 1 --timeout-seconds 0.5` and the stub with failures=1 mode `hang-tree`, When the helper exits, Then within 2 s the grandchild pid from `<stateFile>.child` no longer exists (`process.kill(pid, 0)` throws `ESRCH`)
- Verification: unit `tests/ci/retry.test.ts::retry helper > kills the grandchildren of a timed-out attempt`

### SPEC-08: An attempt that ignores SIGTERM is force-killed after the grace period
- Verifies: AC#1
- Behaviour: Given `--attempts 1 --timeout-seconds 0.5 --kill-after-seconds 0.5` and the stub with failures=1 mode `hang-ignore-term`, When the helper runs, Then it exits 1 within 5 s with `attempt 1 of 1 timed out after 0.5 s`
- Verification: unit `tests/ci/retry.test.ts::retry helper > force-kills an attempt that ignores SIGTERM`

### SPEC-09: Cancelling the helper also kills the running attempt
- Verifies: AC#1
- Behaviour: Given the helper running the stub in mode `hang-tree` with `--timeout-seconds 30`, When the test sends `SIGTERM` to the helper after `<stateFile>.child` appears, Then the helper exits with code 143 and within 2 s the grandchild pid no longer exists
- Verification: unit `tests/ci/retry.test.ts::retry helper > kills the running attempt when it is cancelled`

### SPEC-10: Invalid arguments are rejected without running anything
- Verifies: AC#3
- Behaviour: Given each of: no `--`/empty command; `--attempts 0`; `--attempts 1.5`; `--timeout-seconds 0`; `--timeout-seconds abc`; missing `--label`; an unknown flag `--retries 3`, When the helper runs with the stub as command, Then it exits 2, stderr starts with `retry: usage:`, and the stub's state file does not exist
- Verification: unit `tests/ci/retry.test.ts::retry helper > rejects invalid arguments without running the command`

### SPEC-11: The real green CI run adds at most 10 s to the install step
- Verifies: AC#4
- Behaviour: Given the push run of the final commit of `doit/TASK-1.19` concluded `success` with the install succeeding on attempt 1, When its jobs and logs are read, Then exactly one of the two install steps ran with conclusion `success`, its log has `attempt 1 of 3 succeeded in <s> s` and no `attempt 2 of 3`, and (step `completed_at` − `started_at` in seconds) − `<s>` ≤ 10. For reference, the step duration is compared with the baseline 32–44 s (§3) and reported. If attempt 1 stalled on that run, re-run it (`gh run rerun`) and measure again
- Verification: command `R=$(gh repo view --json nameWithOwner -q .nameWithOwner); id=$(gh run list -R "$R" --branch doit/TASK-1.19 --event push --workflow CI --limit 1 --json databaseId,conclusion -q '.[0].databaseId'); gh run view "$id" -R "$R" --json conclusion -q .conclusion` → `success`; `gh api "repos/$R/actions/runs/$id/jobs" -q '.jobs[0].steps[] | select(.name | startswith("Install Playwright")) | select(.conclusion == "success") | "\(.name) \((.completed_at | fromdate) - (.started_at | fromdate))"'` → one line `<step> <D>`; `gh run view "$id" -R "$R" --log | grep -E 'retry: Install Playwright .*attempt'` → only `attempt 1 of 3: …` and `attempt 1 of 3 succeeded in <s> s`; check `D − s ≤ 10`

### SPEC-12: The README mentions the install retry
- Verifies: AC#3
- Behaviour: Given `README.md` "Continuous integration", When read, Then it has one sentence saying the Playwright install steps are retried up to 3 attempts with a 4-minute limit each, and that the run fails with an error naming the step if every attempt fails
- Verification: manual `grep -n "retry\|attempt" README.md` shows the sentence inside the "Continuous integration" section

## 7. Edge cases
- Success first time → SPEC-03. Success on a later attempt → SPEC-04/05. All fail (exit or hang) → SPEC-06.
- Hang with descendants (the real `sudo apt-get` case) → SPEC-07. Child ignores SIGTERM → SPEC-08.
- Runner cancels or the step timeout fires while an attempt runs → SPEC-09.
- Invalid flags / empty command → SPEC-10.
- Command not found (spawn `error`) → counted as a failed attempt (`could not start: …`) and covered by the same
  code path as SPEC-06. No separate test, because the workflow always runs `npx`.
- Attempt killed mid-`dpkg` leaves "dpkg was interrupted": the next attempt fails fast with an apt error and is
  retried. If every attempt hits it, the job fails with the SPEC-06 error (no worse than today). The observed stalls
  were in the download phase, before dpkg runs. Not handled (see Not doing).
- A grandchild that calls `setsid` (new session) escapes the group kill. apt/dpkg under sudo do not do this in the
  install path. N/A.
- Windows/macOS runners: N/A (the workflow uses `ubuntu-24.04`). The helper still runs on macOS for the local tests.

## 8. Security considerations
- Trust boundary: the helper's arguments come only from the checked-in `ci.yml`, not from PR titles, branch names
  or other event data. `spawn` gets an argv array (no shell), so there is no shell injection. The label is printed
  as given inside a `::warning::`/`::error::` command, and it is a constant in `ci.yml`.
- Secrets: none involved. The job token stays `contents: read`.
- New dependencies: none (Node built-ins only). No new action, so the SHA-pin test is unchanged.
- Killing process groups: only the group the helper created (`-child.pid`), never `0` or `-1`.
- Randomness: N/A.

## 9. Non-functional
- Fast-path overhead ≤ 10 s per install step on GitHub (SPEC-11). Expected ≈ 0.1–0.3 s (one extra `node` start).
  Locally, SPEC-03 bounds the whole run at < 3 s.
- Worst case with all attempts hanging: ≤ 770 s in the step (backstop 780 s), so the job fails by ~16 min instead
  of hitting the 20-min timeout.
- Test-suite cost: the new helper tests add ≤ 15 s to `npm test` (timeouts of 0.5 s, delays of 0 s).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `node tools/ci/retry.js --label "Demo install" --attempts 3 --timeout-seconds 1 --delay-seconds 0 -- node tests/ci/fixtures/flaky-command.js "$TMPDIR/flaky-demo" 2 hang` (delete `$TMPDIR/flaky-demo` first). Expect two `timed out` warnings, then `attempt 3 of 3 succeeded`, exit 0. With failures `9` expect `::error::Demo install failed after 3 attempts`, exit 1.
- New tests (path → SPEC ids):
  - `tests/ci/workflow.test.ts` → SPEC-01, SPEC-02 (the existing tests stay green unchanged)
  - `tests/ci/retry.test.ts` → SPEC-03 … SPEC-10 (each test uses its own `mkdtempSync` state dir and removes it afterwards; it spawns `process.execPath` with `REPO_ROOT/tools/ci/retry.js`)
- End-to-end scenario for the Judge: run the Run command above locally (both variants). After the user pushes
  `doit/TASK-1.19`, run the SPEC-11 commands against its green CI run. Optionally open the run summary and check
  that no annotation appears on a fast-path run.

## 11. Open questions
- (none)

## 12. Clarifications log
See `doit/TASK-1.19/qa.md`.
