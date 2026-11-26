# Build log — TASK-7.36

## BUILD

What I did:
- `src/advice/golden.ts`: `parseExample` calls `heroPreflopProblems` when `view !== null && view.street !== 'preflop'`,
  just before the early return; the unreachable guard is replaced by
  `as Extract<ApplyResult, { ok: true }>` (D-3).
- `tests/golden/graded-examples.json`: applied the §5 values to the three examples.
- `docs/advice/golden-spots.md`: rule + A-4 failure text in "Graded examples"; TASK-7.31 sentence now reads
  "TASK-7.36 extends this rule to postflop graded examples."; new TASK-7.36 change-log table before "Originality".
- `tests/golden/graded-lines.acceptance.test.ts`: SPEC-01..04 (preflopHand builder and audit loop copied from
  `postflop-lines.acceptance.test.ts`, not imported).

### SPEC-05 fact-check table

Sources: spec-writer `steps.ts <id> <before> audit` (engine numbers, hero steps) and `cat.ts` (evaluator category,
next-card outs), plus a scratch `evaluate` comparison for kickers (K7 vs K2 on the top-pair board both rank 3809, so
the seven does not play; A3 5127 vs Q3 5116 on the trips board, so the ace kicker plays).

| Id | Old → new hole cards | Line change | Hero preflop steps (grade, chart cell) | Engine numbers | Grade, rule, margin | Evaluator made hand / outs |
|---|---|---|---|---|---|---|
| `graded-postflop-fold-minor-6max-flop-gutshot` | 5d 2h → Kd 4h | `fold,fold,raise,call,fold,fold,bet` → `fold,fold,fold,call,fold,check,check,bet` (BTN limps, SB folds, BB hero checks option, BB checks flop, BTN bets) | step 6 `check` correct (6-max BB limpers K4o: check) | advice call; equity 26.8, required 22.2; exact | minor call-fold-margin 4.6 | high card; straight with any 5 (4 cards); one pair with K (3, top pair), 4 (3), 3/6/7 (9); 28 high-card cards |
| `graded-postflop-check-minor-6max-river-top-pair` | Kh 6h → Kh 7h | none | step 3 `raise` correct (6-max CO unopened K7s: raise/fold borderline); step 7 `call` correct (6-max CO re-raise K7s: call/fold borderline) | advice bet; vs calling range 56.9, threshold 50; exact | minor aggression-margin 6.9 | one pair, kings; board plays K K J 9 8 (seven does not play); four hearts only (Jh 8h Kh 7h), no flush; no straight |
| `graded-postflop-check-major-6max-turn-trips` | 3c Ts → Ah 3c | none | step 4 `raise` correct (6-max BTN unopened A3o: raise) | advice bet; vs calling range 79, threshold 50; exact | major aggression-margin 29 | three of a kind, threes, ace kicker plays; river: full house with 5/K/A (9), quads with 3s (1) |

Claim check:
- Gutshot: "King-four", "gutshot to the five" (5 completes 3-4-5-6-7), "three king outs for top pair", "big blind
  checked its option in a limped pot" (BTN limp, SB fold, BB check), "button's flop bet" (BB checks, BTN bets),
  "equity a few points above what the pot odds ask" (26.8 vs 22.2), "margin under ten points" (4.6). All match.
  Old text ("gutshot to the four", five-deuce) is gone.
- Top pair: "Top pair of kings with a seven kicker that does not play on this board" (evaluator ranks K7 = K2),
  "checked flop and turn" (steps 8-11 all check), "a few points above even against the hands that call" (56.9 vs 50).
  The spec draft "weak seven kicker" was refined to state the seven does not play, since the evaluator shows that.
  No K6 wording remains.
- Trips: "Trip threes with an ace kicker", "big blind ... led the flop and then checked" the turn (BB `bet` step 7,
  `check` step 9), "margin from even well over fifteen points" (29). No T3 wording remains.

Judge e2e step 2 (scratch copy, trips holeCards `3c Ts`): `parseGradedExamples` problems =
`Graded example graded-postflop-check-major-6max-turn-trips: hero preflop step 4 "raise" is a Major error on the chart (6-max BTN unopened T3o: fold)`.

Commands:
- `npx vitest run tests/golden/` → 7 files, 292 tests passed (1.1 s); `graded-lines.acceptance.test.ts` 4/4.
- `! grep -n "if (!result.ok) break;" src/advice/golden.ts` → no match.
- `npm run format`, `npm run lint` → clean. `npm run typecheck` → clean.
- `npm test` → 332 files passed, 9 skipped; 1487 tests passed, 56 skipped. `git diff --name-only 99a4ec6 -- tests/` → `tests/golden/graded-examples.json` plus the new untracked `tests/golden/graded-lines.acceptance.test.ts`.
