# Spec: TASK-7.35 — Use the 6-max opponent ranges at 3, 4, 5 and 7 seats

Status: READY (approved 2026-11-26, autopilot — no ask items)
Task: TASK-7.35 · Parent/epic: TASK-7 · Requirements: REQ-005.4, REQ-035 (035.1, 035.2, 035.6), REQ-029.2 · Dream: limit-holdem-trainer

## 1. Summary
After TASK-7.26, opponents at tables with 3, 4, 5 or 7 dealt-in seats still start from every unseen combo, because
`rangesFor` returns `null` for those sizes (`src/advice/ranges.ts:240-246`). This story keys `rangesFor` by
`referenceSizeOf` (REQ-005.4: 2 → heads-up, 3–7 → 6-max, 8–10 → full ring) through `DEFAULT_RANGES`. Opponents at
those sizes then start from the 6-max default range for their position and preflop line and are narrowed as before.
User advice (hints, grades, review) and every bot style change at those sizes. The before/after effect on all-TAG
play is measured, and any stat outside its healthy range becomes a follow-up task (no tuning here).

## 2. Scope
- In scope:
  - `src/advice/ranges.ts`:
    - `rangesFor(dealtIn)` returns `DEFAULT_RANGES[referenceSizeOf(dealtIn)]`.
    - `OpponentRange.position`, `line` and `widthPct` become non-null, and the dead "no default ranges" branch in
      `estimateOpponentRanges` goes.
    - Doc comments are updated.
  - A fast acceptance test for AC#1 and AC#2. The unlocked 5-seat fallback block in
    `tests/advice/postflop-ranges.test.ts` is rewritten.
  - Measurement: all-TAG cash stats at 3, 4, 5 and 7 seats before and after, recorded in the build log and
    `docs/advice/range-model.md`. A 100,000-hand check per size goes in the opt-in slow group.
  - Docs: `docs/advice/range-model.md` and `docs/advice/postflop-rules.md` no longer say those sizes start from every
    unseen hand.
- Not doing:
  - New authored ranges for 3, 4, 5 or 7 seats. Changes to the heads-up, 6-max or full-ring range data,
    `hand-order.json`, the narrowing rule, observed scaling, postflop thresholds, preflop charts or
    `src/stats/healthy-ranges.json`.
  - Tuning bot rules or ranges if a measured stat falls outside its healthy range. Each miss becomes a follow-up
    task.
  - The "approximate" advice label (TASK-7.16) and any hint/review UI change. The basis text stays
    `typical player` / `based on N hands of this opponent`.
  - Changing `referenceSizeOf`, `positionOf` or `preflopLineOf`.
  - Separate measurement of sit-and-go play. SNG tables that shrink to 3–5 or 7 dealt-in seats change through the
    same code path. They are covered by the existing zero-violation SNG checks, not by new stats.
- Scope budget: files=7, lines=400   (ranges.ts ≈ 20, new fast acceptance test ≈ 190, new slow test ≈ 70,
  postflop-ranges.test.ts ≈ 30, package.json 1, docs ≈ 60)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Observed-stats scaling (REQ-035.2/035.6) now applies at 3, 4, 5 and 7 seats too. With ≥ 30 observed hands, the user's hint and review at those sizes show `based on N hands of this opponent`. Bots still never pass observed stats (REQ-029.2). | yes | TASK-7.26 A-1: one code path scales from whatever default range was found (`src/advice/ranges.ts:649-657`). REQ-035.2 is not size-specific. | Keep observed scaling off at those sizes |
