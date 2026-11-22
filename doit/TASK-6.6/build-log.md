## BUILD (2026-11-21)
- Added `src/bots/lineup.ts` and `src/bots/decide.ts`; worker now uses `decideStyle`; playtest gains `lineUp` option and `--lineup` CLI flag (header lines, note, replay suffix, replay-mode policies).
- Tests: new `tests/bots/lineup.acceptance.test.ts` (5), `tests/bots/lineup.test.ts` (1), `tests/playtest/lineup.acceptance.test.ts` (4, AC#8 slow/opt-in); added cases to `cli.test.ts`, `policy.test.ts`, `advice-service.test.ts`; USAGE exact assertion updated per SPEC-13.
- `npm run format` clean; `npm run lint` and `npm run typecheck` pass.
- `npm test`: 167 files passed, 1 skipped; 587 tests passed, 9 skipped. Coverage all files 97.14% statements. `npm run test:unit`: 171 passed, 1 skipped; new src files fully covered.
- `TLH_SLOW_TESTS=1 vitest run tests/playtest/lineup.acceptance.test.ts -t AC#8`: passed; tough 57.0 s, mixed 71.6 s per 10,000 hands.
- SPEC-14 baseline: `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` = aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01 (unchanged).
- Scope: 13 files (budget 12; `tests/table/advice-service.test.ts` is required by SPEC-07 but missing from §5's list), about 630 changed lines (budget 700).
- Not done here: the SPEC-15 story doc (`backlog doc`) and CI-green check, which are left for the orchestrator.
