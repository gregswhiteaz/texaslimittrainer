# TASK-12.10 Q&A (autopilot)

## Q-1 How to handle a blocked IndexedDB upgrade (AC#2)
Options: (A) reject the open with UpgradeBlockedError, retry on the next store call, close a late-succeeding connection; no new on-screen text; (B) keep waiting and show a banner ("TLH Trainer is open in another tab with an older version. Close that tab to finish updating.").
**Answer: auto-accepted (recommended)** — (A).

## Q-2 Edit the locked e2e/settings.spec.ts (owner TASK-12.1) Tab-order assertion (:82-83) and two comments?
Options: yes — `expect(order).toEqual(expected)` (re-pin to the new order; nothing else changes); no — AC#3 cannot be met.
**Answer: auto-accepted (recommended)** — yes. Unlocked under TASK-12.1.
