File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.14 - Apply-the-short-all-in-raise-rule.md

Task TASK-1.14 - Allow short all-in bets and raises under the half-bet reopening rule
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 28000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-17 23:22 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-1 - Prove the game headlessly
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (2 direct, 11 total):
├─ TASK-1.9 - Let a short-stacked player call all-in [completed]
│  └─ TASK-1.8 - Check game invariants after every playtest action [completed]
│     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
│     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│     │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│     │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│     │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│     │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│     │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│     │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
└─ TASK-1.12 - Cap each street at one bet plus three raises [completed]
   └─ TASK-1.11 - Play heads-up hands with heads-up blinds and order [completed]
      └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)

Dependents (3 direct, 20 total):
├─ TASK-1 - Prove the game headlessly [To Do]
├─ TASK-1.16 - Move the button and blinds past busted seats [To Do]
│  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  ├─ TASK-1.17 - Prove the engine with a 1,000,000-hand invariant run [To Do]
│  │  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  │  ├─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
│  │  │  └─ TASK-5 - Play a sit-and-go [To Do]
│  │  └─ TASK-6.9 - Prove the engine over 1,000,000 cash hands with every line-up preset [To Do]
│  │     ├─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
│  │     └─ TASK-6 - Face distinct opponents [To Do]
│  ├─ TASK-3.7 - Act correctly on capped streets and when short of chips [To Do]
│  │  └─ TASK-3 - Play hands at the table [To Do]
│  ├─ TASK-3.21 - Remove the temporary short-stack top-up once all-ins and rebuy exist [To Do]
│  └─ TASK-5.1 - Start a sit-and-go where every player has 1,500 chips [To Do]
│     ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do]
│     │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do]
│     │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│     │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do]
│     │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do]
│     │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  │  └─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do]
│     │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
│     ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│     └─ TASK-5.4 - Raise the sit-and-go limits every 10 hands on the published schedule [To Do]
│        ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│        ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do]
│        │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│        │  └─ TASK-5.6 - See the level on Home's Resume entry for a paused sit-and-go [To Do]
│        │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│        └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
└─ TASK-1.17 - Prove the engine with a 1,000,000-hand invariant run [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want to bet or raise all-in for less than a full bet under the casino half-bet rule, so that betting after an all-in follows the common casino rule.

A player whose stack exceeds the call amount but is smaller than a full bet or raise is offered a bet or raise all-in for their whole stack (REQ-017.7); a stack equal to or below the call amount gives only call (all-in) or fold. An all-in raise of less than half a full bet does not reopen betting for players who have already acted (they may only call or fold); an all-in raise of half a full bet or more counts as a full raise, including toward the cap (REQ-016.5). The engine marks these actions as all-in bet/raise with the to-amount; the button labels 'Bet all-in $X' / 'Raise all-in to $X' are rendered by the Table action bar story that owns REQ-017.7's UI.

## Requirements covered
- REQ-016 (Must): Fixed-limit betting and cap — The engine shall restrict every bet and raise to exactly one small bet on preflop and flop and exactly one big bet on turn and river, and shall cap each street at one bet plus three raises, including when heads-up.
- REQ-017 (Must): Legal actions only — The engine shall accept only legal actions for the player to act, and the Table screen shall offer the user only the legal actions with their exact amounts.

Covers: REQ-016, REQ-017

## Notes
Raise-to after a counted half-bet all-in: the next full raise is one full bet above the all-in amount.

Plan key: E01-S14 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the flop at $4/$8 where seat 2 bet $4 and seat 4 goes all-in for $5 total (a $1 raise), When action returns to seat 2, Then seat 2 may only call $1 or fold [REQ-016.5]
- [ ] #2 Given the flop at $4/$8 where seat 2 bet $4 and seat 4 goes all-in for $6 total (a $2 raise), When action returns to seat 2, Then seat 2 may call, fold or raise to $10 [REQ-016.5]
- [ ] #3 Given the flop at $4/$8 where seat 2 bets $4, seat 3 raises to $8, seat 4 goes all-in for $10 total (a $2 raise) and seat 5 raises to $14, When action reaches seat 6, Then seat 6 may only call $14 or fold because the fourth bet has been made [REQ-016.5]
- [ ] #4 Given the flop at $4/$8 where seat 2 bets $4 and seat 3 goes all-in for $5 total (a $1 raise), When seat 4, who has not yet acted on the street, is to act, Then seat 4 may fold, call $5 or raise to $8 [REQ-016.5]
- [ ] #5 Given the flop at $4/$8 with no bet facing and seat 4 holding $3, When the engine lists seat 4's legal actions, Then they are exactly check and bet all-in $3 [REQ-017.7]
- [ ] #6 Given the flop at $4/$8 where seat 2 bet $4 and seat 4 holds $6, When the engine lists seat 4's legal actions, Then they are exactly fold, call $4 and raise all-in to $6, and a raise to $8 is rejected as illegal [REQ-017.7]
- [ ] #7 Given the flop at $4/$8 where seat 2 bet $4 and seat 4 holds exactly $4, When the engine lists seat 4's legal actions, Then they are exactly fold and call $4 (all-in) with no raise [REQ-017.7]

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

