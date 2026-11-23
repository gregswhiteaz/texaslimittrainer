## BUILD (round 0)

- Engine: echoValue, isReplayCode/shuffledDeck without coercion, exported assertChips, dense non-array seat check in createHand. Table: assertSessionConfig, consistent resolveSessionConfig, session-record.ts, parseHandRecord cross-field rules. Storage: DB v2 + sessions store + atomic add. Hook: start put + combined write.
- Workspace note: 31 untracked "<name> 2.<ext>" copies (sync-conflict duplicates, byte-identical to HEAD) appeared in the tree. The 9 code copies under src/, e2e/ and tests/ broke `tsc`, so they were deleted, and the docs/storage copy was deleted because the gate counted it (content is in git). The other copies (doit/TASK-3.9, the Backlog story doc, dist, test-results, doit/.active 2) were left untouched.
- Unit re-pin: tests/table/hand-record.test.ts opened the corrupt test DB at version 1 → VersionError/hang after the v2 bump; changed to version 2 (spec-listed unit file, no assertion changed). tests/storage/hand-store.test.ts updated per SPEC-14.
- npm run format → clean. npm run lint → 0 problems, Prettier clean. npm run typecheck → 0 errors.
- npm test → 214 files passed / 3 skipped; 942 tests passed / 35 skipped. Coverage all files 97.13% lines; src/table/session-record.ts 93.93% lines; src/storage 97.56% lines.
- npm run -s playtest -- --hands 10000 --seed 42 → Invariant violations: 0; output | shasum -a 256 = 14d746f736d6afd3968e7ae7e833814d95dab94378c80c11dd59b1fd6ea72e48 (unchanged).
- npm run -s playtest:million -- --hands 900 | shasum -a 256 → 4ff1725659ddc73674e845b3d72c20f70a31c767a196f25267ae795dcc1e2d32 (unchanged).
- npm run e2e (Chromium + WebKit, full suite) → 184 passed / 16 skipped, 36.0 s (36.8 s incl. build). TASK-3.9 record specs pass on DB v2; no locked e2e re-pin needed.
- Every-push e2e time added: e2e/session-records.spec.ts = 1 test × 2 browsers: 0.9 s Chromium, 1.1 s WebKit (about 2 s summed, well under the ~10 s/browser estimate); full suite 36.0 s vs 35.7 s at TASK-3.9 → about +0.3 s wall.
- Opt-in kill tests: TLH_SLOW_TESTS=1 npx playwright test e2e/session-kill.spec.ts e2e/hand-records-kill.spec.ts --project chromium → 2 passed (1.6 s and 1.8 s). No browser or server processes left running.
- Gate: doit.py gate TASK-3.10 → build #2 PASS (1654 lines, 20 files).

## FIX (judge J-1-01)

- J-1-01: fixed. Added "a record whose seat kinds differ from the config's is rejected (REQ-025)" to `tests/table/session-restore.acceptance.test.ts`: swaps kind, botId and style between the user seat and a bot seat (each seat stays self-consistent, config unchanged) and expects parseSessionRecord and restoreSession to throw RangeError 'Invalid session record: seats[<i>].kind'. Swapping kind alone would still be caught by the botId check, so the whole identity is swapped. Mutation check: deleting the record-vs-config kind line in src/table/session-record.ts made this test fail (1 failed / 6 passed); source restored, no diff.
- npm run format → clean. Gate: doit.py gate TASK-3.10 → fix #4 PASS (1677 lines, 20 files).
