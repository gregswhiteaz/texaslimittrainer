# Spec: TASK-7.6 — Recommend preflop actions at heads-up and full-ring tables

Status: READY (approved 2026-11-22)
Task: TASK-7.6 · Parent/epic: TASK-7 (Get trustworthy advice) · Requirements: REQ-005.4, REQ-032.1, REQ-032.2, REQ-032.4, REQ-032.6, REQ-061.2 · Dream: limit-holdem-trainer

## 1. Summary
Adds two authored preflop charts, heads-up and full ring, in the same 13×13 grid format as the 6-max chart. Every
table size from 2 to 10 maps to one of the three charts (2 → heads-up, 3–7 → 6-max, 8–10 → full ring), and each
seat maps to a chart position by counting seats before the button. With advice available at every size, the
playtest's random-move fallback is removed: the default playtest seats TAG everywhere, and `--lineup` styles play
in every hand. The 10-player pace e2e check then runs with the real advice worker instead of its test-only policy.

## 2. Scope
- In scope:
  - `ReferenceSize` gains `'heads-up'` and `'full-ring'`. `Position` gains the full-ring names `UTG+1`, `MP` and `LJ`
    (approved Q-2). `APPLICABLE_SPOTS` gets heads-up and full-ring entries. `parseChart` accepts all three sizes.
  - New data files `src/advice/charts/heads-up.json` (6 spots) and `src/advice/charts/full-ring.json` (41 spots),
    authored by Claude per the §5 authoring guide (approved Q-1), with chart-level and per-spot justifications.
  - Size → reference-size mapping and seat → chart-position mapping (description and AC#8). `recommendPreflop`
    picks the chart from the view's dealt-in seat count.
  - Rock bot: its 6-max starting range is used at every size, mapped by the same seat rule (A-4).
  - Playtest: remove the random-move fallback from `defaultPolicyFactory` and `seatStylesPolicyFactory`. Remove the
    Line-up note and fix the `--help` wording.
  - `e2e/support/pace-harness.tsx` uses the production advice worker; delete `e2e/support/pace-advice.worker.ts`.
  - Update the unit tests that pin the old non-6 behaviour (throws, random fallback). Make one approved locked-test
    edit (Q-4, D-6).
- Not doing:
  - Heads-up and full-ring **default opponent ranges** for the range model (TASK-7.5 A-3 fallback stays: non-6
    tables start from every unseen combo). This becomes a follow-up story (approved Q-3).
  - The "approximate" label for mapped sizes (TASK-7.16). Golden spots (TASK-7.11). Explanations (TASK-7.10).
  - Choosing the table size in Game Config (TASK-2.2). The app stays at 6 players.
  - Style files for the other sizes (Rock ranges per size, size-specific mixing). Bot style files are unchanged.
  - `npm run chart:print` keeps printing only the 6-max chart (a size argument is a scope concern).
  - Changes to the 6-max chart, the equity engine, or speed work on postflop equity.
  - Retuning the 6-max chart or adding a 6-max `UTG limpers` spot (A-3 handles that spot instead).
- Scope budget: files=26, lines=2500   (about 950 of the lines are the two chart JSON files)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Seat mapping counts **dealt-in** seats (`view.players`), the same as `positionOf` today (`src/advice/preflop.ts:48-56`). Order starts at the first dealt-in seat after the button. With n ≥ 3 the first two seats are SB and BB, and every other seat is k seats before the button (BTN k=0). With n = 2 the button is `BTN` and the other seat is `BB`. A seat with k beyond the chart's earliest position uses that earliest position (`UTG`). | yes | The task description and AC#8 define this rule. Busted sit-and-go seats are not dealt in, so they don't count. The heads-up button posts the small blind (REQ-015.1) but acts as the button, and REQ-047.6 calls it "late". | Name the heads-up button `SB` |
| A-2 | `options.chart` still overrides the chart. If its `referenceSize` differs from the view's reference size, `recommendPreflop` throws `RangeError('The <size> chart does not fit <n> dealt-in seats')`. | yes | Keeps TASK-7.2's override (locked AC#3 passes a 6-max chart at 6 seats). A mismatched override would read cells for the wrong positions. | Ignore the override at other sizes |
| A-3 | When the mapped position has no `limpers` spot (only `UTG` at 7 or 10 seats, where a seat mapped to UTG can face an earlier seat's limp), the advice uses the limpers spot of the position one seat later (6-max `HJ`, full-ring `UTG+1`). The recommendation's `position` names the spot actually used, so `chartCell(chart, rec.position, rec.situation, rec.handClass)` always equals `rec.cell`. | yes | Without this rule `chartCell` throws in a reachable spot. The locked 26-spot 6-max test (`tests/advice/six-max-chart.acceptance.test.ts:119`) rules out adding a UTG limpers spot. The next-later limpers range is the tightest one the chart has. | Use the UTG unopened cell; add UTG limpers spots |
| A-4 | The Rock uses its 6-max starting range at every size. Its spot is mapped with the same seat rule onto the 6-max positions (plus A-3), so full-ring `UTG`, `UTG+1`, `MP` and `LJ` use 6-max `UTG`, and heads-up `BTN`/`BB` use 6-max `BTN`/`BB`. Inside that range it plays the advice move for the real size's chart, as it does now. | yes | `rock.json` has only 6-max spots (`src/bots/style.ts:250-355`). The Rock stays a Rock: it never plays a hand outside its 6-max range, and the size's TAG chart can only tighten it further. | Author Rock ranges for heads-up and full ring (more content; a follow-up if wanted) |
| A-5 | `ranges.ts` keeps its 6-max-only range table. Its `APPLICABLE_LINES` record is retyped to the 6-max key, and its `players.length === 6` guard (`src/advice/ranges.ts:373`) is unchanged, so TASK-7.5's A-3 fallback still applies at other sizes. | yes | Widening `ReferenceSize` would otherwise break `Record<ReferenceSize, …>` typing in `ranges.ts:46`. Q-3 defers the new ranges. | Add empty heads-up/full-ring range lists |
| A-6 | `referenceSizeOf(n)` throws `RangeError('No reference size for <n> dealt-in seats')` outside 2–10. | yes | The engine deals 2–10 seats. The convention matches other advice errors. | Clamp |

## 3. Current system
- Chart types, `APPLICABLE_SPOTS` (6-max only), `parseChart` (rejects any size but `'6-max'` at `:163-167`),
  `chartCell`: `src/advice/preflop-chart.ts:3-225`. Justification minimums: chart ≥ 50 words, spot ≥ 15
  (`:62-63`, `:172-192`). The BB-limpers no-fold rule is at `:148-151`.
- `positionOf` throws unless 6 dealt-in seats (`src/advice/preflop.ts:47-56`). `situationOf` (`:59-72`).
  `recommendPreflop` caps raise → call at `betCount >= STREET_BET_CAP` and turns a free call or fold into check
  (`:75-114`). These legality rules are reused unchanged for AC#6/#7.
- `recommend` and `adviceOptions` pass `chart` through (`src/advice/recommend.ts:24-41`).
- Bots: TAG calls `recommend` (`src/bots/tag.ts:31-48`). The Rock calls `positionOf` and `startingRangeFor`
  (`src/bots/rock.ts:31-45`). Style files are validated against the 6-max chart (`src/bots/style.ts:114-118`).
- Playtest fallback: `defaultPolicyFactory` returns random moves at size ≠ 6 (`src/playtest/runner.ts:173-180`).
  `seatStylesPolicyFactory` uses random moves when `view.players.length !== 6` (`src/playtest/policy.ts:42-57`).
  The Line-up note is at `src/playtest/cli.ts:327-341`, and the help text at `src/playtest/cli.ts:48`.
- The 10-player pace harness decides bots with a test-only worker (`e2e/support/pace-harness.tsx:6,27`,
  `e2e/support/pace-advice.worker.ts`). The production worker is `src/ui/advice/advice.worker.ts`. The locked
  spec `e2e/rapid-pace.spec.ts:292-309` only calls `buildPaceHarness`/`openPaceHarness`, so AC#10 needs **no
  edit** to the locked spec.
- Tests: vitest (`npm test` = all groups with coverage; `test:unit`, `test:sweeps`, `test:slow` in
  `package.json`). Acceptance files are `*.acceptance.test.ts`. Slow checks use `TLH_SLOW_TESTS=1` and `it.runIf(SLOW)`.
  Scripted preflop views are built with `createHand` + `applyAction` + `playerView`
  (`tests/advice/preflop.acceptance.test.ts:20-80`).
- Existing code to reuse:
  - `src/advice/preflop-chart.ts` → `parseChart`, `parseGrid`, `ChartValidationError` for the new files (no new parser).
  - `src/advice/preflop.ts` → `situationOf`, and the legality adjustment in `recommendPreflop`.
  - `src/advice/chart-print.ts` → `spotWidths` for combo-weighted widths in the content tests.
  - `src/advice/hand-class.ts` → `HAND_CLASSES`, `comboCount`.
  - `tests/advice/preflop.acceptance.test.ts` → the scripted-view pattern (copy the pattern, don't import from a locked file).
  - `src/playtest/policy.ts` → `seededTagPolicy`, `decideStyle` wiring, `seatGenerator` stays for tests.

### Prototype measurements (scratch copy, fallback removed, 6-max chart mapped at every size; 2026-11-22, 14-core Mac)
- Every-push vitest (no tooling groups): 8 failures, all in **unlocked** files (`tests/advice/grade.test.ts`,
  `tests/advice/preflop.test.ts`, `tests/bots/rock.test.ts`, `tests/bots/tag.test.ts`,
  `tests/playtest/policy.test.ts`, `tests/playtest/runner.test.ts` ×2,
  `tests/playtest/policy-lineup.acceptance.test.ts` (in test snapshots, not in any `locked_tests`)). Slow group:
  all 18 pass, but the locked `tests/playtest/lineup.acceptance.test.ts:72` (TASK-6.6) asserts the Line-up note
  is present at 9 seats. AC#11 removes the note, so this line must change (Q-4).
- Default playtest (all TAG), 20,000 hands: size 10 takes 1.9 s (was 1.6 s random), size 6 1.4 s. TAG mostly folds
  preflop, so the extra cost is small. `playtest:million -- --hands 900` output changes (the TASK-6.9 baseline hash
  `1b561d21…` no longer applies). That is expected, and only a past build-log note, not a test.
- `--lineup` runs at sizes ≠ 6 become much slower, because style bots now reach multi-way postflop decisions
  (30,000-trial sampled equity, about 5–7 ms each). Per 5,000 hands: mixed 9 seats 30 s, mixed 4 27 s, mixed 10
  24 s, tough 3 10 s, tough 8–10 3–10 s, soft under 1 s (before: about 0.3 s each). The locked TASK-6.6 AC#6 run
  (`--hands 10000 --size 9 --lineup tough`, run twice in the every-push sweep) goes from 0.8 s to 13 s per run.
  Estimated `playtest:million -- --lineups`: about 19 CPU-minutes over its shards, about 5–6 min of wall time on a
  4-vCPU runner (30-min job timeout). Q-5.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Content: Claude authors both charts from first principles per the §5 authoring guide (TAG, limit, $4/$8, "typical player" opponents). No published chart is consulted. Each spot has its own justification, and each chart has one overall. Content sanity tests hold the bands. The user reviews the finished charts afterwards. | (b) The user writes or dictates the ranges; (c) derive heads-up/full-ring cells by formula from the 6-max chart (not authored, weak justification) | Same approach as the approved 6-max D-1 (TASK-7.2 Q-1). REQ-061.2 needs original content. | yes | auto-accepted (Q-1, qa.md: recommended) |
| D-2 | Full-ring chart = 9 positions: `UTG, UTG+1, MP, LJ, HJ, CO, BTN, SB, BB` (UTG = 6 seats before the button). A 10-handed table's two earliest seats both use `UTG` (A-1 rule). 41 spots. Heads-up chart = `BTN` and `BB`, 6 spots. | (b) A 10-position full-ring chart (adds a seat 7 before the button, 46 spots; the 9-handed first seat would then be named "UTG+1"); (c) other names (`UTG+2` for MP) | Natural names at 9 seats. 8-handed's first seat (5 before) = `UTG+1`, as AC#8 needs. Fewer cells. 10-handed UTG plays a range written to hold with 8 or 9 players behind. | yes | auto-accepted (Q-2, qa.md: recommended) |
| D-3 | Public API additions (§5): `ReferenceSize`, `Position` widened; `HEADS_UP_CHART`, `FULL_RING_CHART`, `PREFLOP_CHARTS`, `referenceSizeOf`, `chartSpotOf`. `recommendPreflop`'s signature and result shape are unchanged. `referenceSize`/`position` now take the new values. | A new `charts` option map | Smallest change. TASK-7.2 D-3 kept `options.chart` for this. | no | n/a |
| D-4 | Heads-up and full-ring default opponent ranges are deferred to a new follow-up story under TASK-7. The TASK-7.5 A-3 fallback stays meanwhile. | Author them here (about 36 range lines × 2 sizes, new validator entries, more locked-test exposure) | The ACs of TASK-7.6 cover charts only. The story is already large content. | yes | auto-accepted (Q-3, qa.md: recommended; follow-up story created at the docs step) |
| D-5 | AC#10 is met by switching `e2e/support/pace-harness.tsx` to `src/ui/advice/advice.worker.ts?worker&inline` and deleting `pace-advice.worker.ts`. The locked `e2e/rapid-pace.spec.ts` is untouched. | Edit the locked spec | No locked-file edit is needed. | no | n/a |
| D-6 | Locked-test edit in `tests/playtest/lineup.acceptance.test.ts` (owner TASK-6.6): line 72 `toBeDefined()` → `toBeUndefined()` (the note is gone, AC#11). The AC#6 10,000-hand 9-seat test becomes opt-in slow (`it.runIf(SLOW)`; the file is already in `test:slow`), so the every-push sweep doesn't gain about 26 s. A small every-push 9-seat check lives in the new SPEC-09 test. | Keep AC#6 in every push (+~26 s per sweep shard) | Standing rule: speed/scale checks are opt-in slow; CI sweep shards are already 2.5–4.5 min. | yes | user (Q-4, qa.md: approve both; TASK-6.6 unlock recorded) |
| D-7 | Accept the slower `--lineup` runs at sizes ≠ 6 and the changed default output at sizes ≠ 6 (million-run reports, hash baselines). No equity speed work in this story. If the build measures `playtest:million -- --lineups` above 15 min of wall time on CI, open a follow-up perf task. | Optimise postflop equity here; keep random fallback for multi-way pots | AC#9/#11 require styles everywhere. Speed work is out of scope. | yes | user (Q-5, qa.md: accept, measure) |

## 5. Design

### Files to create / modify
- `src/advice/preflop-chart.ts` — widen `ReferenceSize`/`Position`; `SEATS_BEFORE_BUTTON`; heads-up and full-ring `APPLICABLE_SPOTS`; `parseChart` accepts the three sizes
- `src/advice/preflop.ts` — `HEADS_UP_CHART`, `FULL_RING_CHART`, `PREFLOP_CHARTS`, `referenceSizeOf`, `chartSpotOf`; generalise `positionOf`; chart selection and the A-2 check in `recommendPreflop`
- `src/advice/charts/heads-up.json` — new: authored heads-up chart (6 spots)
- `src/advice/charts/full-ring.json` — new: authored full-ring chart (41 spots)
- `src/advice/ranges.ts` — A-5 retype only
- `src/bots/rock.ts` — A-4: spot via `chartSpotOf(view, '6-max')`
- `src/playtest/runner.ts` — `defaultPolicyFactory` = TAG at every size; doc comments
- `src/playtest/policy.ts` — `seatStylesPolicyFactory` without the random fallback
- `src/playtest/cli.ts` — remove the Line-up note; help text
- `e2e/support/pace-harness.tsx` — production advice worker (D-5)
- `e2e/support/pace-advice.worker.ts` — delete
- `tests/advice/table-sizes.acceptance.test.ts` — new: SPEC-01..07
- `tests/playtest/all-sizes.acceptance.test.ts` — new: SPEC-08, SPEC-09
- `tests/advice/reference-charts.test.ts` — new: SPEC-10 content sanity (unlocked, so the content can be tuned)
- `tests/advice/preflop.test.ts` — positions at every size, A-2, A-3, A-6 (SPEC-11)
- `tests/advice/preflop-chart.test.ts` — `'full-ring'` is now a valid size; an unknown size still fails
- `tests/advice/grade.test.ts` — replace the non-6 error-propagation case with another error
- `tests/bots/rock.test.ts` — A-4 (SPEC-12)
- `tests/bots/tag.test.ts` — replace the non-6 error-propagation case
- `tests/playtest/runner.test.ts` — default policy is TAG at every size; carried-stacks case
- `tests/playtest/policy.test.ts` — styles at every size
- `tests/playtest/policy-lineup.acceptance.test.ts` — unlocked; rewrite the 9-seat assertion to styles-everywhere
- `tests/playtest/cli.test.ts` — help text; no note
- `tests/playtest/lineup.acceptance.test.ts` — LOCKED (TASK-6.6), edit only after Q-4 approval (D-6)

### Components, interfaces and data
`src/advice/preflop-chart.ts`:
```ts
export type ReferenceSize = 'heads-up' | '6-max' | 'full-ring';
export type Position = 'UTG' | 'UTG+1' | 'MP' | 'LJ' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
/** Non-blind chart positions by seats before the button: index 0 = BTN. Last entry = earliest position. */
export const SEATS_BEFORE_BUTTON: Readonly<Record<ReferenceSize, readonly Position[]>> = {
  'heads-up': ['BTN'],
  '6-max': ['BTN', 'CO', 'HJ', 'UTG'],
  'full-ring': ['BTN', 'CO', 'HJ', 'LJ', 'MP', 'UTG+1', 'UTG'],
};
export const APPLICABLE_SPOTS: Readonly<Record<ReferenceSize, readonly SpotId[]>>; // 6-max entry unchanged
```
Heads-up spots, in order: `unopened BTN`; `limpers BB`; `raise BTN`; `re-raise BTN, BB`; `blind-defence BB`.
Full-ring spots, in order:
- `unopened`: UTG, UTG+1, MP, LJ, HJ, CO, BTN, SB (8)
- `limpers`: UTG+1, MP, LJ, HJ, CO, BTN, SB, BB (8)
- `raise`: UTG, UTG+1, MP, LJ, HJ, CO, BTN (7)
- `raise-and-calls`: UTG, UTG+1, MP, LJ, HJ, CO, BTN (7)
- `re-raise`: all 9
- `blind-defence`: SB, BB (2)

`parseChart` accepts `referenceSize` ∈ the three ids. The label is `heads-up chart` / `full-ring chart`, and every
existing message keeps its form (e.g. `full-ring chart: missing plain-English justification (at least 50 words)`,
`heads-up chart: missing spot BTN unopened`). The BB-limpers no-fold rule applies at every size.

`src/advice/preflop.ts`:
```ts
export const HEADS_UP_CHART: PreflopChart;   // parseChart(heads-up.json) at import
export const SIX_MAX_CHART: PreflopChart;    // unchanged
export const FULL_RING_CHART: PreflopChart;  // parseChart(full-ring.json) at import
export const PREFLOP_CHARTS: Readonly<Record<ReferenceSize, PreflopChart>>;
/** 2 → 'heads-up'; 3–7 → '6-max'; 8–10 → 'full-ring'. RangeError otherwise (A-6). */
export function referenceSizeOf(dealtIn: number): ReferenceSize;
/** The viewer's position on `size`'s chart (A-1); default size = referenceSizeOf(view.players.length). */
export function positionOf(view: PlayerView, size?: ReferenceSize): Position;
/** The chart spot the viewer's decision reads: positionOf + situationOf, then rule A-3 for a missing limpers spot. */
export function chartSpotOf(view: PlayerView, size?: ReferenceSize): { position: Position; situation: Situation };
```
`recommendPreflop(view, options)`: `size = referenceSizeOf(view.players.length)`;
`chart = options.chart ?? PREFLOP_CHARTS[size]`; A-2 check; `{position, situation} = chartSpotOf(view, size)`; then
the existing cell lookup and legality rules, unchanged. The result's `referenceSize` = `chart.referenceSize`.

`src/bots/rock.ts`: `const { position, situation } = chartSpotOf(view, '6-max')` replaces `positionOf`/`situationOf`.

`src/playtest/runner.ts`: `defaultPolicyFactory(size)` returns `(code) => seededTagPolicy(code)` for every size.
`src/playtest/policy.ts`: `seatStylesPolicyFactory` returns the styled policy directly. `randomMovePolicy` stays
exported (tests use it). `src/playtest/cli.ts`: `lineUpLines` drops the note. The help line reads
`--lineup: seat 1 plays the user (TAG) and seats 2 and up play the preset's styles; without it every seat plays TAG\n`.

### Rules and algorithms
1. Seat → position (A-1). `order` = dealt-in seats rotated to start after the button; `i` = viewer's index; `n` = count.
   - n = 2: i = 0 → `BB`; the button → `BTN`.
   - n ≥ 3: i = 0 → `SB`, i = 1 → `BB`; otherwise k = n − 1 − i and the position is
     `SEATS_BEFORE_BUTTON[size][min(k, len − 1)]`.
2. Worked examples (AC#8, against rule 1). First seat to act, i = 2, so k = n − 3:
   - 4-handed: k = 1 → 6-max `CO`. 5-handed: k = 2 → 6-max `HJ`.
   - 7-handed: seats k = 4 and k = 3 → both 6-max `UTG` (min(4,3) = 3).
   - 8-handed: k = 5 → full-ring index 5 = `UTG+1` ("5 seats before the button").
   - 9-handed: k = 6 → `UTG`. 10-handed: k = 7 and 6 → both `UTG`.
   - 3-handed: the first to act is the button (k = 0 → `BTN`). Heads-up: the button acts first preflop
     (REQ-015.2) → `BTN`.
   - The 6-max order is unchanged: at n = 6 rule 1 gives SB, BB, UTG, HJ, CO, BTN, as today.
3. Situation: `situationOf` unchanged. Heads-up BTN facing a raise after its own limp → `raise`. BB facing the
   button's raise → `blind-defence`. Any later raise → `re-raise`.
4. A-3: if `(position, 'limpers')` is not in the chart, use `SEATS_BEFORE_BUTTON[size][len − 2]` (one seat later).
5. AC#6 (heads-up): button raises (bet 2), BB re-raises (3), button re-raises (4 = cap) → BB, `re-raise`; an
   `R` cell → `call` because `betCount >= 4`. AC#7 (9-handed): UTG raises, CO re-raises, BB re-raises → UTG,
   `re-raise`; `R` → `call`, `F` → `fold`.

### Authoring guide for the heads-up and full-ring charts (approved Q-1)
Same principles as the 6-max guide (TASK-7.2 §5): tight-aggressive, raise-or-fold first in, AA/KK/QQ `R` in every
spot, borderline `*` on 1–3 edge classes per boundary, `/X` only on borderline or close cells, every spot keeps one
non-borderline `R` and (except BB limpers) one non-borderline `F`. The chart text is ≥ 50 words, each spot ≥ 15
words (≤ about 80), plain English, written fresh, no published chart consulted. Bands (continue = R or C combos
as % of 1,326):

| Chart | Spot | Continue | Notes |
|---|---|---|---|
| heads-up | unopened BTN | 70–95 | raise ≥ 55; `C` (complete) ≤ 15 |
| heads-up | limpers BB | raise 25–55 | every other cell `C` (= check) |
| heads-up | raise BTN (limped, then raised) | 35–75 | |
| heads-up | re-raise BTN / BB | 35–80 each | |
| heads-up | blind-defence BB | 65–95 | re-raise 15–40 |
| full ring | unopened UTG / UTG+1 / MP / LJ / HJ / CO / BTN / SB | 7–11 / 8–12 / 9–14 / 11–16 / 13–19 / 17–26 / 25–40 / 22–38 | `C` only in SB, ≤ 10 |
| full ring | limpers UTG+1 … SB | 8–25 each | |
| full ring | limpers BB | raise 6–20 | rest `C` |
| full ring | raise (7 positions) | 4–12 | `C` ≤ 4 |
| full ring | raise-and-calls (7) | 5–16 | |
| full ring | re-raise (9) | 5–28 | |
| full ring | blind-defence SB / BB | 8–22 / 30–55 | |

Unopened `R` sets nest: full ring UTG ⊆ UTG+1 ⊆ MP ⊆ LJ ⊆ HJ ⊆ CO ⊆ BTN. The heads-up BTN unopened `R` set ⊇ the 6-max
BTN unopened `R` set. The full-ring chart text says the UTG range is built to hold at both 9 and 10 seats (D-2).

### Error handling and configuration
- `RangeError('No reference size for <n> dealt-in seats')` — A-6.
- `RangeError('The <size> chart does not fit <n> dealt-in seats')` — A-2.
- Removed: `'The 6-max chart needs 6 dealt-in seats, got <n>'`.
- Chart validation messages: as today, with the new size labels.

## 6. Behaviour specification

### SPEC-01: Three charts exist and a missing chart fails validation
- Verifies: AC#1
- Behaviour: Given the shipped data, When the charts are loaded, Then `PREFLOP_CHARTS` has exactly the keys
  `heads-up`, `6-max`, `full-ring`, and each parsed chart's `referenceSize` equals its key. Given
  `src/advice/charts/` as read from disk, Then it holds `heads-up.json`, `six-max.json` and `full-ring.json`, each
  parsing without error. When a chart file is missing, `parseChart` is given no spots or `undefined` content and
  throws `ChartValidationError` listing `<size> chart: missing spot …` for every applicable spot (or the top-level
  format problem for `undefined`).
- Verification: acceptance `tests/advice/table-sizes.acceptance.test.ts::AC#1 heads-up, 6-max and full-ring charts exist and a missing chart fails`

### SPEC-02: Every spot at heads-up and full ring assigns all 169 classes
- Verifies: AC#2
- Behaviour: Given `HEADS_UP_CHART` and `FULL_RING_CHART`, Then their spots equal `APPLICABLE_SPOTS` for the size
  (6 and 41 spots, in the §5 lists), the six situations each appear in every size's list, and every spot has a
  cell for each of the 169 `HAND_CLASSES`. When one grid token of each file is replaced with `-`, Then parsing
  fails with `<size> chart: <P> <S> <hc> has no action`. When a spot is removed, it fails with
  `<size> chart: missing spot <P> <S>`.
- Verification: acceptance `tests/advice/table-sizes.acceptance.test.ts::AC#2 every heads-up and full-ring spot assigns all 169 hand classes`

### SPEC-03: Missing justification fails naming the chart
- Verifies: AC#3, DoD#10
- Behaviour: Given the real heads-up and full-ring file text with the chart `justification` set to `""`, When
  parsed, Then `ChartValidationError.problems` contains `heads-up chart: missing plain-English justification (at
  least 50 words)` (and the `full-ring chart: …` message respectively). With one spot's justification set to `""`,
  the problem names that spot.
- Verification: acceptance `tests/advice/table-sizes.acceptance.test.ts::AC#3 a chart without justification fails naming the chart`

### SPEC-04: Each table size uses its reference chart
- Verifies: AC#4
- Behaviour: Given a scripted preflop view at each size 2–10 (seat to act, any hole cards), When
  `recommendPreflop`/`recommend` runs, Then `referenceSize` is `heads-up` for 2, `6-max` for 3–7, `full-ring` for
  8–10, and `cell` equals `chartCell(PREFLOP_CHARTS[that size], position, situation, handClass)`.
- Verification: acceptance `tests/advice/table-sizes.acceptance.test.ts::AC#4 the chart used is heads-up for 2, 6-max for 3 to 7 and full ring for 8 to 10`

### SPEC-05: Heads-up button reads the heads-up cell
- Verifies: AC#5
- Behaviour: Given a heads-up hand where the button is to act first preflop, for all 169 hand classes, Then the
  result has `referenceSize 'heads-up'`, `position 'BTN'`, `situation 'unopened'`, `cell` = the heads-up BTN unopened
  cell, and `action` = that cell's action (`call` for a `C` cell, since the button owes 2).
- Verification: acceptance `tests/advice/table-sizes.acceptance.test.ts::AC#5 heads-up button advice comes from the heads-up chart cell`

### SPEC-06: Fourth bet at heads-up and full ring uses re-raise cells, capped
- Verifies: AC#6, AC#7
- Behaviour: Given heads-up, the button raises, the BB re-raises and the button re-raises (betCount 4), When the BB
  asks for advice holding a class whose heads-up `BB re-raise` cell action is `R` (found from the chart, not
  hard-coded), Then `position 'BB'`, `situation 're-raise'`, `cell` = that cell, `action 'call'`. Given 9-handed,
  UTG raises, CO re-raises, BB re-raises (others fold), When UTG asks for advice with a class whose full-ring
  `UTG re-raise` cell is `R` and with one whose cell is `F`, Then the actions are `call` and `fold`, and both
  results report `full-ring`, `UTG`, `re-raise`.
- Verification: acceptance `tests/advice/table-sizes.acceptance.test.ts::AC#6 AC#7 a capped fourth bet uses the re-raise cell and caps raise to call`

### SPEC-07: First seat to act maps by seats before the button
- Verifies: AC#8
- Behaviour: Given the first seat to act preflop (unopened), Then 4-handed reports `6-max` `CO`, 5-handed `6-max`
  `HJ`, 7-handed both the first and second seat (after the first folds) `6-max` `UTG`, and 8-handed `full-ring` with
  `position === SEATS_BEFORE_BUTTON['full-ring'][5]` (= `UTG+1`). Each `cell` equals the chart cell for that
  position. (Covers a 7-handed second seat facing the first seat's limp, which reads 6-max `HJ limpers` per A-3.)
- Verification: acceptance `tests/advice/table-sizes.acceptance.test.ts::AC#8 the first seat to act maps by seats before the button`

### SPEC-08: Default playtest seats TAG at every size
- Verifies: AC#9, DoD#7
- Behaviour: Given sizes 2–10, When `runPlaytest({ hands: 40, seed: 42, size })` runs with the default policy,
  Then its result equals `runPlaytest(same, undefined, { makePolicy: (code) => seededTagPolicy(code) })`, and
  `violations` is 0. At size 9 it differs from a run with `randomMovePolicy(seatGenerator(code, seat))` in every
  seat (the fallback is gone).
- Verification: acceptance `tests/playtest/all-sizes.acceptance.test.ts::AC#9 default playtest seats TAG at every size from 2 to 10`

### SPEC-09: Line-up styles play in every hand at every size, with no note
- Verifies: AC#11, DoD#7
- Behaviour: Given each preset (`Mixed`, `Tough`, `Soft`) at sizes 2–10, When `runPlaytest({ hands: 30, seed: 42,
  size, lineUp })` runs, Then every player action of seat s equals `decideStyle(view, style_s, botRandom(botDecisionSeed(code, view)))`
  for bot seats (the line-up seat's style at that hand, including replacements), and `seededTagPolicy(code)(view)`
  for seat 1. `violations` is 0. The CLI `--lineup tough --size 9 --hands 30` output contains no `Line-up note`.
  Total test time ≤ 5 s.
- Verification: acceptance `tests/playtest/all-sizes.acceptance.test.ts::AC#11 line-up seats play their own style in every hand at sizes 2 to 10`

### SPEC-10: Chart content is original, justified and within its bands
- Verifies: DoD#1, DoD#10
- Behaviour: Given `HEADS_UP_CHART` and `FULL_RING_CHART`, Then: AA, KK and QQ are `raise` in every spot; `72o` is
  `fold` everywhere except BB limpers (`call`) and heads-up BTN unopened/BB blind-defence (any action);
  the full-ring unopened `R` sets nest as in §5; `C` appears in no unopened spot except SB and heads-up BTN; each
  spot's continue width is inside its §5 band; each spot has a non-borderline `R` and (except BB limpers) a
  non-borderline `F`; justification word minimums hold, and no spot justification is copied verbatim from
  `six-max.json`. The test prints each spot's raise % and continue %. Originality (no published chart used) is a
  manual review by the judge, from the build log's authoring notes.
- Verification: unit `tests/advice/reference-charts.test.ts::heads-up and full-ring charts hold the authoring bands`

### SPEC-11: Mapping internals and errors
- Verifies: AC#4, AC#8
- Behaviour: `referenceSizeOf` gives 2→heads-up, 3–7→6-max, 8–10→full-ring, and throws the A-6 message for 1 and
  11. `positionOf` follows §5 rule 1 for every seat at sizes 2–10, with button positions both lower and higher
  than other seats (wrap-around). At 6 seats the results match the old mapping. The A-3 limpers rule applies at
  7 and 10 seats. A 6-max `options.chart` at 9 seats throws the A-2 message. A capped BB at heads-up facing
  limpers is not reachable and needs no test.
- Verification: unit `tests/advice/preflop.test.ts::maps every seat at sizes 2 to 10`

### SPEC-12: Rock uses its 6-max range at every size
- Verifies: AC#11
- Behaviour: Given a full-ring view at `UTG+1` (unopened) with a class in Rock's 6-max `UTG unopened` range, Then
  `decideRock` returns `recommend(view).move` (the full-ring cell's legal move). With a class outside that range,
  it folds. At heads-up the BB facing limpers with a class outside Rock's 6-max `BB limpers` range checks.
- Verification: unit `tests/bots/rock.test.ts::Rock maps its 6-max range at other sizes`

### SPEC-13: 10-player pace with real TAG bots
- Verifies: AC#10
- Behaviour: Given the pace harness now uses the production advice worker (`pace-advice.worker.ts` deleted, no
  `tlh-test-pace-advice` marker left in `e2e/` or `src/`), When the locked `e2e/rapid-pace.spec.ts` test
  `at 10 players every bot action after the user folds shows within 300 ms` runs in Chromium, Then it passes.
- Verification: command `TLH_SLOW_TESTS=1 npx playwright test e2e/rapid-pace.spec.ts -g "at 10 players" && ! grep -rn "tlh-test-pace-advice\|pace-advice.worker" e2e src`

### SPEC-14: Checks, coverage, boundaries, CI
- Verifies: DoD#2, DoD#3, DoD#5, DoD#6, DoD#11
- Behaviour: `npm run lint`, `npm run typecheck` and `npm test` exit 0 (coverage thresholds in the toolchain test
  hold; the boundary tests prove `src/advice`/`src/bots` import no UI code). CI is green on `doit/TASK-7.6`.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-15: 10,000-hand playtests at the new sizes
- Verifies: DoD#7
- Behaviour: Running each command reports `Invariant violations: 0` and exits 0.
- Verification: command `npm run -s playtest -- --hands 10000 --size 2 && npm run -s playtest -- --hands 10000 --size 9 && npm run -s playtest -- --hands 10000 --size 10 --lineup mixed`

### SPEC-16: Not-applicable DoD items and docs
- Verifies: DoD#4, DoD#8, DoD#9, DoD#12, DoD#13
- Behaviour: The golden-spot suite (TASK-7.11) doesn't exist yet. No screen or dialog is added or changed (the e2e
  harness is test-only). No network requests are added (charts are static imports). The story doc is written and
  published to Backlog.md by the docs step.
- Verification: manual Judge confirms `git diff --stat main` touches no `src/ui/**` file, no `fetch(` was added
  under `src/`, and the story doc exists in Backlog.md.

## 7. Edge cases
- Busted sit-and-go seats: mapping counts dealt-in seats (A-1). Covered by SPEC-11 (sizes 2–10 by dealt-in count).
- Seats beyond the chart's earliest position (7- and 10-handed): SPEC-07, SPEC-11.
- An earliest-mapped seat facing limpers (no chart spot): A-3, SPEC-07, SPEC-11.
- Button wrap-around (button seat number higher than the others): SPEC-11.
- Capped fourth bet: SPEC-06. Free check for BB facing limpers at heads-up and full ring: existing legality rule;
  the no-fold validator rule covers it (SPEC-02 parse).
- A mismatched `options.chart`: A-2, SPEC-11. Dealt-in count outside 2–10: A-6, SPEC-11.
- Concurrency, permissions, interruption: N/A (pure functions; static data).

## 8. Security considerations
- Trust boundaries: the chart files are bundled, project-authored data validated at import by the existing
  validator (error echoes capped at 20 chars). No user input reaches them.
- No new dependencies, no network, no secrets, no logging of user data.
- Randomness: unchanged (bot draws use the existing seeded `botRandom`; the charts are deterministic).

## 9. Non-functional
- Chart parse at import: the two new files add about 7,900 cells. Target < 20 ms total, measured informally in
  SPEC-10's run (not a gated test).
- Every-push tests added by this story: ≤ 5 s each (SPEC-08 ≈ 1 s, SPEC-09 ≤ 5 s at 30 hands per preset and size).
  The locked TASK-6.6 AC#6 run moves to the slow group (D-6).
- Rapid pace: 10-player bot actions within 300 ms (SPEC-13, existing locked budget).
- `playtest:million -- --lineups`: measured once in the build (`time npm run -s playtest:million -- --lineups`
  locally), reported in the build log. CI escalation threshold 15 min (D-7).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run -s playtest -- --hands 2000 --size 9 --lineup mixed`
- New tests:
  - `tests/advice/table-sizes.acceptance.test.ts` → SPEC-01..07
  - `tests/playtest/all-sizes.acceptance.test.ts` → SPEC-08, SPEC-09
  - `tests/advice/reference-charts.test.ts` → SPEC-10
  - `tests/advice/preflop.test.ts` (updated) → SPEC-11; `tests/bots/rock.test.ts` (updated) → SPEC-12
- End-to-end scenario for the Judge: run `npm run -s playtest -- --hands 2000 --size 2`, `--size 8` and
  `--size 10 --lineup tough`. Confirm 0 violations and no `Line-up note`. Then run SPEC-13's Playwright command, and
  `npm run -s playtest:million -- --hands 900` (completes, 0 violations; the hash differs from TASK-6.9's baseline,
  as expected).

## 11. Open questions
None. Q-1–Q-5 are resolved in `doit/TASK-7.6/qa.md`: Q-1, Q-2 and Q-3 auto-accepted as recommended; Q-4 and Q-5
approved by the user. The locked-test edit to `tests/playtest/lineup.acceptance.test.ts` (TASK-6.6) is unlocked
for exactly the two D-6 changes.

## 12. Clarifications log
See `doit/TASK-7.6/qa.md`.
