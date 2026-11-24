# Spec: TASK-10.5 — See my postflop leaks with evidence and a one-sentence fix

Status: READY (approved 2026-11-24)
Task: TASK-10.5 · Parent/epic: TASK-10 · Requirements: REQ-044 (044.5, 044.9), REQ-047 (047.1, .2, .4, .5, .8), REQ-061 (061.2) · Dream: limit-holdem-trainer

## 1. Summary
The Session Report gains a "Biggest leaks this session" section. Each of the user's postflop decisions falls
in one of 15 categories: street (flop, turn, river) × facing a bet (fold, call, raise) or not facing a bet
(check, bet). A category is a leak when it has ≥ 8 unhinted decisions and ≥ 40% of them were graded Minor or
Major. The per-category unhinted counts are worked out once, when the session ends, from the stored decision
records inside the same transaction that writes the report (the TASK-10.3 `style` and TASK-10.4 `errors`
pattern), and are saved in the write-once report. Each leak is shown with its authored title, the evidence
"<errors> of <decisions> <evidence name> graded as errors" and a one-sentence fix. The 15 categories and their
original text are kept as validated data, so TASK-10.6 only adds the preflop entries.

## 2. Scope
- In scope:
  - `src/stats/leak-categories.json` (15 postflop entries: id, street, facingBet, action, title, evidenceName,
    fix, justification) and `src/stats/leaks.ts` (loader and validation, classification, counting, the leak
    rule, the evidence text).
  - `src/table/session-report.ts`: optional `leakCounts` on `SessionReport`, computed in `sessionReport`,
    validated in `parseSessionReport`; optional `street` / `action` on `ReportDecision`.
  - `src/ui/report/ReportScreen.tsx` + `src/ui/styles.css`: the leaks section.
  - Tests (acceptance, unit, one Playwright flow with axe) and docs (`docs/stats/leaks.md`,
    `docs/storage/reports.md`).
- Not doing:
  - Preflop categories (REQ-047.6/.7, TASK-10.6). Preflop decisions are not counted in any category.
  - Ranking leaks by Major count and the limit of 3 (REQ-047.3, TASK-10.8). This story lists every leak in
    category data order (A-3).
  - Hint usage (TASK-10.7); Statistics (TASK-11.x); Home snapshot (TASK-2.16).
  - Back-filling `leakCounts` into reports stored without it (A-4); no DB version change.
  - Any change to `src/storage/hand-store.ts`, the advice engine, grading, hand records or the hint.
  - Re-grading or re-running the advice engine anywhere.
  - Editing any hook-locked test (D-3: none needs editing).
- Scope budget: files=12, lines=950

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | "Facing a bet" is read from the user's action type: fold, call and raise are facing a bet; check and bet are not. A call on a capped street is type `call` and so is a facing-a-bet call. | yes | Postflop `legalActions` offers fold/call/raise only when the seat owes chips and check/bet only when nothing has been bet (`src/engine/hand.ts:358-367`); a capped street just drops `raise` from the list (`:353-361`). The stored decision has `street` and `action` (`src/table/hand-record.ts:52-55`) but no "owed" field. The only mismatch is the rare postflop spot where nothing is owed but a short all-in left `currentBet > 0` (`:362-364`); there a check counts as "not facing" and a raise as "facing a bet raise". | Re-derive the owed amount by replaying `actions` |
| A-2 | `ReportDecision` gains optional `street?` and `action?: { type }`. A decision without them (hand-built test data only) is skipped by the leak count; it is still counted in `errors`. | yes | Stored `HandRecordDecision`s always have both. The locked TASK-10.4 test builds `ReportDecision`s as `{ grade, hinted }` only (`tests/ui/report-errors.acceptance.test.tsx:37`); required fields would break its typecheck. | Required fields + edit the locked test |
| A-3 | When several categories are leaks, all are listed, in category data order (flop, turn, river; fold, call, raise, check, bet). | yes | Ranking and the cap of 3 belong to TASK-10.8 (task description). Data order is deterministic. | Order by error rate now |
| A-4 | A report stored before this story has no `leakCounts`; the screen shows no leaks section for it (not the "No leaks found" sentence, which would claim something not checked). | yes | Write-once reports (REQ-052.5) can't be back-filled; it also keeps every locked render of hand-built reports unchanged (§4 D-3). | Show the "No leaks found" sentence for old reports |
| A-5 | `leakCounts` is present iff `errors` is present (≥ 1 hand and every hand carries `decisions`, TASK-10.4 A-4); it is `[]` when no postflop decision was unhinted. | yes | Same presence rule as `errors` (`src/table/session-report.ts:163`); keeps the locked TASK-10.3 assertion `{ ...report, style: undefined }` equal to a hand-less report (`tests/table/session-report-style.acceptance.test.ts:91`). | Always present |
| A-6 | Section markup and place: `<section class="report-leaks" aria-labelledby="report-leaks-title">` with `<h2 id="report-leaks-title">Biggest leaks this session</h2>`, after the style section and before Back to Home; leaks as `<ul class="report-leak-list">` of `<li class="report-leak" data-category="<id>">` holding title (`<strong class="report-leak-title">`), evidence and fix (`<span class="report-leak-evidence">`, `<span class="report-leak-fix">`, each on its own line); no leaks → `<p class="report-leaks-none">` with the exact sentence and no list. | yes | Storyboard shows the section after the style section with title / evidence / fix lines (`dreams/limit-holdem-trainer/storyboards/Report.dc.html:49-56`); same section pattern as `StyleSection` (`src/ui/report/ReportScreen.tsx:13-38`). | `<dl>` per leak |
| A-7 | "Exactly one sentence" is checked as: trimmed, starts with an upper-case letter, ends with `.`, and contains no other `.`, `!` or `?`. Titles: trimmed, no final `.`. Evidence names: trimmed, lower case. | yes | Matches the healthy-range justification check ("one trimmed sentence ending in `.`", `docs/stats/healthy-ranges.md:35`), made strict enough to reject two sentences. | Count sentence-ending punctuation only |
| A-8 | The category text lives in `src/stats/leak-categories.json` (`format: "tlh-leak-categories"`, `version: 1`) with a `justification` per entry, validated at module load like `healthy-ranges.json`. Justifications are not shown on the report. | yes | Task note: "Keep the category set as data"; DoD#10 asks every strategy item to carry its justification; follows `src/stats/healthy-ranges.json` + `healthy-ranges.ts`. | TypeScript constant |

