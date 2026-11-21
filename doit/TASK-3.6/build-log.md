# Build log: TASK-3.6

## BUILD (round 1): BLOCKED on SPEC-12 (see blocked.json)
- Builder risk 1: a Playwright spec importing `src/playtest/runner.ts` (JSON import attribute via preflop.ts) works. Probe spec passed, 1/1.
- Builder risk 2: `?worker&inline` inside the IIFE lib build works. The bundle contains Vite's Blob/data-URL `WorkerWrapper` and passes `{ name }` through.
- Implemented every file in spec §5 (see changes.md).
- `npm run format`: done. `npm run lint`: pass. `npm run typecheck`: pass.
- `npm test`: 138 files passed, 1 skipped; 484 tests passed, 7 skipped. Coverage 96.37% lines overall; session.ts 100%, advice-client.ts 97.56%.
- SPEC-10: `npm run build && ! grep -rq tlh-test-slow-advice dist && ls dist/assets | grep -c '^advice.worker'` gives no marker and a count of 1 (`advice.worker-BNn19Lw5.js`).
- `npx playwright test e2e/responsive-table.spec.ts`: 4 passed (SPEC-04 and SPEC-15 in chromium and webkit), 6 skipped.
- `npm run e2e:slow`: 8 passed, 2 skipped (SPEC-01 and SPEC-02 skipped in WebKit). The first run failed SPEC-01's sanity step because a busy loop evaluated over CDP isn't reported as a long task. The loop now runs in a page task scheduled from `page.evaluate`, and the step passes.
- `npm run e2e`: 109 passed, 5 failed, 6 skipped. Serial run of action-bar, table-display and table specs (`--workers=1`): 25 passed, 11 failed. The failures are existing paused-clock tests. The cold worker boot (~30 ms) outlasts the 20 runFor(50) slices (~35 ms real), so later bot steps wait on a paused fake timer. This conflicts with spec D-2/D-3 and §3. Stopped and wrote blocked.json with evidence and options (A: app-wide prewarmed worker).
- SPEC-13 playtest not run (blocked before the gate).

## BUILD (round 2): Option A from fix-brief.md (deviation: D-2 → app-wide worker)
- Added `sharedAdviceClient(create?)` in advice-client.ts and the prewarm call in src/main.tsx. Both harnesses now create the app-wide client before the table mounts. The hook's mount effect is removed, and bot steps call `sharedAdviceClient(createAdviceWorker).decideBot`. Unmount drops replies through the cancelled flag and `applyBotDecision`'s hand check. Added a test that the shared client is created once.
- `npx playwright test e2e/action-bar.spec.ts e2e/table-display.spec.ts e2e/table.spec.ts --workers=1`: 36 passed, 0 failed. No locked test was changed.
- `npm run e2e` (7 workers), run twice: 114 passed, 6 skipped, 0 failed both times.
- `npm run e2e:slow`: 8 passed, 2 skipped. SPEC-01 and SPEC-02 run in Chromium and are skipped in WebKit. SPEC-03, SPEC-04 and SPEC-15 pass in both engines.
- SPEC-10: `npm run build && ! grep -rq tlh-test-slow-advice dist && ls dist/assets | grep -c '^advice.worker' | grep -qx 1` passes.
- SPEC-13: `npm run playtest -- --hands 10000 --seed 42 --size 6` reports 0 invariant violations (5461 folds, 4539 showdowns).
- `npm run format`, `npm run lint` and `npm run typecheck`: pass. `npm test`: 138 files passed, 1 skipped; 485 tests passed, 7 skipped. Coverage 96.75% lines.
- Deleted blocked.json.

## FIX round 1 (review MINORs)
1. Security MINOR advice-service.ts: fixed. Shape check moved inside the `try`; malformed messages get `{id: null, ok: false, error: TypeError 'Malformed advice request'}` (`AdviceResponse` error id is now `number | null`; the client ignores id-null replies). Test: `tests/table/advice-service.test.ts` malformed-request case (null, 42, {}, no id, string id).
2. Code MINOR #2 useTableSession.ts: fixed. New exported `requestBotDecision(create, turn)` = `Promise.resolve().then(() => sharedAdviceClient(create).decideBot(...))`, used by the bot effect; sync failures now take the rejection path into setTable. Test: `tests/ui/advice-robustness.test.ts` (throwing factory: no sync throw, promise rejects). Exported helper because vitest runs in node with no DOM to render the hook.
3. Code MINOR #1: fixed. Option documented as used only if no app-wide client exists yet; `createAdviceWorker` prop removed from both e2e harnesses. It stays in the effect's deps because the effect still uses it.
4. NIT #3 advice-client.ts: fixed. `#fail` runs once and terminates the worker; `dispose` relies on it (still terminates exactly once). Test: `tests/ui/advice-robustness.test.ts` (error/messageerror → terminated 1, later dispose keeps 1).
Commands: `npm test` 139 files passed / 1 skipped, 488 tests passed / 7 skipped; typecheck, lint clean; paused-clock e2e (action-bar, table-display, table, --workers=1) 36 passed; `npm run e2e` 114 passed, 6 skipped; `npm run e2e:slow` 8 passed, 2 skipped; `npm run format` run.
