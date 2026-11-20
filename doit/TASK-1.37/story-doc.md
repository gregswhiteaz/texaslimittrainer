# TASK-1.37: Escalate CI kills to sudo only when truly needed

Status: Done · Completed: 2026-11-19 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: n/a (follow-up from TASK-1.23, judge J-1-01) · Branch: doit/TASK-1.37

## What was asked
`tools/ci/retry.js` falls back to `sudo -n kill` when a process-group kill is refused (EPERM). TASK-1.23's review found four flaws, and this task fixes all four in retry.js:
1. A just-killed group can refuse one kill (seen on macOS). sudo ran for nothing.
2. sudo ran without first checking that the group still existed, so a reused PGID could be hit.
3. The kill timer and the child's exit could each start a reap loop, which doubled the sudo calls and log lines.
4. Cancelling retry.js (SIGINT/SIGTERM) never escalated to sudo.

Spec: doit/TASK-1.37/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Inside the reap loop, sudo runs only after two consecutive refused kills (plus a `groupExists` check). The SIGTERM at the timeout, the SIGKILL ending the grace period and the SIGKILL on cancel still escalate on the first refusal (plus the `groupExists` check). | yes | AC#1 is "refused once, gone at the next poll". The locked TASK-1.23 tests expect sudo on the first refusal at the timeout. A real orphan only gains one 250 ms poll. | Wait one poll before every escalation (this changes the locked TASK-1.23 tests), or require more than 2 refusals. |
| A-2 | On SIGINT/SIGTERM, retry.js sends SIGKILL through `stopGroup` (sudo on refusal), awaits the attempt's shared reap (at most 2 s), then exits 130/143. A second signal while this runs is ignored. | yes | "Same as timeout" means the same stop and reap. Ignoring a repeat avoids a second concurrent stop. | Exit at once on the second signal. |
| A-3 | The new tests live in `tests/ci/retry.reap.test.ts`. The small helpers are copied, not exported from the locked retry.sudo.test.ts. | yes | Avoids editing a test file locked by another story. | Append to retry.sudo.test.ts with an unlock. |

## Clarifications and decisions
No questions were asked. Decisions D-1 to D-4 were all non-material:
- **D-1:** `stopGroup` checks `groupExists` right before every sudo call.
- **D-2:** `reap` tracks `deniedLastPoll` and calls sudo only on the second refused poll in a row, and only if the group still exists.
- **D-3:** `reapOnce = () => (reaping ??= reap(...))`. The kill timer, `finish` and the signal handler all share it.
- **D-4:** `onSpawn` passes `{ pid, reap }`. The signal handler does `stopGroup`, then awaits the shared reap, then exits.

## What was built
- `tools/ci/retry.js` (+54/−15 lines)
  - `stopGroup` re-checks the group before sudo.
  - `reap` escalates only after two refusals in a row.
  - One shared reap runs per attempt.
  - The SIGINT/SIGTERM handler stops the attempt with sudo fallback, waits for the reap, then exits 130/143.
  - The header comment was updated.
- `tests/ci/retry.reap.test.ts` (new, 292 lines): SPEC-01 to SPEC-05.
- Public exports are unchanged, and there are no new flags, log lines or dependencies. `REAP_SECONDS` (2) and `REAP_POLL_MS` (250) are unchanged.
- Cancellation now takes up to 2 s before exit.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | `retry.reap.test.ts` — one refused kill, then the group is gone | PASS | No sudo, exactly one EPERM line. Fails on the base code. |
| SPEC-02 | AC#2 | same file — the group is gone right before sudo | PASS | The call after the refused SIGTERM is the `(-pid, 0)` probe, and sudo is not called. |
| SPEC-03 | AC#3 | same file — the kill timer and child exit overlap | PASS | At most 10 EPERM lines and at most 9 sudo calls. One "could not be stopped" line. |
| SPEC-04 | AC#4 | same file — SIGINT/SIGTERM, local, listener called twice | PASS | One sudo SIGKILL, exit 130/143 once, group gone. |
| SPEC-05 | AC#4 | same file — real sudo, Linux CI only | PASS | Branch CI run 44657322059 (headSha 9b9f4ff): the root `sleep` is killed on SIGINT and SIGTERM. |
| SPEC-06 | no regression | the locked retry.sudo and retry tests | PASS | Unchanged and green, including the Linux-CI tests. |

- `npm test`: 88 files, 324 passed, 5 skipped. The skips are the Linux-CI-only tests.
- Lint, typecheck and the build gate passed (gate build-1: PASS, 346 changed lines).
- End-to-end:
  - A SIGTERM-ignoring child ran 5 times. There was one EPERM line and no sudo line each time. The base retry.js printed the sudo line on the same command.
  - Cancellation with a grandchild exits in about 260 ms with no leftovers.
- Judge round 1: PASS, with no blocking findings. The 5 new local tests fail against the base retry.js, so they discriminate.

## Review
Round 1 had no blocking findings. The security review found none: the sudo call is a fixed argv with no shell, the pid comes from `child.pid`, and the change only narrows when sudo runs.

### Non-blocking review notes (deliberately not fixed)
- MINOR (code): no test fails if the `groupExists` check before sudo in the reap loop (retry.js ~114) is removed. SPEC-02 covers only the SIGTERM path.
- MINOR (code): no test pins that cancellation escalates on the first refusal. Removing `stopGroup` from the signal handler still passes, because the reap escalates 250 ms later.
- NIT: the SPEC-04 test has a duplicate `await run`.

## How to try it
- `npx vitest run tests/ci`
- `node tools/ci/retry.js --label demo --attempts 1 --timeout-seconds 0.5 --kill-after-seconds 0.5 --delay-seconds 0 -- node -e "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)"` prints no sudo line.

## Run metrics
Questions 0 · assumptions logged 3 · review rounds 1 · judge rounds 1 · gate runs 1 · escalations 0 · changed lines 346 (2 files).

## Known limitations and follow-ups
- Add a test for the reap-loop `groupExists` check before sudo. Every group SIGKILL throws EPERM, and the probe after the second refusal throws ESRCH. Assert that sudo is never called. Owner: none yet, so this needs a new task.
- Add a test that cancellation escalates to sudo on the first refusal, without waiting for the reap poll. Owner: none yet, so this needs a new task.
- Remove the duplicate `await run` in the SPEC-04 test in `tests/ci/retry.reap.test.ts`. Fold it into the task above.
- The TASK-1.23 test NITs in the locked retry.sudo.test.ts are already owned by TASK-1.38.

## Lessons for the factory (proposals — not applied)
None. The run was clean: one round of review and one judge round, with no send-backs.
