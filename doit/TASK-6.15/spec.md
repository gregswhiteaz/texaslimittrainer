# Spec: TASK-6.15 — Replay any hand with every bot acting exactly as before

Status: READY (approved 2026-11-22)
Task: TASK-6.15 · Parent/epic: TASK-6 · Requirements: REQ-028 (REQ-028.1, REQ-028.2) · Dream: limit-holdem-trainer

## 1. Summary
This story proves REQ-028.2: you replay a hand with the same replay code and the same user actions, and every bot
action comes out the same, for every style. The playtest runner gets two additions. Seat 1 (the user) can follow a
policy of its own. A new replay function re-deals a recorded hand, plays seat 1's recorded actions back, and lets the
bots decide again. Acceptance tests record 1,000 hands each from a 6-max all-TAG run and a 6-max Mixed run, replay
them and compare every action. A third test changes the user's first action and checks that the cards stay the same
and that the bot actions before that point still match. Earlier showdowns in the app and on replay moved to TASK-6.23,
which depends on the spike TASK-6.20 (Q-1).

## 2. Scope
- In scope:
  - `PlaytestSeams.userPolicy`: a seam that replaces seat 1's policy in `playHand` and `runPlaytest`. Every other
    seat keeps the policy it had: the line-up, the default or `makePolicy`.
  - `scriptedPolicy(actions, then?)` in `src/playtest/policy.ts`: plays recorded actions back in order.
  - `replayWithBots(record, lineUp, userPolicy)` in `src/playtest/runner.ts`: re-deals the record's table and plays
    it with fresh bot policies. It returns a `PlayedHand`.
  - `recordStacks` moves from `src/playtest/cli.ts:252` to `runner.ts` and is exported. The CLI imports it.
  - Acceptance tests for AC#1, AC#2 and AC#3, plus unit tests for the new functions.
- Not doing:
  - Earlier showdowns in the app session and on `--replay-code` (the former AC#4). Per Q-1 it moved to TASK-6.23,
    which depends on TASK-6.20.
  - Any change to persisted hand records (REQ-052.2), `CompletedHand` or `TableState`.
  - New CLI options. Replaying user actions from the command line is out of scope: in the playtest, seat 1 already
    plays `seededTagPolicy`, which depends only on the code.
  - An in-app replay screen. There is no UI change.
  - Any change to how bots draw randomness (`src/engine/bot-random.ts`) or decide (`src/bots/*`).
  - Default and `--lineup` playtest output: it stays byte-identical, because the seam is unused there.
- Scope budget: files=6, lines=400

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The replays in AC#1–#3 pass no earlier showdowns (`[]`), as `--replay-code` does today. The originals got the table's earlier showdowns. | yes | No bot reads `view.earlierShowdowns`: the only reads are in `src/engine/player-view.ts` and `src/playtest/runner.ts`, and nothing under `src/bots` uses it (TASK-6.9 spec found the same). The list changes no bot decision. Whether hand records carry it is TASK-6.20's decision (TASK-6.20; Q-1). | Capture each hand's earlier showdowns and pass them to the replay. That pre-empts TASK-6.20. |
| A-2 | The test's "scripted user policy" for seat 1 is `randomMovePolicy` on one test-level `Xoshiro128(2026)` shared across the whole run, so seat 1's actions do **not** follow from the replay code. | yes | If the user's actions could be derived from the code (as with `seededTagPolicy`), the test would not show that the replay depends on the fed-back user actions. Random legal moves reach many different spots. | `seededTagPolicy` for seat 1: deterministic from the code, so a weaker test. |
| A-3 | The "6-max TAG playtest" is `runPlaytest({ hands: 1000, seed, size: 6 })` without a line-up. At 6 players every seat plays `seededTagPolicy` (`src/playtest/runner.ts:167-172`), and seat 1 is overridden by A-2. | yes | No preset is all-TAG (`src/bots/lineup.ts:50-56`). The default factory is the all-TAG table. | Tough preset: one Maniac. |
| A-4 | In AC#3 the "different user action" is the first entry of seat 1's `view.legalActions` at its first decision whose `type` differs from the recorded one. After that, seat 1 plays check if legal, else fold. The test covers the first 200 hands of the AC#2 Mixed run in which seat 1 makes at least one decision. | yes | Seat 1 always has at least two legal actions when it decides (fold plus call/check, or check plus bet), so a different action always exists. The later user actions are free under AC#3. A passive rule keeps the hand short and legal. | Random alternative actions. |
| A-5 | The seed for the AC#1 and AC#2 runs is 15 (any fixed seed works; same as the story number). | yes | Deterministic tests. | Any other fixed seed. |

## 3. Current system
- Bot randomness: `botDecisionSeed(code, view)` is the (k+1)-th `nextUint32` of `seatGenerator(code, seat)`, where k
  is the seat's earlier non-blind actions in the hand (`src/engine/bot-random.ts:26-39`). It depends only on the code,
  the seat and the decision index. User actions change only the view the bot sees. This is REQ-028.1, done in TASK-6.18.
- Playtest policies (`src/playtest/policy.ts`): `seededTagPolicy(code)` (`:13-15`), `randomMovePolicy(rng)` (`:19-25`),
  `seatStylesPolicyFactory(seats)` (`:30-42`), where seat 1 (style null) plays `seededTagPolicy` and bots play
  `decideStyle` with `botRandom(botDecisionSeed(code, view))`. Sizes other than 6 play random moves.
- Runner (`src/playtest/runner.ts`):
  - `playHand(code, size, button, number, seams, setup)` (`:204-264`) builds one policy per dealt-in seat with
    `makePolicy(code, seat)` (`:229`) and passes `playerView(state, seat, earlierShowdowns)` (`:234`).
  - `runPlaytest` (`:338-405`) gives each hand `seatStylesPolicyFactory(seats)` for line-up runs unless
    `seams.makePolicy` is set (`:354-357`). It also attaches `lineUp` (the seats at that hand's deal, after
    replacements) to each `PlayedHand` (`:359`), and carries stacks, button and earlier showdowns between hands
    (`:384-401`).
  - `HandRecord` (`:120-131`) holds the replay code, stakes, dealt-in seats with starting stacks, button, player
    actions (blinds excluded), game and size.
  - `replayHand(record)` (`:409-422`) re-applies every recorded action, the bots' included. It does not make the bots
    decide again, so it is not a bot-replay proof.
- `recordStacks(record)` (`src/playtest/cli.ts:251-254`) turns a record's seats into one stack per seat (0 for a seat
  not dealt in). It is private to the CLI today.
