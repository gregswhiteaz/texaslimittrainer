File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.16 - Keep-TAG-and-Rock-bots-inside-their-style-bands.md

Task TASK-6.16 - Keep TAG and Rock bots inside their style bands
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 62000
Created: 2026-11-17 23:03 (UTC)
Updated: 2026-11-21 23:16 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-6 - Face distinct opponents
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2, doc-3

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 11 total):
└─ TASK-7.8 - Recommend betting or raising for value [completed]
   └─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed]
      └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
         ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
         │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
         │     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
         │        └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
         └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
            └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
               └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
                  ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
                  └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
                     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Dependents (1 direct, 1 total):
└─ TASK-6 - Face distinct opponents [To Do]

Description:
--------------------------------------------------
As a learner, I want the tight bot styles' measured play to fall inside their target bands, so that the tight opponents I practise against behave like real tight players.

Tune the TAG and Rock style data files (and only them) until the Mixed 6-max check-styles run (E06-S09) measures them inside their bands: TAG VPIP 18-26%, PFR 14-22%, aggression 45-65%; Rock VPIP 8-15%, PFR 6-12%, aggression 35-55% (aggression postflop only, REQ-027.6).

## Requirements covered
- REQ-027 (Must): Measurable style profiles — In headless 6-max playtests of 100,000 hands with the Mixed line-up, each bot style's measured statistics shall fall inside its target band.

Covers: REQ-027

Plan key: E06-S16 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles --seed 42`, When it completes, Then TAG's measured VPIP is 18-26%, PFR 14-22% and aggression 45-65% [REQ-027.1]
- [ ] #2 Given the same run, When it completes, Then the Rock's measured VPIP is 8-15%, PFR 6-12% and aggression 35-55% [REQ-027.4]
- [ ] #3 Given the same check-styles run with seeds 7 and 1234, When each completes, Then TAG and Rock are inside their bands for both seeds [REQ-027.5, REQ-027.1, REQ-027.4]
- [ ] #4 Given TAG's measured VPIP or PFR fall outside REQ-027.1 (VPIP 18-26%, PFR 14-22%), When the style-band check runs, Then the 6-max chart is retuned until both are inside the band
- [ ] #5 Given the TASK-7.19 re-raise widening (openers keep 80-90% vs a single 3-bet), When TAG's style band is measured, Then its aggression stays within 45-65% or the chart is retuned

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
AC added from TASK-7.2 follow-up (doc-14).

AC added from TASK-7.19 follow-up (doc-28).

Dependency on TASK-7.8 added from TASK-6.3: postflop advice never bets/raises until value betting (REQ-033.2) lands, so postflop aggression (REQ-027.6) is 0% for every bot until then.

