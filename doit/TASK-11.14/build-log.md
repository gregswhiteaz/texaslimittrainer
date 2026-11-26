## BUILD (2026-11-26)
- Implemented spec D-1/D-2 in `src/stats/trends.ts`; added SPEC-01 acceptance file and SPEC-02..05 unit cases; updated docs.
- `npm run typecheck`: pass. SPEC-04 `as` check on `trendHand`: pass.
- `npx vitest run` (tampered, trends, bb100 acceptance): 3 files, 21 tests passed.
- `npm test`: 329 files passed / 9 skipped; 1474 tests passed / 56 skipped.
- `npm run lint`: pass. `npm run format`: applied, clean.
- No locked test changed. Diff ~290 changed lines vs budget 260 (warn band, below the 520 fail limit).