## 3. Current system
- Report model: `SessionReport` (`src/table/session-report.ts:29-50`) with optional `style` (TASK-10.3) and
  `errors` (TASK-10.4); `ReportDecision = { grade: { grade }, hinted }` (`:52-55`); `ReportHand` with optional
  `decisions` (`:58-61`); `sessionReport` adds `style` when hands is non-empty and `errors` when every hand has
  `decisions` (`:127-172`); `parseSessionReport` (`:220-250`) with `object`/`whole` helpers (`:177-185`) and
  `parseErrors` (`:212-216`).
- Ending: `ended` in `src/storage/hand-store.ts` already reads the session's hand records in the end transaction
  and calls `sessionReport(session, endedAt, records)` (TASK-10.3 D-1; `docs/storage/reports.md`). So
  `leakCounts` computed inside `sessionReport` needs no storage change.
- Decision records: `HandRecordDecision` has `street: 'preflop' | 'flop' | 'turn' | 'river'`, `action: Action`
  (type `'fold' | 'check' | 'call' | 'bet' | 'raise'`, `src/engine/hand.ts:50-52`), `grade.grade`
  (`'correct' | 'minor' | 'major'`, `src/advice/grade.ts:10`) and `hinted` (`src/table/hand-record.ts:52-71`).
  A forced fold after Leave table mid-hand has no `decisions` entry (`:99-101,226-231`), so it is never
  classified (REQ-004.8).
- Hinted rule: REQ-047.2/.8 and the task: hinted decisions are ignored for both thresholds and for the evidence.
- Screen: `src/ui/report/ReportScreen.tsx:42-90` (header, cash `<dl>`, rates `<dl>`, optional style
  `<section>`, one button); no effects, view computed during render. CSS `src/ui/styles.css:118-195`.
- Data-file pattern: `src/stats/healthy-ranges.json` (`format`, `version`, entries with `justification`) loaded
  last with `import … with { type: 'json' }` and validated by `exact`/`invalid` helpers
  (`src/stats/healthy-ranges.ts:1-60`).
- Tests: `npm test` = `vitest run --coverage`; acceptance files `*.acceptance.test.*`; e2e `playwright test`
  (Chromium + WebKit) with `axeWithPausedClock` (`e2e/support/paused-clock`).
- The known bot over-calling issue (TASK-7.32) changes which spots the user meets but not how the user's own
  decisions are classified or counted; all worked examples below use synthetic decisions.
- Existing code to reuse:
  - `src/stats/healthy-ranges.ts:46-60` → `invalid` / `exact` validation pattern for the JSON loader.
  - `src/table/session-report.ts:177-185` → `object`, `whole` for `leakCounts` validation.
  - `src/table/hand-record.ts` → `isWhole` (already imported by session-report).
  - `tests/ui/report-errors.acceptance.test.tsx:22-78` → `session(n)`, `hand(decisions)`, `text`, `render`
    helper pattern (copy; add `street` / `action` to decisions).
  - `e2e/report-errors.spec.ts:17-66` → paused-clock flow, `storedReports` / `storedRecords` / `storedSessions`,
    axe and same-origin request check.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Persisted format: the report gains optional `leakCounts: { category, decisions, errors, major }[]` — for every postflop category with ≥ 1 unhinted decision, in category data order, the count of unhinted decisions, of those graded Minor or Major, and of those graded Major. Written once at session end. Leak status, evidence and text are derived at display from these counts and the current category data. No DB version change. | (b) store only the categories that are leaks; (c) store the rendered title/evidence/fix text; (d) recompute from hand records on every open | Same pattern as TASK-10.3/10.4 D-1. Counts are the minimum that reproduce every shown number; `major` lets TASK-10.8 rank without another format change; TASK-10.6 only adds preflop category ids. | yes | user (Q-1) |
