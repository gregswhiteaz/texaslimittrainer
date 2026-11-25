# Spec: TASK-10.6 — See my preflop leaks by position group

Status: READY (approved 2026-11-24)
Task: TASK-10.6 · Parent/epic: TASK-10 · Requirements: REQ-044 (044.5), REQ-047 (047.1, .2, .4, .5, .6, .7, .9), REQ-061 (061.2) · Dream: limit-holdem-trainer

## 1. Summary
TASK-10.5 put 15 postflop leak categories on the Session Report. This story adds the 16 preflop categories:
position group (early, middle, late, blinds) × action (fold, open, call, raise). They use the same data file,
the same validation, the same `leakCounts` record (written once at session end), the same leak rule (≥ 8
unhinted decisions, ≥ 40% Minor/Major) and the same "Biggest leaks this session" section. The position group
is counted back from the button over the seats dealt into the hand. Whether a raise is an `open` or a `raise`
depends on whether anyone raised earlier preflop. A big blind checking its option falls in no category. Each
preflop category gets original authored text: a title, an evidence name and a one-sentence fix.

## 2. Scope
- In scope:
  - `src/stats/leak-categories.json`: 16 preflop entries appended after the 15 postflop entries (same file,
    format and version).
  - `src/stats/leaks.ts`: preflop entry shape and validation, `positionGroup`, `preflopAction`, preflop
    classification in `decisionCategory` / `categoryCounts`, and `handCategoryDecisions`, which pairs each
    preflop decision with its action record.
  - `src/table/session-report.ts`: optional `button` on `ReportHand`. `sessionReport` builds `leakCounts`
    through `handCategoryDecisions`.
  - Tests (acceptance and unit) and docs (`docs/stats/leaks.md`, `docs/storage/reports.md`).
  - Locked-test edit (D-3, approved Q-1): `tests/stats/leaks.acceptance.test.ts` AC#2 is narrowed to the
    postflop entries.
- Not doing:
  - Ranking leaks by Major count and error rate, or limiting the list to 3 (REQ-047.3, TASK-10.8). Leaks stay
    listed in category data order (TASK-10.5 A-3), so preflop leaks come after postflop leaks (A-4).
  - Any change to `src/ui/report/ReportScreen.tsx` or `src/ui/styles.css`. Preflop leaks render through the
    existing section unchanged.
  - Back-filling preflop counts into stored reports. No DB version change.
  - Any change to the engine, bots, advice engine, grading, hand records, hint or `src/storage/*`.
  - Changing postflop classification or postflop text (TASK-10.14 owns the postflop text fixes).
  - Hint usage (TASK-10.7). Statistics screen (TASK-11.x).
  - A new e2e flow. One played hand cannot reach 8 decisions in a category, and the screen markup is unchanged
    (see SPEC-12).
