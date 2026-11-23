# Changes — TASK-6.11

- `src/playtest/style-check.ts` — new: REQ-027 band table, `StyleCheck` (per-style tally with the shared style-stat functions and the mixed-spot recorder hook), `roundStat` and `formatStyleReport` (style block and verdict).
- `src/playtest/cli.ts` — `--check-styles` flag (parse, USAGE, Options echo), style block before Bot results in every run report, recorder composed with `checkStep`, exit 1 on a failed style check, test-only `bands` parameter of `main`.
- `tests/playtest/style-check.test.ts` — new unit tests: SPEC-02, SPEC-06, SPEC-08.
- `tests/playtest/check-styles.acceptance.test.ts` — new acceptance tests: SPEC-01, 03, 04, 05, 07, 10 (every push) and SPEC-11 (opt-in slow, 100k × 3 seeds).
- `tests/playtest/cli.test.ts` — re-pinned USAGE and the Line-up → style block adjacency; new SPEC-09 flag test.
- `package.json` — `test:slow` lists the new check-styles acceptance test.
- `.github/workflows/style-bands.yml` — new dispatch-only workflow running the three 100k `--check-styles` seeds.
- `tests/ci/style-bands-workflow.acceptance.test.ts` — new SPEC-12 structure test for that workflow.
- `docs/stats/style-stats.md` — short paragraph on the playtest CLI style block and `--check-styles`.

No new dependencies.
