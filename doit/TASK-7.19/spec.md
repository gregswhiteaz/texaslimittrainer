# Spec: TASK-7.19 — Review and revise the 6-max preflop chart with the user

Status: READY (approved 2026-11-19)
Task: TASK-7.19 · Parent/epic: TASK-7 (Get trustworthy advice) · Requirements: REQ-032.2–032.6, REQ-061.2 (REQ-027.1 is unaffected, see §9) · Dream: limit-holdem-trainer

## 1. Summary
This task adds `npm run chart:print`, which prints every spot of the shipped 6-max chart as a 13×13 grid with its raise
and continue percentages, so the user can review the chart. It then revises `src/advice/charts/six-max.json`:
- Against a single re-raise, each opener keeps 80–90% of its own opening range (user decision Q-1). Only premium hands
  4-bet.
- Every justification is made true for every route into its spot.
- The BB blind-defence offsuit inversion is fixed (K9o is defended less firmly than the weaker Q9o, J9o and T8o).
- The HJ raise-and-calls text is corrected.

New locked tests turn Q-1 and the "no weaker hand plays firmer" rule into checks. The user then reviews the changed
spots and signs off in the task notes (Q-2).

## 2. Scope
- In scope:
  - `src/advice/chart-print.ts` (pure formatter) and `tools/chart-print/main.ts` (Node entry), plus the
    `chart:print` script in `package.json`.
  - Chart content edits in `six-max.json`:
    - the six re-raise grids;
    - the BB blind-defence grid;
    - the borderline flags needed to clear offsuit inversions in BTN unopened and SB unopened;
    - the justification text of any spot (and the chart-level text) that is wrong for some route into it.
  - New acceptance tests for the chart rules and for `chart:print`.
  - One band edit in `tests/advice/six-max-chart.test.ts` (D-3).
- Not doing:
  - Any change to `src/advice/preflop.ts`, `preflop-chart.ts`, `hand-class.ts`, `src/engine/`, `src/bots/`, `src/ui/`,
    `e2e/`, or the chart format (`tlh-preflop-chart` v1, 26 spots).
  - Splitting spots by raiser position or re-raise type. That is TASK-7.21.
  - Changing the action of any cell in an unopened spot. The open ranges, the UTG ⊆ HJ ⊆ CO ⊆ BTN nesting and the
    widths stay as they are. Only the `*` flag and `/X` alternative may change in BTN and SB unopened, and only to
    clear SPEC-05 inversions. UTG unopened is untouched: the locked `tests/advice/grade.acceptance.test.ts` relies on
    its K9s `R*/F`, AA and 72o cells.
  - Grid changes in limpers, raise and raise-and-calls spots. Their justifications may change (SPEC-06). HJ
    raise-and-calls may change its grid only if the builder needs that to make its text true (SPEC-07).
  - Widening or loosening any other band in `six-max-chart.test.ts`.
  - Letters-only word-count tests and validator edge cases (TASK-7.20).
  - Updating Backlog task notes. The orchestrator records the user's sign-off (SPEC-10).
