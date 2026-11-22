# TASK-3.27 changes

- `e2e/rapid-pace.spec.ts` (locked by TASK-3.13; strengthen-only edit approved in Q-2): `meterBotAction` checks the worker-post counter before the user's-turn / hand-over `null` return (SPEC-01, SPEC-03), doc comment updated; the 400 ms self-test's start-up advances the paused clock 1 ms at a time (cap 2 000 fake ms) until the deal shows, then asserts the action count is exactly `2` (was `> 0`) and seat 3 shows `To act` (SPEC-02). No assertion removed or loosened.

No new dependencies. No `src/` changes (mutant M1 was a temporary edit to `src/table/session.ts`, reverted). Temporary stress copies `e2e/zz-stress-fixed.spec.ts` and `e2e/zz-stress-control.spec.ts` were created for SPEC-05 and deleted.
