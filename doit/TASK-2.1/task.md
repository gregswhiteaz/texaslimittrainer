File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-2.1 - Start-a-game-from-Home-through-Game-Config.md

Task TASK-2.1 - Start a game from Home through Game Config
==================================================

Status: ◒ In Progress
Priority: High
Type: feature
Ordinal: 17000
Assignee: @claude
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-18 22:58 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-0
Parent: TASK-2 - Launch and set up a session
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 13 total):
└─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
   ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
   │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
   └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
      ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
      │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
      ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
      │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
      └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
         ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
         │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
         └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)

Dependents (10 direct, 61 total):
├─ TASK-2 - Launch and set up a session [To Do]
├─ TASK-2.2 - Choose how many players sit at the table [To Do]
│  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  └─ TASK-2.5 - Choose a line-up preset for the bots [To Do]
│     ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│     ├─ TASK-2.8 - Change the style of one bot seat [To Do]
│     │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│     │  └─ TASK-2.10 - Pre-fill Game Config from my last session [To Do]
│     │     ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│     │     ├─ TASK-12.4 - Delete all my data after confirming [To Do]
│     │     │  └─ TASK-12 - Tune the trainer [To Do]
│     │     └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do]
│     │        ├─ TASK-13 - Rely on a private offline app [To Do]
│     │        ├─ TASK-13.7 - Keep my old data intact when a migration fails [To Do]
│     │        │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     │        │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
│     │        │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     │        └─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do]
│     │           ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     │           └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│     ├─ TASK-2.9 - Randomise the bot line-up [To Do]
│     │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│     └─ TASK-2.13 - Sit at a random seat with a random starting button [To Do]
│        └─ TASK-2 - Launch and set up a session [To Do] (shown above)
├─ TASK-2.3 - Choose the stake for a cash game [To Do]
│  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  └─ TASK-2.4 - Choose Cash game or Sit-and-go [To Do]
│     ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│     ├─ TASK-2.10 - Pre-fill Game Config from my last session [To Do] (shown above)
│     ├─ TASK-5.1 - Start a sit-and-go where every player has 1,500 chips [To Do]
│     │  ├─ TASK-5 - Play a sit-and-go [To Do]
│     │  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do]
│     │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do]
│     │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│     │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do]
│     │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do]
│     │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  │  │  └─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do]
│     │  │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  │  └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
│     │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│     │  └─ TASK-5.4 - Raise the sit-and-go limits every 10 hands on the published schedule [To Do]
│     │     ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │     ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do]
│     │     │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │     │  └─ TASK-5.6 - See the level on Home's Resume entry for a paused sit-and-go [To Do]
│     │     │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│     │     └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
│     └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
├─ TASK-2.6 - Resume a paused session from Home [To Do]
│  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  ├─ TASK-2.7 - Confirm ending a paused session before starting a new game [To Do]
│  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  ├─ TASK-2.14 - Pause the session from the Table header Home control [To Do]
│  │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do] (shown above)
│  ├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do]
│  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
├─ TASK-2.11 - Choose Rapid or Realistic speed for the session [To Do]
│  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  └─ TASK-12.5 - Choose the default speed for new sessions in Settings [To Do]
│     ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│     └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
├─ TASK-2.12 - See a branded splash while the app loads [To Do]
│  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  ├─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do] (shown above)
│  ├─ TASK-13.9 - Reach Home within 3 seconds on a repeat launch [To Do]
│  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do]
│  │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  ├─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  └─ TASK-13.12 - Install TLH Trainer to the Dock from Chrome or Safari [To Do]
│     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
├─ TASK-2.15 - Practise with play money only [To Do]
│  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do]
│  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  ├─ TASK-2.17 - See a first-use message on Home before any session has ended [To Do]
│  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  ├─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do] (shown above)
│  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
├─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do]
│  ├─ TASK-11 - Track progress over time [To Do]
│  ├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do]
│  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do]
│  │     └─ TASK-11 - Track progress over time [To Do] (shown above)
│  ├─ TASK-11.3 - See the G-2 target line on my Major-error trend [To Do]
│  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  └─ TASK-11.11 - See whether I met the G-2 goal after 5,000 hands [To Do]
│  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │     └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  ├─ TASK-11.4 - Filter my trends by table size and game type [To Do]
│  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  ├─ TASK-11.5 - Group my trends per session or per day [To Do]
│  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  ├─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do]
│  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  ├─ TASK-11.7 - Filter my trends by line-up [To Do]
│  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do]
│  │  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │     └─ TASK-11.10 - See my style stats separately for each table size I played [To Do]
│  │  │        ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │        └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  └─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do] (shown above)
│  ├─ TASK-11.5 - Group my trends per session or per day [To Do] (shown above)
│  └─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do]
│     └─ TASK-11 - Track progress over time [To Do] (shown above)
└─ TASK-12.1 - Open Settings from Home and see the app version [To Do]
   ├─ TASK-12 - Tune the trainer [To Do] (shown above)
   ├─ TASK-12.2 - Hide opponent style labels at the table [To Do]
   │  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
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
   ├─ TASK-12.5 - Choose the default speed for new sessions in Settings [To Do] (shown above)
   └─ TASK-12.8 - Turn bot banter off [To Do]
      ├─ TASK-12 - Tune the trainer [To Do] (shown above)
      └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want to start a game from the Home screen, so that every practice session begins from one clear entry point.

