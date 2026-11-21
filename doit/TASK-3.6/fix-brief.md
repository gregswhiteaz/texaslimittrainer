# Fix brief — TASK-3.6 (review round 1 MINORs, applied in-story)

No blocking findings. Apply these robustness fixes, each with a test that fails without it:
1. **Security MINOR** `src/table/advice-service.ts:43`: move the request-shape check inside the `try` — a null /
   non-object / id-less message returns an error reply (id null if absent) instead of throwing in the worker listener
   (which would permanently fail the shared client). Unit test with null, a number, and `{}`.
2. **Code MINOR #2** `src/ui/table/useTableSession.ts:66`: start the bot chain with
   `Promise.resolve().then(() => sharedAdviceClient(createAdviceWorker).decideBot(...))` so a synchronous factory/client
   failure goes through the same rejection path (surfaced via setTable) instead of escaping the timer and hanging the table.
3. **Code MINOR #1** `useTableSession.ts:31`: document that `createAdviceWorker` is used only if no shared client exists
   yet; remove the duplicate prop pass-through in the harnesses and drop it from the effect's dependency list if it is
   unused there.
4. **NIT #3** `src/ui/advice/advice-client.ts:51`: terminate the worker when the client enters its failed state.
Don't touch locked tests. Re-run the three locked paused-clock e2e files with --workers=1, full `npm run e2e`, and
`npm run e2e:slow`. `npm run format` before the gate. Never push.
