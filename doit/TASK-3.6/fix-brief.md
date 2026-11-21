# Fix brief — TASK-3.6 (resolving blocked.json; recorded deviation from locked spec D-2/SPEC-09)

Decision (orchestrator, autopilot): **Option A.** One advice worker for the whole app, created once when the app
module loads (lazily on first import in a browser context, never during SSR/renderToString), and shared by every table.
Unmounting a table drops its pending replies (stale-reply guard already in applyBotDecision) instead of terminating the
worker. Update SPEC-09's dispose wording accordingly in tests; keep `createAdviceWorker` as the test seam (the harness
can still inject the slow worker — inject it before the first table mounts).
Do NOT edit any locked test (Option B rejected). Then:
1. Re-run `e2e/action-bar.spec.ts e2e/table-display.spec.ts e2e/table.spec.ts --workers=1` and full `npm run e2e`
   (7 workers) — all locked tests must pass. If any still fail on the paused clock, stop and write blocked.json again
   with the probe evidence.
2. Re-run `npm run e2e:slow`, SPEC-10 dist check, and SPEC-13 (10,000-hand playtest).
3. Record results in build-log.md, note the deviation (D-2 → app-wide worker) there and in changes.md, delete
   blocked.json, `npm run format`, gate.
Never push. Leave no background processes.
