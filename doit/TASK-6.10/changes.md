# TASK-6.10 changes

- `src/playtest/winrate.ts` — created: Welford `Tally` (`newTally`, `addResult`), `winRate`/`winRateOfTally` (BB/100 and 95% interval from the sample SD), `BotResults` tracker keyed by (seat, name, style) fed by `PlayedHand`s (abandoned hands ignored), and `formatBotResults` (the `Bot results` line and one `Bot:` row per bot).
- `src/playtest/cli.ts` — modified: run mode feeds every hand to a `BotResults` through the existing `onHand` callback (which still counts replacements) and appends the bot block to the header, before `Hands played:`. Replay mode and `formatReport` unchanged.
- `tests/playtest/bot-results.acceptance.test.ts` — created: SPEC-01 to SPEC-06.
- `tests/playtest/winrate.test.ts` — created: SPEC-08 to SPEC-11 units.

New dependencies: none.
