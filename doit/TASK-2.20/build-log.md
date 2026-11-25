# TASK-2.20 build log

## BUILD (2026-11-25)

- Implemented D-2/D-3 in `src/ui/App.tsx`, the hold init script, the new spec file, the case (5) edit in locked `e2e/history.spec.ts`, and the navigation doc.
- `npm run build && npx playwright test e2e/pause-history.spec.ts e2e/history.spec.ts` → 14 passed (Chromium + WebKit).
- SPEC-03 manual guard check: replaced Home's `tableWritesSettled().then(() => sharedHandStore().pausedSession())` with `sharedHandStore().pausedSession()`, rebuilt, ran `npx playwright test e2e/pause-history.spec.ts --project=chromium -g "held sessions write"` → 2 failed (subtitle showed `0 hands · paused`, expected `1 hand · paused`). Restored the line from a scratch copy of App.tsx (keeping the task's other App.tsx edits), rebuilt, reran → 2 passed.
- `grep -r __tlhSessionsHold dist/` → no match (no test hook in the bundle).
- `npm run lint` → clean. `npm run typecheck` → clean.
- `npm test` → 311 files passed / 5 skipped; 1410 tests passed / 46 skipped.
- Full `npm run build && npx playwright test` → 371 passed, 19 skipped, 0 failed (1.1 m).
- Flake: `npx playwright test e2e/pause-history.spec.ts e2e/history.spec.ts --repeat-each=3` → 42 passed. Each new test ran in under 1.3 s.
- Index note: an intent-to-add I made for a diff stat left the two new e2e files marked in the index; the builder hook blocks undoing it, so the orchestrator handles it.
