
## BUILD (2026-11-24)
- Table.tsx: label switch `userBusted(table) ? 'Continue' : 'Deal next hand'`; comments updated.
- Locked edit A-6 in tests/ui/bust-dialog.acceptance.test.tsx (unlocked under TASK-3.11).
- New tests/ui/bust-continue.acceptance.test.tsx (3 tests) and e2e/bust-continue.spec.ts (2 tests x 2 browsers).
  Note: the A-5 final stacks are read from the finished hand's players (`done.hand.players`), since
  `table.stacks` updates only on `nextHand`.
- docs/ui/navigation.md paragraph added.
- Commands: `npm run lint` clean; `npm run typecheck` clean; `npm test` 247 files passed / 3 skipped,
  1206 tests passed / 43 skipped; `npx vitest run tests/golden/` 282 passed; playtest 10,000 hands seed 42:
  0 invariant violations; `npm run build && npx playwright test` 232 passed, 16 skipped.
- Prettier run on every touched file.
