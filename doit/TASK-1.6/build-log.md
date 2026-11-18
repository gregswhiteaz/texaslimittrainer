## BUILD — TASK-1.6

- Added `src/playtest/{policy,runner,cli}.ts`, `tools/playtest/{main.ts,resolve-ts.js}`, `playtest` script and `engines.node >=22.18.0` in `package.json`; tests in `tests/playtest/` (2 acceptance files, 3 unit files) per spec §10.
- `summarize(hands)` is exported from the runner so replay mode reuses the run summary (replay mode = one hand).
- `npm run playtest -- --hands 10000 --seed 42`: exit 0, `Invariant violations: 0`, 7724 capped streets; replay of `000000000000002a0000000000000004 --size 6 --button 4` prints the full hand; `--replay-code XYZ` exits 2 with the fixed message.
- `npm run format` (prettier on new files), `npm run lint`: clean. `npm run typecheck`: clean.
- `npm test`: 41 files passed, 128 tests passed, 1 skipped; coverage 100% lines overall (thresholds hold).
- Scope: 10 new files + package.json, ~1145 lines.
