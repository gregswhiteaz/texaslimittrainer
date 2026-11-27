# TASK-10.18 changes

- `src/engine/hand.ts` — new private `voidingWalk(state)` owns the forced-fold voiding rule in one pass and returns `{ levels, voided }`; `liveLevels` and `voidedBets` are now thin wrappers over it (signatures unchanged). Doc comment describes the rule once, on the walk.
- `tests/engine/force-fold.property.test.ts` — `playOut` takes an optional `afterForceFold` check (no change to its random draws); new case "voidedBets agrees with the engine's amount to match after every forced fold" (SPEC-02).

No new dependencies.
