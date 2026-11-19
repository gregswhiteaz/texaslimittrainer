# TASK-7.19: Review and revise the 6-max preflop chart with the user

Status: Built, awaiting judge, CI and user sign-off · Built: 2026-11-18 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-0 · Requirements: REQ-032.2–032.6, REQ-061.2 · Branch: doit/TASK-7.19

**Pending:** judge verdict, CI, and the user's sign-off (the user signs off after the judge; the orchestrator records it in the task notes, AC#6).

**Review the chart here:** `doit/TASK-7.19/chart-changes.md` (every changed spot, before and after, hands added and removed) and `doit/TASK-7.19/chart-print.txt` (full `npm run chart:print` output, all 26 grids).

## What was asked
Follow-up to TASK-7.2 (doc-14). Claude wrote the 6-max chart and the user had not reviewed it. Review found that each opener folded much of its own opening range to a single 3-bet while the texts said opened hands usually call, some texts described only one route into the spot, and BB blind defence had offsuit inversions (K9o weaker than Q9o/J9o/T8o). The task adds `npm run chart:print`, revises the chart, and has the user sign off. Spec: doit/TASK-7.19/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | SB re-raise follows the UTG–BTN rule: continue with 80–90% of the SB-unopened raise set, only with hands in that set. Completes are excluded. | yes | The main route is "SB raised first in, BB 3-bet". SB complete then BB raise lands in blind-defence. | Edit the SB re-raise grid and the SPEC-02 rule |
| A-2 | BB re-raise: continue with at least 80% of the hands BB itself raises with, all of which also continue in BB blind-defence. No upper share. | yes | BB never opens. The grid already kept 100%, so it is pinned and unchanged. | Change the rule and grid |
| A-3 | "Premium" = AA, KK, QQ, JJ, AKs, AKo, AQs. Only these may be `R` in any re-raise spot. | yes | Matches every current re-raise grid. | Narrow the set (forces a BTN edit) |
| A-4 | Consistency rule: a dominating offsuit hand is never played less firmly than the hand it dominates, in all 26 spots (firmness 0–3 from fold, fold*, call*, firm). Suited hands only compared with same high card and kicker ≥ 6. | yes | Covers every example in AC#4 without flagging deliberate connectedness (T9s over Q9s). | Full dominance for suited too |
| A-5 | HJ raise-and-calls text says "close the action" with the true qualifier ("unless a player who limped after us is still to act"). | yes | HJ does not always close: UTG folds, HJ limps, CO limps, SB raises, BB calls. The doc-14 note "HJ always closes" is wrong. | Unqualified wording (inaccurate on one route) |
| A-6 | The HJ raise-and-calls text names its suited aces in short notation (e.g. "AJs, ATs, A9s…") so a test can check it. | yes | Same notation as REQ-042.6. | English names, manual check |
| A-7 | `chart:print` takes no options; extra arguments are ignored. | yes | Q-2 needs every spot. | Add a `--spot` filter (follow-up) |
| A-8 | Re-raise texts describe the main route (our raise was re-raised) and say plainly that the same advice is used for two raises before we act and for a fourth bet, where a raise becomes a call. | yes | All routes share one cell (TASK-7.2 D-5); AC#3 needs truth for each. Split is TASK-7.21. | Describe only the main route (fails AC#3) |
| A-9 | The 72o fold, AA/KK/QQ raise, "at least one firm R and F" and word-minimum rules still apply to every edited spot. | yes | Unchanged rules from TASK-7.2. | n/a |

## Clarifications and decisions
- **Q-1 (user):** Against a single re-raise, each opener (UTG, HJ, CO, BTN) continues with about 80–90% of its own unopened range, measured in combos. Fold only the weakest offsuit or dominated hands. Only premium hands 4-bet. Every re-raise text must agree with its grid.
- **Q-2 (user):** Printed grids plus the user's sign-off before Done. Hence `chart:print`, `chart-print.txt` and `chart-changes.md`.
- **Q-3 (user):** The single re-raise spot per seat also serves cold 3-bets (for example CO facing a UTG open and an HJ 3-bet now continues about 22% with nothing invested). The user chose to widen now and split later via TASK-7.21. The spec is unchanged; the evidence is recorded on TASK-7.21.
- **D-1:** Share rule: 0.80 ≤ continue combos / own raise-first combos ≤ 0.90, continued hands are a subset of the open set, only premium may be `R`.
- **D-2:** `npm run chart:print` = `node --import ./tools/playtest/resolve-ts.js tools/chart-print/main.ts`; formatting is a pure function in `src/advice/chart-print.ts`.
- **D-3:** The BTN re-raise band in `tests/advice/six-max-chart.test.ts` moves from `[6, 30]` to `[6, 41]`. Q-1 makes BTN re-raise 32.5–36.5% of all hands, so the old 30% cap contradicted it. The ratio test is the tight guard. This is the only edit to an existing test.
- **D-4:** Sign-off flow as Q-2.