| D-2 | The 15 titles, evidence names and fixes in §5 "Category content". | Shorter titles; fixes quoting numbers | Original text written for this project (REQ-061.2), each fix one sentence, consistent with the advice rules the grades come from (`docs/advice/postflop-rules.md:64-147`). | yes | user (Q-2) |
| D-3 | No locked test needs editing. Checked (owner): `tests/storage/session-end.acceptance.test.ts:70` [TASK-10.1], `e2e/session-report.spec.ts:115` [TASK-10.1], `e2e/report-errors.spec.ts:59` [TASK-10.4], `e2e/report-style.spec.ts:62` [TASK-10.3] compare stored values with `sessionReport(…, records)` of the same records → both sides gain the same `leakCounts`. `tests/ui/report-screen.acceptance.test.tsx:43-81` [TASK-10.1], `tests/ui/report-style.acceptance.test.tsx:112-132` [TASK-10.3] and `tests/ui/report-errors.acceptance.test.tsx:152-185` [TASK-10.4] render hand-built reports without `leakCounts` → no leaks section, no new `<h2`/`<section`/`<dl`. `tests/ui/report-errors.acceptance.test.tsx:104-150` [TASK-10.4] renders `sessionReport` output whose decisions lack `street` (→ `leakCounts: []`, a "No leaks found" section after the style section) and asserts only the rate tiles and `errors`. `tests/table/session-report-style.acceptance.test.ts:88-139` [TASK-10.3] uses hands without `decisions` → no `leakCounts` (A-5). `tests/table/session-report.acceptance.test.ts` [TASK-10.1] and `tests/storage/end-paused.acceptance.test.ts:105-160` [TASK-2.7] use no hands. `e2e/report-style.spec.ts:47` scopes its `<h2>` lookup to the style section. `ReportDecision` stays assignable from `{ grade, hinted }` (A-2). | Make fields required and edit 1 locked test | Avoids locked edits. | no | n/a |
| D-4 | Category content and rules live in `src/stats/` (headless; imports only `../advice/grade` types and the JSON). `session-report.ts` imports from it. | Put them in `src/table/session-report.ts` | Matches `healthy-ranges`; keeps the report file small; TASK-10.6 extends the same module. | no | n/a |

## 5. Design

### Files to create / modify
- `src/stats/leak-categories.json` — new: the 15 postflop categories with text and justification.
- `src/stats/leaks.ts` — new: types, `parseLeakCategories`, `LEAK_CATEGORIES`, `decisionCategory`,
  `categoryCounts`, `isLeak`, `leakEvidence`, `sessionLeaks`.
- `src/table/session-report.ts` — modify: optional `street`/`action` on `ReportDecision`, `leakCounts?` on
  `SessionReport`, counting in `sessionReport`, `parseLeakCounts`.
- `src/ui/report/ReportScreen.tsx` — modify: `LeaksSection`.
- `src/ui/styles.css` — modify: `.report-leaks` rules (same card look as `.report-style`).
- `tests/stats/leaks.acceptance.test.ts` — new (SPEC-01..06).
- `tests/stats/leaks.test.ts` — new (SPEC-09, SPEC-10).
- `tests/table/session-report-leaks.test.ts` — new (SPEC-11, SPEC-12).
- `tests/ui/report-leaks.acceptance.test.tsx` — new (SPEC-07, SPEC-08).
- `e2e/report-leaks.spec.ts` — new (SPEC-13).
- `docs/stats/leaks.md` — new: categories, rule, evidence format, content table with justifications.
- `docs/storage/reports.md` — modify: `leakCounts` field, rule, legacy reports, validation, tests list.

