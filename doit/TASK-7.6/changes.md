# TASK-7.6 changes

## Created
- `src/advice/charts/heads-up.json` — authored heads-up preflop chart (6 spots), chart and per-spot justifications; widths inside the §5 bands.
- `src/advice/charts/full-ring.json` — authored full-ring preflop chart (41 spots, 9 positions), chart and per-spot justifications; widths inside the §5 bands, unopened raise sets nest UTG ⊆ … ⊆ BTN.
- `tests/advice/table-sizes.acceptance.test.ts` — SPEC-01..07 (AC#1–AC#8): three charts, 169 cells per spot, justification errors, chart per table size, heads-up button cells, capped fourth bets, first-seat mapping.
- `tests/playtest/all-sizes.acceptance.test.ts` — SPEC-08/09 (AC#9, AC#11): default playtest is TAG at sizes 2–10; line-up seats play their style in every hand at sizes 2–10; no Line-up note. Memoizes computeEquity (vi.mock) so the re-decision check doesn't sample twice.
- `tests/advice/reference-charts.test.ts` — SPEC-10 content sanity: bands, AA/KK/QQ, 72o, nesting, borderline rules, justification length and originality vs six-max.json; prints widths.

## Modified
- `src/advice/preflop-chart.ts` — `ReferenceSize`/`Position` widened, `SEATS_BEFORE_BUTTON`, heads-up and full-ring `APPLICABLE_SPOTS`, `parseChart` accepts the three sizes.
- `src/advice/preflop.ts` — `HEADS_UP_CHART`, `FULL_RING_CHART`, `PREFLOP_CHARTS`, `referenceSizeOf`, `chartSpotOf` (A-3, fallback only for a missing limpers spot), generalised `positionOf` (A-1), chart selection and the A-2 check in `recommendPreflop`.
- `src/advice/ranges.ts` — A-5: `APPLICABLE_LINES` typed to the 6-max key.
- `src/bots/rock.ts` — A-4: spot via `chartSpotOf(view, '6-max')`.
- `src/playtest/runner.ts` — `defaultPolicyFactory` = TAG at every size; unused imports removed; doc comment.
- `src/playtest/policy.ts` — `seatStylesPolicyFactory` without the random-move fallback.
- `src/playtest/cli.ts` — Line-up note removed; help text updated; `new BotResults(game)` (Q-7).
- `src/playtest/winrate.ts` — Q-7: default seats are labelled `TAG` at every size (the `Random` label and the now-unused size parameter dropped).
- `e2e/support/pace-harness.tsx` — production advice worker (D-5).
- `tests/advice/preflop.acceptance.test.ts` — LOCKED (TASK-7.2), Q-6 approved edit only: heads-up.json and full-ring.json added to the AC#6 sandbox file list.
- `tests/advice/preflop.test.ts` — non-6 throws replaced by A-2 mismatch errors; new SPEC-11 test "maps every seat at sizes 2 to 10" (referenceSizeOf, A-6, every seat/button at 2–10 incl. empty seats, A-3 at 7 and 10); "remaps only a missing limpers spot" (fix r1).
- `tests/advice/preflop-chart.test.ts` — `full-ring` is valid (6-max spot list misses exactly the full-ring-only spots); unknown size `9-max` still fails.
- `tests/advice/grade.test.ts` — non-6 propagation case replaced by the A-2 mismatch error.
- `tests/bots/tag.test.ts` — non-6 propagation case replaced by the A-2 mismatch error.
- `tests/bots/rock.test.ts` — 5-seat throw replaced by the 6-max-range decision; new SPEC-12 test "Rock maps its 6-max range at other sizes".
- `tests/playtest/runner.test.ts` — default policy is seeded TAG at sizes 2–10 and with 5 of 6 seats dealt in (not random).
- `tests/playtest/policy.test.ts` — 9-seat Tough line-up plays Maniac + TAG per hand (not random).
- `tests/playtest/policy-lineup.acceptance.test.ts` — same 9-seat rewrite (unlocked).
- `tests/playtest/winrate.test.ts` — Q-7: default seats at 3 seats are `TAG`; `BotResults` built without a size.
- `tests/playtest/lineup.acceptance.test.ts` — LOCKED (TASK-6.6), Q-4 edits applied by the orchestrator (AC#6 `it.runIf(SLOW)`, Line-up note `toBeUndefined()`).
- `tests/playtest/bot-results.acceptance.test.ts` — LOCKED (TASK-6.10), Q-7 edit applied by the orchestrator (line 116 `'Random'` → `'TAG'`).
- `tests/playtest/cli.test.ts` — help text; Line-up note assertions replaced by the following line / not-contains.

## Deleted
- `e2e/support/pace-advice.worker.ts` — test-only pace worker, replaced by the production worker (D-5).

No new dependencies.
