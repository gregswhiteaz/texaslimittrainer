# TASK-7.35 — Changes

- `src/advice/ranges.ts` — `rangesFor` returns `DEFAULT_RANGES[referenceSizeOf(dealtIn)]` (3–7 seats use the 6-max
  ranges); `OpponentRange.position` / `line` / `widthPct` are non-null; the dead "no default ranges" branch in
  `estimateOpponentRanges` is gone; doc comments updated.
- `tests/advice/small-table-ranges.acceptance.test.ts` — new fast acceptance test (SPEC-01, SPEC-03, SPEC-04, SPEC-07).
- `tests/advice/small-table-ranges-playtest.acceptance.test.ts` — new opt-in slow 100,000-hand all-TAG measurement at
  3, 4, 5 and 7 seats (SPEC-06).
- `tests/advice/postflop-ranges.test.ts` — the 5-seat block now asserts the 6-max start (SPEC-05).
- `package.json` — adds the new slow file to `test:slow`.
- `docs/advice/range-model.md` — size table, positions at 3/4/5/7 seats, observed scaling, "Other table sizes" and
  the new "Effect at 3, 4, 5 and 7 seats (TASK-7.35)" section.
- `docs/advice/postflop-rules.md` — removes the 3/4/5/7-seat "Later work adds" bullet.
- `doit/TASK-7.35/changes.md`, `doit/TASK-7.35/build-log.md` — build records.

No new dependencies.
