File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.1 - Face-TAG-bots-that-act-from-the-advice-engine.md

Task TASK-6.1 - Face TAG bots that act from the advice engine
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 12000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-18 19:10 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-0
Parent: TASK-6 - Face distinct opponents
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (3 direct, 10 total):
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

Dependents (3 direct, 139 total):
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
│  ├─ TASK-3 - Play hands at the table [To Do]
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
├─ TASK-6 - Face distinct opponents [To Do]
└─ TASK-6.18 - Draw bot randomness only from the replay code and seat [To Do]
   ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
   └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [To Do]
      ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
      ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [To Do]
      │  ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
      │  └─ TASK-6.6 - Seat bots by line-up preset with unique names [To Do]
      │     ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
      │     ├─ TASK-6.7 - Record an edited line-up as Custom [To Do]
      │     │  ├─ TASK-2.5 - Choose a line-up preset for the bots [To Do] (shown above)
      │     │  ├─ TASK-3.9 - Keep a permanent record of every completed hand [To Do] (shown above)
      │     │  ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
      │     │  ├─ TASK-6.8 - Replace a busted bot with a new bot from the line-up preset [To Do]
      │     │  │  ├─ TASK-3.9 - Keep a permanent record of every completed hand [To Do] (shown above)
      │     │  │  ├─ TASK-4.2 - See a bot's in-style speech bubble after a table event [To Do] (shown above)
      │     │  │  ├─ TASK-4.7 - Recognise each bot by an initials avatar badge [To Do] (shown above)
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
As a learner, I want TAG opponents that choose their actions from the advice engine's evaluation of their own view, so that I practise against sound, consistent fixed-limit play from the first hand.

Thinnest bot slice for the walking skeleton. A bot is a decision function: PlayerView (E01-S06) in, one legal action out. The TAG bot asks the advice engine for its recommendation (6-max preflop chart, E07-S01; postflop call/fold from equity and pot odds, E07-S03) and plays it. Advice recommendations are always legal (a raise on a capped street becomes call; a call with nothing to call becomes check). In this slice TAG always plays the main recommendation; the mixing rule (REQ-028) that sometimes picks the chart's acceptable alternative arrives in E06-S02. The playtest CLI (E01-S07) seats TAG bots in every seat instead of the seeded random-legal-move policy, and the Table screen (E03) seats them opposite the user.

## Requirements covered
- REQ-025 (Must): No hidden-information leakage — The engine shall give each bot, the advice engine and the grader only the information the acting player could see at that moment: their own hole cards, the board, all actions and stacks, and cards shown at earlier showdowns.
- REQ-026 (Must): Bots built on the advice engine — Each bot shall choose its action from the advice engine's evaluation of its own view of the game, modified by its style's documented parameters.
- REQ-056 (Must): Reliability and invariants — The engine shall complete 1,000,000 headless hands across all table sizes, game types and line-ups with zero invariant violations, and the app shall recover from an unexpected error without losing completed hands.

Covers: REQ-025, REQ-026, REQ-056

## Notes
Suggested API: decide(view: PlayerView, style: StyleParams, rng: SeededRng) -> Action in src/bots. The bot calls the same advice API as hints, never a separate strategy. E03 seats these bots at the default 6-max $4/$8 table.

Plan key: E06-S01 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a TAG bot at a 6-max preflop decision, When it acts, Then its action is the 6-max chart recommendation for its hand class, position and situation [REQ-026.1]
- [ ] #2 Given a TAG bot at a postflop decision facing a bet, When the advice engine recommends call, Then the bot calls, and When it recommends fold, Then the bot folds [REQ-026.1]
- [ ] #3 Given a TAG bot at a postflop decision with no bet to face, When the advice engine recommends check, Then the bot checks [REQ-026.1]
- [ ] #4 Given a fixed TAG decision point, When the other players' hole cards and the undealt cards are changed, Then the TAG bot's action is identical [REQ-025.1]
- [ ] #5 Given `npm run playtest -- --hands 10000 --seed 42`, When it runs, Then every seat is a TAG bot acting from the advice engine, every bot action is in the legal set, zero invariant violations are reported and it exits 0 [REQ-026.1, REQ-056.1]
- [ ] #6 Given a TAG bot seat in the playtest, When it decides, Then it acts through recommend(view) on every street and returns the recommendation's move

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
AC added from TASK-7.3 follow-up (doc-17).

