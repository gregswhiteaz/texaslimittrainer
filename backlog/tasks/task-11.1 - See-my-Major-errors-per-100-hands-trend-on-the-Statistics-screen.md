---
id: TASK-11.1
title: See my Major errors per 100 hands trend on the Statistics screen
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-25T08:57:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-2.1
  - TASK-3.12
  - TASK-10.4
  - TASK-10.2
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-134
parent_task_id: TASK-11
priority: high
type: feature
ordinal: 81000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see my Major errors per 100 hands plotted per 500 hands across all my stored hands, so that I can see whether my mistakes are shrinking (G-2).

Adds the Statistics entry to Home (E02-S01) and the Statistics screen (Stats storyboard: '← Home' back control, title, totals line, filter row, Major-error chart). All stored hands, of paused and ended sessions, are ordered chronologically (session start, then hand number) and split into consecutive groups of 500 hands; only complete 500-hand groups are plotted (REQ-048.11), the trailing incomplete group forms no point. Group value = the user's unhinted decisions graded Major in the group's hands / hands in the group x 100, read from the stored decision records (E03-S10: grade and hinted flag), never recomputed by the advice engine; the same unhinted rule as the report (E10-S02). The forced fold after Leave table mid-hand (REQ-004.8) has no grade and is never counted. At per-500 grouping with 1 to 499 hands in the filter the chart is replaced by 'Play <n> more hands to see your first trend point.' where n = 500 - hands, singular 'Play 1 more hand ...' when n is 1 (REQ-048.7, REQ-048.14); with zero hands in the filter the screen shows 'Play your first hand to see trends.' instead (REQ-048.10). The totals line reads e.g. '1,840 hands over 9 sessions'. Filters are E11-S03 and E11-S08, other groupings E11-S02, BB/100 E11-S04, target line E11-S06.

## Requirements covered
- REQ-002 (Must): Home screen menu — The Home screen shall offer New game, Statistics and Settings, and shall offer Resume session only while a paused session exists.
- REQ-004 (Must): Pause, resume and end a session — When the user goes Home or closes the app during a session, TLH Trainer shall keep that session as a paused session that can be resumed at the start of the next hand; when the user chooses Leave table, it shall end the session and open the Session Report.
- REQ-040 (Should): Hinted decisions — When the user requested a hint before acting, the grader shall still grade the decision but shall mark it hinted and exclude it from the major-error rate used for goal G-2.
- REQ-048 (Must): Statistics screen trends — The Statistics screen shall chart the user's Major errors per 100 hands and BB/100 over all stored hands, grouped per 500 hands by default and switchable to per session or per day, filtered by table size and game type.
- REQ-057 (Should): Accessibility and usability — Every screen shall meet WCAG 2.1 AA contrast and control-labelling rules, and every grade or status shown in colour shall also be shown as text.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-002, REQ-004, REQ-040, REQ-048, REQ-057, REQ-061

## Notes
Put trend computation in a pure statistics module (no UI imports, REQ-059.2) that takes hand/decision records and returns points; the screen only renders. Keep per-hand aggregates (Major count, unhinted flags, net won in big bets) cheap to read for E11-S12.

