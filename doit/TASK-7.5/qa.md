# TASK-7.5 — Questions and answers (autopilot, 2026-11-22)

## Q-1 — Who uses action ranges in this story (D-1)
Recommended (A): only the user's hint and review use `ACTION_RANGE_ADVICE`; bots and default `recommend(view)` stay on
every-unseen-combo; no locked-test edits; playtest SHA unchanged. A follow-up task switches bots (needs user approval
for locked-test re-baselines: TASK-7.3, TASK-6.3, probably TASK-9.1).
**Answer: auto-accepted (recommended)**

## Q-2 — Default-range content plan (REQ-061)
Recommended: 36 original 6-max ranges keyed by (position, line) — check, limp, open-raise, call-raise, three-bet,
call-three-bet, four-bet — hand-class lists modelling a typical low-stakes player, each with a ≥15-word justification,
width bands per line checked by a validator; heads-up/full-ring in TASK-7.6.
**Answer: auto-accepted (recommended)**

## Q-3 — Narrowing-rule interpretation
Recommended: Strong = two pair+ strictly above the board's own category; Pair = pocket pair or hole card matching a board
rank; Draw needs a hole card in the 4-flush/4-run (A234, JQKA not open-ended); each street narrows once by the most
aggressive action (raise > bet > call > check).
**Answer: auto-accepted (recommended)**
