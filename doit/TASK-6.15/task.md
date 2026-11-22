File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.15 - Replay-any-hand-with-every-bot-acting-exactly-as-before.md

Task TASK-6.15 - Replay any hand with every bot acting exactly as before
==================================================

Status: ◒ In Progress
Priority: High
Type: feature
Ordinal: 51000
Assignee: @claude
Created: 2026-11-17 23:03 (UTC)
Updated: 2026-11-22 19:31 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-6 - Face distinct opponents
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2, doc-3

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 17 total):
└─ TASK-6.6 - Seat bots by line-up preset with unique names [completed]
   ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [completed]
   │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
   │     └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
   │        └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
   │           ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
   │           │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │           │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │           │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │           │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │           │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │           │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │           │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │           ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
   │           │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │           └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
   │              ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
   │              │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
   │              └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
   ├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [completed]
   │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
   └─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [completed]
      └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)

Dependents (2 direct, 2 total):
├─ TASK-6 - Face distinct opponents [To Do]
└─ TASK-6.23 - Give bots the same earlier showdowns in the app and on replay [To Do]

Description:
--------------------------------------------------
As a learner, I want a replayed hand to reproduce every bot action exactly, so that I can revisit any hand and see the opponents play it the same way.

Replaying a hand with the same replay code and the same user actions reproduces every bot action, for every style, because each bot's randomness comes only from a generator seeded from the replay code and its seat (E06-S02). In the playtest seat 1 follows a scripted user policy and its recorded actions are fed back on replay.

## Requirements covered
- REQ-028 (Must): Reproducible mixed decisions — Where a bot's style gives more than one action a non-zero probability, the bot shall pick among them using a random generator derived from the hand's replay code, so that replaying a hand reproduces every bot decision.

Covers: REQ-028

Plan key: E06-S15 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given 1,000 recorded hands from a 6-max TAG playtest in which seat 1 follows a scripted user policy, When each hand is replayed with its replay code and seat 1's recorded actions, Then every bot action matches in order and amount [REQ-028.2]
- [ ] #2 Given 1,000 recorded hands from a 6-max Mixed playtest in which seat 1 follows a scripted user policy, When each hand is replayed with its replay code and seat 1's recorded actions, Then every bot action of every style matches in order and amount [REQ-028.2]
- [ ] #3 Given a recorded hand, When it is replayed with the same replay code but a different user action at the first decision, Then the replay still deals the same cards and every bot decision point reached identically before that action matches the original [REQ-028.1, REQ-028.2]

Definition of Done:
--------------------------------------------------
- [ ] #1 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [ ] #2 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [ ] #3 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [ ] #4 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [ ] #5 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [ ] #6 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [ ] #7 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [ ] #8 No new network requests beyond the app's own files [REQ-058.1]
- [ ] #9 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [ ] #10 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [ ] #11 Story documentation is written and published to Backlog.md
- [ ] #12 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled

Implementation Notes:
--------------------------------------------------
AC added from TASK-6.9 follow-up (app session and replay pass no earlier showdowns)

AC#4 (earlier showdowns on replay) moved to a follow-up task depending on spike TASK-6.20 (Q-1 auto-accepted: don't pre-empt the user's replay-context decision).

