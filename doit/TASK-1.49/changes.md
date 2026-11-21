# TASK-1.49 — Changes

- `tests/support/process-group.ts` — modified: dropped the `killGroup` import from `tools/ci/retry.js` (its EPERM log line went to stdout and corrupted the CLI's JSON); added module-private `killGroupQuietly(pid)` that SIGKILLs `-pid`, ignores ESRCH/EPERM, rethrows others, writes nothing; both call sites use it; doc comment updated. (SPEC-01, SPEC-02)
- `tests/support/process-group.test.ts` — modified: new unit test `ignores an EPERM group kill without printing and still kills the grandchild`. (SPEC-01)

No new dependencies.
