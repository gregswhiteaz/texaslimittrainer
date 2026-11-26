# TASK-6.20: Decide how hand replay reproduces bot actions that use session memory

Status: Done · Completed: 2026-11-26 · Epic: TASK-6 — Face distinct opponents · Milestone: m-1 · Requirements: REQ-028.2, REQ-029 (new REQ-029.3), REQ-025, REQ-052.2 · Branch: doit/TASK-6.20

## What was asked
Replaying a hand must reproduce every bot action (REQ-028.2), but a single hand's record lacks session context such as earlier showdowns. The user had to choose: store the context in hand records, forbid cross-hand bot memory, or relax REQ-028.2. Spec: doit/TASK-6.20/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Decision recorded with `backlog decision create ... -s accepted` (decision-1). The rationale lives in the final summary and spec because the CLI has no body option. | yes | Only CLI path; hand-editing is forbidden. | Edit the decision via CLI. |
| A-2 | New clause is REQ-029.3, with change-log row 1.12. REQ-025 and REQ-028 wording is unchanged. | yes | REQ-025 is an upper bound; REQ-029 already bans adaptation. | Reword REQ-025 or REQ-028.2. |
| A-3 | The guard test is a 200-hand 6-max Mixed playtest in the normal suite. | yes | Fast and covers all four styles. | Move to `test:slow` or use hand-built views. |

## Clarifications and decisions
- Q-1 (user, 2026-11-26): option B, bots decide from the current hand only.
- D-1: Option B. It matches today's code (no bot reads `earlierShowdowns` or observed stats). It fits fixed styles; adaptive bots stay deferred (Q-49). It needs no stored-format change, and replay from a hand's own record stays exact. Recorded as decision-1 (accepted).
- TASK-6.23 (app passes earlier showdowns to bots) archived as not needed.

## What was built
- `dreams/limit-holdem-trainer/requirements.md`: REQ-029.3 and change-log row 1.12.
- `src/engine/player-view.ts`: doc comment on `PlayerView.earlierShowdowns` saying bot decisions must not depend on it. The review MINOR on wording was fixed by the orchestrator (bots also go through advice code).
- `tests/bots/no-session-memory.acceptance.test.ts`: guard test. For every bot decision in a 200-hand playtest it compares the action with the real list against a different list.
- No runtime code, stored format or existing test changed.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | decision recorded | `backlog decision list --plain` | PASS | decision-1 accepted |
| SPEC-02 | requirements match | git diff of requirements.md | PASS | 2 lines added |
| SPEC-03 | actions ignore list | guard acceptance test | PASS | 5 assertions |
| SPEC-04 | TASK-6.23 archived | orchestrator step | PASS | per judge, 4/4 |
- Judge round 1: PASS, no failed or unproven items. Gate runs: 2.

## Review
No blocking findings (round 1: code and security).

### Non-blocking review notes (deliberately not fixed)
- The one MINOR (doc comment wording) was fixed. No other findings recorded.

## How to try it
`npx vitest run tests/bots/no-session-memory.acceptance.test.ts`

## Run metrics
Questions 1 · assumptions 3 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · about 73 lines of code, test and requirements changed.

## Known limitations and follow-ups
- Any future adaptive-bots story must first revisit REQ-029.3 and REQ-028.2 (options A or C then apply).
- TASK-6.19's earlier-showdowns plumbing stays in the playtest runner, unused by bots.

## Lessons for the factory (proposals — not applied)
- `backlog decision create` has no body option, so rationale must go in the task summary. Consider a CLI or skill note.
