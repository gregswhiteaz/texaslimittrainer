File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.31 - Give-postflop-golden-spots-chart-consistent-preflop-lines.md

Task TASK-7.31 - Give postflop golden spots chart-consistent preflop lines
==================================================

Status: ○ To Do
Priority: Medium
Ordinal: 232000
Created: 2026-11-24 06:32 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: doc-111

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 19 total):
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
Follow-up from TASK-7.14 (doc-111). Many postflop golden spots reach their decision through hero preflop actions the project's own chart grades as Major errors (e.g. UTG opening 92o, 82o, T4o, K3o, K2o; CO opening 72o, 83o; full-ring UTG 94o; BB only calling an SB raise with AA) — code review MINOR hero-preflop-lines-contradict-chart. A trainer's reference spots should not model bad preflop play. Also: 6max-turn-bb-raise-92o says 'set of kings' where it means kings full; and a gradeDecision RangeError escapes parsePostflopGoldenSpots instead of being reported as a problem (NIT grade-throw-escapes-validation).

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given every postflop golden spot, When its hero preflop actions are graded against the chart for that table size and position, Then none is a Major error (a test enforces this), with spot decisions and clear-cut margins re-validated after any line change
- [ ] #2 Given 6max-turn-bb-raise-92o, When its justification is read, Then it names the hand as kings full, not a set
- [ ] #3 Given a postflop spot whose advice makes gradeDecision throw, When parsePostflopGoldenSpots runs, Then the error is listed as a problem for that spot id rather than thrown

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

