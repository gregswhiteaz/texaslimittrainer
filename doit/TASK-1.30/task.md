File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.30 - Harden-the-CI-apt-install-wrapper-and-mirror-stalls.md

Task TASK-1.30 - Harden the CI apt install wrapper and mirror stalls
==================================================

Status: ○ To Do
Priority: Low
Type: chore
Ordinal: 189000
Created: 2026-11-19 02:48 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: doc-27

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 4 total):
└─ TASK-1.29 - Make the CI system-package install survive a busy apt lock [completed]
   └─ TASK-1.19 - Retry the stalled Playwright system-dependency install in CI [completed]
      └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
         └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]

Description:
--------------------------------------------------
Follow-up from TASK-1.29 (doc-27) reviews and judge. apt-lock.js prints /proc/<pid>/comm unsanitised (a process name with a newline could start a GitHub workflow command line); three behaviours lack tests (signal-killed child exit, argument before '--', final-sleep clamp with an uneven wait/poll); devParts mis-decodes the minor when the major is >= 4096 (J-1-01, not reachable on CI disks). The underlying CI failure was a stalled us-east-2 Ubuntu mirror (~5.6 MB in 75 s), which no retry can fix.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a lock holder whose /proc/<pid>/comm contains control characters (e.g. a newline then ::warning::), When apt-lock prints the waiting or ::error:: line, Then control characters [\x00-\x1f\x7f] are replaced so no new workflow-command line can start
- [ ] #2 Given the wrapped command is killed by a signal, an argument appears before '--', or the wait limit is not a multiple of the poll interval, When apt-lock runs, Then tests pin exit 1, a usage error (exit 2) and the final check landing exactly at the limit respectively
- [ ] #3 Given a device whose major number is 4096 or higher, When devParts decodes it, Then major and minor match /proc/locks (or the limitation is documented in the code)
- [ ] #4 Given the Ubuntu mirror is slow, When the Playwright system packages are installed in CI, Then apt uses a bounded Acquire::http::Timeout and Acquire::Retries (or the .deb archives are cached between runs) so a stalled mirror fails or recovers well inside the step timeout

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