- CLI replay (`src/playtest/cli.ts:390-401`) calls `playHand` with `{ game, stacks }`, so it passes no earlier
  showdowns.
- App session: `botTurn` builds `playerView(hand, seat)` with no earlier showdowns (`src/table/session.ts:290-299`).
  `TableState` (`:146-160`) keeps no showdown history, and the app has no hand-replay feature.
- Tests: vitest. `npm test` runs everything, including `*.acceptance.test.*`. Slow checks are opt-in through
  `TLH_SLOW_TESTS` and `npm run test:slow` (`package.json`). Speed reference: 100,000 6-max Mixed hands take about
  70 s (TASK-6.9 spec §9), so 1,000 hands take under a second.
- Locked tests: none needs an edit. The seam is optional and `replayHand` is unchanged
  (`tests/playtest/runner.acceptance.test.ts` and `tests/playtest/cli.test.ts` keep passing). Moving `recordStacks`
  changes no CLI output.
- Existing code to reuse:
  - `src/playtest/runner.ts` `playHand` → the replay engine loop. Do not write a second loop.
  - `src/playtest/policy.ts` `seatStylesPolicyFactory`, `randomMovePolicy` → line-up bots and the test's user policy.
  - `src/playtest/runner.ts` `defaultPolicyFactory` → all-TAG bots when a record has no line-up.
  - `src/playtest/cli.ts` `recordStacks` → move it, don't duplicate it.
  - `src/engine/seeded-random.ts` `Xoshiro128` → the test-level user generator.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Seat 1's policy is overridden by a new optional `PlaytestSeams.userPolicy`, applied inside `playHand`. | Use `seams.makePolicy`. But in `runPlaytest` that switches off the line-up styles (`runner.ts:355`), and the test can't know the replacements in advance. | Smallest change that keeps every bot seat on its real policy, including replaced bots. | no | n/a |
| D-2 | The replay is a src function (`replayWithBots`), not test-only code. | Inline it in the test. | REQ-028.2 is a product rule. The future app or CLI replay (after TASK-6.20) can reuse it, and it gets unit coverage. | no | n/a |
| D-3 | The former AC#4 (earlier showdowns in the app and on replay) moves to the follow-up TASK-6.23, which depends on TASK-6.20. | (b) in-memory app half now; (c) rebuild the list from the seed words in the code. | It may need a hand-record field or replay context that TASK-6.20 is meant to decide. No bot reads `earlierShowdowns`, so nothing is lost. | yes | user (Q-1, auto-accepted) |

## 5. Design

