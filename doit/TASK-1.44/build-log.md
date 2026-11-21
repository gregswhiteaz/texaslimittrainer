## BUILD (2026-11-20)
- Added JSDoc above `foldOut` in `src/engine/hand.ts` (7 comment lines, no code change) and new `tests/engine/fold-out.acceptance.test.ts` (SPEC-01, SPEC-02; helper shape copied from review-gaps per A-2). Total +67 lines, 2 files.
- `npx vitest run tests/engine/fold-out.acceptance.test.ts`: 2 passed.
- SPEC-03 grep: prints 3 (first draft printed 1, comment reflowed so tokens span lines). PASS.
- SPEC-04: diff filter grep exit 1 (comment-only diff); `npm test` 102 files passed, 365 tests passed, 6 skipped. PASS.
- `npm run format`, `npm run lint`, `npm run typecheck` clean. Playtest `--hands 10000 --seed 42` ends `Invariant violations: 0`.
