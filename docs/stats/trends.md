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
has no `cash` key. A hand read through `trendHand` also carries `dealtIn`, its dealt-in seat count
(`record.seats.length`, TASK-11.4). Later stories add fields (line-up) here.

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
  $4/$8 and −20 at $10/$20 over 2 hands → `L = 40`, `bbPer100(20, 40, 2)` = 25.0. Every real stake mix has
  `L ≤ 120`. If `L` would exceed `Number.MAX_SAFE_INTEGER` (only a tampered store, TASK-11.14), the value is the
  float sum `v = Σ(net_i / bigBet_i) / n × 100` instead, rounded half away from zero to tenths (0, never −0), so
  the chart always gets a finite value. `gcd` is iterative, so no store can overflow the stack.
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

## Filters: table size and game type (TASK-11.4)

Two labelled selects sit between the header and the first chart card (`.stats-filters`, 44 px targets, shown only
once the data has loaded):

| Select     | Options (value)                                                              | Default |
| ---------- | ---------------------------------------------------------------------------- | ------- |
| Table size | All (`all`), Heads-up (`heads-up`), 6-max (`6-max`), Full ring (`full-ring`) | All     |
| Game type  | All (`all`), Cash (`cash`), Sit-and-go (`sit-and-go`)                        | All     |

- `filterTrendData(data, filter)` in `src/stats/trends.ts` keeps the matching hands in input order, with
  `sessionStarts` unchanged; it returns `data` itself for All / All. Both filters apply together (AND).
- Table size is the session's, not the hand's: the largest `dealtIn` among the session's stored hands, mapped
  through `referenceSizeOf` (REQ-005.4: 2 → Heads-up, 3–7 → 6-max, 8–10 → Full ring). A sit-and-go that started
  6-handed stays 6-max after players bust down to heads-up. Hands without `dealtIn` match only All.
- Game type: Cash iff the hand has `cash`, otherwise Sit-and-go.
- The App keeps the loaded `TrendData` and recomputes `statisticsView(filterTrendData(data, filter), data)` on
  every change. So the totals line, both charts and their messages (including `Play your first hand to see
trends.` and `0 hands over 0 sessions` when nothing matches) come from the matching hands, while the G-2 target
  comes from every stored hand. The BB/100 chart stays cash-only, so Sit-and-go shows `No cash-game hands yet.`
- The selection is not remembered: every opening of Statistics starts at All / All.

## Grouping: every 500 hands, session or day (TASK-11.5)

A third select, **Group by**, follows Game type in `.stats-filters`. Its options, in REQ-048.1 order, are Every 500
hands (`hands`, the default), Session (`session`) and Day (`day`). The Stats storyboard's old `Every 100 hands`
default was corrected to Every 500 hands. The grouping applies to both trend charts and keeps the filters, and a
filter change keeps the grouping: the App recomputes `statisticsView(filterTrendData(data, filter), data,
grouping)`. Grouping and filters are not remembered: every opening of Statistics starts at Every 500 hands and
All / All.

