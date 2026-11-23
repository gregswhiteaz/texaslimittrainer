# Spec: TASK-7.10 — Explain every recommendation in plain English with its numbers

Status: READY (approved 2026-11-23)
Task: TASK-7.10 · Parent/epic: TASK-7 (Get trustworthy advice) · Requirements: REQ-036 (036.1), REQ-037 (037.1–037.4), REQ-061 (061.2) · Dream: limit-holdem-trainer

## 1. Summary
No recommendation carries any explanation today: `PreflopRecommendation` (`src/advice/preflop.ts:33-48`) and
`PostflopRecommendation` (`src/advice/postflop.ts:22-55`) hold only the action and numbers, and nothing in `src` builds
reason text (grep for `explanation|reason|explain` finds nothing in `src`). This task adds an `explanation: string` to
both recommendation types, built by a pure template filler from one authored data file that holds the 10-concept list
with one-clause definitions, one template per postflop rule id and one context sentence per chart situation plus
action sentences. Every explanation is ≤ 3 sentences, names at least one concept and defines it in the sentence that
first names it, and postflop explanations quote the same equity % and required equity % the recommendation returns
(implied-odds calls also quote the outs count and implied price, finishing what TASK-7.9 left to this story).

## 2. Scope
- In scope:
  - `src/advice/explanations.ts` (new): the authored content — `CONCEPTS` (10, task order, with match terms and a
    one-clause definition), postflop templates, preflop context/action templates, seat names, rank names.
  - `src/advice/explain.ts` (new): `formatPct`, `fillTemplate`, `handClassName`, `explainPreflop`, `explainPostflop`.
  - `src/advice/preflop.ts`, `src/advice/postflop.ts`: `explanation` field on the result, filled at the end of
    `recommendPreflop` / `recommendPostflop`.
  - `docs/advice/explanations.md` (new): what is explained, the concept list, which numbers each rule quotes,
    originality statement (REQ-061.2).
  - Tests: new locked acceptance file (10,000-decision playtest sample, every push), new unit file (exact copy),
    two locked re-pins (Q-3).
- Not doing:
  - Any UI: no hint card (TASK-8.1), no review "numbers and reason" (TASK-9.3); no screen, e2e or visual change.
  - Short-stack notes (E07-S17) and approximate labels (E07-S16): separate fields, not in the explanation (task Notes).
  - Templates that use `bluff` or `opponent type`: no current rule bluffs or reads observed opponent habits
    (`docs/advice/postflop-rules.md` "Not applied yet"); both concepts are in the concept list with definitions so
    later rules (e.g. TASK-7.13) can use them.
  - Changing any advice decision, number, rule id, grade or bot behaviour; localisation; a glossary screen.
  - Golden spots (TASK-7.11/7.14).
