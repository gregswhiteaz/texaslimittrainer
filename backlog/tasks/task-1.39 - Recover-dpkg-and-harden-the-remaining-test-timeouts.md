---
id: TASK-1.39
title: Recover dpkg and harden the remaining test timeouts
status: Done
assignee:
  - '@claude'
created_date: '2026-11-19T19:55:00Z'
updated_date: '2026-11-22T03:27:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.23
references:
  - doc-31
documentation:
  - doc-43
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
- [x] #1 Given retry killed an apt attempt in the Playwright system-dependencies step, When the next attempt starts, Then sudo dpkg --configure -a runs first and an interrupted dpkg no longer fails the install
- [x] #2 Given tests/support/sandbox.ts runInSandbox times out, When it stops the command, Then the whole process group is killed (via runProcessGroup), with a test using a grandchild that ignores SIGTERM
- [x] #3 Given main CI run #73 needed 3 attempts (240 s, 240 s, then 164.5 s) for Playwright system dependencies, When the install step's attempt timeout and step timeout are re-tuned (or the apt packages are cached between runs), Then a typical install finishes within its first attempt and the step's total stays under its timeout-minutes
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

Build: dpkg recovery in apt-lock (fake-sudo tests), runInSandbox kills the process group via process-group-cli, .deb archive cache steps in ci.yml (limits unchanged); gate PASS

Judge R1 PASS 9/9. Cache proven: cold run 44831732531 saved 186 .debs; warm run 44832759000 'Need to get 0 B/126 MB', attempt 1 in 33.3 s.

Follow-ups (Step 6a): TASK-1.47 verify + prune cached .debs; TASK-1.48 apt-lock/sandbox polish. Cold-cache slow-mirror limit stays with the user's parked CI container-image plan (memory: project-ci-speed-plan; user deferred CI restructuring until m-0 is done).

Locked test unlocked for TASK-1.50 Q-6 (user-approved CI split).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
AC#1: apt-lock.js now runs sudo -n dpkg --configure -a when dpkg's updates journal is non-empty (warns and continues on failure). AC#2: runInSandbox kills the whole process group on timeout via a JSON CLI around runProcessGroup; the test uses a grandchild that ignores SIGTERM. AC#3: apt .deb archives are cached between runs with actions/cache (Q-1 answer a); retry and timeout limits are unchanged.
Verification: npm test 98 files, 355 passed, 6 skipped; lint and typecheck clean; judge PASS. Cold CI run 44831732531 filled the cache (186 debs, 126 MB). Warm run 44832759000 had 'Need to get 0 B/126 MB' and succeeded in attempt 1 in 33.3 s.
Review: spec section 8 wrongly claims apt hash-checks cached .debs. apt trusts name and size. The safeguard is the ref-scoped cache write. Residual risk is persistence if code in a main job plants a .deb.
Follow-ups: (1) MEDIUM verify restored .deb sha256 against the signed index and/or save the cache right after Collect; (2) prune old .debs carried by restore-keys; (3) LOW apt-lock warning when sudo cannot start, plus two NITs; (4) cold-cache slow-mirror limit goes to the parked CI container-image plan.
<!-- SECTION:FINAL_SUMMARY:END -->
