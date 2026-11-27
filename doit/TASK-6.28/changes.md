# TASK-6.28 changes

- `src/playtest/cli.ts` — `USAGE` `--check-styles` line now says the bands are judged over 100,000 hands (REQ-027) and shorter runs can fail from sample noise (SPEC-01/03).
- `tests/playtest/cli.test.ts` — full-`USAGE` and `usage[4]` assertions updated to the new wording (SPEC-01/02).
- `docs/stats/style-stats.md` — "In the playtest CLI" gains the 100,000-hand run-length / sample-noise paragraph (SPEC-04).

No new dependencies.
