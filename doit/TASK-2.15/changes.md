# TASK-2.15 changes

- `e2e/support/screen-list.ts` (new): `SCREEN_LIST` of every App screen and dialog component, and `ScreenId`.
- `e2e/support/play-money.ts` (new): pure rules shared by Vitest and Playwright: `realMoneyOffers`, `appScreens`, `unlistedScreens`, `paymentFindings`.
- `e2e/play-money.spec.ts` (new): the play-money walk (SPEC-01), the Deposit fixture (SPEC-06) and the dist/package.json payment scan (SPEC-04).
- `tests/ui/play-money.test.ts` (new): unit tests for the matchers and the comparison (SPEC-03, SPEC-05, SPEC-07).
- `tests/ui/screen-list.acceptance.test.ts` (new): the real comparison of `src/ui` against the screen list (SPEC-02).
- `docs/ui/play-money.md` (new): what the check flags, the screen list, how to register a screen or dialog, how to run it.

No new dependencies.
