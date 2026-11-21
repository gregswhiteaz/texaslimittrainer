## BUILD (TASK-3.25)

- Fixed `openCardGallery` (D-1), strengthened the logo mutation test in `e2e/cards.spec.ts` (D-2; diff is the one `page.evaluate(...?.setAttribute)` replaced by locator + `toHaveCount(1)` + `logo.evaluate` + `toHaveAttribute`), added `e2e/card-gallery-open.spec.ts` (SPEC-01, SPEC-02).
- `npx playwright test e2e/cards.spec.ts e2e/card-gallery-open.spec.ts` → 24 passed.
- SPEC-01 against the old helper (old `bundle.ts` from HEAD temporarily restored): `waits for a gallery that renders late` failed in chromium and webkit with `"count": 0` (expected 1); SPEC-02 passed (old async predicate also propagated the decode rejection). Fix restored, `git diff` confirmed.
- AC#2 command: `npx playwright test e2e/cards.spec.ts -g "logo check fails when the logo is hidden or does not load" --repeat-each 50 --workers 1 --project chromium --project webkit --reporter=line` → `[100/100] ... 100 passed (1.2m)`.
- CI run for AC#2 still pending: the orchestrator pushes; then record `gh run list --branch doit/TASK-3.25 --workflow CI --limit 1`.
- `npm run format` (clean), `npm run lint` (clean), `npm run typecheck` (clean).
- `npm test` → 133 files passed / 1 skipped; 473 tests passed / 7 skipped.
- `npm run e2e` → 104 passed.
