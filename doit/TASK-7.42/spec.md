# Spec: TASK-7.42 — Split blind defence by an early or a late raiser at 6-max and full ring

Status: READY (approved 2026-11-28)
Task: TASK-7.42 · Parent/epic: TASK-7 (Get trustworthy advice) · Requirements: REQ-032.2 (as reworded by TASK-7.21, `dreams/limit-holdem-trainer/requirements.md:590`) · Dream: limit-holdem-trainer

## 1. Summary
Today the small blind and big blind read one `blind-defence` spot for any single raise. So the 6-max BB defends the
same 46.3% against a UTG open (16.0% range) as against a button open (40.6%). This task adds a new situation,
`blind-defence-early`, for SB and BB at 6-max and full ring (+2 spots each: 6-max 32 → 34, full ring 50 → 52;
heads-up unchanged). It authors 4 new grids, which are narrower than the late-raiser grid, and re-justifies the 4
existing `blind-defence` grids as the vs-late-raiser spot. It also adds a Rock range for each new 6-max spot, golden
spots, a label and a context sentence. The user signs off the 8 spots from a builder-written sign-off package before
code review.

## 2. Scope
- In scope:
  - `Situation` gains `blind-defence-early`. `EARLY_RAISERS` per size. `APPLICABLE_SPOTS` 6-max and full ring gain
    `SB blind-defence-early` and `BB blind-defence-early`, placed directly before the two `blind-defence` spots (D-2).
  - `situationOf` routes a single raise faced by SB/BB by the raiser's seat (§5 rules).
  - `six-max.json`, `full-ring.json`: 2 new grids each plus justifications. The 4 `blind-defence` justifications are
    rewritten for late raisers. The chart-level text gets one clause on the split.
  - `PREFLOP_CONTEXT` and `SITUATION_LABELS` entries for the new situation (Q-2, Q-3).
  - `rock.json`: 2 new 6-max Rock ranges (Q-5). TAG blind-defence mixing also applies to the early spot (A-1).
  - Golden spots: 3 existing entries re-pinned to the new situation and 2 appended (A-2, A-3).
  - One new acceptance test file, unit test updates, the locked re-pins in §5, the standing seeded re-pins (D-7).
  - `doit/TASK-7.42/changes.md` and the sign-off package (SPEC-09).
- Not doing:
  - `heads-up.json` or the heads-up spot list. Heads-up has one possible raiser, so `EARLY_RAISERS['heads-up']` is empty.
  - Any grid other than the 4 new ones; the 4 `blind-defence` grids keep their cells (D-5). In
    particular, no `re-raise`, `re-raise-not-mine`, `raise` or `limpers` grid changes. The full-ring BB blind-defence
    dominance inversions stay with TASK-7.38.
  - A per-raiser split, or a raiser split of the non-blind `raise` spots (TASK-7.21 D-2 chose blind defence only).
  - `src/advice/ranges*` (opponent ranges), the chart file format, `chart:print` code, UI, e2e, `SPOT_TYPES` and
    `tag.json` (A-1).
  - New `PREFLOP_CONTEXT`/`SITUATION_LABELS` text for any other situation (D-4).
  - Any 100,000-hand run outside the opt-in `npm run test:slow` group.
  - Backlog notes. The orchestrator records the sign-off.
- Scope budget: files=32, lines=850   (six-max.json + full-ring.json ~110, rock.json ~12, code ~30 across
  preflop-chart.ts/preflop.ts/explanations.ts/tag.ts, golden ~30, new acceptance test ~320, unit tests ~50, 12 locked
  re-pin files ~90, ≤ 4 seeded re-pin files ~40, changes.md ~50; the sign-off package is outside the repo)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | TAG mixes in `blind-defence-early` with the existing `preflop-blind-defence` entry (75/25). This is a one-line mapping in `src/bots/tag.ts:82`. `SPOT_TYPES` and `tag.json` stay unchanged. | yes | Today TAG mixes in every blind defence (`src/bots/styles/tag.json:27-29`). Keeping that avoids shifting the TAG mixed-spot counts in check-styles and style-check-short-handed (`tests/playtest/style-check-short-handed.test.ts:14`: "blind-defence 9/3" in 200 hands). The probe showed the locked `tests/bots/tag-mixing.acceptance.test.ts` still passes. | No mixing in the early spot (as `re-raise-not-mine`, TASK-7.40 A-4); a new `preflop-blind-defence-early` spot type |
