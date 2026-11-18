## BUILD — 2026-11-18
- Implemented `src/advice/postflop.ts` and `src/advice/recommend.ts` per spec §5; wrote `docs/advice/postflop-rules.md` (original prose).
- Wrote acceptance (6 tests), unit (6 tests) and perf (1 test) files under `tests/advice/`.
- `npm run typecheck`: pass. `npm run lint`: pass (after removing one unused import). Prettier applied to new files.
- `npx vitest run tests/advice/postflop.*`: 3 files, 13 tests passed. Perf p95: HU 5.4 ms, 6-max 12.9 ms, 10-seat 71.4 ms (local, scale 20).
- Full `npm test` left to the stop-hook gate.

## FIX round 1
- Item 1 (rounded-comparison-not-pinned): fixed — added a flop `pot-odds-call` case in tests/advice/postflop.test.ts with injected equity 0.1665 vs required 4/24 (1/6), expecting call with equityPct 16.7 and requiredEquityPct 16.7. Mutation check: swapping src/advice/postflop.ts:96 to the unrounded comparison made the test fail (1 failed | 5 passed); src reverted unchanged. `npx vitest run tests/advice/postflop.test.ts`: 6 passed. `npm run typecheck`: clean. `npm run lint`: clean.
