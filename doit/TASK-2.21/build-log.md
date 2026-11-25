# TASK-2.21 build log

## BUILD

- `ended()` (src/storage/hand-store.ts): in-transaction `isEnded` recheck before the 0-hand delete; aborts with `DOMException('Session already ended', 'ConstraintError')` (D-1). Docs: `SessionEnder` comment, docs/storage/reports.md.
- `GameConfigScreen`: layout effect focuses Start game when a shown end prompt is cleared (D-2). docs/ui/navigation.md failure sentence updated.
- `e2e/support/hold-writes.ts`: `armSessionsHold(page, scope = ['sessions'])` (D-3); `e2e/pause-history.spec.ts` unchanged and green.
- New tests: `tests/storage/end-recheck.acceptance.test.ts` (SPEC-01, SPEC-02), `e2e/end-session-hardening.spec.ts` (SPEC-03, SPEC-04). No locked test edited.

Fail-without-fix checks (all code restored afterwards):
- Recheck disabled (`if (false && isEnded(session))`): both vitest cases fail (2 failed / 2).
- Focus effect's `start.current?.focus()` removed: SPEC-03 fails in chromium and webkit (`toBeFocused` on Start game).
- App `confirmEnd` changed to open the Table before ending: SPEC-04 fails in both projects (dialog not visible while held). With the held-state assertions also removed temporarily, it still fails at the 0-hand poll (expected 1, received 0) — the poll alone catches the early open.

Commands:
- `npx vitest run tests/storage/end-recheck.acceptance.test.ts` — 2 passed.
- `npx playwright test e2e/end-session-hardening.spec.ts` — 4 passed (2 tests x chromium, webkit).
- `npm test` — 312 files passed, 5 skipped; 1412 tests passed, 46 skipped.
- `npm run lint` — clean (eslint, prettier --check). `npm run typecheck` — clean.
- `npm run build && npx playwright test` — 375 passed, 19 skipped.
- `npx prettier --write` on all touched files. `grep __tlhSessionsHold dist/` — no match (no test hook in the bundle).
- No vitest/playwright/preview process left running.
