File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-2.6 - Resume-a-paused-session-from-Home.md

Task TASK-2.6 - Resume a paused session from Home
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 65000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-23 13:44 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-2 - Launch and set up a session
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (2 direct, 31 total):
├─ TASK-2.1 - Start a game from Home through Game Config [completed]
│  └─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
│     ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│     │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│     │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│     │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│     │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│     │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│     │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│     ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
│     │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
│     └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
│        ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
│        │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│        ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
│        │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│        └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
│           ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
│           │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
│           └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
└─ TASK-3.10 - Save the session after every hand so it can be resumed [completed]
   └─ TASK-3.9 - Keep a permanent record of every completed hand [completed]
      ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
      │  ├─ TASK-1.8 - Check game invariants after every playtest action [completed]
      │  │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
      │  │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
      │  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
      │     └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
      │        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
      ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
      │  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
      │     ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed] (shown above)
      │     └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)
      ├─ TASK-6.7 - Record an edited line-up as Custom [completed]
      │  └─ TASK-6.6 - Seat bots by line-up preset with unique names [completed]
      │     ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [completed]
      │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
      │     │     └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
      │     │        └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed] (shown above)
      │     ├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [completed]
      │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
      │     └─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [completed]
      │        └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
      ├─ TASK-6.8 - Replace a busted bot with a new bot from the line-up preset [completed]
      │  └─ TASK-6.7 - Record an edited line-up as Custom [completed] (shown above)
      └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
         └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)

Dependents (6 direct, 9 total):
├─ TASK-2 - Launch and set up a session [To Do]
├─ TASK-2.7 - Confirm ending a paused session before starting a new game [To Do]
│  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
├─ TASK-2.14 - Pause the session from the Table header Home control [To Do]
│  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do]
│  ├─ TASK-5 - Play a sit-and-go [To Do]
│  └─ TASK-5.6 - See the level on Home's Resume entry for a paused sit-and-go [To Do]
│     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do]
│  ├─ TASK-13 - Rely on a private offline app [To Do]
│  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
│     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
└─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want to resume the session I left unfinished, so that short practice sittings add up without losing progress.

A session that has not been ended (via Leave table, E10) is the paused session; closing the app or reloading leaves it paused and does not end it (the Table-header Home control, REQ-004.9, is E02-S15). Session state is saved after every completed hand by E03-S11 and an unfinished hand is never written. Home shows Resume session only while a paused session exists, with its game type, table size, stake and hands played (e.g. "Cash · 6 players · $4/$8 · 132 hands"). Resume restores game type, table size, stake, line-up (name and seat styles), seats (bot ids and names), stacks, dealer button position, hand count and speed, and deals the next hand with stacks as they were before the abandoned hand began. SNG level restore (also REQ-004.3) is verified by E05-S03 once sit-and-go exists. The abandoned hand is not counted anywhere: hand count, hand records, stats.

## Requirements covered
- REQ-002 (Must): Home screen menu — The Home screen shall offer New game, Statistics and Settings, and shall offer Resume session only while a paused session exists.
- REQ-004 (Must): Pause, resume and end a session — When the user goes Home or closes the app during a session, TLH Trainer shall keep that session as a paused session that can be resumed at the start of the next hand; when the user chooses Leave table, it shall end the session and open the Session Report.

Covers: REQ-002, REQ-004

## Notes
E05: the SNG-level resume AC (E05-S03) should also tag REQ-004.3. Leaving the table with Leave table ends the session (E10), after which Resume must not show.

Plan key: E02-S08 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a paused 6-player $4/$8 cash session with 132 completed hands, When Home is shown, Then it shows Resume session with Cash, 6 players, $4/$8 and 132 hands [REQ-002.4]
- [ ] #2 Given storage with no session or only ended sessions, When Home is shown, Then Resume session is not shown [REQ-002.5]
- [ ] #3 Given 10 completed hands and the app closed in the middle of hand 11, When the app is relaunched and the user chooses Resume session, Then the Table deals a new hand numbered 11 with every stack equal to its value at the end of hand 10 [REQ-004.2]
- [ ] #4 Given a paused 9-player $10/$20 Custom session with button at seat 7 after hand 25, When it is resumed, Then the table shows the same game type, table size, stake, line-up name, bot names and styles in the same seats, stacks and hand count 25, and the next hand's button is the seat that follows seat 7 under the button rules [REQ-004.3]
- [ ] #5 Given the app was closed in the middle of hand 11, When stored hand records and the style stats computed from them are read after resuming, Then no record of the abandoned hand exists and the stats equal those of hands 1 to 10 [REQ-004.6]
- [ ] #6 Given a resumed session, When further hands complete, Then they are stored under the same session id with hand numbers continuing from 11 [REQ-004.2]
- [ ] #7 Given a stored session whose seats include an unknown seat kind, an unknown bot style or a missing bot name, When it is loaded to resume, Then it is rejected with a clear error (not passed to resolveLineUpName/lineUpSessionConfig or the table), and Home stays usable
- [ ] #8 Given a stored session whose handsPlayed or nextBotId is at or near Number.MAX_SAFE_INTEGER, When Resume restores it, Then it is rejected with a RangeError (cap below MAX_SAFE_INTEGER) rather than producing an unsafe hand number

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
AC added from TASK-6.7 security review MINOR (lineUpSessionConfig trusts seat kind/style)

AC added from TASK-3.10 judge J-1-02.

