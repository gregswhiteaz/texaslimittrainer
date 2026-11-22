# TASK-6.9 build log

## BUILD (2026-11-22)
- Implemented `--lineups` (shards.ts), earlier showdowns + `composeChecks` (runner.ts), `million-lineups.yml`, `test:slow` entry, and the tests named in SPEC-01/03/04/06/07/08/09/10.
- `npm run format`, `npm run lint`, `npm run typecheck`: clean.
- `npm test`: 176 files passed, 2 skipped; 618 tests passed, 11 skipped.
- `npm run test:unit`: 47 files, 181 passed / 1 skipped; coverage runner.ts 99.4% lines, shards.ts 100% lines.
- Baselines unchanged: `--hands 10000 --seed 42 --size 6` → aacd5e94…; `--hands 2000 --seed 42 --lineup tough` → 757901b0…; `playtest:million -- --hands 900` → 1b561d21….
- `time npm run playtest:million -- --lineups`: exit 0, 27 of 27 shards, 1000000 hands, 0 violations, PASS; 26.0 s real (114 s user), Apple M4 Pro, Node v22.18.0.
- `time npm run playtest -- --hands 100000 --size 6 --lineup mixed`: Hands played 100000, 0 violations, 27.3 s real (Apple M4 Pro, Node v22.18.0). Slow test not run via vitest (opt-in).
- Test times (no coverage): style-bots acceptance 4.2 s / 1.3 s / 6.8 s; million-lineups acceptance 1.0 s / 3.9 s. Under `npm test` coverage the style-bots tests take ~13–34 s each, so they carry a 120 s timeout (repo convention). All in the acceptance (sweeps) group; no unit-group test exceeds 0.1 s.
- Note: Tough at 6 seats is slower than the spec §3 table suggests (2,000 hands in about 6 s via the CLI), the same at the base commit (checked on an archive copy of e7f7166); not a regression.

## FIX r1 (2026-11-22)
- J-1-01: fixed — new unit test "earlier showdowns hold only showdowns since the last restart, hands after it too" in `tests/playtest/runner.test.ts` checks hands 2 and 3 after a flagged (violation) cash hand and hand 2 after a new sit-and-go see only post-restart showdowns (12 ms). Mutation proof: deleting the violation-path `showdowns = []` (runner.ts:369) or the new-sit-and-go one (runner.ts:389) each fails only the new test; source restored byte-for-byte (sha1 e60ed29e unchanged, no git diff in src/).
- `npm run format`, `npm run lint`, `npm run typecheck`: clean. `npm test`: 176 files passed, 2 skipped; 619 tests passed, 11 skipped.
