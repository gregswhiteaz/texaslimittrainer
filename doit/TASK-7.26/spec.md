# Spec: TASK-7.26 — Author heads-up and full-ring default opponent ranges

Status: READY (approved 2026-11-25)
Task: TASK-7.26 · Parent/epic: TASK-7 · Requirements: REQ-035 (035.1, 035.2, 035.5), REQ-029.2, REQ-061.2 · Dream: limit-holdem-trainer

## 1. Summary
Postflop advice and bot decisions at heads-up (2 dealt-in seats) and full-ring (8–10) tables still weigh every
opponent against every unseen combo, because default opponent ranges exist only for 6-max (TASK-7.5 A-3, TASK-7.6
A-5). This story authors two new original range files, `heads-up.json` (12 position/line pairs) and
`full-ring.json` (54 pairs), in the existing `tlh-default-ranges` format. It extends the validator to all three
reference sizes and makes `estimateOpponentRanges` start each opponent at those sizes from the authored range for
their size, position and preflop line, then narrow it by TASK-7.5's rule. The change alters user advice and bot play
at those sizes. The spec lists every pinned expectation it may move, and the effect on the all-TAG heads-up and
9-max playtest stats is measured.

## 2. Scope
- In scope:
  - `src/advice/ranges/heads-up.json` and `src/advice/ranges/full-ring.json`: new authored, original data with a
    ≥ 50-word file justification and a ≥ 15-word, distinct justification per range (REQ-061.2).
  - `src/advice/ranges.ts`: `APPLICABLE_LINES` for all three reference sizes; `parseDefaultRanges` accepts
    `heads-up` and `full-ring`; `HEADS_UP_RANGES`, `FULL_RING_RANGES` and `DEFAULT_RANGES`; `estimateOpponentRanges`
    picks the ranges for 2, 6 and 8–10 dealt-in seats.
  - Width bands for every new range, written in `docs/advice/range-model.md` and checked by a test.
  - Docs: `docs/advice/range-model.md` and `docs/advice/postflop-rules.md` updated. If golden spots are re-pinned,
    the log goes in `docs/advice/golden-spots.md`.
  - Measurement: all-TAG heads-up and 9-max stats before and after the change, compared with
    `src/stats/healthy-ranges.json`. The 100,000-hand checks go in the opt-in slow group.
- Not doing:
  - Tables with 3, 4, 5 or 7 dealt-in seats keep "every unseen combo" (Q-4). Follow-up TASK-7.35 moves them to the 6-max ranges.
  - Changing the 6-max ranges, `hand-order.json`, the narrowing rule (KEEP), the observed-stats formula, the postflop
    thresholds, the preflop charts or `healthy-ranges.json`.
  - Size-aware Rock ranges (TASK-7.6 A-4), `chart:print` sizes, the "approximate" label (TASK-7.16).
  - Tuning bot rules if the measured heads-up or 9-max stats fall outside the healthy ranges. That becomes a
    follow-up task (see Q-3).
  - Changing the hint or review UI. The basis text stays `typical player` / `based on N hands of this opponent`.
- Scope budget: files=13, lines=1100   (about 450 lines are range JSON; the rest is ranges.ts ≈ 50, tests ≈ 400,
  docs ≈ 120, plus golden re-pins if any)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Observed-stats scaling (REQ-035.2/035.6) applies at heads-up and full ring too, because these sizes now have a default range `d`. | yes | `estimateOpponentRanges` already scales from whatever default range it found (`src/advice/ranges.ts:604-611`). REQ-035.2 is not size-specific. Keeping one code path is simpler. | Keep observed scaling 6-max only |
| A-2 | Position keys come from the existing `positionOf(view, size)` (`src/advice/preflop.ts:73-88`). Heads-up: button = `BTN`, other seat = `BB`. With 10 seats the two earliest seats are both `UTG` and share the UTG ranges. With 8 seats nobody is `UTG` (earliest is `UTG+1`). | yes | Same mapping the full-ring and heads-up charts use (TASK-7.6 A-1). No new position rules. | Separate UTG2 ranges at 10 seats |
| A-3 | Heads-up lines follow the existing line rules (`preflopLineOf`, `src/advice/ranges.ts:442-466`). A button that completes is `limp`. A big blind who raises a limp is `open-raise` (as 6-max BB, `six-max.json` "BB open-raise"). A button who limps and then re-raises is `three-bet`. | yes | No change to line detection, so 6-max behaviour cannot move. | HU-specific line names |
| A-4 | The applicable pairs per size use the 6-max rule: `check` only for BB, `limp` for every position except BB, and the other five lines for every position. That gives heads-up 12 pairs (BTN: limp + 5 others; BB: check + 5 others) and full ring 1 + 8 + 5×9 = 54 pairs. Every pair can actually occur (e.g. FR UTG `call-raise` = limp then call a raise). | yes | Mirrors `LINE_POSITIONS` (`src/advice/ranges.ts:37-45`). | Drop rare pairs (e.g. HU BTN `three-bet`) |
| A-5 | `DefaultRanges` order, labels and messages for 6-max stay byte-for-byte the same: `'6-max ranges: missing range CO open-raise'`. New sizes use the same templates with their own label, e.g. `'heads-up ranges: missing range BTN limp'`, `'full-ring ranges: missing range UTG+1 open-raise'`. | yes | Locked `tests/advice/range-model.acceptance.test.ts:188-217` pins the 6-max messages. | — |
| A-6 | The new ranges follow the same four invariants the 6-max file obeys: four-bet ⊆ three-bet per position; limp ∩ open-raise = ∅ per position; BB check ∩ BB open-raise = ∅; full-ring open-raise widths do not fall from UTG to BTN. A unit test checks them. | yes | Same sanity checks as `tests/advice/ranges.test.ts:382-404`. They keep the data self-consistent. | Bands only |

