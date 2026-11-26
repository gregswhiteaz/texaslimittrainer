# TASK-9.10 changes

## Source
- `src/table/decision-grades.ts` — `requestNewGrades` attaches a no-op rejection handler to each new grade request promise and keeps the original promise in `pending` (D-1); doc comment updated.

## Tests
- `tests/table/decision-grades-rejection.test.ts` (new) — SPEC-03, SPEC-04: a rejected request raises no `unhandledRejection`; `gradedDecisions` still rejects with the same error and `pending` holds the original promises.
- `tests/ui/review-pending.acceptance.test.tsx` (new) — SPEC-02: pending grades (open true/false) show no `<aside` and one Deal next hand.
- `e2e/grade-failure.spec.ts` (new, every push, Chromium + WebKit) — SPEC-01.
- `e2e/support/fault-injection.ts` — test-only `reject-grade` fault (one-shot `ok:false` grade reply on a microtask, sets `__tlhGradeFaulted`) and a `gradeFaulted(page)` reader.

## Docs
- `docs/ui/navigation.md` — "Failed decision grade (TASK-9.10)" paragraph, note that a failed grade is not an error-screen cause, Tests-list lines.
- `docs/ui/review.md` — Timing paragraph: a grade failing mid-hand is handled, no unhandled rejection or error screen.

No new dependencies.
