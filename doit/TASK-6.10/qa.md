# TASK-6.10 — Questions and answers (autopilot, 2026-11-22)

## Q-1 — Output format and placement
Recommended: a `Bot results:` header plus one `Bot: <name>, <style>, seat <n>, <hands> hands, <x.xx> BB/100, 95% CI <lo> to <hi>`
row per bot, between the header lines and `Hands played:` in every mode (no locked test changes; default baseline SHA
changes only by these lines); toFixed(2), no -0.00; `95% CI n/a` below 2 hands.
**Answer: auto-accepted (recommended)**

## Q-2 — Names/styles for unnamed seats
Recommended: default runs `Seat N` with style TAG at size 6 and Random otherwise; line-up runs seat 1 is `User`, TAG.
**Answer: auto-accepted (recommended)**
