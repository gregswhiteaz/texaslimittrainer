# Spec: TASK-7.31 — Give postflop golden spots chart-consistent preflop lines

Status: READY (approved 2026-11-25)
Task: TASK-7.31 · Parent/epic: TASK-7 · Requirements: REQ-037, REQ-038, REQ-039, REQ-061.2 (via TASK-7.14, doc-111) · Dream: limit-holdem-trainer

## 1. Summary
The postflop golden spots teach a whole hand, but 72 of the 120 reach their decision through a hero preflop action
that the project's own chart grades as a Major error (a measured count, see §3). This story re-authors those 72
spots so every hero preflop action is chart-consistent. Each is replaced like-for-like, keeping its street, table
size, recorded action, multiway and observed-stats status, so the coverage counts don't change. The validator
gains a rule so a spot with a Major hero preflop line can't be added again. The story also fixes the
"set of kings" wording in `6max-turn-bb-raise-92o` and makes a `gradeDecision` throw during the clear-cut check a
listed problem instead of an escaping exception.

## 2. Scope
- In scope:
  - `src/advice/golden.ts`: a new postflop validation rule (hero preflop line, §5), and the clear-cut check wrapped so a
    throw becomes a problem (AC#3).
  - `tests/golden/postflop-spots.json`: the 72 spots listed in §3 replaced or re-lined (owner TASK-7.14; unlocked for
    this story under Q-1). The `6max-turn-bb-raise-92o` justification says "kings full".
  - `docs/advice/golden-spots.md`: the new field rule, the "Adding a spot" step, the clear-cut failure message and a
    "Changes from TASK-7.31" log table (old id, new id, reason) for every changed spot.
  - A new locked acceptance file `tests/golden/postflop-lines.acceptance.test.ts`, plus unit updates in the
    unlocked `tests/golden/postflop-golden.test.ts`.
- Not doing:
  - Graded examples (`tests/golden/graded-examples.json`, locked under TASK-7.14). Three of the nine also have Major hero
    preflop lines (`graded-postflop-fold-minor-6max-flop-gutshot`: BTN calls a raise with 52o;
    `graded-postflop-check-minor-6max-river-top-pair`: CO opens K6s and calls a re-raise;
    `graded-postflop-check-major-6max-turn-trips`: BTN opens T3o). They stay as they are and are reported as a
    follow-up (A-1).
  - Grading the hero's earlier postflop actions (for example a flop bet in a turn spot). Only preflop actions are
    graded (A-2).
  - Opponents' preflop actions. These may be loose or odd, since opponents are not the model being taught.
  - Preflop golden spots, charts, the advice engine and the grader. None of them change.
  - The `street-of-board-index-trick` NIT (`src/advice/golden.ts:246-249`). It is not in this task's ACs.
  - Any new dependency, npm script or CI change.
- Scope budget: files=5, lines=1200   (about 700 of these are JSON diff lines for 72 spots. The rest is the docs log
  table ≈ 110, golden.ts ≈ 50, the new acceptance test ≈ 180 and unit test edits ≈ 60.)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Graded examples are out of scope, even though three of them have Major hero preflop lines. They are recorded as a follow-up. | yes | The AC names "every postflop golden spot". Graded examples are a separate file, outside the 200 count (TASK-7.14 A-6), and their exact Minor margins are hard to re-pin. | Fix them too, which needs an unlock of `graded-examples.json` and re-pinned grade, rule id and margin. |
| A-2 | "Hero preflop actions" means every `before` step the hero takes while the street is preflop. Earlier hero postflop steps are not graded. | yes | Matches the AC wording and the review finding (doc-111). | Also require earlier postflop steps to match the advice. |
| A-3 | A hero preflop step passes when `gradeDecision(recommend(view), step)` at that decision is not `major`. This is the same grade the learner gets in play. A borderline (Minor) step is allowed. Every current non-Major step is in fact Correct. | yes | This is the AC's literal bar. `recommend` preflop uses the chart for the table size and position (`src/advice/preflop.ts:121-168`). | Require Correct only. |
| A-4 | The rule is enforced in the validator (`parsePostflopGoldenSpots`), so the parse itself rejects a future bad spot. The new acceptance test also re-checks it on its own (§5). | yes | This matches how the clear-cut rule is enforced (TASK-7.14 D-2), and "Adding a spot" relies on the validator. | Enforce it only in a test. |
| A-5 | Problem texts: `Golden spot <id>: hero preflop step <k> "<action>" is a Major error on the chart (<size> <position> <situation> <hand class>: <chart action>)` and `Golden spot <id>: clear-cut check failed (<error message>)`. | yes | Fits the existing `step k "x"` and `advice failed (...)` styles (`golden.ts:188`, `:557`). These texts are developer-facing only. | Other wording. |
| A-6 | Replacement order for each spot, the first one that works: (a) if the hero holds a hand the chart raises but only called or checked, change the hero's preflop action to the chart's, keeping the id; (b) keep the line and board and swap the hole cards (the TASK-7.32 convention), which gives a new id; (c) change the hero's line or position. In all cases the street, table size, recorded action, multiway status (two or more unfolded opponents at the decision) and observed-stats status stay the same. | yes | Least change first. This keeps the coverage counts and logs like-for-like. A prototype found a hole-card swap for 66 of the 72, and line changes for the other six checked so far (§3). | Re-author all 72 from scratch. |
| A-7 | `6max-turn-bb-raise-92o` keeps its id and hole cards (2c 9d). Its line becomes a limped pot where the BB checks its option: before `call, fold, fold, fold, fold, check, bet, call, bet, raise`. The justification is rewritten for that line and says "kings full". | yes | AC#2 names this id, and the id fixes BB, raise and 92o. A BB checking its option is the only chart-consistent way for 92o to see a flop. Prototype: advice raise, 88.0% against the calling range, threshold 65, so 23 points clear. | Swap the hand and give the id a new home. That would break AC#2's "Given 6max-turn-bb-raise-92o". |
| A-8 | The new acceptance test pins the documented coverage: 120 spots; flop 45, turn 40, river 35; 86 at 6-max (6 seats), 18 heads-up, 16 full ring (9 seats); call 27, raise 24, bet 23, check 23, fold 23; 20 multiway; 4 with opponent stats. | yes | The caller requires that coverage counts be kept. The numbers are measured today and documented in `golden-spots.md:176-180`. | Floors only, as in TASK-7.14. |

## 3. Current system
- Validator: `src/advice/golden.ts`.
  - `buildView` (`:227-244`) replays `before` twice. The first pass finds the hero; the second deals the hero its
    cards via `dealtHand` (`:154-177`).
  - `parsePostflopSpot` (`:521-563`) wraps only `advise` in try/catch (`:554-559`). `clearCutProblems` (`:493-519`)
    runs outside it, and `gradeDecision` (`src/advice/grade.ts:81-89, 95-148`) throws `RangeError` on a non-finite
    number. That is the NIT behind AC#3.
  - Problems are collected per entry and thrown together by `parseEntries` (`:312-344`).
- Preflop advice: `recommend(view)` → `recommendPreflop` (`src/advice/preflop.ts:121-168`). It reads
  `chartSpotOf`/`situationOf` (`:90-118`) and the chart for `referenceSizeOf(players)` (`:60-65`). The result has
  `referenceSize`, `position`, `situation`, `handClass` and `action`. `gradeDecision` on a chart basis returns `major`
  `preflop-chart` for any non-match on a non-borderline cell (`grade.ts:118-122`).
- Locked tests touching this area (owner from `doit/*/state.json`):
  - `tests/golden/postflop-spots.json` (TASK-7.14). **Values change**: 72 spots are re-authored. Unlocked under TASK-7.14 before the build (Q-1, approved).
  - `tests/golden/postflop.acceptance.test.ts` (TASK-7.14). Not edited, and no values change. `probeOf()` takes
    `spots[0]`, which will be a replacement for `6max-flop-co-bet-76o`. Its cases match with `startsWith`, so any valid
    first spot works. The AC#2 probes (`facingBet`/`nothingOwed`, BTN opens KhQh) are chart-consistent (checked by
    the prototype), so their exact `toEqual` lists still hold under the new rule.
  - `tests/golden/suite.acceptance.test.ts` and `tests/golden/graded-examples.json` (TASK-7.14). Not touched (A-1).
  - `tests/golden/preflop-spots.json` and `preflop.acceptance.test.ts` (TASK-7.11). Not touched.
  - No other test reads `postflop-spots.json` (grep of `src tests tools e2e`).
