---
id: TASK-1.39
title: Recover dpkg and harden the remaining test timeouts
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-19T19:55:00Z'
updated_date: '2026-11-20T22:42:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.23
references:
  - doc-31
parent_task_id: TASK-1
priority: low
type: chore
ordinal: 199000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.23 scope concerns: killing apt mid-install can leave dpkg interrupted for the next attempt, and runInSandbox still has the spawnSync-timeout weakness fixed for the speed-limits test.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given retry killed an apt attempt in the Playwright system-dependencies step, When the next attempt starts, Then sudo dpkg --configure -a runs first and an interrupted dpkg no longer fails the install
- [ ] #2 Given tests/support/sandbox.ts runInSandbox times out, When it stops the command, Then the whole process group is killed (via runProcessGroup), with a test using a grandchild that ignores SIGTERM
- [ ] #3 Given main CI run #73 needed 3 attempts (240 s, 240 s, then 164.5 s) for Playwright system dependencies, When the install step's attempt timeout and step timeout are re-tuned (or the apt packages are cached between runs), Then a typical install finishes within its first attempt and the step's total stays under its timeout-minutes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. apt-lock.js: when /var/lib/dpkg/updates has entries, run sudo -n dpkg --configure -a before the install (warn on failure).
2. runInSandbox kills the whole process group via a small runProcessGroup CLI; returns timedOut.
3. CI: cache .deb archives (actions/cache, key = Playwright version + month): restore, copy into /var/cache/apt/archives before the installs, collect after. Limits unchanged; no locked-test edits.
4. Branch CI run 1 saves the cache (SPEC-08), run 2 restores it and installs in attempt 1 (SPEC-09).
Known limitation: a cold cache on a slow mirror can still fail (Q-1).

Full spec: doit/TASK-1.39/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC#3 added 2026-11-19 from CI run #73 (main 769293f): TASK-1.23's sudo kill worked live twice, but attempts 1-2 hit the 240 s limit.

Q-1 (user): cache the .deb archives; Q-2 moot.
<!-- SECTION:NOTES:END -->
