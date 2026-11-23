File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.17 - Keep-Calling-station-and-Maniac-bots-inside-their-style-bands.md

Task TASK-6.17 - Keep Calling station and Maniac bots inside their style bands
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 63000
Created: 2026-11-17 23:03 (UTC)
Updated: 2026-11-23 05:24 (UTC)
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

Dependents (3 direct, 8 total):
├─ TASK-6 - Face distinct opponents [To Do]
├─ TASK-6.12 - Prove TAG beats tables of each weaker style [To Do]
│  └─ TASK-6 - Face distinct opponents [To Do] (shown above)
└─ TASK-10.3 - See my five style stats against healthy ranges for my table size [To Do]
   ├─ TASK-10 - Read the session report [To Do]
   └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do]
      ├─ TASK-11 - Track progress over time [To Do]
      └─ TASK-11.10 - See my style stats separately for each table size I played [To Do]
         ├─ TASK-11 - Track progress over time [To Do] (shown above)
         └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do]
            └─ TASK-11 - Track progress over time [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want the loose bot styles' measured play to fall inside their target bands, so that the loose opponents I practise against behave like real loose players.

Tune the Calling station and Maniac style data files until the Mixed 6-max check-styles run measures them inside their bands: Calling station VPIP 45-65%, PFR 3-10%, aggression 10-25%; Maniac VPIP 50-75%, PFR 35-60%, aggression 65-85%. This story is the final gate: with TAG and Rock already tuned (E06-S16), the full fit command passes for all four styles.

## Requirements covered
- REQ-027 (Must): Measurable style profiles — In headless 6-max playtests of 100,000 hands with the Mixed line-up, each bot style's measured statistics shall fall inside its target band.

Covers: REQ-027

Plan key: E06-S17 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles --seed 42`, When it completes, Then the Calling station's measured VPIP is 45-65%, PFR 3-10% and aggression 10-25% [REQ-027.2]
- [ ] #2 Given the same run, When it completes, Then the Maniac's measured VPIP is 50-75%, PFR 35-60% and aggression 65-85% [REQ-027.3]
- [ ] #3 Given the same check-styles run with seeds 7 and 1234, When each completes, Then the Calling station and Maniac are inside their bands for both seeds [REQ-027.5, REQ-027.2, REQ-027.3]
- [ ] #4 Given the same run, When it completes, Then all four styles are inside their bands and the command exits 0 [REQ-027.5, REQ-027.1, REQ-027.4]

Definition of Done:
--------------------------------------------------
- [ ] #1 The 100,000-hand Mixed check-styles run is added to the nightly / on-demand CI job [REQ-027.5]
- [ ] #2 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [ ] #3 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [ ] #4 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [ ] #5 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [ ] #6 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [ ] #7 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [ ] #8 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [ ] #9 No new network requests beyond the app's own files [REQ-058.1]
- [ ] #10 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [ ] #11 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [ ] #12 Story documentation is written and published to Backlog.md
- [ ] #13 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled

Implementation Notes:
--------------------------------------------------
Dependency on TASK-7.8 added from TASK-6.3: postflop advice never bets/raises until value betting (REQ-033.2) lands, so postflop aggression (REQ-027.6) is 0% for every bot until then.

From TASK-6.16 measurements (100k Mixed, seeds 42/7/1234): Calling station aggression 51–53% vs 10–25% band; Maniac 84.1–84.9% vs 85 ceiling. Mixed line-up drifts to TAG over long runs (replacements) — CS got only 3–9k hands; size samples accordingly.

