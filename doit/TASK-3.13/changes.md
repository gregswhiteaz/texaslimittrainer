# TASK-3.13 changes

- `src/table/session.ts`: adds `RAPID_BOT_DELAY_MS = 0` and `botActionDelayMs(speed)` (A-1). No new imports.
- `src/ui/table/useTableSession.ts`: the bot step's `setTimeout` delay is `botActionDelayMs(table.config.speed)` instead of the literal `0`; doc comment updated. The deal step keeps `0`.
- `tests/table/pace.test.ts`: new, SPEC-01 (Rapid adds 0 ms; a new session is Rapid).
- `tests/table/pace.acceptance.test.ts`: new, SPEC-03 (200-hand model with the Fold-else-Check user, worst case under 60 minutes).
- `e2e/rapid-pace.spec.ts`: new (recorded deviation: the SPEC-02 meter returns cap + 1, not cap, when a bot action has not shown by the cap, so the ≤ 100 ms check can fail), SPEC-02 (every push, both projects: paused-clock meter and the 400 ms self-test) and SPEC-04, SPEC-05, SPEC-06 (opt-in, `TLH_SLOW_TESTS=1`, Chromium only).
- `e2e/support/pace-harness.tsx`: new, test-only 10-max table (A-6); never imported by `src/` (D-3). Recorded deviation (fix brief, Option 4): it creates the app-wide advice client with the test-only pace worker instead of the real advice worker, because the 6-max chart throws at 10 seats until TASK-7.6.
- `e2e/support/pace-advice.worker.ts`: new, test-only worker (marker `tlh-test-pace-advice`, never in `dist/`). It runs the production worker host and `handleAdviceRequest` with a non-chart `decideBot` (first legal of raise, bet, call, check), so bot requests take the same scheduling path (useTableSession → botActionDelayMs → shared advice client → worker reply).
- `e2e/support/table-harness-bundle.ts`: adds `buildPaceHarness()` and `openPaceHarness()`.
- `package.json`: `e2e:slow` also runs `e2e/rapid-pace.spec.ts` (D-1).
- `README.md`: "Rapid pace" bullet in the performance section.

No new dependencies.
- `doit/TASK-3.13/blocked.json`: created in BUILD 1 (SPEC-05 blocked by the 6-max-only chart), deleted after the fix brief (Option 4).
