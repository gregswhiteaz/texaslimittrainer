# TASK-11.5 changes

- `src/stats/trends.ts` — `TrendGrouping`, `DEFAULT_GROUPING`, `GROUPING_LABEL`, `GROUPING_OPTIONS`, `TrendGroup`; optional `group` on `TrendPoint`/`Bb100Point`; `sessionStartTimes` factored out of `orderHands`; `localDay`, `dayText`, per-session/per-day grouping and point builders; `statisticsView(data, all, grouping)`; grouping-aware `pointLabel`, `chartLabel`, `bb100PointLabel`, `bb100ChartLabel`, plus `chartNote`/`bb100Note`.
- `src/ui/stats/StatisticsScreen.tsx` — "Group by" select (`#stats-group-by`) after Game type; `grouping`/`onGroupingChange` props; notes and aria-labels by grouping.
- `src/ui/App.tsx` — stats state carries `grouping`, reset to Every 500 hands on every opening/load, passed on filter and grouping changes.
- `dreams/limit-holdem-trainer/storyboards/Stats.dc.html` — Group by options now Every 500 hands (selected), Session, Day (AC#7).
- `docs/stats/trends.md` — Grouping section and test list entries.
- `tests/stats/trend-grouping.acceptance.test.tsx` — new acceptance tests SPEC-01..SPEC-09.
- `tests/stats/trends.test.ts` — unit cases SPEC-10, SPEC-11.
- `e2e/statistics-grouping.spec.ts` — new Playwright flow SPEC-12 (Chromium + WebKit, axe, origins, America/New_York).

No new dependencies.
