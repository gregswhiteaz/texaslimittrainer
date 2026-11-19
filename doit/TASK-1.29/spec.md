# Spec: TASK-1.29 — Make the CI system-package install survive a busy apt lock

Status: READY (approved 2026-11-19 by orchestrator; no user questions)
Task: TASK-1.29 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: n/a (follow-up found by the TASK-9.1 judge; builds on TASK-1.19 / doc-11) · Dream: limit-holdem-trainer

## 1. Summary
Two CI runs (44441353985 attempt 1, 44434902016 attempt 1) failed at "Install Playwright system dependencies"
because attempts 2 and 3 of `tools/ci/retry.js` hit `E: Could not get lock /var/lib/dpkg/lock-frontend` and apt
exited 100 within seconds. This task adds a small dependency-free Node wrapper, `tools/ci/apt-lock.js`. It runs
inside every retry attempt. Before it runs the install command it waits, up to a set limit, until no process holds
an apt/dpkg lock. If a lock never clears, it fails with a `::error::` line that names the lock and its holder. The
lock logic is proven by Vitest tests on any OS (fake `/proc/locks` file). A Linux-CI-only test proves the real
`/proc/locks` detection with a real lock. The static workflow test asserts the wiring and the time budget.

## 2. Scope
- In scope:
  - `tools/ci/apt-lock.js`: a CLI that waits until the apt/dpkg lock files are free, then runs a command. Node
    built-ins only.
  - `.github/workflows/ci.yml`: insert `node tools/ci/apt-lock.js --wait-seconds 150 --` between the retry helper's
    `--` and the `npx playwright …` command. This applies to both Playwright install steps, because both run apt.
  - `tests/ci/apt-lock.test.ts`: behaviour tests of the wrapper, plus a Linux-CI-only real-lock test.
  - `tests/ci/workflow.test.ts`: update the one expected run string, and add one test that asserts the lock
    handling and its budget (AC#3).
  - `README.md`: extend the existing CI sentence about the install retry with the lock wait.
- Not doing:
  - Changing `tools/ci/retry.js`, its flags (`--attempts 3 --timeout-seconds 240 --delay-seconds 10`), the step
    `timeout-minutes: 13`, or the job `timeout-minutes: 20`.
  - Killing the orphaned root `apt-get` left by a timed-out attempt (see §3 finding and the follow-ups). Killing
    apt or dpkg part-way can leave dpkg "interrupted", so this task waits for it instead.
  - Stopping or masking `unattended-upgrades`, `apt-daily.service` or `apt-daily-upgrade.service`.
  - Writing apt config (`/etc/apt/apt.conf.d/…`, `DPkg::Lock::Timeout`), tuning apt mirrors, retries or timeouts,
    caching `.deb` archives, or using the Playwright Docker image.
  - Retrying or lock-waiting any other step.
  - Proof branches or extra pushes. The only push is this task branch's normal push.
- Scope budget: files=5, lines=400   (apt-lock.js ~150, apt-lock.test.ts ~200, workflow.test.ts +28/−2, ci.yml +2/−2, README +2/−1)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Lock wait limit **150 s per attempt**, polling every **2 s** | yes | Must fit inside retry's 240 s attempt with room to install. 240 − 150 = 90 s, which is over 2× the green install time of 32–45 s (doc-11 A-1). If the lock never clears, the step ends after about 3×150 + 2×10 = 470 s. That is well under the 780 s step timeout (AC#2). An orphan from a timed-out attempt gets up to 2×150 + 2×10 = 320 s more to finish across attempts 2 and 3 | One long wait in a separate step before retry (does not cover the orphan, see D-1). A 200 s wait (leaves only 40 s to install) |
| A-2 | Both install steps are wrapped: cache-miss `install --with-deps` and cache-hit `install-deps` | yes | Both run `apt-get` through `sudo` (`node_modules/playwright-core/lib/coreBundle.js:33787-33800`), so both can orphan or meet a held lock. The existing workflow test loops over both steps with one template (`tests/ci/workflow.test.ts:91-104`) | Wrap only `install-deps`, the step that failed |
| A-3 | "Lock held" means: `/proc/locks` has an entry whose device and inode match one of the four apt lock files. The files are `/var/lib/dpkg/lock-frontend`, `/var/lib/dpkg/lock`, `/var/lib/apt/lists/lock` and `/var/cache/apt/archives/lock`. A lock file that does not exist counts as free | yes | `/proc/locks` is world-readable, so no `sudo` and no external tool are needed. It shows real locks rather than just open files. It lists the holder's pid, and the process name comes from `/proc/<pid>/comm`. apt takes fcntl locks on these files | `sudo -n fuser <files>` (needs psmisc and sudo, and reports open files, not locks); `sudo lsof` |
| A-4 | If `/proc/locks` does not exist (non-Linux), the wrapper logs one note and runs the command without waiting | yes | The workflow only runs on `ubuntu-24.04`. Local runs on macOS should not fail | Fail with a usage error on non-Linux |
| A-5 | When the wait gives up, the wrapper exits **1** without running the command. retry.js then counts it as a failed attempt and tries again, so each later attempt waits again | yes | Retrying gives an orphan more time to finish. The `::error::` naming the lock is printed by every attempt that gives up. retry's final `::error::… failed after 3 attempts` line follows | A distinct exit code (e.g. 75) that retry treats as final. That would need a change to retry.js, which is out of scope |
| A-6 | The command's exit code is passed through. A command killed by a signal gives exit 1. The command runs as a normal (non-detached) child, so retry's group kill reaches it | yes | retry.js already reports and retries any non-zero exit (doc-11 A-5) | Re-raise the signal |
| A-7 | Exact log text: see §5 "Rules and algorithms" | yes | Uses the same `<tool>:` prefix and `::error::` convention as retry.js (`tools/ci/retry.js:19,101-109`) | Plain lines only |

## 3. Current system
- **Background: diagnosis correction (recorded in qa.md, 2026-11-19).** The task description blames unattended upgrades at boot. The logs below show the holder was attempt 1's own orphaned `apt-get`. That is why D-1 waits inside every attempt.
- **Observed failure (codebase / CI logs).** Read with `gh run view <id> --attempt 1 -R gregswhiteaz/texaslimittrainer --log-failed`:
  - Run 44441353985: attempt 1 starts 02:06:02. It takes the lock itself, runs `apt-get update`, and starts
    downloading 126 MB of packages. It stalls on the mirror (`Get:28 … librsvg2-2` at 02:09:41, then nothing) and
    is timed out at 02:10:02 (`##[warning]… attempt 1 of 3 timed out after 240 s`). Attempt 2 fails at 02:10:45
    with `E: Could not get lock /var/lib/dpkg/lock-frontend. It is held by process 4827 (apt-get)` /
    `E: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), is another process using it?` /
    `Error: Installation process exited with code: 100`. Attempt 3 fails the same way 13 s later with the same
    pid. Then `##[error]Install Playwright system dependencies failed after 3 attempts`.
  - Run 44434902016: same pattern. Attempt 1 times out at 01:18:32, just after `retry: could not send SIGKILL to
    process group 4430 (EPERM)`. Attempts 2 and 3 fail on `lock-frontend … held by process 4794 (apt-get)`.
  - **Finding:** the lock holder is very likely **attempt 1's own `apt-get`, orphaned**, not a boot-time
    unattended upgrade. Attempt 1 held the lock and was mid-download when it was timed out. retry.js's group kill
    cannot reach the root `apt-get` under `sudo` (EPERM, `tools/ci/retry.js:22-35`; TASK-1.19 §7 already noted
    that a grandchild in a new session escapes). The holder is named `apt-get`, not `unattended-upgr`. Whichever
    process holds the lock, the fix is the same: wait for the lock, with a limit. The orphan keeps downloading and
    then installs, so a later attempt that waits for it usually finds every package already installed.
- **How Playwright runs apt.** `npx playwright install-deps` runs
  `sudo -- sh -c "apt-get update&& apt-get install -y --no-install-recommends …"`
  (`node_modules/playwright-core/lib/coreBundle.js:33787-33800, 34034-34041`, playwright-core 1.65.1). `sudo`
  resets the environment, so an environment variable such as `APT_CONFIG` would not reach apt.
- **Workflow.** `.github/workflows/ci.yml:18` sets job `timeout-minutes: 20`. `ci.yml:50-57` has the two install
  steps, each with `timeout-minutes: 13` and
  `run: node tools/ci/retry.js --label "<step name>" --attempts 3 --timeout-seconds 240 --delay-seconds 10 -- <npx playwright …>`.
- **Locked workflow test** (`tests/ci/workflow.test.ts`, acceptance test of TASK-1.7 and TASK-1.19):
  - `:34-47` collects `run: npm …` lines only. Not affected.
  - `:62-75` forbids `continue-on-error`, `|| true` and `set +e`, and pins the list of `if:` lines. Not affected,
    because no step or `if:` is added.
  - `:77-86` needs each install run line to end with ` -- <npx command>` and start with
    `run: node tools/ci/retry.js `. Still true after the edit.
  - `:88-118` builds the expected run string exactly (`:102-104`):
    `node tools/ci/retry.js --label "${name}" --attempts 3 --timeout-seconds 240 --delay-seconds 10 -- ${command}`.
    **This one expectation must change.** The template gains `node tools/ci/apt-lock.js --wait-seconds 150 -- `
    before `${command}`. The flag parsing at `:105` uses the first `--timeout-seconds` match, which is still
    retry's 240. The worst-case invariant (`:114-115`) is unchanged, because the wait happens inside each attempt.
    Approved by the orchestrator as Q-1 (see qa.md).
- **retry.sudo test precedent.** `tests/ci/retry.sudo.test.ts:38-40` gates a real-sudo test with
  `const onLinuxCi = process.platform === 'linux' && process.env.CI === 'true'` and `describe.skipIf(!onLinuxCi)`.
- **Tooling.** Tool scripts are ESM `.js`, type-checked through `checkJs` (`tsconfig.json:18-21` includes
  `tools`). They are linted by ESLint with no Node globals, so they import `process` and timers explicitly
  (`tools/ci/retry.js:5-9`). Vitest runs `tests/**/*.test.ts` (`vite.config.ts:7`) with a 30 s `testTimeout`
  (`vite.config.ts:10`). Coverage only measures `src/**` (`vite.config.ts:13`).
- **README.** `README.md:38-41` has the sentence about the install retry.
- Existing code to reuse:
  - `tools/ci/retry.js:5-9,16-19,117-186` → the module layout: `parseArgs` with `tokens` for the `--`
    terminator, the `UsageError` → exit 2 pattern, the `log` helper, and the run-as-main guard. Copy the pattern.
    Do not import from retry.js, because it exports only `killGroup` and `runWithRetry`.
  - `tests/ci/retry.test.ts:1-60` → the `startHelper` subprocess pattern (spawn `process.execPath`, collect
    stdout/stderr, time the run) and the temp-dir `beforeEach`/`afterEach`.
  - `tests/ci/retry.sudo.test.ts:38-40` → the `onLinuxCi` gate.
  - `tests/support/sandbox.ts:15` → `REPO_ROOT`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Wrap the install command **inside** each retry attempt: `retry.js … -- node tools/ci/apt-lock.js --wait-seconds 150 -- npx playwright …` | (a) A step before the installs that writes `/etc/apt/apt.conf.d/90-ci-lock-timeout` with `DPkg::Lock::Timeout "150";`. apt then waits by itself, and the locked run line stays unchanged. But a lock that never clears ends with apt's plain `E: Could not get lock …` and retry's generic error, with no `::error::` naming the lock (AC#2 fails). (b) A wait-for-lock step before the install. It covers only a lock that exists before the step and misses the observed case, where the lock is held by attempt 1's own orphan. (c) Stop or mask `unattended-upgrades`/`apt-daily*`. Not the observed holder, and it does not help with the orphan. (d) A longer retry delay. It wastes time on every ordinary failure, the 780 s budget leaves little room, and there is still no `::error::` naming the lock | Only waiting inside each attempt covers both a pre-existing holder and the orphan of an earlier attempt. It gives a precise `::error::` naming the lock. It fits the existing 240 s attempt and 13-minute step budget without changing retry.js | yes (changes a locked acceptance assertion) | orchestrator (Q-1, on precedent: TASK-2.1 Q-3, TASK-3.2 Q-1, TASK-3.3 D-5, TASK-3.4 D-2); not asked of the user |
| D-2 | Detect holders from `/proc/locks` (device + inode of each lock file), not `sudo fuser`/`lsof` | `sudo -n fuser -v <files>`; `sudo lsof <files>` | No sudo, no external binary, and it sees real locks. The check is a pure function of text plus `stat`, so it can be unit-tested on macOS with a fake file | no | n/a |
| D-3 | Proof: wrapper behaviour by Vitest on any OS, using `--proc-locks <fake file>` and `--lock <temp file>`. Real Linux detection by a Linux-CI-only test that holds a real lock with `flock` (util-linux) on a temp file. Wiring and budget by the static workflow test. The fast path by the branch's normal green CI run | A proof branch that forces a held dpkg lock on GitHub (extra pushes, billed minutes) | Same approach as TASK-1.19 D-2. A `flock` lock shows up in `/proc/locks` as `FLOCK` with the same `maj:min:inode` key that apt's fcntl `POSIX` lock uses. That proves the device and inode matching on the real kernel | no | n/a |

## 5. Design

### Files to create / modify
- `tools/ci/apt-lock.js` — wait-for-apt-lock wrapper CLI (create)
- `tests/ci/apt-lock.test.ts` — unit and CLI tests, plus a Linux-CI-only real-lock test (create)
- `.github/workflows/ci.yml` — insert the wrapper into both Playwright install run lines (modify)
- `tests/ci/workflow.test.ts` — update the expected run string at `:102-104`, and add the lock-handling test (modify)
- `README.md` — mention the lock wait in the CI install sentence (modify)

### Components, interfaces and data

**`tools/ci/apt-lock.js`** (ESM; built-ins only: `node:child_process`, `node:fs`, `node:process`,
`node:timers`, `node:util`, `node:url`)

CLI:
```
node tools/ci/apt-lock.js --wait-seconds <number >0> [--poll-seconds <number >0, default 2>]
                          [--lock <path>]... [--proc-locks <path, default /proc/locks>]
                          -- <command> [args...]
```
- `--lock` may repeat. Its default is the four files in this order: `/var/lib/dpkg/lock-frontend`,
  `/var/lib/dpkg/lock`, `/var/lib/apt/lists/lock`, `/var/cache/apt/archives/lock`. `--lock` and `--proc-locks`
  exist only for tests. `ci.yml` uses neither.
- Usage errors (missing `--`, empty command, missing or invalid `--wait-seconds`, invalid `--poll-seconds`,
  unknown flag, a positional before `--`): print `apt-lock: usage: <message>` to stderr and exit **2** without
  running anything. These mirror retry.js (`tools/ci/retry.js:117-174,177-185`).

Exports (for unit tests):
- `parseProcLocks(text: string): Array<{ pid: number | null, major: number, minor: number, inode: bigint }>`.
  - Each line looks like `<n>: <TYPE> <ADVISORY|MANDATORY> <READ|WRITE> <pid> <MAJ>:<MIN>:<INODE> <start> <end>`.
    `MAJ` and `MIN` are hex and `INODE` is decimal.
  - Skip lines that contain `->`, which are blocked waiters, not holders. Skip blank or malformed lines.
  - A pid of `-1` (OFD locks) becomes `null`.
- `devParts(dev: bigint): { major: number, minor: number }` uses the Linux/glibc encoding:
  - `major = ((dev >> 8n) & 0xfffn) | ((dev >> 32n) & ~0xfffn)`
  - `minor = (dev & 0xffn) | ((dev >> 12n) & ~0xffn)`
  - Examples: `2049n` → `{8, 1}`. `66305n` → `{259, 1}`.
- `findHeldLock(lockPaths: string[], procLocksText: string, statPath: (p) => { dev: bigint, ino: bigint } | null):
  { path: string, pid: number | null } | null`. Returns the first path, in `lockPaths` order, that has a matching
  entry. A path whose `statPath` returns `null` (ENOENT) is free.
- `waitForAptLocks({ lockPaths, procLocksPath, waitSeconds, pollSeconds, now, sleep, log }):
  Promise<{ path, pid, name } | null>`. Returns `null` once nothing is held. It returns the last held lock if the
  limit is reached. `name` is the trimmed `/proc/<pid>/comm`, or `null` if it is unreadable or `pid` is `null`.
  `now` and `sleep` are injectable so tests can use a fake clock.

### Rules and algorithms
1. If `procLocksPath` does not exist: log `apt-lock: <procLocksPath> not found; running without waiting` and go
   to step 5.
2. Read `/proc/locks`, stat each lock path, and call `findHeldLock`. If it returns `null` on the first check, log
   nothing and go to step 5. This is the fast path: one file read and four `stat` calls.
3. On the first held result, log once:
   `apt-lock: waiting up to <W> s for <path> (held by <holder>)`.
   `<holder>` is `process <pid> (<name>)`, or `process <pid>` if there is no name, or `an unknown process` if the
   pid is `null`.
4. Re-check every `pollSeconds` until the check returns `null` or `now() - start >= waitSeconds`. A final check is
   made at the limit.
   - Lock cleared: log `apt-lock: apt locks are free after <s> s`, with `<s>` to one decimal, then go to step 5.
   - Limit reached: print
     `::error::apt lock <path> is still held by <holder> after <W> s; not running <cmd>`
     and exit **1**. `<path>` and `<holder>` come from the last check. `<cmd>` is the command and its args joined
     by single spaces. `<W>` is printed as given.
5. `spawn(command, args, { stdio: 'inherit' })`, not detached. Exit with the child's code. Exit 1 if the child was
   killed by a signal (log `apt-lock: <cmd> was killed by <SIGNAL>`). On a spawn error, print
   `::error::apt-lock: could not start <cmd>: <message>` and exit 1.

Worked example (the observed orphan; `--wait-seconds 150`):
```
retry: Install Playwright system dependencies: attempt 2 of 3: node tools/ci/apt-lock.js --wait-seconds 150 -- npx playwright install-deps chromium webkit
apt-lock: waiting up to 150 s for /var/lib/dpkg/lock-frontend (held by process 4827 (apt-get))
apt-lock: apt locks are free after 96.0 s
Installing dependencies...
…
retry: Install Playwright system dependencies: attempt 2 of 3 succeeded in 131.4 s
```
If the lock never clears, attempts 2 and 3 each print
`::error::apt lock /var/lib/dpkg/lock-frontend is still held by process 4827 (apt-get) after 150 s; not running npx playwright install-deps chromium webkit`.
Then retry prints `::error::Install Playwright system dependencies failed after 3 attempts`. The step ends at
about 250 + 2×150 + 10 = 560 s, inside the 780 s step timeout.

**Workflow** (`ci.yml`; only the two `run:` lines change):
```yaml
        run: node tools/ci/retry.js --label "Install Playwright browsers" --attempts 3 --timeout-seconds 240 --delay-seconds 10 -- node tools/ci/apt-lock.js --wait-seconds 150 -- npx playwright install --with-deps chromium webkit
        run: node tools/ci/retry.js --label "Install Playwright system dependencies" --attempts 3 --timeout-seconds 240 --delay-seconds 10 -- node tools/ci/apt-lock.js --wait-seconds 150 -- npx playwright install-deps chromium webkit
```
Budget invariants asserted by the new workflow test:
- `60 <= wait-seconds`.
- `wait-seconds + 60 <= timeout-seconds`, which leaves at least 60 s to install. Green installs take 32–45 s.
- Never-clears worst case: `attempts × (wait-seconds + 10) + (attempts − 1) × delay-seconds <= step timeout × 60`.
  The +10 s covers the poll and the `/proc` reads. With the values above: 3×160 + 20 = 500 <= 780.
- The existing invariant at `:114-115` still holds: 770 <= 780 < 1200.

### Error handling and configuration
- Exit codes: 0 or the child's code (pass-through). 1 if the wait gave up, the child was killed by a signal, or
  the spawn failed. 2 for a usage error.
- A `/proc/locks` line that cannot be parsed is skipped. A `stat` error other than ENOENT is rethrown, which
  crashes with a stack trace and a non-zero exit. retry.js treats that as a failed attempt.
- No environment variables. All limits are flags in `ci.yml`.

## 6. Behaviour specification

### SPEC-01: With no apt lock held, the command runs at once and its exit code passes through
- Verifies: AC#1
- Behaviour: Given a temp lock file, a fake proc-locks file with no matching entry, and `--wait-seconds 5`, When `node tools/ci/apt-lock.js --wait-seconds 5 --lock <tmp> --proc-locks <fake> -- node -e "process.exit(<c>)"` runs for c=0 and c=3, Then it exits with c, stdout has no `apt-lock: waiting` line, and the wall time is under 3 s
- Verification: acceptance `tests/ci/apt-lock.test.ts::apt-lock > runs the command at once when no apt lock is held`

### SPEC-02: A held lock is waited for, then the command runs
- Verifies: AC#1
- Behaviour: Given a fake proc-locks file whose entry matches the temp lock file's device and inode with pid 4242, and `--wait-seconds 10 --poll-seconds 0.2`, When the test rewrites the fake file to have no entries about 1 s after start, Then stdout has `apt-lock: waiting up to 10 s for <tmp> (held by process 4242` before `apt-lock: apt locks are free after <s> s` with 0.5 ≤ s ≤ 5. A marker file shows the command ran exactly once, after the free line. Exit code 0
- Verification: acceptance `tests/ci/apt-lock.test.ts::apt-lock > waits for a held apt lock to clear, then runs the command`

### SPEC-03: A lock that never clears fails with an ::error:: line naming the lock, within the limit
- Verifies: AC#2
- Behaviour: Given the matching fake entry is never removed, and `--wait-seconds 1 --poll-seconds 0.2`, When the wrapper runs `node <marker-writing script>`, Then it exits 1 within 4 s, the marker file does not exist (the command did not run), and stdout contains a line that starts with `::error::apt lock <tmp> is still held by process 4242` and ends with `after 1 s; not running node <script path>`
- Verification: acceptance `tests/ci/apt-lock.test.ts::apt-lock > fails with an error naming the lock when it never clears`

### SPEC-04: The workflow waits for the apt lock inside every install attempt, within the existing budget
- Verifies: AC#3, AC#1, AC#2
- Behaviour: Given `.github/workflows/ci.yml`, When it is read, Then both "Install Playwright browsers" and "Install Playwright system dependencies" run lines match `node tools/ci/retry.js --label "<name>" --attempts 3 --timeout-seconds 240 --delay-seconds 10 -- node tools/ci/apt-lock.js --wait-seconds 150 -- <npx command>` exactly. The parsed `wait-seconds` W satisfies `W >= 60`, `W + 60 <= retry timeout-seconds`, and `attempts × (W + 10) + (attempts − 1) × delay <= step timeout-minutes × 60`. The step timeout is still `13` and the job timeout is still `20`
- Verification: acceptance `tests/ci/workflow.test.ts::CI workflow > waits for the apt lock inside each Playwright install attempt within the step budget`

### SPEC-05: The existing retry wiring test accepts the wrapped command
- Verifies: AC#3
- Behaviour: Given the edited expectation at `tests/ci/workflow.test.ts:102-104`, which is now `` `node tools/ci/retry.js --label "${name}" --attempts 3 --timeout-seconds 240 --delay-seconds 10 -- node tools/ci/apt-lock.js --wait-seconds 150 -- ${command}` ``, When the suite runs, Then this test and "installs Chromium and WebKit for the Playwright and axe tests" both pass, with no other edits to either test
- Verification: acceptance `tests/ci/workflow.test.ts::CI workflow > gives each Playwright install attempt a timeout well below the job timeout and retries it`

### SPEC-06: /proc/locks parsing and device decoding
- Verifies: AC#1
- Behaviour: Given this text:
  `1: POSIX  ADVISORY  WRITE 4827 08:01:1835023 0 EOF`,
  `2: OFDLCK ADVISORY  WRITE -1 103:01:42 0 EOF`,
  `3: -> POSIX  ADVISORY  WRITE 999 08:01:1835023 0 EOF`,
  `garbage`.
  When it is parsed, Then the result is exactly `[{pid:4827, major:8, minor:1, inode:1835023n}, {pid:null, major:259, minor:1, inode:42n}]`. `devParts(2049n)` is `{major:8, minor:1}` and `devParts(66305n)` is `{major:259, minor:1}`. `findHeldLock` returns the first matching path in `lockPaths` order, ignores a matching inode on a different device, and treats a `null` stat as free
- Verification: unit `tests/ci/apt-lock.test.ts::parseProcLocks and findHeldLock > parse holders, skip waiters and match device and inode`

### SPEC-07: Holder naming and the fake-clock wait loop
- Verifies: AC#2
- Behaviour: Given an injected `now`/`sleep` fake clock and a check that stays held, When `waitForAptLocks` runs with `waitSeconds 150, pollSeconds 2`, Then it makes 76 checks (t = 0, 2, …, 150), logs the `waiting up to 150 s` line once, and returns the held lock. With a `null` pid the holder text is `an unknown process`. With an unreadable `/proc/<pid>/comm` it is `process <pid>`
- Verification: unit `tests/ci/apt-lock.test.ts::waitForAptLocks > polls until the limit and names the holder`

### SPEC-08: No /proc/locks means no waiting
- Verifies: AC#1
- Behaviour: Given `--proc-locks <nonexistent path>`, When the wrapper runs `node -e ""`, Then it logs `apt-lock: <path> not found; running without waiting` and exits 0
- Verification: unit `tests/ci/apt-lock.test.ts::apt-lock > runs without waiting when /proc/locks is missing`

### SPEC-09: Invalid arguments are rejected without running anything
- Verifies: AC#2
- Behaviour: Given each of: no `--`; an empty command; missing `--wait-seconds`; `--wait-seconds 0`; `--wait-seconds abc`; `--poll-seconds -1`; an unknown flag `--timeout 3`, When the wrapper runs a marker-writing command, Then it exits 2, stderr starts with `apt-lock: usage:`, and the marker file does not exist
- Verification: unit `tests/ci/apt-lock.test.ts::apt-lock > rejects invalid arguments without running the command`

### SPEC-10: Real Linux lock detection (Linux CI only)
- Verifies: AC#1, AC#2
- Behaviour: Given Linux with `CI=true`, and `flock -x <tmp> sleep 30` started and holding the lock (detected by polling `/proc/locks` for the file's inode for up to 5 s), When the wrapper runs with `--lock <tmp> --wait-seconds 1 --poll-seconds 0.2` (default `/proc/locks`), Then it exits 1 with `::error::apt lock <tmp> is still held by process <flock's pid> (flock)`. When the `flock` process is then killed and the wrapper runs again with `--wait-seconds 5`, Then it exits 0 and runs the command. Skipped on other platforms
- Verification: unit `tests/ci/apt-lock.test.ts::apt-lock on real Linux locks (Linux CI only) > detects a real held lock and runs once it is released`

### SPEC-11: The branch's real CI run is green and the wrapper is on the install path
- Verifies: AC#1
- Behaviour: Given the push run of the final commit of `doit/TASK-1.29`, When it is read, Then its conclusion is `success` and the install step's log shows `retry: … attempt 1 of 3: node tools/ci/apt-lock.js --wait-seconds 150 -- npx playwright …`. The log is also checked for any `apt-lock: waiting` line. If one is present, it is reported (real-world evidence that the wait worked)
- Verification: command `R=$(gh repo view --json nameWithOwner -q .nameWithOwner); id=$(gh run list -R "$R" --branch doit/TASK-1.29 --event push --workflow CI --limit 1 --json databaseId -q '.[0].databaseId'); gh run view "$id" -R "$R" --json conclusion -q .conclusion` → `success`; `gh run view "$id" -R "$R" --log | grep -E 'retry: Install Playwright .*attempt 1 of 3: node tools/ci/apt-lock.js|apt-lock:'` → shows the attempt line

### SPEC-12: README describes the lock wait
- Verifies: AC#1
- Behaviour: Given `README.md` "Continuous integration", When read, Then the install-retry sentence also says that each attempt first waits up to 150 s for another apt process to release its lock, and fails with an error naming the lock if it is never released
- Verification: manual `grep -n "lock" README.md` shows the sentence inside the "Continuous integration" section

## 7. Edge cases
- No lock (normal run) → SPEC-01. Held then released → SPEC-02. Never released → SPEC-03, SPEC-10.
- The holder is attempt 1's orphan (the observed case) → covered by D-1 placement and SPEC-04: the wait is inside
  every attempt, so attempt 2 waits for it.
- The holder changes during the wait (for example, `apt-get update` releases the lists lock and the same process
  takes `lock-frontend`) → each poll re-checks all four files, and the error names the lock from the last check.
  This is covered by the loop in SPEC-07.
- Race: the lock clears, then another apt process takes it before our `apt-get` does → apt exits 100, and retry's
  next attempt waits again. No extra handling.
- OFD lock (pid −1) or a holder whose `/proc/<pid>/comm` has vanished → SPEC-06 and SPEC-07.
- A lock file that does not exist (fresh image, no archives lock yet) → free (SPEC-06).
- `/proc/locks` missing (macOS) → SPEC-08.
- retry times out an attempt during the wait → the wrapper is in retry's process group and is killed. Its
  `npx` child has not started yet. Nothing is orphaned.
- An attempt that waits and then installs slowly is still capped by retry's 240 s timeout (unchanged).
- Invalid flags → SPEC-09.
- Concurrency with `unattended-upgrades` at boot: handled the same way as any other holder.

## 8. Security considerations
- Trust boundary: arguments come only from the checked-in `ci.yml`, not from event data such as PR titles or
  branch names. `spawn` gets an argv array with no shell, so there is no injection.
- No `sudo` is used by the wrapper. `/proc/locks` and `/proc/<pid>/comm` are read-only and world-readable.
  Nothing is written to system paths.
- The log prints lock paths, pids and process names only. No secrets.
- New dependencies: none (Node built-ins). The Linux-only test uses `flock`, which is part of util-linux on the
  runner image. No new action.

## 9. Non-functional
- Fast path overhead: one `/proc/locks` read and four `stat` calls, plus one extra `node` start of about 0.1 s.
  The target is ≤ 1 s added to a green install step. It is checked from the SPEC-11 run: the step duration is
  compared with the 32–45 s baseline in doc-11 and reported.
- A lock that never clears: the step fails in ≤ 500 s (≤ 780 s step timeout, < 1200 s job timeout). This is
  asserted statically by SPEC-04.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `node tools/ci/apt-lock.js --wait-seconds 5 -- node -e "console.log('installed')"` (prints a note
  on macOS, or runs at once on Linux with no apt running). End to end, the real run is the branch's CI push
  (SPEC-11).
- New tests:
  - `tests/ci/apt-lock.test.ts` → SPEC-01, 02, 03, 06, 07, 08, 09, 10.
  - `tests/ci/workflow.test.ts` (new test plus the edited expectation) → SPEC-04, SPEC-05.
- Judge scenario: run `npx vitest run tests/ci`. Then simulate a held lock by hand: `touch /tmp/l`, and write a
  fake locks file with the line `1: POSIX ADVISORY WRITE 4242 <maj>:<min>:<inode of /tmp/l> 0 EOF`. On macOS,
  compute `<maj>:<min>` by passing `stat`'s `dev` through `devParts`. Run
  `node tools/ci/apt-lock.js --wait-seconds 3 --lock /tmp/l --proc-locks <file> -- echo hi`. Expect the waiting
  line, then the `::error::apt lock /tmp/l is still held by process 4242 after 3 s; not running echo hi` line, and
  exit 1. Remove the line and run again: expect `hi` and exit 0.

## 11. Open questions
None. Q-1 (the one-line additive edit to `tests/ci/workflow.test.ts:102-104` plus the new AC#3 lock-handling test) was decided by the orchestrator on precedent; see `doit/TASK-1.29/qa.md`.

### Follow-ups (become tasks)
- Make retry.js really stop a timed-out sudo'd apt-get (EPERM kill leaves the root apt-get holding the lock) — merged into TASK-1.23.
- Reduce slow-mirror stalls on the us-east-2 EC2 Ubuntu mirror (try apt `Acquire::http::Timeout`/`Acquire::Retries`, or cache the `.deb` archives).

## 12. Clarifications log
See `doit/TASK-1.29/qa.md`.
