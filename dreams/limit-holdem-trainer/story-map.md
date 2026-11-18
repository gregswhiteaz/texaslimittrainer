# Story map: TLH Trainer (Texas Limit Hold 'Em Trainer)

Baseline: requirements v1.9 (72 requirements, 367 active clauses) · Plan: `plan/map.json` + `plan/epics/*.json` (165 stories)

Story keys are permanent. **Bold** = walking-skeleton story.

## Backbone (user activities, left to right)

| Key | Epic | Wave | Clauses | Stories (M1/M2/M3) |
|---|---|---|---|---|
| E01 | Prove the game headlessly | 1 | 54 | 18 (8/9/1) |
| E02 | Launch and set up a session | 6 | 36 | 17 (1/10/6) |
| E03 | Play hands at the table | 4 | 52 | 19 (5/8/6) |
| E04 | Follow the action at a glance | 5 | 26 | 9 (0/0/9) |
| E05 | Play a sit-and-go | 7 | 15 | 11 (0/0/11) |
| E06 | Face distinct opponents | 3 | 28 | 18 (1/14/3) |
| E07 | Get trustworthy advice | 2 | 50 | 17 (4/11/2) |
| E08 | Ask for a hint | 5 | 9 | 4 (0/2/2) |
| E09 | Review the hand just played | 5 | 19 | 9 (1/6/2) |
| E10 | Read the session report | 5 | 27 | 10 (0/8/2) |
| E11 | Track progress over time | 7 | 22 | 12 (0/7/5) |
| E12 | Tune the trainer | 7 | 16 | 9 (0/2/7) |
| E13 | Rely on a private offline app | 7 | 16 | 12 (0/2/10) |

## Release slices

- **M1 Walking skeleton** (20 stories): Thinnest end-to-end path: toolchain + CI; seeded rules engine and headless playtest runner with invariant checks; 6-max preflop chart, equity calculator, basic postflop call/fold advice and grading; TAG bots built on the advice engine; Home -> Game Config -> a default 6-max $4/$8 cash table vs TAG bots in the browser; play a hand with legal actions, see the result; a basic Hand Review panel lists the user's decisions with recommendation and grade.
- **M2 MVP** (79 stories): MVP: every Must requirement except its sit-and-go-specific parts (REQ-002.6, the sit-and-go part of REQ-044.1, REQ-048.5 stay in M3 with sit-and-go), plus Rapid bot pace. Full casino fixed-limit rules (heads-up, cap, all-ins, side pots, showdown order, button movement) proven by a 1,000,000-hand invariant run; Game Config (2-10 players, stakes, game type, line-up presets and per-seat styles); buy-in/rebuy; pause/resume/leave; four bot styles inside their bands with reproducible decisions; complete advice engine (charts for 3 reference sizes, equity, range model, value and implied-odds rules, explanations, grading, golden spots, determinism); hint; full Hand Review; cash Session Report with style stats, healthy ranges and leaks; Statistics trends with filters and target lines; local persistence; Settings basics.
- **M3 Release 1** (66 stories): Release 1: everything else in baseline v1.9 (Should/Could and all sit-and-go play): sit-and-go structure, levels, results and its parts of Home, Report and Statistics; splash; Home snapshot and first-use message; random seat/button; Realistic pace and speed choice/change; remembered config; action log, table art, chips, animation, avatars, banter, session clock; opponent stats on hover; TAG strength proof; approximate/short-stack labels; style goal status; remaining Settings and reset; storage failure and migration; install/offline/updates; privacy/CSP; performance limits; accessibility audit; compatibility; CI deploy to GitHub Pages.

## Grid, part A (E01 to E07)

