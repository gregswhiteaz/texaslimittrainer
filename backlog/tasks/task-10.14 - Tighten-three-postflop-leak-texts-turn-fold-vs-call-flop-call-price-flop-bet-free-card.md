---
id: TASK-10.14
title: >-
  Tighten three postflop leak texts (turn fold vs call, flop call price, flop
  bet free card)
status: Done
assignee:
  - '@claude'
created_date: '2026-11-24T23:58:00Z'
updated_date: '2026-11-28T05:35:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-10.5
references:
  - doc-128
documentation:
  - doc-202
parent_task_id: TASK-10
priority: low
ordinal: 238000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-10.5 code review (doc-128). In src/stats/leak-categories.json: (1) the turn-fold fix says the pot 'has grown enough' to call while the turn-call justification says the doubled bet 'raises the required equity' — the accurate reason is that a draw has only one card to come; (2) the flop-call fix says your chance must 'beat' the price but the rule calls when it is at least the price; (3) the flop-bet fix promises a free turn after a check, which only holds when you act last.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the three leak texts, When they are revised, Then each is accurate against the advice rules, stays one original sentence with a justification, and the user approves the new wording
- [x] #2 Given the flop-facing-a-bet-raise and turn-facing-a-bet-raise justifications, When they are revised, Then each states the value-raise bar accurately (more than 65% equity against the hands that would call a raise, per src/advice/postflop.ts), stays one sentence, and the docs table matches
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Replace 7 text fields in src/stats/leak-categories.json with the approved wording (Q-1..Q-3 A) and A-5 raise justifications
2. Mirror them in docs/stats/leaks.md
3. New tests/stats/leak-copy.acceptance.test.ts pins texts, one-sentence form, old phrases gone, 65 == VALUE_RAISE_THRESHOLD_PCT

Full spec: doit/TASK-10.14/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC#2 added from Q-4 (user chose: add to this task).

Build: 7 leak texts replaced in leak-categories.json + docs table; new leak-copy acceptance test; gate PASS

Review r1 MINOR 2: flop raise justification (A-5) now also names the implied-odds rule; leak-copy test expected value replaced (unlocked under TASK-10.14).

Step 6a: none. Draw-allowance gap in the approved flop-call/turn-fold fixes left for the user to decide (reported); scope-budget warning not tracked.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Rewrote 7 postflop leak text fields in leak-categories.json and docs/stats/leaks.md (turn fold fix+justification, turn call justification, flop call fix, flop bet fix, flop/turn raise justifications) so they match the advice rules (at-least price, river bet on turn, free turn only if no one bets, >65% value-raise); added tests/stats/leak-copy.acceptance.test.ts. Verified: npm test 1572 pass, lint/typecheck pass, e2e report-leaks pass, judge PASS 7/7 round 1, no blocking review findings. Review: flop-call fix and turn-fold fix omit the small implied-odds draw allowance (user-approved wording kept); flop raise justification amended after review to name implied-odds. No code change; status not set to Done.
<!-- SECTION:FINAL_SUMMARY:END -->
