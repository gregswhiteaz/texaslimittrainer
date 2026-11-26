# Spec: TASK-7.28 — Count straight-draw outs only when a hole card is part of the draw

Status: READY (approved 2026-11-25)
Task: TASK-7.28 · Parent/epic: TASK-7 · Requirements: n/a (follow-up from TASK-7.9 review) · Dream: limit-holdem-trainer

## 1. Summary
`drawOuts` credits the hero with 8 open-ended straight outs when the four-card run sits entirely on the board and a
hole card only pairs one of its ranks (7c 2d on 5h 6s 7h 8d). Every player shares that draw, so the hero gets no
edge from it. The flush half already ignores board-only draws. `drawOuts` also lists straight outs when the hero
has already made a flush (9h 8h on 7h 6h 2h). This story makes a straight draw count only when a hole card adds a
rank the board does not have, and drops straight outs when a flush is already made. Implied-odds advice (TASK-7.9)
and bot play change slightly. The new default playtest SHA is recorded, and the style bands are re-checked.

## 2. Scope
- In scope:
  - `src/advice/ranges.ts`: `openEnderStart` counts a run only when a hole card adds a rank that is not on the
    board. `drawOuts` skips straight outs when the hero's cards and the board already hold five or more of one
    suit.
  - The shared definition also applies to `hasOpenEnder` / `classifyCombo`. This leaves every class unchanged
    (proof in §5 Rules, D-1).
  - Tests: a new acceptance file for AC#1, AC#3 and AC#4, and unit edge cases in `tests/advice/ranges.test.ts`.
  - Docs: the "Draw and outs" bullet in `docs/advice/postflop-rules.md:35-41`.
  - Measurements in `doit/TASK-7.28/build-log.md`: the new default playtest SHA, and the three-seed style-bands
    result (12 lines).
- Not doing:
  - Gutshots, backdoor draws, and discounting outs that also help an opponent (`docs/advice/postflop-rules.md:40-41`
    keeps "Outs are not reduced…").
  - Straight-flush draws on top of a made flush or straight. They get no extra outs.
  - Dropping flush outs when a straight is made. The existing behaviour stays (`tests/advice/ranges.test.ts:625`).
  - Changing the flush-draw rule, the implied-odds formula, the postflop thresholds, the bots, the style bands or
    `healthy-ranges.json`.
  - Golden-spot or graded-example edits. None changes (measured, see §3).
- Scope budget: files=4, lines=140   (ranges.ts ≈ 12, new acceptance test ≈ 60, ranges.test.ts ≈ 30, docs ≈ 8;
  the build log is a pipeline file and is not counted)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | "A hole card is part of the draw" means a hole card's rank is in the four-card run **and that rank is not on the board**. A hole card that only pairs a board rank inside the run does not count. | yes | This is the AC#1 case. It matches the flush half, where a board-only four-flush gives no outs (`src/advice/ranges.ts:488`). | Any hole rank in the run (the current rule) |
| A-2 | "Made flush" means five or more cards of one suit among hole + board. It covers AC#3. A made full house or quads cannot also hold an open-ended run in 5–6 cards (it needs ≤ 3 distinct ranks), so flush or straight are the only made hands to exclude. | yes | Smallest rule that satisfies AC#3. `hasStraight` already covers made straights (`src/advice/ranges.ts:463-471`). | Use `evaluate` and compare the category with the straight |
| A-3 | The new playtest SHA and the 12 style-band lines go in `doit/TASK-7.28/build-log.md`. That is the recording place TASK-7.9 used (`doit/TASK-7.9/build-log.md:8`). No test or doc pins the SHA (checked by grep). | yes | Same convention as before. | A docs table of playtest SHAs |

## 3. Current system
- `src/advice/ranges.ts`:
  - `hasFlushDraw`: `:433-436`.
  - `rankMask`: `:439-443`.
  - `openEnderStart`: `:449-458`. It requires `(fromHole & run) !== 0`, so a board-paired hole rank counts.
  - `hasOpenEnder`: `:460-462`.
  - `hasStraight`: `:465-473`.
  - `drawOuts`: `:480-498`. The flush half requires exactly 4 of a suit plus a hole card of that suit. The straight
    half is skipped only by `hasStraight`.
  - `classifyCombo`: `:501-515`. Order: strong, then pair (any hole rank on the board, or a pocket pair), then draw
    via `hasFlushDraw || hasOpenEnder`.
