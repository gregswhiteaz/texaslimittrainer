## BUILD (2026-11-27)
- Added `voidedBets` engine helper, `situationOf` filter, forceFold ring tidy-up, invariants `sole` hoist, advice lint allow-list entry; three new test files.
- `npm run format` ok; `npm run lint` 0 errors; `npm run typecheck` ok.
- New tests: 3 files, 6 tests passed.
- `npm test`: 345 files passed / 10 skipped; 1533 tests passed / 59 skipped.
- Playtest `--hands 10000 --seed 42` on base commit 5ed0184 (separate worktree, removed afterwards) vs branch: byte-identical (cmp), invariant violations 0.