- Unlocked tests: `tests/golden/postflop-golden.test.ts`. Its heads-up probe "finds a heads-up big blind hero on the
  second pass" (`:269-276`) has the BB call a raise with 99. The heads-up chart re-raises that, so the probe fails the
  new rule. Change the probe's hand to one the chart calls with, or its line to a re-raise. Its other probes (6-max BTN
  opens AsQd; heads-up BTN raises AA) pass.
- Prototype audit (scratch, not committed). It replayed every spot and graded each hero preflop step with
  `gradeDecision(recommendPreflop(view), step)`. Result: 72 spots have a Major step, 0 have a Minor step, and 48 are
  clean. The 72 spots:
  - Flop (30): `6max-flop-co-bet-76o`, `6max-flop-btn-bet-aqo`, `6max-flop-bb-bet-aa`, `6max-flop-btn-bet-97o`,
    `6max-flop-btn-bet-q8o`, `6max-flop-utg-check-a5o`, `6max-flop-co-check-83o`, `6max-flop-co-call-a7o`,
    `6max-flop-co-call-a6o`, `6max-flop-co-call-j7o`, `6max-flop-utg-fold-k9o`, `6max-flop-utg-fold-a3o`,
    `6max-flop-sb-fold-93o`, `6max-flop-bb-fold-95o`, `6max-flop-co-raise-jj`, `6max-flop-bb-raise-aa`,
    `6max-flop-bb-raise-65o`, `6max-flop-btn-raise-97o`, `6max-flop-co-fold-j3o`, `6max-flop-hj-fold-t5o`,
    `6max-flop-hj-call-t5s`, `6max-flop-btn-call-97o`, `hu-flop-bb-call-33`, `hu-flop-btn-fold-73o`,
    `fr-flop-utg-bet-kto`, `fr-flop-mp-check-83o`, `fr-flop-btn-check-j3s`, `fr-flop-hj-call-j2o`,
    `fr-flop-bb-raise-a3o`, `fr-flop-btn-fold-87o`.
  - Turn (23): `6max-turn-bb-bet-63s`, `6max-turn-btn-bet-94o`, `6max-turn-utg-bet-k3o`, `6max-turn-btn-bet-86o`,
    `6max-turn-utg-bet-a6o`, `6max-turn-utg-check-92o`, `6max-turn-co-check-t7o`, `6max-turn-bb-check-85o`,
    `6max-turn-co-fold-98o`, `6max-turn-btn-fold-64o`, `6max-turn-bb-fold-93o`, `6max-turn-utg-fold-82o`,
    `6max-turn-utg-fold-k2o`, `6max-turn-co-fold-j3s`, `6max-turn-co-raise-a6o`, `6max-turn-co-raise-t9o`,
    `6max-turn-bb-raise-kk`, `6max-turn-bb-raise-92o`, `6max-turn-bb-check-72o`, `hu-turn-btn-bet-k2o`,
    `hu-turn-btn-check-73o`, `fr-turn-utg-bet-94o`, `fr-turn-hj-raise-86s`.
  - River (19): `6max-river-bb-bet-aks`, `6max-river-sb-bet-j4o`, `6max-river-sb-check-52o`, `6max-river-bb-check-93o`,
    `6max-river-co-check-72o`, `6max-river-bb-check-j5o`, `6max-river-btn-call-k6o`, `6max-river-utg-fold-92o`,
    `6max-river-btn-fold-t7o`, `6max-river-utg-fold-t4o`, `6max-river-btn-raise-q3s`, `6max-river-sb-raise-53o`,
    `6max-river-bb-raise-aks`, `6max-river-bb-fold-63s`, `hu-river-bb-call-tt`, `fr-river-bb-check-52o`,
    `fr-river-bb-fold-t3o`, `fr-river-utg-call-t5o`, `fr-river-utg-fold-jto`.
  - Candidates for A-6(a), where the chart raises but the hero called or checked: `6max-flop-btn-bet-aqo`,
    `6max-flop-bb-bet-aa`, `6max-flop-co-raise-jj`, `6max-flop-bb-raise-aa`, `6max-turn-bb-raise-kk`,
    `6max-river-bb-bet-aks`, `6max-river-bb-raise-aks`, `hu-flop-bb-call-33`, `hu-turn-btn-bet-k2o`,
    `hu-river-bb-call-tt`.
  - Feasibility (prototype):
    - A brute-force hole-card swap (b) found a clear-cut, agreeing replacement for 66 of the 72 in about 4 s in total.
    - Line changes worked for `hu-turn-btn-bet-k2o`: BTN raises, then `call, check, check, check` (bet, 72.4 vs 50).
    - They worked for `hu-river-bb-call-tt`: BTN limps, BB raises, then `call, check, bet, call, check, bet, call,
      check, bet` (call, 46.2 vs 14.3).
    - They worked for `6max-flop-bb-fold-95o`: SB limps and BB checks (fold, 9.2 vs 25.0).
    - They also worked for a BB-checks-option variant of `6max-flop-sb-fold-93o` (fold, 8.2 vs 22.2).
    - `6max-flop-bb-raise-65o` as an SB-limp line missed by 0.1 point, so it needs another hand or board.
    - `6max-flop-hj-call-t5s` was not tried with a line change.
