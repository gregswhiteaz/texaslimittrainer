File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.7 - Run-every-check-in-GitHub-Actions-on-each-push-and-pull-request.md

Task TASK-1.7 - Run every check in GitHub Actions on each push and pull request
==================================================

Status: ◒ In Progress
Priority: High
Type: chore
Ordinal: 2000
Assignee: @claude
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-18 01:09 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 1 total):
└─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]

Dependents (4 direct, 175 total):
├─ TASK-1 - Prove the game headlessly [To Do]
├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [To Do]
│  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  ├─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [To Do]
│  │  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [To Do]
│  │  │  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  │  │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [To Do]
│  │  │  │  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  │  │  │  ├─ TASK-1.8 - Check game invariants after every playtest action [To Do]
│  │  │  │  │  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  │  │  │  │  ├─ TASK-1.9 - Let a short-stacked player call all-in [To Do]
│  │  │  │  │  │  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-1.10 - Split the pot into side pots for unequal all-ins [To Do]
│  │  │  │  │  │  │  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-1.15 - Show and muck cards at showdown in casino order [To Do]
│  │  │  │  │  │  │  │  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-1.16 - Move the button and blinds past busted seats [To Do]
│  │  │  │  │  │  │  │  │  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-1.17 - Prove the engine with a 1,000,000-hand invariant run [To Do]
│  │  │  │  │  │  │  │  │  │  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  ├─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
│  │  │  │  │  │  │  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do]
│  │  │  │  │  │  │  │  │  │  └─ TASK-6.9 - Prove the engine over 1,000,000 cash hands with every line-up preset [To Do]
│  │  │  │  │  │  │  │  │  │     ├─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │     └─ TASK-6 - Face distinct opponents [To Do]
│  │  │  │  │  │  │  │  │  ├─ TASK-3.7 - Act correctly on capped streets and when short of chips [To Do]
│  │  │  │  │  │  │  │  │  │  └─ TASK-3 - Play hands at the table [To Do]
│  │  │  │  │  │  │  │  │  └─ TASK-5.1 - Start a sit-and-go where every player has 1,500 chips [To Do]
│  │  │  │  │  │  │  │  │     ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  │  │  │     ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do]
│  │  │  │  │  │  │  │  │     │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  │  │  │     │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do]
│  │  │  │  │  │  │  │  │     │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  │  │  │     │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│  │  │  │  │  │  │  │  │     │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  │  │  │     │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do]
│  │  │  │  │  │  │  │  │     │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  │  │  │     │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do]
│  │  │  │  │  │  │  │  │     │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  │  │  │     │  │  └─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do]
│  │  │  │  │  │  │  │  │     │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  │  │  │     │  └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
│  │  │  │  │  │  │  │  │     ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │  │  │  │  │  │  │     └─ TASK-5.4 - Raise the sit-and-go limits every 10 hands on the published schedule [To Do]
│  │  │  │  │  │  │  │  │        ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  │  │  │        ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do]
│  │  │  │  │  │  │  │  │        │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  │  │  │        │  └─ TASK-5.6 - See the level on Home's Resume entry for a paused sit-and-go [To Do]
│  │  │  │  │  │  │  │  │        │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  │  │  │        └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-1.17 - Prove the engine with a 1,000,000-hand invariant run [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-3.9 - Keep a permanent record of every completed hand [To Do]
│  │  │  │  │  │  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-3.10 - Save the session after every hand so it can be resumed [To Do]
│  │  │  │  │  │  │  │  │  │  ├─ TASK-2.6 - Resume a paused session from Home [To Do]
│  │  │  │  │  │  │  │  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do]
│  │  │  │  │  │  │  │  │  │  │  ├─ TASK-2.7 - Confirm ending a paused session before starting a new game [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  ├─ TASK-2.14 - Pause the session from the Table header Home control [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  ├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
│  │  │  │  │  │  │  │  │  │  │  │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  ├─ TASK-3.11 - Rebuy or leave when my stack runs out [To Do]
│  │  │  │  │  │  │  │  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  ├─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  ├─ TASK-9.2 - Continue to rebuy or leave when I bust with the review open [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-9 - Review the hand just played [To Do]
│  │  │  │  │  │  │  │  │  │  │  ├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-2.7 - Confirm ending a paused session before starting a new game [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-2.15 - Practise with play money only [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-2.17 - See a first-use message on Home before any session has ended [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-12.4 - Delete all my data after confirming [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-12 - Tune the trainer [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-10 - Read the session report [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-10.2 - Leave the table in the middle of a hand [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │     └─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-11.3 - See the G-2 target line on my Major-error trend [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-11.11 - See whether I met the G-2 goal after 5,000 hands [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │     └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-11.4 - Filter my trends by table size and game type [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-11.5 - Group my trends per session or per day [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-11.7 - Filter my trends by line-up [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │     └─ TASK-11.10 - See my style stats separately for each table size I played [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │        ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │        └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-11.5 - Group my trends per session or per day [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  │     └─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-10.3 - See my five style stats against healthy ranges for my table size [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-10.5 - See my postflop leaks with evidence and a one-sentence fix [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-10.6 - See my preflop leaks by position group [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-10.8 - See my three most costly leaks first [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │     ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │     └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-10.7 - See how many of my decisions used a hint in the report [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-10.11 - See my playing time and hands per hour in the report [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-10.12 - See my sit-and-go finishing position in the report [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-13.3 - Stop dealing when the last hand could not be saved [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-13.4 - Use every screen offline after the first visit [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-13.9 - Reach Home within 3 seconds on a repeat launch [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │     ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │     └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │        └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-13.5 - Keep all my data on this device with no third-party requests [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-13.7 - Keep my old data intact when a migration fails [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  ├─ TASK-3.15 - Change speed during a session from the table [To Do]
│  │  │  │  │  │  │  │  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  └─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  ├─ TASK-4.9 - See my session's playing time and hands-per-hour pace in the header [To Do]
│  │  │  │  │  │  │  │  │  │  │  ├─ TASK-4 - Follow the action at a glance [To Do]
│  │  │  │  │  │  │  │  │  │  │  ├─ TASK-10.11 - See my playing time and hands per hour in the report [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  └─ TASK-12.3 - Open Settings over the table without pausing the session [To Do]
│  │  │  │  │  │  │  │  │  │  │     ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │     ├─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │     ├─ TASK-12.6 - Turn off automatic opening of the Hand Review panel [To Do]
│  │  │  │  │  │  │  │  │  │  │     │  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │     │  └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │     ├─ TASK-12.7 - Switch to a four-colour deck [To Do]
│  │  │  │  │  │  │  │  │  │  │     │  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │     │  └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │     └─ TASK-12.9 - Warn me in Settings when the browser can clear my history [To Do]
│  │  │  │  │  │  │  │  │  │  │        └─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  ├─ TASK-5.1 - Start a sit-and-go where every player has 1,500 chips [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  ├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  ├─ TASK-12.3 - Open Settings over the table without pausing the session [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  ├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  ├─ TASK-13.3 - Stop dealing when the last hand could not be saved [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [To Do]
│  │  │  │  │  │  │  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  ├─ TASK-8.2 - Mark a decision as hinted when I open the hint [To Do]
│  │  │  │  │  │  │  │  │  │  │  └─ TASK-8 - Ask for a hint [To Do]
│  │  │  │  │  │  │  │  │  │  ├─ TASK-9.3 - See the numbers and reason behind each reviewed decision [To Do]
│  │  │  │  │  │  │  │  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  ├─ TASK-9.6 - See which reviewed decisions were hinted [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  ├─ TASK-9.8 - Get the review panel within one second of the hand ending [To Do]
│  │  │  │  │  │  │  │  │  │  │  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  │  └─ TASK-9.9 - See approximate and short-stack labels in review entries [To Do]
│  │  │  │  │  │  │  │  │  │  │     └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  ├─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  ├─ TASK-10.5 - See my postflop leaks with evidence and a one-sentence fix [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  ├─ TASK-10.7 - See how many of my decisions used a hint in the report [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-3.14 - See an opponent's observed VPIP, PFR and aggression on hover or tap [To Do]
│  │  │  │  │  │  │  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  └─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-9.4 - See the hand number, my cards, position, result and replay code in the review [To Do]
│  │  │  │  │  │  │  │  │  │  └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-11.5 - Group my trends per session or per day [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-11.7 - Filter my trends by line-up [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-13.2 - Ask the browser to keep my history on first launch [To Do]
│  │  │  │  │  │  │  │  │  │  └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-13.3 - Stop dealing when the last hand could not be saved [To Do] (shown above)
│  │  │  │  │  │  │  │  │  └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do] (shown above)
│  │  │  │  │  │  │  │  └─ TASK-9.5 - See opponents' cards in the review only when they were shown at showdown [To Do]
│  │  │  │  │  │  │  │     └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-1.16 - Move the button and blinds past busted seats [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-1.17 - Prove the engine with a 1,000,000-hand invariant run [To Do] (shown above)
│  │  │  │  │  │  │  └─ TASK-3.8 - See each side pot and who wins it [To Do]
│  │  │  │  │  │  │     ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  │  │     └─ TASK-4.5 - See each player's bet as chips in front of their seat [To Do]
│  │  │  │  │  │  │        ├─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  │  │  │  │  │        ├─ TASK-4.6 - Watch deals and chip moves animate without slowing my play [To Do]
│  │  │  │  │  │  │        │  └─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  │  │  │  │  │        └─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-1.14 - Allow short all-in bets and raises under the half-bet reopening rule [To Do]
│  │  │  │  │  │  │  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-1.16 - Move the button and blinds past busted seats [To Do] (shown above)
│  │  │  │  │  │  │  └─ TASK-1.17 - Prove the engine with a 1,000,000-hand invariant run [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-1.16 - Move the button and blinds past busted seats [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-3.7 - Act correctly on capped streets and when short of chips [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-3.18 - Play at Realistic bot pace [To Do]
│  │  │  │  │  │     ├─ TASK-2.11 - Choose Rapid or Realistic speed for the session [To Do]
│  │  │  │  │  │     │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  │     │  └─ TASK-12.5 - Choose the default speed for new sessions in Settings [To Do]
│  │  │  │  │  │     │     ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │  │  │  │  │     │     └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  │  │  │  │     ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  │     ├─ TASK-3.15 - Change speed during a session from the table [To Do] (shown above)
│  │  │  │  │  │     ├─ TASK-4.2 - See a bot's in-style speech bubble after a table event [To Do]
│  │  │  │  │  │     │  ├─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  │  │  │  │     │  ├─ TASK-4.8 - Keep bot banter rare and free of hidden information [To Do]
│  │  │  │  │  │     │  │  └─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  │  │  │  │     │  └─ TASK-12.8 - Turn bot banter off [To Do]
│  │  │  │  │  │     │     ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │  │  │  │  │     │     └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  │  │  │  │     ├─ TASK-4.6 - Watch deals and chip moves animate without slowing my play [To Do] (shown above)
│  │  │  │  │  │     └─ TASK-12.3 - Open Settings over the table without pausing the session [To Do] (shown above)
│  │  │  │  │  ├─ TASK-1.11 - Play heads-up hands with heads-up blinds and order [To Do]
│  │  │  │  │  │  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-1.12 - Cap each street at one bet plus three raises [To Do]
│  │  │  │  │  │  │  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-1.13 - Reject illegal actions without changing the game [To Do]
│  │  │  │  │  │  │  │  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  │  │  │  │  │  │  │  └─ TASK-1.17 - Prove the engine with a 1,000,000-hand invariant run [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-1.14 - Allow short all-in bets and raises under the half-bet reopening rule [To Do] (shown above)
│  │  │  │  │  │  │  └─ TASK-3.7 - Act correctly on capped streets and when short of chips [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-1.16 - Move the button and blinds past busted seats [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-2.2 - Choose how many players sit at the table [To Do]
│  │  │  │  │  │     ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  │     └─ TASK-2.5 - Choose a line-up preset for the bots [To Do]
│  │  │  │  │  │        ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  │        ├─ TASK-2.8 - Change the style of one bot seat [To Do]
│  │  │  │  │  │        │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  │        │  └─ TASK-2.10 - Pre-fill Game Config from my last session [To Do]
│  │  │  │  │  │        │     ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  │        │     ├─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  │  │  │  │        │     └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do] (shown above)
│  │  │  │  │  │        ├─ TASK-2.9 - Randomise the bot line-up [To Do]
│  │  │  │  │  │        │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  │        └─ TASK-2.13 - Sit at a random seat with a random starting button [To Do]
│  │  │  │  │  │           └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  ├─ TASK-1.15 - Show and muck cards at showdown in casino order [To Do] (shown above)
│  │  │  │  │  └─ TASK-1.18 - Deploy the app to GitHub Pages from main when all checks pass [To Do]
│  │  │  │  │     ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  │  │  │  │     ├─ TASK-13.4 - Use every screen offline after the first visit [To Do] (shown above)
│  │  │  │  │     ├─ TASK-13.5 - Keep all my data on this device with no third-party requests [To Do] (shown above)
│  │  │  │  │     └─ TASK-13.12 - Install TLH Trainer to the Dock from Chrome or Safari [To Do]
│  │  │  │  │        └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  ├─ TASK-6.1 - Face TAG bots that act from the advice engine [To Do]
│  │  │  │  │  ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [To Do]
│  │  │  │  │  │  ├─ TASK-2.1 - Start a game from Home through Game Config [To Do]
│  │  │  │  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-2.2 - Choose how many players sit at the table [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-2.3 - Choose the stake for a cash game [To Do]
│  │  │  │  │  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  │  │  │  └─ TASK-2.4 - Choose Cash game or Sit-and-go [To Do]
│  │  │  │  │  │  │  │     ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  │  │  │     ├─ TASK-2.10 - Pre-fill Game Config from my last session [To Do] (shown above)
│  │  │  │  │  │  │  │     ├─ TASK-5.1 - Start a sit-and-go where every player has 1,500 chips [To Do] (shown above)
│  │  │  │  │  │  │  │     └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-2.6 - Resume a paused session from Home [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-2.11 - Choose Rapid or Realistic speed for the session [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-2.12 - See a branded splash while the app loads [To Do]
│  │  │  │  │  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-13.9 - Reach Home within 3 seconds on a repeat launch [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  │  │  │  └─ TASK-13.12 - Install TLH Trainer to the Dock from Chrome or Safari [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-2.15 - Practise with play money only [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do] (shown above)
│  │  │  │  │  │  │  └─ TASK-12.1 - Open Settings from Home and see the app version [To Do]
│  │  │  │  │  │  │     ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │  │  │  │  │  │     ├─ TASK-12.2 - Hide opponent style labels at the table [To Do]
│  │  │  │  │  │  │     │  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │  │  │  │  │  │     │  └─ TASK-12.3 - Open Settings over the table without pausing the session [To Do] (shown above)
│  │  │  │  │  │  │     ├─ TASK-12.5 - Choose the default speed for new sessions in Settings [To Do] (shown above)
│  │  │  │  │  │  │     └─ TASK-12.8 - Turn bot banter off [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-3.2 - Choose only legal actions with their exact amounts [To Do]
│  │  │  │  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-3.7 - Act correctly on capped streets and when short of chips [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do] (shown above)
│  │  │  │  │  │  │  └─ TASK-8.1 - Ask for a hint and see the recommended action with its numbers and reason [To Do]
│  │  │  │  │  │  │     ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │  │  │  │  │     ├─ TASK-8 - Ask for a hint [To Do] (shown above)
│  │  │  │  │  │  │     ├─ TASK-8.2 - Mark a decision as hinted when I open the hint [To Do] (shown above)
│  │  │  │  │  │  │     ├─ TASK-8.3 - Get the hint card within one second [To Do]
│  │  │  │  │  │  │     │  ├─ TASK-8 - Ask for a hint [To Do] (shown above)
│  │  │  │  │  │  │     │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  │  │     ├─ TASK-8.4 - See approximate and short-stack labels on the hint card [To Do]
│  │  │  │  │  │  │     │  └─ TASK-8 - Ask for a hint [To Do] (shown above)
│  │  │  │  │  │  │     ├─ TASK-13.4 - Use every screen offline after the first visit [To Do] (shown above)
│  │  │  │  │  │  │     └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [To Do]
│  │  │  │  │  │  │  ├─ TASK-2.14 - Pause the session from the Table header Home control [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [To Do]
│  │  │  │  │  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-3.8 - See each side pot and who wins it [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-3.9 - Keep a permanent record of every completed hand [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-3.11 - Rebuy or leave when my stack runs out [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-3.13 - Play at Rapid bot pace [To Do]
│  │  │  │  │  │  │  │  │  ├─ TASK-2.11 - Choose Rapid or Realistic speed for the session [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-3.18 - Play at Realistic bot pace [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-4.2 - See a bot's in-style speech bubble after a table event [To Do] (shown above)
│  │  │  │  │  │  │  │  │  └─ TASK-4.6 - Watch deals and chip moves animate without slowing my play [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-4.5 - See each player's bet as chips in front of their seat [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-9.1 - Review each decision of the hand I just played [To Do]
│  │  │  │  │  │  │  │  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-9.2 - Continue to rebuy or leave when I bust with the review open [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-9.3 - See the numbers and reason behind each reviewed decision [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-9.4 - See the hand number, my cards, position, result and replay code in the review [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-9.5 - See opponents' cards in the review only when they were shown at showdown [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-9.7 - See a grade summary badge after each hand when auto-open is off [To Do]
│  │  │  │  │  │  │  │  │  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  │  │  │  │  │  │  └─ TASK-12.6 - Turn off automatic opening of the Hand Review panel [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-13.4 - Use every screen offline after the first visit [To Do] (shown above)
│  │  │  │  │  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  │  │  │  │  └─ TASK-12.3 - Open Settings over the table without pausing the session [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-3.14 - See an opponent's observed VPIP, PFR and aggression on hover or tap [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-3.16 - Play on a branded table that fits a 1280 x 720 window [To Do]
│  │  │  │  │  │  │  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  │  │  │  └─ TASK-4.4 - Play on a table, rail, chips and dealer button drawn in code [To Do]
│  │  │  │  │  │  │  │     ├─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  │  │  │  │  │  │     ├─ TASK-4.5 - See each player's bet as chips in front of their seat [To Do] (shown above)
│  │  │  │  │  │  │  │     └─ TASK-13.12 - Install TLH Trainer to the Dock from Chrome or Safari [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-3.19 - Read every amount as US dollars in English [To Do]
│  │  │  │  │  │  │  │  └─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-4.1 - Follow every action of the hand in an action log [To Do]
│  │  │  │  │  │  │  │  ├─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  │  │  │  │  │  │  ├─ TASK-4.3 - Keep the action log collapsed or expanded as I left it [To Do]
│  │  │  │  │  │  │  │  │  ├─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  │  │  │  │  │  │  │  ├─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  │  │  │  │  │  │  │  └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do] (shown above)
│  │  │  │  │  │  │  │  └─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-4.7 - Recognise each bot by an initials avatar badge [To Do]
│  │  │  │  │  │  │  │  └─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-4.9 - See my session's playing time and hands-per-hour pace in the header [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do] (shown above)
│  │  │  │  │  │  │  ├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [To Do] (shown above)
│  │  │  │  │  │  │  └─ TASK-12.2 - Hide opponent style labels at the table [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-3.6 - Keep the table responsive while bots and advice compute [To Do]
│  │  │  │  │  │     ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  │  │  │  │     ├─ TASK-8.1 - Ask for a hint and see the recommended action with its numbers and reason [To Do] (shown above)
│  │  │  │  │  │     ├─ TASK-9.3 - See the numbers and reason behind each reviewed decision [To Do] (shown above)
│  │  │  │  │  │     └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │  ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  │  │  │  │  └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [To Do]
│  │  │  │  │     ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  │  │  │  │     └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [To Do]
│  │  │  │  │        ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  │  │  │  │        ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [To Do]
│  │  │  │  │        │  ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  │  │  │  │        │  └─ TASK-6.6 - Seat bots by line-up preset with unique names [To Do]
│  │  │  │  │        │     ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  │  │  │  │        │     ├─ TASK-6.7 - Record an edited line-up as Custom [To Do]
│  │  │  │  │        │     │  ├─ TASK-2.5 - Choose a line-up preset for the bots [To Do] (shown above)
│  │  │  │  │        │     │  ├─ TASK-3.9 - Keep a permanent record of every completed hand [To Do] (shown above)
│  │  │  │  │        │     │  ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  │  │  │  │        │     │  ├─ TASK-6.8 - Replace a busted bot with a new bot from the line-up preset [To Do]
│  │  │  │  │        │     │  │  ├─ TASK-3.9 - Keep a permanent record of every completed hand [To Do] (shown above)
│  │  │  │  │        │     │  │  ├─ TASK-4.2 - See a bot's in-style speech bubble after a table event [To Do] (shown above)
│  │  │  │  │        │     │  │  ├─ TASK-4.7 - Recognise each bot by an initials avatar badge [To Do] (shown above)
│  │  │  │  │        │     │  │  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do] (shown above)
│  │  │  │  │        │     │  │  ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  │  │  │  │        │     │  │  ├─ TASK-6.9 - Prove the engine over 1,000,000 cash hands with every line-up preset [To Do] (shown above)
│  │  │  │  │        │     │  │  └─ TASK-6.10 - Report each bot's BB/100 with a 95% confidence interval [To Do]
│  │  │  │  │        │     │  │     ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  │  │  │  │        │     │  │     └─ TASK-6.12 - Prove TAG beats tables of each weaker style [To Do]
│  │  │  │  │        │     │  │        └─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  │  │  │  │        │     │  └─ TASK-11.7 - Filter my trends by line-up [To Do] (shown above)
│  │  │  │  │        │     ├─ TASK-6.11 - Report each bot style's VPIP, PFR and aggression against its band [To Do]
│  │  │  │  │        │     │  ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  │  │  │  │        │     │  └─ TASK-6.16 - Keep TAG and Rock bots inside their style bands [To Do]
│  │  │  │  │        │     │     ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  │  │  │  │        │     │     └─ TASK-6.17 - Keep Calling station and Maniac bots inside their style bands [To Do]
│  │  │  │  │        │     │        ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  │  │  │  │        │     │        ├─ TASK-6.12 - Prove TAG beats tables of each weaker style [To Do] (shown above)
│  │  │  │  │        │     │        └─ TASK-10.3 - See my five style stats against healthy ranges for my table size [To Do] (shown above)
│  │  │  │  │        │     ├─ TASK-6.13 - Compute every bot decision within 100 ms [To Do]
│  │  │  │  │        │     │  ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  │  │  │  │        │     │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│  │  │  │  │        │     ├─ TASK-6.14 - Keep each bot's style fixed whatever the user does [To Do]
│  │  │  │  │        │     │  └─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  │  │  │  │        │     └─ TASK-6.15 - Replay any hand with every bot acting exactly as before [To Do]
│  │  │  │  │        │        └─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  │  │  │  │        ├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [To Do]
│  │  │  │  │        │  ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  │  │  │  │        │  └─ TASK-6.6 - Seat bots by line-up preset with unique names [To Do] (shown above)
│  │  │  │  │        └─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [To Do]
│  │  │  │  │           ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  │  │  │  │           └─ TASK-6.6 - Seat bots by line-up preset with unique names [To Do] (shown above)
│  │  │  │  └─ TASK-7.15 - Prove advice is identical for identical decisions [To Do]
│  │  │  │     ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [To Do] (shown above)
│  │  │  │     └─ TASK-7 - Get trustworthy advice [To Do]
│  │  │  ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [To Do] (shown above)
│  │  │  └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [To Do]
│  │  │     ├─ TASK-6.1 - Face TAG bots that act from the advice engine [To Do] (shown above)
│  │  │     ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  │  │     ├─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [To Do]
│  │  │     │  ├─ TASK-6.1 - Face TAG bots that act from the advice engine [To Do] (shown above)
│  │  │     │  ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  │  │     │  ├─ TASK-7.4 - Grade a decision as Correct, Minor error or Major error [To Do]
│  │  │     │  │  ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  │  │     │  │  ├─ TASK-7.14 - Check advice against postflop golden spots on every test run [To Do]
│  │  │     │  │  │  └─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  │  │     │  │  ├─ TASK-7.15 - Prove advice is identical for identical decisions [To Do] (shown above)
│  │  │     │  │  ├─ TASK-7.16 - Label advice as approximate at non-reference table sizes [To Do]
│  │  │     │  │  │  ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  │  │     │  │  │  ├─ TASK-8.4 - See approximate and short-stack labels on the hint card [To Do] (shown above)
│  │  │     │  │  │  └─ TASK-9.9 - See approximate and short-stack labels in review entries [To Do] (shown above)
│  │  │     │  │  ├─ TASK-7.17 - Add a short-stack note to sit-and-go advice [To Do]
│  │  │     │  │  │  ├─ TASK-5.4 - Raise the sit-and-go limits every 10 hands on the published schedule [To Do] (shown above)
│  │  │     │  │  │  ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  │  │     │  │  │  ├─ TASK-8.4 - See approximate and short-stack labels on the hint card [To Do] (shown above)
│  │  │     │  │  │  └─ TASK-9.9 - See approximate and short-stack labels in review entries [To Do] (shown above)
│  │  │     │  │  └─ TASK-9.1 - Review each decision of the hand I just played [To Do] (shown above)
│  │  │     │  ├─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [To Do]
│  │  │     │  │  ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  │  │     │  │  ├─ TASK-7.8 - Recommend betting or raising for value [To Do]
│  │  │     │  │  │  ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  │  │     │  │  │  ├─ TASK-7.10 - Explain every recommendation in plain English with its numbers [To Do]
│  │  │     │  │  │  │  ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [To Do] (shown above)
│  │  │     │  │  │  │  ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  │  │     │  │  │  │  ├─ TASK-7.11 - Check advice against preflop golden spots on every test run [To Do]
│  │  │     │  │  │  │  │  ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  │  │     │  │  │  │  │  └─ TASK-7.14 - Check advice against postflop golden spots on every test run [To Do] (shown above)
│  │  │     │  │  │  │  ├─ TASK-7.15 - Prove advice is identical for identical decisions [To Do] (shown above)
│  │  │     │  │  │  │  └─ TASK-8.1 - Ask for a hint and see the recommended action with its numbers and reason [To Do] (shown above)
│  │  │     │  │  │  └─ TASK-7.14 - Check advice against postflop golden spots on every test run [To Do] (shown above)
│  │  │     │  │  └─ TASK-7.13 - Adjust opponent ranges to their observed play after 30 hands [To Do]
│  │  │     │  │     ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  │  │     │  │     ├─ TASK-7.14 - Check advice against postflop golden spots on every test run [To Do] (shown above)
│  │  │     │  │     ├─ TASK-7.15 - Prove advice is identical for identical decisions [To Do] (shown above)
│  │  │     │  │     └─ TASK-8.1 - Ask for a hint and see the recommended action with its numbers and reason [To Do] (shown above)
│  │  │     │  ├─ TASK-7.9 - Count implied odds for drawing hands [To Do]
│  │  │     │  │  ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  │  │     │  │  ├─ TASK-7.10 - Explain every recommendation in plain English with its numbers [To Do] (shown above)
│  │  │     │  │  └─ TASK-7.14 - Check advice against postflop golden spots on every test run [To Do] (shown above)
│  │  │     │  └─ TASK-7.17 - Add a short-stack note to sit-and-go advice [To Do] (shown above)
│  │  │     ├─ TASK-7.6 - Recommend preflop actions at heads-up and full-ring tables [To Do]
│  │  │     │  ├─ TASK-2.2 - Choose how many players sit at the table [To Do] (shown above)
│  │  │     │  ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  │  │     │  ├─ TASK-7.10 - Explain every recommendation in plain English with its numbers [To Do] (shown above)
│  │  │     │  ├─ TASK-7.11 - Check advice against preflop golden spots on every test run [To Do] (shown above)
│  │  │     │  └─ TASK-7.16 - Label advice as approximate at non-reference table sizes [To Do] (shown above)
│  │  │     └─ TASK-7.17 - Add a short-stack note to sit-and-go advice [To Do] (shown above)
│  │  └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [To Do]
│  │     ├─ TASK-3.9 - Keep a permanent record of every completed hand [To Do] (shown above)
│  │     ├─ TASK-3.14 - See an opponent's observed VPIP, PFR and aggression on hover or tap [To Do] (shown above)
│  │     ├─ TASK-6.11 - Report each bot style's VPIP, PFR and aggression against its band [To Do] (shown above)
│  │     ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  │     ├─ TASK-7.13 - Adjust opponent ranges to their observed play after 30 hands [To Do] (shown above)
│  │     ├─ TASK-10.3 - See my five style stats against healthy ranges for my table size [To Do] (shown above)
│  │     └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do] (shown above)
│  └─ TASK-7.1 - Compute a hand's equity against opponent hands [To Do]
│     ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│     ├─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [To Do] (shown above)
│     └─ TASK-7.7 - Compute multiway and range-versus-range equity within 1.5 points [To Do]
│        └─ TASK-7 - Get trustworthy advice [To Do] (shown above)
├─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [To Do]
│  ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
│  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [To Do] (shown above)
└─ TASK-1.8 - Check game invariants after every playtest action [To Do] (shown above)

Description:
--------------------------------------------------
As a project owner, I want every push and pull request checked automatically in GitHub Actions, so that a broken change is caught before it reaches main.

Built immediately after the toolchain story E01-S01 so that every later story can meet the global DoD item 'CI workflow is green on the story's branch'. GitHub Actions workflow runs lint, typecheck, tests, the build and `npm run e2e` (Playwright plus axe in Chromium and WebKit, REQ-064.4) on every push and pull request; any failing check fails the workflow. The 10,000-hand playtest step is added by E01-S08, the nightly 1,000,000-hand run by E01-S17 and deployment to GitHub Pages by E01-S18. Actor 'project owner' = the single Learner in the role of the person who builds and maintains the trainer (requirements.md has only the Learner user class).

## Requirements covered
- REQ-064 (Should): Continuous integration and deployment — On every push to GitHub, a GitHub Actions workflow shall run lint, typecheck, tests, a 10,000-hand playtest and the build, and on the main branch shall deploy the build to GitHub Pages when all pass.

Covers: REQ-064

## Notes
Cache npm dependencies; pin the Node LTS version used locally.

Plan key: E01-S02 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a push to any branch or a pull request on GitHub, When the workflow triggers, Then it runs `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `npm run e2e` (Playwright and axe tests in Chromium and WebKit) [REQ-064.1, REQ-064.4]
- [ ] #2 Given a push in which any one of lint, typecheck, tests or build fails, When the workflow finishes, Then the workflow is reported as failed [REQ-064.2]
- [ ] #3 Given a push in which all checks pass, When the workflow finishes, Then the workflow is reported as successful [REQ-064.2]
- [ ] #4 Given a push in which a Playwright or axe test fails in Chromium or in WebKit, When the workflow finishes, Then the workflow is reported as failed [REQ-064.4, REQ-064.2]
- [ ] #5 Given a push to any branch or a pull request on GitHub, When the workflow runs, Then it also runs `npm audit --omit=dev --audit-level=high` and `npm audit --audit-level=critical`, and the workflow is reported as failed if either reports an advisory at that level [TASK-1.1 Q-3]

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

