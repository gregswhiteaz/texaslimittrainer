---
id: TASK-1.29
title: Make the CI system-package install survive a busy apt lock
status: Done
assignee:
  - '@claude'
created_date: '2026-11-19T02:21:00Z'
updated_date: '2026-11-19T02:48:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.19
references:
  - doc-11
  - doc-26
documentation:
  - doc-27
parent_task_id: TASK-1
priority: high
type: chore
ordinal: 188000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the TASK-9.1 judge (2026-11-19): CI run 44441353985 attempt 1 and main's run 44434902016 both failed at 'Install Playwright system dependencies' because the Ubuntu runner's dpkg lock was held by another apt-get (unattended upgrades at boot). apt exits 100 in seconds, so TASK-1.19's three retries (10 s apart) all hit the same lock. A re-run fixed both, but every push risks a false red.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given another apt process holds the dpkg lock when the step starts, When the system-package install runs, Then it waits for the lock to clear (or uses apt's lock timeout) for up to a set limit before installing, instead of failing with exit 100
- [x] #2 Given the lock never clears within the limit, When the step gives up, Then it fails with a clear ::error:: line naming the lock, within the step's existing timeout
- [x] #3 Given the workflow test, When it checks the install step, Then it asserts the lock handling is present
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. tools/ci/apt-lock.js (Node built-ins only): reads /proc/locks and matches the device+inode of /var/lib/dpkg/lock-frontend, /var/lib/dpkg/lock, /var/lib/apt/lists/lock and /var/cache/apt/archives/lock; waits up to --wait-seconds (150), polling every 2 s; then runs the command and passes its exit code through; on timeout prints ::error::apt lock <path> is still held by process <pid> (<name>) after 150 s; not running <cmd> and exits 1; no /proc/locks (macOS) logs a note and runs straight away.
2. .github/workflows/ci.yml: both Playwright install steps run retry.js -- node tools/ci/apt-lock.js --wait-seconds 150 -- npx playwright …; retry settings and the step and job timeouts unchanged.
3. tests/ci/workflow.test.ts (TASK-1.19 acceptance test): one-line additive edit to the expected run line, plus a new test that asserts the lock handling (AC#3).
4. tests/ci/apt-lock.test.ts: fake /proc/locks cases on macOS; a Linux-CI-only test holds a real flock and checks wait, release and timeout.
5. README CI section: one sentence.

Full spec: doit/TASK-1.29/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Diagnosis corrected during spec (2026-11-19): the dpkg lock was held by attempt 1's own orphaned apt-get (timed out on a stalled mirror; retry.js's kill got EPERM under sudo), not by unattended-upgrades. Fix waits for the lock inside every retry attempt.

Cross-story change (orchestrator decision on precedent, qa.md Q-1): one additive line in tests/ci/workflow.test.ts:102-104 (TASK-1.19's acceptance test) plus a new lock-handling test. No assertion removed or weakened.

Build: tools/ci/apt-lock.js (reads /proc/locks, waits up to 150 s per attempt, ::error:: names lock and holder); both install steps wrapped inside retry; workflow test one-line edit + new AC#3 test; Linux-CI-only real-flock test (kills flock's process group); README; ~560 lines vs 400 (warn); gate PASS.

CI run 44445933036 (head 119bdc0): success first push; the Linux real-flock test ran and passed (270/270, 0 skipped); install-deps ran through apt-lock in 48 s with no lock held. Judge round 1: PASS 12/12, no blocking. Follow-ups (Step 6a): created TASK-1.30 (sanitise comm, three test gaps, devParts high majors, mirror stall timeouts/cache); AC added to TASK-1.23 (really stop a timed-out sudo'd apt-get).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added tools/ci/apt-lock.js, which runs inside every retry attempt of both Playwright install steps. It reads /proc/locks, waits up to 150 s for the apt/dpkg locks, then runs the install. If a lock never clears it prints an ::error:: line naming the lock and its holder and exits 1. Diagnosis corrected: the holder was attempt 1's own orphaned apt-get (retry.js's kill got EPERM under sudo), not unattended-upgrades. Verified so far: build gate PASS (268 tests passed, 2 Linux-only skipped), review round 1 clean. Judge and green branch CI are pending. Assumptions A-1..A-7 to review. Q-1: a one-line additive edit to TASK-1.19's workflow test plus a new AC#3 test, on precedent; the user may veto it. Risks and follow-ups: retry.js should stop a timed-out sudo'd apt-get (TASK-1.23); slow-mirror stalls remain; sanitise comm output; three MINOR test gaps. Size was 563 lines / 5 files vs 400 (warn).
<!-- SECTION:FINAL_SUMMARY:END -->
