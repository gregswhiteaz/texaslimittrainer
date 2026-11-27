# Changes — TASK-1.58

- `tests/playtest/style-check-short-handed.test.ts` — HANDS 300 → 200; capture playtest split into `capturePreflop()` and cached lazily by `preflopDecisions()` (which still asserts `violations` is 0 on every call); both tests get `{ timeout: 20_000 }` via the vitest options argument; comment citing the CI measurement.

No new dependencies.
