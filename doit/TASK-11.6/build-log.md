## BUILD (2026-11-25)
- ReportScreen: optional `onStatistics`; `.report-actions` row (View statistics `.button-outline` when given, then Back to Home). App: `openStatistics()` shared by Home and the report. CSS `.report-actions`. Docs: navigation.md table rows + paragraph.
- Tests: `tests/ui/report-navigation.acceptance.test.tsx` (SPEC-01, SPEC-02, 2 tests); `e2e/report-navigation.spec.ts` (SPEC-03..05, 3 tests x 2 browsers; WebKit Tab order uses Alt+Tab).
- `npm run lint` pass; `npm run typecheck` pass; `npm test` pass (299 files passed, 5 skipped; coverage thresholds met).
- `npm run build && npx playwright test e2e/report-navigation e2e/session-report e2e/play-money e2e/statistics e2e/home e2e/session-end-retry e2e/session-end-order` (Chromium + WebKit, axe): 44 passed.
- No locked test edited. `git diff main -- src/engine src/bots src/advice src/stats` empty.
