File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.2 - Vary-TAGs-play-in-mixed-spots-with-a-replay-seeded-generator.md

Task TASK-6.2 - Vary TAG's play in mixed spots from its style data file
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 36000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-21 21:40 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-6 - Face distinct opponents
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 12 total):
└─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
   └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
      ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
      │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
      │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
      │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
      │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
      │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
      │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
      │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
      ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
      │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
      └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
         ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
         │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
         └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)

Dependents (4 direct, 106 total):
├─ TASK-6 - Face distinct opponents [To Do]
├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [To Do]
│  ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  └─ TASK-6.6 - Seat bots by line-up preset with unique names [To Do]
│     ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│     ├─ TASK-6.7 - Record an edited line-up as Custom [To Do]
│     │  ├─ TASK-2.5 - Choose a line-up preset for the bots [To Do]
│     │  │  ├─ TASK-2 - Launch and set up a session [To Do]
│     │  │  ├─ TASK-2.8 - Change the style of one bot seat [To Do]
│     │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│     │  │  │  └─ TASK-2.10 - Pre-fill Game Config from my last session [To Do]
│     │  │  │     ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│     │  │  │     ├─ TASK-12.4 - Delete all my data after confirming [To Do]
│     │  │  │     │  └─ TASK-12 - Tune the trainer [To Do]
│     │  │  │     └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do]
│     │  │  │        ├─ TASK-13 - Rely on a private offline app [To Do]
│     │  │  │        ├─ TASK-13.7 - Keep my old data intact when a migration fails [To Do]
│     │  │  │        │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     │  │  │        │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
│     │  │  │        │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     │  │  │        └─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do]
│     │  │  │           ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     │  │  │           └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│     │  │  ├─ TASK-2.9 - Randomise the bot line-up [To Do]
│     │  │  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│     │  │  └─ TASK-2.13 - Sit at a random seat with a random starting button [To Do]
│     │  │     └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│     │  ├─ TASK-3.9 - Keep a permanent record of every completed hand [To Do]
│     │  │  ├─ TASK-3 - Play hands at the table [To Do]
│     │  │  ├─ TASK-3.10 - Save the session after every hand so it can be resumed [To Do]
│     │  │  │  ├─ TASK-2.6 - Resume a paused session from Home [To Do]
│     │  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│     │  │  │  │  ├─ TASK-2.7 - Confirm ending a paused session before starting a new game [To Do]
│     │  │  │  │  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│     │  │  │  │  ├─ TASK-2.14 - Pause the session from the Table header Home control [To Do]
│     │  │  │  │  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│     │  │  │  │  ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do]
│     │  │  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do]
│     │  │  │  │  │  └─ TASK-5.6 - See the level on Home's Resume entry for a paused sit-and-go [To Do]
│     │  │  │  │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  │  │  │  ├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do]
│     │  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│     │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│     │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│     │  │  │  ├─ TASK-3.11 - Rebuy or leave when my stack runs out [To Do]
│     │  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│     │  │  │  │  ├─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do]
│     │  │  │  │  │  └─ TASK-3 - Play hands at the table [To Do] (shown above)
│     │  │  │  │  ├─ TASK-3.21 - Remove the temporary short-stack top-up once all-ins and rebuy exist [To Do]
│     │  │  │  │  ├─ TASK-9.2 - Continue to rebuy or leave when I bust with the review open [To Do]
│     │  │  │  │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do]
│     │  │  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  │  │  │  │  └─ TASK-9 - Review the hand just played [To Do]
│     │  │  │  │  ├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do]
│     │  │  │  │  │  ├─ TASK-2.7 - Confirm ending a paused session before starting a new game [To Do] (shown above)
│     │  │  │  │  │  ├─ TASK-2.15 - Practise with play money only [To Do]
│     │  │  │  │  │  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│     │  │  │  │  │  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do]
│     │  │  │  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│     │  │  │  │  │  │  ├─ TASK-2.17 - See a first-use message on Home before any session has ended [To Do]
│     │  │  │  │  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│     │  │  │  │  │  │  │  ├─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│     │  │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│     │  │  │  │  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do]
│     │  │  │  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│     │  │  │  │  │  ├─ TASK-10 - Read the session report [To Do]
│     │  │  │  │  │  ├─ TASK-10.2 - Leave the table in the middle of a hand [To Do]
│     │  │  │  │  │  │  ├─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do]
│     │  │  │  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  │  │  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│     │  │  │  │  │  │  ├─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do]
│     │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do]
│     │  │  │  │  │  │  │  ├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do]
│     │  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│     │  │  │  │  │  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do]
│     │  │  │  │  │  │  │  │     └─ TASK-11 - Track progress over time [To Do] (shown above)
│     │  │  │  │  │  │  │  ├─ TASK-11.3 - See the G-2 target line on my Major-error trend [To Do]
│     │  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│     │  │  │  │  │  │  │  │  └─ TASK-11.11 - See whether I met the G-2 goal after 5,000 hands [To Do]
│     │  │  │  │  │  │  │  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│     │  │  │  │  │  │  │  │     └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│     │  │  │  │  │  │  │  ├─ TASK-11.4 - Filter my trends by table size and game type [To Do]
│     │  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│     │  │  │  │  │  │  │  │  ├─ TASK-11.5 - Group my trends per session or per day [To Do]
│     │  │  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│     │  │  │  │  │  │  │  │  │  ├─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do]
│     │  │  │  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│     │  │  │  │  │  │  │  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│     │  │  │  │  │  │  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│     │  │  │  │  │  │  │  │  ├─ TASK-11.7 - Filter my trends by line-up [To Do]
│     │  │  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│     │  │  │  │  │  │  │  │  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do]
│     │  │  │  │  │  │  │  │  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│     │  │  │  │  │  │  │  │  │     └─ TASK-11.10 - See my style stats separately for each table size I played [To Do]
│     │  │  │  │  │  │  │  │  │        ├─ TASK-11 - Track progress over time [To Do] (shown above)
│     │  │  │  │  │  │  │  │  │        └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│     │  │  │  │  │  │  │  │  └─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do] (shown above)
│     │  │  │  │  │  │  │  ├─ TASK-11.5 - Group my trends per session or per day [To Do] (shown above)
│     │  │  │  │  │  │  │  └─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do]
│     │  │  │  │  │  │  │     └─ TASK-11 - Track progress over time [To Do] (shown above)
│     │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│     │  │  │  │  │  ├─ TASK-10.3 - See my five style stats against healthy ranges for my table size [To Do]
│     │  │  │  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│     │  │  │  │  │  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do] (shown above)
│     │  │  │  │  │  ├─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [To Do]
│     │  │  │  │  │  │  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│     │  │  │  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│     │  │  │  │  │  │  └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do] (shown above)
│     │  │  │  │  │  ├─ TASK-10.5 - See my postflop leaks with evidence and a one-sentence fix [To Do]
│     │  │  │  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│     │  │  │  │  │  │  ├─ TASK-10.6 - See my preflop leaks by position group [To Do]
│     │  │  │  │  │  │  │  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do]
│     │  │  │  │  │  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  │  │  │  │  │  │  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do]
│     │  │  │  │  │  │  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  │  │  │  │  │  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│     │  │  │  │  │  │  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  │  │  │  │  │  │  │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do] (shown above)
│     │  │  │  │  │  │  │  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do] (shown above)
│     │  │  │  │  │  │  │  │  │  └─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do] (shown above)
│     │  │  │  │  │  │  │  │  └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
│     │  │  │  │  │  │  │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  │  │  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│     │  │  │  │  │  │  └─ TASK-10.8 - See my three most costly leaks first [To Do]
│     │  │  │  │  │  │     ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│     │  │  │  │  │  │     └─ TASK-10 - Read the session report [To Do] (shown above)
│     │  │  │  │  │  ├─ TASK-10.7 - See how many of my decisions used a hint in the report [To Do]
│     │  │  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│     │  │  │  │  │  ├─ TASK-10.11 - See my playing time and hands per hour in the report [To Do]
│     │  │  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│     │  │  │  │  │  ├─ TASK-10.12 - See my sit-and-go finishing position in the report [To Do]
│     │  │  │  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│     │  │  │  │  │  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do] (shown above)
│     │  │  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│     │  │  │  │  │  ├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do] (shown above)
│     │  │  │  │  │  ├─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do] (shown above)
│     │  │  │  │  │  ├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do] (shown above)
│     │  │  │  │  │  ├─ TASK-13.3 - Stop dealing when the last hand could not be saved [To Do]
│     │  │  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│     │  │  │  │  │  ├─ TASK-13.4 - Use every screen offline after the first visit [To Do]
│     │  │  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     │  │  │  │  │  │  ├─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do] (shown above)
│     │  │  │  │  │  │  └─ TASK-13.9 - Reach Home within 3 seconds on a repeat launch [To Do]
│     │  │  │  │  │  │     ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     │  │  │  │  │  │     └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do]
│     │  │  │  │  │  │        └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     │  │  │  │  │  ├─ TASK-13.5 - Keep all my data on this device with no third-party requests [To Do]
│     │  │  │  │  │  │  └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     │  │  │  │  │  ├─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do] (shown above)
│     │  │  │  │  │  ├─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│     │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│     │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│     │  │  │  ├─ TASK-3.15 - Change speed during a session from the table [To Do]
│     │  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│     │  │  │  │  └─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do] (shown above)
│     │  │  │  ├─ TASK-4.9 - See my session's playing time and hands-per-hour pace in the header [To Do]
│     │  │  │  │  ├─ TASK-4 - Follow the action at a glance [To Do]
│     │  │  │  │  ├─ TASK-10.11 - See my playing time and hands per hour in the report [To Do] (shown above)
│     │  │  │  │  └─ TASK-12.3 - Open Settings over the table without pausing the session [To Do]
│     │  │  │  │     ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│     │  │  │  │     ├─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│     │  │  │  │     ├─ TASK-12.6 - Turn off automatic opening of the Hand Review panel [To Do]
│     │  │  │  │     │  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│     │  │  │  │     │  └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│     │  │  │  │     ├─ TASK-12.7 - Switch to a four-colour deck [To Do]
│     │  │  │  │     │  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│     │  │  │  │     │  └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│     │  │  │  │     └─ TASK-12.9 - Warn me in Settings when the browser can clear my history [To Do]
│     │  │  │  │        └─ TASK-12 - Tune the trainer [To Do] (shown above)
│     │  │  │  ├─ TASK-5.1 - Start a sit-and-go where every player has 1,500 chips [To Do]
│     │  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  │  │  │  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do] (shown above)
│     │  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│     │  │  │  │  └─ TASK-5.4 - Raise the sit-and-go limits every 10 hands on the published schedule [To Do]
│     │  │  │  │     ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  │  │  │     ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do] (shown above)
│     │  │  │  │     └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
│     │  │  │  ├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do] (shown above)
│     │  │  │  ├─ TASK-12.3 - Open Settings over the table without pausing the session [To Do] (shown above)
│     │  │  │  ├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do] (shown above)
│     │  │  │  ├─ TASK-13.3 - Stop dealing when the last hand could not be saved [To Do] (shown above)
│     │  │  │  └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do] (shown above)
│     │  │  ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [To Do]
│     │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│     │  │  │  ├─ TASK-8.2 - Mark a decision as hinted when I open the hint [To Do]
│     │  │  │  │  └─ TASK-8 - Ask for a hint [To Do]
│     │  │  │  ├─ TASK-9.3 - See the numbers and reason behind each reviewed decision [To Do]
│     │  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│     │  │  │  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│     │  │  │  │  ├─ TASK-9.6 - See which reviewed decisions were hinted [To Do]
│     │  │  │  │  │  └─ TASK-9 - Review the hand just played [To Do] (shown above)
│     │  │  │  │  ├─ TASK-9.8 - Get the review panel within one second of the hand ending [To Do]
│     │  │  │  │  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│     │  │  │  │  │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│     │  │  │  │  └─ TASK-9.9 - See approximate and short-stack labels in review entries [To Do]
│     │  │  │  │     └─ TASK-9 - Review the hand just played [To Do] (shown above)
│     │  │  │  ├─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [To Do] (shown above)
│     │  │  │  ├─ TASK-10.5 - See my postflop leaks with evidence and a one-sentence fix [To Do] (shown above)
│     │  │  │  ├─ TASK-10.7 - See how many of my decisions used a hint in the report [To Do] (shown above)
│     │  │  │  └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do] (shown above)
│     │  │  ├─ TASK-3.14 - See an opponent's observed VPIP, PFR and aggression on hover or tap [To Do]
│     │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│     │  │  │  └─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do] (shown above)
│     │  │  ├─ TASK-9.4 - See the hand number, my cards, position, result and replay code in the review [To Do]
│     │  │  │  └─ TASK-9 - Review the hand just played [To Do] (shown above)
│     │  │  ├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do] (shown above)
│     │  │  ├─ TASK-11.5 - Group my trends per session or per day [To Do] (shown above)
│     │  │  ├─ TASK-11.7 - Filter my trends by line-up [To Do] (shown above)
│     │  │  ├─ TASK-13.2 - Ask the browser to keep my history on first launch [To Do]
│     │  │  │  └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     │  │  ├─ TASK-13.3 - Stop dealing when the last hand could not be saved [To Do] (shown above)
│     │  │  └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do] (shown above)
│     │  ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│     │  ├─ TASK-6.8 - Replace a busted bot with a new bot from the line-up preset [To Do]
│     │  │  ├─ TASK-3.9 - Keep a permanent record of every completed hand [To Do] (shown above)
│     │  │  ├─ TASK-4.2 - See a bot's in-style speech bubble after a table event [To Do]
│     │  │  │  ├─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│     │  │  │  ├─ TASK-4.8 - Keep bot banter rare and free of hidden information [To Do]
│     │  │  │  │  └─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│     │  │  │  └─ TASK-12.8 - Turn bot banter off [To Do]
│     │  │  │     ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│     │  │  │     └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│     │  │  ├─ TASK-4.7 - Recognise each bot by an initials avatar badge [To Do]
│     │  │  │  └─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│     │  │  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do] (shown above)
│     │  │  ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│     │  │  ├─ TASK-6.9 - Prove the engine over 1,000,000 cash hands with every line-up preset [To Do]
│     │  │  │  ├─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
│     │  │  │  └─ TASK-6 - Face distinct opponents [To Do] (shown above)
│     │  │  └─ TASK-6.10 - Report each bot's BB/100 with a 95% confidence interval [To Do]
│     │  │     ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│     │  │     └─ TASK-6.12 - Prove TAG beats tables of each weaker style [To Do]
│     │  │        └─ TASK-6 - Face distinct opponents [To Do] (shown above)
│     │  └─ TASK-11.7 - Filter my trends by line-up [To Do] (shown above)
│     ├─ TASK-6.11 - Report each bot style's VPIP, PFR and aggression against its band [To Do]
│     │  ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│     │  └─ TASK-6.16 - Keep TAG and Rock bots inside their style bands [To Do]
│     │     ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│     │     └─ TASK-6.17 - Keep Calling station and Maniac bots inside their style bands [To Do]
│     │        ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│     │        ├─ TASK-6.12 - Prove TAG beats tables of each weaker style [To Do] (shown above)
│     │        └─ TASK-10.3 - See my five style stats against healthy ranges for my table size [To Do] (shown above)
│     ├─ TASK-6.13 - Compute every bot decision within 100 ms [To Do]
│     │  ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│     │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│     ├─ TASK-6.14 - Keep each bot's style fixed whatever the user does [To Do]
│     │  └─ TASK-6 - Face distinct opponents [To Do] (shown above)
│     └─ TASK-6.15 - Replay any hand with every bot acting exactly as before [To Do]
│        └─ TASK-6 - Face distinct opponents [To Do] (shown above)
├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [To Do]
│  ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  └─ TASK-6.6 - Seat bots by line-up preset with unique names [To Do] (shown above)
└─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [To Do]
   ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
   └─ TASK-6.6 - Seat bots by line-up preset with unique names [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want TAG opponents that mix their actions in borderline spots, so that they cannot be beaten by one simple trick.

Introduces the style data file format (one file per style, with a plain-English description of the style), its validator and TAG's file. A style file marks spot types as mixed and gives each allowed action a probability; a mixed spot must give at least two actions a non-zero probability. TAG plays the advice recommendation except in mixed spots, where it chooses between the recommendation and the chart cell's acceptable alternative (E07-S01), drawing from the per-seat replay-seeded generator of E06-S18. Full hand replay with every style is E06-S15.

## Requirements covered
- REQ-026 (Must): Bots built on the advice engine — Each bot shall choose its action from the advice engine's evaluation of its own view of the game, modified by its style's documented parameters.
- REQ-028 (Must): Reproducible mixed decisions — Where a bot's style gives more than one action a non-zero probability, the bot shall pick among them using a random generator derived from the hand's replay code, so that replaying a hand reproduces every bot decision.

Covers: REQ-026, REQ-028

## Notes
Store style files as JSON/TS data under src/bots/styles/.

Plan key: E06-S02 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given TAG's style data file, When it is loaded, Then it holds TAG's parameters, including its mixed spot types with the probability of each action, and a plain-English description of the style; a style file without a description fails validation naming the file [REQ-026.3]
- [ ] #2 Given a style file that marks a spot type as mixed with fewer than two actions of non-zero probability, When the style validator runs, Then validation fails naming the style and the spot type [REQ-028.3]
- [ ] #3 Given a preflop chart cell with an acceptable alternative in a spot TAG marks as mixed, When TAG acts there under 1,000 different replay codes, Then it chooses only the recommended action or the alternative, and chooses each at least once [REQ-026.1, REQ-028.3]
- [ ] #4 Given a TAG decision in a spot its file does not mark as mixed, When TAG acts under any replay code, Then it chooses the advice engine's recommended action [REQ-026.1]
- [ ] #5 Given TAG mixes between actions, When the playtest and the app play the same hand, Then the playtest TAG policy receives the same per-decision seed as the worker (TASK-6.18 D-1), and the TASK-3.6 worker-equals-headless test is updated with its owner's approval to pass real seeds
- [ ] #6 Given the bot seed is validated in two places (advice-service isSeed and engine bot-random), When TAG starts mixing, Then one shared MAX_SEED/guard is used and the lint guard also catches aliased globals (e.g. const c = crypto) in src/bots and src/advice
- [ ] #7 Given the bot-randomness lint guard, When it runs, Then it also covers src/engine/bot-random.ts and catches globalThis.Math.random() (TASK-6.18 judge J-1-01)

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
AC added from TASK-6.18 scope concern (seed plumbing for mixed TAG)

AC added from TASK-6.18 review MINOR/NIT

AC added from TASK-6.18 judge J-1-01

