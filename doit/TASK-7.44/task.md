File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.44 - Scale-observed-three-bet-and-four-bet-ranges-by-PFR-relative-to-a-typical-player.md

Task TASK-7.44 - Scale observed three-bet and four-bet ranges by PFR relative to a typical player
==================================================

Status: ○ To Do
Priority: Medium
Type: enhancement
Ordinal: 267000
Created: 2026-11-27 03:28 (UTC)
Updated: 2026-11-27 06:17 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: doit/TASK-7.29/spec.md, dreams/limit-holdem-trainer/requirements.md
Documentation: doc-104

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 14 total):
└─ TASK-7.43 - Resize the authored opponent range and rank hands by three-way equity when scaling observed opponents [completed]
   └─ TASK-7.29 - Decide the hand order and re-raise scaling for observed-opponent ranges [completed]
      └─ TASK-7.13 - Adjust opponent ranges to their observed play after 30 hands [completed]
         ├─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed]
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
         └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
            └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)

Dependents (1 direct, 1 total):
└─ TASK-7.45 - Decide position-aware scaling for observed open-raise and calling ranges [To Do]

Description:
--------------------------------------------------
Follow-up from TASK-7.29 (decision: Q-3 C). Today every three-bet and four-bet line scales toward raw PFR, so a 22/18 player's 6-max UTG four-bet range goes 2.56% to 18% at 100 hands and even a 12/9 player's goes to 9%. Apply REQ-035.6 as reworded by TASK-7.29: for three-bet and four-bet lines o = min(100, d x observed PFR / typical PFR), typical PFR = midpoint of the healthy PFR band in src/stats/healthy-ranges.json (heads-up 57.5, 6-max 18, full ring 12.5); open-raise keeps raw PFR and calling lines raw VPIP; blend formula and 30-hand threshold unchanged. No new stat, no persisted-format change; no locked test should need a re-pin (observed-ranges AC#2 covers only open-raise and call-raise). Expected values: doit/TASK-7.29/spec.md §5. Re-verify the 4 observed golden postflop spots.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a 6-max UTG four-bettor seen for 100 hands with PFR 18, When the range is estimated, Then its scaled width is 2.56% (the default), within 0.01
- [ ] #2 Given the same seat with PFR 45 or PFR 9 at 100 hands, When the range is estimated, Then the width is 6.41% or 1.28% respectively, within 0.01
- [ ] #3 Given heads-up and full-ring tables, When a three-bet or four-bet range is scaled, Then the typical PFR is 57.5 and 12.5 respectively, and o is capped at 100
- [ ] #4 Given open-raise and calling lines, When ranges are scaled, Then they are unchanged from FU-A (raw PFR and raw VPIP)
- [ ] #5 Given the 4 observed golden postflop spots, When npm test runs, Then each still agrees and is clear-cut, or each changed one is re-justified with the user's sign-off
- [ ] #6 Given docs/advice/range-model.md, When the story is done, Then its line-to-stat table and Known limits state the relative re-raise rule
- [ ] #7 Given a full-ring UTG four-bet line (default width 1.21%) and an opponent observed for 100 hands, When the observed PFR is 12.5 or 25, Then the scaled widths are 1.21% and 2.42%; and given any three-bet or four-bet line where default × PFR ÷ typical PFR exceeds 100, Then the scaled width is 100% (heads-up uses typical PFR 57.5 and is covered by one concrete width in the same test)
- [ ] #8 Given resizeRange in src/advice/ranges.ts, When its empty-default branch is either covered by a unit test or removed as unreachable, Then no untested branch remains; and the tautological 'expected contains default' check at tests/advice/observed-resize.acceptance.test.ts:143 is replaced by a check that can fail (owner TASK-7.43 unlock), with no assertion dropped

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
AC added from TASK-7.29 follow-up (review r1 MINOR: AC#3 had no observable widths)

AC added from TASK-7.43 follow-up (review r1 MINOR + NIT)

