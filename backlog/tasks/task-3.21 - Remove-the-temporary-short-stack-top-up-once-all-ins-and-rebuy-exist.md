---
id: TASK-3.21
title: Remove the temporary short-stack top-up once all-ins and rebuy exist
status: To Do
assignee: []
created_date: '2026-11-19T01:10:00Z'
updated_date: '2026-11-24T04:03:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-3.4
  - TASK-1.9
  - TASK-1.16
  - TASK-3.11
references:
  - doc-25
  - src/table/session.ts
parent_task_id: TASK-3
priority: high
type: chore
ordinal: 186000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Promised to the user in TASK-3.4 Q-4. Until all-ins exist the engine refuses stacks below 8 small bets + 8 big bets ($96 at $4/$8), so TASK-3.4's nextHand tops up any seat below that minimum to the $160 buy-in. The code carries the comment 'TEMPORARY (TASK-3.4 Q-4)'. This temporarily bends REQ-007.4 (no chips added above $0). This task depends on TASK-1.9 (all-in calls), TASK-1.16 (button past busted seats) and TASK-3.11 (Rebuy/Leave), so it becomes ready only when short stacks can really be played.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a seat below the old $96 minimum, When the next hand is dealt, Then its stack is not topped up — it plays its chips (or goes to Rebuy / bot replacement at $0) — and the interim top-up in nextHand is removed
- [ ] #2 Given a seat that ends a hand with $95 at $4/$8, When the next hand is dealt, Then that seat starts the hand with $95, and a test proves it
- [ ] #3 Given src/table/session.ts, When it is searched, Then the comment 'TEMPORARY (TASK-3.4 Q-4)' and the top-up code are gone, and TASK-3.4's SPEC-10/SPEC-11 tests are updated to the new rule
- [ ] #4 Given the top-up is removed and the user is short, When the action bar is shown in the live app, Then the all-in labels from TASK-3.7 ('Call all-in $X', 'Bet all-in $X', 'Raise all-in to $X') appear, proven by an e2e test on the real session
- [ ] #5 Given the top-up is removed, When a real all-in with unequal stacks happens in live play, Then the table shows the TASK-3.8 'Pots' list and the result shows 'Pot winners' lines, proven by an e2e test on the real session
- [ ] #6 Given a sit-and-go seat busts or runs short, When the next hand is dealt, Then it is never refilled (no top-up of any amount), per REQ-008 — TASK-2.4 left the interim top-up refilling sng short stacks to 20 big bets (800 at 20/40)
- [ ] #7 Given a stored busted cash session whose rebuys equals MAX_SESSION_COUNT, When the user chooses Rebuy, Then rebuy() refuses with a RangeError (or does not increment past the cap) and no record above the cap is ever written
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-3.7 follow-up (all-in labels live)

AC added from TASK-3.8 follow-up (live side pots)

AC added from TASK-2.4 (interim sng top-up)

From TASK-2.4 review: tests/table/game-type.test.ts SPEC-08 test is named '...tops up to its 1500 starting stack' but asserts the interim 800 top-up (name tied to TASK-2.4's locked spec). When removing the top-up, rename/rewrite that test to assert sng never refills.

From TASK-6.8: cash bots on $0 are now replaced (not topped up) and a bot on $1–$95 keeps its stack (proven by tests/table/replace-bot.acceptance.test.ts). Remaining here: the user seat and sit-and-go TEMPORARY top-up. TASK-3.4's next-hand acceptance test was already rewritten under TASK-6.8 Q-4 — start from that version.

AC added from TASK-3.11 follow-up (security MINOR rebuy-count-unbounded-increment, doc-109). Also while in session.ts / BustDialog.tsx: reflow the nextHand docstring (code MINOR nextHand-doc-awkward-reflow) and add a one-line comment on BustDialog's Escape onKeyDown (Chromium closes a modal on a second Escape without a cancelable cancel event; NIT escape-keydown-unexplained).
<!-- SECTION:NOTES:END -->
