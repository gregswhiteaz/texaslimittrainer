# Spec: TASK-7.8 — Recommend betting or raising for value

Status: READY (approved 2026-11-22)
Task: TASK-7.8 · Parent/epic: TASK-7 (Get trustworthy advice) · Requirements: REQ-033 (033.1, 033.2, 033.4, 033.5, 033.6), REQ-038.4/038.6 (grading consumer), REQ-056.1 · Dream: limit-holdem-trainer

## 1. Summary
Postflop advice today only checks, calls or folds (`src/advice/postflop.ts:107-118`). This task adds the value rule
(REQ-033.2): recommend a bet (nothing owed) or a raise (facing a bet, street not capped) when the hero's rounded equity
against the range that would call is above 50.0%. The range that would call is each opponent's current range with
Air removed (Strong, Pair and Draw kept, REQ-033.6). Every postflop recommendation gains `equityVsCallingRangePct`, so
`gradeView` grades real bet/raise-versus-check/call deviations by `aggression-margin`. Bots still go through the advice
engine, so they now bet and raise for value too. The TAG/Rock/Maniac/Calling-station `FREE_CHECK_EQUITY` shortcut
goes, and bots pass a lower-cost equity budget so the 10,000-hand playtests stay inside their time limits (Q-1).

## 2. Scope
- In scope:
  - `src/advice/ranges.ts`: `CONTINUE_CLASSES` and `callingRange(range, board)` (the same narrowing rule, Air removed;
    the whole range when nothing would continue), with a per-board class memo for speed.
  - `src/advice/postflop.ts`: rule ids `value-bet` and `value-raise`; `PostflopAdvice` gains `'bet' | 'raise'`;
    `PostflopRecommendation.equityVsCallingRangePct: number`; one extra equity run against the calling ranges.
  - `src/advice/equity.ts`: `equityWithBudget(input, budget)` (the body of `computeEquity` with the exact limit and the
    sample count as parameters); `computeEquity` calls it with today's constants, so its results don't change.
  - Bots (`src/bots/tag.ts`, `rock.ts`, `maniac.ts`, `calling-station.ts`): remove `FREE_CHECK_EQUITY` and the
    free-check branches; every bot advice call passes `equity: BOT_EQUITY` (Q-1). Bots stay on the every-unseen-combo
    basis (TASK-7.5 Q-1; TASK-7.25 owns switching them to action ranges).
  - `src/advice/grade.ts`: comment update only (`equityVsCallingRangePct` is now always present on real postflop
    recommendations). `aggression-no-range` stays for fixtures that omit the number (locked TASK-7.23 tests pin it).
  - `docs/advice/postflop-rules.md`: the two value rules with the worked example, the "range that would call"
    definition, and an updated "Not applied yet" list.
  - Tests: new locked acceptance file, unit tests per rule, and the locked/unlocked test edits listed in §5
    ("Locked-test edits").
  - Measurements recorded in the build log: new default playtest SHA, new `playtest:million -- --hands 900` hash,
    10,000-hand wall times, `npm run test:sweeps` per-shard time.
- Not doing:
  - Switching bots to action-based ranges (TASK-7.25); bluffing or semi-bluff rules (not a requirement rule);
    implied odds (TASK-7.9); equity-engine speed work for user advice (TASK-7.18); golden spots (TASK-7.14).
  - Any UI/hint text for bet/raise advice (hint and review UI stories); no new screen.
  - Changing `requiredEquityPct`'s meaning (it stays the REQ-033.1 pot-odds price; see D-4).
  - Changing grading rules or retiring the `aggression-no-range` id (fixtures without the number still use it).
  - Relaxing any locked time limit.
