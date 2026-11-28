## BUILD
- Copied the seven approved texts from spec §5 verbatim into `src/stats/leak-categories.json` and `docs/stats/leaks.md` (exact-match replace, each old text found once per file).
- Added `tests/stats/leak-copy.acceptance.test.ts` (5 tests: SPEC-01, 02, 03, 04, 07).
- `npm run format` done; `npm run lint` pass; `npm run typecheck` pass.
- `npm test`: 355 files passed / 11 skipped; 1572 tests passed / 60 skipped. No locked test edited.

## FIX r1
- Item 1: fixed — `flop-facing-a-bet-raise` justification in `src/stats/leak-categories.json` set to the exact brief text (adds implied-odds rule and `implied-odds-call`).
- Item 2: fixed — same cell in `docs/stats/leaks.md` (Prettier realigned the table) and the expected constant in `tests/stats/leak-copy.acceptance.test.ts` (value only; all checks kept).
- Item 3: `npm run format` run; `npx vitest run tests/stats/leak-copy.acceptance.test.ts`: 5/5 passed.
