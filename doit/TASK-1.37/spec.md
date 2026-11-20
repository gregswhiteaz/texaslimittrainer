# Spec: TASK-1.37 — Escalate CI kills to sudo only when truly needed

Status: READY (approved 2026-11-19)
Task: TASK-1.37 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: n/a (follow-up from TASK-1.23: judge J-1-01, security/code MINOR, doc-31) · Dream: limit-holdem-trainer

## 1. Summary
`tools/ci/retry.js` falls back to `sudo -n kill` when a process-group kill is refused (EPERM). TASK-1.23's
review found four flaws. (1) Right after a SIGKILL, a dying group can refuse one kill (seen on macOS), so sudo
runs for nothing. (2) sudo runs without first checking that the group still exists, so a reused PGID could be hit.
(3) The kill timer and the child's exit can each start a reap loop, so sudo calls and log lines double. (4) The
cancellation path (SIGINT/SIGTERM sent to retry.js) never escalates to sudo. This task fixes all four inside
retry.js and adds tests in a new test file.

## 2. Scope
- In scope:
  - `tools/ci/retry.js`: a `groupExists` check right before every sudo call; in the reap loop, sudo only after a
    second refused kill in a row; one shared reap per attempt; the signal handler stops the attempt with the
    same stop-and-reap as a timeout.
  - `tests/ci/retry.reap.test.ts` (new): local tests for AC#1–AC#4 plus one Linux-CI-only real-sudo test for AC#4.
- Not doing:
  - Editing `tests/ci/retry.sudo.test.ts` or `tests/ci/retry.test.ts` (locked by TASK-1.23 / earlier tasks). They
    must keep passing unchanged.
  - The test NITs from TASK-1.23 reviews (pid taken from the fake sudo, unanchored `pkill` pattern, `ps` layout
    output). They live in the locked file.
  - New flags, new log lines, new constants' values (`REAP_SECONDS = 2`, `REAP_POLL_MS = 250` stay), changes to
    `.github/workflows/ci.yml`, `tools/ci/apt-lock.js` or README.
  - Repairing dpkg after a kill.
- Scope budget: files=2, lines=300   (retry.js ~+40/−15, retry.reap.test.ts ~240)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Inside the reap loop, sudo runs only when the group kill is refused on **two consecutive polls** (and `groupExists` is still true right before sudo). The SIGTERM at the timeout, the SIGKILL at the end of the grace period and the SIGKILL on cancellation still escalate on the **first** refusal (plus the `groupExists` check) | yes | AC#1 is exactly "refused once, gone at the next poll". A just-killed group is only seen inside the reap loop. The first-refusal escalation at the timeout keeps the locked TASK-1.23 tests (`retry.sudo.test.ts` SPEC-01/SPEC-04, which expect sudo with `SIGTERM` and `SIGKILL`) valid. The real orphan case (run #68) only gains one 250 ms poll | Wait one poll before every escalation (changes when the locked TASK-1.23 tests see their first sudo call); escalate only after more than 2 refusals |
| A-2 | On SIGINT/SIGTERM retry.js sends SIGKILL (as today) through the same `stopGroup` (sudo on refusal), then awaits the attempt's shared reap (≤ `REAP_SECONDS`), then exits 130/143 as today. A second signal while this runs is ignored | yes | "Exactly as on timeout" (AC#4) means the same stop + reap; reusing the attempt's reap satisfies AC#3. Ignoring the repeat avoids a second concurrent stop | Exit at once on the second signal |
| A-3 | New tests go in a new file `tests/ci/retry.reap.test.ts`, not appended to the locked `tests/ci/retry.sudo.test.ts`. Small helpers (`errno`, `captureOutput`, `startHelper`, `cleanUp`, `expectNoLeftovers`) are copied, not exported from the locked file | yes | Avoids a cross-story locked-test edit; the caller asked to prefer a new file | Append to retry.sudo.test.ts with an unlock |

## 3. Current system
- `tools/ci/retry.js`:
  - `killGroup` returns `'sent' | 'gone' | 'denied'` and logs `retry: could not send <SIG> to process group <pid> (EPERM)` on EPERM (`:37-49`).
  - `groupExists` treats success/EPERM as true and ESRCH as false (`:55-65`).
  - `sudoKillGroup` runs `sudo -n kill -s <NAME> -- -<pid>` and logs one line (`:71-84`).
  - `stopGroup` calls sudo on any `'denied'` without re-checking the group (`:91-93`) → AC#2.
  - `reap` re-sends SIGKILL every poll through `stopGroup`, so one EPERM from a dying group triggers sudo (`:100-109`) → AC#1 (J-1-01).
  - `runAttempt`: the kill timer awaits `reap` (`:141`) and `finish` starts another `reap` (`:153`); `clearTimeout(killTimer)` cannot stop a timer that already fired → AC#3.
  - `runWithRetry`'s `onSignal` only calls `killGroup(currentPid, 'SIGKILL')` and exits (`:174-177`) → AC#4.
