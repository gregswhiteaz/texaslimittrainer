# TASK-7.26 build log

## BUILD

What I did:
- Authored `src/advice/ranges/heads-up.json` (12) and `src/advice/ranges/full-ring.json` (54) with the Appendix A hands
  (checked token-for-token against the spec table) and new, original justifications.
- `src/advice/ranges.ts`: `APPLICABLE_LINES` for all three sizes from one line rule (6-max order unchanged),
  validator accepts the three sizes, `HEADS_UP_RANGES` / `FULL_RING_RANGES` / `DEFAULT_RANGES` / `rangesFor`, and
  `estimateOpponentRanges` uses `rangesFor(players.length)` with `positionOf(view, ranges.referenceSize)`.
- Tests: new `tests/advice/size-ranges.acceptance.test.ts` (AC#1, AC#2 x2, AC#3), new slow
  `tests/advice/size-ranges-playtest.acceptance.test.ts` (added to `test:slow`), two new unit tests in
  `tests/advice/ranges.test.ts`, rewritten heads-up block + 5-seat fallback in `tests/advice/postflop-ranges.test.ts`.
- The AC#3 doc check collapses runs of spaces, because Prettier pads the band table cells.
- Docs: `range-model.md`, `postflop-rules.md`, `golden-spots.md`.
- Golden (Q-2): six heads-up/full-ring postflop spots stopped being clear-cut or matching (five validation failures,
  one mismatch `hu-river-bb-check-aqo` expected check, got bet). Each was replaced on the same street, size, action,
  line and board; only hole cards, id and justification changed. Logged with margins in `golden-spots.md`. Counts
  120 / 86 / 18 / 16 unchanged. No other locked test was edited (see blocked.json for the one that needs an edit).

Measurements (all-TAG cash, seed 42, five stats summed over every seat; "before" = base commit acb9a32 + spec, run
before any code change, million baseline from an extracted copy of the base tree):

| Size, hands            | VPIP | PFR  | Aggr | WTSD                   | W$SD |
| ---------------------- | ---- | ---- | ---- | ---------------------- | ---- |
| HU 5,000 before        | 79.0 | 47.0 | 66.4 | 42.8                   | 53.6 |
| HU 5,000 after         | 79.0 | 46.9 | 69.4 | 43.4                   | 53.8 |
| HU 10,000 before       | 79.3 | 47.0 | 66.4 | 42.7                   | 53.6 |
| HU 10,000 after        | 79.3 | 47.0 | 69.5 | 43.2                   | 53.9 |
| HU 100,000 after       | 79.3 | 47.0 | 69.5 | 42.7                   | 53.8 |
| HU healthy             | 65–90 | 40–75 | 50–70 | 40–55               | 46–56 |
| 9-max 5,000 before     | 15.2 | 11.3 | 59.6 | 51.2 (OUTSIDE 28–40)   | 50.2 |
| 9-max 5,000 after      | 15.2 | 11.3 | 63.7 | 39.8                   | 50.8 |
| 9-max 10,000 before    | 15.2 | 11.3 | 59.4 | 50.7 (OUTSIDE 28–40)   | 49.8 |
| 9-max 10,000 after     | 15.2 | 11.3 | 63.7 | 38.6                   | 50.5 |
| 9-max 100,000 after    | 15.1 | 11.3 | 63.8 | 38.4                   | 50.9 |
| FR healthy             | 13–20 | 9–16 | 50–66 | 28–40               | 47–57 |

After the change every stat is inside its healthy range at both sizes (no follow-up needed for stats). Closest to an
edge: HU aggression 69.5 (ceiling 70) and 9-max WTSD 38.4 (ceiling 40). Before the change 9-max WTSD was outside.

Commands and results:
- `npm run -s playtest -- --hands 2000 --seed 42` (6-max): byte-identical output before and after (`cmp`).
- `npm run -s playtest -- --hands 10000 --size N`: N=2 0 violations (16.9 s), N=6 0 violations (11.1 s), N=9
  0 violations (10.6 s).
- `npm run -s playtest:million -- --lineups`: PASS, 0 violations both runs. Wall time before 961.7 s (6993 s user),
  after 588.6 s (4880 s user): faster, not slower (narrower starting ranges cut equity work). Note: the TASK-7.6
  50.5 s baseline predates TASK-7.32's action-range bots.
- `npx vitest run tests/golden`: 5 files, 282 tests passed (after the six Q-2 replacements).
- `npx vitest run tests/advice/size-ranges.acceptance.test.ts tests/advice/ranges.test.ts tests/advice/postflop-ranges.test.ts`: 22 passed.
- `npx vitest run tests/advice/range-model.acceptance.test.ts tests/advice/size-ranges.acceptance.test.ts`: 13 passed.
- `npm run lint`: clean (after one `interface` fix). `npm run typecheck`: clean. `npm run format`: run.
- `npm test`: 315 files passed, 1 failed, 6 skipped; 1427 tests passed, 1 failed, 48 skipped (180.6 s). The one
  failure is locked `tests/advice/preflop.acceptance.test.ts` AC#6 (owner TASK-7.2): its sandbox copies an explicit
  file list that lacks the two new range JSON files, so its control typecheck fails with TS2307. Written to
  `doit/TASK-7.26/blocked.json` (recommended: add the two paths to that list, as TASK-7.13 did for hand-order.json).
- `npm run test:slow` (once, nothing else running): 22 files, 100 tests passed; the new SPEC-07 test took 452 s.
- `npm run e2e`: 375 passed, 19 skipped (1.1 min).
