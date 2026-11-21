# Changes — TASK-1.12

- `src/engine/hand.ts` — export `STREET_BET_CAP = 4`; `legalActions` offers `raise` only while `state.betCount < STREET_BET_CAP` (D-1).
- `src/playtest/policy.ts` — `randomMovePolicy` draws uniformly over `view.legalActions` with no betCount filter; doc comment updated.
- `src/advice/preflop.ts` — imports `STREET_BET_CAP` from the engine in place of the local `const CAP = 4` (D-2).
- `tests/engine/bet-cap.acceptance.test.ts` — new: SPEC-01..SPEC-07 (AC#1–AC#6), including the 100,000-hand random run (A-3).
- `tests/engine/invariants.test.ts` — new unit `bet-cap counts action records, not the engine cap` (SPEC-07).
- `tests/playtest/policy.test.ts` — replaced the filter test with `draws from the engine's legal set without its own bet-cap filter` (SPEC-08).
- `tests/playtest/runner.test.ts` — over-cap part of "stops a hand at its first violation…" now uses `FAULTS.fifthBet.seams`; removed the now-unused local `alwaysRaise`.
- `tests/support/faulty-engine.ts` — `fifthBet` fault reworked per A-4 (reports `betCount: 3` after the fourth bet so the engine offers a fifth).
- `tests/engine/chip-safety.acceptance.test.ts` — locked (TASK-1.31, unlock per Q-1/D-3): only the AC#1 worst-hand case's `createHand(config())` changed to `createHand(config({ stakes: boundStakes(56_294_995_342_130) }))`; no assertion touched.

No new dependencies.
