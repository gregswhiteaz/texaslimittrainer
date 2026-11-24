# Fix brief — TASK-8.1 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] src/ui/table/useTableSession.ts:hook-observed-wiring-untested (code review)
- Where: src/ui/table/useTableSession.ts:207
- Problem: The approved D-2 deviation moved observed counting from the pure nextHand into the session hook (line 207 `observed.current = countObserved(observed.current, done)`) and the snapshot hand-off into `act` (lines 246-248) and Table.onHint (`observedCounts()`). No test exercises any of these lines: SPEC-01/02/03 call countObserved/userObservedSnapshot/applyUserAction directly, the UI acceptance tests pass hand-built counts, and the e2e hint tests never inspect `observed`. Deleting line 207, or dropping the third argument in `act`, or passing `{}` instead of `observedCounts()` in Table.tsx leaves every test green, so SPEC-03's 'acts through the session's act path' and AC#2's 'hint uses the session snapshot' are unverified end to end.
- Evidence: grep for useTableSession/countObserved/observedCounts in tests/ and e2e/ finds no test that mounts the hook or reads `observed` from a live session; coverage for useTableSession.ts is 28.7% lines in gates/fix-4.json. SPEC-03 test (tests/table/observed-snapshot.test.ts 'decision snapshot equals hint snapshot') builds the snapshot itself and calls applyUserAction, bypassing `act`.
- Expected fix: Add one live-session check, e.g. in e2e/hint.spec.ts: an init script that wraps Worker.prototype.postMessage (as delayWorkerReplies wraps Worker) to record payloads; play hand 1 to the end (checkOrCall + runUntilMyTurn), then select Hint at the first decision of hand 2 and assert the recorded `kind:'recommend'` message has `observed` with one entry per bot seat, ascending, each `hands: 1`, and none for the user seat (and, in hand 1, that the recommend payload had `observed: []`). Optionally also assert a stored decision's snapshot via the hand store if records expose it.


Also make the act path observable in the same e2e: the stored hand-1 and hand-2 records (IndexedDB) must reflect the snapshot each decision carried, or — if that is not distinguishable before 30 hands — add a hook-level check (e.g. a small test harness scene that exposes the counts) proving `act` passes the same snapshot the hint used. Verify each new check fails when line 207, act's third argument, or the onHint counts are removed (record in build log), then restore.
