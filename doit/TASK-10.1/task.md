File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-10.1 - End-the-session-with-Leave-table-and-see-its-saved-report-with-my-cash-result.md

Task TASK-10.1 - End the session with Leave table and see its saved report with my cash result
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 68000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-19 00:21 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-10 - Read the session report
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (4 direct, 31 total):
├─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
│  ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
│  │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│  │  │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│  │  │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│  │  │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│  │  │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│  │  │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│  │  │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│  │  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
│  │  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
│  │  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
│  │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
│  │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│  │     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
│  │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│  │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
│  │        ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
│  │        │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
│  │        └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
│  └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)
├─ TASK-3.9 - Keep a permanent record of every completed hand [completed]
│  ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
│  │  ├─ TASK-1.8 - Check game invariants after every playtest action [completed]
│  │  │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
│  │  │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│  │  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
│  │     └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
│  │        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
│  ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
│  │  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed] (shown above)
│  ├─ TASK-6.7 - Record an edited line-up as Custom [completed]
│  │  └─ TASK-6.6 - Seat bots by line-up preset with unique names [completed]
│  │     ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [completed]
│  │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
│  │     │     └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
│  │     │        └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed] (shown above)
│  │     ├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [completed]
│  │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
│  │     └─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [completed]
│  │        └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
│  ├─ TASK-6.8 - Replace a busted bot with a new bot from the line-up preset [completed]
│  │  └─ TASK-6.7 - Record an edited line-up as Custom [completed] (shown above)
│  └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
│     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)
├─ TASK-3.10 - Save the session after every hand so it can be resumed [completed]
│  └─ TASK-3.9 - Keep a permanent record of every completed hand [completed] (shown above)
└─ TASK-3.11 - Rebuy or leave when my stack runs out [completed]
   ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed] (shown above)
   └─ TASK-3.10 - Save the session after every hand so it can be resumed [completed] (shown above)

Dependents (20 direct, 49 total):
├─ TASK-2.7 - Confirm ending a paused session before starting a new game [To Do]
│  └─ TASK-2 - Launch and set up a session [To Do]
├─ TASK-2.15 - Practise with play money only [To Do]
│  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do]
│  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  ├─ TASK-2.17 - See a first-use message on Home before any session has ended [To Do]
│  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  ├─ TASK-12.4 - Delete all my data after confirming [To Do]
│  │  │  └─ TASK-12 - Tune the trainer [To Do]
│  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
│  │     └─ TASK-13 - Rely on a private offline app [To Do]
│  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do]
│  │  └─ TASK-5 - Play a sit-and-go [To Do]
│  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
├─ TASK-10 - Read the session report [To Do]
├─ TASK-10.2 - Leave the table in the middle of a hand [To Do]
│  ├─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do]
│  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  ├─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do]
│  │  ├─ TASK-11 - Track progress over time [To Do]
│  │  ├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do]
│  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do]
│  │  │     └─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  ├─ TASK-11.3 - See the G-2 target line on my Major-error trend [To Do]
│  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  └─ TASK-11.11 - See whether I met the G-2 goal after 5,000 hands [To Do]
│  │  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │     └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  ├─ TASK-11.4 - Filter my trends by table size and game type [To Do]
│  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  ├─ TASK-11.5 - Group my trends per session or per day [To Do]
│  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  ├─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do]
│  │  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  ├─ TASK-11.7 - Filter my trends by line-up [To Do]
│  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do]
│  │  │  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │     └─ TASK-11.10 - See my style stats separately for each table size I played [To Do]
│  │  │  │        ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │        └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  └─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do] (shown above)
│  │  ├─ TASK-11.5 - Group my trends per session or per day [To Do] (shown above)
│  │  └─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do]
│  │     └─ TASK-11 - Track progress over time [To Do] (shown above)
│  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
├─ TASK-10.3 - See my five style stats against healthy ranges for my table size [To Do]
│  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do] (shown above)
├─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [To Do]
│  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do] (shown above)
├─ TASK-10.5 - See my postflop leaks with evidence and a one-sentence fix [To Do]
│  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  ├─ TASK-10.6 - See my preflop leaks by position group [To Do]
│  │  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do]
│  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do]
│  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do]
│  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do] (shown above)
│  │  │  │  └─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do] (shown above)
│  │  │  └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
│  │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  └─ TASK-10.8 - See my three most costly leaks first [To Do]
│     ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│     └─ TASK-10 - Read the session report [To Do] (shown above)
├─ TASK-10.7 - See how many of my decisions used a hint in the report [To Do]
│  └─ TASK-10 - Read the session report [To Do] (shown above)
├─ TASK-10.11 - See my playing time and hands per hour in the report [To Do]
│  └─ TASK-10 - Read the session report [To Do] (shown above)
├─ TASK-10.12 - See my sit-and-go finishing position in the report [To Do]
│  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do] (shown above)
│  └─ TASK-10 - Read the session report [To Do] (shown above)
├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do] (shown above)
├─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do] (shown above)
├─ TASK-13.1 - Return Home from an unexpected error without losing completed hands [To Do]
│  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
├─ TASK-13.3 - Stop dealing when the last hand could not be saved [To Do]
│  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
├─ TASK-13.4 - Use every screen offline after the first visit [To Do]
│  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  ├─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do]
│  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  └─ TASK-13.9 - Reach Home within 3 seconds on a repeat launch [To Do]
│     ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do]
│        └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
├─ TASK-13.5 - Keep all my data on this device with no third-party requests [To Do]
│  └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
├─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do]
│  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  ├─ TASK-13.7 - Keep my old data intact when a migration fails [To Do]
│  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  └─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do] (shown above)
├─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
└─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want to end my session with Leave table so that its Session Report opens with my result, so that I know how the session went the moment I stop playing.

