# TASK-11.1: See my Major errors per 100 hands trend on the Statistics screen

Status: Done · Completed: 2026-11-25 · Epic: TASK-11 · Milestone: not recorded in the artifacts · Requirements: REQ-002.3, REQ-004.8, REQ-040.3, REQ-048 (.1, .6, .7, .10, .11, .14), REQ-057.1, REQ-061.1 · Branch: doit/TASK-11.1

## What was asked
Home gets a Statistics entry that opens a Statistics screen: "← Home", title, a totals line ("1,840 hands over 9 sessions") and a chart with one point per complete group of 500 stored hands. A point is the user's unhinted Major-graded decisions per 100 hands, read from stored decision records (nothing re-graded). With 1-499 hands the chart is replaced by "Play <n> more hands to see your first trend point."; with 0 hands by "Play your first hand to see trends.". Spec: doit/TASK-11.1/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Sessions in the totals = distinct sessionIds among valid stored hands; a 0-hand session record is not counted | yes | Only hands carry filter fields | Count every session record |
| A-2 | Order by session `startedAt`, then hand number; missing/invalid session record falls back to the earliest `completedAt`; ties by sessionId | yes | Keeps orphan hands plotted | Drop hands without a session |
| A-3 | Invalid stored hand values are skipped silently | yes | Same as the report's reads | Fail the screen |
| A-4 | Home entry is an optional `onStatistics` prop (menu-secondary, after Resume); App always passes it | yes | Keeps locked HomeScreen unit tests unchanged | Always render, edit more locked tests |
| A-5 | No browser-history entry for Statistics | yes | Only the Table pushes history | Push an entry |
| A-6 | Singular form "1 hand over 1 session" | yes | REQ-048.14 | Always plural |
| A-7 | Own `countText` comma formatter, not toLocaleString | yes | Locale-independent output | Intl.NumberFormat('en-US') |
| A-8 | Value = `bbPer100(majors, 1, 500)`, shown with toFixed(1) | yes | Same rounding as the report tiles | Unrounded |
| A-9 | Hand-written SVG from the storyboard geometry (viewBox 400x160, polyline + circles, no axis labels) | yes | No dependency | Add axis labels |
| A-10 | While loading: back control + h1, chart `aria-busy`, no totals; read runs after `tableWritesSettled()` each time the screen opens | yes | Home's existing pattern | Loading text |
| A-11 | Opt-in speed check: 3,000 hands, click to 6th point visible <= 1,000 ms, Chromium and WebKit | yes | Half of TASK-11.12's 2 s target; timing checks are opt-in | 2,000 ms |
| A-12 | h1 takes focus on open; "← Home" returns with Home's h1 focused | yes | Same as Game Config and Report | n/a |

## Clarifications and decisions
All answered by autopilot (recommended options auto-accepted).
- Q-1: no filter row; later stories add their own selects (D-5).
- Q-2: chart text: h2 "Major errors per 100 hands", note "Each point is 500 hands. Lower is better.", point title "Hands 501–1,000: 1.8", aria-label listing all values (D-6).
- Q-3: read failure shows "Your statistics could not be loaded." in place of the chart, no totals, console.error (D-7).
- Q-4 and Block 1 (locked edits, every check kept, only expected values updated): e2e/home.spec.ts (TASK-2.1), tests/ui/screen-list.acceptance.test.ts (TASK-2.15), e2e/play-money.spec.ts (TASK-2.15/10.2), e2e/resume.spec.ts (TASK-2.6; counts 1 to 2 and 2 to 3, plus Statistics-last check). Also tests/ui/play-money.test.ts fixture gained the `stats` route (not hook-locked).
- D-1: hand-written SVG, no chart library. D-2: slim per-hand aggregate `TrendHand`. D-3: `trendData()` on the opened store, not the `HandStore` interface. D-8: the 3,000-record store read is opt-in; the normal suite proves AC#2 through the pure module in memory.

