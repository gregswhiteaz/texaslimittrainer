File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-10.3 - See-my-five-style-stats-against-healthy-ranges-for-my-table-size.md

Task TASK-10.3 - See my five style stats against healthy ranges for my table size
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 69000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-17 23:22 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-10 - Read the session report
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (3 direct, 35 total):
├─ TASK-6.17 - Keep Calling station and Maniac bots inside their style bands [completed]
│  └─ TASK-7.8 - Recommend betting or raising for value [completed]
│     └─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed]
│        └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
│           ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
│           │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│           │     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│           │        └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│           └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
│              └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│                 └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│                    ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
│                    └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│                       └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
├─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
│  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)
└─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [completed]
   ├─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
   │  ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
   │  │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │  │  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
   │  │  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
   │  │  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
   │  │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
   │  │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │  │     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
   │  │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)
   │  └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)
   ├─ TASK-3.9 - Keep a permanent record of every completed hand [completed]
   │  ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
   │  │  ├─ TASK-1.8 - Check game invariants after every playtest action [completed]
   │  │  │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
   │  │  │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │  │  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
   │  │     └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
   │  │        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
   │  ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
   │  │  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed] (shown above)
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
   │  └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed] (shown above)
   ├─ TASK-3.10 - Save the session after every hand so it can be resumed [completed]
   │  └─ TASK-3.9 - Keep a permanent record of every completed hand [completed] (shown above)
   └─ TASK-3.11 - Rebuy or leave when my stack runs out [completed]
      ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed] (shown above)
      └─ TASK-3.10 - Save the session after every hand so it can be resumed [completed] (shown above)

Dependents (2 direct, 5 total):
├─ TASK-10 - Read the session report [To Do]
└─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do]
   ├─ TASK-11 - Track progress over time [To Do]
   └─ TASK-11.10 - See my style stats separately for each table size I played [To Do]
      ├─ TASK-11 - Track progress over time [To Do] (shown above)
      └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do]
         └─ TASK-11 - Track progress over time [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want to see my five style stats against healthy ranges, so that I know which parts of my play style to fix (G-4).

Strategy content plus report section "Your style vs healthy range (<reference size>)". Author healthy ranges (low-high %) for VPIP, PFR, Aggression, WTSD and W$SD at heads-up, 6-max and full ring (15 ranges) as a data file loaded by the app, each with a one-sentence justification in original plain English. Stats are computed over the session's hands with the E07-S08 functions (Aggression is postflop-only per REQ-045.3; a zero denominator shows "—"). Each stat row shows the user's value, the range for the session's reference size and a label: "in range" when low <= value <= high (both limits inclusive, REQ-044.11), "too high" above, "too low" below. Table sizes map to reference sizes per REQ-005.4 (2 -> heads-up; 3-7 -> 6-max; 8-10 -> full ring); for 3, 4, 5, 7 and 8 the mapped ranges are used and the section is marked approximate. The ranges must agree with the bot style bands: the TAG bot's harness stats fall inside the 6-max ranges. A stat shown as "—" carries the label "not enough data" instead of a range label.

## Requirements covered
- REQ-044 (Must): Session Report content — When a session ends, TLH Trainer shall show and save a Session Report with the result, volume, error rates, hint usage, the five tracked style stats against their healthy ranges, and the top leaks.
- REQ-045 (Must): Style stat definitions — The app shall compute the five tracked style stats with these formulas over the hands in scope.
- REQ-046 (Must): Healthy ranges — The app shall load authored healthy ranges for each of the five style stats for each reference size, each with a written justification.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-044, REQ-045, REQ-046, REQ-061

Plan key: E10-S04 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the healthy-range data file, When it is validated, Then it holds exactly 15 ranges (VPIP, PFR, Aggression, WTSD, W$SD at heads-up, 6-max and full ring), each with low < high and a non-empty justification sentence [REQ-046.1, REQ-046.2]
- [ ] #2 Given a 100,000-hand 6-max playtest of TAG bots, When its VPIP, PFR, Aggression and W$SD are computed, Then each falls inside the authored 6-max healthy range; WTSD is authored as a realistic healthy range and is checked against the bots by TASK-7.32, which investigates why advised play almost never folds after the flop [REQ-046.1]
- [ ] #3 Given a 6-max session of 100 hands whose stored hand records hold 25 hands with a voluntary preflop call or raise, 18 with a preflop raise, 11 postflop bets or raises and 9 postflop calls, 20 flops seen, 6 showdowns and 3 showdowns won, When its report is shown, Then the rows show VPIP 25.0%, PFR 18.0%, Aggression 55.0%, WTSD 30.0% and W$SD 50.0%, each next to the authored 6-max range for that stat [REQ-044.4]
- [ ] #4 Given a healthy-range fixture whose 6-max VPIP range is 20-28, When sessions with VPIP 28.0, 20.0, 28.1 and 19.9 are reported, Then the VPIP label is "in range", "in range", "too high" and "too low" respectively [REQ-044.4, REQ-044.11]
- [ ] #5 Given a 2-player session and a 10-player session, When their reports are shown, Then they use the heads-up and full-ring ranges respectively and are not marked approximate [REQ-044.4, REQ-046.1]
- [ ] #6 Given a session at 4 players and a session at 8 players, When their reports are shown, Then they use the 6-max and full-ring ranges respectively and the style section is marked approximate and names that reference size [REQ-046.3]
- [ ] #7 Given a session in which the user never saw the flop, When its report is shown, Then WTSD and W$SD show "—" with the label "not enough data" and no range label [REQ-045.6, REQ-044.10]

Definition of Done:
--------------------------------------------------
- [ ] #1 Every healthy range carries its written justification and the text is original [REQ-046.2, REQ-061.2]
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

