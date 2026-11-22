# Resolution of blocked.json (orchestrator; recorded deviation from D-1/SPEC-04)

**Decision: option (b), no locked-test edit.** The user policy does NOT go into `PlaytestSeams` (TASK-6.9's locked
style-bots test pins its three keys). Pass it as a data field instead:
- `PlaytestOptions.userPolicy?: Policy` for `runPlaytest`, and `HandSetup.userPolicy?: Policy` for `playHand`
  (HandSetup already carries per-hand data such as `earlierShowdowns`).
- Do NOT add a function parameter: TASK-6.9's locked test checks `runPlaytest.length === 2` and `playHand.length === 3`,
  and an optional trailing parameter would change `.length`.
- `replayWithBots(record, lineUp, userPolicy)` passes it through `HandSetup`.
Everything else in the spec stands (scriptedPolicy, recordStacks move, acceptance AC#1–#3). Unit tests for SPEC-04 target
the field, not a seam. Reviewers and judge: recorded deviation — judge on substance.
Then finish the build: tests, `npm run format`, full suite, playtest SHA check, gate.

# Resolution of the second block (speed) — option (a), per the standing slow-tests rule (2026-11-21)
- The 1,000-hand SPEC-01/02 runs (and their replays) run only under `TLH_SLOW_TESTS=1` (`npm run test:slow`); add the
  file to the `test:slow` script.
- Every push keeps a smaller always-on version of SPEC-01 and SPEC-02 (e.g. 100 hands each, same assertions) plus SPEC-03,
  aiming at a few seconds per test without coverage.
- Keep the random user policy (A-2) — don't weaken the test.
Reviewers and judge: recorded deviation from spec §9 (the 1,000-hand runs are opt-in) — judge on substance.
