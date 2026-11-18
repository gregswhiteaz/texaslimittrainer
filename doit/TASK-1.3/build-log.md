## BUILD (Code Builder)
- Added `mix32`/`mixState128` and `Xoshiro128.nextIntUnbiased` to `src/engine/seeded-random.ts` (no banned strings; existing vectors unchanged).
- Added `src/engine/deck.ts` per spec §5; golden vectors and both chi-square values (55.097, 33.790) match the spec prototype exactly.
- Wrote `tests/engine/deck.acceptance.test.ts`, `tests/engine/deck.test.ts`, extended `tests/engine/seeded-random.test.ts`, and `e2e/replay-seed.spec.ts`.
- `npm run format` done; `npm run lint` pass; `npm run typecheck` pass.
- `npm test`: 21 files, 59 tests passed, no coverage error; `src/engine` 100% lines.
- `npm run e2e`: 12 passed (includes replay-seed in chromium and webkit).
- SPEC-10 greps: no output.
