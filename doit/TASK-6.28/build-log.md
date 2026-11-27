# TASK-6.28 build log

## BUILD
- Replaced the `--check-styles` USAGE line in `src/playtest/cli.ts` and the two matching assertions in `tests/playtest/cli.test.ts` with the §5 wording.
- Added the §5 run-length / sample-noise paragraph to `docs/stats/style-stats.md` "In the playtest CLI". The text is the same as §5, but the source lines are wrapped so that 'used only one way' and 'near a band edge' sit on separate lines. With the original wrapping they shared a line and the SPEC-04 `grep -c` printed 2 instead of 3. The rendered Markdown does not change.
- `npm test`: 338 files passed / 9 skipped; 1516 tests passed / 57 skipped. `npm run lint`: clean. `npm run typecheck`: clean. `npm run format`: run.
- SPEC-03 grep on `npm run playtest -- --help`: 1 match. SPEC-04 grep: 3.
