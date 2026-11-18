## BUILD (round 1)
- Implemented `src/engine/cards.ts` and `src/engine/hand-evaluator.ts` per spec §5. Evaluator: suit bit masks (duplicate check), flush table indexed by 13-bit mask, otherwise a collision-free quinary index of the 13 rank counts (13 table reads/adds) into a non-flush table. Dense ranks come from sorting the distinct build-time scores (category + base-13 tie-break digits). Tables: flush 16 KiB + noFlush ~144 KiB + index helpers ~2 KiB.
- Wrote the oracle and all tests named in the spec plus unit tests.
- `npx vitest run tests/engine`: 5 files, 13 tests passed (AC#1 exhaustive ~0.7 s).
- SPEC-12 command run 5 times: ~15.9–16.2 M evals/s, table build ~24.5 ms — pass.
- `npm run format` (prettier on new files), `npm run lint` OK, `npm run typecheck` OK.
- `npm test`: 14 files, 36 tests passed; coverage engine lines 100% (hand-evaluator branches 79.8%), no threshold errors. CI-floor run under coverage: ~2.8 M evals/s, build 83 ms.
- SPEC-14 grep prints nothing. Total new lines 797 across 8 files (budget 1000/8).
