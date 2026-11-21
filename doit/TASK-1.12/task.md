File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.12 - Cap-each-street-at-one-bet-plus-three-raises.md

Task TASK-1.12 - Cap each street at one bet plus three raises
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 26000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-18 18:15 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-1 - Prove the game headlessly
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 9 total):
└─ TASK-1.11 - Play heads-up hands with heads-up blinds and order [completed]
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

Dependents (4 direct, 22 total):
├─ TASK-1 - Prove the game headlessly [To Do]
├─ TASK-1.13 - Reject illegal actions without changing the game [To Do]
│  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  └─ TASK-1.17 - Prove the engine with a 1,000,000-hand invariant run [To Do]
│     ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│     ├─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
│     │  └─ TASK-5 - Play a sit-and-go [To Do]
│     └─ TASK-6.9 - Prove the engine over 1,000,000 cash hands with every line-up preset [To Do]
│        ├─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
│        └─ TASK-6 - Face distinct opponents [To Do]
├─ TASK-1.14 - Allow short all-in bets and raises under the half-bet reopening rule [To Do]
│  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  ├─ TASK-1.16 - Move the button and blinds past busted seats [To Do]
│  │  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  │  ├─ TASK-1.17 - Prove the engine with a 1,000,000-hand invariant run [To Do] (shown above)
│  │  ├─ TASK-3.7 - Act correctly on capped streets and when short of chips [To Do]
│  │  │  └─ TASK-3 - Play hands at the table [To Do]
│  │  ├─ TASK-3.21 - Remove the temporary short-stack top-up once all-ins and rebuy exist [To Do]
│  │  └─ TASK-5.1 - Start a sit-and-go where every player has 1,500 chips [To Do]
│  │     ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │     ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do]
│  │     │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │     │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do]
│  │     │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │     │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│  │     │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │     │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do]
│  │     │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │     │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do]
│  │     │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │     │  │  └─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do]
│  │     │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │     │  └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
│  │     ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │     └─ TASK-5.4 - Raise the sit-and-go limits every 10 hands on the published schedule [To Do]
│  │        ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │        ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do]
│  │        │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │        │  └─ TASK-5.6 - See the level on Home's Resume entry for a paused sit-and-go [To Do]
│  │        │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │        └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
│  └─ TASK-1.17 - Prove the engine with a 1,000,000-hand invariant run [To Do] (shown above)
└─ TASK-3.7 - Act correctly on capped streets and when short of chips [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want every street capped at one bet plus three raises, so that betting follows the casino fixed-limit cap.

Cap = 4 bets per street (bet + 3 raises) with any number of players, including heads-up. Preflop the big blind counts as the first bet, so at most three raises follow it. After the fourth bet the only legal actions are call and fold. Once this story is done the playtest seat policy drops its interim 'never make a fifth bet' restriction and relies on the engine's legal set.

## Requirements covered
- REQ-016 (Must): Fixed-limit betting and cap — The engine shall restrict every bet and raise to exactly one small bet on preflop and flop and exactly one big bet on turn and river, and shall cap each street at one bet plus three raises, including when heads-up.

Covers: REQ-016

Plan key: E01-S10 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given preflop at $4/$8 with the $4 big blind posted, When three raises have been made (to $16), Then the next players may only call or fold [REQ-016.2, REQ-016.3]
- [ ] #2 Given the flop, turn or river, When a bet and three raises have been made, Then the only legal actions for the remaining players are call and fold [REQ-016.3]
- [ ] #3 Given a heads-up $4/$8 hand where the button posted the $2 small blind and the other player the $4 big blind, When the button raises to $8, the big blind re-raises to $12 and the button raises to $16, Then the big blind's only legal actions are call $4 and fold; Given a heads-up flop where a bet and three raises have been made, Then the only legal actions are call and fold [REQ-016.4]
- [ ] #4 Given 100,000 random seeded hands with 2 to 10 players, When each is played, Then no street has more than 4 bets [REQ-016.4]
- [ ] #5 Given a street with 4 bets, When legalActions and recommendPreflop are both consulted, Then neither offers a raise, and the advice's betCount>=4 rule agrees with the engine cap
- [ ] #6 Given the engine caps a street at 4 bets, When a fifth raise is attempted, Then a unit test shows it is not legal, the invariant checker's bet-cap check stays independent of the engine cap, and the playtest policy's betCount filter is removed

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
AC added from TASK-7.2 follow-up (doc-14).

AC added from TASK-1.8 follow-up (doc-16).

