---
id: TASK-13.3
title: Stop dealing when the last hand could not be saved
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-26T08:56:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-3.9
  - TASK-3.10
  - TASK-10.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-13
priority: medium
type: feature
ordinal: 101000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to be told when the last hand could not be saved before any new hand is dealt, so that I never keep playing while my history is silently lost.

Applies to the hand-record write (E03-S09) and the session-state write after each hand (E03-S11). If either write fails (e.g. QuotaExceededError, transaction abort), no new hand is dealt and a dialog states that the last hand could not be saved, offering Retry and Leave table. Retry repeats the failed write(s); on success the next hand is dealt as usual, on failure the message stays. Leave table ends the session as Leave table does elsewhere (REQ-004.5, E10-S01). Tests use a test build whose storage adapter can be made to fail.

## Requirements covered
- REQ-053 (Should): Storage capacity and failure — TLH Trainer shall keep at least 100,000 hand records, and if a storage write fails it shall stop dealing and tell the user that history could not be saved.

Covers: REQ-053

## Notes
Report writes on Leave table may also fail; if so, show the same message rather than a report with missing data.

Plan key: E13-S03 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a test build where the write of hand 9's record fails with a quota error, When hand 9 ends, Then hand 10 is not dealt and a message states that the last hand could not be saved, with Retry and Leave table [REQ-053.2]
- [ ] #2 Given a test build where the session-state write after hand 9 fails, When hand 9 ends, Then hand 10 is not dealt and the same message with Retry and Leave table is shown [REQ-053.2]
- [ ] #3 Given the message is shown and storage writes succeed again, When the user chooses Retry, Then hand 9's record and the session state are stored and hand 10 is dealt [REQ-053.2]
- [ ] #4 Given the message is shown and storage still fails, When the user chooses Retry, Then no hand is dealt and the message with Retry and Leave table is shown again [REQ-053.2]
- [ ] #5 Given the message is shown, When the user chooses Leave table, Then the session ends, no further hand is dealt and the Leave table flow runs [REQ-053.2]
- [ ] #6 Given the message is shown for 60 seconds with no user input, When the table is observed, Then no hand has been dealt and no bot has acted [REQ-053.2]
- [ ] #7 Given a hand whose record write failed because a decision grade failed (TASK-9.10), When the user chooses Retry, Then the grades are requested again before the hand record is written, and on success the review panel opens and dealing resumes
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
AC added from TASK-9.10 follow-up (doc-157)
<!-- SECTION:NOTES:END -->