- Scope budget: files=10, lines=950

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | "Someone has raised" means a preflop action record of type `raise` comes before the user's action in `actions`, from any seat, including the user's own earlier raise and a short all-in raise. The blinds are not raises. The user's raise is `raise` if such a record exists, otherwise `open`. | yes | Same test the advice engine uses to tell `unopened`/`limpers` from raised pots (`src/advice/preflop.ts:104-111`: counts preflop records of type `raise`, ignoring blinds). So the leak category agrees with the chart spot the grade came from. | Ignore short all-in raises below a full raise (`fullBetTarget`, `src/engine/hand.ts:323-340`) |
| A-2 | `ReportHand` gains optional `button?: SeatNumber`. A hand without `button` (hand-built test data only) has its preflop decisions skipped by the leak count. Its postflop decisions are classified as before. | yes | Stored `HandRecord` always has `button` (`src/table/hand-record.ts:90`). Locked TASK-10.4/10.5 tests build `ReportHand`s with no `button` and preflop decisions, and expect `leakCounts: []` (`tests/ui/report-leaks.acceptance.test.tsx:133-135`). A required field would break their typecheck. | Required `button` + edit 3 locked files |
| A-3 | A preflop decision is paired with its action record by order: the j-th entry of `decisions` is the user's j-th non-blind action in `actions`. A trailing forced fold has no decision and is ignored. A preflop decision with no paired preflop record of the same type is skipped. | yes | Stored records are validated to have exactly this alignment (`src/table/hand-record.ts:434-454`). The skip rule only affects hand-built test data whose decisions don't match `actions` (e.g. `tests/table/session-report-leaks.test.ts:43-55`). | Store `raisedBefore` on each decision record (changes the hand-record format) |
| A-4 | The 16 preflop entries are appended after the 15 postflop entries, ordered by group (early, middle, late, blinds), then action (fold, open, call, raise). Until TASK-10.8 adds ranking, preflop leaks are listed after postflop leaks. | partly — stored `leakCounts` must follow data order (`src/table/session-report.ts:234-249`). Appending keeps every stored report valid. Reordering later would invalidate stored reports that include preflop counts. | Keeps the postflop entries at the same indices, so existing stored reports and the TASK-10.5 unit-test indices (`tests/stats/leaks.test.ts:48-68`) still hold. TASK-10.8 changes the display order anyway. | Preflop first (street order). Shifts every postflop index and still keeps old reports valid. |
| A-5 | A preflop `check` (only the big blind's option) and a preflop `bet` (never offered: preflop always has a bet to call, `src/engine/hand.ts:294`) fall in no category. Both still count in `errors` (REQ-044.2). | yes | REQ-047.9 / AC#6. The `errors` loop is unchanged (`src/table/session-report.ts:176-182`). | — |
| A-6 | Seat grouping follows REQ-047.6 literally for every table size 2–10, counting over the dealt-in seats in `seats` (empty sit-and-go seats are not in it). With n ≥ 3, the first two seats after the button are blinds, the button and the seat before it are late, the next two seats back are middle, and any other seats are early. With n = 2, the button is late and the other seat is blinds. So a 5-player hand has one middle seat, a 7-player hand one early seat, and a 10-player hand four early seats. | yes | Same clockwise order and blind seats as the engine (`src/engine/hand.ts:259-264`) and `positionOf` (`src/advice/preflop.ts:72-86`). The engine never puts the button on a seat that was not dealt in (`src/engine/hand.ts:166-167`). | — |

## 3. Current system
- Leak module `src/stats/leaks.ts` (TASK-10.5):
  - `LeakCategory` and the validation helpers `exact`, `isTrimmed`, `isOneSentence` and `idOf` (`:12-64`).
  - `parseCategory` and `parseLeakCategories`, which raise `RangeError('Invalid leak categories: <path>')`
    (`:66-100`).
  - `LEAK_CATEGORIES` and `BY_ID` (`:103-105`).
  - `decisionCategory(street, action)`, which returns null for preflop (`:109-116`).
  - `CategoryDecision` and `CategoryCount` (`:118-133`), and `categoryCounts` (`:136-152`).
  - `isLeak` (`:155-157`), `leakEvidence` (`:160-163`) and `sessionLeaks` (`:173-181`).
  - `leakEvidence`, `sessionLeaks` and `parseLeakCounts` look categories up by id or data order, so they work
    for new ids unchanged.
- Data file `src/stats/leak-categories.json`: `{ format: "tlh-leak-categories", version: 1, categories: [15] }`.
- Report: `SessionReport.leakCounts?` (`src/table/session-report.ts:55-56`). `ReportDecision` with optional
  `street`/`action` (`:60-66`). `ReportHand = StatHand & { userSeat, decisions? }` (`:69-72`). `sessionReport`
  builds `leakCounts` from every decision that has `street` and `action` (`:175-188`). `parseLeakCounts` needs
  known ids in strictly increasing `LEAK_CATEGORIES` order (`:234-249`).
- Ending: `ended` in `src/storage/hand-store.ts` passes the stored `HandRecord`s to `sessionReport` in the
  end transaction (TASK-10.5 §3). `HandRecord` carries `button`, `userSeat`, `seats` (dealt-in, ascending),
  `actions` (blinds first) and `decisions` (`src/table/hand-record.ts:74-106`). No storage change is needed.
- Engine: blinds are the first two dealt-in seats clockwise after the button. Heads-up, the button posts the
  small blind (`src/engine/hand.ts:259-264`). Preflop `currentBet` starts at the big blind
  (`src/engine/hand.ts:294`), so a preflop raise is always type `raise`. `ActionRecord.type` includes
  `small-blind`/`big-blind` (`src/engine/hand.ts:53-56`).
- Screen: `ReportScreen` renders `sessionLeaks(report.leakCounts)` as `li.report-leak[data-category]` with
  title, evidence and fix. Preflop leaks need no UI change.
- Locked tests (TASK-10.5 `state.json`): `tests/stats/leaks.acceptance.test.ts`,
  `tests/ui/report-leaks.acceptance.test.tsx`, `e2e/report-leaks.spec.ts`.
- Tests: `npm test` = `vitest run --coverage`. Acceptance files are `*.acceptance.test.*`.
- Existing code to reuse:
  - `src/stats/leaks.ts:43-64` → `invalid`, `exact`, `isTrimmed`, `isOneSentence` for the preflop entry checks.
  - `src/stats/leaks.ts:136-181` → `categoryCounts`, `isLeak`, `leakEvidence`, `sessionLeaks` (extended, not
    duplicated).
  - `src/table/session-report.ts:234-249` → `parseLeakCounts` (unchanged; it reads `LEAK_CATEGORIES` order).
  - `src/advice/preflop.ts:72-86` → the clockwise-from-button order used by `positionOf`. Re-implement it in
    `positionGroup` over plain seat numbers, because `positionOf` takes a `PlayerView` and maps to chart
    positions, not leak groups.
  - `tests/stats/leaks.acceptance.test.ts:26-83` → `session`, `act`, `decision`, `hand`, `report` helper
    pattern. Copy it into the new test files and give the hands `button` and aligned `actions`.
  - `tests/ui/report-leaks.acceptance.test.tsx` → the `render` / `leaksSection` helper pattern.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Preflop categories reuse the TASK-10.5 data file, list and stored format. `LEAK_CATEGORIES` holds all 31 entries. A preflop entry is `{ id, street: "preflop", group, action, title, evidenceName, fix, justification }` with `id = "<group>-<action>"` (e.g. `early-fold`, `late-open`, as named in the ACs). Preflop counts go into the same `leakCounts` array as `{ category: "<group>-<action>", decisions, errors, major }`. `format`/`version` stay `tlh-leak-categories`/1. No DB version change. | (b) a separate `preflop-leak-categories.json` + `PREFLOP_LEAK_CATEGORIES` and a combined list (no locked-test edit, but a second loader and shape); (c) ids prefixed `preflop-…` | One shape, one validator and one count record, as asked. TASK-10.8 ranks one list. Ids match the AC wording. Persisted ids → ask. | yes | user (Q-1) |
| D-2 | The 16 titles, evidence names and fixes in §5 "Category content". | Titles that name the seat ("Folding too much on the button"); evidence "folds from the blinds" | Original text written for this project (REQ-061.2). Each fix is one sentence (TASK-10.5 A-7) and matches what the preflop charts grade. User-visible text → ask. | yes | user (Q-2) |
| D-3 | One locked test is edited: `tests/stats/leaks.acceptance.test.ts` "AC#2 all 15 postflop categories…" (TASK-10.5) asserts `LEAK_CATEGORIES.map(c => c.id)` equals exactly the 15 postflop ids and reads `c.facingBet`. Change it to run the same assertions, including the exact-15-ids check, on `LEAK_CATEGORIES.filter((c) => c.street !== 'preflop')`, and add a check that the preflop subset's ids equal the 16 `<group>-<action>` ids in data order (early, middle, late, blinds × fold, open, call, raise). Every other assertion is unchanged. The file is unlocked under TASK-10.5 for this edit (Q-1). No other locked test needs editing. `tests/ui/report-leaks.acceptance.test.tsx` uses hands without `button` (A-2) and looks up postflop ids only. `e2e/report-leaks.spec.ts` compares stored `leakCounts` with `sessionReport(…, records)` over the same records, so both sides gain the same preflop counts, and one hand stays below 8 decisions per category. The TASK-10.1/10.3/10.4 locked tests are as in TASK-10.5 D-3: same-records comparisons, or hand-built hands without `button`. Unit test `tests/stats/leaks.test.ts:55` (not locked) is updated to the new error path (SPEC-09). | Option (b) of D-1 avoids the edit | Needed only under D-1. The edit is narrow and keeps the test's intent (all 15 postflop entries). | yes | user (Q-1) |
| D-4 | `handCategoryDecisions` and `positionGroup` live in `src/stats/leaks.ts` (headless, type-only imports from `../engine/hand` and `../advice/grade`). `session-report.ts` calls them. | Put the pairing in `session-report.ts` | Keeps all classification in one module, and keeps it testable without a session record. | no | n/a |

## 5. Design

### Files to create / modify
- `src/stats/leak-categories.json` — modify: append 16 preflop entries (§5 "Category content").
- `src/stats/leaks.ts` — modify: preflop types and validation, `positionGroup`, `preflopAction`,
  `decisionCategory` 3rd argument, `CategoryDecision.preflop?`, `handCategoryDecisions`.
- `src/table/session-report.ts` — modify: `button?` on `ReportHand`. `leakCounts` built via
  `handCategoryDecisions`.
- `tests/stats/leaks.acceptance.test.ts` — modify (locked, D-3): narrow AC#2 to the postflop entries.
- `tests/stats/leaks.test.ts` — modify (unit): the `categories[0].street = 'preflop'` case's expected path.
- `tests/stats/preflop-leaks.acceptance.test.ts` — new (SPEC-01..07).
- `tests/stats/preflop-leaks.test.ts` — new (SPEC-09, SPEC-10, SPEC-11).
- `tests/ui/report-preflop-leaks.acceptance.test.tsx` — new (SPEC-08).
- `docs/stats/leaks.md` — modify: preflop categories, position groups, action mapping, content table with
  justifications.
- `docs/storage/reports.md` — modify: `leakCounts` now also holds preflop ids. Note the data order.

### Components, interfaces and data
`src/stats/leaks.ts` (additions/changes; existing exports keep their names and behaviour for postflop):
```ts
export type PositionGroup = 'early' | 'middle' | 'late' | 'blinds';
export type PreflopAction = 'fold' | 'open' | 'call' | 'raise';
export type PreflopCategoryId = `${PositionGroup}-${PreflopAction}`;
export type PostflopCategoryId =
  `${LeakStreet}-facing-a-bet-${FacingAction}` | `${LeakStreet}-not-facing-a-bet-${OpenAction}`;
export type LeakCategoryId = PostflopCategoryId | PreflopCategoryId;

interface CategoryText { readonly title: string; readonly evidenceName: string;
                         readonly fix: string; readonly justification: string }
export interface PostflopLeakCategory extends CategoryText {
  readonly id: PostflopCategoryId; readonly street: LeakStreet;
  readonly facingBet: boolean; readonly action: FacingAction | OpenAction }
export interface PreflopLeakCategory extends CategoryText {
  readonly id: PreflopCategoryId; readonly street: 'preflop';
  readonly group: PositionGroup; readonly action: PreflopAction }
export type LeakCategory = PostflopLeakCategory | PreflopLeakCategory;

/** Position group of `seat` among the dealt-in `seats`, counted back from `button` (REQ-047.6, A-6).
 *  RangeError('Seat <seat> is not dealt in') / ('Button <button> is not dealt in'). */
export function positionGroup(seats: readonly SeatNumber[], button: SeatNumber, seat: SeatNumber): PositionGroup;

/** fold → 'fold'; call → 'call'; raise → raisedBefore ? 'raise' : 'open'; check, bet → null (REQ-047.9, A-1, A-5). */
export function preflopAction(type: ActionType, raisedBefore: boolean): PreflopAction | null;

export interface PreflopSpot { readonly group: PositionGroup; readonly raisedBefore: boolean }

/** Postflop: as TASK-10.5. Preflop: `<group>-<preflopAction>` when `spot` is given and the action maps;
 *  null otherwise (no spot, BB check) or when the id is not in the data. */
export function decisionCategory(street: 'preflop' | LeakStreet, action: ActionType, spot?: PreflopSpot): LeakCategoryId | null;

export interface CategoryDecision { …existing…; readonly preflop?: PreflopSpot }   // categoryCounts passes it on

/** The hand's decisions as CategoryDecisions: decisions without street/action are dropped; postflop ones pass
 *  through; a preflop one gets `preflop` from positionGroup(seats, button, userSeat) and A-1 when `button` is
 *  present and it pairs with a preflop action record (A-3), else it passes through without `preflop` (so it
 *  is not counted). */
export interface CategoryHand {
  readonly seats: readonly { readonly seat: SeatNumber }[];
  readonly button?: SeatNumber;
  readonly userSeat: SeatNumber;
  readonly actions: readonly ActionRecord[];
  readonly decisions: readonly { readonly street?: CategoryDecision['street'];
    readonly action?: { readonly type: ActionType }; readonly grade: { readonly grade: Grade };
    readonly hinted: boolean }[];
}
export function handCategoryDecisions(hand: CategoryHand): CategoryDecision[];
```
Data file entry (preflop):
```json
{ "id": "early-fold", "street": "preflop", "group": "early", "action": "fold",
  "title": "…", "evidenceName": "early-position folds", "fix": "….", "justification": "…." }
```
Validation (`parseCategory`), checked in this order:
1. The entry must be an object (`<path>`). `street` must be one of `preflop`, `flop`, `turn`, `river`
   (`<path>.street`).
2. The keys must be exactly the shape for that street. Preflop: `id, street, group, action, title,
   evidenceName, fix, justification`. Postflop: the TASK-10.5 keys. An extra key fails at `<path>.<key>`, a
   missing key at `<path>.<key>`.
3. Preflop only: `group` must be one of early/middle/late/blinds (`.group`). `action` must be one of
   fold/open/call/raise (`.action`). `id` must equal `` `${group}-${action}` `` and be unique (`.id`).
4. Postflop entries are checked exactly as today.
5. The text fields (`title`, `evidenceName`, `fix`, `justification`) follow the existing TASK-10.5 A-7 checks,
   unchanged.

`src/table/session-report.ts`:
```ts
export type ReportHand = StatHand & { readonly userSeat: SeatNumber; readonly button?: SeatNumber;
                                      readonly decisions?: readonly ReportDecision[] };
// in sessionReport, replacing the current filter:
const leakCounts = categoryCounts(hands.flatMap((hand) =>
  handCategoryDecisions({ ...hand, decisions: hand.decisions as readonly ReportDecision[] })));
```
`errors` is still counted over every decision as today. Key order and presence of `leakCounts` are unchanged
(TASK-10.5 A-5).

### Rules and algorithms
- `positionGroup`:
  1. `order` = the dealt-in seats sorted ascending, rotated so it starts at the first seat after `button`
     (button last), as `src/advice/preflop.ts:77-79`. Let `n = order.length`, `i` = the index of `seat` in
     `order`, and `k = n − 1 − i` (the number of seats before the button).
  2. If `n === 2`: `seat === button` → late, otherwise blinds.
  3. Otherwise: `i ≤ 1` → blinds; else `k ≤ 1` → late; else `k ≤ 3` → middle; else early.
- `handCategoryDecisions`:
  1. Walk `actions` in order, tracking `raised` (false at the start) and a decision index `j` (0 at the start).
  2. For each record by `userSeat` that is not a blind: let `d = decisions[j++]`. If `d` is a preflop decision,
     `record.street === 'preflop'` and `record.type === d.action.type`, give `d` the spot
     `{ group, raisedBefore: raised }`.
  3. After handling a record, if `record.street === 'preflop' && record.type === 'raise'`, set `raised = true`.
  4. Decisions past the last paired action, and decisions in hands without `button`, keep no spot.
- Counting, the leak rule and the evidence text are unchanged (TASK-10.5): unhinted only, `errors` = Minor +
  Major, leak iff `decisions ≥ 8 && 5·errors ≥ 2·decisions`, evidence
  `` `${errors} of ${decisions} ${evidenceName} graded as errors` ``.
- Worked examples (seats 1..n, button as given):
  - AC#1, 9 players, button 9. Order is 1 SB, 2 BB, 3 UTG, 4, 5, 6 LJ, 7 HJ, 8 CO, 9 BTN. So 1, 2 → blinds;
    3, 4, 5 → early; 6, 7 → middle; 8, 9 → late.
  - AC#2, 6 players, button 6. 1, 2 → blinds; 3, 4 → middle; 5, 6 → late; no early.
  - AC#3, 4 players, button 4. 1, 2 → blinds; 3, 4 → late.
  - AC#3, 3 players, button 3. 1, 2 → blinds; 3 → late.
  - AC#3, heads-up, button 1, seats [1, 2]. 1 → late; 2 → blinds.
  - Non-contiguous dealt-in seats (sit-and-go with empty seats): seats [2, 5, 7, 9], button 7 → order
    [9, 2, 5, 7]. 9, 2 → blinds; 5, 7 → late.
  - AC#4:
    - BTN raise with no earlier raise → `late-open`.
    - BB call after a CO raise → `blinds-call`.
    - 6-max HJ (seat 4, button 6) raise after a UTG raise → `middle-raise`.
    - 9-max UTG fold → `early-fold`.
  - AC#5 (6-max, button 6, unopened):
    - CO (5) calls → `late-call`.
    - SB (1) completes (call) → `blinds-call`.
    - BTN raises after a UTG limp (call) → no earlier `raise` → `late-open`.
  - AC#6: BB checks its option after the SB completes. `preflopAction('check', false)` = null, so it is in no
    category. The report's `leakCounts` has no `blinds-*` entry from it, but `errors` still counts it if
    graded Minor/Major.
  - AC#8: 10 unhinted UTG folds at 9-max, 4 graded Minor/Major → `{ category: 'early-fold', decisions: 10,
    errors: 4 }` → leak (10 ≥ 8 and 20 ≥ 20). The evidence reads `4 of 10 early-position folds graded as
    errors`.

### Category content (D-2, approved Q-2)
| id | title | evidence name | fix | justification |
|---|---|---|---|---|
| early-fold | Folding strong hands from early position | early-position folds | From early position, open-raise the strong hands the chart plays instead of folding them, because they stay profitable even with many players left to act. | The early-position charts still open premium pairs, big aces and strong broadway hands, so folding those hands gives up a profitable open. |
| early-open | Opening too many hands from early position | early-position opens | From early position, open-raise only the tight range on the chart, because with many players still to act a strong hand often wakes up behind you. | With the most players left to act, the early-position chart range is the narrowest; hands outside it are too often dominated by a caller or re-raiser. |
| early-call | Calling too often from early position | early-position calls | From early position, raise or fold rather than limp, and call a raise only with the few hands the chart calls with. | The charts do not limp from early position and call raises with few hands, because players still to act can raise behind and you will often play the pot out of position. |
| early-raise | Re-raising too loosely from early position | early-position raises | Re-raise from early position only with hands that are well ahead of the raiser's range, since the players behind you can still re-raise again. | The re-raise rows of the charts hold only hands that beat the raiser's range; with players left to act, a weaker re-raise risks a cap from a stronger hand. |
| middle-fold | Folding playable hands from middle position | middle-position folds | From middle position, open-raise the hands the chart opens, because fewer players are left to act and a wider range now wins. | The middle-position chart range is wider than the early one, so folding hands inside it gives up opens the chart rates as profitable. |
| middle-open | Opening too many hands from middle position | middle-position opens | From middle position, open-raise only the chart's middle range, which is wider than early position but still leaves out weak aces and small offsuit hands. | Several players are still to act behind a middle-position open, so hands outside the chart range are too often behind the hands that continue. |
| middle-call | Calling too often from middle position | middle-position calls | From middle position, raise the hands worth playing in an unopened pot and call a raise only with hands that play well against the raiser's range. | The charts prefer raising to limping when the pot is unopened and call raises only with hands that do well after the flop against the raiser. |
| middle-raise | Re-raising too loosely from middle position | middle-position raises | Re-raise from middle position only with hands that beat most of the raiser's range, and fold or call with the rest. | The re-raise rows of the charts hold only hands ahead of the raiser's range; weaker re-raises build a pot while behind. |
| late-fold | Folding too much from late position | late-position folds | From the cutoff and button, open-raise the wide range the chart allows, because only the blinds are left to act and you will have position after the flop. | The late-position charts open the widest range since only the blinds remain and the opener acts last after the flop, so folding those hands gives up easy profit. |
| late-open | Opening too many hands from late position | late-position opens | Even on the cutoff and button, open-raise only the chart's late range and fold the weakest hands that rarely win against the blinds. | The late range is wide but not every hand; the weakest hands lose more when the blinds defend than they win when the blinds fold. |
| late-call | Calling too often from late position | late-position calls | From late position, raise rather than limp when the pot is unopened, and call a raise only with hands that play well after the flop. | The charts raise rather than limp from late position to win the blinds or play a heads-up pot in position, and call raises only with hands that do well after the flop. |
| late-raise | Re-raising too loosely from late position | late-position raises | From late position, re-raise only with hands that beat most of the raiser's range, keeping in mind that an early raiser holds stronger hands. | The charts re-raise against the raiser's range for that seat, and an early-position raiser's range is strong, so a loose re-raise is often behind. |
| blinds-fold | Folding too often from the blinds | blind folds | In the blinds you already have chips in the pot, so defend the hands the chart defends instead of folding them to a single raise. | The blind-defence rows of the charts account for the chips already posted, which lower the price of a call, so folding those hands gives up value. |
| blinds-open | Raising too loosely from the blinds | blind opens | From the blinds, raise an unopened or limped pot only with hands strong enough to play out of position on every later street. | A blind acts first on every street after the flop, so the charts raise from the blinds with fewer hands than from late position. |
| blinds-call | Calling too often from the blinds | blind calls | From the blinds, complete or call only with hands that can win enough after the flop to make up for acting first on every street. | Calls from the blinds are cheap but are played out of position, so the charts call only with hands that keep enough value after the flop. |
| blinds-raise | Re-raising too loosely from the blinds | blind raises | From the blinds, re-raise only with hands that are well ahead of the raiser's range, because you will be out of position for the rest of the hand. | The re-raise rows of the blind-defence charts hold only hands ahead of the raiser's range, since being out of position makes marginal re-raises lose. |

### Error handling and configuration
- Bad data file → `parseLeakCategories` throws at module load with `RangeError('Invalid leak categories: <path>')`
  (SPEC-09).
- `positionGroup` with a seat or button not in `seats` → `RangeError`. `handCategoryDecisions` never calls it in
  that case for validated records (the button and the user seat are always dealt in,
  `src/engine/hand.ts:166-167`, and `src/table/hand-record.ts` validation).
- Stored `leakCounts` with preflop ids are validated by the existing `parseLeakCounts` (unknown id or wrong
  order → `RangeError('Invalid session report: leakCounts[i].category')`). No configuration.

## 6. Behaviour specification

### SPEC-01: 9-player position groups
- Verifies: AC#1, DoD#2
- Behaviour: Given seats 1..9 with button 9, When `positionGroup` runs for each seat, Then seats 1 and 2 are
  `blinds`, 3, 4 and 5 are `early`, 6 (lojack) and 7 (hijack) are `middle`, and 8 (cutoff) and 9 (button) are
  `late`.
- Verification: acceptance `tests/stats/preflop-leaks.acceptance.test.ts::AC#1 groups a 9-player hand into blinds, early, middle and late`

