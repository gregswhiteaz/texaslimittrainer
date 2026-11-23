# TASK-7.10 fix brief (review round 1, done in-story)

1. MINOR — tests/advice/explanations.acceptance.test.ts (unlocked under TASK-7.10): the 10k sample measured 7.7–8.2 s,
   at the spec D-6 threshold. Apply the D-6 split exactly as the spec designs it: every push runs AC#1–AC#5 on the first
   2,000 decisions of the same seeded sample (still covering all 6 rule ids and all 17 size×situation pairs — assert the
   coverage as now); the 10,000-decision run of the same checks runs only with TLH_SLOW_TESTS=1 (it.runIf / describe.runIf),
   and the file is added to `npm run test:slow` in package.json. Never drop or loosen an assertion: both variants run the
   same checks. Record both times in build-log.md.
2. NIT — move ADVICE_ING ("Raising", "Calling", "Folding", "Checking") from src/advice/explain.ts into
   src/advice/explanations.ts with the other authored text (D-4); explain.ts imports it. No wording change.
Then npm run format and the gate. List package.json in changes.md (path in backticks like the other lines).
