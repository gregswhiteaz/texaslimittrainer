# TASK-10.16 changes

- `src/table/session-report.ts` — `parseSessionReport` rejects `hints` present with `errors` absent (`RangeError('Invalid session report: hints')`); doc comment updated. (SPEC-02)
- `e2e/report-hints.spec.ts` — Hints used tile expected text built test-locally from `stored.hints` with literal `N of M decision(s) (P%)` wording and integer half-up rounding; `hintTile` import removed; all assertions kept. Locked by TASK-10.7, edited under its owner. (SPEC-01)
- `tests/table/session-report-hints.test.ts` — new test `parseSessionReport rejects hints without errors`. (SPEC-02)

No new dependencies.
