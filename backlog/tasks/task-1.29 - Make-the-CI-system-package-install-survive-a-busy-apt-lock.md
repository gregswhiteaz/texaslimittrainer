---
id: TASK-1.29
title: Make the CI system-package install survive a busy apt lock
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-19T02:21:00Z'
updated_date: '2026-11-19T02:33:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.19
references:
  - doc-11
  - doc-26
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
- [ ] #1 Given another apt process holds the dpkg lock when the step starts, When the system-package install runs, Then it waits for the lock to clear (or uses apt's lock timeout) for up to a set limit before installing, instead of failing with exit 100
- [ ] #2 Given the lock never clears within the limit, When the step gives up, Then it fails with a clear ::error:: line naming the lock, within the step's existing timeout
- [ ] #3 Given the workflow test, When it checks the install step, Then it asserts the lock handling is present
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
<!-- SECTION:NOTES:END -->
