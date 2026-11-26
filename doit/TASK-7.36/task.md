File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.36 - Give-graded-postflop-examples-chart-consistent-preflop-lines.md

Task TASK-7.36 - Give graded postflop examples chart-consistent preflop lines
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 255000
Created: 2026-11-26 06:37 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: doc-154

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 20 total):
└─ TASK-7.31 - Give postflop golden spots chart-consistent preflop lines [completed]
   └─ TASK-7.14 - Check advice against postflop golden spots on every test run [completed]
      ├─ TASK-7.4 - Grade a decision as Correct, Minor error or Major error [completed]
      │  └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
      │     ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
      │     │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
      │     │     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
      │     │        └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
      │     └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
      │        └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
      │           └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
      │              ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
      │              └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
      │                 └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
      ├─ TASK-7.8 - Recommend betting or raising for value [completed]
      │  └─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed]
      │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)
      ├─ TASK-7.9 - Count implied odds for drawing hands [completed]
      │  └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)
      ├─ TASK-7.11 - Check advice against preflop golden spots on every test run [completed]
      │  ├─ TASK-7.6 - Recommend preflop actions at heads-up and full-ring tables [completed]
      │  │  └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
      │  └─ TASK-7.10 - Explain every recommendation in plain English with its numbers [completed]
      │     ├─ TASK-7.6 - Recommend preflop actions at heads-up and full-ring tables [completed] (shown above)
      │     ├─ TASK-7.8 - Recommend betting or raising for value [completed] (shown above)
      │     └─ TASK-7.9 - Count implied odds for drawing hands [completed] (shown above)
      └─ TASK-7.13 - Adjust opponent ranges to their observed play after 30 hands [completed]
         ├─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed] (shown above)
         └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
            └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-7.31 (doc-154, assumption A-1). TASK-7.31 made every postflop golden spot reach its decision through hero preflop actions the chart does not grade Major, but left tests/golden/graded-examples.json out of scope. Three graded examples still model a Major preflop error: graded-postflop-fold-minor-6max-flop-gutshot, graded-postflop-check-minor-6max-river-top-pair, graded-postflop-check-major-6max-turn-trips. Also remove the unreachable 'if (!result.ok) break;' in heroPreflopProblems (src/advice/golden.ts).

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given every postflop graded example, When its hero preflop actions are graded against the chart for its table size and position, Then none is a Major error and a test enforces this
- [ ] #2 Given a re-authored graded example, When the golden suite runs, Then its grade, rule id and margin are re-pinned like-for-like and logged in docs/advice/golden-spots.md

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