- Scope budget: files=7, lines=600   (six-max.json ~140 changed lines, chart-print.ts ~60, main.ts ~8, package.json 1, six-max-chart.test.ts ~3, six-max-chart.acceptance.test.ts ~200, chart-print.acceptance.test.ts ~110)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | SB re-raise follows the same rule as UTG–BTN: it continues with 80–90% (combos) of its SB-unopened **raise** set, and only with hands in that set. Completes are excluded. | yes | The main route into SB re-raise is "SB raised first in, BB 3-bet", so SB is an opener there. If SB completes and BB raises, that lands in SB blind-defence, not re-raise (`preflop.ts:68-70`). | Leave SB re-raise as is (6.9%); use a lower share for being out of position |
| A-2 | BB re-raise rule: BB continues with at least 80% (combos) of U = raise(BB limpers) ∪ raise(BB blind-defence), meaning the hands BB itself raised with. Every hand it continues must also continue in BB blind-defence. No upper share is set. | yes | BB never opens. It reaches re-raise by raising limpers or 3-betting and then being re-raised, or by facing a cold open plus 3-bet (§5 routes). The current grid already keeps 100% of U, so the rule pins it and needs no grid change. | Same 80–90% rule against BB blind-defence continue; no rule |
| A-3 | "Premium" (Q-1: only premium hands 4-bet) = {AA, KK, QQ, JJ, AKs, AKo, AQs}. In all six re-raise spots, every `R` cell is in this set, and AA, KK, QQ stay `R` (existing rule). | yes | Matches every current re-raise grid (QQ+ and AK; BTN also has JJ `R*/C` and AQs `R*/C`). | QQ+/AK only (would force a BTN edit); per-position sets |
| A-4 | Consistency rule (SPEC-05) uses a firmness level per cell: fold → 0; fold with `*` → 1; call/raise with `*` whose alternative is fold or none → 2; any other call/raise → 3. Offsuit rule: Y dominates X when both are offsuit, Y ≠ X, Y's high rank ≥ X's high rank and Y's low rank ≥ X's low rank. Suited rule: same high card, Y has the higher kicker, and X's kicker is 6 or higher. The dominating hand's level must be ≥ the weaker hand's level in every spot. | yes | Covers all of AC#4's examples. K9o dominates Q9o and J9o (same kicker, higher top card) and T8o (both cards higher). Suited hands with the same low card are left out on purpose: connectedness legitimately ranks T9s above Q9s and 54s above 64s, and that rule would flag about 90 deliberate cells. With kicker ≥ 6 the suited rule passes today and still allows wheel aces (A5s–A2s) to play over A6s–A9s. | Full dominance for suited too; rule only for BB blind-defence |
| A-5 | HJ raise-and-calls text says "close the action" with the true qualifier, for example "…so we close the action unless a player who limped after us is still to act". | yes | Exact routes show that HJ does *not* always close. One example: UTG folds, HJ limps, CO limps, SB raises, BB calls; HJ acts before CO (§5 routes). The review note in doc-14 that "HJ always closes it here" is wrong. Leaving out the qualifier would break AC#3. The user sees the wording at sign-off (SPEC-10). | Unqualified "we close the action" (inaccurate for one route) |
| A-6 | The HJ raise-and-calls text names the suited aces it calls with in short notation (for example "AJs, ATs, A9s, A8s, A5s and A4s"), so SPEC-07 can check it mechanically. | yes | REQ-042.6 already uses this notation ("A9o"). English names ("ace-five suited") cannot be checked reliably. | English hand names with a manual check only |
| A-7 | `chart:print` takes no options. Extra arguments are ignored. Output format is exactly as in §5. | yes | Q-2 needs every spot. A spot filter is a follow-up. | `--spot` filter; Markdown output |
| A-8 | Re-raise justifications describe the main route (our own raise was re-raised) and also say plainly that the same advice is used when two raises come before we act and when facing a fourth bet, where a raise becomes a call. | yes | All of these routes share one cell (TASK-7.2 D-5, REQ-032.6). AC#3 needs the text to be true for each route. The split is TASK-7.21. | Describe only the main route (fails AC#3) |
| A-9 | The chart's 72o and AA/KK/QQ rules, the "at least one firm `R` and `F`" rule and the word minimums from TASK-7.2 SPEC-12 still apply to every edited spot. | yes | These rules are unchanged and live in `six-max-chart.test.ts:56-79`. | — |

## 3. Current system
- TypeScript strict ESM. Tests run with Vitest 5 and v8 coverage, with ≥ 90% lines required for
  `src/{engine,bots,advice,stats}/**` (`vite.config.ts:6-17`). Lint is `eslint . --max-warnings 0 && prettier --check .`
  and also covers JSON under `src/` (`.prettierignore` does not exclude it). `tsconfig.json` includes `tools`. Node
  ≥ 22.18 (`package.json` engines).
- `src/advice/charts/six-max.json`: format `tlh-preflop-chart` v1. It has 26 spots in `APPLICABLE_SPOTS` order
  (`src/advice/preflop-chart.ts:40-49`), and each spot has 13 rows of 13 tokens (`R|C|F`, `*` borderline, `/X`
  alternative; parsed at `preflop-chart.ts:82-115`).
- Grid order: row/col 0 = A … 12 = 2. Suited cells are above the diagonal and offsuit cells below it
  (`src/advice/hand-class.ts:11-21`). Combo weights are pairs 6, suited 4, offsuit 12 (`hand-class.ts:35-39`).
- `src/advice/preflop.ts:17`: `SIX_MAX_CHART = parseChart(sixMax)` is validated at import. The JSON is imported with
  `with { type: 'json' }` (`:3`), which loads under plain Node 22.18. Probe:
  `node --import ./tools/playtest/resolve-ts.js <file importing src/advice/preflop.ts>` prints 26 without warnings.
