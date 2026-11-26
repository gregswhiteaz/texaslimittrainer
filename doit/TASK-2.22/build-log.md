## BUILD (2026-11-26)
- Implemented D-1 in `openTable` (`src/ui/App.tsx`), added `e2e/reload-history.spec.ts` (3 tests), updated `docs/ui/navigation.md`.
- `npm run format`, `npm run lint`, `npm run typecheck`: clean.
- `npm test`: 325 files passed / 7 skipped; 1454 tests passed / 52 skipped.
- `npm run build && npx playwright test e2e/reload-history.spec.ts e2e/history.spec.ts e2e/pause-history.spec.ts e2e/home-control.spec.ts e2e/home.spec.ts e2e/error-recovery.spec.ts`: 54 passed (Chromium + WebKit).
- New spec against the pre-change `App.tsx`: 6/6 failed (as expected); with the fix `--repeat-each=3`: 18 passed.
- `npm run e2e` (full): 389 passed, 19 skipped (slow group), 0 failed.