| A-2 | Positions come from the existing `positionOf(view, '6-max')` (`src/advice/preflop.ts:72-88`, `SEATS_BEFORE_BUTTON['6-max'] = ['BTN','CO','HJ','UTG']`, `src/advice/preflop-chart.ts:42-46`). 3 seats: BTN, SB, BB. 4 seats: CO, BTN, SB, BB. 5 seats: HJ, CO, BTN, SB, BB. 7 seats: the two seats after the BB are both `UTG` and share the UTG ranges, as with 10 seats at full ring (TASK-7.26 A-2). | yes | Same mapping the 6-max preflop chart already uses at these sizes. No new position rules. | A separate "UTG2" range at 7 seats |
| A-3 | `rangesFor` keeps the `referenceSizeOf` error for counts outside 2–10 (`RangeError('No reference size for <n> dealt-in seats')`), and its return type becomes `DefaultRanges` (non-null). A dealt-in view always has 2–10 players (`TABLE_SIZES`, `src/table/session.ts:156`). | yes | Avoids a second size table. The null case can no longer happen, so the null branch and the nullable `OpponentRange` fields would be dead code. Only tests read those fields. | Keep `| null` and return null outside 2–10 |
| A-4 | The measurement compares each size with `HEALTHY_RANGES[referenceSizeOf(size)]`, which is the 6-max ranges. REQ-005.4 marks 3, 4, 5 and 7 as approximate (`src/stats/healthy-ranges.ts:41`). | yes | The user's own session report grades the same sizes against the same ranges (`styleSection`, `src/stats/healthy-ranges.ts:145-160`). | No comparison; separate small-table bands |

## 3. Current system
- Range model: `src/advice/ranges.ts`.
  - `HEADS_UP_RANGES`, `SIX_MAX_RANGES`, `FULL_RING_RANGES`, `DEFAULT_RANGES`: `:231-238`.
  - `rangesFor` (2 / 6 / 8–10, else null): `:240-246`. Its only caller is `estimateOpponentRanges` (`:636`). No test
    calls `rangesFor` (checked with grep).
  - `OpponentRange` with nullable `position` / `line` / `widthPct`: `:561-576`. Outside `ranges.ts`, only tests
    read them (checked with grep).
  - `estimateOpponentRanges`: `:626-673`. Null branch `if (ranges !== null)`: `:645`. Fully-blocked fallback: `:659`.
  - `ranges.ts` already imports `positionOf` from `./preflop` (`:13`), so importing `referenceSizeOf` from there
    adds no new module edge.
- Sizes and positions: `src/advice/preflop.ts:59-65` `referenceSizeOf` (2 → heads-up, 3–7 → 6-max, 8–10 →
  full-ring, else RangeError). `positionOf`: `:72-88`. REQ-005.4 (`dreams/limit-holdem-trainer/requirements.md:124`).
- Consumers of action ranges:
  - User advice: `ACTION_RANGE_ADVICE` (`src/advice/recommend.ts:22`), review (`src/table/review.ts:107`).
  - Golden suite: `src/advice/golden.ts:491`. Playtest advice check: `src/playtest/advice-check.ts:21`.
  - Every bot style: `BOT_ADVICE` (`src/bots/tag.ts:36`, also rock, calling-station and maniac).
- Tests: `npm test` = `vitest run --coverage`. `npm run test:slow` = `TLH_SLOW_TESTS=1 vitest run <file list>`
  (`package.json:17`). Slow checks use `it.runIf(SLOW)`. Model: `tests/advice/size-ranges-playtest.acceptance.test.ts`
  (`tagStats(size)` pattern).
- Healthy ranges for 6-max (`src/stats/healthy-ranges.json`): VPIP 20–28, PFR 14–22, Aggression 50–66, WTSD 30–42,
  W$SD 47–57.
- Spec-time probe: I applied the one-line `rangesFor` change in a throwaway worktree and ran
  `npx vitest run tests/advice tests/playtest tests/bots tests/golden tests/table tests/stats`. 172 files passed and
  1 failed: the unlocked `tests/advice/postflop-ranges.test.ts:169-192` block, which pins the 5-seat null fallback.
  All-TAG cash, seed 42, 5,000 hands, stats summed over every seat (indicative only, the builder re-measures):

  | Seats | before VPIP/PFR/Aggr/WTSD/W$SD | after VPIP/PFR/Aggr/WTSD/W$SD | outside 6-max healthy (after) |
  |---|---|---|---|
  | 3 | 31.2 / 22.0 / 64.3 / 40.2 / 53.2 | 31.2 / 22.0 / 65.7 / 41.6 / 53.0 | VPIP 31.2 (> 28, preflop, unchanged by this story) |
  | 4 | 28.0 / 20.2 / 63.1 / 44.7 / 51.5 | 28.0 / 20.2 / 64.6 / 42.7 / 51.8 | WTSD 42.7 (> 42; was 44.7) |
  | 5 | 24.7 / 18.1 / 61.9 / 45.8 / 51.4 | 24.7 / 18.1 / 64.8 / 41.4 / 52.1 | none (WTSD was 45.8, outside) |
  | 7 | 20.4 / 14.9 / 60.9 / 45.2 / 50.7 | 20.3 / 14.9 / 63.9 / 39.6 / 51.6 | none (WTSD was 45.2, outside) |

  Run time per 5,000 hands fell (for example 7 seats 9.2 s → 5.9 s), because narrower starting ranges cut the
  equity work.
