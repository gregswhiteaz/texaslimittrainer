File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.11 - Check-advice-against-preflop-golden-spots-on-every-test-run.md

Task TASK-7.11 - Check advice against preflop golden spots on every test run
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 46000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-17 23:22 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (2 direct, 14 total):
├─ TASK-7.6 - Recommend preflop actions at heads-up and full-ring tables [completed]
│  └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
│     └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│        └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│           ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│           │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│           │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│           └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│              └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
└─ TASK-7.10 - Explain every recommendation in plain English with its numbers [completed]
   ├─ TASK-7.6 - Recommend preflop actions at heads-up and full-ring tables [completed] (shown above)
   ├─ TASK-7.8 - Recommend betting or raising for value [completed]
   │  └─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed]
   │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
   │        ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
   │        │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
   │        └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
   └─ TASK-7.9 - Count implied odds for drawing hands [completed]
      └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)

Dependents (2 direct, 2 total):
├─ TASK-7 - Get trustworthy advice [To Do]
└─ TASK-7.14 - Check advice against postflop golden spots on every test run [To Do]
   └─ TASK-7 - Get trustworthy advice [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want the preflop advice checked on every test run against curated spots with agreed answers, so that I can trust that preflop advice never silently changes.

Golden-spot suite, part 1: format, validator, runner wired into `npm test` (REQ-063.1) and at least 100 preflop spots across heads-up, 6-max and full ring. Each spot records the player view, any observed opponent stats, the recommended action, any acceptable alternative and a written justification. Only clear-cut spots that follow from established limit theory are included; mechanically, preflop spots must sit on chart cells not flagged borderline. Spots and justifications are written for this project.

## Requirements covered
- REQ-037 (Must): Plain-English explanations — Every recommendation shall include an explanation of at most three sentences in plain English that names and briefly explains the poker concept behind it.
- REQ-039 (Must): Golden spot suite — The project shall keep a golden-spot suite of at least 200 clear-cut decisions with justified recommended actions, and the automated test run shall fail if the advice engine disagrees with any of them.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.
- REQ-063 (Should): Test commands — The project shall provide npm scripts that run each check with one command.

Covers: REQ-037, REQ-039, REQ-061, REQ-063

Plan key: E07-S14 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a golden-spot file, When the spot validator runs, Then each spot has a PlayerView, the recommended action, zero or one acceptable alternative and a written justification, and a spot missing any of them fails validation naming the spot [REQ-039.2]
- [ ] #2 Given a clean checkout, When `npm test` runs, Then it runs the golden-spot suite together with the Vitest unit and fast-check property tests [REQ-063.1, REQ-039.4]
- [ ] #3 Given a spot where the advice engine's action differs from the recorded action and its acceptable alternative, When `npm test` runs, Then the run fails naming the spot, the expected action and the actual action [REQ-039.4]
- [ ] #4 Given the preflop spots, When they are counted, Then there are at least 100 and every reference size (heads-up, 6-max, full ring) and every chart situation is represented [REQ-039.1]
- [ ] #5 Given a preflop spot on a chart cell flagged borderline, When the spot validator runs, Then it rejects the spot as not clear-cut [REQ-039.3]
- [ ] #6 Given every golden spot, When its explanation is checked, Then it has at most three sentences and names at least one listed concept [REQ-037.1, REQ-037.2]

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