- Tests run with Vitest (`package.json` scripts). `npx vitest run tests/golden/` runs the golden suite in about 1.4 s
  (doc-111). The `*.acceptance.test.*` files run in `npm test` and in `test:sweeps` on CI.
- Existing code to reuse:
  - `src/advice/golden.ts` `dealtHand`/`replay`/`legalOf` → replay the hero's steps for the new rule. Don't write a
    second dealer.
  - `src/advice/recommend.ts` `recommend` and `src/advice/grade.ts` `gradeDecision` → grade each hero preflop step.
  - `GRADE_LABELS` (`grade.ts:14-18`) is not needed: the message says "Major error" literally, as in A-5.
  - `tests/golden/postflop.acceptance.test.ts:27-42` → copy the `problemsOf`/`stub` pattern into the new acceptance
    file. Don't import from the locked file.
  - Spec-writer prototype scripts (scratch, not part of the change; run from the project root with `npx tsx <path> [args]`).
    They may be cleared by a reboot, so copy anything needed into the build log:
    - `/private/tmp/claude-501/-Users-gregwhite-Documents-claudeworkspaces-limitholdem/4f7a755b-7d9f-4f95-8508-90fc0fabf0c8/scratchpad/audit.ts` — lists every spot whose hero preflop step grades Major. Argument: a file name under
      `tests/golden/` (default `postflop-spots.json`). Expect 72 before the build and 0 after.
    - `/private/tmp/claude-501/-Users-gregwhite-Documents-claudeworkspaces-limitholdem/4f7a755b-7d9f-4f95-8508-90fc0fabf0c8/scratchpad/search.ts` — brute-force hole-card swap (A-6 step b) for each failing spot; optional spot ids as
      arguments. Its output for all 72 is saved in `/private/tmp/claude-501/-Users-gregwhite-Documents-claudeworkspaces-limitholdem/4f7a755b-7d9f-4f95-8508-90fc0fabf0c8/scratchpad/search-out.txt` (66 found; the other six need a line
      change, §3).
    - `/private/tmp/claude-501/-Users-gregwhite-Documents-claudeworkspaces-limitholdem/4f7a755b-7d9f-4f95-8508-90fc0fabf0c8/scratchpad/probe.ts` — runs `parsePostflopGoldenSpots` and `goldenPostflopAdvice` on a JSON array of candidate
      spots (path argument) and prints action, equity and thresholds, or the problems. Use it to check a
      replacement before writing it into the JSON.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Every changed spot is replaced like-for-like (A-6) and logged under "Changes from TASK-7.31 (chart-consistent hero lines)" in `docs/advice/golden-spots.md`, with old id, new id and reason. Same-id re-lines are logged too, with the old and new hero line. | Delete spots; add a docs note that spots teach only the postflop decision | Keeps coverage and the TASK-7.26/7.32 convention. The task asks for the lines to be fixed. | yes | Q-1 (auto-accepted, recommended; file unlocked under TASK-7.14) |