| A-2 | The 3 golden spots whose raiser is early keep their `id` and every other field. Only `situation` changes to `blind-defence-early`: `6max-sb-blind-defence-qq` (UTG raise), `fr-sb-blind-defence-ako` (LJ), `fr-sb-blind-defence-k9s` (UTG). Their actions (raise, raise, fold) must hold in the new grids. | yes | `src/advice/golden.ts:428-430` requires `situation` = `situationOf`. Their justifications already describe an early raiser. The ids appear in locked test titles (`tests/golden/preflop.acceptance.test.ts:94`). | Rename the ids |
| A-3 | 2 golden spots are appended: `6max-bb-blind-defence-early-<hand>` (UTG raise) and `fr-bb-blind-defence-early-<hand>` (MP raise). Each uses a non-borderline cell whose action differs from the same class in `BB blind-defence`, so that it shows the split. | yes | AC#4 (≥ 1 per new situation and size). The SB side is already covered by A-2. | One spot per size only from A-2 |
| A-4 | The before/after TAG figures are informative. They come from the opt-in logs `tests/bots/tag-playtest.acceptance.test.ts` (6-max) and `tests/advice/size-ranges-playtest.acceptance.test.ts` (`TAG full-ring <stat>`), run on the base commit and on the final build. They go into `changes.md` and the sign-off package. | yes | Same method as TASK-7.41 A-4 | New slow test |
| A-5 | The routing helpers in the new test copy `viewAt`/`cardsOf` from `tests/advice/full-ring-re-raise-split.acceptance.test.ts`. Call and raise amounts come from `view.legalActions`, never from blind sizes. | yes | Tests do not import each other; amounts stay right if the stakes change | — |

## 3. Current system
- **Routing (codebase).** `situationOf` (`src/advice/preflop.ts:106-134`):
  - It ignores blinds and voided raises (`:107-115`), and counts only `raise` records (`:116`).
  - Limps before a raise are not raises. So "limpers + one raise" (an isolation raise) is exactly one raise, and SB/BB
    get `blind-defence` whoever raised (`:127-128`). Callers after the raise do not change this.
  - The raiser's seat is never read.
- **Position of another seat (codebase).** `positionOf({ ...view, seat }, size)` is already used for opponents at
  `src/advice/ranges.ts:680`. `positionOf` (`src/advice/preflop.ts:72-87`) maps every seat beyond the chart's named
  positions to the earliest position. So both early seats at 7 seats (6-max chart) and at 10 seats (full ring) are
  `UTG`, and at 8 seats the earliest seat is `UTG+1`. At 5 seats the earliest is `HJ`. At 3–4 seats there is no
  UTG/HJ.
- **Spot lists.** `APPLICABLE_SPOTS` (`src/advice/preflop-chart.ts:57-86`): heads-up 6, 6-max 32, full ring 50.
  `blind-defence` is last in each list (`:72,81`).
- **Today's blind-defence widths** (`npm run chart:print`):
  - 6-max SB 10.7% (raise 9.5%), BB 46.3% (raise 5.7%);
  - full ring SB 9.2% (raise 6.2%), BB 36.3% (raise 4.2%);
  - heads-up BB 88.2%.

  Opening ranges: 6-max UTG 16.0, HJ 19.2, CO 27.0, BTN 40.6, SB 30.6 raise. Full ring UTG 9.2, UTG+1 10.7, MP 13.3,
  LJ 15.5, HJ 18.4, CO 24.6, BTN 37.3, SB 25.8 raise.
