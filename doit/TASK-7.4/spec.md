# Spec: TASK-7.4 — Grade a decision as Correct, Minor error or Major error

Status: READY (approved 2026-11-18 by user via Q-1/Q-2)
Task: TASK-7.4 · Parent/epic: TASK-7 (Get trustworthy advice) · Requirements: REQ-038.1–REQ-038.6, REQ-025.2, REQ-025.3 (REQ-036 determinism is proven at scale by TASK-7.15) · Dream: limit-holdem-trainer

## 1. Summary
This task adds the grader. A pure function `gradeDecision(recommendation, userAction)` returns Correct, Minor error
or Major error by the REQ-038 rules: matching the recommended action or the acceptable alternative is Correct,
preflop deviations grade by the chart cell's borderline flag, and postflop deviations grade by the call/fold margin
(10 points) or the distance of equity against the calling range from 50% (15 points). A thin wrapper
`gradeView(view, userAction, options?)` calls `recommend(view)` once and grades against it, so a grade can only
depend on the `PlayerView` at the decision point. The result is plain data that carries the recommendation it was
based on, so Hand Review (E09) and hand records (TASK-3.12) can show action, recommendation, numbers and grade from one
object.

## 2. Scope
- In scope:
  - `src/advice/grade.ts`: grade types, the grader input types (structural, so today's `Recommendation` and the
    injected fixtures both fit), `gradeDecision`, `gradeView`, `GRADE_LABELS`.
  - Acceptance and unit tests under `tests/advice/`.
- Not doing:
  - Any change to `src/advice/postflop.ts`, `src/advice/preflop.ts`, `src/advice/recommend.ts`, `src/engine/`,
    `src/bots/`, `src/ui/`, `e2e/` or the toolchain. No new dependency.
  - Adding `equityVsCallingRangePct` or bet/raise outcomes to `PostflopRecommendation` (TASK-7.8) or ranges (TASK-7.5).
    This story's tests inject fixtures for those values, as the story says.
  - Storing grades in hand records or session stats (TASK-3.12, E10), hint marking (TASK-8.2), UI display of grades or
    labels (E09), explanations (TASK-7.10), golden spots with graded examples (TASK-7.14), the 10,000-decision
    determinism harness (TASK-7.15).
  - A grading-rules design document (REQ-038 is the source; no chart, range or golden spot is added).
- Scope budget: files=3, lines=800   (grade.ts ~170, grade.acceptance.test.ts ~320, grade.test.ts ~300)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Module `src/advice/grade.ts`; tests `tests/advice/grade.acceptance.test.ts` (locked) and `tests/advice/grade.test.ts`. | yes | Same one-module-per-concern layout as `preflop.ts`, `postflop.ts`. | `src/advice/grader.ts`; put it in `recommend.ts` |
| A-2 | Actions are compared by type only (`'fold' \| 'check' \| 'call' \| 'bet' \| 'raise'`). | yes | Fixed limit: each type has exactly one legal amount (`hand.ts:216-238`), so the type is the whole decision. | Compare full `Action` objects incl. amount |
| A-3 | Margins are computed in integer tenths of a point from the one-decimal percentages: `t(x) = Math.round(x * 10)`; call/fold margin `≥ 100` tenths is Major; calling-range distance `\|t(eqVsCR) − 500\| ≥ 150` tenths is Major. | yes | Avoids float error (e.g. `26.7 − 16.7` is not exactly `10`); matches the TASK-7.3 Q-2 decision that rules compare the rounded numbers the player sees (`docs/advice/postflop-rules.md` "Rounding"). | Raw float subtraction with an epsilon |
| A-4 | A deviation whose margin points the "wrong way" for the recommendation (e.g. a fixture recommends call but equity is below required, and the user folds) grades Minor: the margin is signed and only `≥ 10` points against the user's action is Major. | yes | The grader trusts the recommendation (REQ-038.1) and REQ-038.5 says close calls are never Major; a negative margin is closer than any close call. | Throw on an inconsistent recommendation |
| A-5 | Pairings that can never both be legal at one decision point throw `RangeError`: check–fold, check–call, bet–fold, bet–call, bet–raise (either way round). | yes | `legalActions` (`hand.ts:226-238`) never offers fold or call with check/bet, nor bet with raise, so such input is a caller bug. In particular "fold when a check was free" cannot occur. | Grade them Major; grade them Minor |
| A-6 | `gradeView` throws `RangeError` when `userAction` is not the type of an element of `view.legalActions`; errors from `recommend` propagate unchanged. | yes | Same convention as `recommendPreflop`/`recommendPostflop` (`preflop.ts:80-83`, `postflop.ts:62-65`). | Return an error grade |
| A-7 | `marginPts` in the result is the signed margin the deciding rule measured, one decimal (`tenths / 10`): call/fold rules → points of equity against the user's action; calling-range rule → `\|eqVsCR − 50\|`; `null` for Correct and for preflop grades. | yes | Gives Review (TASK-9.3) the number behind the grade without recomputing. | Omit the margin; always non-negative |

