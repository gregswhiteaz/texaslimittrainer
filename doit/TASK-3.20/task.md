File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-3.20 - Make-card-tests-catch-painted-colour-and-logo-regressions-in-CI.md

Task TASK-3.20 - Make card tests catch painted colour and logo regressions in CI
==================================================

Status: ○ To Do
Priority: Medium
Type: chore
Ordinal: 184000
Created: 2026-11-18 20:51 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-3 - Play hands at the table
References: doc-20

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 2 total):
└─ TASK-3.5 - Read big-index cards drawn in code [completed]
   └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]

Description:
--------------------------------------------------
Follow-up from TASK-3.5 (doc-20) code review. The card e2e colour checks read the rank/suit group's computed colour rather than the painted path, and the back's logo check doesn't confirm the logo is visible. Both regressions are only caught by the pixel snapshots, which run on macOS only, so Linux CI would miss them. The glyph-fit unit test checks hand-written widths instead of the drawn shapes.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a rank or suit path painted a different colour from its group, When the card e2e runs in CI (Linux), Then the colour check fails
- [ ] #2 Given the card back's logo is hidden (opacity 0, display none or failed to load), When the card e2e runs in CI, Then the logo check fails
- [ ] #3 Given Linux visual baselines generated in the Playwright Docker image, When CI runs the card visual tests, Then they run on Linux instead of being skipped
- [ ] #4 Given the glyph-fit unit test, When a drawn glyph's real bounding box leaves the card, Then the test fails (or the test is removed if the e2e geometry check covers it)

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

