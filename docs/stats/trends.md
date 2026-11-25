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
counts (REQ-004.8). A cash-game hand also carries `cash { net, bigBet }` (TASK-11.2, below); a sit-and-go hand
has no `cash` key. Later stories add fields (game type, table size, line-up) here.

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

## Big bets won per 100 hands (TASK-11.2)

A second chart card, `Big bets won per 100 hands`, plots cash-game hands only. Sit-and-go hands never enter it.

- Per hand: `net = netResult(record)` (`src/table/review.ts`), the user's award shares + returned chips − every
  chip the user put in (blinds included), and `bigBet = record.stake.bigBet`. A rebuy is never part of a hand
  record, so it is never a result.
- Group value: `Σ(net_i / bigBet_i) / n × 100`, computed exactly as `bbPer100(Σ net_i × (L / bigBet_i), L, n)`
  with `L` the least common multiple of the group's big bets, so it rounds exactly like the Session Report's
  BB/100 (`bb100Value`). A group of one session's hands equals that session's report BB/100. Example: +12 at
  $4/$8 and −20 at $10/$20 over 2 hands → `L = 40`, `bbPer100(20, 40, 2)` = 25.0.
- Grouping: the hands in the order above, cash hands only, in complete groups of 500 cash hands. A point's
  `firstHand`/`lastHand` are positions among the cash hands. 1,000 cash + 500 sit-and-go hands → 2 points.
- Plot: the same 400×160 plot, with `hi = max(1, values)` and `lo = min(−1, values)` so 0 is always inside it. A
  dashed line (`stroke-dasharray="6 5"`) marks 0, break-even.

| Cash hands            | Shown in the BB/100 card                                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 0                     | `No cash-game hands yet.`                                                                                               |
| 1–499                 | `Play <500 − n> more cash hands to see your first trend point.` (`1 more cash hand`)                                    |
| 500 or more           | `Dashed line: break-even`, the chart, then `Each point is 500 cash hands. Above the dashed line means you are winning.` |
| loading / read failed | only the heading (the failure message is in the first card)                                                             |

- The SVG is labelled `Big bets won per 100 hands, one point per 500 cash hands: +2.7, -1.3`; each point's hover
  title reads `Cash hands 501–1,000: +2.7` (values as on the report tile: `+2.7`, `-1.3`, `0.0`).
- Markers: `p.stats-bb100-message`, `circle[data-bb100-point]`, `line.stats-break-even`, `h2#stats-bb100-title`.

## G-2 target line (TASK-11.3)

Once 1,000 hands are stored, the Major-error chart gets a dashed amber target line at half the G-2 baseline
(REQ-048.3, REQ-048.9).

- Baseline: the unhinted Major errors over the user's first 1,000 hands (`G2_BASELINE_HANDS`) in the order above
  (session start, then hand number). Hinted Majors and forced folds count 0, and hands after the 1,000th never
  change it.
- Target: `g2Target(ordered)` = `bbPer100(m, 2, 1000)`, i.e. m ÷ 20 rounded half away from zero to one decimal
  (62 → 3.1, 63 → 3.2, 0 → 0). The line is drawn at this rounded value. `null` below 1,000 hands.
- Threshold: every stored hand counts (any game type, table size or line-up, hinted or not, forced folds
  included). With 999 or fewer stored hands there is no line and no caption.
- Filters: `statisticsView(data, all = data)` puts the target in `view.g2Target`, computed from `all`, while
  the totals and both charts come from `data`. A filter (TASK-11.4, TASK-11.8) must pass the filtered hands as
  `data` and every stored hand as `all`, so the target never moves with a filter.
- Display: only when the chart plots points. The caption `Dashed line: half your first-1,000 rate (G-2)`
  (`p.stats-goal`) sits above the SVG; the line is `line.stats-target` (`stroke-dasharray="6 5"`, x 0–400).
  The y scale is `max(1, values, target)` so the line stays inside the plot. The SVG label gains
  `. Dashed target line at 3.1`. Without a target the chart markup is unchanged.

## Tests

- `tests/stats/trends.test.ts`, `tests/stats/trends.acceptance.test.ts`: ordering, grouping, counts, texts,
  hinted Majors and a forced fold.
- `tests/stats/trend-view.acceptance.test.tsx`: 3,000 in-memory records over 9 sessions render 6 points
  recomputed by the test.
- `tests/storage/trend-data.test.ts`: the store read skips invalid values and carries each cash hand's net.
- `tests/stats/bb100.acceptance.test.tsx`: BB/100 points recomputed from mixed-stake cash records, sit-and-go
  hands excluded, the break-even line, a session's value equal to its report, and the messages. Records are
  clones of a few really played hands (`cashPool`, `sitAndGoPool`, `cloneRecords` in
  `tests/support/stat-records.ts`).
- `tests/ui/statistics.acceptance.test.tsx`, `tests/ui/home-statistics.acceptance.test.tsx`: screen and Home
  entry markup.
- `e2e/statistics.spec.ts` (every push, Chromium and WebKit): Home → Statistics → Home, the empty state and
  1,840 seeded hands, axe, same-origin requests. `e2e/statistics-bb100.spec.ts`: the BB/100 card for 1,000 cash
  and 500 sit-and-go seeded hands, and the no-cash state. `e2e/statistics-target.spec.ts`: the G-2 caption and
  target line for 1,000 seeded hands.
- `tests/stats/g2-target.acceptance.test.tsx`: the 999/1,000 threshold, the 3.1 target recomputed from the
  records, and the target under game-type, table-size and line-up filters (`statisticsView(filtered, all)`).
- Opt-in (`TLH_SLOW_TESTS=1`): `tests/storage/trend-data-3000.acceptance.test.ts` (`npm run test:slow`) reads
  3,000 stored hands through the store; `e2e/statistics-speed.spec.ts` (`npm run e2e:slow`) checks the 6th point
  of 3,000 stored hands shows within 1,000 ms of clicking Statistics. The 100,000-hand target is TASK-11.12.
