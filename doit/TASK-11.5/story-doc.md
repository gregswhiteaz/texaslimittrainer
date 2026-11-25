# TASK-11.5: Group my trends per session or per day

Status: Done · Completed: 2026-11-25 · Epic: TASK-11 · Milestone: m-1 · Requirements: REQ-048 (048.1, 048.2, 048.3, 048.10, 048.12, 048.13), REQ-052.7 · Branch: doit/TASK-11.5

## What was asked
The Statistics screen gets a "Group by" select: Every 500 hands (default), Session, Day. Session and Day re-group both trend charts (Major errors per 100 hands, BB/100), one point per session or per local calendar day, from the first hand, with no minimum group size. Values use the existing formulas. Grouping and the table size / game type filters keep each other. The Stats storyboard default is corrected to per-500. Spec: doit/TASK-11.5/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | "Local calendar day" is the date of `completedAt` in the time zone of the device viewing Statistics (`Date` local getters). No time zone is stored with hands. | yes | Records store UTC ISO only. | Store the offset per hand (format change), or use UTC days. |
| A-2 | A session point is placed and numbered by its record's `startedAt`, else its earliest `completedAt`. Its date is that start's local day. | yes | Reuses `orderHands`. | Order by first stored hand. |
| A-3 | Within a day, hands keep `orderHands` order. `firstHand`/`lastHand` are 1-based positions in the grouping's own sequence, so they stay unique React keys. | yes | Keeps the point shape and `key={point.firstHand}`. | Add a separate key field. |
| A-4 | Session numbers count the sessions plotted under the current filter (1..k). The same session has the same number on both charts. | yes | Numbers match what the user sees. | Number over all stored sessions. |
| A-5 | The G-2 caption and dashed target line still show under Session/Day, computed from all stored hands. | yes | REQ-048.3 ties it to 1,000 stored hands, not to grouping. | Hide it under non-default groupings. |
| A-6 | A group with no cash hands gets no BB/100 point. | yes | `bb100Value` is cash only (REQ-048.4). | None needed. |

## Clarifications and decisions
- Q-1 (auto-accepted, recommended): under Session/Day, BB/100 plots from the first cash hand. The "Play n more cash hands" message (REQ-048.13) applies to Every 500 hands only. Zero cash hands still shows "No cash-game hands yet."
- Q-2 (auto-accepted, recommended): label "Group by"; options Every 500 hands, Session, Day; titles `Session 3, 10 Nov 2026: 4.2` and `10 Nov 2026: 4.2` (BB/100 signed); aria-labels "..., one point per session|day: ..."; notes "Each point is one session|day. Lower is better." and the BB/100 variants; dates in fixed English `D Mon YYYY`; session numbers within the filter.
- D-1/D-2: `statisticsView(data, all, grouping = 'hands')` keeps the view shape. Per-500 points carry no `group` key. The grouping lives in App's stats state, like `filter`. This keeps every locked TASK-11.1 to 11.4 test valid.
- D-6: day keys use plain `Date` getters in `src/stats/trends.ts`, so `src/stats/**` stays headless.