## What was built
- `src/stats/trends.ts` (new, headless): `trendHand`, `orderHands`, `majorErrorPoints`, `statisticsView`, `countText`, `totalsLine`, `moreHandsMessage`, `pointLabel`, `chartLabel`, fixed texts. `GROUP_SIZE` = 500.
- `src/storage/hand-store.ts`: `trendData()`, one read-only transaction with two `getAll`s, invalid values skipped.
- `src/ui/stats/StatisticsScreen.tsx` (new): renders a `StatisticsView` (undefined = loading, null = failed).
- `src/ui/home/HomeScreen.tsx`, `src/ui/App.tsx`, `src/ui/styles.css`: Statistics entry, `stats` route and read effect (cancelled on leave), styles.
- `e2e/support/screen-list.ts`, `package.json` (slow scripts); docs `docs/stats/trends.md`, `docs/ui/navigation.md`. No new dependency.
- Tests: tests/stats (trends, trends.acceptance, trend-view.acceptance), tests/storage (trend-data, opt-in trend-data-3000), tests/ui (statistics, home-statistics), tests/support/stat-records.ts, e2e/statistics.spec.ts, opt-in e2e/statistics-speed.spec.ts.

## How it was verified
| SPEC item | Covers | Verification | Result |
|---|---|---|---|
| SPEC-01..02, 10 | AC#1, 7, 8 | e2e/statistics.spec.ts (Chromium, WebKit, axe, network), home-statistics test | PASS |
| SPEC-03, 20 | AC#2 | 3,000 records in memory -> 6 recomputed points; opt-in store read | PASS |
| SPEC-04..06 | AC#3-5 | trends.acceptance.test.ts | PASS |
| SPEC-07..09, 15 | AC#6-8 | statistics.acceptance.test.tsx | PASS |
| SPEC-11..12 | AC#9 | play-money walk, screen-list test | PASS |
| SPEC-13..14 | rules | trends.test.ts, trend-data.test.ts | PASS |
| SPEC-16 | speed | opt-in statistics-speed.spec.ts | PASS (both browsers) |
| SPEC-17..19 | checks, docs, N/A | lint, typecheck, npm test; no engine/bots/advice diff | PASS |

- Judge round 1: PASS 20/20, no findings. `npm test`: 1346 passed, 0 failed (294 files; 46 skipped incl. opt-in). Coverage: trends.ts 100%, StatisticsScreen 100% lines. e2e statistics/home/resume/play-money 30/30 in Chromium+WebKit. Production-preview end-to-end passed. Build gate run 1: PASS.

## Review
No blocking findings (code and security review round 1).

### Non-blocking review notes (deliberately not fixed)
- MINOR: trend-view AC#2 test feeds hands already in order.
- MINOR: trends.test.ts cannot tell earliest vs latest `completedAt` as the fallback; only the judge's holdout covers both.
- MINOR: tests/support/stat-records.ts exports unused `TEMPLATE_DECISIONS`.
- NIT: speed check stops the timer on DOM presence, not visibility.

## How to try it
`npm run dev` -> Home -> Statistics. `npx playwright test e2e/statistics.spec.ts`. Opt-in: `TLH_SLOW_TESTS=1 npx vitest run tests/storage/trend-data-3000.acceptance.test.ts` and `TLH_SLOW_TESTS=1 npx playwright test e2e/statistics-speed.spec.ts`.

## Run metrics
Questions 4 (+1 block) · assumptions 12 · review rounds 1 · judge rounds 1 · gate runs 1 · escalations 0 · sendbacks 0 · changed lines 1225 in 25 files (budget 22 files / 1100 lines; overage justified by the reviewer).

## Known limitations and follow-ups
- [trainer] Storyboard Stats.dc.html Group by shows "Every 100 hands" but REQ-048.1 says 500; the build followed the requirement. Align the storyboard (owner: TASK-11.5, grouping options).
- [trainer] `trendData()` reads and validates every record: fine at 3,000, but TASK-11.12 (100,000 hands in 2 s) will likely need a cursor or stored per-hand summaries. Add to TASK-11.12.
- [trainer] Add a test where hands are fed out of order, and one that distinguishes earliest from latest `completedAt` for the A-2 fallback. Owner: TASK-11.1 follow-up AC or TASK-11.5.
- [trainer] Remove the unused `TEMPLATE_DECISIONS` export and make the speed check wait for visibility (NIT).
- Scope exceeded the budget (25 files / 1225 lines vs 22 / 1100), justified by the reviewer.

## Lessons for the factory (proposals — not applied)
- The scope budget missed the locked-test edits (resume.spec.ts surfaced late as Block 1, plus play-money.test.ts). Proposal: the spec step should grep all tests that count Home menu buttons or list routes and include them in D-4 and the budget.
