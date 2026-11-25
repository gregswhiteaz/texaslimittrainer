File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-13.2 - Ask-the-browser-to-keep-my-history-on-first-launch.md

Task TASK-13.2 - Ask the browser to keep my history on first launch
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 86000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-17 23:22 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-13 - Rely on a private offline app
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 29 total):
└─ TASK-3.9 - Keep a permanent record of every completed hand [completed]
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
   ├─ TASK-6.7 - Record an edited line-up as Custom [completed]
   │  └─ TASK-6.6 - Seat bots by line-up preset with unique names [completed]
   │     ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [completed]
   │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
   │     │     └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
   │     │        └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed] (shown above)
   │     ├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [completed]
   │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
   │     └─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [completed]
   │        └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
   ├─ TASK-6.8 - Replace a busted bot with a new bot from the line-up preset [completed]
   │  └─ TASK-6.7 - Record an edited line-up as Custom [completed] (shown above)
   └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
      └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)

Dependents (1 direct, 1 total):
└─ TASK-13 - Rely on a private offline app [To Do]

Description:
--------------------------------------------------
As a learner, I want the app to request persistent storage when I first launch it, so that the browser does not silently clear my training history under storage pressure.

On first launch (no stored record of a previous request) the app calls navigator.storage.persist() once and stores the result (granted true/false) in the local app-meta store. If the API is missing or the call rejects, the result is stored as not granted. E12-S09 shows a Settings warning when the stored result is not granted. Stored in IndexedDB next to the stores created by E03-S09.

## Requirements covered
- REQ-052 (Must): Local persistence — TLH Trainer shall store settings, last configuration, sessions, hand records and session reports in the browser's IndexedDB, writing each hand record when its hand ends.

Covers: REQ-052

## Notes
Reset all data (E12) clears stores; on the next launch the request is made again because no record exists.

Plan key: E13-S01 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a fresh install in Chromium, When the app is launched, Then navigator.storage.persist is called exactly once and its result is stored as the persistent-storage flag [REQ-052.4]
- [ ] #2 Given a test browser in which navigator.storage.persist resolves false, When the app is launched the first time, Then the stored flag is not granted [REQ-052.4]
- [ ] #3 Given a test browser in which navigator.storage.persist is undefined or rejects, When the app is launched the first time, Then the stored flag is not granted and Home opens [REQ-052.4]
- [ ] #4 Given the flag was stored on first launch, When the app is closed and relaunched, Then navigator.storage.persist is not called again and the stored flag is unchanged [REQ-052.4]

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

