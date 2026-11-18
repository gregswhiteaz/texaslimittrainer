# Q&A — TASK-7.2

## Q-1 — Who writes the chart and how tight (D-1)
Asked 2026-11-18. Options: Claude writes TAG (Recommended) / looser / tighter.
**Answer (user):** Claude writes TAG (Recommended) — original first-principles TAG chart per the §5 authoring guide (raise-or-fold first in, SB complete ≤10%, nested opening ranges, combo-share bands, AA/KK/QQ always raise); user reviews the finished chart afterwards.

## Q-2 — Chart file format and loading (D-2)
Asked 2026-11-18. Options: 13×13 text grid (Recommended) / range notation / one entry per hand.
**Answer (user):** 13×13 text grid (Recommended) — single JSON `src/advice/charts/six-max.json`, format `tlh-preflop-chart` v1, tokens R/C/F, `*` borderline, `/X` alternative; static import.

## Q-3 — Public advice API (D-3)
Asked 2026-11-18. Options: approve (Recommended) / single advise() / raw cell only.
**Answer (user):** Approve (Recommended) — `recommendPreflop(view, options?: { chart? })` returning basis, referenceSize, position, situation, handClass, cell, legalised action/borderline/alternative and `move`.

## Q-4 — Fixed 26 spots ignore raiser position / lump re-raise cases
Asked 2026-11-18 (raised by the Spec Detective from the writer's scope concerns). Options: ship 26 spots + follow-up (Recommended) / change requirements now / accept permanently.
**Answer (user):** Ship 26 spots, follow-up (Recommended) — build as specified; Step 6a creates a spike task to decide splitting spots by raiser position and open-vs-cold re-raise (REQ-032.2 change).
