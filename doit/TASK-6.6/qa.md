# TASK-6.6 — Questions and answers (autopilot, 2026-11-22)

## Q-1 — What AC#6 can check at 9 seats (D-2)
Recommended: line-up seats play their styles only in hands with exactly 6 seats dealt in; other hands use the
existing random-move fallback (defaultPolicyFactory), with a `Line-up note:` line. AC#6 checks seat assignment,
0 violations, exit 0. Fallback removed when TASK-7.6 lands (AC added to TASK-7.6).
**Answer: auto-accepted (recommended)**

## Q-2 — Bot name list and assignment
Recommended: Ava, Ben, Cal, Dee, Eli, Fay, Gus, Hal, Ivy; bot k clockwise from the user gets BOT_NAMES[k-1]; no randomness.
**Answer: auto-accepted (recommended)**

## Q-3 — Playtest default without --lineup (D-1)
Recommended: unchanged; baseline SHA aacd5e94…e01 stays byte-identical.
**Answer: auto-accepted (recommended)**
