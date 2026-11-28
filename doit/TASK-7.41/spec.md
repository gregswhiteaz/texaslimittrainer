# Spec: TASK-7.41 — Split the full-ring re-raise spots into own-raise-re-raised and re-raised-when-I-had-not-raised

Status: READY (approved 2026-11-28)
Task: TASK-7.41 · Parent/epic: TASK-7 (Get trustworthy advice) · Requirements: REQ-032.2, REQ-032.6 (as reworded by TASK-7.21, decision-4) · Dream: limit-holdem-trainer

## 1. Summary
TASK-7.40 split the 6-max re-raise spots with the TASK-7.21 A-2 rule. Full ring still sends every two-raise route
to one `re-raise` spot per seat. That spot today keeps 100% of the UTG+1, MP, LJ, HJ and CO opening ranges, and
LJ, HJ and CO also continue with hands they never open. This task brings the same split to full ring:
- the 9 full-ring `re-raise-not-mine` spots are added (41 → 50 spots);
- 9 new grids are authored;
- the 9 `re-raise` grids are re-justified for own-raise routes only, and trimmed to the share the user approves;
- full-ring golden spots are added for the new situation.

The work reuses the 7.40 situation id, label and context sentence. It also adds the missing check that a not-mine
fourth bet caps a `raise` cell to `call`, at 6-max and full ring (AC#6). The user signs off the 18 spots from a
builder-written `doit/TASK-7.41/signoff.md` before code review.

## 2. Scope
- In scope:
  - `APPLICABLE_SPOTS['full-ring']` gains 9 `re-raise-not-mine` spots (UTG, UTG+1, MP, LJ, HJ, CO, BTN, SB, BB),
    placed directly after the 9 `re-raise` spots (D-2).
  - `src/advice/charts/full-ring.json`:
    - 9 new grids and justifications;
    - the 9 `re-raise` justifications rewritten for own routes;
    - `re-raise` grid edits under the Q-1 share rule;
    - the chart-level text extended.
  - 3 full-ring golden spots (A-3).
  - One new acceptance file. Unit bands in `tests/advice/reference-charts.test.ts`. The locked re-pins in §5.
  - `doit/TASK-7.41/changes.md` (change list, 9-max TAG before/after table) and `doit/TASK-7.41/signoff.md`
    (SPEC-09).
- Not doing:
  - Any change to `heads-up.json`, to `six-max.json`, to the heads-up or 6-max spot lists, or to `situationOf`'s
    logic. The D-3 fallback from TASK-7.40 already handles full ring once the spots exist.
  - New or changed `PREFLOP_CONTEXT` or `SITUATION_LABELS` text (Q-4: keep word for word).
  - `rock.json` and `tag.json`. Rock reads 6-max spots at every size, and TAG does not mix re-raise spots (A-1, A-2).
  - Any full-ring spot other than the 18 re-raise spots. The BTN limpers and BB blind-defence dominance
    inversions (§3) belong to TASK-7.38.
  - Blind defence split (TASK-7.42), opponent ranges (`src/advice/ranges*`), chart format, `chart:print` code, UI,
    e2e.
  - Any 100,000-hand run outside the opt-in `npm run test:slow` group.
  - Backlog notes. The orchestrator records the sign-off.
- Scope budget: files=14, lines=750   (full-ring.json ~220, preflop-spots.json ~45, new acceptance test ~280,
  reference-charts.test.ts ~6, preflop-chart.ts 1, preflop.test.ts ~6, 4 locked re-pins ~30, changes.md ~40;
  signoff.md is a work-folder file, not counted)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Rock is not changed. At 8–10 seats Rock now reads its 6-max `re-raise-not-mine` range (AA KK QQ AKs AKo) for cold spots, instead of the `re-raise` range (CO, BTN and BB also had JJ, and BTN also had AQs). | yes | `src/bots/rock.ts:34` calls `chartSpotOf(view, '6-max')`, which uses `situationOf(view)` at the view's size. The split therefore reaches Rock automatically, as TASK-7.40 A-3 foresaw. The ranges exist and are validated (`src/bots/styles/rock.json`). | Force `re-raise` for Rock at full ring (needs code; inconsistent) |
| A-2 | TAG gets no mixing for full-ring `re-raise-not-mine`. | yes | `tag.json` has no `preflop-re-raise` mix either (`src/bots/styles/tag.json:8-28`). Same as TASK-7.40 A-4 (`src/bots/tag.ts:81`). | Add a mix |
| A-3 | 3 golden spots, appended: `fr-co-re-raise-not-mine-<fold hand>` (route F16, fold), `fr-bb-re-raise-not-mine-<pair>` (F19, call), `fr-btn-re-raise-not-mine-aa` (F17, raise). The builder picks the hands from non-borderline cells. The 8 existing full-ring `re-raise` golden spots stay byte-identical, and their cells must keep their action (authoring constraint, §5 rule 6). | yes | AC#4. The locked coverage test (`tests/golden/preflop.acceptance.test.ts:111-120`) requires ≥ 1 per size and situation. All 8 existing spots are own-raise routes (TASK-7.40 §3 probe). | 1 spot only |
| A-4 | The 9-max before/after figures come from the opt-in `tests/advice/size-ranges-playtest.acceptance.test.ts` (TASK-7.26; it logs `TAG full-ring <stat>`). "Before" is run on the base commit and "after" on the final chart, both into `changes.md` and the sign-off. The figures are informative: the test only logs them (`:44-60`). | yes | This is the existing all-TAG 9-seat run, the full-ring twin of TASK-7.40 AC#8. | Add a new slow test |
| A-5 | Not-mine justifications state that a fourth bet without our own raise lands here and that a `raise` then becomes a call. They must not copy any six-max text, which the unit check `tests/advice/reference-charts.test.ts:85-88,146` enforces. | yes | Same as the 6-max §5 rule 5 | — |

## 3. Current system
- **Spot list.** `APPLICABLE_SPOTS['full-ring']` (`src/advice/preflop-chart.ts:78-85`) has 41 spots: re-raise has 9
  (`:83`) and there is no `re-raise-not-mine`. The `Situation` type already has `re-raise-not-mine` (`:10`).
- **Routing already done (codebase).** `situationOf` (`src/advice/preflop.ts:106-131`) returns
  `re-raise-not-mine` when `raises > 1`, none of the raises is the viewer's, and the size's spot list contains that
  situation (`:122-127`, TASK-7.40 D-3). So the only code change is the spot list. The doc comment (`:104-105`)
  already describes this.
- **Cap logic (AC#6, codebase).** `recommendPreflop` turns a `raise` cell into `call` when
  `view.betCount >= STREET_BET_CAP` (`src/advice/preflop.ts:155-160`, `STREET_BET_CAP = 4` at
  `src/engine/hand.ts:134`). Preflop `betCount` starts at 1 (`src/engine/hand.ts:296`). Probed on today's code:
  - 6-max BB facing `r(4,8) r(5,12) r(6,16) f(1) f(2)` with AA gives `BB re-raise-not-mine`, cell `raise`,
    advice `call`. **6-max already behaves correctly**; only the assertion is missing.
  - The 9-seat equivalent gives `BB re-raise` → `call` today, and `re-raise-not-mine` → `call` after the split.
- **Text (codebase).** `PREFLOP_CONTEXT['re-raise-not-mine']` and `SITUATION_LABELS['re-raise-not-mine']` exist
  (`src/advice/explanations.ts:156,223`, approved in TASK-7.40 Q-1/Q-2). Spot justifications are shown only by
  `chart:print` (`src/advice/chart-print.ts:61-65`), not in the app.
- **Today's full-ring re-raise shares** (scratch probe with `comboCount`; C = re-raise continue combos within the
  open range, O = unopened raise combos):

  | Seat | C/O | Share | Continues outside the open range |
  |---|---|---|---|
  | UTG | 104/122 | 0.852 | — |
  | UTG+1 | 142/142 | 1.000 | — |
  | MP | 176/176 | 1.000 | — |
  | LJ | 206/206 | 1.000 | A3s A2s J9s 98s 33 |
  | HJ | 244/244 | 1.000 | Q9s A9o 22 |
  | CO | 326/326 | 1.000 | Q8s J8s T8s 97s 65s |
  | BTN | 358/494 | 0.725 | — |
  | SB | 282/342 | 0.825 | 87s |
  | BB | kept 118/118 raised | 1.000 | ⊆ blind-defence |

- **One-raise widths** (the subset parents for the new grids): UTG raise 4.7%, UTG+1 4.2%, MP 5.1%, LJ 5.1%, HJ 5.7%,
  CO 6.2%, BTN 8.1%, SB blind-defence 9.2%, BB blind-defence 36.3%. The `re-raise` continue set already contains every
  one-raise continue class at every seat.
- **Dominance (A-4 levels).** All 9 full-ring `re-raise` spots are consistent today. Only BTN limpers (2) and BB
  blind-defence (13) have inversions, which are out of scope.
- **Probe of affected tests (codebase).** I built a scratch worktree with the 9 spots, draft grids and 80–90%-trimmed
  re-raise grids, then ran `vitest run`. 5 tests failed and 1,567 passed:
  - the 4 locked files in §5 "Locked re-pins";
  - the unlocked `tests/advice/reference-charts.test.ts` (it needs the 9 new band keys).

  No seeded bot example shifted: calling-station, maniac and tag run at 6 seats (`tests/bots/maniac.acceptance.test.ts:67`,
  `calling-station.acceptance.test.ts:63`), and all-sizes, bot-results, playtest and games passed. The opt-in slow group was
  stopped before it finished. On the probe chart, 26 slow files passed with no failure, including games, bot-results,
  playtest, explanations, check-styles, check-styles-three-seats, check-advice, style-bands, tag-playtest,
  healthy-ranges-tag and tag-short-handed-playtest. Not finished: `size-ranges-playtest` (the 9-max TAG run) and the
  7-seat part of `small-table-ranges-playtest`. So no slow test is known to shift; the builder's SPEC-10 full slow run
  covers the rest, under D-7.
- **What changed since TASK-7.21 was written:**
  - TASK-7.40 added the situation, its fallback, its text, the Rock ranges and the 6-max cap route R5.
  - TASK-7.43/7.44 (`resizeRange`, relative PFR) changed observed opponent ranges only. `src/advice/ranges.ts`
    imports `positionOf`/`referenceSizeOf` but no situation or chart (`:13`), so they are unaffected.
- Existing code to reuse:
  - `tests/advice/re-raise-split.acceptance.test.ts` helpers (`cardsOf`, `viewAt`, `f/c/r`, `checkAllClasses`,
    `notMineProblems` pattern) → copy into the new file (tests do not import each other).
  - `tests/advice/six-max-chart.acceptance.test.ts` `reRaiseShare`, `level`, `dominancePairs` → copy for full ring.
  - `npm run chart:print full-ring` → the sign-off blocks. Its output on the base commit is saved first for the
    "before" columns.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Rule A-2 at full ring, using the existing `situationOf`, with no code change beyond the spot list | — | TASK-7.21 decision-4; `src/advice/preflop.ts:122-127` | yes | user (TASK-7.21 Q-1) |
| D-2 | Full-ring order: unopened 8, limpers 8, raise 7, raise-and-calls 7, re-raise 9, **re-raise-not-mine 9 (UTG, UTG+1, MP, LJ, HJ, CO, BTN, SB, BB)**, blind-defence 2 = 50 | Append at end | Same as 6-max D-2 | no | n/a |
| D-3 | Label and context reuse the TASK-7.40 strings word for word; `PREFLOP_CONTEXT['re-raise']` and `SITUATION_LABELS['re-raise']` also stay word for word | New full-ring wording; reword `re-raise` as "your raise was re-raised" | Approved in TASK-7.40 Q-1/Q-2; AC#3 then needs no new text; locked labels test untouched | yes | user (TASK-7.40 Q-1/Q-2; TASK-7.41 Q-4) |
| D-4 | Own-raise share rule for the 9 `re-raise` spots = §5 rule 1 (TASK-7.19 rule: 80–90% of the opening range, nothing outside it; BB ≥ 80% of its raised set, ⊆ blind defence) | 85–100%; keep today's shares minus outside-open hands | AC#2; consistent with 6-max | yes | user (Q-1) |
| D-5 | Authoring rule for the 9 `re-raise-not-mine` grids = §5 rule 2 (TASK-7.40 Q-3 rule plus strictly fewer combos than the one-raise spot) | Q-3 rule exactly; share of the parent | Full-ring one-raise spots are only 4.2–8.1% wide | yes | user (Q-2) |
| D-6 | One sign-off before code review from `signoff.md`, covering the 18 re-raise spots. The orchestrator adds a note on TASK-7.38 that those 18 are reviewed; 7.38 keeps the other 32 full-ring spots and heads-up | All 50 full-ring spots here; full ring + heads-up here | AC#5; keeps this story's scope | yes | user (Q-3) |
| D-7 | Locked re-pins in §5 are pre-approved. Any seeded-example shift found later follows the TASK-7.40 A-8 method (replace expected values, keep check count) | Stop and ask per file | Avoids the 7.40 builder block | yes | user (Q-3) |

## 5. Design

### Files to create / modify
- `src/advice/preflop-chart.ts` — add `...spotsOf('re-raise-not-mine', [...FULL_RING_OPENERS, 'SB', 'BB'])` after the
  full-ring re-raise line (D-2).
- `src/advice/charts/full-ring.json` — 9 new spots after `BB re-raise`; 9 `re-raise` texts and grids revised; the chart
  text's "Once our own raise is re-raised…" sentence extended to say that, when we have not raised, we continue only
  with hands strong against one raise, and fewer of them. The "nine and ten seats" phrase stays
  (`tests/advice/reference-charts.test.ts:165`).
- `tests/golden/preflop-spots.json` (locked, TASK-7.11) — append the 3 A-3 spots.
- `tests/advice/full-ring-re-raise-split.acceptance.test.ts` (new) — SPEC-01 to SPEC-06.
- `tests/advice/reference-charts.test.ts` — `FR` bands for the 9 new keys (from Q-2), and re-raise bands if Q-1 needs
  them.
- `tests/advice/preflop.test.ts` — one full-ring `situationOf` unit case (cold → `re-raise-not-mine`).
- Locked re-pins (below).
- `doit/TASK-7.41/changes.md`, `doit/TASK-7.41/signoff.md` — work-folder files.

### Components, interfaces and data
- No signature changes. Chart entry shape as today: `{ position, situation: "re-raise-not-mine", justification (≥ 15
  words), grid: 13 rows }`.

### Rules and algorithms
Routes at 9 seats, button 1 (SB 2, BB 3, UTG 4, UTG+1 5, MP 6, LJ 7, HJ 8, CO 9, BTN 1). Amounts: open 8, 3-bet 12,
4-bet 16. `c(seat, n)` adds n chips. All were probed on the scratch build and give the "Expected" column:

| # | Steps before hero | Hero | Expected |
|---|---|---|---|
| F1 | r4 r5 f6 f7 f8 f9 f1 f2 f3 | 4 | UTG re-raise |
| F2 | f4 r5 r6 f7 f8 f9 f1 f2 f3 | 5 | UTG+1 re-raise |
| F3 | f4 f5 r6 r7 f8 f9 f1 f2 f3 | 6 | MP re-raise |
| F4 | f4 f5 f6 r7 r8 f9 f1 f2 f3 | 7 | LJ re-raise |
| F5 | f4–f7 r8 r9 f1 f2 f3 | 8 | HJ re-raise |
| F6 | f4–f8 r9 r1 f2 f3 | 9 | CO re-raise |
| F7 | f4–f9 r1 r2 f3 | 1 | BTN re-raise |
| F8 | f4–f9 f1 r2 r3 | 2 | SB re-raise |
| F9 | f4–f9 f1 c2(2) r3 r2 | 3 | BB re-raise |
| F10 | r4 f5–f8 r9 f1 f2 f3 r4(16) | 9 | CO re-raise; AA cell raise → advice call |
| F11 | c4(4) r5 r6 f7 f8 f9 f1 f2 f3 | 4 | UTG re-raise-not-mine |
| F12 | r4 c5(8) f6–f9 f1 f2 r3 c4(4) | 5 | UTG+1 re-raise-not-mine |
| F13 | r4 r5 | 6 | MP re-raise-not-mine |
| F14 | r4 f5 r6 | 7 | LJ re-raise-not-mine |
| F15 | f4 r5 f6 r7 | 8 | HJ re-raise-not-mine |
| F16 | r4 f5–f8 c9(8) f1 f2 r3 c4(4) | 9 | CO re-raise-not-mine |
| F17 | f4–f7 r8 r9 | 1 | BTN re-raise-not-mine |
| F18 | r4 r5 f6–f9 f1 | 2 | SB re-raise-not-mine |
| F19 | r4 r5 f6–f9 f1 f2 | 3 | BB re-raise-not-mine |
| F20 | r4 r5 r6(16) f7 f8 f9 f1 f2 | 3 | BB re-raise-not-mine; AA raise → call (AC#6) |
| F21 | 6 seats: r4 r5 r6(16) f1 f2 | 3 | BB re-raise-not-mine; AA raise → call (AC#6) |
| F22 | 8 seats: r4 r5 f6 f7 | 8 | CO re-raise-not-mine |
| F23 | 10 seats: r4 r5 f6 f7 f8 | 9 | HJ re-raise-not-mine |
| F24 | 10 seats: c4(4) c5(4) r6 r7 f8 f9 f10 f1 f2 f3 f4 | 5 | UTG re-raise-not-mine (second UTG seat) |

Authoring rules (approved in Q-1/Q-2):
1. Own `P re-raise`, for P in UTG to BTN and SB: C/O in [0.80, 0.90] of `P unopened` raise combos, and no continue
   outside the open range. BB: ≥ 80% of its raised set (BB limpers ∪ BB blind-defence raises) kept, and continue ⊆ BB
   blind-defence continue. Raises only from {AA, KK, QQ, JJ, AKs, AKo, AQs}.
2. Not-mine `P re-raise-not-mine`: continue ⊆ continue(`P raise`), or `P blind-defence` for SB/BB, with strictly fewer
   combos. Raises only from the premium set, and AA, KK and QQ are `R`. Width: UTG–SB in [2, 8]%, BB in [4, 16]%.
3. All 18 spots: no A-4 dominance inversion; 72o folds; ≥ 1 firm `R` and ≥ 1 firm `F`; alternatives only on borderline
   cells; ≥ 15 words; text not copied from six-max (`tests/advice/reference-charts.test.ts` checks).
4. Each `re-raise` text describes only own routes (our open, isolation raise or 3-bet re-raised; a fourth bet after our
   own raise → call). Each not-mine text is true for every route into it: limped then two raises; called then 3-bet;
   cold (open + 3-bet before us); for the blinds, cold or completed/called then two raises; and the capped fourth bet.
5. Existing golden spots: the 8 full-ring `re-raise` golden cells (`fr-utg-re-raise-aks` raise, `-99` call,
   `fr-mp-re-raise-kqs` call, `fr-co-re-raise-kk` raise, `-jts` call, `fr-btn-re-raise-qto` call, `fr-sb-re-raise-qq`
   raise, `fr-bb-re-raise-ajs` call) keep their action and stay non-borderline.

### Locked tests (re-pins; owners from every `doit/*/state.json` `locked_tests`)
Found by the scratch probe (§3). Each edit replaces the expected values only and keeps the number of checks:

| File:line | Owner(s) | Change |
|---|---|---|
| `tests/advice/chart-print-sizes.acceptance.test.ts:102` | TASK-7.27 | `checkReview('full-ring', 41)` → 50 |
| `tests/advice/table-sizes.acceptance.test.ts:36-43,137,144-148` | TASK-7.6 | 41 → 50. The full-ring reachable situation set gains `re-raise-not-mine` (heads-up unchanged). `:232-266` is unchanged: the UTG capped route is an own raise. |
| `tests/advice/re-raise-split.acceptance.test.ts:233-297` (AC#6 test) | TASK-7.40 | The two 9-seat routes expect `re-raise-not-mine` and its context sentence. The 9-seat sweep expects `seen.has('re-raise-not-mine')` true (2 seats still false). Full-ring length 41 → 50. The `.some(re-raise-not-mine)` check expects false for heads-up and true for full ring. Title becomes `AC#6 heads-up advice is unchanged and full ring reads the split (re-pinned by TASK-7.41)`. |
| `tests/golden/preflop-spots.json` | TASK-7.11 | Append the 3 A-3 spots. Existing entries are byte-identical. |

Checked and expected unchanged (if one fails, re-pin it under the D-7 standing rule and list it in the sign-off; do not
loosen it): `tests/golden/preflop.acceptance.test.ts` (TASK-7.11/7.40); `tests/advice/labels.acceptance.test.ts`
(TASK-8.5); `tests/advice/preflop.acceptance.test.ts` (TASK-7.2, 6-max only); `tests/advice/six-max-chart.acceptance.test.ts`
(TASK-7.19/7.40); `tests/bots/rock.acceptance.test.ts` (TASK-6.5/7.40); `tests/bots/tag.acceptance.test.ts` (TASK-6.1);
`tests/bots/calling-station.acceptance.test.ts` (TASK-6.3); `tests/bots/maniac.acceptance.test.ts` (TASK-6.4/6.25);
`tests/playtest/games.acceptance.test.ts` (TASK-1.16); `tests/playtest/all-sizes.acceptance.test.ts` (TASK-7.6);
`tests/playtest/bot-results.acceptance.test.ts` (TASK-6.10); `tests/playtest/check-advice.acceptance.test.ts`
(TASK-7.15); `tests/playtest/playtest.acceptance.test.ts` (TASK-1.6); `tests/golden/graded-lines.acceptance.test.ts`
(TASK-7.36). Slow group (not yet probed): `tests/advice/explanations.acceptance.test.ts` (TASK-7.10),
`tests/advice/size-ranges-playtest.acceptance.test.ts` (TASK-7.26), `tests/playtest/check-styles*.acceptance.test.ts`
(TASK-6.11/6.25/7.46), `tests/bots/style-bands.acceptance.test.ts` (TASK-6.16/6.17/6.25),
`tests/bots/tag-playtest.acceptance.test.ts` (TASK-6.1), `tests/stats/healthy-ranges-tag.acceptance.test.ts` (TASK-10.3).

Standing rule for seeded-example shifts (D-7, as TASK-7.40 A-8):
- Locate the same view in the new decision list, then update the index, seed, draw or replay code, with a
  `before TASK-7.41` note.
- Any `> 0` style check keeps its check, using the smallest seed or hand-count change that satisfies it again.
- No assertion is dropped or widened.
- Each re-pin is listed in signoff.md §6.

### Error handling and configuration
- A missing or invalid new spot makes `parseChart` throw `ChartValidationError` at import (existing behaviour), for
  example `full-ring chart: missing spot CO re-raise-not-mine`.
- No configuration and no new dependencies.

## 6. Behaviour specification

### SPEC-01: Full-ring two-raise routes read the own-raise or the not-my-raise spot
- Verifies: AC#1
- Behaviour: Given routes F1–F19 and F22–F24 (§5), When `recommendPreflop` runs for the hero with each of the 169
  classes, Then:
  - `position` and `situation` equal "Expected";
  - `situationOf(view)` agrees;
  - `cell` equals `chartCell(FULL_RING_CHART, position, situation, hc)`.

  For F10, AA has cell `raise` and advice `call`.
- Verification: acceptance `tests/advice/full-ring-re-raise-split.acceptance.test.ts::AC#1 full-ring re-raise routes read the own-raise or the not-my-raise spot`

### SPEC-02: The full-ring chart has 50 complete spots in order
- Verifies: AC#2
- Behaviour: Given `FULL_RING_CHART`, Then:
  - `APPLICABLE_SPOTS['full-ring']` and the chart spots both equal the 50 pairs of D-2, in order;
  - each spot has all 169 classes;
  - each new justification has ≥ 15 words;
  - `chart:print full-ring` prints `full-ring chart: 50 spots`.
- Verification: acceptance `tests/advice/full-ring-re-raise-split.acceptance.test.ts::AC#2 the full-ring chart has 50 spots with all 169 classes`

### SPEC-03: Own-raise spots keep the approved share of the opening range
- Verifies: AC#2
- Behaviour: Given the revised chart, Then for each of UTG, UTG+1, MP, LJ, HJ, CO, BTN and SB, C/O is in [0.80, 0.90] (Q-1)
  and no class continues outside the open range. BB keeps ≥ 80% of its raised set and stays ⊆ BB
  blind-defence. Only premium hands raise. The test prints `P: C/O = c/o (share)` per seat. Mutation: today's base
  `MP re-raise` cells (share 1.000) fail the band.
- Verification: acceptance `tests/advice/full-ring-re-raise-split.acceptance.test.ts::AC#2 own-raise spots continue with the approved share of the opening range`

### SPEC-04: Not-my-raise spots follow the Q-2 rule
- Verifies: AC#2
- Behaviour: Given each `P re-raise-not-mine`, Then §5 rule 2 holds. Failures are listed as
  `<spot>: <hc> continues but folds in <one-raise spot>`, or as the width or raise problem. Also:
  - all 18 re-raise spots have no A-4 dominance inversion;
  - mutation: copying the `CO re-raise` grid into `CO re-raise-not-mine` fails rule 2.
- Verification: acceptance `tests/advice/full-ring-re-raise-split.acceptance.test.ts::AC#2 not-my-raise spots continue only with hands that continue against one raise`

### SPEC-05: Shown text is the already-approved text
- Verifies: AC#3
- Behaviour: Given F13 with A9o, When advised, Then:
  - the explanation starts with the filled `PREFLOP_CONTEXT['re-raise-not-mine']` (the exact TASK-7.40 Q-2 string);
  - it has ≤ 3 sentences;
  - `chartBasisText` does not contain the label;
  - the `PREFLOP_CONTEXT` and `SITUATION_LABELS` keys and strings equal the TASK-7.40 values (Q-4: unchanged).
- Verification: acceptance `tests/advice/full-ring-re-raise-split.acceptance.test.ts::AC#3 full-ring not-my-raise text is the approved wording`

### SPEC-06: Not-mine fourth bet is capped to call at 6-max and full ring
- Verifies: AC#6
- Behaviour: Given F20 (9 seats) and F21 (6 seats), When advised with AA, Then:
  - `situation` is `re-raise-not-mine`;
  - `view.betCount` is 4;
  - `cell.action` is `raise`;
  - `action` is `call`, with `move` a call of 4.

  For every class whose cell is `raise` in that spot, the advice is `call`.
- Verification: acceptance `tests/advice/full-ring-re-raise-split.acceptance.test.ts::AC#6 a not-my-raise fourth bet caps a raise cell to call`

### SPEC-07: Golden spots cover both full-ring re-raise situations
- Verifies: AC#4
- Behaviour: Given the 3 A-3 spots appended, When the locked golden tests run, Then each new spot's `situationOf` is
  `re-raise-not-mine` and its action matches the chart. The coverage test finds `full-ring re-raise` and
  `full-ring re-raise-not-mine`. The 8 existing full-ring `re-raise` spots still pass, unchanged.
- Verification: acceptance `tests/golden/preflop.acceptance.test.ts::AC#4 at least 100 spots covering every reference size and chart situation`

### SPEC-08: All checks pass with only the listed locked edits
- Verifies: AC#5
- Behaviour: lint, typecheck and `npm test` exit 0. `git diff --stat <base> -- tests e2e` shows the locked files in §5
  only, plus any listed under D-7. `heads-up.json` and `six-max.json` are unchanged.
- Verification: command `npm run lint && npm run typecheck && npm test && git diff --stat $(jq -r .base_commit doit/TASK-7.41/state.json) -- tests e2e src/advice/charts/heads-up.json src/advice/charts/six-max.json`

### SPEC-09: Sign-off package and user sign-off before review
- Verifies: AC#5, AC#2
- Behaviour: Given the gate is green, When the builder finishes, Then `doit/TASK-7.41/signoff.md` exists with, in order:
  1. The base and final commits, and the chart-level text before and after.
  2. The verbatim `npm run chart:print full-ring` blocks of the 18 spots: the 9 `re-raise-not-mine`, then the 9
     `re-raise`.
  3. A changed-cells table for the 9 `re-raise` spots: `spot | hand | before | after`.
  4. The own-raise shares before → after per seat (AC#2): `P: C/O before (share) → after (share)`, the
     outside-open classes removed, and BB kept/raised.
  5. The not-mine widths beside the Q-2 band and beside the one-raise parent's width.
  6. Bot and playtest shifts:
     - every locked or unlocked test re-pin made (file, owner, before → after), or "None";
     - the 9-max all-TAG before/after table (VPIP, PFR, aggression, WTSD, W$SD vs `HEALTHY_RANGES['full-ring']`, A-4);
     - the Rock-at-full-ring change (A-1).
  7. The new golden spots (id, hand, route, action).
  8. The TASK-7.38 coverage statement per Q-3: the 18 re-raise spots are signed off here; 7.38 keeps the other 32
     full-ring spots and the 6 heads-up spots.

  The orchestrator shows it in one question (sign off / sign off with tweaks / request changes). Tweaks are applied
  and the gate and package re-run before review. A dated sign-off note goes on TASK-7.41; AC#5 is ticked only after it.
- Verification: manual Orchestrator checks the 8 sections and the task note before Done.

### SPEC-10: 9-max TAG figures before and after
- Verifies: AC#5
- Behaviour: Given the base and then the final chart, When the opt-in slow run executes, Then it passes and `changes.md`
  holds the before/after table for `TAG full-ring <stat>` (A-4). It is not added to `npm test` or CI. Then the rest of
  `npm run test:slow` is run once on the final chart and passes, with any re-pins under D-7.
- Verification: command `TLH_SLOW_TESTS=1 npx vitest run tests/advice/size-ranges-playtest.acceptance.test.ts && npm run test:slow`

### SPEC-11: Justifications agree with grids and routes
- Verifies: AC#2
- Behaviour: For each of the 18 texts and the chart text:
  - no sentence is false for a route in §5 rule 4;
  - every hand or group named under an action has that action;
  - the `re-raise` texts no longer claim cold or called-then-3-bet routes;
  - the wording is original.
- Verification: manual Reviewer and judge walk the 18 spots against the routes and grids, recording pass or fail per spot.

## 7. Edge cases
- Capped fourth bet, own (F10) and not mine (F20, F21): SPEC-01, SPEC-06.
- 8 and 10 seats, including the second UTG seat at 10: SPEC-01 (F22–F24).
- Voided raises (TASK-10.17): unchanged logic. The `situationOf` filter is shared (`src/advice/preflop.ts:110-117`).
  Covered by the existing locked `preflop-voided-raise` test (6-max); N/A for new behaviour.
- Heads-up cannot reach not-mine (TASK-7.40 D-3): the re-pinned 7.40 AC#6 sweep at 2 seats.
- Invalid input, concurrency, permissions: N/A. Shipped JSON is validated at import.

## 8. Security considerations
N/A:
- no untrusted input (shipped, validated JSON);
- no new dependencies;
- no randomness added;
- no new imports across the advice boundary.

## 9. Non-functional
- Parsing 50 × 169 cells is negligible.
- The new acceptance test needs no playtest sweep, only 22 routes × 169 classes, so it runs in well under a second.
- Any 100,000-hand run is opt-in only (`npm run test:slow`).
- Coverage stays ≥ 90%.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run chart:print full-ring`
- New tests: `tests/advice/full-ring-re-raise-split.acceptance.test.ts` → SPEC-01 to SPEC-06. The re-pinned locked
  tests → SPEC-02, SPEC-07, SPEC-08. The slow run → SPEC-10.
- End-to-end for the Judge:
  1. Run `npm run chart:print full-ring` and confirm 50 spots, each not-mine spot narrower than its one-raise parent,
     and the own shares inside the Q-1 band.
  2. Run `npm test`.
  3. Run the SPEC-10 slow command.
  4. Check signoff.md and the sign-off note.

## 11. Open questions
None. Q-1 to Q-4 were answered on 2026-11-28 (`doit/TASK-7.41/qa.md`): all Recommended. They are folded into D-3
to D-7, §5 rules 1–2, SPEC-03, SPEC-05 and SPEC-09.

## 12. Clarifications log
See `doit/TASK-7.41/qa.md`.
