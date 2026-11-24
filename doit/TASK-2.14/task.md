File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-2.14 - Pause-the-session-from-the-Table-header-Home-control.md

Task TASK-2.14 - Pause the session from the Table header Home control
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 66000
Created: 2026-11-17 23:03 (UTC)
Updated: 2026-11-24 02:29 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-2 - Launch and set up a session
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2, doc-3

Dependency Graph:
--------------------------------------------------
Depends on (2 direct, 32 total):
├─ TASK-2.6 - Resume a paused session from Home [completed]
│  ├─ TASK-2.1 - Start a game from Home through Game Config [completed]
│  │  └─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
│  │     ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│  │     │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│  │     │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│  │     │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│  │     │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│  │     │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│  │     │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│  │     ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
│  │     │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
│  │     └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
│  │        ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
│  │        │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│  │        ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
│  │        │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│  │        └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
│  │           ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
│  │           │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
│  │           └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
│  └─ TASK-3.10 - Save the session after every hand so it can be resumed [completed]
│     └─ TASK-3.9 - Keep a permanent record of every completed hand [completed]
│        ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
│        │  ├─ TASK-1.8 - Check game invariants after every playtest action [completed]
│        │  │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
│        │  │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│        │  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
│        │     └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
│        │        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
│        ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
│        │  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
│        │     ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed] (shown above)
│        │     └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)
│        ├─ TASK-6.7 - Record an edited line-up as Custom [completed]
│        │  └─ TASK-6.6 - Seat bots by line-up preset with unique names [completed]
│        │     ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [completed]
│        │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
│        │     │     └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
│        │     │        └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed] (shown above)
│        │     ├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [completed]
│        │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
│        │     └─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [completed]
│        │        └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
│        ├─ TASK-6.8 - Replace a busted bot with a new bot from the line-up preset [completed]
│        │  └─ TASK-6.7 - Record an edited line-up as Custom [completed] (shown above)
│        └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
│           └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)
└─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed] (shown above)

Dependents (1 direct, 1 total):
└─ TASK-2 - Launch and set up a session [To Do]

Description:
--------------------------------------------------
As a learner, I want a Home control in the Table header that pauses my session, so that I can step away to Home without ending the session I want to continue.

Adds a Home control to the Table header built by E03-S03 (next to Settings and Leave table); E03 does not provide it. Choosing Home pauses the session and opens Home with Resume session (E02-S08). Between hands nothing is lost. Used mid-hand, the unfinished hand is abandoned exactly as when the app is closed (REQ-004.2, REQ-004.6): it is never written, not counted in any statistic, and resuming deals a new hand with stacks as they were before it began. Home never ends the session and never creates a Session Report.

## Requirements covered
- REQ-004 (Must): Pause, resume and end a session — When the user goes Home or closes the app during a session, TLH Trainer shall keep that session as a paused session that can be resumed at the start of the next hand; when the user chooses Leave table, it shall end the session and open the Session Report.

Covers: REQ-004

Plan key: E02-S15 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the Table between hands after hand 10, When the user chooses Home in the Table header, Then Home opens with Resume session showing 10 hands and the session is not ended [REQ-004.9]
- [ ] #2 Given the session was paused with the Home control after hand 10, When the user chooses Resume session, Then the Table deals hand 11 with every stack equal to its value at the end of hand 10 [REQ-004.9, REQ-004.2]
- [ ] #3 Given hand 11 is in progress after 10 completed hands, When the user chooses Home in the Table header, Then Home opens with Resume session showing 10 hands and no Session Report is created [REQ-004.9]
- [ ] #4 Given hand 11 was abandoned with the Home control, When the user resumes, Then a new hand 11 is dealt with every stack equal to its value at the end of hand 10 [REQ-004.9, REQ-004.2]
- [ ] #5 Given hand 11 was abandoned with the Home control, When stored hand records and the style stats computed from them are read, Then no record of the abandoned hand exists and the stats equal those of hands 1 to 10 [REQ-004.9, REQ-004.6]
- [ ] #6 Given the Home control on the Table header and paused sessions, When the user presses the browser Back or Forward button on Home, Game Config or the Table, Then the behaviour is decided, documented and covered by a test (e.g. history entries per screen, Back from the Table pauses to Home)
- [ ] #7 Given a stored session whose nextBotName is above MAX_SESSION_COUNT (1,000,000,000), When it is read for Resume, Then parseSessionRecord rejects it with RangeError 'Invalid session record: nextBotName' and Home stays usable (no mid-session crash on a later bot bust)

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
AC added from TASK-2.1 follow-up (doc-23).

AC added from TASK-2.6 follow-up (security MINOR next-bot-name-uncapped, doc-107).

