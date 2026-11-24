File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-9.5 - See-opponents-cards-in-the-review-only-when-they-were-shown-at-showdown.md

Task TASK-9.5 - See opponents' cards in the review only when they were shown at showdown
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 90000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-23 12:10 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-9 - Review the hand just played
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (2 direct, 21 total):
├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
│  ├─ TASK-1.8 - Check game invariants after every playtest action [completed]
│  │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
│  │  │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│  │  │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│  │  │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│  │  │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│  │  │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│  │  │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│  │  │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│  │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
│     └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
│        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
└─ TASK-9.1 - Review each decision of the hand I just played [completed]
   ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
   │  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
   │     ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
   │     │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │     │  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
   │     │  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
   │     │  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
   │     │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
   │     │     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
   │     │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │     │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
   │     │        ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
   │     │        │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
   │     │        └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
   │     └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)
   └─ TASK-7.4 - Grade a decision as Correct, Minor error or Major error [completed]
      └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)

Dependents (1 direct, 1 total):
└─ TASK-9 - Review the hand just played [To Do]

Description:
--------------------------------------------------
As a learner, I want the review to show an opponent's hole cards only if they were shown at showdown, so that the review is as fair as a real table and never reveals hidden information.

Opponent hole cards appear in the panel only when that opponent showed them at showdown (casino showdown order and muck rules: E01-S15). Folded hands and mucked hands are never revealed anywhere in the panel, including accessible names and image titles.

## Requirements covered
- REQ-043 (Must): Hand Review panel — When a hand ends in which the user made any decision other than folding preflop, the Table screen shall open the Hand Review panel beside the table, unless auto-open is turned off in Settings.

Covers: REQ-043

Plan key: E09-S04 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a showdown where Ben shows K♦ 7♣, When the panel opens, Then it shows Ben's K♦ 7♣ [REQ-043.6]
- [ ] #2 Given a showdown where Dee mucks her losing hand, When the panel's text, accessible names and image titles are searched, Then Dee's hole cards appear nowhere [REQ-043.6]
- [ ] #3 Given a hand that ends with every opponent folding, When the panel's text, accessible names and image titles are searched, Then no opponent's hole cards appear [REQ-043.6]
- [ ] #4 Given stored hand records include the replay code, When the review shows opponents' cards, Then it reads only the record's shown/showdown cards and never deals cards from the replay code for display

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
AC added from TASK-3.9 security review (replay code can rebuild mucked cards).

