## BUILD (TASK-2.7)
- Store: `endPausedSessions` in `hand-store.ts` reusing `ended(...)` per session; `SessionEnder`/`PausedSessionsEnd`; exported `isEnded`.
- UI: new `EndSessionDialog`, `GameConfigScreen` `endPrompt` prop, App `startGame`/`confirmEnd`/`cancelEnd` with a request token (all in handlers and promise callbacks, no setState in effects). WebKit doesn't focus clicked buttons, so Game Config focuses Start game itself when the dialog closes (A-2).
- Tests: `tests/storage/end-paused.acceptance.test.ts` (3), `tests/ui/end-session-dialog.acceptance.test.tsx` (1), `e2e/new-game-confirm.spec.ts` (6 × Chromium/WebKit, all pass).
- Docs: `docs/ui/navigation.md`, `docs/storage/sessions.md`, `docs/storage/reports.md`.
- `npm run lint` pass; `npm run typecheck` pass.
- `npm test`: 262 files passed, 3 skipped; 1249 tests passed, 43 skipped.
- `npx vitest run tests/golden/`: 282 passed. `npm run -s playtest -- --hands 10000 --seed 42`: 0 invariant violations.
- `npm run build && npx playwright test`: 282 passed, 2 failed, 16 skipped. Both failures are the locked `e2e/next-hand.spec.ts:221` (TASK-3.4) on Chromium and WebKit. Its second page shares the first page's context, so a paused session is stored and the new dialog correctly appears. See `blocked.json`: the test needs an edit (D-5 missed it).