- `src/advice/preflop.ts:45`: seat order SB, BB, UTG, HJ, CO, BTN. `:60-73` `situationOf`:
  - Blinds are ignored.
  - With no raise, the situation is `limpers` if another seat called, else `unopened`.
  - With more than one raise, it is `re-raise` (this includes the fourth bet, REQ-032.6).
  - With one raise, SB/BB are in `blind-defence`. Other seats are in `raise-and-calls` if anyone called after the
    raise, else `raise`. Limps before the raise do not count, and neither does the hero's own earlier limp.
- `src/engine/hand.ts:200`: preflop action starts left of BB and runs clockwise (`:415`).
- `tests/advice/six-max-chart.test.ts:7-34` holds the bands. Re-raise spots are all `[6, 30]` (`:26-31`). The test
  (`:45-102`) checks the bands, AA/KK/QQ raise, 72o fold, nesting, and word minimums. Per TASK-7.2 spec line 108 it is a
  **unit** test and is **not locked**: `doit/TASK-7.2/state.json` locks only `tests/advice/preflop.acceptance.test.ts`.
- Tests that depend on chart content:
  - `tests/advice/grade.acceptance.test.ts:192-197` (locked, TASK-7.4) needs UTG unopened K9s = raise borderline,
    AA = raise firm, and 72o = fold firm.
  - `tests/advice/preflop.acceptance.test.ts:345-356` (locked) needs UTG re-raise to have at least one `R` and one
    `F` class.
  - `tests/bots/tag.acceptance.test.ts:99-150` reads the chart generically.
- Current figures, computed from the JSON grids with the A-12 combo weights:

  | Opener | Unopened raise (combos) | Re-raise continue (combos) | Share |
  |---|---|---|---|
  | UTG | 212 | 128 | 0.60 |
  | HJ | 254 | 138 | 0.54 |
  | CO | 358 | 156 | 0.44 |
  | BTN | 538 | 210 | 0.39 |
  | SB | 406 | 92 | 0.23 |

  - All current re-raise continues are already subsets of their open sets.
  - BB U = 124 combos, 100% continued.
  - Current SPEC-05 violations (they must be fixed):
    - BTN unopened: 98o `F*/R` vs Q8o/J8o/T8o `F`.
    - SB unopened: K9o `R*/F` vs Q9o/J9o `C` and T9o `C*/R`; 98o `F*/C` vs K8o/Q8o/J8o/T8o `F`.
    - BB blind-defence: 20+ pairs, including K9o `C*/F` vs Q9o/J9o/T9o/T8o/98o `C`; K8o/Q8o `F*/C` and J8o `F` vs
      T8o/98o `C`; K7o–97o `F` vs 87o `C*/F`; K6o–86o `F` vs 76o `F*/C`.
  - The suited rule has no violations today.
- Existing code to reuse:
  - `src/advice/hand-class.ts` → `HAND_CLASSES`, `handClassAt`, `comboCount` (do not re-derive grid order or weights).
  - `src/advice/preflop.ts` → `SIX_MAX_CHART` (the validated chart; do not re-parse).
  - `src/advice/preflop-chart.ts` → `APPLICABLE_SPOTS`, `ChartSpot`, `ChartCell`, `PreflopChart` types.
  - `tools/playtest/resolve-ts.js` → the Node resolve hook for extensionless `.ts` imports. Reuse it as is for
    `chart:print`; do not copy it.
  - `tests/support/sandbox.ts:15,39` → `REPO_ROOT`, `sandboxEnv()` for spawning `npm run chart:print`. Strip npm's
    `>` header lines as in `tests/playtest/playtest.acceptance.test.ts:16-29`.
  - Helper pattern from `tests/advice/six-max-chart.test.ts:36-43` (`classesWith`, `percent`).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Re-raise share rule for UTG, HJ, CO, BTN (and SB, A-1). Let C = combos of classes whose action is `call` or `raise` in `<P> re-raise`, and O = combos of classes whose action is `raise` in `<P> unopened`. Then 0.80 ≤ C / O ≤ 0.90 (inclusive), and every class continued in `<P> re-raise` has action `raise` in `<P> unopened`. Only premium hands (A-3) may be `R`. | About two-thirds; keep as is | User's answer to Q-1 | yes | user (Q-1) |
