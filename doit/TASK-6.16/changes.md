# Changes — TASK-6.16

- `src/bots/style.ts` — `PostflopValue` type, `BotStyleData.postflopValue` (null when absent), validation of the
  `postflopValue` block in `parseStyle` (object, `thresholdPct` finite in [50, 100], justification >= 10 words).
- `src/bots/rock.ts` — postflop rule in `decideRock`: an advised bet/raise stands only when the rounded equity against
  the calling range is above the style's `thresholdPct`; otherwise check (nothing owed) or call (bet owed). Doc comment updated.
- `src/bots/styles/rock.json` — new `postflopValue` block (`thresholdPct: 75` + justification) and the A-2 description clause.
- `tests/bots/rock-postflop.acceptance.test.ts` — new every-push acceptance tests for SPEC-04, SPEC-05, SPEC-06.
- `tests/bots/style-bands.acceptance.test.ts` — new opt-in slow (TLH_SLOW_TESTS=1) 100,000-hand band test, seeds 42, 7, 1234 (SPEC-01, SPEC-02).
- `tests/bots/rock.test.ts` — unit assertions for postflop views follow the new 75% bar (SPEC-07), via a `rockMove` helper.  FIX r1: seated-Rocks run cut to 300 hands (review MAJOR, CI time).
- `package.json` — `tests/bots/style-bands.acceptance.test.ts` appended to `test:slow`.

No new dependencies.
