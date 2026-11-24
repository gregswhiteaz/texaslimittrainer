File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.14 - Check-advice-against-postflop-golden-spots-on-every-test-run.md

Task TASK-7.14 - Check advice against postflop golden spots on every test run
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 73000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-23 10:38 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (5 direct, 18 total):
├─ TASK-7.4 - Grade a decision as Correct, Minor error or Major error [completed]
│  └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
│     ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
│     │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│     │     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│     │        └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│     └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
│        └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│           └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│              ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
│              └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│                 └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
├─ TASK-7.8 - Recommend betting or raising for value [completed]
│  └─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed]
│     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)
├─ TASK-7.9 - Count implied odds for drawing hands [completed]
│  └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)
├─ TASK-7.11 - Check advice against preflop golden spots on every test run [completed]
│  ├─ TASK-7.6 - Recommend preflop actions at heads-up and full-ring tables [completed]
│  │  └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
│  └─ TASK-7.10 - Explain every recommendation in plain English with its numbers [completed]
│     ├─ TASK-7.6 - Recommend preflop actions at heads-up and full-ring tables [completed] (shown above)
│     ├─ TASK-7.8 - Recommend betting or raising for value [completed] (shown above)
│     └─ TASK-7.9 - Count implied odds for drawing hands [completed] (shown above)
└─ TASK-7.13 - Adjust opponent ranges to their observed play after 30 hands [completed]
   ├─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed] (shown above)
   └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
      └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)

Dependents (1 direct, 1 total):
└─ TASK-7 - Get trustworthy advice [To Do]

Description:
--------------------------------------------------
As a learner, I want the postflop advice checked on every test run against curated spots with agreed answers, so that I can trust the postflop advice and its grades.

Golden-spot suite, part 2: at least 100 postflop spots across flop, turn and river, bringing the suite to at least 200, plus graded examples of each grade level. Clear-cut mechanically means call/fold spots at least 10 points from required equity and bet/check spots at least 15 points from 50% against the calling range. The suite runs in `npm test` and must pass 100%.

## Requirements covered
- REQ-037 (Must): Plain-English explanations — Every recommendation shall include an explanation of at most three sentences in plain English that names and briefly explains the poker concept behind it.
- REQ-038 (Must): Grading rules — The grader shall grade each user decision Correct when it matches the recommendation or a listed acceptable alternative, Major error when the margin rules below mark it clearly wrong, and Minor error otherwise.
- REQ-039 (Must): Golden spot suite — The project shall keep a golden-spot suite of at least 200 clear-cut decisions with justified recommended actions, and the automated test run shall fail if the advice engine disagrees with any of them.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-037, REQ-038, REQ-039, REQ-061

Plan key: E07-S15 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the golden-spot suite, When spots are counted, Then there are at least 100 postflop spots covering flop, turn and river and at least 200 spots in total [REQ-039.1]
- [ ] #2 Given a postflop call/fold spot within 10 points of required equity, or a bet/check spot within 15 points of 50% against the calling range, When the spot validator runs, Then it rejects the spot as not clear-cut [REQ-039.3]
- [ ] #3 Given the graded examples in the suite, When `npm test` runs, Then at least one preflop and one postflop example of each grade (Correct, Minor error, Major error) is graded as recorded [REQ-038.1, REQ-038.2, REQ-038.3, REQ-038.4]
- [ ] #4 Given every postflop golden spot, When its explanation is checked, Then it quotes the equity % and required equity % the recommendation returns [REQ-037.4]
- [ ] #5 Given the complete suite, When `npm test` runs, Then 100% of golden spots pass [REQ-039.4]
- [ ] #6 Given the golden spot suite, When it runs, Then it includes graded examples at Correct, Minor error and Major error, preflop and postflop, each asserting the exact grade, rule id and margin
- [ ] #7 Given preflop spot fr-btn-raise-88 (button holding 88 facing a hijack open, chart says call), When the spot set is extended, Then the chart cell is reviewed for call vs re-raise and the chart and spot agree on the chosen answer with a justification
- [ ] #8 Given preflop spot fr-hj-raise-and-calls-ajs, When its justification is revised, Then it no longer overstates how often the opener holds weaker aces (the claim is about the caller's range)
- [ ] #9 Given preflop spots fr-co-limpers-87s and fr-sb-unopened-65s (call cells whose suited neighbours fold), When the spot set is extended, Then each is replaced by a spot whose chart neighbours share its action, or the chart islands are reviewed and justified

Definition of Done:
--------------------------------------------------
- [ ] #1 Golden spots and their justifications are original, written for this project [REQ-061.2]
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

Implementation Notes:
--------------------------------------------------
AC added from TASK-7.4 follow-up (doc-19).

ACs added from TASK-7.11 review follow-ups.

AC added from TASK-7.11 judge J-1-01.

