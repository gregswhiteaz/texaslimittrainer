
## Q-1 — (user, after judge round 2) Keep the 100,000-hand throughput test in every `npm test`?
User asked whether such extreme scenarios are likely; the 100k run is a speed guard, not a real scenario, and it adds
~5 s locally / 10–30 s in CI to every run. Options: (a) make it opt-in (runs only when asked) [Recommended];
(b) keep it in every run (spec A-9).
**Answer: user — (a) yes, make it opt-in** (2026-11-21). Reverses A-9; SPEC-06 is proven by the opt-in run.
