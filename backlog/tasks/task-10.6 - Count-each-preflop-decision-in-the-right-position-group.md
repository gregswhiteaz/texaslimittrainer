---
id: TASK-10.6
title: See my preflop leaks by position group
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-25T06:45:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-10.5
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-131
parent_task_id: TASK-10
priority: high
type: feature
ordinal: 83000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see preflop leaks for the position group I acted from, so that preflop leaks point at the seats where I really go wrong.

Adds the 16 preflop categories to leak detection (rules and report section from E10-S06): position group x action taken (fold, open, call, raise). Position groups count back from the button: button and cutoff are late, the next two seats are middle, all remaining non-blind seats are early, the small and big blinds are blinds. Heads-up the button is late and the other player is blinds. Only seats dealt into the hand count (empty sit-and-go seats are skipped). Action mapping: open = first raise into an unopened or limped pot; raise = raising after someone has raised; call = any preflop call, including a limp (calling the big blind in an unopened pot) and the small blind completing; fold = fold. A big blind checking its option is none of fold, open, call or raise, so it falls in no leak category (it still counts in error rates, REQ-044.2), REQ-047.9. Each preflop category has authored content in original plain English: title, evidence name (e.g. "early-position folds") and one-sentence fix.

## Requirements covered
- REQ-044 (Must): Session Report content — When a session ends, TLH Trainer shall show and save a Session Report with the result, volume, error rates, hint usage, the five tracked style stats against their healthy ranges, and the top leaks.
- REQ-047 (Should): Leak detection — The app shall report a decision category as a leak when, within the session, the user faced it 8 or more times and 40% or more of those unhinted decisions were graded Minor or Major errors.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-044, REQ-047, REQ-061

## Notes
Reuses the E10-S06 leak rules and report section; limp/SB-complete/BB-check mapping per REQ-047.9.

Plan key: E10-S12 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a 9-player hand, When seats are grouped, Then button and cutoff are late, hijack and lojack are middle, the three seats after the big blind are early and small and big blind are blinds [REQ-047.6]
- [x] #2 Given a 6-player hand, When seats are grouped, Then button and cutoff are late, the two seats after the big blind are middle, no seat is early and small and big blind are blinds [REQ-047.6]
- [x] #3 Given a 4-player hand, a 3-player hand and a heads-up hand, When seats are grouped, Then in the 4- and 3-player hands the non-blind seats are late and no seat is middle or early, and heads-up the button is late and the other player is blinds [REQ-047.6]
- [x] #4 Given preflop decisions where the user open-raised from the button, called a raise from the big blind, re-raised from the hijack at 6-max and folded from under the gun at 9-max, When they are classified, Then they fall in late-open, blinds-call, middle-raise and early-fold respectively [REQ-047.1, REQ-047.7]
- [x] #5 Given an unopened 6-max pot, When the user calls the big blind from the cutoff, completes from the small blind, or raises from the button after one limper, Then the decisions fall in late-call, blinds-call and late-open respectively [REQ-047.1, REQ-047.9]
- [x] #6 Given the big blind checks its option after the small blind completes, When the decision is classified, Then it falls in no preflop category and adds to no category's decision or error count [REQ-047.1, REQ-047.9]
- [x] #7 Given the preflop category data, When it is validated, Then all 16 preflop categories exist (early, middle, late and blinds x fold, open, call, raise) and each has a title, an evidence name and a fix of exactly one sentence [REQ-047.1, REQ-047.7, REQ-047.5]
- [x] #8 Given a 9-player session with 10 unhinted early-position folds of which 4 were graded errors, When its report is shown, Then the leaks section lists that category's title, the evidence "4 of 10 early-position folds graded as errors" and its fix [REQ-047.7, REQ-047.2, REQ-044.5]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Every preflop leak title, evidence name and fix is original text [REQ-047.5, REQ-061.2]
- [x] #2 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [x] #3 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [x] #4 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [x] #5 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [x] #6 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [x] #7 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [x] #8 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [x] #9 No new network requests beyond the app's own files [REQ-058.1]
- [x] #10 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [x] #11 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [x] #12 Story documentation is written and published to Backlog.md
- [x] #13 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Append 16 preflop leak categories (early/middle/late/blinds x fold/open/call/raise) to src/stats/leak-categories.json with approved text
2. Classify each unhinted preflop decision by position group (REQ-047.6, from the stored button) and action (open vs raise per the advice engine's test)
3. Count them into the existing write-once leakCounts; same leak rule and evidence format
4. Re-pin TASK-10.5 AC#2 to the postflop subset and add the preflop-id check; docs

Full spec: doit/TASK-10.6/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: 16 preflop leak categories appended (approved text); unhinted preflop decisions classified by position group (from stored button) and open/raise/call/fold; counted in the existing write-once leakCounts; TASK-10.5 AC#2 re-pinned to the postflop subset plus a 16-preflop-id check (D-3). npm test 1322 pass; report e2e 14 pass; gate PASS.

Judge r1 PASS 15/15: live Chromium (33 hands) and WebKit (51 hands) sessions — stored leakCounts matched an independent recount; early-call leak shown with approved text; positionGroup matched an independent REQ-047.6 implementation over 10,000+ cases. CI 45561004627 green. Orchestrator fixed the garbled leakCounts sentence in docs/storage/reports.md (J-1-01).

Follow-ups: TASK-10.15 (compute group once per hand, reuse userMade). Preflop-after-postflop order owned by TASK-10.8. BB-check case covered by unit tests (SPEC-06); no task.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the 16 preflop leak categories (position group x fold/open/call/raise) to the same data file, leakCounts record, leak rule and Biggest leaks section; no UI, engine or DB change. Verified: lint, typecheck, npm test (1322 passed), CI green, judge PASS round 1 incl. live 9-player Chromium/WebKit runs matching an independent tally. Review: ids <group>-<action> appended after postflop (Q-1), the 16 preflop texts (Q-2), the locked TASK-10.5 AC#2 edit narrowed to postflop (D-3), assumptions A-1..A-6. Risks/follow-ups: preflop leaks list after postflop until TASK-10.8 ranks them; BB check only unit-tested; minor refactors (compute group once per hand, reuse userMade); scope 1181 lines vs 950 (mostly tests).
<!-- SECTION:FINAL_SUMMARY:END -->
