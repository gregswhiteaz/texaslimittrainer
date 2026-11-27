# TASK-10.13 Q&A

## Q-1 Settlement of a forced fold of the top bettor
Options: (a) forfeit — dead money, amount to match drops to the highest live bet; (b) keep today (bots call, uncalled part refunded to the leaver); (c) forfeit but the bet stands (uncalled part goes to the pot).
**Answer: (a) dead money (Recommended).**

## Q-2 Preflop big-blind floor
Options: yes — the amount to match stays at least one big blind (dead big blind); no — drops to the highest live blind.
**Answer: Yes, dead big blind (Recommended).**

## Q-3 Reword REQ-004.8 and REQ-018.4, changelog row 1.15
Options: yes, reword; no, docs/ui/navigation.md and task notes only.
**Answer: Yes, reword (Recommended).**

## Q-4 Locked edit of e2e/leave-mid-hand.spec.ts (owner TASK-10.2)
Options: yes — add an in-flight worker-reply wait and a second clock advance, no assertion loosened; no — AC#4 unmet.
**Answer: Yes, approve (Recommended).** Unlock under owner TASK-10.2 with reason "TASK-10.13 Q-4".
