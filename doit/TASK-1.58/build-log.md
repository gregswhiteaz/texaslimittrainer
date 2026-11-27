## Build (BUILD mode)
- Changed only `tests/playtest/style-check-short-handed.test.ts` (17+/6-). Timeout passed as vitest's options argument `{ timeout: 20_000 }` (shared `LIMIT` const) rather than the numeric third argument, because prettier would re-wrap both `it(...)` bodies with the trailing number (~88 diff lines vs a 30-line budget); the limit is the same 20 000 ms per test.
- `npx vitest run --coverage tests/playtest/style-check-short-handed.test.ts`: 2 passed; 1015 ms and 4 ms (≤ 2000 ms each).
- `npx vitest run tests/playtest/style-check-short-handed.test.ts -t "6-max"`: 1 passed, 1 skipped.
- `npm run playtest -- --hands 200 --seed 42 --size 3 --check-styles`: unopened 14/2, blind-defence 9/3.
- `npm run format` run.
