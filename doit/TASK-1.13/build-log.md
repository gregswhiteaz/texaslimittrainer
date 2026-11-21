## BUILD (2026-11-20)
- Wrote `tests/engine/illegal-actions.acceptance.test.ts` (5 tests, SPEC-01..05) per §5; updated doc comments in `src/engine/hand.ts` (SPEC §5 wording).
- Deviation (spec literal contradicts engine): A-5 says `new Xoshiro128(1313, 2026, 17, 4)`, but the `Xoshiro128` constructor takes one seed. Used `Xoshiro128.fromState(...mixState128([1313, 2026, 17, 4]))` (same four seed words, existing helpers). All A-5 minimums are asserted and pass with this seed.
- Wrong-amount fallback (no amount-bearing legal entry) is counted as `unoffered-type`, as the spec's fallback says.
- `npx vitest run tests/engine/illegal-actions.acceptance.test.ts`: 5 passed (AC#5 ~2.2 s).
- `npm run format`; `npm run lint`: clean; `npm run typecheck`: clean.
- `npm test`: 119 files, 423 passed / 6 skipped; coverage 96.84% statements overall, thresholds hold.
- `npm run playtest -- --hands 10000 --seed 42 --size 6`: fold 5470, showdown 4530, actions 88831, capped 244, largest pot $70, 0 invariant violations (matches TASK-1.12 baseline).