- Tests: Vitest (`npm test` = `vitest run --coverage`, `package.json:13`; `testTimeout: 30_000`, `vite.config.ts:10`).
  Locked tests that must stay green: `tests/ci/retry.sudo.test.ts` (TASK-1.23 SPEC-01 at `:95-120` expects sudo
  called with SIGTERM and SIGKILL when every kill is EPERM; SPEC-04 at `:122-147` expects the first sudo call to be
  SIGTERM; Linux-CI tests at `:190-241` expect the EPERM line and `retry: sent SIGKILL … with sudo`), and
  `tests/ci/retry.test.ts:131-145` (cancellation exits 143 and kills grandchildren).
- Linux-CI gate: `const onLinuxCi = process.platform === 'linux' && process.env.CI === 'true'` with `describe.skipIf(!onLinuxCi)` (`tests/ci/retry.sudo.test.ts:150,190`).
- Existing code to reuse:
  - `tools/ci/retry.js::killGroup`, `groupExists`, `sudoKillGroup`, `REAP_POLL_MS` → unchanged building blocks.
  - `tests/ci/retry.sudo.test.ts:14-16,86-93,153-188` → copy `errno`, `captureOutput`, `newMarker`, `startHelper`, `expectNoLeftovers`, `cleanUp` into the new file (A-3).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | `stopGroup(pid, signal, sudoKill)`: `if (killGroup(pid, signal) === 'denied' && pid !== undefined && groupExists(pid)) sudoKill(pid, signal)` | Check only in the reap loop | AC#2 says "immediately before" every sudo call; one place covers all callers | no | n/a (AC#2) |
| D-2 | `reap` keeps `deniedLastPoll`. Per poll: `if (!groupExists(pid)) return true; const outcome = killGroup(pid, 'SIGKILL'); if (outcome === 'denied' && deniedLastPoll && groupExists(pid)) sudoKill(pid, 'SIGKILL'); deniedLastPoll = outcome === 'denied';` then sleep `REAP_POLL_MS` | Probe with `groupExists` only (not enough: a zombie group answers EPERM to signal 0 too, J-1-01) | AC#1; A-1 | no | n/a |
| D-3 | `runAttempt` holds `let reaping` and `const reapOnce = () => (reaping ??= reap(pid, sudoKill))`. The kill timer, `finish` and the signal handler all await `reapOnce()` | Cancel one loop with a flag | AC#3; the fix the code reviewer proposed | no | n/a |
| D-4 | `onSpawn` passes `{ pid, reap: reapOnce }` instead of `pid`; `runWithRetry` keeps the current attempt's object. `onSignal`: if already stopping, return; else `stopGroup(pid, 'SIGKILL', sudoKill)`, `await current.reap()` (when an attempt runs), then `process.exit(130 | 143)` | Separate reap in the handler | AC#4 + AC#3 (one reap per attempt), A-2 | no | n/a |

## 5. Design

### Files to create / modify
- `tools/ci/retry.js` — D-1…D-4; header comment mentions that cancellation also uses the sudo fallback.
- `tests/ci/retry.reap.test.ts` — new tests SPEC-01…SPEC-05.

### Components, interfaces and data
- Public exports unchanged: `killGroup`, `groupExists`, `sudoKillGroup`, `runWithRetry(options, sudoKill = sudoKillGroup)`.
- Internal: `stopGroup` (D-1), `reap` (D-2), `runAttempt(options, onSpawn, sudoKill)` with
  `onSpawn: (attempt: { pid: number | undefined, reap: () => Promise<boolean> }) => void` (D-3, D-4).
- No new log lines; existing lines and exit codes (0, 1, 2, 130, 143) unchanged.

