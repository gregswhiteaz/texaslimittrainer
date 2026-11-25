# Spec: TASK-6.19 — Keep earlier showdowns tied to the player, not the seat

Status: READY (approved 2026-11-25)
Task: TASK-6.19 · Parent/epic: TASK-6 · Requirements: REQ-007.5, REQ-025.1 · Dream: limit-holdem-trainer

## 1. Summary
Earlier showdowns (`EarlierShowdown[]`, handed to every seat policy through `PlayerView.earlierShowdowns`) name each
shown hand by seat only. In a cash `--lineup` playtest a busted bot is replaced by a new bot in the same seat
(REQ-007.5), and today the new bot's seat keeps the old player's shown hands, so a bot could profile the wrong player.
This task makes the runner forget a replaced seat's shown hands at the moment of replacement, so every shown hand a view
attributes to seat N was shown by the player who sits at seat N now. It also makes the list and every entry the runner
builds deeply frozen, so no policy can change what another policy (or a later hand) sees.

## 2. Scope
- In scope:
  - Two pure helpers in `src/engine/player-view.ts`: `rememberShowdown` (append + window + deep freeze) and
    `forgetSeats` (drop the shown hands of seats that changed player).
  - `runPlaytest` (`src/playtest/runner.ts`) uses them: append the finished hand's showdown, then forget every seat
    replaced before the next hand.
  - One new acceptance test file, unit tests for the helpers, and the one-assertion update of TASK-6.9's locked test
    that pins the old seat-keyed behaviour (D-3, approved by Q-1).
- Not doing:
  - The app session (`src/table/session.ts`): it gives bots no earlier showdowns at all today (`botTurn` builds
    `playerView(hand, seat)` with the default `[]`, `src/table/session.ts:647`). Giving the app the same list is
    TASK-6.23; it can reuse `rememberShowdown`/`forgetSeats` there.
  - How replay reproduces bot actions that read session memory (TASK-6.20, a decision spike). Nothing here changes
    `replayWithBots`, which passes no earlier showdowns (`src/playtest/runner.ts:432-447`, its A-1).
  - Observed-opponent stats for user hints: already keyed by per-session bot id, so a replacement starts at 0
    (`countObserved`/`userObservedSnapshot`, `src/table/session.ts:594-623`). Bots never use observed stats
    (`src/bots/tag.ts:34-36`). No change.
  - No player-identity field on `ShownHand`/`EarlierShowdown` (D-1): that type is also the persisted hand record's
    `shown` field (`src/table/hand-record.ts:104`, `src/table/session.ts:714`).
  - No change to `playerView`/`actWith`: they still pass the caller's list through by reference (TASK-1.5 A-3, pinned
    by `tests/engine/player-view.test.ts:91`). A list a caller builds by hand and passes to `playHand` is not frozen
    by this task (A-3).
  - No change to bot decisions: no bot reads `earlierShowdowns` today (no reference under `src/bots` or `src/advice`),
    so every playtest summary, million run and replay stays byte-identical.
- Scope budget: files=5, lines=260

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | An entry whose every shown hand is forgotten is dropped from the list rather than kept as `{ shown: [] }`. | yes | An `EarlierShowdown` holds "only the hands that were shown" (`src/engine/player-view.ts:20`); an empty one tells a policy nothing and would count as a showdown with no cards. | Keep empty entries so the list length still counts showdowns |
| A-2 | In a cash run without a line-up (and in a sit-and-go), a seat that ends on 0 is the same player (rebuy/sit-out), so nothing is forgotten. Only seats in the runner's `replaced` list change player. | yes | Without a line-up there is no replacement, only the stack restore (`src/playtest/runner.ts:393-396`); sit-and-go never replaces and a new sit-and-go already restarts the list (`runner.ts:397-400`). | Treat every bust as a new player |
| A-3 | Freezing happens where the session/runner appends (`rememberShowdown`), not inside `playerView`. A caller-supplied `HandSetup.earlierShowdowns` is passed through as given. | yes | AC#2 is about entries the session appends; freezing inside `playerView` would mutate the caller's object, breaking "never mutates" and TASK-1.5 A-3 identity. | Freeze in `playerView` (in place) or copy on every view |
| A-4 | `rememberShowdown` stores a deep-frozen copy of the entry, not the caller's object. | yes | The caller (`showdownOf`) result is also used elsewhere (hand records via `completedHand`); freezing a copy keeps those objects unchanged. Cost is O(shown) per showdown. | Freeze `showdownOf`'s result in place |
| A-5 | The finished hand's showdown is appended first and then replaced seats are forgotten, so a bot's showdown in the hand it busted in is dropped too. | yes | That showdown belongs to the player who left. | Forget before appending (would keep the busting hand's cards on the new bot's seat) |

