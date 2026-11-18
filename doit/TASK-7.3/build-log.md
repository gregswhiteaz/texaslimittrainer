## BUILD — 2026-11-18
- Implemented `src/advice/postflop.ts` and `src/advice/recommend.ts` per spec §5; wrote `docs/advice/postflop-rules.md` (original prose).
- Wrote acceptance (6 tests), unit (6 tests) and perf (1 test) files under `tests/advice/`.
- `npm run typecheck`: pass. `npm run lint`: pass (after removing one unused import). Prettier applied to new files.
- `npx vitest run tests/advice/postflop.*`: 3 files, 13 tests passed. Perf p95: HU 5.4 ms, 6-max 12.9 ms, 10-seat 71.4 ms (local, scale 20).
- Full `npm test` left to the stop-hook gate.
