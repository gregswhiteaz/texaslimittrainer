File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-3.26 - Tidy-the-side-pot-hand-result-layout-and-pin-split-pot-rendering.md

Task TASK-3.26 - Tidy the side-pot hand result layout and pin split-pot rendering
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 212000
Created: 2026-11-21 19:29 (UTC)
Updated: 2026-11-21 20:08 (UTC)
Labels: follow-up, dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-3 - Play hands at the table
References: doc-69

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 19 total):
└─ TASK-3.8 - See each side pot and who wins it [completed]
   ├─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
   │  └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
   │     └─ TASK-1.8 - Check game invariants after every playtest action [completed]
   │        ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
   │        │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │        │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │        │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │        │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │        │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │        │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │        │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   └─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
      └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
         ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
         │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
         │  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
         │  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
         │  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
         │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
         │     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
         │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
         │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
         │        ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
         │        │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
         │        └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
         └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-3.8 judge (doc-69). J-1-01: with side pots the hand-over block has four columns, so 'Hand over' wraps and 'Ava shows · Pair of queens' is squeezed (no overflow, still readable). J-1-02: no render/browser test shows a split pot line; Table.tsx joins winner names itself instead of rendering PotResultView text, so a separator change goes unnoticed.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a side-pot hand result at 1280x720, When it is shown, Then 'Hand over' stays on one line and every Pot winners / Shown hands line is readable without being squeezed into a narrow column (screenshot-checked)
- [ ] #2 Given a split side pot, When the result renders, Then the Pot winners line reads exactly 'Side pot $81 · Ben wins $41, Ava wins $40' in a render test and in Chromium and WebKit, rendered from the view model's text
- [ ] #3 Given the Game Config game-type radios, When the selection changes, Then both options keep the same height (no 2px jump from the 2px vs 1px border)

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
AC added from TASK-2.4 judge J-1-02 (UI polish)