- Consumer: `src/advice/postflop.ts:167`. `outs` feeds `impliedRequiredEquityPct` (`:174-177`) and the advice
  result's `outs` field. User hints and bots both use it, so the bot playtest output moves.
- Tests:
  - `npm test` = `vitest run --coverage` (`package.json:12`). The slow opt-in group is `npm run test:slow` (`TLH_SLOW_TESTS=1`,
    `package.json:17`), which includes `tests/bots/style-bands.acceptance.test.ts`. That file has three seeds
    (42, 7, 1234), 100,000 Mixed 6-max hands each (`:99-109`), and is owned and locked by TASK-6.16/6.17/6.25.
    It must pass **without edits**.
  - Existing `drawOuts` unit tests: `tests/advice/ranges.test.ts:591-645`. Classifier tests: `:253-275`.
- Measured with a prototype of the §5 rule (patched copy of HEAD in a scratch folder; the repo itself was not
  touched):
  - The full fast suite passes. 1,427 tests pass. The one failure was a git-only toolchain test, which fails because
    the copy has no `.git`. So no locked fast test moves:
    - `tests/advice/implied-odds.acceptance.test.ts` (TASK-7.9).
    - `tests/advice/postflop.acceptance.test.ts` (TASK-7.3, TASK-7.9).
    - `tests/golden/suite.acceptance.test.ts`, `tests/golden/postflop-spots.json` and
      `tests/golden/graded-examples.json` (TASK-7.14).
    - `tests/advice/value-bet.acceptance.test.ts` (TASK-7.8), `tests/advice/explanations.acceptance.test.ts`
      (TASK-7.10) and `tests/advice/value-copy.acceptance.test.ts` (TASK-8.1).
  - Every golden postflop spot and graded example gets the same `drawOuts` result under the old and new rules, on
    the flop and on the turn.
  - `npm run -s playtest -- --hands 10000 --seed 42` stdout SHA-256:
    - before: `643c8111335aac296b112af2dab5c2add8a7304f0f91b1cffdce3ca4fd0848c1`
    - after: `f6c8d1724d90bb27a8b4cae912586341fad7f614a926a31bd040e14fde947cbc`
    - `Invariant violations: 0`. TAG VPIP 22.4 / PFR 16.3 / aggression 64.5 are unchanged at one decimal. Folds
      went from 8093 to 8095.
  - Prototype `TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts`: 3/3 seeds pass, 823 s.
    Seed 42: TAG 20.4/14.6/59.5, Rock 8.7/7.2/50, Calling station 60.5/7.2/18.7, Maniac 56.1/53.2/82.3.
  - Expected locked-value changes: **none**. If the builder still finds a moved pinned value, replace it one-for-one
    and keep the check count. The likely owners are listed above.
- Existing code to reuse:
  - `src/advice/ranges.ts` `rankMask`, `hasStraight`, `openEnderStart` → change them in place. Add no new helper
    module.
  - `tests/advice/ranges.test.ts` `outs` / `ofRank` / `sorted` helpers (`:592-594`) → the pattern for the new tests.
  - `src/engine/cards.ts` `parseCards` (`:66`) → card notation in tests.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Change the shared `openEnderStart`, so `hasOpenEnder` (range classification) follows the same definition. Every `classifyCombo` result stays the same. | Change only `drawOuts` and keep a second, looser open-ender for ranges | One definition, as the task asks. It cannot change classification: a run that holds a hole rank but is board-only means that hole rank is on the board, so `classifyCombo` already returns `pair` before the draw test (`src/advice/ranges.ts:505-512`). The new rule only rejects such runs. | no | n/a |
| D-2 | AC#4 uses hole 8c 2d on board 5h 6s 7h (outs: four 4s and four 9s). The original 9c 2d example was only a gutshot. | Keep 9c 2d with board 6s 7h 8d | The original example could not pass; the replacement is the smallest change that keeps the board | yes | Q-1 |

