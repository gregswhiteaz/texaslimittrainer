# Fix brief — TASK-1.17 (user decision Q-1 in qa.md: make the 100k throughput test opt-in)

1. `tests/playtest/throughput.acceptance.test.ts` (unlocked for this): run only when `TLH_SLOW_TESTS=1` is set
   (`describe.runIf(process.env.TLH_SLOW_TESTS === '1')`). Keep every assertion and timeout unchanged.
2. `package.json`: add `"test:slow": "TLH_SLOW_TESTS=1 vitest run tests/playtest/throughput.acceptance.test.ts"`.
3. README: in the Speed targets / Million-hand section, say the 100k throughput check is opt-in (`npm run test:slow`),
   and why (speed guard, not a real scenario; kept out of every push).
4. Run `npm run test:slow` once and record its result in build-log.md (proves SPEC-06 still holds).
Don't touch other tests. Run `npm run format` before the gate. Never push.