### Rules and algorithms
- Worked example (J-1-01, AC#1): child ignores SIGTERM. t=0.3 s SIGTERM sent. t=0.6 s SIGKILL sent; reap starts:
  probe → exists (dying), SIGKILL → EPERM (logged once), first refusal → no sudo. t=0.85 s probe → ESRCH → reaped.
  sudo never runs; attempt fails `timed out after 0.3 s`.
- Worked example (run #68 orphan): child exits after SIGTERM; reap poll 1: exists, SIGKILL → EPERM, no sudo;
  poll 2 (+250 ms): exists, EPERM again → `groupExists` true → `sudo -n kill -s KILL -- -P` → gone at poll 3.
- Worked example (AC#3): kill timer's reap runs from t=0.6 s; child exits at t≈1.1 s; `finish` awaits the same
  promise, so per poll there is one probe, one SIGKILL, at most one sudo call and one log line of each kind.

### Error handling and configuration
- Unchanged: unknown `process.kill` errors are rethrown; sudo failures are logged, never thrown.

## 6. Behaviour specification

All `tests/ci/retry.reap.test.ts` local tests call `runWithRetry` with label `Install Playwright system dependencies`,
`attempts: 1`, `delaySeconds: 0`, `timeoutSeconds: 0.3`, `killAfterSeconds: 0.3`, a real `process.execPath -e …`
child, `process.kill` spied (calls with a positive pid or not targeting the child's group are passed to the real
`process.kill`), stdout captured, a fake `sudoKill` (`vi.fn`) and a `finally` that restores mocks and SIGKILLs the
child's group with the real `process.kill`.

### SPEC-01: A just-killed group that refuses one kill does not trigger sudo
- Verifies: AC#1
- Behaviour: Given a child `process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)` and a `process.kill`
  mock that forwards to the real kill until the first group SIGKILL has been forwarded; after that, the next
  signal-0 probe returns `true`, the next group SIGKILL throws EPERM, signal-0 probes within 100 ms after that EPERM
  throw EPERM, and everything later is forwarded to the real kill; When `runWithRetry` runs, Then the fake sudo is
  never called, the output contains `retry: could not send SIGKILL to process group <pid> (EPERM)` exactly once,
  the result is `1` in under 3 000 ms, the last line is
  `::error::Install Playwright system dependencies failed after 1 attempts`, and `could not be stopped` does not
  appear.
- Verification: acceptance `tests/ci/retry.reap.test.ts::sudo escalation > does not call sudo when a just-killed group refuses one kill and is gone at the next poll`

### SPEC-02: sudo is skipped when the group is gone right before it
- Verifies: AC#2
- Behaviour: Given a child `setInterval(() => {}, 1000)` and a `process.kill` mock where the group SIGTERM throws
  EPERM, group signal-0 probes throw ESRCH, and group SIGKILL is forwarded to the real kill; When `runWithRetry`
  runs, Then the spied call directly after the refused `(-pid, 'SIGTERM')` call is `(-pid, 0)`, the fake sudo is
  never called, the result is `1` in under 3 000 ms, and the last line is
  `::error::Install Playwright system dependencies failed after 1 attempts`.
- Verification: acceptance `tests/ci/retry.reap.test.ts::sudo escalation > checks the group right before sudo and skips sudo when it is gone`

### SPEC-03: The kill timer and the child's exit share one reap
- Verifies: AC#3
- Behaviour: Given a child `setTimeout(() => process.exit(3), 1000)`, a `process.kill` mock that throws EPERM for
  every call on the child's group (probes included), and a fake sudo that returns `false`; When `runWithRetry` runs
  (the kill timer's reap starts at 0.6 s; the child exits by itself during it), Then it resolves `1` in under
  4 000 ms; the output has at most 10 lines `retry: could not send SIGKILL to process group <pid> (EPERM)`; the
  fake sudo is called with `'SIGKILL'` at most 9 times; and the output has exactly one line
  `::error::Install Playwright system dependencies: attempt 1 of 1 could not be stopped; process group <pid> is still running`.
  (One reap over 2 s polls 8 times: ≤ 1 + 8 EPERM lines and ≤ 1 + 7 sudo calls; two concurrent loops give ~16.)
- Verification: acceptance `tests/ci/retry.reap.test.ts::sudo escalation > runs one shared reap when the kill timer and the child's exit both reap`

### SPEC-04: Cancelling an attempt escalates a refused kill to sudo (local)
- Verifies: AC#4
- Behaviour: For each of `SIGINT` → 130 and `SIGTERM` → 143: Given `timeoutSeconds: 30`, a child
  `setInterval(() => {}, 1000)`, `process.exit` mocked, a `process.kill` mock that throws EPERM for every call on
  the child's group until the fake sudo has been called (then forwards), and a fake sudo that calls the real
  `process.kill(-pid, signal)` and returns `true`; When, 300 ms after start, the SIGINT/SIGTERM listener that
  `runWithRetry` added (found by diffing `process.listeners(signal)` before and after start) is called twice in a
  row, Then within 3 000 ms `process.exit` is called exactly once, with 130/143, after the fake sudo was called with
  `(<pid>, 'SIGKILL')`; the fake sudo is called with `'SIGKILL'` exactly once; and the child's group is gone
  (`kill(-pid, 0)` throws ESRCH with the real kill) when `process.exit` is called. The test then awaits the
  `runWithRetry` promise.
- Verification: acceptance `tests/ci/retry.reap.test.ts::cancelling an attempt > escalates a refused group kill to sudo on %s`

### SPEC-05: Cancelling a real sudo attempt kills its root child (Linux CI only — needs a branch push)
- Verifies: AC#4
- Behaviour: For each of `SIGINT` → 130 and `SIGTERM` → 143: Given Linux CI and a unique marker, When retry.js runs
  `--label <LABEL> --attempts 1 --timeout-seconds 60 -- sudo -n sh -c 'exec sleep "$1"' sh <marker>`, `pgrep -f <marker>`
  finds the root sleep (polled ≤ 5 000 ms), and the helper is sent the signal, Then it exits with 130/143 within
  5 000 ms of the signal, its stdout matches `/retry: sent SIGKILL to process group \d+ with sudo/`, and within
  2 000 ms `pgrep -f <marker>` finds nothing. Everything after spawn is in `try { … } finally { cleanUp(…) }`.
  (Before this change, the group SIGKILL kills only the runner-owned sudo and the root sleep survives.)
- Verification: acceptance `tests/ci/retry.reap.test.ts::cancelling the retry helper around a hanging sudo command (Linux CI only) > kills the root child on %s`

### SPEC-06: Existing retry behaviour is unchanged
- Verifies: AC#1, AC#2, AC#3, AC#4
- Behaviour: Given the locked `tests/ci/retry.sudo.test.ts` and `tests/ci/retry.test.ts` unchanged, When the suite
  runs locally and in branch CI, Then every test passes, including both `retry.sudo` "(Linux CI only)" tests,
  which must be listed as passed (not skipped) in the CI "Test" step.
- Verification: command `npx vitest run tests/ci/retry.sudo.test.ts tests/ci/retry.test.ts tests/ci/retry.reap.test.ts`

## 7. Edge cases
- Dying group refuses one kill → SPEC-01. Group gone between refusal and sudo → SPEC-02.
- Real root orphan (refused on consecutive polls) → still escalates: locked `retry.sudo` Linux test (SPEC-06).
- Kill timer and exit overlapping → SPEC-03. Signal while the attempt's own reap is running → shares it (D-4).
- Second signal during cancellation → ignored (SPEC-04 calls the listener twice).
- Signal between attempts (`currentPid` undefined) → exits at once as today (no group to stop).
- Every kill refused and sudo unavailable → stuck path unchanged (locked `retry.sudo` SPEC-01, SPEC-06).

## 8. Security considerations
- Privileged action unchanged (`sudo -n kill -s <SIG> -- -<pgid>`, pgid from `child.pid`, no shell). This task
  narrows its use: a `groupExists` probe directly before every sudo call (PGID-reuse window shrinks to the gap
  between two syscalls), and no sudo on a single refusal in the reap loop, so dev machines with cached sudo
  credentials no longer run a root kill on a just-killed group.
- No untrusted input, no secrets, no new dependencies.

## 9. Non-functional
- A real root orphan is stopped one poll (250 ms) later than before; the reap bound stays 2 s.
- Cancellation now takes up to `REAP_SECONDS` (2 s) before exit, well inside GitHub's cancel grace (SPEC-04/05 assert < 3 s / < 5 s).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `node tools/ci/retry.js --label demo --attempts 1 --timeout-seconds 0.5 --kill-after-seconds 0.5 --delay-seconds 0 -- node -e "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)"` (on macOS: no `sudo could not send` / `with sudo` line, `::warning::demo: attempt 1 of 1 timed out after 0.5 s`, `::error::demo failed after 1 attempts`, exit 1)
- New tests: `tests/ci/retry.reap.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05 (Linux CI only).
- Branch push needed: SPEC-05 and the Linux-CI part of SPEC-06 run only in GitHub Actions on the task branch.
- End-to-end for the Judge:
  1. Run the Run command above 5 times on macOS; no line contains `sudo`.
  2. `npx vitest run tests/ci` locally.
  3. In the task branch's CI run at HEAD, check that the four "(Linux CI only)" retry tests (2 in retry.sudo, 2 in retry.reap) are passed, not skipped, and "Install Playwright system dependencies" succeeded.

## 11. Open questions
- (none)

## 12. Clarifications log
See `doit/TASK-1.37/qa.md`.
