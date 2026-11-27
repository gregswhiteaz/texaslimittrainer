# TASK-6.30 Q&A

## Q-1 Rule for rare mixed spots in the style check
Options: (B) minimum sample N = 10 — spots with fewer decisions are listed on a separate line "Not judged (fewer than 10 decisions): <style> <spot>" and not judged; (B') N = 20; (A) keep the rule; (C) rule only at 6 seats; (D) share-of-decisions threshold.
**Answer: B with N = 10 (Recommended).** Includes the proposed report line wording. REQ-028.3 fit criterion reworded + changelog 1.19; follow-up build story (re-pin the TASK-6.11 never-mixing test, restore exit 0 in the TASK-7.46 slow test).

## Q-2 Rename the TASK-7.46 slow test (only if A)
Moot — Q-1 is B; the follow-up restores the exit-0 assertion so the name becomes accurate.
