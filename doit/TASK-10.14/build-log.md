## BUILD
- Copied the seven approved texts from spec §5 verbatim into `src/stats/leak-categories.json` and `docs/stats/leaks.md` (exact-match replace, each old text found once per file).
- Added `tests/stats/leak-copy.acceptance.test.ts` (5 tests: SPEC-01, 02, 03, 04, 07).
- `npm run format` done; `npm run lint` pass; `npm run typecheck` pass.
- `npm test`: 355 files passed / 11 skipped; 1572 tests passed / 60 skipped. No locked test edited.