### Components, interfaces and data
`src/stats/leaks.ts`:
```ts
export type LeakStreet = 'flop' | 'turn' | 'river';
export type FacingAction = 'fold' | 'call' | 'raise';
export type OpenAction = 'check' | 'bet';
export type LeakCategoryId =
  | `${LeakStreet}-facing-a-bet-${FacingAction}`
  | `${LeakStreet}-not-facing-a-bet-${OpenAction}`;
export interface LeakCategory {
  readonly id: LeakCategoryId;
  readonly street: LeakStreet;
  readonly facingBet: boolean;
  readonly action: FacingAction | OpenAction;
  readonly title: string;        // 'Calling too often on the turn'
  readonly evidenceName: string; // 'turn calls'
  readonly fix: string;          // exactly one sentence (A-7)
  readonly justification: string;
}
/** RangeError('Invalid leak categories: <path>'), e.g. 'categories[3].fix'. */
export function parseLeakCategories(value: unknown): readonly LeakCategory[];
/** The validated data file, in file order. */
export const LEAK_CATEGORIES: readonly LeakCategory[];
/** The category of a decision; null for preflop (TASK-10.6) or a category not in the data. */
export function decisionCategory(street: 'preflop' | LeakStreet, action: ActionType): LeakCategoryId | null;
export interface CategoryDecision {
  readonly street: 'preflop' | LeakStreet;
  readonly action: { readonly type: ActionType };
  readonly grade: { readonly grade: Grade };
  readonly hinted: boolean;
}
export interface CategoryCount {
  readonly category: LeakCategoryId;
  readonly decisions: number; // unhinted, ≥ 1
  readonly errors: number;    // unhinted Minor + Major, ≤ decisions
  readonly major: number;     // unhinted Major, ≤ errors
}
/** Unhinted counts per category with ≥ 1 unhinted decision, in LEAK_CATEGORIES order. */
export function categoryCounts(decisions: Iterable<CategoryDecision>): readonly CategoryCount[];
/** decisions ≥ 8 and 5 × errors ≥ 2 × decisions (integer arithmetic). */
export function isLeak(count: CategoryCount): boolean;
/** '4 of 10 turn calls graded as errors'. */
export function leakEvidence(count: CategoryCount): string;
export interface Leak {
  readonly category: LeakCategoryId;
  readonly title: string;
  readonly evidence: string;
  readonly fix: string;
}
/** The leaks among `counts`, in LEAK_CATEGORIES order (A-3); counts whose category is unknown are ignored. */
export function sessionLeaks(counts: readonly CategoryCount[]): readonly Leak[];
```
JSON file:
```json
{ "format": "tlh-leak-categories", "version": 1,
  "categories": [ { "id": "flop-facing-a-bet-fold", "street": "flop", "facingBet": true, "action": "fold",
                    "title": "…", "evidenceName": "flop folds", "fix": "….", "justification": "…." }, … ] }
```
Validation (`parseLeakCategories`): top level exact keys `format` (= `tlh-leak-categories`), `version` (= 1),
`categories` (array); each entry exact keys as above; `street` ∈ flop/turn/river; `facingBet` boolean;
`action` ∈ fold/call/raise when `facingBet`, else check/bet; `id` equals
`` `${street}-${facingBet ? 'facing-a-bet' : 'not-facing-a-bet'}-${action}` `` and is unique; `title`,
`evidenceName`, `fix`, `justification` follow A-7 (`justification` one or more trimmed sentences ending in `.`).
Failure → `RangeError('Invalid leak categories: <path>')` naming the first bad path.

`src/table/session-report.ts`:
```ts
export interface ReportDecision {
  readonly grade: { readonly grade: Grade };
  readonly hinted: boolean;
  /** Absent only in hand-built test data; such a decision is not classified (A-2). */
  readonly street?: HandRecordDecision['street'];
  readonly action?: { readonly type: ActionType };
}
export interface SessionReport { …existing…;
  /** Unhinted counts per postflop category; absent iff `errors` is absent (A-4, A-5). */
  readonly leakCounts?: readonly CategoryCount[] }
```
`sessionReport`: in the branch that builds `errors`, also
`leakCounts = categoryCounts(all decisions of all hands that have both street and action)`. Returned key order:
existing keys, `style`, `errors`, `leakCounts`.

`parseSessionReport`: `if (report.leakCounts !== undefined) parseLeakCounts(report.leakCounts)`: an array
(else `leakCounts`), each element an object (`leakCounts[i]`) whose `category` is the id of a
`LEAK_CATEGORIES` entry later in data order than the previous element's (`leakCounts[i].category`),
`decisions` whole ≥ 1 (`….decisions`), `errors` whole 0..decisions (`….errors`), `major` whole 0..errors
(`….major`). Failure → `RangeError('Invalid session report: <path>')`.

`ReportScreen`, after the style section and before the button, only when `report.leakCounts !== undefined`:
```html
<section class="report-leaks" aria-labelledby="report-leaks-title">
  <h2 id="report-leaks-title">Biggest leaks this session</h2>
  <ul class="report-leak-list">
    <li class="report-leak" data-category="turn-facing-a-bet-call">
      <strong class="report-leak-title">Calling too often on the turn</strong>
      <span class="report-leak-evidence">4 of 10 turn calls graded as errors</span>
      <span class="report-leak-fix">The turn bet is twice …</span>
    </li>
  </ul>
</section>
```
With no leaks the `<ul>` is replaced by
`<p class="report-leaks-none">No leaks found this session (a leak needs 8+ spots with 40%+ errors).</p>`.
No hooks or effects are added; `sessionLeaks(report.leakCounts)` is computed during render.

