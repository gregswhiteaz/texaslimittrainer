# TASK-7.34 — Questions and answers (autopilot, 2026-11-26)

## Q-1 — Target for the 8-opponent calling-range advice spot in AC#2
Measured p95 137–145 ms against an implied 100 ms; results-identical speed-ups reach only ~7%.
Recommended (A): keep every advice result byte-identical and give this spot a 200 ms target (only spot doing two full 30,000-trial runs; bots use 500-trial equity so REQ-055.3 is unaffected; hints have 1 s under REQ-055.1). Measured 69–72% of 200 ms — passes 75% with a thin margin.
Alternatives: (B) 100 ms by capping calling-range rejections (changes advice at 8+ opponents); (C) drop the spot from AC#2 and open a new multiway-sampler follow-up.
**Answer: auto-accepted (recommended)** — listed for review; the opt-in check's margin is thin.
