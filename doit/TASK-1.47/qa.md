# TASK-1.47 — Questions and answers (autopilot run, 2026-11-20)

## Q-1 — May this task widen the pin regex at tests/ci/workflow.test.ts:169 (TASK-1.7, locked)?
AC#2 needs actions/cache/restore and actions/cache/save sub-action pins, which the one-slash regex rejects.
Options: (a) widen only that regex to `[\w.-]+\/[\w.-]+(\/[\w.-]+)?@[0-9a-f]{40} # v\d+\.\d+\.\d+$` (still full SHA + version comment) [Recommended]; (b) keep combined actions/cache (fails AC#2); (c) local composite action (also rejected by the regex).
**Answer: auto-accepted (recommended)** — (a). Recorded with `doit.py unlock TASK-1.7 …`.

## D-2 — TASK-1.39's tests/ci/apt-archives-cache.test.ts pins the old cache wiring this task replaces
**Answer: auto-accepted (recommended)** — unlock under TASK-1.39 and update it.