### SPEC-02: 6-player position groups
- Verifies: AC#2, DoD#2
- Behaviour: Given seats 1..6 with button 6, Then 1 and 2 are `blinds`, 3 and 4 are `middle`, 5 and 6 are
  `late`, and no seat is `early`. Given the same table with button 3, Then 4 and 5 are `blinds`, 6 and 1 are
  `middle`, 2 and 3 are `late` (the order wraps).
- Verification: acceptance `tests/stats/preflop-leaks.acceptance.test.ts::AC#2 groups a 6-player hand with no early seats`

### SPEC-03: 4-player, 3-player and heads-up groups
- Verifies: AC#3, DoD#2
- Behaviour: Given seats 1..4 with button 4, Then 1 and 2 are `blinds` and 3 and 4 are `late`. Given seats 1..3
  with button 3, Then 1 and 2 are `blinds` and 3 is `late`. Given seats [1, 2] with button 1, Then 1 is `late`
  and 2 is `blinds`. In none of them is any seat `middle` or `early`.
- Verification: acceptance `tests/stats/preflop-leaks.acceptance.test.ts::AC#3 groups 4-player, 3-player and heads-up hands`

### SPEC-04: Open, call, raise and fold by position
- Verifies: AC#4, DoD#2
- Behaviour: Given four hands built with `button`, `seats`, aligned `actions` and one unhinted preflop decision
  each, When their report is built with `sessionReport`, Then `leakCounts` holds exactly one decision each in
  `late-open`, `blinds-call`, `middle-raise` and `early-fold`. The four hands are:
  - a 6-max button raise with no earlier raise;
  - a 6-max big-blind call after a cutoff raise;
  - a 6-max hijack (seat 4, button 6) raise after a UTG raise;
  - a 9-max UTG (seat 3, button 9) fold.
  `decisionCategory` with the matching spots returns the same four ids.
