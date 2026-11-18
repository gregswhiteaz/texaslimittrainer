# Q&A — TASK-7.3

## Q-1 — Public postflop API and unified entry point (D-1)
Asked 2026-11-18. Options: approve recommendPostflop shape + ship recommend(view) now (Recommended) / postflop only, recommend() later / flat interface / fractions instead of percentages.
**Answer (user):** Approve + recommend() now (Recommended) — `recommendPostflop(view, { equity? })` → PostflopRecommendation {basis:'equity', street, action, alternative (null), move, ruleId, equityPct, requiredEquityPct, callAmount, pot, opponents, equityMethod}; `src/advice/recommend.ts` with the Recommendation union (by `basis`) and `recommend(view)` dispatching by street.

## Q-2 — Rules, ids and comparison (D-2)
Asked 2026-11-18. Options: rounded one-decimal percentages, ties call, three rules (Recommended) / unrounded / single pot-odds id.
**Answer (user):** Rounded, ties call (Recommended) — rules in order `check-free`, `pot-odds-call`, `pot-odds-fold`; compare the one-decimal rounded equity % against required %, tie → call.
