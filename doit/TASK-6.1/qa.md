# Q&A — TASK-6.1

## Q-1 — Playtest seating at table sizes other than 6 (D-?)
Asked 2026-11-18. Options: TAG at 6, seeded random-move elsewhere until TASK-7.6 (Recommended) / reject other sizes / map other sizes onto 6-max now.
**Answer (user):** TAG at 6, random elsewhere (Recommended) — default size 6 seats TAG in every seat; sizes 3–5 and 7–10 keep today's random-move seats with unchanged output until TASK-7.6.

## Q-2 — Free-check equity shortcut
Asked 2026-11-18. Options: on a postflop decision with nothing owed, TAG calls recommend(view, { equity: FREE_CHECK_EQUITY }) (Recommended) / keep full equity and raise locked timeouts / wait for TASK-7.18.
**Answer (user):** Skip equity on free checks (Recommended) — stand-in returns zero equity without dealing; check-free fires first so the move is identical; SPEC-03 proves equality against real-equity advice.
