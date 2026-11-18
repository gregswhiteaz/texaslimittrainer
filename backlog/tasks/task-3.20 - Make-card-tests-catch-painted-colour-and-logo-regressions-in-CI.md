---
id: TASK-3.20
title: Make card tests catch painted colour and logo regressions in CI
status: To Do
assignee: []
created_date: '2026-11-18T20:51:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-3.5
references:
  - doc-20
parent_task_id: TASK-3
priority: medium
type: chore
ordinal: 184000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-3.5 (doc-20) code review. The card e2e colour checks read the rank/suit group's computed colour rather than the painted path, and the back's logo check doesn't confirm the logo is visible. Both regressions are only caught by the pixel snapshots, which run on macOS only, so Linux CI would miss them. The glyph-fit unit test checks hand-written widths instead of the drawn shapes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a rank or suit path painted a different colour from its group, When the card e2e runs in CI (Linux), Then the colour check fails
- [ ] #2 Given the card back's logo is hidden (opacity 0, display none or failed to load), When the card e2e runs in CI, Then the logo check fails
- [ ] #3 Given Linux visual baselines generated in the Playwright Docker image, When CI runs the card visual tests, Then they run on Linux instead of being skipped
- [ ] #4 Given the glyph-fit unit test, When a drawn glyph's real bounding box leaves the card, Then the test fails (or the test is removed if the e2e geometry check covers it)
<!-- AC:END -->
