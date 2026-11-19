---
id: doc-31
title: 'TASK-1.23: Harden CI child-process cleanup'
type: other
created_date: '2026-11-19T19:54:00Z'
updated_date: '2026-11-19T19:54:00Z'
---
# TASK-1.23: Harden CI child-process cleanup

Status: Done · Completed: 2026-11-19 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: n/a (follow-up from TASK-1.19 / TASK-1.20 reviews) · Branch: doit/TASK-1.23

## What was asked
A hung or unkillable child process could outlive its attempt or test. CI run #68 (44461319182) failed in "Install Playwright system dependencies": `tools/ci/retry.js` timed out attempt 1 at 240 s, but the root `apt-get` survived as an orphan under `sudo`, held the dpkg lock, and attempts 2 and 3 each waited 150 s and gave up. Acceptance criteria:
1. An attempt whose SIGTERM and SIGKILL both fail with EPERM ends at once with an `::error::` line naming the step.
2. `tests/ci/retry.sudo.test.ts` kills any sudo sleep it started, even when it fails (cleanup in `finally`).
3. The nested Vitest run in `speed-limits.acceptance.test.ts` is killed as a whole process group on timeout, not only `npx`.
4. A timed-out attempt running `apt-get` under sudo has the root process really stopped (e.g. `sudo -n kill` on the group) before the next attempt.

Spec: doit/TASK-1.23/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Reap wait after every attempt is at most 2 s, polled every 250 ms (`REAP_SECONDS`, `REAP_POLL_MS`); no new flag | yes | SIGKILL acts in milliseconds; 2 s is small next to the 240 s attempt | Change constants, or reuse `--kill-after-seconds`, or add a flag |
| A-2 | An attempt that cannot be stopped ends the whole helper with exit 1; no further attempts | yes | Run #68 showed later attempts only wait out the lock and fail anyway | Log the error and keep retrying |
| A-3 | New log lines follow the existing `retry:` / `::warning::` / `::error::` style (spec §5) | yes | Consistency | Reword |
| A-4 | Sudo fallback is `sudo -n kill -s <NAME> -- -<pgid>`, `stdio: 'ignore'`, 10 s timeout; any failure counts as "not sent", never thrown | yes | `-n` never prompts; GitHub ubuntu runners have passwordless sudo | `pkill -g`, or no fallback off Linux |
| A-5 | The nested speed-limits run has its own 100 s timeout, below the 120 s Vitest test timeout | yes | The helper is async, so the nested timeout must fire first | Raise the test timeout to 140 s |
| A-6 | Sudo tests clean up with `sudo -n pkill -KILL -f '[1]000[.]<marker digits>'` (bracket class so pkill cannot match itself), also kill the helper child and remove the temp dir | yes | Self-safe cleanup | Record pids and `sudo kill` them |

Decisions D-1..D-5 (escalate to sudo only on EPERM; reap after every attempt; stuck attempt ends the helper; `runWithRetry(options, sudoKill = sudoKillGroup)` as a test seam; a new `runProcessGroup` test helper) are in spec §4. No questions were asked.

## Clarifications and decisions
No questions (qa.md does not exist). Key design evidence: in the earlier failing run 44434902016 the log shows `could not send SIGKILL ... (EPERM)`, which means the orphaned root `apt-get` stays in the attempt's process group, so a group kill through sudo reaches it. That is why the spec does not walk `/proc`.

## What was built
- `tools/ci/retry.js` — `killGroup` returns `'sent' | 'gone' | 'denied'`; new `groupExists` (probe with signal 0; EPERM counts as existing) and `sudoKillGroup`. After every attempt a bounded "reap" loop re-sends SIGKILL every 250 ms for up to 2 s, escalating to `sudo -n kill` when the plain kill is denied. If the group is still alive, the attempt is "stuck": retry logs `::warning::<prefix> timed out ...` then `::error::<label>: attempt N of M could not be stopped; process group P is still running` and returns 1 at once. `runWithRetry(options, sudoKill = sudoKillGroup)`.
- `tests/ci/retry.sudo.test.ts` — unit tests for killGroup/groupExists and the stop logic (mocked `process.kill`, fake sudo); new Linux-CI-only real-sudo test (root `flock` lock held across a timeout); `try/finally` cleanup in both Linux-CI-only tests. After review round 1 the real-sudo test also asserts the EPERM line and the `sent SIGKILL ... with sudo` line, asserts no attempt `succeeded`, and prints a `ps` process layout in failure messages.
- `tests/support/process-group.ts` (+ `.test.ts`) — `runProcessGroup(command, args, {cwd, env, timeoutMs})` runs a command detached and SIGKILLs the whole group at the timeout and after close.
- `tests/ci/speed-limits.acceptance.test.ts` — nested Vitest uses `runProcessGroup` with `NESTED_TIMEOUT_MS = 100_000`.
- `README.md` — one sentence in the CI paragraph.
No workflow, flag, default or dependency changes.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | unit: unkillable attempt ends with `::error::` in <5 s | PASS | local and CI (2612 ms); judge holdout |
| SPEC-02 | AC#4 | acceptance, Linux CI only, real sudo + flock | PASS | CI run 44600933321 at f4a6897, 4633 ms, not skipped |
| SPEC-03 | AC#2 | manual read: `try/finally` cleanup in both sudo tests | PASS | judge read of the test file |
| SPEC-04 | AC#4 | unit: denied kill retried via sudo, ends before grace | PASS | local and CI (305 ms) |
| SPEC-05 | AC#1, AC#4 | unit: killGroup/groupExists outcomes | PASS | local and CI |
| SPEC-06 | AC#3 | unit: group killed at timeout, grandchild gone | PASS | CI 514 ms; holdout |
| SPEC-07 | AC#3 | unit: exit code and output returned | PASS | local and CI |
| SPEC-08 | AC#3 | speed-limits acceptance via `runProcessGroup` | PASS | CI 7507 / 7344 ms |

