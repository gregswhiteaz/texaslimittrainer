# Spec: TASK-7.40 — Split the 6-max re-raise spots into own-raise-re-raised and re-raised-when-I-had-not-raised

Status: READY (approved 2026-11-27)
Task: TASK-7.40 · Parent/epic: TASK-7 (Get trustworthy advice) · Requirements: REQ-032.2, REQ-032.6 (as reworded by TASK-7.21, decision-4) · Dream: limit-holdem-trainer

## 1. Summary
Today every 6-max preflop spot with two or more raises reads one `re-raise` spot per seat. So the cutoff (CO)
continues with 22.5% of hands against an open plus a 3-bet, but with only 8.4% against a single open. This task
applies the TASK-7.21 A-2 rule (decision-4). If the viewer made a preflop raise and a later raise now faces them,
they read the existing `re-raise` spot, which from now on means "own raise re-raised". Every other 6-max spot with
two or more raises reads a new `re-raise-not-mine` spot. The 6-max chart grows from 26 to 32 spots:
- 6 new grids;
- the 6 existing re-raise grids re-justified;
- one Rock range per new spot;
- golden spots;
- a context sentence for the new situation (shown in the preflop explanation) and a label (kept in
  SITUATION_LABELS but not shown, decision-7).

Heads-up and full-ring advice stays exactly as it is. The user signs off the 12 new and changed spots from
`npm run chart:print 6-max`.