- Verification: acceptance `tests/stats/preflop-leaks.acceptance.test.ts::AC#4 classifies button open, big blind call, hijack re-raise and UTG fold`

### SPEC-05: Limp, small-blind complete and raise over a limper
- Verifies: AC#5, DoD#2
- Behaviour: Given unopened 6-max pots (button 6), When the user calls the big blind from the cutoff (seat 5),
  completes from the small blind (seat 1), or raises from the button after one UTG limp (call), Then the
  decisions fall in `late-call`, `blinds-call` and `late-open` respectively, both through `decisionCategory` and
  in the `leakCounts` of the report built from those hands.
- Verification: acceptance `tests/stats/preflop-leaks.acceptance.test.ts::AC#5 a limp and a small-blind complete are calls and a raise over a limper is an open`

### SPEC-06: Big blind check is in no category
- Verifies: AC#6, DoD#2
- Behaviour: Given a 6-max hand where the small blind completes and the user in the big blind checks (graded
  Major, unhinted), When classified, Then `decisionCategory('preflop', 'check', { group: 'blinds',
  raisedBefore: false })` is null, and the report's `leakCounts` is `[]`. A report of 8 such hands has no leak.
  The report's `errors.major` still counts each check.
- Verification: acceptance `tests/stats/preflop-leaks.acceptance.test.ts::AC#6 a big blind check falls in no preflop category`