- **Subset parents after the split (codebase, answers the brief's question).** The `re-raise-not-mine` and `re-raise`
  rules for SB/BB use `blind-defence` as their parent:
  - `tests/advice/re-raise-split.acceptance.test.ts:132` (`notMineProblems`, TASK-7.40);
  - `tests/advice/full-ring-re-raise-split.acceptance.test.ts:246,340-346` (TASK-7.41);
  - `tests/advice/six-max-chart.acceptance.test.ts:97-108` (TASK-7.19/7.40).

  Under D-1 that name stays on the **late** spot, which keeps today's cells (D-5). So these checks keep
  their parent, and the probe confirms they still pass unchanged. A narrower early grid is never their parent.
- **Text (codebase).** `PREFLOP_CONTEXT` (`src/advice/explanations.ts:145-160`) and `SITUATION_LABELS` (`:215-224`) are
  `Record<Situation, string>`, so adding the situation is a type error until both have the key. Labels follow a
  position ("from the big blind, defending the blind against a raise").
- **Rock (codebase).** It needs a range for every 6-max spot, each a strict subset of the TAG chart's plays
  (`src/bots/style.ts:356-378`). The union per position must also be strictly smaller (`:379-390`). Rock reads 6-max
  spots at every size (`src/bots/rock.ts:34`), and `situationOf` groups by the view's own size. So at 9 seats Rock
  facing an LJ open reads its 6-max `BB blind-defence-early` range.
- **TAG (codebase).** It mixes by `preflop-${situation}` (`src/bots/tag.ts:81-82`). An unknown spot type is never
  mixed, hence A-1.
- **Golden spots (codebase).** `tests/golden/preflop-spots.json` has 20 blind-defence spots (4 heads-up, 8 6-max,
  8 full ring). By raiser seat:
  - early: `6max-sb-blind-defence-qq` (UTG), `fr-sb-blind-defence-ako` (LJ), `fr-sb-blind-defence-k9s` (UTG);
  - late: the other 13. The 4 `fr-bb-*` spots face an HJ raise, which is late under Q-1.
- **Probe (codebase).** I built a scratch worktree (patch kept at
  `/private/tmp/claude-501/-Users-gregwhite-Documents-claudeworkspaces-limitholdem/4f7a755b-7d9f-4f95-8508-90fc0fabf0c8/scratchpad/t742/probe-src.diff`).
  It had the Q-1 groups, the D-2 order, draft early grids (late grid with weaker calls folded), draft Rock
  ranges and the A-1 mapping. `vitest run tests/advice tests/bots tests/golden tests/playtest tests/stats tests/table`
  gave 29 failed and 775 passed. `tsc` failed only on `tests/advice/labels.acceptance.test.ts:37` (a
  `Record<Situation,…>` literal). Every failure is listed in §5 "Locked re-pins", "Seeded re-pins" or the unit
  updates. Not run: the opt-in slow group (the builder runs it, SPEC-10).
- **What changed since TASK-7.21 was written:**
  - TASK-7.40/7.41 added `re-raise-not-mine` (6-max 32, full ring 50), its text, its Rock ranges, and the subset
    tests that use `blind-defence` as parent (above).
  - TASK-7.43/7.44 (`resizeRange`, relative PFR) touch only `src/advice/ranges.ts`, which reads no situation or chart
    (`:13`), so they are unaffected.
  - The TASK-7.21 §3 line numbers have moved. The counts in this spec are current.
- Existing code to reuse:
  - `positionOf({ ...view, seat }, size)` (`src/advice/ranges.ts:680`) → the raiser's position. No new position code.
  - `tests/advice/full-ring-re-raise-split.acceptance.test.ts` `viewAt`, `cardsOf`, `f/c/r`, `checkAllClasses` → copy
    into the new file.
  - `tests/advice/six-max-chart.acceptance.test.ts` `level`, `dominancePairs`, `inversions` → copy for the early grids.
  - `npm run chart:print [full-ring]` → the sign-off blocks. Save the base-commit output first, for the "before"
    columns.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Keep `blind-defence` as the vs-late-raiser spot (and heads-up's only blind spot). Add one situation `blind-defence-early`. | Two new names (`blind-defence-early`/`-late`); keep `blind-defence` for early | Same pattern as TASK-7.40 (`re-raise` kept, one new id). Heads-up's raiser is the button, a late seat. It keeps the 7.40/7.41/7.19 subset parents, Rock's BB 41-class pin and 13 of 16 6-max/full-ring golden spots unchanged (§3). | no | n/a |
| D-2 | Order: `… re-raise-not-mine, blind-defence-early SB, BB, blind-defence SB, BB`. 6-max 34, full ring 52. | Append after `blind-defence` | The last spot stays `BB blind-defence`, so the locked last-spot mutation `tests/advice/table-sizes.acceptance.test.ts:157-163` still names the same spot | no | n/a |
| D-3 | Seat groups: 6-max early = UTG, HJ; late = CO, BTN, SB, BB. Full ring early = UTG, UTG+1, MP, LJ; late = HJ, CO, BTN, SB, BB. Both UTG seats at 7 and 10 seats are early; at 8 seats UTG+1 (earliest) is early; at 5 seats HJ is early; at 3–4 seats no seat is early. A BB raise after the SB completed is late. An isolation raise over limpers is grouped by the raiser's seat. | 6-max early = UTG only; full ring early = UTG..MP | AC#1; TASK-7.21 §5 proposal | yes | user (Q-1) |
| D-4 | `SITUATION_LABELS['blind-defence-early']` = "defending the blind against an early raiser"; `PREFLOP_CONTEXT['blind-defence-early']` = "Your blind is already in the pot, which improves your pot odds, {def:pot-odds}, but a raiser in an early seat holds a strong range, so you defend with fewer hands than against a late raiser." The `blind-defence` label and sentence stay word for word. | Relabel `blind-defence` "against a late raiser"; a {def:hand-strength} sentence | AC#3; TASK-7.40 D-3 precedent; heads-up text stays true | yes | user (Q-2, Q-3) |
| D-5 | The 4 `blind-defence` grids keep today's cells (text only changes). Early grids follow §5 rule 5, with continue bands 6-max SB [5, 9]%, BB [28, 40]%; full ring SB [4, 7.5]%, BB [20, 30]%. | Re-author the late grids wider; share-of-late rule | AC#2; keeps Rock's BB 41 pin, the 13 late golden spots and the subset parents | yes | user (Q-4) |
| D-6 | Rock `SB blind-defence-early` = "AA KK QQ JJ TT AKs AQs AKo" (8); `BB blind-defence-early` = "AA KK QQ JJ TT 99 88 77 66 55 44 33 22 AKs AQs AJs ATs KQs KJs QJs JTs AKo AQo KQo" (24). Rock late ranges unchanged. | Rock late ∩ TAG early plays, untrimmed | AC#4; each ⊆ the Rock late range | yes | user (Q-5) |
| D-7 | One sign-off before code review, from the package (SPEC-09), covering the 8 blind-defence spots. The §5 locked re-pins and the seeded re-pins are pre-approved, and seeded-example shifts follow the TASK-7.40 A-8 method (replace expected values, keep the check count). | Stop and ask per file | AC#5; same as TASK-7.41 D-6/D-7 | yes | user (Q-6) |

## 5. Design

### Files to create / modify
- `src/advice/preflop-chart.ts` — `Situation` gains `'blind-defence-early'` (before `'blind-defence'`). Export
  `EARLY_RAISERS: Readonly<Record<ReferenceSize, readonly Position[]>>` (Q-1 groups; `'heads-up': []`). Add
  `...spotsOf('blind-defence-early', ['SB', 'BB'])` before the `blind-defence` line for 6-max and full ring.
- `src/advice/preflop.ts` — the `situationOf` single-raise SB/BB branch (rules below), and the doc comment.
- `src/advice/explanations.ts` — `PREFLOP_CONTEXT['blind-defence-early']` and `SITUATION_LABELS['blind-defence-early']`,
  each placed before the `blind-defence` key (Q-2, Q-3).
- `src/bots/tag.ts` — the A-1 mapping at `:82`, with its comment updated.
- `src/advice/charts/six-max.json` — 2 new spots, 2 `blind-defence` justifications rewritten, one chart-text clause.
- `src/advice/charts/full-ring.json` — the same, keeping the "nine and ten seats" phrase
  (`tests/advice/reference-charts.test.ts:165`).
- `src/bots/styles/rock.json` — 2 new ranges placed before `SB blind-defence` (Q-5).
- `tests/golden/preflop-spots.json` (locked, TASK-7.11) — A-2 edits and A-3 appends.
- `tests/advice/blind-defence-split.acceptance.test.ts` (new) — SPEC-01 to SPEC-06.
- Unit tests (unlocked):
  - `tests/advice/preflop.test.ts` — `:98-112` situation cases, plus SB-raiser, BB-raiser and isolation cases;
  - `tests/advice/preflop-chart.test.ts` — `:107-112` missing-spot messages;
  - `tests/advice/six-max-chart.test.ts` — `:40-41` bands for the 2 new keys;
  - `tests/advice/reference-charts.test.ts` — `FR` bands for the 2 new keys;
  - `tests/advice/explain.test.ts` — `:333` situation list, if it fails.
- The locked re-pins and seeded re-pins below.
- `doit/TASK-7.42/changes.md` — work-folder file.

### Components, interfaces and data
- `EARLY_RAISERS` (exported const, above). No other signature changes. Chart entry shape as today:
  `{ position, situation: "blind-defence-early", justification (≥ 15 words), grid: 13 rows }`.
- Rock entry shape as today: `{ position, situation, hands, justification (≥ 10 words) }`.

### Rules and algorithms
Routing, in `situationOf`, when exactly one non-voided raise is in and the viewer is SB or BB:
1. `size = referenceSizeOf(view.players.length)`; `raiser` = the seat of that raise record.
2. Return `blind-defence-early` if `positionOf({ ...view, seat: raiser }, size)` is in `EARLY_RAISERS[size]`, else
   `blind-defence`.
3. Limps before the raise and calls after it do not matter. An isolation raise over limpers is grouped by the
   raiser's seat. A small-blind raiser (BB hero), and a big-blind raiser after the SB completed (SB hero), are late.
4. Every route the probe and the Q-1 recommendation give (6 seats button 1: SB 2, BB 3, UTG 4, HJ 5, CO 6, BTN 1; 9
   seats button 1: SB 2, BB 3, UTG 4, UTG+1 5, MP 6, LJ 7, HJ 8, CO 9, BTN 1). `r`/`c` amounts come from
   `legalActions` (A-5):

| # | Seats | Steps before hero | Hero | Expected |
|---|---|---|---|---|
| B1 | 6 | r4 f5 f6 f1 f2 | 3 | BB blind-defence-early |
| B2 | 6 | f4 r5 f6 f1 | 2 | SB blind-defence-early |
| B3 | 6 | f4 f5 r6 f1 f2 | 3 | BB blind-defence |
| B4 | 6 | f4 f5 f6 r1 | 2 | SB blind-defence |
| B5 | 6 | f4 f5 f6 f1 r2 | 3 | BB blind-defence (SB raiser) |
| B6 | 6 | f4 f5 f6 f1 c2 r3 | 2 | SB blind-defence (BB raiser) |
| B7 | 6 | c4 r5 f6 f1 f2 | 3 | BB blind-defence-early (isolation by HJ) |
| B8 | 6 | c4 c5 r1 | 2 | SB blind-defence (BTN isolates two limpers) |
| B9 | 6 | r4 c5 f6 f1 | 2 | SB blind-defence-early (raise and a call) |
| B10 | 7 | f4 r5 f6 f7 f1 | 2 | SB blind-defence-early (second UTG seat) |
| B11 | 5 | r4 f5 f1 f2 | 3 | BB blind-defence-early (HJ is earliest) |
| B12 | 4 | r4 f1 f2 | 3 | BB blind-defence (CO) |
| B13 | 3 | r1 f2 | 3 | BB blind-defence (BTN) |
| B14 | 2 | r1 | 2 | heads-up BB blind-defence |
| F1 | 9 | r4 f5–f9 f1 f2 | 3 | BB blind-defence-early (UTG) |
| F2 | 9 | f4 f5 f6 r7 f8 f9 f1 | 2 | SB blind-defence-early (LJ) |
| F3 | 9 | f4–f7 r8 f9 f1 f2 | 3 | BB blind-defence (HJ) |
| F4 | 9 | f4–f9 r1 | 2 | SB blind-defence (BTN) |
| F5 | 9 | c4 f5 r6 f7 f8 f9 f1 f2 | 3 | BB blind-defence-early (isolation by MP) |
| F6 | 9 | f4–f9 f1 c2 r3 | 2 | SB blind-defence (BB raiser) |
| F7 | 8 | r4 f5–f8 f1 f2 | 3 | BB blind-defence-early (UTG+1 is earliest) |
| F8 | 10 | f4 r5 f6–f10 f1 | 2 | SB blind-defence-early (second UTG seat) |
| F9 | 10 | f4–f8 r9 f10 f1 f2 | 3 | BB blind-defence (HJ) |

The "Expected" column uses the Q-1 groups (D-3).

Authoring (approved in Q-4):
5. `P blind-defence-early` (P = SB, BB, both sizes):
   - every class that continues also continues in `P blind-defence`;
   - no class has a higher A-4 level (fold < call < raise; borderline counts as half a step, as in
     `tests/advice/six-max-chart.acceptance.test.ts` `level`) than in `P blind-defence`;
   - continue combos are strictly fewer than in `P blind-defence`, and inside the Q-4 band.
6. The 4 new grids: no A-4 dominance inversion; 72o folds; ≥ 1 firm `R` and ≥ 1 firm `F`; alternatives only on
   borderline cells; ≥ 15 words; full-ring text not copied from six-max (`tests/advice/reference-charts.test.ts`).
7. Texts: each `blind-defence-early` text names the early seats (Q-1) and why we defend fewer hands. Each
   `blind-defence` text is true for every late route (late opener, SB or BB raiser, isolation over limpers, a raise
   with callers). The heads-up text is unchanged.
8. Golden cells that must keep their action: the 13 late `blind-defence` golden spots (6-max and full ring), and the
   A-2 cells (QQ raise, AKo raise, K9s fold).

### Locked re-pins (owners from every `doit/*/state.json` `locked_tests`)
Each edit replaces expected values only and keeps the number of assertions, unless noted. Found by the probe (§3):

| File:line | Owner(s) | Change |
|---|---|---|
| `tests/advice/chart-print.acceptance.test.ts:48-49` | TASK-7.19 | 32 → 34 |
| `tests/advice/chart-print-sizes.acceptance.test.ts:102,108` | TASK-7.27 | `checkReview('full-ring', 50)` → 52, `('6-max', 32)` → 34 |
| `tests/advice/preflop-chart-edges.acceptance.test.ts:94` | TASK-7.20 | 32 → 34 |
| `tests/advice/six-max-chart.acceptance.test.ts:119` | TASK-7.19, TASK-7.40 | 32 → 34. The dominance check then covers the new grids. |
| `tests/advice/table-sizes.acceptance.test.ts:36-44,138,146-149` | TASK-7.6 | `SITUATIONS` gains `'blind-defence-early'`; full ring 50 → 52; the heads-up reachable filter also drops `'blind-defence-early'` |
| `tests/advice/re-raise-split.acceptance.test.ts:184-188,293` | TASK-7.40 | The 6-max order gains the 2 D-2 entries, 32 → 34; full-ring length 50 → 52 |
| `tests/advice/full-ring-re-raise-split.acceptance.test.ts:304-307,397-407` | TASK-7.41 | The full-ring order gains the 2 D-2 entries, 50 → 52. The `situations` key list gains `'blind-defence-early'` before `'blind-defence'`. |
| `tests/advice/labels.acceptance.test.ts:37-56` | TASK-8.5 | `expected` and the sorted key list gain `'blind-defence-early'` with the Q-2 label (D-4; the `blind-defence` label is unchanged) |
| `tests/advice/preflop-voided-raise.acceptance.test.ts:66,75` | TASK-10.17, TASK-7.40 | `'blind-defence'` → `'blind-defence-early'` (surviving raise from UTG seat 3, and from HJ seat 4, button 6). `:70` (SB raiser) unchanged. |
| `tests/advice/preflop.acceptance.test.ts:135-136` | TASK-7.2 | `SCRIPTS` must equal the 34 spots: today's BB script (`r(4, 8)`, a UTG raise) becomes `BB blind-defence-early`. Add `SB blind-defence-early` `[r(4, 8), f(5), f(6), f(1)]` and `BB blind-defence` `[f(4), f(5), r(6, 8), f(1), f(2)]`, in D-2 order. The per-script loops then run 2 more scripts. |
| `tests/bots/rock.acceptance.test.ts:150,134-142,257` | TASK-6.5, TASK-7.40 | 32 → 34; `COUNTS` gains the 2 Q-5 sizes before `[17, 41]`; 31 → 33. `:160` (BB blind-defence 41) and Example D (`:350-356`, a late raiser) unchanged. |
| `tests/bots/tag.acceptance.test.ts:154-164` | TASK-6.1 | The reached situation set gains `'blind-defence-early'` (the probe reached it in the 200 hands) |
| `tests/golden/preflop-spots.json` | TASK-7.11 | A-2 (3 `situation` fields) and A-3 (2 appended). Every other entry is byte-identical. |

Seeded re-pins (they shifted in the probe; the exact values depend on the final grids). Under D-7 (TASK-7.40 A-8
method):
- `tests/bots/calling-station.acceptance.test.ts:~204` (TASK-6.3);
- `tests/bots/maniac.acceptance.test.ts:~246,~309` (TASK-6.4, TASK-6.25);
- `tests/playtest/games.acceptance.test.ts:~202` (TASK-1.16, the side-pot `> 0` check);
- `tests/bots/calling-station-draws.acceptance.test.ts:~70` (unlocked; same method).

The method:
- find the same view in the new decision list and update the index, seed, draw or replay code, with a
  `before TASK-7.42` note;
- a `> 0` check keeps its check, with the smallest seed or hand-count change that satisfies it;
- nothing is dropped or widened;
- each change is listed in the sign-off package §6.

Expected unchanged (if one fails, re-pin it under D-7 and list it; do not loosen it): `tests/golden/preflop.acceptance.test.ts`
(TASK-7.11/7.40/7.41), `tests/bots/tag-mixing.acceptance.test.ts` (TASK-6.2), `tests/golden/graded-lines.acceptance.test.ts`
(TASK-7.36), `tests/table/review.acceptance.test.ts` (TASK-9.1), `tests/playtest/all-sizes|bot-results|check-advice|playtest.acceptance.test.ts`,
and the slow group (`tests/advice/explanations.acceptance.test.ts` TASK-7.10, `size-ranges-playtest` TASK-7.26,
`small-table-ranges-playtest` TASK-7.35, `check-styles*` TASK-6.11/6.25/7.46, `style-bands` TASK-6.16/6.17/6.25,
`tag-playtest` TASK-6.1, `tag-short-handed-playtest` TASK-7.37, `healthy-ranges-tag` TASK-10.3).

### Error handling and configuration
- A missing or invalid new spot makes `parseChart` throw `ChartValidationError` at import (existing behaviour), for
  example `6-max chart: missing spot SB blind-defence-early`.
- A missing Rock range throws `rock.json: style Rock starting range is missing spot SB blind-defence-early`
  (`src/bots/style.ts:376`).
- No configuration and no new dependencies.

## 6. Behaviour specification

### SPEC-01: A single raise faced by a blind reads the early or late spot by the raiser's seat
- Verifies: AC#1
- Behaviour: Given routes B1–B14 and F1–F9 (§5), When `recommendPreflop` runs for the hero with each of the 169
  classes, Then:
  - `position` and `situation` equal "Expected", and `situationOf(view)` agrees;
  - `cell` equals `chartCell(<size chart>, position, situation, hc)`;
  - `move` is the `legalActions` entry of the advised type.

  Also `EARLY_RAISERS` equals the Q-1 groups, with `'heads-up': []`.
- Verification: acceptance `tests/advice/blind-defence-split.acceptance.test.ts::AC#1 a blind facing one raise reads the early or late spot by the raiser's seat`

### SPEC-02: Charts have 34 and 52 complete spots in order
- Verifies: AC#2
- Behaviour: Given the 6-max and full-ring charts, Then:
  - `APPLICABLE_SPOTS` and the chart spots equal the D-2 order (34 and 52 pairs), and heads-up still has its 6;
  - each spot has all 169 classes, and each new justification has ≥ 15 words;
  - `chart:print` prints `6-max chart: 34 spots` and `full-ring chart: 52 spots`.
- Verification: acceptance `tests/advice/blind-defence-split.acceptance.test.ts::AC#2 the charts have 34 and 52 spots with all 169 classes`

### SPEC-03: Each blind defends no wider against an early raiser than against a late one
- Verifies: AC#2
- Behaviour: Given each `P blind-defence-early` (SB, BB × 6-max, full ring), Then §5 rule 5 and rule 6 hold:
  - failures are listed as `<spot>: <hc> continues but folds in <P blind-defence>`, `<spot>: <hc> plays firmer than in
    <P blind-defence>`, or as width/band problems;
  - the test prints `<size> <P>: early <x>% vs late <y>%`.

  Mutation: copying `BB blind-defence` cells into `BB blind-defence-early` fails the strictly-fewer and band checks.
- Verification: acceptance `tests/advice/blind-defence-split.acceptance.test.ts::AC#2 each blind defends no wider against an early raiser than against a late one`

### SPEC-04: Justifications agree with grids and routes
- Verifies: AC#2
- Behaviour: For the 8 blind-defence texts and the two chart texts:
  - every hand or group named under an action has that action;
  - no sentence is false for a route in §5 rule 7;
  - early texts name the Q-1 early seats;
  - the wording is original.
- Verification: manual Reviewer and judge walk the 8 spots against B/F routes and grids, recording pass or fail per spot.

### SPEC-05: The new situation shows the approved label and context sentence
- Verifies: AC#3
- Behaviour: Given route B1 with K8o and F1 with A9o, When advised, Then:
  - the explanation starts with the filled `PREFLOP_CONTEXT['blind-defence-early']` (the exact Q-3 string) and has
    ≤ 3 sentences;
  - `SITUATION_LABELS['blind-defence-early']` is the exact Q-2 string, and `situationLabel('blind-defence-early')`
    returns it;
  - `chartBasisText` does not contain the label;
  - the `blind-defence` context and label are unchanged (D-4);
  - the key order of both maps is `unopened … re-raise-not-mine, blind-defence-early, blind-defence`.
- Verification: acceptance `tests/advice/blind-defence-split.acceptance.test.ts::AC#3 the early-raiser spot shows the approved label and context sentence`

### SPEC-06: Rock has a strict-subset range for each new 6-max spot
- Verifies: AC#4
- Behaviour: Given `ROCK_STYLE`, Then `SB blind-defence-early` and `BB blind-defence-early` exist with exactly the Q-5
  hand lists. Each is a strict subset of the TAG 6-max non-fold classes in that spot, and each is ⊆ the Rock
  `blind-defence` range of the same seat. `decideRock` on B1 folds a class outside the range and plays the advice for
  one inside it. At 9 seats on F1, Rock reads `BB blind-defence-early`.
- Verification: acceptance `tests/advice/blind-defence-split.acceptance.test.ts::AC#4 Rock has a strict-subset range for each new 6-max spot`

### SPEC-07: Golden spots cover the new situation at both sizes
- Verifies: AC#4
- Behaviour: Given A-2 and A-3, When the locked golden tests run, Then:
  - each re-pinned and appended spot's `situationOf` is `blind-defence-early` and its action matches the chart;
  - the coverage test finds `6-max blind-defence-early` and `full-ring blind-defence-early`;
  - the 13 late golden spots pass unchanged.
- Verification: acceptance `tests/golden/preflop.acceptance.test.ts::AC#4 at least 100 spots covering every reference size and chart situation`

### SPEC-08: All checks pass with only the listed test edits
- Verifies: AC#5
- Behaviour: lint, typecheck and `npm test` exit 0. `git diff --stat <base> -- tests e2e` lists only:
  - the §5 locked re-pins;
  - any seeded re-pins under D-7;
  - the unit files and the new file.

  `heads-up.json` is unchanged.
- Verification: command `npm run lint && npm run typecheck && npm test && git diff --stat $(jq -r .base_commit doit/TASK-7.42/state.json) -- tests e2e src/advice/charts/heads-up.json`

### SPEC-09: Sign-off package and user sign-off before review
- Verifies: AC#5, AC#2
- Behaviour: Given the gate is green, When the builder finishes, Then it writes
  `/private/tmp/claude-501/-Users-gregwhite-Documents-claudeworkspaces-limitholdem/4f7a755b-7d9f-4f95-8508-90fc0fabf0c8/scratchpad/t742/signoff.md`
  (the builder hook blocks writes in the work folder). The package has, in order:
  1. The base and final commits, and both chart-level texts before and after.
  2. The verbatim `npm run chart:print` and `npm run chart:print full-ring` blocks for the 8 spots: the new early spots,
     then the late spots, each late one with its "before" block.
  3. A changed-cells table for the 4 late spots (`spot | hand | before | after`). Under D-5 this is "None".
  4. Widths: early vs late per seat and size, beside the Q-4 band.
  5. The 2 Rock ranges (Q-5) and their TAG play counts.
  6. Test and bot shifts:
     - every locked or unlocked re-pin (file, owner, before → after);
     - the A-4 TAG before/after table (VPIP, PFR, aggression, WTSD, W$SD against `HEALTHY_RANGES`).
  7. Golden spots changed or added (id, hand, route, action).
  8. The TASK-7.38 statement: the 4 full-ring blind-defence spots are reviewed here, and the full-ring BB
     blind-defence inversions stay with 7.38.

  The orchestrator copies it into the work folder and shows it in one question (sign off / sign off with tweaks /
  request changes). Tweaks are applied, and the gate and package re-run, before review. A dated note goes on
  TASK-7.42, and AC#5 is ticked only after it.
- Verification: manual Orchestrator checks the 8 sections and the task note before Done.

### SPEC-10: Opt-in slow group passes on the final charts
- Verifies: AC#5
- Behaviour: Given the final build, When `npm run test:slow` runs once, Then it passes, with any re-pins under D-7.
  The A-4 logs go into `changes.md`. Nothing is added to `npm test` or CI.
- Verification: command `npm run test:slow`

## 7. Edge cases
- Isolation raise over limpers, a raise with callers, SB or BB as the raiser: SPEC-01 (B5–B9, F5, F6).
- 7 and 10 seats with two UTG seats, the 8-seat earliest UTG+1, and 3–5 seat tables: SPEC-01 (B10–B13, F7–F9).
- Heads-up: SPEC-01 (B14), and the re-pinned table-sizes reachable set.
- Voided raise (TASK-10.17): the raiser is taken from the non-voided records. Covered by the re-pinned locked
  `preflop-voided-raise` test (`:66,70,75`).
- Two or more raises: unchanged (`re-raise`/`re-raise-not-mine`). The existing 7.40/7.41 routes still pass.
- Invalid input, concurrency, permissions: N/A. Shipped JSON is validated at import.

## 8. Security considerations
N/A:
- no untrusted input (shipped, validated JSON);
- no new dependencies;
- no randomness added (TAG reuses its existing seeded mix, A-1);
- no new imports across the advice/bot boundary (`tag.ts` already imports the advice).

## 9. Non-functional
- Parsing 2 more spots is negligible. `situationOf` adds one `positionOf` call per blind decision.
- The new acceptance file runs 23 routes × 169 classes, in well under a second, with no playtest sweep.
- 100,000-hand runs are opt-in only (`npm run test:slow`).
- Coverage stays ≥ 90%.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run chart:print && npm run chart:print full-ring`
- New tests: `tests/advice/blind-defence-split.acceptance.test.ts` → SPEC-01 to SPEC-06. The re-pinned golden suite →
  SPEC-07. The gate → SPEC-08. The slow group → SPEC-10.
- End-to-end for the Judge:
  1. Run both `chart:print` commands. Confirm 34/52 spots, and that each early spot is narrower than its late spot and
     inside the Q-4 band.
  2. Run `npm test`.
  3. Run `npm run test:slow`.
  4. Check the sign-off package and the dated task note.

## 11. Open questions
None. Q-1 to Q-6 were answered on 2026-11-28 (`doit/TASK-7.42/qa.md`): all Recommended. They are folded into D-3
to D-7, §5 rules 5–6, SPEC-03, SPEC-05, SPEC-06 and SPEC-09.

## 12. Clarifications log
See `doit/TASK-7.42/qa.md`.