| | E01 Prove the game headlessly | E02 Launch and set up a session | E03 Play hands at the table | E04 Follow the action at a glance | E05 Play a sit-and-go | E06 Face distinct opponents | E07 Get trustworthy advice |
|---|---|---|---|---|---|---|---|
| **M1** | **S01 Bootstrap the strict TypeScript project with one-command checks**<br>**S02 Run every check in GitHub Actions on each push and pull request**<br>**S03 Deal every hand from a seeded shuffle with a replay code**<br>**S04 Rank showdown hands by real poker hand rankings**<br>**S05 Play a complete fixed-limit hand from blinds to showdown**<br>**S06 Give each deciding seat only its own view of the hand**<br>**S07 Run seeded bot-only hands from the command line**<br>**S08 Check game invariants after every playtest action** | **S01 Start a game from Home through Game Config** | **S01 Play a complete hand against TAG bots at a default 6-max table in the browser**<br>**S02 Choose only legal actions with their exact amounts**<br>**S03 See every seat, the board, the pot and the button at a glance**<br>**S04 See who won each hand and get the next hand dealt automatically**<br>**S05 Read big-index cards drawn in code** | — | — | **S01 Face TAG bots that act from the advice engine** | **S01 Recommend a preflop action from the 6-max chart**<br>**S02 Compute a hand's equity against opponent hands**<br>**S03 Recommend call or fold after the flop from equity and pot odds**<br>**S04 Grade a decision as Correct, Minor error or Major error** |
| **M2** | S09 Play heads-up hands with heads-up blinds and order<br>S10 Cap each street at one bet plus three raises<br>S11 Reject illegal actions without changing the game<br>S12 Let a short-stacked player call all-in<br>S13 Split the pot into side pots for unequal all-ins<br>S14 Allow short all-in bets and raises under the half-bet reopening rule<br>S15 Show and muck cards at showdown in casino order<br>S16 Move the button and blinds past busted seats<br>S17 Prove the engine with a 1,000,000-hand invariant run | S02 Choose how many players sit at the table<br>S03 Choose the stake for a cash game<br>S04 Choose Cash game or Sit-and-go<br>S05 Choose a line-up preset for the bots<br>S06 Change the style of one bot seat<br>S07 Randomise the bot line-up<br>S08 Resume a paused session from Home<br>S09 Confirm ending a paused session before starting a new game<br>S14 Practise with play money only<br>S15 Pause the session from the Table header Home control | S06 Act correctly on capped streets and when short of chips<br>S07 See each side pot and who wins it<br>S08 Rebuy or leave when my stack runs out<br>S09 Keep a permanent record of every completed hand<br>S10 Record the advice and grade for each of my decisions with the hand<br>S11 Save the session after every hand so it can be resumed<br>S12 Keep the table responsive while bots and advice compute<br>S13 Play at Rapid bot pace | — | — | S18 Draw bot randomness only from the replay code and seat<br>S02 Vary TAG's play in mixed spots from its style data file<br>S03 Face a Calling station that calls where TAG would fold or raise<br>S04 Face a Maniac that bets and raises where TAG would check or call<br>S05 Face a Rock that folds every hand outside a narrow starting range<br>S06 Seat bots by line-up preset with unique names<br>S07 Record an edited line-up as Custom<br>S08 Replace a busted bot with a new bot from the line-up preset<br>S09 Report each bot style's VPIP, PFR and aggression against its band<br>S10 Report each bot's BB/100 with a 95% confidence interval<br>S11 Prove the engine over 1,000,000 cash hands with every line-up preset<br>S15 Replay any hand with every bot acting exactly as before<br>S16 Keep TAG and Rock bots inside their style bands<br>S17 Keep Calling station and Maniac bots inside their style bands | S05 Recommend preflop actions at heads-up and full-ring tables<br>S06 Compute multiway and range-versus-range equity within 1.5 points<br>S07 Estimate each opponent's range from their actions in the hand<br>S08 Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD<br>S09 Adjust opponent ranges to their observed play after 30 hands<br>S10 Recommend betting or raising for value<br>S11 Count implied odds for drawing hands<br>S12 Explain every recommendation in plain English with its numbers<br>S13 Prove advice is identical for identical decisions<br>S14 Check advice against preflop golden spots on every test run<br>S15 Check advice against postflop golden spots on every test run |
| **M3** | S18 Deploy the app to GitHub Pages from main when all checks pass | S10 Pre-fill Game Config from my last session<br>S11 Choose Rapid or Realistic speed for the session<br>S12 See a branded splash while the app loads<br>S13 Sit at a random seat with a random starting button<br>S16 See a snapshot of my last session on Home and reopen its report<br>S17 See a first-use message on Home before any session has ended | S18 Play at Realistic bot pace<br>S14 Change speed during a session from the table<br>S15 See an opponent's observed VPIP, PFR and aggression on hover or tap<br>S16 Play on a branded table that fits a 1280 x 720 window<br>S19 Read every amount as US dollars in English<br>S17 Operate every table control with native buttons and large targets | S01 Follow every action of the hand in an action log<br>S02 Keep the action log collapsed or expanded as I left it<br>S03 Play on a table, rail, chips and dealer button drawn in code<br>S04 See each player's bet as chips in front of their seat<br>S05 Watch deals and chip moves animate without slowing my play<br>S06 Recognise each bot by an initials avatar badge<br>S07 See a bot's in-style speech bubble after a table event<br>S08 Keep bot banter rare and free of hidden information<br>S09 See my session's playing time and hands-per-hour pace in the header | S01 Start a sit-and-go where every player has 1,500 chips<br>S02 Raise the sit-and-go limits every 10 hands on the published schedule<br>S03 See the current level, its limits and hands to the next level in the header<br>S04 Leave a busted bot's seat empty for the rest of the sit-and-go<br>S05 Finish a sit-and-go by busting or winning all the chips and see my finishing position<br>S06 See results when I bust in a sit-and-go with the review open<br>S07 Read every sit-and-go chip amount without a $ sign<br>S08 See my last sit-and-go's finishing position in the Home snapshot<br>S09 See the level on Home's Resume entry for a paused sit-and-go<br>S10 Leave a sit-and-go early and get my finishing position<br>S11 Prove the sit-and-go structure over the 1,000,000-hand invariant run | S12 Prove TAG beats tables of each weaker style<br>S13 Keep each bot's style fixed whatever the user does<br>S14 Compute every bot decision within 100 ms | S16 Label advice as approximate at non-reference table sizes<br>S17 Add a short-stack note to sit-and-go advice |

