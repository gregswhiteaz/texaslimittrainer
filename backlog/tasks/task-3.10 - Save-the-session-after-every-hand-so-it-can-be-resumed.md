---
id: TASK-3.10
title: Save the session after every hand so it can be resumed
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-21T06:54:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-3.9
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-3
priority: high
type: chore
ordinal: 64000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want my session state saved after every completed hand, so that closing the app never costs me more than the hand in progress.

Enabler (user-visible through E02 Resume). Creates the session record when the table starts (session id, game type, table size, stake, line-up name and seat styles from the session configuration, E06-S07; speed) and updates it after every completed hand with seats (bot ids, names, styles), stacks, dealer button position, hand count, rebuy count and SNG level. Resume (REQ-004.2/004.3) and the Home Resume entry are E02; this story guarantees the stored state they read. An unfinished hand is never written.

## Requirements covered
- REQ-052 (Must): Local persistence — TLH Trainer shall store settings, last configuration, sessions, hand records and session reports in the browser's IndexedDB, writing each hand record when its hand ends.

Covers: REQ-052

## Notes
E02 resumes from this state (REQ-004.2, 004.3) and shows hands played on Home; E05 adds the SNG level and finishing data; E10 discards 0-hand sessions (REQ-044.8).

Plan key: E03-S11 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a session at hand 10, When hand 10 completes, Then the stored session holds hand count 10 and the stacks, seats, styles, line-up name and dealer button exactly as at the end of hand 10 [REQ-052.3]
- [ ] #2 Given the browser process is killed in the middle of hand 11, When the stored session is read, Then it equals the state at the end of hand 10 and no record exists for hand 11 [REQ-052.3]
- [ ] #3 Given a session started with an edited line-up, When the session record is read, Then its line-up name is Custom and it lists every seat's style [REQ-052.3]
- [ ] #4 Given a seat whose bot was replaced after hand 5, When the session is read after hand 5, Then that seat holds the new bot's id, name, style and $160 stack [REQ-052.3]
- [ ] #5 Given a stored SessionConfig is loaded to resume a session, When it is validated, Then assertSessionConfig throws RangeError unless there is exactly one user seat equal to userSeat, players equals seats.length, button is one of the seats and every value is known — so a corrupt config can never show a bot's cards to the user (REQ-025)
- [ ] #6 Given a restored session's stakes and stacks, When they are loaded, Then they pass the same safe-integer and pot-bound rules createHand applies before any table is built
- [ ] #7 Given restored session JSON whose seat, button or replay-code value is an object (e.g. {"toString":1}) or an array, When it is validated, Then it is rejected with a RangeError before reaching createHand or shuffledDeck (no native TypeError, no array coerced into a valid replay code)
- [ ] #8 Given restored session JSON whose seats list has gaps or non-object entries, When it is restored, Then a RangeError is raised (e.g. 'Invalid hand config') rather than a TypeError
- [ ] #9 Given an in-app Partial session config, When resolveSessionConfig merges it with defaults, Then the result always passes assertSessionConfig (e.g. players, seats, userSeat and button stay consistent), with a test for a partial override that would otherwise be inconsistent
- [ ] #10 Given a saved session holding an in-progress hand (HandState, including allIn, stack and contribution fields), When it is restored, Then the state is validated (e.g. checkState) before any action is applied and an invalid state is rejected
- [ ] #11 Given a saved session whose stored actions are replayed on restore, When an action is not a well-formed {seat, type, amount} object, Then restore rejects it before calling applyAction
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
AC added from TASK-2.1 follow-up (doc-23).

AC added from TASK-1.21 follow-up (doc-29).

AC added from TASK-1.32 follow-ups (doc-41): security MINOR String() coercion, code MINOR/judge LOW sparse seats, shuffledDeck/isReplayCode non-string coercion.

AC added from TASK-2.18 follow-up (doc-50, TASK-2.1 review MINOR).

AC added from TASK-1.9 follow-up (security review: restored HandState fields become untrusted)

AC#11 added from TASK-1.13 follow-up (security review: action shape must be checked at load)
<!-- SECTION:NOTES:END -->
