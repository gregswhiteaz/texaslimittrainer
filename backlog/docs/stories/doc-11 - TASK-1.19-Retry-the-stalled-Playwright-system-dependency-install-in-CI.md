---
id: doc-11
title: 'TASK-1.19: Retry the stalled Playwright system-dependency install in CI'
type: other
created_date: '2026-11-18T05:56:00Z'
updated_date: '2026-11-18T05:56:00Z'
---
# TASK-1.19: Retry the stalled Playwright system-dependency install in CI

Status: Done (judge and CI results pending, appended by the orchestrator) · Completed: 2026-11-17 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: n/a (follow-up of TASK-1.7 J-2-01 and TASK-1.3) · Branch: doit/TASK-1.19

## What was asked
Twice in four CI-backed stories the "Install Playwright system dependencies" step stalled on the Ubuntu apt mirror for 19+ minutes and hit the 20-minute job timeout (it normally takes 30-70 s). Each stall cost a manual re-run and up to 20 billed minutes. Acceptance criteria:
1. The install step has a step-level timeout well below the job timeout.
2. A failed or timed-out install is retried automatically (at least 2 retries).
3. If all attempts fail, the workflow fails with a log line naming the install step.
4. A normal run is no more than 10 s slower.
5. Workflow tests cover the above (the static workflow tests).

Spec: doit/TASK-1.19/spec.md.

## Assumptions made without asking — please review
No spec-time questions were asked. These were decided and are for you to review.

| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Per attempt: 240 s timeout, 3 attempts (1 + 2 retries), 10 s delay between attempts, 10 s SIGTERM-to-SIGKILL grace | Yes | Green runs took 32-45 s, so 240 s is over 5x the slowest. Worst case is 770 s (about 12.8 min) | Change the flags in `ci.yml` (the workflow test checks the worst-case sum) |
| A-2 | Step-level `timeout-minutes: 13` on both install steps, as a backstop over the helper | Yes | ceil(770 s / 60) = 13. Well below the 20-min job timeout | Edit the value in `ci.yml` |
| A-3 | Both install steps are wrapped (cache-miss `install --with-deps` and cache-hit `install-deps`) | Yes | Both run apt | Wrap only one step |
| A-4 | Log lines are `retry:`-prefixed plain lines, plus `::warning::` per retry and `::error::` on final failure | Yes | Annotations name the failing step on the run summary page (AC#3) | Plain lines only |
| A-5 | Any non-zero exit (including "command not found") is retried like a timeout | Yes | The helper cannot tell transient apt errors from permanent ones. A permanent error costs about 20 s | Fail fast on spawn errors |
| A-6 | AC#4 is measured as helper overhead (step duration minus the command time the helper logs) of at most 10 s, not as a total-job-time comparison | Yes | Baseline job totals vary from 1m51s to 3m12s, so a plus or minus 10 s total comparison is not measurable | Compare job totals instead |

## Clarifications and decisions
- Spec-time questions: none.
- D-1: The retry is a dependency-free Node script (`tools/ci/retry.js`), not a bash `for` loop with `timeout`. The Mac dev machine has no `timeout` or `gtimeout` (and bash 3.2), so a shell loop could not be tested locally. Third-party retry actions were rejected as a new dependency.
- D-2: Proof is by Vitest tests of the helper against a stub command (run on macOS and again on Linux in CI), static workflow tests for the wiring, and the normal green CI run of the branch for AC#4. No proof branches.
- Q-1 (raised after review round 1, user decision): both reviewers doubted the helper's behaviour when the hung process is `sudo apt-get` on ubuntu-24.04 (sudo `use_pty` may put apt in a new session, and `kill(-pgid)` may fail with EPERM). The user chose: add a Linux-CI-only real-sudo hang test, and make `killGroup` tolerate EPERM. The spec was locked, so this was done as a fix round and recorded as a deviation in qa.md. Details are under "What was built".

## What was built
`tools/ci/retry.js` is an ESM CLI using Node built-ins only:

```
node tools/ci/retry.js --label <text> --attempts <n> --timeout-seconds <s>
     [--delay-seconds 10] [--kill-after-seconds 10] -- <command> [args...]
```

- Each attempt is spawned `detached`, so it leads its own process group. On timeout the helper sends SIGTERM to the group, then SIGKILL after the grace period. After each attempt exits it also SIGKILLs the group, so a leftover grandchild (such as one holding the apt lock) cannot reach the next attempt.
- Any non-zero exit, signal death, timeout or spawn error counts as a failure and is retried after the delay. A retry logs a `::warning::`. When all attempts fail it logs `::error::<label> failed after N attempts` and exits 1. Bad usage exits 2.
- `killGroup` is exported. It ignores ESRCH, logs EPERM as a short note and continues (Q-1), and rethrows anything else.
- `ci.yml`: both Playwright install steps now run through the helper (3 attempts, 240 s each, 10 s delay) and have `timeout-minutes: 13`. Nothing else in the workflow changed.

Files:
- `tools/ci/retry.js` — the retry helper (created)
- `tests/ci/fixtures/flaky-command.js` — stub command that fails or hangs (`fail`, `hang`, `hang-tree`, `hang-ignore-term`) for its first N calls (created)
- `tests/ci/retry.test.ts` — behaviour tests of the helper (created)
- `tests/ci/retry.sudo.test.ts` — killGroup EPERM/ESRCH unit tests, plus a test that runs only on Linux when `CI=true` and hangs under `sudo -n sh -c 'exec sleep …'` (created in the Q-1 fix round)
- `.github/workflows/ci.yml` — wrapped steps and step timeouts (modified)
- `tests/ci/workflow.test.ts` — wrapped-command assertions, step timeouts, retry flags and the worst-case invariant (modified)
- `README.md` — one sentence in "Continuous integration" (modified)

No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1, AC#5 | `tests/ci/workflow.test.ts`: step timeouts, flags, worst-case sum below the step timeout and the job timeout | Pass | gates/build-1.json, gates/fix-2.json |
| SPEC-02 | AC#2, AC#5 | Workflow test: both install steps use the helper, no bare `npx playwright` run line | Pass | same |
| SPEC-03 to SPEC-10 | AC#2, AC#3 | `tests/ci/retry.test.ts` against the stub: fail then succeed, hang then succeed, all fail, process-tree kill, SIGTERM-ignoring child, missing command, usage errors | Pass | same |
| Q-1 | Review concern | `tests/ci/retry.sudo.test.ts`: killGroup unit tests (EPERM/ESRCH/EINVAL). The real-sudo test was skipped on macOS and runs only on the Linux CI runner | Unit tests pass. Real-sudo test pending CI | fix-2.json; CI pending |
| SPEC-11 | AC#4 | Measured after the push from the normal CI run (helper overhead) | Pending CI | pending |
| SPEC-12 | docs | README sentence | Pass | review r1 |

- Local `npx vitest run tests/ci` after the fix round: 3 files, 20 passed, 1 skipped (the sudo test). Lint and typecheck clean. Full `npm test` passed in both gate runs (build-1, fix-2).
- Locked tests: `tests/ci/retry.test.ts` and `tests/ci/workflow.test.ts`.
- Judge: pending (orchestrator appends). CI run: pending (orchestrator appends).

## Review
Two review rounds, code and security reviewers. Blocking findings: 0 in both rounds. Round 1 led to the user's Q-1 decision and the fix round. Round 2 reviewed only the fix-round commit.

### Non-blocking review notes (deliberately not fixed)
Round 1:
- MINOR (code) `sudo-use-pty-escapes-group-kill`: with sudo `use_pty` on ubuntu-24.04, apt may sit outside the helper's process group. The group kill then reaches npx and sudo, and apt dies through sudo relaying SIGTERM or through the pty hangup. The spec's section 7 note that apt stays in the group is probably wrong. Addressed by the Q-1 real-sudo test, but the spec text was not corrected.
- MINOR (code) `half-second-timeout-vs-stub-startup`: some stub tests use 0.5 s attempt timeouts. On a heavily loaded runner the stub might not have started in time, which could make them flaky.
- MINOR (security) `post-exit-group-kill-pgid-reuse`: the post-exit SIGKILL could in theory hit a reused PGID. No realistic path (carried into round 2).
- NIT (security) `killgroup-eperm-uncaught`: fixed by Q-1.
- NIT (code) numbers are logged as parsed rather than as given (for example `1e0` logs as `1`).
- NIT (code) `parseCommandLine` is a one-use wrapper around `parseArgs`.

Round 2:
- MINOR (security) `eperm-on-both-kills-hangs-attempt`: if both SIGTERM and SIGKILL get EPERM, the attempt never settles and waits for the 13-minute step backstop. It still fails closed, but slowly and with an unclear message.
- MINOR (code) `no-cleanup-on-failure`: the sudo test has no try/finally cleanup, so on a failure a root-owned `sleep` could linger until the runner cleans up at job end. The test still fails correctly.
- NIT (code) `duplicated-helper-runner`: the sudo test repeats the spawn-and-collect code from `retry.test.ts`.

## How to try it
- `npx vitest run tests/ci` — helper and workflow tests (the sudo test is skipped off Linux CI).
- `node tools/ci/retry.js --label demo --attempts 3 --timeout-seconds 1 --delay-seconds 0 -- sleep 5` — watch two timeouts, then the `::error::` line, exit 1.
- `npm test` — the full suite.

## Run metrics
Questions asked: 1 (Q-1, after review r1) · assumptions logged: 6 (A-1 to A-6, in the spec; state.json counter shows 0) · review rounds: 2 · judge rounds: pending · gate runs: 2 (build-1, fix-2, both PASS) · escalations: 0 · changed lines: 526 across 7 files (budget 360 lines and 6 files, so the size check warns but does not block; the overage comes mainly from the Prettier-expanded tests and the Q-1 sudo test file).

## Known limitations and follow-ups
Noted only, no tasks created (needs your approval):
- Fail fast with a clear `::error::` when SIGKILL also gets EPERM, instead of waiting for the 13-minute backstop.
- Add try/finally cleanup to the sudo test.
- Correct the spec section 7 note that apt stays in the process group.
- Not covered by design: retrying other steps, apt tuning, recovering an interrupted `dpkg`.
- AC#4 and the real-sudo test can only be confirmed on the first Linux CI run of the branch.

## Lessons for the factory (proposals — not applied)
- The spec's edge-case claim about process groups under sudo was stated without checking ubuntu-24.04's `use_pty` default, and both reviewers caught it. Proposal: when a spec makes a claim about runner OS behaviour, have the spec stage verify it (or mark it as unverified and plan a real-environment test) before locking.
- The Q-1 fix round came after the spec was locked and so needed a recorded deviation. Proposal: let the spec stage list "real-environment proof" as an explicit item whenever the thing under test is a CI-only behaviour.
- The scope budget (360 lines) was exceeded by 46 percent. Proposal: estimate test line counts after Prettier's one-argument-per-line wrapping, which inflated the tests.
