# Fix brief — TASK-8.1 (build block 1, resume BUILD)

The locked spec stays; this records an approved design change. Judge on substance.

## 1. Move observed counts out of TableState (D-2 alternative)
- Remove `observedCounts` from TableState and from nextHand. Keep counting per bot id at each completed hand (before seat replacement), but as a pure function, e.g. `countObserved(prev: ObservedCounts, table, completedHand): ObservedCounts`, with the counts held in useTableSession state (reset on mount, so Resume starts at 0 per Q-3).
- `userObservedSnapshot(table, counts)` builds the snapshot; act passes it to applyUserAction; the hint passes it to recommend.
- The three locked restore tests must pass UNCHANGED.

## 2. Finish the remaining build per the spec
- src/table/hint.ts, advice client recommend(view, observed?), HintCard, Table/useTableSession wiring, CSS, all unit/acceptance tests, e2e/hint.spec.ts and its scene, docs. Adapt any test that the spec wrote against `table.observedCounts` to the counts argument (record each in the build log).
- npm run format, lint, typecheck, full npm test, `npm run build && npx playwright test` (full suite), then the gate.
Never edit a hook-locked test; never drop or loosen an assertion.
