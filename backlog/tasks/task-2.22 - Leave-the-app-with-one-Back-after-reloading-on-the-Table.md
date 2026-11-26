---
id: TASK-2.22
title: Leave the app with one Back after reloading on the Table
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-25T20:08:00Z'
updated_date: '2026-11-26T10:36:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-2.20
references:
  - doc-146
parent_task_id: TASK-2
priority: low
ordinal: 250000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-2.20 (doc-146). After a reload while on the Table, the earlier page load's Table history entry stays in history, so from Home it takes two Backs to leave the app (stepping back from that entry reloads the page). Pre-existing; outside TASK-2.20's ACs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a reload while on the Table, then Resume and Home, When the user presses Back from Home, Then one Back leaves the app (or the extra entry is replaced so no stale Table entry remains), with no page reload on the way
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. openTable replaces instead of pushing when the current entry already has a Table key
2. e2e reload-history spec (Chromium + WebKit): reload/Resume/Home one Back; Back on Table still pauses; End session and start
3. Locked history specs pass unchanged
4. docs/ui/navigation.md: correct the reload paragraphs (no page reload happens)

Full spec: doit/TASK-2.22/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Spec finding: stepping back from the stale entry does not reload the page (pushState entries share the document); the first Back from Home just does nothing visible. TASK-2.20/doc-146 wording was wrong; docs/ui/navigation.md is corrected in this story.

Build: openTable replaces instead of pushing when a Table entry is current; new e2e reload-history (fails on old code, passes 3x repeat); e2e 389 passed; gate PASS
<!-- SECTION:NOTES:END -->