## 5. Design

### Files to create / modify
- `src/advice/ranges.ts` — `openEnderStart` hole-adds-a-rank rule; `drawOuts` made-flush skip; doc comments.
- `tests/advice/straight-outs.acceptance.test.ts` — new: AC#1, AC#3, AC#4 (fast, normal suite).
- `tests/advice/ranges.test.ts` — unit edge cases (SPEC-04, SPEC-05).
- `docs/advice/postflop-rules.md` — "Draw and outs" wording (`:35-41`).

### Components, interfaces and data
- No signature changes. `drawOuts(hole: readonly Card[], board: readonly Card[]): Card[]` stays pure, returns
  ascending distinct unseen cards, and returns `[]` on a 5-card board.
- `openEnderStart(hole, board)`: the lowest v with ranks v..v+3 all present in hole ∪ board **and** at least one of
  them in `rankMask(hole) & ~rankMask(board)`. Otherwise -1. The ace-low rule is unchanged.

### Rules and algorithms
- Straight outs are added only when all three hold:
  - `openEnderStart >= 0` under the new rule;
  - `!hasStraight(hole ∪ board)`;
  - no suit has ≥ 5 cards in hole ∪ board.
- The flush outs rule is unchanged.
- Worked examples (prototype results):
  - 7c 2d / 5h 6s 7h 8d: the run 5678 is on the board, the 7 pairs it, and the 2 is outside. Result `[]` (was 8).
  - 9c 8d / 7h 6s 2c: the run 6789 has 8 and 9 from the hole. Result: the four 5s and four Ts (unchanged).
  - 8c 2d / 5h 6s 7h: the run 5678 has the 8 from the hole. Result: the four 4s and four 9s (8 outs).
  - 9c 2d / 5h 6s 7h: the ranks are 2 5 6 7 9. That is no four-in-a-row (gutshot to the 8). Result `[]` before
    and after. This is why Q-1 replaced the original AC example with 8c 2d.
  - 9h 8h / 7h 6h 2h: five hearts make a flush. Result `[]` (was 8 straight outs).
  - 4c 7d / 5h 6s 7h Kd: the run 4567 has the 4 from the hole. Result: the 3s and 8s (8 outs, unchanged).
- Why a board-only run plus a second, hole-made run cannot hide a draw: with a four-card board run, any other
  open-ended run that uses a new hole rank next to it makes five in a row (a straight). A run apart from it would
  need four ranks from two hole cards. So taking the lowest qualifying v is still correct.

### Error handling and configuration
- None. No new errors or configuration.

## 6. Behaviour specification

### SPEC-01: A board-only straight draw gives no outs
- Verifies: AC#1
- Behaviour: Given hole 7c 2d and board 5h 6s 7h 8d, When `drawOuts` runs, Then it returns `[]`. Also, given hole
  8c 2d and board 5h 6s 7h 8d (the 8 only pairs the board), Then it returns `[]`.
- Verification: acceptance `tests/advice/straight-outs.acceptance.test.ts::AC#1 a board-only open-ended run gives no straight-draw outs`

### SPEC-02: A hole card that extends the board run gives 8 outs
- Verifies: AC#4
- Behaviour: Given hole 8c 2d and board 5h 6s 7h (Q-1), When `drawOuts` runs, Then it returns exactly the 8 unseen
  cards of the two completing ranks: 4c 4d 4h 4s 9c 9d 9h 9s, in ascending order.
- Verification: acceptance `tests/advice/straight-outs.acceptance.test.ts::AC#4 a hole card that extends the run gives the 8 straight-draw outs`

### SPEC-03: A made flush lists no straight-draw outs
- Verifies: AC#3
- Behaviour: Given hole 9h 8h and board 7h 6h 2h, When `drawOuts` runs, Then it returns `[]`. That means no 5s or Ts,
  and no flush outs, since the flush is made.
- Verification: acceptance `tests/advice/straight-outs.acceptance.test.ts::AC#3 a made flush lists no straight-draw outs`

