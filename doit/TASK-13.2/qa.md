# TASK-13.2 — Questions and answers (autopilot, 2026-11-25)

## Q-1 — Where to store the persistent-storage result (persisted format)
Options: (a) new `meta` object store, DB v4 → v5, record {granted: boolean} under key 'persistentStorage'; settings record unchanged [Recommended]; (b) second key in the settings store (breaks locked opponent-styles checks); (c) new field in the settings record; (d) separate IndexedDB database.
**Answer: auto-accepted (recommended)** — (a). Additive upgrade. Locked tests unlocked with reason "TASK-13.2 Q-1": tests/storage/session-end.acceptance.test.ts (TASK-10.1), e2e/home-control.spec.ts (TASK-2.14), e2e/opponent-styles.spec.ts (TASK-12.2). Re-pin version and store names only; keep every check. Unlocked helpers/tests (not hook-locked): tests/storage/settings-store.test.ts, tests/storage/hand-store.test.ts, e2e/support/hand-records.ts.
