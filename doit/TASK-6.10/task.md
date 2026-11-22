File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.10 - Report-each-bots-BB-100-with-a-95-confidence-interval.md

Task TASK-6.10 - Report each bot's BB/100 with a 95% confidence interval
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 58000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-17 23:22 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-6 - Face distinct opponents
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 19 total):
└─ TASK-6.8 - Replace a busted bot with a new bot from the line-up preset [completed]
   └─ TASK-6.7 - Record an edited line-up as Custom [completed]
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
└─ TASK-6.12 - Prove TAG beats tables of each weaker style [To Do]
   └─ TASK-6 - Face distinct opponents [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want each bot's win rate reported in BB/100 with its 95% confidence interval, so that claims that a bot is beatable or strong rest on real results, not a lucky run.

BB/100 = big bets won per 100 hands (big bet = 2 x small bet, $8 at $4/$8). 95% confidence interval = mean per-hand result +/- 1.96 x standard error, scaled to BB/100. Each bot is reported separately with its name, style and hands played; a bot that busted and its replacement (E06-S08) are separate bots.

## Requirements covered
- REQ-030 (Should): TAG bot strength — In headless playtests of 100,000 hands, a TAG bot seated with five bots of any single weaker style shall win at a positive rate.
- REQ-062 (Must): Headless playtest CLI — The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.

Covers: REQ-030, REQ-062

Plan key: E06-S10 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given any playtest run, When it reports, Then it prints for each bot its name, style, hands played, BB/100 and the lower and upper bounds of its 95% confidence interval [REQ-062.3, REQ-030.4]
- [ ] #2 Given a bot that won $80 over 100 hands at $4/$8, When its win rate is computed, Then it is 10.00 BB/100 [REQ-062.3]
- [ ] #3 Given a fixed list of per-hand results, When the 95% confidence interval is computed, Then its bounds equal mean +/- 1.96 x sample standard deviation / sqrt(n), in BB/100, to 0.01 [REQ-030.4]
- [ ] #4 Given a seat whose bot busted and was replaced during the run, When the report is printed, Then the departed bot and its replacement appear as separate rows with their own hands played [REQ-062.3]

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