## 3. Current system
- `src/engine/player-view.ts:15-23` — `ShownHand { seat, holeCards }`, `EarlierShowdown { shown }`;
  `:55-56,104` `PlayerView.earlierShowdowns` passed through "as supplied (not copied)"; `:124-132` `showdownOf`.
- `src/playtest/runner.ts:44-45` `EARLIER_SHOWDOWN_LIMIT = 1000`; `:86` `HandSetup.earlierShowdowns`;
  `:240` every view gets the same list; `:358-410` `runPlaytest` loop: replacement at `:384-391` fills `replaced`
  (seats whose bot is new next hand), then `:401-402` appends `showdownOf(final)` with
  `[...showdowns, entry].slice(-EARLIER_SHOWDOWN_LIMIT)` — not frozen, never forgets a replaced seat (the bug).
- `PlayedHand.replaced` (`runner.ts:148-149`) tells callers which seats got a new bot at that hand.
- The session (`src/table/session.ts:639-648`) passes no earlier showdowns to bots; the hand record stores
  `shown: EarlierShowdown | null` (`src/table/session.ts:713-714,744`, `src/table/hand-record.ts:103-104`).
- Tests: Vitest (`npm test` = `vitest run --coverage`, `package.json`); `*.acceptance.test.*` run in the normal suite;
  slow ones are opt-in via `test:slow`. Code is ESM (strict mode), so writing a frozen property throws `TypeError`.
- Locked tests touching earlier showdowns (from `doit/*/state.json` `locked_tests`):
  - `tests/playtest/style-bots.acceptance.test.ts` (owner TASK-6.9) — `'the playtest passes each seat the earlier
    showdowns from previous hands'` expects every view at hand k to `toEqual` all earlier showdowns, unfiltered
    (lines 86-97). Seed 42 / Tough / 6 seats replaces seats at hands 100, 120, 255, 286 and 299 (measured), so this
    assertion contradicts AC#1 and must change (Q-1). The `flagged` part (8 hands, no replacement) is unaffected.
  - `tests/engine/player-view.acceptance.test.ts`, `tests/engine/player-view.property.test.ts` (TASK-1.5),
    `tests/engine/showdown-order.acceptance.test.ts` (TASK-1.15), `tests/playtest/runner.acceptance.test.ts`
    (TASK-1.6), `tests/playtest/replacement.acceptance.test.ts` (TASK-6.8/6.17),
    `tests/bots/replacement.acceptance.test.ts` (TASK-6.8): checked; they build views directly with their own lists
    or never read `earlierShowdowns`, and toEqual ignores freezing. No change.
  - Unlocked `tests/playtest/runner.test.ts:374-480` (no line-up, so no replacement; compares with `toEqual` and
    `structuredClone` snapshots): unaffected by freezing. No change expected.
- Existing code to reuse:
  - `src/engine/player-view.ts` `showdownOf` → building the entry (unchanged).
  - `src/playtest/runner.ts` `replaced` array → the seats to forget (no new bookkeeping).
  - `tests/playtest/runner.test.ts` `raiseOrCall`/`checkDown` policy pattern → forcing showdowns and busts in tests.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Keep `ShownHand` seat-keyed and make the list per-tenure: when a seat gets a new player, that seat's shown hands are removed. | (b) Add a player id/name to `ShownHand`. (c) Add per-seat "player since" info to `PlayerView`. | (b) changes the type stored as the hand record's `shown` (persisted format) and the exact-shape locked tests; (c) changes `PlayerView`'s 14 pinned keys (TASK-1.5 lock). D-1 meets AC#1 with no format or interface change; the replaced player has left, so their cards are useless to anyone. | yes | user (Q-1) |
| D-2 | The runner's list is deep-frozen (list, entry, `shown` array, each `ShownHand`, `holeCards`) via `rememberShowdown`/`forgetSeats`. | Copy per view (O(session) per decision, rejected in TASK-1.5 A-3); freeze in `playerView`. | One freeze per append; views keep sharing one list cheaply. | no | n/a |
| D-3 | Update TASK-6.9's locked assertion so its expected list forgets replaced seats (same rule as the runner). | Leave it (then AC#1 cannot pass); pick a run with no replacement (weakens the test). | The old assertion pins exactly the behaviour this task removes. | yes | user (Q-1) |

## 5. Design

