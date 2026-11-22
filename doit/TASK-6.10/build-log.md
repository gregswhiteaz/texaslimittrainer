## Build (round 0)

- Added `src/playtest/winrate.ts` (Welford tally, `winRate`/`winRateOfTally`, `BotResults`, `formatBotResults`) and wired it into run mode of `src/playtest/cli.ts` via the existing `onHand` callback; the block is appended to the header before `Hands played:`.
- Tests: `tests/playtest/bot-results.acceptance.test.ts` (SPEC-01..06, 6 tests), `tests/playtest/winrate.test.ts` (SPEC-08..11, 4 tests; `winrate.ts` at 100% lines/branches from unit tests alone).
- `npm run format`, `npm run lint`, `npm run typecheck`: clean.
- `npm test`: 178 files passed, 2 skipped; 629 tests passed, 11 skipped. Coverage all files 97.59% lines. No locked test edited.
- SPEC-07: `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | grep -v '^Bot' | shasum -a 256` = `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01` (old baseline, unchanged). Output shows `Invariant violations: 0`.
- New default-run baseline: `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` = `442dbf55bd32d87a5e367d3c5b9be28ec9303c57174783eae5947134aa408fbc`.
- `npm run playtest:million -- --hands 900`: exit 0, `Result: PASS`, shard sections carry the bot block.
- `npm run playtest:million -- --lineups --hands 270`: `Result: PASS`.
