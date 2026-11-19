# TASK-1.27 — Questions and answers (user, 2026-11-19)

## Q-1 — Hole-card count message (AC#1)
Current: `<street> has <b> board and <n> burn cards` (misleading for a hole-card error).
**Answer: recommended** — `seat <s> has <k> hole card(s) but should have 2` ("card" when k = 1), e.g. `seat 3 has 1 hole card but should have 2`. Board/burn errors keep the current message.

## Q-2 — Award share mismatch message (AC#2)
Current: `awards pay $<a> but players put in $<c>` (can read "$20 but … $20").
**Answer: recommended** — `award <i> (<pot>) is $<amount> but its winners get $<shares>`, e.g. `award 1 (main pot) is $12 but its winners get $8`. Totals mismatch keeps `awards pay $21 but players put in $20`.

## Q-3 — New messages from A-2 / A-3
**Answer: approve as drafted** — `history is empty after the deal`; `history record <i> is on <street>, which is not a betting street`; `<slot> is <card> but the deck deals <expected>` (slots `seat <s> hole card <1|2>`, `burn card <j>`, `board card <j>`; `no card` for an empty deck position).
