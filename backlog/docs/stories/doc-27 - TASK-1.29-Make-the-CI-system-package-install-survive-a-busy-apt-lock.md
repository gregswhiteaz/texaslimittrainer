---
id: doc-27
title: 'TASK-1.29: Make the CI system-package install survive a busy apt lock'
type: other
created_date: '2026-11-19T02:42:00Z'
updated_date: '2026-11-19T02:42:00Z'
---
# TASK-1.29: Make the CI system-package install survive a busy apt lock

Status: In review (judge and CI pending) · Completed: pending · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: n/a (follow-up to TASK-1.19 / doc-11) · Branch: doit/TASK-1.29

## What was asked
Two CI runs (44441353985, 44434902016) failed at "Install Playwright system dependencies". Attempts 2 and 3 of `tools/ci/retry.js` hit `E: Could not get lock /var/lib/dpkg/lock-frontend` and apt exited 100 within seconds. Acceptance criteria:
1. When another apt process holds the lock at step start, the install waits for it (up to a limit) instead of failing with exit 100.
2. If the lock never clears, the step fails with a clear `::error::` line naming the lock, inside the step's existing timeout.
3. The workflow test asserts the lock handling is present.

Spec: doit/TASK-1.29/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Wait up to 150 s per attempt, polling every 2 s | yes | Fits in retry's 240 s attempt, leaving 90 s to install (green installs take 32-45 s). Worst case the step ends at about 470 s, under the 780 s step timeout | Change `--wait-seconds` in ci.yml and the budget assertion in the workflow test |
| A-2 | Wrap both install steps (cache-miss `install --with-deps`, cache-hit `install-deps`) | yes | Both run apt via sudo | Remove the prefix from one step |
| A-3 | "Lock held" = `/proc/locks` has an entry whose device and inode match one of the four apt/dpkg lock files; a missing file counts as free | yes | `/proc/locks` is world-readable, needs no sudo or extra tools, and shows real locks and the holder pid | Use `sudo -n fuser` or `lsof` |
| A-4 | No `/proc/locks` (non-Linux): log one note and run the command without waiting | yes | The workflow only runs on ubuntu-24.04; local macOS runs should not fail | Fail with a usage error |
| A-5 | When the wait gives up, exit 1 without running the command; retry.js counts a failed attempt and the next attempt waits again | yes | Gives a slow orphan more time; a distinct final exit code would need a retry.js change (out of scope) | Add a distinct exit code and teach retry.js |
| A-6 | The command's exit code passes through; a signal-killed child gives exit 1; the child is non-detached so retry's group kill reaches it | yes | retry.js already retries any non-zero exit | Re-raise the signal |
| A-7 | Log text uses the `apt-lock:` prefix and the `::error::` convention of retry.js | yes | Consistency | Plain lines |

## Clarifications and decisions
No questions were asked of the user.

**Diagnosis correction.** The task description blamed unattended-upgrades at boot. The CI logs show the holder was attempt 1's own orphaned `apt-get`. Attempt 1 stalled on a slow mirror and timed out. retry.js's group kill got EPERM against the root `apt-get` running under sudo, so it never died. The holder is named `apt-get`, not `unattended-upgr`. Attempts 2 and 3 then met the orphan's lock.

**D-1: design.** Wrap the install command inside every retry attempt, not in a step before it. A wait before the step would miss the orphan case. Setting apt's own lock timeout (`DPkg::Lock::Timeout`) would give no `::error::` naming the lock (AC#2). Stopping unattended-upgrades does not help with the orphan. Killing the orphan was rejected because interrupting apt or dpkg can leave dpkg in an interrupted state.

**Q-1 (orchestrator decision, not asked of the user).** The expected run string in TASK-1.19's locked `tests/ci/workflow.test.ts` must gain the new prefix, so the test was edited. It is a one-line additive change plus a new test for AC#3, and no assertion was removed. Precedent: TASK-2.1 Q-3, TASK-3.2 Q-1, TASK-3.3 D-5, TASK-3.4 D-2. The user was told and may veto it.

## What was built
- `tools/ci/apt-lock.js` (new, Node built-ins only). Run as `node tools/ci/apt-lock.js --wait-seconds 150 -- <command>`.
  - It reads `/proc/locks` on every poll. It matches held locks against the four lock files by device and inode: `/var/lib/dpkg/lock-frontend`, `/var/lib/dpkg/lock`, `/var/lib/apt/lists/lock`, `/var/cache/apt/archives/lock`.
  - The holder's name comes from `/proc/<pid>/comm`.
  - While a lock is held it logs `apt-lock: waiting up to 150 s for <path> (held by process <pid> (<name>))`.
  - Once free, it runs the command and passes its exit code through.
  - On timeout it prints `::error::apt lock <path> is still held by <holder> after 150 s; not running <cmd>` and exits 1. Usage errors exit 2.
  - Exports `parseProcLocks`, `devParts`, `findHeldLock` and `waitForAptLocks`. Test-only flags are `--lock`, `--proc-locks` and `--poll-seconds`.
