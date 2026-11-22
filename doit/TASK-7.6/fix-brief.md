# Fix brief — TASK-7.6 (code review R1 MINOR, in-story)
1. `src/advice/preflop.ts:96` — the A-3 fallback in `chartSpotOf` must apply ONLY to a missing limpers spot (as spec and
   doc comment say): `if (hasSpot || situation !== 'limpers') return { position, situation };`. Add a unit test in
   tests/advice/preflop.test.ts (unlocked) that fails without the guard (e.g. a missing non-limpers spot throws / is not
   silently remapped — use a test chart if needed).
SPEC-09's 5.8 s (vs 5 s target) is accepted as a recorded overrun (sweep group, no coverage, 120 s timeout) — no change.
`npm run format`; gate; never push.
