# TASK-1.37 changes

- `tools/ci/retry.js` — `stopGroup` checks `groupExists` right before sudo (D-1); `reap` escalates to sudo only after two refused kills in a row (D-2); one shared reap per attempt via `reapOnce` (D-3); `onSpawn` passes `{ pid, reap }` and the SIGINT/SIGTERM handler stops the attempt with `stopGroup` + the shared reap before exiting, ignoring a repeat signal (D-4); header comment updated.
- `tests/ci/retry.reap.test.ts` — new acceptance tests SPEC-01..SPEC-04 (local) and SPEC-05 (Linux CI only).

No new dependencies.
