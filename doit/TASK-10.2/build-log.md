# TASK-10.2 build log

## BUILD

- Engine: extracted `settle` from `applyAction`, added `forceFold`. Session: `handInProgress`, `foldUserToLeave`. Hand record: `forcedFold` write + validation. UI: `LeaveDialog`, hook `paused`/`onLeft`/`leaving`/`leave`, Table prompt/freeze/leaving rules, styles. Screen list + locked edits D-5 (1)(2)(3). Docs.
- `tests/ui/play-money.test.ts` (unit, not locked) failed 3 tests after the screen-list entry was added (its fixture UI files vs the real SCREEN_LIST); added a LeaveDialog fixture file and extended its expected lists.
- `npm run lint`: pass. `npm run typecheck`: pass.
- `npm test`: 267 files passed, 3 skipped; 1267 tests passed, 43 skipped (first run had 3 failures in tests/ui/play-money.test.ts; fixed).
- `npx vitest run tests/golden/`: 282 passed.
- `npm run -s playtest -- --hands 10000 --seed 42`: 10000 hands, Invariant violations: 0.
- `npm run build && npx playwright test`: 298 passed, 16 skipped, 0 failed (Chromium + WebKit). New `e2e/leave-mid-hand.spec.ts` 8/8; play-money and table-display pass.
