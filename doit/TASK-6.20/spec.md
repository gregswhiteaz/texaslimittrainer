# Spec: TASK-6.20 — Decide how hand replay reproduces bot actions that use session memory

Status: READY (approved 2026-11-26)
Task: TASK-6.20 · Parent/epic: TASK-6 · Requirements: REQ-028.2, REQ-029, REQ-025, REQ-052.2, REQ-013.3 · Dream: limit-holdem-trainer

## 1. Summary
REQ-028.2 promises that replaying a hand with its replay code and the user's actions reproduces every bot action.
That holds only while bot decisions depend on the current hand alone. If a bot read the earlier-showdowns list
(`PlayerView.earlierShowdowns`) or observed stats, one hand's record would not be enough to replay it. The user chose
option B (Q-1): bots decide from the current hand only. This task adds REQ-029.3, a doc comment on
`PlayerView.earlierShowdowns`, and a fast guard test. At finish the orchestrator records a Backlog decision and
archives TASK-6.23 as not needed.

## 2. Scope
- In scope (builder):
  - `requirements.md`: clause REQ-029.3 and change-log row 1.12.
  - Doc comment on `PlayerView.earlierShowdowns`.
  - Guard test `tests/bots/no-session-memory.acceptance.test.ts` (SPEC-03).
- In scope (orchestrator, Backlog CLI steps at finish, because builders don't edit Backlog):
  - One Backlog decision (`backlog decision create "<title>" -s accepted`) stating option B (SPEC-01).
  - A note on TASK-6.23 citing the decision id, then archive TASK-6.23 as not needed (SPEC-04).
- Not doing:
  - Building bot memory, adaptive bots, or anything that makes a bot read `earlierShowdowns` or observed stats.
  - Changing any stored hand-record format (options A and C were not chosen).
  - Changing any existing test.
  - Adding an in-app "replay a hand" feature. The requirements park it in the Waiting room
    (`dreams/limit-holdem-trainer/requirements.md:1333`).
  - Removing the TASK-6.19 earlier-showdowns plumbing from the playtest runner.
  - Any speed or scale check. If one were needed it would go in the opt-in slow group (`npm run test:slow`).
- Scope budget: files=3, lines=150   (builder files: requirements.md, player-view.ts, the new test. The Backlog
  decision and TASK-6.23 edits are made by the orchestrator via the CLI and do not count.)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The decision is recorded with `backlog decision create "<title stating the choice>" -s accepted`. The rationale goes in TASK-6.20's final summary and this spec, because the CLI has no body or description option (`backlog decision create --help` lists only `--status` and `--plain`) and CLAUDE.md forbids editing decision files by hand. | yes | It is the only CLI path. No decisions exist yet (`backlog decision list` → "No decisions found"), so there is no other convention to follow. | Edit the decision file by hand (forbidden by CLAUDE.md). |
| A-2 | The new requirements clause goes under REQ-029 (fixed styles) as REQ-029.3, with change-log row 1.12. REQ-025 and REQ-028 wording stays as is. | yes | REQ-025's "only … cards shown at earlier showdowns" (`requirements.md:473`) is an upper bound, not a promise that bots use them. REQ-029 already bans adaptation. The last change-log row is 1.11 (`requirements.md:1370`). | Reword REQ-025 or REQ-028.2. |
| A-3 | The option B guard test plays a 200-hand 6-max Mixed playtest. For every bot decision it compares the action with the real list against the action with a different list. When the real list is empty, the other list is a fixed non-empty one. | yes | It covers all four styles in well under the normal-suite budget. It checks correctness, so it belongs in the normal suite and not the slow group. | Hand-built views only, or a 1,000-hand run in the slow group. |

## 3. Current system
Facts for the decision, each from code opened for this spec:

- **What bots read across hands today: nothing.**
  - The view carries `earlierShowdowns` (`src/engine/player-view.ts:56-57`, filled at `:105`).
  - No file under `src/bots` or `src/advice` reads `view.earlierShowdowns`. A grep of `view.<field>` in both folders
    shows only actions, betCount, board, button, currentBet, holeCards, legalActions, players, pots, seat, stakes,
    street and toAct.
  - The only readers of the list are `src/engine/player-view.ts` and `src/playtest/runner.ts`.
- **Observed stats never reach bots.**
  - `adviceOptions` copies only `equity`, `chart` and `opponentRanges` (`src/advice/recommend.ts:32-39`), so
    `observedOpponents` is dropped.
  - Bots use `BOT_ADVICE = { opponentRanges: 'actions' }`, the typical-player basis (`src/bots/tag.ts:33-35`,
    REQ-029.2).
  - Observed stats feed only the user's advice (`userAdviceOptions`, `src/advice/recommend.ts:24-30`;
    `applyUserAction`, `src/table/session.ts:673-697`).
