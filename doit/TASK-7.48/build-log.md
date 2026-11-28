# TASK-7.48 build log

## BUILD
- Implemented the relative rule in `src/advice/ranges.ts` per spec §5 (A-1, A-2).
- Ran `doit.py unlock` for all 8 owner/file pairs (re-checked every `doit/*/state.json`; matches spec §3): TASK-7.13 + TASK-7.43 observed-ranges.acceptance; TASK-7.43 observed-resize; TASK-7.44 observed-reraise; TASK-7.35 small-table-ranges; TASK-9.3 + TASK-7.43 review-numbers; TASK-7.14 postflop-spots.json. Applied only the §5 re-pins.
- Wrote `tests/advice/observed-relative.acceptance.test.ts` (4 tests) and the unit drift test + re-pins.
- Doc: measured the cap thresholds (100 × typical ÷ d per default range). The spec's sentence "the 100 cap is reached only on the widest blind lines" omits the BTN open-raise, which caps earlier at 6-max (PFR 52.1) and at full ring 45.8; the doc names it too, so the sentence is accurate. Required phrases (`no per-seat stats`, `53.8`) kept.
- Sign-off: probe re-run after the build; a6s width 17.27, equity 45.3, raise margin 19.7 Major, fold margin 21.1 Major, call recommended; a8s/55/aks agree and are clear-cut. `Result: MATCH` written to the A-5 path.
- Commands: affected suites `npx vitest run tests/advice tests/golden tests/ui/review-numbers… tests/table/observed-resume…` → 598 passed / 17 skipped after re-pins (1 doc failure, fixed by the doc edit); new + reraise files 10/10; `npm run format`; `npm run lint` clean; `npm run typecheck` clean; `npm test` → 359 files passed (11 skipped), 1595 tests passed, 60 skipped.
- SPEC-06 untouched-files diff vs main: empty.
