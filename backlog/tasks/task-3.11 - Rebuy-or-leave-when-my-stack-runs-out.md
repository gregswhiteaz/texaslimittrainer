---
id: TASK-3.11
title: Rebuy or leave when my stack runs out
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-24T16:41:00Z'
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
  - doc-109
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
- [x] #1 Given the user's stack is $0 at the end of a $4/$8 cash hand, When the result is shown, Then a dialog offers Rebuy and Leave table and no next hand is dealt while the dialog is open, even after 1.5 s [REQ-007.2]
- [x] #2 Given the bust dialog, When the user chooses Rebuy, Then the user's stack is $160, the next hand is dealt and the session's rebuy count increases by 1 [REQ-007.3]
- [x] #3 Given a user who rebought twice in a session, When the session record is read after the next completed hand, Then its rebuy count is 2 [REQ-007.3]
- [x] #4 Given the bust dialog, When the user chooses Leave table, Then the dialog closes and no further hand is dealt, even after 1.5 s [REQ-007.2]
- [x] #5 Given the user's stack is $1 or more, When the Table screen is shown at any moment, Then no rebuy or add-chips control is offered [REQ-007.4]
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
1. Session: when the user's cash stack is $0 after a hand, deal nothing and expose a bust state (new branch before the temporary top-up line)
2. Session record: allow the user seat at $0 (cash only); cap rebuys at MAX_SESSION_COUNT; Resume reopens the dialog
3. UI: native <dialog> 'Out of chips' with Rebuy (focused) and Leave table; Rebuy adds $160 (buyIn) and deals at once; Leave table pauses to Home
4. Rebuy count stored with the next completed hand's write
5. Tests: unit/acceptance with seeded short stacks; re-pin next-hand.test.ts $0 case; Playwright bust flow in Chromium and WebKit with axe

Full spec: doit/TASK-3.11/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-3.4 Q-4 interim top-up to $160 must be removed once this and the other all-in/rebuy stories land: tracked as TASK-3.21.

Build: user bust at $0 shows 'Out of chips' dialog (Rebuy $160 / Leave table), $0 user seat storable (cash), rebuys capped and stored with next hand; npm test 1007 passed, e2e 212 passed; gate PASS. Prior-story test type annotation widened (session.acceptance.test.ts, no assertion change).

Judge r1 PASS 17/17; CI 45322832954 green.

Follow-ups: TASK-3.21 AC added (rebuy cap) + note (docstring reflow, Escape comment); TASK-2.20 AC added (Back after reload+Resume, J-1-01). Already owned: real-play bust reach (TASK-3.21), Continue label (TASK-9.2), session end (TASK-10.1).

Locked test tests/table/rebuy.acceptance.test.ts unlocked for TASK-3.21 Q-2 (top-up removal / sit-and-go stop re-pin, same expect count).

Locked tests/ui/bust-dialog.acceptance.test.tsx unlocked for TASK-9.2 AC#1 (Continue label; expectation replaced, not loosened).

Locked e2e/rebuy.spec.ts unlocked for TASK-10.1 D-4 (Leave table ends the session; expectation replaced, not loosened).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the cash-game bust flow: when a hand leaves the user on $0 a modal 'Out of chips' dialog offers Rebuy ($160, rebuys +1, next hand dealt) or Leave table (pauses to Home), and nothing is dealt meanwhile. The session record now stores the user's $0 seat and the rebuys count, so Resume reopens the dialog. Verified: lint, typecheck and 1007 tests pass; 212 e2e pass in Chromium and WebKit with axe; judge round 1 passed 17/17. To review: Q-1 (persisted $0 user seat), Q-2 (dialog copy), the type-only edit to session.acceptance.test.ts and the re-pinned next-hand test, and assumptions A-1..A-6. Risks and follow-ups: the bust is reachable in real play only from exactly $96 until TASK-3.21; rebuy() count is not capped (MINOR); a docstring reflow and an Escape-handler comment (MINOR/NIT); Back-after-reload then Resume stays on the Table (J-1-01).
<!-- SECTION:FINAL_SUMMARY:END -->
