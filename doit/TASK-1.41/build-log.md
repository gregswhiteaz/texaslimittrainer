## BUILD (2026-11-20)
- Captured baseline: `npm run -s playtest -- --hands 10000 --seed 42 > /tmp/tlh141-before.txt` on HEAD (exit 0, `Invariant violations: 0`).
- Edited `src/engine/invariants.ts` (rename + L4 comment); `npm run format` wrapped the `checkStep` return. Diff: 9 insertions, 3 deletions, 1 file.
- SPEC-01 grep: no `rest`/`others`; `stateChecks` on 3 places, `afterChips` on 2, all in `checkStep`. PASS.
- SPEC-02 grep: 4 comment lines matched (REQ-016.1, legalActions, TASK-1.14). PASS.
- SPEC-03: `npm test` 101 files passed, 363 tests passed, 6 skipped; playtest after exit 0; `cmp` before/after identical. PASS.
- `npm run lint` and `npm run typecheck` clean. No new tests (spec: none).