## What was built
- `src/advice/chart-print.ts` (new): `cellToken`, `spotWidths`, `formatSpot`, `formatChart`. Pure, headless.
- `tools/chart-print/main.ts` (new): writes `formatChart(SIX_MAX_CHART)` to stdout. `package.json` gains the `chart:print` script.
- `src/advice/charts/six-max.json`: the five opener re-raise grids rewritten; BB blind-defence inversions fixed; BTN unopened 98o `F*/R`→`F`; SB unopened K9o `R*/F`→`R` and 98o `F*/C`→`F` (flags only, no action change); 23 spot texts plus the chart-level text rewritten to be true on every route. UTG unopened, CO unopened and UTG raise-and-calls are unchanged. Format and 26 spots unchanged.
- No change to `preflop.ts`, `preflop-chart.ts`, engine, bots, UI or e2e.

### Re-raise share table (continue combos / own raise-first combos)
| Spot | Before | After | Continue % of all hands, before → after |
|---|---|---|---|
| UTG | 128/212 (0.60) | 188/212 (0.887) | 9.7 → 14.2 |
| HJ | 138/254 (0.54) | 218/254 (0.858) | 10.4 → 16.4 |
| CO | 156/358 (0.44) | 298/358 (0.832) | 11.8 → 22.5 |
| BTN | 210/538 (0.39) | 454/538 (0.844) | 15.8 → 34.2 |
| SB | 92/406 (0.23) | 358/406 (0.882) | 6.9 → 27.0 |
| BB | 124/124 (1.00) | unchanged | 10.4 → 10.4 |

Raises stay at 2.6% (BTN 3.3%). Only AA, KK, QQ, AKs and AKo are firm raises everywhere; JJ is `C*/R` (BTN `R*/C`), AQs is `R*/C` in BTN only and `C*/R` in CO.

### CO A9o/A8o fold (forced by a locked test)
The locked TASK-9.1 test `tests/table/review.acceptance.test.ts` ("calling then folding preflop…") expects Fold advice for A9o at CO after cold-calling an open and facing a re-raise. So CO re-raise folds A9o. A-4 then forces A8o (and A7o) to fold too, and QTo and JTo were the remaining cuts to keep the share in range (0.832). The code reviewer judged this coherent. The oddity: CO continues KTo (`C*/F`) and QJo (`C*/F`) while A9o folds, and BTN continues A9o–A6o. It is defensible (a button steal 3-bet usually comes from a wide blind range; BTN has position on every route) but the user may find it odd at sign-off. Revisit once TASK-7.21 splits the spots.

### BB blind-defence widening and fixed inversions
Continue 43.6% → 46.3%, raise stays 5.7% (inside [35, 60] and [5, 15]).
- Added: K8o and Q8o (`F*/C`→`C`), J8o (`F`→`C`), K7o (`F`→`C*/F`). K9o `C*/F`→`C`.
- Removed: 87o `C*/F`→`F*/C`; 76o `F*/C`→`F`.
- Other flag-only changes: Q7o, J7o, T7o, 97o `F`→`F*/C`.
Result: no weaker offsuit hand is played more firmly than a dominating one (K9o vs Q9o/J9o/T8o fixed).