- Scope budget: files=10, lines=720

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Percentages in explanations are `pct.toFixed(1) + '%'` (e.g. `16.7%`, `0.0%`, `50.0%`); the recommendation's fields are already one-decimal numbers (`src/advice/postflop.ts:60-63` `toPct`), so the quoted text is exactly the returned number. | yes | One format everywhere; matches the docs' "one decimal place" rounding rule. | Drop trailing `.0` |
| A-2 | "Names a concept" = the sentence matches one of the concept's `terms` as a whole word/phrase, case-insensitive (`\b<term>\b`, no plural folding). Terms: each concept's name, except outs and draws = `outs`, `draw`. | yes | Deterministic oracle for AC#2/AC#3; templates are written to use the exact terms. | Stemming / plural matching |
| A-3 | The 10,000-decision sample (AC#1–AC#3, AC#4, AC#5) = every seat's decision views captured while playing hands with the playtest's own machinery: hand k = 1, 2, … with `size = 2 + (k % 9)`, `button = (k % size) + 1`, `code = handReplayCode(7310, k)`, `playHand(code, size, button, k, { makePolicy })` where `makePolicy` wraps `lineUpPolicyFactory('Mixed', size)` and records each view before deciding, until 10,000 views are captured. Each view is advised with `{ opponentRanges: 'actions', equity: BOT_EQUITY }` (the user-facing range model with the bots' cheaper equity budget, `src/bots/tag.ts:26-31`). | yes | Prototype (below): 715 hands, ~2.0 s to collect + ~3.2 s to advise on the dev Mac; covers all 6 rule ids and all 18 (reference size, situation) pairs; cheap enough for every push. Full `computeEquity` would cost far more for no change in what is checked (templates read only returned fields). | Full advice budget in an opt-in slow test plus a small every-push sample |
| A-4 | Locked re-pin in `tests/advice/postflop.acceptance.test.ts` AC#1 adds `explanation: expect.any(String)` (exact copy is pinned in this story's unit tests, not in TASK-7.3's test). | yes | Keeps TASK-7.3's test about TASK-7.3 behaviour; later copy edits don't touch it. | Pin the exact string |
| A-5 | Explanations are computed for every recommendation, including the bots' (`recommend` is shared); cost is a few string replaces per decision and bot actions are unchanged, so the default playtest output (and its SHA-256) is unchanged. | yes | One code path (REQ-035 bots play the advice). | Option to skip for bots |
| A-6 | Seat names use a plain phrase plus the chart label in brackets (e.g. "in the cutoff (CO)"), and UTG/UTG+1 are "an early seat" because at 7 and 10 seats the earliest label covers more than one seat (`src/advice/preflop.ts:73-89`). | yes | Accurate at every table size; the bracketed label matches chart docs. | "first to act" (wrong at some sizes) |

## 3. Current system
- `src/advice/recommend.ts:33-41` `recommend(view, options)`: preflop → `recommendPreflop`, else `recommendPostflop`;
  `Recommendation = PreflopRecommendation | PostflopRecommendation` discriminated by `basis` (`:5-6`).
- `src/advice/preflop.ts:33-48` `PreflopRecommendation` {basis 'chart', referenceSize, position, situation,
  handClass, cell, action, borderline, alternative, move}; `:117-162` `recommendPreflop` maps the chart action to a
  legal one (`legal`: capped raise → call, nothing owed → check, `:146-149`).
- `src/advice/preflop-chart.ts:3-6` `ReferenceSize`, `Position`, `Situation` (6 values: unopened, limpers, raise,
  raise-and-calls, re-raise, blind-defence); `:48-74` `APPLICABLE_SPOTS` per size (18 distinct size×situation pairs).
- `src/advice/postflop.ts:9-16` `POSTFLOP_RULE_IDS` (value-bet, check-free, value-raise, pot-odds-call,
  implied-odds-call, pot-odds-fold); `:18` `VALUE_THRESHOLD_PCT = 50`; `:22-55` result fields incl. `equityPct`,
  `requiredEquityPct`, `equityVsCallingRangePct`, `impliedRequiredEquityPct`, `outs`; `:150-168` rule selection;
  `:172-191` result object.
- `src/advice/hand-class.ts:4` `HandClass` strings like `AKs`, `72o`, `77`; `src/engine/cards.ts:8` `RANK_CHARS`.
- `src/advice/grade.ts:57-66` `GradeResult.recommendation` is the recommendation unchanged (same reference), so review
  entries (`src/table/review.ts:38-58`) and the advice worker (`src/table/advice-service.ts:61-68`, structured clone)
  carry the new string with no change.
- Consumers that never read text: bots (`src/bots/style.ts:437`), UI review panel renders only `adviceText`
  (`src/table/review.ts:52`). No e2e or visual test can see the new field.
- Tests: vitest (`vite.config.ts:7,10` include `tests/**/*.test.{ts,tsx}`, default timeout 30 s); `npm test` = all with
  coverage; `*.acceptance.test.ts` locked per owner (`doit/*/state.json`); slow opt-in via `TLH_SLOW_TESTS=1`.
- Existing code to reuse:
  - `src/playtest/runner.ts:175-190,202-281` `handReplayCode`, `playHand` (+ `PlaytestSeams.makePolicy`) and
    `src/playtest/policy.ts:57-62` `lineUpPolicyFactory` → the decision-point sample (no new playtest code).
  - `src/bots/tag.ts:29-31` `BOT_EQUITY` → cheap deterministic equity for the sample.
  - `src/advice/preflop-chart.ts` `APPLICABLE_SPOTS` → expected coverage set; `POSTFLOP_RULE_IDS` → expected rules.
  - `src/advice/postflop.ts` `VALUE_THRESHOLD_PCT` → the "50.0%" quoted by value/check templates (passed in, see §5).

### Prototype measurements (scratch script, current `main` code, no explanation yet)
- Sample per A-3: 715 hands → 10,000 views; collect 2,057 ms, advise 3,237 ms (`node --import
  ./tools/playtest/resolve-ts.js`, dev Mac). Counts: check-free 2057, pot-odds-call 1065, value-bet 924,
  pot-odds-fold 626, value-raise 458, implied-odds-call 9; 6-max unopened 913 / blind-defence 454 / re-raise 301 /
  raise 251 / limpers 225 / raise-and-calls 50; full-ring unopened 672 / re-raise 594 / raise 570 / limpers 288 /
  blind-defence 238 / raise-and-calls 140; heads-up unopened 79 / blind-defence 59 / re-raise 17 / limpers 8 / raise 2.
- Default playtest SHA-256 of `npm run -s playtest -- --hands 10000 --seed 42` after TASK-7.9:
  `14d746f736d6afd3968e7ae7e833814d95dab94378c80c11dd59b1fd6ea72e48` (`doit/TASK-7.9/build-log.md:8`) — must not change.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Public interface: both `PreflopRecommendation` and `PostflopRecommendation` gain `readonly explanation: string` (plain data, clones through the worker); `GradeResult.recommendation` carries it unchanged. | Separate `explain(rec)` function, UI calls it | REQ-037 "every recommendation shall include an explanation"; REQ-036 makes it part of the deterministic engine output; hint (TASK-8.1) and review (TASK-9.3) read it from the same object (REQ-036.2). | yes | user (Q-2, qa.md: auto-accepted, recommended) |
| D-2 | User-visible copy: the concept definitions, templates, seat names and hand names exactly as in §5 "Authored content". | Shorter definitions; chart notation (`AKs`, `UTG`) instead of names | Written for this project (REQ-061.2), plain English, each sentence passes the AC#2/AC#3 oracle. | yes | user (Q-1, qa.md: auto-accepted, recommended) |
| D-3 | Numbers quoted per rule: every postflop explanation quotes `equityPct` and `requiredEquityPct` (`0.0%` when nothing is owed); value-bet, check-free and value-raise also quote `equityVsCallingRangePct` and the 50.0% value line (the numbers those rules compare); implied-odds-call also quotes the outs count and `impliedRequiredEquityPct`; pot-odds-fold also quotes `impliedRequiredEquityPct` when it is non-null. Preflop quotes no numbers (chart basis). | Value rules quote only calling-range equity and 50% | AC#4 literally asks for the returned equity % and required equity %; the hint card shows those two (REQ-042.1), so the text agrees with it, and the extra numbers are the ones the value rules actually compared (REQ-037.4). | yes | user (Q-4, qa.md: auto-accepted, recommended) |
| D-4 | Authored content lives in one TypeScript data module (`src/advice/explanations.ts`) typed with `Record<PostflopRuleId, …>` / `Record<Situation, …>`, so a missing template is a type error; definitions are inserted into templates by `{def:<concept-id>}` placeholders so each definition is written once. | JSON file validated at load like the charts | Compile-time completeness; no new validator. | no | n/a |
| D-5 | Locked-test re-pins in §5 (TASK-7.3 AC#1, TASK-7.8 AC#9), every assertion kept. | None possible: both pin the exact key set of a postflop recommendation | Adding a field changes the pinned shape. | yes | user (Q-3, qa.md: auto-accepted, recommended; both files unlocked under TASK-7.3/TASK-7.8) |
| D-6 | The sample tests live in `tests/advice/explanations.acceptance.test.ts` (a `*.acceptance.test.*` file: CI sweep group `npm run test:sweeps`, no coverage). Default: the full 10,000-decision sample runs on every push (~5 s measured). The builder reports, in the build log, the file's wall time from `npx vitest run tests/advice/explanations.acceptance.test.ts` (no coverage, the CI-relevant time). If it exceeds 8 s locally, split: every push builds the first 2,000 decisions of the same A-3 sample (measured: 149 hands, ~1.1 s; still covers all 6 rule ids — implied-odds-call 1 — and all 18 size×situation pairs — heads-up raise 1) and runs AC#1–AC#5 on it; the 10,000-decision run of the same assertions is gated by `TLH_SLOW_TESTS=1` (`it.runIf`/`describe.runIf`) and added to `npm run test:slow` in `package.json`. | Always split | Correctness check, cheap with `BOT_EQUITY`; split only if the time budget is missed. | no | n/a (coordinator instruction) |

## 5. Design

### Files to create / modify
- `src/advice/explanations.ts` — new: authored concepts, templates, seat and rank names (original text)
- `src/advice/explain.ts` — new: template filling and the two explain functions
- `src/advice/preflop.ts` — `explanation` field; filled via `explainPreflop`
- `src/advice/postflop.ts` — `explanation` field; filled via `explainPostflop(rec, VALUE_THRESHOLD_PCT)`
- `docs/advice/explanations.md` — new: concept list, numbers per rule, originality
- `tests/advice/explanations.acceptance.test.ts` — new, locked after first green build (SPEC-01..SPEC-05)
- `tests/advice/explain.test.ts` — new unit tests (SPEC-06..SPEC-08)
- `tests/advice/postflop.acceptance.test.ts` (locked, TASK-7.3) — re-pin per Q-3
- `tests/advice/value-bet.acceptance.test.ts` (locked, TASK-7.8) — re-pin per Q-3
- `package.json` — only if D-6 splits: add the acceptance file to `test:slow`

### Components, interfaces and data
```ts
// src/advice/explanations.ts  (authored data; no logic)
export type ConceptId = 'pot-odds' | 'equity' | 'position' | 'hand-strength' | 'outs-and-draws'
  | 'implied-odds' | 'value-bet' | 'bluff' | 'opponent-type' | 'initiative';
export interface Concept {
  readonly id: ConceptId;
  /** As in REQ-037.2. */
  readonly name: string;
  /** Whole-word, case-insensitive matches that count as naming the concept (A-2). */
  readonly terms: readonly string[];
  /** One clause, lower-case start, no sentence punctuation, inserted verbatim by {def:<id>}. */
  readonly definition: string;
}
export const CONCEPTS: readonly Concept[];                 // 10, in REQ-037.2 order
export type PostflopTemplateKey = PostflopRuleId | 'pot-odds-fold-implied';
export const POSTFLOP_TEMPLATES: Readonly<Record<PostflopTemplateKey, string>>;
export const PREFLOP_CONTEXT: Readonly<Record<Situation, string>>;
export type PreflopSentenceKey = 'raise' | 'call' | 'call-capped' | 'fold' | 'check' | 'alternative' | 'borderline';
export const PREFLOP_SENTENCES: Readonly<Record<PreflopSentenceKey, string>>;
export const SEAT_NAMES: Readonly<Record<Position, string>>;
/** Keyed by RANK_CHARS character: singular and plural names. */
export const RANK_NAMES: Readonly<Record<string, { readonly one: string; readonly many: string }>>;

// src/advice/explain.ts
/** `${pct.toFixed(1)}%`. */
export function formatPct(pct: number): string;
/** Replaces {key} from `values` and {def:<ConceptId>} with that concept's definition.
 *  Throws Error(`Unknown template placeholder {<name>}`) for any other placeholder. */
export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string;
/** 'AA' → 'a pair of aces'; 'AKs' → 'ace-king suited'; '72o' → 'seven-two offsuit'. */
export function handClassName(hc: HandClass): string;
export function explainPreflop(rec: Omit<PreflopRecommendation, 'explanation'>): string;
export function explainPostflop(rec: Omit<PostflopRecommendation, 'explanation'>, valueThresholdPct: number): string;
```
- `explain.ts` imports the recommendation types with `import type` only (no runtime cycle); `preflop.ts`/`postflop.ts`
  import the explain functions. Pure: output depends only on the arguments.
- `PreflopRecommendation` / `PostflopRecommendation`: add `/** Plain-English reason, ≤ 3 sentences (REQ-037). */
  readonly explanation: string;` — last field.

### Authored content (Q-1; exact text, placeholders in braces)
Concepts (id · name · terms · definition):
1. `pot-odds` · pot odds · [pot odds] · `the cost of a call as a share of the pot after you call`
2. `equity` · equity · [equity] · `your share of the pot if the hand were played out to the end`
3. `position` · position · [position] · `where you sit relative to the button, which sets how many players act after you`
4. `hand-strength` · hand strength · [hand strength] · `how well two cards hold up against the hands others play`
5. `outs-and-draws` · outs and draws · [outs, draw] · `the unseen cards that would complete your draw`
6. `implied-odds` · implied odds · [implied odds] · `the price of a call once you count the bets you expect to win if you hit`
7. `value-bet` · value bet · [value bet] · `a bet that worse hands will call`
8. `bluff` · bluff · [bluff] · `a bet meant to make better hands fold`
9. `opponent-type` · opponent type · [opponent type] · `the playing style an opponent has shown`
10. `initiative` · initiative · [initiative] · `being the last player to bet or raise`

Postflop templates (`{equity}` = formatPct(equityPct), `{required}` = formatPct(requiredEquityPct), `{callingEquity}`
= formatPct(equityVsCallingRangePct), `{impliedRequired}` = formatPct(impliedRequiredEquityPct), `{threshold}` =
formatPct(valueThresholdPct), `{outs}` = String(outs.length), `{aggressive}` = 'bet' | 'raise' (= action),
`{aggressiveIng}` = 'betting' | 'raising'):
- `value-bet`: `Your equity, {def:equity}, is {equity} against all their hands and {callingEquity} against the hands that would call a {aggressive}. That is above {threshold}, so {aggressiveIng} is a value bet, {def:value-bet}. Checking would be free, with {required} equity required, but {aggressiveIng} wins more.`
- `check-free`: `Your equity, {def:equity}, is {equity} against all their hands and {callingEquity} against the hands that would call a bet. That is not above {threshold}, so a bet would not be a value bet, {def:value-bet}. Checking is free, with {required} equity required, so check.`
- `value-raise`: `Your equity, {def:equity}, is {equity} against all their hands and {callingEquity} against the hands that would call a raise. That is above {threshold}, so raising is a value bet, {def:value-bet}. Pot odds, {def:pot-odds}, ask only for {required} to call, but raising wins more.`
- `pot-odds-call`: `Your equity, {def:equity}, is {equity}. Pot odds, {def:pot-odds}, ask for {required}, and you have at least that, so calling earns chips over time.`
- `implied-odds-call`: `You have a draw with {outs} outs, {def:outs-and-draws}, and your equity, {def:equity}, is {equity}. Pot odds, {def:pot-odds}, ask for {required}, more than you have. Implied odds, {def:implied-odds}, ask only for {impliedRequired}, so calling earns chips over time.`
- `pot-odds-fold` (implied null): `Your equity, {def:equity}, is {equity}. Pot odds, {def:pot-odds}, ask for {required}, more than you have, so folding saves chips over time.`
- `pot-odds-fold-implied` (rule pot-odds-fold, implied non-null): `Your equity, {def:equity}, is {equity}. Pot odds, {def:pot-odds}, ask for {required}, more than you have. Even implied odds, {def:implied-odds}, ask for {impliedRequired}, so fold.`

Preflop context sentence by situation (`{seat}` = SEAT_NAMES[position]):
- `unopened`: `No one has entered the pot yet and you sit {seat}, so position, {def:position}, decides how many hands are worth playing.`
- `limpers`: `At least one player has limped in (just called the big blind) and you sit {seat}, so position, {def:position}, decides how many hands are worth playing.`
- `raise`: `A player has raised, so your hand strength, {def:hand-strength}, must be higher than when no one has raised.`
- `raise-and-calls`: `A player has raised and others have called, so your hand strength, {def:hand-strength}, must hold up against several players at once.`
- `re-raise`: `The pot has been raised more than once, so your hand strength, {def:hand-strength}, must be very high to continue.`
- `blind-defence`: `Your blind is already in the pot, which improves your pot odds, {def:pot-odds}, so you can defend with more hands than other seats.`

Preflop sentences (`{hand}` = handClassName(handClass); `{alternativeIng}` = 'Raising' | 'Calling' | 'Folding' | 'Checking'):
- `raise`: `Raise with {hand}: raising takes the initiative, {def:initiative}, so the others must react to you.`
- `call`: `Call with {hand}: it is worth playing at this price but not worth raising.`
- `call-capped`: `Call with {hand}: it is worth a raise, but no more raises are allowed.`
- `fold`: `Fold {hand}: it loses too often against the hands that stay in.`
- `check`: `Check with {hand}: you see the flop for free.`
- `alternative`: `{alternativeIng} is also fine, because this hand is close to the line.`
- `borderline`: `This hand is close to the line, so another choice is only a minor error.`

Seat names: BTN `on the button (BTN)`, SB `in the small blind (SB)`, BB `in the big blind (BB)`, CO `in the cutoff (CO)`,
HJ `in the hijack (HJ)`, LJ `in the lojack (LJ)`, MP `in a middle seat (MP)`, UTG `in an early seat (UTG)`,
UTG+1 `in an early seat (UTG+1)` (A-6).
Rank names (one/many): 2 two/twos, 3 three/threes, 4 four/fours, 5 five/fives, 6 six/sixes, 7 seven/sevens,
8 eight/eights, 9 nine/nines, T ten/tens, J jack/jacks, Q queen/queens, K king/kings, A ace/aces.
Hand names: pair → `a pair of <many>`; else `<one high>-<one low> suited|offsuit`.

### Rules and algorithms
- `explainPostflop(rec, threshold)`: key = `rec.ruleId`, except `pot-odds-fold` with `impliedRequiredEquityPct !== null`
  → `pot-odds-fold-implied`; fill with the values above (missing `impliedRequired` only in templates that don't use it).
- `explainPreflop(rec)`: sentence 1 = `PREFLOP_CONTEXT[rec.situation]`; sentence 2 = `PREFLOP_SENTENCES[k]` where
  k = `'call-capped'` if `rec.cell.action === 'raise' && rec.action === 'call'`, else `rec.action`; sentence 3 (optional)
  = `alternative` if `rec.alternative !== null`, else `borderline` if `rec.borderline`, else none. Join with one space.
- Worked examples (pinned in SPEC-06):
  - Preflop 6-max UTG unopened AA raise: `No one has entered the pot yet and you sit in an early seat (UTG), so position, where you sit relative to the button, which sets how many players act after you, decides how many hands are worth playing. Raise with a pair of aces: raising takes the initiative, being the last player to bet or raise, so the others must react to you.`
  - Implied-odds call (TASK-7.9 AC#1: 20.5 / 22.2 / 18.2, 9 outs): `You have a draw with 9 outs, the unseen cards that would complete your draw, and your equity, your share of the pot if the hand were played out to the end, is 20.5%. Pot odds, the cost of a call as a share of the pot after you call, ask for 22.2%, more than you have. Implied odds, the price of a call once you count the bets you expect to win if you hit, ask only for 18.2%, so calling earns chips over time.`
  - Value bet (TASK-7.8 AC#2: 78.9 / 72.8, bet): `Your equity, your share of the pot if the hand were played out to the end, is 78.9% against all their hands and 72.8% against the hands that would call a bet. That is above 50.0%, so betting is a value bet, a bet that worse hands will call. Checking would be free, with 0.0% equity required, but betting wins more.`
- Oracle used by tests (A-2): sentences = `text.split(/(?<=[.!?])\s+/)`; every sentence ends in `.`, `!` or `?`;
  a concept is named in a sentence iff `new RegExp('\\b(' + terms.join('|') + ')\\b', 'i')` matches.

### Locked-test edits (Q-3; each keeps every assertion)
| File (owner) | What changes | Assertion count |
|---|---|---|
| `tests/advice/postflop.acceptance.test.ts` (TASK-7.3) AC#1 | `toStrictEqual` object gains `explanation: expect.any(String)` (A-4). | unchanged |
| `tests/advice/value-bet.acceptance.test.ts` (TASK-7.8) AC#9 | Expected key list adds `'explanation'`. | unchanged |
No other test pins the recommendation's key set (grep of `toStrictEqual`/`Object.keys` over `tests/`); e2e and visual
tests can't see the field. **Visual workflow impact: none** (no snapshot changes).

### Error handling and configuration
- `fillTemplate` throws `Error('Unknown template placeholder {<name>}')` for an unknown key or concept id (authoring
  error; unit-tested; never reached with shipped data). No new options or runtime configuration.

## 6. Behaviour specification

### SPEC-01: Sample explanations are at most three sentences, and the sample covers every rule and situation
- Verifies: AC#1
- Behaviour: Given the A-3 sample of 10,000 playtest decision points, When each is advised, Then every
  `explanation` is a non-empty string of 1–3 sentences each ending in `.`, `!` or `?`; the sample's postflop
  `ruleId`s equal the set `POSTFLOP_RULE_IDS` and its preflop `${referenceSize} ${situation}` pairs equal the set of
  pairs in `APPLICABLE_SPOTS` (18).
- Verification: acceptance `tests/advice/explanations.acceptance.test.ts::AC#1 every explanation in a 10,000-decision playtest sample has at most three sentences` (if D-6 splits: the same assertions on the first 2,000 decisions every push, and on 10,000 under `TLH_SLOW_TESTS=1`)

### SPEC-02: Every explanation names a concept
- Verifies: AC#2
- Behaviour: Given the same sample, When concept names are matched (A-2) using `CONCEPTS[*].terms`, Then each
  explanation names at least one concept; `CONCEPTS` has the 10 names of REQ-037.2 in order.
- Verification: acceptance `tests/advice/explanations.acceptance.test.ts::AC#2 every explanation names a concept from the list`

### SPEC-03: A concept is defined where it is first named
- Verifies: AC#3
- Behaviour: Given the same sample, When each concept named in an explanation is located, Then the first sentence
  that names it contains that concept's `definition` verbatim.
- Verification: acceptance `tests/advice/explanations.acceptance.test.ts::AC#3 the first sentence naming a concept contains its definition`

### SPEC-04: Postflop explanations quote the returned numbers
- Verifies: AC#4
- Behaviour: Given every postflop recommendation in the sample, Then its explanation contains
  `formatPct(equityPct)` and `formatPct(requiredEquityPct)` (e.g. `16.7%`); value-bet/check-free/value-raise also contain
  `formatPct(equityVsCallingRangePct)` and `50.0%`; implied-odds-call also contains `formatPct(impliedRequiredEquityPct)`
  and `${outs.length} outs`. Preflop explanations contain no `%`.
- Verification: acceptance `tests/advice/explanations.acceptance.test.ts::AC#4 postflop explanations quote the equity and required equity the advice returns`

### SPEC-05: Identical inputs give identical text
- Verifies: AC#5
- Behaviour: Given the first 500 sample views, When `recommend` runs again on a `structuredClone` of the view with the
  same options, Then `explanation` is identical (`toBe`) and the whole recommendation is deep-equal.
- Verification: acceptance `tests/advice/explanations.acceptance.test.ts::AC#5 the same decision always gets the same explanation`

### SPEC-06: Exact copy for every template variant
- Verifies: DoD#1, DoD#2, DoD#10
- Behaviour: `explainPostflop` on hand-built recommendations gives the exact §5 text for each of the 7 postflop
  templates (incl. the three worked examples and `{aggressive}` = raise for a value-bet raise); `explainPreflop` gives
  the exact text for each of the 6 situations and for the raise, call, call-capped (chart raise → call), fold, check,
  alternative and borderline-only sentences; a cell with neither gives 2 sentences.
- Verification: unit `tests/advice/explain.test.ts::explanation copy`

### SPEC-07: Authored data hygiene
- Verifies: DoD#1, DoD#10
- Behaviour: `CONCEPTS` ids unique; each definition non-empty, lower-case start, no `.`/`!`/`?`, and matches no term of
  another concept; every template uses only known placeholders and every `{def:id}` exists; `SEAT_NAMES` covers every
  `Position`; no template or name contains another concept's term outside a sentence that also holds its definition
  (checked by filling each template with sample values and applying the SPEC-03 oracle).
- Verification: unit `tests/advice/explain.test.ts::authored explanation data`

### SPEC-08: Helpers
- Verifies: DoD#2
- Behaviour: `formatPct(16.7)` = `16.7%`, `formatPct(0)` = `0.0%`, `formatPct(50)` = `50.0%`; `handClassName`:
  `AA` → `a pair of aces`, `66` → `a pair of sixes`, `AKs` → `ace-king suited`, `T9o` → `ten-nine offsuit`,
  `72o` → `seven-two offsuit`; `fillTemplate('{nope}', {})` and `fillTemplate('{def:nope}', {})` throw with the §5 message.
- Verification: unit `tests/advice/explain.test.ts::explanation helpers`

### SPEC-09: Playtest unchanged
- Verifies: DoD#7
- Behaviour: When `npm run -s playtest -- --hands 10000 --seed 42` runs, Then `Invariant violations: 0` and stdout
  SHA-256 is `14d746f736d6afd3968e7ae7e833814d95dab94378c80c11dd59b1fd6ea72e48` (unchanged: bot actions don't change).
- Verification: command `bash -c 'npm run -s playtest -- --hands 10000 --seed 42 | tee /dev/stderr | shasum -a 256'`

### SPEC-10: Repo checks, coverage, boundaries, locked re-pins
- Verifies: DoD#3, DoD#5, DoD#6, DoD#9
- Behaviour: lint, typecheck and `npm test` pass with zero errors, including the two re-pinned locked tests (§5) and
  the locked TASK-7.3 AC#5 rules/doc consistency check; coverage thresholds hold; `src/advice` imports no UI/browser
  code; no network code.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-11: Documentation and originality
- Verifies: DoD#1, DoD#10, DoD#12
- Behaviour: `docs/advice/explanations.md` lists the 10 concepts with their definitions, says which numbers each
  postflop rule quotes (D-3), that preflop explanations come from the chart situation and action, that the
  explanation excludes short-stack notes and approximate labels, and that all text was written for this project
  (REQ-061.2). Story doc published to Backlog.md by the doit docs step.
- Verification: manual `docs/advice/explanations.md` read against this list; `backlog doc list --plain` shows the story doc

### SPEC-12: N/A items and CI
- Verifies: DoD#4, DoD#8, DoD#11, DoD#13
- Behaviour: DoD#4 N/A (golden-spot suite arrives with TASK-7.11/7.14); DoD#8/#13 N/A (no screen or dialog changes);
  CI green on `doit/TASK-7.10`.
- Verification: manual `gh run list --branch doit/TASK-7.10 --limit 1` shows success

## 7. Edge cases
- Chart raise made legal as call (capped) → `call-capped` sentence; nothing owed → `check` (SPEC-06).
- Cell with alternative, borderline-only, or neither → 3, 3, 2 sentences (SPEC-06).
- `value-bet` whose legal aggressive move is a raise (short all-in, `src/advice/postflop.ts:152-154`) → "raise"/"raising"
  (SPEC-06).
- `pot-odds-fold` with and without an implied price (SPEC-06, SPEC-04).
- Calling-range equity fallback equal to `equityPct` → both numbers printed the same (harmless; SPEC-04 still holds).
- Limpers spot read from a later position (`chartSpotOf`, `src/advice/preflop.ts:93-105`) → seat name of the spot
  actually read (`rec.position`).
- Heads-up, 6-max and full-ring situations all reached in the sample (SPEC-01).
- Concurrency, persistence, permissions, invalid input: N/A (pure function of an already-validated recommendation).

## 8. Security considerations
N/A: pure in-memory string templating from authored constants and engine numbers; no untrusted input (templates are
not user-editable), no HTML (consumers render text, not markup), no dependencies, no randomness, no network, nothing
logged.

## 9. Non-functional
- Every-push cost: the new acceptance file builds the sample once (`beforeAll`, ~5 s for 10,000 on the dev Mac without
  coverage); give the hook and tests a 120 s timeout. No speed assertion. Builder records the file's local wall time
  (`npx vitest run tests/advice/explanations.acceptance.test.ts`) in the build log; > 8 s → the D-6 split (2,000
  every push, 10,000 under `TLH_SLOW_TESTS=1` in `npm run test:slow`), with full rule/situation coverage in both.
- Per-decision cost of explaining: a handful of string replaces; the default 10,000-hand playtest stays ≤ 15 s locally.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run -s playtest -- --hands 10000 --seed 42`
- New tests: `tests/advice/explanations.acceptance.test.ts` → SPEC-01..05; `tests/advice/explain.test.ts` →
  SPEC-06..08. The acceptance file copies nothing from locked files; it imports `playHand`, `handReplayCode`,
  `lineUpPolicyFactory`, `BOT_EQUITY`, `recommend`, `CONCEPTS`, `formatPct`, `POSTFLOP_RULE_IDS`, `APPLICABLE_SPOTS`.
- Judge scenario: run `npx vitest run tests/advice/explanations.acceptance.test.ts tests/advice/explain.test.ts`;
  print a few explanations (e.g. `recommend` on the TASK-7.9 AC#1 view) and read them as a learner would; run the
  playtest and compare its SHA with SPEC-09.

## 11. Open questions
-
-
-
-

## 12. Clarifications log
See `doit/TASK-7.10/qa.md`.
