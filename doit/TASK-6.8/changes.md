# Changes — TASK-6.8

- `src/engine/bot-random.ts` — added `replacementGenerator(code, seat)` = `Xoshiro128(fnv1a32(`${code}/${seat}/replace`))` (D-1).
- `src/bots/lineup.ts` — added `REPLACEMENT_NAMES` (Jay…Zed), `replacementStyles` (D-3), `replacementName` and `nextReplacementName` (D-2). No engine imports (see deviation below).
- `src/table/session.ts` — `TableState.nextBotName` (0 at seating); `drawReplacementStyle` (D-1; placed here instead of `src/bots/lineup.ts`, see build-log deviation); `nextHand` replaces a cash bot on $0 with a new named bot drawn from the line-up at $160, keeps bots with ≥ $1, keeps the TEMPORARY top-up for the user seat and sit-and-go; A-6 RangeError.
- `src/playtest/policy.ts` — new `seatStylesPolicyFactory(seats)`; `lineUpPolicyFactory` delegates to it (same signature and behaviour).
- `src/playtest/runner.ts` — `--lineup` cash runs replace busted bots after clean hands (seeded from the hand's replay code), restart preset seats after a violation (A-4); `PlayedHand.lineUp` / `PlayedHand.replaced`. Default runs unchanged.
- `src/playtest/cli.ts` — `Bots replaced: <n>` line for `--lineup` cash runs; `--styles` option (replay mode only, with `--lineup`), its parse errors, USAGE line 2; Replay line appends `--styles` when a bot's style differs from the preset; Line-up line built from seats.
- `package.json` — `test:slow` also runs `tests/playtest/replacement.acceptance.test.ts`.
- `tests/bots/replacement.acceptance.test.ts` — new: SPEC-05/06/07 tallies (AC#3, AC#7, AC#8) and the name sequence.
- `tests/table/replace-bot.acceptance.test.ts` — new: SPEC-01/02/03 (AC#1, AC#2, AC#4, AC#9) through `nextHand`.
- `tests/playtest/replacement.acceptance.test.ts` — new: SPEC-09, SPEC-11 (300-hand CLI count), SPEC-12, and the opt-in slow SPEC-10 run.
- `tests/bots/lineup.test.ts` — unit: SPEC-08 (determinism, names, RangeErrors).
- `tests/playtest/cli.test.ts` — unit: USAGE line 2, `--styles` parse errors and success, `Bots replaced:` presence/absence, Replay-line `--styles` suffix, `--styles` replay echo and Line-up line.
- `tests/table/next-hand.test.ts` — unit: SPEC-04 (user / sit-and-go seats never replaced), A-6 error, replacement branch coverage.
- `tests/support/table-scenarios.ts` — the hand-built `TableState` literal gains `nextBotName: 0` (required field).
- `tests/table/next-hand.acceptance.test.ts` — locked (TASK-3.4), edited as approved in Q-4: lines 93-96 expect a new bot Jay at seat 1; the sixty-hand test allows a changed stack only for a bot on 0 (new name) or the user below 96, and asserts the seat-2 bot ending hand 43 on $94 keeps $94.
- `tests/playtest/policy-lineup.acceptance.test.ts` — locked (TASK-1.52), edited as approved in Q-4: the Tough run is 45 hands (both the `toEqual` and the `not.toEqual` hold at 45).

No new dependencies.
