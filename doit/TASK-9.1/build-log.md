## BUILD — 2026-11-18
- Added the review model (`src/table/review.ts`), `dealNext` on `useTableSession`, `ReviewPanel`, the Table wiring (stable `onHandComplete` via ref, hold = `review !== null`, Close keeps the hold and focuses Deal next hand) and styles.
- Added scripted review states and Vitest tests (SPEC-01/02/03/04/08/09) and `e2e/review.spec.ts` (SPEC-05/06/07). No earlier test edited.
- `npx vitest run` on the new files: 3 files, 6 tests passed. `npx vitest run tests/ui tests/table tests/unit tests/toolchain/boundary.test.ts`: 22 files, 70 tests passed.
- `npm run typecheck` and `npm run lint`: clean after each test-file edit.
- `npx playwright test e2e/review.spec.ts`: 6 passed (Chromium + WebKit). `npm run e2e`: 86 passed.
- `src/table/review.ts` loads under Node type stripping (`node --import ./tools/playtest/resolve-ts.js`); no Math.random/Date/performance/crypto/process in it.
- Screenshots saved with a temporary Chromium spec (deleted): `review-open.png`, `review-closed.png`.
- Full `npm test` left to the stop-hook gate.
