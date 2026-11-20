## BUILD (2026-11-19)
- Created `tests/engine/review-gaps.acceptance.test.ts` (112 lines) with the three tests named in SPEC-01..03, using local copies of the `hand.test.ts` config/apply/play helpers.
- `npx vitest run tests/engine/review-gaps.acceptance.test.ts`: 3 passed.
- `npm test`: 90 files passed; 333 tests passed, 5 skipped. `npm run lint`, `npm run typecheck`, `npm run format`: clean.
- All worked-example values in spec §5 matched the engine; no bug found, no src change.
