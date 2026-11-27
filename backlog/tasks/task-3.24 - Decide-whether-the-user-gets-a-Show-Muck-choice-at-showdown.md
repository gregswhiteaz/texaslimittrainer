---
id: TASK-3.24
title: Decide whether the user gets a Show/Muck choice at showdown
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-21T08:35:00Z'
updated_date: '2026-11-27T17:58:00Z'
labels:
  - follow-up
  - spike
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-1.15
references:
  - doc-62
parent_task_id: TASK-3
priority: low
ordinal: 210000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Spike from TASK-1.15 (doc-62). TASK-1.15 Q-1 was auto-accepted in autopilot: the user's hand follows the same automatic show/muck rule as the bots (shown if it beats or ties the best hand shown so far, otherwise mucked). Casinos let a player choose to show a losing hand or muck a winning-but-uncalled one; whether the trainer should offer that choice is a product decision for the user.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The user decides between keeping automatic show/muck for their own hand and adding a Show/Muck prompt, and the decision is recorded in this task's notes (and, if a prompt is chosen, a story is created for it)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Record decision-6 (automatic show/muck for the user's hand, no control, uncalled winners never show)
2. Reword REQ-019.5/REQ-019.8 for the user's hand; changelog 1.17
3. No code change; evidence in notes
4. Tick AC#1

Full spec: doit/TASK-3.24/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Q-1 answer (user, 2026-11-27): A. Keep automatic show/muck for the user's hand; no Show/Muck control; a hand that wins uncalled is never shown; no follow-up story (Q-1 A). Recorded as decision-6; REQ-019.5 and REQ-019.8 reworded, changelog row 1.17 in dreams/limit-holdem-trainer/requirements.md.
Key facts (doit/TASK-3.24/spec.md §3):
- Bots ignore shown cards: a bot decision uses only the current hand (REQ-029.3, decision-1); only the playtest runner passes earlierShowdowns.
- The user always sees their own cards (REQ-019.6); Hand Review always shows the user's hole cards (REQ-043.3).
- Mucking a hand that can win forfeits the pot: endRound awards only among shown hands, so a Muck option for a winning hand is never right.
- The only visible difference is the hand-over "You show · <hand>" line in the Shown hands list (src/table/hand-result.ts); grading and WTSD/W$SD stats are unaffected.
- Showing after an uncalled win would need a new result/record field and a persisted-format (hand-record parser) change, and would affect nothing.
- A prompt would cost a click per showdown against the 200+ hands/hour pace (G-5, REQ-024.6).
No product code changed.

Build: decision-6; REQ-019.5/019.8 + changelog 1.17; no code; gate PASS
<!-- SECTION:NOTES:END -->
