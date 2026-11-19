# Fix brief — TASK-7.19 (user sign-off tweaks, 2026-11-19)

The user signed off on the chart on condition that these two text-only fixes are applied (qa.md Q-4). Change no grids.

1. **BB re-raise justification** (src/advice/charts/six-max.json, the BB `re-raise` spot, around line 470): it states flatly "Our blind and our raise are already in…". That is untrue on the cold route, where a 3-bet comes before BB has raised. Reword so it holds on every route, e.g. "When we raised, our blind and our raise are already in…". The original-wording, word-count and route rules still apply.
2. **SB blind-defence justification**: "leaves us out of position against two players" understates the field when callers are already in. Change it to "against at least two players" (or equivalent), keeping it accurate for every route.

Keep `npm run chart:print` output in sync: regenerate doit/TASK-7.19/chart-print.txt, and note the two text changes in chart-changes.md.
