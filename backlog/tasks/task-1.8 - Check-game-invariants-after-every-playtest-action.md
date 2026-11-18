---
id: TASK-1.8
title: Check game invariants after every playtest action
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T18:15:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-1.6
  - TASK-1.7
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-16
parent_task_id: TASK-1
priority: high
type: feature
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a project owner, I want every playtest action checked against the game invariants, so that any rules bug is caught with a replayable hand.

After every action the playtest verifies: chip conservation, legal action, cap respected (at most 4 bets per street), pot eligibility, no card dealt twice. On a violation it prints the replay code and action history and exits non-zero. CI runs a 10,000-hand playtest and fails on a violation. Actor 'project owner' = the single Learner in the role of the person who builds and maintains the trainer (requirements.md has only the Learner user class). In M1 the cap check is satisfiable because seat policies never make a fifth bet and stacks are reset to $160 before each hand (see E01-S07); from E01-S10 the engine itself enforces the cap.

## Requirements covered
- REQ-056 (Must): Reliability and invariants — The engine shall complete 1,000,000 headless hands across all table sizes, game types and line-ups with zero invariant violations, and the app shall recover from an unexpected error without losing completed hands.
- REQ-062 (Must): Headless playtest CLI — The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.
- REQ-064 (Should): Continuous integration and deployment — On every push to GitHub, a GitHub Actions workflow shall run lint, typecheck, tests, a 10,000-hand playtest and the build, and on the main branch shall deploy the build to GitHub Pages when all pass.

Covers: REQ-056, REQ-062, REQ-064

## Notes
Fault injection via a test-only engine wrapper; keep the checker in the engine package so unit tests can reuse it.

Plan key: E01-S08 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given any action applied in a playtest, When it is checked, Then the runner verifies that stacks plus pots equal the table total, the action was in the legal set, no street has more than 4 bets, every pot's eligible players contributed to it and still hold cards, and no card was dealt twice [REQ-056.1]
- [x] #2 Given an injected engine fault for each invariant (chips created, illegal action accepted, fifth bet allowed, ineligible pot winner, duplicate card), When the playtest runs, Then it reports that invariant as violated [REQ-056.1]
- [x] #3 Given an invariant violation, When the playtest stops, Then it prints the hand's replay code and full action history and exits non-zero [REQ-062.2]
- [x] #4 Given a push to GitHub, When the CI workflow runs, Then it runs a 10,000-hand playtest and the workflow fails if the playtest exits non-zero [REQ-064.2, REQ-056.1]
- [x] #5 Given an invariant violation during a playtest, When it is detected through the runner's per-action hook, Then the report prints that hand's replay code and full action history (formatHand) and the run exits 1
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
1. src/engine/invariants.ts: checkStep({before, action, result}) and checkState(state) for chips, legal-action, bet-cap, pot-eligibility, cards; fixed messages; shared empty array when clean (<=2 us/action).
2. src/playtest/runner.ts: PlaytestSeams {makePolicy?, onAction?, engine?}; runner drives playerView+policy+applyAction; default onAction = checkStep; hand stops at first violation, run continues; summary gains violationCounts and firstViolation; interim A-4 checks removed.
3. src/playtest/cli.ts: violation detail block only when N>0 (Q-1); exit 1.
4. CI: Playtest step after Test running npm run playtest -- --hands 10000 --seed 42; workflow test extended (TASK-1.7 file, existing assertions kept).
5. Tests: tests/support/faulty-engine.ts with five faults, each detected by exactly one invariant; acceptance AC#1-5; perf check (CI reports only).

Full spec: doit/TASK-1.8/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-1.6 follow-up (doc-15): add an onAction hook to runPlaytest.

tests/ci/workflow.test.ts (TASK-1.7 acceptance test) is extended for AC#4 per spec D-5: playtest command added to the ordered list plus a new AC#4 test; no existing assertion removed or weakened.

Build: src/engine/invariants.ts (chips, legal-action, bet-cap, pot-eligibility, cards; 0.38 us/action), runner seams + per-invariant counts, CLI violation block (Q-1), CI Playtest step, faulty-engine test helper; 138 tests pass; ~1,320 lines vs 1,150 budget (warning); gate PASS.

CI run 44365794015 (head c2295da): success first push; new Playtest step passed. Judge round 1: PASS 11/11; 2.76M clean actions with 0 false positives; own fault engines each caught by only their invariant; clean output byte-identical to TASK-1.6; 9 mutants caught. Follow-ups (Step 6a): created TASK-1.27 (message wording needs user approval, deal-order check, empty-history check, hang-instead-of-fail, describeAction reuse, L4 guard comment implied); ACs added to TASK-1.9, 1.10, 1.12, 1.16, 1.17, 6.9; src/playtest headless lint already TASK-1.26. Skipped: J-1-01 coverage-on timing (speed policy, CI reports only).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added src/engine/invariants.ts (checkState/checkStep) checking chips, legal-action, bet-cap, pot-eligibility and cards after every playtest action via a new onAction hook; a violating hand stops, the run continues, the CLI exits 1 and prints counts, first violation, replay command and full history (user decision Q-1, only when N>0). CI gains a Playtest step (10,000 hands, seed 42). Verified: npm test 138 passed/1 skipped, invariants.ts 100% lines, five fault-injection engines each caught by exactly their invariant, checker 0.38 us/action (budget 2 us); review r1 MAJOR (seven untested sub-check clauses) fixed and re-verified with the seven mutants, r2 clean; one gate failure (test-row type error) fixed. Judge and CI pending. Review assumptions A-1..A-12 in the doc. Size 1,385 vs 1,150 lines (warn). Follow-ups: TASK-1.9/1.10/1.12/1.16/1.17/6.9, deal-order invariant, message wording (needs user approval).
<!-- SECTION:FINAL_SUMMARY:END -->
