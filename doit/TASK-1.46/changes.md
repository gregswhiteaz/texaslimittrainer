# TASK-1.46 changes

- `tests/support/speed.ts` — added `cpuNowMs()`: process CPU time (user + system) in ms from `process.cpuUsage()`.
- `tests/support/cpu-clock.acceptance.test.ts` — new: SPEC-01 (blocking wait is not counted) and SPEC-02 (2x work is measured as about 2x time).
- `tests/engine/hand-evaluator.perf.test.ts` — throughput and table-build timing use `cpuNowMs()`; header says the times are CPU time.
- `tests/engine/invariants.perf.test.ts` — `timed()` uses `cpuNowMs()`; header says the times are CPU time.
- `tests/advice/equity.perf.test.ts` — per-run p95 timing uses `cpuNowMs()`; header says the times are CPU time.
- `tests/advice/postflop.perf.test.ts` — per-run p95 timing uses `cpuNowMs()`; header says the times are CPU time.
- `tests/advice/equity.test.ts` — "bounds the work…" timing uses `cpuNowMs()`; its comment mentions CPU time.
- `tests/advice/preflop.test.ts` — the 10,000-call timing uses `cpuNowMs()` (imported from `../support/speed`).
- `README.md` — "Speed targets": one sentence saying that local limits are measured in process CPU time.
- `.claude/settings.json` — user-applied change, committed with this story; not modified by the builder.

No new dependencies (`process.cpuUsage` is built into Node).