- **TASK-6.19's earlier-showdowns feature lives only in the playtest runner.**
  - `runPlaytest` keeps the last `EARLIER_SHOWDOWN_LIMIT` showdowns. It deep-freezes them with `rememberShowdown`
    and drops replaced seats with `forgetSeats` (`src/playtest/runner.ts:394-416`; helpers at
    `src/engine/player-view.ts:150-175`).
  - `playHand` passes the list to every view (`src/playtest/runner.ts:214,243`).
  - It is tested in `tests/playtest/earlier-showdowns.acceptance.test.ts`.
  - No bot uses the list, so it changes no decision. TASK-6.19's judge found playtest output byte-identical to main.
- **The live app passes bots no earlier showdowns.**
  - `botTurn` builds `playerView(hand, seat)` with the default `[]` (`src/table/session.ts:641-650`).
  - `useTableSession` sends that turn to the advice worker (`src/ui/table/useTableSession.ts:230-231`).
  - `stepBot` does the same (`src/table/session.ts:662-670`).
- **Hand replay today.**
  - Playtest record: `HandRecord` in `src/playtest/runner.ts:126-135` holds the replay code, stakes, seats, button,
    actions, game and size. It has no earlier showdowns.
  - Card-only replay: `replayHand` re-applies the recorded actions (`:424-438`).
  - Bot replay: `replayWithBots` re-plays with bots deciding again and passes no earlier showdowns, per TASK-6.15
    A-1 (`:444-462`, signature at `:447`).
  - CLI replay: `npm run playtest -- --replay-code …` calls `playHand(..., { game, stacks })` with no earlier
    showdowns (`src/playtest/cli.ts:435-441`).
  - The app has no replay feature. Its Hand Review only shows the hand number and replay code
    (`src/ui/table/ReviewPanel.tsx:43-44`, REQ-013.5). "Replay a hand with a different decision" is in the Waiting
    room (`requirements.md:1333`).
- **The app's stored hand record (REQ-052.2)** is `src/table/hand-record.ts:74-106`. It stores session id, hand
  number, seats with a per-session `botId` (`:32-41`), actions, board and `shown: EarlierShowdown | null` (`:104`).
  It has no earlier-showdowns list. Records are validated field by field on read (`:514-520` for `shown`).
  Session state (`src/table/session-record.ts:50-75`) has no list either.
- **Does REQ-028.2 hold today? Yes, in both places, because no bot reads anything outside the current hand.**
  - Playtest: `tests/playtest/bot-replay.acceptance.test.ts:46-55` replays every hand with `replayWithBots`, so the
    replay gets `[]` while the original had a non-empty list. It asserts identical actions and results over 250
    Mixed hands, or 1,000 with `TLH_SLOW_TESTS=1` (`:18`).
  - That test passes only because bots ignore the list. It would very likely fail on the first bot that reads it.
  - App: a replay would use the same code path as the playtest (`decideStyle`, `src/bots/decide.ts:10-15`). The view
    has `[]`, so the inputs match trivially.
- **Requirements context.**
  - REQ-029 Fixed styles: "regardless of how the user plays" (`requirements.md:533-541`).
  - The Waiting room lists "Adaptive bots that adjust to the user's play (Q-49)" (`requirements.md:1338`). A bot
    that profiled the user from shown hands would be the deferred adaptive bot.
