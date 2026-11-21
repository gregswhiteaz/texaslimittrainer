# TASK-6.18 changes

- `src/engine/bot-random.ts`: new. `seatGenerator` (moved unchanged from src/playtest/policy.ts), `botDecisionIndex`, `botDecisionSeed`, `botRandom` (D-1). Recorded deviation (fix brief, option b): the spec put this in `src/bots/random.ts`, but TASK-6.1's bot boundary rule (`tests/bots/tag.test.ts`, unchanged) forbids runtime engine imports in src/bots.
- `src/playtest/policy.ts`: `seatGenerator` body removed; re-exported from `../engine/bot-random` so existing imports and the random-move stream are unchanged.
- `src/bots/tag.ts`: `TagOptions = RecommendOptions & { random?: BotRandom }`, where `BotRandom` is a structural `{ nextUint32(): number }` interface (fix brief: no engine import). `decideTag` accepts it and ignores it (A-2).
- `src/table/advice-service.ts`: `seed` on the bot request. A seed that isn't an integer in 0..4294967295 gives `TypeError('Malformed bot request seed')`. `decideBot(view, style, botRandom(seed))`. The default calls `decideTag(view, { random })` (D-4).
- `src/table/session.ts`: `BotTurn.seed = botDecisionSeed(replayCode, view)`. `botTurn` throws `RangeError('Not a bot turn')` when `replayCode` is null.
- `src/ui/advice/advice-client.ts`: `decideBot(view, style, seed = 0)`; `seed` is sent in the bot payload (A-3).
- `src/ui/table/useTableSession.ts`: `requestBotDecision` passes `turn.seed`.
- `tools/lint/headless-boundary.js`: headless property/syntax entries factored into constants; adds `BOT_DETERMINISM_FILES` and `botDeterminismConfig` (D-2).
- `eslint.config.js`: registers `botDeterminismConfig` after `headlessBoundaryConfig`.
- `tests/bots/bot-random.acceptance.test.ts`: new, SPEC-01 to SPEC-04.
- `tests/table/bot-seed.acceptance.test.ts`: new, SPEC-05.
- `tests/bots/random.test.ts`: new, SPEC-06 plus botRandom and re-export units.
- `tests/toolchain/bot-determinism.test.ts`: new, SPEC-08.
- `tests/table/bot-turn.test.ts`: the posted bot message now has keys `id, kind, seed, style, view` with `seed: turn.seed`. Adds the `replayCode: null` → `RangeError('Not a bot turn')` case.
- `tests/table/advice-service.test.ts`: `seed: 0` on the bot requests; new case `bot requests need a 32-bit integer seed` (SPEC-07).

No new dependencies.
- `doit/TASK-6.18/blocked.json`: created in BUILD 1 (the TASK-6.1 boundary unit test blocked the spec'd location), deleted after the fix brief (option b).