## Grid, part B (E08 to E13)

| | E08 Ask for a hint | E09 Review the hand just played | E10 Read the session report | E11 Track progress over time | E12 Tune the trainer | E13 Rely on a private offline app |
|---|---|---|---|---|---|---|
| **M1** | — | **S01 Review each decision of the hand I just played** | — | — | — | — |
| **M2** | S01 Ask for a hint and see the recommended action with its numbers and reason<br>S02 Mark a decision as hinted when I open the hint | S02 See the numbers and reason behind each reviewed decision<br>S03 See the hand number, my cards, position, result and replay code in the review<br>S04 See opponents' cards in the review only when they were shown at showdown<br>S05 See which reviewed decisions were hinted<br>S06 Continue to rebuy or leave when I bust with the review open<br>S07 See a grade summary badge after each hand when auto-open is off | S01 End the session with Leave table and see its saved report with my cash result<br>S02 See my hands played and error rates per 100 hands in the report<br>S03 See how many of my decisions used a hint in the report<br>S04 See my five style stats against healthy ranges for my table size<br>S05 Leave the table in the middle of a hand<br>S06 See my postflop leaks with evidence and a one-sentence fix<br>S07 See my three most costly leaks first<br>S12 See my preflop leaks by position group | S01 See my Major errors per 100 hands trend on the Statistics screen<br>S02 Group my trends per session or per day<br>S03 Filter my trends by table size and game type<br>S04 See my BB/100 trend from cash hands against a break-even line<br>S06 See the G-2 target line on my Major-error trend<br>S07 Open Statistics or go Home from the Session Report<br>S08 Filter my trends by line-up | S01 Open Settings from Home and see the app version<br>S02 Hide opponent style labels at the table | S01 Ask the browser to keep my history on first launch<br>S02 Return Home from an unexpected error without losing completed hands |
| **M3** | S03 See approximate and short-stack labels on the hint card<br>S04 Get the hint card within one second | S08 See approximate and short-stack labels in review entries<br>S09 Get the review panel within one second of the hand ending | S10 See my playing time and hands per hour in the report<br>S11 See my sit-and-go finishing position in the report | S05 See my average sit-and-go finishing position per trend group<br>S09 See my style stats over my last 1,000 hands against healthy ranges<br>S10 See my style stats separately for each table size I played<br>S11 See whether I met the G-2 goal after 5,000 hands<br>S12 Open Statistics within 2 seconds with 100,000 stored hands | S03 Open Settings over the table without pausing the session<br>S04 Choose the default speed for new sessions in Settings<br>S05 Turn off automatic opening of the Hand Review panel<br>S06 Switch to a four-colour deck<br>S07 Turn bot banter off<br>S08 Delete all my data after confirming<br>S09 Warn me in Settings when the browser can clear my history | S03 Stop dealing when the last hand could not be saved<br>S04 Migrate my stored data in order when a new version changes the schema<br>S05 Keep my old data intact when a migration fails<br>S06 Install TLH Trainer to the Dock from Chrome or Safari<br>S07 Use every screen offline after the first visit<br>S08 Get new versions at the next launch, never mid-session<br>S09 Keep all my data on this device with no third-party requests<br>S10 Reach Home within 3 seconds on a repeat launch<br>S11 Keep every screen within its time limits with 100,000 stored hands<br>S12 Prove every screen passes automated accessibility checks |

