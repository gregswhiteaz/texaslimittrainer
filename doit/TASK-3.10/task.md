File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-3.10 - Save-the-session-after-every-hand-so-it-can-be-resumed.md

Task TASK-3.10 - Save the session after every hand so it can be resumed
==================================================

Status: ○ To Do
Priority: High
Type: chore
Ordinal: 64000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-23 12:10 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-3 - Play hands at the table
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 29 total):
└─ TASK-3.9 - Keep a permanent record of every completed hand [completed]
   ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
   │  ├─ TASK-1.8 - Check game invariants after every playtest action [completed]
   │  │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
   │  │  │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │  │  │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │  │  │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │  │  │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │  │  │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │  │  │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │  │  │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │  │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
   │     └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
   │        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
   ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
   │  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
   │     ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
   │     │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │     │  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
   │     │  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
   │     │  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
   │     │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
   │     │     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
   │     │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │     │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
   │     │        ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
   │     │        │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
   │     │        └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
   │     └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)
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

Dependents (11 direct, 69 total):
├─ TASK-2.6 - Resume a paused session from Home [To Do]
│  ├─ TASK-2 - Launch and set up a session [To Do]
│  ├─ TASK-2.7 - Confirm ending a paused session before starting a new game [To Do]
│  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  ├─ TASK-2.14 - Pause the session from the Table header Home control [To Do]
│  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do]
│  │  ├─ TASK-5 - Play a sit-and-go [To Do]
│  │  └─ TASK-5.6 - See the level on Home's Resume entry for a paused sit-and-go [To Do]
│  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  ├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do]
│  │  ├─ TASK-13 - Rely on a private offline app [To Do]
│  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
│  │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
├─ TASK-3 - Play hands at the table [To Do]
├─ TASK-3.11 - Rebuy or leave when my stack runs out [To Do]
│  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  ├─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do]
│  │  └─ TASK-3 - Play hands at the table [To Do] (shown above)
│  ├─ TASK-3.21 - Remove the temporary short-stack top-up once all-ins and rebuy exist [To Do]
│  ├─ TASK-9.2 - Continue to rebuy or leave when I bust with the review open [To Do]
│  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do]
│  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  └─ TASK-9 - Review the hand just played [To Do]
│  ├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do]
│  │  ├─ TASK-2.7 - Confirm ending a paused session before starting a new game [To Do] (shown above)
│  │  ├─ TASK-2.15 - Practise with play money only [To Do]
│  │  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do]
│  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  ├─ TASK-2.17 - See a first-use message on Home before any session has ended [To Do]
│  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  ├─ TASK-12.4 - Delete all my data after confirming [To Do]
│  │  │  │  │  └─ TASK-12 - Tune the trainer [To Do]
│  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do]
│  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  ├─ TASK-10 - Read the session report [To Do]
│  │  ├─ TASK-10.2 - Leave the table in the middle of a hand [To Do]
│  │  │  ├─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do]
│  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  ├─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do]
│  │  │  │  ├─ TASK-11 - Track progress over time [To Do]
│  │  │  │  ├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do]
│  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do]
│  │  │  │  │     └─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  ├─ TASK-11.3 - See the G-2 target line on my Major-error trend [To Do]
│  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  └─ TASK-11.11 - See whether I met the G-2 goal after 5,000 hands [To Do]
│  │  │  │  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │     └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │  ├─ TASK-11.4 - Filter my trends by table size and game type [To Do]
│  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  ├─ TASK-11.5 - Group my trends per session or per day [To Do]
│  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do]
│  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  ├─ TASK-11.7 - Filter my trends by line-up [To Do]
│  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do]
│  │  │  │  │  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │     └─ TASK-11.10 - See my style stats separately for each table size I played [To Do]
│  │  │  │  │  │        ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │        └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  └─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do] (shown above)
│  │  │  │  ├─ TASK-11.5 - Group my trends per session or per day [To Do] (shown above)
│  │  │  │  └─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do]
│  │  │  │     └─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  ├─ TASK-10.3 - See my five style stats against healthy ranges for my table size [To Do]
│  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do] (shown above)
│  │  ├─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [To Do]
│  │  │  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do] (shown above)
│  │  ├─ TASK-10.5 - See my postflop leaks with evidence and a one-sentence fix [To Do]
│  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  ├─ TASK-10.6 - See my preflop leaks by position group [To Do]
│  │  │  │  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do]
│  │  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do]
│  │  │  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│  │  │  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do] (shown above)
│  │  │  │  │  └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
│  │  │  │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  └─ TASK-10.8 - See my three most costly leaks first [To Do]
│  │  │     ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│  │  │     └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  ├─ TASK-10.7 - See how many of my decisions used a hint in the report [To Do]
│  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  ├─ TASK-10.11 - See my playing time and hands per hour in the report [To Do]
│  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  ├─ TASK-10.12 - See my sit-and-go finishing position in the report [To Do]
│  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do] (shown above)
│  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  ├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do] (shown above)
│  │  ├─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do] (shown above)
│  │  ├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do] (shown above)
│  │  ├─ TASK-13.3 - Stop dealing when the last hand could not be saved [To Do]
│  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  ├─ TASK-13.4 - Use every screen offline after the first visit [To Do]
│  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  ├─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do]
│  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  └─ TASK-13.9 - Reach Home within 3 seconds on a repeat launch [To Do]
│  │  │     ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │     └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do]
│  │  │        └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  ├─ TASK-13.5 - Keep all my data on this device with no third-party requests [To Do]
│  │  │  └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  ├─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do]
│  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  ├─ TASK-13.7 - Keep my old data intact when a migration fails [To Do]
│  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  └─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do] (shown above)
│  │  ├─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
├─ TASK-3.15 - Change speed during a session from the table [To Do]
│  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  └─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do] (shown above)
├─ TASK-4.9 - See my session's playing time and hands-per-hour pace in the header [To Do]
│  ├─ TASK-4 - Follow the action at a glance [To Do]
│  ├─ TASK-10.11 - See my playing time and hands per hour in the report [To Do] (shown above)
│  └─ TASK-12.3 - Open Settings over the table without pausing the session [To Do]
│     ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│     ├─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│     ├─ TASK-12.6 - Turn off automatic opening of the Hand Review panel [To Do]
│     │  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│     │  └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│     ├─ TASK-12.7 - Switch to a four-colour deck [To Do]
│     │  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│     │  └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│     └─ TASK-12.9 - Warn me in Settings when the browser can clear my history [To Do]
│        └─ TASK-12 - Tune the trainer [To Do] (shown above)
├─ TASK-5.1 - Start a sit-and-go where every player has 1,500 chips [To Do]
│  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do] (shown above)
│  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  └─ TASK-5.4 - Raise the sit-and-go limits every 10 hands on the published schedule [To Do]
│     ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do] (shown above)
│     └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do] (shown above)
├─ TASK-12.3 - Open Settings over the table without pausing the session [To Do] (shown above)
├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do] (shown above)
├─ TASK-13.3 - Stop dealing when the last hand could not be saved [To Do] (shown above)
└─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want my session state saved after every completed hand, so that closing the app never costs me more than the hand in progress.

