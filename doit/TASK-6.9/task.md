File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.9 - Prove-the-engine-over-1000000-hands-with-every-line-up-preset.md

Task TASK-6.9 - Prove the engine over 1,000,000 cash hands with every line-up preset
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 55000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-18 19:40 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-6 - Face distinct opponents
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (2 direct, 29 total):
├─ TASK-1.17 - Prove the engine with a 1,000,000-hand invariant run [completed]
│  ├─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
│  │  └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
│  │     └─ TASK-1.8 - Check game invariants after every playtest action [completed]
│  │        ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
│  │        │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│  │        │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│  │        │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│  │        │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│  │        │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│  │        │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│  │        │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│  │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│  ├─ TASK-1.13 - Reject illegal actions without changing the game [completed]
│  │  └─ TASK-1.12 - Cap each street at one bet plus three raises [completed]
│  │     └─ TASK-1.11 - Play heads-up hands with heads-up blinds and order [completed]
│  │        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
│  ├─ TASK-1.14 - Allow short all-in bets and raises under the half-bet reopening rule [completed]
│  │  ├─ TASK-1.9 - Let a short-stacked player call all-in [completed] (shown above)
│  │  └─ TASK-1.12 - Cap each street at one bet plus three raises [completed] (shown above)
│  ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
│  │  ├─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
│  │  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed] (shown above)
│  └─ TASK-1.16 - Move the button and blinds past busted seats [completed]
│     ├─ TASK-1.9 - Let a short-stacked player call all-in [completed] (shown above)
│     ├─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed] (shown above)
│     ├─ TASK-1.11 - Play heads-up hands with heads-up blinds and order [completed] (shown above)
│     ├─ TASK-1.14 - Allow short all-in bets and raises under the half-bet reopening rule [completed] (shown above)
│     └─ TASK-1.15 - Show and muck cards at showdown in casino order [completed] (shown above)
└─ TASK-6.8 - Replace a busted bot with a new bot from the line-up preset [completed]
   └─ TASK-6.7 - Record an edited line-up as Custom [completed]
      └─ TASK-6.6 - Seat bots by line-up preset with unique names [completed]
         ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [completed]
         │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
         │     └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
         │        └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
         │           ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
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

Dependents (2 direct, 3 total):
├─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
│  └─ TASK-5 - Play a sit-and-go [To Do]
└─ TASK-6 - Face distinct opponents [To Do]

Description:
--------------------------------------------------
As a learner, I want the one-million-hand invariant run to play real style bots in every line-up preset, so that the rules never break against the opponents I actually face.

Extends E01-S17 (which covers table sizes 2-10 and both game types with random-move seats) so that the 1,000,000-hand run uses the style bots and covers the Mixed, Tough and Soft presets at every table size 2-10 in cash games. Sit-and-go line-up coverage needs the sit-and-go structure (E05, M3) and is added by E05. Re-verifies the playtest throughput with real bots (advice is computed for every bot decision): 100,000 6-max hands in at most 60 minutes on the reference machine (Apple-silicon Mac). At the permitted worst case one million hands take about 10 hours, over the 6-hour limit of a GitHub-hosted job, so the run uses the same sharding as E01-S17: parallel shards with deterministic per-shard seeds, combined into one report.

## Requirements covered
- REQ-056 (Must): Reliability and invariants — The engine shall complete 1,000,000 headless hands across all table sizes, game types and line-ups with zero invariant violations, and the app shall recover from an unexpected error without losing completed hands.
- REQ-062 (Must): Headless playtest CLI — The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.

Covers: REQ-056, REQ-062

## Notes
E05: add the sit-and-go line-up coverage to the 1,000,000-hand run (REQ-056.2) in M3. If sharding in CI proves impractical, run on the reference machine as E01-S17 allows.

Plan key: E06-S11 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the nightly or on-demand 1,000,000-hand cash run, When it completes, Then it has played Mixed, Tough and Soft line-ups at every table size from 2 to 10, prints the hand count per line-up and size, reports zero invariant violations and exits 0 [REQ-056.2]
- [ ] #2 Given the reference machine, When `npm run playtest -- --hands 100000 --size 6 --lineup mixed` runs, Then it completes in at most 60 minutes [REQ-062.5]
- [ ] #3 Given the CI nightly schedule or a manual dispatch, When the 1,000,000-hand line-up run executes as E01-S17's parallel shards with deterministic per-shard seeds, Then every shard finishes within the 6-hour GitHub job limit, re-running a shard with its seed gives byte-identical output, and the combined report covers all 1,000,000 hands [REQ-056.2, REQ-062.4]
- [ ] #4 Given E06 bots that use earlier showdowns, When the playtest runner plays a session, Then it passes each seat the earlier showdowns from previous hands instead of an empty list
- [ ] #5 Given bot style checks, When they run in the playtest, Then they are composed with checkStep through the onAction hook, not a new runner parameter
- [ ] #6 Given the 6-player playtest seats TAG bots that only check after the flop, When the invariant runs for this story execute, Then at least one 6-player line-up includes betting policies so postflop betting and the postflop cap are exercised

Definition of Done:
--------------------------------------------------
- [ ] #1 Timing of the 100,000-hand 6-max Mixed run with style bots is recorded in the story notes for the reference machine [REQ-062.5]
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
AC added from TASK-1.6 follow-up (doc-15).

AC added from TASK-1.8 follow-up (doc-16).

AC added from TASK-6.1 follow-up (doc-18).

