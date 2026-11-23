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

## FIX round 1

- `tests/playtest/check-styles.acceptance.test.ts` — every-push tests at lower hand counts (SPEC-01 Mixed 300 + plain 100, SPEC-04/05 Soft/07 at 300, SPEC-10 reuses the shared Mixed 300 run); bodies take the hand count; original-count twins under TLH_SLOW_TESTS with the same assertions; FAST_TIMEOUT_MS 30 s; SPEC-11 records a non-zero exit as `seed N: exit X`.
- `tests/ci/style-bands-workflow.acceptance.test.ts` — `git show main:` comparison replaced with shallow-checkout-safe checks: ci.yml, million.yml, million-lineups.yml contain no `--check-styles` or `style-bands`, and style-bands.yml is the only workflow invoking `--check-styles`.
- `src/playtest/style-check.ts` — `StyleCheck(false)` no longer builds mixed-spot maps.
- `tests/playtest/style-check.test.ts` — the recording-off case asserts no mixed-spot counts are kept (`mixed().size` 0).
