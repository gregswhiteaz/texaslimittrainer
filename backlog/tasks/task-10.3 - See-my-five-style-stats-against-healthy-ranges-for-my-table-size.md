---
id: TASK-10.3
title: See my five style stats against healthy ranges for my table size
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-24T20:47:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-10.1
  - TASK-7.12
  - TASK-6.17
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-10
priority: high
type: feature
ordinal: 69000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see my five style stats against healthy ranges, so that I know which parts of my play style to fix (G-4).

Strategy content plus report section "Your style vs healthy range (<reference size>)". Author healthy ranges (low-high %) for VPIP, PFR, Aggression, WTSD and W$SD at heads-up, 6-max and full ring (15 ranges) as a data file loaded by the app, each with a one-sentence justification in original plain English. Stats are computed over the session's hands with the E07-S08 functions (Aggression is postflop-only per REQ-045.3; a zero denominator shows "—"). Each stat row shows the user's value, the range for the session's reference size and a label: "in range" when low <= value <= high (both limits inclusive, REQ-044.11), "too high" above, "too low" below. Table sizes map to reference sizes per REQ-005.4 (2 -> heads-up; 3-7 -> 6-max; 8-10 -> full ring); for 3, 4, 5, 7 and 8 the mapped ranges are used and the section is marked approximate. The ranges must agree with the bot style bands: the TAG bot's harness stats fall inside the 6-max ranges. A stat shown as "—" carries the label "not enough data" instead of a range label.

## Requirements covered
- REQ-044 (Must): Session Report content — When a session ends, TLH Trainer shall show and save a Session Report with the result, volume, error rates, hint usage, the five tracked style stats against their healthy ranges, and the top leaks.
- REQ-045 (Must): Style stat definitions — The app shall compute the five tracked style stats with these formulas over the hands in scope.
- REQ-046 (Must): Healthy ranges — The app shall load authored healthy ranges for each of the five style stats for each reference size, each with a written justification.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-044, REQ-045, REQ-046, REQ-061

Plan key: E10-S04 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the healthy-range data file, When it is validated, Then it holds exactly 15 ranges (VPIP, PFR, Aggression, WTSD, W$SD at heads-up, 6-max and full ring), each with low < high and a non-empty justification sentence [REQ-046.1, REQ-046.2]
- [ ] #2 Given a 100,000-hand 6-max playtest of TAG bots, When its VPIP, PFR, Aggression and W$SD are computed, Then each falls inside the authored 6-max healthy range; WTSD is authored as a realistic healthy range and is checked against the bots by TASK-7.32, which investigates why advised play almost never folds after the flop [REQ-046.1]
- [ ] #3 Given a 6-max session of 100 hands whose stored hand records hold 25 hands with a voluntary preflop call or raise, 18 with a preflop raise, 11 postflop bets or raises and 9 postflop calls, 20 flops seen, 6 showdowns and 3 showdowns won, When its report is shown, Then the rows show VPIP 25.0%, PFR 18.0%, Aggression 55.0%, WTSD 30.0% and W$SD 50.0%, each next to the authored 6-max range for that stat [REQ-044.4]
- [ ] #4 Given a healthy-range fixture whose 6-max VPIP range is 20-28, When sessions with VPIP 28.0, 20.0, 28.1 and 19.9 are reported, Then the VPIP label is "in range", "in range", "too high" and "too low" respectively [REQ-044.4, REQ-044.11]
- [ ] #5 Given a 2-player session and a 10-player session, When their reports are shown, Then they use the heads-up and full-ring ranges respectively and are not marked approximate [REQ-044.4, REQ-046.1]
- [ ] #6 Given a session at 4 players and a session at 8 players, When their reports are shown, Then they use the 6-max and full-ring ranges respectively and the style section is marked approximate and names that reference size [REQ-046.3]
- [ ] #7 Given a session in which the user never saw the flop, When its report is shown, Then WTSD and W$SD show "—" with the label "not enough data" and no range label [REQ-045.6, REQ-044.10]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Every healthy range carries its written justification and the text is original [REQ-046.2, REQ-061.2]
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. src/stats/healthy-ranges.json: 15 ranges (5 stats × heads-up/6-max/full ring) with original one-sentence justifications; validated on load
2. endSession computes the user's style counts from the session's hand records and stores them once on the report (optional style field)
3. Session Report section 'Your style vs healthy range (size[, approximate])': value, range and in range / too high / too low / not enough data
4. Re-pin two TASK-10.1 locked tests to pass hand records
5. Tests: unit/acceptance per AC, slow-group 100k-hand bot check (VPIP/PFR/Aggression/W$SD), e2e Chromium+WebKit with axe; docs

Full spec: doit/TASK-10.3/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC#2 narrowed per TASK-10.3 Q-2 (auto-accepted): bots measure WTSD ~94% (advice folds ~3% postflop), so WTSD vs bots moves to TASK-7.32; realistic WTSD ranges are authored here.
<!-- SECTION:NOTES:END -->