## 2. Scope
- In scope:
  - `Situation` gains `re-raise-not-mine`. `APPLICABLE_SPOTS['6-max']` gains the six spots UTG, HJ, CO, BTN, SB and
    BB `re-raise-not-mine`, placed directly after the six `re-raise` spots (D-1, D-2).
  - `situationOf` applies A-2 and falls back to `re-raise` at sizes with no `re-raise-not-mine` spot (D-3).
  - `six-max.json`:
    - 6 new grids and justifications;
    - the 6 `re-raise` justifications rewritten for own-raise routes only;
    - grid edits in `re-raise` spots only where AC#3 or the TASK-7.19 rules call for them;
    - the chart-level text updated.
  - `PREFLOP_CONTEXT` and `SITUATION_LABELS` entries for `re-raise-not-mine` (wording from Q-1/Q-2).
  - `rock.json`: 6 new Rock ranges. `tests/golden/preflop-spots.json`: 3 new golden spots.
  - Unit-band additions in `tests/advice/six-max-chart.test.ts`. One new acceptance file. The locked-test re-pins
    in §5 "Locked tests", each owner named.
  - Before/after figures from the slow short-handed playtest (AC#8), recorded in `doit/TASK-7.40/changes.md`.
  - The sign-off package `doit/TASK-7.40/signoff.md` (SPEC-12).
- Not doing:
  - Any change to `heads-up.json`, `full-ring.json`, full-ring or heads-up spot lists, or the existing
    `PREFLOP_CONTEXT['re-raise']` / `SITUATION_LABELS['re-raise']` text (AC#6, D-4). Full ring is TASK-7.41.
  - Splitting blind defence by raiser (TASK-7.42), or splitting the raise, raise-and-calls or limpers spots.
  - Any change to unopened, limpers, raise, raise-and-calls or blind-defence grids. Their texts change only if the
    chart-level text requires it.
  - A TAG mixed spot (`SPOT_TYPES`, `tag.json`) for the new situation (A-4).
  - Opponent default ranges (`src/advice/ranges/*.json`, keyed by line, not by chart spot,
    `doit/TASK-7.21/spec.md` §3), the chart file format (stays `tlh-preflop-chart` v1), `chart:print` code, UI, e2e.
  - Showing the situation label anywhere (decision-7).
  - Any 100,000-hand or speed check outside the opt-in `npm run test:slow` group.
  - Backlog notes. The orchestrator records the sign-off and the slow-test figures.
- Scope budget: files=22, lines=700   (six-max.json ~150, rock.json ~40, preflop-spots.json ~45, new acceptance test
  ~200, six-max-chart.test.ts ~10, preflop-chart.ts ~4, preflop.ts ~10, explanations.ts ~4, preflop.test.ts ~6,
  explain.test.ts ~4, 10 locked-test re-pins ~120, changes.md ~20)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The new situation id is `re-raise-not-mine`. The existing id `re-raise` keeps its name and at 6-max means "own raise re-raised". | yes | All 7 6-max `re-raise` golden spots, the locked graded-lines pin "6-max CO re-raise K6s", the Rock pins `UTG re-raise`/`BB re-raise`/`BTN re-raise` and the 80–90% tests are own-raise routes (probed, §3). Keeping the name leaves them untouched. The id is internal: it is not stored (`doit/TASK-7.21/spec.md` §3) and not shown in the app. | `cold-re-raise` (inexact: "called, then 3-bet" is not cold); two new ids `own-re-raise` + `re-raise-not-mine` (re-pins ~20 more locked lines and 7 golden spots) |
| A-2 | "The viewer made a preflop raise" = a preflop `raise` record with `seat === view.seat` among the records `situationOf` already counts (blinds excluded, voided raises excluded). | yes | Uses the same filtered list as the raise count (`src/advice/preflop.ts:108-118`), so TASK-10.17 voided raises stay ignored in both. A forced fold voids only the folded seat's top bet, so the viewer's own raise is never voided while they are still in. | Count chips invested (rejected in TASK-7.21 A-2) |
| A-3 | `chartSpotOf` and `golden.ts` keep calling `situationOf(view)`, so the size comes from the view's dealt-in count. Rock, which reads 6-max spots at every size (`src/bots/rock.ts:34`), therefore uses `re-raise-not-mine` only at 3–7 seats. At heads-up and full ring it keeps today's `re-raise` range. | yes | Leaves heads-up and full-ring bot play exactly as today, the same as the advice (AC#6). TASK-7.41 brings the split to full ring. | Pass `'6-max'` into `situationOf` from `chartSpotOf(view, '6-max')`, so Rock splits at full ring too |
| A-4 | TAG does not mix in `re-raise-not-mine`. No `SPOT_TYPES` entry and no `tag.json` change, the same as `re-raise` (`tests/bots/tag-mixing.acceptance.test.ts:87`). | yes | `SPOT_TYPES` only `satisfies` the template type (`src/bots/style.ts:22-29`), so there is no compile need. Two-raise pots are rare and the advice is near the top of the range. | Add `preflop-re-raise-not-mine` with 0.75/0.25 |
| A-5 | Each Rock `re-raise-not-mine` range is {AA, KK, QQ, AKs, AKo} minus any hand the TAG grid folds, and it must hold fewer classes than the TAG spot plays. If it does not, it drops AKo, then QQ. Justification ≥ 10 words. | yes | Matches the Rock re-raise ranges (`src/bots/styles/rock.json:121-156`: 5–7 premium classes) and the strict-subset rule (`src/bots/style.ts:356-367`). | Copy each seat's Rock `re-raise` range |
| A-6 | Three golden spots for `re-raise-not-mine`: `6max-co-re-raise-not-mine-a9o` (TASK-9.1 route, fold), `6max-bb-re-raise-not-mine-<pair>` (call), and `6max-btn-re-raise-not-mine-aa` (raise). The builder picks the BB pair from the grid. | yes | AC#5 needs ≥ 1 per new situation. The locked coverage test enforces it (`tests/golden/preflop.acceptance.test.ts:111-120`). Three spots cover fold, call and raise. | One spot only |
| A-7 | AC#8 "before" figures = the `TAG <n> seats <stat>` console lines of `tests/bots/tag-short-handed-playtest.acceptance.test.ts`, run on the base commit before any chart edit. "After" = the same run on the final chart. Both go into `doit/TASK-7.40/changes.md` as a table. | yes | That test prints exactly these lines (`:47-50`). The orchestrator copies the table into the task notes. | Record only after-figures |

## 3. Current system
- **Spot model.** `Situation` has 6 values (`src/advice/preflop-chart.ts:5-6`). `APPLICABLE_SPOTS`
  (`src/advice/preflop-chart.ts:51-75`) holds heads-up 6, 6-max 26 and full ring 41 spots. `parseChart` matches
  spots by the key "position situation" (`:185-232`), so new spots fit format v1 unchanged.
- **Routing.** `situationOf(view)` (`src/advice/preflop.ts:106-122`) returns `re-raise` for any `raises > 1`
  (`:119`). It is called by `chartSpotOf` (`:90-103`, used by `recommendPreflop` `:142`, `src/table/review.ts:136`,
  `src/bots/rock.ts:34`) and by golden validation (`src/advice/golden.ts:422`, which must equal the spot's
  `situation`).
- **Text.** `PREFLOP_CONTEXT` (`src/advice/explanations.ts:145-158`) is the first sentence of every preflop
  explanation (`src/advice/explain.ts:42-45`). `SITUATION_LABELS` (`src/advice/explanations.ts:215-222`) is read
  only by `situationLabel` (`src/advice/explain.ts:67-69`), which nothing in `src/` calls. Decision-7 (TASK-8.7):
  hints and reviews do not show it. Both maps are `Record<Situation, string>`, so typecheck forces an entry.
- **Lint boundary.** `src/advice/**` may import only `./` siblings and `../engine/{player-view,hand,cards,
  hand-evaluator,seeded-random}`. From `hand` it may import only `Action`, `SeatNumber`, `Street`, `STREET_BET_CAP`
  and `voidedBets` (`tools/lint/headless-boundary.js:303-325`). The change needs no new import: `preflop.ts` already
  imports `APPLICABLE_SPOTS` and `voidedBets`.
- **Bots.** Rock needs a range for every 6-max spot (`src/bots/style.ts:374-379`). Each range must be a strict
  subset of the TAG plays, with fewer classes (`:356-367`), and the per-position unions must be narrower (`:380-391`).
  `TAG_SHORT_HANDED_CHART` (`src/bots/tag.ts:43-56`) maps every `SIX_MAX_CHART` spot through unchanged, except BTN/SB
  unopened, so it picks up the new spots automatically. `tests/bots/tag-short-handed.acceptance.test.ts:72-90` is
  generic over the spots.
- **Chart rules already locked (TASK-7.19).** `tests/advice/six-max-chart.acceptance.test.ts`:
  - `:63-80`: 80–90% own-raise share for UTG–BTN, read from `<P> re-raise`.
  - `:82-108`: premium-only raises; SB 80–90%; BB ≥ 80% of its raised set and ⊆ blind-defence.
  - `:118-121`: A-4 dominance consistency over all spots, which then covers the new grids too.
  - Unit bands: `tests/advice/six-max-chart.test.ts:26-32`.
- **Today's widths** (`npm run chart:print 6-max`):

  | Spot | Continue | Raise |
  |---|---|---|
  | UTG re-raise | 14.2% | 2.6% |
  | HJ re-raise | 16.4% | 2.6% |
  | CO re-raise | 22.5% | 2.6% |
  | BTN re-raise | 34.2% | 3.3% |
  | SB re-raise | 27.0% | 2.6% |
  | BB re-raise | 10.4% | 2.6% |
  | CO raise | 8.4% | 6.6% |

  CO raise folds A9s and every offsuit ace below AT.
- **Which locked routes are "own" and which "not mine"** (probed with a scratch script that applies A-2 to the real
  views):
  - Golden 6-max `re-raise` spots: all 7 are own. Heads-up: all 4 own. Full ring: all 8 own.
  - Rock example A (`tests/bots/rock.acceptance.test.ts:287-294`, BTN QTo, 4th bet): own.
  - tag-mixing `alternativeViews().get('re-raise')`: SB, own.
  - graded-lines "CO re-raise K6s": CO opened, BTN 3-bet: own.
  - `tests/advice/preflop.acceptance.test.ts:97-98`, SB/BB rows `[r(4,8), r(5,12), …]`: **not mine**.
  - `tests/advice/preflop-voided-raise.acceptance.test.ts:74`, BB facing `3:raise 4:raise`: **not mine**.
  - `tests/table/review.acceptance.test.ts:84-92`, CO called UTG, BB 3-bet: **not mine**.
  - `tests/bots/tag.acceptance.test.ts:146-157`, 200 hands with seed 61, TAG at seat 1: both kinds occur (BTN 11,
    SB 14, BB 11, CO 5, HJ 1 not mine), so the new situation joins the set.
  - Rock `views()` (1,000 hands, seed 65): every one of the 12 spots occurs.
- Existing code to reuse:
  - `src/advice/preflop-chart.ts` `spotsOf` → build the six new 6-max entries.
  - `npm run chart:print 6-max` (`tools/chart-print/main.ts`) → the sign-off printout. It already prints grid, shares
    and "Why:" text per spot.
  - `tests/advice/six-max-chart.acceptance.test.ts` helpers (`spotNamed`, `classesWith`, `combos`, `level`) →
    copy the pattern into the new acceptance file (test files do not import each other here).
  - `tests/advice/preflop.acceptance.test.ts` `viewAt`/`deckFor`/`f c r` step helpers → same 6-seat, button-1
    scripts in the new test.
  - `src/playtest/runner.ts` `runPlaytest` → the heads-up and full-ring "never `re-raise-not-mine`" sweep.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Rule A-2 (TASK-7.21, decision-4): `raises > 1` and the viewer made a counted preflop raise → `re-raise`; otherwise → `re-raise-not-mine`. | Third bucket for "called, then 3-bet" | Story text and decision-4 | yes | user (TASK-7.21 Q-1) |
| D-2 | `APPLICABLE_SPOTS['6-max']` order: unopened 5, limpers 5, raise 4, raise-and-calls 4, re-raise 6, **re-raise-not-mine 6 (UTG, HJ, CO, BTN, SB, BB)**, blind-defence 2 = 32. | New spots at the end | Keeps the two re-raise halves together in `chart:print`, which helps the sign-off | no | n/a |
| D-3 | `situationOf` returns `re-raise-not-mine` only if `APPLICABLE_SPOTS[referenceSizeOf(view.players.length)]` has a spot with that situation; otherwise `re-raise`. | Hard-code `size === '6-max'` | Data-driven, so TASK-7.41 needs only the spot list. Heads-up can never reach "not mine" anyway: with two seats, two raises always include one of the viewer's. | no | n/a (codebase) |
| D-4 | `PREFLOP_CONTEXT['re-raise']` and `SITUATION_LABELS['re-raise']` stay word for word. | Reword them as "your raise was re-raised" | Full ring still sends every two-raise route to `re-raise` until TASK-7.41, so "your raise" would be false there and would change full-ring explanations (AC#6). The locked `tests/advice/labels.acceptance.test.ts:42` pins the label. | yes | n/a (forced by AC#6). Shown to the user in Q-1/Q-2 |
| D-5 | `SITUATION_LABELS['re-raise-not-mine']` = `facing a re-raise when you have not raised`; `PREFLOP_CONTEXT['re-raise-not-mine']` = `The pot has been raised more than once and none of the raises is yours, so your hand strength, {def:hand-strength}, must be very high to continue.` (exact strings) | `facing two raises before you have raised`; `facing a cold re-raise`; a comparative context sentence | Matches the reworded REQ-032.2 and the existing `re-raise` sentence style (AC#4) | yes | user (Q-1, Q-2) |
| D-6 | Authoring rule for the six `re-raise-not-mine` grids = §5 "Authoring rules" 1–5 (subset of the one-raise spot, premium-only raises, width 2–8% UTG–SB and 4–16% BB) | Narrower cap; share of the one-raise spot | Removes the CO 22.5% vs 8.4% inversion; user-visible advice, like TASK-7.19 Q-1 | yes | user (Q-3) |
| D-7 | Sign-off: one review before code review, from the builder's `doit/TASK-7.40/signoff.md` (SPEC-12) | Sign-off after judge (TASK-7.19); summary table only | AC#7; tweaks land before review so reviewers see the final chart | yes | user (Q-4) |
| D-8 | CO A9o/A8o (AC#3): they fold in `CO re-raise-not-mine`, as forced by the Q-3 subset rule (CO raise folds them). In `CO re-raise` (own) they are reconsidered under the 80–90% rule. The builder keeps them `F` or makes them `C*/F`, says which in `changes.md`, and the user sees it at sign-off. | Continue A9o in the cold spot (would change the TASK-9.1 test) | Under A-2 the TASK-9.1 route is "not mine" (§3). The old reason to fold A9o in the own spot is gone. | yes | user (Q-3, Q-4) |

## 5. Design

### Files to create / modify
- `src/advice/preflop-chart.ts` — add `'re-raise-not-mine'` to `Situation`; add the six spots to 6-max (D-2).
- `src/advice/preflop.ts` — A-2 in `situationOf` (D-1, D-3). Update the doc comment.
- `src/advice/explanations.ts` — add `PREFLOP_CONTEXT['re-raise-not-mine']` and
  `SITUATION_LABELS['re-raise-not-mine']`, with the Q-1/Q-2 text.
- `src/advice/charts/six-max.json`:
  - 6 new spots;
  - the 6 `re-raise` justifications rewritten;
  - `re-raise` grid edits only as allowed by D-8 and the locked rules;
  - the chart-level text.
- `src/bots/styles/rock.json` — 6 new starting-range spots (A-5), in `APPLICABLE_SPOTS` order.
- `tests/golden/preflop-spots.json` (locked, TASK-7.11) — 3 new spots (A-6). The existing entries stay unchanged.
- `tests/advice/re-raise-split.acceptance.test.ts` (new) — SPEC-01, 02, 04, 06, 09.
- `tests/advice/six-max-chart.test.ts` — bands for the 6 new spots, from the Q-3 width band.
- `tests/advice/preflop.test.ts` — the `situationOf` unit cases at `:102-104` become `re-raise-not-mine`. Add an
  own-raise SB case.
- `tests/advice/explain.test.ts` — only if its exhaustive situation list (`:323`) needs the new key.
- Locked re-pins (see "Locked tests").
- `doit/TASK-7.40/changes.md` — the chart change list, the AC#8 before/after table, and the D-8 choice.
- `doit/TASK-7.40/signoff.md` — the user sign-off package (SPEC-12). Work-folder file; not counted in the scope budget.

### Components, interfaces and data
- `type Situation = 'unopened' | 'limpers' | 'raise' | 'raise-and-calls' | 're-raise' | 're-raise-not-mine' |
  'blind-defence'`.
- `situationOf(view: PlayerView): Situation`. The signature does not change. When `raises > 1`:

  ```ts
  if (raises > 1) {
    const mine = records.some((a) => a.type === 'raise' && a.seat === view.seat);
    const split = APPLICABLE_SPOTS[referenceSizeOf(view.players.length)]
      .some((s) => s.situation === 're-raise-not-mine');
    return mine || !split ? 're-raise' : 're-raise-not-mine';
  }
  ```
- Chart JSON entry, the same shape as today:
  `{ "position": "CO", "situation": "re-raise-not-mine", "justification": "…≥15 words…", "grid": [13 rows] }`.
- Rock JSON entry, the same shape as `rock.json:121-126`.

### Rules and algorithms
A-2 routes at 6-max (6 seats, button 1: SB 2, BB 3, UTG 4, HJ 5, CO 6, BTN 1). These are the SPEC-01 table:

| # | Steps before hero | Hero | Expected |
|---|---|---|---|
| R1 | r4 r5(3-bet) f6 f1 f2 f3 | 4 UTG | UTG re-raise |
| R2 | r4 r5 | 6 CO | CO re-raise-not-mine (cold) |
| R3 | r4 f5 c6 f1 f2 r3 c4 | 6 CO | CO re-raise-not-mine (TASK-9.1 route: called UTG's open, then the BB 3-bet) |
| R4 | c4 r5 r6 f1 f2 f3 | 4 UTG | UTG re-raise-not-mine (limped then two raises) |
| R5 | r4 f5 r6 f1 f2 f3 r4(4-bet) | 6 CO | CO re-raise (4th bet after own 3-bet; a `raise` cell becomes `call`) |
| R6 | r4 r5 f6 f1 | 2 SB | SB re-raise-not-mine |
| R7 | r4 r5 f6 f1 f2 | 3 BB | BB re-raise-not-mine |
| R8 | f4 f5 f6 f1 r2 r3 | 2 SB | SB re-raise |
| R9 | f4 f5 f6 f1 c2 r3 r2 | 3 BB | BB re-raise |
| R10 | f4 f5 r6 r1 | 2 SB | SB re-raise-not-mine |
| R11 | f4 f5 f6 r1 r2 f3 | 1 BTN | BTN re-raise |
| R12 | f4 r5 r6 f1 f2 f3 | 5 HJ | HJ re-raise |

Raise amounts follow the 4/8 stakes (open to 8, 3-bet to 12, 4-bet to 16, calls match). The builder may adjust a
step only to make it legal, and the route must keep its intent (column "Expected").

Authoring rules for `re-raise-not-mine` (approved in Q-3). Let N = continue(`P re-raise-not-mine`).
1. For P in UTG, HJ, CO and BTN: N ⊆ continue(`P raise`). For SB and BB: N ⊆ continue(`P blind-defence`). No hand
   continues against two raises that folds against one.
2. raise(`P re-raise-not-mine`) ⊆ {AA, KK, QQ, JJ, AKs, AKo, AQs} (TASK-7.19 A-3), and AA, KK and QQ are `R`.
3. Width (combo share of 1,326): UTG–SB in [2, 8]%, BB in [4, 16]%. The same bands go in `six-max-chart.test.ts`.
4. A-4 consistency (the locked all-spot test) and the chart rules from `six-max-chart.test.ts` hold: 72o folds; there
   is at least one firm `R` and one firm `F`; ≥ 15 words.
5. Each justification is true for every route into its spot:
   - UTG: limped, then two raises.
   - HJ: limped, then two raises; or called UTG's open, then a 3-bet.
   - CO and BTN: as HJ, plus cold: an open and a 3-bet before we act.
   - SB: cold; or completed or called, then two raises.
   - BB: cold (also over limpers); or called a raise, then a limper's 3-bet.

   A fourth bet without a raise of our own also lands here. A `raise` cell then becomes `call` at the cap.

Own-raise `re-raise` spots keep every TASK-7.19 rule (locked tests above). Their texts drop the sentence "The same
advice applies when two raises come before we act, when we limped or called and a re-raise followed…". In its place
they describe only the own routes:
- our open (or isolation raise, or 3-bet) was re-raised;
- a fourth bet came after our own re-raise, so `raise` becomes `call`.
- SB and BB: the TASK-7.19 own routes (SB raised first in or 3-bet from blind defence; BB raised limpers or a
  completed SB, or 3-bet).

Chart-level text: the "Once two raises are in…" sentence also says that, when we have not raised, we continue only
with hands that are strong against one raise, and fewer of them.

### Locked tests (re-pins, each a locked-test edit; owners from every `doit/*/state.json`)
Edits required:

| File:line | Owner(s) | Change |
|---|---|---|
| `tests/advice/chart-print.acceptance.test.ts:48-49` | TASK-7.19 | 26 → 32 |
| `tests/advice/six-max-chart.acceptance.test.ts:119` | TASK-7.19 | 26 → 32 |
| `tests/advice/chart-print-sizes.acceptance.test.ts:108` | TASK-7.27 | 26 → 32 (`checkReview('6-max', 32)`) |
| `tests/advice/preflop-chart-edges.acceptance.test.ts:94` | TASK-7.20 | 26 → 32 |
| `tests/advice/preflop.acceptance.test.ts:39-100` | TASK-7.2 | The SB/BB `re-raise` scripts (`:97-98`) are "not mine" → replace them with own routes (R8, R9). Insert 6 `re-raise-not-mine` scripts after them, in D-2 order. |
| `tests/advice/preflop-voided-raise.acceptance.test.ts:74` | TASK-10.17 | `'re-raise'` → `'re-raise-not-mine'` |
| `tests/advice/labels.acceptance.test.ts:37-47` | TASK-8.5 | add the Q-1 label to `expected` and the key to the sorted list. `re-raise` unchanged |
| `tests/bots/rock.acceptance.test.ts:134-141,150,197-203` | TASK-6.5 | `COUNTS` gains 6 counts after the re-raise row; 26 → 32; per-position `unions` only if the new spots change them |
| `tests/bots/tag.acceptance.test.ts:155` | TASK-6.1 | add `'re-raise-not-mine'` to the expected situation set |
| `tests/golden/preflop-spots.json` | TASK-7.11 | append the 3 A-6 spots |

Checked and expected unchanged. If one does fail, the builder stops and reports it rather than editing it:
- `tests/advice/six-max-chart.acceptance.test.ts:63-117`
- `tests/advice/table-sizes.acceptance.test.ts` (TASK-7.6). It checks only heads-up and full ring: `:136-148`
  compares their situation sets and `:232-262` uses own and full-ring routes.
- `tests/golden/graded-lines.acceptance.test.ts:143` (TASK-7.36)
- `tests/golden/preflop.acceptance.test.ts` (TASK-7.11)
- `tests/table/review.acceptance.test.ts:84-92` (TASK-9.1). Under D-8, CO A9o folds in the new spot.
- `tests/bots/tag-mixing.acceptance.test.ts` (TASK-6.2)
- `tests/bots/tag-short-handed.acceptance.test.ts` (TASK-7.37, TASK-7.46)
- `tests/bots/tag-short-handed-playtest.acceptance.test.ts` (TASK-7.37, slow)
- `tests/advice/explanations.acceptance.test.ts` (TASK-7.10, slow). Its sample must now include
  `6-max re-raise-not-mine`, which is common in random play (§3).
- `tests/playtest/check-styles*.acceptance.test.ts` (TASK-6.11/6.25/7.46, slow)
- `tests/bots/style-bands.acceptance.test.ts` (TASK-6.16/6.17/6.25, slow)
- `tests/bots/tag-playtest.acceptance.test.ts` (TASK-6.1, slow)
- `tests/stats/healthy-ranges-tag.acceptance.test.ts` (TASK-10.3, slow)

### Error handling and configuration
- An invalid or missing new spot makes `parseChart` throw `ChartValidationError` at import (existing behaviour). For
  example: `6-max chart: missing spot CO re-raise-not-mine`.
- A missing Rock spot fails `parseStyle` (`rock.json: style Rock starting range is missing spot CO re-raise-not-mine`).
- No configuration and no new dependencies.

## 6. Behaviour specification

### SPEC-01: 6-max two-raise spots read the own-raise or the not-my-raise spot (A-2)
- Verifies: AC#1
- Behaviour: Given each route R1–R12 in §5 at 6 seats, When `recommendPreflop` runs for the hero with every one of
  the 169 hand classes, Then:
  - `situation` and `position` equal the table's "Expected";
  - `cell` equals `chartCell(SIX_MAX_CHART, position, situation, hc)`;
  - `situationOf(view)` agrees.

  R5 with a `raise` cell gives action `call` (cap). The test also checks a 3-seat and a 7-seat cold route (UTG opens,
  next seat 3-bets, the later seat is hero): both give `re-raise-not-mine`, because 3–7 seats use the 6-max chart.
- Verification: acceptance `tests/advice/re-raise-split.acceptance.test.ts::AC#1 6-max re-raise routes read the own-raise or the not-my-raise spot`

### SPEC-02: The 6-max chart has 32 complete spots in the agreed order
- Verifies: AC#2
- Behaviour: Given `SIX_MAX_CHART`, Then:
  - `APPLICABLE_SPOTS['6-max']` and the chart's spots both list exactly the 32 (position, situation) pairs of D-2, in
    order.
  - Each spot has all 169 classes.
  - Each new spot's justification has ≥ 15 words.
  - `npm run chart:print 6-max` prints `6-max chart: 32 spots`.

  The re-pinned locked `tests/advice/preflop.acceptance.test.ts::AC#1 every 6-max spot assigns all 169 hand classes
  and a missing spot is named` passes with its 32 scripts.
- Verification: acceptance `tests/advice/re-raise-split.acceptance.test.ts::AC#2 the 6-max chart has 32 spots with all 169 classes`

### SPEC-03: Own-raise re-raise spots keep 80–90% of the opening range
- Verifies: AC#2
- Behaviour: Given the revised chart, When the locked TASK-7.19 tests run, Then:
  - each of UTG, HJ, CO and BTN `re-raise` continues with C/O in [0.80, 0.90] of `<P> unopened` raise combos, with no
    hand outside it;
  - SB keeps the same rule against its unopened raise set;
  - BB keeps ≥ 80% of its raised set and stays ⊆ BB blind-defence continue;
  - only premium hands raise.

  These test files are not edited, apart from the `:119` count.
- Verification: acceptance `tests/advice/six-max-chart.acceptance.test.ts::openers continue against a re-raise with 80 to 90 percent of their opening range`

### SPEC-04: Not-my-raise spots follow the Q-3 authoring rule; CO A9o/A8o fold there
- Verifies: AC#2, AC#3
- Behaviour: Given each `P re-raise-not-mine`, Then rules 1–3 of §5 "Authoring rules" hold:
  - subset of the one-raise spot;
  - premium-only raises, with AA, KK and QQ `R`;
  - width inside its band.

  On failure the test lists each offending class as `<spot>: <hc> continues but folds in <one-raise spot>`. CO A9o
  and A8o have action `fold` in `CO re-raise-not-mine`. A mutation check: copying today's `CO re-raise` grid into
  `CO re-raise-not-mine` fails rule 1 (for example KTo and A7s continue but fold in CO raise).
- Verification: acceptance `tests/advice/re-raise-split.acceptance.test.ts::AC#2 AC#3 not-my-raise spots continue only with hands that continue against one raise`

### SPEC-05: Every re-raise and not-my-raise text is true for its routes and agrees with its grid
- Verifies: AC#2
- Behaviour: Given the 12 spot texts and the chart-level text next to `npm run chart:print 6-max`, Then:
  - (a) No sentence is false for any route listed in §5 rule 5 (not mine) or in the own routes (re-raise).
  - (b) Every hand or group the text names under an action has that action in the grid.
  - (c) `re-raise` texts no longer claim to cover cold or called-then-3-bet routes.
  - (d) The wording is original (REQ-061.2).
- Verification: manual Reviewer and judge walk each of the 12 spots against its routes and grid. Record pass or fail
  per spot, quoting any false sentence.

### SPEC-06: Not-my-raise has an approved context sentence and label; the hint chart line shows no label
- Verifies: AC#4
- Behaviour: Given the CO cold route R2 with A9o, When `recommendPreflop` runs, Then:
  - `explanation` starts with `PREFLOP_CONTEXT['re-raise-not-mine']` (the exact Q-2 text, with `{def:hand-strength}`
    filled as for `re-raise`);
  - it has ≤ 3 sentences;
  - `SITUATION_LABELS['re-raise-not-mine']` equals the exact Q-1 text;
  - `PREFLOP_CONTEXT['re-raise']` and `SITUATION_LABELS['re-raise']` equal today's strings (D-4);
  - `chartBasisText` for that recommendation does not contain the label (decision-7).

  The re-pinned locked `tests/advice/labels.acceptance.test.ts::labels each situation` passes.
- Verification: acceptance `tests/advice/re-raise-split.acceptance.test.ts::AC#4 the not-my-raise context sentence and label use the approved wording`

### SPEC-07: Rock has a strict-subset range for every new spot
- Verifies: AC#5
- Behaviour: Given `rock.json`, When `parseStyle` validates it against `SIX_MAX_CHART`, Then:
  - it holds 32 spots in `APPLICABLE_SPOTS` order;
  - each `re-raise-not-mine` range follows A-5: only TAG non-fold classes, and fewer classes than the TAG spot;
  - the per-position unions stay narrower.

  The re-pinned locked `tests/bots/rock.acceptance.test.ts` passes (26 → 32, `COUNTS` extended).
- Verification: acceptance `tests/bots/rock.acceptance.test.ts::every Rock range class is a TAG non-fold cell and each range is narrower`

### SPEC-08: Each new situation has a golden spot
- Verifies: AC#5
- Behaviour: Given `tests/golden/preflop-spots.json` with the 3 A-6 spots appended, When the locked golden tests
  run, Then:
  - each new spot's `situation` equals `situationOf(view)` = `re-raise-not-mine`;
  - each action matches the chart;
  - the coverage test finds `6-max re-raise-not-mine`.

  The existing 110 entries are byte-for-byte unchanged.
- Verification: acceptance `tests/golden/preflop.acceptance.test.ts::AC#4 at least 100 spots covering every reference size and chart situation`

### SPEC-09: Heads-up and full-ring advice is unchanged
- Verifies: AC#6
- Behaviour: Given a 9-seat cold route (UTG opens, CO 3-bets, BTN is hero) and a 9-seat called-then-3-bet route,
  When `recommendPreflop` runs for all 169 classes, Then:
  - `situation` is `re-raise`;
  - `cell` equals `chartCell(FULL_RING_CHART, position, 're-raise', hc)`;
  - the explanation starts with today's `re-raise` context sentence.

  In a 300-hand random playtest at 2 seats and another at 9 seats, no preflop view has `situationOf` =
  `re-raise-not-mine`. `APPLICABLE_SPOTS['heads-up']` and `APPLICABLE_SPOTS['full-ring']` still have 6 and 41 spots.
  `git diff <base> -- src/advice/charts/heads-up.json src/advice/charts/full-ring.json` is empty.
- Verification: acceptance `tests/advice/re-raise-split.acceptance.test.ts::AC#6 heads-up and full-ring advice is unchanged`

### SPEC-10: A forced-fold voided raise still does not count
- Verifies: AC#1
- Behaviour: Given the TASK-10.17 routes, When a raise was voided, Then the count ignores it, as today. Without a
  forced fold, the BB facing `3:raise 4:raise` reads `re-raise-not-mine` (re-pinned `:74`).
- Verification: acceptance `tests/advice/preflop-voided-raise.acceptance.test.ts::without a forced fold the situation is unchanged`

### SPEC-11: All checks pass, with only the listed locked edits
- Verifies: AC#7
- Behaviour: Given the finished change, When the commands below run, Then:
  - lint, typecheck and `npm test` exit 0, with no `ERROR: Coverage` line;
  - `git diff --stat <base> --` limited to the locked files in §5 shows only the "Edits required" files;
  - no new import appears in `src/advice/**` (`tools/lint/headless-boundary.js:312-325`).
- Verification: command `npm run lint && npm run typecheck && npm test && git diff --stat $(jq -r .base_commit doit/TASK-7.40/state.json) -- tests e2e`

### SPEC-12: The builder writes a sign-off package; the user signs off the 12 spots before review
- Verifies: AC#7
- Behaviour: Given the build passes SPEC-01 to SPEC-11 (gate green), When the builder finishes, Then
  `doit/TASK-7.40/signoff.md` exists and contains, in this order:
  1. The `npm run chart:print 6-max` blocks (header line, 13-row grid and "Why:" text, verbatim) of the 12 spots:
     UTG, HJ, CO, BTN, SB, BB `re-raise-not-mine` and UTG, HJ, CO, BTN, SB, BB `re-raise`.
  2. A table of every `re-raise` cell whose token changed: `spot | hand | before | after` (before = base commit).
     "None" if no cell changed.
  3. The own-raise shares as printed by the locked SPEC-03 test: `P: C/O = c/o (share)` for UTG, HJ, CO, BTN and SB,
     plus BB kept/raised combos.
  4. The D-8 choice for CO A9o and A8o in `CO re-raise` (token and one-line reason), and their `F` in
     `CO re-raise-not-mine`.
  5. The not-my-raise widths beside the Q-3 bands (for example `CO re-raise-not-mine: continue 5.1% (band 2–8%)`).

  The orchestrator then shows the package to the user in one AskUserQuestion, before code review. The options are:
  sign off / sign off with listed tweaks / request changes. Tweaks are applied, the gate and `signoff.md` are re-run,
  and only then does review start. The orchestrator appends a dated sign-off entry to the TASK-7.40 notes, and AC#7
  is checked only after that entry exists (Q-4).
- Verification: manual The orchestrator checks that `doit/TASK-7.40/signoff.md` has the five sections, and that
  `backlog task view TASK-7.40 --plain` shows the sign-off entry before Done.

### SPEC-13: Short-handed TAG stays healthy, with before/after figures
- Verifies: AC#8
- Behaviour: Given the base chart and then the final chart, When the opt-in slow test runs for each, Then:
  - after: all-TAG 3- and 4-seat VPIP, PFR, aggression, WTSD and W$SD are inside `HEALTHY_RANGES['6-max']`;
  - `doit/TASK-7.40/changes.md` has a before/after table of the ten printed figures (A-7).

  The run is not added to `npm test` or CI pushes.
- Verification: command `TLH_SLOW_TESTS=1 npx vitest run tests/bots/tag-short-handed-playtest.acceptance.test.ts`

## 7. Edge cases
- Fourth bet after our own 3-bet (cap): R5, SPEC-01. Fourth bet with no raise of our own (for example the BB
  called, then a 3-bet and a 4-bet came): `re-raise-not-mine`, with `raise` → `call` at the cap (existing
  `recommendPreflop` logic, `src/advice/preflop.ts:147-152`). Covered by SPEC-01's cap check.
- Voided raises (TASK-10.17): SPEC-10, A-2.
- 3 and 7 seats read the 6-max chart: SPEC-01. The short-handed TAG chart picks up the new spots (AC#8, SPEC-13).
- Heads-up cannot reach "not mine" (D-3). Full ring falls back to `re-raise`: SPEC-09.
- Limpers fallback in `chartSpotOf` affects only `limpers`: N/A.
- Rock at full ring keeps today's `re-raise` range for cold spots (A-3): covered by the unchanged locked Rock and
  playtest suites.
- Invalid input, concurrency, permissions: N/A. Pure functions on validated shipped JSON.

## 8. Security considerations
N/A:
- Untrusted input: none. The chart and style JSON are shipped and validated at import.
- New dependencies: none.
- Randomness: none added (A-4, no new TAG mixing).
- Imports: none new across the advice/bot boundary (`tools/lint/headless-boundary.js:303-325`).

## 9. Non-functional
- Chart parsing grows from 26 to 32 spots × 169 cells, which is negligible.
- The new acceptance test's 300-hand sweeps at 2 and 9 seats must finish well under the default test timeout. The
  similar 200–300-hand sweeps in `tag-mixing` run in seconds. No 100,000-hand run outside `npm run test:slow`
  (standing user rule).
- Coverage stays ≥ 90% lines.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run chart:print 6-max` (prints the 32 spots, which the user signs off)
- New tests:
  - `tests/advice/re-raise-split.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-04, SPEC-06, SPEC-09.
  - Re-pinned locked tests → SPEC-02, SPEC-06, SPEC-07, SPEC-08, SPEC-10.
  - Slow run → SPEC-13.
- End-to-end for the Judge:
  1. Run `npm run chart:print 6-max`. Confirm `6-max chart: 32 spots`, and confirm that `CO re-raise-not-mine`
     continue is ≤ `CO raise` continue (8.4%) and that the 4 opener `re-raise` spots are still 80–90% of their open.
  2. Run `npm test`, then the SPEC-13 slow test.
  3. Compare the R2/R3 explanations in the new test's output with the Q-2 text.
  4. Check the sign-off entry (SPEC-12).

## 11. Open questions
None. Q-1 to Q-4 were answered on 2026-11-27 (`doit/TASK-7.40/qa.md`) and are folded into D-5, D-6, D-7, §5 and
SPEC-04, SPEC-06 and SPEC-12.

## 12. Clarifications log
See `doit/TASK-7.40/qa.md`.
