# TASK-11.2 — Questions and answers (autopilot, 2026-11-25)

## Q-1 — ACs #2, #4, #5 name filter / per-session UI owned by TASK-11.4 / 11.5
Options: (a) meet them with pure functions here (today's screen = "All"; sit-and-go-only set; per-session bb100Value equals the session report BB/100); TASK-11.4/11.5 wire their UI to these functions [Recommended]; (b) add the game-type select now; (c) defer to 11.4/11.5.
**Answer: auto-accepted (recommended)** — (a). The orchestrator adds ACs to TASK-11.4 and TASK-11.5 so their UI uses these functions for the BB/100 chart.

## Q-2 — New chart text (user-visible)
Options: caption "Dashed line: break-even"; note "Each point is 500 cash hands. Above the dashed line means you are winning."; tooltip "Cash hands 501–1,000: +2.7"; aria-label "Big bets won per 100 hands, one point per 500 cash hands: +2.7, -1.3" [Recommended]; storyboard text verbatim incl. "(G-3)"; note only.
**Answer: auto-accepted (recommended)**.
