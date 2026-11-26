
## BUILD (2026-11-25)
- Added `SITUATION_LABELS`, `positionLabel`, `situationLabel`; `chartBasisText` routes through `positionLabel`.
- Added `tests/advice/labels.acceptance.test.ts` (3 tests: SPEC-01..03); docs paragraph.
- `npx vitest run tests/advice/labels.acceptance.test.ts tests/advice/explain.test.ts`: 2 files, 19 passed.
- `npm test`: 319 files passed / 6 skipped; 1442 tests passed / 48 skipped.
- `npm run lint`: clean. `npm run typecheck`: clean. `npm run format`: run.
- Diff: 4 files, ~83 lines added (budget 4 / 90).
