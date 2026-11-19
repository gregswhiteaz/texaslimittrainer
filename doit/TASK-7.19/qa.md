# Q&A — TASK-7.19

Context shown to the user (current chart): share of each opening range kept against a single re-raise
- UTG: 9.7 / 16.0 ≈ 61%
- HJ: 10.4 / 19.2 ≈ 54%
- CO: 11.8 / 27.0 ≈ 44%
- BTN: 15.8 / 40.6 ≈ 39%

## Q-1 — Re-raise defence width (AC#2)
Asked 2026-11-19. Options: keep most of the opening range, about 80–90% (Recommended) / about two-thirds / keep as is.
**Answer (user):** Most of it, ~80-90% (Recommended).
- Against a single 3-bet, each opener (UTG, HJ, CO, BTN) continues (call or 4-bet) with about 80–90% of its own unopened range, measured in combos.
- Fold only the weakest offsuit or dominated hands.
- 4-bet only premium hands.
- Every re-raise justification must agree with its grid.

## Q-2 — How the user reviews and signs off (AC#1, AC#6)
Asked 2026-11-19. Options: printed grids + sign-off before Done (Recommended) / summary table only / every grid up front.
**Answer (user):** Printed grids + I sign off (Recommended).
- Build `npm run chart:print` (every spot as a 13×13 grid with raise and continue percentages).
- Apply the agreed changes, then show the user the changed spots.
- The user signs off, or asks for tweaks, before the task is marked Done.
- The sign-off is recorded in the task notes (AC#6).

## Q-3 — Cold re-raise side effect of Q-1 (raised in revision)
Asked 2026-11-19. The single "re-raise" spot per seat also serves cold 3-bets. Under Q-1, CO facing a UTG open and an HJ 3-bet would continue about 22% of hands with nothing invested. Options: widen now and split later via TASK-7.21 (Recommended) / split the spot in this story / compromise width.
**Answer (user):** Widen now, split later (Recommended). The spec is unchanged; the evidence is recorded on TASK-7.21.

## Q-4 — User sign-off (AC#6)
Asked 2026-11-19 after judge round 1 passed every automated item. Options: sign off + fix the 2 wordings (Recommended) / sign off as is / request changes.
**Answer (user):** Sign off + fix the 2 wordings (Recommended). The user approves the revised chart, provided the BB re-raise text ("When we raised, our blind and our raise are already in…") and the SB blind-defence text ("at least two players") are fixed before Done.
