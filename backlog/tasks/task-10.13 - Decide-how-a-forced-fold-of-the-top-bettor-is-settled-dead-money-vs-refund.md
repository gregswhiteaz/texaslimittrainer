---
id: TASK-10.13
title: Decide how a forced fold of the top bettor is settled (dead money vs refund)
status: To Do
assignee: []
created_date: '2026-11-24T20:28:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
  - spike
milestone: m-1
dependencies:
  - TASK-10.2
references:
  - doc-125
parent_task_id: TASK-10
priority: medium
ordinal: 236000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-10.2 (doc-125, judge J-1-01 / code review MINOR). When Leave table force-folds the user while they hold the top bet, the engine keeps that bet as the amount to match (bots must still call it) and, if one seat remains, refunds the uncalled part to the folded user. In real poker a player who abandons forfeits chips already put in (dead money) and no one has to call a folded player's bet. Options: (a) forfeit — chips stay in the pot as dead money and the amount to match drops to the highest live bet (recommended: standard rules); (b) keep today's behaviour. Also: several forced folds in one hand can break the pot-eligibility invariant (judge J-1-02; unreachable today), and the bot-freeze e2e check (e2e/leave-mid-hand.spec.ts:135) is timing-sensitive.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the options above, When the user decides, Then the decision is recorded in this task and in docs/ui/navigation.md
- [ ] #2 Given the decided rule, When the user is force-folded while holding the top bet (preflop raise, flop bet), Then the pot, the amount the remaining players must call and any refund follow that rule, with engine tests and invariants holding
- [ ] #3 Given forceFold is called on several seats in one hand, When the hand settles, Then checkState holds (or forceFold rejects the call) — a property test covers it
- [ ] #4 Given the leave dialog is open on a bot's turn, When the test checks that no bot acted, Then it waits for any in-flight worker reply and advances the clock again before asserting (no timing-dependent pass)
<!-- AC:END -->
