# TASK-9.10 build log

## BUILD
- `src/table/decision-grades.ts`: `requestNewGrades` calls `grade.catch(() => undefined)` on each new request and stores the original promise.
- Tests: `tests/table/decision-grades-rejection.test.ts` (SPEC-03, SPEC-04, 2 tests), `tests/ui/review-pending.acceptance.test.tsx` (SPEC-02, 1 test), `e2e/grade-failure.spec.ts` (SPEC-01, Chromium + WebKit) with the new `reject-grade` fault in `e2e/support/fault-injection.ts`.
- Docs: `docs/ui/navigation.md` (Failed decision grade paragraph, error-screen cause note, Tests list), `docs/ui/review.md` (Timing).
- Holdout: with the `.catch` disabled, SPEC-03 fails (unit) and SPEC-01 fails in both browsers (e2e); restored afterwards.
- Commands: `npm run format` clean; `npm run lint` clean; `npm run typecheck` clean; `npm test` 324 files passed, 6 skipped, coverage thresholds met; `npx playwright test e2e/grade-failure.spec.ts e2e/error-recovery.spec.ts e2e/hand-records.spec.ts` 30 passed.
- Full `npm run e2e`: 383 passed, 19 skipped (Chromium + WebKit).
