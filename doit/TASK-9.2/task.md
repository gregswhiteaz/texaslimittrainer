File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-9.2 - Continue-to-rebuy-or-leave-when-I-bust-with-the-review-open.md

Task TASK-9.2 - Continue to rebuy or leave when I bust with the review open
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 78000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-19 02:21 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-9 - Review the hand just played
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (2 direct, 33 total):
├─ TASK-3.11 - Rebuy or leave when my stack runs out [completed]
│  ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
│  │  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
│  │     ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
│  │     │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│  │     │  │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│  │     │  │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│  │     │  │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│  │     │  │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│  │     │  │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│  │     │  │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│  │     │  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
│  │     │  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
│  │     │  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
│  │     │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
│  │     │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│  │     │     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
│  │     │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│  │     │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
│  │     │        ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
│  │     │        │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
│  │     │        └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
│  │     └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)
│  └─ TASK-3.10 - Save the session after every hand so it can be resumed [completed]
│     └─ TASK-3.9 - Keep a permanent record of every completed hand [completed]
│        ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
│        │  ├─ TASK-1.8 - Check game invariants after every playtest action [completed]
│        │  │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
│        │  │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│        │  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
│        │     └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
│        │        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
│        ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed] (shown above)
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
└─ TASK-9.1 - Review each decision of the hand I just played [completed]
   ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed] (shown above)
   └─ TASK-7.4 - Grade a decision as Correct, Minor error or Major error [completed]
      └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)

Dependents (2 direct, 3 total):
├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do]
│  └─ TASK-5 - Play a sit-and-go [To Do]
└─ TASK-9 - Review the hand just played [To Do]

Description:
--------------------------------------------------
As a learner, I want the review's next-hand control to lead me to the rebuy choice when I have busted, so that I can finish reading the review before deciding to rebuy or leave.

Cash games only. When the user's stack is $0 at the end of a hand and the Hand Review panel is open, the Deal next hand control reads Continue, and Continue opens the Rebuy / Leave table dialog from E03-S08. No hand is dealt until the user chooses in that dialog. The sit-and-go equivalent (See results, REQ-008.9) is E05.

## Requirements covered
- REQ-007 (Must): Cash game buy-in and rebuy — In a cash game, every player shall start with a fixed buy-in of 20 big bets; when the user's stack reaches zero, TLH Trainer shall ask the user to Rebuy (another 20 big bets) or Leave table before the next hand.

Covers: REQ-007

## Notes
E05: in a sit-and-go the same control reads See results (REQ-008.9).

Plan key: E09-S06 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a $4/$8 cash hand ends with the user's stack at $0 and the panel open, When the panel is shown, Then its next-hand control reads "Continue" and no "Deal next hand" control is offered [REQ-007.6]
- [ ] #2 Given that panel, When the user selects Continue, Then the Rebuy / Leave table dialog opens and no next hand is dealt while it is open [REQ-007.6, REQ-007.2]
- [ ] #3 Given the dialog opened from Continue, When the user chooses Rebuy, Then the user's stack is $160 and the next hand is dealt [REQ-007.6]
- [ ] #4 Given a cash hand ends with the user's stack at $1 or more and the panel open, When the panel is shown, Then its next-hand control reads "Deal next hand" [REQ-007.6]
- [ ] #5 Given the Rebuy / Leave table dialog opened from Continue, When the user chooses Leave table, Then no further hand is dealt and the session is ended, the same outcome as Leave table in the E03-S08 bust dialog (E10-S01 opens the Session Report) [REQ-007.6]
- [ ] #6 Given the user's stack is $0 when a reviewed hand ends, When the panel is open, Then the table side shows Continue (to Rebuy/Leave) instead of Deal next hand, using the same held-review state

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
AC added from TASK-9.1 follow-up (doc-26).

