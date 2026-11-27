File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.28 - Show-that-check-styles-bands-are-judged-over-100000-hands.md

Task TASK-6.28 - Show that --check-styles bands are judged over 100,000 hands
==================================================

Status: ○ To Do
Priority: Medium
Ordinal: 261000
Created: 2026-11-26 21:01 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-6 - Face distinct opponents

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 20 total):
└─ TASK-6.24 - Decide TAG aggression headroom against its 65% band ceiling [completed]
   └─ TASK-6.11 - Report each bot style's VPIP, PFR and aggression against its band [completed]
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

Description:
--------------------------------------------------
From TASK-6.24 (decision: option B, Q-1). REQ-027's fit criterion judges each bot style's VPIP, PFR and aggression over 100,000 hands, but --check-styles gives no hint of that, so 2,000-hand runs fail for sample-noise reasons that look like tuning problems (TASK-6.24 measured 20/20 all-TAG and 12/20 Mixed 2k runs failing, none from TAG aggression: rare mixed spots used only one way, Rock VPIP 7.7–7.9% vs floor 8%, TAG PFR 13.7–13.9% vs floor 14%, Rock aggression 56.1–56.2% vs ceiling 55%). Update the --check-styles help line (src/playtest/cli.ts USAGE), docs/stats/style-stats.md ('In the playtest CLI') and the USAGE assertions in tests/playtest/cli.test.ts. This story's spec decides whether to also print a note when --check-styles runs with fewer than 100,000 hands. No band, bot or advice changes. Any speed or scale check goes in npm run test:slow, never in npm test or CI.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a user reads npm run playtest -- --help, When they read the --check-styles line, Then it says the bands are judged over 100,000 hands and that shorter runs can fail from sample noise
- [ ] #2 Given a reader opens docs/stats/style-stats.md, When they read the playtest CLI section, Then it states the 100,000-hand run length REQ-027 uses and the sample-noise failures shorter runs can show (mixed spots used one way, stats near a band edge)
- [ ] #3 Given npm test runs, When the USAGE assertions in tests/playtest/cli.test.ts check the help text, Then they pass with the new --check-styles wording and no check of 100,000-hand scale is added to npm test or CI

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

