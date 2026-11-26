# Spec: TASK-7.30 — Tidy observed-range helpers: exact zero width and one template filler

Status: READY (approved 2026-11-26)
Task: TASK-7.30 · Parent/epic: TASK-7 · Requirements: n/a (follow-up from TASK-7.13, doc-104) · Dream: limit-holdem-trainer

## 1. Summary
Two clean-ups left over from TASK-7.13. First, `scaledWidthPct` returns about 3.55e-15 instead of exactly 0 for a
6-max CO open-raiser seen for 100 hands with PFR 0. The cause is floating-point rounding in
`d + (o − d) × 100 ÷ 100`. The range is still only AA, but the width is not exactly 0. From 100 hands the width
will be exactly the observed stat. Second, `basisText` fills its `{hands}` placeholder with `String.replace`, so
the advice code has two ways to fill templates. It will use the shared `fillTemplate` instead. No advice, explanation
text or playtest output changes (measured, §3).

## 2. Scope
- In scope:
  - `src/advice/ranges.ts`: `scaledWidthPct` returns `o` itself when `n >= OBSERVED_FULL_HANDS` (100). Below
    100 hands the arithmetic is unchanged.
  - `src/advice/explanations.ts`: `fillTemplate` moves here from `explain.ts`, unchanged, next to the `CONCEPTS`
    it reads. `basisText` calls `fillTemplate(OBSERVED_BASIS, { hands: String(observedHands) })`.
  - `src/advice/explain.ts`: drops its own `fillTemplate`. It imports `fillTemplate` from `./explanations` and
    re-exports it next to `basisText`, so existing importers are unchanged.
  - Tests: one new acceptance file (AC#1, AC#2), plus unit additions to `tests/advice/observed-ranges.test.ts` and
    `tests/advice/explain.test.ts`.
  - Measurements in `doit/TASK-7.30/build-log.md`: the default playtest SHA and the `--check-advice` output SHA,
    before and after.
- Not doing:
  - Changing the scaling formula, `strongestClasses`, the 1e-9 tolerance, the AA floor, the 30-hand threshold or
    any basis wording.
  - The phrase swap at `src/advice/explain.ts:122`. `POSTFLOP_TEMPLATES[key].replace(POT_ODDS_LEAD,
    POT_ODDS_RIVER_BET_LEAD)` replaces one authored constant with another before filling. It fills no
    placeholder, so it stays (A-2).
  - Moving `basisText` into `explain.ts`, or making `ranges.ts` import `explain.ts`. That would bring back the
    range-model → explanation-layer dependency that TASK-7.13 review round 1 removed (D-1).
  - Editing any locked test, doc, golden file or bot.
- Scope budget: files=6, lines=140   (ranges.ts ≈ 2, explanations.ts ≈ 16, explain.ts ≈ 16, new acceptance test
  ≈ 60, observed-ranges.test.ts ≈ 25, explain.test.ts ≈ 25. The build log is a pipeline file and is not counted.)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Exact zero comes from an early return: `if (n >= OBSERVED_FULL_HANDS) return o;`. Below 100 hands the existing expression gives bit-identical results. With the early return, `Math.min(n, 100)` is the same as `n`, so the builder may keep it or drop it. | yes | The smallest change. It makes every n ≥ 100 width exactly `o`, which covers AC#1 and every other range: 18 of the 90 default ranges give a nonzero result at PFR/VPIP 0 today, from −7.1e-15 to 1.4e-14 (measured). Widths below 100 hands do not move, so neither advice nor locked values do. | Rewrite as `d × (1 − t) + o × t` (also exact at t = 1, but every width below 100 hands moves by a few ulps); round the result |
| A-2 | "Template-filling helper" means code that fills `{name}` placeholders. The `POT_ODDS_LEAD` → `POT_ODDS_RIVER_BET_LEAD` swap at `src/advice/explain.ts:122` replaces one constant phrase with another and fills nothing, so it stays. | yes | That reading matches the review finding (`doit/TASK-7.13/reviews/round-2/code.json:36`). Only `basisText` reimplemented placeholder filling. | Rewrite the river-bet lead as a `{potOddsLead}` placeholder (a wider change to the authored templates) |
| A-3 | The playtest SHAs go in `doit/TASK-7.30/build-log.md`, as TASK-7.28 did (`doit/TASK-7.28/spec.md:41`). No test or doc pins them. | yes | Same convention as before. | A docs table of SHAs |

## 3. Current system
- `src/advice/ranges.ts`:
  - `:11` imports `basisText` and `OBSERVED_MIN_HANDS` from `./explanations`.
  - `:317` `OBSERVED_FULL_HANDS = 100`.
  - `:346-349` `scaledWidthPct(d, o, n) = d + ((o - d) * Math.min(n, 100)) / 100`.
  - `:352-362` `strongestClasses(widthPct)`: target `widthPct/100 × 1326 − 1e-9`, never smaller than AA.
  - `:639-646` the only caller: `estimateOpponentRanges` scales from 30 hands and returns `widthPct`.
- `src/advice/explanations.ts`:
  - `:1-3` type-only imports. This module has no runtime dependencies, which is why TASK-7.13 put `basisText`
    here to break the ranges ↔ explain cycle (`doit/TASK-7.13/reviews/round-2/code.json:36,43`).
  - `:61-91` `CONCEPTS`.
  - `:96-104` `TYPICAL_PLAYER_BASIS`, `OBSERVED_BASIS = 'based on {hands} hands of this opponent'`, and `basisText`
    using `OBSERVED_BASIS.replace('{hands}', …)`.
- `src/advice/explain.ts`:
  - `:1-18` value imports from `./explanations`, including `CONCEPTS`, which only `fillTemplate` uses.
  - `:24` re-exports `basisText`.
  - `:31-43` `fillTemplate`, the only other placeholder filler in `src/advice`. It uses `CONCEPTS` for
    `{def:…}` and throws `Unknown template placeholder {<name>}`.
  - `:122` the phrase swap (A-2).
- Importers that must keep working unchanged:
  - `src/advice/postflop.ts:5` imports `basisText` from `./explanations`.
  - `src/table/hint.ts:1` imports `basisText` from `../advice/explain`.
  - `tests/advice/explain.test.ts:3,7` imports `basisText` and `fillTemplate` from `explain`.
- Tests: `npm test` = `vitest run --coverage` (`package.json:12`).
  - The locked file `tests/advice/observed-ranges.acceptance.test.ts` (owner TASK-7.13, hash in
    `doit/TASK-7.13/state.json`) asserts `scaledWidthPct(20, 0, 100)` with `toBeCloseTo(0, 9)` (`:199`). That
    stays true.
  - `tests/advice/observed-ranges.test.ts:219-224` (unit) checks the 100-hand cap, also with `toBeCloseTo`.
  - Exact `widthPct` pins elsewhere (`tests/advice/size-ranges.acceptance.test.ts:90`,
    `tests/advice/small-table-ranges.acceptance.test.ts:64`) use unscaled ranges, which this change does not
    touch.
- Measured with a prototype (§5 design, patched copy of HEAD in a scratch folder; the repo was not touched):
  - The current `scaledWidthPct(d, 0, 100)` for 6-max CO open-raise (d = 23.529…%) is `3.552713678800501e-15`.
    That is the judge's J-2-01 value. With the prototype it is `0`.
  - Typecheck, ESLint and Prettier pass. The whole fast suite passes: 1,341 tests. The one failure was a test that
    reads `dreams/…/Stats.dc.html`, which the copy did not include. No locked test fails and none needs an edit.
    Locked files checked include:
    - `tests/advice/observed-ranges.acceptance.test.ts` (TASK-7.13).
    - `tests/advice/explanations.acceptance.test.ts` (TASK-7.10).
    - `tests/advice/postflop.acceptance.test.ts` (TASK-7.3/7.9/7.13).
    - `tests/advice/size-ranges.acceptance.test.ts` and `tests/advice/small-table-ranges.acceptance.test.ts`.
    - `tests/golden/suite.acceptance.test.ts` (TASK-7.14).
  - `npm run -s playtest -- --hands 10000 --seed 42` stdout SHA-256: before
    `f6c8d1724d90bb27a8b4cae912586341fad7f614a926a31bd040e14fde947cbc`, after the same. `Invariant violations: 0`.
    This default run's bots never get observed stats (doc-104 Q-2), so the identical SHA is expected.
  - `npm run -s playtest -- --check-advice --hands 3000 --seed 42` (this path does run `userAdvice` with observed
    stats, `src/playtest/advice-check.ts:19-21`) stdout SHA-256: before `1b057087831676b9a77089bb7f0305b7e92fddb0e5893535210a6ff9fa00f40b`, after the same, and
    `Advice check: 26503 decision points, 0 mismatches`. That output summarises the advice check; it does not print
    the advice itself. The fast suite (including the locked advice acceptance files above) is the evidence that the
    advice itself is unchanged.
  - Expected locked-value changes: **none**. Widths below 100 hands are bit-identical. From 100 hands the width
    moves by at most 1.4e-14. That is far below the 1e-9 tolerance of `strongestClasses`, so every start range,
    combo set, equity, recommendation and explanation is unchanged.
- Existing code to reuse:
  - `src/advice/explain.ts` `fillTemplate` (`:31-43`) → move it as is. Do not write a new filler.
  - `src/advice/explanations.ts` `OBSERVED_BASIS` / `TYPICAL_PLAYER_BASIS` → keep the authored text.
  - `tests/advice/observed-ranges.acceptance.test.ts:28-60` `deckWith` / `stateAfter` / `toActView` pattern → copy it
    into the new acceptance file. That file is locked and exports nothing, so do not import from it.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Move `fillTemplate` (unchanged) into `explanations.ts`. `basisText` stays there and calls it. `explain.ts` imports `fillTemplate` and re-exports it. | Move `basisText` into `explain.ts` and have `ranges.ts`/`postflop.ts` import it from there; or build the text lazily in `postflop.ts` (review suggestion) | `explanations.ts` has only type imports, so `ranges.ts` still does not depend on the explanation layer, and no import cycle can come back. `fillTemplate` reads only `CONCEPTS`, which lives in `explanations.ts`. Every importer keeps its import path. Lazy text would change `OpponentBasis`, a returned interface. | no | n/a |
| D-2 | Exact width from an early return at n ≥ 100 (A-1). | Lerp form; rounding | Keeps every n < 100 result bit-identical | no | n/a |

## 5. Design

### Files to create / modify
- `src/advice/ranges.ts` — `scaledWidthPct` early return for `n >= OBSERVED_FULL_HANDS`. Update the doc comment to
  say the result is exactly `o` from 100 hands.
- `src/advice/explanations.ts` — receives `fillTemplate` (same signature, body and doc comment). `basisText` uses it.
- `src/advice/explain.ts` — removes `fillTemplate` and the now-unused `CONCEPTS` import. Imports `fillTemplate` from
  `./explanations` and changes the re-export to `export { basisText, fillTemplate } from './explanations';`.
- `tests/advice/observed-range-tidy.acceptance.test.ts` — new: SPEC-01, SPEC-02.
- `tests/advice/observed-ranges.test.ts` — unit: SPEC-03.
- `tests/advice/explain.test.ts` — unit: SPEC-04.

### Components, interfaces and data
- No public signature changes:
  - `scaledWidthPct(d: number, o: number, n: number): number`.
  - `fillTemplate(template: string, values: Readonly<Record<string, string>>): string`, still importable from
    `src/advice/explain`.
  - `basisText(observedHands: number | null): string`, importable from `explain` and `explanations` as before.
  - `OpponentBasis` and `OpponentRange` are unchanged.

### Rules and algorithms
- `scaledWidthPct(d, o, n)`: `n >= 100` → `o`. Otherwise → `d + ((o − d) × n) / 100`, the same expression and
  operation order as today, so the result is bit-identical.
- Worked examples:
  - (23.529411764705884, 0, 100) → `0` (was 3.55e-15).
  - (20, 60, 250) → `60`.
  - (20, 0, 30) → `14` (unchanged; was already within 1e-9).
  - (20, 0, 99) → `20 + (−20 × 99) / 100`, the same as today.
- `basisText(null)` → `'typical player'`. `basisText(45)` → `fillTemplate('based on {hands} hands of this
  opponent', { hands: '45' })` → `'based on 45 hands of this opponent'`.

### Error handling and configuration
- None new. `fillTemplate` keeps throwing `Error('Unknown template placeholder {<name>}')`. `basisText` cannot
  reach that error, because `OBSERVED_BASIS` has only `{hands}`.

## 6. Behaviour specification

### SPEC-01: A CO open-raiser seen for 100 hands with PFR 0 has width exactly 0
- Verifies: AC#1
- Behaviour: Given a 6-max hand (button seat 1) where CO seat 6 open-raises, every other seat folds to the BB hero
  (seat 3), and the hero calls, and the flop is dealt with no ace among the hero's cards or the board, When
  `estimateOpponentRanges(view, [{ seat: 6, hands: 100, vpip: 0, pfr: 0 }])` runs, Then seat 6's range has
  position `'CO'`, line `'open-raise'`, `widthPct` `toBe(0)`, `start` equal to `expandRange(new Set(['AA']),
  dead)` (6 combos), and basis text `'based on 100 hands of this opponent'`. Also,
  `scaledWidthPct(rangeWidthPct(defaultRange(SIX_MAX_RANGES, 'CO', 'open-raise').classes), 0, 100)` is
  `toBe(0)` (never `toBeCloseTo`).
- Verification: acceptance `tests/advice/observed-range-tidy.acceptance.test.ts::AC#1 a CO open-raiser seen for 100 hands with PFR 0 has a scaled width of exactly 0`

### SPEC-02: The basis text for 45 hands
- Verifies: AC#2
- Behaviour: Given 45 observed hands, When `basisText(45)` is rendered, Then it is exactly
  `'based on 45 hands of this opponent'` and equals `fillTemplate(OBSERVED_BASIS, { hands: '45' })`. Also,
  `basisText(null)` is still `'typical player'`. And a postflop `recommend` (opponentRanges `'actions'`) whose raiser
  has `{ hands: 45, vpip: 25, pfr: 20 }` returns that seat's `opponentBasis.text` as
  `'based on 45 hands of this opponent'`.
- Verification: acceptance `tests/advice/observed-range-tidy.acceptance.test.ts::AC#2 basisText for 45 hands reads based on 45 hands of this opponent`

### SPEC-03: From 100 hands the width is exactly the observed stat; below 100 it is unchanged
- Verifies: AC#1
- Behaviour: Given every default range of all three reference sizes, with d = its `rangeWidthPct`, When
  `scaledWidthPct(d, o, n)` runs for n ∈ {100, 150} and o ∈ {0, 37.5, 100}, Then the result is `toBe(o)`; for
  n ∈ {30, 50, 99} it is `toBe(d + ((o − d) * n) / 100)`. Given a 6-max view and an observed entry with 150 hands
  and PFR 0, When the range is estimated, Then `widthPct` is `toBe(0)`.
- Verification: unit `tests/advice/observed-ranges.test.ts::scaledWidthPct is exactly the observed stat from 100 hands`

### SPEC-04: One template filler in src/advice
- Verifies: AC#2
- Behaviour: Given the source of every `.ts` file under `src/advice` (read with `node:fs`), When it is scanned for
  `.replace(` / `.replaceAll(` calls, Then exactly one call has a first argument that is a regex literal containing
  `\{` or a string literal containing `{`. That call is inside `fillTemplate` in `src/advice/explanations.ts`. The
  body of `basisText` contains `fillTemplate(OBSERVED_BASIS`. Also, `fillTemplate` imported from
  `src/advice/explain` is the same function object as the one exported from `src/advice/explanations` (`toBe`).
- Verification: unit `tests/advice/explain.test.ts::src/advice fills placeholders only through fillTemplate`

### SPEC-05: Playtest output unchanged
- Verifies: AC#1, AC#2
- Behaviour: When `npm run -s playtest -- --hands 10000 --seed 42` runs, Then it prints `Invariant violations: 0`
  and its stdout SHA-256 is `f6c8d1724d90bb27a8b4cae912586341fad7f614a926a31bd040e14fde947cbc`, the same as before.
  When `npm run -s playtest -- --check-advice --hands 3000 --seed 42` runs, Then it prints
  `Advice check: 26503 decision points, 0 mismatches` and its stdout SHA-256 is
  `1b057087831676b9a77089bb7f0305b7e92fddb0e5893535210a6ff9fa00f40b`, the same as before. The builder records both pairs in `doit/TASK-7.30/build-log.md`.
- Verification: command `bash -c 'npm run -s playtest -- --hands 10000 --seed 42 | shasum -a 256 && npm run -s playtest -- --check-advice --hands 3000 --seed 42 | shasum -a 256'`

## 7. Edge cases
- n exactly 100 and n above 100: SPEC-01, SPEC-03.
- n = 99, just below the cap, stays on the old arithmetic: SPEC-03.
- Negative rounding residue (heads-up BB call-raise gave −7.1e-15): SPEC-03 covers all 90 default ranges.
- o = d at 100 hands gives exactly d: SPEC-03 covers it through o values that equal no d. The early return makes it
  trivially `o`.
- `basisText(null)`: SPEC-02.
- Invalid observed input: unchanged validation (`src/advice/ranges.ts:595-613`). N/A here.
- Concurrency, interruption, permissions: N/A. These are pure functions.

## 8. Security considerations
- N/A. There is no new input, trust boundary, dependency, secret or randomness. `fillTemplate` uses a replacer
  function, so `$` patterns in values are not interpreted. `basisText`'s value is a validated non-negative
  integer.

## 9. Non-functional
- Speed: no measurable change. The early return skips arithmetic.
- Playtest SHAs (measured before, on HEAD 281ceb1):
  - Default 10,000 hands, seed 42: `f6c8d1724d90bb27a8b4cae912586341fad7f614a926a31bd040e14fde947cbc`, prototype
    identical. About 11 s.
  - `--check-advice` 3,000 hands, seed 42: `1b057087831676b9a77089bb7f0305b7e92fddb0e5893535210a6ff9fa00f40b`, and the prototype gives the same. About 2.5 min per run,
    so this is never part of `npm test`.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run -s playtest -- --hands 10000 --seed 42`
- New tests:
  - `tests/advice/observed-range-tidy.acceptance.test.ts` → SPEC-01, SPEC-02.
  - `tests/advice/observed-ranges.test.ts` → SPEC-03.
  - `tests/advice/explain.test.ts` → SPEC-04.
  - Command → SPEC-05.
- Judge scenario:
  1. Run the new acceptance file and confirm `toBe(0)` is used.
  2. `grep -rn "replace" src/advice` shows only `fillTemplate`'s regex filler and the `POT_ODDS_LEAD` phrase swap.
  3. Run the default playtest and compare its SHA with the value above.

## 11. Open questions
- None.

## 12. Clarifications log
See `doit/TASK-7.30/qa.md`.
