# TASK-2.18 build log

## BUILD (2026-11-20)
Wrote the three acceptance tests from spec §6. Each mutant was applied with `sed`, its test run, then reverted
with the reverse `sed` (the builder hook blocks git commands that change the tree); `git diff --stat src` is
empty afterwards.

- M2 (`src/table/table-view.ts:143` → `playerView(table.hand, 5)`):
  `npx vitest run tests/ui/user-seat-cards.acceptance.test.tsx` → 1 failed:
  `AssertionError: expected [ '4c', 'Qd' ] to deeply equal [ 'Js', '9s' ]`. Reverted → 1 passed.
- M3 (`src/table/session.ts:129` → `stacks: DEFAULT_SEATS.map(`):
  `npx vitest run tests/table/session-stacks.acceptance.test.ts` → 1 failed:
  `AssertionError: expected [ { seat: 1, stack: 160 }, …(5) ] to deeply equal [ { seat: 1, stack: 160 }, …(4) ]`.
  Reverted → 1 passed.
- M1 (`src/ui/useHeadingFocus.ts:11` → `if (element === null) return;`):
  `npx playwright test e2e/home-first-load.spec.ts` → 2 failed (chromium, webkit): received
  `{ onBody: false, onHeading: true }`, expected `{ onBody: true, onHeading: false }`. Reverted → 2 passed.

Final: `git diff --stat src` empty. `npm test` → 104 files, 367 passed, 6 skipped. `npm run lint` clean.
`npm run typecheck` clean. `npm run format` made no changes.