Enabler (user-visible through E02 Resume). Creates the session record when the table starts (session id, game type, table size, stake, line-up name and seat styles from the session configuration, E06-S07; speed) and updates it after every completed hand with seats (bot ids, names, styles), stacks, dealer button position, hand count, rebuy count and SNG level. Resume (REQ-004.2/004.3) and the Home Resume entry are E02; this story guarantees the stored state they read. An unfinished hand is never written.

## Requirements covered
- REQ-052 (Must): Local persistence — TLH Trainer shall store settings, last configuration, sessions, hand records and session reports in the browser's IndexedDB, writing each hand record when its hand ends.

Covers: REQ-052

## Notes
E02 resumes from this state (REQ-004.2, 004.3) and shows hands played on Home; E05 adds the SNG level and finishing data; E10 discards 0-hand sessions (REQ-044.8).

Plan key: E03-S11 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a session at hand 10, When hand 10 completes, Then the stored session holds hand count 10 and the stacks, seats, styles, line-up name and dealer button exactly as at the end of hand 10 [REQ-052.3]
- [ ] #2 Given the browser process is killed in the middle of hand 11, When the stored session is read, Then it equals the state at the end of hand 10 and no record exists for hand 11 [REQ-052.3]
- [ ] #3 Given a session started with an edited line-up, When the session record is read, Then its line-up name is Custom and it lists every seat's style [REQ-052.3]
- [ ] #4 Given a seat whose bot was replaced after hand 5, When the session is read after hand 5, Then that seat holds the new bot's id, name, style and $160 stack [REQ-052.3]
- [ ] #5 Given a stored SessionConfig is loaded to resume a session, When it is validated, Then assertSessionConfig throws RangeError unless there is exactly one user seat equal to userSeat, players equals seats.length, button is one of the seats and every value is known — so a corrupt config can never show a bot's cards to the user (REQ-025)
- [ ] #6 Given a restored session's stakes and stacks, When they are loaded, Then they pass the same safe-integer and pot-bound rules createHand applies before any table is built
- [ ] #7 Given restored session JSON whose seat, button or replay-code value is an object (e.g. {"toString":1}) or an array, When it is validated, Then it is rejected with a RangeError before reaching createHand or shuffledDeck (no native TypeError, no array coerced into a valid replay code)
- [ ] #8 Given restored session JSON whose seats list has gaps or non-object entries, When it is restored, Then a RangeError is raised (e.g. 'Invalid hand config') rather than a TypeError
- [ ] #9 Given an in-app Partial session config, When resolveSessionConfig merges it with defaults, Then the result always passes assertSessionConfig (e.g. players, seats, userSeat and button stay consistent), with a test for a partial override that would otherwise be inconsistent
- [ ] #10 Given a saved session holding an in-progress hand (HandState, including allIn, stack and contribution fields), When it is restored, Then the state is validated (e.g. checkState) before any action is applied and an invalid state is rejected
- [ ] #11 Given a saved session whose stored actions are replayed on restore, When an action is not a well-formed {seat, type, amount} object, Then restore rejects it before calling applyAction
- [ ] #12 Given hand records are read back from IndexedDB, When parseHandRecord runs, Then it also rejects cross-field inconsistencies (seats in actions/showdown/awards not in the seat list, repeated cards, level not matching game type, unbounded name/array lengths)

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
AC added from TASK-2.1 follow-up (doc-23).

AC added from TASK-1.21 follow-up (doc-29).

AC added from TASK-1.32 follow-ups (doc-41): security MINOR String() coercion, code MINOR/judge LOW sparse seats, shuffledDeck/isReplayCode non-string coercion.

AC added from TASK-2.18 follow-up (doc-50, TASK-2.1 review MINOR).

AC added from TASK-1.9 follow-up (security review: restored HandState fields become untrusted)

AC#11 added from TASK-1.13 follow-up (security review: action shape must be checked at load)

AC added from TASK-3.9 security review (first reader of stored records).