| D-2 | `npm run chart:print` = `node --import ./tools/playtest/resolve-ts.js tools/chart-print/main.ts`. Formatting lives in `src/advice/chart-print.ts` (pure and covered). The entry only writes `formatChart(SIX_MAX_CHART)` to stdout. | Plain `.js` script that re-parses the JSON (duplicates parsing and weights); a Vitest-only printer | Matches the `playtest` pattern (`package.json` scripts, `tools/playtest/main.ts`). Uses Node built-ins only and Node type stripping. Reuses the validated chart. | no | n/a (Q-2 asked for the command) |
| D-3 | Edit `tests/advice/six-max-chart.test.ts:29` from `'BTN re-raise': [6, 30]` to `'BTN re-raise': [6, 41]`, with the comment `// TASK-7.19 Q-1: BTN keeps 80–90% of its 33–45% opening band against a re-raise`. No other band changes. | Leave the band at 30 (contradicts Q-1: 0.80 × 538 = 431 combos = 32.5% > 30); replace all re-raise bands with the ratio | Q-1 makes BTN re-raise 32.5–36.5%. 41 ≥ 0.90 × 45 (the top of the BTN unopened band), so the two rules can never conflict. The ratio test (SPEC-03) is the tight guard. The UTG, HJ, CO and SB targets (≤ 27.5%) fit `[6, 30]`. | yes | user (Q-1) |
| D-4 | Sign-off flow. The builder applies the changes. The orchestrator shows the user `npm run chart:print` output for every changed spot, before and after, and records the user's sign-off or tweaks in the task notes before Done. Tweaks must keep SPEC-02 to SPEC-08 green. | Summary table only; all grids up front | User's answer to Q-2 | yes | user (Q-2) |

## 5. Design

### Files to create / modify
- `src/advice/chart-print.ts` — new: `cellToken`, `spotWidths`, `formatSpot`, `formatChart`
- `tools/chart-print/main.ts` — new: Node entry for `npm run chart:print`
- `package.json` — add script `"chart:print": "node --import ./tools/playtest/resolve-ts.js tools/chart-print/main.ts"`
- `src/advice/charts/six-max.json` — revised grids and justifications (rules below)
- `tests/advice/six-max-chart.test.ts` — the single band edit of D-3
- `tests/advice/six-max-chart.acceptance.test.ts` — new: SPEC-02 to SPEC-05 and SPEC-07 (locked)
- `tests/advice/chart-print.acceptance.test.ts` — new: SPEC-01 (locked)

### Components, interfaces and data
`src/advice/chart-print.ts` (headless; imports only `./hand-class` and `./preflop-chart` types):
```ts
/** 'R' | 'C' | 'F', then '*' if borderline, then '/R' | '/C' | '/F' if an alternative exists. */
export function cellToken(cell: ChartCell): string;
/** Unrounded percentages of 1,326 combos: raise = action 'raise'; continue = 'raise' + 'call'. */
export function spotWidths(spot: ChartSpot): { readonly raisePct: number; readonly continuePct: number };
/** Header line + column header + 13 grid rows, each line ending '\n'. */
export function formatSpot(spot: ChartSpot): string;
/** formatSpot for every spot in chart order, joined by one empty line. */
export function formatChart(chart: PreflopChart): string;
```
`tools/chart-print/main.ts`:
```ts
import process from 'node:process';
import { formatChart } from '../../src/advice/chart-print';
import { SIX_MAX_CHART } from '../../src/advice/preflop';
process.stdout.write(formatChart(SIX_MAX_CHART));
```

### Output format (exact)
For each spot:
- Line 1: `${position} ${situation}: raise ${raisePct.toFixed(1)}%, continue ${continuePct.toFixed(1)}%`
- Line 2: five spaces, then the ranks `A K Q J T 9 8 7 6 5 4 3 2`, each padded to width 5, with trailing spaces removed.
- Lines 3–15: the row's rank padded to width 5, then the 13 `cellToken`s, each padded to width 5, with trailing spaces
  removed.

Spots are separated by one empty line, and the output ends with `\n`. Example (UTG unopened, unchanged by this task):
```
UTG unopened: raise 16.0%, continue 16.0%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    R    R    R    R    R    R    R    R    R    R
K    R    R    R    R    R    R*/F F    F    F    F    F    F    F
...
```
`BB limpers: raise 9.4%, continue 100.0%` is unchanged too: checks count as call.

### Rules the revised chart must satisfy
1. **Re-raise share (D-1).** Combo targets from today's open ranges, inclusive:

   | Spot | Combos | Width |
   |---|---|---|
   | UTG | 170–190 of 212 | 12.8–14.3% |
   | HJ | 204–228 of 254 | 15.4–17.2% |
   | CO | 287–322 of 358 | 21.6–24.3% |
   | BTN | 431–484 of 538 | 32.5–36.5% |
   | SB | 325–365 of 406 | 24.5–27.5% |

   Worked example: UTG continues 188 combos, which is 0.887, and passes. It fails at 169 (0.797) and at 191 (0.901).

   Which hands to fold, by Q-1: the weakest offsuit and dominated hands of the open set first. For example, UTG could
   fold ATo and KJo (24 combos), which leaves 188/212. Continue with every pair and suited hand of the open set where
   possible.