## 3. Current system
- Range model: `src/advice/ranges.ts`.
  - `PREFLOP_LINES` and `LINE_POSITIONS`: `:19-45`.
  - `APPLICABLE_LINES` is typed `Record<'6-max', …>`: `:48-52`.
  - `parseDefaultRanges` rejects any `referenceSize` other than `'6-max'`: `:166-171`.
  - `SIX_MAX_RANGES`: `:218`.
  - `defaultRange(ranges, position, line)`: `:221-231`.
  - `estimateOpponentRanges` uses default ranges only when `view.players.length === 6`, otherwise
    `start = unseenCombos(dead)`: `:583-633`.
  - Fully-blocked fallback `if (start.length === 0)`: `:615`. Observed scaling: `:604-611`.
- Positions and sizes: `src/advice/preflop-chart.ts:3-4` (`ReferenceSize`, `Position` already include `UTG+1`,
  `MP`, `LJ`). `SEATS_BEFORE_BUTTON`: `:39-43`. `src/advice/preflop.ts:59-64` `referenceSizeOf` (2 → heads-up,
  3–7 → 6-max, 8–10 → full-ring). `positionOf(view, size)`: `:73-88`.
- Consumers: `src/advice/postflop.ts:155-163` (`opponentRanges: 'actions'` builds attempts combos → start →
  unseen). User advice uses `ACTION_RANGE_ADVICE` (`src/advice/recommend.ts:22`). Bots use `BOT_ADVICE`
  (`src/bots/tag.ts:36`). Golden postflop spots use `goldenPostflopAdvice` (`src/advice/golden.ts:478-487`), which
  is action ranges too.
- Data format and notation: `docs/advice/range-model.md` ("Default range file", "Hand notation"). 6-max widths
  (measured from `src/advice/ranges/six-max.json`): opens UTG 12.2, HJ 16.3, CO 23.5, BTN 34.5, SB 21.3, BB 9.7;
  BB check 90.3; three-bets 3.8–8.9; four-bets 2.6–3.8. The 6-max bands are in `tests/advice/ranges.test.ts:92-119`.
- Charts the ranges must agree with (raise / call % measured from the chart JSON):
  - Heads-up: BTN unopened 76.5 / 11.8; BB limpers 26.4 / 73.6; BB defence 19.8 / 68.5; BTN vs 3-bet 6.2 / 60.3.
  - Full ring unopened raise: UTG 9.2, UTG+1 10.7, MP 13.3, LJ 15.5, HJ 18.4, CO 24.6, BTN 37.3, SB 25.8.
  - Full ring BB defence 4.2 / 32.1; three-bet columns 2.6–7.1.
- Tests: `npm test` = `vitest run --coverage`. `npm run test:slow` = `TLH_SLOW_TESTS=1 vitest run <file list>`
  (`package.json:17`). A slow check is `it.runIf(SLOW)` with `SLOW = process.env.TLH_SLOW_TESTS === '1'`, built
  like `tests/advice/postflop-folding.acceptance.test.ts:106-125, 265-281` (all-TAG `runPlaytest` +
  `handStyleCounts` → `styleStats`).
- Healthy ranges (`src/stats/healthy-ranges.json`):
  - heads-up: VPIP 65–90, PFR 40–75, Aggression 50–70, WTSD 40–55, W$SD 46–56.
  - full-ring: VPIP 13–20, PFR 9–16, Aggression 50–66, WTSD 28–40, W$SD 47–57.
- Locked files (from `doit/*/state.json`) this story touches or may move:
  - `tests/golden/postflop-spots.json` — owner TASK-7.14. 18 heads-up and 16 full-ring spots (seats 2 / 9) are
    graded with action ranges, so their equity changes. A spot may stop matching or stop being clear-cut. This is
    a locked data edit: see Q-2.
  - `tests/advice/range-model.acceptance.test.ts` — owner TASK-7.5. It uses `APPLICABLE_LINES['6-max']` (36), 6-max
    messages and `docs/advice/range-model.md` containing `Ks 8d 7c` and every line name. It must stay green
    **without edits** (A-5).
  - `tests/advice/table-sizes.acceptance.test.ts`, `tests/playtest/all-sizes.acceptance.test.ts` — owner TASK-7.6.
    They are behavioural (zero violations, chart picks) and are expected to stay green without edits.
  - `tests/playtest/lineup.acceptance.test.ts` (slow, 10,000 hands at 9 seats) and
    `tests/playtest/million-lineups.acceptance.test.ts` — zero-violation and determinism checks only. They are
    expected to stay green; their run time may move.
  - No graded example in `tests/golden/graded-examples.json` is postflop at a size other than 6 (checked), so none
    moves.
- Unlocked tests that pin the old behaviour and must be rewritten: `tests/advice/postflop-ranges.test.ts:140-155`
  (heads-up start = every unseen combo, `position: null`).
