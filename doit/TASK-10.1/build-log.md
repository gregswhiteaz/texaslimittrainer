## BUILD (TASK-10.1)
- Added `src/table/session-report.ts`, DB v3 `reports` store with `endSession`/`getReport`, `ReportScreen`, App `leave` flow (`ending`/`report` screens), session id passed through `Table`/`TableScreen`/`useTableSession`.
- Tests: 3 new Vitest files (SPEC-01..06, SPEC-12), `e2e/session-report.spec.ts` (SPEC-07, 09, 10, 11, 14), D-4 edits (1)–(5) to the five unlocked e2e files, unlocked updates to `tests/storage/hand-store.test.ts` and `tests/table/hand-record.test.ts` (stale v2 literal) and `e2e/support/hand-records.ts` (v3).
- Docs: new `docs/storage/reports.md`; updated `docs/storage/sessions.md`, `docs/ui/navigation.md`, `docs/storage/hand-records.md`.
- `npm run typecheck` pass; `npm run lint` pass.
- `npm test`: 259 files passed, 3 skipped; 1244 tests passed, 43 skipped.
- `npx vitest run tests/golden/`: 282 passed. `npm run -s playtest -- --hands 10000 --seed 42`: 0 invariant violations.
- `npm run build && npx playwright test` (full suite, Chromium + WebKit): 268 passed, 16 skipped (opt-in slow tests).

## FIX r1
- 1 fixed: `leave()` now only switches to `{ name: 'ending', sessionId }`; an effect of the ending screen (once per session id, ref-guarded for StrictMode) awaits `tableWritesSettled()` then `endSession`. React flushes every earlier commit's passive effects before committing the ending screen, so the Table's final effect (which tracks the last hand's write) has run before the ending effect reads the chain. No setState in the effect body (only in promise callbacks).
- 2 fixed: new `e2e/session-end-order.spec.ts` (the SPEC-07 spec file is hook-locked). Its init script holds advice-worker grade replies and clicks Leave table from the MutationObserver microtask in which Hand over appears (before that commit's passive effects); after release it asserts report "1 hand", stored hand 1, session `endedAt`, one report, no Resume (also after reload). With App.tsx reverted to HEAD the test failed on Chromium and WebKit (report never shown: endSession ran first and deleted the 0-hand session, then the late write recreated a resumable one). Fix restored: passes on both.
- 3 fixed: `parseSessionReport` throws `invalid('cash.buyIn')` when buyIn differs from `buyIn({ smallBet, bigBet })`; unit case in new `tests/table/session-report.test.ts` (forged buy-ins 0/79/160 with consistent result and BB/100 at $2/$4).
- 4 not done (blocked by hook): the session-report e2e spec is hook-locked, so the builder-pretool hook refused the edit. The orchestrator needs to add `await page.clock.runFor(5000); await expect(header(page)).toHaveCount(0);` before `expect(await storedRecords(page)).toEqual([])` in the seeded-session (SPEC-10) test, line ~202.
- `npm run format`; lint pass; typecheck pass; `npm test`: 260 files passed, 3 skipped; 1245 tests passed, 43 skipped. Full Playwright (Chromium + WebKit): 270 passed, 16 skipped.

## FIX r2
- 1 fixed: `App.tsx` guard ref now holds the `ending` screen object (`const ending = screen.name === 'ending' ? screen : null`, effect deps `[ending]`); StrictMode's re-run sees the same object, each Leave makes a new one. Regression test in new `e2e/session-end-retry.spec.ts`: an init script makes the first read-write `reports` transaction throw, Leave goes Home with Resume (no endedAt, no report), Resume then Leave shows the Session report (1 hand), session ended, one report, no Resume. With App.tsx at HEAD the test failed on Chromium and WebKit (report heading never shown); with the fix it passes.
- `npm run format`; lint pass; typecheck pass; `npm test`: 260 files passed, 3 skipped; 1245 tests passed, 43 skipped. Full Playwright (Chromium + WebKit): 272 passed, 16 skipped (session-end-order passes).