## Walking-skeleton path (M1, in dependency order)

1. E01-S01: Bootstrap the strict TypeScript project with one-command checks
2. E01-S02: Run every check in GitHub Actions on each push and pull request
3. E01-S03: Deal every hand from a seeded shuffle with a replay code
4. E01-S04: Rank showdown hands by real poker hand rankings
5. E01-S05: Play a complete fixed-limit hand from blinds to showdown
6. E01-S06: Give each deciding seat only its own view of the hand
7. E01-S07: Run seeded bot-only hands from the command line
8. E01-S08: Check game invariants after every playtest action
9. E03-S05: Read big-index cards drawn in code
10. E07-S01: Recommend a preflop action from the 6-max chart
11. E07-S02: Compute a hand's equity against opponent hands
12. E07-S03: Recommend call or fold after the flop from equity and pot odds
13. E06-S01: Face TAG bots that act from the advice engine
14. E03-S01: Play a complete hand against TAG bots at a default 6-max table in the browser
15. E02-S01: Start a game from Home through Game Config
16. E03-S02: Choose only legal actions with their exact amounts
17. E03-S03: See every seat, the board, the pot and the button at a glance
18. E03-S04: See who won each hand and get the next hand dealt automatically
19. E07-S04: Grade a decision as Correct, Minor error or Major error
20. E09-S01: Review each decision of the hand I just played

## Waves and ordering rationale

| Wave | Epics | Why |
|---|---|---|
| 1 | E01 | Language, test harness and headless playtest harness come first; rules are pure and seeded and everything builds on them. |
| 2 | E07 | Advice needs only the engine (hand evaluator, PlayerView); bots are built on advice (REQ-026). |
| 3 | E06 | Bots need the advice engine; the table needs bots to play against. |
| 4 | E03 | The table needs the engine, advice-driven bots and hand records. |
| 5 | E04, E08, E09, E10 | Presentation, hint, review and the session report each need the table screen, not each other. |
| 6 | E02 | Launch and set up needs the table, the session report (Leave table, Home snapshot, ending a paused session) and the table's pace stories. |
| 7 | E05, E11, E12, E13 | Sit-and-go needs Config, Review and Report; progress needs reports and Home; Settings acts on review, table, cards and banter; install/offline/audit need every screen. |

There are 7 waves because the build chain engine -> advice -> bots -> table -> screens is strict and every later epic depends on the table screen.

Placement notes:
- E01 holds the rules engine and the playtest harness; bot reporting (REQ-062.3) and style band checks (REQ-027.5) live in E06.
- REQ-045 style stat formulas live in E07 (needed by the range model REQ-035.2 and bot bands REQ-027); healthy ranges (REQ-046) live in E10.
- The Home snapshot and first-use message (REQ-003) live in E02.
- Rapid pace is M2 (E03-S13); Realistic pace and speed choice/change stay M3.
- Sit-and-go-specific parts of Must requirements (REQ-002.6, the sit-and-go part of REQ-044.1, REQ-048.5) stay in M3 with the sit-and-go epic E05 by user decision.
- The global DoD carries the tagged NFRs (039.4, 056.1, 057.1, 058.1, 059.1-059.4, 061.2, 064.2); each is also assigned to an epic that delivers it.
