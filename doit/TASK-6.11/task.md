File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.11 - Prove-each-bot-styles-VPIP-PFR-and-aggression-stay-in-band.md

Task TASK-6.11 - Report each bot style's VPIP, PFR and aggression against its band
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 61000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-23 11:08 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-6 - Face distinct opponents
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (2 direct, 18 total):
├─ TASK-6.6 - Seat bots by line-up preset with unique names [completed]
│  ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [completed]
│  │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
│  │     └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
│  │        └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
│  │           ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
│  │           │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│  │           │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│  │           │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│  │           │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│  │           │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│  │           │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│  │           │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│  │           ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
│  │           │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│  │           └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
│  │              ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
│  │              │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
│  │              └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
│  ├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [completed]
│  │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
│  └─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [completed]
│     └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
└─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
   └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)

Dependents (1 direct, 1 total):
└─ TASK-6 - Face distinct opponents [To Do]

Description:
--------------------------------------------------
As a learner, I want each bot style's measured play checked against its target band, so that the opponents I practise against stay recognisable as the strategy code changes.

Adds `--check-styles` to the playtest CLI (REQ-062.1). Over the run, each style's VPIP, PFR and aggression are computed with the shared style-stat functions (E07-S08); aggression uses the REQ-045.3 definition, flop, turn and river actions only. Bands (inclusive): TAG VPIP 18-26%, PFR 14-22%, aggression 45-65%; Calling station 45-65%, 3-10%, 10-25%; Maniac 50-75%, 35-60%, 65-85%; Rock 8-15%, 6-12%, 35-55%. This story builds the reporting and the pass/fail check; tuning the style files into the bands is E06-S16 (TAG, Rock) and E06-S17 (Calling station, Maniac). The run also reports action counts for each spot type a style marks as mixed (REQ-028.3).

## Requirements covered
- REQ-027 (Must): Measurable style profiles — In headless 6-max playtests of 100,000 hands with the Mixed line-up, each bot style's measured statistics shall fall inside its target band.
- REQ-028 (Must): Reproducible mixed decisions — Where a bot's style gives more than one action a non-zero probability, the bot shall pick among them using a random generator derived from the hand's replay code, so that replaying a hand reproduces every bot decision.
- REQ-062 (Must): Headless playtest CLI — The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.

Covers: REQ-027, REQ-028, REQ-062

Plan key: E06-S09 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given any playtest run, When it reports, Then it prints each style's VPIP, PFR and aggression to one decimal place, computed with the shared style-stat functions [REQ-062.3, REQ-027.5]
- [ ] #2 Given a test style file that moves one style's stat outside its band, When the playtest runs with `--check-styles`, Then it prints the style, stat, measured value and band and exits non-zero; a value exactly on a band edge passes [REQ-027.5, REQ-062.1]
- [ ] #3 Given a style whose actions in a run are 2 preflop raises, 3 postflop bets, 1 postflop raise and 4 postflop calls, When its aggression is reported, Then it is 50.0% because preflop actions are excluded [REQ-027.6]
- [ ] #4 Given a run with `--check-styles`, When it reports, Then it lists the action counts for every spot type each style marks as mixed and exits non-zero if any of those spot types used only one action [REQ-028.3]
- [ ] #5 Given a test style file whose measured stats are all inside its bands, When the playtest runs with `--check-styles`, Then it prints each stat with its band and exits 0 [REQ-027.5]
- [ ] #6 Given aggression is measured per style, When the report runs, Then it is measured after TASK-7.8 (postflop value betting) in mixed line-ups — a lone Maniac among TAGs reads 100% today because no bot bets postflop (TASK-6.4 finding)
- [ ] #7 Given the Rock seated with a Maniac at the table, When its VPIP and PFR are reported, Then they are re-measured against the 8–15% / 6–12% band (TASK-6.5 prototype: 9.9% / 8.3%, close to the floors)
- [ ] #8 Given `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles` with seeds 42, 7 and 1234, When it completes, Then TAG and Rock lines report inside their bands (TASK-6.16 tuned the Rock's postflop value bar to 75%)
- [ ] #9 Given `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles` with seeds 42, 7 and 1234, When it completes, Then all four styles (TAG, Rock, Calling station, Maniac) report inside their bands and the command exits 0 (TASK-6.17 tuning)
- [ ] #10 Given the 100k --check-styles run, When CI is set up, Then it runs in a nightly or on-demand workflow (deferred DoD#1 of TASK-6.17)
- [ ] #11 Given --check-styles, When it measures VPIP, PFR and aggression, Then it uses styleStats/styleCounts from src/stats/style-stats.ts (TASK-7.12), not a separate counter

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
AC added from TASK-6.4 follow-up

AC added from TASK-6.5 follow-up

From TASK-6.9: compose style-band checks with checkStep via composeChecks (src/playtest/runner.ts), not a new runner parameter.

AC added from TASK-6.16 Q-1 (CLI band check deferred here)

From TASK-6.16 judge: TAG aggression measured 64.1% on seed 555 (30k) vs 65 ceiling — watch the margin in the --check-styles re-check.

ACs added from TASK-6.17 Q-1/Q-2

AC added from TASK-7.12 follow-up.

