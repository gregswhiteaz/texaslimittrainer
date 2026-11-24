---
id: TASK-9.2
title: Continue to rebuy or leave when I bust with the review open
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-24T12:08:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-9.1
  - TASK-3.11
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-9
priority: high
type: feature
ordinal: 78000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the review's next-hand control to lead me to the rebuy choice when I have busted, so that I can finish reading the review before deciding to rebuy or leave.

Cash games only. When the user's stack is $0 at the end of a hand and the Hand Review panel is open, the Deal next hand control reads Continue, and Continue opens the Rebuy / Leave table dialog from E03-S08. No hand is dealt until the user chooses in that dialog. The sit-and-go equivalent (See results, REQ-008.9) is E05.

## Requirements covered
- REQ-007 (Must): Cash game buy-in and rebuy — In a cash game, every player shall start with a fixed buy-in of 20 big bets; when the user's stack reaches zero, TLH Trainer shall ask the user to Rebuy (another 20 big bets) or Leave table before the next hand.

Covers: REQ-007

## Notes
E05: in a sit-and-go the same control reads See results (REQ-008.9).

Plan key: E09-S06 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a $4/$8 cash hand ends with the user's stack at $0 and the panel open, When the panel is shown, Then its next-hand control reads "Continue" and no "Deal next hand" control is offered [REQ-007.6]
- [x] #2 Given that panel, When the user selects Continue, Then the Rebuy / Leave table dialog opens and no next hand is dealt while it is open [REQ-007.6, REQ-007.2]
- [x] #3 Given the dialog opened from Continue, When the user chooses Rebuy, Then the user's stack is $160 and the next hand is dealt [REQ-007.6]
- [x] #4 Given a cash hand ends with the user's stack at $1 or more and the panel open, When the panel is shown, Then its next-hand control reads "Deal next hand" [REQ-007.6]
- [x] #5 Given the Rebuy / Leave table dialog opened from Continue, When the user chooses Leave table, Then no further hand is dealt and the session is ended, the same outcome as Leave table in the E03-S08 bust dialog (E10-S01 opens the Session Report) [REQ-007.6]
- [x] #6 Given the user's stack is $0 when a reviewed hand ends, When the panel is open, Then the table side shows Continue (to Rebuy/Leave) instead of Deal next hand, using the same held-review state
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [x] #2 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [x] #3 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [x] #4 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [x] #5 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [x] #6 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [x] #7 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [x] #8 No new network requests beyond the app's own files [REQ-058.1]
- [x] #9 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [x] #10 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [x] #11 Story documentation is written and published to Backlog.md
- [x] #12 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Table: on a held review where userBusted(table), the deal-next button reads Continue (same class, ref, position, onDealNext)
2. Continue clears the review and the Out of chips dialog opens; Rebuy / Leave table behave as in TASK-3.11
3. Re-pin locked bust-dialog acceptance test (TASK-3.11) to Continue
4. Tests: render acceptance + e2e seeded bust with review open in Chromium and WebKit; docs

Full spec: doit/TASK-9.2/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-9.1 follow-up (doc-26).

Build: held bust review button reads Continue (same element/handler), opens Out of chips dialog; locked TASK-3.11 test re-pinned; npm test 1206 passed, Playwright 232 passed; gate PASS.

Judge r1 PASS 9/9; live Chromium+WebKit bust/Continue/Rebuy/Leave/Resume; CI 45389035315 green.
<!-- SECTION:NOTES:END -->
