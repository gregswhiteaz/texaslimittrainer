## BUILD (Code Builder)

- Implemented SPEC-01..SPEC-12 per spec: nextBotName cap, Home button (only with `onHome`), `tableWritesSettled()`
  chain, App `goHome`/`openTable`/`popstate` handling, styles, `axeWithPausedClock` in `e2e/support/paused-clock.ts`,
  docs (`docs/storage/sessions.md`, new `docs/ui/navigation.md`).
- Finding: Playwright's fake clock (`page.clock.install`) fakes `performance.timeOrigin` to the install time on
  every load, so under a paused clock the D-2 keys (`${timeOrigin}:${counter}`) of two loads collide. Real browsers
  have a distinct `timeOrigin` per load, so the design holds; SPEC-07 (5) (Back after reload + Resume) therefore runs
  with the real clock, with a comment saying why. No spec change.
- SPEC-01: "still exactly one button" without `onHome` is checked in the header (a hand in progress also shows
  action-bar buttons); the whole page has exactly one more button with `onHome`.
- SPEC-04: the user checks/calls at their turns until `data-action-count` ≥ 3, then chooses Home mid-hand.
- Commands: `npm run format`; `npm run lint` (pass); `npm run typecheck` (pass); `npm test` — 226 files passed,
  3 skipped; 997 tests passed, 41 skipped (coverage thresholds met); `npx playwright test` (full suite, Chromium +
  WebKit) — 204 passed, 16 skipped (opt-in slow); new specs `e2e/home-control.spec.ts` + `e2e/history.spec.ts`:
  14 passed.
