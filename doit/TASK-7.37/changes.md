# Changes: TASK-7.37

- `src/bots/tag.ts` — adds `TAG_SHORT_HANDED_SEATS`, `TAG_SHORT_HANDED_CHART` (SIX_MAX_CHART with BTN and SB unopened cells replaced by CO unopened cells) and `tagChartFor`; `decideTag` passes that chart to `recommend` on preflop views with 3 or 4 dealt-in seats unless `options.chart` is given.
- `src/playtest/style-check.ts` — the mixed-spot tally reads the same chart as `decideTag` (`tagChartFor`) on preflop views.
- `src/bots/styles/tag.json` — one description sentence naming the short-handed exception (A-3).
- `tests/bots/tag-short-handed.acceptance.test.ts` — new fast acceptance test (SPEC-01, SPEC-02, SPEC-03).
- `tests/bots/tag-short-handed-playtest.acceptance.test.ts` — new opt-in slow 100,000-hand acceptance test (SPEC-04).
- `tests/playtest/style-check-short-handed.test.ts` — new unit test for the style-check tally at 3 seats (SPEC-05).
- `package.json` — adds the slow test to `test:slow`.
- `docs/advice/range-model.md` — new "TAG at 3 and 4 seats (TASK-7.37)" section with before/after table; TASK-7.35 VPIP lines note the fix (SPEC-06).
- `doit/TASK-7.37/changes.md`, `doit/TASK-7.37/build-log.md` — work-folder records.
- `doit/TASK-7.37/blocked-1.resolved.json` — SPEC-08 conflict (resolved, qa.md Q-1 option a): locked `tests/playtest/summary.acceptance.test.ts` fixture depended on 4-seat TAG play.
- `tests/playtest/summary.acceptance.test.ts` — (unlocked under owner TASK-1.26 per Q-1) `withAwards` copies the result without its optional `returned` field so the fixture checks largestPot = award sum independent of TAG play; no assertion changed.

No new dependencies.
