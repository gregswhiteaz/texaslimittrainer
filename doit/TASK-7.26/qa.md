# TASK-7.26 — Questions and answers (autopilot, 2026-11-25)

## Q-1 — Range contents and width bands (poker content; changes advice and bot play at 2 and 8-10 seats)
Options: approve the 66 ranges in spec Appendix A (12 heads-up, 54 full-ring) with widths and bands [Recommended]; wider heads-up ranges nearer the chart; reuse 6-max ranges re-mapped.
**Answer: auto-accepted (recommended)**. Flag for review: poker content.

## Q-2 — Golden spots that stop being clear-cut (locked tests/golden/postflop-spots.json, TASK-7.14)
Options: replace on the same street/size/action, log under "Changes from TASK-7.26", keep 120/86/18/16 counts [Recommended]; delete; loosen the rule.
**Answer: auto-accepted (recommended)** — unlocked under TASK-7.14 in advance.

## Q-3 — Slow 100k check at heads-up and 9-max
Options: log the five stats, assert zero violations and non-null stats; any stat outside its healthy range becomes a follow-up [Recommended]; assert all five inside the healthy ranges.
**Answer: auto-accepted (recommended)**.

## Q-4 — Tables with 3, 4, 5 or 7 dealt-in seats
Options: unchanged here; follow-up to use 6-max ranges [Recommended]; key by referenceSizeOf now.
**Answer: auto-accepted (recommended)** — follow-up TASK-7.35 created.