## 3. Current system
- TypeScript strict ESM (`tsconfig.json` includes `src` and `tests`, so type-level assertions in tests are checked by
  `npm run typecheck`), Vitest 5 with v8 coverage, ≥ 90% lines for `src/{engine,bots,advice,stats}/**`
  (`vite.config.ts:6-17`). Lint = `eslint . --max-warnings 0 && prettier --check .` (`package.json`).
- `src/advice/recommend.ts:1-14` — `Recommendation = PreflopRecommendation | PostflopRecommendation` discriminated by
  `basis`; `recommend(view, options)` dispatches by `view.street`.
- `src/advice/preflop.ts:21-37` — `PreflopRecommendation { basis: 'chart', action, borderline, alternative, move, … }`;
  `action`/`alternative` are `'fold' | 'check' | 'call' | 'raise'`, already made legal (`:93-99`), and
  `alternative` is `null` when absent or equal to `action` (`:111`). Preflop recommendations carry no equity numbers.
- `src/advice/postflop.ts:11-32` — `PostflopRecommendation { basis: 'equity', action: 'fold' | 'check' | 'call',
  alternative: null, equityPct, requiredEquityPct, ruleId, … }`; percentages are one decimal via `toPct` (`:39-42`).
  There is no `equityVsCallingRangePct` and no bet/raise yet (doc-17 follow-up: TASK-7.8 AC#9 adds them "without
  breaking existing consumers").
- `src/advice/postflop.ts:34-37` — `PostflopOptions.equity` injection seam; `recommend` forwards options.
- `src/engine/hand.ts:49-51` — `Action`; `:216-238` — `legalActions`: owed > 0 → fold, call, raise; nothing owed with
  a bet in → check, raise; no bet → check, bet.
- `src/engine/player-view.ts:36-61` — `PlayerView`: no other players' hole cards, no deck (REQ-025.1).
- `tests/advice/postflop.acceptance.test.ts:19-88` — scripted-deal helpers (`deckWith`, `spotDeck`, `stateAfter`,
  `heroView`, `fixedEquity`) and the hidden-card permutation property (`:250-268`); the new acceptance test copies
  this pattern (test helpers are file-local; no shared helper module exists).
- `tests/toolchain/boundary.test.ts` + `tools/lint/headless-boundary.js` — lint enforces no UI/browser imports in
  `src/advice` (DoD#5).
- Existing code to reuse:
  - `src/advice/recommend.ts` → `recommend`, `Recommendation`, `RecommendOptions` (gradeView's one call).
  - `src/engine/hand.ts` → `createHand`, `applyAction`, `Action`, `HandState` (tests play real hands to showdown).
  - `src/engine/player-view.ts` → `playerView`, `PlayerView`.
  - `src/engine/cards.ts` → `parseCards` (tests).
  - `src/advice/equity.ts` → `EquityInput`, `EquityResult` (type of the injected equity stub in tests).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Grade result shape and entry points as in §5 "Components" (`gradeDecision`, `gradeView`, `GradeResult<R>` with stable codes `'correct' \| 'minor' \| 'major'`, `GRADE_LABELS`, `ruleId`, `marginPts`, `userAction`, `recommendation`). | (b) grade values are the display labels themselves; (c) result without the recommendation (caller pairs them); (d) `gradeView` only, no pure function | Public interface; persisted later in hand records (TASK-3.12) and session stats (E10) and shown in reviews (E09). | yes | user (Q-1, qa.md: Approve, recommended shape) |
| D-2 | When REQ-038.4 applies but the recommendation has no `equityVsCallingRangePct` (every real postflop recommendation until TASK-7.8), the deviation grades Minor with `ruleId: 'aggression-no-range'`. | (b) use `equityPct` (equity against any hand) in its place; (c) throw; (d) grade Correct | User-visible: today a user betting when the advice says check, or raising when it says call, gets this grade in every hand. | yes | user (Q-2, qa.md: Minor error for now) |
| D-3 | Preflop: every deviation (including raise versus fold) grades by REQ-038.2 only; REQ-038.6 applies postflop. | Apply call/fold margins preflop | Preflop recommendations carry no equity (`preflop.ts:21-37`); REQ-038.3/038.4 are stated for postflop. | no | n/a (REQ-038.2) |
| D-4 | REQ-038.4 distance is absolute, `\|eqVsCR − 50\|`, whichever side of 50 it lies. | Directional (only above 50 for missed bets, below 50 for extra bets) | REQ-038.4 text: "15 or more points away from 50%"; AC#5/AC#6 are both satisfied. | no | n/a (REQ-038.4) |
| D-5 | Rounding/margins in tenths of the displayed one-decimal numbers (A-3). | Unrounded floats | TASK-7.3 Q-2 (user): rules compare the rounded numbers the player sees. | no | n/a (TASK-7.3 Q-2) |

## 5. Design

### Files to create / modify
- `src/advice/grade.ts` — new: types, `GRADE_LABELS`, `GRADE_RULE_IDS`, `gradeDecision`, `gradeView`.
- `tests/advice/grade.acceptance.test.ts` — new: AC#1–AC#8 (locked).
- `tests/advice/grade.test.ts` — new: per-rule boundary tables (0, 9.9, 10, 14.9, 15), impossible pairings, errors,
  type compatibility, determinism, result serialisability.

### Components, interfaces and data
Approved by the user (Q-1, qa.md):

```ts
// src/advice/grade.ts
import type { PlayerView } from '../engine/player-view';
import { recommend, type Recommendation, type RecommendOptions } from './recommend';

export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise';
export type Grade = 'correct' | 'minor' | 'major';
/** User-approved display labels (REQ-038). */
export const GRADE_LABELS: Readonly<Record<Grade, string>> = {
  correct: 'Correct', minor: 'Minor error', major: 'Major error',
};
export const GRADE_RULE_IDS = [
  'match',               // REQ-038.1 user action = recommended action
  'alternative',         // REQ-038.1 user action = acceptable alternative
  'preflop-borderline',  // REQ-038.2 → minor
  'preflop-chart',       // REQ-038.2 → major
  'call-fold-margin',    // REQ-038.3 / REQ-038.6
  'aggression-margin',   // REQ-038.4
  'aggression-no-range', // D-2 (Q-2, qa.md)
] as const;
export type GradeRuleId = (typeof GRADE_RULE_IDS)[number];

/** What the grader reads from a preflop recommendation. PreflopRecommendation is assignable. */
export interface ChartGradeInput {
  readonly basis: 'chart';
  readonly action: ActionType;
  readonly alternative: ActionType | null;
  readonly borderline: boolean;
}
/** What the grader reads from a postflop recommendation. PostflopRecommendation is assignable. */
export interface EquityGradeInput {
  readonly basis: 'equity';
  readonly action: ActionType;
  readonly alternative: ActionType | null;
  readonly equityPct: number;
  readonly requiredEquityPct: number;
  /** Equity against the range that would call, percent one decimal; absent/null until TASK-7.8. */
  readonly equityVsCallingRangePct?: number | null;
}
export type GradeInput = ChartGradeInput | EquityGradeInput;

/** Plain, JSON-serialisable data (no functions, Dates, Maps, class instances). */
export interface GradeResult<R extends GradeInput = Recommendation> {
  readonly grade: Grade;
  readonly ruleId: GradeRuleId;
  readonly userAction: ActionType;
  /** Signed margin (points, one decimal) the deciding rule measured; null for correct and preflop. */
  readonly marginPts: number | null;
  /** The recommendation the grade was based on, unchanged (same reference). */
  readonly recommendation: R;
}

/** Pure: same inputs → deep-equal result. Throws RangeError for impossible pairings (A-5). */
export function gradeDecision<R extends GradeInput>(recommendation: R, userAction: ActionType): GradeResult<R>;

/** One recommend(view, options) call, then gradeDecision. Throws RangeError if userAction is not legal in view. */
export function gradeView(view: PlayerView, userAction: ActionType, options?: RecommendOptions): GradeResult<Recommendation>;
```

Invariants: `grade === 'correct'` ⇔ `ruleId ∈ {match, alternative}` ⇔ `marginPts === null` for postflop;
`recommendation` is returned by reference, never copied or mutated. No `Math.random`, `Date` or I/O.

### Rules and algorithms
`t(x) = Math.round(x * 10)` (tenths). Let `u = userAction`, `r = rec.action`, `a = rec.alternative`.
Evaluated in order; first match decides:

1. `u === r` → correct, `match`.
2. `a !== null && u === a` → correct, `alternative`.
3. `{u, r}` is an impossible pairing (A-5) → throw `RangeError("<u> and <r> cannot both be legal")`.
4. `basis === 'chart'`: `rec.borderline` → minor `preflop-borderline`; else major `preflop-chart`. `marginPts null`.
5. `basis === 'equity'`, one side is `fold` (the other is `call` or `raise`, REQ-038.3/038.6), rule `call-fold-margin`:
   - user folds (r ∈ {call, raise}): `m = t(equityPct) − t(requiredEquityPct)`.
   - user calls or raises (r = fold): `m = t(requiredEquityPct) − t(equityPct)`.
   - major if `m ≥ 100`, else minor. `marginPts = m / 10`.
6. `basis === 'equity'`, otherwise (one side in {check, call}, the other in {bet, raise}, REQ-038.4):
   - `equityVsCallingRangePct` is `undefined` or `null` → minor, `aggression-no-range`, `marginPts null` (approved Q-2, qa.md).
   - else `d = |t(eqVsCR) − 500|`; major if `d ≥ 150`, else minor; `aggression-margin`; `marginPts = d / 10`.

Worked examples:
- Postflop, rec call, equity 26.7, required 16.7, user folds → m = 267 − 167 = 100 → major (AC#3); equity 26.6 → 99 → minor.
- Postflop, rec fold, equity 6.8, required 16.7, user raises → m = 167 − 68 = 99 → minor; equity 6.7 → 100 → major (AC#8).
- Postflop, rec bet, eqVsCR 64.9, user checks → d = 149 → minor; 65.0 → 150 → major (AC#5).
- Postflop, rec call, eqVsCR 35.0, user raises → d = 150 → major; 35.1 → 149 → minor (AC#6).
- Preflop, cell `R*/C` (borderline raise, alternative call), user calls → correct `alternative`; user folds → minor
  `preflop-borderline`. Cell `F` (not borderline), user raises → major `preflop-chart`.

### Error handling and configuration
- `gradeDecision`: `RangeError` for impossible pairings (A-5). No other validation of fixture numbers.
- `gradeView`: `RangeError("<u> is not legal for seat <seat>")` when no element of `view.legalActions` has type `u`;
  checked before calling `recommend`. Errors thrown by `recommend` (non-6-max preflop, seat not to act, …) propagate.
- No configuration. `options` are passed to `recommend` unchanged.

## 6. Behaviour specification

### SPEC-01: Matching the recommendation or the alternative is Correct
- Verifies: AC#1
- Behaviour: Given a chart fixture `{action: 'raise', alternative: 'call', borderline: false}` and an equity fixture `{action: 'call', alternative: 'raise', equityPct: 30, requiredEquityPct: 20}`, When graded with the recommended action and with the alternative, Then every result is `grade: 'correct'` with `ruleId` `match` and `alternative` respectively, `marginPts: null`, and `recommendation` is the same object passed in; And given a real `gradeView` on a scripted preflop view with the chart's recommended action, Then the grade is `correct`.
- Verification: acceptance `tests/advice/grade.acceptance.test.ts::AC#1 matching the recommended action or the acceptable alternative is Correct`

### SPEC-02: Preflop deviations grade by the borderline flag
- Verifies: AC#2
- Behaviour: Given chart fixtures `{action: 'raise', alternative: null, borderline: true}` and `{…, borderline: false}`, When the user folds or calls, Then the grades are `minor` (`preflop-borderline`) and `major` (`preflop-chart`); And given the real 6-max chart via `gradeView` on one scripted borderline cell and one non-borderline cell with a deviating legal action, Then the grades are `minor` and `major`.
- Verification: acceptance `tests/advice/grade.acceptance.test.ts::AC#2 a preflop deviation is Minor on a borderline cell and Major otherwise`

### SPEC-03: Folding against a call recommendation uses the 10-point margin
- Verifies: AC#3
- Behaviour: Given equity fixtures `{action: 'call', requiredEquityPct: 16.7}` with `equityPct` 16.8, 26.6 and 26.7, When the user folds, Then the grades are `minor`, `minor`, `major`, `ruleId: 'call-fold-margin'`, `marginPts` 0.1, 9.9, 10.
- Verification: acceptance `tests/advice/grade.acceptance.test.ts::AC#3 folding with equity 0.1, 9.9 and 10.0 points above required is Minor, Minor, Major`

### SPEC-04: Calling against a fold recommendation uses the 10-point margin
- Verifies: AC#4
- Behaviour: Given equity fixtures `{action: 'fold', requiredEquityPct: 33.3}` with `equityPct` 33.2, 23.4 and 23.3, When the user calls, Then the grades are `minor`, `minor`, `major` with `marginPts` 0.1, 9.9, 10.
- Verification: acceptance `tests/advice/grade.acceptance.test.ts::AC#4 calling with equity 0.1, 9.9 and 10.0 points below required is Minor, Minor, Major`

### SPEC-05: Checking or calling against a bet/raise recommendation uses the 15-point distance
- Verifies: AC#5
- Behaviour: Given equity fixtures `{action: 'bet'}` (user checks) and `{action: 'raise'}` (user calls) with `equityVsCallingRangePct` 64.9 and 65.0, When graded, Then each pair is `minor`, `major` with `ruleId: 'aggression-margin'` and `marginPts` 14.9, 15.
- Verification: acceptance `tests/advice/grade.acceptance.test.ts::AC#5 checking or calling at 64.9% and 65.0% against the calling range is Minor then Major`

### SPEC-06: Betting or raising against a check/call recommendation uses the 15-point distance
- Verifies: AC#6
- Behaviour: Given equity fixtures `{action: 'check'}` (user bets) and `{action: 'call'}` (user raises) with `equityVsCallingRangePct` 35.1 and 35.0, When graded, Then each pair is `minor`, `major` with `marginPts` 14.9, 15.
- Verification: acceptance `tests/advice/grade.acceptance.test.ts::AC#6 betting or raising at 35.1% and 35.0% against the calling range is Minor then Major`

### SPEC-07: A Major call stays Major when later cards make the user win
- Verifies: AC#7
- Behaviour: Given a scripted 6-max hand where the hero faces a turn bet and `options.equity` is a stub returning equity 0.05 (required 8 ÷ (pot + 8) ≥ 15.1%), When `gradeView(turnView, 'call', options)` is computed, the hero calls, and the hand is played to showdown with a river card that gives the hero the winning hand, Then the hand result awards the pot to the hero and `gradeView` on the same turn view still returns `major` (`call-fold-margin`) deep-equal to the first result; And `gradeView`'s first parameter is typed `PlayerView` (a type-level assertion that a `HandState` argument fails to compile, via `// @ts-expect-error`); And for 50 random permutations of the cards the hero cannot see (other hole cards, burns, undealt), with real equity on a heads-up flop, `gradeView` returns a deep-equal result for every permutation.
- Verification: acceptance `tests/advice/grade.acceptance.test.ts::AC#7 a Major call is still Major when the river makes the user win`

### SPEC-08: Raise-versus-fold uses the call/fold margin
- Verifies: AC#8
- Behaviour: Given `{action: 'fold', requiredEquityPct: 20.0}` with `equityPct` 10.1 and 10.0, When the user raises, Then `minor`, `major`; And given `{action: 'raise', requiredEquityPct: 20.0}` with `equityPct` 29.9 and 30.0, When the user folds, Then `minor`, `major`; all with `ruleId: 'call-fold-margin'`.
- Verification: acceptance `tests/advice/grade.acceptance.test.ts::AC#8 raise-versus-fold deviations use the 10-point call-fold margin`

### SPEC-09: Boundary table for every margin rule (REQ-038 fit criterion)
- Verifies: AC#3, AC#4, AC#5, AC#6, AC#8, DoD#1
- Behaviour: Given each postflop deviation pairing (call→fold, fold→call, fold→raise, raise→fold, bet→check, raise→call, check→bet, call→raise), When graded at margins of 0, 9.9, 10, 14.9 and 15 points (and at negative margin −5 for call/fold pairings, A-4), Then call/fold pairings give minor, minor, major, major, major (and minor at −5), and aggression pairings give minor, minor, minor, minor, major; no margin below the close-call band (under 10 / under 15) is ever major (REQ-038.5). Includes the float case equity 26.7 vs required 16.7 → major (A-3).
- Verification: unit `tests/advice/grade.test.ts::margin boundaries for every postflop rule`

### SPEC-10: Missing calling-range equity grades Minor
- Verifies: AC#5, AC#6
- Behaviour: Given equity fixtures `{action: 'check'}` and `{action: 'call'}` without `equityVsCallingRangePct` (absent, and explicitly `null`), When the user bets or raises, Then the grade is `minor`, `ruleId: 'aggression-no-range'`, `marginPts: null`; And given a real postflop `gradeView` where the advice is check and the user bets, Then the same (approved Q-2, qa.md).
- Verification: unit `tests/advice/grade.test.ts::aggression deviation without calling-range equity is Minor`

### SPEC-11: Impossible pairings and illegal user actions throw
- Verifies: DoD#1
- Behaviour: Given `gradeDecision` with pairings check–fold, check–call, bet–fold, bet–call, bet–raise in both orders, When graded, Then each throws `RangeError`; Given `gradeView` with a user action not in `view.legalActions` (e.g. `'bet'` while facing a bet), Then it throws `RangeError` and does not call the injected equity stub; Given a view where the seat is not to act, Then `recommend`'s `RangeError` propagates.
- Verification: unit `tests/advice/grade.test.ts::errors`

### SPEC-12: Deterministic, plain-data results and type compatibility
- Verifies: DoD#1
- Behaviour: Given the same recommendation and action, When graded twice, Then results are deep-equal; `JSON.parse(JSON.stringify(result))` deep-equals `result`; the recommendation object is not mutated (`Object.freeze`d fixtures do not throw); `gradeView` calls the injected equity stub exactly once per call; `PreflopRecommendation` and `PostflopRecommendation` are assignable to `GradeInput` (compile-time assertion); `GRADE_LABELS` equals `{correct: 'Correct', minor: 'Minor error', major: 'Major error'}`; every `GRADE_RULE_IDS` entry is produced by at least one test case.
- Verification: unit `tests/advice/grade.test.ts::determinism, plain data and types`

### SPEC-13: Checks, coverage and headless boundary pass
- Verifies: DoD#2, DoD#4, DoD#5, DoD#8
- Behaviour: Given the change, When the commands run, Then `npm run lint`, `npm run typecheck` and `npm test` exit 0 with coverage thresholds met (`src/advice/grade.ts` ≥ 90% lines), `src/advice/grade.ts` imports only `../engine/*` types and `./recommend`, and no code performs network requests.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-14: 10,000-hand playtest has zero invariant violations
- Verifies: DoD#6
- Behaviour: Given the change, When the playtest runs, Then it reports zero invariant violations (the grader is not on the playtest path; this confirms nothing regressed).
- Verification: command `npm run playtest -- --hands 10000 --seed 42`

### SPEC-15: CI green and story documentation published
- Verifies: DoD#10, DoD#11
- Behaviour: Given the branch is pushed, When CI runs, Then the workflow is green; And a Backlog story doc for TASK-7.4 is published.
- Verification: manual CI run on branch `doit/TASK-7.4` and `backlog doc list --plain` shows the TASK-7.4 doc

### SPEC-16: Not-applicable DoD items
- Verifies: DoD#3, DoD#7, DoD#9, DoD#12
- Behaviour: Given this story, Then DoD#3 is N/A (golden-spot suite does not exist yet, TASK-7.14; `tests/advice/` has no golden file), DoD#7 and DoD#12 are N/A (no screen or dialog), DoD#9 is N/A (no chart, range or golden spot is added; grading rules are REQ-038 verbatim).
- Verification: manual Judge confirms no files under `src/ui/`, `e2e/`, `src/advice/charts/` changed

### SPEC-17: Exact 10-point and 15-point boundaries hold in both rounding directions
- Verifies: AC#3, AC#4, AC#5, AC#6, AC#8
- Behaviour: Given the approved tenths comparison (D-5, A-3), When graded, Then each case gives exactly the grade shown, which tells the tenths rule apart from raw float subtraction and from truncation:
  - Call/fold margin, raw float difference just below 10: rec call, equity 16.4 vs required 6.4 (`16.4 − 6.4 = 9.999999999999998`), user folds → `major`, `marginPts` 10; rec fold, required 33.3 vs equity 23.3 (`= 9.999999999999996`), user calls → `major`; same numbers, rec fold, user raises → `major`.
  - Call/fold margin, raw float difference just above 10: rec call, equity 16.6 vs required 6.6 (`= 10.000000000000002`), user folds → `major`; rec raise, equity 16.6 vs required 6.6, user folds → `major`; neighbours 16.5 vs 6.6 → `minor` (9.9).
  - Call/fold margin, inputs off the one-decimal grid: rec call, required 16.7, equity 26.66 (rounds up to 26.7) → `major`; equity 26.64 (rounds down to 26.6) → `minor`; rec fold, required 16.7, user calls, equity 6.74 (rounds down to 6.7, margin 10.0) → `major`; equity 6.76 (rounds up to 6.8, margin 9.9) → `minor`.
  - Calling-range distance above 50: rec bet, user checks, eqVsCR 65.0 → `major` (15); 64.96 (→ 65.0) → `major`; 64.94 (→ 64.9) → `minor`.
  - Calling-range distance below 50: rec check, user bets, eqVsCR 35.0 → `major` (15); 35.04 (→ 35.0) → `major`; 35.06 (→ 35.1) → `minor`.
- Verification: acceptance `tests/advice/grade.acceptance.test.ts::exact 10-point and 15-point boundaries in both rounding directions`

## 7. Edge cases
- Boundaries 0 / 9.9 / 10 / 14.9 / 15 points and float representation: SPEC-03–06, SPEC-08, SPEC-09.
- Negative margin (inconsistent fixture): SPEC-09 (A-4).
- Alternative equal to action: cannot occur (`preflop.ts:111`; postflop alternative is null); rule 1 wins anyway.
- Missing `equityVsCallingRangePct`: SPEC-10.
- Impossible pairings, illegal user action, seat not to act: SPEC-11.
- Preflop free check (BB option, chart fold made `check`): user raises → graded by REQ-038.2 (SPEC-02 rules); user fold is not legal (A-5).
- Capped street: raise not legal, so `gradeView` rejects it (SPEC-11).
- Concurrency, persistence, permissions, dependency failure: N/A — pure synchronous function, no I/O.

## 8. Security considerations
- Trust boundary: none new. Inputs are in-process values; `gradeView` accepts only `PlayerView`, which carries no
  hidden cards (REQ-025, SPEC-07).
- Hidden-information leakage: grading from later cards or the outcome is impossible by type and tested (SPEC-07).
- No authn/authz, secrets, injection, logging, randomness or new dependencies. N/A.

## 9. Non-functional
- Determinism (REQ-036.1): pure function, no randomness, deep-equal results on repeat (SPEC-12).
- Performance: `gradeDecision` is O(1); `gradeView` costs exactly one `recommend` call (SPEC-12 counts equity calls),
  so grading adds no measurable time over advice. No separate timing test.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: N/A — no user-facing entry point yet (UI is E09); exercise with `npx vitest run tests/advice/grade.acceptance.test.ts tests/advice/grade.test.ts`
- New tests:
  - `tests/advice/grade.acceptance.test.ts` → SPEC-01 to SPEC-08, SPEC-17 (locked)
  - `tests/advice/grade.test.ts` → SPEC-09 to SPEC-12
- End-to-end scenario for the Judge: run the two test files; then in a scratch script build a scripted 6-max hand,
  take the hero's turn view facing a bet, `gradeView(view, 'call', { equity: stub(0.05) })` → `major`; play the
  river so the hero wins; re-grade the stored view → identical `major`.

## 11. Open questions
None. Q-1 and Q-2 answered in `doit/TASK-7.4/qa.md` (D-1, D-2).

## 12. Clarifications log
See `doit/TASK-7.4/qa.md`.
