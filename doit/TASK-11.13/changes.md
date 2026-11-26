# TASK-11.13 — Changes

- `src/stats/trends.ts` — modified: new `filteredStatisticsView(data, filter, grouping)` (G-2 from every hand) and `filterOption(options, value)` (unknown id → `'all'`).
- `src/ui/App.tsx` — modified: `stats` screen state split into a loading/failed member (no `data`) and a loaded member (`data` required, D-3); every view computed through `filteredStatisticsView`; both `data === undefined` guards removed; no longer imports `statisticsView`/`filterTrendData`.
- `src/ui/stats/StatisticsScreen.tsx` — modified: Table size, Game type and Line-up `onChange` use `filterOption` instead of `as` casts; unused filter type imports dropped.
- `tests/support/stat-records.ts` — modified: `TEMPLATE_DECISIONS` removed; deterministic `shuffled` LCG helper added.
- `tests/support/time-zone.ts` — new: `pinTimeZone(zone)` for Vitest files (sets `TZ`, throws if not applied, restores in `afterAll`).
- `tests/stats/trend-order.acceptance.test.tsx` — new: SPEC-01 (AC#1) and SPEC-02 (AC#2).
- `tests/stats/trends.test.ts` — modified: `pinTimeZone('Pacific/Kiritimati')`, plus SPEC-06, SPEC-08 and SPEC-10 unit cases.
- `tests/stats/trend-grouping.acceptance.test.tsx` — modified (locked, TASK-11.5, unlocked per qa.md): `pinTimeZone` import and one top-level call only.
- `e2e/statistics-speed.spec.ts` — modified: timer stops when the 6th point is visible (A-6), checked on mutations and animation frames; still opt-in.
- `e2e/statistics-hardening.spec.ts` — new: SPEC-05 (AC#4) and SPEC-07 (AC#5) in the real App.
- `docs/stats/trends.md` — modified: unknown-value rule, `filteredStatisticsView`, the time-zone pin and the new tests.

No new dependencies.