| D-2 | The hero-line rule lives in `parsePostflopSpot` and runs before advice. A spot with a Major line is rejected without computing equity. | Run it after the clear-cut check | Cheap, and gives one clear reason per spot. | no | n/a |
| D-3 | The clear-cut loop runs inside its own try/catch. A throw adds one problem for that spot, and the spot is not returned. The other spots keep validating. | Merge it into the `advise` try with the same "advice failed" text | A separate message tells an advice failure apart from a grading failure. | no | n/a |

## 5. Design

### Files to create / modify
- `src/advice/golden.ts` — the hero preflop line rule and the guarded clear-cut check.
- `tests/golden/postflop-spots.json` — re-author the 72 spots (unlocked under TASK-7.14 by Q-1).
- `docs/advice/golden-spots.md` — the field rule, the "Adding a spot" step, the failure texts and the change log.
- `tests/golden/postflop-lines.acceptance.test.ts` — new and locked (SPEC-01 to SPEC-05).
- `tests/golden/postflop-golden.test.ts` — fix the heads-up 99 probe, and add unit tests for the rule and the
  guarded check (SPEC-06).

### Components, interfaces and data
- No exported signature changes. `parsePostflopGoldenSpots(raw, advise?)` still returns `PostflopGoldenSpot[]` or
  throws `GoldenSpotValidationError`. It now has more ways to reject a spot.