- **Planned stories affected.** A search of `backlog/tasks` for earlier-showdown, session-memory, cross-hand and
  REQ-028 mentions found these:
  - TASK-6.23 (To Do, depends on this task): make the app pass earlier showdowns and replays reproduce them. It is
    the only open story that would wire session memory to bots.
  - TASK-6.14 (To Do, REQ-029.1): its AC#2 checks that a bot decision point gives the same action after 5,000 hands.
    It is consistent with every option.
  - Every other match is a Done story.
- Existing code to reuse:
  - `src/playtest/runner.ts` → `runPlaytest` with `seams.makePolicy` to see every bot view.
  - `src/playtest/policy.ts:44-55` → `seatStylesPolicyFactory`, the real per-seat bot decision.
  - `src/bots/decide.ts:10` → `decideStyle(view, style, random)`.
  - `src/engine/bot-random.ts:28,35` → `botDecisionSeed`, `botRandom` for a fresh generator per call.
  - `src/engine/player-view.ts` → `rememberShowdown` to build a frozen non-empty list.
- Tests run with Vitest. `npm test` runs everything. Files named `*.acceptance.test.ts` run in `npm run test:sweeps`
  and in `npm test` (`package.json` scripts).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Option B: bot decisions depend only on the current hand; earlier showdowns and anything else carried between hands never change a bot action (REQ-029.3). TASK-6.23 is archived as not needed. | A store session context in hand records; C relax REQ-028.2 | Matches the code today (§3), REQ-029 fixed styles and the deferred adaptive bots (Q-49); keeps REQ-028.2 true with no stored-format change. | yes | Approved by Q-1 (user, 2026-11-26) |

## 5. Design

### Files to create / modify
- `dreams/limit-holdem-trainer/requirements.md` — add REQ-029.3 and change-log row 1.12.
- `src/engine/player-view.ts` — doc comment on `earlierShowdowns`: bot decisions must not depend on it (REQ-029.3).
  The advice and grader may use it.
- `tests/bots/no-session-memory.acceptance.test.ts` — new guard test (SPEC-03).
- Not for the builder: `backlog/decisions/` (one decision) and TASK-6.23 (note + archive). The orchestrator makes
  both with the Backlog CLI at finish; nobody edits those files by hand.

### Chosen option and what it implies
- **B — bots decide from the current hand only** (approved by Q-1):
  - Decision record (orchestrator) and REQ-029.3 (builder).
  - The PlayerView doc comment and the guard test (SPEC-03) (builder).
  - TASK-6.23 gets a note and is archived as not needed (orchestrator; reversible with `backlog task restore`/edit).
    Its forgetSeats AC is moot because the app gives bots no list.
  - TASK-6.19's runner plumbing stays as harmless input for a future adaptive-bots story.
  - No stored-format change, and no change to any existing test.
- Not chosen: A (store earlier-showdowns context in each hand record, REQ-052.2 reworded) and C (relax REQ-028.2).

### Components, interfaces and data
- REQ-029.3 text: "A bot's decision depends only on the current hand: its view of this hand, the replay
  code and its seat. Earlier showdowns and anything else carried between hands never change a bot action."
- Guard test (SPEC-03):
  - Plays `runPlaytest({ hands: 200, seed: 20, size: 6, lineUp: 'Mixed' })` with
    `makePolicy = (code, seat) => view => …`.
  - That policy wraps `seatStylesPolicyFactory(seats)`. For each bot view it computes `real = policy(view)` and
    `other = policy({ ...view, earlierShowdowns: alt })`.
    - `alt` is `[]` when `view.earlierShowdowns` is non-empty.
    - Otherwise `alt` is a fixed frozen list from `rememberShowdown` holding a shown hand for every seat 1..6.
  - It records any mismatch, then returns `real`.
  - It asserts:
    - zero mismatches;
    - at least 1,000 bot decisions compared;
    - at least 200 of them with a non-empty real list;
    - all four styles decided at least once.

