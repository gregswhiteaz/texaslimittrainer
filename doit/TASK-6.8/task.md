File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.8 - Replace-a-busted-bot-with-a-new-bot-from-the-line-up-preset.md

Task TASK-6.8 - Replace a busted bot with a new bot from the line-up preset
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 54000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-19 01:10 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-6 - Face distinct opponents
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 18 total):
└─ TASK-6.7 - Record an edited line-up as Custom [completed]
   └─ TASK-6.6 - Seat bots by line-up preset with unique names [completed]
      ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [completed]
      │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
      │     └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
      │        └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
      │           ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
      │           │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
      │           │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
      │           │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
      │           │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
      │           │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
      │           │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
      │           │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
      │           ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
      │           │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
      │           └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
      │              ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
      │              │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
      │              └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
      ├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [completed]
      │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
      └─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [completed]
         └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)

Dependents (7 direct, 89 total):
├─ TASK-3.9 - Keep a permanent record of every completed hand [To Do]
│  ├─ TASK-3 - Play hands at the table [To Do]
│  ├─ TASK-3.10 - Save the session after every hand so it can be resumed [To Do]
│  │  ├─ TASK-2.6 - Resume a paused session from Home [To Do]
│  │  │  ├─ TASK-2 - Launch and set up a session [To Do]
│  │  │  ├─ TASK-2.7 - Confirm ending a paused session before starting a new game [To Do]
│  │  │  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  ├─ TASK-2.14 - Pause the session from the Table header Home control [To Do]
│  │  │  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do]
│  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do]
│  │  │  │  └─ TASK-5.6 - See the level on Home's Resume entry for a paused sit-and-go [To Do]
│  │  │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  ├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do]
│  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do]
│  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
│  │  │  │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  ├─ TASK-3.11 - Rebuy or leave when my stack runs out [To Do]
│  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  ├─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do]
│  │  │  │  └─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  ├─ TASK-3.21 - Remove the temporary short-stack top-up once all-ins and rebuy exist [To Do]
│  │  │  ├─ TASK-9.2 - Continue to rebuy or leave when I bust with the review open [To Do]
│  │  │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do]
│  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  └─ TASK-9 - Review the hand just played [To Do]
│  │  │  ├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do]
│  │  │  │  ├─ TASK-2.7 - Confirm ending a paused session before starting a new game [To Do] (shown above)
│  │  │  │  ├─ TASK-2.15 - Practise with play money only [To Do]
│  │  │  │  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do]
│  │  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  ├─ TASK-2.17 - See a first-use message on Home before any session has ended [To Do]
│  │  │  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-12.4 - Delete all my data after confirming [To Do]
│  │  │  │  │  │  │  └─ TASK-12 - Tune the trainer [To Do]
│  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do]
│  │  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  ├─ TASK-10 - Read the session report [To Do]
│  │  │  │  ├─ TASK-10.2 - Leave the table in the middle of a hand [To Do]
│  │  │  │  │  ├─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do]
│  │  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  ├─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do]
│  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do]
│  │  │  │  │  │  ├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do]
│  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do]
│  │  │  │  │  │  │     └─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-11.3 - See the G-2 target line on my Major-error trend [To Do]
│  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  └─ TASK-11.11 - See whether I met the G-2 goal after 5,000 hands [To Do]
│  │  │  │  │  │  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │     └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-11.4 - Filter my trends by table size and game type [To Do]
│  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-11.5 - Group my trends per session or per day [To Do]
│  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do]
│  │  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-11.7 - Filter my trends by line-up [To Do]
│  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do]
│  │  │  │  │  │  │  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │     └─ TASK-11.10 - See my style stats separately for each table size I played [To Do]
│  │  │  │  │  │  │  │        ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │        └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  │  │  └─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-11.5 - Group my trends per session or per day [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do]
│  │  │  │  │  │     └─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  ├─ TASK-10.3 - See my five style stats against healthy ranges for my table size [To Do]
│  │  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do] (shown above)
│  │  │  │  ├─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [To Do]
│  │  │  │  │  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│  │  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do] (shown above)
│  │  │  │  ├─ TASK-10.5 - See my postflop leaks with evidence and a one-sentence fix [To Do]
│  │  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  ├─ TASK-10.6 - See my preflop leaks by position group [To Do]
│  │  │  │  │  │  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do]
│  │  │  │  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do]
│  │  │  │  │  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│  │  │  │  │  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do] (shown above)
│  │  │  │  │  │  │  │  └─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do] (shown above)
│  │  │  │  │  │  │  └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
│  │  │  │  │  │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  └─ TASK-10.8 - See my three most costly leaks first [To Do]
│  │  │  │  │     ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│  │  │  │  │     └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  ├─ TASK-10.7 - See how many of my decisions used a hint in the report [To Do]
│  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  ├─ TASK-10.11 - See my playing time and hands per hour in the report [To Do]
│  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  ├─ TASK-10.12 - See my sit-and-go finishing position in the report [To Do]
│  │  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │  │  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do] (shown above)
│  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  ├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do] (shown above)
│  │  │  │  ├─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do] (shown above)
│  │  │  │  ├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do] (shown above)
│  │  │  │  ├─ TASK-13.3 - Stop dealing when the last hand could not be saved [To Do]
│  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  ├─ TASK-13.4 - Use every screen offline after the first visit [To Do]
│  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  ├─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do]
│  │  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  └─ TASK-13.9 - Reach Home within 3 seconds on a repeat launch [To Do]
│  │  │  │  │     ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │     └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do]
│  │  │  │  │        └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  ├─ TASK-13.5 - Keep all my data on this device with no third-party requests [To Do]
│  │  │  │  │  └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  ├─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do]
│  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  ├─ TASK-13.7 - Keep my old data intact when a migration fails [To Do]
│  │  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  └─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do] (shown above)
│  │  │  │  ├─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  ├─ TASK-3.15 - Change speed during a session from the table [To Do]
│  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  └─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do] (shown above)
│  │  ├─ TASK-4.9 - See my session's playing time and hands-per-hour pace in the header [To Do]
│  │  │  ├─ TASK-4 - Follow the action at a glance [To Do]
│  │  │  ├─ TASK-10.11 - See my playing time and hands per hour in the report [To Do] (shown above)
│  │  │  └─ TASK-12.3 - Open Settings over the table without pausing the session [To Do]
│  │  │     ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │  │     ├─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  │     ├─ TASK-12.6 - Turn off automatic opening of the Hand Review panel [To Do]
│  │  │     │  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │  │     │  └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  │     ├─ TASK-12.7 - Switch to a four-colour deck [To Do]
│  │  │     │  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │  │     │  └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  │     └─ TASK-12.9 - Warn me in Settings when the browser can clear my history [To Do]
│  │  │        └─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │  ├─ TASK-5.1 - Start a sit-and-go where every player has 1,500 chips [To Do]
│  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do] (shown above)
│  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │  └─ TASK-5.4 - Raise the sit-and-go limits every 10 hands on the published schedule [To Do]
│  │  │     ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │     ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do] (shown above)
│  │  │     └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
│  │  ├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do] (shown above)
│  │  ├─ TASK-12.3 - Open Settings over the table without pausing the session [To Do] (shown above)
│  │  ├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do] (shown above)
│  │  ├─ TASK-13.3 - Stop dealing when the last hand could not be saved [To Do] (shown above)
│  │  └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do] (shown above)
│  ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [To Do]
│  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  ├─ TASK-8.2 - Mark a decision as hinted when I open the hint [To Do]
│  │  │  └─ TASK-8 - Ask for a hint [To Do]
│  │  ├─ TASK-9.3 - See the numbers and reason behind each reviewed decision [To Do]
│  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  ├─ TASK-9.6 - See which reviewed decisions were hinted [To Do]
│  │  │  │  └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  ├─ TASK-9.8 - Get the review panel within one second of the hand ending [To Do]
│  │  │  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│  │  │  └─ TASK-9.9 - See approximate and short-stack labels in review entries [To Do]
│  │  │     └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  ├─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [To Do] (shown above)
│  │  ├─ TASK-10.5 - See my postflop leaks with evidence and a one-sentence fix [To Do] (shown above)
│  │  ├─ TASK-10.7 - See how many of my decisions used a hint in the report [To Do] (shown above)
│  │  └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do] (shown above)
│  ├─ TASK-3.14 - See an opponent's observed VPIP, PFR and aggression on hover or tap [To Do]
│  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  └─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do] (shown above)
│  ├─ TASK-9.4 - See the hand number, my cards, position, result and replay code in the review [To Do]
│  │  └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  ├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do] (shown above)
│  ├─ TASK-11.5 - Group my trends per session or per day [To Do] (shown above)
│  ├─ TASK-11.7 - Filter my trends by line-up [To Do] (shown above)
│  ├─ TASK-13.2 - Ask the browser to keep my history on first launch [To Do]
│  │  └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  ├─ TASK-13.3 - Stop dealing when the last hand could not be saved [To Do] (shown above)
│  └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do] (shown above)
├─ TASK-4.2 - See a bot's in-style speech bubble after a table event [To Do]
│  ├─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  ├─ TASK-4.8 - Keep bot banter rare and free of hidden information [To Do]
│  │  └─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  └─ TASK-12.8 - Turn bot banter off [To Do]
│     ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│     └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
├─ TASK-4.7 - Recognise each bot by an initials avatar badge [To Do]
│  └─ TASK-4 - Follow the action at a glance [To Do] (shown above)
├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do] (shown above)
├─ TASK-6 - Face distinct opponents [To Do]
├─ TASK-6.9 - Prove the engine over 1,000,000 cash hands with every line-up preset [To Do]
│  ├─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
│  └─ TASK-6 - Face distinct opponents [To Do] (shown above)
└─ TASK-6.10 - Report each bot's BB/100 with a 95% confidence interval [To Do]
   ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
   └─ TASK-6.12 - Prove TAG beats tables of each weaker style [To Do]
      └─ TASK-6 - Face distinct opponents [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want a busted bot replaced by a new bot with a fresh buy-in before the next hand, so that my cash table stays full and keeps the character of the line-up I chose.

Cash games only (sit-and-go never refills seats, E05). When a bot's stack is $0 at the end of a hand, it leaves and a new bot takes the seat before the next hand with a fresh buy-in of 20 x the big bet ($160 at $4/$8). The new bot's style is drawn at random from the styles the session's preset assigns at the current table size (REQ-007.8): e.g. Mixed at 6 players - TAG, Calling station, Maniac or Rock, Mixed at 3 players - TAG or Calling station; Tough - TAG or Maniac, but TAG only at heads-up; Soft - Calling station or Rock; a session recorded as Custom draws from all four styles (REQ-007.7). The draw uses a seeded generator so playtests stay reproducible. The new bot gets a display name unique within the table. This replaces E01's in-runner stack restore in the playtest.

## Requirements covered
- REQ-007 (Must): Cash game buy-in and rebuy — In a cash game, every player shall start with a fixed buy-in of 20 big bets; when the user's stack reaches zero, TLH Trainer shall ask the user to Rebuy (another 20 big bets) or Leave table before the next hand.
- REQ-009 (Must): Line-up presets and per-seat styles — The Game Config screen shall let the user choose a line-up preset (Mixed, Tough or Soft) and then change the style of any individual bot seat.
- REQ-062 (Must): Headless playtest CLI — The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.

Covers: REQ-007, REQ-009, REQ-062

## Notes
E03: a replaced seat's observed stats start from zero (REQ-031.3); give each bot instance a distinct id.

Plan key: E06-S08 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a $4/$8 cash game where a bot's stack is $0 at the end of a hand, When the next hand is dealt, Then that bot has left and a new bot holds the seat with $160 [REQ-007.5]
- [ ] #2 Given a bot with $1 left at the end of a hand, When the next hand is dealt, Then the same bot keeps the seat with $1 [REQ-007.5]
- [ ] #3 Given 10,000 seeded replacements at 6 players for each preset, When the new bots' styles are tallied, Then Mixed yields all four styles, Tough only TAG and Maniac, Soft only Calling station and Rock, and every allowed style appears at least once [REQ-007.5, REQ-007.8]
- [ ] #4 Given two bots bust in the same hand, When the next hand is dealt, Then both seats hold new bots with fresh buy-ins and no two bots at the table share a display name [REQ-007.5, REQ-009.4]
- [ ] #5 Given a cash playtest with the same seed and options, When it is run twice, Then the same bots are replaced after the same hands with the same styles and names [REQ-007.5, REQ-062.4]
- [ ] #6 Given `npm run playtest -- --hands 10000 --seed 42 --lineup mixed`, When bots bust, Then they are replaced by this rule, zero invariant violations are reported and it exits 0 [REQ-007.5]
- [ ] #7 Given a session recorded as Custom, When 10,000 seeded replacements are tallied, Then the new bots' styles include all four styles (TAG, Calling station, Maniac, Rock) and no other [REQ-007.7]
- [ ] #8 Given 10,000 seeded replacements with the Mixed preset at 3 players and with the Tough preset at heads-up, When the new bots' styles are tallied, Then Mixed yields only TAG and Calling station (both at least once) and heads-up Tough yields only TAG [REQ-007.8]
- [ ] #9 Given a bot ends a hand at $0, When nextHand runs, Then the bot is replaced by a new bot (preset style, unique name, $160) instead of being topped up

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
AC added from TASK-3.4 follow-up (doc-25).

