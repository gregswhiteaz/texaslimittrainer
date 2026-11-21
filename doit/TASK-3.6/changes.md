# Changes: TASK-3.6

- `src/table/advice-service.ts`: new headless advice service. `AdviceRequest` / `AdviceResponse` types and `handleAdviceRequest` (bot / recommend / grade; never throws). The request shape is checked inside the `try`: a null, non-object or id-less message gets an error reply with `id: null`.
- `src/table/session.ts`: adds `BotTurn`, `botTurn` and `applyBotDecision` (stale replies are ignored by hand identity). `stepBot` is rebuilt on them with unchanged behaviour. Drops the unused `actWith` import.
- `src/ui/advice/advice-client.ts`: new. `AdviceClient` (promise API, id correlation, loud failure, dispose), `WorkerLike`, the production `createAdviceWorker()` factory, and `sharedAdviceClient(create?)` (the app-wide client; the first call creates its worker). The worker is terminated as soon as the client enters its failed state; replies with `id: null` are ignored.
- `src/ui/advice/worker-host.ts`: new. `installAdviceWorker(scope, handle)`, the worker-side host.
- `src/ui/advice/advice.worker.ts`: new production worker entry.
- `src/ui/table/useTableSession.ts`: bot steps go `setTimeout(0)` → `sharedAdviceClient(createAdviceWorker).decideBot` in the worker → `applyBotDecision`. A cancelled flag plus the hand-identity check drop replies that arrive after unmount or for an old turn. New `createAdviceWorker` option (test seam, used only if the app-wide worker doesn't exist yet). The chain starts in exported `requestBotDecision`, which wraps the call in `Promise.resolve().then` so a synchronous factory/client failure rejects and surfaces via setTable.
- `src/main.tsx`: calls `sharedAdviceClient()` at app load, so the worker is warm before the first table mounts (fix brief, Option A).
- `e2e/support/table-harness.tsx`: creates the app-wide client with the real advice worker, inlined with `?worker&inline`, before the table mounts.
- `e2e/support/table-harness-bundle.ts`: harness pages open at a routed `http://localhost:4173/__harness/<name>`. Picks the entry chunk. Adds `buildAdviceHarness`, `openAdviceHarness`, the `instrumentAdvice` init script and the `window.__tlhAdvice` types.
- `e2e/support/advice-harness.tsx`: new. Default-config table. The instrumented, test-only slow worker is installed as the app-wide client before the table mounts.
- `e2e/support/slow-advice.worker.ts`: new, test-only. A worker that busy-waits `self.name` ms per bot request (marker `tlh-test-slow-advice`).
- `e2e/responsive-table.spec.ts`: new Playwright acceptance tests (SPEC-01, 02, 03 opt-in; SPEC-04 and SPEC-15 on every push).
- `tests/table/advice-service.test.ts`: new unit test (SPEC-08), plus a malformed-request test (null, number, `{}`, no id, non-numeric id).
- `tests/ui/advice-robustness.test.ts`: new unit tests: the client terminates its worker once on failure; `requestBotDecision` rejects rather than throws when the worker can't be created.
- `tests/table/bot-turn.test.ts`: new unit tests (SPEC-06, SPEC-07).
- `tests/ui/advice-worker.acceptance.test.ts`: new acceptance tests over a Node MessageChannel (SPEC-05, SPEC-09), plus a test that the app-wide client is created once.
- `package.json`: adds the `e2e:slow` script.
- `README.md`: documents `npm run e2e:slow` next to `npm run test:slow`.

No new dependencies.

## Deviation from the locked spec (fix brief, Option A)
D-2 said "one worker per mounted Table, created in a useEffect and terminated on unmount". It is replaced by one
app-wide advice worker, created when the app loads (main.tsx) and shared by every table. Reason: a per-table
worker's cold start (~30 ms) outlasted the locked paused-clock e2e tests' 20 runFor(50) slices (~35 ms real
time). SPEC-09's `dispose()` still terminates the worker the client owns. The app never disposes the shared
client, and unmount only drops that table's pending replies.
