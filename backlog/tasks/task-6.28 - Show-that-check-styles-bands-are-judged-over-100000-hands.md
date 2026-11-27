---
id: TASK-6.28
title: Show that --check-styles bands are judged over 100,000 hands
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-26T21:01:00Z'
updated_date: '2026-11-27T07:11:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-6.24
parent_task_id: TASK-6
priority: medium
ordinal: 261000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From TASK-6.24 (decision: option B, Q-1). REQ-027's fit criterion judges each bot style's VPIP, PFR and aggression over 100,000 hands, but --check-styles gives no hint of that, so 2,000-hand runs fail for sample-noise reasons that look like tuning problems (TASK-6.24 measured 20/20 all-TAG and 12/20 Mixed 2k runs failing, none from TAG aggression: rare mixed spots used only one way, Rock VPIP 7.7–7.9% vs floor 8%, TAG PFR 13.7–13.9% vs floor 14%, Rock aggression 56.1–56.2% vs ceiling 55%). Update the --check-styles help line (src/playtest/cli.ts USAGE), docs/stats/style-stats.md ('In the playtest CLI') and the USAGE assertions in tests/playtest/cli.test.ts. This story's spec decides whether to also print a note when --check-styles runs with fewer than 100,000 hands. No band, bot or advice changes. Any speed or scale check goes in npm run test:slow, never in npm test or CI.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a user reads npm run playtest -- --help, When they read the --check-styles line, Then it says the bands are judged over 100,000 hands and that shorter runs can fail from sample noise
- [x] #2 Given a reader opens docs/stats/style-stats.md, When they read the playtest CLI section, Then it states the 100,000-hand run length REQ-027 uses and the sample-noise failures shorter runs can show (mixed spots used one way, stats near a band edge)
- [x] #3 Given npm test runs, When the USAGE assertions in tests/playtest/cli.test.ts check the help text, Then they pass with the new --check-styles wording and no check of 100,000-hand scale is added to npm test or CI
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Update --check-styles USAGE line in src/playtest/cli.ts (100,000-hand judging, sample noise)
2. Add the docs paragraph to docs/stats/style-stats.md
3. Update USAGE assertions in tests/playtest/cli.test.ts; no 100k check in npm test

Full spec: doit/TASK-6.28/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: --check-styles help line + docs paragraph (100,000-hand judging, sample noise); cli.test USAGE assertions updated; gate PASS
<!-- SECTION:NOTES:END -->
