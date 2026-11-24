## BUILD (TASK-2.15)
- Created the screen list, the pure play-money module, the e2e walk/fixture/bundle spec, the unit and acceptance Vitest files, and docs/ui/play-money.md. No `src/` change.
- Judgment call: walk step 7 plays hand 14 with `play: 'call'` instead of folding, because a lone preflop fold opens no Hand Review (REQ-043.12, `src/table/review.ts:39`) and the step requires `Hand #14 review` to be visible.
- `npx vitest run tests/ui/play-money.test.ts tests/ui/screen-list.acceptance.test.ts`: 10 passed.
- `npx playwright test e2e/play-money.spec.ts`: 6 passed (walk ~0.9 s Chromium, ~1.0 s WebKit).
- `npm run lint`, `npm run typecheck`: clean. `npm test`: 264 files passed / 3 skipped; 1259 tests passed / 43 skipped.
- Full `npm run build && npx playwright test`: 290 passed, 16 skipped.
- `npm run -s playtest -- --hands 10000 --seed 42`: 0 invariant violations.
