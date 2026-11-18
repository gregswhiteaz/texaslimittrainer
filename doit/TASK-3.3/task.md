File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-3.3 - See-every-seat-the-board-the-pot-and-the-button-at-a-glance.md

Task TASK-3.3 - See every seat, the board, the pot and the button at a glance
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 18000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-18 21:33 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-0
Parent: TASK-3 - Play hands at the table
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (2 direct, 13 total):
├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
│  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│  │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│  │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│  │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│  │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│  │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│  │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
│  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
│  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
│     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
│     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
│     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
│        ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
│        │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
│        └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
└─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)

Dependents (13 direct, 102 total):
├─ TASK-2.14 - Pause the session from the Table header Home control [To Do]
│  └─ TASK-2 - Launch and set up a session [To Do]
├─ TASK-3 - Play hands at the table [To Do]
├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [To Do]
│  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  ├─ TASK-3.8 - See each side pot and who wins it [To Do]
│  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  └─ TASK-4.5 - See each player's bet as chips in front of their seat [To Do]
│  │     ├─ TASK-4 - Follow the action at a glance [To Do]
│  │     ├─ TASK-4.6 - Watch deals and chip moves animate without slowing my play [To Do]
│  │     │  └─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │     └─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│  │        └─ TASK-5 - Play a sit-and-go [To Do]
│  ├─ TASK-3.9 - Keep a permanent record of every completed hand [To Do]
│  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  ├─ TASK-3.10 - Save the session after every hand so it can be resumed [To Do]
│  │  │  ├─ TASK-2.6 - Resume a paused session from Home [To Do]
│  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  ├─ TASK-2.7 - Confirm ending a paused session before starting a new game [To Do]
│  │  │  │  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  ├─ TASK-2.14 - Pause the session from the Table header Home control [To Do] (shown above)
│  │  │  │  ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do]
│  │  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  └─ TASK-5.6 - See the level on Home's Resume entry for a paused sit-and-go [To Do]
│  │  │  │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  ├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do]
│  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do]
│  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
│  │  │  │  │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  ├─ TASK-3.11 - Rebuy or leave when my stack runs out [To Do]
│  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  ├─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do]
│  │  │  │  │  └─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  ├─ TASK-9.2 - Continue to rebuy or leave when I bust with the review open [To Do]
│  │  │  │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do]
│  │  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  └─ TASK-9 - Review the hand just played [To Do]
│  │  │  │  ├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do]
│  │  │  │  │  ├─ TASK-2.7 - Confirm ending a paused session before starting a new game [To Do] (shown above)
│  │  │  │  │  ├─ TASK-2.15 - Practise with play money only [To Do]
│  │  │  │  │  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do]
│  │  │  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-2.17 - See a first-use message on Home before any session has ended [To Do]
│  │  │  │  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-12.4 - Delete all my data after confirming [To Do]
│  │  │  │  │  │  │  │  └─ TASK-12 - Tune the trainer [To Do]
│  │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do]
│  │  │  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  ├─ TASK-10 - Read the session report [To Do]
│  │  │  │  │  ├─ TASK-10.2 - Leave the table in the middle of a hand [To Do]
│  │  │  │  │  │  ├─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do]
│  │  │  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do]
│  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do]
│  │  │  │  │  │  │  ├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do]
│  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do]
│  │  │  │  │  │  │  │     └─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-11.3 - See the G-2 target line on my Major-error trend [To Do]
│  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  └─ TASK-11.11 - See whether I met the G-2 goal after 5,000 hands [To Do]
│  │  │  │  │  │  │  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │     └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-11.4 - Filter my trends by table size and game type [To Do]
│  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-11.5 - Group my trends per session or per day [To Do]
│  │  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do]
│  │  │  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  │  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-11.7 - Filter my trends by line-up [To Do]
│  │  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do]
│  │  │  │  │  │  │  │  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  │     └─ TASK-11.10 - See my style stats separately for each table size I played [To Do]
│  │  │  │  │  │  │  │  │        ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  │        └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  │  │  │  └─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-11.5 - Group my trends per session or per day [To Do] (shown above)
│  │  │  │  │  │  │  └─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do]
│  │  │  │  │  │  │     └─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  ├─ TASK-10.3 - See my five style stats against healthy ranges for my table size [To Do]
│  │  │  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do] (shown above)
│  │  │  │  │  ├─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [To Do]
│  │  │  │  │  │  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do] (shown above)
│  │  │  │  │  ├─ TASK-10.5 - See my postflop leaks with evidence and a one-sentence fix [To Do]
│  │  │  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-10.6 - See my preflop leaks by position group [To Do]
│  │  │  │  │  │  │  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do]
│  │  │  │  │  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do]
│  │  │  │  │  │  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do] (shown above)
│  │  │  │  │  │  │  │  │  └─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do] (shown above)
│  │  │  │  │  │  │  │  └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
│  │  │  │  │  │  │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-10.8 - See my three most costly leaks first [To Do]
│  │  │  │  │  │     ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│  │  │  │  │  │     └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  ├─ TASK-10.7 - See how many of my decisions used a hint in the report [To Do]
│  │  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  ├─ TASK-10.11 - See my playing time and hands per hour in the report [To Do]
│  │  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  ├─ TASK-10.12 - See my sit-and-go finishing position in the report [To Do]
│  │  │  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  ├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do] (shown above)
│  │  │  │  │  ├─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do] (shown above)
│  │  │  │  │  ├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do] (shown above)
│  │  │  │  │  ├─ TASK-13.3 - Stop dealing when the last hand could not be saved [To Do]
│  │  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  ├─ TASK-13.4 - Use every screen offline after the first visit [To Do]
│  │  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do]
│  │  │  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-13.9 - Reach Home within 3 seconds on a repeat launch [To Do]
│  │  │  │  │  │     ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  │     └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do]
│  │  │  │  │  │        └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  ├─ TASK-13.5 - Keep all my data on this device with no third-party requests [To Do]
│  │  │  │  │  │  └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  ├─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do]
│  │  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-13.7 - Keep my old data intact when a migration fails [To Do]
│  │  │  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do] (shown above)
│  │  │  │  │  ├─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  ├─ TASK-3.15 - Change speed during a session from the table [To Do]
│  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  └─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do] (shown above)
│  │  │  ├─ TASK-4.9 - See my session's playing time and hands-per-hour pace in the header [To Do]
│  │  │  │  ├─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  │  │  ├─ TASK-10.11 - See my playing time and hands per hour in the report [To Do] (shown above)
│  │  │  │  └─ TASK-12.3 - Open Settings over the table without pausing the session [To Do]
│  │  │  │     ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │  │  │     ├─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  │  │     ├─ TASK-12.6 - Turn off automatic opening of the Hand Review panel [To Do]
│  │  │  │     │  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │  │  │     │  └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  │  │     ├─ TASK-12.7 - Switch to a four-colour deck [To Do]
│  │  │  │     │  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │  │  │     │  └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  │  │     └─ TASK-12.9 - Warn me in Settings when the browser can clear my history [To Do]
│  │  │  │        └─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │  │  ├─ TASK-5.1 - Start a sit-and-go where every player has 1,500 chips [To Do]
│  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do] (shown above)
│  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │  │  └─ TASK-5.4 - Raise the sit-and-go limits every 10 hands on the published schedule [To Do]
│  │  │  │     ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │     ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do] (shown above)
│  │  │  │     └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
│  │  │  ├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do] (shown above)
│  │  │  ├─ TASK-12.3 - Open Settings over the table without pausing the session [To Do] (shown above)
│  │  │  ├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do] (shown above)
│  │  │  ├─ TASK-13.3 - Stop dealing when the last hand could not be saved [To Do] (shown above)
│  │  │  └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do] (shown above)
│  │  ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [To Do]
│  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  ├─ TASK-8.2 - Mark a decision as hinted when I open the hint [To Do]
│  │  │  │  └─ TASK-8 - Ask for a hint [To Do]
│  │  │  ├─ TASK-9.3 - See the numbers and reason behind each reviewed decision [To Do]
│  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  ├─ TASK-9.6 - See which reviewed decisions were hinted [To Do]
│  │  │  │  │  └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  ├─ TASK-9.8 - Get the review panel within one second of the hand ending [To Do]
│  │  │  │  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│  │  │  │  └─ TASK-9.9 - See approximate and short-stack labels in review entries [To Do]
│  │  │  │     └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  ├─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [To Do] (shown above)
│  │  │  ├─ TASK-10.5 - See my postflop leaks with evidence and a one-sentence fix [To Do] (shown above)
│  │  │  ├─ TASK-10.7 - See how many of my decisions used a hint in the report [To Do] (shown above)
│  │  │  └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do] (shown above)
│  │  ├─ TASK-3.14 - See an opponent's observed VPIP, PFR and aggression on hover or tap [To Do]
│  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  └─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do] (shown above)
│  │  ├─ TASK-9.4 - See the hand number, my cards, position, result and replay code in the review [To Do]
│  │  │  └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  ├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do] (shown above)
│  │  ├─ TASK-11.5 - Group my trends per session or per day [To Do] (shown above)
│  │  ├─ TASK-11.7 - Filter my trends by line-up [To Do] (shown above)
│  │  ├─ TASK-13.2 - Ask the browser to keep my history on first launch [To Do]
│  │  │  └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  ├─ TASK-13.3 - Stop dealing when the last hand could not be saved [To Do] (shown above)
│  │  └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do] (shown above)
│  ├─ TASK-3.11 - Rebuy or leave when my stack runs out [To Do] (shown above)
│  ├─ TASK-3.13 - Play at Rapid bot pace [To Do]
│  │  ├─ TASK-2.11 - Choose Rapid or Realistic speed for the session [To Do]
│  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  └─ TASK-12.5 - Choose the default speed for new sessions in Settings [To Do]
│  │  │     ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │  │     └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  ├─ TASK-3.18 - Play at Realistic bot pace [To Do]
│  │  │  ├─ TASK-2.11 - Choose Rapid or Realistic speed for the session [To Do] (shown above)
│  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  ├─ TASK-3.15 - Change speed during a session from the table [To Do] (shown above)
│  │  │  ├─ TASK-4.2 - See a bot's in-style speech bubble after a table event [To Do]
│  │  │  │  ├─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  │  │  ├─ TASK-4.8 - Keep bot banter rare and free of hidden information [To Do]
│  │  │  │  │  └─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  │  │  └─ TASK-12.8 - Turn bot banter off [To Do]
│  │  │  │     ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │  │  │     └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  │  ├─ TASK-4.6 - Watch deals and chip moves animate without slowing my play [To Do] (shown above)
│  │  │  └─ TASK-12.3 - Open Settings over the table without pausing the session [To Do] (shown above)
│  │  ├─ TASK-4.2 - See a bot's in-style speech bubble after a table event [To Do] (shown above)
│  │  └─ TASK-4.6 - Watch deals and chip moves animate without slowing my play [To Do] (shown above)
│  ├─ TASK-4.5 - See each player's bet as chips in front of their seat [To Do] (shown above)
│  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do] (shown above)
│  ├─ TASK-9.1 - Review each decision of the hand I just played [To Do]
│  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  ├─ TASK-9.2 - Continue to rebuy or leave when I bust with the review open [To Do] (shown above)
│  │  ├─ TASK-9.3 - See the numbers and reason behind each reviewed decision [To Do] (shown above)
│  │  ├─ TASK-9.4 - See the hand number, my cards, position, result and replay code in the review [To Do] (shown above)
│  │  ├─ TASK-9.5 - See opponents' cards in the review only when they were shown at showdown [To Do]
│  │  │  └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  ├─ TASK-9.7 - See a grade summary badge after each hand when auto-open is off [To Do]
│  │  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  └─ TASK-12.6 - Turn off automatic opening of the Hand Review panel [To Do] (shown above)
│  │  ├─ TASK-13.4 - Use every screen offline after the first visit [To Do] (shown above)
│  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  └─ TASK-12.3 - Open Settings over the table without pausing the session [To Do] (shown above)
├─ TASK-3.14 - See an opponent's observed VPIP, PFR and aggression on hover or tap [To Do] (shown above)
├─ TASK-3.16 - Play on a branded table that fits a 1280 x 720 window [To Do]
│  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  └─ TASK-4.4 - Play on a table, rail, chips and dealer button drawn in code [To Do]
│     ├─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│     ├─ TASK-4.5 - See each player's bet as chips in front of their seat [To Do] (shown above)
│     └─ TASK-13.12 - Install TLH Trainer to the Dock from Chrome or Safari [To Do]
│        └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
├─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do] (shown above)
├─ TASK-3.19 - Read every amount as US dollars in English [To Do]
│  └─ TASK-3 - Play hands at the table [To Do] (shown above)
├─ TASK-4.1 - Follow every action of the hand in an action log [To Do]
│  ├─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  ├─ TASK-4.3 - Keep the action log collapsed or expanded as I left it [To Do]
│  │  ├─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  ├─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do] (shown above)
│  └─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
├─ TASK-4.7 - Recognise each bot by an initials avatar badge [To Do]
│  └─ TASK-4 - Follow the action at a glance [To Do] (shown above)
├─ TASK-4.9 - See my session's playing time and hands-per-hour pace in the header [To Do] (shown above)
├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do] (shown above)
├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do] (shown above)
└─ TASK-12.2 - Hide opponent style labels at the table [To Do]
   ├─ TASK-12 - Tune the trainer [To Do] (shown above)
   └─ TASK-12.3 - Open Settings over the table without pausing the session [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want to read the whole table state at a glance, so that I can follow the hand and read the situation before I act.

Each bot seat shows name, style label (hiding labels via Settings is E12, REQ-021.2), stack, chips put in on the current street, last action and a card-back marker while it holds cards. The user's seat (always drawn at the bottom centre whatever its seat number, REQ-010.3) shows both hole cards face up, stack and position name (e.g. Cutoff, Button, Small blind, Big blind, Under the gun, Hijack at 6-max). The board shows dealt cards and empty placeholders for undealt ones. The pot total is shown (separate side pots are E03-S07). The dealer button marker sits at the button seat; the seat to act is highlighted. The header shows game type, players, stake and hand number (e.g. "Cash · 6 players · $4/$8 · Hand #133") and a Leave table control. The replay code must not appear anywhere before the hand ends (E09 shows it in the review).

## Requirements covered
- REQ-010 (Should): User seat and starting dealer button — When a session starts, TLH Trainer shall seat the user at a seat chosen at random and place the dealer button at a seat chosen at random.
- REQ-013 (Must): Deck, shuffle and replay code — For every hand, the engine shall shuffle a standard 52-card deck with a Fisher–Yates shuffle driven by a pseudo-random generator seeded from a cryptographically secure random source, and shall record that seed as the hand's replay code.
- REQ-021 (Must): Table display — The Table screen shall show, for every seat, the player name, style label (unless hidden in Settings), stack, chips put in on the current street, last action and whether the player still holds cards, together with the board, the pot total, the dealer button and which player is to act.

Covers: REQ-010, REQ-013, REQ-021

## Notes
E05 adds the SNG level in the header in place of the stake. E04 adds chip art, chips in front of seats, avatars and the action log on top of these seat fields. E10 wires Leave table to end the session and open the Session Report (REQ-004.5).

Plan key: E03-S03 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a scripted 6-max $4/$8 hand on the flop where bot Ben (Calling station) has $146 and bet $4, When the table is shown, Then Ben's seat shows "Ben", "Calling station", "$146", "$4" put in this street, last action "Bet $4" and a card-back marker [REQ-021.1]
- [ ] #2 Given a bot that has folded, When the table is shown, Then its seat shows last action "Folded" and no card-back marker [REQ-021.1]
- [ ] #3 Given the user holds seat 5 of 6 in the cutoff with $184 and, in a second session, seat 1, When each table is drawn, Then the user's seat is at the bottom centre in both and in the first shows both hole cards face up, "$184" and the position name "Cutoff" [REQ-010.3, REQ-021.3]
- [ ] #4 Given the preflop, flop, turn and river of a scripted hand, When the board is shown, Then it shows 0, 3, 4 and 5 dealt cards respectively and an empty placeholder for each undealt card up to 5 [REQ-021.4]
- [ ] #5 Given a scripted hand at each street, When the table is shown, Then the pot total equals the chips collected from previous streets plus the current-street amounts and the dealer button marker is at the button seat [REQ-021.5, REQ-021.6]
- [ ] #6 Given a scripted hand, When each player becomes the player to act, Then exactly that player's seat is highlighted [REQ-021.7]
- [ ] #7 Given hand 133 of a 6-player $4/$8 cash session, When the table is shown, Then the header reads game type "Cash", "6 players", "$4/$8" and "Hand #133" and offers a Leave table control [REQ-021.8]
- [ ] #8 Given a hand in progress at every street, When the Table screen's text and accessible names are searched, Then the hand's replay code appears nowhere [REQ-013.4]
- [ ] #9 Given a bot seat holding face-down cards, When the table renders, Then the seat shows a smaller CardBack marker that still shows the logo and passes axe
- [ ] #10 Given the full seat and header display, When a player acts or is to act, Then the last action and the player to act are shown as visible text, and the TASK-3.1 data-street/data-to-act/data-action-count test hooks are replaced where visible text covers them

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
AC added from TASK-3.5 follow-up (doc-20).

AC added from TASK-3.1 follow-up (doc-21).

