# Spec: TASK-1.39 — Recover dpkg and harden the remaining test timeouts

Status: READY (approved 2026-11-20)
Task: TASK-1.39 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: n/a (follow-up from TASK-1.23 scope concerns, doc-31) · Dream: limit-holdem-trainer

## 1. Summary
This task does three things:
- **dpkg recovery (AC#1).** Before `tools/ci/apt-lock.js` runs the Playwright install, it checks dpkg's journal. If an earlier attempt that was killed mid-install left dpkg interrupted, it runs `sudo -n dpkg --configure -a` first.
- **Process-group timeout (AC#2).** `runInSandbox` in `tests/support/sandbox.ts` stops a timed-out `npm run` by killing the whole process group through `runProcessGroup`. Today `spawnSync`'s `timeout` kills only the direct child. Callers still get a synchronous result, so no locked caller changes.
- **Slow-mirror install (AC#3).** The downloaded `.deb` archives are cached between runs with `actions/cache` (Q-1: option (a)), so a typical install downloads little or nothing and finishes in its first attempt. The current retry and timeout limits stay unchanged.
- **Known limitation (cold cache).** AC#3's "a typical install finishes within its first attempt" holds for warm-cache runs only. On a cache miss (first run, new Playwright version, new month, or eviction after 7 days unused) the install downloads the full ~126 MB as today. On a slow mirror (~85 KB/s, run #89) that run can still exhaust all 3 attempts and fail. This task does not fix that case. The proof of AC#3 is therefore two branch CI runs: a first run that fills and saves the cache (SPEC-08), then a second run that restores it and installs in attempt 1 (SPEC-09).

## 2. Scope
- In scope:
  - `tools/ci/apt-lock.js`: after the lock wait and before the command, check for an interrupted dpkg and recover it. New `--dpkg-updates <dir>` option, defaulting to `/var/lib/dpkg/updates`.
  - `tests/ci/apt-lock.dpkg.acceptance.test.ts` (new): AC#1 tests that use a fake `sudo` on `PATH`.
  - `tests/support/process-group-cli.ts` (new): a small CLI that runs one command through `runProcessGroup` and prints the result as JSON.
  - `tests/support/sandbox.ts`: `runInSandbox` runs `npm run` through that CLI. It gets an optional `{ timeoutMs }` and `SandboxResult.timedOut`.
  - `tests/support/sandbox-timeout.acceptance.test.ts` (new): AC#2 test with a grandchild that ignores SIGTERM.
  - `.github/workflows/ci.yml`: AC#3 apt archive cache steps (option (a), Q-1).
  - `tests/ci/apt-archives-cache.test.ts` (new): a static check of the AC#3 workflow wiring.
  - `README.md`: one or two sentences in the CI install paragraph (`README.md:39-46`).
- Not doing:
  - Editing any locked test (Q-1 chose (a), which needs none; Q-2 is moot). That includes `tests/ci/workflow.test.ts` (TASK-1.7/1.8/1.19/1.29), `tests/ci/apt-lock.test.ts`, `tests/ci/apt-network.test.ts`, and every locked `runInSandbox` caller (`tests/toolchain/*` TASK-1.1, `tests/advice/preflop.acceptance.test.ts`, `tests/engine/player-view.acceptance.test.ts`, `tests/toolchain/headless-lint-dirs.acceptance.test.ts`, `tests/toolchain/type-stripping-lint.acceptance.test.ts`).
  - Changing the retry flags `--attempts 3 --timeout-seconds 240 --delay-seconds 10`, `--wait-seconds 150`, step `timeout-minutes: 13` or job `timeout-minutes: 20`.
  - Moving the job into the Playwright container image (option (b), not chosen in Q-1; parked until milestone m-0 is done).
  - Making a cold-cache run on a slow mirror succeed. Only the warm-cache path is in scope (see Summary, known limitation).
  - Changing the Ubuntu mirror or the `tools/ci/apt-network.conf` values.
  - Changing `tools/ci/retry.js`, or making `runInSandbox` async.
- Scope budget: files=8, lines=380   (apt-lock.js ~+45, apt-lock.dpkg test ~110, process-group-cli.ts ~25, sandbox.ts ~+35/−10, sandbox-timeout test ~60, ci.yml ~+20, apt-archives-cache test ~70, README ~+3)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Recovery runs only when `/var/lib/dpkg/updates` has at least one entry. It then runs `sudo -n dpkg --configure -a` once, inheriting stdio, after the lock wait and before the command. It runs on every attempt, the first one included | yes | A non-empty updates journal is the exact condition behind apt's `E: dpkg was interrupted, you must manually run 'dpkg --configure -a'`. Checking it means healthy runs and the locked apt-lock tests (which use the real default path) never call sudo. A missing directory (macOS dev) means "not interrupted". apt-lock.js is the only apt-aware wrapper inside each attempt, and its run-line position stays unchanged (`ci.yml:57,61`) | Run it unconditionally on Linux; add a `--before-attempt` hook to retry.js (changes the pinned run lines, a locked-test edit) |
| A-2 | If `dpkg --configure -a` exits non-zero or cannot start, apt-lock prints `::warning::apt-lock: sudo -n dpkg --configure -a failed (<reason>); running <command> anyway` and still runs the command. The command's exit code is the wrapper's exit code | yes | The install then fails or succeeds on its own merits and retry.js retries it. Failing hard would waste an attempt even when apt could cope | Fail the attempt with exit 1 |
| A-3 | `runInSandbox` keeps its synchronous signature. It `spawnSync`s `node --import tools/playtest/resolve-ts.js tests/support/process-group-cli.ts`, and that CLI calls `runProcessGroup` and prints `{exitCode, output, timedOut}` as JSON. The outer `spawnSync` has a backstop timeout of `timeoutMs + 15_000` and `maxBuffer` of 64 MiB | yes | `runProcessGroup` is async (`tests/support/process-group.ts:16-20`). `spawnSync` cannot detach into a new group. Making `runInSandbox` async would need `await` in about 25 call sites across 9 locked test files | Make it async and edit the locked callers (a locked-test edit) |
| A-4 | `runInSandbox(files, script, args?, options?: { timeoutMs?: number })`. `timeoutMs` defaults to `TOOLCHAIN_TIMEOUT_MS` (120 000). `SandboxResult` gains `timedOut: boolean` | yes | The AC#2 test needs a short timeout. No caller compares the whole result object (checked with grep), so adding a field is safe | A module-level setter |
| A-5 | The AC#2 test uses `timeoutMs: 15_000` | yes | A sandbox `npm test` with coverage takes 0.6–2.8 s on CI (run 44684988055: `coverage.test.ts` 586–2808 ms, `test-command.test.ts` 1387 ms). 15 s is more than 5× that, so the probe has written its pid file long before the kill | 10 s; 30 s |
| A-6 | Option (a) details: cache path `~/.cache/apt-archives`. Key `apt-archives-${{ runner.os }}-pw<version>-<YYYY-MM>`, with restore-key prefix `apt-archives-${{ runner.os }}-pw<version>-`. The month stamp lets a stale set (after Ubuntu point updates) refresh at most monthly. None of the new steps has an `if:` | yes | No `if:` keeps the locked `if:` list unchanged (`tests/ci/workflow.test.ts:66-74`). `apt-get` keeps downloaded archives by default (only the `apt` binary sets `Keep-Downloaded-Packages` false). SPEC-08 (collect step reports more than 0 `.deb` files) confirms this on the live runner | Key on Playwright version only (never refreshes); weekly stamp |

## 3. Current system
- **CI workflow** (`.github/workflows/ci.yml`):
  - The job timeout is 20 min (`:18`). "Bound apt network timeouts" appends `tools/ci/apt-network.conf` (`:27-28`).
  - The browser cache is keyed on the Playwright version (`:45-53`).
  - Install steps (`:54-61`): `timeout-minutes: 13`, `retry.js --attempts 3 --timeout-seconds 240 --delay-seconds 10 -- node tools/ci/apt-lock.js --wait-seconds 150 -- npx playwright install(-deps) …`.
- **Locked `tests/ci/workflow.test.ts`** (locked by TASK-1.7, 1.8, 1.19 and 1.29 `state.json`):
  - It pins the exact run lines and `[3, 240, 10, 150]` / `13` (`:102-104,132,143-145`).
  - It pins the `if:` list (`:70-74`), bans `|| true` / `set +e` / `continue-on-error` (`:63-65`), requires SHA-pinned `uses:` (`:165-171`), and checks the order of `run: npm …` lines (`:35-46`).
  - New steps that have no `if:`, use no `|| true`, use a SHA-pinned `actions/cache`, and have non-`npm` run lines satisfy every assertion.
- **Locked `tests/ci/apt-network.test.ts:35-41`**: every non-comment line of `apt-network.conf` must be `Key "<digits>";`. So no `Dir::Cache` or boolean setting can go there.
- **Evidence for AC#3** (run 44684988055, attempt 1; same pattern in #68 and #73):
  - `apt-get update` fetched 13.3 MB in 5 s, then `Need to get 126 MB of archives`.
  - Attempt 1 timed out at 240 s. Attempt 2 started with `Need to get 106 MB/126 MB` and attempt 3 with `76.6 MB/126 MB`, so partial downloads persist across attempts. That is about 20 MB per 240 s, roughly 85 KB/s.
  - All 3 attempts timed out. At that rate the full 126 MB needs about 25 min, more than the 20-min job timeout. Longer timeouts alone (option (c)) cannot meet AC#3 for this mirror speed.
  - Green installs take 32–45 s (TASK-1.19 spec §3).
- **`tools/ci/apt-lock.js`**:
  - `main` waits for the locks, then calls `runCommand` (`:227-239`).
  - Test-only path options already exist: `--lock` and `--proc-locks` (`:3-4,188-200`).
  - `runCommand` spawns with inherited stdio and resolves the exit code (`:154-170`).
- **`tools/ci/retry.js`**: kills a timed-out attempt's group, with `sudo -n kill` for root members (`:74-99`). This kill is what can interrupt dpkg.
- **`tests/support/sandbox.ts:52-77`**: `runInSandbox` is synchronous and uses `spawnSync('npm', …, { timeout: TOOLCHAIN_TIMEOUT_MS })`, which signals only `npm`.
- **`tests/support/process-group.ts:16-47`**: `runProcessGroup` is async, `detached: true`, and SIGKILLs the group at the timeout and again on close.
- **`tools/playtest/resolve-ts.js`**: a resolve hook that lets Node's type stripping load extensionless `.ts` imports. Used by `npm run playtest` (`package.json` scripts). Node is pinned at 22.18.0 (`.nvmrc`).
- **Tooling**:
  - Vitest includes `tests/**/*.test.{ts,tsx}` with `testTimeout: 30_000` (`vite.config.ts:7,10`).
  - tsconfig type-checks `tests` and `tools` with `checkJs`, `erasableSyntaxOnly` (`tsconfig.json`).
- Existing code to reuse:
  - `tests/support/process-group.ts` `runProcessGroup` → the group kill for AC#2 (required by the AC).
  - `tools/playtest/resolve-ts.js` → load `process-group-cli.ts` under plain Node.
  - `tests/ci/apt-lock.test.ts:25-41,51-64` → copy (it is not exported) the temp-dir setup, marker script and `runWrapper` pattern for the AC#1 test.
  - `tests/support/process-group.test.ts:11-25` → `isAlive` / `waitUntilGone` pattern for AC#2.
  - `actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0` (`ci.yml:50`) → same pin for the apt cache.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | dpkg recovery lives in `apt-lock.js` and is triggered by a non-empty updates journal (A-1) | retry.js hook; workflow `sh -c` prefix | No change to the pinned run lines, so no locked-test edit | no | n/a |
| D-2 | `runInSandbox` stays synchronous through a JSON-printing CLI around `runProcessGroup` (A-3) | Make it async | Avoids editing 9 locked test files | no | n/a |
| D-3 | AC#3 approach: (a) cache the `.deb` archives between runs with `actions/cache` (A-6); current retry/step/job limits unchanged; no locked-test edits. A cold cache on a slow mirror can still fail (accepted limitation) | (b) Playwright container image; (c) longer timeouts only; (d) second mirror — see §11 | (b) is parked and needs locked-test edits; (c) cannot fit 126 MB at 85 KB/s in the 20-min job | yes | Q-1 (user, 2026-11-20) |

## 5. Design

### Files to create / modify
- `tools/ci/apt-lock.js` — dpkg journal check and recovery; `--dpkg-updates` option; exported `dpkgInterrupted(dir)`.
- `tests/ci/apt-lock.dpkg.acceptance.test.ts` — AC#1 tests (new).
- `tests/support/process-group-cli.ts` — CLI wrapper around `runProcessGroup` (new).
- `tests/support/sandbox.ts` — run through the CLI; `timeoutMs` option; `timedOut` field.
- `tests/support/sandbox-timeout.acceptance.test.ts` — AC#2 test (new).
- `.github/workflows/ci.yml` — AC#3 apt archive cache steps (option (a), Q-1).
- `tests/ci/apt-archives-cache.test.ts` — AC#3 static wiring check (new).
- `README.md` — CI paragraph: dpkg recovery and apt archive cache.

### Components, interfaces and data
- **apt-lock.js:**
  - `export function dpkgInterrupted(updatesDir: string): boolean` returns true only when `updatesDir` exists and `readdirSync` returns at least one entry. ENOENT returns false; any other error is rethrown.
  - `parseOptions` accepts `--dpkg-updates <dir>` (string, default `/var/lib/dpkg/updates`).
  - `main`: after `waitForAptLocks` returns null, if `dpkgInterrupted(dir)`:
    - log `apt-lock: dpkg was interrupted (<dir> is not empty); running sudo -n dpkg --configure -a`;
    - run `sudo` with args `['-n', 'dpkg', '--configure', '-a']` via `runCommand`-style spawn with inherited stdio;
    - on exit code 0, log `apt-lock: dpkg --configure -a finished`; else log the A-2 warning;
    - then run the command.

  If the lock is still held, the existing `::error::` path is unchanged and no recovery runs.
- **process-group-cli.ts:**
  - Usage: `node --import <repo>/tools/playtest/resolve-ts.js <repo>/tests/support/process-group-cli.ts <timeoutMs> <command> [args...]`, with cwd and env inherited from the spawner.
  - It awaits `runProcessGroup(command, args, { timeoutMs, cwd: process.cwd(), env: process.env })` and writes `JSON.stringify(result)` to stdout, with exit 0.
  - A bad `timeoutMs` (not a positive integer) or a missing command gives exit 2 with a usage line on stderr.
- **sandbox.ts:**
  - `export interface SandboxResult { exitCode: number; output: string; timedOut: boolean }`.
  - `runInSandbox(files, script, args?, options?: { timeoutMs?: number }): SandboxResult`.
  - The command is `npm run <script> [-- args]`, run through the CLI with `cwd: dir`, `env: sandboxEnv()`, outer `timeout: timeoutMs + 15_000`, `maxBuffer: 64 * 1024 * 1024` and `encoding: 'utf8'`.
  - If the CLI exits 0 with parseable JSON, return that.
  - Otherwise return `{ exitCode: -1, output: '<cli stdout><cli stderr>', timedOut: <outer spawnSync timed out> }`.
  - The temp dir is still removed in `finally`.
- **ci.yml .** Three new steps, all without `if:`:
  1. "Cache apt archives": after "Cache Playwright browsers". It uses the A-6 key, with the month from `date -u +%Y-%m` written to `$GITHUB_OUTPUT` by an extra line in "Read Playwright version" or a separate step.
  2. "Restore apt archives": `mkdir -p ~/.cache/apt-archives && find ~/.cache/apt-archives -maxdepth 1 -name '*.deb' -exec sudo cp -t /var/cache/apt/archives/ {} +`, placed before the two install steps.
  3. "Collect apt archives": after the install steps and before E2E. `find /var/cache/apt/archives -maxdepth 1 -name '*.deb' -exec cp -t ~/.cache/apt-archives/ {} +`, then echo the count and total size.

  `actions/cache` saves the path in its post step when the key missed. The install steps and their run lines stay unchanged.

### Rules and algorithms
- Journal rule: `/var/lib/dpkg/updates/0003` present → interrupted. Empty directory or missing directory → not interrupted.
- Order inside one apt-lock run: wait for locks → (if interrupted) dpkg recovery → command.

### Error handling and configuration
- dpkg recovery failure → `::warning::` line (A-2), and the command still runs.
- CLI wrapper failure → `SandboxResult.exitCode = -1`, with the wrapper's output so the calling test shows why.

## 6. Behaviour specification

### SPEC-01: An interrupted dpkg is recovered before the install command
- Verifies: AC#1
- Behaviour: Given a free lock, a `--dpkg-updates` dir that contains a file `0001`, and a fake `sudo` first on `PATH` that appends `sudo <args>` to a marker file and exits 0, When `node tools/ci/apt-lock.js --wait-seconds 5 --lock <free> --proc-locks <empty> --dpkg-updates <dir> -- node <mark.js>` runs, Then the marker file reads `sudo -n dpkg --configure -a\nran\n`, in that order. stdout contains `apt-lock: dpkg was interrupted`, and the exit code is 0.
- Verification: acceptance `tests/ci/apt-lock.dpkg.acceptance.test.ts::runs sudo -n dpkg --configure -a before the command when dpkg was interrupted`

### SPEC-02: A healthy dpkg is left alone
- Verifies: AC#1
- Behaviour: Given the same setup but an empty `--dpkg-updates` dir (and, separately, a path that does not exist), When the wrapper runs, Then the marker file reads exactly `ran\n` (no sudo call) and the exit code is 0.
- Verification: acceptance `tests/ci/apt-lock.dpkg.acceptance.test.ts::does not call sudo when the dpkg journal is empty or missing`

### SPEC-03: A failed recovery warns and still runs the command
- Verifies: AC#1
- Behaviour: Given an interrupted journal and a fake `sudo` that exits 1, When the wrapper runs a command that exits 0, Then stdout contains `::warning::apt-lock: sudo -n dpkg --configure -a failed`, the marker shows the command `ran`, and the exit code is 0.
- Verification: acceptance `tests/ci/apt-lock.dpkg.acceptance.test.ts::warns and still runs the command when dpkg --configure -a fails`

### SPEC-04: No recovery while the lock is still held
- Verifies: AC#1
- Behaviour: Given an interrupted journal and a lock held by a live pid for the whole `--wait-seconds 1 --poll-seconds 0.2`, When the wrapper runs, Then it exits 1 with the existing `::error::apt lock` line, and the marker file does not exist (neither sudo nor the command ran).
- Verification: unit `tests/ci/apt-lock.dpkg.acceptance.test.ts::does not recover dpkg while an apt lock is still held`

### SPEC-05: runInSandbox kills the whole process group on timeout
- Verifies: AC#2
- Behaviour: Given a sandbox `test` probe file whose Vitest test spawns a grandchild (`node -e "process.on('SIGTERM',()=>{}); setInterval(()=>{},1000)"`, not detached), writes the grandchild's pid to an absolute temp path, and awaits a promise that never resolves (per-test timeout 600 000 ms), When `runInSandbox(files, 'test', undefined, { timeoutMs: 15_000 })` returns, Then it took less than 30 s, `timedOut` is `true`, `exitCode` is `-1`, the pid file exists, and the grandchild pid is gone within 2 s. The test's own timeout is `TOOLCHAIN_TIMEOUT_MS`.
- Verification: acceptance `tests/support/sandbox-timeout.acceptance.test.ts::a timed-out runInSandbox kills a grandchild that ignores SIGTERM`

### SPEC-06: runInSandbox still returns exit code and output for normal runs
- Verifies: AC#2
- Behaviour: Given a passing probe `it('ok', () => expect(1).toBe(1))`, When `runInSandbox(files, 'test')` runs, Then `exitCode` is 0, `timedOut` is `false`, and `output` contains `ok`. Every existing locked `runInSandbox` caller passes unchanged (full `npm test`).
- Verification: unit `tests/support/sandbox-timeout.acceptance.test.ts::returns exit code and output for a run that finishes`

### SPEC-07: The workflow caches apt archives around both install steps
- Verifies: AC#3
- Behaviour: Given "Cache apt archives", "Restore apt archives" and "Collect apt archives" in `ci.yml` as in §5, When the workflow is read, Then:
  - the cache step uses the pinned `actions/cache` SHA, path `~/.cache/apt-archives`, and a key with the Playwright version and a month stamp;
  - restore comes after the cache step and before both install steps; collect comes after both and before "E2E";
  - none of the three has an `if:`;
  - the install steps' run lines, `--attempts 3 --timeout-seconds 240 --delay-seconds 10`, `--wait-seconds 150`, step `timeout-minutes: 13` and job `timeout-minutes: 20` are unchanged.
- Verification: acceptance `tests/ci/apt-archives-cache.test.ts::caches apt archives around both Playwright install steps without touching their run lines`

### SPEC-08: A cold-cache branch run fills and saves the apt archive cache
- Verifies: AC#3
- Behaviour: Given the branch pushed with no `apt-archives-Linux-pw<version>-<YYYY-MM>` cache entry, When CI run 1 of the branch completes the install steps, Then "Collect apt archives" reports more than 0 `.deb` files, and the "Post Cache apt archives" step logs `Cache saved` with the A-6 key. This run downloads from the mirror as today. If the mirror is slow it can still fail (known limitation); in that case re-run until one run saves the cache. A run that fails for this reason does not fail this item, but the Judge records it.
- Verification: manual — `gh run view <first-branch-run-id> --log | grep -E "Collect apt archives|Cache saved"`

### SPEC-09: A warm-cache branch run installs system dependencies in attempt 1
- Verifies: AC#3
- Behaviour: Given the cache saved by SPEC-08, When CI run 2 of the branch runs (a new push or a re-run), Then "Cache apt archives" logs a cache hit (`Cache restored from key: apt-archives-…`), "Install Playwright system dependencies" logs `attempt 1 of 3 succeeded`, apt reports `Need to get` of 10 MB or less, the step takes less than 240 s (well under its 13-min `timeout-minutes`), and the job passes.
- Verification: manual — `gh run view <second-branch-run-id> --log | grep -E "Cache restored from key: apt-archives|attempt 1 of 3 succeeded|Need to get"`

## 7. Edge cases
- Empty or missing dpkg journal: SPEC-02.
- Recovery fails or sudo is not allowed (`-n`): SPEC-03.
- Lock never frees: SPEC-04.
- A timed-out sandbox run with a stubborn grandchild: SPEC-05.
- The CLI wrapper cannot start or prints bad JSON: falls back to `exitCode: -1` with its output (§5). This only happens on a broken checkout, so there is no separate SPEC item.
- Cache miss (first run, new Playwright version, new month, eviction): the install downloads as today and the collect step fills the cache (SPEC-08). On a slow mirror this run can still fail all 3 attempts. That is an accepted limitation (Q-1), not covered by this task.
- Stale archive versions: apt downloads only the changed `.deb`s, and the monthly key refreshes the set (A-6).
- Concurrency: an apt lock held during recovery is handled because recovery runs only after the lock wait (SPEC-04).
- Locked-test interaction: SPEC-06 (all callers pass) and SPEC-07 (the `workflow.test.ts` assertions still hold).
- Fork pull requests get read-only cache access, so they restore but never save; they behave as warm or cold depending on what `main`/branch runs saved.

## 8. Security considerations
- `sudo -n dpkg --configure -a` runs only on the ephemeral CI runner. `-n` means it never prompts. The arguments are fixed and contain no user input.
- The `--dpkg-updates` path comes from the command line only. It is read with `readdirSync`, never executed.
- Cached `.deb`s are still verified by apt against the signed `Packages` index from `apt-get update`. A tampered or stale archive fails its hash check and is downloaded again.
- Cache scope is the repo's own Actions cache. Pull requests from forks get read-only cache access.
- No new dependencies. The action pin is reused.
- No secrets, and no sensitive data in logs.

## 9. Non-functional
- AC#3 target: with a populated cache (warm path only), "Install Playwright system dependencies" succeeds in attempt 1 in under 240 s. Measure from the step log, aiming for about 30–60 s, like green runs today. The worst case stays at 3×240 + 2×10 + 3×10 = 770 s, within the 13-min step limit. Cold-cache runs keep today's behaviour, including the slow-mirror failure risk.
- Actions cache cost: about 126 MB of `.deb`s per entry. With the month key, at most two entries live at once in a month changeover, and unused entries are evicted after 7 days. That adds to the existing Playwright browser cache entry, inside GitHub's 10 GB per-repo cache allowance. Cache storage above that counts toward the Actions budget.
- AC#2 test runtime: about 15 s for one test file, which runs in parallel with the rest of the suite.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `node tools/ci/apt-lock.js --wait-seconds 5 --dpkg-updates /tmp/tlh-dpkg-demo -- node -e 0` (after `mkdir -p /tmp/tlh-dpkg-demo && touch /tmp/tlh-dpkg-demo/0001`; prints the recovery line and a `::warning::` where sudo/dpkg are absent); CI end to end via two pushes of the branch
- New tests:
  - `tests/ci/apt-lock.dpkg.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04
  - `tests/support/sandbox-timeout.acceptance.test.ts` → SPEC-05, SPEC-06
  - `tests/ci/apt-archives-cache.test.ts` → SPEC-07
  - Branch CI runs (manual, Judge) → SPEC-08 (run 1, cold cache), SPEC-09 (run 2, warm cache)
- End-to-end scenario for the Judge:
  1. Run `npm test` locally (all locked `runInSandbox` callers green).
  2. Push the branch (run 1). Check SPEC-08: "Collect apt archives" reports more than 0 files and the post step logs `Cache saved`.
  3. Push again or re-run (run 2). Check SPEC-09: cache restored, "Install Playwright system dependencies" logs `attempt 1 of 3 succeeded` with `Need to get` of 10 MB or less, under 240 s.

## 11. Open questions
None open. Resolved:
- Q-1 (AC#3 approach) → (a) cache the `.deb` archives between runs; current limits unchanged; no locked-test edits (D-3). Rejected: (b) Playwright container image (parked, locked-test edits), (c) longer timeouts only (cannot fit 126 MB at ~85 KB/s in the 20-min job), (d) second mirror. Accepted limitation: a cold cache on a slow mirror can still fail.
- Q-2 (locked-test edits for (b)/(c)) → moot under (a).

## 12. Clarifications log
See `doit/TASK-1.39/qa.md`.
