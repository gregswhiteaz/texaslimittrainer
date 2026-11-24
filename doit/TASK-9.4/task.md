File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-9.4 - See-the-hand-number-my-cards-position-result-and-replay-code-in-the-review.md

Task TASK-9.4 - See the hand number, my cards, position, result and replay code in the review
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 89000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-19 02:21 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-9 - Review the hand just played
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (2 direct, 31 total):
├─ TASK-3.9 - Keep a permanent record of every completed hand [completed]
│  ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
│  │  ├─ TASK-1.8 - Check game invariants after every playtest action [completed]
│  │  │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
│  │  │  │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│  │  │  │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│  │  │  │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│  │  │  │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│  │  │  │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│  │  │  │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│  │  │  │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│  │  │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│  │  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
│  │     └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
│  │        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
│  ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
│  │  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
│  │     ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
│  │     │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│  │     │  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
│  │     │  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
│  │     │  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
│  │     │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
│  │     │     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
│  │     │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│  │     │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
│  │     │        ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
│  │     │        │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
│  │     │        └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
│  │     └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)
│  ├─ TASK-6.7 - Record an edited line-up as Custom [completed]
│  │  └─ TASK-6.6 - Seat bots by line-up preset with unique names [completed]
│  │     ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [completed]
│  │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
│  │     │     └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
│  │     │        └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed] (shown above)
│  │     ├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [completed]
│  │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
│  │     └─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [completed]
│  │        └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
│  ├─ TASK-6.8 - Replace a busted bot with a new bot from the line-up preset [completed]
│  │  └─ TASK-6.7 - Record an edited line-up as Custom [completed] (shown above)
│  └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
│     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)
└─ TASK-9.1 - Review each decision of the hand I just played [completed]
   ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed] (shown above)
   └─ TASK-7.4 - Grade a decision as Correct, Minor error or Major error [completed]
      └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)

Dependents (1 direct, 1 total):
└─ TASK-9 - Review the hand just played [To Do]

Description:
--------------------------------------------------
As a learner, I want the review header to summarise the hand with its replay code, so that I know which hand I am reviewing and can quote it in a bug report.

Per the Review storyboard the panel header reads e.g. "Hand #133 review" and "You lost $48 · A♥ 9♠ in the cutoff". It shows the hand number, the user's hole cards and position name, and the amount won or lost (net for the hand). The replay code (REQ-013, the hand's seed) is shown in small text in the panel; it was never shown before the hand ended (E03-S03).

## Requirements covered
- REQ-013 (Must): Deck, shuffle and replay code — For every hand, the engine shall shuffle a standard 52-card deck with a Fisher–Yates shuffle driven by a pseudo-random generator seeded from a cryptographically secure random source, and shall record that seed as the hand's replay code.
- REQ-043 (Must): Hand Review panel — When a hand ends in which the user made any decision other than folding preflop, the Table screen shall open the Hand Review panel beside the table, unless auto-open is turned off in Settings.

Covers: REQ-013, REQ-043

Plan key: E09-S03 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given hand 133 in which the user held A♥ 9♠ in the cutoff and lost $48, When the panel opens, Then the header shows "Hand #133", A♥ 9♠, the position "Cutoff" and "You lost $48" [REQ-043.3]
- [ ] #2 Given a hand in which the user put in $16 and won a $72 pot, When the panel opens, Then the header shows "You won $56" [REQ-043.3]
- [ ] #3 Given a completed hand, When the panel opens, Then it shows the hand number and the replay code equal to the hand record's replay code, in a smaller font size than the entry text [REQ-043.4, REQ-013.5]
- [ ] #4 Given the 'Hand #N review' heading from TASK-9.1, When the panel opens, Then a subtitle under it shows the user's hole cards, position and net result, and the hand's replay code is shown in the panel

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

