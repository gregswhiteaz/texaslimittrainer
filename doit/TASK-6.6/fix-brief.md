# Fix brief — TASK-6.6 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] tests/playtest/cli.test.ts:lineup-replay-policies-untested (code review)
- Where: tests/playtest/cli.test.ts:532
- Problem: Nothing checks that replay mode with --lineup actually plays the line-up policies (A-5 / REQ-062.2: the suggested Replay line must reproduce a line-up hand). The only replay tests use --size 3, where lineUpPolicyFactory falls back to the same random moves as defaultPolicyFactory, so the replay output is identical either way.
- Evidence: Mutation: in src/playtest/cli.ts:325 I replaced `preset === undefined || seams.makePolicy !== undefined` with `true || ...` so replay always ignored the line-up. tests/playtest/cli.test.ts and tests/playtest/lineup.acceptance.test.ts still passed (11 passed, 1 skipped). The current code is correct: a probe showed that 30 of 30 Mixed 6-max hands replayed identically through lineUpPolicyFactory, and 23 of 30 differed from the default policies, so a test at 6 seats would be able to tell the two apart.
- Expected fix: In the '--lineup parsing, header lines and replay suffix' test, play a 6-seat line-up hand: take a hand from runPlaytest({hands: N, seed: 42, size: 6, lineUp: 'Mixed'}, onHand) whose actions differ from the default policies, run main(['--replay-code', code, '--button', b, '--stacks', ..., '--lineup', 'mixed']), and assert that the printed hand equals formatHand of the run's hand (or that the action lines differ from the same replay without --lineup).


## Also (MINOR, optional in this round)
- `src/playtest/cli.ts:324` duplicates the "line-up replaces the policy unless a test seam is set" rule from `src/playtest/runner.ts:313-316` — share one helper if it is a small change.
Keep the new replay test fast (a handful of 6-max hands, not a 10k run).
