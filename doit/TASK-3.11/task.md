File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-3.11 - Rebuy-or-leave-when-my-stack-runs-out.md

Task TASK-3.11 - Rebuy or leave when my stack runs out
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 67000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-19 01:10 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-3 - Play hands at the table
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (2 direct, 30 total):
├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
│  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
│     ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
│     │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│     │  │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│     │  │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│     │  │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│     │  │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│     │  │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│     │  │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│     │  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
│     │  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
│     │  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
│     │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
│     │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│     │     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
│     │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│     │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
│     │        ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
│     │        │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
│     │        └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
│     └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)
└─ TASK-3.10 - Save the session after every hand so it can be resumed [completed]
   └─ TASK-3.9 - Keep a permanent record of every completed hand [completed]
      ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
      │  ├─ TASK-1.8 - Check game invariants after every playtest action [completed]
      │  │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
      │  │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
      │  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
      │     └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
      │        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
      ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed] (shown above)
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

Dependents (6 direct, 55 total):
├─ TASK-3 - Play hands at the table [To Do]
├─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do]
│  └─ TASK-3 - Play hands at the table [To Do] (shown above)
├─ TASK-3.21 - Remove the temporary short-stack top-up once all-ins and rebuy exist [To Do]
├─ TASK-9.2 - Continue to rebuy or leave when I bust with the review open [To Do]
│  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do]
│  │  └─ TASK-5 - Play a sit-and-go [To Do]
│  └─ TASK-9 - Review the hand just played [To Do]
├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do]
│  ├─ TASK-2.7 - Confirm ending a paused session before starting a new game [To Do]
│  │  └─ TASK-2 - Launch and set up a session [To Do]
│  ├─ TASK-2.15 - Practise with play money only [To Do]
│  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do]
│  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  ├─ TASK-2.17 - See a first-use message on Home before any session has ended [To Do]
│  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  ├─ TASK-12.4 - Delete all my data after confirming [To Do]
│  │  │  │  └─ TASK-12 - Tune the trainer [To Do]
│  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
│  │  │     └─ TASK-13 - Rely on a private offline app [To Do]
│  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do]
│  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  ├─ TASK-10 - Read the session report [To Do]
│  ├─ TASK-10.2 - Leave the table in the middle of a hand [To Do]
│  │  ├─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do]
│  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  ├─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do]
│  │  │  ├─ TASK-11 - Track progress over time [To Do]
│  │  │  ├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do]
│  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do]
│  │  │  │     └─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  ├─ TASK-11.3 - See the G-2 target line on my Major-error trend [To Do]
│  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  └─ TASK-11.11 - See whether I met the G-2 goal after 5,000 hands [To Do]
│  │  │  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │     └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  ├─ TASK-11.4 - Filter my trends by table size and game type [To Do]
│  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  ├─ TASK-11.5 - Group my trends per session or per day [To Do]
│  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  ├─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do]
│  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │  ├─ TASK-11.7 - Filter my trends by line-up [To Do]
│  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do]
│  │  │  │  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │     └─ TASK-11.10 - See my style stats separately for each table size I played [To Do]
│  │  │  │  │        ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │        └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │  └─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do] (shown above)
│  │  │  ├─ TASK-11.5 - Group my trends per session or per day [To Do] (shown above)
│  │  │  └─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do]
│  │  │     └─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  ├─ TASK-10.3 - See my five style stats against healthy ranges for my table size [To Do]
│  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do] (shown above)
│  ├─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [To Do]
│  │  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do] (shown above)
│  ├─ TASK-10.5 - See my postflop leaks with evidence and a one-sentence fix [To Do]
│  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  ├─ TASK-10.6 - See my preflop leaks by position group [To Do]
│  │  │  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do]
│  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do]
│  │  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│  │  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do] (shown above)
│  │  │  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do] (shown above)
│  │  │  │  │  └─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do] (shown above)
│  │  │  │  └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
│  │  │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  └─ TASK-10.8 - See my three most costly leaks first [To Do]
│  │     ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│  │     └─ TASK-10 - Read the session report [To Do] (shown above)
│  ├─ TASK-10.7 - See how many of my decisions used a hint in the report [To Do]
│  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  ├─ TASK-10.11 - See my playing time and hands per hour in the report [To Do]
│  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  ├─ TASK-10.12 - See my sit-and-go finishing position in the report [To Do]
│  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do] (shown above)
│  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  ├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do] (shown above)
│  ├─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do] (shown above)
│  ├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do]
│  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  ├─ TASK-13.3 - Stop dealing when the last hand could not be saved [To Do]
│  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  ├─ TASK-13.4 - Use every screen offline after the first visit [To Do]
│  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  ├─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do]
│  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  └─ TASK-13.9 - Reach Home within 3 seconds on a repeat launch [To Do]
│  │     ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │     └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do]
│  │        └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  ├─ TASK-13.5 - Keep all my data on this device with no third-party requests [To Do]
│  │  └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  ├─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do]
│  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  ├─ TASK-13.7 - Keep my old data intact when a migration fails [To Do]
│  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  └─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do] (shown above)
│  ├─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
└─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want to be offered Rebuy or Leave table when my stack reaches $0, so that I can keep practising after a bad run or stop on my own terms.

Cash games only. When the user's stack is $0 at the end of a hand, a dialog offers Rebuy and Leave table and no further hand is dealt until the user chooses. Rebuy sets the stack to the buy-in (20 big bets, $160 at $4/$8) and the session continues; the session record (E03-S11) counts total rebuys; showing them in the session result is E10-S01. The user cannot add chips while the stack is above $0: there is no rebuy or add-chips control at any other time. Leave table from this dialog stops dealing and hands over to the Leave table flow; ending the session and opening the Session Report is E10-S01. When the Hand Review panel is open on a bust, E09 changes Deal next hand to Continue, which opens this dialog (REQ-007.6).

## Requirements covered
- REQ-007 (Must): Cash game buy-in and rebuy — In a cash game, every player shall start with a fixed buy-in of 20 big bets; when the user's stack reaches zero, TLH Trainer shall ask the user to Rebuy (another 20 big bets) or Leave table before the next hand.

Covers: REQ-007

## Notes
E10-S01: verify the rebuy count from the session record appears in the session result (REQ-007.3), and that Leave table from the bust dialog ends the session and opens the Session Report (REQ-004.5).

Plan key: E03-S08 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the user's stack is $0 at the end of a $4/$8 cash hand, When the result is shown, Then a dialog offers Rebuy and Leave table and no next hand is dealt while the dialog is open, even after 1.5 s [REQ-007.2]
- [ ] #2 Given the bust dialog, When the user chooses Rebuy, Then the user's stack is $160, the next hand is dealt and the session's rebuy count increases by 1 [REQ-007.3]
- [ ] #3 Given a user who rebought twice in a session, When the session record is read after the next completed hand, Then its rebuy count is 2 [REQ-007.3]
- [ ] #4 Given the bust dialog, When the user chooses Leave table, Then the dialog closes and no further hand is dealt, even after 1.5 s [REQ-007.2]
- [ ] #5 Given the user's stack is $1 or more, When the Table screen is shown at any moment, Then no rebuy or add-chips control is offered [REQ-007.4]

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
TASK-3.4 Q-4 interim top-up to $160 must be removed once this and the other all-in/rebuy stories land: tracked as TASK-3.21.

