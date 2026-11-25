File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-12.1 - Open-Settings-from-Home-and-see-the-app-version.md

Task TASK-12.1 - Open Settings from Home and see the app version
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 47000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-24 19:27 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-12 - Tune the trainer
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 14 total):
└─ TASK-2.1 - Start a game from Home through Game Config [completed]
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

Dependents (4 direct, 9 total):
├─ TASK-12 - Tune the trainer [To Do]
├─ TASK-12.2 - Hide opponent style labels at the table [To Do]
│  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  └─ TASK-12.3 - Open Settings over the table without pausing the session [To Do]
│     ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│     ├─ TASK-12.4 - Delete all my data after confirming [To Do]
│     │  └─ TASK-12 - Tune the trainer [To Do] (shown above)
│     ├─ TASK-12.6 - Turn off automatic opening of the Hand Review panel [To Do]
│     │  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│     │  └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│     ├─ TASK-12.7 - Switch to a four-colour deck [To Do]
│     │  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│     │  └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│     └─ TASK-12.9 - Warn me in Settings when the browser can clear my history [To Do]
│        └─ TASK-12 - Tune the trainer [To Do] (shown above)
├─ TASK-12.5 - Choose the default speed for new sessions in Settings [To Do]
│  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
└─ TASK-12.8 - Turn bot banter off [To Do]
   ├─ TASK-12 - Tune the trainer [To Do] (shown above)
   └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want to open the Settings screen from Home, so that I can find every trainer option and check which version I am running.

Adds the Settings entry to Home (Home = E02-S01; E11 adds Statistics) and the Settings screen (Settings storyboard: '← Home' back control, sections Play, Display, Your data, version line). This slice creates the local settings store (IndexedDB, created with defaults on first launch: default speed Rapid, auto-open Hand Review on, show opponent styles on, four-colour deck off, bot banter on) that every later toggle writes and that E02-S11 already reads for the default speed. The screen shows 'Version <x>' where <x> is the build's app version (package.json version injected at build time); E13 reuses the same string for 'Updated to version <x>'. Toggles are added by E12-S02, S04..S07; Reset all data by E12-S08; the storage warning by E12-S09. All controls are native form fields or buttons, at least 44 x 44 CSS px. Each default is verified by the story that builds its control (E12-S02, S04, S05, S06, S07 AC1).

## Requirements covered
- REQ-002 (Must): Home screen menu — The Home screen shall offer New game, Statistics and Settings, and shall offer Resume session only while a paused session exists.
- REQ-050 (Should): Settings options — The Settings screen shall offer default speed, auto-open Hand Review, show opponent styles and four-colour deck, and each change shall take effect immediately and persist across launches.
- REQ-057 (Should): Accessibility and usability — Every screen shall meet WCAG 2.1 AA contrast and control-labelling rules, and every grade or status shown in colour shall also be shown as text.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-002, REQ-050, REQ-057, REQ-061

## Notes
The storyboard's 'Show amounts as Dollars / Big bets' row is NOT a requirement (waiting room, Q-61 not selected): do not build it. Keep the settings store in the place E13 versions (REQ-054).

Plan key: E12-S01 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the Home screen, When it is shown, Then it offers a Settings entry; When the user chooses Settings, Then the Settings screen opens [REQ-002.3, REQ-050.5]
- [ ] #2 Given a build whose app version is 1.2.0, When the Settings screen is shown, Then it shows "Version 1.2.0" [REQ-050.6]
- [ ] #3 Given the Settings screen opened from Home, When the user chooses the back control, Then the Home screen opens [REQ-050.5]
- [ ] #4 Given the Settings screen at 1280 x 720, When the user presses Tab repeatedly, Then focus reaches every Settings control, each is a native button, link or form field, each activates with Enter or Space, and each is at least 44 x 44 CSS px [REQ-057.2, REQ-057.4]
- [ ] #5 Given the Settings screen and any Settings dialog are added, When the play-money check runs (e2e/play-money.spec.ts, tests/ui/screen-list.acceptance.test.ts), Then they are registered in e2e/support/screen-list.ts, visited by the walk, and the dialog detector also recognises role written as a JSX expression (e.g. role={'dialog'})

Definition of Done:
--------------------------------------------------
- [ ] #1 axe reports zero serious or critical violations on the Settings screen in Chromium and WebKit [REQ-057.1]
- [ ] #2 The Settings screen offers no deposit, payment, purchase, cash-out, real-money wager or real-money conversion [REQ-061.1]
- [ ] #3 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [ ] #4 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [ ] #5 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [ ] #6 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [ ] #7 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [ ] #8 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [ ] #9 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [ ] #10 No new network requests beyond the app's own files [REQ-058.1]
- [ ] #11 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [ ] #12 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [ ] #13 Story documentation is written and published to Backlog.md
- [ ] #14 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled

Implementation Notes:
--------------------------------------------------
AC added from TASK-2.15 follow-up (doc-124).

