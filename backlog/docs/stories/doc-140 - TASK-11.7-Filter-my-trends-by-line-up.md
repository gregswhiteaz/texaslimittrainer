---
id: doc-140
title: 'TASK-11.7: Filter my trends by line-up'
type: other
created_date: '2026-11-25T15:12:00Z'
updated_date: '2026-11-25T15:12:00Z'
---
# TASK-11.7: Filter my trends by line-up

Status: Done · Completed: 2026-11-25 · Epic: TASK-11 — Track progress over time · Milestone: m-1 · Requirements: REQ-048 (048.2, 048.3, 048.6, 048.8, 048.9, 048.10) · Branch: doit/TASK-11.7

## What was asked
The Statistics screen gets a "Line-up" select (All, Mixed, Tough, Soft, Custom). It narrows both trend charts, the totals line and the empty-state messages to hands played against that line-up. It combines with the table-size and game-type filters and with every grouping. The G-2 target is still computed from all stored hands (AC#5; the orchestrator moved this AC here from TASK-11.8, where TASK-11.3 had put it by mistake). Spec: doit/TASK-11.7/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The filter uses each hand record's own `lineUp`, not the session record's `config.lineUp`. Totals count distinct sessions among matching hands. | yes | Every hand is stamped with the line-up and the config does not change in a session. Trend data already comes from hand records. | Look up `config.lineUp` per session (needs a second read path). |
| A-2 | A `TrendHand` without `lineUp` matches only All. This happens only in synthetic test input. | yes | Same as TASK-11.4's handling of a missing `dealtIn`. | Treat a missing name as Custom. |
| A-3 | `TrendFilter.lineUp` is optional and missing means All. `ALL_TRENDS` sets it to `'all'`. | yes | Locked TASK-11.4/11.5 tests build filters without it, and a required field would fail typecheck. | Separate prop and state (App changes). |
| A-4 | Option values are `all`, `Mixed`, `Tough`, `Soft`, `Custom`, the stored `LineUpName` itself. | yes | No mapping needed. | Lower-case ids. |
| A-5 | Custom test sessions are real hand-record clones with `lineUp` set to `'Custom'`. Custom is one bucket for any edited line-up. | yes | The record parser only checks the name. Building a real Custom table adds nothing to what the filter tests. | Seat Custom via seat-style edits. |

## Clarifications and decisions
- Q-1 (auto-accepted, recommended): label "Line-up" (the Game Config term), id `stats-line-up`, placed between Game type and Group by. The storyboard gets the same select.
- D-1: `lineUp` is a third field of `TrendFilter`, applied inside `filterTrendData`. No App change is needed, because the App already resets the filter on every opening and recomputes on every change.
- D-3: `ALL_TRENDS` includes `lineUp: 'all'`. The all/all/all case still returns `data` itself.

## What was built
- `src/stats/trends.ts`:
  - Optional `lineUp` on `TrendHand`, `TrendSource` and `TrendFilter`.
  - `LineUpFilter`, `LINE_UP_LABEL` and `LINE_UP_OPTIONS`.
  - `trendHand` copies `lineUp` when present.
  - `filterTrendData` ANDs the line-up with table size and game type.
- `src/ui/stats/StatisticsScreen.tsx`: the Line-up select. It renders only when a view exists.
- `dreams/limit-holdem-trainer/storyboards/Stats.dc.html`: select added (All selected).
- `docs/stats/trends.md`: line-up filter section.
- Tests: `tests/stats/trend-lineup.acceptance.test.tsx` (new), `tests/stats/trends.test.ts` (unit case), `e2e/statistics-lineup.spec.ts` (new).
- No new dependencies and no storage change. Filtering is one extra comparison per hand.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | Acceptance: options, default All, position, hidden without a view | Pass | trend-lineup.acceptance.test.tsx |
| SPEC-02 | AC#2 | Acceptance: Custom counts only Custom sessions, recomputed from records | Pass | same |
| SPEC-03 | AC#3 | Acceptance: Mixed + 6-max, also per session | Pass | same |
| SPEC-04 | AC#4 | Acceptance: Soft with no Soft sessions shows the first-hand message and 0 totals | Pass | same |
| SPEC-05 | AC#5 | Acceptance: G-2 is 3.1 under every line-up (7.5 if filtered) | Pass | same |
| SPEC-06 | AC#2, AC#3 | Unit: `trendHand` and `filterTrendData` | Pass | trends.test.ts |
| SPEC-07 | AC#1, 2, 4, 5 | e2e through the real App, Chromium and WebKit, axe, same origin, reset on reopen | Pass | statistics-lineup.spec.ts |
| SPEC-08..10 | DoD | lint, typecheck, `npm test`, coverage; not-applicable items | Pass | gates, judge |

- `npm run lint && npm run typecheck && npm test`: 1389 passed, 46 skipped, 0 failed. Coverage is 93.67% overall and `src/stats` is 100% statements.
- Gates: build-1 and fix-2 both PASS (526 changed lines).
- Judge round 1: PASS 10/10, no findings. The judge also played real Tough and Custom hands and then seeded 2,254 hands over 10 sessions. All 60 line-up, table-size and game-type combinations (Every 500 hands), plus 40 Session/Day combinations, matched an independent recompute. G-2 was unchanged and the filter reset on reopen.

## Review
Code and security reviews in round 1 found no blocking issues.

### Non-blocking review notes (deliberately not fixed)
- NIT, `tests/stats/trends.test.ts` ~565: `kept.every(...)` is vacuously true for Mixed and Soft, because the fixture has no such hands. Only the `not.toContain` line does work there.
- The AC#3 test's session-start order differs from the spec table on purpose. The reviewer judged this sound.

## How to try it
- `npm run dev`, then Home, Statistics, choose Line-up Custom or Soft. Combine with Table size and Group by. Go Home and back: Line-up is All again.
- `npx playwright test e2e/statistics-lineup.spec.ts`

## Run metrics
Questions 1 · assumptions 5 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 526 (7 files).

## Known limitations and follow-ups
- Custom is one bucket and is not broken down by bot composition (out of scope).
- The line-up filter is not persisted and does not apply to the style-stats section (TASK-11.8 owns that; it can use `TrendFilter`).
- No follow-up tasks.

## Lessons for the factory (proposals — not applied)
None. The run had no send-backs or failures.
