# TASK-6.26 changes

- `src/playtest/cli.ts` — removed dead `replacedStylesOption`; run Replay line now ends at the line-up option (SPEC-01, SPEC-02).
- `src/playtest/runner.ts` — `PlaytestOptions.lineUp` comment: busted bot replaced by a new bot of the same style (SPEC-04).
- `src/bots/styles/rock.json` — CO/raise justification names ace-jack offsuit (AJo) (SPEC-04; "(AJo)" per orchestrator note in qa.md).
- `src/bots/styles/maniac.json` — postflop fold→call justification rewritten as one clear sentence (A-2 text, SPEC-04).
- `tests/playtest/cli.test.ts` — `--styles` test renamed; swapped-styles Replay line now asserted equal to the unswapped one (no `--styles`); 102 assertions kept (SPEC-01, SPEC-03).
- `tests/bots/replacement.acceptance.test.ts` — 10,000 codes → 8 fixed codes, comment and first test title updated; 4 tests, 18 assertions kept (SPEC-05, SPEC-06). Unlocked by orchestrator under TASK-6.8.

No new dependencies.
