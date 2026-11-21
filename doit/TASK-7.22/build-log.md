## BUILD (2026-11-20)
- Wrote `tests/advice/postflop-coverage.acceptance.test.ts` per spec §5 (two tests, names exactly as specified).
- `npx vitest run tests/advice/postflop-coverage.acceptance.test.ts --reporter=verbose`: 2 passed (AC#2 property 481 ms).
- Mutation check: replaced `Math.round(fraction * 1000 + 1e-9) / 10` with `Math.round(fraction * 1000) / 10` in `src/advice/postflop.ts`; AC#1 failed (1 failed). Restored from a backup copy; `git diff --stat -- src` empty.
- `npm run format`: clean. `npm run lint`: clean. `npm run typecheck`: clean.
- `npm test`: 108 files passed; 378 passed, 6 skipped (384).