### SPEC-07: All 16 preflop categories exist with valid text
- Verifies: AC#7, DoD#1, DoD#2, DoD#10
- Behaviour: Given `LEAK_CATEGORIES`, When the preflop entries are taken (`street === 'preflop'`), Then their ids
  are exactly the 16 combinations of early/middle/late/blinds × fold/open/call/raise, each id equals
  `<group>-<action>`, and each entry has a trimmed title without a final `.`, a lower-case evidence name, a fix
  matching `/^[A-Z][^.!?]*\.$/` and a non-empty justification. `parseLeakCategories` of the shipped JSON returns
  `LEAK_CATEGORIES` (31 entries, the 15 postflop first, unchanged).
- Verification: acceptance `tests/stats/preflop-leaks.acceptance.test.ts::AC#7 all 16 preflop categories have a title, evidence name and a one-sentence fix`

### SPEC-08: Report shows an early-position fold leak
- Verifies: AC#8, DoD#2
- Behaviour: Given a 9-player cash session whose 10 hands each hold one unhinted UTG fold (seat 3, button 9,
  aligned actions), 4 graded Minor or Major and 6 Correct, When `sessionReport` builds the report and
  `ReportScreen` renders it, Then the "Biggest leaks this session" section contains one `report-leak` item with
  `data-category="early-fold"`, the title and fix of the `early-fold` entry of `LEAK_CATEGORIES`, and the
  evidence `4 of 10 early-position folds graded as errors`.
