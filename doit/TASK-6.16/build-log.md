## BUILD (TASK-6.16)
- `style.ts`: `PostflopValue` + `BotStyleData.postflopValue` (null when absent) + `parseStyle` validation with the three §5 messages.
- `rock.ts`: postflop branch keeps an advised bet/raise only when `round(equityVsCallingRangePct*10) > round(thresholdPct*10)`, else legal check/call (D-4).
- `rock.json`: `postflopValue { thresholdPct: 75, justification }` and the A-2 description clause.
- Tests: new `tests/bots/rock-postflop.acceptance.test.ts` (SPEC-04..06, ~60 ms), new opt-in `tests/bots/style-bands.acceptance.test.ts`
  (SPEC-01/02, added to `test:slow`), `tests/bots/rock.test.ts` SPEC-07 update via a `rockMove` helper. Note: besides the
  facing-bet loop (lines 106-111), the free-view assertion `decideRock(free)` with BOT_EQUITY also changed (the advice bet,
  the Rock now checks at <= 75%), so it uses the same helper. Unlocked unit file; no locked test touched.
- `TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts`: 3 passed, 464 s (151/155/158 s per seed).
  Measured bot-seat bands (VPIP / PFR / AGG, %):
  | seed | TAG | Rock |
  |---|---|---|
  | 42 | 22.2 / 16.2 / 63.0 | 10.1 / 8.8 / 47.0 |
  | 7 | 22.3 / 16.3 / 63.3 | 10.0 / 8.7 / 46.9 |
  | 1234 | 22.2 / 16.2 / 63.1 | 9.9 / 8.4 / 47.2 |
- `npm run -s playtest -- --hands 10000 --seed 42 | shasum -a 256` → `2cbbafa79dfeb56a159349b949039132b89cb0e41e72a83784e579653ae4bb98` (unchanged).
- SPEC-09 `npm run playtest -- --hands 10000 --lineup mixed --size 6 --seed 42` → Hands played 10000, Invariant violations 0, exit 0.
- `npm run format`; `npm run lint` (incl. prettier check) OK; `npm run typecheck` OK; `npm test`: 200 files passed / 3 skipped,
  734 tests passed / 30 skipped. Coverage 97.34% statements overall; bots 99.69% (rock.ts 100%, style.ts 100% lines).
- FIX r1 (orchestrator): review MAJOR — tests/bots/rock.test.ts seated-Rocks playtest 1,000 → 300 hands (all expects kept; ~0.3 s), per TASK-1.52 unit-time rule.
