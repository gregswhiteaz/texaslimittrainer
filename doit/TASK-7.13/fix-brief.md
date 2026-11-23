# TASK-7.13 — continue after block 1 (recorded spec amendment)
1. (c) estimateOpponentRanges: when `observed` is not an array (e.g. the locked range-model AC#8 type-error probe passes 'Maniac'), ignore it and use default ranges (basis 'typical player'); arrays are still validated with the RangeError messages from A-7. Add a unit test for the non-array case.
2. (a)/(b) are already applied by the orchestrator (value-bet AC#9 key list; preflop AC#6 sandbox list). List both files in changes.md (path in backticks).
3. Run npm test (expect 0 failures), playtest SHA unchanged, format, lint, then the gate.
