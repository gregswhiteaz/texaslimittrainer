# Healthy ranges (REQ-046, REQ-044.4)

The Session Report compares the user's five [style stats](style-stats.md) with authored healthy ranges for the
session's reference size. The ranges and their justifications were written for this project (REQ-061.2).

- `src/stats/healthy-ranges.json`: the 15 ranges (5 stats × 3 reference sizes), format
  `{"format": "tlh-healthy-ranges", "version": 1, "ranges": {...}}`.
- `src/stats/healthy-ranges.ts` (headless): `parseHealthyRanges`, `HEALTHY_RANGES` (the file, validated at
  import), `statTenths`, `rangeLabel` and `styleSection`.
- `src/ui/report/ReportScreen.tsx`: the "Your style vs healthy range (…)" section.

## Ranges

Whole percents; both limits are inclusive.

| Size      | Stat       | Healthy | Why                                                                                                                                                                            |
| --------- | ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| heads-up  | VPIP       | 65–90   | Heads-up you post a blind in every hand against a single opponent, so most starting hands are worth playing and folding much more than a third of them gives your blinds away. |
| heads-up  | PFR        | 40–75   | With only one opponent the first raise often takes the pot straight away, so you should raise most hands you play from the button and a fair share from the big blind.         |
| heads-up  | Aggression | 50–70   | One opponent misses the flop most of the time, so your bets and raises should clearly outnumber your calls, while some calls with strong hands let a bluffer keep betting.     |
| heads-up  | WTSD       | 40–55   | Heads-up even ace-high often wins, so you should reach showdown in a large share of the flops you see, but not with every hand that misses.                                    |
| heads-up  | W$SD       | 46–56   | Heads-up you should win about half of your showdowns, since a much higher rate means you fold too often and a much lower one means you call with too little.                   |
| 6-max     | VPIP       | 20–28   | At six players about one hand in four is strong enough to play, because the blinds come round often but several opponents still act after you.                                 |
| 6-max     | PFR        | 14–22   | Most hands worth playing at six players are worth a raise, so your raising rate should sit only a few points below your VPIP.                                                  |
| 6-max     | Aggression | 50–66   | In fixed limit the bettor wins the pot whenever everyone folds, so after the flop a solid player bets and raises more often than they call.                                    |
| 6-max     | WTSD       | 30–42   | At six players you should go to showdown with roughly a third of the flops you see, folding the hands that miss and cannot pay the price of a bet.                             |
| 6-max     | W$SD       | 47–57   | A sound six-player style wins about half of its showdowns or a little more, and a much lower rate means you call down with too many weak hands.                                |
| full ring | VPIP       | 13–20   | With nine or ten players someone behind you holds a strong hand more often, so only about one hand in six is worth playing.                                                    |
| full ring | PFR        | 9–16    | At a full table you should still raise most of the hands you play, so your raising rate stays only a few points below your VPIP.                                               |
| full ring | Aggression | 50–66   | A full table does not change the value of betting first after the flop, so your bets and raises should still outnumber your calls.                                             |
| full ring | WTSD       | 28–40   | At a full table you see flops with stronger hands but against more opponents, so reaching showdown with about a third of your flops is a healthy balance.                      |
| full ring | W$SD       | 47–57   | Because you enter full-ring pots with stronger hands, you should win about half of the showdowns you reach or slightly more.                                                   |

**Validation.** `parseHealthyRanges` requires exactly the three sizes and five stats with no extra keys, whole
limits with `0 ≤ low < high ≤ 100`, and a justification that is one trimmed sentence ending in `.`. A bad file
throws `RangeError('Invalid healthy ranges: <path>')`, e.g. `ranges.6-max.vpip.high`, when the app loads.

**TAG bots.** Over 100,000 all-TAG 6-max hands (seed 42) the bots' VPIP, PFR, Aggression and W$SD fall inside
the 6-max ranges (`tests/stats/healthy-ranges-tag.acceptance.test.ts`, opt-in slow: `npm run test:slow`). Their
WTSD is about 94% because advised play almost never folds after the flop; that is outside the realistic 30–42
range on purpose and is investigated by TASK-7.32. Until then, a user who follows the advice sees WTSD
"too high".

## Reference size

The session's configured table size (`players`) picks the ranges (REQ-005.4): 2 → heads-up; 3–7 → 6-max;
8–10 → full ring. For 3, 4, 5, 7 and 8 players the section is marked approximate:
`Your style vs healthy range (6-max, approximate)`.

## Values and labels

- The value is `part / whole` in tenths of a percent, rounded half up with integers:
  `tenths = floor((2000 × part + whole) / (2 × whole))`, shown as `25.0%`.
- A zero denominator shows `—` and the label `not enough data` (REQ-044.10).
- Otherwise the label compares the same rounded tenths with `low × 10` and `high × 10`: above → `too high`,
  below → `too low`, else `in range` (REQ-044.11). The shown value and its label always agree.
- Row text: `VPIP You 25.0% · healthy 20–28% · in range`. The justifications are not shown on the report.
