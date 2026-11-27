## BUILD
- Removed `generation` from `AppRoot`, so it now renders `<App returned={returned} />`. `grep -nE "generation|key=" src/ui/AppRoot.tsx` finds nothing.
- Added `e2e/error-recovery-history.spec.ts` with 2 tests. It uses an `illegal-bot` fault, armed after the 0-hand start record is stored, and waits only with `expect.poll` and `runUntil`.
- `npx playwright test e2e/error-recovery-history.spec.ts --repeat-each 5` (chromium + webkit): 20 passed (5.6s).
- Mutation check: with `history.back()` taken out of `#returnHome`, SPEC-01 failed on chromium. Code restored.
- Updated `docs/ui/navigation.md` (Q-1 decision line, Tests list).
- `npm run format`: no changes. `npm run lint`: clean. `npm run typecheck`: clean.
- `npm test`: 351 files passed, 11 skipped; 1555 tests passed, 60 skipped. `npm run build`: ok.
- `npm run e2e`: 417 passed, 19 skipped (1.2m).
