## BUILD (TASK-10.7)
- Added `HintCounts`, `SessionReport.hints` (appended after `leakCounts`), counting in `sessionReport`, `parseHints`, `hintTile`; rendered the "Hints used" tile as the 4th item in "Volume and errors"; `.report-hints` style (dd 18px); docs/storage/reports.md.
- New tests: tests/ui/report-hints.acceptance.test.tsx (3), tests/storage/session-end-hints.acceptance.test.ts (1), tests/table/session-report-hints.test.ts (3), e2e/report-hints.spec.ts (1 x Chromium/WebKit).
- Updated non-locked key-order assertions to `slice(-4)` ending in `'hints'`: tests/table/session-report-errors.test.ts (D-3) and tests/table/session-report-leaks.test.ts (same case; the spec named only the errors file). No locked test edited.
- `npm run lint` pass; `npm run typecheck` pass; `npm test`: 287 files passed, 4 skipped; 1329 tests passed, 45 skipped.
- `npm run build && npx playwright test e2e/session-report.spec.ts e2e/report-errors.spec.ts e2e/report-leaks.spec.ts e2e/report-style.spec.ts e2e/report-hints.spec.ts`: 18 passed (Chromium + WebKit).
- `npx prettier --write` run on every touched file.
