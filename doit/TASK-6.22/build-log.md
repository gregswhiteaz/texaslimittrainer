
## BUILD (2026-11-25)
- `stepBot(table, policy?)` defaults to `decideTag(turn.view, { random: botRandom(turn.seed) })`; explicit policy unchanged.
- New `tests/table/bot-step-seeded.acceptance.test.ts` (SPEC-01, SPEC-02): with the old unseeded default both tests fail (`expected 'fold' to be 'raise'`); with the change both pass.
- Locked `tests/table/session.acceptance.test.ts:177` edited per Q-1 (exact seeded expectation, one import; assertions unchanged).
- `npm test`: 315 files passed / 5 skipped; 1420 tests passed / 46 skipped. `npm run lint`: clean. `npm run typecheck`: clean.
- `npm run build && npx playwright test e2e/table.spec.ts e2e/next-hand.spec.ts e2e/resume.spec.ts`: 24 passed.
- `npx prettier --write` on all 3 touched files.
