# TASK-6.17 changes

- `src/bots/style.ts` — new shared `postflopValueMove` helper applying a style's `postflopValue` bar (check/call instead of an advised postflop bet/raise at or below the threshold).
- `src/bots/rock.ts` — postflop branch now uses `postflopValueMove` (behaviour unchanged).
- `src/bots/calling-station.ts` — applies the `postflopValue` bar after `recommend`, before any deviation draw; doc comment updated.
- `src/bots/styles/calling-station.json` — new `postflopValue` block (`thresholdPct: 88` + justification).
- `src/bots/styles/maniac.json` — `postflop/check/bet` and `postflop/call/raise` probabilities 0.85 → 0.6; `postflop/check/bet` justification rewritten (A-3).
- `tests/bots/calling-station-postflop.acceptance.test.ts` — new every-push acceptance file (SPEC-04, SPEC-05, SPEC-06).
- `tests/bots/style-bands.acceptance.test.ts` — locked re-pin (Q-3): Calling station and Maniac bands added; titles now "every bot style…" (SPEC-01, SPEC-02).
- `tests/bots/rock-postflop.acceptance.test.ts` — locked re-pin (Q-3): Calling station now has an 88 bar; TAG and Maniac none.
- `tests/bots/maniac.acceptance.test.ts` — locked re-pin (Q-3): postflop probabilities 0.6; Example C now calls 8.
- `tests/playtest/replacement.acceptance.test.ts` — locked re-pin (Q-3): first replaced hand is the first whose seat styles differ from hand 1.
- `tests/playtest/cli.test.ts` — unlocked pin: seed-42 first replacement now at hand 18 (17 → 0, 18 → 1).

No new dependencies.

## FIX round 1
- `tests/bots/maniac.acceptance.test.ts` — Example A comment now says the 0.6 threshold; new Example H (call[2], river 7h Qh facing 8, draw 111952548 < 0.6 × 2^32) pins a postflop call → raise to 16 (strengthen only).