### Rules and algorithms
- Classification (A-1): `decisionCategory(street, type)` = null when `street === 'preflop'`; otherwise
  `facing = type ∈ {fold, call, raise}` and the id `<street>-<facing ? 'facing-a-bet' : 'not-facing-a-bet'>-<type>`
  if that id is in `LEAK_CATEGORIES`.
- Counting: only decisions with `hinted === false` and a non-null category; `decisions += 1`;
  `errors += 1` when grade is `minor` or `major`; `major += 1` when `major`.
- Leak rule: `decisions >= 8 && 5 * errors >= 2 * decisions`.
- Evidence: `` `${errors} of ${decisions} ${evidenceName} graded as errors` `` (REQ-047.4).
- Worked examples:
  - AC#1: (turn, call) → `turn-facing-a-bet-call`; (river, call) on a capped river (type `call`) →
    `river-facing-a-bet-call`; (river, fold) → `river-facing-a-bet-fold`; (flop, bet) →
    `flop-not-facing-a-bet-bet`; (preflop, raise) → null.
  - AC#3: turn calls 10 unhinted, 4 errors → 8 ≥ 8 is true and 20 ≥ 20 → leak; evidence
    `4 of 10 turn calls graded as errors`.
  - AC#4: river raises 7 unhinted, 7 Major → 7 < 8 → not a leak.
  - AC#5: flop bets 10 unhinted, 3 errors → 15 < 20 → not a leak.
  - AC#6a: 5 hinted Major + 7 unhinted Major → counted decisions 7 → not a leak.
  - AC#6b: 3 hinted Correct + 8 unhinted with 4 errors → 20 ≥ 16 → leak; evidence
    `4 of 8 <evidenceName> graded as errors`.
  - Boundary: 8 decisions with 3 errors (37.5%) → 15 < 16 → not a leak; 20 with 8 (40%) → leak.

### Category content (D-2, approved Q-2)
| id | title | evidence name | fix | justification |
|---|---|---|---|---|
| flop-facing-a-bet-fold | Folding too easily to flop bets | flop folds | Before you fold to a flop bet, count your outs and compare your chance to win with the price of the call, because one small bet often buys a cheap look at the turn. | A flop bet is a small bet into a pot already holding several bets, so the price is low and pairs and draws often have the equity to call (pot-odds-call, implied-odds-call). |
| flop-facing-a-bet-call | Calling flop bets without the odds | flop calls | Call a flop bet only when your chance to win, counting your outs, beats the price of the call, and raise instead when you are likely ahead. | A call is graded against the pot-odds price and against the value-raise rule, so calls go wrong both when the hand is too weak and when it is strong enough to raise. |
| flop-facing-a-bet-raise | Raising the flop with hands that are not ahead | flop raises | Raise a flop bet only when your hand beats most of the hands that will call the raise, and just call with draws and medium hands that need to improve. | The value-raise rule asks for better than even equity against the hands that would continue; raising a weaker hand puts more chips in while behind. |
| flop-not-facing-a-bet-check | Checking the flop with hands that should bet | flop checks | When the flop is checked to you and your hand beats most of the hands that would call, bet so that weaker hands pay you now. | The value-bet rule bets when the hero is ahead of the calling range; checking those hands gives up a bet the opponents would have paid. |
| flop-not-facing-a-bet-bet | Betting the flop into better hands | flop bets | Bet the flop only when most of the hands that would call are worse than yours, and check the rest to see the turn for free. | A bet earns only from worse hands that pay it; when the hands that call are mostly better, the check-free rule is the better play. |
| turn-facing-a-bet-fold | Folding too often on the turn | turn folds | Before you fold to a turn bet, compare your chance to win, including your outs, with the price, since the pot has grown enough that many pairs and draws are worth a call. | By the turn the pot holds several small and big bets, so a single big bet is often a fair price for a pair or a strong draw (pot-odds-call, implied-odds-call). |
| turn-facing-a-bet-call | Calling too often on the turn | turn calls | The turn bet is twice the size of a flop bet, so call it only with a made hand that is often best or a draw whose outs pay for the price. | The doubled bet size raises the required equity; calls that were fine on the flop become losing calls on the turn without a real hand or draw. |
| turn-facing-a-bet-raise | Raising the turn without a strong hand | turn raises | Raise a turn bet only with a hand that beats most of the hands that will call, because a raise at the big-bet level costs twice as much when you are behind. | The value-raise rule needs better than even equity against the continuing range, and the cost of being wrong doubles on the turn. |
| turn-not-facing-a-bet-check | Checking the turn with hands that should bet | turn checks | When the turn is checked to you with a hand that beats most of the hands that would call, bet the big bet instead of giving draws a free card. | The value-bet rule bets when ahead of the calling range; a check on the turn also lets drawing hands see the river for nothing. |
| turn-not-facing-a-bet-bet | Betting the turn without enough hand | turn bets | Bet the turn only when your hand is ahead of most of the hands that would call, since a big bet into better hands loses twice what it did on the flop. | A turn bet is a big bet; betting into a calling range that is mostly ahead loses a full big bet each time it is called. |
| river-facing-a-bet-fold | Folding the river when the pot pays you to call | river folds | On the river the pot is usually many times the bet, so call with any hand that wins often enough to cover the price instead of folding it. | With the pot many big bets deep, the required equity for a river call is low, so folding hands that win that often throws away value (pot-odds-call). |
| river-facing-a-bet-call | Calling the river with hands that rarely win | river calls | Call a river bet only when your hand wins at least as often as the price of the call demands, because no more cards can come to help you. | On the river there are no outs left, so the call is right only when current equity meets the pot-odds price (pot-odds-call, pot-odds-fold). |
| river-facing-a-bet-raise | Raising the river with hands that only beat bluffs | river raises | Raise the river only when most of the hands that will call your raise are worse than yours. | On the river a raise is only for value: worse hands fold to it and better hands call or re-raise unless the hero is ahead of the calling range (value-raise). |
| river-not-facing-a-bet-check | Checking the river with hands worth a bet | river checks | When the river is checked to you with a hand that beats most of the hands that would call, bet it, because a check gives up the last chance to be paid. | The value-bet rule bets when ahead of the calling range, and the river is the last chance to collect that bet. |
| river-not-facing-a-bet-bet | Betting the river into better hands | river bets | Bet the river only when most of the hands that would call are worse than yours, and check medium hands that nothing worse will pay. | On the river worse hands fold and better hands call, so a bet with a medium hand gains little and loses a big bet against the hands that pay it. |