- Locked tests and golden files:
  - Golden data: `tests/golden/postflop-spots.json` (owner TASK-7.14) has spots only at 6 / 2 / 9 seats
    (86 / 18 / 16). `tests/golden/graded-examples.json` (TASK-7.14) has examples only at 6 / 9.
    `tests/golden/preflop-spots.json` (TASK-7.11) is preflop. **No golden value changes, and no locked file needs an
    edit.**
  - `tests/advice/size-ranges.acceptance.test.ts` (TASK-7.26) never calls `rangesFor` and never pins 3, 4, 5 or 7
    seats. It stays green unchanged.
  - `tests/advice/range-model.acceptance.test.ts` (TASK-7.5) AC#9 reads `docs/advice/postflop-rules.md`
    (`## Not applied yet` heading must stay; the section must not contain `TASK-7.5`) and `docs/advice/range-model.md`
    (`Ks 8d 7c` and every line name). It stays green unchanged.
  - Playtest and bot acceptance files at sizes 3–7 are structural only: zero violations, determinism, TAG vs
    `seededTagPolicy` equality. These are `tests/playtest/all-sizes.acceptance.test.ts` (TASK-7.6),
    `tests/playtest/summary.acceptance.test.ts` (TASK-1.26, a data-derived largest-pot check at size 4),
    `tests/playtest/invariants.acceptance.test.ts` (TASK-1.8), `tests/playtest/runner.acceptance.test.ts` (TASK-1.6),
    `tests/playtest/million-lineups.acceptance.test.ts` (TASK-6.9) and `tests/bots/lineup.acceptance.test.ts`
    (TASK-6.6). The probe passed all of the fast ones.
- Unlocked test that pins the old behaviour: `tests/advice/postflop-ranges.test.ts:169-192` (5 seats → `position null`,
  `start = unseenCombos`).
- Docs that state the old behaviour:
  - `docs/advice/range-model.md`: the size table at `:27-31`, `:35-36`, `:238-240` and "Other table sizes" at
    `:333-335`.
  - `docs/advice/postflop-rules.md:171-172`, the only bullet under "Later work adds:".