### Files to create / modify
- `src/playtest/runner.ts` — modify: `PlaytestSeams.userPolicy`, wrapped in `playHand`. Export the moved
  `recordStacks`. Add `PLAYTEST_USER_SEAT = 1` and `replayWithBots`.
- `src/playtest/policy.ts` — modify: add `scriptedPolicy`.
- `src/playtest/cli.ts` — modify: import `recordStacks` from the runner and delete the local copy.
- `tests/playtest/bot-replay.acceptance.test.ts` — create: AC#1, AC#2, AC#3 (SPEC-01, SPEC-02, SPEC-03).
- `tests/playtest/runner.test.ts` — modify: unit tests for `userPolicy`, `replayWithBots` and `recordStacks`
  (SPEC-04, SPEC-06).
- `tests/playtest/policy.test.ts` — modify: unit tests for `scriptedPolicy` (SPEC-05).

### Components, interfaces and data
```ts
// src/playtest/runner.ts
/** The playtest's user seat (seatLineUp(preset, size, 1)). */
export const PLAYTEST_USER_SEAT: SeatNumber = 1;
export interface PlaytestSeams {
  // …existing…
  /** Seat 1's policy for each hand, replacing the one makePolicy, the line-up or the default gives it.
   *  Other seats are unchanged. Default: none. */
  readonly userPolicy?: PolicyFactory;
}
/** One stack per seat 1..size: each dealt-in seat's starting stack, 0 for the others. (Moved from cli.ts.) */
export function recordStacks(record: HandRecord): number[];
/** Re-deals record.replayCode at the record's table (size, button, game, recordStacks) and plays it with the
 *  bots deciding again: seatStylesPolicyFactory(lineUp) when lineUp is given, else defaultPolicyFactory.
 *  Seat 1 plays userPolicy. Passes no earlier showdowns (A-1). Returns playHand's PlayedHand (number 1). */
export function replayWithBots(
  record: HandRecord,
  lineUp: readonly LineUpSeat[] | undefined,
  userPolicy: SeatPolicy,
): PlayedHand;

// src/playtest/policy.ts
/** Returns actions[0], actions[1], … on successive calls, as given. Once they run out it calls `then(view)`,
 *  or throws RangeError(`No recorded action left for seat ${view.seat}`) if `then` is absent. */
export function scriptedPolicy(actions: readonly Action[], then?: SeatPolicy): SeatPolicy;
```
- In `playHand`, the policy map becomes
  `seat === PLAYTEST_USER_SEAT && userPolicy !== undefined ? userPolicy(code, seat) : makePolicy(code, seat)`.
  Nothing else in the loop changes.
- `replayWithBots` calls `playHand(record.replayCode, record.size, record.button, 1, { makePolicy?, userPolicy: () => userPolicy }, { game: record.game, stacks: recordStacks(record) })`.
  It has no `previous`, so there is no cross-hand check. A fresh policy is made for each call.

### Rules and algorithms
- A hand's bot actions are `record.actions.filter(a => a.seat !== 1)`, and its user actions are
  `record.actions.filter(a => a.seat === 1)`.
