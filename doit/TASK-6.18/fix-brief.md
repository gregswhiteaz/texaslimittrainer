# Fix brief — TASK-6.18 (resolving blocked.json; recorded deviation from spec §5 / SPEC-10)

Decision (orchestrator, autopilot): **Option (b).** Keep TASK-6.1's bot boundary rule intact — do not edit
`tests/bots/tag.test.ts` (loosening it is refused, rightly).
- Move the seed derivation and per-seat generator from `src/bots/random.ts` to `src/engine/bot-random.ts` (engine may
  import seeded-random and deck). Re-export `seatGenerator` from `src/playtest/policy.ts` as before; update imports in
  session/advice-service/tests accordingly. Delete `src/bots/random.ts`.
- In `src/bots/tag.ts`, type `TagOptions.random` structurally (e.g. a local `interface BotRandom { nextUint32(): number }`
  or the minimal shape TAG needs) — no runtime or type import from the engine beyond the already-allowed PlayerView types.
- Update SPEC-10's file references in your tests/notes (the behaviour is unchanged); record the deviation in
  build-log.md and changes.md.
Then confirm `tests/bots/tag.test.ts` passes untouched, run `npm test`, `npm run e2e`, the playtest hash check,
`npm run format`, gate; delete blocked.json. Never push. Leave no background processes.