### D-3 BTN band change
BTN re-raise continue is now 34.2%, above the old 30% cap, hence the band edit to `[6, 41]` (41 ≥ 0.90 × 45, the top of the BTN unopened band, so the two rules never conflict).

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | `tests/advice/chart-print.acceptance.test.ts` runs `npm run chart:print`, checks 26 blocks, tokens equal JSON, headers, no stderr | pass | locked test, gates/build-1.json |
| SPEC-02, 03 | AC#2, Q-1 | `six-max-chart.acceptance.test.ts`: 80–90% share, subset, premium-only raises, SB and BB rules | pass | chart-changes.md |
| SPEC-04, 05 | AC#4 | No offsuit inversion in BB blind-defence; consistency in all 26 spots | pass | locked test |
| SPEC-06 | AC#3 | Justifications true for every route; checked by the code reviewer on all 26 texts, plus text/grid checks | pass (review) | reviews/round-1/code.json |
| SPEC-07 | AC#5 | HJ raise-and-calls text contains "close the action", names exactly the called suited aces | pass | locked test |
| SPEC-08, 09 | AC#6 | Existing bands, full suite, lint, typecheck, playtest | pass | gates/build-1.json |
| SPEC-10 | AC#6 | User review of changed spots and sign-off | **pending** | task notes |

- Gate run 1 (build): PASS. `npm test` 75 files, 276 passed, 2 skipped, coverage 96.91% lines; `npm run lint` and `npm run typecheck` exit 0; `npm run playtest -- --hands 10000 --seed 42`, 0 invariant violations. Changed lines 479 vs budget 600.
- Against the pre-task chart all five chart acceptance tests fail (mutation check).
- The first full run had one failure in the locked TASK-9.1 test, fixed by the CO A9o/A8o fold above.
- Judge: **pending**. CI: **pending**. User sign-off: **pending**.

## Review
Round 1, both reviews clean (no BLOCKER or MAJOR).
- Code: all rubric items pass. 15 chart mutants and 7 formatter mutants were run; all were caught except the expected BB re-raise widening that A-2 permits (no upper bound) and a stale spec probe (below). `chart:print` output matches `chart-print.txt`.
- Security: no findings. `chart:print` takes no input (no argv, env, file or network), the validator in `preflop.ts` still fails closed with `ChartValidationError`, no dependency changes, and the content is original prose (REQ-061).

### Non-blocking review notes (deliberately not fixed)
- MINOR: BB re-raise text says "Our blind and our raise are already in…", which is wrong on the cold route (an open and a 3-bet before BB acts, BB owes two bets). The final sentence about the same advice applying makes it acceptable under A-8. Suggested tweak at sign-off: "When we raised, our blind and our raise are already in, so the price for one more bet is good…".
- NIT: spec §10 mutation probe 1 is stale (UTG ATo and KJo are already folds, so it only removes 12 combos and stays ≥ 170). The test is not weak: removing 20 combos fails with "expected 168 to be greater than or equal to 170".
- NIT: CO folds A9o while continuing KTo and QJo, and BTN continues A9o–A6o (see the CO section above).

## How to try it
- `npm run chart:print` prints all 26 grids; read `doit/TASK-7.19/chart-print.txt` for a saved copy.
- `npm test`, `npm run lint`, `npm run typecheck`.

## Run metrics
Questions asked 3 · assumptions logged 9 · review rounds 1 (0 findings blocking) · judge rounds 0 so far (pending) · gate runs 1 · escalations 0 · changed lines 479 (budget 600) across 7 files.

## Known limitations and follow-ups
- TASK-7.21: evidence for splitting spots by raiser position and route is already added (cold 3-bet continue of about 22% in CO). Also revisit CO A9o once spots are split, since the locked TASK-9.1 test pins it.
- Correct the doc-14 note that HJ always closes the action (it does not; see A-5).
- Add a `--spot` filter to `chart:print` (A-7); owner: a new chart-tooling task.
- TASK-6.16: measure TAG aggression after the widening and retune if it falls outside 45–65%.
- Reword the BB re-raise text as in the MINOR note, if the user does not fix it at sign-off (owner: this task, TASK-7.19).

## Lessons for the factory (proposals — not applied)
- The spec's claim that `six-max-chart.test.ts` constraints were the only content-dependent tests missed the locked TASK-9.1 review test, which pinned CO A9o and cost one full-suite failure. Proposal: have the spec stage grep locked tests for hand-specific chart expectations (not only the advice and bot tests).
- A spec mutation probe was stale (ATo and KJo were already folds). Proposal: the spec stage should check each probe against the current data before listing it.
