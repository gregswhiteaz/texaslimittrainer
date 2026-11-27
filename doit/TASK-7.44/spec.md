# Spec: TASK-7.44 — Scale observed three-bet and four-bet ranges by PFR relative to a typical player

Status: READY (approved 2026-11-26, autopilot)
Task: TASK-7.44 · Parent/epic: TASK-7 · Requirements: REQ-035 (035.6 as reworded by TASK-7.29, 035.2), REQ-046.1 · Dream: limit-holdem-trainer

## 1. Summary
Today `estimateOpponentRanges` scales every observed `three-bet` and `four-bet` line toward raw PFR. So a 22/18
opponent's 6-max UTG four-bet range goes from 2.56% to 18% at 100 hands. This story applies decision-5 (TASK-7.29
Q-3 C) and REQ-035.6 as already reworded: for those two lines `o = min(100, d × observed PFR ÷ typical PFR)`. The
typical PFR is the midpoint of the healthy PFR band for the table size in `src/stats/healthy-ranges.json`
(heads-up 57.5, 6-max 18, full ring 12.5). Open-raise keeps raw PFR, calling lines keep raw VPIP, and the blend
formula and 30-hand threshold do not change. The story also closes two TASK-7.43 review follow-ups: the untested
empty-default branch of `resizeRange`, and a tautological check in that task's locked acceptance test.

## 2. Scope
- In scope:
  - `src/advice/ranges.ts`: new exported `TYPICAL_PFR` constant table, `typicalPfr` and `relativePfrPct`. `OBSERVED_LINE_STAT` maps
    `three-bet` and `four-bet` to `'relative-pfr'`, and `estimateOpponentRanges` uses it (SPEC-01..04).
  - New acceptance test `tests/advice/observed-reraise.acceptance.test.ts` (SPEC-01..06). It is fast (no equity
    runs), so it is not added to `test:slow`.
  - Unlocked unit test `tests/advice/observed-ranges.test.ts`: the "scales each line by its stat" case table
    (`:249-271`) changes for the two re-raise lines, plus new unit tests (SPEC-07, SPEC-08, SPEC-09).
  - Locked edit `tests/advice/observed-resize.acceptance.test.ts:143` under owner TASK-7.43, exactly as in §5
    "Locked edit" (SPEC-10).
  - Docs: `docs/advice/range-model.md` line-to-stat table (`:268-272`), the paragraph after it, and "Known limits"
    (`:290-293`) (SPEC-11).
- Not doing:
  - Open-raise and calling-line position scaling. That is the TASK-7.45 spike.
  - Any new stat (3-bet %), any persisted-format, snapshot, worker-message or golden-parser change.
  - `requirements.md`. REQ-035.6 already states this rule (TASK-7.29, changelog 1.14).
  - `healthy-ranges.json` or `healthy-ranges.ts`. They are only read.
  - Default range files, `hand-order.json`, the blend formula (`scaledWidthPct`), the 30-hand threshold,
    `resizeRange`'s behaviour, and postflop narrowing.
  - Bots. They never pass observed stats (REQ-029.2), so bot play and playtest output are unchanged.
  - Any golden spot or any other locked test.
- Scope budget: files=5, lines=260   (`ranges.ts` ~25; new acceptance test ~150; unit test ~45; locked edit ~4;
  docs ~20)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | New exports in `src/advice/ranges.ts`: `TYPICAL_PFR: Readonly<Record<ReferenceSize, number>> = { 'heads-up': 57.5, '6-max': 18, 'full-ring': 12.5 }`, `typicalPfr(size)` (returns `TYPICAL_PFR[size]`) and `relativePfrPct(d, pfr, typical)` (signatures in §5). `src/advice` does NOT import `src/stats`. A test (which may import both) asserts each constant equals the midpoint of the matching `HEALTHY_RANGES` PFR band, so they can't drift (SPEC-08). | yes | The lint boundary `tools/lint/headless-boundary.js:249-265` (`ADVICE_BOUNDARY_PATTERNS`, TASK-6.27) lets `src/advice/**` import only sibling advice files and five engine modules, so importing `../stats/healthy-ranges` would fail `npm run lint`. The constant plus a drift test keeps the boundary untouched. It also gives the cap (AC#3, AC#7) a direct unit seam. With the shipped data the cap can't be reached through `estimateOpponentRanges` (see A-3). | Widen the lint allow-list to `../stats/healthy-ranges` (changes a TASK-6.27 decision); inject the typical PFR from callers. |