Plan key: E11-S01 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the Home screen, When the user chooses Statistics, Then the Statistics screen opens; and When the user chooses Home on it, Then the Home screen opens [REQ-002.3]
- [x] #2 Given a seeded data set of 3,000 stored hands across 9 sessions, When the Statistics screen opens, Then the Major-error chart is grouped per 500 hands and plots 6 points, each equal to the unhinted Major errors per 100 hands recomputed from the stored hand records of that group [REQ-048.1]
- [x] #3 Given a 500-hand group containing 5 unhinted and 5 hinted Major errors, When its point is plotted, Then its value is 1.0 [REQ-040.3, REQ-048.1]
- [x] #4 Given a 500-hand group in which the only non-Correct decision record is a forced fold after Leave table, When its point is plotted, Then its value is 0.0 [REQ-004.8, REQ-048.1]
- [x] #5 Given 1,200 stored hands, When the chart is shown per 500 hands, Then it plots exactly 2 points (hands 1-500 and 501-1,000) and the remaining 200 hands form no point [REQ-048.11, REQ-048.1]
- [x] #6 Given 320 stored hands, When the Statistics screen opens at per-500 grouping, Then it shows 'Play 180 more hands to see your first trend point.' instead of a chart; and Given 499 stored hands, Then it shows 'Play 1 more hand to see your first trend point.' [REQ-048.7, REQ-048.14]
- [x] #7 Given no stored hands, When the Statistics screen opens at per-500 grouping, Then it shows 'Play your first hand to see trends.' instead of a chart, no 'Play <n> more hands' message, and totals of 0 hands over 0 sessions [REQ-048.10, REQ-048.7, REQ-048.6]
- [x] #8 Given 1,840 stored hands over 9 sessions, When the Statistics screen opens with no filter applied, Then it shows a total of 1,840 hands over 9 sessions [REQ-048.6]
- [x] #9 Given the Statistics screen is added, When the play-money check runs, Then it is registered in e2e/support/screen-list.ts and visited by the play-money walk
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 axe reports zero serious or critical violations on the Statistics screen with data and in the empty state ('Play your first hand to see trends.'), in Chromium and WebKit [REQ-057.1]
- [x] #2 The Statistics screen offers no deposit, payment, purchase, cash-out, real-money wager or real-money conversion [REQ-061.1]
- [x] #3 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [x] #4 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [x] #5 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [x] #6 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [x] #7 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [x] #8 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [x] #9 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [x] #10 No new network requests beyond the app's own files [REQ-058.1]
- [x] #11 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [x] #12 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [x] #13 Story documentation is written and published to Backlog.md
- [x] #14 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Pure trends module: per-hand summaries, ordering, 500-hand grouping, unhinted Majors per 100, totals, screen text
2. Store read trendData() in one read-only transaction
3. Statistics screen (route, Home entry, ← Home, totals, hand-written SVG chart, empty / not-enough / load-failure states)
4. Register in the play-money screen list; update locked Home/route/play-money tests (Q-4)
5. Tests: fast 3,000-summary AC#2 in normal suite; store-level 3,000 read and speed check opt-in slow

Full spec: doit/TASK-11.1/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-2.15 follow-up (doc-124).

Build: Statistics screen (Home entry, totals, hand-written SVG chart of unhinted Majors per 100 hands per 500 hands, empty / not-enough / load-failure states), pure src/stats/trends.ts, store trendData(); play-money registration; locked Home/route/play-money/resume tests re-pinned (Q-4, Block 1). npm test 1346 pass; full Playwright 304 pass + resume fixed; slow store read and speed check pass (opt-in). gate PASS.

Judge r1 PASS 20/20: production preview, Chromium and WebKit — 1,200 shuffled seeded hands over 5 sessions showed 1,200 hands over 5 sessions and points 17.8, 16.8 matching an independent computation; 0/320/499/500 messages, load failure, focus and axe checked. CI 45578835504 green.

Follow-ups: TASK-11.5 AC (Group by default vs storyboard), TASK-11.12 AC (100k read strategy), TASK-11.13 (test hardening).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a Statistics entry on Home and a Statistics screen with a totals line and a Major errors per 100 hands chart (one point per 500 stored hands, unhinted Majors only, read from stored records; messages for 0 and 1-499 hands). Logic is in the headless src/stats/trends.ts; the store gained a one-transaction trendData() read. Verified: judge round 1 PASS 20/20, npm test 1346 passed, e2e 30/30 in Chromium and WebKit with axe, opt-in 3,000-hand store and speed checks passed. Review assumptions A-1..A-12, Q-1 (no filter row), Q-2 chart text, Q-3 load-failure text, and the locked-test edits (home, screen-list, play-money, resume). Follow-ups: 100,000-hand read needs a cursor or stored summaries (TASK-11.12); storyboard says Every 100 hands vs REQ-048.1's 500; two test MINORs and one NIT.
<!-- SECTION:FINAL_SUMMARY:END -->
