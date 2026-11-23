## BUILD (round 0) — stopped, blocked.json

- npm install -D --save-exact fake-indexeddb@6.2.8 → added, 0 vulnerabilities.
- src/table/session.ts: botIds/nextBotId, initialBotIds, replacement ids, botId on CompletedHand.seats; tests/support/table-scenarios.ts re-pinned per A-2.
- npx tsc -p tsconfig.json → 2 errors in tests/stats/style-stats.test.ts:283-284 (CompletedHand literal lacks botId).
- npx vitest run tests/table tests/stats/style-stats.test.ts → 1 failed / 97 passed: tests/table/session.acceptance.test.ts "the completed hand is a plain-data record" (seats toEqual without botId).
- That acceptance test is not one of the spec's named re-pins (A-2/A-10), so per instructions the build stopped with blocked.json (SPEC-17). No other files written yet.

## BUILD (resume after Block 1) — complete

- Block 1 option 1 applied: `tests/table/session.acceptance.test.ts` expected seats gain botId (1, 2, 3, 4, null, 5); `tests/stats/style-stats.test.ts` literal gains botId null / 1. Pure re-pins, no assertions removed.
- New: src/table/hand-record.ts, src/storage/hand-store.ts; useTableSession write-before-deal, onHandComplete ref, handStore option; records harness + e2e helpers; acceptance and unit tests; docs/storage/hand-records.md.
- Mutation check: replacing the write gate with Promise.resolve() makes 3 e2e tests fail (delayed write, Deal next hand, failed write) — reverted.
- npm run format → clean. npm run lint → 0 problems. npm run typecheck → 0 errors.
- npm test → 211 files passed / 3 skipped; 928 tests passed / 35 skipped. Coverage: all files 97.36% lines; src/table 100% lines (hand-record.ts 100%); src/storage 96.87% lines.
- npm run -s playtest -- --hands 10000 --seed 42 → Invariant violations: 0; output | shasum -a 256 = 14d746f736d6afd3968e7ae7e833814d95dab94378c80c11dd59b1fd6ea72e48 (unchanged).
- npm run e2e (Chromium + WebKit, full suite) → 182 passed / 14 skipped, 35.7 s wall (36 s incl. build). Existing timing tests (next-hand "28 slices then within 4", review Deal next hand) pass unchanged; no locked e2e re-pin needed.
- Every-push e2e time added: e2e/hand-records.spec.ts = 9 tests × 2 browsers, 18 passed in 5.9 s wall alone (per-test 0.3–1.9 s, ~15 s summed). Full suite without it: 164 passed / 12 skipped in 33.4 s vs 35.7 s with it → about +2.3 s wall locally.
- Opt-in kill test: TLH_SLOW_TESTS=1 npx playwright test e2e/hand-records-kill.spec.ts → chromium 1 passed (2.9 s run), webkit 1 skipped (by design). No browser or server processes left running.

## FIX round 1
- Item 1 (Code MINOR): fixed — new unit test in tests/storage/hand-store.test.ts spies on IDBDatabase.prototype.transaction (fake-indexeddb) and asserts (hands, readwrite, { durability: strict }); mutation check removing durability fails it (1 failed), reverted.
- Item 2 (Security MINOR 1): fixed — docs/storage/hand-records.md now says records store the replay code (REQ-052.2) from which the full deck can be rebuilt; readers show only the user's and showdown cards and never deal from a stored replay code for display. spec.md untouched.
- Item 3 (NIT): fixed — hook description comment moved directly above export function useTableSession.
- npx vitest run tests/storage/hand-store.test.ts → 2 passed. npm run format → clean.
- doit.py gate TASK-3.9 → PASS (test, lint, typecheck ok; scope warn 1700 lines / 18 files, under fail limit).
