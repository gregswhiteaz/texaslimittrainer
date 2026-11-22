File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.5 - Estimate-each-opponents-range-from-their-actions-in-the-hand.md

Task TASK-7.5 - Estimate each opponent's range from their actions in the hand
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 24000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-18 19:10 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 9 total):
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

Dependents (3 direct, 62 total):
├─ TASK-7 - Get trustworthy advice [To Do]
├─ TASK-7.8 - Recommend betting or raising for value [To Do]
│  ├─ TASK-6.16 - Keep TAG and Rock bots inside their style bands [To Do]
│  │  └─ TASK-6 - Face distinct opponents [To Do]
│  ├─ TASK-6.17 - Keep Calling station and Maniac bots inside their style bands [To Do]
│  │  ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  │  ├─ TASK-6.12 - Prove TAG beats tables of each weaker style [To Do]
│  │  │  └─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  │  └─ TASK-10.3 - See my five style stats against healthy ranges for my table size [To Do]
│  │     ├─ TASK-10 - Read the session report [To Do]
│  │     └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do]
│  │        ├─ TASK-11 - Track progress over time [To Do]
│  │        └─ TASK-11.10 - See my style stats separately for each table size I played [To Do]
│  │           ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │           └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do]
│  │              └─ TASK-11 - Track progress over time [To Do] (shown above)
│  ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  ├─ TASK-7.10 - Explain every recommendation in plain English with its numbers [To Do]
│  │  ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [To Do]
│  │  │  ├─ TASK-3 - Play hands at the table [To Do]
│  │  │  ├─ TASK-8.2 - Mark a decision as hinted when I open the hint [To Do]
│  │  │  │  └─ TASK-8 - Ask for a hint [To Do]
│  │  │  ├─ TASK-9.3 - See the numbers and reason behind each reviewed decision [To Do]
│  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do]
│  │  │  │  ├─ TASK-9 - Review the hand just played [To Do]
│  │  │  │  ├─ TASK-9.6 - See which reviewed decisions were hinted [To Do]
│  │  │  │  │  └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  ├─ TASK-9.8 - Get the review panel within one second of the hand ending [To Do]
│  │  │  │  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do]
│  │  │  │  │     └─ TASK-13 - Rely on a private offline app [To Do]
│  │  │  │  └─ TASK-9.9 - See approximate and short-stack labels in review entries [To Do]
│  │  │  │     └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  ├─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [To Do]
│  │  │  │  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do]
│  │  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do]
│  │  │  │  │  ├─ TASK-2.17 - See a first-use message on Home before any session has ended [To Do]
│  │  │  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-12.4 - Delete all my data after confirming [To Do]
│  │  │  │  │  │  │  └─ TASK-12 - Tune the trainer [To Do]
│  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
│  │  │  │  │  │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do]
│  │  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do]
│  │  │  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │     ├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do]
│  │  │  │     │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │     │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │     ├─ TASK-11.3 - See the G-2 target line on my Major-error trend [To Do]
│  │  │  │     │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │     │  └─ TASK-11.11 - See whether I met the G-2 goal after 5,000 hands [To Do]
│  │  │  │     │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │     │     └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │     ├─ TASK-11.4 - Filter my trends by table size and game type [To Do]
│  │  │  │     │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │     │  ├─ TASK-11.5 - Group my trends per session or per day [To Do]
│  │  │  │     │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │     │  │  ├─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do]
│  │  │  │     │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │     │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │     │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │     │  ├─ TASK-11.7 - Filter my trends by line-up [To Do]
│  │  │  │     │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │     │  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do] (shown above)
│  │  │  │     │  └─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do] (shown above)
│  │  │  │     ├─ TASK-11.5 - Group my trends per session or per day [To Do] (shown above)
│  │  │  │     └─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do]
│  │  │  │        └─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  ├─ TASK-10.5 - See my postflop leaks with evidence and a one-sentence fix [To Do]
│  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  ├─ TASK-10.6 - See my preflop leaks by position group [To Do]
│  │  │  │  │  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do]
│  │  │  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do]
│  │  │  │  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do]
│  │  │  │  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do] (shown above)
│  │  │  │  │  │  │  └─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do]
│  │  │  │  │  │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
│  │  │  │  │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  └─ TASK-10.8 - See my three most costly leaks first [To Do]
│  │  │  │     ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│  │  │  │     └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  ├─ TASK-10.7 - See how many of my decisions used a hint in the report [To Do]
│  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do] (shown above)
│  │  ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  │  ├─ TASK-7.11 - Check advice against preflop golden spots on every test run [To Do]
│  │  │  ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  │  │  └─ TASK-7.14 - Check advice against postflop golden spots on every test run [To Do]
│  │  │     └─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  │  ├─ TASK-7.15 - Prove advice is identical for identical decisions [To Do]
│  │  │  ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [To Do] (shown above)
│  │  │  └─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  │  └─ TASK-8.1 - Ask for a hint and see the recommended action with its numbers and reason [To Do]
│  │     ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │     ├─ TASK-8 - Ask for a hint [To Do] (shown above)
│  │     ├─ TASK-8.2 - Mark a decision as hinted when I open the hint [To Do] (shown above)
│  │     ├─ TASK-8.3 - Get the hint card within one second [To Do]
│  │     │  ├─ TASK-8 - Ask for a hint [To Do] (shown above)
│  │     │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│  │     ├─ TASK-8.4 - See approximate and short-stack labels on the hint card [To Do]
│  │     │  └─ TASK-8 - Ask for a hint [To Do] (shown above)
│  │     ├─ TASK-13.4 - Use every screen offline after the first visit [To Do]
│  │     │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │     │  ├─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do]
│  │     │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │     │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │     │  └─ TASK-13.9 - Reach Home within 3 seconds on a repeat launch [To Do]
│  │     │     ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │     │     └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│  │     └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  └─ TASK-7.14 - Check advice against postflop golden spots on every test run [To Do] (shown above)
└─ TASK-7.13 - Adjust opponent ranges to their observed play after 30 hands [To Do]
   ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
   ├─ TASK-7.14 - Check advice against postflop golden spots on every test run [To Do] (shown above)
   ├─ TASK-7.15 - Prove advice is identical for identical decisions [To Do] (shown above)
   └─ TASK-8.1 - Ask for a hint and see the recommended action with its numbers and reason [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want postflop advice that weighs my hand against what each opponent's actions suggest they hold, so that the advice reads opponents the way a real player would.

Range model: each opponent's range starts from authored default ranges per (reference size, position, preflop action sequence) and is narrowed by that opponent's later actions in the hand by the documented narrowing rule. Default ranges are data with a justification. Narrowing rule (range-model design document): on each postflop street every combo in the range is classified on the board at that street as Strong (two pair or better using at least one hole card), Pair (exactly one pair using at least one hole card, including a pocket pair), Draw (no pair, with four cards to a flush or an open-ended straight draw) or Air (anything else). When the opponent bets, keep Strong, Pair and Draw; checks, keep Pair, Draw and Air; calls a bet, keep Pair and Draw; raises, keep Strong and Draw. Narrowing applies street by street to the range left by the previous street. The model never reads a bot's style label or internal parameters: advice inputs are the PlayerView plus observed opponent statistics only. Replaces the 'every unseen combination' holdings used by E07-S03. The range that would call (value-bet rule) is E07-S10; observed-stat scaling is E07-S09. Worked fixture used by the ACs (also in the design document): range {KhKd, 8h7h, AhKh, 9h9d, 6h5h, Th9h, QhJh, Ac2c} on flop Ks 8d 7c classifies as Strong {KhKd, 8h7h}, Pair {AhKh, 9h9d}, Draw {6h5h, Th9h}, Air {QhJh, Ac2c}.

## Requirements covered
- REQ-035 (Must): Opponent range model — The advice engine shall estimate each opponent's range from that opponent's actions in the hand, starting from documented default ranges per action and adjusting toward the opponent's observed session statistics once 30 or more hands of that opponent have been observed.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-035, REQ-061

## Notes
Cards are written rank+suit (Kh = king of hearts). Classes and per-action keep-sets are REQ-035.5.

Plan key: E07-S07 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the default range data, When the range validator runs, Then every (reference size, position, preflop action sequence) has a range and a plain-English justification, and a missing range or justification fails validation [REQ-035.1]
- [ ] #2 Given a 6-max opponent in the CO who open-raised preflop and has not yet acted on the flop, When postflop advice is computed with fewer than 30 observed hands of that opponent, Then equity is computed against exactly the authored default range for (6-max, CO, open-raise) [REQ-035.1]
- [ ] #3 Given an opponent whose range is {KhKd, 8h7h, AhKh, 9h9d, 6h5h, Th9h, QhJh, Ac2c} on flop Ks 8d 7c, When the opponent bets the flop, Then the narrowed range is the 6 combos {KhKd, 8h7h, AhKh, 9h9d, 6h5h, Th9h} (Air removed) [REQ-035.1, REQ-035.5]
- [ ] #4 Given the same range and flop, When the opponent checks the flop, Then the narrowed range is the 6 combos {AhKh, 9h9d, 6h5h, Th9h, QhJh, Ac2c} (Strong removed) [REQ-035.1, REQ-035.5]
- [ ] #5 Given the same range and flop, When the opponent calls a flop bet, Then the narrowed range is the 4 combos {AhKh, 9h9d, 6h5h, Th9h}; and When the opponent instead raises a flop bet, Then it is the 4 combos {KhKd, 8h7h, 6h5h, Th9h} [REQ-035.1, REQ-035.5]
- [ ] #6 Given the same range, When the opponent checks the flop Ks 8d 7c and then calls a bet on the turn 2d, Then the narrowed range is the 5 combos {AhKh, 9h9d, 6h5h, Th9h, Ac2c} (Ac2c now a Pair, QhJh still Air) [REQ-035.1, REQ-035.5]
- [ ] #7 Given two opponents with identical positions, actions and observed statistics but different bot styles, When their ranges are estimated, Then the ranges are identical [REQ-035.3]
- [ ] #8 Given code that passes a bot's style label or style parameters into the advice engine, When `npm run typecheck` runs, Then it reports a type error [REQ-035.3]
- [ ] #9 Given action-based opponent ranges, When postflop advice is computed, Then it uses them in place of every-unseen-combo ranges (via the equity option or a range input) and the rules doc is updated

Definition of Done:
--------------------------------------------------
- [ ] #1 Default ranges and their justification text are original, written for this project [REQ-061.2]
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
AC added from TASK-7.3 follow-up (doc-17).

