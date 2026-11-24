# Fix brief — TASK-7.14 (build block 1)

Fix exactly this. Nothing else.

## 1. Apply the approved preflop spot changes
- tests/golden/preflop-spots.json is now unlocked under TASK-7.11 (reason "TASK-7.14 Q-1, AC#7-9").
- Copy doit/TASK-7.14/preflop-spots.proposed.json over tests/golden/preflop-spots.json, then delete the proposed file.
- Add tests/golden/preflop-spots.json to changes.md.
- Run npm run format, lint, typecheck, npm test (expect 0 failures), then the gate.
Never drop or loosen an assertion.
