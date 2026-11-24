
## BUILD (TASK-3.11)
- Implemented the headless bust/rebuy rules (session.ts, session-record.ts), the hook's `rebuy()` and the
  `BustDialog`, wired into `TableView`.
- Found the e2e words for A-6 with a throwaway headless search: `[0x9e3779b9, 1, 2, 3]` busts the seeded user
  ($4 in the BB, button 3, hand 13) with no user decisions; pinned in SPEC-04.
- `tests/table/session.acceptance.test.ts` (prior story, not hook-locked, not in spec §3's unchanged list)
  failed typecheck only because `NextStep` widened; changed its `steps` type annotation to include `'rebuy'`.
- Commands: `npm run typecheck` (0 errors); `npm run lint` (pass); `npm test` → 229 files passed / 3 skipped,
  1007 tests passed / 41 skipped, coverage thresholds met (session.ts 99.5% lines);
  `npx playwright test e2e/rebuy.spec.ts` → 8 passed; `npm run e2e` → 212 passed, 16 skipped;
  `git diff --stat main -- src/engine src/bots src/advice` empty; `npm run format` run.