| A-2 | AC#7's "2.42%" is checked within 0.01, the tolerance AC#1 and AC#2 use. The exact value is 2 × 1.2066 = 2.4133. The test asserts the exact formula value to 9 digits and `|width − 2.42| ≤ 0.01`. | yes | 2.42 is the rounded default (1.21) doubled. The exact width differs by 0.0067. | Assert 2.41; ask the user to restate the AC. |
| A-3 | The 100% cap is tested on `relativePfrPct` with a synthetic default (for example d = 30, PFR 90, typical 18 → 150 → 100). An acceptance loop over every shipped three-bet and four-bet range at all three sizes also checks `width = min(100, d × PFR ÷ T)` at PFR 100 and 100 hands. | yes | The widest shipped re-raise default (6-max BTN three-bet 8.90%, heads-up BB three-bet 10.86%) times 100 ÷ T never reaches 100 (measured, §3). So "exceeds 100" can only occur with a synthetic default. | Add a test-only default range file. |
| A-4 | AC#8 is met by keeping the `classes.size === 0` branch of `resizeRange` and covering it with unit tests. An empty set at width 0 gives `{AA}`, and at width 5 it gives `strongestClasses(5)` (measured: both hold today). | yes | Removing the branch changes behaviour: an empty set at width 0 would return an empty set (the `total < target` test is false at target −1e-9). Keeping it preserves the "never empty" contract of an exported function. | Remove the branch as unreachable (shipped defaults are never empty, `parseDefaultRanges` `:206-213`). |
| A-5 | The line-143 replacement asserts that the CO call-raise default holds 22 and the 60% hand-order prefix (`strongestClasses(60)`) does not. This fails if the data stops telling the resize rule apart from the old prefix rule (measured: 22 is the only default class outside the prefix). | yes | It can fail, it guards what the AC#2 test is meant to show, and it drops no assertion. The kept-default property it pretended to check is already asserted against the real output at `:148`. | `expect(expected).not.toEqual(strongestClasses(60))`; check `wide.widthPct` equals 60. |

## 3. Current system
- `src/advice/ranges.ts:605-613` `OBSERVED_LINE_STAT` maps `open-raise`, `three-bet` and `four-bet` to `'pfr'`,
  `limp`, `call-raise` and `call-three-bet` to `'vpip'`, and `check` to `null`.
- `src/advice/ranges.ts:648-673` `estimateOpponentRanges`: `ranges = rangesFor(view.players.length)` gives the
  `referenceSize`. From `OBSERVED_MIN_HANDS` (30) it sets `widthPct = scaledWidthPct(widthPct, obs[stat], obs.hands)`
  and `classes = resizeRange(classes, widthPct)` (`:668-671`).
- `src/advice/ranges.ts:347-350` `scaledWidthPct(d, o, n)` returns exactly `o` from 100 hands.
- `src/advice/ranges.ts:371-389` `resizeRange`: the `classes.size === 0 ||` operand at `:377` is the empty-default
  branch. No test calls it with an empty set (only `tests/advice/observed-ranges.acceptance.test.ts:11` imports it).
- `src/stats/healthy-ranges.ts` exports `HEALTHY_RANGES: HealthyRanges` (validated at import; `high > low`, whole
  percents 0..100). `src/advice/**` may not import it: `tools/lint/headless-boundary.js:249-265`
  (`ADVICE_BOUNDARY_PATTERNS`, TASK-6.27) allows only sibling advice files and the engine modules `player-view`,
  `hand`, `cards`, `hand-evaluator` and `seeded-random`. Tests may import both (A-1).
- `src/stats/healthy-ranges.json` PFR bands: heads-up 40–75 (57.5), 6-max 14–22 (18), full-ring 9–16 (12.5).
- Shipped default re-raise widths (measured with `rangeWidthPct`): 6-max UTG four-bet 2.5641, UTG three-bet 3.7707,
  BTN three-bet 8.8989 (widest 6-max); full-ring UTG four-bet 1.2066, widest 5.7315 (BTN three-bet); heads-up BB
  three-bet 10.8597 (widest), BTN three-bet 4.6757, BTN four-bet 3.3183, BB four-bet 2.5641.
