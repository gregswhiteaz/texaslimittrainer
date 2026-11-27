# TASK-7.40 Q&A

## Q-1 SITUATION_LABELS['re-raise-not-mine']
**Answer: "facing a re-raise when you have not raised" (Recommended).**

## Q-2 PREFLOP_CONTEXT['re-raise-not-mine']
**Answer (Recommended):** "The pot has been raised more than once and none of the raises is yours, so your hand strength, {def:hand-strength}, must be very high to continue."

## Q-3 Authoring rule for the 6 new grids
**Answer: Subset of the one-raise spot (Recommended).** Continuing hands ⊆ that seat's continue set vs one raise (raise spot for UTG–BTN, blind defence for SB/BB); only AA, KK, QQ, JJ, AKs, AKo, AQs raise, AA/KK/QQ always raise; width 2–8% UTG–SB, 4–16% BB.

## Q-4 Sign-off of the 12 new/changed 6-max spots (AC#7)
**Answer: One review before code review (Recommended).** After the build gate is green, the orchestrator shows the chart:print blocks for the 6 new and 6 re-justified spots, changed cells, own-raise shares and the CO A9o/A8o choice in one question (sign off / with tweaks / request changes); tweaks applied before review; dated note on the task; then AC#7 can tick.

## A-8 (Spec Detective, from builder blocked.json) Seeded example re-pins outside the spec's table
The new grids fold where TAG used to continue, shifting seeded examples in tests/bots/calling-station.acceptance.test.ts (TASK-6.3), tests/bots/maniac.acceptance.test.ts (TASK-6.4, TASK-6.25) and tests/playtest/games.acceptance.test.ts (TASK-1.16). Resolved as re-pins (same class as TASK-7.32/7.8): find the same views in the new decision lists and update index/seed/draw pins with a "before TASK-7.40" note; games keeps all three `> 0` checks with a seed/hand count that has a side pot again. No assertion dropped. Files budget raised to ~27. Listed for the user in the sign-off question.