## What was built
- `src/stats/trends.ts`: `TrendGrouping`, `DEFAULT_GROUPING`, `GROUPING_OPTIONS`, `TrendGroup`; optional `group` on points; `sessionStartTimes` factored out of `orderHands`; `localDay`, `dayText`; per-session and per-day point builders (Major via `bbPer100(majors, 1, n)`, BB/100 via `bb100Value`); grouping-aware `pointLabel`, `chartLabel`, `bb100PointLabel`, `bb100ChartLabel`, `chartNote`, `bb100Note`.
- `src/ui/stats/StatisticsScreen.tsx`: "Group by" select (`#stats-group-by`) after Game type, `grouping`/`onGroupingChange` props, notes and labels by grouping. Rendered only when a view exists.
- `src/ui/App.tsx`: `grouping` in stats state. It resets to Every 500 hands on every opening and is passed on filter and grouping changes.
- `dreams/limit-holdem-trainer/storyboards/Stats.dc.html`: options Every 500 hands (selected), Session, Day.
- `docs/stats/trends.md`: Grouping section.
- Tests: `tests/stats/trend-grouping.acceptance.test.tsx` (new), `tests/stats/trends.test.ts` (2 cases), `e2e/statistics-grouping.spec.ts` (new).
- No new dependencies, no stored-format change, no engine/bots/advice change.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..09 | AC#1-8 | `tests/stats/trend-grouping.acceptance.test.tsx` (options, 9 sessions/3,000 hands, past-midnight days, filter kept, 12-hand session, zero hands, storyboard, per-session BB/100 equals Session Report, BB/100 below 500 cash hands) | PASS | judge round 1 |
| SPEC-10, 11 | AC#1-3 | `tests/stats/trends.test.ts` (default path unchanged, day keys, labels, start fallback) | PASS | judge round 1 |
| SPEC-12 | AC#1, 3, 4 | `e2e/statistics-grouping.spec.ts` (New York time zone, Chromium and WebKit, axe, same-origin) | PASS | judge round 1 |
| SPEC-13..15 | DoD | lint, typecheck, `npm test`, coverage, docs, no engine diff | PASS | gates/build-1, fix-2 |

- `npm test`: 1381 passed, 46 skipped (pre-existing). Coverage 94.02% overall, `src/stats` 100% lines. Lint and typecheck clean. New Vitest tests also pass under TZ Pacific/Kiritimati and America/New_York, about 2 s.
- Statistics e2e (grouping, filters, statistics, bb100, target, play-money): 18/18 in Chromium and WebKit.
- Judge round 1: PASS 15/15, no failures, no blocking findings. The judge's own run (preview build, UTC+14 zone, 12 filter/grouping combinations, played sessions compared with their Session Report BB/100) matched an independent computation.
- Gate runs: 2 (build, fix), both PASS.

## Review
Round 1 (code, security): no BLOCKER or MAJOR findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR (code): Vitest day tests run in the machine's time zone (UTC on CI), so a UTC-date bug would pass them. Only the e2e (New York zone) would catch it.
- MINOR (security): `Math.max/min(...points)` in `StatisticsScreen.tsx` throws RangeError at roughly 100k sessions or days and would blank Statistics. Not realistic with real play.
- NIT: `sessionStartTimes` is computed twice under Session/Day.
- NIT: grouping ids ('session', 'day') are used directly as display text.
- NIT: extended-year ISO dates give garbled day text. No fix needed.
- Spec §5 once mentioned a Unicode minus in titles. This was a typo. The ASCII hyphen is correct (matches existing titles).
- Scope: 982 changed lines against a 760 budget. About 650 are tests. The reviewer judged this justified.

## How to try it
`npm run dev`, then Home, Statistics. Change Group by to Session, then Day. Change Table size. Go Home and back, and Group by is reset. Tests: `npm test`, `npx playwright test e2e/statistics-grouping.spec.ts`.

## Run metrics
Questions 2 (both auto-accepted) · assumptions 6 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · sendbacks 0 · changed lines 982 (budget 760).

## Known limitations and follow-ups
- [trainer] Run the Vitest day-grouping tests under a pinned non-UTC zone (for example set `TZ` in the test or use a fixed-offset check) so a UTC-date bug fails in `npm test`, not only in the e2e. Owner: TASK-11.5 follow-up, or TASK-11.12 if it covers Statistics robustness.
- [trainer] Replace the `Math.max/min` spreads over points in `StatisticsScreen.tsx` (lines about 64, 105-106) with loops so very large session/day counts cannot blank Statistics. Fits TASK-11.12 (performance at scale).
- Not tracked (NIT, below the value bar): compute `sessionStartTimes` once; use dedicated display words instead of grouping ids; extended-year ISO day text.
- Not changed: grouping and filters are not persisted across visits (reset on every opening, by design).

## Lessons for the factory (proposals — not applied)
- Specs that depend on time zones should require that Vitest acceptance tests pin a non-UTC zone, since CI runs in UTC. This would have prevented the MINOR code finding.
- The scope budget (760) was set below what a feature with an acceptance file, unit cases and an e2e spec needs. Counting test lines separately in the budget would avoid the warn band.