- Verification: acceptance `tests/ui/report-preflop-leaks.acceptance.test.tsx::AC#8 the report lists the early-position folds leak with evidence and fix`

### SPEC-09: Preflop category data validation
- Verifies: AC#7, DoD#2
- Behaviour: Given copies of the shipped JSON with one defect in a preflop entry, When `parseLeakCategories` runs,
  Then it throws a `RangeError` starting with `Invalid leak categories:` that names the path. The defects and
  expected paths are:
  - `group: 'front'` → `.group`
  - `action: 'limp'` → `.action`
  - `action: 'check'` → `.action`
  - id not equal to `<group>-<action>` → `.id`
  - a duplicate preflop id → `.id`
  - an extra `facingBet` key → `.facingBet`
  - a missing `group` → `.group`
  - a two-sentence fix → `.fix`
  - an upper-case evidence name → `.evidenceName`
  - `street: 'showdown'` → `.street`

  A postflop entry given `street: 'preflop'` fails at its first key that does not fit the preflop shape. The
  `tests/stats/leaks.test.ts` case is updated to that path.
- Verification: unit `tests/stats/preflop-leaks.test.ts::parseLeakCategories rejects malformed preflop entries`

### SPEC-10: Pairing decisions with actions
- Verifies: AC#4, AC#5, DoD#2
- Behaviour: `handCategoryDecisions` gives a preflop decision a spot only when the hand has `button`, the
  decision pairs with the user's j-th non-blind action, and that action is preflop with the same type. The
  cases are:
  - A hand without `button` → no preflop spot; postflop decisions still pass through.
  - Decisions without `street`/`action` → dropped.
  - A user who limps and then re-raises after a raise → first `call` (raisedBefore false), then `raise`
    (raisedBefore true).
  - A user who opens and then caps after a re-raise → `open`, then `raise`.
  - A raise by the user's own earlier action counts as "raised before".
  - A trailing forced fold with no decision → ignored.
  - A decision whose paired record has another type → no spot.
  - Hinted preflop decisions are not counted.
  - Preflop and postflop counts appear together in `LEAK_CATEGORIES` order.