- Expected values: 6-max UTG four-bet at 100 hands: PFR 18 → 2.5641; 45 → 6.4103; 9 → 1.2821. Full-ring UTG
  four-bet: PFR 12.5 → 1.2066; 25 → 2.4133. Heads-up BB three-bet: PFR 57.5 → 10.8597; 75 → 14.1649 (144 combos ×
  75 ÷ (1326 × 0.575)).
- The 4 observed golden postflop spots (`tests/golden/postflop-spots.json:277, 799, 828, 1181`; button = seat 1):
  seat 3 BB `call-raise` (45 hands, VPIP 41); seat 1 BTN `open-raise` (100, PFR 18); seat 6 CO `open-raise` (80,
  PFR 15); seat 4 UTG `call-three-bet` (60, VPIP 34). None is on a `three-bet` or `four-bet` line, so this story
  can't change them.
- Tests that pin re-raise widths: only the unlocked `tests/advice/observed-ranges.test.ts:249-271` (asserts
  `d + (pfr − d) × 50 ÷ 100` for `three-bet` and `four-bet`). Locked `observed-ranges.acceptance.test.ts` AC#2
  (`:117-153`) and `small-table-ranges.acceptance.test.ts:145-166` cover only `open-raise` and `call-raise`.
- `docs/advice/range-model.md:268-272` is the line-to-stat table. `:290-293` "Known limits" says the re-raise
  scaling is a known limit fixed by TASK-7.44. Doc-text tests (`range-model.acceptance.test.ts:389-391`,
  `size-ranges.acceptance.test.ts:259-272`, `small-table-ranges.acceptance.test.ts:171-180`) don't read those lines.
- `tests/advice/observed-resize.acceptance.test.ts:143` `for (const hc of base) expect(expected.has(hc)).toBe(true);`
  is tautological, because `expected = new Set([...base, ...added])` (`:142`).
- Tests run with `npm test` (vitest, v8 coverage, `vite.config.ts:9-22`). Slow checks use `TLH_SLOW_TESTS=1` via
  `npm run test:slow` (`package.json:17`).
- Existing code to reuse:
  - `src/stats/healthy-ranges.ts` → `HEALTHY_RANGES`, imported only by the drift test (SPEC-08), never by `src/advice`.
  - `src/advice/ranges.ts` → `scaledWidthPct`, `resizeRange`, `rangeWidthPct`, `defaultRange`, `DEFAULT_RANGES`,
    `HEADS_UP_RANGES`, `SIX_MAX_RANGES`, `FULL_RING_RANGES`, `strongestClasses`.
  - `src/advice/golden.ts:615` `parsePostflopGoldenSpots` → the 4 spots' `view` and `observed` (SPEC-06).
  - Test helpers: copy the `stateAfter`, `toActView` and `FOUR_BET` / `THREE_BET` step pattern from
    `tests/advice/observed-ranges.test.ts:36-96` (`createHand` with `deck: ALL_CARDS`, `button: 1`).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Re-raise lines use `o = min(100, d × PFR ÷ typical PFR)`; the typical PFR is the healthy PFR band midpoint for the view's reference size. | Raw PFR (today); unscaled; new 3-bet stat | Decided by the user in TASK-7.29 Q-3 C (decision-5); REQ-035.6 already says this | yes | user (TASK-7.29 Q-3) |
| D-2 | The typical PFR follows `rangesFor(view.players.length).referenceSize`, so 3, 4, 5 and 7 seats use 6-max (18) and 8–10 use full ring (12.5). | Interpolate by seat count | It is the same reference size the default ranges and the healthy-range report use (`referenceSizeOf`) | no | n/a |

## 5. Design

### Files to create / modify
- `src/advice/ranges.ts` — add `TYPICAL_PFR`, `typicalPfr` and `relativePfrPct` (no new import); change `OBSERVED_LINE_STAT`
  and the scaling step in `estimateOpponentRanges`; update its doc comment.