### Files to create / modify
- `src/engine/player-view.ts` — add `rememberShowdown` and `forgetSeats`; doc comment on `EarlierShowdown` notes "seat = the player at that seat now".
- `src/playtest/runner.ts` — use the helpers in `runPlaytest`; update the `runPlaytest` / `HandSetup.earlierShowdowns` doc comments.
- `tests/playtest/earlier-showdowns.acceptance.test.ts` — new; AC#1 and AC#2 through `runPlaytest` (SPEC-01, SPEC-02).
- `tests/engine/player-view.test.ts` — unit tests for the helpers (SPEC-03, SPEC-04).
- `tests/playtest/style-bots.acceptance.test.ts` — TASK-6.9 test, unlocked by Q-1: expected list forgets replaced seats (SPEC-05).

### Components, interfaces and data
```ts
/** `list` plus a deep-frozen copy of `entry`, keeping the last `limit` (oldest dropped first). Returns a new frozen
 *  list; `list` and `entry` are not changed. */
export function rememberShowdown(
  list: readonly EarlierShowdown[], entry: EarlierShowdown, limit: number,
): readonly EarlierShowdown[];

/** `list` without the shown hands of `seats` (seats that now hold a different player); entries left with no shown
 *  hand are dropped (A-1). Returns `list` itself when `seats` is empty or nothing matches; otherwise a new frozen
 *  list whose untouched entries are the same objects and whose changed entries are new deep-frozen objects. */
export function forgetSeats(
  list: readonly EarlierShowdown[], seats: readonly SeatNumber[],
): readonly EarlierShowdown[];
```
- Invariant (runner): every list handed to a view is `Object.isFrozen`, and so is every entry, its `shown` array,
  each `ShownHand` and its `holeCards`.
- Invariant (runner, AC#1): at hand k, a `ShownHand` with seat s in any view came from a hand j < k with
  j ≥ the hand at which seat s's current player arrived (hand 1, the last table restart, or the hand whose `replaced`
  lists s).

### Rules and algorithms
- Runner, after hand k (no violation, ≥ 2 stacks left — unchanged paths reset the list as today):
  1. Replacement fills `replaced` (unchanged).
  2. `entry = showdownOf(final)`; if not null, `showdowns = rememberShowdown(showdowns, entry, EARLIER_SHOWDOWN_LIMIT)`.
  3. `showdowns = forgetSeats(showdowns, replaced)` (A-5).
- Worked example (`forgetSeats`): list `[{shown:[{seat:4,…},{seat:2,…}]}, {shown:[{seat:4,…}]}, {shown:[{seat:3,…}]}]`,
  seats `[4]` → `[{shown:[{seat:2,…}]}, {shown:[{seat:3,…}]}]`; the third entry is the same object as before.
- Worked example (runner, measured: seed 5, 3 seats, Tough, cash, every seat raises or calls so every hand shows
  down): `replaced` is `[2,3]` at hand 3, `[2]` at hands 5, 10, 12. Views at hand 3 hold hand 1-2 entries with only
  seat 1's shown hand; at hand 4 they also hold hand 3's full entry.

### Error handling and configuration
- No new errors. `EARLIER_SHOWDOWN_LIMIT` stays 1000.

## 6. Behaviour specification

### SPEC-01: A replaced bot never inherits the previous player's showdowns
- Verifies: AC#1
- Behaviour: Given `runPlaytest({ hands: 12, seed: 5, size: 3, game: 'cash', lineUp: 'Tough' })` with a seat policy
  that raises/bets when legal else calls/checks (so every hand reaches showdown and bots bust), recording every
  view's `earlierShowdowns`, When the run ends, Then at least one hand has a non-empty `replaced`; and for every hand
  k and every view in it, the list deep-equals the model: the `showdownOf` entries of hands 1..k-1 with, for each
  seat s, only the shown hands from hands at or after the arrival of seat s's current player (arrival = hand 1 or
  the latest hand ≤ k whose `replaced` contains s), entries left empty dropped; and at least one shown hand of a
  replaced player was present before the replacement and absent after it (the test counts > 0).
- Verification: acceptance `tests/playtest/earlier-showdowns.acceptance.test.ts::a replaced bot never sees the previous seat holder's showdowns`

### SPEC-02: Earlier showdowns a policy receives are frozen
- Verifies: AC#2
- Behaviour: Given the SPEC-01 run, When each policy receives a view with a non-empty `earlierShowdowns`, Then the
  list, every entry, every `shown` array, every `ShownHand` and every `holeCards` tuple are `Object.isFrozen`; and
  a policy that tries `push` on the list, assigning `entry.shown`, `push` on `entry.shown`, assigning `shownHand.seat`
  and assigning `holeCards[0]` gets a `TypeError` each time (caught in the policy, which then acts normally); and the
  lists seen by later decisions and hands still equal the SPEC-01 model (nothing changed). At least one decision
  receives a non-empty list.