### Error handling and configuration
- Bad data file → `parseLeakCategories` throws at module load (`RangeError('Invalid leak categories: …')`); the
  shipped file is checked by SPEC-02/SPEC-09.
- Invalid stored `leakCounts` → `parseSessionReport` throws `RangeError('Invalid session report: leakCounts…')`,
  as for other fields; `getReport` callers already handle that. No configuration.

## 6. Behaviour specification

### SPEC-01: Postflop decisions fall in the right category
- Verifies: AC#1, DoD#2
- Behaviour: Given decision records (turn, call), (river, call) made on a river capped at four bets, (river,
  fold) and (flop, bet), When classified with `decisionCategory(street, action.type)`, Then they give
  `turn-facing-a-bet-call`, `river-facing-a-bet-call`, `river-facing-a-bet-fold` and `flop-not-facing-a-bet-bet`;
  and `categoryCounts` of these four unhinted decisions lists exactly those four categories with 1 decision each.
- Verification: acceptance `tests/stats/leaks.acceptance.test.ts::AC#1 classifies turn call, capped river call, river fold and flop bet`

### SPEC-02: All 15 postflop categories exist with valid text
- Verifies: AC#2, DoD#1, DoD#2, DoD#10
- Behaviour: Given `LEAK_CATEGORIES`, When validated, Then the ids are exactly the 15 combinations of flop/turn/river
  × facing-a-bet fold/call/raise and not-facing-a-bet check/bet, and each entry has a non-empty title, evidence
  name, a fix that is exactly one sentence (A-7) and a non-empty justification; `parseLeakCategories` of the
  shipped JSON returns them without throwing.
- Verification: acceptance `tests/stats/leaks.acceptance.test.ts::AC#2 all 15 postflop categories have a title, evidence name and a one-sentence fix`

### SPEC-03: 4 of 10 turn calls is a leak
- Verifies: AC#3, DoD#2
- Behaviour: Given a 6-player cash session whose `ReportHand`s hold 10 unhinted (turn, call) decisions, 4 graded
  Minor or Major (2 + 2) and 6 Correct, When `sessionReport` builds the report, Then `leakCounts` contains
  `{ category: 'turn-facing-a-bet-call', decisions: 10, errors: 4, major: 2 }` and `sessionLeaks(report.leakCounts)`
  contains the turn calls leak with evidence `4 of 10 turn calls graded as errors`.
- Verification: acceptance `tests/stats/leaks.acceptance.test.ts::AC#3 4 of 10 turn calls graded as errors is a leak`

### SPEC-04: 7 river raises is not a leak
- Verifies: AC#4, DoD#2
- Behaviour: Given 7 unhinted (river, raise) decisions all graded Major, When the report is built, Then no leak has
  category `river-facing-a-bet-raise` (its count is `{ decisions: 7, errors: 7, major: 7 }`).
- Verification: acceptance `tests/stats/leaks.acceptance.test.ts::AC#4 7 river raises all Major is not a leak`

### SPEC-05: 3 of 10 flop bets is not a leak
- Verifies: AC#5, DoD#2
- Behaviour: Given 10 unhinted (flop, bet) decisions of which 3 are graded errors, When the report is built,
  Then no leak has category `flop-not-facing-a-bet-bet`.