### Rules and algorithms
- Rule (REQ-029.3): for any bot view `v` and any two lists `L1` and `L2`, `decide({...v, earlierShowdowns: L1})`
  equals `decide({...v, earlierShowdowns: L2})`, with the same seat seed.

### Error handling and configuration
- N/A. No runtime code changes; only a doc comment in `src/engine/player-view.ts`.

## 6. Behaviour specification

### SPEC-01: The user's choice is recorded as a Backlog decision
- Verifies: AC#1
- Behaviour: Given the user chose option B (Q-1), When the orchestrator at finish runs `backlog decision create "Bot decisions use only the current hand (no cross-hand memory)" -s accepted --plain`, Then `backlog decision list --plain` lists exactly one decision with that title and status accepted, and TASK-6.20's final summary cites its id, Q-1 and the D-1 rationale (A-1). The builder does not run this.
- Verification: command `backlog decision list --plain`

### SPEC-02: requirements.md matches the decision
- Verifies: AC#1
- Behaviour: Given option B, When requirements.md is read, Then REQ-029 has clause REQ-029.3 with the §5 text, the change log has a 1.12 row "TASK-6.20: added REQ-029.3 (bot decisions use only the current hand)" approved by "User (TASK-6.20 Q-1)", and no other requirement text changes.
- Verification: command `git diff main -- dreams/limit-holdem-trainer/requirements.md`

### SPEC-03: Bot actions do not depend on earlier showdowns
- Verifies: AC#1
- Behaviour: Given a 200-hand 6-max Mixed playtest (seed 20), When each bot decision is also computed with a different earlier-showdowns list, Then the two actions are identical for every decision. At least 1,000 decisions are compared, at least 200 of them with a non-empty real list, and every style (TAG, Calling station, Maniac, Rock) appears.
- Verification: acceptance `tests/bots/no-session-memory.acceptance.test.ts::bot actions ignore earlier showdowns`

### SPEC-04: TASK-6.23 reflects the decision
- Verifies: AC#1
- Behaviour: Given the decision from SPEC-01, When the orchestrator at finish adds a note to TASK-6.23 citing the decision id and REQ-029.3 and then archives it (`backlog task archive TASK-6.23`), Then `backlog task view TASK-6.23 --plain` shows the note and the task no longer appears in `backlog task list --plain`. The builder does not run this.
- Verification: command `backlog task view TASK-6.23 --plain`

## 7. Edge cases
- First hand of a session (empty list): SPEC-03 swaps in a non-empty list, so an empty real list is tested too.
- Replaced bot seats: under B no bot reads the list, so forgetSeats attribution cannot change actions. TASK-6.19's
  tests keep covering the list itself.
- Sit-and-go and other table sizes: same decision code (`decideStyle`). Mixed 6-max covers every style. N/A beyond
  SPEC-03.
- Invalid input and concurrency: N/A. No new input path.

## 8. Security considerations
- No new trust boundary, input, dependency or randomness.
- REQ-029.3 narrows what bots may depend on, which strengthens REQ-025 fairness.

## 9. Non-functional
- SPEC-03 runs in the normal suite. It is a correctness check, not a speed or scale check. Target under 15 s
  locally, comparable to the 250-hand default of `bot-replay.acceptance.test.ts`.
- If a bigger run is ever wanted it goes in `test:slow`.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 1000 --seed 20 --size 6 --lineup mixed` (output unchanged from main)
- New tests:
  - `tests/bots/no-session-memory.acceptance.test.ts` → SPEC-03.
- End-to-end for the Judge:
  - Read the requirements diff (SPEC-02) and run the guard test (SPEC-03).
  - SPEC-01 and SPEC-04 are orchestrator steps at finish; check them after the orchestrator runs them.
  - Temporarily make one bot read `view.earlierShowdowns.length` (for example, TAG folds when it is odd) and confirm
    the guard test fails, then revert.

## 11. Open questions
None. Q-1 answered 2026-11-26: option B (see D-1).

## 12. Clarifications log
See `doit/TASK-6.20/qa.md`.
