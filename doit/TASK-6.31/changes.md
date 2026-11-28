# TASK-6.31 changes

- `src/playtest/style-check.ts` — export `MIN_JUDGED_DECISIONS = 10`; `formatStyleReport` judges a mixed spot only when recommended + alternative >= 10 and lists 1–9 spots as `Not judged (fewer than 10 decisions): <style> <spot>` after the `Mixed spot:` lines.
- `src/playtest/cli.ts` — `--check-styles` usage line states the 10-decision minimum (A-1).
- `tests/playtest/cli.test.ts` — the two copies of the usage line.
- `tests/playtest/style-check.test.ts` — `formatStyleReport` assertions moved into the new test "formatStyleReport judges a mixed spot only when it came up at least 10 times" (0/0, 1/0, 9/0, 0/9, 3/4, 9/1, 10/0, 0/10, no check).
- `tests/playtest/check-styles.acceptance.test.ts` — locked (TASK-6.11, TASK-6.25; unlocked with reason): fast `mixedSpots(300)` re-pinned to `mixedSpots(1000)`.
- `tests/playtest/check-styles-three-seats.acceptance.test.ts` — locked (TASK-7.46; unlocked with reason): asserts exit 0, `Style check: passed`, no `One action only:`; comment cites the REQ-028 fit criterion.
- `tests/playtest/check-styles-not-judged.acceptance.test.ts` — new fast acceptance test (SPEC-09).
- `docs/stats/style-stats.md` — 10-decision rule and the 3-seat 100,000-hand exit 0.
- `docs/advice/range-model.md` — 3-seat table row `exit 0`; paragraph replaced with the current measurement, citing the REQ-028 fit criterion.
- `doit/TASK-6.11/state.json`, `doit/TASK-6.25/state.json`, `doit/TASK-7.46/state.json` — unlock records written by `doit.py unlock`.

No new dependencies.
