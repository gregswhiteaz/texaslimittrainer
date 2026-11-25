---
id: TASK-7.32
title: Investigate why advised play almost never folds after the flop (WTSD ~94%)
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-24T20:47:00Z'
updated_date: '2026-11-25T00:08:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-10.3
parent_task_id: TASK-7
priority: high
ordinal: 237000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found while specifying TASK-10.3: in 100,000-hand 6-max playtests (seeds 42 and 7) the all-TAG line-up shows WTSD 94.4%/94.3% (VPIP 22.2, PFR 16.2, Aggression 63, W$SD 50). TAG bots fold after the flop in only ~3.4% of flops seen (98 folds in 2,855 seat-hands), and every bot style in the Mixed line-up sits at 92-96% WTSD. Healthy limit play folds far more postflop (realistic WTSD roughly 30-42% at 6-max). Bots and the user's hints share the postflop advice, so the trainer may be teaching over-calling. Find the cause (pot-odds thresholds, range model, equity vs opponent ranges, bot style policies) and fix it, then re-run TASK-10.3's WTSD check.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the 6-max all-TAG playtest, When the cause of the ~94% WTSD is investigated, Then the root cause is written up with evidence (which rules/thresholds produce the calls) and the fix approach is recorded
- [ ] #2 Given the fix, When a 100,000-hand 6-max all-TAG playtest runs (opt-in slow group), Then WTSD falls inside the authored 6-max healthy WTSD range from TASK-10.3 and VPIP, PFR, Aggression and W$SD stay inside theirs
- [ ] #3 Given the fix, When the golden-spot suites run, Then they pass (re-pinning any spot only with a recorded justification)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Bots request postflop advice with action-based opponent ranges (BOT_ADVICE), like the hints
2. Turn required equity counts one river big bet when an opponent can still bet (amend REQ-033.1); value raise facing a bet needs >65% (amend REQ-033.2; betting stays >50%); grading margin from the threshold that applied
3. Explanation: inline river-bet clause; value-raise sentence shows 65.0%
4. Re-pin locked advice/bot/golden/table tests one-for-one (unlocked under owners); replace turn golden spots that stop being clear-cut, logged
5. Fast 2,000-hand five-stat check in the normal suite; 100k check in test:slow; style-bands slow test expected to fail until TASK-6.25

Full spec: doit/TASK-7.32/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
doit: parked — investigation done (see doit/TASK-7.32/spec.md §1a): root cause is that all four bot styles request advice with the default 'unseen' (any two cards) range model, so they call ~98% of postflop bets; hints already use action ranges. Bots on action ranges alone give WTSD ~44% (just outside 30–42). The recommended full fix also amends REQ-033.1 (turn pot odds count one river big bet) and REQ-033.2 (value raise vs a bet needs >65%), re-baselines ~18 locked tests across 12 stories, and leaves the Mixed line-up REQ-027 style bands failing (Maniacs take over). That changes the requirements, so it needs the user's decision on Q-1..Q-3 (spec §11). Related ready story: TASK-7.25 (switch bots to action-based ranges).
<!-- SECTION:NOTES:END -->