- `tests/advice/observed-reraise.acceptance.test.ts` — create: SPEC-01..06.
- `tests/advice/observed-ranges.test.ts` — update the case table at `:249-271`; add SPEC-07..09 unit tests.
- `tests/advice/observed-resize.acceptance.test.ts` — locked (owner TASK-7.43): the line-143 edit below.
- `docs/advice/range-model.md` — line-to-stat table, the sentence after it, and "Known limits" (SPEC-11).

### Components, interfaces and data
```ts
/** Midpoint of the healthy PFR band per reference size (REQ-035.6, REQ-046.1; src/stats/healthy-ranges.json).
 *  A copy, because advice code may not import src/stats (lint boundary); a test keeps it in step. */
export const TYPICAL_PFR: Readonly<Record<ReferenceSize, number>> = {
  'heads-up': 57.5,
  '6-max': 18,
  'full-ring': 12.5,
};
export function typicalPfr(size: ReferenceSize): number; // = TYPICAL_PFR[size]

/** Observed target o for a three-bet or four-bet line: d × pfr ÷ typical, at most 100 (REQ-035.6). */
export function relativePfrPct(d: number, pfr: number, typical: number): number;
// = Math.min(100, (d * pfr) / typical)
```
- `OBSERVED_LINE_STAT: Readonly<Record<PreflopLine, 'vpip' | 'pfr' | 'relative-pfr' | null>>`: `three-bet` and
  `four-bet` → `'relative-pfr'`; every other entry unchanged.
- In `estimateOpponentRanges`, inside the existing observed branch:
  `const o = stat === 'relative-pfr' ? relativePfrPct(widthPct, obs.pfr, typicalPfr(ranges.referenceSize)) : obs[stat];`
  then `widthPct = scaledWidthPct(widthPct, o, obs.hands)`. Everything else is unchanged. `d` is the default width
  before blending, which is `widthPct` at that point.
- `OpponentRange`, `ObservedOpponent` and every exported type are unchanged.

### Rules and algorithms
- `width = d + (o − d) × min(n, 100) ÷ 100` (unchanged), where `o` is:
  - `open-raise`: observed PFR.
  - `limp`, `call-raise`, `call-three-bet`: observed VPIP.
  - `three-bet`, `four-bet`: `min(100, d × PFR ÷ T)`, with T = 57.5 heads-up, 18 at 6-max (3–7 seats), 12.5 at full
    ring (8–10 seats).
  - `check`: not scaled.
- Worked examples (n = 100, so width = o):
  - 6-max UTG four-bet, d = 2.5641: PFR 18 → 2.5641; PFR 45 → 6.4103; PFR 9 → 1.2821.
  - Full-ring UTG four-bet, d = 1.2066: PFR 12.5 → 1.2066; PFR 25 → 2.4133.
  - Heads-up BB three-bet, d = 10.8597: PFR 57.5 → 10.8597; PFR 75 → 14.1649.
  - With n = 50, 6-max UTG four-bet, PFR 45: 2.5641 + (6.4103 − 2.5641) × 0.5 = 4.4872.
  - PFR 0 → o = 0 → the range is the default's strongest class (resizeRange floor).
- The classes are then `resizeRange(default, width)` as today.

### Locked edit (owner TASK-7.43; AC#8)
In `tests/advice/observed-resize.acceptance.test.ts`:
1. Add `strongestClasses,` to the `../../src/advice/ranges` import list (`:6-16`, alphabetical position after
   `SIX_MAX_RANGES`).
2. Replace line 143 exactly:
   - old: `    for (const hc of base) expect(expected.has(hc)).toBe(true);`
   - new (two lines):
     ```ts
         const prefix = strongestClasses(60);
         expect([...base].filter((hc) => !prefix.has(hc))).toContain('22');
     ```
   No other line in the file changes, and no assertion is dropped. The default-kept property stays asserted
   against the real output at `:148`.

### Docs text (SPEC-11)
- Line-to-stat table (`range-model.md:268-272`) becomes four rows:
  `| \`open-raise\` | PFR % |`, `| \`three-bet\`, \`four-bet\` | d × PFR % ÷ typical PFR %, at most 100 |`,
  `| \`limp\`, \`call-raise\`, \`call-three-bet\` | VPIP % |`, `| \`check\` (big blind, nobody raised) | not scaled |`
  (the formatter pads the cells).
