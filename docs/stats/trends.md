# Trends: Major errors per 100 hands (REQ-048, TASK-11.1)

The Statistics screen (Home → Statistics) shows how many hands are stored, over how many sessions, and a trend
of the user's Major errors per 100 hands. Everything is read from the stored hand records; nothing is re-graded
and the advice engine is not called.

- `src/stats/trends.ts` (headless): `TrendHand`, `trendHand`, `orderHands`, `majorErrorPoints`,
  `statisticsView`, `countText`, `totalsLine`, `moreHandsMessage`, `pointLabel`, `chartLabel` and the screen's
  fixed texts.
- `src/storage/hand-store.ts`: `trendData()` reads every hand and session in one read-only transaction (two
  `getAll`s). Each hand is validated by `parseHandRecord` and reduced to a `TrendHand`; each session by
  `parseSessionRecord` to its `startedAt`. An invalid stored value is skipped, with no error shown.
- `src/ui/stats/StatisticsScreen.tsx`: renders a `StatisticsView`. The chart is a hand-written SVG (no chart
  library).

## Per-hand aggregate

`TrendHand { sessionId, handNumber, completedAt, unhintedMajors }`. `unhintedMajors` counts the hand's decision
records graded Major that were not hinted. A fold forced by Leave table has no decision record, so it never
counts (REQ-004.8). Later stories add fields (net big bets, game type, table size, line-up) here.

## Ordering and grouping

1. Hands are ordered by session start, then hand number. A session's start is its record's `startedAt`; if the
   record is missing or invalid, the earliest `completedAt` among its hands. Ties go to the smaller
   `sessionId`.
2. Each complete group of 500 ordered hands is one point; a group may span sessions. The trailing
   `N mod 500` hands form no point (1,200 hands → 2 points, 1–500 and 501–1,000).
3. A point's value is `bbPer100(unhinted Majors in the group, 1, 500)`, the Session Report's per-100 rounding
   (one decimal, half away from zero), shown with one decimal.

## Texts

| Stored hands | Shown in place of the chart                                                |
| ------------ | -------------------------------------------------------------------------- |
| 0            | `Play your first hand to see trends.`                                      |
| 1–499        | `Play <500 − n> more hands to see your first trend point.` (`1 more hand`) |
| 500 or more  | the chart, then `Each point is 500 hands. Lower is better.`                |
| read failed  | `Your statistics could not be loaded.` (no totals line; error logged)      |

- Totals line: `<n> hands over <m> sessions`, singular for 1 (`1 hand over 1 session`), with comma thousands
  separators independent of the browser locale (`1,840 hands over 9 sessions`). Sessions are the distinct
  session ids among the stored hands, so a session with no stored hand is not counted.
- Chart heading `Major errors per 100 hands`. The SVG (`role="img"`) is labelled
  `Major errors per 100 hands, one point per 500 hands: <v1>, <v2>, …`; each point's hover title reads
  `Hands 501–1,000: 1.8`.
- While the read is pending the chart card is `aria-busy` and empty, with no totals line.

## Tests

- `tests/stats/trends.test.ts`, `tests/stats/trends.acceptance.test.ts`: ordering, grouping, counts, texts,
  hinted Majors and a forced fold.
- `tests/stats/trend-view.acceptance.test.tsx`: 3,000 in-memory records over 9 sessions render 6 points
  recomputed by the test.
- `tests/storage/trend-data.test.ts`: the store read skips invalid values.
- `tests/ui/statistics.acceptance.test.tsx`, `tests/ui/home-statistics.acceptance.test.tsx`: screen and Home
  entry markup.
- `e2e/statistics.spec.ts` (every push, Chromium and WebKit): Home → Statistics → Home, the empty state and
  1,840 seeded hands, axe, same-origin requests.
- Opt-in (`TLH_SLOW_TESTS=1`): `tests/storage/trend-data-3000.acceptance.test.ts` (`npm run test:slow`) reads
  3,000 stored hands through the store; `e2e/statistics-speed.spec.ts` (`npm run e2e:slow`) checks the 6th point
  of 3,000 stored hands shows within 1,000 ms of clicking Statistics. The 100,000-hand target is TASK-11.12.
