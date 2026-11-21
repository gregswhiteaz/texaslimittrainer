# TASK-1.41 changes

- `src/engine/invariants.ts` — renamed `rest`/`others` to `stateChecks`/`afterChips` in `checkStep` (Prettier wrapped the return line); added a 4-line comment above the L4 `if` in `legalActionMessage` explaining the raise clause (REQ-016.1, independent of `legalActions`, unreachable after L3, TASK-1.14 must revisit).

No new dependencies.
