## BUILD (round 0)

- Added src/stats/style-stats.ts per spec §5 (three layers: per-hand counts, sums, percentages; formatStat with U+2014).
- Added acceptance tests (SPEC-01..06) and unit tests (SPEC-07..10). Judgement call on AC#5 (b): a seat that never saw a flop has no postflop actions, so Aggression is necessarily null there too; the test asserts that alongside WTSD/W$SD null and VPIP/PFR numbers.
- Switched tests/bots/style-bands.acceptance.test.ts to handStyleCounts/addStyleCounts/styleStats (Q-1); every assertion kept, rounding is Math.round(v*10)/10 on the styleStats values, null fails.
- npx vitest run tests/stats/ → 2 files, 10 passed.
- TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts -t "seed 42" → 1 passed (140 s). Bands: TAG 22.3/16.4/63.7, Rock 10.1/8.8/48.7, Calling station 58.2/6.4/15.4, Maniac 56.8/54.3/78.7 — identical to main.
- npm run format, npm run lint, npm run typecheck: clean.
- npm test: 208 files passed, 3 skipped; 919 tests passed, 35 skipped.
- Playtest: npm run -s playtest -- --hands 10000 --seed 42 | shasum -a 256 = 14d746f736d6afd3968e7ae7e833814d95dab94378c80c11dd59b1fd6ea72e48 (unchanged), Invariant violations: 0.
- Gate (doit.py gate TASK-7.12): PASS (test, lint, typecheck ok; scope warn 983 vs 560 lines, mostly Prettier-expanded fixtures).
- Judge J-1-01 (orchestrator): unit test adds formatStat(200/3) → '67%' (round-up case).
