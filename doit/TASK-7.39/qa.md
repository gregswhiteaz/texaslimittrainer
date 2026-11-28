# TASK-7.39 Q&A

## Q-1 How the 9-seat calling-range run reaches <= 75 ms
Options: (A) 10,000 deals for the user's calling-range run when 7+ opponents are live; (A') 8,000 deals; (B) 10,000 deals for every sampled calling-range run; (C) importance-weighted sampler; (D) keep the 200 ms target.
**Answer: A — 10,000 deals at 7+ opponents (Recommended).** Bots and every spot with 6 or fewer opponents stay byte-identical. The user approves the before/after delta package (signoff.md) before code review; AC#2 ticks only after the dated sign-off entry.

## Sign-off (AC#2)
**User 2026-11-28: Approve** — as shown in signoff.md.
