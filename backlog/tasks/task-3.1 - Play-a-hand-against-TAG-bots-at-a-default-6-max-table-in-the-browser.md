---
id: TASK-3.1
title: Play a complete hand against TAG bots at a default 6-max table in the browser
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-22T15:14:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-6.1
  - TASK-1.5
  - TASK-3.5
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-21
parent_task_id: TASK-3
priority: high
type: feature
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to play a complete hand against TAG bots in the browser, so that I can practise real fixed-limit hands from the first build.

Tracer bullet for the Table screen. Until Game Config exists (E02, wave 5) the app opens straight onto a default session: cash game, 6 players, $4/$8, the user plus five TAG bots (E06-S01) acting from the advice engine on their own PlayerView, driven by the E01 engine. This slice draws a minimal table: each seat's name and stack, the user's two hole cards face up (card faces from E03-S05), the dealt board cards, and plain buttons for the engine's legal actions on the user's turn. E03-S02 turns the buttons into the exact-amount action bar; E03-S03 completes the seat, board, pot and header display (including the bottom-centre user seat); E03-S04 shows the result and auto-deals. Cash buy-in is fixed at 20 x the big bet of the session's stake ($160 at $4/$8) and cannot be changed by the user. The user's hole cards are always face up to the user. Bots never act during the user's turn; when a bot is to act it acts without waiting for user input; when it is the user's turn the user never waits for a bot; the user has no decision time limit.

## Requirements covered
- REQ-007 (Must): Cash game buy-in and rebuy — In a cash game, every player shall start with a fixed buy-in of 20 big bets; when the user's stack reaches zero, TLH Trainer shall ask the user to Rebuy (another 20 big bets) or Leave table before the next hand.
- REQ-019 (Must): Showdown and pot award — At showdown, the engine shall rank each eligible player's highest-ranking five-card hand from their two hole cards and the five board cards, award each pot to its highest-ranked eligible hand, and split tied pots equally.
- REQ-024 (Must): Between hands — When a hand ends, TLH Trainer shall show the result, and shall deal the next hand only after the user clicks Deal next hand if the Hand Review panel is open, or automatically after 1.5 seconds if it is not.

Covers: REQ-007, REQ-019, REQ-024

## Notes
Expose the completed hand (seats, every action per seat per street, board, shown cards, the user's decision points with their PlayerViews) to later consumers: E09's basic Hand Review in M1 grades from it, E03-S09 persists it in M2. E02 later puts Home and Game Config in front of this table and hands it the session configuration.

Plan key: E03-S01 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the app opens the default session, When the table is shown, Then it seats the user and five TAG bots in a $4/$8 cash game and every player's stack is $160 [REQ-007.1]
- [x] #2 Given a session configuration with stake $10/$20, When the table starts, Then every player's starting stack is $400 and the Table screen offers no control that changes the buy-in [REQ-007.1]
- [x] #3 Given a seeded deal in the default session, When the user checks or calls at every decision, Then the hand is played through preflop, flop, turn and river to showdown and the user's two hole cards are face up to the user on every street [REQ-019.6]
- [x] #4 Given the user folds preflop, When the remaining bots play on, Then the hand completes to its end with no further user input, the user is never asked to act in it and the user's two hole cards stay face up to the user [REQ-024.4, REQ-019.6]
- [x] #5 Given it is the user's turn, When 10 minutes pass without input, Then it is still the user's turn, no action is taken for the user and no bot has acted [REQ-024.4, REQ-024.5]
- [x] #6 Given the user has acted and the next player to act is a bot, When the bot's decision is ready, Then the bot acts without any user input and play continues to the next player [REQ-024.4]
- [x] #7 Given a bot acts and the next player to act is the user, When the bot's action is displayed, Then the user's action buttons are enabled within 100 ms with no bot delay before them [REQ-024.4]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [x] #2 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [x] #3 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [x] #4 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [x] #5 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [x] #6 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [x] #7 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [x] #8 No new network requests beyond the app's own files [REQ-058.1]
- [x] #9 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [x] #10 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [x] #11 Story documentation is written and published to Backlog.md
- [x] #12 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. src/table/session.ts (headless): seatSession (user + five TAG bots, buy-in 20 big bets), nextStep (deal/bot/user/done), dealHand (newReplayCode), stepBot (tagPolicy via actWith), applyUserAction, userActions, completedHand (JSON-safe CompletedHand).
2. src/ui/table/useTableSession.ts: schedules setTimeout(0) for deal and bot steps, nothing on the user's turn (no time limit), StrictMode-safe.
3. src/ui/table/Table.tsx: minimal table — seat names and stacks, user's hole cards face up (PlayingCard), board, plain legal-action buttons on the user's turn; 'Hand over' status when the hand ends, one hand per load (Q-1). App.tsx renders it and keeps the TLH Trainer heading.
4. Tests: headless session unit/acceptance tests; e2e in Chromium + WebKit with seeded deal via addInitScript, test-only harness for the $10/$20 config, 10-minute clock test for AC#5, <=100 ms button timing for AC#7, axe clean.

Full spec: doit/TASK-3.1/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: src/table/session.ts (headless session: seat, deal, bot steps via tagPolicy, user actions, CompletedHand), src/ui/table/{useTableSession.ts,Table.tsx} (minimal table, Hand over per Q-1), App renders Table; e2e 36 passed in Chromium + WebKit (fake clock paused before load; 10-minute idle check); action buttons given explicit colours to pass WebKit axe contrast; gate PASS. Screenshots: doit/TASK-3.1/table-turn.png, table-end.png.

CI run 44401280144 (head 69dbc9b): success first push (E2E 34 passed). Judge round 1: PASS 21/21, no findings; 900 headless hands and 48 seeded browser hands in Chromium + WebKit: turn order always correct, buttons equal legal actions, no hidden cards in the DOM, one deal per load incl. StrictMode dev, 0 ms button gap, 10-minute idle unchanged. Follow-ups (Step 6a): ACs added to TASK-3.4 (stack carry-over/button/min-stack rule; completedHand fallbacks), TASK-1.26 (src/table headless lint), TASK-3.3 (visible text over data hooks), TASK-2.1 (full SessionConfig), TASK-3.9 (onHandComplete once, tested), TASK-3.13 (no-artificial-delay pacing test). No new tasks needed.

Locked e2e test unlocked for TASK-1.52 Q-1 (user-approved; clock-advance only).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replaced the placeholder with a default 6-max $4/$8 table (you plus five TAG bots, $160 each) that plays one complete hand in the browser: headless session module src/table/session.ts, React hook and minimal Table screen; bots act with no artificial delay and never on your turn; folding lets the bots finish. Per user decision Q-1 it is one hand per page load ('Hand over', reload for a new hand). Verification: gate build-1 PASS (214 tests, coverage 97.9%), Playwright 36 passed in Chromium and WebKit with axe clean, playtest 0 violations; review round 1 clean (mutation check 8 of 11 caught, 3 equivalent). Judge and CI pending. Assumptions A-1..A-12 to review (seating/names from storyboard, no bot delay, in-memory CompletedHand). Follow-ups: TASK-3.4 stack carry-over and button movement, TASK-3.3 visible text over data attributes, TASK-2.1 grow SessionConfig, TASK-3.13 pacing test, add src/table to HEADLESS_DIRS, untested onHandComplete and unreachable completedHand fallbacks. Screenshots: doit/TASK-3.1/table-turn.png, table-end.png.
<!-- SECTION:FINAL_SUMMARY:END -->
