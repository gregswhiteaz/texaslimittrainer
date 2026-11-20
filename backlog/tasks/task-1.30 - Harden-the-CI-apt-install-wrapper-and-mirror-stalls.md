---
id: TASK-1.30
title: Harden the CI apt install wrapper and mirror stalls
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-19T02:48:00Z'
updated_date: '2026-11-20T04:23:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.29
references:
  - doc-27
parent_task_id: TASK-1
priority: low
type: chore
ordinal: 189000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.29 (doc-27) reviews and judge. apt-lock.js prints /proc/<pid>/comm unsanitised (a process name with a newline could start a GitHub workflow command line); three behaviours lack tests (signal-killed child exit, argument before '--', final-sleep clamp with an uneven wait/poll); devParts mis-decodes the minor when the major is >= 4096 (J-1-01, not reachable on CI disks). The underlying CI failure was a stalled us-east-2 Ubuntu mirror (~5.6 MB in 75 s), which no retry can fix.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a lock holder whose /proc/<pid>/comm contains control characters (e.g. a newline then ::warning::), When apt-lock prints the waiting or ::error:: line, Then control characters [\x00-\x1f\x7f] are replaced so no new workflow-command line can start
- [ ] #2 Given the wrapped command is killed by a signal, an argument appears before '--', or the wait limit is not a multiple of the poll interval, When apt-lock runs, Then tests pin exit 1, a usage error (exit 2) and the final check landing exactly at the limit respectively
- [ ] #3 Given a device whose major number is 4096 or higher, When devParts decodes it, Then major and minor match /proc/locks (or the limitation is documented in the code)
- [ ] #4 Given the Ubuntu mirror is slow, When the Playwright system packages are installed in CI, Then apt uses a bounded Acquire::http::Timeout and Acquire::Retries (or the .deb archives are cached between runs) so a stalled mirror fails or recovers well inside the step timeout
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. apt-lock.js holderText replaces control characters with ? (exported).
2. devParts uses glibc masks; comment that major>=4096 is unreachable.
3. New tests: apt-lock.hardening.test.ts (sanitising, signal-killed exit 1, stray arg exit 2, final-sleep clamp, devParts).
4. tools/ci/apt-network.conf (15 s timeouts, 3 retries) installed by a new unconditional CI step; apt-network.test.ts checks the budget and, on Linux CI, apt-config dump.
5. Branch CI run proves the step and the Linux-only check.

Full spec: doit/TASK-1.30/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: holderText sanitising, glibc devParts masks, apt-network.conf + CI install step, hardening/network tests; gate PASS (Linux-only SPEC-07 pending branch CI)
<!-- SECTION:NOTES:END -->
