## BUILD
- Added `resizeRange` and wired it into `estimateOpponentRanges`; regenerated `hand-order.json` with a temporary scratch script (deleted): AA 63.9 first, 32o 14.1 last, 87s #68, 76s #81, 65s #93, K2o #112, Q2o #131, J2o #144, 22 #116 (matches spec).
- Applied the three locked edits exactly as spec §5 and listed them in the task notes; new acceptance file; unit test switched to three opponents; docs; `test:slow` entry.
- Targeted run (observed-*, golden, review-numbers): 12 files, 326 passed, 1 skipped.
- `TLH_SLOW_TESTS=1 npx vitest run tests/advice/observed-resize.acceptance.test.ts`: 5/5 passed (slow 1.7 s).
- SPEC-10 grep check: no stale text; 3 matching lines.
- `npm run format`, `npm run lint`, `npm run typecheck`: clean.
- `npm test`: 337 files passed, 9 skipped; 1507 tests passed, 57 skipped.