- Every 500 hands: exactly the behaviour above. Its points carry no `group` key.
- Session: one point per session in the filter that has a stored hand, in session start order (`orderHands`: the
  session record's `startedAt`, else its earliest `completedAt`). Sessions are numbered 1…k within the current
  filter, and the label's date is the start's local day.
- Day: one point per local calendar day on which a hand in the filter was completed, ascending. Each hand counts on
  the local date of its own `completedAt`, so a session that runs past midnight is split across two days. "Local"
  is the time zone of the device viewing Statistics (`localDay`, plain `Date` getters). Records store UTC only.
- No minimum group size (REQ-048.10): a 12-hand session is a point. With no hands in the filter the Major card
  shows `Play your first hand to see trends.`
- Values use the same formulas: Major is `bbPer100(unhinted Majors, 1, n)` per group, BB/100 is `bb100Value` of the
  group's cash hands. A group without cash hands has no BB/100 point. With no cash hands the card shows
  `No cash-game hands yet.`, otherwise Session and Day plot from the first cash hand: the `Play n more cash hands`
  message is per-500 only (Q-1).
- Points under Session and Day carry `group` (`{kind:'session',number,day}` or `{kind:'day',day}`). `firstHand` and
  `lastHand` are positions in the groups' concatenated hands (cash hands for BB/100).
- The G-2 target is unchanged: computed from all stored hands, shown whenever the Major chart has points.

| Item              | Session                                                                                | Day                                                                                |
| ----------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Major point title | `Session 3, 10 Nov 2026: 4.2`                                                          | `10 Nov 2026: 4.2`                                                                 |
| BB/100 title      | `Session 3, 10 Nov 2026: +1.5`                                                         | `10 Nov 2026: -0.8`                                                                |
| Major label       | `Major errors per 100 hands, one point per session: …`                                 | `…, one point per day: …`                                                          |
| BB/100 label      | `Big bets won per 100 hands, one point per session: …`                                 | `…, one point per day: …`                                                          |
| Major note        | `Each point is one session. Lower is better.`                                          | `Each point is one day. Lower is better.`                                          |
| BB/100 note       | `Each point is one session's cash hands. Above the dashed line means you are winning.` | `Each point is one day's cash hands. Above the dashed line means you are winning.` |

Dates read `D Mon YYYY` in fixed English (`dayText`), independent of the browser locale.

## Filter: line-up (TASK-11.7)

A fourth select, **Line-up** (`#stats-line-up`), sits between Game type and Group by in `.stats-filters`. Its
options are All (`all`, the default), Mixed, Tough, Soft and Custom, whose values are the stored `LineUpName`s.

- It is the `lineUp` field of `TrendFilter` (`LineUpFilter`), applied in `filterTrendData`. A missing `lineUp`
  means All, so `ALL_TRENDS` (`lineUp: 'all'`) and an older `{tableSize, gameType}` literal both return `data`
  itself when the other filters are All.
- A hand matches by its own stored `lineUp` (`HandRecord.lineUp`, copied by `trendHand`), not by the session
  record. Every hand of a session carries the same name. Custom is one bucket: any table where a bot's style was
  changed from the preset. A `TrendHand` without `lineUp` (synthetic input only) matches only All.
- It combines with Table size and Game type by AND and works under every grouping. The totals line, both charts
  and their messages come from the matching hands, so a line-up with no hands shows `Play your first hand to see
trends.` and `0 hands over 0 sessions`.
- The G-2 target is still computed from every stored hand.
- The selection is not remembered: every opening of Statistics starts at Line-up All.

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
- `tests/stats/trend-filters.acceptance.test.tsx`: the filter options and defaults, table size by session size,
  sit-and-go points, totals, play-more and no-hands messages, cash-only BB/100 and the G-2 target under every
  filter. `e2e/statistics-filters.spec.ts`: changing both selects in the browser, axe, same-origin requests.
- Opt-in (`TLH_SLOW_TESTS=1`): `tests/storage/trend-data-3000.acceptance.test.ts` (`npm run test:slow`) reads
  3,000 stored hands through the store; `e2e/statistics-speed.spec.ts` (`npm run e2e:slow`) checks the 6th point
  of 3,000 stored hands shows within 1,000 ms of clicking Statistics. The 100,000-hand target is TASK-11.12.
- `tests/stats/trend-grouping.acceptance.test.tsx`: the Group by options and default, 9 per-session points and 4
  per-day points (one session past midnight) recomputed from the records, grouping under a filter, a 12-hand
  session, the zero-hand message, the storyboard, and per-session BB/100 equal to each cash session's report.
  `e2e/statistics-grouping.spec.ts`: the App flow in a fixed time zone with axe and same-origin requests.
- `tests/stats/trend-lineup.acceptance.test.tsx`: the Line-up options, default and position, Custom totals and
  points recomputed from the records, Mixed with 6-max together, the Soft empty state under every grouping and the
  G-2 target under every line-up. `e2e/statistics-lineup.spec.ts`: the App flow with axe, reset on reopening and
  same-origin requests.