- Verification: unit `tests/stats/preflop-leaks.test.ts::handCategoryDecisions pairs preflop decisions with their action records`

### SPEC-11: Grouping edge cases
- Verifies: AC#1, AC#2, AC#3, DoD#2
- Behaviour: Grouping and action mapping hold at every table size:
  - `positionGroup` over non-contiguous dealt-in seats [2, 5, 7, 9] with button 7 gives 9, 2 → blinds and
    5, 7 → late.
  - 5 players (button 5) → seat 3 middle, no early.
  - 7 players (button 7) → seat 3 early, 4 and 5 middle.
  - 10 players (button 10) → seats 3–6 early.
  - A seat or button not dealt in → `RangeError`.
  - `preflopAction`: fold → fold; call → call; raise → open or raise; check and bet → null.
- Verification: unit `tests/stats/preflop-leaks.test.ts::positionGroup and preflopAction cover every table size and action`

### SPEC-12: Stored reports and the existing leaks flow
- Verifies: DoD#2, DoD#8, DoD#9
- Behaviour: Given a report with preflop and postflop `leakCounts`, When it is JSON round-tripped through
  `parseSessionReport`, Then it is returned equal. A report whose `leakCounts` has `early-fold` after
  `flop-facing-a-bet-fold` (data order is postflop first, A-4) is rejected at `leakCounts[1].category`. The
  locked `e2e/report-leaks.spec.ts` (Chromium + WebKit, axe, same-origin requests) passes unchanged, because the
  screen markup is unchanged.