- Verification: acceptance `tests/stats/leaks.acceptance.test.ts::AC#5 3 of 10 flop bets is not a leak`

### SPEC-06: Hinted decisions are ignored for both thresholds
- Verifies: AC#6, DoD#2
- Behaviour: Given a category (river calls) with 5 hinted Major and 7 unhinted Major decisions, When the report is
  built, Then it is not a leak and its count is `{ decisions: 7, errors: 7, major: 7 }`; Given 3 hinted Correct
  plus 8 unhinted of which 4 are errors, Then it is a leak with evidence `4 of 8 river calls graded as errors`.
- Verification: acceptance `tests/stats/leaks.acceptance.test.ts::AC#6 hinted decisions count toward neither threshold`

### SPEC-07: One leak is shown with title, evidence and fix
- Verifies: AC#7, DoD#2
- Behaviour: Given a report built by `sessionReport` from hands whose only leak is turn calls (4 of 10), When
  `ReportScreen` renders it, Then the markup contains the section heading `Biggest leaks this session`, exactly one
  `report-leak` item with `data-category="turn-facing-a-bet-call"` whose title, evidence and fix equal the turn
  calls entry of `LEAK_CATEGORIES` and `4 of 10 turn calls graded as errors`, no `report-leaks-none`, the leaks
  section after the style section and before the only `<button`.
- Verification: acceptance `tests/ui/report-leaks.acceptance.test.tsx::AC#7 a session with one leak shows its title, evidence and fix`

### SPEC-08: No leaks message
- Verifies: AC#8, DoD#2
- Behaviour: Given a report whose `leakCounts` meet no threshold (e.g. 7 river raises all Major and 3 of 10 flop
  bets), When rendered, Then the section shows the heading and exactly
  `No leaks found this session (a leak needs 8+ spots with 40%+ errors).` and contains no `report-leak` item;
  given a report with `leakCounts: []` the same sentence shows; given a report without `leakCounts` there is no
  `report-leaks` section (A-4).
- Verification: acceptance `tests/ui/report-leaks.acceptance.test.tsx::AC#8 a session without leaks shows the no-leaks sentence`

### SPEC-09: Category data validation
- Verifies: AC#2, DoD#2
- Behaviour: Given copies of the shipped JSON with one defect each — wrong `format`, wrong `version`, an extra key,
  a duplicate id, an id not matching street/facingBet/action, `facingBet: true` with `action: 'check'`, a street
  `preflop`, a fix of two sentences (`"Fold more. Call less."`), a fix without a final `.`, an empty title —
  When `parseLeakCategories` runs, Then each throws `RangeError` whose message starts with
  `Invalid leak categories:` and names the bad path.
- Verification: unit `tests/stats/leaks.test.ts::parseLeakCategories rejects malformed category data`

### SPEC-10: Counting and threshold details
- Verifies: AC#1, AC#6, DoD#2
- Behaviour: `decisionCategory('preflop', 'raise')` is null and preflop decisions are not counted; Correct decisions
  count only toward `decisions`; Minor counts toward `errors` only, Major toward `errors` and `major`; categories
  without unhinted decisions are absent; output follows data order whatever the input order; `isLeak` is false
  for 8/3 and true for 8/4 and 20/8; `leakEvidence` formats `{decisions: 12, errors: 5}` of flop folds as
  `5 of 12 flop folds graded as errors`; two leaks come out of `sessionLeaks` in data order.
- Verification: unit `tests/stats/leaks.test.ts::counts unhinted postflop decisions per category and applies the thresholds`

### SPEC-11: leakCounts presence in sessionReport
- Verifies: AC#3, DoD#2
- Behaviour: Given `sessionReport` with no hands, `[]`, or any hand without `decisions`, Then the result has no
  `leakCounts` key; given hands that all carry `decisions`, Then `leakCounts` is present (`[]` when the decisions
  lack `street`/`action`, are preflop or are all hinted); a hand with `forcedFold: true` and `decisions: []`
  adds nothing.
- Verification: unit `tests/table/session-report-leaks.test.ts::leakCounts is present exactly when errors is`

### SPEC-12: Stored leakCounts are validated
- Verifies: DoD#2
- Behaviour: Given a valid report with `leakCounts`, When `parseSessionReport` gets a JSON round trip, Then it
  returns an equal value; `leakCounts` = `null` or `{}` → `RangeError('Invalid session report: leakCounts')`;
  an element `null` → `… leakCounts[0]`; unknown category, a repeated category or categories out of data order →
  `… leakCounts[i].category`; `decisions` 0 or `1.5` → `….decisions`; `errors` > decisions → `….errors`;
  `major` > errors → `….major`; a report without `leakCounts` parses unchanged.
- Verification: unit `tests/table/session-report-leaks.test.ts::parseSessionReport validates leakCounts`

