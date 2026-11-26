---
id: doc-171
title: 'TASK-11.13: Strengthen Statistics trend tests (ordering, fallback, speed wait)'
type: other
created_date: '2026-11-26T19:19:00Z'
updated_date: '2026-11-26T19:19:00Z'
---
# TASK-11.13: Strengthen Statistics trend tests (ordering, fallback, speed wait)

Status: Done · Completed: 2026-11-26 · Epic: TASK-11 — Track progress over time · Milestone: m-1 · Requirements: REQ-048 (follow-ups doc-134, doc-137, doc-138) · Branch: doit/TASK-11.13

## What was asked
Close six review follow-ups on the Statistics trends: (1) shuffled-input ordering test, (2) earliest-`completedAt` fallback test, (3) remove unused `TEMPLATE_DECISIONS` and make the opt-in speed timer wait for the 6th point to be visible, (4) prove the G-2 target uses all stored hands under every filter, (5) unknown filter select value acts as All and drop the unreachable `data === undefined` guard, (6) pin a non-UTC zone for day-grouping Vitest tests. Spec: doit/TASK-11.13/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | AC#5 covers Table size, Game type and Line-up; an unknown value sets only that field to All. Group by is not a filter and is left alone. | yes | Only DOM editing can produce an unknown value. | Also map Group by via `filterOption`. |
| A-2 | Mapping lives in `StatisticsScreen` via pure `filterOption`; `filterTrendData` unchanged. | yes | Value enters the app there; replaces `as` casts. | Handle it inside `filterTrendData`. |
| A-3 | Pinned zone is `Pacific/Kiritimati` (UTC+14, no DST), set in `process.env.TZ`, restored in `afterAll`. | yes | Verified in a Vitest worker; a UTC-date day key breaks existing expectations. | Use `America/New_York` or a Vitest projects split. |
| A-4 | AC#4 is proven by a Playwright test (1,200 seeded hands, real App) plus a Vitest unit test of `filteredStatisticsView`. | yes | Vitest is node-only with no DOM library; adding jsdom is a new dependency. | Add jsdom + Testing Library. |
| A-5 | The e2e uses Group by = Session so every non-empty filter draws a chart and target; six 200-hand sessions cover all 12 size x type combos. | yes | Under Every 500 hands most subsets show no chart. | Seed 500+ hands per category. |
| A-6 | "Visible" = 6th `circle[data-point]` exists, `checkVisibility` true, non-zero bounding box; checked on each DOM mutation and animation frame. | yes | Matches Playwright's `toBeVisible`. | Stop at the first rAF after presence. |

Also: one locked test from TASK-11.5 (`trend-grouping.acceptance.test.tsx`) was edited (import plus one `pinTimeZone` call, no assertion changed); auto-accepted per qa.md.

## Clarifications and decisions
No questions asked. D-1: new acceptance file for AC#1/2. D-2: `filteredStatisticsView` is the single place App computes a view. D-3: `stats` screen state is a two-member union so `data` is required when loaded. D-4: `pinTimeZone` helper throws if the zone is not applied.

## What was built
- `src/stats/trends.ts`: `filteredStatisticsView(data, filter, grouping)` (G-2 from every hand) and `filterOption(options, value)` (unknown id -> `'all'`).
- `src/ui/App.tsx`: split `stats` state; all views via `filteredStatisticsView`; both guards removed.
- `src/ui/stats/StatisticsScreen.tsx`: three filter handlers use `filterOption`.
- `tests/support/stat-records.ts`: `TEMPLATE_DECISIONS` removed, `shuffled` added. `tests/support/time-zone.ts`: `pinTimeZone`.
- New tests: `tests/stats/trend-order.acceptance.test.tsx`, `e2e/statistics-hardening.spec.ts`; extra cases in `tests/stats/trends.test.ts`; zone pin in both day-grouping files.
- `e2e/statistics-speed.spec.ts` (still opt-in): visibility-based timer stop. `docs/stats/trends.md` updated.
- No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01/02 | AC#1, AC#2 | trend-order acceptance test (13 asserts) | pass | judge r1 |
| SPEC-05/07 | AC#4, AC#5 | statistics-hardening e2e (25 asserts) | pass | judge r1, CI |
| SPEC-06/08/10 | helpers, AC#3, AC#6 | trends.test.ts unit cases, pinned zone | pass | judge r1 |
| all 12 items | all ACs | Judge round 1 | PASS 12/12 | judge/verdict-1.json |
- CI run 45881387393 green. Gate runs: 2.

## Review
One review round, no blocking findings.

### Non-blocking review notes (deliberately not fixed)
- Review r1 MINORs (Group by path in AC#4 e2e; doc bullet) and the duplicate `relock_pending` NIT (judge J-1-02) were fixed by the orchestrator, so they are not open.
- Judge J-1-01 LOW: `pinTimeZone` leaves the bad TZ in the worker if it throws. The file still fails, so it cannot pass by mistake.
- Security NIT: the Group by select still casts; an unknown value acts as Day. Reachable only through devtools.

## How to try it
`npm test`; `npm run e2e -- e2e/statistics-hardening.spec.ts`; `npm run e2e:slow` for the speed check.

## Run metrics
Questions 0 · assumptions 6 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · sendbacks 0 · diff about 700 lines of code and tests across 11 files plus docs.

## Known limitations and follow-ups
- Not in scope: `Math.max/min` spread (doc-138) and `screenType()` parser NIT (doc-137).
- Group by cast: no follow-up recommended. It is devtools-only, has no user-visible harm, and was explicitly excluded by A-1. Revisit only if A-1 is reversed.

### Not tracked (infra, below the value bar)
- `pinTimeZone` leaving the bad TZ set when it throws (no real failure possible).

## Lessons for the factory (proposals — not applied)
None significant; the run had no send-backs. Minor: the `relock_pending` duplicate in a locked-owner state.json suggests the unlock tool should de-duplicate entries.
