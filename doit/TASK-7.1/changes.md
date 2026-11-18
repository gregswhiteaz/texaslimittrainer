# Changes — TASK-7.1

- `src/advice/equity.ts` — new: equity calculator (`computeEquity`, types, validation, canonicalisation, method rule, exact enumeration, seeded whole-deal sampler).
- `src/engine/seeded-random.ts` — new (A-11): `fnv1a32`, `splitMix32`, `Xoshiro128` (xoshiro128**) seeded PRNG.
- `tools/equity/generate-reference.js` — new: offline exhaustive generator (`enumerateExact`, `REFERENCE_MATCHUPS`, CLI writes the fixture). Uses only `evaluate`/`parseCards` from `src/engine`, nothing from `src/advice`.
- `tests/advice/fixtures/equity-reference.json` — new: generated reference set (120 heads-up preflop + mw-001), one case per line.
- `.prettierignore` — modified: ignore `tests/advice/fixtures` (A-7).
- `tests/advice/equity.acceptance.test.ts` — new: AC#1–AC#5 (SPEC-01, 02, 04, 05, 06).
- `tests/advice/equity-reference.test.ts` — new: fixture consistency and 2-case re-enumeration (SPEC-03).
- `tests/advice/equity.test.ts` — new: unit tests (SPEC-07, 08, 09, 10).
- `tests/advice/equity.perf.test.ts` — new: latency suite with `EQUITY_PERF_SCALE` (SPEC-11, 12).
- `tests/engine/seeded-random.test.ts` — new: hash and PRNG test vectors (SPEC-13).

No new dependencies.