- Add one paragraph after the table. It says the typical PFR is the middle of the healthy PFR range for the table
  size (heads-up 57.5, 6-max 18, full ring 12.5; 3–7 seats use 6-max, 8–10 full ring). It explains that a player who
  raises as often as a typical one keeps the default re-raise range, and gives the example: a 6-max UTG four-bet
  (2.56%) seen for 100 hands goes to 6.41% at PFR 45 and 1.28% at PFR 9.
- "Known limits": drop the first two sentences (re-raise widening and "A follow-up task (TASK-7.44) …"). Add a
  sentence stating the relative re-raise rule's limit: it assumes the opponent re-raises in proportion to how
  often they raise first, since the snapshot has no re-raise stat. Keep the small-pairs sentence.

### Error handling and configuration
No new errors. `typicalPfr` can't divide by zero: every `TYPICAL_PFR` value is a positive literal, and SPEC-08 ties
it to the validated healthy bands. Input
validation of the snapshot (`observedBySeat`) is unchanged.

## 6. Behaviour specification

### SPEC-01: A typical-PFR 6-max four-bettor keeps the default width
- Verifies: AC#1
- Behaviour: Given a 6-max hand (button 1) where UTG (seat 4) opens, HJ (5) three-bets, the others fold, UTG
  four-bets, HJ calls and UTG checks the flop, When `estimateOpponentRanges(HJ's view, [{seat: 4, hands: 100, vpip:
  22, pfr: 18}])` runs, Then seat 4 has line `four-bet`, position `UTG`, `widthPct` within 0.01 of 2.56 (and to 9
  digits equal to the default width), basis `based on 100 hands of this opponent`, and `start` equal to the
  default four-bet range expanded without dead cards.
- Verification: acceptance `tests/advice/observed-reraise.acceptance.test.ts::AC#1 a 6-max UTG four-bettor with PFR 18 keeps the default width`

### SPEC-02: Loose and tight four-bettors scale relative to 18
- Verifies: AC#2
- Behaviour: Given the SPEC-01 spot, When seat 4's snapshot is 100 hands with PFR 45, or with PFR 9, Then
  `widthPct` is within 0.01 of 6.41, or of 1.28, and `start` equals `expandRange(resizeRange(default, width), dead)`.
  At 50 hands with PFR 45 the width is 4.4872 (within 1e-9 of `2.5641… + (6.4103… − 2.5641…) × 0.5`).
- Verification: acceptance `tests/advice/observed-reraise.acceptance.test.ts::AC#2 PFR 45 and PFR 9 give 6.41% and 1.28%`

### SPEC-03: Heads-up and full ring use 57.5 and 12.5, and o is capped at 100
- Verifies: AC#3, AC#7
- Behaviour: Given `typicalPfr`, Then it returns 57.5, 18 and 12.5 for `heads-up`, `6-max` and `full-ring`.
  Given a 9-seat hand (button 1, so seat 4 is UTG) where UTG opens, UTG+1 (5) three-bets, the others fold, UTG
  four-bets, UTG+1 calls and UTG checks the flop, When seat 4 has 100 hands with PFR 12.5, or with PFR 25, Then its
  line is `four-bet`, position `UTG`, and `widthPct` is the default 1.2066 (within 0.01 of 1.21), or exactly twice
  the default (within 1e-9) and within 0.01 of 2.42 (A-2). Given a heads-up hand (button 1) where the button opens,
  the BB three-bets, the button calls and the BB checks the flop, When the BB (seat 2) has 100 hands with PFR 75,
  Then its line is `three-bet` and its width is within 0.01 of 14.16. Given every shipped three-bet and four-bet
  range at all three sizes, When `relativePfrPct(d, 100, typicalPfr(size))` is computed, Then it equals
  `Math.min(100, d × 100 ÷ T)` with the literal T (57.5, 18, 12.5). Given `relativePfrPct(30, 90, 18)` and
  `relativePfrPct(20, 90, 18)`, Then both are exactly 100 (150 capped; exactly 100 at the boundary).
