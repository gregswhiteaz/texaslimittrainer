# TASK-6.2 changes

## Source
- `src/bots/style.ts` — new: style types, `SPOT_TYPES`, `parseStyle` validator, `StyleValidationError`, `drawMixed` (D-1, A-2). Fix round 1: a mixed spot with a bad sum and a zero action reports both problems.
- `src/bots/styles/tag.json` — new: TAG's style file (description, five mixed preflop spot types at 0.75/0.25, justifications) (D-2).
- `src/bots/tag.ts` — `TAG_STYLE` loaded and validated at import; `decideTag` mixes when a generator is passed (D-3).
- `src/playtest/policy.ts` — `seededTagPolicy(code)` (D-4).
- `src/playtest/runner.ts` — `defaultPolicyFactory(6)` returns the seeded TAG factory; doc comment updated (D-4).
- `src/engine/bot-random.ts` — exported `MAX_BOT_SEED`, `isBotSeed`; `botRandom` uses them (D-6).
- `src/table/advice-service.ts` — uses `isBotSeed`; local `isSeed` and the literal bound removed (D-6).
- `tools/lint/headless-boundary.js` — guard covers `src/engine/bot-random.ts`, `globalThis.Math` and bare global references (D-7, A-4).

## New tests
- `tests/bots/tag-mixing.acceptance.test.ts` — SPEC-01..SPEC-05.
- `tests/bots/tag-seed-parity.acceptance.test.ts` — SPEC-06. Fix round 1: records the seed the playtest policy passes to `botRandom` (module mock wrapping the real function) and asserts it equals the worker request's seed for every bot decision.
- `tests/bots/style.test.ts` — SPEC-07, SPEC-08; fix round 1 adds the {0,0} case.

## Extended / updated unlocked tests
- `tests/toolchain/bot-determinism.test.ts` — SPEC-09, SPEC-10 probes.
- `tests/bots/random.test.ts` — SPEC-11 shared seed bound and guard.
- `tests/playtest/runner.test.ts` — default 6-max policy is the seeded TAG decision (`:205`, `:336`).
- `tests/table/advice-service.test.ts` — `seed: 0` bot request expects `decideTag(view, { random: botRandom(0) })`.

## Locked-test edits (D-5, exact seeded equality only)
1. `tests/ui/advice-worker.acceptance.test.ts` (TASK-3.6) — `decideBot(view, 'TAG', botDecisionSeed(code, view))`.
2. `e2e/responsive-table.spec.ts` (TASK-3.6) — bot seats replayed with `seededTagPolicy(code)`.
3. `tests/bots/tag-playtest.acceptance.test.ts` (TASK-6.1) — AC#5 and AC#6 compare each action with the exact seeded decision.
4. `tests/bots/bot-random.acceptance.test.ts` (TASK-6.18) — only `:85` failed; it now compares with the exact seeded decision. `:174-176` passed unchanged and was not edited.
5. `tests/playtest/games.acceptance.test.ts` (TASK-1.16, Q-4) — the AC#6 sit-and-go run passes an explicit `makePolicy` reproducing the pre-6.2 default (pure `tagPolicy` at 6 dealt-in seats, random-move otherwise); every assertion unchanged.

No new dependencies.
