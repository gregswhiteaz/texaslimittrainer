# Changes — TASK-1.3

- `src/engine/deck.ts` — new: `ReplayCode` type, `newReplayCode` (128-bit seed from `globalThis.crypto.getRandomValues`, redraws all-zero), `replayCodeFromWords`, `isReplayCode`, `shuffledDeck` (Durstenfeld Fisher–Yates driven by xoshiro128** seeded via `mixState128`).
- `src/engine/seeded-random.ts` — modified: extracted the SplitMix32 finaliser into a private `mix32` (used by `splitMix32`, outputs unchanged); added `mixState128` and `Xoshiro128.nextIntUnbiased` (Lemire multiply-shift with rejection).
- `tests/engine/deck.acceptance.test.ts` — new: AC#1, AC#2 (chi-square), AC#3 (Node crypto), AC#4 (determinism and golden vectors) — SPEC-01, 02, 03, 06.
- `tests/engine/deck.test.ts` — new: SPEC-05 (all-zero redraw), SPEC-07 (format/round trip), SPEC-08 (RangeError cases).
- `tests/engine/seeded-random.test.ts` — modified: SPEC-09 (`nextIntUnbiased`) and SPEC-13 (`mixState128`) tests.
- `e2e/replay-seed.spec.ts` — new: SPEC-04, bundles `src/engine/deck.ts` in memory with Vite `build()` and checks the browser seed source and golden deck in Chromium and WebKit.

No new dependencies.