- Verification: unit `tests/stats/preflop-leaks.test.ts::stored leakCounts with preflop categories round-trip and are order-checked`

### SPEC-13: Project checks
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#6, DoD#11
- Behaviour: Given the change, When the checks run, Then `npm run lint`, `npm run typecheck` and `npm test`
  (including the golden-spot suite and coverage thresholds) pass, and the CI workflow passes. `src/stats/leaks.ts`
  imports only types from `../engine/hand` and `../advice/grade`, plus the JSON, and no UI or browser-only code.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-14: Documentation and original content
- Verifies: DoD#1, DoD#10, DoD#12
- Behaviour: `docs/stats/leaks.md` documents:
  - the position-group rule with the worked table sizes;
  - the action mapping (open, raise, limp, small-blind complete, big-blind check);
  - the pairing rule;
  - the 16 entries with title, evidence name, fix and justification;
  - that the text was written for this project.

  `docs/storage/reports.md` `leakCounts` states that it holds preflop and postflop ids in data order. The story
  doc is published to Backlog.md.
- Verification: manual `docs/stats/leaks.md` section "Preflop categories", `docs/storage/reports.md` section "leakCounts", and `backlog doc list --plain` entry for TASK-10.6

### SPEC-15: Not-applicable DoD items
- Verifies: DoD#7, DoD#13
- Behaviour: DoD#7 does not apply: there is no engine, bots or advice change, so no playtest is required.
  DoD#13 does not apply: no screen or dialog is added, and the offline service worker (E13-S07) is not done.
- Verification: manual `git diff --stat main -- src/engine src/bots src/advice src/ui` is empty

## 7. Edge cases
- Empty: a session with no unhinted preflop decision → no preflop entries in `leakCounts` (SPEC-06, SPEC-10).
- Boundary: 10 decisions with 4 errors is exactly 40% (SPEC-08). The rule is unchanged from TASK-10.5, whose
  tests cover 8/3 and 8/4.
- Table sizes 2, 3, 4, 5, 6, 7, 9 and 10, and non-contiguous sit-and-go seats (SPEC-01..03, SPEC-11).
- Heads-up button completing → `late-call` (SPEC-11 grouping + SPEC-05 action rule).
- Big blind check → no category (SPEC-06). Preflop `bet` cannot occur (A-5).
- Several preflop decisions in one hand (limp then re-raise, open then cap) (SPEC-10).
- Short all-in raise before the user's raise → `raise` (A-1, SPEC-10 own-raise case covers the same rule).
- Forced fold after Leave table: it has no decision and is ignored (SPEC-10).
- Hand-built data without `button` or with misaligned decisions → preflop skipped (A-2, A-3, SPEC-10).
- Stored reports from before this story (postflop ids only) stay valid (A-4, SPEC-12). Corrupt preflop ids are
  rejected (SPEC-12).
- Bad data file (SPEC-09).
- Concurrency, interruption, permissions and dependency failure: N/A. No I/O is added, and the report is still
  written once in the existing transaction.

## 8. Security considerations
- Stored reports from IndexedDB are untrusted. `parseSessionReport` → `parseLeakCounts` validates the preflop
  ids against `LEAK_CATEGORIES` (SPEC-12). Hand records are validated by `parseHandRecord` before they reach
  `sessionReport`.
- The category data is a bundled file, validated at load (SPEC-09). All text renders as React text.
- No authn, secrets, network, randomness or new dependencies. N/A.

## 9. Non-functional
- Classification is O(actions + decisions) per hand, once at session end. No measurable cost.
- All new tests use synthetic hands and run in well under a second. No speed or scale check is added, so
  nothing goes in the slow group (`TLH_SLOW_TESTS=1`).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`, then New game → Start game → play hands → Leave table → read "Biggest leaks
  this session"
- New tests (path → SPEC ids):
  - `tests/stats/preflop-leaks.acceptance.test.ts` → SPEC-01..07
  - `tests/stats/preflop-leaks.test.ts` → SPEC-09, SPEC-10, SPEC-11, SPEC-12
  - `tests/ui/report-preflop-leaks.acceptance.test.tsx` → SPEC-08
  - Modified: `tests/stats/leaks.acceptance.test.ts` (D-3), `tests/stats/leaks.test.ts` (SPEC-09 note)
- Judge scenario:
  1. Run the app at 9 players and play 40–80 hands, folding most hands from early seats and opening the Hint
     before a few actions.
  2. Leave table.
  3. In DevTools → IndexedDB, find the stored report's `leakCounts`. Group the unhinted preflop decisions in
     `hands` by the seat's group (count back from `button`) and by action (a raise is an open unless a `raise`
     record precedes it). Check that the counts match, and that any category with ≥ 8 decisions and ≥ 40%
     errors is listed with the right evidence text.
  4. Reload and confirm the report is unchanged.

## 11. Open questions
- None. Q-1 (one list, appended, `<group>-<action>` ids, D-1/D-3) and Q-2 (§5 text, D-2) answered with the recommended options; see `doit/TASK-10.6/qa.md`.

## 12. Clarifications log
See `doit/TASK-10.6/qa.md`.