Leave table exists in the Table header (E03-S03) and in the bust dialog (E03-S08). Between hands (no hand in progress, including while the Hand Review panel is open after a hand), Leave table ends the session immediately and opens the Session Report screen (layout per the Report storyboard: header line with game type, players, stake and hands; KPI tiles; style section; leaks section). This slice creates the report record and shows the cash result: Result in $ = final stack minus everything bought in (initial buy-in of 20 big bets plus every rebuy, from the session's rebuy count, E03-S08/E03-S11), shown with sign (e.g. +$46); BB/100 = (result in big bets of the session's stake) / hands played x 100, one decimal with sign; number of rebuys. The report is built from the stored hand records and session record (E03-S09, E03-S11) and saved to IndexedDB when the session ends; like hand records it is never modified after it is written (REQ-052.5). An ended session is no longer a paused session. A session with 0 completed hands ends without a report and is not stored (whatever path ends it: Leave table, or E02's New game confirm on a paused session). Error rates, hint usage, style stats, leaks and playing time are added by E10-S02..S10; the sit-and-go result is E10-S11; Statistics and Home controls on the report are E11 (REQ-044.6); reopening the stored report from the Home snapshot is E02 (REQ-003.2).

## Requirements covered
- REQ-004 (Must): Pause, resume and end a session — When the user goes Home or closes the app during a session, TLH Trainer shall keep that session as a paused session that can be resumed at the start of the next hand; when the user chooses Leave table, it shall end the session and open the Session Report.
- REQ-007 (Must): Cash game buy-in and rebuy — In a cash game, every player shall start with a fixed buy-in of 20 big bets; when the user's stack reaches zero, TLH Trainer shall ask the user to Rebuy (another 20 big bets) or Leave table before the next hand.
- REQ-044 (Must): Session Report content — When a session ends, TLH Trainer shall show and save a Session Report with the result, volume, error rates, hint usage, the five tracked style stats against their healthy ranges, and the top leaks.
- REQ-052 (Must): Local persistence — TLH Trainer shall store settings, last configuration, sessions, hand records and session reports in the browser's IndexedDB, writing each hand record when its hand ends.

Covers: REQ-004, REQ-007, REQ-044, REQ-052

## Notes
Expose a report builder (session id -> report values) usable by E02's New game confirm (REQ-004.4 saves the paused session's report), E11 (Statistics) and E05 (sit-and-go result). Mid-hand Leave table (dialog, auto-fold) is E10-S05.

Plan key: E10-S01 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a $4/$8 cash session between hands, When the user chooses Leave table in the header, Then the session ends, no further hand is dealt and the Session Report for that session opens [REQ-004.5]
- [ ] #2 Given the bust dialog after the user's stack reached $0, When the user chooses Leave table, Then the Session Report for that session opens [REQ-004.5]
- [ ] #3 Given a $4/$8 cash session of 214 hands with 1 rebuy that ends with a final stack of $366, When its report is shown, Then it shows Result "+$46", BB/100 "+2.7" and rebuys "1" [REQ-007.3, REQ-044.1]
- [ ] #4 Given a $4/$8 cash session of 100 hands with no rebuys that ends with a final stack of $120, When its report is shown, Then it shows Result "-$40", BB/100 "-5.0" and rebuys "0" [REQ-044.1]
- [ ] #5 Given a session has ended and its report was shown, When the app is closed and relaunched, Then the stored report for that session holds the same values and no paused session exists for it [REQ-044.7]
- [ ] #6 Given a stored session report, When later sessions are played and ended, Then the stored report is byte-identical and a second write for the same session id is rejected [REQ-044.7, REQ-052.5]
- [ ] #7 Given a session with 0 completed hands (the app was closed during hand 1), When that session is ended, Then no Session Report opens and neither the session nor a report is stored [REQ-044.8]
- [ ] #8 Given the Hand Review panel is open after hand 12 of a cash session, When the user chooses Leave table, Then no dialog is shown, no hand 13 is dealt and the Session Report opens showing hands played "12" [REQ-004.5]
- [ ] #9 Given the Table header's Leave table control, When it is chosen, Then App's onLeave handler ends the session and opens the Session Report instead of returning straight to Home (replacing the TASK-3.3 interim behaviour)

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
AC added from TASK-3.3 follow-up (doc-24).

