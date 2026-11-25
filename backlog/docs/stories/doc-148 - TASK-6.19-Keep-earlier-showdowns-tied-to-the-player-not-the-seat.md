---
id: doc-148
title: 'TASK-6.19: Keep earlier showdowns tied to the player, not the seat'
type: other
created_date: '2026-11-25T21:53:00Z'
updated_date: '2026-11-25T21:53:00Z'
---
# TASK-6.19: Keep earlier showdowns tied to the player, not the seat

Status: Done · Completed: 2026-11-25 · Epic: TASK-6 · Milestone: m-1 · Requirements: REQ-007.5, REQ-025.1 · Branch: doit/TASK-6.19

## What was asked
In a cash `--lineup` playtest a busted bot is replaced by a new bot in the same seat (REQ-007.5). The earlier-showdown list names shown hands by seat only, so the new bot's seat kept the old player's shown hands and a bot could profile the wrong player. AC#1: a replaced seat never inherits the previous player's showdowns. AC#2: the list the runner hands to policies is frozen. Spec: doit/TASK-6.19/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | An entry whose shown hands are all forgotten is dropped, not kept as `{ shown: [] }`. | yes | An empty entry tells a policy nothing. | Keep empty entries in `forgetSeats` |
| A-2 | Without a line-up (and in sit-and-go) a 0-stack seat is the same player, so nothing is forgotten. Only seats in `replaced` change player. | yes | No replacement exists there, only the stack restore. | Treat every bust as a new player |
| A-3 | Freezing happens in `rememberShowdown`, not `playerView`. A list a caller builds by hand and passes to `playHand` is not frozen. | yes | Freezing in `playerView` would mutate the caller's object and break TASK-1.5 A-3. | Freeze in `playerView` or copy per view |
| A-4 | `rememberShowdown` stores a deep-frozen copy, not the caller's entry. | yes | `showdownOf`'s result is reused for hand records. | Freeze in place |
| A-5 | Append the finished hand's showdown first, then forget replaced seats, so the busting bot's last showdown is dropped too. | yes | That showdown belongs to the player who left. | Forget before appending |

## Clarifications and decisions
- Q-1 (autopilot, auto-accepted the recommended option): edit the locked TASK-6.9 test `tests/playtest/style-bots.acceptance.test.ts`, whose expected list was unfiltered and contradicted AC#1. Only how the expected list is built changed (seats in each hand's `replaced` are forgotten); no assertion was removed or loosened. The lock was re-pinned.
- D-1: keep `ShownHand` seat-keyed and forget a seat's hands when it gets a new player. Adding a player id would change the persisted hand-record `shown` format and the pinned `PlayerView` keys. The replaced player has left, so their cards are useless.
- D-2: deep-freeze the list, entries, `shown` arrays, `ShownHand`s and `holeCards` once at append, so views keep sharing one list cheaply.
- D-3: the Q-1 test edit above.

## What was built
- `src/engine/player-view.ts`: new `rememberShowdown(list, entry, limit)` (appends a deep-frozen copy, keeps the last `limit`) and `forgetSeats(list, seats)` (drops those seats' shown hands, drops emptied entries, returns the same list when nothing matches). `EarlierShowdown` doc now says seat means the player at that seat now.
- `src/playtest/runner.ts`: `runPlaytest` appends with `rememberShowdown`, then calls `forgetSeats(showdowns, replaced)`. Doc comments updated.
- Tests: `tests/playtest/earlier-showdowns.acceptance.test.ts` (new), `tests/engine/player-view.test.ts` (unit tests), `tests/playtest/style-bots.acceptance.test.ts` (Q-1 edit).
- No bot decisions change: no bot reads `earlierShowdowns`. The app session (`src/table/session.ts`) gives bots no earlier showdowns yet, so it is untouched. TASK-6.23 has an AC to apply `forgetSeats` when it adds them.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | acceptance: every view equals a per-tenure model over a 12-hand, 3-seat Tough run | PASS | Passes on branch, fails on base. Judge holdouts: 6 scenarios, 0 tenure violations. |
| SPEC-02 | AC#2 | acceptance: deep-frozen, 5 tamper attempts throw TypeError | PASS | Fails on base. Judge holdout: about 350k views frozen, all tampering threw. |
| SPEC-03 | AC#2 | unit: `rememberShowdown` | PASS | Window of 1000 held over 1200 appends. |
| SPEC-04 | AC#1 | unit: `forgetSeats` | PASS | Worked example, same-object and no-match cases. |
| SPEC-05 | AC#1 | acceptance: TASK-6.9 test with updated expected list | PASS | Fails on base. |
| SPEC-06 | AC#1, AC#2 | `npm run lint && npm run typecheck && npm test` | PASS | 313 files passed, 1416 tests passed, 46 opt-in slow tests skipped. |

- Playtest stdout and exit code were byte-identical on main and the branch in 9 configurations, including the spec run command.
- Gates: build-1 and fix-2 both PASS (255 changed lines, 5 files).
- Judge round 1: PASS 6/6, no blocking findings.

## Review
Code and security review round 1: no blocking findings. The security review found no hidden-card leak, since entries still come only from `showdownOf`.

### Non-blocking review notes (deliberately not fixed)
- NIT: the `rememberShowdown` unit test builds its starting frozen entries with `rememberShowdown` itself. The assertions that matter still fail if the function breaks.
- Judge LOW (J-1-01): `doit/TASK-6.9/state.json` `relock_pending` lists the style-bots test twice. This is bookkeeping only.

## How to try it
- `npm test`
- `npx vitest run tests/playtest/earlier-showdowns.acceptance.test.ts tests/playtest/style-bots.acceptance.test.ts`
- `npm run playtest -- --hands 300 --seed 42 --size 6 --lineup tough`

## Run metrics
Questions 1 · assumptions 5 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 255.

## Known limitations and follow-ups
- In the app, bots still get no earlier showdowns. TASK-6.23 owns applying `forgetSeats` there (AC already added).
- Replay (`replayWithBots`) passes no earlier showdowns; reproducing session-memory reads is TASK-6.20.
- No new follow-up tasks.

## Lessons for the factory (proposals — not applied)
None. The run had no send-backs or escalations.