- Existing code to reuse:
  - `src/advice/preflop.ts` `referenceSizeOf` → size choice (no new size table).
  - `src/advice/ranges.ts` `DEFAULT_RANGES`, `defaultRange`, `expandRange`, `narrowRange`, `rangeWidthPct`,
    `scaledWidthPct` / `strongestClasses` (via `estimateOpponentRanges`) → expected values in tests.
  - `tests/advice/size-ranges.acceptance.test.ts` `toActView` / `expectOpponent` / equity-spy pattern → copy them
    into the new acceptance file (test helpers are file-local in this repo).
  - `tests/advice/size-ranges-playtest.acceptance.test.ts` `tagStats` → the slow measurement file.
  - `src/stats/healthy-ranges.ts` `HEALTHY_RANGES` → bounds (never hard-coded).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | `rangesFor(dealtIn: number): DefaultRanges` is `DEFAULT_RANGES[referenceSizeOf(dealtIn)]`. `DEFAULT_RANGES` stays exported and is used by `rangesFor` (AC#2, first option). | Stop exporting `DEFAULT_RANGES` and keep the if-chain | The task asks for referenceSizeOf keying (AC#1). One mapping (REQ-005.4) instead of two. | no | n/a |
| D-2 | `OpponentRange.position: Position`, `line: PreflopLine`, `widthPct: number` (non-null). The `ranges !== null` branch is removed. `start` falls back to every unseen combo only when the dead cards block the whole default range (unchanged rule). | Keep nullable fields | No size lacks ranges any more (A-3). Only tests read the fields, and `toMatchObject` assertions still hold. | no | n/a |
| D-3 | Measurement as in TASK-7.26 (its Q-3 / D-4): 5,000 and 10,000 hands before and after at 3, 4, 5 and 7 seats in the build log, plus a slow 100,000-hand file that logs the five stats per size and asserts zero violations and non-null stats only. Misses become follow-up tasks. | Assert stats inside the healthy ranges | User's precedent (TASK-7.26 Q-3) and standing rule: no tuning in this story, and 100k runs are opt-in slow. | no | n/a (TASK-7.26 Q-3 precedent) |

## 5. Design

### Files to create / modify
- `src/advice/ranges.ts` — `rangesFor` via `DEFAULT_RANGES[referenceSizeOf(...)]`; import `referenceSizeOf`;
  non-null `OpponentRange` fields; drop the null branch; update the doc comments (`:239`, `:563-567`, `:621-623`).
- `tests/advice/small-table-ranges.acceptance.test.ts` — new, fast: SPEC-01, SPEC-03, SPEC-04, SPEC-07.
- `tests/advice/small-table-ranges-playtest.acceptance.test.ts` — new, opt-in slow: SPEC-06.
- `tests/advice/postflop-ranges.test.ts` — rewrite the 5-seat block (`:169-192`) to assert the 6-max start
  (SPEC-05).
- `package.json` — append `tests/advice/small-table-ranges-playtest.acceptance.test.ts` to `test:slow`.
- `docs/advice/range-model.md` — size table, "Other table sizes", observed-scaling sentence, and a new
  "Effect at 3, 4, 5 and 7 seats (TASK-7.35)" section (SPEC-07, SPEC-08).
- `docs/advice/postflop-rules.md` — remove the 3/4/5/7 bullet and the now-empty "Later work adds:" lead-in.
  Keep the `## Not applied yet` heading and its other text (SPEC-07).

### Components, interfaces and data
- `export function rangesFor(dealtIn: number): DefaultRanges`
  - Returns `DEFAULT_RANGES[referenceSizeOf(dealtIn)]`: the same object as `HEADS_UP_RANGES` (2),
    `SIX_MAX_RANGES` (3–7) or `FULL_RING_RANGES` (8–10).
  - Throws `RangeError('No reference size for <n> dealt-in seats')` otherwise (from `referenceSizeOf`).
- `estimateOpponentRanges(view, observed)`:
  - `const ranges = rangesFor(view.players.length)`.
  - For every live opponent: `position = positionOf({ ...view, seat }, ranges.referenceSize)`,
    `line = preflopLineOf(view, seat)`, `classes = defaultRange(ranges, position, line).classes`.
  - Observed scaling, `expandRange`, the fully-blocked fallback and narrowing are unchanged.
- `OpponentRange`: `position: Position`, `line: PreflopLine`, `widthPct: number`. The other fields are unchanged.

### Rules and algorithms
- Worked example (4 seats, button 1, SB 2, BB 3, CO 4):
  - Preflop: CO limps, BTN raises, SB folds, BB calls, CO calls.
  - Flop: BB checks, CO checks, BTN bets. The hero is the BB.
  - Seat 4 is `CO call-raise` (limp, then call one raise; `preflopLineOf` `:383`). Its start is
    `expandRange(defaultRange(SIX_MAX_RANGES,'CO','call-raise').classes, dead)` and it is narrowed by `check`.
  - Seat 1 is `BTN open-raise` (the first raise after a limp is an open-raise). It is narrowed by `bet`.
- Worked example (7 seats): seats 4 and 5 are both `UTG` (A-2). If both limp, both start from 6-max `UTG limp`.

### Error handling and configuration
- `rangesFor(1)` / `rangesFor(11)` throw `RangeError: No reference size for 1 dealt-in seats` (A-3). No
  configuration, no new dependency, no data format change.

## 6. Behaviour specification

### SPEC-01: rangesFor maps every seat count 2–10 to its reference-size ranges through DEFAULT_RANGES
- Verifies: AC#2
- Behaviour: Given `rangesFor`, When it is called with each of 2, 3, 4, 5, 6, 7, 8, 9 and 10, Then the result is
  (`toBe`, same object):
  - 2 → `HEADS_UP_RANGES`
  - 3, 4, 5, 6, 7 → `SIX_MAX_RANGES`
  - 8, 9, 10 → `FULL_RING_RANGES`
  Each count is its own assertion with the count in the message. For each count the result also equals
  `DEFAULT_RANGES[referenceSizeOf(n)]` and its `referenceSize` is `'heads-up'` / `'6-max'` / `'full-ring'`.
  And When it is called with 1 or 11, Then it throws `RangeError` with message
  `No reference size for 1 dealt-in seats` / `No reference size for 11 dealt-in seats`.
- Verification: acceptance `tests/advice/small-table-ranges.acceptance.test.ts::AC#2 rangesFor returns the heads-up ranges for 2, the 6-max ranges for 3 to 7 and the full-ring ranges for 8 to 10`

### SPEC-02: DEFAULT_RANGES is used by rangesFor
- Verifies: AC#2
- Behaviour: Given `src/advice/ranges.ts`, Then the body of `rangesFor` reads `DEFAULT_RANGES[referenceSizeOf(`, and
  `DEFAULT_RANGES` is still exported.
- Verification: command `grep -n "return DEFAULT_RANGES\[referenceSizeOf(dealtIn)\]" src/advice/ranges.ts && grep -n "^export const DEFAULT_RANGES" src/advice/ranges.ts`

### SPEC-03: Opponents at 3, 4, 5 and 7 seats start from the 6-max range for their position and line and are narrowed
- Verifies: AC#1
- Behaviour: Given views built with button 1, seats 1..n, stacks 160, 2/4 blinds and an ordered deck (the
  `toActView` helper of `size-ranges.acceptance.test.ts`), When `estimateOpponentRanges(view)` runs, Then each named
  opponent has the listed `position` and `line`, `widthPct = rangeWidthPct(classes)`, and
  `start = expandRange(classes, hero + board)` (fewer than 1,081 combos). Here
  `classes = defaultRange(SIX_MAX_RANGES, position, line).classes`. Also
  `combos = narrowRange(start, flop, action)` (non-empty). The views:
  - **3 seats:** BTN 1 raises, SB 2 folds, BB 3 calls. Flop: BB checks, BTN bets. Hero = 3.
    - Seat 1: `BTN open-raise`, narrowed by `bet`.
  - **4 seats:** CO 4 limps, BTN 1 raises, SB 2 folds, BB 3 calls, CO 4 calls. Flop: BB checks, CO checks, BTN
    bets. Hero = 3.
    - Seat 4: `CO call-raise`, narrowed by `check`.
    - Seat 1: `BTN open-raise`, narrowed by `bet`.
  - **5 seats:** HJ 4 raises, CO 5 folds, BTN 1 re-raises, SB 2 folds, BB 3 folds, HJ 4 calls. Flop: HJ checks,
    BTN bets. Hero = 4.
    - Seat 1: `BTN three-bet`, narrowed by `bet`.
  - **7 seats:** seats 4 and 5 (both `UTG`, A-2) limp, seats 6, 7, 1 and 2 fold, BB 3 checks. Flop: BB checks,
    seat 4 checks, seat 5 bets. Hero = 3.
    - Seat 4: `UTG limp`, narrowed by `check`.
    - Seat 5: `UTG limp`, narrowed by `bet`.
  And at 3 seats, When `recommendPostflop(view, { ...ACTION_RANGE_ADVICE, equity: spy })` runs, Then the spy's
  `opponents[0]` equals seat 1's `combos` (advice uses these ranges, not every unseen combo).
- Verification: acceptance `tests/advice/small-table-ranges.acceptance.test.ts::AC#1 opponents at 3, 4, 5 and 7 seats start from the 6-max range for their position and line and are narrowed`

### SPEC-04: Observed scaling applies at these sizes for the user, never for bots
- Verifies: AC#1
- Behaviour: Given the 4-seat view of SPEC-03, When `estimateOpponentRanges(view, [{ seat: 1, hands: 100, vpip: 70,
  pfr: 60 }])` runs, Then seat 1 (`BTN open-raise`) has `widthPct` 60 (to 9 decimal places; REQ-035.6 with n = 100 gives
  `o` = 60), `basis.observedHands` 100 and `basis.text` `based on 100 hands of this opponent`. Seat 4 keeps
  `basis.observedHands` null and the 6-max `CO call-raise` start (A-1).
- Verification: acceptance `tests/advice/small-table-ranges.acceptance.test.ts::AC#1 observed stats scale a 6-max default range at a 4-seat table`

### SPEC-05: The old 5-seat fallback test now asserts the 6-max start
- Verifies: AC#1
- Behaviour: Given the existing 5-seat view in `postflop-ranges.test.ts` (seat 4 limps, seat 5 and 1 fold, SB 2
  completes, BB 3 checks; flop SB checks, BB bets; hero = 4), When ranges are estimated, Then seat 2 is
  `{ position: 'SB', line: 'limp' }` and seat 3 is `{ position: 'BB', line: 'check' }`. Each `start` is the expanded
  6-max range (not `unseenCombos`), and seat 3's `combos = narrowRange(start, board, 'bet')`.
  `recommendPostflop(view, ACTION_RANGE_ADVICE).opponents` is still 2. The test title and comment no longer say
  "tables without default ranges".
- Verification: unit `tests/advice/postflop-ranges.test.ts::actions mode falls back on scripted lines and uses size ranges at every table size`

### SPEC-06: All-TAG play at 3, 4, 5 and 7 seats is measured (slow, opt-in)
- Verifies: AC#1
- Behaviour: Given `TLH_SLOW_TESTS=1`, When `runPlaytest({ hands: 100000, seed: 42, size, game: 'cash' })` runs for
  each size 3, 4, 5 and 7 (one `it.runIf(SLOW)` per size, 600 s timeout each), Then each has
  `handsPlayed = 100000` and `violations = 0`. VPIP, PFR, Aggression, WTSD and W$SD, summed over every seat as in
  `tagStats`, are all non-null. Each is printed as `TAG <n> seats <stat>: <x.x> (healthy <low>–<high>)` with bounds
  from `HEALTHY_RANGES[referenceSizeOf(n)]` (A-4). Stats are not asserted inside the healthy ranges (D-3). The file
  is not run by `npm test`; it is listed in `npm run test:slow`.
- Verification: acceptance `tests/advice/small-table-ranges-playtest.acceptance.test.ts::all-TAG stats at 3, 4, 5 and 7 seats with 6-max ranges (100,000 hands, seed 42)`

### SPEC-07: Docs describe the new rule and record the measured effect
- Verifies: AC#1
- Behaviour: After the change:
  - `docs/advice/range-model.md`:
    - Its size table has a row for 3 to 7 seats using `six-max.json`.
    - It states the 3 / 4 / 5 / 7 position names (A-2), including the two UTG seats at 7.
    - It no longer contains `have no default range` or `no default ranges yet`, and it no longer says those sizes
      start from every unseen hand. The fully-blocked safety rule stays.
    - It contains a section headed `### Effect at 3, 4, 5 and 7 seats (TASK-7.35)` holding the before/after table
      (SPEC-08) and naming every stat outside its healthy range with its value.
    - It still contains `Ks 8d 7c` and every line name.
  - The `## Not applied yet` section of `docs/advice/postflop-rules.md` no longer contains `TASK-7.35` or
    `3, 4, 5 or 7 seats`.
  - Locked `range-model.acceptance.test.ts` passes unchanged.
- Verification: acceptance `tests/advice/small-table-ranges.acceptance.test.ts::AC#1 the range docs say 3, 4, 5 and 7 seats use the 6-max ranges and record the effect`

### SPEC-08: Before/after numbers are recorded and reviewed
- Verifies: AC#1
- Behaviour: The builder records the five stats at 5,000 and 10,000 all-TAG cash hands (seed 42; sizes 3, 4, 5, 7)
  on the base commit `d43ec6d` (before any code change) and after it, plus the SPEC-06 100,000-hand figures. They
  go in `doit/TASK-7.35/build-log.md` and the SPEC-07 docs section, with the 6-max healthy range per stat. Every
  stat outside its range is listed as a proposed follow-up (stat, size, value, range); per the spec-time probe,
  expect at least 3-seat VPIP and possibly 4-seat WTSD. Each listed miss becomes a follow-up task. The build log also
  records `npm run -s playtest:million -- --lineups` wall time before and after (TASK-7.26 after: 588.6 s), flagged
  if it grows by more than 2×.
- Verification: manual `doit/TASK-7.35/build-log.md and docs/advice/range-model.md hold the before/after table for 3, 4, 5 and 7 seats and list every healthy-range miss`

### SPEC-09: Heads-up, 6-max and full-ring play is unchanged
- Verifies: AC#1, AC#2
- Behaviour: Given the default all-TAG cash playtest at sizes 2, 6 and 9, When
  `npm run -s playtest -- --hands 2000 --seed 42 --size <n>` runs before and after, Then the output is
  byte-identical (`cmp`). Locked `tests/advice/size-ranges.acceptance.test.ts` and `tests/golden` pass without
  edits.
- Verification: command `npx vitest run tests/golden tests/advice/size-ranges.acceptance.test.ts tests/advice/range-model.acceptance.test.ts`

### SPEC-10: Every other check stays green
- Verifies: AC#1, AC#2
- Behaviour: `npm run format`, `npm run lint`, `npm run typecheck`, `npm test` and `npm run e2e` pass. In
  `npm run test:slow` every file passes except any already-known failure recorded by an earlier task. No locked
  file is edited.
- Verification: command `npm run lint && npm run typecheck && npm test`

## 7. Edge cases
- Fully blocked tiny range (for example a 6-max four-bet range against the hero's cards and board): the existing
  fallback to every unseen combo applies (`ranges.ts:659`). Covered by the existing test at
  `postflop-ranges.test.ts:195`.
- Two `UTG` seats at 7 players: SPEC-03. First-to-act is CO at 4 seats and HJ at 5 seats: SPEC-03.
- 3 seats, where the button acts first preflop: SPEC-03.
- Blind all-in on posting at 3–7 seats: `preflopLineOf` fallback gives `limp` (SB) or `check` (BB). Both pairs exist
  in 6-max (`APPLICABLE_LINES['6-max']`, 36 pairs).
- Sit-and-go and cash tables that shrink below their starting size: ranges follow the dealt-in count of each hand
  (`view.players.length`). A 6-seat SNG down to 4 players uses 6-max ranges with 4-seat positions. Covered by the
  existing SNG zero-violation checks (`tests/playtest/games.acceptance.test.ts`, slow).
- Multiway clashes: the existing fallback chain `combos → start → unseen` (`postflop.ts:156-163`) is unchanged.
- Seat counts outside 2–10: `rangesFor` throws (SPEC-01). Unreachable from a dealt hand (A-3).
- Concurrency, permissions, interruption: N/A (pure functions over static bundled data).

## 8. Security considerations
- Trust boundary unchanged: the range JSON is bundled data validated at import. The observed-stats snapshot keeps
  its existing validation (`observedBySeat`). No user input reaches the new code except the dealt-in count from the
  engine.
- No authn/authz, secrets, injection surface, sensitive logging or new dependency.
- Randomness: none added. Playtests are seeded, and advice stays deterministic (REQ-036; locked
  `tests/advice/determinism.acceptance.test.ts`).

## 9. Non-functional
- Determinism: the same view gives the same ranges and advice.
- Speed: narrower start ranges reduce equity work at 3–7 seats (the probe showed 5,000-hand runs 30–40 % faster). The
  new fast acceptance file targets < 2 s with no playtests. The fast suite must not grow by more than about 2 s.
- Slow SPEC-06 file: about 1.5–2.5 min per size (measured rate ≈ 1,000 hands/s after the change), 600 s timeout per
  size. Never in `npm test` or a CI push (standing rule: speed/scale checks are opt-in).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run -s playtest -- --hands 2000 --seed 42 --size 4` (and `--size 3`, `5`, `7`; 0 violations);
  slow measurement `TLH_SLOW_TESTS=1 npx vitest run tests/advice/small-table-ranges-playtest.acceptance.test.ts`
- New tests:
  - `tests/advice/small-table-ranges.acceptance.test.ts` → SPEC-01, 03, 04, 07
  - `tests/advice/postflop-ranges.test.ts` → SPEC-05
  - `tests/advice/small-table-ranges-playtest.acceptance.test.ts` → SPEC-06
- End-to-end scenario for the Judge:
  1. `npm run dev`, start a 4-player cash game, play to a flop where a bot opened, and ask for a hint. The basis
     reads "typical player", and the equity differs from the base commit's figure for the same replay code (which
     used every unseen hand).
  2. Repeat at 7 players.
  3. Run the run commands above, the slow measurement and the SPEC-09 `cmp` checks, and compare with the build-log
     table.

## 11. Open questions
None.

## 12. Clarifications log
See `doit/TASK-7.35/qa.md`.
