# TASK-6.15: Replay any hand with every bot acting exactly as before

Status: Done (pending judge) · Completed: 2026-11-22 · Epic: TASK-6 · Requirements: REQ-028 (REQ-028.1, REQ-028.2) · Branch: doit/TASK-6.15

## What was asked
Prove REQ-028.2: replaying a hand with the same replay code and the same user actions gives identical bot actions, for every style. Spec: doit/TASK-6.15/spec.md. The former AC#4 (same earlier showdowns on replay) moved to TASK-6.23 (Q-1).

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Replays pass no earlier showdowns (`[]`), as `--replay-code` does. | yes | No bot reads `view.earlierShowdowns`; whether records carry it is TASK-6.20's call. | Capture each hand's showdowns and pass them in. |
| A-2 | Seat 1's test policy is `randomMovePolicy` on one shared `Xoshiro128(2026)`, so user actions don't follow from the code. | yes | Shows the replay really depends on the fed-back user actions. | Use `seededTagPolicy` (weaker test). |
| A-3 | "6-max TAG" is `runPlaytest({hands, seed, size: 6})` with no line-up (all seats TAG; seat 1 overridden). | yes | No all-TAG preset exists. | Tough preset. |
| A-4 | AC#3 changes seat 1's first action to the first legal action of a different type, then plays check-else-fold; covers the first 200 hands where seat 1 decides. | yes | A different legal action always exists. | Random alternatives. |
| A-5 | Seed 15 for the AC#1/#2 runs. | yes | Deterministic tests. | Any fixed seed. |

## Clarifications and decisions
- Q-1 (auto-accepted): former AC#4 (same earlier showdowns on replay) moved to TASK-6.23, which depends on the user's spike TASK-6.20.
- Deviation 1: `userPolicy` is a `HandSetup` / `PlaytestOptions` field, not a `PlaytestSeams` key, because TASK-6.9's locked test pins the seam keys and function arity.
- Deviation 2: the 1,000-hand SPEC-01/02 replays are opt-in (`TLH_SLOW_TESTS=1`, about 11 s and 16 s; the random user makes TAG run many postflop equity calls). 100-hand versions with the same assertions run every push (file about 7 s). The file is added to `test:slow`.

## What was built
- `src/playtest/runner.ts`: `HandSetup.userPolicy` (applied to seat 1 in `playHand`), `PlaytestOptions.userPolicy`, `PLAYTEST_USER_SEAT`, exported `recordStacks` (moved from cli.ts), and `replayWithBots(record, lineUp, userPolicy)`, which re-deals the record's table, plays seat 1's recorded actions and lets fresh bots decide.
- `src/playtest/policy.ts`: `scriptedPolicy(actions, then?)` plays actions back in order, then falls back or throws.
- `src/playtest/cli.ts`: imports `recordStacks`.
- `package.json`: `test:slow` includes the new acceptance file.
- Tests: `tests/playtest/bot-replay.acceptance.test.ts` (SPEC-01..03, locked), plus unit tests in `runner.test.ts` and `policy.test.ts`.
- No persisted-record, `CompletedHand` or `TableState` changes; no new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 all-TAG replay | acceptance (100 hands always; 1,000 slow) | pass | gates/build-1.json |
| SPEC-02 | AC#2 Mixed replay, all styles | acceptance (100 / 1,000 slow) | pass | gates/build-1.json |
| SPEC-03 | AC#3 changed user action | acceptance, 200 hands | pass | gates/build-1.json |
| SPEC-04..06 | userPolicy, scriptedPolicy, replayWithBots | unit tests | pass | gates/build-1.json |
| SPEC-07/08 | 10,000-hand playtests unchanged; lint, typecheck, test | `npm run lint && npm run typecheck && npm test` | pass | gates/build-1.json (337 changed lines) |
| SPEC-09 | N/A items, docs | grep for network code; doc published | see gate | this doc |

Default SHA 442dbf55…08fbc unchanged. Judge: see doit/TASK-6.15/judge/.

## Review
Round 1: code and security reviews, 0 blocking findings. 6 of 6 mutation checks were caught by the tests. Both deviations were accepted on substance. Security: no new trust boundary, no hidden-information leak (replay passes no earlier showdowns), no `Math.random`.

### Non-blocking review notes (deliberately not fixed)
- NIT: in `bot-replay.acceptance.test.ts` the helper `record(count, lineUp)` shares its name with the destructured `record` (HandRecord). Suggest renaming it `recordRun`. The test file is locked.

## How to try it
- `npm test` (100-hand replays), `TLH_SLOW_TESTS=1 npm run test:slow` (1,000-hand replays).

## Run metrics
Questions 1 · assumptions 5 · review rounds 1 · judge rounds: see judge/ · gate runs 1 · escalations 0 (two blocker reports, resolved in fix-brief.md) · changed lines 337.

## Known limitations and follow-ups
- Earlier showdowns on replay: TASK-6.23 (depends on TASK-6.20). No new follow-ups.

## Lessons for the factory (proposals — not applied)
- Spec §9 asked for 1,000-hand runs on every push without a timing estimate, and the seam-key lock had to be checked against TASK-6.9. Proposal: the spec stage should check locked tests for pinned interfaces and estimate runtimes of large-N acceptance tests before fixing N.
