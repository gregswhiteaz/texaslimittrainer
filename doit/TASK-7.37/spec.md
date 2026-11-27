# Spec: TASK-7.37 — Bring short-handed TAG VPIP inside its healthy range at 3 and 4 seats

Status: READY (approved 2026-11-27, autopilot)
Task: TASK-7.37 · Parent/epic: TASK-7 · Requirements: n/a (follow-up from TASK-7.35, doc-158) · Dream: limit-holdem-trainer

## 1. Summary
Over 100,000 all-TAG cash hands (seed 42), TAG's VPIP is 31.1 at 3 seats and 28.1 at 4 seats, above the 6-max
healthy range of 20–28 (doc-158). The cause is the 6-max preflop chart, which TAG follows at 3–7 dealt-in seats.
That chart is also the user's advice and was signed off in TASK-7.19, so this story leaves it alone. Instead, at 3
and 4 dealt-in seats only, the TAG bot plays its button and small-blind unopened spots with the chart's cutoff
(CO) opening range. The user's advice and play at every other size stay byte-identical. The before/after effect is
measured over 100,000 hands in the opt-in slow group.

## 2. Scope
- In scope:
  - `src/bots/tag.ts`: a TAG-only derived chart `TAG_SHORT_HANDED_CHART`, a selector `tagChartFor(dealtIn)`, and
    `decideTag` passing that chart to `recommend` on preflop views with 3 or 4 dealt-in seats.
  - `src/playtest/style-check.ts`: the mixed-spot tally (which mirrors decideTag's draw condition) reads the same
    chart, so `--check-styles` at 3–4 seats counts TAG's real choices.
  - `src/bots/styles/tag.json`: one sentence added to `description` naming the short-handed exception.
  - Tests: a new fast acceptance test, a new opt-in slow 100,000-hand acceptance test (added to `test:slow`), and a
    unit test for the style-check tally.
  - Docs: a new "TAG at 3 and 4 seats (TASK-7.37)" section in `docs/advice/range-model.md` with the rule and the
    before/after table.
- Not doing:
  - Any change to `src/advice/charts/*.json`, `SIX_MAX_CHART`, `PREFLOP_CHARTS`, `recommendPreflop`,
    `referenceSizeOf`, `positionOf`, `chartSpotOf`, `situationOf`, or any user-facing advice, hint, grade or
    explanation. TASK-7.40 owns the re-raise split of the shared chart.
  - Any change to TAG at 2, 5, 6, 7, 8, 9 or 10 dealt-in seats, or to the Calling station, Maniac or Rock (they
    call `recommend` themselves and never go through `decideTag`: `src/bots/calling-station.ts:11`,
    `src/bots/maniac.ts:5`, `src/bots/rock.ts:7`).
  - Changes to `src/stats/healthy-ranges.json`, `STYLE_BANDS`, opponent range data, postflop rules, mixing
    probabilities in `tag.json`, or the style-file format (`parseStyle`).
  - Editing the locked `tests/advice/small-table-ranges-playtest.acceptance.test.ts` (TASK-7.35). It keeps
    logging, not asserting.
  - Separate stats for sit-and-go play (see A-2).
- Scope budget: files=8, lines=380   (tag.ts ≈ 35, style-check.ts ≈ 5, tag.json 1, new fast acceptance test ≈ 150,
  new slow test ≈ 70, style-check unit test ≈ 70, package.json 1, docs ≈ 45)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The fix: at 3 and 4 dealt-in seats, TAG reads the 6-max **CO unopened** cells (raise/fold, about 27% of hands) in place of the **BTN unopened** (40.6%) and **SB unopened** (37.3%, includes completes) cells. Every other spot, including blind defence, is unchanged. Spec-time probe, 100,000 hands seed 42 (VPIP / PFR / Aggression / WTSD / W$SD): 3 seats 23.6 / 17.3 / 65.2 / 41.7 / 52.4; 4 seats 23.9 / 17.7 / 64.7 / 41.7 / 51.9. All five stats are inside the 6-max healthy ranges at both sizes. | yes | Smallest change that lands every stat inside. Probed alternatives: BTN only → 3-seat aggression 66.0 at 100k, on the 66 ceiling (base is already 65.9); SB only → 3-seat VPIP 28.7, outside; borderline-cells-to-fold on every spot → VPIP 30.3, outside. | BTN only; tighten BB defence; a separately authored short-handed TAG chart |
| A-2 | "3 and 4 seats" means **dealt-in** seats (`view.players.length`), as `referenceSizeOf` already does (`src/advice/preflop.ts:59-65`). A 6- or 9-seat sit-and-go that shrinks to 3 or 4 players therefore also uses the short-handed TAG ranges; cash playtests (rebuys keep tables full) are byte-identical at 2, 6 and 9. | yes | The view carries only dealt-in players. TASK-7.35 used the same reading for SNG tables that shrink (doit/TASK-7.35/spec.md §2 "Not doing"). Poker-wise a 3-handed SNG table is 3-handed. | Key on table capacity (not in `PlayerView`; would need an engine change) |
| A-3 | `tag.json` `description` gains one sentence: "With only three or four players dealt in, it opens from the button and small blind only the hands it would open from the cutoff, to stay tight." The description is authored data and is not shown in the UI (no `description` reader in `src/ui` or `src/table`). | yes | Keeps the style file honest about what TAG does; `tests/bots/tag-mixing.acceptance.test.ts:76` only requires ≥ 15 words. | Leave the description as is |
| A-4 | The derived chart keeps the BTN and SB spots' own `justification` text and swaps only `cells`. TAG never shows chart text to the user. | yes | `recommendPreflop` reads only cells for the bot; explanations from TAG's advice are discarded by `decideTag`. | Author new justification text |

## 3. Current system
- TAG bot: `src/bots/tag.ts:44-58` `decideTag` calls `recommend(view, { ...BOT_ADVICE, ...adviceOptions(options), equity })`
  and, in mixed spots (`tag.json` 0.75/0.25), may take the cell's alternative. `adviceOptions` already forwards a
  `chart` option (`src/advice/recommend.ts:33-40`). `recommend` sends preflop views to `recommendPreflop`
  (`src/advice/recommend.ts:42-50`).
- `recommendPreflop` (`src/advice/preflop.ts:117-166`) uses `options.chart ?? PREFLOP_CHARTS[size]` and throws if the
  chart's `referenceSize` does not match the dealt-in size (`:125-130`). A '6-max' chart is valid at 3–7 seats.
- Positions: `SEATS_BEFORE_BUTTON['6-max'] = ['BTN','CO','HJ','UTG']` (`src/advice/preflop-chart.ts:42-46`). 3 seats:
  BTN, SB, BB. 4 seats: CO, BTN, SB, BB (doit/TASK-7.35/spec.md A-2).
- Chart lookup: `chartCell(chart, position, situation, handClass)` (`src/advice/preflop-chart.ts:239`) reads
  `chart.spots`. `PreflopChart`/`ChartSpot`/`ChartCell` types: `src/advice/preflop-chart.ts:9-28`.
- TAG callers: `src/bots/decide.ts:14`, `src/playtest/policy.ts:14` (`seededTagPolicy`, also the simulated user in
  line-ups), `src/table/session.ts:666` (the app's TAG seats). All go through `decideTag`, so one change covers them.
- Style check: `src/playtest/style-check.ts:110-121` re-derives the TAG draw condition with
  `recommend(playerView(before, action.seat, []), { equity: BOT_EQUITY })`. Only `tag.json` has mixed spots (the
  other style files have `"mixedSpots": []`).
- Rock's starting range is validated against `SIX_MAX_CHART` (`src/bots/style.ts:117-121`). Spec-time check: Rock's
  BTN (45 classes) and SB unopened ranges are subsets of the CO unopened non-fold cells, so Rock stays no looser than
  short-handed TAG.
- Healthy ranges: `HEALTHY_RANGES['6-max']` VPIP 20–28, PFR 14–22, aggression 50–66, WTSD 30–42, W$SD 47–57
  (`src/stats/healthy-ranges.json`).
- Slow-test pattern to copy: `tests/advice/small-table-ranges-playtest.acceptance.test.ts` (`tagStats(size)` sums
  `handStyleCounts` over every seat; `it.runIf(SLOW)`, 600 s timeout). `test:slow` list in `package.json`.
- Tests run with Vitest: `npm test` (coverage), opt-in slow group `npm run test:slow` (`TLH_SLOW_TESTS=1`).
- Existing code to reuse:
  - `src/advice/preflop.ts` → `SIX_MAX_CHART`, `recommend`/`recommendPreflop`, `referenceSizeOf`.
  - `src/advice/preflop-chart.ts` → `chartCell`, `parseChart`, `PreflopChart` types.
  - `src/advice/hand-class.ts` → `HAND_CLASSES` to pick test classes from the chart rather than hard-coding them.
  - `src/playtest/runner.ts` → `runPlaytest`, `composeChecks`; `src/playtest/cli.ts` `main` with an `out` capture
    (pattern: `tests/playtest/summary.acceptance.test.ts:47-53`).
  - `src/stats/style-stats.ts` → `addStyleCounts`, `EMPTY_STYLE_COUNTS`, `handStyleCounts`, `styleStats`.
  - `tests/bots/tag.test.ts:12-25` `stateAfter` pattern (createHand with seats 1..size, button 1, fixed deck).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | TAG-only change through the existing `chart` option of `recommend`; the shared 6-max chart and advice are untouched. | Edit `six-max.json`; a size-specific chart in `PREFLOP_CHARTS`; a new style-file block | The chart is user advice signed off in TASK-7.19 and TASK-7.40 will reshape it; the `chart` seam already exists, so no new interface or data format. | no | n/a |
| D-2 | `TAG_SHORT_HANDED_CHART` is built in code from `SIX_MAX_CHART` (spot cells swapped), not authored as a new JSON chart. | A full fourth chart JSON | 2 spots differ; a derived object can't drift from the shared chart when TASK-7.40 edits it. | no | n/a |
| D-3 | The 100,000-hand check asserts each stat inside its 6-max healthy range (not just logs it). It lives in a new opt-in slow file. | Extend the locked TASK-7.35 slow file | AC#1 requires "inside"; the TASK-7.35 file is locked; standing rule keeps 100k runs out of `npm test`/CI. | no | n/a |
| D-4 | AC#2 byte-identity is proved by a judge-run `cmp` against the base commit, not by a pinned output hash in a test. | Lock a SHA-256 of 2/6/9-seat output in an acceptance test | A pinned hash would force TASK-7.40 (which will change 6-seat play) to edit a locked test. | no | n/a |

## 5. Design

### Files to create / modify
- `src/bots/tag.ts` — add `TAG_SHORT_HANDED_CHART`, `TAG_SHORT_HANDED_SEATS`, `tagChartFor`; `decideTag` uses them.
- `src/playtest/style-check.ts` — the mixed-spot `recommend` call adds the chart from `tagChartFor`.
- `src/bots/styles/tag.json` — description sentence (A-3).
- `tests/bots/tag-short-handed.acceptance.test.ts` — new, fast: SPEC-01, SPEC-02, SPEC-03.
- `tests/bots/tag-short-handed-playtest.acceptance.test.ts` — new, opt-in slow: SPEC-04.
- `tests/playtest/style-check-short-handed.test.ts` — new unit test: SPEC-05.
- `package.json` — append `tests/bots/tag-short-handed-playtest.acceptance.test.ts` to `test:slow`.
- `docs/advice/range-model.md` — new section after "Effect at 3, 4, 5 and 7 seats (TASK-7.35)": SPEC-06.

### Components, interfaces and data
In `src/bots/tag.ts`:
```ts
/** Dealt-in seat counts at which TAG plays TAG_SHORT_HANDED_CHART. */
export const TAG_SHORT_HANDED_SEATS: readonly number[] = [3, 4];

/** SIX_MAX_CHART with the BTN unopened and SB unopened cells replaced by the CO unopened cells (TASK-7.37 A-1).
 *  Every other spot is the same object as in SIX_MAX_CHART. referenceSize '6-max'. */
export const TAG_SHORT_HANDED_CHART: PreflopChart;

/** TAG_SHORT_HANDED_CHART when dealtIn is in TAG_SHORT_HANDED_SEATS, else undefined (the shared chart applies). */
export function tagChartFor(dealtIn: number): PreflopChart | undefined;
```
- Invariants: `TAG_SHORT_HANDED_CHART.spots` has the same length and (position, situation) order as
  `SIX_MAX_CHART.spots`; the BTN unopened and SB unopened spots are new objects
  `{ ...spot, cells: coUnopened.cells }`; all others are `===` the `SIX_MAX_CHART` spot. `SIX_MAX_CHART` is not
  mutated (it stays deep-equal to `parseChart(six-max.json)`). Freeze the derived chart and its spots array like
  other module constants if the codebase does so for charts; otherwise leave as plain readonly-typed objects.
- `decideTag(view, options)`: the chart passed to `recommend` is
  `options.chart ?? (view.street === 'preflop' ? tagChartFor(view.players.length) : undefined)`; the `chart` key is
  spread in only when that is defined. An explicit `options.chart` still wins. Postflop calls are unchanged (no
  `chart` key). Everything after the `recommend` call (mixing, legal-move lookup, errors) is unchanged.
- `style-check.ts:112`: `recommend(view, { equity: BOT_EQUITY, ...chartOption })` where `chartOption` is
  `{ chart }` when `view.street === 'preflop'` and `tagChartFor(view.players.length)` is defined, else `{}`. Only TAG
  has mixed spots, so this matches the comment "The draw condition of decideTag". Output at 2 and 5–10 seats is
  unchanged.

### Rules and algorithms
- 3 seats (BTN, SB, BB): BTN first to act unopened → CO cells. BTN folds → SB unopened → CO cells (raise or fold; the
  SB never completes). BB and every facing-action spot read the 6-max chart as before.
- 4 seats (CO, BTN, SB, BB): CO unopened is the CO spot as before; BTN unopened and SB unopened (when everyone before
  folded) read the CO cells. A `limpers`, `raise`, `raise-and-calls`, `re-raise` or `blind-defence` situation is
  unchanged.
- Worked example (shape, the builder picks the class from the chart): a class `X` with 6-max BTN unopened
  `{action: 'raise', alternative: null}` and CO unopened `{action: 'fold', alternative: null}`. At 3 seats on the
  button, `decideTag` folds X; `recommend(view).move` (the user's advice) is still the raise. At 5 or 6 seats on the
  button, `decideTag` raises X.

### Error handling and configuration
- No new errors. `recommendPreflop`'s chart-size check (`src/advice/preflop.ts:125-130`) cannot fire: the derived
  chart is '6-max' and is only used at 3–4 dealt-in seats. Errors from `recommend` still propagate.
- No configuration. The seat list and spot mapping are module constants.

## 6. Behaviour specification

### SPEC-01: The short-handed TAG chart differs from the 6-max chart only in BTN and SB unopened
- Verifies: AC#1, AC#2
- Behaviour: Given `TAG_SHORT_HANDED_CHART`, When compared with `SIX_MAX_CHART`, Then `referenceSize` is '6-max';
  the spots are in the same (position, situation) order; for every hand class in `HAND_CLASSES`,
  `chartCell(TAG_SHORT_HANDED_CHART, 'BTN', 'unopened', hc)` and `chartCell(…, 'SB', 'unopened', hc)` deep-equal
  `chartCell(SIX_MAX_CHART, 'CO', 'unopened', hc)`; every other spot's cells deep-equal the 6-max spot's; and
  `SIX_MAX_CHART` still deep-equals `parseChart(six-max.json)`. `tagChartFor(n)` returns `TAG_SHORT_HANDED_CHART` for
  n = 3 and 4 and `undefined` for n = 2, 5, 6, 7, 8, 9, 10.
- Verification: acceptance `tests/bots/tag-short-handed.acceptance.test.ts::the short-handed TAG chart changes only BTN and SB unopened, at 3 and 4 seats`

### SPEC-02: At 3 and 4 dealt-in seats TAG opens the button and small blind with the cutoff range; advice does not change
- Verifies: AC#1, AC#2
- Behaviour: Given a class X chosen in the test from `HAND_CLASSES` with 6-max BTN unopened action non-fold and no
  alternative, and CO unopened `fold` with no alternative; and a class Y with 6-max SB unopened action non-fold and no
  alternative, and CO unopened `fold` with no alternative (the test asserts both exist). When `decideTag(view)` (no
  `random`) is called for the button holding X with the pot unopened, and for the small blind holding Y after every
  earlier seat folded, at 3 and at 4 dealt-in seats (stacks 160, stakes 2/4/4/8, button seat 1), Then each returns
  the `fold` action, while `recommend(view).move` for the same view is the 6-max chart's non-fold action (raise, or
  call for an SB complete). And When the same spots are played at 5 and 6 dealt-in seats, Then `decideTag(view)`
  equals `recommend(view).move` (the 6-max action).
- Verification: acceptance `tests/bots/tag-short-handed.acceptance.test.ts::TAG folds cutoff-range folds on the button and small blind at 3 and 4 seats only`

### SPEC-03: An explicit chart still wins, and postflop play is unchanged
- Verifies: AC#2
- Behaviour: Given the 3-seat button view holding X from SPEC-02, When `decideTag(view, { chart: SIX_MAX_CHART })`
  is called, Then it returns the 6-max raise. And Given any 3-seat flop view from a seeded all-TAG playtest
  (`runPlaytest({ hands: 50, seed: 42, size: 3 })`, views captured with an `onAction` hook composed with the built-in
  checks), When `decideTag(view, { random })` is called for each captured postflop TAG view with that decision's
  seeded generator, Then it equals the action the same call returns with `{ random, chart: SIX_MAX_CHART }` (no chart
  is applied postflop), and the playtest has 0 violations.
- Verification: acceptance `tests/bots/tag-short-handed.acceptance.test.ts::an explicit chart wins and postflop play ignores the short-handed chart`

### SPEC-04: Over 100,000 hands at 3 and 4 seats every TAG stat is inside its 6-max healthy range (slow, opt-in)
- Verifies: AC#1
- Behaviour: Given `TLH_SLOW_TESTS=1`, When `runPlaytest({ hands: 100000, seed: 42, size, game: 'cash' })` runs for
  size 3 and size 4 (one `it.runIf(SLOW)` per size, 600 s timeout), Then `handsPlayed = 100000`, `violations = 0`,
  and VPIP, PFR, aggression, WTSD and W$SD summed over every seat (as in
  `tests/advice/small-table-ranges-playtest.acceptance.test.ts`) are each non-null and `>= low` and `<= high` of
  `HEALTHY_RANGES['6-max']`; each value is logged as `TAG <n> seats <stat>: <value> (healthy <low>–<high>)`. Expected
  from the spec-time probe: 3 seats 23.6 / 17.3 / 65.2 / 41.7 / 52.4, 4 seats 23.9 / 17.7 / 64.7 / 41.7 / 51.9. The
  file is skipped without `TLH_SLOW_TESTS=1` and is listed in `npm run test:slow`, never in `npm test`/CI.
- Verification: acceptance `tests/bots/tag-short-handed-playtest.acceptance.test.ts::all-TAG stats at 3 and 4 seats are inside the 6-max healthy ranges`

### SPEC-05: The style check counts TAG's mixed spots with the chart TAG actually used
- Verifies: AC#1
- Behaviour: Given a 3-seat all-TAG cash playtest (`--hands 300 --seed 42 --size 3 --check-styles` through `main`
  with output captured), When the test independently tallies, for every TAG preflop decision (views from a
  `runPlaytest` `onAction` hook over the same 300 hands), `recommend(view, { equity: BOT_EQUITY, chart:
  TAG_SHORT_HANDED_CHART })` and counts decisions in TAG's mixed spots whose advice has an alternative as
  `recommended` (action = advice move) or `alternative` (action = advice alternative), Then every such decision
  matches one of the two, and each `Mixed spot: TAG preflop-<spot>, recommended R, alternative A` line equals the
  independent tally for that spot.
- Verification: unit `tests/playtest/style-check-short-handed.test.ts::style check tallies TAG mixed spots with the short-handed chart at 3 seats`

### SPEC-06: Before/after figures are recorded
- Verifies: AC#1
- Behaviour: Given the base commit `735e6cd` and the change, When all-TAG cash playtests run with seed 42 at 3 and 4
  seats over 10,000 hands (before and after) and the SPEC-04 100,000-hand run (after), Then
  `docs/advice/range-model.md` has a section headed `### TAG at 3 and 4 seats (TASK-7.37)` that states the rule
  (BTN and SB unopened use the CO unopened range at 3–4 dealt-in seats, TAG only, user advice unchanged) and a table
  with rows `3 seats 10,000, before`, `3 seats 10,000, after`, `3 seats 100,000, before`, `3 seats 100,000, after`
  and the same for 4 seats, plus the `6-max healthy` row, columns VPIP / PFR / Aggression / WTSD / W$SD. The
  100,000 "before" rows are the doc-158 figures (3 seats 31.1 / 22.0 / 65.9 / 41.7 / 52.7; 4 seats 28.1 / 20.4 /
  65.2 / 41.5 / 52.2). The same table goes in `doit/TASK-7.37/build-log.md`. The line in the TASK-7.35 Effect
  section listing 3- and 4-seat VPIP as outside gets a trailing note "(fixed for TAG by TASK-7.37)".
- Verification: command `grep -n "TAG at 3 and 4 seats (TASK-7.37)" -A30 docs/advice/range-model.md`

### SPEC-07: 2, 5, 6, 7 and 9 seat output is byte-identical
- Verifies: AC#2
- Behaviour: Given the base commit `735e6cd` (checked out in a git worktree) and the change, When
  `npm run -s playtest -- --hands 2000 --seed 42 --size <n>` runs for n = 2, 5, 6, 7 and 9, and
  `npm run -s playtest -- --hands 2000 --seed 42 --size 6 --lineup mixed --check-styles` run in both trees, Then
  each pair of outputs is byte-identical (`cmp` exits 0; the `--check-styles` exit code may be non-zero from sample
  noise but must match). `git diff 735e6cd -- src/advice` is empty. (A 9-seat SNG is not compared: late hands with
  3–4 players left may change by design, A-2.)
- Verification: command `for n in 2 5 6 7 9; do cmp <(cd "$BASE" && npm run -s playtest -- --hands 2000 --seed 42 --size $n) <(npm run -s playtest -- --hands 2000 --seed 42 --size $n) || echo "DIFF $n"; done; git diff --stat 735e6cd -- src/advice`

### SPEC-08: Full gates stay green
- Verifies: AC#1, AC#2
- Behaviour: Given the change, When the full suite, lint, typecheck and e2e run, Then all pass with no locked test
  edited. In particular `tests/bots/tag*.acceptance.test.ts`, `tests/playtest/all-sizes.acceptance.test.ts`,
  `tests/playtest/summary.acceptance.test.ts` (20 hands at 4 seats) and `tests/advice/*` pass unchanged.
- Verification: command `npm test && npm run lint && npm run typecheck && npm run e2e`

## 7. Edge cases
- 2 dealt-in seats (heads-up chart): `tagChartFor(2)` is undefined → unchanged (SPEC-01, SPEC-07).
- 5, 6, 7 dealt-in: unchanged (SPEC-01, SPEC-02, SPEC-07). 8–10: unchanged (SPEC-01, SPEC-07).
- SNG table shrinking to 3–4 dealt-in players: uses the short-handed chart by design (A-2); covered by existing
  zero-violation SNG checks (SPEC-08), and not part of the SPEC-07 byte-identity comparison.
- Mixed spot with the swapped cells: CO cells carry their own alternatives; `decideTag` mixes them as before (SPEC-05
  checks the tally matches).
- Capped raise / nothing owed: handled by `recommendPreflop`'s legalisation (`src/advice/preflop.ts:136-141`),
  unchanged.
- Explicit `options.chart`: wins (SPEC-03).
- Invalid input, concurrency, permissions, persistence: N/A — pure function on an engine-built view; no I/O.

## 8. Security considerations
N/A for trust boundaries: no new input, storage, network, dependency or user-visible text. Randomness is unchanged
(TAG's seeded `botRandom`; fairness of the deal is untouched).

## 9. Non-functional
- Bot decision cost is unchanged (one extra array-membership check per preflop decision).
- Slow SPEC-04 file: about 75–90 s per size at the measured ≈ 1,300 hands/s; 600 s timeout per size. Opt-in only.
- Fast acceptance and unit tests: under 5 s each (≤ 300 hands of playtest).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run -s playtest -- --hands 10000 --seed 42 --size 3` (and `--size 4`); slow measurement
  `TLH_SLOW_TESTS=1 npx vitest run tests/bots/tag-short-handed-playtest.acceptance.test.ts`
- New tests:
  - `tests/bots/tag-short-handed.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03
  - `tests/bots/tag-short-handed-playtest.acceptance.test.ts` → SPEC-04 (opt-in slow)
  - `tests/playtest/style-check-short-handed.test.ts` → SPEC-05
- End-to-end scenario for the Judge:
  1. Run the 10,000-hand playtests at 3 and 4 seats: the `Style: TAG` line shows VPIP ≈ 23–24% (was 31.0% / 27.9%)
     and 0 invariant violations.
  2. Run the SPEC-04 slow file and check all five stats are inside the 6-max ranges at both sizes.
  3. Run the SPEC-07 `cmp` checks against a `735e6cd` worktree.
  4. `npm run dev`, start a 3-player cash game, and on the button ask for a hint with a hand the 6-max button chart
     opens but the cutoff folds (e.g. found with `npm run chart:print`): the hint still says raise (advice
     unchanged).

## 11. Open questions
None.

## 12. Clarifications log
See `doit/TASK-7.37/qa.md`.
