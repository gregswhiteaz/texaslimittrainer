# TASK-1.12 — Questions and answers (autopilot run, 2026-11-20)

## Q-1 — Change one fixture line in the locked chip-safety test (owner TASK-1.31)
Case "AC#1 the worst legal hand at the stack bound keeps every chip amount a safe integer" plays an all-raising hand at
`boundStakes(2**45)` and expects > 0.9 × MAX_SAFE_INTEGER awarded; with the REQ-016 4-bet cap only ~62% goes in.
Options: (a) change only the stake to `boundStakes(56_294_995_342_130)` (largest the A-4 bound allows), keeping every
assertion — award ≈ 99.99% of the maximum, test no weaker [Recommended]; (b) lower the threshold to 0.6 (weakens);
(c) delete the case.
**Answer: auto-accepted (recommended)** — (a). Unlock recorded under TASK-1.31.
