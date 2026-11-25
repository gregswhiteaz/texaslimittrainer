# TASK-6.25 changes

No new dependencies.

## Source
- `src/table/session.ts` — `nextHand`: a busted cash bot is replaced by a bot of the same style (`current.style`);
  deleted `drawReplacementStyle` and the "No replay code to draw a new bot from" throw (A-1, A-3); doc comment.
- `src/playtest/runner.ts` — the replacement keeps the busted seat's style; dropped the `drawReplacementStyle`
  import; doc comment.
- `src/bots/lineup.ts` — deleted `replacementStyles` (A-3).
- `src/engine/bot-random.ts` — deleted `replacementGenerator` (A-3).
- `src/bots/styles/maniac.json` — postflop `call→raise` 0.6 → 0.2; new postflop `fold→call` 0.8 with a
  justification; description now says it calls most bets the pot odds say to fold (A-4).
- `src/bots/styles/rock.json` — `postflopValue.thresholdPct` 75 → 80 and its justification; range additions in
  HJ/CO/BTN raise, CO/BTN raise-and-calls and SB blind-defence (spec §5) with updated justifications.

## Docs and requirements
- `dreams/limit-holdem-trainer/requirements.md` — REQ-007.5 reworded (same style); REQ-007.7 and REQ-007.8 marked
  retired (TASK-6.25 Q-1); changelog row 1.11.
- `docs/advice/postflop-rules.md` — the "handled by TASK-6.25" sentence replaced by the cause and the fix.

## Tests
- `tests/playtest/mixed-composition.acceptance.test.ts` — new: SPEC-04 (2,000-hand Mixed run keeps its style
  multiset, replacements keep style with a new name and $160; app `nextHand` at Custom and Mixed tables).
- `tests/bots/maniac.acceptance.test.ts` — re-pinned (TASK-6.25 Q-2): deviation list (0.2 and the new 0.8
  fold→call), description check, a postflop fold view that calls under 0.8 and folds at 0.8 (SPEC-05); Example H
  moved to point 290 (same call[38] view, u < 0.2).
- `tests/bots/calling-station-postflop.acceptance.test.ts` — re-pinned Maniac postflop deviations and Rock bar 80.
- `tests/bots/rock.acceptance.test.ts` — re-pinned `COUNTS` for the wider Rock ranges.
- `tests/bots/rock-postflop.acceptance.test.ts` — value bar 75 → 80 (title and values).
- `tests/bots/replacement.acceptance.test.ts` — the style-draw tallies become same-style tallies through `nextHand`
  over the same 10,000 replay codes; names test unchanged.
- `tests/playtest/replacement.acceptance.test.ts` — a replacement's style equals the seat's previous style; the
  replay-line test expects no `--styles` on the Replay line and replays with an explicit `--styles` (A-7).
- `tests/table/replace-bot.acceptance.test.ts` — expected style is the busted bot's style.
- `tests/storage/session-records.acceptance.test.ts` — expected stored style is the busted bot's style.
- `tests/table/next-hand.test.ts` — the no-replay-code throw test becomes a same-style check without a replay code.
- `tests/bots/lineup.test.ts` — the draw/validation checks become same-style `nextHand` checks for every line-up,
  seat and style, and `Not a next-hand step` checks.
- `tests/bots/maniac.test.ts` — a postflop fold is now a deviating decision (draws once); the zero-draw case uses a
  postflop bet.
- `tests/bots/style.test.ts` — `findDeviation(MANIAC_STYLE, 'postflop', 'fold')` is the fold→call deviation.
- `tests/playtest/check-styles.acceptance.test.ts` — FAST_TIMEOUT_MS 30_000 -> 60_000 (TASK-6.11 locked; unlocked; orchestrator edit, Block 1)