- Verification: acceptance `tests/advice/observed-reraise.acceptance.test.ts::AC#3 AC#7 heads-up and full ring use typical PFR 57.5 and 12.5, capped at 100`

### SPEC-04: Open-raise and calling lines are unchanged
- Verifies: AC#4
- Behaviour: Given 6-max spots with an observed opponent on each of `open-raise`, `call-raise`, `limp` and
  `call-three-bet` (snapshot vpip 40, pfr 10), When ranges are estimated at 50 and at 100 hands, Then each
  `widthPct` equals `scaledWidthPct(d, raw stat, n)` to 9 digits, with PFR for `open-raise` and VPIP for the others.
  Each `start` equals `expandRange(resizeRange(default, width), dead)`. The locked
  `observed-ranges.acceptance.test.ts` AC#2 and `small-table-ranges.acceptance.test.ts` AC#1 pass unchanged.
- Verification: acceptance `tests/advice/observed-reraise.acceptance.test.ts::AC#4 open-raise keeps raw PFR and calling lines raw VPIP`

### SPEC-05: Bots and the typical basis are untouched
- Verifies: AC#4
- Behaviour: Given a three-bet spot with no snapshot, or with a snapshot below 30 hands, When ranges are estimated,
  Then the re-raise range is the default with basis `typical player` (no relative scaling is applied).
- Verification: unit `tests/advice/observed-ranges.test.ts::re-raise lines stay typical without 30 observed hands`

### SPEC-06: The 4 observed golden postflop spots still agree
- Verifies: AC#5
- Behaviour: Given `parsePostflopGoldenSpots` of `tests/golden/postflop-spots.json`, When the spots with a
  non-empty `observed` are taken, Then there are exactly 4. Each observed seat's estimated line is one of
  `open-raise`, `call-raise` or `call-three-bet` (never `three-bet` or `four-bet`), and its `widthPct` equals
  `scaledWidthPct(d, raw stat, n)`. The golden suites pass unchanged: each spot agrees and is clear-cut, and no
  spot is edited.
- Verification: acceptance `tests/advice/observed-reraise.acceptance.test.ts::AC#5 the 4 observed golden spots are on lines this rule does not touch`; command `npx vitest run tests/golden`