- Docs that state the old behaviour: `docs/advice/range-model.md` ("Safety rules → Other table sizes"; "Tables that
  are not six-handed have no default range to scale yet"; "At a six-handed table the seats…").
  `docs/advice/postflop-rules.md:170-171` ("Not applied yet" bullet).
- Existing code to reuse:
  - `src/advice/ranges.ts` `parseDefaultRanges`, `parseHandRange`, `defaultRange`, `expandRange`,
    `rangeWidthPct` → validate, look up, expand and measure the new files (no new parser).
  - `src/advice/preflop.ts` `positionOf`, `referenceSizeOf` → position keys and size names.
  - `src/advice/preflop-chart.ts` `SEATS_BEFORE_BUTTON` → full-ring position order.
  - `tests/advice/ranges.test.ts` `problemsOf` / `copyOf` helpers → model for the new validation tests.
  - `tests/advice/postflop-folding.acceptance.test.ts` `tagStats` pattern → the measurement test.
  - `src/stats/healthy-ranges.ts` `HEALTHY_RANGES` → bounds (never hard-code them).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Range contents and width bands as in Appendix A (66 ranges). | Wider heads-up opens close to the chart; re-map 6-max ranges | Poker content, consistent with the charts (Appendix A reasoning). Flagged for user review. | yes | user (Q-1) |
| D-2 | Size choice in `estimateOpponentRanges`: `rangesFor(n)` returns 2 → `HEADS_UP_RANGES`, 6 → `SIX_MAX_RANGES`, 8–10 → `FULL_RING_RANGES`, else `null` (every unseen combo). | Key by `referenceSizeOf` (3–7 → 6-max) | Stays inside the story. 3–5 and 7 seats go to follow-up TASK-7.35. | yes | user (Q-4) |
| D-3 | Golden spots that fail or stop being clear-cut are replaced on the same street, size and action, and logged under "Changes from TASK-7.26" in `docs/advice/golden-spots.md` (TASK-7.32 D-4 convention). | delete them; loosen the clear-cut rule | Keeps coverage counts. `tests/golden/postflop-spots.json` is unlocked under TASK-7.14 for like-for-like replacements only. | yes | user (Q-2) |
| D-4 | Measurement: the slow file logs the five stats for 100,000 all-TAG hands at sizes 2 and 9 and asserts zero violations and non-null stats. Healthy-range misses are recorded and become a follow-up task. | assert inside healthy ranges | Avoids turning this story into bot tuning. | yes | user (Q-3) |
| D-5 | One data file per size, `src/advice/ranges/<size>.json`, same format v1, `referenceSize` names the size. | one file with three sections; format v2 | Mirrors the chart files (`src/advice/charts/*.json`); no format change for 6-max. | no | n/a |

## 5. Design

### Files to create / modify
- `src/advice/ranges/heads-up.json` — new: 12 authored heads-up ranges (Appendix A).
- `src/advice/ranges/full-ring.json` — new: 54 authored full-ring ranges (Appendix A).
- `src/advice/ranges.ts` — all-size `APPLICABLE_LINES`; validator accepts three sizes; new exports; size choice in
  `estimateOpponentRanges`; doc comments for `OpponentRange.position/line`.
- `tests/advice/size-ranges.acceptance.test.ts` — new: AC#1, AC#2, AC#3 (fast, normal suite).
- `tests/advice/size-ranges-playtest.acceptance.test.ts` — new: SPEC-07 (opt-in slow only).
- `tests/advice/ranges.test.ts` — unit: new-size validator edge cases and the A-6 invariants.
- `tests/advice/postflop-ranges.test.ts` — rewrite the heads-up block (`:140-155`). The "no default ranges"
  fallback moves to a 5-seat view; heads-up now asserts the authored start.
- `package.json` — add `tests/advice/size-ranges-playtest.acceptance.test.ts` to `test:slow`.
- `docs/advice/range-model.md` — positions per size, pair counts, the new files, the bands table, the observed
  scaling at all three sizes, and the "Other table sizes" rule (3–5 and 7 seats).
- `docs/advice/postflop-rules.md` — drop the "default ranges for heads-up and full-ring" bullet in "Not applied
  yet". Keep the section heading; locked TASK-7.5 AC#9 reads it.
- `docs/advice/golden-spots.md` — only if Q-2 re-pins happen: "Changes from TASK-7.26" log.
- `tests/golden/postflop-spots.json` — only if Q-2 re-pins happen (locked, owner TASK-7.14; unlocked under TASK-7.14 for Q-2).

### Components, interfaces and data
- `APPLICABLE_LINES: Readonly<Record<ReferenceSize, readonly RangeId[]>>`.
  - Each size is built from its position list in PREFLOP_LINES order, then position order:
    - heads-up `['BTN', 'BB']`
    - 6-max `['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB']` (unchanged, still 36 in the same order)
    - full-ring `['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB']`
  - Line rule (A-4): `check` → BB only; `limp` → every position but BB; the other lines → every position.
  - Counts: heads-up 12, 6-max 36, full-ring 54.
- `parseDefaultRanges(raw)` accepts `referenceSize` in `['heads-up', '6-max', 'full-ring']`. Unknown sizes keep
  the message `Range file: unknown reference size "<echo>"`. Label `<size> ranges`; all problem templates unchanged.
- `export const HEADS_UP_RANGES`, `FULL_RING_RANGES: DefaultRanges` (validated at import, like `SIX_MAX_RANGES`).
  `export const DEFAULT_RANGES: Readonly<Record<ReferenceSize, DefaultRanges>>`.
- `export function rangesFor(dealtIn: number): DefaultRanges | null`: 2 → heads-up, 6 → 6-max, 8–10 →
  full-ring, else null (D-2, Q-4).
- `estimateOpponentRanges(view, observed)`:
  - Replace `sixMax` with `const ranges = rangesFor(view.players.length)`. When non-null,
    `position = positionOf({ ...view, seat }, ranges.referenceSize)`,
    `line = preflopLineOf(view, seat)`, `classes = defaultRange(ranges, position, line).classes`.
  - Observed scaling, dead-card removal, the fully-blocked fallback and narrowing are unchanged.
  - `OpponentRange.position/line/widthPct` are null only when `rangesFor` returns null.

### Rules and algorithms
- Worked example (heads-up): seats 1–2, button 1. BTN raises, BB calls, flop dealt, BB checks, BTN bets.
  - The hero is BB. The opponent (seat 1) is `BTN open-raise`.
  - `start = expandRange(defaultRange(HEADS_UP_RANGES, 'BTN', 'open-raise').classes, dead)`. Its width before
    dead cards is 49.3 %.
  - `combos = narrowRange(start, flop, 'bet')`.
- Worked example (10 seats): the two seats after BB are both `UTG`. A limp from either is `UTG limp`
  (`full-ring.json`).

### Error handling and configuration
- A shipped file that fails validation throws `RangeValidationError` at import, as 6-max does today. The new
  tests make sure the shipped files pass.
- No configuration. No new dependency.

## 6. Behaviour specification

### SPEC-01: Every heads-up and full-ring pair has a justified range, and a gap fails validation
- Verifies: AC#1
- Behaviour: Given the shipped files, When `parseDefaultRanges` runs, Then `APPLICABLE_LINES['heads-up']` has 12
  pairs and `APPLICABLE_LINES['full-ring']` has 54. `HEADS_UP_RANGES.ranges` and `FULL_RING_RANGES.ranges` list
  exactly those pairs in that order. Each file justification has ≥ 50 words, and each range has ≥ 1 class and
  ≥ 15 words of justification. And Given a copy with one pair removed, an empty justification or empty hands, Then
  `RangeValidationError.problems` equals exactly one of:
  - `['heads-up ranges: missing range BTN limp']`
  - `['full-ring ranges: missing range UTG+1 open-raise']`
  - `['full-ring ranges: BB check is missing its plain-English justification (at least 15 words)']`
  - `['heads-up ranges: BB call-raise has no hands']`
- Verification: acceptance `tests/advice/size-ranges.acceptance.test.ts::AC#1 every heads-up and full-ring position and line has a justified range and gaps fail validation`

### SPEC-02: A pair from the wrong size, a duplicate and an unknown size are rejected
- Verifies: AC#1
- Behaviour: Given malformed copies of the new files, When `parseDefaultRanges` runs, Then:
  - Given a heads-up copy with an extra `{position: 'UTG', line: 'open-raise'}` entry, Then problems include
    `heads-up ranges: range UTG open-raise does not apply at heads-up`.
  - A full-ring entry `BB limp` gives `full-ring ranges: range BB limp does not apply at full-ring`.
  - A repeated full-ring pair gives `full-ring ranges: duplicate range <P> <L>`.
  - `referenceSize: '9-max'` gives `['Range file: unknown reference size "9-max"']`.
  - The 6-max messages and the 36-pair order are unchanged.
- Verification: unit `tests/advice/ranges.test.ts::validates heads-up and full-ring range files`

### SPEC-03: Heads-up opponents start from the authored range and are narrowed
- Verifies: AC#2
- Behaviour: Given a heads-up flop view (button 1 raised, BB 2 called, BB checks, BTN bets; hero = seat 2), When
  `estimateOpponentRanges(view)` runs, Then seat 1 has:
  - `position 'BTN'` and `line 'open-raise'`
  - `widthPct` = `rangeWidthPct(defaultRange(HEADS_UP_RANGES,'BTN','open-raise').classes)`
  - `start` = `expandRange(<those classes>, hero + board)`, which is not 1,081 combos
  - `combos` = `narrowRange(start, flop, 'bet')`
  And When `recommendPostflop(view, { ...ACTION_RANGE_ADVICE, equity: spy })` runs, Then the spy's
  `opponents[0]` equals those `combos`.
- Verification: acceptance `tests/advice/size-ranges.acceptance.test.ts::AC#2 a heads-up opponent starts from the heads-up range for their position and line and is narrowed`

### SPEC-04: Full-ring opponents (8, 9 and 10 seats) start from the authored full-ring range
- Verifies: AC#2
- Behaviour: Given a 9-seat flop view where the MP seat opens, the BTN calls and the hero (BB) calls, and on the
  flop the MP bets and the BTN calls, When ranges are estimated, Then:
  - MP is `MP open-raise` with `combos = narrowRange(expand(FR MP open-raise), flop, 'bet')`.
  - BTN is `BTN call-raise` narrowed by `call`.
  And Given a 10-seat view where the first seat after BB limps, Then that opponent is `UTG limp` (A-2). Given an
  8-seat view, the first seat after BB is `UTG+1`. In each case `start` is the expanded full-ring range.
- Verification: acceptance `tests/advice/size-ranges.acceptance.test.ts::AC#2 full-ring opponents at 8, 9 and 10 seats start from the full-ring range and are narrowed`

### SPEC-05: Every authored range lies inside its documented band
- Verifies: AC#3
- Behaviour: Given `HEADS_UP_RANGES` and `FULL_RING_RANGES`, When each width
  (`rangeWidthPct(classes)`, % of 1,326) is measured, Then it is within the inclusive band in Appendix A for its
  (size, position, line). The test holds the band table and checks it covers all 66 pairs (no pair without a band).
  `docs/advice/range-model.md` contains each band as a row `| <size> | <position> | <line> | <low>–<high> |`.
- Verification: acceptance `tests/advice/size-ranges.acceptance.test.ts::AC#3 every heads-up and full-ring range width lies inside its documented band`

### SPEC-06: The new ranges are self-consistent and original
- Verifies: AC#3
- Behaviour: Given the two new files, Then for each size:
  - Every position's `four-bet` ⊆ its `three-bet`.
  - Every position's `limp` ∩ `open-raise` = ∅, and BB `check` ∩ BB `open-raise` = ∅.
  - Full-ring open-raise widths are non-decreasing UTG → UTG+1 → MP → LJ → HJ → CO → BTN.
  - Every range justification is distinct within its file and from every 6-max justification.
- Verification: unit `tests/advice/ranges.test.ts::heads-up and full-ring range content sanity`

### SPEC-07: Heads-up and 9-max all-TAG playtest effect is measured (slow, opt-in)
- Verifies: AC#2
- Behaviour: Given `TLH_SLOW_TESTS=1`, When
  `runPlaytest({ hands: 100000, seed: 42, size: 2, game: 'cash' })` and the same with `size: 9` run, Then each has
  `handsPlayed = 100000` and `violations = 0`. VPIP, PFR, Aggression, WTSD and W$SD (summed over every seat, as in
  `postflop-folding.acceptance.test.ts:106-125`) are all non-null and printed as
  `TAG <heads-up|full-ring> <stat>: <x.x> (healthy <low>–<high>)`, using `HEALTHY_RANGES`. The stats are not
  asserted inside the healthy ranges (Q-3). Any stat outside its range is recorded (SPEC-08) and becomes a follow-up task. Not run by `npm test`. Added to
  `npm run test:slow`.
- Verification: acceptance `tests/advice/size-ranges-playtest.acceptance.test.ts::heads-up and 9-max all-TAG stats with authored ranges (100,000 hands, seed 42)`

### SPEC-08: Before/after numbers are recorded
- Verifies: AC#2
- Behaviour: The builder records the five stats at 5,000 all-TAG hands (seed 42, sizes 2 and 9) on the base commit
  and after the change, plus the 100,000-hand figures from SPEC-07. They go in `doit/TASK-7.26/build-log.md` and a
  short "Effect at heads-up and full ring (TASK-7.26)" paragraph in `docs/advice/range-model.md`. Any stat outside
  its healthy range is named there with its value.
- Verification: manual `doit/TASK-7.26/build-log.md and docs/advice/range-model.md contain the before/after table for sizes 2 and 9`

### SPEC-09: Other sizes and 6-max are unchanged
- Verifies: AC#2
- Behaviour: Given views at sizes without new ranges or at 6-max, When ranges are estimated or the default playtest runs, Then:
  - Given a 5-seat flop view, Then every opponent has `position null`, `line null`, `widthPct null` and
    `start = unseenCombos(dead)` (this replaces the old heads-up assertion at `postflop-ranges.test.ts:140-155`).
    The heads-up block there now asserts the authored start.
  - The 6-max default playtest is unchanged: `npm run -s playtest -- --hands 2000 --seed 42` prints byte-identical
    output before and after.
- Verification: unit `tests/advice/postflop-ranges.test.ts::actions mode falls back on scripted lines and tables without default ranges`

### SPEC-10: Golden postflop suites still pass, and any re-pin is justified
- Verifies: AC#2
- Behaviour: Given the new ranges, When the golden suites run, Then:
  - `npx vitest run tests/golden` passes.
  - Every heads-up or full-ring postflop spot that stops matching or being clear-cut is replaced as Q-2 decides.
    Each replacement is logged (old id, new id, reason with the new margin) in `docs/advice/golden-spots.md`
    "Changes from TASK-7.26".
  - The coverage counts in `golden-spots.md` "Coverage" (120 postflop: 86 / 18 / 16) still hold.
- Verification: command `npx vitest run tests/golden`

### SPEC-11: Docs describe the three sizes
- Verifies: AC#1, AC#3
- Behaviour: `docs/advice/range-model.md`:
  - Names the positions for heads-up (BTN, BB), 6-max and full ring (UTG … BB), and the pair counts 12 / 36 / 54.
  - Names the three data files and holds the band table (SPEC-05).
  - States that 3, 4, 5 and 7 seats start from every unseen hand (follow-up TASK-7.35), and that observed scaling
    applies at every size with default ranges (A-1).
  - Still contains `Ks 8d 7c` and every line name.
  `docs/advice/postflop-rules.md` "Not applied yet" no longer says opponents at heads-up/full-ring tables start from
  every unseen hand. Locked `range-model.acceptance.test.ts` AC#9 passes unchanged.
- Verification: command `npx vitest run tests/advice/range-model.acceptance.test.ts tests/advice/size-ranges.acceptance.test.ts`

### SPEC-12: Every other check stays green
- Verifies: AC#1, AC#2, AC#3
- Behaviour: `npm run format`, `npm run lint`, `npm run typecheck`, `npm test` and `npm run e2e` pass. In
  `npm run test:slow` every file passes except any already-known failure recorded by an earlier task. Locked
  acceptance files are not edited, except `tests/golden/postflop-spots.json` under Q-2.
- Verification: command `npm run lint && npm run typecheck && npm test`

## 7. Edge cases
- Fully blocked tiny range (e.g. FR UTG four-bet `KK+ AKs` vs hero KK on a K board): the existing fallback to every
  unseen combo applies (`ranges.ts:615`). It is unchanged and covered by the existing unit test at
  `postflop-ranges.test.ts:157`.
- 10 seats with two UTG seats: SPEC-04. 8 seats without UTG: SPEC-04.
- Heads-up blind all-in on posting: keyed by the existing rule (`preflopLineOf` fallback). HU BTN → `limp`, BB →
  `check`. Both pairs exist. Covered by SPEC-01 completeness.
- Multiway full-ring clashes (no deal fits every range): existing fallback chain `combos → start → unseen`
  (`postflop.ts:158-162`), unchanged.
- Busted seats: positions count dealt-in seats only (`positionOf`). A 10-seat table with one bust is 9 dealt in →
  full ring. Covered by SPEC-04's use of `players.length`.
- Concurrency, permissions, interruption: N/A (pure functions over static data).

## 8. Security considerations
- Trust boundary: the range JSON is bundled, authored data, validated at import with echo-truncated messages
  (existing `echo`). No user input enters. The observed-stats snapshot keeps its existing validation.
- No authn/authz, secrets, injection surface, logging of sensitive data or new dependency.
- Randomness: none added. The playtest seeds are deterministic, and advice stays deterministic (REQ-036).

## 9. Non-functional
- Determinism: the same view gives the same ranges (existing AC#7 of TASK-7.5 still passes).
- Speed: narrower start ranges reduce the equity work. The fast suite must not grow by more than about 2 s. The new
  acceptance file targets < 2 s (no playtests in it).
- The slow SPEC-07 file targets < 8 min total (heads-up about 1 min, 9-max about 3–5 min, measured; 600 s timeout
  each). Never in `npm test` or CI push (standing rule: slow checks are opt-in).
- Record the `npm run -s playtest:million -- --lineups` wall time before/after in the build log (TASK-7.6 baseline
  50.5 s). Flag it if it grows by more than 2×.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run -s playtest -- --hands 2000 --size 2` and `npm run -s playtest -- --hands 2000 --size 9`
  (0 violations); slow measurement `TLH_SLOW_TESTS=1 npx vitest run tests/advice/size-ranges-playtest.acceptance.test.ts`
- New tests:
  - `tests/advice/size-ranges.acceptance.test.ts` → SPEC-01, 03, 04, 05
  - `tests/advice/ranges.test.ts` → SPEC-02, 06
  - `tests/advice/postflop-ranges.test.ts` → SPEC-09
  - `tests/advice/size-ranges-playtest.acceptance.test.ts` → SPEC-07
- End-to-end scenario for the Judge:
  1. `npm run dev`, start a 2-player game, play to a flop where the bot opened, and ask for a hint. The opponent
     basis reads "typical player", and the equity differs from the "every unseen hand" figure on the base commit
     for the same replay.
  2. Repeat at 9 players.
  3. Run the two playtest commands above and the slow measurement, and compare with the build-log table.

## 11. Open questions
None. Q-1 to Q-4 were answered (recommended options); see `doit/TASK-7.26/qa.md`.

## 12. Clarifications log
See `doit/TASK-7.26/qa.md`.

## Appendix A — Recommended ranges and bands (Q-1)

Widths are % of 1,326 combos before dead cards, measured from the notation below with the project's parser rules.
Bands are inclusive. Justifications (≥ 15 words, original, distinct) are written by the builder from the reasoning
below. The file justifications (≥ 50 words) describe a typical low-stakes heads-up / full-ring limit player.

Design reasoning:
- **Full ring is tighter than 6-max** at every comparable seat: more players left to act means more chances that
  someone behind holds a big hand.
- **Typical players raise less than the chart and limp part of the rest.** Every full-ring open-raise range is
  narrower than the chart's unopened raise width: UTG 6.9 vs 9.2, BTN 27.3 vs 37.3, SB 13.0 vs 25.8. The limp
  ranges hold the next tier of hands and never overlap the raises, as in 6-max.
- **Full-ring early re-raises are big pairs and AK only** (2.6–3.3 %). Four-bets are 1.2–3.0 % and always inside the
  same seat's three-bet range.
- **Heads-up is far wider**: the button plays about 69 % of hands (49.3 raise + 19.3 limp, against the chart's 88 %
  continue). The big blind defends a raise with about 56 % (44.9 call + 10.9 re-raise, against the chart's 88 %):
  a typical player over-folds the big blind. A button limp-then-re-raise (`three-bet`) is a strong trapping range.

| Size | Position | Line | Width % | Band % | Hands |
|---|---|---|---|---|---|
| heads-up | BB | check | 85.1 | 65–90 | `22-55 A2s-A5s A2o-A8o K2s-K8s K2o-KTo Q2s-Q9s Q2o-QJo J2s-J9s J2o-JTo T2s-T9s T2o-T9o 92s-98s 92o-98o 82s-87s 82o-87o 72s-76s 72o-76o 62s-65s 62o-65o 52s-54s 52o-54o 42s-43s 42o-43o 32s 32o` |
| heads-up | BTN | limp | 19.3 | 10–30 | `K2o-K4o Q2s Q3s Q5o-Q7o J2s-J5s J5o-J7o T2s-T5s T6o T7o 92s-95s 96o 97o 84s 86o 74s 76o 63s 53s 43s` |
| heads-up | BTN | open-raise | 49.3 | 40–70 | `22+ A2s+ A2o+ K2s+ K5o+ Q4s+ Q8o+ J6s+ J8o+ T6s+ T8o+ 96s+ 98o 85s+ 87o 75s+ 64s+ 54s` |
| heads-up | BB | open-raise | 14.9 | 10–30 | `66+ A6s+ A9o+ K9s+ KJo+ QTs+ JTs` |
| heads-up | BTN | call-raise | 11.8 | 5–20 | `Q2s Q3s Q6o Q7o J2s-J5s J6o J7o T4s T5s T7o 94s 95s 97o 84s 86o 74s 76o 63s 53s 43s` |
| heads-up | BB | call-raise | 44.9 | 35–65 | `22-99 A2s-ATs A2o-AJo K2s-KJs K5o-KQo Q4s-QJs Q8o-QJo J6s-JTs J8o-JTo T6s-T9s T8o T9o 96s-98s 98o 85s-87s 87o 74s-76s 64s 65s 53s 54s 43s` |
| heads-up | BTN | three-bet | 4.7 | 2–8 | `TT+ AQs+ AQo+` |
| heads-up | BB | three-bet | 10.9 | 6–20 | `77+ A9s+ ATo+ KTs+ KQo QJs` |
| heads-up | BTN | call-three-bet | 20.4 | 12–40 | `22-TT A2s-AQs A7o-AQo K8s+ KTo+ Q9s+ QJo J9s+ T9s 98s 87s` |
| heads-up | BB | call-three-bet | 12.2 | 8–30 | `55-JJ A8s-AQs ATo-AQo KTs+ KJo+ QTs+ QJo JTs T9s` |
| heads-up | BTN | four-bet | 3.3 | 1.5–8 | `JJ+ AKs AKo AQs` |
| heads-up | BB | four-bet | 2.6 | 1.5–8 | `QQ+ AKs AKo` |
| full-ring | BB | check | 93.5 | 80–97 | `22-77 A2s-A9s A2o-AJo K2s-KJs K2o-KJo Q2s-QJs Q2o-QJo J2s-JTs J2o-JTo T2s-T9s T2o-T9o 92s-98s 92o-98o 82s-87s 82o-87o 72s-76s 72o-76o 62s-65s 62o-65o 52s-54s 52o-54o 42s-43s 42o-43o 32s 32o KQo` |
| full-ring | UTG | limp | 5.3 | 3–14 | `22-66 A9s KJs QJs JTs AJo KQo` |
| full-ring | UTG+1 | limp | 5.9 | 3–14 | `22-66 A8s A9s KTs QJs JTs T9s ATo KJo` |
| full-ring | MP | limp | 6.6 | 3–14 | `22-55 A5s-A9s KTs QTs JTs T9s 98s ATo KJo` |
| full-ring | LJ | limp | 7.7 | 3–14 | `22-44 A2s-A7s K9s Q9s J9s T9s 98s 87s ATo KJo QJo` |
| full-ring | HJ | limp | 8.4 | 3–14 | `22-33 A2s-A6s K8s K9s Q9s J9s T8s 98s 87s 76s A9o KTo QJo JTo` |
| full-ring | CO | limp | 8.9 | 3–14 | `22 A2s-A4s K6s-K8s Q8s J8s T8s 97s 87s 76s 65s A7o A8o KTo QTo JTo` |
| full-ring | BTN | limp | 13.3 | 5–20 | `A2o-A6o K2s-K5s K8o K9o Q5s-Q7s Q9o J7s J9o T7s T9o 96s 86s 75s 65s 54s` |
| full-ring | SB | limp | 37.0 | 20–55 | `22-66 A2s-A6s A2o-A9o K2s-K9s K6o-KTo Q5s-Q9s Q8o-QJo J6s-J9s J8o-JTo T6s-T9s T8o T9o 96s-98s 98o 85s-87s 87o 74s-76s 76o 64s 65s 53s 54s 43s` |
| full-ring | UTG | open-raise | 6.9 | 5–10 | `77+ ATs+ AQo+ KQs` |
| full-ring | UTG+1 | open-raise | 9.0 | 6–12 | `77+ ATs+ AJo+ KJs+ KQo` |
| full-ring | MP | open-raise | 9.8 | 7–14 | `66+ ATs+ AJo+ KJs+ KQo QJs` |
| full-ring | LJ | open-raise | 11.8 | 8–16 | `55+ A8s+ AJo+ KTs+ KQo QTs+ JTs` |
| full-ring | HJ | open-raise | 14.3 | 10–19 | `44+ A7s+ ATo+ KTs+ KJo+ QTs+ JTs` |
| full-ring | CO | open-raise | 17.8 | 13–25 | `33+ A5s+ ATo+ K9s+ KJo+ Q9s+ QJo J9s+ T9s 98s` |
| full-ring | BTN | open-raise | 27.3 | 18–35 | `22+ A2s+ A7o+ K6s+ KTo+ Q8s+ QTo+ J8s+ JTo T8s+ 97s+ 87s 76s` |
| full-ring | SB | open-raise | 13.0 | 9–25 | `77+ A7s+ ATo+ KTs+ KJo+ QTs+ JTs` |
| full-ring | BB | open-raise | 6.5 | 4–12 | `88+ ATs+ AQo+ KQs` |
| full-ring | UTG | call-raise | 8.0 | 5–15 | `22-TT ATs-AQs KJs+ QJs JTs AQo KQo` |
| full-ring | UTG+1 | call-raise | 8.9 | 5–15 | `22-TT ATs-AQs KJs+ QJs JTs AJo AQo KQo` |
| full-ring | MP | call-raise | 10.1 | 5–15 | `22-TT A9s-AQs KTs+ QTs+ JTs T9s AJo AQo KQo` |
| full-ring | LJ | call-raise | 10.7 | 5–15 | `22-TT A8s-AQs KTs+ QTs+ JTs T9s 98s AJo AQo KQo` |
| full-ring | HJ | call-raise | 14.0 | 8–20 | `22-TT A7s-AQs K9s+ Q9s+ J9s+ T9s 98s 87s ATo-AQo KJo+` |
| full-ring | CO | call-raise | 16.3 | 8–22 | `22-JJ A5s-AQs K9s+ Q9s+ J9s+ T9s 98s 87s 76s ATo-AQo KJo+ QJo` |
| full-ring | BTN | call-raise | 20.8 | 12–28 | `22-JJ A2s-AQs K8s+ Q8s+ J8s+ T8s+ 97s+ 87s 76s 65s A9o-AQo KTo+ QJo` |
| full-ring | SB | call-raise | 14.2 | 8–22 | `22-JJ A7s-AQs K9s+ Q9s+ J9s+ T9s 98s ATo-AQo KJo+` |
| full-ring | BB | call-raise | 27.6 | 18–45 | `22-TT A2s-AJs A7o-AJo K5s+ K9o+ Q7s+ QTo+ J7s+ JTo T7s+ T9o 96s+ 86s+ 75s+ 65s 54s` |
| full-ring | UTG | three-bet | 2.6 | 2–8 | `QQ+ AKs AKo` |
| full-ring | UTG+1 | three-bet | 2.6 | 2–8 | `QQ+ AKs AKo` |
| full-ring | MP | three-bet | 3.0 | 2–8 | `JJ+ AKs AKo` |
| full-ring | LJ | three-bet | 3.3 | 2–8 | `JJ+ AQs+ AKo` |
| full-ring | HJ | three-bet | 3.8 | 2–8 | `TT+ AQs+ AKo` |
| full-ring | CO | three-bet | 5.3 | 2–8 | `TT+ AJs+ KQs AQo+` |
| full-ring | BTN | three-bet | 5.7 | 2–8 | `99+ AJs+ KQs AQo+` |
| full-ring | SB | three-bet | 5.3 | 2–8 | `TT+ AJs+ KQs AQo+` |
| full-ring | BB | three-bet | 4.7 | 2–8 | `TT+ AQs+ AQo+` |
| full-ring | UTG | call-three-bet | 3.6 | 2.5–18 | `88-JJ AJs AQs AQo KQs` |
| full-ring | UTG+1 | call-three-bet | 3.9 | 2.5–18 | `88-JJ ATs-AQs AQo KQs` |
| full-ring | MP | call-three-bet | 4.8 | 2.5–18 | `77-TT ATs-AQs AJo AQo KQs` |
| full-ring | LJ | call-three-bet | 5.3 | 2.5–18 | `66-TT ATs-AJs AJo AQo KQs KJs` |
| full-ring | HJ | call-three-bet | 6.8 | 2.5–18 | `55-99 A9s-AJs ATo-AQo KJs KQs QJs` |
| full-ring | CO | call-three-bet | 8.1 | 2.5–18 | `44-99 A7s-ATs ATo AJo KTs-KQs QJs JTs KQo` |
| full-ring | BTN | call-three-bet | 12.5 | 2.5–18 | `22-88 A2s-ATs A9o-AJo K9s-KJs QTs QJs JTs T9s KJo KQo` |
| full-ring | SB | call-three-bet | 6.0 | 2.5–18 | `66-99 A9s-ATs ATo AJo KJs KQs QJs KQo` |
| full-ring | BB | call-three-bet | 9.4 | 2.5–18 | `44-99 A7s-AJs ATo AJo K9s-KQs QTs QJs JTs T9s KQo` |
| full-ring | UTG | four-bet | 1.2 | 1–4 | `KK+ AKs` |
| full-ring | UTG+1 | four-bet | 1.2 | 1–4 | `KK+ AKs` |
| full-ring | MP | four-bet | 1.7 | 1–4 | `QQ+ AKs` |
| full-ring | LJ | four-bet | 1.7 | 1–4 | `QQ+ AKs` |
| full-ring | HJ | four-bet | 2.6 | 1–4 | `QQ+ AKs AKo` |
| full-ring | CO | four-bet | 2.6 | 1–4 | `QQ+ AKs AKo` |
| full-ring | BTN | four-bet | 3.0 | 1–4 | `JJ+ AKs AKo` |
| full-ring | SB | four-bet | 2.6 | 1–4 | `QQ+ AKs AKo` |
| full-ring | BB | four-bet | 2.6 | 1–4 | `QQ+ AKs AKo` |

