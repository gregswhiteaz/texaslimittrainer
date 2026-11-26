
## BUILD (2026-11-26)
- Exported `userMade` in `src/table/hand-record.ts`; rewrote `handCategoryDecisions` per spec §5 (reference match on `made[j]`, `group ??= positionGroup(...)`).
- Added `tests/stats/preflop-pairing.test.ts` (3 tests, SPEC-01..03).
- `npm run format`: clean. `npm run lint`: pass. `npm run typecheck`: pass.
- SPEC-03 command: pass. SPEC-04 `git diff --exit-code --diff-filter=MD e6bea12 -- tests e2e`: no diff.
- `npm test`: 330 files passed / 9 skipped; 1478 tests passed / 56 skipped.
