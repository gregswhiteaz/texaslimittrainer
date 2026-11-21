File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-2.3 - Choose-the-stake-for-a-cash-game.md

Task TASK-2.3 - Choose the stake for a cash game
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 48000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-17 23:22 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-2 - Launch and set up a session
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 14 total):
└─ TASK-2.1 - Start a game from Home through Game Config [completed]
   └─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
      ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
      │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
      │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
      │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
      │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
      │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
      │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
      ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
      │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
      └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
         ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
         │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
         ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
         │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
         └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
            ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
            │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
            └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)

Dependents (2 direct, 22 total):
├─ TASK-2 - Launch and set up a session [To Do]
└─ TASK-2.4 - Choose Cash game or Sit-and-go [To Do]
   ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
   ├─ TASK-2.10 - Pre-fill Game Config from my last session [To Do]
   │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
   │  ├─ TASK-12.4 - Delete all my data after confirming [To Do]
   │  │  └─ TASK-12 - Tune the trainer [To Do]
   │  └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do]
   │     ├─ TASK-13 - Rely on a private offline app [To Do]
   │     ├─ TASK-13.7 - Keep my old data intact when a migration fails [To Do]
   │     │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
   │     │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
   │     │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
   │     └─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do]
   │        ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
   │        └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
   ├─ TASK-5.1 - Start a sit-and-go where every player has 1,500 chips [To Do]
   │  ├─ TASK-5 - Play a sit-and-go [To Do]
   │  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do]
   │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
   │  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do]
   │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
   │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
   │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
   │  │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do]
   │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
   │  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do]
   │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
   │  │  │  └─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do]
   │  │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
   │  │  └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
   │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
   │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
   │  └─ TASK-5.4 - Raise the sit-and-go limits every 10 hands on the published schedule [To Do]
   │     ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
   │     ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do]
   │     │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
   │     │  └─ TASK-5.6 - See the level on Home's Resume entry for a paused sit-and-go [To Do]
   │     │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
   │     └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
   └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want to choose the stake for a cash game, so that I can practise at the limits I expect to play.

Cash games only. The stake list is exactly $2/$4, $3/$6, $4/$8, $6/$12, $10/$20, $20/$40, default $4/$8 on first use. Blinds: small blind = half the small bet rounded down to a whole dollar, big blind = the small bet ($2/$4 -> $1/$2; $3/$6 -> $1/$3; $4/$8 -> $2/$4; $6/$12 -> $3/$6; $10/$20 -> $5/$10; $20/$40 -> $10/$20). The buy-in is shown read-only as 20 x the big bet (E03 applies it, REQ-007.1). All money is play money: the stake selector and buy-in offer no deposit, payment or real-money conversion. The app-wide no-real-money check is E02-S14.

## Requirements covered
- REQ-006 (Must): Stakes and blinds — For cash games, the Game Config screen shall offer exactly the stakes $2/$4, $3/$6, $4/$8, $6/$12, $10/$20 and $20/$40, and the engine shall post blinds of half the small bet rounded down to a whole dollar (small blind) and the small bet (big blind).
- REQ-007 (Must): Cash game buy-in and rebuy — In a cash game, every player shall start with a fixed buy-in of 20 big bets; when the user's stack reaches zero, TLH Trainer shall ask the user to Rebuy (another 20 big bets) or Leave table before the next hand.

Covers: REQ-006, REQ-007

Plan key: E02-S03 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given Game Config with Cash game chosen, When the stake options are listed, Then they are exactly $2/$4, $3/$6, $4/$8, $6/$12, $10/$20 and $20/$40, and $4/$8 is selected on first use [REQ-006.1]
- [ ] #2 Given each of the six stakes, When the engine posts blinds, Then the small and big blinds are $1/$2, $1/$3, $2/$4, $3/$6, $5/$10 and $10/$20 respectively [REQ-006.2]
- [ ] #3 Given $10/$20 chosen, When the user starts the game, Then the header shows $10/$20, the first hand's blinds are $5 and $10 and every starting stack is $400 [REQ-006.1, REQ-006.2]
- [ ] #4 Given Game Config with $3/$6 chosen, When the buy-in is shown, Then it reads $120 and offers no control to change it [REQ-007.1]
- [ ] #5 Given Game Config with each of the six stakes selected, When its stake and buy-in text and controls are inspected, Then none offers a deposit, payment, purchase, cash-out or real-money conversion [REQ-006.3]

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

