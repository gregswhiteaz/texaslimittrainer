---
id: TASK-1.47
title: Verify and prune the cached apt archives
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-20T23:06:00Z'
updated_date: '2026-11-20T23:26:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.39
references:
  - doc-43
parent_task_id: TASK-1
priority: medium
type: chore
ordinal: 208000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.39 security review and judge (J-1-01, J-1-03): apt trusts a .deb already in /var/cache/apt/archives on name and size, not hash, so a .deb planted in the Actions cache by code in a main job would be installed as root on later runs for up to a month. restore-keys also carries old .debs forward month to month.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a restored .deb whose sha256 does not match the signed index (apt-cache show <pkg>=<ver> after apt-get update), When the restore step runs, Then that file is discarded before reaching /var/cache/apt/archives, and a test proves a tampered file is dropped
- [ ] #2 Given the job runs later steps (tests, E2E) after the installs, When the apt cache is saved, Then it is saved right after Collect (actions/cache/restore + actions/cache/save) so later steps cannot add files to it
- [ ] #3 Given last month's cache is restored via restore-keys, When Collect runs, Then .debs no longer needed by the current install are not carried forward (e.g. apt-get autoclean or collect only what this install used)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. tools/ci/apt-archives.js restore: copy a cached .deb only if its sha256 matches apt-cache show (fresh signed index) for the same name/version/arch.
2. collect: empty the cache dir, keep only .debs dpkg reports installed at that exact version.
3. ci.yml: Update apt index step (retry+apt-lock), actions/cache/restore + actions/cache/save right after Collect.
4. Widen TASK-1.7 pin regex for sub-action pins (Q-1); update TASK-1.39 cache test.
5. Branch CI run proves restore/verify on ubuntu-24.04 (SPEC-07).

Full spec: doit/TASK-1.47/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Autopilot Q-1 auto-accepted: widen TASK-1.7 pin regex for sub-action pins (still full SHA + version); TASK-1.39 cache test updated. Both unlocks recorded under their owners.
<!-- SECTION:NOTES:END -->
