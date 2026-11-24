## BUILD (blocked)
- Implemented userAdviceOptions, observedBySeat validation, HandRecordDecision/decisionRecord/handRecord.decisions and parseHandRecord checks.
- A-3 cross-check broke 9 tests that used defaultTableAfter fixtures (user actions with no user decisions). Fixed by routing those fixtures' user moves through applyUserAction. Full suite after the change: 1 failure (the planned D-3 test), which the D-3 edit fixed.
- hand-store 1,000-record test went from about 0.1 s to 11.5 s because each record graded 6 decisions; it now grades them once (100 ms).
- New acceptance test: 4/6 pass. SPEC-01 and SPEC-05 fail because their worked example (river raise/major) comes from the review panel's default 'unseen' options, while the spec's invariant requires the hint path's ACTION_RANGE_ADVICE (river call/correct/match). Wrote blocked.json and stopped. Unit test file tests/table/decision-record.test.ts (SPEC-07/08) and the docs update are not written yet.

## FIX (resume BUILD after block 1)
- Item 1: fixed. SPEC-01 now expects recommended [raise, bet, bet, call] and grades [correct, correct, minor, correct]; each entry still deep-equals the worker `grade` response computed in the test (handleAdviceRequest), not decisionRecord. SPEC-05 asserts entry 2 (turn): ruleId 'aggression-margin', numeric marginPts, equal to the worker's GradeResult. No assertion dropped or loosened.
- Item 2: fixed. Wrote tests/table/decision-record.test.ts (SPEC-07: all listed faults, unmodified and 0-decision BB_WALK records parse; SPEC-08: copies, no sharing, equals ACTION_RANGE_ADVICE grade path, userAdviceOptions(undefined) === ACTION_RANGE_ADVICE). Updated docs/storage/hand-records.md. Listed the two out-of-list files in changes.md with reasons.
- Commands: npm run format (clean), npm run lint (0 errors), npm run typecheck (0 errors), npm test: 239 files passed / 3 skipped, 1179 tests passed / 43 skipped, 0 failures; npx vitest run tests/golden/: 282/282 passed; new decision-record files: 8/8 passed (under 100 ms each).
- npm run -s playtest -- --hands 10000 --seed 42 --check-advice: 10000 hands, Invariant violations: 0, Advice check 100113 decision points, 0 mismatches. Byte-identical-to-main comparison not run (no src/engine or bot code changed).

## FIX (CI red after review r1)
- Item 1: fixed — `e2e/hand-records.spec.ts` oldRecord() now has one chart `decisions` entry for the user's preflop fold (seat 5); fixture data only, no assertion changes. Full Playwright run found no other fixture seeding records without decisions (home-control.spec.ts seeds records built by handWrite/handRecord, which include decisions).
- Item 2a: fixed — tests/table/decision-record.test.ts adds rejection cases: action.amount only (decisions[0], decisions[3] -> decisions[i].action), explanation 2001 chars, opponentBasis text '' and 201 chars, alternative 'limp', recommended.seat 2.
- Item 2b: fixed — removed vacuous `not.toBe(advice.move)`; now builds an entry from a cloned decision, mutates the clone's action and every view.legalActions entry, and asserts the entry's JSON is unchanged (verified: making `recommended` share advice.move fails the test).
- Commands: npm run format, lint (clean), typecheck (clean), npm test: 239 files passed / 3 skipped, 1179 tests passed / 43 skipped; npm run build && npx playwright test: 214 passed, 16 skipped.
