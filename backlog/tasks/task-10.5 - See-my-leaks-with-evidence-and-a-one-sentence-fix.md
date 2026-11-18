---
id: TASK-10.5
title: See my postflop leaks with evidence and a one-sentence fix
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-10.1
  - TASK-3.12
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-10
priority: high
type: feature
ordinal: 82000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see which postflop decision categories were leaks this session, each with its evidence and fix, so that I know exactly what to work on next.

Leak detection over the session's stored decision records (grade and hinted flag, E03-S10). This slice delivers the leak rules, the report's leaks section and the 15 postflop categories: street (flop, turn, river) x facing a bet (fold, call, raise) or not facing a bet (check, bet). A call facing a bet is a call even when the betting is capped. The 16 preflop categories (position group x fold/open/call/raise) are added by E10-S12, which reuses these rules. A category is a leak when it has >= 8 unhinted decisions and >= 40% of its unhinted decisions were graded Minor or Major; hinted decisions are ignored for both thresholds. The forced fold after Leave table mid-hand is not a decision (REQ-004.8). Each postflop category has authored content written in original plain English: a leak title (e.g. "Calling too often on the turn"), an evidence name (e.g. "turn calls") and a one-sentence fix. Evidence reads "<errors> of <decisions> <category> graded as errors" over unhinted decisions. Report section "Biggest leaks this session" lists each leak's title, evidence and fix; with no leaks it reads "No leaks found this session (a leak needs 8+ spots with 40%+ errors)." Ranking and the limit of 3 are E10-S07. In M2 because REQ-044.5 (leaks in the report) is Must.

## Requirements covered
- REQ-044 (Must): Session Report content — When a session ends, TLH Trainer shall show and save a Session Report with the result, volume, error rates, hint usage, the five tracked style stats against their healthy ranges, and the top leaks.
- REQ-047 (Should): Leak detection — The app shall report a decision category as a leak when, within the session, the user faced it 8 or more times and 40% or more of those unhinted decisions were graded Minor or Major errors.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-044, REQ-047, REQ-061

## Notes
Keep the category set as data so E10-S12 only adds the preflop entries.

Plan key: E10-S06 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given decisions where the user called a turn bet, called a river bet when the betting was capped, folded to a river bet and bet the flop with no bet to face, When they are classified, Then they fall in turn-facing-a-bet-call, river-facing-a-bet-call, river-facing-a-bet-fold and flop-not-facing-a-bet-bet respectively [REQ-047.1]
- [ ] #2 Given the postflop category data, When it is validated, Then all 15 postflop categories (flop, turn and river x fold, call, raise facing a bet and check, bet not facing a bet) exist and each has a title, an evidence name and a fix of exactly one sentence [REQ-047.1, REQ-047.5]
- [ ] #3 Given a session with 10 unhinted turn calls of which 4 were graded Minor or Major, When the report is built, Then turn calls is a leak with evidence "4 of 10 turn calls graded as errors" [REQ-047.2, REQ-047.4]
- [ ] #4 Given a session with 7 unhinted river raises all graded Major, When the report is built, Then river raises is not a leak [REQ-047.2]
- [ ] #5 Given a session with 10 unhinted flop bets of which 3 were graded errors, When the report is built, Then flop bets is not a leak [REQ-047.2]
- [ ] #6 Given a category with 5 hinted decisions all graded Major and 7 unhinted decisions all graded Major, When the report is built, Then the category is not a leak; and with 3 hinted Correct plus 8 unhinted of which 4 are errors it is a leak with evidence "4 of 8 <category> graded as errors" [REQ-047.8, REQ-047.2]
- [ ] #7 Given a session with one leak, When its report is shown, Then the leaks section shows that category's title, its evidence and its fix sentence [REQ-044.5, REQ-047.4, REQ-047.5]
- [ ] #8 Given a session with no category meeting the leak thresholds, When its report is shown, Then the leaks section reads "No leaks found this session (a leak needs 8+ spots with 40%+ errors)." and lists no leak [REQ-044.5, REQ-044.9]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Every postflop leak title, evidence name and fix is original text [REQ-047.5, REQ-061.2]
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
<!-- DOD:END -->