- Scope budget: files=36, lines=1700

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Several opponents: one `computeEquity` call with every live opponent's calling range, and the hero's pot share is compared with 50% (the same "equity" definition as `equityPct`, `docs/advice/postflop-rules.md` "Equity"). | yes | "Equity is computed against each opponent's calling range" — each opponent contributes its own calling range; one number keeps the rule, the grade margin and the AC#8 output single-valued. | Heads-up equity against each opponent separately, value bet only if every one is above 50% |
| A-2 | An opponent whose range has no Strong/Pair/Draw combo keeps its whole range as its calling range. | yes | Same fallback as the existing narrowing (`src/advice/ranges.ts:395`, empty narrowing keeps the previous range); avoids an empty range that `computeEquity` rejects. With the unseen basis it never happens (every board leaves pairs). | Drop that opponent from the calling-range equity; treat it as folding |
| A-3 | `equityVsCallingRangePct` is computed for every postflop decision, including capped streets where it can't change the move. | yes | Keeps the field a plain `number` (AC#9/#11: real recommendations always carry it); capped or short-stack spots are rare, so the cost is small. | `number \| null`, null when no bet/raise is legal |
| A-4 | Nothing owed but the legal aggressive action is `raise` (a short all-in left `currentBet > 0`, `src/engine/hand.ts:345-347`): rule `value-bet` recommends that `raise`. | yes | The engine offers check/raise there; "bet (no bet faced)" maps to whichever aggressive move is legal. | A separate rule id |
| A-5 | The equity run against calling ranges uses the same fallback chain as the whole-range run in `'actions'` mode (estimated, then start, then unseen ranges, each narrowed by `callingRange`). | yes | Card conflicts between several opponents' narrow ranges throw `RangeError`; `withFallbacks` (`src/advice/postflop.ts:48-60`) is the existing answer. | Separate chains; throw |
| A-7 | If the calling-range run still throws `RangeError` after the fallback chain (rejection sampling with many opponents' overlapping calling ranges — seen in the prototype on the 9-opponent perf spot), `equityVsCallingRangePct` = `equityPct` (whole-range result, no extra run). Documented in the rules doc. | yes | Advice must be total; with 9 callers the "all of them hold a calling hand" deal is rare. | Drop opponents one by one; throw |
| A-8 | Speed target: default 10,000-hand playtest ≤ 15 s locally. If the builder can't reach it at 500 trials after the memo and a cheaper bot seed path, lower `BOT_EQUITY_BUDGET.trials` (not below 200) and record it. | yes | Unmeasured: prototype reached 23 s at 500 trials without canonical-key savings; locked tag-playtest runs 3×10,000 hands in 120 s. | Move 10,000-hand runs to slow (needs locked edits) |
| A-6 | `calling-station.test.ts`'s 10,000-hand unit run (unlocked) drops to 1,000 hands; the 10,000-hand version is not needed in every push. | yes | Standing rule: no unit test over ~5 s; at the new bot cost 10,000 hands takes ~10-20 s. | Move it to `test:slow` |

## 3. Current system
- `src/advice/postflop.ts:61-137` `recommendPostflop`: builds ranges (`'unseen'` default or `'actions'`,
  `:84-101`), one equity run, rounds with `toPct` (`:43-45`), then rules `check-free` / `pot-odds-call` /
  `pot-odds-fold` (`:107-118`), comparing rounded values (TASK-7.3 Q-2). `POSTFLOP_RULE_IDS` at `:9`.
- `src/advice/ranges.ts`: `KEEP` (`:54-59`) — call keeps pair/draw, raise keeps strong/draw, so the union is
  strong/pair/draw; `classifyCombo` (`:322`), `narrowRange` (`:339`), the empty-narrowing fallback (`:395`),
  `unseenCombos`, `estimateOpponentRanges`.
- `src/advice/equity.ts:342-353` `computeEquity`: exact when `estimateEvaluations ≤ EXACT_EVALUATION_LIMIT`
  (200,000), else `sampledEquity(c, SAMPLE_TRIALS)` (30,000), seeded from the canonical input; `sampledEquity`,
  `exactEquity`, `canonicalise` are exported `@internal`.
- `src/advice/grade.ts:131-141`: aggression deviations read `equityVsCallingRangePct`; `undefined`/`null` →
  `aggression-no-range`. `src/advice/grade.ts:120-129`: fold-involving pairs use `requiredEquityPct` (REQ-038.6), so
  `requiredEquityPct` must keep its pot-odds meaning.
- Bots: `src/bots/tag.ts:20-37`, `rock.ts:24-29`, `maniac.ts:27-33`, `calling-station.ts:31-37` call `recommend`
  with `FREE_CHECK_EQUITY` when nothing is owed postflop (TASK-6.1 Q-2: 10,000 all-TAG hands ≈94 s without it).
  Playtest default is all TAG (`src/playtest/runner.ts:171`).
- Engine: `legalActions` (`src/engine/hand.ts:331-350`) offers raise only when `betCount < STREET_BET_CAP` (4) and the
  seat hasn't acted since the last bet/raise and has chips beyond the call.
- User advice: `src/table/advice-service.ts:65` and `src/table/review.ts` use `ACTION_RANGE_ADVICE` with default
  `computeEquity`; nothing in `src/ui` or `src/table` reads `PostflopAdvice` values or `ruleId` (grep), so the new
  outcomes don't break consumers.
- Tests: vitest (`npm test` = unit+sweeps+tooling with coverage); `*.acceptance.test.ts` are locked per owner
  (`doit/*/state.json` `locked_tests`); slow opt-in group `npm run test:slow` (`TLH_SLOW_TESTS=1`).
- Existing code to reuse:
  - `src/advice/ranges.ts` `classifyCombo`, `KEEP`, `unseenCombos` → the calling-range filter (no new classifier).
  - `src/advice/postflop.ts` `withFallbacks`, `toPct` → the second equity run and its rounding.
  - `src/advice/equity.ts` `canonicalise`, `estimateEvaluations`, `exactEquity`, `sampledEquity` → `equityWithBudget`.
  - `tests/advice/postflop.acceptance.test.ts` helper patterns (`deckWith`, `spotDeck`, `stateAfter`, `fixedEquity`)
    → copy (don't import from a locked file) into the new acceptance file.

### Verified worked example (AC#1–AC#3)
Computed in a scratch copy with the real `classifyCombo` and `computeEquity` (both exact enumerations):
board Ks 8d 7c; range {KhKd strong (trips), 8h7h strong (two pair), AhKh pair, 9h9d pair, 6h5h draw (5-6-7-8),
Th9h draw (7-8-9-T), QhJh air, Ac2c air}. Calling range = the 6 non-Air combos (AC#1 correct).
8s8c: 72.84% vs calling range (72.8, AC#2 correct), 78.87% vs whole range. AsKc: 48.94% vs calling range (48.9,
correct), 60.67% vs whole range (60.7, correct). No deviation from the task text.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Rule order (first match wins): `value-bet` (nothing owed, bet/raise legal, rounded `equityVsCallingRangePct` > 50.0) → `check-free` → `value-raise` (owed > 0, raise legal, rounded > 50.0) → `pot-odds-call` → `pot-odds-fold`. | Compare unrounded equity | Same "compare the rounded numbers the player sees" rule as TASK-7.3 Q-2; AC#4/#5 boundary 50.1 vs 50.0 is exactly the tenths comparison `> 500`. | no | n/a (task text + TASK-7.3 Q-2) |
| D-2 | Rule ids are `value-bet` and `value-raise`. | `bet-for-value`/`raise-for-value` (avoids a locked edit) | AC#2 names "the value-bet rule id"; the locked TASK-7.3 AC#5 uses `'value-bet'` as its *fake* undocumented id, so it gets a one-token re-pin (§5). | yes | user (Q-2, qa.md: auto-accepted, recommended) |
| D-8 | Cross-story locked-test re-pins listed in §5 (and further re-pin-only failures). | Avoid edits | Value rule changes pinned bot/advice results. | yes | user (Q-3, qa.md: auto-accepted, recommended) |
| D-3 | Bots: stay on `'unseen'` ranges, apply the value rule like everyone (they go through `recommend`), drop `FREE_CHECK_EQUITY`, and pass `equity: BOT_EQUITY` = `equityWithBudget(input, { exactLimit: 2_500, trials: 500 })`, seeded exactly like `computeEquity`. | Default `computeEquity` for bots (measured ≈275 s per 10,000 hands, breaks every locked 10,000-hand limit); keep a free-check stand-in (AC#10 forbids where equity can change the move) | Only lever that keeps locked time limits without relaxing them; bots are opponents, not shown advice; deterministic. | yes | user (Q-1, qa.md: auto-accepted, recommended) |
| D-4 | `requiredEquityPct` keeps its REQ-033.1 meaning (pot odds; 0 when nothing owed) on value recommendations; the 50% value threshold is the exported constant `VALUE_THRESHOLD_PCT = 50` and is documented. AC#8's "required equity %" is that field. | Set `requiredEquityPct = 50` on value recs | `gradeDecision` uses `requiredEquityPct` for fold-versus-raise (REQ-038.6, `src/advice/grade.ts:120-129`); overloading it would mis-grade. REQ-033.5 lists the same field. | no | n/a (codebase + REQ-038.6) |
| D-5 | `callingRange` memoises each combo's continue/air class for the last board seen (module-level `Int8Array(52*52)` keyed by the board's cards). Pure: same output as filtering with `classifyCombo`. | No memo | Profiling: classification was ~45% of bot cost; the memo is invisible to callers. | no | n/a |
| D-7 | If an every-push run still misses its locked time limit at the bot budget, only that heavy run moves to the opt-in slow group with a smaller every-push version (no limit relaxed, no assertion dropped). | Relax the limit; drop the run | Standing slow-tests rule. | yes | user (Q-1, qa.md: auto-accepted, recommended) |
| D-6 | No CLI, report-format or option changes; `opponentRanges` semantics unchanged. | — | Out of scope. | no | n/a |

## 5. Design

### Files to create / modify
- `src/advice/ranges.ts` — `CONTINUE_CLASSES`, `callingRange` (+ memo)
- `src/advice/postflop.ts` — value rules, new field and types, `VALUE_THRESHOLD_PCT`
- `src/advice/equity.ts` — `equityWithBudget`, `EquityBudget`; `computeEquity` delegates (results unchanged)
- `src/advice/grade.ts` — comment on `equityVsCallingRangePct` only
- `src/bots/tag.ts` — remove `FREE_CHECK_EQUITY`; add `BOT_EQUITY`, `BOT_EQUITY_BUDGET`; use them
- `src/bots/rock.ts`, `src/bots/maniac.ts`, `src/bots/calling-station.ts` — drop free-check branches; pass `BOT_EQUITY`
- `docs/advice/postflop-rules.md` — rules `value-bet`, `value-raise`, worked example, definitions, "Not applied yet"
- `tests/advice/value-bet.acceptance.test.ts` — new, locked after first green build (SPEC-01..SPEC-10)
- `tests/advice/postflop.test.ts` — `describe('rule value-bet')`, `describe('rule value-raise')`, units (SPEC-11..SPEC-14)
- `tests/advice/ranges.test.ts` — `callingRange` units (SPEC-12)
- `tests/advice/equity.test.ts` — `equityWithBudget` units (SPEC-15)
- `tests/advice/grade.test.ts` — rewrite the "real postflop view" `aggression-no-range` case (now bet advice)
- `tests/bots/tag.test.ts`, `tests/bots/maniac.test.ts`, `tests/bots/calling-station-draws.acceptance.test.ts` (unlocked) — drop `FREE_CHECK_EQUITY` imports, use `BOT_EQUITY`
- `tests/bots/calling-station.test.ts` — 10,000 → 1,000 hands (A-6)
- Locked (edit only per Q-3, after `doit.py unlock <OWNER> <file> --reason "TASK-7.8 Q-3 …"`): every file in the
  §5 Locked-test edits table with an edit (TASK-7.3, 7.22, 6.1, 6.2, 6.3, 6.4, 7.4, 7.5, 9.1 ×2, 3.4).
- Unlocked test updates: the files listed under the table, plus `tests/playtest/policy-lineup.acceptance.test.ts`,
  `tests/playtest/cli.test.ts`, `tests/advice/postflop-ranges.test.ts`, `tests/advice/postflop.perf.test.ts`,
  `tests/bots/rock.test.ts`.

### Components, interfaces and data
```ts
// src/advice/ranges.ts
export const CONTINUE_CLASSES: readonly StrengthClass[]; // ['strong','pair','draw'] = KEEP.call ∪ KEEP.raise
/** Combos of `range` whose class on `board` is in CONTINUE_CLASSES, input order; `range` itself if none (A-2). */
export function callingRange(range: readonly HoleCards[], board: readonly Card[]): readonly HoleCards[];

// src/advice/equity.ts
export interface EquityBudget { readonly exactLimit: number; readonly trials: number }
/** computeEquity with a custom exact limit and sample count; same validation, canonical seed and output order. */
export function equityWithBudget(input: EquityInput, budget: EquityBudget): EquityResult;
// computeEquity(input) === equityWithBudget(input, { exactLimit: EXACT_EVALUATION_LIMIT, trials: SAMPLE_TRIALS })

// src/advice/postflop.ts
export type PostflopAdvice = 'fold' | 'check' | 'call' | 'bet' | 'raise';
export const POSTFLOP_RULE_IDS = ['value-bet', 'check-free', 'value-raise', 'pot-odds-call', 'pot-odds-fold'] as const;
export const VALUE_THRESHOLD_PCT = 50;
interface PostflopRecommendation { /* all existing fields unchanged */
  /** Hero pot share against every live opponent's range that would call a bet/raise; percent, one decimal. */
  readonly equityVsCallingRangePct: number;
}

// src/bots/tag.ts
export const BOT_EQUITY_BUDGET: EquityBudget; // { exactLimit: 2_500, trials: 500 } (Q-1 A)
export function BOT_EQUITY(input: EquityInput): EquityResult; // equityWithBudget(input, BOT_EQUITY_BUDGET)
```
- `equityMethod` keeps describing the whole-range run.
- Bots: `recommend(view, { ...adviceOptions(options), equity: options.equity ?? BOT_EQUITY })` — an explicit
  `options.equity` (test seam) still wins; no style key reaches the engine (the `ExactOptions` guard is unchanged).

### Rules and algorithms
1. Existing: street/seat checks, `owed`, `pot`, `callAmount`, range attempts (`'unseen'` or `'actions'` chain), whole
   equity → `equityPct`, `requiredEquityPct`.
2. `calling = attempts.map(ranges => ranges.map(r => callingRange(r, view.board)))`;
   `equityVsCallingRangePct = toPct(withFallbacks(run, calling).hero.equity)`.
3. `aggressive = legalActions.find(a => a.type === 'bet' || a.type === 'raise')`; `value = aggressive !== undefined &&
   tenths(equityVsCallingRangePct) > 500`.
4. owed = 0: `value` → `value-bet`, action = `aggressive.type` (bet; raise only in A-4's edge); else `check-free`.
   owed > 0: `value` → `value-raise` (raise); else rounded equity ≥ rounded required → `pot-odds-call`; else
   `pot-odds-fold`.
- Worked examples (for the doc and tests): Ks 8d 7c, heads-up, nothing owed. 8s8c: 72.8% vs calling range > 50 →
  bet, `value-bet`. AsKc: 48.9% → check, `check-free` (60.7% vs the whole range does not matter: the hands that fold
  to a bet don't pay it off). Facing a $4 bet into $16 with 50.1% vs calling range on an uncapped flop → raise
  (`value-raise`, required 16.7%); on a capped flop (four bets in) the same holding → call by `pot-odds-call` (or fold
  by `pot-odds-fold`).

### Locked-test edits (approved by Q-3; each re-pins, none drops an assertion)
The 11 files below are unlocked under their owners. Any further locked file that fails only on re-pinnable expected
values is approved the same way (unlock under its owner with reason "TASK-7.8 Q-3", log in qa.md). Per Q-1, if an
every-push run still can't meet its locked time limit at the bot budget, only that heavy run moves to the opt-in slow
group (`test:slow`, `TLH_SLOW_TESTS=1`), with a smaller every-push version kept; no limit is relaxed.
Measured in a scratch copy of the prototype (value rule + `BOT_EQUITY` 500 trials / exact ≤ 2,500); final list is
confirmed by the builder's first gate run.

| File (owner) | What changes | How the assertion count is kept |
|---|---|---|
| `tests/advice/postflop.acceptance.test.ts` (TASK-7.3) | AC#3 property: allowed actions `['fold','check','call']` → add `'bet','raise'`. AC#5: the fake undocumented id `'value-bet'` → `'bluff'` (expected message re-pinned to `Rule bluff …`). AC#4 real-equity check spot (Ah5h on Kh 9h 2c, 3 opponents): re-pin only if the prototype shows it now bets. | Same `expect` calls, wider allowed set / renamed fake id |
| `tests/advice/postflop-coverage.acceptance.test.ts` (TASK-7.22) | Allowed actions add `'bet','raise'`; `expectedRule` derivation gains the two value rules (value first when bet/raise legal and `equityVsCallingRangePct > 50`). | Same assertions, updated expected values |
| `tests/bots/tag.acceptance.test.ts` (TASK-6.1) | AC#2: facing-bet moves may be `raise`; the `seen` set becomes call/fold/raise. AC#3: scripted Ah5h free checks re-pinned to the prototype result; random free checks expect `check` or `bet`. `toStrictEqual(recommend(view).move)` → `recommend(view, { equity: BOT_EQUITY }).move` (TAG plays the advice at the bot budget). | Same `expect` calls, updated expected values |
| `tests/advice/postflop.acceptance.test.ts` AC#1 (TASK-7.3) | `toStrictEqual` result gains `equityVsCallingRangePct` (16.7 with the fixed-equity stub). | Add the field to the expected object |
| `tests/bots/tag-mixing.acceptance.test.ts` (TASK-6.2) | "outside mixed spots TAG plays the recommended action": expected `check` now `bet` at hand 1. | Re-pin expected moves to the advice at `BOT_EQUITY` |
| `tests/bots/calling-station.acceptance.test.ts` (TASK-6.3) | Example hand class (`AQo` → measured, e.g. `T8o`) and worker-seat move re-pinned. | Update expected values |
| `tests/bots/maniac.acceptance.test.ts` (TASK-6.4) | "no bet to face … Maniac bets at more points than TAG": first example street re-pinned. | Update expected values |
| `tests/advice/grade.acceptance.test.ts` AC#7 (TASK-7.4) | Equity stub call count 1 → 2 (whole range + calling range). | Same `toHaveLength`, new value |
| `tests/advice/range-model.acceptance.test.ts` AC#2 (TASK-7.5) | Spy call count 1 → 2; `calls[0]` is still the whole-range run (opponent count and range assertions unchanged). | Same `toHaveLength`, new value |
| `tests/table/review.acceptance.test.ts` (TASK-9.1, 2 tests), `tests/ui/review-panel.acceptance.test.tsx` (TASK-9.1) | Bot lines now bet (`Check` → `Bet $4`), user-decision grades re-pinned. | Update expected labels/grades |
| `tests/table/next-hand.acceptance.test.ts` (TASK-3.4) | "sixty hands in a row": a pinned count (94 → measured, prototype 30). | Update expected value |
| `tests/bots/tag-playtest.acceptance.test.ts` (TASK-6.1) | No edit: timed out at 120 s in the prototype (500 trials, loaded machine); the builder must meet SPEC-12's speed target instead. | n/a |
| `tests/advice/equity.acceptance.test.ts` (TASK-7.1) | No edit: AC#5 scans `postflop.ts` for `performance`; the prototype failed only because of profiling code. Builder must not add timing calls there. | n/a |

Unlocked tests that also change (prototype): `calling-station-draws`, `maniac.test`, `rock.test`, `tag.test`,
`grade.test` (2), `postflop-ranges.test` (2: call counts, 1081 → whole-range call), `postflop.test` (2),
`postflop.perf.test` (multiway calling ranges threw "Sampling rejected too many deals", see A-7),
`playtest/cli.test` (timeout + one assertion), `policy-lineup.acceptance` (summary snapshot re-pin, not locked),
`invariants.perf.test` (timeout under load; re-check alone).

## 6. Behaviour specification

### SPEC-01: Range that would call (worked example)
- Verifies: AC#1
- Behaviour: Given range {KhKd, 8h7h, AhKh, 9h9d, 6h5h, Th9h, QhJh, Ac2c} and board Ks 8d 7c, When `callingRange(range,
  board)` runs, Then it returns exactly {KhKd, 8h7h, AhKh, 9h9d, 6h5h, Th9h} (6 combos, input order); QhJh and Ac2c
  (Air) are removed.
- Verification: acceptance `tests/advice/value-bet.acceptance.test.ts::AC#1 the range that would call drops the Air combos`

### SPEC-02: Value bet with 8s8c
- Verifies: AC#2
- Behaviour: Given a heads-up flop Ks 8d 7c with the hero first to act and nothing owed, and the opponent's range
  limited to the 8 combos (equity seam that intersects every range passed to `computeEquity` with those 8 combos),
  When `recommendPostflop` runs with hero 8s8c, Then `equityVsCallingRangePct` is 72.8, `equityPct` 78.9, action
  `bet`, `ruleId` `value-bet`, `move` the legal bet.
- Verification: acceptance `tests/advice/value-bet.acceptance.test.ts::AC#2 8s8c bets for value at 72.8%`

### SPEC-03: No value bet with AsKc
- Verifies: AC#3
- Behaviour: Given the SPEC-02 spot with hero AsKc, When advice is requested, Then `equityVsCallingRangePct` is 48.9,
  `equityPct` 60.7, action `check`, `ruleId` `check-free` (not `value-bet`).
- Verification: acceptance `tests/advice/value-bet.acceptance.test.ts::AC#3 AsKc at 48.9% vs callers does not bet`

### SPEC-04: Boundary 50.1 bets
- Verifies: AC#4
- Behaviour: Given a postflop view with nothing owed and a legal bet, When the equity seam makes the calling-range
  run return 0.501 (and the whole-range run any value), Then action `bet`, `ruleId` `value-bet`,
  `equityVsCallingRangePct` 50.1.
- Verification: acceptance `tests/advice/value-bet.acceptance.test.ts::AC#4 50.1% against callers bets`

### SPEC-05: Boundary 50.0 does not bet
- Verifies: AC#5
- Behaviour: Given the SPEC-04 view, When the calling-range run returns 0.5 (also 0.50049, which rounds to 50.0),
  Then action `check`, `ruleId` `check-free`, `equityVsCallingRangePct` 50.0.
- Verification: acceptance `tests/advice/value-bet.acceptance.test.ts::AC#5 exactly 50.0% against callers checks`

### SPEC-06: Value raise facing a bet
- Verifies: AC#6
- Behaviour: Given a flop where the hero faces a $4 bet into $16 (pot $20) and raise is legal, When the
  calling-range run returns 0.501, Then action `raise`, `ruleId` `value-raise`, `move` the legal raise.
- Verification: acceptance `tests/advice/value-bet.acceptance.test.ts::AC#6 50.1% against callers raises`

### SPEC-07: Capped street falls back to pot odds
- Verifies: AC#7
- Behaviour: Given a flop capped at 4 bets with the hero to call (no raise in `legalActions`), When the seam returns
  0.9 for every run, Then action `call`, `ruleId` `pot-odds-call`; and with 0.01, `fold`, `pot-odds-fold`;
  `equityVsCallingRangePct` is still a number (A-3).
- Verification: acceptance `tests/advice/value-bet.acceptance.test.ts::AC#7 capped street calls or folds by pot odds`

### SPEC-08: Value recommendations carry their numbers
- Verifies: AC#8
- Behaviour: Given SPEC-04 and SPEC-06 results, Then each has `equityVsCallingRangePct` (50.1), `requiredEquityPct`
  (0 for the bet; 16.7 for the raise = 4 ÷ 24) and `ruleId` (`value-bet` / `value-raise`), all one-decimal numbers
  in 0..100.
- Verification: acceptance `tests/advice/value-bet.acceptance.test.ts::AC#8 value advice returns calling-range equity, required equity and rule id`

### SPEC-09: Shape stays compatible
- Verifies: AC#9
- Behaviour: Given any real postflop view, When `recommendPostflop` returns, Then its keys are exactly the TASK-7.3
  keys plus `equityVsCallingRangePct`; `action ∈ {fold, check, call, bet, raise}` equals `move.type` and `move` is in
  `legalActions`; `ruleId ∈ POSTFLOP_RULE_IDS`; and the result is accepted by `gradeDecision` (structural
  `EquityGradeInput`). Property over random real postflop states (fast-check, ≥ 40 runs, fixed seed) also checks
  the rule matches D-1 from the returned numbers.
- Verification: acceptance `tests/advice/value-bet.acceptance.test.ts::AC#9 recommendation keeps existing fields and adds calling-range equity`

### SPEC-10: Grading uses the calling-range margin for real advice
- Verifies: AC#11
- Behaviour: Given a real postflop view (no equity seam) where advice is `check`, When `gradeView(view, 'bet')` runs,
  Then `ruleId` is `aggression-margin` and `marginPts` = |`equityVsCallingRangePct` − 50|; given a seam spot where
  advice is `bet` (0.651), `gradeView(view, 'check')` → `major`, `aggression-margin`, margin 15.1; and over random
  real postflop views a bet/raise against check/call never yields `aggression-no-range`.
- Verification: acceptance `tests/advice/value-bet.acceptance.test.ts::AC#11 real bet or raise deviations grade by aggression-margin`

### SPEC-11: Free-check stand-in removed; bots value-bet through the advice
- Verifies: AC#10
- Behaviour: Given the bot modules, Then none exports or uses `FREE_CHECK_EQUITY` (module namespace check and source
  scan of `src/bots/`); Given a free-check flop view where `recommend(view, { equity: BOT_EQUITY })` says bet, When
  `decideTag`, `decideRock` and `decideCallingStation` (no random) decide, Then each returns that bet; Given a 300-hand
  all-TAG 6-max playtest, Then at least one postflop bet and one postflop raise occur and violations are 0.
- Verification: acceptance `tests/advice/value-bet.acceptance.test.ts::AC#10 bots drop the free-check stand-in and bet for value`

### SPEC-12: Playtest stays under its time limits
- Verifies: AC#10, DoD#7
- Behaviour: When `npm run -s playtest -- --hands 10000 --seed 42` runs, Then it prints `Invariant violations: 0`
  and finishes in ≤ 15 s wall locally (record the time and the new SHA-256 in the build log; old
  `442dbf55…08fbc` retires); the locked `tests/bots/tag-playtest.acceptance.test.ts` (60 s CLI / 120 s test) and
  `tests/playtest/runner.acceptance.test.ts` pass unchanged; `npm run -s playtest:million -- --hands 900` is
  deterministic twice (record the new hash, old `fee5dbb1…` retires).
- Verification: command `bash -c 'time (npm run -s playtest -- --hands 10000 --seed 42 | tee /dev/stderr | shasum -a 256)'`

### SPEC-13: Rule units and documentation
- Verifies: DoD#1, DoD#10
- Behaviour: `docs/advice/postflop-rules.md` has `### Rule \`value-bet\`` and `### Rule \`value-raise\`` with
  condition, outcome, the SPEC-02/03 worked example (and a raise example), and a plain-English "Why"; defines "range
  that would call" and the 50% threshold; "Not applied yet" no longer lists value betting and says bots use a lower
  sampling budget. `tests/advice/postflop.test.ts` has `describe('rule value-bet')` and `describe('rule value-raise')`
  (boundaries 50.0/50.1, bet-vs-raise in A-4, multiway A-1 with two opponents, fallback A-5). The locked TASK-7.3 AC#5
  doc/unit/engine consistency check passes.
- Verification: unit `tests/advice/postflop.test.ts::rule value-bet`

### SPEC-14: Calling range and budget units
- Verifies: DoD#2
- Behaviour: `callingRange` returns the whole range when every combo is Air (A-2), keeps input order, gives the same
  result with and without the memo across board changes; `equityWithBudget(x, {200_000, 30_000})` deep-equals
  `computeEquity(x)`; `BOT_EQUITY` is deterministic and sampled with 500 trials above 2,500 evaluations.
- Verification: unit `tests/advice/ranges.test.ts::callingRange`

### SPEC-15: Repo checks, coverage, boundaries
- Verifies: DoD#3, DoD#5, DoD#6, DoD#9
- Behaviour: lint, typecheck and `npm test` pass with zero errors; coverage thresholds hold; `src/advice` and
  `src/bots` import no UI/browser code (locked `tests/toolchain/boundary.test.ts`); no network code added.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-16: Golden spots, screens, offline, CI, docs
- Verifies: DoD#4, DoD#8, DoD#11, DoD#12, DoD#13
- Behaviour: DoD#4 N/A (golden-spot suite arrives with TASK-7.14); DoD#8/#13 N/A (no screen or dialog); CI green on
  `doit/TASK-7.8` including both sweep shards (record shard times; flag if a shard exceeds 8 min); story document
  published with the new SHA/hash, timings and the Q-3 locked-test list.
- Verification: manual `gh run list --branch doit/TASK-7.8 --limit 1` green; `backlog doc list --plain` shows the TASK-7.8 story doc

## 7. Edge cases
- Calling range empty for an opponent (all Air) → whole range (A-2, SPEC-14).
- Several opponents → one multiway run with each calling range (A-1, SPEC-13).
- Card conflicts among narrow calling ranges (`'actions'`) → fallback chain (A-5, SPEC-13).
- Nothing owed but only `raise` legal (short all-in) → `value-bet` with raise (A-4, SPEC-13).
- Capped street / short stack, no raise legal → pot-odds rules (SPEC-07).
- Rounding boundary 50.0 vs 50.1, including 0.50049 → 50.0 (SPEC-04/05).
- Hero all in or not to act → existing errors, unchanged.

## 8. Security considerations
No new trust boundary, input, dependency, network or storage. Bot sampling stays seeded from the canonical input
(determinism; not a fairness/security RNG). Advice still reads only the `PlayerView` (TASK-7.3 AC#6 property stays).

## 9. Non-functional
- Default playtest `--hands 10000 --seed 42`: ≤ 15 s wall locally (prototype: 23 s at 500 trials before canonical-key
  savings; 275 s with no budget; 0.6 s before this task). Locked limits unchanged: 60 s CLI and 120 s test in
  `tag-playtest.acceptance`.
- No unit test over ~5 s (A-6). CI sweep shards: record times; shard 2 was ~4.8 min.
- User advice latency: one extra equity run per hint (worst case ~2× today); `tests/advice/postflop.perf.test.ts`
  must still pass (its CI-skip and scale rules unchanged); TASK-7.18 owns headroom.
- Nightly `playtest:million` (30 min workflow limit): estimate from the 900-hand run and the 10,000-hand time; flag
  as a follow-up if the projected CPU time exceeds 9 shards × 20 min.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 10000 --seed 42`
- New tests: `tests/advice/value-bet.acceptance.test.ts` → SPEC-01..SPEC-11; `tests/advice/postflop.test.ts` →
  SPEC-13; `tests/advice/ranges.test.ts`, `tests/advice/equity.test.ts` → SPEC-14.
- Judge end-to-end: run the playtest command (0 violations, time, SHA); `npx vitest run tests/advice/value-bet.acceptance.test.ts`;
  read the two new rule sections in `docs/advice/postflop-rules.md`; `npm run test:slow` once.

## 11. Open questions
None. Q-1 to Q-3 answered in `doit/TASK-7.8/qa.md` (D-2, D-3, D-7, D-8).

## 12. Clarifications log
See `doit/TASK-7.8/qa.md`.