- Verification: acceptance `tests/playtest/earlier-showdowns.acceptance.test.ts::every earlier showdown a policy receives is frozen`

### SPEC-03: rememberShowdown appends a frozen copy within the window
- Verifies: AC#2
- Behaviour: Given a list of 2 frozen entries and an unfrozen entry from `showdownOf`, When `rememberShowdown(list,
  entry, 2)`, Then the result has length 2 (oldest dropped), its last element deep-equals `entry` but is not the same
  object, the result and the copy are deeply frozen, and `list` and `entry` are unchanged (entry still not frozen).
- Verification: unit `tests/engine/player-view.test.ts::rememberShowdown appends a deep-frozen copy and keeps the last limit`

### SPEC-04: forgetSeats drops only the given seats' shown hands
- Verifies: AC#1
- Behaviour: Given the worked-example list, When `forgetSeats(list, [4])`, Then the result is the worked-example
  result, the unchanged entry is the same object, the result is deeply frozen and `list` is unchanged; When
  `forgetSeats(list, [])` or `forgetSeats(list, [7])`, Then it returns `list` itself.
- Verification: unit `tests/engine/player-view.test.ts::forgetSeats drops the shown hands of replaced seats`

### SPEC-05: TASK-6.9's playtest showdown test follows the player rule
- Verifies: AC#1
- Behaviour: Given the locked 300-hand Tough run (seed 42, 6 seats), When its expected list is built, Then after each
  hand it forgets the seats in the next hand's `replaced` (same rule as the runner), and every view still equals it.
  All other assertions in the file are unchanged. Approved by Q-1 (unlocked under TASK-6.9).
- Verification: acceptance `tests/playtest/style-bots.acceptance.test.ts::the playtest passes each seat the earlier showdowns from previous hands`

### SPEC-06: Quality gates and unchanged results
- Verifies: AC#1, AC#2
- Behaviour: Given the change, When the gates run, Then lint, typecheck and `npm test` pass, and `npm run playtest --
  --hands 300 --seed 42 --size 6 --lineup tough` prints the same output as on the base commit (bots do not read the list).
- Verification: command `npm run lint && npm run typecheck && npm test`

## 7. Edge cases
- Two bots replaced in one hand (hand 3 of SPEC-01) — SPEC-01, SPEC-04 (multiple seats).
- Busted bot showed down in the hand it busted in — dropped (A-5), covered by the SPEC-01 model.
- Entry left with no shown hand — dropped (A-1), SPEC-04.
- Window of 1,000 with forgetting — window applies at append; covered by existing `runner.test.ts:374` and SPEC-03.
- User seat — never replaced (`runner.ts:385`), so never forgotten; SPEC-01 model (seat 1 never in `replaced`).
- Sit-and-go / no line-up — no replacement (A-2); existing `runner.test.ts` restart tests stay green.
- Table restart after a violation — list resets to `[]` as today (`runner.ts:376-381`), already tested by TASK-6.9.
- Concurrency / permissions / dependency failure — N/A (pure synchronous code).

## 8. Security considerations
- Trust boundary: seat policies (bots, test policies) receive shared data; freezing (AC#2) stops one policy from
  altering what another sees. No input parsing, secrets, dependencies, randomness or logging changes. N/A otherwise.

## 9. Non-functional
- Cost: `rememberShowdown` keeps today's O(limit) copy per showdown hand plus O(shown) freezing; `forgetSeats` is
  O(limit) only on hands with a replacement. No measurable change to playtest throughput (slow throughput tests stay
  opt-in, not run here).
- New tests run in well under 1 s (SPEC-01 run measured at ~6 ms).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 300 --seed 42 --size 6 --lineup tough`
- New tests: `tests/playtest/earlier-showdowns.acceptance.test.ts` → SPEC-01, SPEC-02;
  `tests/engine/player-view.test.ts` → SPEC-03, SPEC-04; `tests/playtest/style-bots.acceptance.test.ts` → SPEC-05.
- Judge scenario: run the run command on the base commit and on the branch and diff the output (identical); run
  `npx vitest run tests/playtest/earlier-showdowns.acceptance.test.ts tests/playtest/style-bots.acceptance.test.ts`.

## 11. Open questions
- None. Q-1 resolved: the builder may edit the TASK-6.9 test as in SPEC-05 (see qa.md); D-1 accepted; the app-side forgetSeats AC is on TASK-6.23.

## 12. Clarifications log
See `doit/TASK-6.19/qa.md`.
