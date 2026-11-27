# TASK-7.44 build log

## BUILD
- `src/advice/ranges.ts`: added `TYPICAL_PFR`, `typicalPfr`, `relativePfrPct`; three-bet/four-bet lines use `'relative-pfr'` in `estimateOpponentRanges`. No `src/stats` import.
- New `tests/advice/observed-reraise.acceptance.test.ts` (6 tests, SPEC-01..04, 06, 11). AC#5 parses the 4 golden spots with `opponentStats` using the real advice (throws unless they agree and are clear-cut), ~30 ms.
- `tests/advice/observed-ranges.test.ts`: renamed/updated line-table test (SPEC-07, incl. PFR 0 four-bet floor), added SPEC-05, SPEC-08, SPEC-09.
- Locked edit `tests/advice/observed-resize.acceptance.test.ts` (A-5): import + line 143 exactly as spec §5; no `expect` removed.
- Docs `docs/advice/range-model.md`: table, typical-PFR paragraph, Known limits.
- Commands: targeted vitest (3 files) 28 passed / 1 skipped; `npm test` 338 files passed / 9 skipped, 1516 tests passed / 57 skipped; `ranges.ts` coverage 100% lines, 98.41% branches; `npm run lint` pass; `npm run typecheck` pass; `npm run format` run.
