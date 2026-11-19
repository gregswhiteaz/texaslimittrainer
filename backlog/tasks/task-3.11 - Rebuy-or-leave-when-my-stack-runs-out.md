---
id: TASK-3.11
title: Rebuy or leave when my stack runs out
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-19T01:10:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-3.4
  - TASK-3.10
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-3
priority: high
type: feature
ordinal: 67000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to be offered Rebuy or Leave table when my stack reaches $0, so that I can keep practising after a bad run or stop on my own terms.

Cash games only. When the user's stack is $0 at the end of a hand, a dialog offers Rebuy and Leave table and no further hand is dealt until the user chooses. Rebuy sets the stack to the buy-in (20 big bets, $160 at $4/$8) and the session continues; the session record (E03-S11) counts total rebuys; showing them in the session result is E10-S01. The user cannot add chips while the stack is above $0: there is no rebuy or add-chips control at any other time. Leave table from this dialog stops dealing and hands over to the Leave table flow; ending the session and opening the Session Report is E10-S01. When the Hand Review panel is open on a bust, E09 changes Deal next hand to Continue, which opens this dialog (REQ-007.6).

## Requirements covered
- REQ-007 (Must): Cash game buy-in and rebuy — In a cash game, every player shall start with a fixed buy-in of 20 big bets; when the user's stack reaches zero, TLH Trainer shall ask the user to Rebuy (another 20 big bets) or Leave table before the next hand.

Covers: REQ-007

## Notes
E10-S01: verify the rebuy count from the session record appears in the session result (REQ-007.3), and that Leave table from the bust dialog ends the session and opens the Session Report (REQ-004.5).

Plan key: E03-S08 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the user's stack is $0 at the end of a $4/$8 cash hand, When the result is shown, Then a dialog offers Rebuy and Leave table and no next hand is dealt while the dialog is open, even after 1.5 s [REQ-007.2]
- [ ] #2 Given the bust dialog, When the user chooses Rebuy, Then the user's stack is $160, the next hand is dealt and the session's rebuy count increases by 1 [REQ-007.3]
- [ ] #3 Given a user who rebought twice in a session, When the session record is read after the next completed hand, Then its rebuy count is 2 [REQ-007.3]
- [ ] #4 Given the bust dialog, When the user chooses Leave table, Then the dialog closes and no further hand is dealt, even after 1.5 s [REQ-007.2]
- [ ] #5 Given the user's stack is $1 or more, When the Table screen is shown at any moment, Then no rebuy or add-chips control is offered [REQ-007.4]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [ ] #2 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [ ] #3 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [ ] #4 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [ ] #5 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [ ] #6 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [ ] #7 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [ ] #8 No new network requests beyond the app's own files [REQ-058.1]
- [ ] #9 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [ ] #10 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [ ] #11 Story documentation is written and published to Backlog.md
- [ ] #12 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-3.4 Q-4 interim top-up to $160 must be removed once this and the other all-in/rebuy stories land: tracked as TASK-3.21.
<!-- SECTION:NOTES:END -->
