## BUILD (2026-11-26)
- Implemented spec D-1/D-2 in `src/stats/trends.ts`; added SPEC-01 acceptance file and SPEC-02..05 unit cases; updated docs.
- `npm run typecheck`: pass. SPEC-04 `as` check on `trendHand`: pass.
- `npx vitest run` (tampered, trends, bb100 acceptance): 3 files, 21 tests passed.
- `npm test`: 329 files passed / 9 skipped; 1474 tests passed / 56 skipped.
- `npm run lint`: pass. `npm run format`: applied, clean.
- No locked test changed. Diff ~290 changed lines vs budget 260 (warn band, below the 520 fail limit).

## FIX r1 (2026-11-26)
- Item 1 [MAJOR] fallback -0 guard: fixed. Added primes(500) case with net -1 on the bigBet-3571 hand (v ≈ -5.6e-5), asserting `Object.is(..., 0)`. Mutant `return tenths / 10;` fails it (`expected false to be true`).
- Item 2 [MAJOR] half-away rounding: fixed. Added `primeHands(-2)` (v = -6.25 exactly) asserting -6.3. Mutant `Math.round(v * 10)` fails it (`expected -6.2 to be -6.3`).
- Orchestrator MINOR switch point: fixed. Added big bets 4, 40 + 8 primes: LCM 5 354 760 272 292 280 (below MAX_SAFE) asserts exact -138.3 (float gives -138.2); LCM 9 837 815 383 978 840 (above) asserts float -146.3 (unsafe exact path gives -146.2). Mutants `next > 1e6` and `next > 120` fail (`expected -138.2 to be -138.3`); `next > 2 ** 60` fails (`expected -146.2 to be -146.3`).
- Each mutant was applied to `src/stats/trends.ts` on its own and then restored; the source is unchanged.
- `npm run format`: applied. `npm run lint`: pass. `npm run typecheck`: pass.
- `npm test`: 329 files passed / 9 skipped; 1474 tests passed / 56 skipped (new assertions are inside the existing case).
