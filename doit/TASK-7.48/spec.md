# Spec: TASK-7.48 — Scale observed open-raise and calling ranges by PFR and VPIP relative to a typical player

Status: READY (approved 2026-11-28)
Task: TASK-7.48 · Parent/epic: TASK-7 · Requirements: REQ-035 (035.6 as reworded by TASK-7.45, 035.2), REQ-046.1 · Dream: limit-holdem-trainer

## 1. Summary
Today `estimateOpponentRanges` scales an observed `open-raise` toward raw PFR and `limp`, `call-raise` and
`call-three-bet` toward raw VPIP, so a typical 6-max 24/18 player's BTN open goes from 34.54% to 18% and a
typical heads-up caller's BTN call-raise from 11.76% to 77.5%. This story applies decision-8 (TASK-7.45 Q-1 D)
and REQ-035.6 as already reworded (`dreams/limit-holdem-trainer/requirements.md:646`): open-raise
`o = min(100, d × PFR ÷ typical PFR)`, calling lines `o = min(100, d × VPIP ÷ typical VPIP)`, with a new
`TYPICAL_VPIP` constant (healthy VPIP midpoints 77.5 / 24 / 16.5). It re-pins the locked tests that pin the
raw rule, re-tunes the one golden spot that stops being clear-cut, and updates `docs/advice/range-model.md`.

## 2. Scope
- In scope:
  - `src/advice/ranges.ts`: `TYPICAL_VPIP` + `typicalVpip`, `OBSERVED_LINE_STAT` change, the `o` computation,
    and doc comments (SPEC-01..05).
  - New locked acceptance test `tests/advice/observed-relative.acceptance.test.ts` (SPEC-01..03, SPEC-07).
  - Unit tests in `tests/advice/observed-ranges.test.ts`: the `TYPICAL_VPIP` drift test (SPEC-04) and two re-pins
    (SPEC-05).
  - Locked re-pins under their owners (SPEC-06, the complete list in §5 "Locked re-pins").
  - The golden spot `6max-turn-bb-call-a6s` re-tune in `tests/golden/postflop-spots.json` (SPEC-08, needs Q-1),
    approved by the user as Q-1 (`qa.md`), plus a confirmation of the approved numbers (SPEC-09).
  - `docs/advice/range-model.md` line-to-stat table, typical-player paragraph and Known limits (SPEC-07).
- Not doing:
  - Changing the blend formula `d + (o − d) × min(n,100) ÷ 100`, the 30-hand threshold, `resizeRange`, the hand
    order, the three-bet/four-bet rule, the `check` line (not scaled) or any default range file
    (`src/advice/ranges/*.json`).
  - The preflop charts (`src/advice/charts/*.json`, changed by TASK-7.40/7.41/7.42): they drive the hero's
    chart advice, not opponent ranges (§3).
  - `dreams/limit-holdem-trainer/requirements.md`: REQ-035.6 and changelog row 1.18 were already written by
    TASK-7.45 (`requirements.md:646`, `:1378`).
  - Bots, bot playtests or seeded bot tests: bots never pass an observed snapshot (§3), so nothing they do changes.
  - Any new stat or persisted-format change; `rtm.md`.
  - Speed or scale checks in `npm test`. `tests/advice/observed-resize.acceptance.test.ts` is already listed in
    the opt-in `npm run test:slow` (`package.json` scripts); it stays there and nothing new is added to the
    default run that measures speed.
  - The three other observed golden spots (they still agree and are clear-cut, §3) and every non-observed spot.
- Scope budget: files=10, lines=300   (src 1 file ~25 lines; new acceptance test ~130; unit test ~35; 5 locked
  re-pins ~60; golden JSON ~3; doc ~25. The sign-off file is outside the repo and not counted.)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The relative rule reuses `relativePfrPct(d, stat, typical)` (`src/advice/ranges.ts:365-367`) for all five scaled lines; it is renamed `relativeStatPct` and `relativePfrPct` stays as an exported alias (`export const relativePfrPct = relativeStatPct;`) because locked `tests/advice/observed-reraise.acceptance.test.ts:182-183` imports it. Its doc comment states it serves every scaled line. | yes | Task text: "reuse relativePfrPct (generic min(100, d x stat / typical))". Keeping the old name avoids a locked re-pin that adds nothing. | Keep only the old name (misleading for VPIP lines); rename and re-pin the reraise test. |
| A-2 | `OBSERVED_LINE_STAT` maps `limp`, `call-raise`, `call-three-bet` → `'relative-vpip'`, `open-raise`, `three-bet`, `four-bet` → `'relative-pfr'`, `check` → `null`; the raw `'vpip'` / `'pfr'` values are removed from its type. | yes | Every scaled line is now relative; dead branches would fail coverage. | Keep raw values in the type. |
| A-3 | `observed-reraise.acceptance.test.ts` AC#6 (`:242-259`) asserts the doc row `` | `open-raise` | PFR % | `` (`:248`). AC#7 forces that row to change, so this one line is re-pinned too under owner TASK-7.44 (same unlock as AC#4/AC#5). The rest of AC#6 (the three-bet row, the 57.5/18/12.5/6.41%/1.28% paragraph, the Known-limits phrases) passes unchanged, so the doc keeps the three-bet/four-bet row separate and keeps those numbers in the first paragraph after the table. | yes | Not in the task's re-pin list, but it is the same owner and file already being unlocked, and the edit is the AC#7 doc change itself. | Merge the PFR rows in the doc (breaks two AC#6 lines). |
| A-4 | AC#5's "VPIP 100 gives 69.75" is 16.7421 × 100 ÷ 24 = 69.7587 (truncated in the task text). Tests pin it as `toBeCloseTo(69.76, 2)`; within 0.01 of both. | yes | Measured on main with the prototype (§3). | Pin 69.75 at tolerance 0.01 (also passes). |
| A-5 | The sign-off package (SPEC-09) is written by the builder to `/private/tmp/claude-501/-Users-gregwhite-Documents-claudeworkspaces-limitholdem/4f7a755b-7d9f-4f95-8508-90fc0fabf0c8/scratchpad/t748/signoff.md`, outside the repo, because the builder hook blocks writes in `doit/TASK-7.48/` other than changes.md/build-log.md/blocked.json (`~/.claude/skills/doit/scripts/doit.py` `hook_builder_pretool`). The orchestrator checks it before code review; it goes back to the user only if a number differs (Q-1). | yes | Caller's instruction. | Put it in changes.md. |
| A-6 | The new acceptance tests build views with a local copy of the `stateAfter` / `toActView(steps, seats)` / `folds` helpers from `tests/advice/observed-reraise.acceptance.test.ts:34-60` (any seat count), as the other observed acceptance files do. | yes | Locked files may not import each other's private helpers; same pattern as TASK-7.44. | A shared support module (touches locked imports). |

## 3. Current system
All measured on main `f6a561e9` with a scratch worktree prototype of the rule (A-1/A-2 code, 16 lines in
`ranges.ts`), probes run with `node --import tools/playtest/resolve-ts.js`; the worktree was removed afterwards.

- **Rule location.** `estimateOpponentRanges` (`src/advice/ranges.ts:666-711`) reads `OBSERVED_LINE_STAT`
  (`:622-630`; today `open-raise` → `pfr`, calling lines → `vpip`, re-raises → `relative-pfr`) and computes
  `o` at `:688-691` (`relative-pfr` → `relativePfrPct(widthPct, obs.pfr, typicalPfr(size))`, else `obs[stat]`),
  then `scaledWidthPct` (`:347-350`) and `resizeRange` (`:388-407`). `TYPICAL_PFR`/`typicalPfr` at `:352-362`;
  `relativePfrPct` at `:364-367`. Doc comment at `:659-665` names the raw rule and must change.
- **Default-width source (d).** `defaultRange(rangesFor(players), position, line)` (`:246-256`, `:684`) reads
  `src/advice/ranges/{heads-up,six-max,full-ring}.json`: exactly one range per (position, line). Those files
  were last changed by TASK-7.43/7.44 (`git log -- src/advice/ranges/`); TASK-7.40/7.41/7.42 changed only
  `src/advice/charts/*.json` (the hero's preflop chart, where `blind-defence-early/late` lives: 0 matches in
  `src/advice/ranges/*.json`). So the observed line model does **not** care which seat opened: a 6-max BB
  `call-raise` is always d = 41.4781 whether the opener was early or late. All d values in the task still hold.
- **TASK-7.39** changed calling-range sampling at 7+ opponents in `src/advice/postflop.ts` (equity, not widths).
  The 4 golden spots and the review-numbers story are 6-max with 1–2 opponents; their numbers below were
  measured on current main and include it.
- **Bots.** `BOT_ADVICE = { opponentRanges: 'actions' }` (`src/bots/tag.ts:38`), so bots do use action ranges,
  but every bot builds options as `{ ...BOT_ADVICE, ...adviceOptions(options) }` (`src/bots/tag.ts:73-74`,
  `maniac.ts:28-29`, `rock.ts:27`, `calling-station.ts:42-43`) and `adviceOptions` copies only `equity`, `chart`
  and `opponentRanges` (`src/advice/recommend.ts:33-39`): `observedOpponents` is dropped, so
  `estimateOpponentRanges` gets `[]` and the rule never runs for bots (REQ-029.2; doc
  `docs/advice/range-model.md:444-446`). Seeded bot tests are out of scope.
- **Measured widths (prototype, n = 100, so width = o)** — every AC number holds:
  - 6-max BTN open-raise d 34.5400: PFR 18 → 34.5400, PFR 45 → 86.3499, PFR 9 → 17.2700 (AC#1).
  - 6-max BB call-raise d 41.4781: VPIP 24 → 41.4781, 40 → 69.1302, 12 → 20.7391, 60 → 100 (cap) (AC#2).
  - Heads-up BTN call-raise d 11.7647 at VPIP 77.5 → 11.7647; full-ring BB call-raise d 27.6018 at VPIP 33 →
    55.2036 (AC#3). 6-max CO call-raise d 16.7421 at VPIP 100 → 69.7587 (A-4); UTG open-raise d 12.2172.
- **Tests failing under the prototype (full `npx vitest run`)** — exactly the task's list plus one doc line:
  observed-ranges.acceptance AC#2; observed-resize AC#1, AC#2, AC#3 (PFR 5 case); observed-reraise AC#4, AC#5;
  small-table-ranges AC#1 (`:153` gets 100, pinned 60); review-numbers `basis lines…` (`:227`, 34.4% vs 34.3%)
  and `the review repeats the flop hint…` (`:269`, 33.7% vs 34.3%); observed-ranges.test.ts `caps the observed
  hands at 100` (`:230`, 23.7557 vs 35) and `scales each line by its stat…` (`:253`); and the two golden files
  fail at load on the a6s spot (`postflop.acceptance`, `postflop-lines.acceptance`). observed-reraise AC#6
  passes today but breaks when the doc row changes (A-3). Everything else passes, including observed-ranges
  AC#5/AC#6, observed-range-tidy AC#1, the PFR 0 / VPIP 0 floor cases of observed-resize AC#3, determinism,
  hint, decision-record, observed-record and `tests/table/observed-resume.acceptance.test.ts`.
- **Golden spots** (`tests/golden/postflop-spots.json`; ids at `:270`, `:792`, `:821`, `:1161`; clear-cut rule
  `src/advice/golden.ts:500-528`: every other legal action must grade Major, i.e. aggression margin ≥ 15 or
  call/fold margin ≥ 10). Old rule → new rule on current main:

  | Spot | Opponent line | Stats n/VPIP/PFR | Width old → new | Equity old → new | Result under new rule |
  |---|---|---|---|---|---|
  | `6max-flop-btn-raise-a8s` | BB call-raise | 45/41/12 | 41.26 → 54.70 | 82.7 → 82.9 | raise agrees; call Major (aggression 17.9), fold Major (67.5). Clear-cut. |
  | `6max-turn-bb-call-a6s` | BTN open-raise | 100/22/18 | 18.00 → 34.54 | 45.3 → 52.3 | call agrees; **raise only Minor (aggression 12.7 < 15)** → load fails. |
  | `6max-turn-btn-fold-55` | CO open-raise | 80/19/15 | 16.71 → 20.39 | 4.1 → 3.8 | fold agrees; call/raise Major (22.0). Clear-cut. |
  | `6max-river-bb-bet-aks` | UTG call-three-bet | 60/34/27 | 24.26 → 12.07 | 90.7 → 86.8 | bet agrees; check Major (36.8). Clear-cut. |

  a6s re-tune candidates (new rule; all agree on `call`; value threshold 65, required equity 24.2):

  | Variant | Width | Equity | raise margin | fold margin | Clear-cut |
  |---|---|---|---|---|---|
  | stats 100/12/9 (tight raiser) | 17.27 | 45.3 | 19.7 | 21.1 | yes |
  | stats 100/16/12 | 23.03 | 47.4 | 17.6 | 23.2 | yes |
  | stats 100/20/14 | 26.86 | 50.0 | 15.0 | 25.8 | yes, on the edge |
  | stats 100/20/15 | 28.78 | 50.3 | 14.7 | 26.1 | no |
  | keep 22/18, hero A2s/A3s/A4s/A5s/A7s | 34.54 | 52.3–52.4 | 12.6–12.7 | 28.1 | no (kicker does not help) |

  VPIP does not affect an open-raise line, so it is chosen only to be a plausible profile (VPIP ≥ PFR).
- **e2e.** `e2e/observed-resume.spec.ts` (TASK-8.6) and `e2e/hint-observed.spec.ts` assert relational facts
  (recompute equals stored, basis text), not widths. Under the prototype with the a6s re-tune both pass
  (8/8, chromium + webkit), and the full `npx vitest run` had exactly the 11 failing tests listed above (6 files;
  the golden files load). The Judge re-runs both e2e files (§10).
- **Lock owners** (from `locked_tests` in every `doit/*/state.json`; current file SHA matches the newest owner):
  - `tests/advice/observed-ranges.acceptance.test.ts` — TASK-7.13 and TASK-7.43.
  - `tests/advice/observed-resize.acceptance.test.ts` — TASK-7.43.
  - `tests/advice/observed-reraise.acceptance.test.ts` — TASK-7.44.
  - `tests/advice/small-table-ranges.acceptance.test.ts` — TASK-7.35.
  - `tests/ui/review-numbers.acceptance.test.tsx` — TASK-9.3 and TASK-7.43.
  - `tests/golden/postflop-spots.json` — TASK-7.14.
  - Unchanged, must pass: `tests/golden/postflop.acceptance.test.ts` (TASK-7.14, TASK-7.33),
    `tests/golden/postflop-lines.acceptance.test.ts` (TASK-7.31, TASK-7.43),
    `tests/advice/observed-range-tidy.acceptance.test.ts` (TASK-7.30), `e2e/observed-resume.spec.ts` and
    `tests/table/observed-resume.acceptance.test.ts` (TASK-8.6).
  - TASK-7.40/7.41/7.42 locked no file in this list.
  The orchestrator runs `python3 ~/.claude/skills/doit/scripts/doit.py unlock <owner> <file> --reason "TASK-7.48
  AC#5/AC#6: re-pin to decision-8 relative rule"` for every owner of every changed file before the build.
  That is 8 unlocks: TASK-7.13 and TASK-7.43 for observed-ranges.acceptance; TASK-7.43 for observed-resize;
  TASK-7.44 for observed-reraise (AC#4, AC#5 and the AC#6 doc row, A-3); TASK-7.35 for small-table-ranges;
  TASK-9.3 and TASK-7.43 for review-numbers; TASK-7.14 for postflop-spots.json.
- **Docs.** `docs/advice/range-model.md`: blend text `:318-321`, line-to-stat table `:323-328`, typical-PFR
  paragraph `:330-334`, Known limits `:356-359`. Other tests reading this doc
  (`small-table-ranges` AC#1 `:168-186`, `size-ranges` AC#3 `:256-273`, `range-model` `:386-391`) check
  unrelated strings and keep passing.
- **Toolchain.** TypeScript strict, Vitest (`npm test` = `vitest run --coverage`), ESLint + Prettier
  (`npm run lint`), `tsc` (`npm run typecheck`), Playwright (`npm run e2e`). Advice code may not import
  `src/stats` (lint boundary, comment `src/advice/ranges.ts:352-353`).
- Existing code to reuse:
  - `src/advice/ranges.ts:364-367` `relativePfrPct` → the generic `min(100, d × stat ÷ typical)` (A-1).
  - `src/advice/ranges.ts:352-362` `TYPICAL_PFR`/`typicalPfr` → copy for `TYPICAL_VPIP`/`typicalVpip`.
  - `tests/advice/observed-ranges.test.ts:311-321` → copy for the `TYPICAL_VPIP` drift test
    (`HEALTHY_RANGES[size].vpip`).
  - `tests/advice/observed-reraise.acceptance.test.ts:34-60` → view helpers for the new acceptance file (A-6).
  - `parsePostflopGoldenSpots`, `goldenPostflopAdvice`, `gradeDecision` (`src/advice/golden.ts:488-498`,
    `:615-629`; `src/advice/grade.ts`) → re-measuring the golden spot for SPEC-08/09.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Open-raise o = min(100, d × PFR ÷ typical PFR); limp, call-raise, call-three-bet o = min(100, d × VPIP ÷ typical VPIP); typical VPIP 77.5 / 24 / 16.5. | (see TASK-7.45 §3 options A–C) | decision-8 / REQ-035.6 | yes | user (TASK-7.45 Q-1) |
| D-2 | Re-tune `6max-turn-bb-call-a6s` by changing only the button's observed stats to 100/12/9 and rewording the justification to "a tight raiser" (SPEC-08). | 100/16/12 (margin 17.6); 100/20/14 (margin exactly 15.0); change hand or board (kicker changes measured: none clear-cut); drop the spot's stats (then it is no longer an observed spot and observed-reraise AC#5 needs 4) | Keeps board, hand, action line and the engine's numbers identical to the spot as it stands today (equity 45.3, margins 19.7/21.1) and still exercises observed narrowing (17.27 < d 34.54). | yes | user (Q-1, 2026-11-28) |
| D-3 | New behaviour is tested in one new locked file; the locked re-pins change only the listed assertions. | Add the new cases to observed-reraise (TASK-7.44's file) | A new owner file for TASK-7.48's ACs; owner files keep their stories. | no | n/a |

## 5. Design

### Files to create / modify
- `src/advice/ranges.ts` — `TYPICAL_VPIP`, `typicalVpip`, `relativeStatPct` (+ `relativePfrPct` alias),
  `OBSERVED_LINE_STAT`, the `o` computation, doc comments.
- `tests/advice/observed-relative.acceptance.test.ts` — new: SPEC-01, 02, 03, 07.
- `tests/advice/observed-ranges.test.ts` — SPEC-04 drift test; SPEC-05 re-pins.
- `tests/advice/observed-ranges.acceptance.test.ts` — AC#2 re-pin (SPEC-06).
- `tests/advice/observed-resize.acceptance.test.ts` — AC#1, AC#2, AC#3 PFR-5 case re-pins (SPEC-06).
- `tests/advice/observed-reraise.acceptance.test.ts` — AC#4, AC#5, AC#6 line `:248` re-pins (SPEC-06, SPEC-08, A-3).
- `tests/advice/small-table-ranges.acceptance.test.ts` — AC#1 `:153` re-pin (SPEC-06).
- `tests/ui/review-numbers.acceptance.test.tsx` — `:227` and `:269` re-pins (SPEC-06).
- `tests/golden/postflop-spots.json` — `6max-turn-bb-call-a6s` stats and justification (SPEC-08).
- `docs/advice/range-model.md` — table, typical paragraph, Known limits (SPEC-07).

### Components, interfaces and data
```ts
/** Midpoint of the healthy VPIP band per reference size (REQ-035.6, REQ-046.1; src/stats/healthy-ranges.json).
 *  A copy, because advice code may not import src/stats (lint boundary); a test keeps it in step. */
export const TYPICAL_VPIP: Readonly<Record<ReferenceSize, number>> = { 'heads-up': 77.5, '6-max': 24, 'full-ring': 16.5 };
export function typicalVpip(size: ReferenceSize): number;
/** Observed target o for every scaled line: d × stat ÷ typical, at most 100 (REQ-035.6). */
export function relativeStatPct(d: number, stat: number, typical: number): number; // Math.min(100, (d * stat) / typical)
export const relativePfrPct = relativeStatPct; // kept: locked tests import it (A-1)
const OBSERVED_LINE_STAT: Readonly<Record<PreflopLine, 'relative-vpip' | 'relative-pfr' | null>>;
```
In `estimateOpponentRanges`: `o = stat === 'relative-pfr' ? relativeStatPct(d, obs.pfr, typicalPfr(size)) :
relativeStatPct(d, obs.vpip, typicalVpip(size))`. Signatures, errors and the `OpponentRange` shape are unchanged.

### Rules and algorithms
- n ≥ 30 and line scaled: `o = min(100, d × stat ÷ typical)`, `width = scaledWidthPct(d, o, n)`; else default.
- Worked: 6-max BB call-raise d 41.4781, VPIP 40, n 100 → 69.1302; VPIP 60 → 103.70 → 100; VPIP 60 at n 50 →
  41.4781 + (100 − 41.4781) × 0.5 = 70.74. 6-max BTN open d 34.54, PFR 45, n 100 → 86.35; at n 50 → 60.44.
- At the typical stat (`stat = typical`) `o = d`, so `width = d` at every n and `resizeRange` returns the default.
- d = 0 never occurs (every authored range has ≥ 1 class); stat 0 → o 0 → strongest default class (unchanged).

### Locked re-pins (complete list; each only as stated, nothing else in the file changes)
1. `observed-ranges.acceptance.test.ts` AC#2 (`:117-155`): the expected `o` becomes `d × pfr ÷ 18` for
   `open-raise` and `d × vpip ÷ 24` for `call-raise` (literals 18 and 24, capped at 100), replacing
   `snapshot[stat]` at `:147`. The `a.start` ≠ `b.start` check and basis text stay.
2. `observed-resize.acceptance.test.ts` AC#1 (`:107-128`): the snapshot uses `pfr: 18` for the raiser and
   `vpip: 24` for the caller (the 6-max typical stats; the other stat any valid value), so width = d.
   AC#2 (`:130-159`): the target becomes the CO caller's relative width at VPIP 60, `d × 60 ÷ 24` %
   (41.8552% of 1326 combos) and `strongestClasses` uses that width (22 is still in the default and not in
   that prefix: measured); the VPIP 100 case asserts `widthPct` ≈ 69.76 (2 dp, A-4) and
   `start = expandRange(resizeRange(base, widthPct))` (129 classes), and a new line asserts
   `resizeRange(base, 100)` holds all 169 classes. AC#3 (`:161-195`): the narrow target becomes
   `d × 5 ÷ 18` % (UTG open d 12.2172 → 3.394%); the PFR 0 and VPIP 0 floor cases are unchanged.
   The test name and AC wording stay (still true).
3. `observed-reraise.acceptance.test.ts` AC#4 (`:186-213`): renamed `AC#4 open-raise scales by PFR and calling
   lines by VPIP relative to a typical player`; expected `o = min(100, d × obs.pfr ÷ 18)` for open-raise and
   `min(100, d × obs.vpip ÷ 24)` for the three calling lines. AC#5 (`:216-240`): renamed `AC#5 the 4 observed
   golden postflop spots agree, are clear-cut and sit at the relative-rule width`; `stat` becomes the relative
   `o` (typical from `rangesFor(...).referenceSize`: 18 / 24 at 6-max), and each spot's width is pinned within
   0.01: a8s 54.70, a6s 17.27 (Q-1), 55 20.39, aks 12.07. AC#6 `:248`: the expected row becomes
   `` | `open-raise` | d × PFR % ÷ typical PFR %, at most 100 | `` (A-3).
4. `small-table-ranges.acceptance.test.ts` AC#1 `:153`: `toBeCloseTo(60, 9)` → `toBe(100)` (34.54 × 60 ÷ 18 =
   115.1, capped).
5. `review-numbers.acceptance.test.tsx` `:227` `'Equity 34.3%'` → `'Equity 34.4%'`; `:269` `'34.3%'` → `'33.7%'`.
   The `not.toBe(stored)` check at `:271` and the stored `37.1%` at `:272` stay.

### Golden re-tune (SPEC-08, approved by Q-1)
`6max-turn-bb-call-a6s` (`postflop-spots.json:792-819`): `opponentStats` `{"1": {"hands": 100, "vpip": 12,
"pfr": 9}}`; everything else unchanged except the justification (2 sentences, ≥ 15 words, names pot odds):
"Top pair of aces with a weak kicker is still ahead of much of this button's range, a tight raiser over 100
hands who raises first half as often as a typical player, whose turn raise also holds weaker aces and draws.
Calling the raise has the pot odds needed, while re-raising would only be called by better aces and nines."

### Sign-off confirmation (SPEC-09)
Per Q-1 the user's approval counts as the AC#6 sign-off **if the built numbers match** the approved ones. The
builder writes `/private/tmp/claude-501/-Users-gregwhite-Documents-claudeworkspaces-limitholdem/4f7a755b-7d9f-4f95-8508-90fc0fabf0c8/scratchpad/t748/signoff.md`
(A-5) as a confirmation: for `6max-turn-bb-call-a6s` with stats 100/12/9 under the new rule, a table of
expected vs measured for BTN open-raise width 17.27, equity 45.3, raise aggression margin 19.7 (Major) and
fold call/fold margin 21.1 (Major), with call as the recommended action, plus one line per other observed spot
(a8s, 55, aks) showing it agrees and is clear-cut. Each value is measured after the build with
`goldenPostflopAdvice` + `gradeDecision` (or the probe at
`/private/tmp/claude-501/-Users-gregwhite-Documents-claudeworkspaces-limitholdem/4f7a755b-7d9f-4f95-8508-90fc0fabf0c8/scratchpad/t748/probe.ts`).
Width matches within 0.01; equity and margins match at one decimal. If all match, the file ends with
`Result: MATCH` and the sign-off stands. If any differ, it ends with `Result: MISMATCH` listing the differences,
and the builder writes `doit/TASK-7.48/blocked.json`; the orchestrator takes it back to the user (Q-1 asked again).

### Docs (SPEC-07)
- Table rows: `` | `open-raise` | d × PFR % ÷ typical PFR %, at most 100 | ``, the three-bet/four-bet row unchanged,
  `` | `limp`, `call-raise`, `call-three-bet` | d × VPIP % ÷ typical VPIP %, at most 100 | ``, `check` unchanged.
- The first paragraph after the table keeps 57.5, 18, 12.5 and the four-bet example (6.41%, 1.28%) and adds:
  the typical VPIP is the middle of the healthy VPIP range (77.5 heads-up, 24 at 6-max, 16.5 at full ring); a
  player at the typical PFR and VPIP keeps every default range; e.g. a 6-max BTN `open-raise` (34.54%) goes to
  86.35% at PFR 45, and a 6-max BB `call-raise` (41.48%) to 69.13% at VPIP 40 and 100% at VPIP 60.
- Known limits keeps both existing sentences' required phrases and adds: the relative rules assume an
  opponent's extra (or missing) raising and calling is spread across seats in proportion to a typical
  player's, since the snapshot has no per-seat stats; and the 100 cap is reached only on the widest blind lines
  (6-max SB `limp` from VPIP 53.8 and BB `call-raise` from 57.9; full ring 44.7 and 59.8).
- The blend example at `:318-321` (o = 0/20/100, o = 60) stays: it describes o generically.

### Error handling and configuration
No new errors. Invalid snapshots keep throwing as today (`observedBySeat`, `:637-657`).

## 6. Behaviour specification

### SPEC-01: 6-max open-raise scales by PFR relative to 18
- Verifies: AC#1
- Behaviour: Given a 6-max hand where seat BTN opens, SB folds and BB calls, viewed on the flop by BB, When
  `estimateOpponentRanges` gets `{seat: BTN, hands: 100, vpip: 30, pfr}`, Then the BTN `open-raise` widthPct is
  34.54 at PFR 18 (and its `start` equals the unscaled estimate's `start`), 86.35 at PFR 45 and 17.27 at PFR 9,
  each `toBeCloseTo(x, 2)`, and `start` equals `expandRange(resizeRange(default, widthPct), dead)`.
- Verification: acceptance `tests/advice/observed-relative.acceptance.test.ts::AC#1 a 6-max BTN open-raise scales by PFR relative to the typical 18`

### SPEC-02: 6-max calling line scales by VPIP relative to 24, capped at 100
- Verifies: AC#2
- Behaviour: Given a 6-max hand where BTN opens, SB folds and BB calls, viewed on the flop by BTN, When BB has
  `{hands: 100, vpip, pfr: 10}`, Then BB `call-raise` widthPct is 41.48 at VPIP 24, 69.13 at 40, 20.74 at 12
  and exactly 100 at 60 (start = every class not blocked by dead cards), each within 0.01.
- Verification: acceptance `tests/advice/observed-relative.acceptance.test.ts::AC#2 a 6-max BB call-raise scales by VPIP relative to the typical 24, at most 100`

### SPEC-03: Heads-up and full-ring typical stats
- Verifies: AC#3
- Behaviour: Given `TYPICAL_PFR` and `TYPICAL_VPIP`, Then heads-up/full ring are 57.5/12.5 and 77.5/16.5; and
  Given a heads-up hand where BTN limps, BB raises and BTN calls (viewed by BB), When BTN has
  `{hands: 100, vpip: 77.5, pfr: 57.5}`, Then BTN `call-raise` widthPct is 11.76 and start equals the default;
  and Given a 9- or 10-seat hand where an earlier seat opens and BB calls (viewed by the opener), When BB has
  `{hands: 100, vpip: 33, pfr: 10}`, Then BB `call-raise` widthPct is 55.20, each within 0.01; and a heads-up
  `open-raise` (BTN opens, BB calls) at PFR 57.5 keeps its default width.
- Verification: acceptance `tests/advice/observed-relative.acceptance.test.ts::AC#3 heads-up and full ring use their own typical PFR and VPIP`

### SPEC-04: TYPICAL_VPIP drift test
- Verifies: AC#4
- Behaviour: Given `src/stats/healthy-ranges.json`, When the unit tests run, Then `TYPICAL_VPIP[size]` and
  `typicalVpip(size)` equal `(band.low + band.high) / 2` of `HEALTHY_RANGES[size].vpip` for each of the 3 sizes,
  the keys are exactly the 3 sizes, and the values are `[77.5, 24, 16.5]`.
- Verification: unit `tests/advice/observed-ranges.test.ts::TYPICAL_VPIP is the middle of each healthy VPIP range`

### SPEC-05: Unit re-pins for the relative rule
- Verifies: AC#5
- Behaviour: `scales each line by its stat` is renamed `scales each line relative to a typical player: PFR for
  raising lines, VPIP for calling lines`; its targets become `{'relative-pfr': d × 10 ÷ 18, 'relative-vpip':
  d × 40 ÷ 24}` (plus raw `vpip: 40` and `pfr: 10` kept as "must not match" alternatives), with the 7 cases mapped
  per A-2. `caps the observed hands at 100` (`:224-233`) expects the seat-4 UTG open at 150 hands to be
  `12.2172 × 35 ÷ 18` = 23.7557 (`toBeCloseTo(23.76, 2)`), start equal to the 100-hand start.
- Verification: unit `tests/advice/observed-ranges.test.ts::scales each line relative to a typical player: PFR for raising lines, VPIP for calling lines`

### SPEC-06: Locked re-pins under their owners; untouched locked tests pass
- Verifies: AC#5
- Behaviour: Given the owners unlocked per §3, When the build is done, Then the 5 files carry exactly the edits
  in §5 "Locked re-pins" (diff limited to those assertions/names) and pass; and observed-ranges AC#5 and AC#6,
  observed-range-tidy AC#1, the PFR 0 / VPIP 0 floor cases of observed-resize AC#3, postflop.acceptance,
  postflop-lines.acceptance and tests/table/observed-resume.acceptance pass with their files unchanged.
- Verification: command `npx vitest run tests/advice/observed-ranges.acceptance.test.ts tests/advice/observed-resize.acceptance.test.ts tests/advice/observed-reraise.acceptance.test.ts tests/advice/small-table-ranges.acceptance.test.ts tests/ui/review-numbers.acceptance.test.tsx tests/advice/observed-range-tidy.acceptance.test.ts tests/golden tests/table/observed-resume.acceptance.test.ts && git diff --stat main -- tests/advice/observed-range-tidy.acceptance.test.ts tests/golden/postflop.acceptance.test.ts tests/golden/postflop-lines.acceptance.test.ts tests/table/observed-resume.acceptance.test.ts e2e/observed-resume.spec.ts` (empty diff)

### SPEC-07: range-model.md states the relative rule
- Verifies: AC#7
- Behaviour: Given `docs/advice/range-model.md` with runs of spaces collapsed, Then it contains the open-raise row
  `` | `open-raise` | d × PFR % ÷ typical PFR %, at most 100 | `` and the calling row
  `` | `limp`, `call-raise`, `call-three-bet` | d × VPIP % ÷ typical VPIP %, at most 100 | ``, not the rows
  `| PFR % |` or `| VPIP % |`; the first paragraph after the table contains 77.5, 24, 16.5, 34.54%, 86.35%,
  41.48%, 69.13%; the Known limits paragraph contains `no per-seat stats` and `53.8`. observed-reraise AC#6
  (re-pinned line only) also passes.
- Verification: acceptance `tests/advice/observed-relative.acceptance.test.ts::AC#7 range-model.md states the relative rule for open-raise and calling lines`

### SPEC-08: The 4 observed golden spots agree and are clear-cut
- Verifies: AC#6
- Behaviour: Given `tests/golden/postflop-spots.json` with the a6s re-tune approved in Q-1 (100/12/9), When `npm test`
  runs, Then `parsePostflopGoldenSpots` loads all spots without error, every spot agrees, and the 4 observed
  spots' opponent widths are 54.70, 17.27 (Q-1), 20.39 and 12.07 (re-pinned observed-reraise AC#5).
- Verification: acceptance `tests/advice/observed-reraise.acceptance.test.ts::AC#5 the 4 observed golden postflop spots agree, are clear-cut and sit at the relative-rule width`

### SPEC-09: Sign-off confirmation for the re-tuned spot
- Verifies: AC#6
- Behaviour: Given the approved re-tune (Q-1), When the build finishes, Then `signoff.md` (A-5 path) lists
  expected vs measured width 17.27, equity 45.3, raise margin 19.7 and fold margin 21.1 for
  `6max-turn-bb-call-a6s`, all matching, and ends `Result: MATCH`; any mismatch ends `Result: MISMATCH`, blocks
  the build and goes back to the user.
- Verification: manual Judge opens the A-5 path, re-runs the probe or `npx vitest run tests/golden/postflop.acceptance.test.ts tests/advice/observed-reraise.acceptance.test.ts`, and checks each measured number matches the file and the approved values.

## 7. Edge cases
- Cap at 100: SPEC-02 (BB call-raise VPIP 60), small-table AC#1 (PFR 60 → 100).
- Stat 0: o = 0 → strongest default class; observed-range-tidy AC#1 and observed-resize AC#3 floor (unchanged).
- Stat = typical: width = d at any n (SPEC-01 PFR 18, SPEC-03, observed-resize AC#1).
- Fewer than 30 hands / `check` line / no snapshot / unseen mode: default kept (existing tests, unchanged).
- n > 100: blend capped (SPEC-05 `caps the observed hands at 100`).
- Seat counts 3/4/5/7 use 6-max typical values via `rangesFor` (small-table AC#1).
- Invalid snapshot: unchanged errors. Concurrency/permissions: N/A (pure function).

## 8. Security considerations
N/A: no new input, dependency, storage or randomness. The snapshot is validated as today (`ranges.ts:637-657`);
the change is arithmetic on already-validated numbers.

## 9. Non-functional
No speed target. The change adds one multiply/divide per observed opponent. No speed or scale check is added to
`npm test` or CI; `observed-resize.acceptance` stays in the opt-in `npm run test:slow`.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run e2e -- e2e/observed-resume.spec.ts e2e/hint-observed.spec.ts` (user-level: hint and resume with observed opponents)
- New tests: `tests/advice/observed-relative.acceptance.test.ts` → SPEC-01, 02, 03, 07;
  `tests/advice/observed-ranges.test.ts` → SPEC-04, 05.
- Judge end-to-end: run the e2e command above (both browsers); run `npm run test:slow -- tests/advice/observed-resize.acceptance.test.ts`
  once (opt-in, includes the re-pinned AC#1–3); check the sign-off confirmation (SPEC-09).

## 11. Open questions
None. Q-1 answered 2026-11-28 (`qa.md`): recommended re-tune 100/12/9, sign-off conditional on matching numbers (SPEC-09).

## 12. Clarifications log
See `doit/TASK-7.48/qa.md`.