2. **Subset.** For P in UTG, HJ, CO, BTN and SB, continue(`P re-raise`) ⊆ raise(`P unopened`).
3. **Premium only raises (A-3).** In all six re-raise spots, raise ⊆ {AA, KK, QQ, JJ, AKs, AKo, AQs}. BB re-raise
   follows A-2.
4. **Consistency (A-4).** This holds in all 26 spots. A worked check on the fixed BB blind-defence: if T8o is `C`
   (level 3), then K8o, Q8o, J8o, K9o, Q9o, J9o, T9o and A8o must each be level 3. If 98o is `F*/C` (level 1), then
   T8o, J8o, Q8o, K8o and A8o must be ≥ level 1.

   The builder chooses the fix:
   - Either widen the high-card offsuit hands, or drop the borderline/continue on the connectors (98o, 87o, 76o).
   - BB blind-defence must stay in `[35, 60]`, and its raise share in `[5, 15]`.
   - In BTN unopened and SB unopened, only `*` and `/X` may change, never the action. For example, `F*/R` → `F` on
     98o, and `R*/F` → `R` on SB K9o.
5. **Justifications true for every route.** Each spot's text, and the chart-level text, must be accurate for every
   route below. Text may describe the main route first. Wording stays original (REQ-061.2) and ≥ 15 words per spot,
   ≥ 50 for the chart. The chart-level sentence "Facing a raise we mostly re-raise or fold" must not contradict the
   new re-raise behaviour: when our own raise is re-raised, we usually call, and only premium hands raise again.

   Routes into each spot (from `situationOf`, `preflop.ts:60-73`, and the clockwise order):

   | Spot | Routes |
   |---|---|
   | P unopened (UTG, HJ, CO, BTN, SB) | Our first action, and everyone before us folded. |
   | P limpers (HJ, CO, BTN, SB) | Our first action, with ≥ 1 limp and no raise before us. |
   | BB limpers | Every non-folder limped, or SB completed. BB may check. |
   | UTG raise | UTG limped, a later seat raised, and nobody has called the raise yet. Limpers seated after UTG and before the raiser still act after UTG. |
   | HJ / CO / BTN raise | (a) Cold: one open before us, everyone between folded. (b) We limped, a later seat raised, nobody has called it yet. Limpers after us but before the raiser still act after us. HJ (a) means the opener is UTG. |
   | UTG / HJ raise-and-calls | Only after we limped. A later seat raised and ≥ 1 player called it. Limpers seated after us and before the raiser may still act after us, so we do **not** always close the action (A-5). |
   | CO / BTN raise-and-calls | (a) Cold: an open and ≥ 1 call before our first action. (b) We limped, then a raise and ≥ 1 call. |
   | UTG re-raise | (a) Our open was re-raised (callers possible). (b) We limped, then two raises. (c) A fourth bet after our own re-raise: a raise becomes a call (cap). |
   | HJ re-raise | As UTG, plus (d) we cold-called UTG's open and a later seat 3-bet. A cold re-raise before HJ's first action is impossible. |
   | CO / BTN re-raise | As HJ, plus (e) cold: an open and a 3-bet before our first action. |
   | SB re-raise | (a) SB raised first in (or over limpers) and BB or a limper re-raised. (b) Cold: an open and a 3-bet before SB acts. (c) SB completed or called, then two raises. (d) SB 3-bet from blind-defence and faced a fourth bet. |
   | BB re-raise | (a) Cold: an open and a 3-bet. (b) BB raised limpers (or SB's complete) and was re-raised. (c) BB 3-bet from blind-defence and faced a fourth bet. |
   | SB blind-defence | (a) Cold: one raise (UTG–BTN), possibly with calls, and BB still to act. (b) SB completed (alone or over limpers) and BB raised. Limpers act before SB and may have called. SB then closes the action, and nobody is behind. |
   | BB blind-defence | One raise (UTG–SB), possibly with calls. Limpers before the raise may still act after BB, so BB does not always close. The price is at least 3 to 1: 3.5 to 1 against a lone open, 3 to 1 against an SB raise. |

   Today's texts that fail a route (the builder must fix at least these):
   - HJ, CO and BTN raise ("The under-the-gun player opened…" and "one earlier player opened" ignore route b).
   - HJ raise-and-calls ("usually close", "suited aces").
   - SB blind-defence ("the big blind is still behind us" fails route b).
   - All six re-raise texts (A-8, and the new widths).
   - BB blind-defence (as edited).
   - The chart-level text.

   The builder re-reads every other spot's text against the table above.
6. **HJ raise-and-calls text (AC#5, A-5, A-6).**
   - It contains "close the action" and not "usually close".
   - Every suited ace named in short notation must have action `call` or `raise` in the grid.
   - Every suited ace whose action is `call` must be named.
   - It no longer claims "suited aces" without naming them.

### Error handling and configuration
- `chart:print` exits 0 and writes only to stdout. If the shipped chart is invalid, the import of `preflop.ts` throws
  `ChartValidationError` (existing behaviour, `preflop.ts:17`), Node prints it to stderr and exits non-zero.
- Arguments are ignored (A-7). No configuration or environment variables are read.

## 6. Behaviour specification

### SPEC-01: chart:print prints every spot as a 13×13 grid with raise and continue percentages
- Verifies: AC#1
- Behaviour: Given the repo, When `npm run chart:print` runs, Then it exits 0, prints nothing to stderr, and, once
  npm's `>` header lines are stripped, prints exactly 26 blocks in `APPLICABLE_SPOTS` order.
  - Each block is a header `<P> <S>: raise <x.x>%, continue <y.y>%`, the column header line, and 13 rows. Each row
    starts with its rank `A…2` and holds 13 tokens.
  - The tokens equal the raw JSON grid tokens for that spot, row by row. The test reads the JSON with
    `node:fs`.
  - x and y equal the combo-weighted shares, computed independently in the test from the raw tokens (pairs 6,
    suited 4, offsuit 12, out of 1,326, to one decimal).
  - The output contains the lines `UTG unopened: raise 16.0%, continue 16.0%` and
    `BB limpers: raise 9.4%, continue 100.0%`.
  - `formatChart(SIX_MAX_CHART)` called in process equals the spawned stdout, and its first three lines equal the §5
    example.
- Verification: acceptance `tests/advice/chart-print.acceptance.test.ts::chart:print prints every spot as a 13x13 grid with raise and continue percentages`

### SPEC-02: Openers continue against a re-raise with 80–90% of their own opening range
- Verifies: AC#2
- Behaviour: Given `SIX_MAX_CHART`, When the share C/O of D-1 is computed for UTG, HJ, CO and BTN, Then each is
  ≥ 0.80 and ≤ 0.90. Every class continued in `<P> re-raise` has action `raise` in `<P> unopened`. The test prints
  `P: C/O = c/o (share)` for each opener. A mutation check: the pre-task chart (UTG 128/212 = 0.60) would fail.
- Verification: acceptance `tests/advice/six-max-chart.acceptance.test.ts::openers continue against a re-raise with 80 to 90 percent of their opening range`

### SPEC-03: Only premium hands raise again in re-raise spots; SB and BB follow their re-raise rules
- Verifies: AC#2, AC#6
- Behaviour: Given `SIX_MAX_CHART`, Then:
  - In each of the six re-raise spots, every class with action `raise` is in {AA, KK, QQ, JJ, AKs, AKo, AQs}.
  - SB re-raise: C/O against the SB unopened raise set is in [0.80, 0.90], and the continue set is a subset of it
    (A-1).
  - BB re-raise: it continues with ≥ 80% of the combos in raise(BB limpers) ∪ raise(BB blind-defence), and its
    continue set ⊆ continue(BB blind-defence) (A-2).
  - BTN re-raise continue is ≤ 41% and the other five are ≤ 30%, matching D-3.
- Verification: acceptance `tests/advice/six-max-chart.acceptance.test.ts::re-raise spots raise only premium hands and SB and BB keep their own ranges`

### SPEC-04: BB blind-defence has no offsuit inversion
- Verifies: AC#4
- Behaviour: Given `SIX_MAX_CHART` BB blind-defence, Then for every pair of offsuit classes where Y dominates X (A-4),
  level(Y) ≥ level(X). In particular, level(K9o) ≥ level(Q9o), level(J9o) and level(T8o), so K9o is not `C*/F` while
  those are `C`. On failure the test lists every violating pair as `Y:<token> < X:<token>`.
- Verification: acceptance `tests/advice/six-max-chart.acceptance.test.ts::BB blind defence has no offsuit inversion`

### SPEC-05: No spot plays a weaker hand more firmly than a hand that dominates it
- Verifies: AC#3, AC#4, AC#6
- Behaviour: Given `SIX_MAX_CHART`, When the offsuit and suited rules of A-4 are checked in all 26 spots, Then there
  is no violation. The test lists every violation, by spot and pair. A mutation check: the pre-task chart fails this
  test in BTN unopened (98o vs T8o), SB unopened (K9o vs Q9o) and BB blind-defence.
- Verification: acceptance `tests/advice/six-max-chart.acceptance.test.ts::no spot plays a weaker hand more firmly than a hand that dominates it`

### SPEC-06: Every justification is accurate for every route into its spot and agrees with its grid
- Verifies: AC#2, AC#3
- Behaviour: Given the revised JSON and the §5 route table, When a reviewer reads each of the 26 spot texts and the
  chart-level text next to `npm run chart:print`, Then:
  - (a) No sentence is false for any route listed for that spot. That includes who acts behind us, whether we close
    the action, who the raiser can be, and the price.
  - (b) Every hand or group the text names under an action has that action in the grid. For example, "we cap with
    queens or better and ace-king" means QQ+, AKs and AKo are `R`. A group the text says folds is `F`.
  - (c) Each re-raise text says that most of the hands we opened continue, that only premium hands raise again, and
    that the same advice applies to the other routes in the table, where a raise becomes a call at the cap (A-8).
  - (d) The text is original, with no passage copied from books or commercial tools (REQ-061.2).
- Verification: manual Review checklist (reviewer and judge). Walk the §5 route table spot by spot against the JSON
  text and the `chart:print` grid, and record each spot as pass or fail with the false sentence quoted.

### SPEC-07: HJ raise-and-calls text says we close the action and names only the suited aces it calls with
- Verifies: AC#5
- Behaviour: Given the HJ raise-and-calls spot:
  - Its justification contains "close the action" and does not contain "usually close".
  - Let N = the classes matching `/\bA[KQJT2-9]s\b/` in the text, and K = the suited aces whose action is `call`.
    Then K ⊆ N, and every class in N has action `call` or `raise`.
  - With today's grid, K = {AJs, ATs, A9s, A8s, A5s, A4s}, and A7s, A6s, A3s and A2s must not be named.
- Verification: acceptance `tests/advice/six-max-chart.acceptance.test.ts::HJ raise-and-calls text says we close the action and names only the suited aces it calls`

### SPEC-08: The chart stays inside its spec bands
- Verifies: AC#6
- Behaviour: Given the revised chart, When `npm test` runs, Then `tests/advice/six-max-chart.test.ts::authored chart
  follows the TAG authoring guide` passes:
  - All 26 bands (with BTN re-raise `[6, 41]` per D-3, and every other band unchanged) hold.
  - AA, KK and QQ raise everywhere. 72o folds everywhere except BB limpers.
  - Opens nest, there are no unopened calls except SB (≤ 10%), raise-spot calls are ≤ 4%, and BB blind-defence raise
    is 5–15%.
  - The word minimums hold.
  - `git diff <base> -- tests/advice/six-max-chart.test.ts` shows only the D-3 line change and its comment.
  - The locked `tests/advice/preflop.acceptance.test.ts`, `tests/advice/grade.acceptance.test.ts` and
    `tests/bots/tag.acceptance.test.ts` still pass unchanged.
- Verification: command `npm test` (exit 0, no `ERROR: Coverage` line) and `git diff --stat $(jq -r .base_commit doit/TASK-7.19/state.json) -- tests/advice/six-max-chart.test.ts tests/advice/preflop.acceptance.test.ts tests/advice/grade.acceptance.test.ts tests/bots/` (only `six-max-chart.test.ts`, 1–3 lines)

### SPEC-09: All checks pass and the printer stays headless and covered
- Verifies: AC#1, AC#6
- Behaviour: Given the finished change, When `npm run lint && npm run typecheck && npm test` runs, Then:
  - Each command exits 0, and Prettier accepts the edited JSON.
  - `src/advice/chart-print.ts` shows ≥ 90% lines in the coverage table.
  - `src/advice/chart-print.ts` imports nothing but relative `./` modules.
  - `package.json` gains only the `chart:print` script, with no dependency changes.
- Verification: command `npm run lint && npm run typecheck && npm test && git diff $(jq -r .base_commit doit/TASK-7.19/state.json) -- package.json`

### SPEC-10: The user has reviewed the changed spots and signed off
- Verifies: AC#2, AC#6
- Behaviour: Given the built change, When the orchestrator shows the user the `npm run chart:print` blocks of every
  spot whose grid or text changed (before and after, plus the SPEC-02 shares), Then the user either asks for tweaks
  or approves:
  - Tweaks are applied and must keep SPEC-02 to SPEC-08 green.
  - An approval means the task notes contain a sign-off entry dated by the orchestrator.
  - The task is not marked Done without that entry.
- Verification: manual The orchestrator checks `backlog task view TASK-7.19 --plain` for the sign-off note before Done.
  No test does this.

## 7. Edge cases
- Boundary shares 0.80 and 0.90: inclusive, compared in integer combos (§5 rule 1 table). Covered by SPEC-02 and
  SPEC-03.
- A fourth bet (cap) into a re-raise spot: the grid's `R` cells become call through the existing legality code
  (`preflop.ts:92-95`). The text must say so (SPEC-06 c). Already tested by locked AC#7
  (`preflop.acceptance.test.ts:345`).
- Cell tokens without `*` but with `/X`: the validator accepts them, and `cellToken` must print them exactly as
  authored. The shipped chart has none (`six-max-chart.test.ts:76-78`). Covered by SPEC-01's token equality.
- Invalid shipped chart: the import throws, and `chart:print` exits non-zero (§5). This is existing behaviour, with no
  new SPEC.
- Extra command-line arguments: ignored (A-7). Empty input, concurrency, permissions and network: N/A. The command
  reads one bundled file and writes stdout.

## 8. Security considerations
- Trust boundaries: none new. The only input is the bundled, validated JSON. `chart:print` takes no input.
- No new dependency. The entry uses `node:process` only. No secrets, network, randomness or logging of sensitive
  data. The chart is public strategy content.

## 9. Non-functional
- `npm run chart:print` completes in < 2 s on the dev machine (Node start-up dominates). Measured by the SPEC-01 spawn,
  which uses the test's default timeout.
- REQ-027.1 (TAG VPIP 18–26%, PFR 14–22%):
  - VPIP is unchanged, because every hand that now continues against a re-raise already entered the pot voluntarily
    when it opened.
  - PFR is unchanged or slightly lower (4-bets stay premium only).
  - Aggression shifts slightly toward calls. Measurement stays with TASK-6.16.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run chart:print`
- New tests:
  - `tests/advice/chart-print.acceptance.test.ts` → SPEC-01
  - `tests/advice/six-max-chart.acceptance.test.ts` → SPEC-02, SPEC-03, SPEC-04, SPEC-05, SPEC-07
  - `tests/advice/six-max-chart.test.ts` (D-3 edit only) → SPEC-08
- End-to-end scenario for the Judge (as the user reviewing the chart):
  1. Run `npm run chart:print`. Check that 26 grids appear with percentages. Check that UTG/HJ/CO/BTN re-raise
     continue widths are about 80–90% of their unopened widths, and that only premium hands are `R` there.
  2. Read BB blind-defence and confirm that K9o is at least as firm as Q9o, J9o and T8o.
  3. Read every justification against the §5 route table (SPEC-06). Read the HJ raise-and-calls text for "close the
     action" and its named suited aces.
  4. Mutation probes (revert after each):
     - Set UTG re-raise ATo, KJo, A9s, KTs and QTs to `F` (share below 0.80). SPEC-02 must fail.
     - Make BB blind-defence K9o `C*/F`. SPEC-04 must fail.
     - Make CO re-raise AJs `R`. SPEC-03 must fail.
     - Put "usually close" back into HJ raise-and-calls. SPEC-07 must fail.
  5. Run `npm run lint && npm run typecheck && npm test`.

## 11. Open questions
None. Q-1 and Q-2 are answered in `doit/TASK-7.19/qa.md` and folded into D-1, D-3 and D-4.

### Follow-ups (become tasks)
- Add evidence to TASK-7.21: under Q-1, cold re-raise routes (for example CO facing UTG open + HJ 3-bet) now continue
  with about 22% of hands, which is loose for an uninvested seat.
- Correct the doc-14 review note "HJ always closes the action in raise-and-calls". A limper seated after HJ can still
  be to act.
- Add a `--spot "<position> <situation>"` filter to `npm run chart:print` for focused review.
- Measure TAG aggression after the re-raise call widening in TASK-6.16, and retune if it leaves 45–65%.

## 12. Clarifications log
See `doit/TASK-7.19/qa.md`.
