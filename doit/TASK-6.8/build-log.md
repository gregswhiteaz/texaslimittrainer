## BUILD (TASK-6.8)
- Implemented the replacement rule per spec: `replacementGenerator` (bot-random), replacement styles/names (lineup), `nextHand` cash replacement + `nextBotName` (session), `seatStylesPolicyFactory` (policy), per-hand line-up and replacement in `--lineup` cash playtests (runner), `Bots replaced:` / `--styles` (cli), `test:slow` entry.
- Deviation (placement only): `drawReplacementStyle` lives in `src/table/session.ts`, not `src/bots/lineup.ts`. The existing unit test `tests/bots/tag.test.ts::bots import only PlayerView-boundary types from the engine` forbids any `src/bots/*` file from importing engine runtime code or `ReplayCode`; the draw needs `replacementGenerator` and `isReplayCode`. Same signature, seeding and behaviour; session.ts is its main consumer and the runner imports it from there.
- Locked-test edits exactly as approved in Q-4: `tests/table/next-hand.acceptance.test.ts` (lines 93-96; sixty-hand test: changed stack only for a bot on 0 with a new name or the user below 96; hand 43 seat-2 bot keeps $94) and `tests/playtest/policy-lineup.acceptance.test.ts` (200 → 45 hands; both `toEqual` and `not.toEqual` hold at 45). Unlocked: `tests/support/table-scenarios.ts` gains `nextBotName: 0`; `tests/playtest/cli.test.ts` USAGE line 2.
- Measured (seed 42, 300 hands): Mixed replaces seat 3 at hand 57 (Jay, TAG), seat 4 at 109 and 181; Soft one replacement (Rock); Tough first replacement at hand 46.
- `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` → `aacd5e94…e01` (unchanged).
- `npm run playtest -- --hands 10000 --seed 42 --lineup mixed` → exit 0, `Invariant violations: 0`, `Bots replaced: 34` (about 7 s).
- `TLH_SLOW_TESTS=1 vitest run tests/playtest/replacement.acceptance.test.ts` → 3 passed (slow test 13.5 s for two runs).
- `npm test` → 173 files passed, 1 skipped; 609+ tests passed, 10 skipped. `npm run test:unit` → coverage thresholds met (session.ts replacement branch covered by `tests/table/next-hand.test.ts`). No new unit test above ~2 s.
- `npm run e2e` → 142 passed, 12 skipped.
- `npm run format`, `npm run lint`, `npm run typecheck` → clean.

## FIX r1 (code review MINORs)
- Item 1 (Soft per-draw check in the playtest replacement acceptance test): not done. The builder hook rejects edits to locked acceptance tests. The orchestrator needs to unlock the file or apply the change.
- Item 2 (duplicated `withFinalStacks`): partly fixed. Moved it to `tests/support/table-scenarios.ts` (exported), and `tests/table/next-hand.test.ts` now imports it. The table replace-bot acceptance test still has its own local copy because the lock hook rejected the edit that swaps it for the import.
- Item 3 (one slug helper in the playtest replacement acceptance test): not done, same lock.
- Commands: `npm run format` ok; `npx vitest run tests/table` → 26 files, 70 tests passed; `npx tsc --noEmit` clean.
- After the coordinator said it had unlocked both acceptance files, I tried again and the hook still refused the edit ("locked acceptance test"). `doit/TASK-6.8/state.json` `locked_tests` still lists both files with their hashes. Items 1, 3 and the rest of item 2 are still outstanding. I didn't touch state.json or try to get around the hook.
- After the second unlock message, my first edit was refused again. state.json has no `relock_pending` key, and `locked_tests` lists both files again. My previous finish most likely re-ran the stop-hook gate before this message reached me, and the gate re-locked them. Items 1, 3 and the rest of item 2 are still outstanding.

## FIX r1 (completed after unlock)
- Item 1: fixed. `tests/playtest/replacement.acceptance.test.ts` now also asserts each Soft replacement's style equals `drawReplacementStyle('Soft', 6, handReplayCode(42, hand - 1), seat)`; the existing Calling station/Rock check is kept.
- Item 2: fixed. `tests/table/replace-bot.acceptance.test.ts` drops its local copy and imports `withFinalStacks` from `tests/support/table-scenarios`.
- Item 3: fixed. One `styleSlugs(hand)` helper replaces both slug conversions in `tests/playtest/replacement.acceptance.test.ts`.
- Commands: `npm run format` ok; `npx vitest run` on replace-bot acceptance, next-hand unit, playtest replacement acceptance → 3 files, 10 passed, 1 skipped (slow opt-in); `npx tsc --noEmit` clean; eslint on both files clean.
