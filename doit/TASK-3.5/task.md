File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-3.5 - Read-big-index-cards-drawn-in-code.md

Task TASK-3.5 - Read big-index cards drawn in code
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 14000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-17 23:22 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-0
Parent: TASK-3 - Play hands at the table
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 1 total):
└─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]

Dependents (5 direct, 121 total):
├─ TASK-3 - Play hands at the table [To Do]
├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [To Do]
│  ├─ TASK-2.1 - Start a game from Home through Game Config [To Do]
│  │  ├─ TASK-2 - Launch and set up a session [To Do]
│  │  ├─ TASK-2.2 - Choose how many players sit at the table [To Do]
│  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  └─ TASK-2.5 - Choose a line-up preset for the bots [To Do]
│  │  │     ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │     ├─ TASK-2.8 - Change the style of one bot seat [To Do]
│  │  │     │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │     │  └─ TASK-2.10 - Pre-fill Game Config from my last session [To Do]
│  │  │     │     ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │     │     ├─ TASK-12.4 - Delete all my data after confirming [To Do]
│  │  │     │     │  └─ TASK-12 - Tune the trainer [To Do]
│  │  │     │     └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do]
│  │  │     │        ├─ TASK-13 - Rely on a private offline app [To Do]
│  │  │     │        ├─ TASK-13.7 - Keep my old data intact when a migration fails [To Do]
│  │  │     │        │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │     │        │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
│  │  │     │        │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │     │        └─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do]
│  │  │     │           ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │     │           └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │     ├─ TASK-2.9 - Randomise the bot line-up [To Do]
│  │  │     │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │     └─ TASK-2.13 - Sit at a random seat with a random starting button [To Do]
│  │  │        └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  ├─ TASK-2.3 - Choose the stake for a cash game [To Do]
│  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  └─ TASK-2.4 - Choose Cash game or Sit-and-go [To Do]
│  │  │     ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │     ├─ TASK-2.10 - Pre-fill Game Config from my last session [To Do] (shown above)
│  │  │     ├─ TASK-5.1 - Start a sit-and-go where every player has 1,500 chips [To Do]
│  │  │     │  ├─ TASK-5 - Play a sit-and-go [To Do]
│  │  │     │  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do]
│  │  │     │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │     │  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do]
│  │  │     │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │     │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│  │  │     │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │     │  │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do]
│  │  │     │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │     │  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do]
│  │  │     │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │     │  │  │  └─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do]
│  │  │     │  │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │     │  │  └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
│  │  │     │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │     │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │     │  └─ TASK-5.4 - Raise the sit-and-go limits every 10 hands on the published schedule [To Do]
│  │  │     │     ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │     │     ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do]
│  │  │     │     │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │     │     │  └─ TASK-5.6 - See the level on Home's Resume entry for a paused sit-and-go [To Do]
│  │  │     │     │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │     │     └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
│  │  │     └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  ├─ TASK-2.6 - Resume a paused session from Home [To Do]
│  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  ├─ TASK-2.7 - Confirm ending a paused session before starting a new game [To Do]
│  │  │  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  ├─ TASK-2.14 - Pause the session from the Table header Home control [To Do]
│  │  │  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do] (shown above)
│  │  │  ├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do]
│  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  ├─ TASK-2.11 - Choose Rapid or Realistic speed for the session [To Do]
│  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  └─ TASK-12.5 - Choose the default speed for new sessions in Settings [To Do]
│  │  │     ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │  │     └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  ├─ TASK-2.12 - See a branded splash while the app loads [To Do]
│  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  ├─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do] (shown above)
│  │  │  ├─ TASK-13.9 - Reach Home within 3 seconds on a repeat launch [To Do]
│  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do]
│  │  │  │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  ├─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  └─ TASK-13.12 - Install TLH Trainer to the Dock from Chrome or Safari [To Do]
│  │  │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  ├─ TASK-2.15 - Practise with play money only [To Do]
│  │  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do]
│  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  ├─ TASK-2.17 - See a first-use message on Home before any session has ended [To Do]
│  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  ├─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do] (shown above)
│  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
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
│  │  └─ TASK-12.1 - Open Settings from Home and see the app version [To Do]
│  │     ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │     ├─ TASK-12.2 - Hide opponent style labels at the table [To Do]
│  │     │  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │     │  └─ TASK-12.3 - Open Settings over the table without pausing the session [To Do]
│  │     │     ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │     │     ├─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │     │     ├─ TASK-12.6 - Turn off automatic opening of the Hand Review panel [To Do]
│  │     │     │  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │     │     │  └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │     │     ├─ TASK-12.7 - Switch to a four-colour deck [To Do]
│  │     │     │  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │     │     │  └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │     │     └─ TASK-12.9 - Warn me in Settings when the browser can clear my history [To Do]
│  │     │        └─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │     ├─ TASK-12.5 - Choose the default speed for new sessions in Settings [To Do] (shown above)
│  │     └─ TASK-12.8 - Turn bot banter off [To Do]
│  │        ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │        └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  ├─ TASK-3.2 - Choose only legal actions with their exact amounts [To Do]
│  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  ├─ TASK-3.7 - Act correctly on capped streets and when short of chips [To Do]
│  │  │  └─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  ├─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do]
│  │  │  └─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  └─ TASK-8.1 - Ask for a hint and see the recommended action with its numbers and reason [To Do]
│  │     ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │     ├─ TASK-8 - Ask for a hint [To Do]
│  │     ├─ TASK-8.2 - Mark a decision as hinted when I open the hint [To Do]
│  │     │  └─ TASK-8 - Ask for a hint [To Do] (shown above)
│  │     ├─ TASK-8.3 - Get the hint card within one second [To Do]
│  │     │  ├─ TASK-8 - Ask for a hint [To Do] (shown above)
│  │     │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│  │     ├─ TASK-8.4 - See approximate and short-stack labels on the hint card [To Do]
│  │     │  └─ TASK-8 - Ask for a hint [To Do] (shown above)
│  │     ├─ TASK-13.4 - Use every screen offline after the first visit [To Do]
│  │     │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │     │  ├─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do] (shown above)
│  │     │  └─ TASK-13.9 - Reach Home within 3 seconds on a repeat launch [To Do] (shown above)
│  │     └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  ├─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [To Do]
│  │  ├─ TASK-2.14 - Pause the session from the Table header Home control [To Do] (shown above)
│  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [To Do]
│  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  ├─ TASK-3.8 - See each side pot and who wins it [To Do]
│  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  └─ TASK-4.5 - See each player's bet as chips in front of their seat [To Do]
│  │  │  │     ├─ TASK-4 - Follow the action at a glance [To Do]
│  │  │  │     ├─ TASK-4.6 - Watch deals and chip moves animate without slowing my play [To Do]
│  │  │  │     │  └─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  │  │     └─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │  ├─ TASK-3.9 - Keep a permanent record of every completed hand [To Do]
│  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  ├─ TASK-3.10 - Save the session after every hand so it can be resumed [To Do]
│  │  │  │  │  ├─ TASK-2.6 - Resume a paused session from Home [To Do] (shown above)
│  │  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  ├─ TASK-3.11 - Rebuy or leave when my stack runs out [To Do]
│  │  │  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-9.2 - Continue to rebuy or leave when I bust with the review open [To Do]
│  │  │  │  │  │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do] (shown above)
│  │  │  │  │  │  │  └─ TASK-9 - Review the hand just played [To Do]
│  │  │  │  │  │  ├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do]
│  │  │  │  │  │  │  ├─ TASK-2.7 - Confirm ending a paused session before starting a new game [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-2.15 - Practise with play money only [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-10 - Read the session report [To Do]
│  │  │  │  │  │  │  ├─ TASK-10.2 - Leave the table in the middle of a hand [To Do]
│  │  │  │  │  │  │  │  ├─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do] (shown above)
│  │  │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-10.3 - See my five style stats against healthy ranges for my table size [To Do]
│  │  │  │  │  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  │  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [To Do]
│  │  │  │  │  │  │  │  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  │  │  └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-10.5 - See my postflop leaks with evidence and a one-sentence fix [To Do]
│  │  │  │  │  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-10.6 - See my preflop leaks by position group [To Do]
│  │  │  │  │  │  │  │  │  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do] (shown above)
│  │  │  │  │  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  │  │  └─ TASK-10.8 - See my three most costly leaks first [To Do]
│  │  │  │  │  │  │  │     ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│  │  │  │  │  │  │  │     └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-10.7 - See how many of my decisions used a hint in the report [To Do]
│  │  │  │  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-10.11 - See my playing time and hands per hour in the report [To Do]
│  │  │  │  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-10.12 - See my sit-and-go finishing position in the report [To Do]
│  │  │  │  │  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do] (shown above)
│  │  │  │  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-13.3 - Stop dealing when the last hand could not be saved [To Do]
│  │  │  │  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-13.4 - Use every screen offline after the first visit [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-13.5 - Keep all my data on this device with no third-party requests [To Do]
│  │  │  │  │  │  │  │  └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  ├─ TASK-3.15 - Change speed during a session from the table [To Do]
│  │  │  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do] (shown above)
│  │  │  │  │  ├─ TASK-4.9 - See my session's playing time and hands-per-hour pace in the header [To Do]
│  │  │  │  │  │  ├─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-10.11 - See my playing time and hands per hour in the report [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-12.3 - Open Settings over the table without pausing the session [To Do] (shown above)
│  │  │  │  │  ├─ TASK-5.1 - Start a sit-and-go where every player has 1,500 chips [To Do] (shown above)
│  │  │  │  │  ├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do] (shown above)
│  │  │  │  │  ├─ TASK-12.3 - Open Settings over the table without pausing the session [To Do] (shown above)
│  │  │  │  │  ├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do] (shown above)
│  │  │  │  │  ├─ TASK-13.3 - Stop dealing when the last hand could not be saved [To Do] (shown above)
│  │  │  │  │  └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do] (shown above)
│  │  │  │  ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [To Do]
│  │  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  ├─ TASK-8.2 - Mark a decision as hinted when I open the hint [To Do] (shown above)
│  │  │  │  │  ├─ TASK-9.3 - See the numbers and reason behind each reviewed decision [To Do]
│  │  │  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-9.6 - See which reviewed decisions were hinted [To Do]
│  │  │  │  │  │  │  └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-9.8 - Get the review panel within one second of the hand ending [To Do]
│  │  │  │  │  │  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  │  │  │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-9.9 - See approximate and short-stack labels in review entries [To Do]
│  │  │  │  │  │     └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  │  ├─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [To Do] (shown above)
│  │  │  │  │  ├─ TASK-10.5 - See my postflop leaks with evidence and a one-sentence fix [To Do] (shown above)
│  │  │  │  │  ├─ TASK-10.7 - See how many of my decisions used a hint in the report [To Do] (shown above)
│  │  │  │  │  └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do] (shown above)
│  │  │  │  ├─ TASK-3.14 - See an opponent's observed VPIP, PFR and aggression on hover or tap [To Do]
│  │  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  └─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do] (shown above)
│  │  │  │  ├─ TASK-9.4 - See the hand number, my cards, position, result and replay code in the review [To Do]
│  │  │  │  │  └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  ├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do] (shown above)
│  │  │  │  ├─ TASK-11.5 - Group my trends per session or per day [To Do] (shown above)
│  │  │  │  ├─ TASK-11.7 - Filter my trends by line-up [To Do] (shown above)
│  │  │  │  ├─ TASK-13.2 - Ask the browser to keep my history on first launch [To Do]
│  │  │  │  │  └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  ├─ TASK-13.3 - Stop dealing when the last hand could not be saved [To Do] (shown above)
│  │  │  │  └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do] (shown above)
│  │  │  ├─ TASK-3.11 - Rebuy or leave when my stack runs out [To Do] (shown above)
│  │  │  ├─ TASK-3.13 - Play at Rapid bot pace [To Do]
│  │  │  │  ├─ TASK-2.11 - Choose Rapid or Realistic speed for the session [To Do] (shown above)
│  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  ├─ TASK-3.18 - Play at Realistic bot pace [To Do]
│  │  │  │  │  ├─ TASK-2.11 - Choose Rapid or Realistic speed for the session [To Do] (shown above)
│  │  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  ├─ TASK-3.15 - Change speed during a session from the table [To Do] (shown above)
│  │  │  │  │  ├─ TASK-4.2 - See a bot's in-style speech bubble after a table event [To Do]
│  │  │  │  │  │  ├─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-4.8 - Keep bot banter rare and free of hidden information [To Do]
│  │  │  │  │  │  │  └─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-12.8 - Turn bot banter off [To Do] (shown above)
│  │  │  │  │  ├─ TASK-4.6 - Watch deals and chip moves animate without slowing my play [To Do] (shown above)
│  │  │  │  │  └─ TASK-12.3 - Open Settings over the table without pausing the session [To Do] (shown above)
│  │  │  │  ├─ TASK-4.2 - See a bot's in-style speech bubble after a table event [To Do] (shown above)
│  │  │  │  └─ TASK-4.6 - Watch deals and chip moves animate without slowing my play [To Do] (shown above)
│  │  │  ├─ TASK-4.5 - See each player's bet as chips in front of their seat [To Do] (shown above)
│  │  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do] (shown above)
│  │  │  ├─ TASK-9.1 - Review each decision of the hand I just played [To Do]
│  │  │  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  ├─ TASK-9.2 - Continue to rebuy or leave when I bust with the review open [To Do] (shown above)
│  │  │  │  ├─ TASK-9.3 - See the numbers and reason behind each reviewed decision [To Do] (shown above)
│  │  │  │  ├─ TASK-9.4 - See the hand number, my cards, position, result and replay code in the review [To Do] (shown above)
│  │  │  │  ├─ TASK-9.5 - See opponents' cards in the review only when they were shown at showdown [To Do]
│  │  │  │  │  └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  ├─ TASK-9.7 - See a grade summary badge after each hand when auto-open is off [To Do]
│  │  │  │  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  │  └─ TASK-12.6 - Turn off automatic opening of the Hand Review panel [To Do] (shown above)
│  │  │  │  ├─ TASK-13.4 - Use every screen offline after the first visit [To Do] (shown above)
│  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  └─ TASK-12.3 - Open Settings over the table without pausing the session [To Do] (shown above)
│  │  ├─ TASK-3.14 - See an opponent's observed VPIP, PFR and aggression on hover or tap [To Do] (shown above)
│  │  ├─ TASK-3.16 - Play on a branded table that fits a 1280 x 720 window [To Do]
│  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  └─ TASK-4.4 - Play on a table, rail, chips and dealer button drawn in code [To Do]
│  │  │     ├─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  │     ├─ TASK-4.5 - See each player's bet as chips in front of their seat [To Do] (shown above)
│  │  │     └─ TASK-13.12 - Install TLH Trainer to the Dock from Chrome or Safari [To Do] (shown above)
│  │  ├─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do] (shown above)
│  │  ├─ TASK-3.19 - Read every amount as US dollars in English [To Do]
│  │  │  └─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  ├─ TASK-4.1 - Follow every action of the hand in an action log [To Do]
│  │  │  ├─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  │  ├─ TASK-4.3 - Keep the action log collapsed or expanded as I left it [To Do]
│  │  │  │  ├─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  │  │  ├─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  │  │  └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do] (shown above)
│  │  │  └─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  ├─ TASK-4.7 - Recognise each bot by an initials avatar badge [To Do]
│  │  │  └─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  ├─ TASK-4.9 - See my session's playing time and hands-per-hour pace in the header [To Do] (shown above)
│  │  ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do] (shown above)
│  │  ├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do] (shown above)
│  │  └─ TASK-12.2 - Hide opponent style labels at the table [To Do] (shown above)
│  └─ TASK-3.6 - Keep the table responsive while bots and advice compute [To Do]
│     ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│     ├─ TASK-8.1 - Ask for a hint and see the recommended action with its numbers and reason [To Do] (shown above)
│     ├─ TASK-9.3 - See the numbers and reason behind each reviewed decision [To Do] (shown above)
│     └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
├─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [To Do] (shown above)
├─ TASK-3.16 - Play on a branded table that fits a 1280 x 720 window [To Do] (shown above)
└─ TASK-12.7 - Switch to a four-colour deck [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want big-index cards drawn in code, so that I can read every card instantly even at Rapid speed.

All cards are SVG drawn in code in a big-index style: rank plus a large suit symbol, no face-card illustrations. Rank characters at least 24 CSS px tall at 1280 x 720. Two-colour deck: hearts and diamonds red, spades and clubs black. Four-colour deck (the Settings toggle REQ-050.4 is E12): clubs green, diamonds blue, hearts red, spades black. Card backs show the TLH logo (dreams/limit-holdem-trainer/brand/tlh-logo.jpg, the only image asset). Built first in M1 as a standalone card component (no table needed) so the tracer E03-S01 and the seat display E03-S03 can show cards.

## Requirements covered
- REQ-066 (Must): Card rendering — TLH Trainer shall draw all playing cards in code as SVG in a big-index style showing a large rank and suit, with a card back that shows the TLH logo.

Covers: REQ-066

Plan key: E03-S05 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given all 52 card faces, When each is rendered, Then it shows its rank and a large suit symbol and contains no illustration image [REQ-066.1]
- [ ] #2 Given a card rendered at the size used for the user's hole cards and the board at a 1280 x 720 window, When its rank characters are measured, Then each is at least 24 CSS px tall [REQ-066.2]
- [ ] #3 Given two-colour deck mode, When all 52 faces are rendered, Then hearts and diamonds are red and spades and clubs are black [REQ-066.3]
- [ ] #4 Given four-colour deck mode, When all 52 faces are rendered, Then clubs are green, diamonds blue, hearts red and spades black [REQ-066.3]
- [ ] #5 Given a card back is rendered, When it is shown, Then it shows the TLH logo [REQ-066.4]

Definition of Done:
--------------------------------------------------
- [ ] #1 Playwright visual snapshot of all 52 faces in both deck modes and of the card back [REQ-066.1, REQ-066.3, REQ-066.4]
- [ ] #2 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [ ] #3 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [ ] #4 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [ ] #5 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [ ] #6 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [ ] #7 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [ ] #8 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [ ] #9 No new network requests beyond the app's own files [REQ-058.1]
- [ ] #10 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [ ] #11 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [ ] #12 Story documentation is written and published to Backlog.md
- [ ] #13 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled

