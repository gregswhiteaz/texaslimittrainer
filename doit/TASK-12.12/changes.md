# Changes — TASK-12.12

- `src/storage/hand-store.ts` — exported `OPEN_TIMEOUT_MS = 10_000`; `opened()` takes a `timeoutMs`, starts a timer after `factory.open` and gives up through the blocked-open path (`giveUp`, idempotent) when no first event arrives; every event clears the timer. `openHandStore` gets a third optional `openTimeoutMs` parameter. Tidy-ups: removed the `blockedOpen` reset, the always-true `db === opening` guard, and rewrapped the long docblock line.
- `tests/storage/upgrade-blocked.test.ts` — SPEC-01 (second store queued behind a blocked upgrade rejects after the timeout, then recovers, no stray connection) and SPEC-02 (an answered open never times out; `OPEN_TIMEOUT_MS` is 10 000).
- `docs/storage/hand-records.md` — version table to `5` with `meta` since 5; one sentence on the open timeout.
- `e2e/support/hold-writes.ts` — the keep-alive `count()` chain runs on `sessions` when in scope, else on the first store of the sorted scope (A-5), so a `settings` write can be held.
- `e2e/settings-save-held.spec.ts` (new) — SPEC-04: the save-failed message is gone while the next settings save is still held.

No new dependencies.
