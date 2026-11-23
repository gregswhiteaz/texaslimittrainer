## BUILD (round 0)

- Re-pinned the two locked tests per Q-3 (TASK-7.3 AC#1 adds explanation: expect.any(String); TASK-7.8 AC#9 key list adds explanation); no assertion dropped.
- Added src/advice/explanations.ts (authored copy verbatim from spec 5), src/advice/explain.ts, explanation field in preflop.ts/postflop.ts, docs/advice/explanations.md.
- Tests: tests/advice/explain.test.ts 13 passed; tests/advice/explanations.acceptance.test.ts 5 passed.
- D-6 timing: npx vitest run tests/advice/explanations.acceptance.test.ts wall time 7.71 s / 7.66 s (vitest Duration 7.47 s / 7.41 s) on the dev Mac: not > 8 s, so no split; package.json unchanged.
- Spec discrepancy (not blocking, noted): SPEC-01 says APPLICABLE_SPOTS has 18 size x situation pairs; it has 17 (heads-up has no raise-and-calls: 5 + 6 + 6). The test asserts set equality with the pairs derived from APPLICABLE_SPOTS, not a hard-coded count; the sample covers all 17.
- npm run format, npm run lint: clean. npm run typecheck: clean.
- Playtest: npm run -s playtest -- --hands 10000 --seed 42 | shasum -a 256 = 14d746f736d6afd3968e7ae7e833814d95dab94378c80c11dd59b1fd6ea72e48 (unchanged), Invariant violations: 0, 14.1 s.
- npm test: 771 passed, 2 failed, 30 skipped (803). Both failures in locked tests/advice/preflop.acceptance.test.ts (TASK-7.2): AC#3 tripped on a hand-class literal in my explain.ts doc comment (fixed by rewording; AC#3 now passes); AC#6 fails because its fixed sandbox file list lacks src/advice/explain.ts and its imports (TS2307). This contradicts the spec, so I stopped: see blocked.json.
- Block 1 resolved (orchestrator): TASK-7.2 sandbox list +8 files (explain.ts, explanations.ts, postflop.ts, equity.ts, ranges.ts, ranges/six-max.json, recommend.ts, engine/seeded-random.ts).
- Spec note: APPLICABLE_SPOTS has 17 size×situation pairs (heads-up has no raise-and-calls), not 18; test compares to the set.