- `.github/workflows/ci.yml`: both install run lines now read `node tools/ci/retry.js … -- node tools/ci/apt-lock.js --wait-seconds 150 -- npx playwright …`. retry.js and its flags are unchanged.
- `tests/ci/apt-lock.test.ts` (new) and `tests/ci/workflow.test.ts` (one-line edit plus new test).
- `README.md`: CI install-retry sentence extended.

Builder note: in the Linux-only real-lock test, `flock` is spawned detached and killed as a whole process group. Its `sleep` child inherits the locked descriptor and would otherwise keep the lock after `flock` dies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | CLI runs the command at once when no lock is held | pass | tests/ci/apt-lock.test.ts |
| SPEC-02 | AC#1 | Waits for a held lock to clear, then runs the command once | pass | same |
| SPEC-03 | AC#2 | Never-clearing lock gives an `::error::` line naming lock and holder, and the command does not run | pass | same |
| SPEC-04, 05 | AC#3 | Workflow test asserts the wrapper sits inside each retry attempt and the 150 s wait fits the step budget; the retry timeout test is kept | pass | tests/ci/workflow.test.ts |
| SPEC-06, 07 | AC#1, AC#2 | Unit tests of `/proc/locks` parsing, device and inode matching, and the fake-clock wait loop (76 checks) | pass | apt-lock.test.ts |
| SPEC-08, 09 | AC#1, AC#2 | Missing `/proc/locks` runs without waiting; invalid arguments are rejected without running the command | pass | same |
| SPEC-10 | AC#1, AC#2 | Real `flock` on Linux CI only | skipped on macOS; pending CI | same |
| SPEC-11 | AC#1 | Green CI run on the branch | pending (needs push) | CI |
| SPEC-12 | docs | README sentence | done | README.md |

- Build gate run 1: PASS. `npm test`: 73 files, 268 passed, 2 skipped (the Linux-only sudo and real-lock tests). Typecheck and lint pass. A manual run on macOS showed the waiting line and then the `::error::` line, exit 1. With the lock line removed it ran the command.
- Judge: pending. CI: pending.

## Review
Round 1: no blocking findings from either reviewer.
- Code review: the device encoding matches on the ext4 runner. 15 mutants were run and 10 were killed.
- Security review: no reachable injection.

### Non-blocking review notes (deliberately not fixed)
- Security MINOR: control characters in `/proc/<pid>/comm` are printed unsanitised.
- Code MINOR: exit code when the child is killed by a signal is untested.
- Code MINOR: an argument placed before `--` is untested.
- Code MINOR: the clamp in the final lock check is untested.
- NIT: high major bits in the device number are untested.
- NIT: a redundant `->` guard.
- NIT: the `<=` mutant hangs rather than fails.

## How to try it
- `npx vitest run tests/ci`
- Manual: write a fake proc-locks file, then run `node tools/ci/apt-lock.js --wait-seconds 3 --lock <file> --proc-locks <fake> -- echo hi`.

## Run metrics
Questions asked: 0 · assumptions logged: 7 · review rounds: 1 · judge rounds: 0 so far (pending) · gate runs: 1 · escalations: 0 · changed lines: 563 across 5 files vs budget 400 (warn band).

## Known limitations and follow-ups
- A timed-out attempt's orphaned apt-get keeps running. The wrapper only waits for it, because it does not stop it.
- Follow-ups:
  - Make retry.js stop a timed-out sudo'd apt-get, which currently gets EPERM (owner TASK-1.23).
  - Add apt `Acquire::http::Timeout`/`Retries` or cache the .debs so the slow us-east-2 mirror stalls stop causing timeouts (no owner).
  - Strip `[\x00-\x1f\x7f]` from the `/proc/<pid>/comm` text before printing it (no owner).
  - Add a test for the exit code when the child is killed by a signal, one for an argument placed before `--`, and one for the final-check clamp (no owner).

## Lessons for the factory (proposals — not applied)
- The task description's diagnosis (unattended-upgrades) was wrong, and the logs corrected it. Proposal: for CI-failure follow-ups, have the task writer attach the failing log excerpt, and have the spec stage verify the cause from the logs before designing.
- The size came out at 563 lines against a 400 budget, mostly tests and formatting. Proposal: budget the tests of a CLI helper separately, or set the line budget at about 550 for that kind of task.