- Replay match (AC#1, AC#2): `replayWithBots(record, hand.lineUp, scriptedPolicy(userActions)).record.actions`
  deep-equals `record.actions`. That means the same seats, types and amounts in the same order. It follows that every
  bot action matches. The replay also has `violations === 0` and `final.result` equal to the original's.
- Worked example: Mixed hand k has actions `[s4 raise 8, s5 fold, s6 call 8, s1 call 8, s2 fold, s3 call 8, …]`.
  The replay gets user actions `[s1 call 8, …]`. Seats 2–6 decide again from the same code, seat and view, so they
  produce the same actions.
- Changed first action (AC#3): the original record has prefix P, the actions before seat 1's first action. The replay
  uses `scriptedPolicy([alt], passive)`, where `alt` follows A-4 and `passive` is check if legal, else fold. Then:
  - every seat's `holeCards` in `final.players` equal the original's;
  - over `n = min(board lengths)`, the first n board cards are equal;
  - the replay's actions before its first seat-1 action deep-equal P;
  - the replay's first seat-1 action is `alt`, and its type differs from the original's.

### Error handling and configuration
- `scriptedPolicy` with no `then` throws `RangeError('No recorded action left for seat <s>')` when called after
  the last action. A recorded action that is illegal in the replay is rejected by the engine. `playHand` reports it as
  a `legal-action` violation (`runner.ts:238-249`), so a diverged replay never passes silently.
- `replayWithBots` throws whatever `playHand` throws (RangeError for bad stacks). Records from `playHand` are always
  well formed.

## 6. Behaviour specification

### SPEC-01: 1,000 all-TAG hands replay with identical bot actions
- Verifies: AC#1, DoD#1
- Behaviour: Given `runPlaytest({ hands: 1000, seed: 15, size: 6 }, collect, { userPolicy: () => randomMovePolicy(USER_RNG) })`
  where `USER_RNG = new Xoshiro128(2026)` is shared across the run (A-2, A-5), and the run reports 0 violations,
  When each of the 1,000 records is replayed with `replayWithBots(record, undefined, scriptedPolicy(userActions))`,
  Then for every hand the replay's `record.actions` deep-equals the original's, the replay has 0 violations, and
  `final.result` equals the original's. Across the run, seat 1 made at least one decision in at least 100 hands, and
  bot seats made at least 1,000 actions in total. That shows the comparison is not vacuous.
- Verification: acceptance `tests/playtest/bot-replay.acceptance.test.ts::replaying 1,000 6-max TAG hands with the user's recorded actions reproduces every bot action`

### SPEC-02: 1,000 Mixed hands replay with identical bot actions for every style
- Verifies: AC#2, DoD#1
- Behaviour: Given `runPlaytest({ hands: 1000, seed: 15, size: 6, lineUp: 'Mixed' }, collect, { userPolicy: () => randomMovePolicy(new shared Xoshiro128(2026)) })`
  reporting 0 violations, When each record is replayed with
  `replayWithBots(record, hand.lineUp, scriptedPolicy(userActions))`, Then every replay's `record.actions`
  deep-equals the original's, with 0 violations and an equal `final.result`. Bot actions by seats whose
  `hand.lineUp` style is TAG, Calling station, Maniac and Rock each number at least 1. Replaced bots, if any, replay
  with their drawn style because `hand.lineUp` carries it.
- Verification: acceptance `tests/playtest/bot-replay.acceptance.test.ts::replaying 1,000 6-max Mixed hands with the user's recorded actions reproduces every bot action of every style`

### SPEC-03: A different first user action keeps the cards and the bot actions before it
- Verifies: AC#3, DoD#1
- Behaviour: Given the first 200 hands of the SPEC-02 run in which seat 1 has at least one action, When each is
  replayed with `replayWithBots(record, hand.lineUp, scriptedPolicy([alt], passive))` (A-4), Then for every hand:
  each seat's hole cards equal the original's; the common prefix of the two boards is equal; the replay's actions
  before its first seat-1 action deep-equal the original's actions before seat 1's first action; and the replay's
  first seat-1 action has a type different from the original's.
- Verification: acceptance `tests/playtest/bot-replay.acceptance.test.ts::replaying with a different first user action deals the same cards and keeps every bot action before it`

### SPEC-04: The userPolicy seam replaces only seat 1
- Verifies: AC#1, AC#2
- Behaviour: Given `playHand(code, 6, 1, 1, { makePolicy: m, userPolicy: u })`, When the hand plays, Then `u` is
  called once for seat 1 (with `(code, 1)`), `m` is called once for each of seats 2–6 and never for seat 1, and
  seat 1's views reach `u`'s policy. Given `runPlaytest({ hands: 20, seed: 1, size: 6, lineUp: 'Mixed' }, …, { userPolicy: u })`,
  `u` is called once per hand, always with seat 1. That the bot seats keep their line-up styles is shown end to end
  by SPEC-02: a replay with `seatStylesPolicyFactory(hand.lineUp)` would not match otherwise. Without `userPolicy`,
  `playHand` output is unchanged (existing runner tests pass).
- Verification: unit `tests/playtest/runner.test.ts::userPolicy replaces only seat 1's policy`

### SPEC-05: scriptedPolicy plays actions back in order, then falls back or throws
- Verifies: AC#1, AC#3
- Behaviour: Given `scriptedPolicy([a1, a2])`, When it is called three times, Then it returns `a1`, then `a2`, then
  throws `RangeError('No recorded action left for seat 1')` for a seat-1 view. Given `scriptedPolicy([a1], then)`,
  the second call returns `then(view)`. Given `scriptedPolicy([])` with `then`, the first call delegates.
- Verification: unit `tests/playtest/policy.test.ts::scriptedPolicy returns recorded actions in order, then falls back or throws`

### SPEC-06: replayWithBots uses the record's table and flags a diverged script
- Verifies: AC#1, AC#2
- Behaviour: Given an sng record whose seat 3 is not dealt in (`size` 6, 5 seats), When `replayWithBots` replays it,
  Then `recordStacks(record)` has 0 at index 2, and the replay deals the same 5 seats, button and stakes. Given a
  recorded user script with an action that is illegal in the replay (for example a `check` facing a bet), Then the
  replay reports a `legal-action` violation and does not pass. `recordStacks` gives the same values the CLI printed
  before, and the existing `tests/playtest/cli.test.ts` cases pass unchanged.
- Verification: unit `tests/playtest/runner.test.ts::replayWithBots replays the record's table and reports a diverged user script`

### SPEC-07: 10,000-hand playtests report zero violations with unchanged output
- Verifies: DoD#6
- Behaviour: Given the default and Mixed line-up runs, When 10,000 hands play, Then each reports `Violations: 0`
  and exits 0. The default-run SHA-256 equals the value on `main` before this story, because the seam is unused there.
- Verification: command `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256 && npm run -s playtest -- --hands 10000 --seed 42 --size 6 --lineup mixed | tail -3`

### SPEC-08: Quality gates
- Verifies: DoD#1, DoD#2, DoD#3, DoD#4, DoD#5, DoD#10
- Behaviour: Every AC in scope has a passing automated test (SPEC-01, 02, 03). `npm run lint`, `npm run typecheck`
  and `npm test` pass with zero errors, coverage thresholds hold, and `tests/toolchain/boundary*.test.ts` still pass
  (no UI imports in engine, bots or advice). The golden-spot suite does not exist yet (E07-S14), so DoD#3 is N/A. CI
  is green on the branch.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-09: Not-applicable DoD items and docs
- Verifies: DoD#7, DoD#8, DoD#9, DoD#11, DoD#12
- Behaviour: No screen or dialog changes (DoD#7, DoD#12 N/A). No strategy content (DoD#9 N/A). No network code is
  added to `src/playtest` (DoD#8). The docs stage publishes the story doc to Backlog.md (DoD#11).
- Verification: manual `grep -rn "fetch(\|XMLHttpRequest\|WebSocket" src/playtest` finds nothing; `backlog doc list --plain` shows the TASK-6.15 doc

## 7. Edge cases
- Seat 1 never decides (a walk in the big blind, or everyone folds before seat 1 acts): the user script is empty.
  The replay must still match (SPEC-01/02). AC#3 skips these hands (A-4).
- Replaced bots in Mixed cash runs: `hand.lineUp` carries the replacement style (SPEC-02).
- Hands with fewer than 6 dealt in: not possible in a 6-max cash run (cash rebuys). Sng empty seats are covered by
  `recordStacks` (SPEC-06).
- A script that runs out or diverges: it throws or reports a violation, and never passes silently (SPEC-05, SPEC-06).
- A hand that stopped at a violation: the runs must report 0 violations, and the tests assert this first. These
  hands are not replayed.
- Concurrency, permissions, network failure: N/A for pure in-process code.

## 8. Security considerations
- Trust boundaries: no new input surface. The CLI is unchanged, and the new functions take in-process data only.
- Randomness: bot randomness stays the seeded, non-cryptographic generator (REQ-028.1). Fairness here means
  reproducibility, not unpredictability. The test's user generator is test-only.
- No new dependencies, secrets, logging or injection surfaces.

## 9. Non-functional
- Speed: `tests/playtest/bot-replay.acceptance.test.ts` (about 2,000 + 2,000 + 200 hands) should finish in under
  15 s on the reference machine (about 1 s per 1,000 hands, measured by vitest's reported duration). It stays in the
  normal `npm test` suite, following the standing rule that only multi-minute speed or scale checks are opt-in. Per-test
  timeout: 120,000 ms, like `tests/playtest/style-bots.acceptance.test.ts:18`.
- Determinism: fixed seeds, so the tests give the same result on every run.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx vitest run tests/playtest/bot-replay.acceptance.test.ts` (there is no user-facing CLI change; the
  existing replay still works: `npm run playtest -- --replay-code <code> --size 6 --button 1 --lineup mixed`)
- New tests:
  - `tests/playtest/bot-replay.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03
  - `tests/playtest/runner.test.ts` → SPEC-04, SPEC-06
  - `tests/playtest/policy.test.ts` → SPEC-05
- End-to-end scenario for the Judge:
  1. Run `npx vitest run tests/playtest/bot-replay.acceptance.test.ts` and see 3 tests pass, each well under its
     timeout.
  2. Run `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` and compare the hash with the one
     on `main` (unchanged).
  3. Pick a replay code from a `--lineup mixed` run. Replay it twice with `--replay-code … --lineup mixed` and see
     identical output.

## 11. Open questions
- None. Q-1 is answered (see `doit/TASK-6.15/qa.md`): option (a), auto-accepted; the former AC#4 is in TASK-6.23.

## 12. Clarifications log
See `doit/TASK-6.15/qa.md`.
