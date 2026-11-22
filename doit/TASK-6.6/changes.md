# Changes: TASK-6.6

- `src/bots/lineup.ts` — new: `LINE_UP_PRESETS`, `BOT_NAMES`, `LineUpSeat`, `seatLineUp(preset, size, userSeat)` (R-1..R-4, A-1, A-6). Type-only imports.
- `src/bots/decide.ts` — new: `decideStyle(view, style, random)`, the style dispatch moved from the worker (D-4).
- `src/table/advice-service.ts` — `decideBotDefault = decideStyle`; the four direct bot imports dropped. Behaviour unchanged.
- `src/playtest/policy.ts` — `lineUpPolicyFactory(preset, size)`: seat 1 seeded TAG, seats 2.. their preset styles; random moves in hands without 6 dealt-in seats (D-2).
- `src/playtest/runner.ts` — `PlaytestOptions.lineUp`; `runPlaytest` uses `lineUpPolicyFactory` unless `seams.makePolicy` is set.
- `src/playtest/cli.ts` — `--lineup mixed|tough|soft`: parsing and error, USAGE lines, Options suffix, `Line-up:` and `Line-up note:` header lines, Replay line suffix; also applied in replay mode (A-5).
- `package.json` — `test:slow` includes `tests/playtest/lineup.acceptance.test.ts`.
- `tests/bots/lineup.acceptance.test.ts` — new: AC#1–AC#5 (SPEC-01..05).
- `tests/bots/lineup.test.ts` — new: SPEC-06 errors, purity, worked examples.
- `tests/table/advice-service.test.ts` — SPEC-07 `decideStyle matches each bot's own decision`.
- `tests/playtest/policy.test.ts` — SPEC-08 `lineUpPolicyFactory` runner cases.
- `tests/playtest/cli.test.ts` — SPEC-13 parsing, header, replay suffix; USAGE exact assertion updated to R-5; FIX round 1: 6-max Mixed line-up hands replayed with `--lineup mixed` must print the run's hand, and at least one differs without `--lineup`.
- `tests/playtest/lineup.acceptance.test.ts` — new: SPEC-09..12 (AC#6, AC#7, short 6-max runs, opt-in slow AC#8).

No new dependencies.
