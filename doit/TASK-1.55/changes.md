# Changes — TASK-1.55

- `e2e/hand-records.spec.ts` — onHandComplete-once test: the four immediate harness `calls` reads now use bounded `expect.poll` with the same exact matchers (toHaveLength 1, 1, 2; toEqual three PINNED_CODE). No new dependencies.
