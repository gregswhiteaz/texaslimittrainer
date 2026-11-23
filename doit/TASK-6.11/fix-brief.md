# Fix brief — TASK-6.11 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] tests/playtest/check-styles.acceptance.test.ts:every-push-runs-too-slow (code review)
- Where: tests/playtest/check-styles.acceptance.test.ts:32
- Problem: The every-push acceptance tests in this file take about 25 s together without coverage. Individual tests take 2.7-9.4 s (band edges 9.4 s, mixed spots 5.4 s, Maniac test style 4.5 s, SPEC-01 3.7 s, SPEC-10 2.7 s), and the builder reports 11-44 s each under coverage. FAST_TIMEOUT_MS is 120 s. This breaks the standing rule that speed or scale checks are opt-in and no every-push test should take more than about 10 s on CI. It also misses the spec's own section 9 target of <= 15 s total.
- Evidence: npx vitest run on the four new and changed files: Duration 25.83s. check-styles tests 3683/4496/9386/5431/2687 ms. Runs: SPEC-01 does 2x500 + tally 500 + 300 + tally 300 hands. SPEC-04 does 2x1000. SPEC-05 does 3x2000 (soft). SPEC-07 does 3x1000. SPEC-10 does 1x2000. That is about 13,600 hands per push.
- Expected fix: Lower hand counts and keep every assertion. I checked these counts with the CLI on seed 42: at 300 Mixed hands, TAG preflop-unopened is recommended 6 / alternative 2, all four styles have numeric aggression and Maniac is 83.8%. At 300 Soft hands, Calling station and Rock have numeric aggression. Use: SPEC-01 Mixed at 300 and plain at 100, asserting 'Style: TAG, 600 hands'. SPEC-04 at 300 (confirm Maniac VPIP is still < 50 with the deviation-free style). SPEC-05 Soft at 300. SPEC-07 at 300. SPEC-10: reuse a 300-hand Mixed run, or merge its assertions into SPEC-01's run so no extra run is needed. Lower FAST_TIMEOUT_MS to about 30 s. Target: under about 5 s total without coverage, with no single test over about 2 s. If the builder wants the original counts too, put them in a TLH_SLOW_TESTS-gated twin. Note: the spec names these hand counts, so the orchestrator should record this as a spec amendment. The assertions themselves don't change.

## 2. [MAJOR] tests/ci/style-bands-workflow.acceptance.test.ts:git-show-main-comparison-vacuous-in-ci-and-blocks-future-edits (code review)
- Where: tests/ci/style-bands-workflow.acceptance.test.ts:61
- Problem: The byte-identical-to-main check of ci.yml, million.yml and million-lineups.yml catches its own failure and skips when the `main` ref is missing. CI checks out with actions/checkout at the default fetch-depth 1, so on PR and branch pushes the ref is missing and the assertion never runs there. It only runs locally. After merge, this check (in a locked test) fails on any future branch that legitimately edits ci.yml or the million workflows, because the working tree then differs from `main`. A one-time scope check for this task has become a permanent ban on editing those workflows.
- Evidence: onMain() returns null on any git error, and line 63 has `if (committed !== null) expect(...)`. ci.yml has no fetch-depth, so it uses a shallow single-ref checkout. Nothing in the repo uses the `git show main:` pattern elsewhere (grep under tests/ci, tests/git and tests/toolchain).
- Expected fix: Remove the onMain loop (lines 16-27 and 61-64) from the permanent test, and leave the 'ci.yml, million.yml, million-lineups.yml unchanged' check to the judge's one-time `git diff --stat main` (SPEC-14 already does the same kind of check). The test is locked, so this needs the routine locked-test re-pin, and the SPEC-12 bullet should be marked as verified by the judge instead.


## Orchestrator decisions (recorded spec amendment, auto-accepted)
1. Speed MAJOR: apply the reviewer's counts (SPEC-01 Mixed 300 + plain 100; SPEC-04/05(Soft)/07 at 300; SPEC-10 merged into a shared run). FAST_TIMEOUT_MS ≈ 30 s. Keep the original-count versions as twins under TLH_SLOW_TESTS with identical assertions. Target: the file's every-push tests ≤ ~6 s total without coverage. Record times.
2. Workflow-test MAJOR: do NOT simply delete the check (never drop an assertion). Replace the `git show main:` comparison with assertions that hold in a shallow CI checkout and capture the intent: `ci.yml`, `million.yml` and `million-lineups.yml` contain no `--check-styles` and no `style-bands` reference (the 100k style check never runs on push/schedule), and style-bands.yml is the only workflow invoking `--check-styles`. Same or higher assertion count; no git calls.
3. MINOR: SPEC-11 slow test records a non-zero exit as a failure (`seed N: exit X`).
4. NIT: StyleCheck(false) skips building mixed-spot maps (if trivial).
Note the spec amendment in build-log.md. npm run format, lint, then the gate.