### SPEC-07: Re-raise lines scale relative to typical PFR in the line table
- Verifies: AC#1, AC#2, AC#4
- Behaviour: Given the existing "scales each line by its stat" cases (6-max, 50 hands, vpip 40, pfr 10), When the
  ranges are estimated, Then `limp`, `call-raise` and `call-three-bet` expect `d + (40 − d) × 0.5`, `open-raise`
  expects `d + (10 − d) × 0.5`, and `three-bet` and `four-bet` expect `d + (d × 10 ÷ 18 − d) × 0.5`. Each case also
  asserts it is not the other formula's value. The test is renamed `scales each line by its stat: PFR for opens,
  PFR relative to typical for re-raises, VPIP for calls`. A PFR of 0 at 100 hands on the four-bet line leaves only
  the default's strongest class.
- Verification: unit `tests/advice/observed-ranges.test.ts::scales each line by its stat: PFR for opens, PFR relative to typical for re-raises, VPIP for calls`

### SPEC-08: The typical PFR table matches the healthy-range midpoints
- Verifies: AC#3
- Behaviour: Given `TYPICAL_PFR` and `HEALTHY_RANGES` (the test imports both), When each reference size is checked,
  Then `TYPICAL_PFR[size]` and `typicalPfr(size)` equal `(HEALTHY_RANGES[size].pfr.low + HEALTHY_RANGES[size].pfr.high) / 2`
  exactly, that is 57.5, 18 and 12.5, and `TYPICAL_PFR` has exactly the three keys `heads-up`, `6-max` and
  `full-ring`. Changing either the JSON band or the constant makes this test fail.
- Verification: unit `tests/advice/observed-ranges.test.ts::TYPICAL_PFR is the middle of each healthy PFR range`

### SPEC-09: resizeRange's empty-default branch is covered
- Verifies: AC#8
- Behaviour: Given an empty class set, When `resizeRange(new Set(), 0)` is called, Then it returns exactly
  `{AA}`. When `resizeRange(new Set(), 5)` is called, Then it equals `strongestClasses(5)`. Coverage then shows
  both outcomes of `classes.size === 0` at `ranges.ts:377` exercised (A-4).
- Verification: unit `tests/advice/observed-ranges.test.ts::resizeRange of an empty set is the strongest hand-order prefix, at least AA`

### SPEC-10: The tautological line-143 check is replaced by one that can fail
- Verifies: AC#8
- Behaviour: Given the locked AC#2 test in `observed-resize.acceptance.test.ts`, When the §5 "Locked edit" is
  applied, Then `git diff main -- tests/advice/observed-resize.acceptance.test.ts` shows exactly the import addition
  and line 143 replaced by the two `prefix` lines. No `expect` is removed: the count of `expect(` grows by 0 and the
  file's tests pass.
- Verification: command `git diff main -- tests/advice/observed-resize.acceptance.test.ts`

### SPEC-11: The range-model doc states the relative re-raise rule
- Verifies: AC#6
- Behaviour: Given `docs/advice/range-model.md`, When the story is done, Then the line-to-stat table has a
  `three-bet`, `four-bet` row whose stat cell reads `d × PFR % ÷ typical PFR %, at most 100`, and the `open-raise`
  row reads `PFR %`. The paragraph after the table names 57.5, 18 and 12.5 and the 6.41% / 1.28% example. "Known
  limits" no longer contains `TASK-7.44` or `widens those re-raise ranges a lot`, and states the
  proportional-re-raise assumption. The doc test asserts these strings (multiple spaces collapsed, as in
  `size-ranges.acceptance.test.ts:259`).
- Verification: acceptance `tests/advice/observed-reraise.acceptance.test.ts::AC#6 range-model.md states the relative re-raise rule`

## 7. Edge cases
- PFR 0 on a re-raise line: o = 0, the range is the default's strongest class (SPEC-07).
- PFR 100: o = d × 100 ÷ T. It is below 100 for every shipped default (measured, §3) and capped at 100 otherwise
  (SPEC-03).
- 29 vs 30 hands: the threshold is unchanged (SPEC-05).
- n > 100: `scaledWidthPct` already caps at 100 hands (existing unit test `observed-ranges.test.ts:220`).
- 3, 4, 5 and 7 seats: 6-max T = 18 via `rangesFor` (D-2). This is not separately tested, because the reference
  size mapping is covered by `small-table-ranges` tests.
- Invalid snapshot values: unchanged validation (`observedBySeat`), N/A for new code.
- Concurrency, permissions, interruption: N/A. Pure synchronous functions.

## 8. Security considerations
No new trust boundary. The snapshot is validated as today, and `healthy-ranges.json` is shipped data validated
at import. No new dependencies, secrets, logging or randomness.

## 9. Non-functional
- No measurable cost: one extra multiply/divide per observed re-raise opponent. The new acceptance file runs no
  equity sampling and must finish in under 2 s in `npm test`, so it is not in the slow group.
- Coverage thresholds (`vite.config.ts:18-21`, 90% lines for `src/advice`) stay met.
- `npm run lint` passes with the advice import boundary unchanged (`tools/lint/headless-boundary.js`).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: N/A — no UI passes observed stats yet (`range-model.md:251-252`); the behaviour is exercised via
  `npx vitest run tests/advice/observed-reraise.acceptance.test.ts`
- New tests:
  - `tests/advice/observed-reraise.acceptance.test.ts` → SPEC-01, 02, 03, 04, 06, 11
  - `tests/advice/observed-ranges.test.ts` → SPEC-05, 07, 08, 09
  - `tests/advice/observed-resize.acceptance.test.ts` (locked edit) → SPEC-10
- End-to-end scenario for the Judge: run `npx vitest run tests/advice/observed-reraise.acceptance.test.ts
  tests/advice/observed-ranges.test.ts tests/advice/observed-resize.acceptance.test.ts tests/golden`. Read the
  SPEC-01..03 widths in the test names and assertions against §5's worked examples. Then run `npm test` and confirm
  the `ranges.ts` coverage line and the golden suites are green.

## 11. Open questions
None.

## 12. Clarifications log
See `doit/TASK-7.44/qa.md`.
