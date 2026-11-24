## BUILD (2026-11-24)
- Added the verdict group + hinted tag in `ReviewPanel`, CSS per spec §5, acceptance tests (SPEC-01..04), live e2e (SPEC-05/06), docs.
- `npx vitest run tests/ui/review-hinted.acceptance.test.tsx`: 4 passed.
- `npm run typecheck`, `npm run lint`: clean. Prettier run on every touched file.
- `npm test`: 254 files passed (3 skipped); 1232 tests passed, 43 skipped.
- `npm run build && npx playwright test`: 250 passed, 16 skipped (incl. `e2e/review-hinted.spec.ts` 4/4 in Chromium + WebKit).
- No locked test edited; no blocked.json.
