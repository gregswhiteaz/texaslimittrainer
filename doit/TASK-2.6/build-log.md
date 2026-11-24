# Build log — TASK-2.6

## BUILD

- Headless: `endedAt` (parse only), `MAX_SESSION_COUNT` cap, `findPausedSession` in `src/table/session-record.ts`;
  `limitsText` + `resumeSummary` in `src/table/table-view.ts`; `HandStore.pausedSession()` (interface + IndexedDB `getAll`).
- UI: Home Resume entry with `data-paused`, `.menu-secondary` styles, App paused-session read/Resume handler,
  `resume` option through `TableScreen` → `Table` → `useTableSession` (keeps session id/startedAt, no start write).
- Tests: `tests/support/session-play.ts`, three Vitest acceptance files (SPEC-01..10), `e2e/resume.spec.ts`
  (SPEC-11..13), `seedStoredSessions`, records-harness forwards `pausedSession`. Docs updated.
- Commands:
  - `npx vitest run` on the three new files: 10 passed.
  - `npx playwright test e2e/resume.spec.ts`: 6 passed (Chromium + WebKit).
  - `npm run format`, `npm run lint`, `npm run typecheck`: clean.
  - `npm test`: 223 files passed / 3 skipped; 994 tests passed / 41 skipped; coverage 96.49% statements overall.
  - `npm run e2e`: 190 passed, 16 skipped (opt-in slow group).
  - `git diff --stat main -- src/engine src/bots src/advice`: empty.