### SPEC-04: Edge cases of the new rule
- Verifies: AC#1, AC#3, AC#4
- Behaviour: Given 4c 7d / 5h 6s 7h Kd, When `drawOuts` runs, Then the result is the 3s and 8s (8 cards), even
  though the 7 pairs the board. Given 9h 8c / 7h 6h 2h Kh (a turn flush from one hole card), Then `[]`. Given
  9c 8d / 7h 6s 2c, Then the result is still the 5s and Ts. Every existing `drawOuts` case in
  `tests/advice/ranges.test.ts:591-645` keeps its expected value.
- Verification: unit `tests/advice/ranges.test.ts::drawOuts counts straight outs only when a hole card adds a rank to the run`

### SPEC-05: Range classification is unchanged
- Verifies: AC#1
- Behaviour: Given hole 7c 2d and board 5h 6s 7h 8d, When `classifyCombo` runs, Then it returns `'pair'` (as
  before). Given hole 9h 8h and board 7h 6h 2h, Then it returns `'strong'`. The existing classifier expectations
  (`tests/advice/ranges.test.ts:253-275`) pass unedited.
- Verification: unit `tests/advice/ranges.test.ts::classifyCombo is unchanged by the hole-card straight-draw rule`

### SPEC-06: Playtest and style bands
- Verifies: AC#2
- Behaviour: When `npm run -s playtest -- --hands 10000 --seed 42` runs, Then it prints `Invariant violations: 0`
  and its stdout SHA-256 is recorded in `doit/TASK-7.28/build-log.md` with the before value (prototype after
  value `f6c8d172…947cbc`, before `643c8111…0848c1`). When `TLH_SLOW_TESTS=1 npx vitest run
  tests/bots/style-bands.acceptance.test.ts` runs (opt-in slow group, never in `npm test`/CI push), Then all three
  seeds pass with all four styles inside their bands, and the 12 logged lines are recorded in the build log.
- Verification: command `bash -c 'npm run -s playtest -- --hands 10000 --seed 42 | tee /dev/stderr | shasum -a 256 && TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts'`

### SPEC-07: Docs state the rule
- Verifies: AC#1, AC#3
- Behaviour: Given `docs/advice/postflop-rules.md` "Draw and outs", Then the open-ended bullet says at least one of
  the four ranks comes from the hero's hand and is not already on the board. It also says a hero who already has a
  flush or a straight gets no straight-draw outs.
- Verification: manual read `docs/advice/postflop-rules.md` "Draw and outs" section

## 7. Edge cases
- Board-only run with a paired hole card: SPEC-01.
- Hole card extends the run on the flop and turn: SPEC-02, SPEC-04.
- Made flush on the flop (two suited hole cards) and on the turn (one): SPEC-03, SPEC-04.
- Made straight: the existing tests at `tests/advice/ranges.test.ts:604-606,622-626`.
- Ace-low and ace-high one-ended runs: unchanged, covered by existing tests at `:629-633`.
- River (5-card board): `[]`, unchanged (existing test).
- Invalid input, concurrency, permissions: N/A. The function is pure and only receives engine-dealt cards.

## 8. Security considerations
- N/A. No new input, trust boundary, dependency, secret or randomness. Determinism is preserved: the function is
  pure and the playtest is seeded.

## 9. Non-functional
- Speed: `drawOuts` stays O(cards). Measured fast-suite and playtest times are unchanged (about 14 s for 10,000
  hands).
- Slow checks: style-bands (three seeds × 100,000 hands) runs only in the opt-in slow group. The new acceptance
  file has fixed cards only and runs in < 100 ms.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run -s playtest -- --hands 10000 --seed 42`
- New tests:
  - `tests/advice/straight-outs.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03.
  - `tests/advice/ranges.test.ts` → SPEC-04, SPEC-05.
  - Command → SPEC-06. Manual → SPEC-07.
- Judge scenario:
  1. Run the new acceptance file.
  2. Run the playtest and compare its SHA with the build log.
  3. Run `TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts` and confirm three passing
     seeds.
  4. Read the docs bullet.

## 11. Open questions
- None. Q-1 is answered (see D-2 and `doit/TASK-7.28/qa.md`).

## 12. Clarifications log
See `doit/TASK-7.28/qa.md`.
