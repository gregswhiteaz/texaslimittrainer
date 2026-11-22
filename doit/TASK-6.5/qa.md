# TASK-6.5 — Questions and answers (autopilot run, 2026-11-21)

## Q-1 — Style file format for the starting range (D-1; persisted format)
Options: (a) v1 kept; optional top-level "startingRange": [{position, situation, hands: "AA AKs …", justification ≥10
words}]; all 26 6-max spots once, required only for Rock; every class a non-fold TAG cell; fewer classes per spot and
per position; parseStyle(raw, fileName, chart = SIX_MAX_CHART); existing style files unchanged (startingRange null)
[Recommended]; (b) v2; (c) 13×13 grid; (d) JSON arrays; (e) per-position only.
**Answer: auto-accepted (recommended)** — (a).

## Q-2 — Rock ranges, description and justifications (D-2; strategy content, original)
Options: (a) the spec's ranges (Rock/TAG classes UTG 15/39, HJ 20/46, CO 29/57, BTN 45/82, SB 25/79, BB 41/169);
measured VPIP/PFR 10.5/9.2 (one Rock), 10.4/9.0 (two), 10.9/9.9 (six), 9.9/8.3 (mixed); 0 violations; band VPIP 8–15,
PFR 6–12 [Recommended]; (b) tighter draft (9.0/8.6); (c) middle draft (9.9/8.9).
**Answer: auto-accepted (recommended)** — (a).

## Q-3 — Behaviour inside the range and postflop (D-3)
Options: (a) play the advice move with no mixing and no deviations (no randomness); outside the range preflop fold when
owing, check when not; postflop free-check shortcut [Recommended]; (b) TAG mixing inside the range; (c) postflop deviations.
**Answer: auto-accepted (recommended)** — (a).

## Q-4 — Route 'Rock' worker seats to decideRock (D-4)
Options: (a) yes, like TASK-6.3/6.4 (unlocked unit assertion updated) [Recommended]; (b) defer to TASK-6.6.
**Answer: auto-accepted (recommended)** — (a).
