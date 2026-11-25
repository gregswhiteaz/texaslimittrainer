---
id: TASK-11.8
title: See my style stats over my last 1,000 hands against healthy ranges
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-25T14:29:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-11.7
  - TASK-10.3
  - TASK-7.12
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-11
priority: medium
type: feature
ordinal: 108000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see my five style stats over my most recent 1,000 hands against the healthy ranges, so that I can see whether my style is moving toward sound play (G-4).

Section 'Style stats in healthy range (goal: 4 of 5)' (Stats storyboard). Uses the most recent 1,000 hands in the current filter (all of them when fewer). VPIP, PFR, Aggression, WTSD and W$SD via the E07-S08 functions; healthy ranges and labels as in the report (E10-S04): in range when low <= value <= high, too high above, too low below. With a single reference size in the filter, one block for that size; per-reference-size blocks for All are E11-S10. Then '<k> of 5 in range (goal: 4)'. A stat with a zero denominator shows '—' and does not count as in range.

## Requirements covered
- REQ-049 (Should): Style stats and goal status — The Statistics screen shall show the user's five tracked style stats over their most recent 1,000 hands in the current filter against the healthy ranges, and state how many of the five are in range.

Covers: REQ-049

## Notes
Reuse the E10-S04 range data and label function.

Plan key: E11-S09 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given 1,500 stored 6-max hands and the table size filter 6-max, When the style section is shown, Then VPIP, PFR, Aggression, WTSD and W$SD each show the value computed from the most recent 1,000 hands, the authored 6-max range and the label in range, too high or too low [REQ-049.1]
- [ ] #2 Given authored 6-max VPIP range low-high, When the VPIP over the last 1,000 hands equals low, equals high, is above high and is below low, Then the label is 'in range', 'in range', 'too high' and 'too low' respectively [REQ-049.1]
- [ ] #3 Given 4 of the 5 stats are in range, When the style section is shown, Then it reads '4 of 5 in range (goal: 4)' [REQ-049.2]
- [ ] #4 Given 400 stored 6-max hands in the filter, When the style section is shown, Then the stats are computed over all 400 hands [REQ-049.1]
- [ ] #5 Given 6-max hands in which the user never saw the flop, When the style section is shown, Then WTSD and W$SD show '—', are not counted as in range, and the count reads at most '3 of 5 in range (goal: 4)' [REQ-049.2]
- [ ] #6 Given a seeded data set and each combination of game type and line-up filter at 6-max, When the style section is shown, Then every value and the in-range count equal values recomputed from the most recent 1,000 matching hand records [REQ-049.1, REQ-049.2]
- [ ] #7 Given zero hands in the current filter, When the style section is shown, Then all five stats show '—' and it reads '0 of 5 in range (goal: 4)' [REQ-049.1, REQ-049.2]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
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
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-11.3 Q-1.

AC#8 (line-up filter keeps the G-2 target from all hands) was added here by mistake from TASK-11.3 Q-1; moved to TASK-11.7, which owns the line-up filter.
<!-- SECTION:NOTES:END -->
