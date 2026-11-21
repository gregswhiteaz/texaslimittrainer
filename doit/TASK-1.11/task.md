File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.11 - Play-heads-up-hands-with-heads-up-blinds-and-order.md

Task TASK-1.11 - Play heads-up hands with heads-up blinds and order
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 25000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-18 17:24 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-1 - Prove the game headlessly
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 8 total):
└─ TASK-1.8 - Check game invariants after every playtest action [completed]
   ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
   │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Dependents (4 direct, 37 total):
├─ TASK-1 - Prove the game headlessly [To Do]
├─ TASK-1.12 - Cap each street at one bet plus three raises [To Do]
│  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  ├─ TASK-1.13 - Reject illegal actions without changing the game [To Do]
│  │  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  │  └─ TASK-1.17 - Prove the engine with a 1,000,000-hand invariant run [To Do]
│  │     ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  │     ├─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
│  │     │  └─ TASK-5 - Play a sit-and-go [To Do]
│  │     └─ TASK-6.9 - Prove the engine over 1,000,000 cash hands with every line-up preset [To Do]
│  │        ├─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
│  │        └─ TASK-6 - Face distinct opponents [To Do]
│  ├─ TASK-1.14 - Allow short all-in bets and raises under the half-bet reopening rule [To Do]
│  │  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  │  ├─ TASK-1.16 - Move the button and blinds past busted seats [To Do]
│  │  │  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  │  │  ├─ TASK-1.17 - Prove the engine with a 1,000,000-hand invariant run [To Do] (shown above)
│  │  │  ├─ TASK-3.7 - Act correctly on capped streets and when short of chips [To Do]
│  │  │  │  └─ TASK-3 - Play hands at the table [To Do]
│  │  │  ├─ TASK-3.21 - Remove the temporary short-stack top-up once all-ins and rebuy exist [To Do]
│  │  │  └─ TASK-5.1 - Start a sit-and-go where every player has 1,500 chips [To Do]
│  │  │     ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │     ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do]
│  │  │     │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │     │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do]
│  │  │     │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │     │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│  │  │     │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │     │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do]
│  │  │     │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │     │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do]
│  │  │     │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │     │  │  └─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do]
│  │  │     │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │     │  └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
│  │  │     ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │     └─ TASK-5.4 - Raise the sit-and-go limits every 10 hands on the published schedule [To Do]
│  │  │        ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │        ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do]
│  │  │        │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │        │  └─ TASK-5.6 - See the level on Home's Resume entry for a paused sit-and-go [To Do]
│  │  │        │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │        └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
│  │  └─ TASK-1.17 - Prove the engine with a 1,000,000-hand invariant run [To Do] (shown above)
│  └─ TASK-3.7 - Act correctly on capped streets and when short of chips [To Do] (shown above)
├─ TASK-1.16 - Move the button and blinds past busted seats [To Do] (shown above)
└─ TASK-2.2 - Choose how many players sit at the table [To Do]
   ├─ TASK-2 - Launch and set up a session [To Do]
   └─ TASK-2.5 - Choose a line-up preset for the bots [To Do]
      ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
      ├─ TASK-2.8 - Change the style of one bot seat [To Do]
      │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
      │  └─ TASK-2.10 - Pre-fill Game Config from my last session [To Do]
      │     ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
      │     ├─ TASK-12.4 - Delete all my data after confirming [To Do]
      │     │  └─ TASK-12 - Tune the trainer [To Do]
      │     └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do]
      │        ├─ TASK-13 - Rely on a private offline app [To Do]
      │        ├─ TASK-13.7 - Keep my old data intact when a migration fails [To Do]
      │        │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
      │        │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
      │        │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
      │        └─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do]
      │           ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
      │           └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
      ├─ TASK-2.9 - Randomise the bot line-up [To Do]
      │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
      └─ TASK-2.13 - Sit at a random seat with a random starting button [To Do]
         └─ TASK-2 - Launch and set up a session [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want two-player hands to follow heads-up casino rules, so that heads-up practice matches real casino rules.

While exactly two players are dealt in: the button posts the small blind and the other player the big blind; the button acts first preflop and last on flop, turn and river.

## Requirements covered
- REQ-015 (Must): Heads-up blinds and order — While exactly two players are dealt in, the engine shall make the button post the small blind and act first preflop and last on the flop, turn and river.
- REQ-062 (Must): Headless playtest CLI — The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.

Covers: REQ-015, REQ-062

Plan key: E01-S09 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a heads-up $4/$8 hand, When blinds are posted, Then the button posts the $2 small blind and the other player posts the $4 big blind [REQ-015.1]
- [ ] #2 Given a heads-up hand, When preflop betting begins, Then the button acts first [REQ-015.2]
- [ ] #3 Given a heads-up hand, When betting begins on the flop, turn and river, Then the non-button player acts first on each street [REQ-015.3]
- [ ] #4 Given `npm run playtest -- --hands 10000 --size 2 --seed 42`, When it runs, Then every hand is heads-up and the run reports zero invariant violations [REQ-062.1, REQ-015.1]
- [ ] #5 Given npm run playtest -- --size 2, When it runs, Then it plays heads-up hands with heads-up blinds and order and reports 0 violations

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

Implementation Notes:
--------------------------------------------------
AC added from TASK-1.6 follow-up (doc-15): --size is limited to 3..10 until heads-up exists.