- New private helper in `golden.ts`:
  `heroPreflopProblems(data: Record<string, unknown>, view: PlayerView): string[]`. It runs only when `view` was built.
  - It deals `dealtHand(n, view.seat, holeCards, board)` and walks `before` with the same legal-action replay as
    `replay`.
  - At each step index `k` where `state.street === 'preflop' && state.toAct === view.seat`, it computes
    `rec = recommend(playerView(state, view.seat))` and `g = gradeDecision(rec, step)`.
  - When `g.grade === 'major'`, it pushes the A-5 text built from `k + 1`, the step, `rec.referenceSize`,
    `rec.position`, `rec.situation`, `rec.handClass` and `rec.action`.
  - Refactor `replay`/`buildView` as needed so the replayed states are reused. Behaviour and messages for existing
    problems must not change.
- Data: `postflop-spots.json` keeps format v1 and 120 spots. Id convention and justification rules are unchanged
  (`golden-spots.md` field rules). New ids are unique, at most 60 characters, and follow the convention. New
  justifications are distinct from every id and justification in the three golden files (locked DoD#1 test).

### Rules and algorithms
- Hero-line rule, worked example: a 6-max probe where the BTN (seat 1) opens 7h 2s, the BB calls and bets the
  flop Ks 7d 2c. The `before` list is `fold, fold, fold, raise, fold, call, bet`. Step 4 is the hero's raise. The chart
  cell for 6-max BTN unopened 72o is fold, so the problem is
  `Golden spot probe: hero preflop step 4 "raise" is a Major error on the chart (6-max BTN unopened 72o: fold)`.
  The same probe with Kh Qh (BTN opens KQs, chart raise) gets no problem.
- Clear-cut guard example: the `facingBet` probe (BTN opens Kh Qh, BB bets the flop) with advice
  `{action:'call', equityPct: NaN, requiredEquityPct: 31, equityVsCallingRangePct: 30}`. Grading `fold` reads
  `equityPct` and throws `RangeError('equityPct must be a finite number, got NaN')`. The result is exactly
  `['Golden spot probe: clear-cut check failed (equityPct must be a finite number, got NaN)']`, thrown as a
  `GoldenSpotValidationError`.
- Re-authoring each spot:
  1. Apply A-6 in order.
  2. Each replacement must pass the full validator with real advice: chart-consistent line, clear-cut margins, and
     the engine agreeing with the recorded action.
  3. Rewrite the justification for the new hand and line. It must name the made hand or draw accurately: hand class,
     outs, kickers and who raised. This was the failure mode in all three TASK-7.14 review rounds.
  4. Record in `doit/TASK-7.31/build-log.md` a table of every changed spot: old id, new id, hole cards, line change
     (if any), the engine's equity/required/calling-range numbers, and the hero's made-hand category from the
     engine's hand evaluator. Reviewers fact-check the justifications against this table.
- `6max-turn-bb-raise-92o` follows A-7. The words "set of kings" are replaced by "kings full", and the
  "under-the-gun raiser" wording is fixed for the limped line.

### Error handling and configuration
- New problem texts are in A-5. Existing texts are unchanged, including `advice failed (<message>)` for a throw from
  `advise` (`postflop-golden.test.ts:160-162`).
- No configuration.

## 6. Behaviour specification

### SPEC-01: No postflop golden spot has a Major hero preflop action
- Verifies: AC#1
- Behaviour: Given every spot in `tests/golden/postflop-spots.json`, When the test rebuilds each hero preflop decision
  on its own with the engine and grades the hero's step with `gradeDecision(recommend(view), step)`, Then no grade is
  `major`.
  - The test rebuilds without calling the new helper. It uses `createHand` with `GOLDEN_STAKES` and `GOLDEN_STACK`,
    button 1, and a deck giving the parsed hero seat its hole cards at the indexes described in `golden.ts:150-153`.
    It applies each `before` step as the to-act seat's legal action of that type, using `playerView`.
  - Every spot has at least one hero preflop decision, so the check is never empty.
  - A failure names the spot id, the step number, the action and the chart cell.
- Verification: acceptance `tests/golden/postflop-lines.acceptance.test.ts::AC#1 no postflop golden spot reaches its decision through a hero preflop action the chart grades as a Major error`

### SPEC-02: The validator rejects a spot whose hero preflop line is a Major error
- Verifies: AC#1
- Behaviour: Given the 6-max probe in §5, When `parsePostflopGoldenSpots` runs with a stub that would make the spot
  clear-cut, Then:
  - With the 7h 2s hand it throws `GoldenSpotValidationError` whose problems equal exactly
    `['Golden spot probe: hero preflop step 4 "raise" is a Major error on the chart (6-max BTN unopened 72o: fold)']`.
  - With the Kh Qh hand it returns one spot.
- Verification: acceptance `tests/golden/postflop-lines.acceptance.test.ts::AC#1 a spot whose hero preflop line is a Major error is rejected by the validator`

### SPEC-03: Re-authored spots keep the suite's coverage and still validate and agree
- Verifies: AC#1
- Behaviour: Given the re-authored file, When it is parsed with real advice, Then:
  - It parses without problems. This means every spot is clear-cut by the TASK-7.14 rule.
  - The counts equal A-8 exactly: 120 spots; flop 45, turn 40, river 35; 6/2/9 seats 86/18/16; call 27, raise 24,
    bet 23, check 23, fold 23; 20 with two or more unfolded opponents at the decision; 4 with opponent stats.
  - `checkGoldenSpot(spot)` is `null` for every spot.
- Verification: acceptance `tests/golden/postflop-lines.acceptance.test.ts::AC#1 re-authored spots keep the documented coverage, are clear-cut and match the advice`

### SPEC-04: The 92o spot names kings full
- Verifies: AC#2
- Behaviour: Given the spot with id `6max-turn-bb-raise-92o`, When its justification is read, Then the spot exists,
  its justification contains `kings full`, and it does not match `/set of kings/i`.
- Verification: acceptance `tests/golden/postflop-lines.acceptance.test.ts::AC#2 6max-turn-bb-raise-92o names kings full, not a set of kings`

### SPEC-05: A grading throw during the clear-cut check is a listed problem
- Verifies: AC#3
- Behaviour: Given the `facingBet` probe and a stub returning `equityPct: NaN` (§5), When `parsePostflopGoldenSpots`
  runs, Then:
  - It throws a `GoldenSpotValidationError`, not a `RangeError`.
  - Its problems equal exactly
    `['Golden spot probe: clear-cut check failed (equityPct must be a finite number, got NaN)']`.
- Verification: acceptance `tests/golden/postflop-lines.acceptance.test.ts::AC#3 a gradeDecision error in the clear-cut check is listed as a problem for that spot`

### SPEC-06: Validator unit behaviour
- Verifies: AC#1, AC#3
- Behaviour: Given stubbed advice, When the validator runs, Then:
  - A Minor (borderline-cell) hero preflop step is accepted.
  - A Major step on the flop of a turn spot is still reported by preflop step number only.
  - A heads-up BB that calls a raise with a hand the chart re-raises is rejected with the A-5 text.
  - With one throwing spot and one valid spot in the same file, only the throwing spot's id appears in the problems.
  - The existing `advice failed (boom)` case is unchanged.
  - The heads-up second-pass probe uses a chart-consistent line.
- Verification: unit `tests/golden/postflop-golden.test.ts::hero preflop line rule and guarded clear-cut check`

### SPEC-07: The change log and docs describe the rule and every changed spot
- Verifies: AC#1, AC#2
- Behaviour: Given `docs/advice/golden-spots.md`, When it is read, Then:
  - The postflop `before` rule states that hero preflop actions must not be Major errors on the chart.
  - "Adding a spot" includes choosing a chart-consistent hero line.
  - The failure texts in A-5 appear.
  - A "Changes from TASK-7.31 (chart-consistent hero lines)" table lists all 72 spots from §3: old id, new id
    (equal for same-id re-lines) and a one-line reason naming the old hero action and chart cell.
  - The Coverage section's numbers are unchanged.
- Verification: manual `the judge compares the docs table rows with git diff of tests/golden/postflop-spots.json (every removed or changed id appears once) and checks the Coverage section still reads 120 / 45 / 40 / 35 / 86 / 18 / 16 / 20 / 4`

### SPEC-08: Justifications are factually accurate for the new hands and lines
- Verifies: AC#1, AC#2
- Behaviour: Given the build-log table (§5 Rules), When a reviewer reads each changed spot, Then every justification's
  made-hand or draw wording matches the evaluator category and board, and its line wording (who raised or limped,
  position) matches `before`.
- Verification: manual `reviewer and judge cross-check doit/TASK-7.31/build-log.md against tests/golden/postflop-spots.json for all changed spots`

### SPEC-09: Every other check stays green
- Verifies: AC#1, AC#2, AC#3
- Behaviour: Given the change, When the full suite, lint and typecheck run, Then all pass, and no locked file other
  than `tests/golden/postflop-spots.json` is modified.
- Verification: command `npm run lint && npm run typecheck && npm test && git diff --name-only 5a1b2a3 -- tests/` (the diff lists only `tests/golden/postflop-spots.json`, `tests/golden/postflop-golden.test.ts` and `tests/golden/postflop-lines.acceptance.test.ts`)

## 7. Edge cases
- Hero acts more than once preflop (open, then call a re-raise). Every hero preflop step is graded (SPEC-01, SPEC-06).
  Example: `6max-flop-co-bet-76o` has two Major steps today.
- Raise cap reached. `recommendPreflop` turns a capped raise into a call (`preflop.ts:142-147`), so a capped call
  grades Correct. This is covered by SPEC-01 through the real engine.
- BB with nothing owed. The chart's fold becomes check, so a BB checking its option with any hand is Correct. A-7
  relies on this.
- Borderline cells. Minor is allowed (A-3, SPEC-06).
- A spot whose view can't be built. The rule is skipped and the existing "missing player view" problem stands.
- Non-finite advice numbers. SPEC-05.
- An id or justification collision after re-authoring. This is caught by the locked TASK-7.14 DoD#1 test, which
  runs in `npm test`.
- Concurrency, permissions and interruption: N/A, because this is pure test-data validation.

## 8. Security considerations
- Trust boundary: the spot JSON is repo-controlled test data. Untrusted values in messages go through the existing
  `echo` (`golden.ts:125-135`). The new step text uses `echo(step)` as well.
- No authn/authz, secrets, network, new dependencies or randomness. Equity seeding is unchanged.

## 9. Non-functional
- `npx vitest run tests/golden/` stays under 3 s locally (about 1.4 s today). The rule adds one preflop replay per
  spot (microseconds). Nothing goes in the slow group, and no speed or scale test is added.
- Determinism: the advice is seeded, so recorded actions and margins are stable across runs (TASK-7.14 D-4).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx vitest run tests/golden/`
- New tests:
  - `tests/golden/postflop-lines.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05.
  - `tests/golden/postflop-golden.test.ts` → SPEC-06.
- End-to-end for the Judge:
  1. Run `npx vitest run tests/golden/`.
  2. In a scratch copy, set one re-authored spot's hero preflop step back to a chart fold hand (for example, restore
     `6max-turn-utg-fold-82o`). Confirm the suite fails with the A-5 hero-line text naming that spot.
  3. Read `6max-turn-bb-raise-92o` in the JSON.
  4. Spot-check five changed justifications against the build-log table.

## 11. Open questions
- None open. Q-1 answered (see D-1 and `doit/TASK-7.31/qa.md`): `tests/golden/postflop-spots.json` is unlocked under TASK-7.14 for like-for-like re-authoring of the 72 spots.

## 12. Clarifications log
See `doit/TASK-7.31/qa.md`.
