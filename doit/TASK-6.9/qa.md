# TASK-6.9 — Questions and answers (autopilot, 2026-11-22)

## Q-1 — How to add the line-up run (D-1)
Recommended: default million run byte-identical; new `--lineups` flag + dispatch-only `million-lineups.yml`; no locked-test edits.
**Answer: auto-accepted (recommended)**

## Q-2 — Dispatch and schedule (D-2)
Recommended: no `schedule:` trigger and no live dispatch in this task (no Actions spend); judge proves AC#3 locally
(full --lineups run, byte-identical shard re-run, workflow-file test). The recommended option spends nothing, so autopilot
may accept it. The live GitHub dispatch evidence moves to a tracker that needs the user's budget decision (TASK-1.51).
**Answer: auto-accepted (recommended)**

## Q-3 — Style bots only partly possible (D-3)
Recommended: proceed; styles play in 6-seat hands, other sizes use TASK-6.6's random fallback with the Line-up note;
TASK-7.6 AC#11 brings styles to every size and `--lineups` picks them up unchanged.
**Answer: auto-accepted (recommended)**