- `npm test`: 81 files, 298 passed, 3 skipped (the Linux-CI-only tests). Lint and typecheck pass. Gates: build-1 and fix-2 PASS (scope budget warns: 490 changed lines vs 330, mostly tests).
- End-to-end Run command: two `timed out after 1 s` warnings, `::error::demo failed after 2 attempts`, exit 1, 2.05 s, no leftover processes.
- Linux CI run 44600933321 (f4a6897, success) confirms the key assumption: the EPERM line and sudo-kill line appeared, so on GitHub runners the orphan stays in the attempt's process group and the fallback works (not sudo `use_pty` doing the killing).
- Judge round 1: PASS, no blocking findings, one MEDIUM (below). Locked tests: retry.sudo and speed-limits tests; retry.sudo was unlocked once for the review fix.

## Review
Round 1 (the first security review claimed findings but never wrote its file and was re-run):
- Code MAJOR: the real-sudo test (SPEC-02) could pass through sudo's `use_pty` monitor killing the whole command, without the fallback running, so it did not prove the fix. Fixed in f4a6897 by asserting the EPERM and `with sudo` log lines. Round 2: no BLOCKER or MAJOR.
- Code MINOR: dead `failed with exit code` assertion — replaced with `not.toContain('succeeded')`.

### Non-blocking review notes (deliberately not fixed)
- MINOR (code): concurrent reap loops — if the child exits while the kill timer's reap runs, `finish` starts a second loop, doubling sudo calls and log lines for up to 2 s.
- MINOR (security): pid-reuse window — no `groupExists` check right before `sudoKillGroup`; theoretical.
- MEDIUM (judge J-1-01): on macOS, a SIGKILLed runner-owned child can make the immediate follow-up group kill return EPERM, so retry runs a real `sudo -n kill` on a dev machine with cached credentials. Outcome still correct; Linux CI unaffected.
- NIT: `pkill` pattern unanchored; `ps` diagnostic prints all sudo command lines (filter to marker or own pgid); SPEC-01/SPEC-04 cleanup gets the pid only from the fake sudo; SPEC-04 does not check the pid of the first sudo call.

## How to try it
- `npm test`, `npm run lint`, `npm run typecheck`
- `node tools/ci/retry.js --label demo --attempts 2 --timeout-seconds 1 --kill-after-seconds 1 --delay-seconds 0 -- node -e "setInterval(() => {}, 1000)"`
- `npx vitest run tests/ci tests/support`

## Run metrics
Questions 0 · assumptions logged 6 (spec table; state.json counter 0) · review rounds 2 · judge rounds 1 (PASS) · gate runs 2 · escalations 0 · changed lines 490 (budget 330).

## Known limitations and follow-ups
- retry.js (owner TASK-1.23 follow-up): escalate to sudo only when EPERM persists past one poll, so macOS dev runs do not issue a spurious root kill during SIGKILL teardown (J-1-01).
- retry.js: call `groupExists(pid)` immediately before `sudoKillGroup` and skip sudo on ESRCH, closing the pid-reuse window.
- retry.js: share one reap promise (`reaping ??= reap(...)`) between the kill timer and `finish`.
- tests/ci/retry.sudo.test.ts: anchor the `pkill` pattern to the expected argv tail.
- tests/ci/retry.sudo.test.ts: limit the `ps` diagnostic to marker lines or the helper's own pgid.
- tests/ci/retry.sudo.test.ts: take the child pid from a spawn spy so SPEC-01/SPEC-04 `finally` cleanup works when sudo is never called.
- tests/ci/retry.sudo.test.ts: assert the SPEC-04 first sudo call's pid equals the spawned pid.
- ci apt step: run `sudo dpkg --configure -a` before retrying after retry killed apt mid-install (dpkg may be left interrupted).
- tests/support/sandbox.ts: `runInSandbox` still uses `spawnSync` with a timeout, which signals only the direct child; move it to `runProcessGroup`.
- tools/ci/retry.js: the cancellation path (`onSignal`, SIGINT/SIGTERM to retry itself) has no sudo escalation; add it.

## Lessons for the factory (proposals — not applied)
- A review agent that reports findings in chat but does not write its JSON file wastes a round; the reviewer prompt should require the file write as the last step and the orchestrator should check for it before moving on.
- The builder's `use_pty` concern was real: a real-privilege test must assert that the intended code path ran (log line), not only the outcome. Add this to the spec template's guidance for tests that depend on the environment.
- The spec predicted the pre-change failure mode wrongly (`; true` hides flock's exit code). Spec authors should run the described "fails before the change" scenario once before writing it.
- The line budget (330) was exceeded by 48% on mostly test code; budget estimates for tests should be larger.
