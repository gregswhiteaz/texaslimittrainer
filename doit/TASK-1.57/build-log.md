## BUILD
- Edited `e2e/players-choice.spec.ts` per spec §5: `storedSessions` import + `expect.poll(...).toBe(1)` before the n = 2 / n = 10 `axeWithPausedClock` (8 lines added, 1 removed).
- `npx playwright test e2e/players-choice.spec.ts --repeat-each 10 --retries=0 --project=chromium --project=webkit` → 40 passed, 0 failed, 0 flaky.
- SPEC-03 grep (`git diff main ... | grep -E '^-[^-].*expect\('`) → exit 1 (no removed expect lines).
- `npm run format` (prettier: unchanged), `npm run lint` → clean, `npm run typecheck` → clean.
- `npm run e2e` → 401 passed, 19 skipped.
