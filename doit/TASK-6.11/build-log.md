# Build log — TASK-6.11

## BUILD (2026-11-23)

What was done:
- New `src/playtest/style-check.ts`: band table, StyleCheck (shared `handStyleCounts`/`addStyleCounts`/`styleStats`; mixed-spot recorder hook composed with `checkStep`), `roundStat`, `formatStyleReport`.
- `src/playtest/cli.ts`: `--check-styles` flag, USAGE line, Options echo, style block before Bot results, exit 1 on a failed check, test-only `bands` parameter.
- Tests: unit `tests/playtest/style-check.test.ts` (SPEC-02/06/08), acceptance `tests/playtest/check-styles.acceptance.test.ts` (SPEC-01/03/04/05/07/10 + opt-in SPEC-11), `tests/playtest/cli.test.ts` re-pin + SPEC-09, `tests/ci/style-bands-workflow.acceptance.test.ts` (SPEC-12).
- Dispatch-only `.github/workflows/style-bands.yml` (workflow_dispatch only; no schedule/push/pull_request). Not triggered on GitHub.
- `package.json` test:slow lists the new acceptance file; `docs/stats/style-stats.md` notes the CLI use.

Default playtest (SPEC-13, `npm run -s playtest -- --hands 10000 --seed 42 | shasum -a 256`):
- Baseline on the branch before changes: `14d746f736d6afd3968e7ae7e833814d95dab94378c80c11dd59b1fd6ea72e48`, 13.75 s / 13.96 s.
- After: `1eb65ef2cbd611efa25a131801e52f97546fdeb40fea3efc841db8cf861238a5`, 14.39 s / 14.50 s (+4.3%, within +10%). Exit 0, `Invariant violations: 0`.
- `npm run playtest -- --hands 10000 --seed 42 --lineup mixed`: exit 0, `Invariant violations: 0`.

Million output (`npm run -s playtest:million -- --hands 900 | shasum -a 256`):
- Was `4ff17256…2d32`; now `8cd39126ace1472977cf969244ba979f97f0586669efa613594d533ca64b59c4` (shard stdout includes the new style block). Exit 0.

Opt-in slow SPEC-11 (`TLH_SLOW_TESTS=1 npx vitest run tests/playtest/check-styles.acceptance.test.ts -t "100,000"`): 1 passed, 449.9 s. All three seeds exit 0 with `Style check: passed`, no Outside band / One action only lines:
- seed 42: TAG 402624 hands VPIP 22.3 PFR 16.4 AGG 63.7; Calling station 7135 VPIP 58.2 PFR 6.4 AGG 15.4; Maniac 3932 VPIP 56.8 PFR 54.3 AGG 78.7; Rock 86309 VPIP 10.1 PFR 8.8 AGG 48.7. Mixed (rec/alt): unopened 6161/1985, limpers 133/49, raise 1240/461, raise-and-calls 23/2, blind-defence 4391/1491.
- seed 7: TAG 424998 VPIP 22.3 PFR 16.4 AGG 63.7; Calling station 6605 VPIP 59.4 PFR 7.0 AGG 14.5; Maniac 4955 VPIP 56.3 PFR 53.7 AGG 77.7; Rock 63442 VPIP 10.1 PFR 8.7 AGG 46.8. Mixed: 6486/2088, 122/43, 1334/472, 18/5, 4876/1553.
- seed 1234: TAG 458718 VPIP 22.2 PFR 16.3 AGG 63.5; Calling station 3818 VPIP 60.4 PFR 6.8 AGG 15.9; Maniac 3169 VPIP 56.5 PFR 53.4 AGG 79.6; Rock 34295 VPIP 10.0 PFR 8.6 AGG 46.8. Mixed: 6882/2284, 98/27, 1399/474, 26/9, 5317/1770.
- Note: TAG aggression (63.5-63.7%) sits close to its 65% ceiling; at 2,000 hands it read 67.2% (out of band), so short runs can fail `--check-styles` without a tuning problem.

Commands and results:
- `npm run typecheck`: pass. `npm run lint`: pass (after `npm run format`).
- `npm test`: 215 files passed, 3 skipped; 947 tests passed, 36 skipped. Coverage all files 97.3% statements.
- New fast acceptance tests take about 25 s standalone (spec target ≤ 15 s); under the parallel coverage run they take 11-44 s each, so their timeout is 120 s.
- Scope: about 1,040 changed lines against a budget of 850 (warn band); most of it is test code.