### SPEC-13: Browser flow
- Verifies: AC#8, DoD#8, DoD#9
- Behaviour: Given the app with paused clock and replay words `[0x9e3779b9, 1, 2, 3]` (as
  `e2e/report-errors.spec.ts`), When the user starts the default game, plays hand 1 and clicks Leave table, Then
  the region named "Biggest leaks this session" is visible and shows
  `No leaks found this session (a leak needs 8+ spots with 40%+ errors).` (one hand cannot reach 8 decisions in a
  category), the stored report's `leakCounts` is defined and equals
  `sessionReport(ended, new Date(endedAt), records).leakCounts` of the stored records, axe reports no serious or
  critical violations, and every request goes to the app's own origin. Runs in Chromium and WebKit.
- Verification: acceptance `e2e/report-leaks.spec.ts::Leave table shows the leaks section from the stored decisions`

### SPEC-14: Project checks
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#6, DoD#11
- Behaviour: Given the change, When the checks run, Then `npm run lint`, `npm run typecheck`, `npm test` (incl. the
  golden-spot suite and coverage thresholds) and the CI workflow pass; `src/stats/leaks.ts` imports no UI or
  browser-only code.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-15: Documentation and original content
- Verifies: DoD#1, DoD#10, DoD#12
- Behaviour: `docs/stats/leaks.md` lists the 15 categories with title, evidence name, fix and justification, the
  classification and leak rules and the evidence format, and states the text was written for this project;
  `docs/storage/reports.md` documents `leakCounts`; the story doc is published to Backlog.md.
- Verification: manual `docs/stats/leaks.md`, `docs/storage/reports.md` section "leakCounts" and `backlog doc list --plain` entry for TASK-10.5

### SPEC-16: Not-applicable DoD items
- Verifies: DoD#7, DoD#13
- Behaviour: DoD#7 — no engine/bots/advice change, so no playtest run is required. DoD#13 — the offline service
  worker story (E13-S07) is not done and no new screen or dialog is added.
- Verification: manual `git diff --stat main -- src/engine src/bots src/advice` is empty

## 7. Edge cases
- Empty: 0 hands → no report (existing, REQ-044.8). Hands with no postflop or only hinted decisions →
  `leakCounts: []` → "No leaks found" (SPEC-08, SPEC-11).
- Boundary: exactly 8 decisions and exactly 40% (SPEC-03 at 10/4, SPEC-10 at 8/4 and 20/8); 8/3 just below.
- Forced fold after Leave table mid-hand: not in `decisions`, never counted (SPEC-11).
- Capped street call: type `call` → facing-a-bet call (SPEC-01).
- Postflop check or raise with nothing owed after a short all-in: classified by action type (A-1); no test
  beyond SPEC-10's mapping since the record carries no owed amount.
- Several leaks: all listed in data order (A-3, SPEC-10).
- Legacy reports without `leakCounts` (SPEC-08); corrupt stored `leakCounts` (SPEC-12); bad data file (SPEC-09).
- Duplicates / concurrency / interruption: the report is written once in the existing end transaction; unchanged.
- Dependency failure / permissions: N/A (no new dependency, no I/O added).

## 8. Security considerations
- Trust boundary: stored report values read from IndexedDB are untrusted → `parseSessionReport` validates
  `leakCounts` (SPEC-12). Category data is a bundled file validated at load (SPEC-09). All text renders as React
  text (no HTML injection).
- No authn, secrets, network, randomness or new dependencies. N/A.

## 9. Non-functional
- Counting is O(total decisions) at session end; no measurable cost.
- No new test plays sessions; the new Vitest files use synthetic records and run in well under a second each.
  The e2e flow plays one hand, like `e2e/report-errors.spec.ts`. Nothing goes in the slow group.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev` → New game → Start game → play some hands → Leave table → read "Biggest leaks this session"
- New tests (path → SPEC ids):
  - `tests/stats/leaks.acceptance.test.ts` → SPEC-01..06
  - `tests/stats/leaks.test.ts` → SPEC-09, SPEC-10
  - `tests/table/session-report-leaks.test.ts` → SPEC-11, SPEC-12
  - `tests/ui/report-leaks.acceptance.test.tsx` → SPEC-07, SPEC-08
  - `e2e/report-leaks.spec.ts` → SPEC-13 (`npm run e2e`)
- Judge scenario: run the app, play 30–60 hands (open the Hint before a few actions), Leave table; check the leaks
  section either lists leaks whose evidence matches the unhinted postflop decisions in the stored hand records
  (DevTools → IndexedDB `hands`, grouped by street and action) with ≥ 8 decisions and ≥ 40% Minor/Major, or shows
  the exact no-leaks sentence; reload and confirm the stored report is unchanged.

## 11. Open questions
- None. Q-1 (stored `leakCounts`, D-1) and Q-2 (leak text, D-2) answered with the recommended options; see `doit/TASK-10.5/qa.md`.

## 12. Clarifications log
See `doit/TASK-10.5/qa.md`.