Walking-skeleton slice that puts Home and a minimal Game Config in front of the default table opened by E03-S01. When the app has loaded it opens Home, which shows the TLH logo (the user-supplied asset brand/tlh-logo.jpg, bundled unchanged) and the name "TLH Trainer". Home offers New game (Statistics and Settings entries are added by E11/E12; Resume session by E02-S08). New game opens the Game Config screen. In this slice Game Config shows the fixed default session (Cash game, 6 players, $4/$8, five TAG bots) with Start game and Cancel/Home; the selectors arrive in E02-S02..S07 and S11. Start game builds the session configuration and hands it to the Table (E03-S01), which deals the first hand. Theme per REQ-060.3: charcoal background, red primary accent.

## Requirements covered
- REQ-002 (Must): Home screen menu — The Home screen shall offer New game, Statistics and Settings, and shall offer Resume session only while a paused session exists.
- REQ-006 (Must): Stakes and blinds — For cash games, the Game Config screen shall offer exactly the stakes $2/$4, $3/$6, $4/$8, $6/$12, $10/$20 and $20/$40, and the engine shall post blinds of half the small bet rounded down to a whole dollar (small blind) and the small bet (big blind).
- REQ-060 (Should): Compatibility and look — TLH Trainer shall run and install as a PWA in the latest two major versions of Chrome and Safari on macOS at window sizes of 1280 × 720 and larger, using the branded dark theme.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-002, REQ-006, REQ-060, REQ-061

## Notes
Build the session-configuration object here (game type, players, stake, line-up, speed, later user seat and button) so later stories only add fields. E03-S01's direct-to-table start is replaced by this flow. Game Config also offers Cancel (back to Home, nothing stored) per the Config storyboard; it is navigation, not a requirement clause.

Plan key: E02-S01 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the app is launched, When loading completes, Then the Home screen opens and shows the TLH logo image and the name "TLH Trainer" [REQ-002.1]
- [ ] #2 Given the Home screen, When the logo image is loaded, Then it is the bundled logo derived only by resizing from brand/tlh-logo.jpg (the same file the card back uses), and drawn at 64x64 it matches brand/tlh-logo.jpg within an average of 4 per colour channel [REQ-061.3]
- [ ] #3 Given the Home screen is shown, When its colours are measured, Then the page background is charcoal #0E0F12 and the New game control uses the red primary accent #D7262E [REQ-060.3]
- [ ] #4 Given the Home screen, When the user chooses New game, Then the Game Config screen opens and no session is started [REQ-002.2]
- [ ] #5 Given Game Config on first use, When the user chooses Start game, Then the Table opens a cash game with the user and five TAG bots at $4/$8 and the first hand is dealt [REQ-006.1]
- [ ] #6 Given Game Config starts a session, When the Table receives it, Then SessionConfig carries game type, number of players, line-up, speed, seat and button as well as the stake

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
AC added from TASK-3.1 follow-up (doc-21).

AC#2 reworded 2026-11-18 by user decision (TASK-2.1 Q-1): the logo may be a resized-only derivative of brand/tlh-logo.jpg (src/assets/tlh-logo.jpg, 512 px, shared with the card back) instead of byte-identical.

