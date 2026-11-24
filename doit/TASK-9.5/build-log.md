
## BUILD (TASK-9.5)
- Added `shownOpponents` model, panel list, TableView wiring, styles, `REVIEW_DEE_MUCKS` fixture, two scenes, unit/acceptance/e2e tests, docs.
- `npm run lint` — clean; `npm run typecheck` — clean.
- `npm test` — 253 files passed, 3 skipped; 1228 tests passed, 43 skipped (coverage thresholds met).
- `npx vitest run tests/golden/` — 282 passed.
- `npm run -s playtest -- --hands 10000 --seed 42` — 0 invariant violations.
- `npm run build && npx playwright test` — 246 passed, 16 skipped (Chromium + WebKit); `e2e/review-shown.spec.ts` 6/6.
- No locked test edited.
