# Spec: TASK-9.3 — See the numbers and reason behind each reviewed decision

Status: READY (approved 2026-11-24)
Task: TASK-9.3 · Parent/epic: TASK-9 · Requirements: REQ-035 (035.4), REQ-036 (036.2), REQ-043 (043.1, 043.9) · Dream: limit-holdem-trainer

## 1. Summary
Each Hand Review entry now shows the numbers and the reason behind the advice. Preflop entries show the chart
basis. Flop, turn and river entries show equity % and required equity %. Every entry shows the plain-English
explanation and one basis line per opponent. All of this is read from the decision entries stored with the hand
record (TASK-3.12). The app no longer recomputes advice at hand end. Each entry is graded at the moment of the
decision, through the advice worker's `grade` request (off the main thread), with that decision's observed-stats
snapshot. The hand record and the review panel both use these graded entries, so the review always matches the
hint the user could have seen. The storyboard SHOWDOWN test fixture now plays the user's moves through
`applyUserAction`, so its record carries decisions and parses.

## 2. Scope
- In scope:
  - Per-decision grading: after each user action, `useTableSession` sends one worker `grade` request for the
    new decision (with its `observed` snapshot) and converts the reply into a `HandRecordDecision`. At hand end,
    the record is written from those entries and the review is built from them. Nothing is graded on the main
    thread.
  - `AdviceClient.grade` forwards the optional `observed` snapshot, the same way `recommend` does.
  - The review model `storedReviewEntries(hand, decisions)` and the panel markup for the chart basis, the
    numbers, the explanation and the opponent basis lines. Formatting is shared with the hint card.
  - The storyboard fixture plays user moves through `applyUserAction` (AC#9, judge J-1-01 of TASK-3.12).
  - Tests (Vitest and Playwright), the locked-test edit listed in A-8, and docs.
- Not doing:
  - The "hinted" tag in review entries (TASK-9.6).
  - Approximate-chart and short-stack labels, and all-in wording of the advised action (TASK-9.9). The advice
    text stays `actionLabel(recommended)`, as in TASK-9.1.
  - Chip amounts without `$` in sit-and-go review entries (TASK-5.3).
  - The panel header subtitle and replay code (TASK-9.4), the grade summary badge and auto-open setting
    (REQ-043.8/.11/.13 stories), and the 1-second timing test (TASK-9.8).
  - A review built from a stored `HandRecord` alone, for example a hand-history screen (A-5).
  - Removing `reviewEntries`, `userReviewEntries` or `ReviewEntry`. Locked tests use them (A-6).
  - Any change to the persisted hand-record format, `parseHandRecord`, the advice engine, the grader or the
    explanation text.
  - Migration of old records (REQ-054).
- Scope budget: files=20, lines=1200

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The grade request for a decision is sent from `useTableSession`'s table effect right after the commit that added the decision. It is not sent from inside `act`'s `setTable` updater. Requests are tracked per hand (`table.handNumber`), exactly one per `table.userDecisions` element, in order. | yes | Updaters must stay pure (StrictMode calls them twice). The effect already runs on every table change, including the commit where the user's action ends the hand, so "decision time" holds. | Send the request in `act` before `setTable`; store the entry on `TableState` |
| A-2 | The hold and the Deal next hand button start at hand end exactly as today. The panel itself appears once every grade of the hand has resolved. Until then no panel and no loading text are shown. | yes | Grades are requested during play, so they are normally ready at hand end. This keeps the timing that TASK-9.1/9.2's e2e specs measure, and it adds no user-visible text. | Show the empty panel with a "Working out…" line |
| A-3 | If any grade request of a hand fails (the advice worker failed), the hand's record write rejects. It is logged as `Hand record could not be saved`, and dealing stops, as for any failed write (TASK-3.9 D-2). The review panel does not open. There is no main-thread fallback. | yes | AC#7 forbids grading on the main thread. When the shared worker fails, bot decisions already fail too (`useTableSession.ts:176-182`), so the session cannot continue anyway. | Fall back to `gradeView` on the main thread; write the record without decisions |
| A-4 | The preflop chart-basis line is derived at display time: `chartBasisText` on the decision view's reference size (`referenceSizeOf`), chart-spot position (`chartSpotOf`) and hand class (`handClassOf`), with the stored `recommended.type` as the action. No new stored field. | yes | `HandRecordDecision` has no chart cell (TASK-3.12 A-2). These are the inputs `recommendPreflop` uses (`src/advice/preflop.ts:131-152`), so the line equals the hint's line. The recommendation itself still comes from the stored entry. | Add `chartBasis` to the persisted record (format change) |
| A-5 | The review is built from the `CompletedHand` plus its stored decisions. The hand supplies each decision's view (board at that point, live opponents for preflop basis lines, chart spot) and the seat names. | yes | The review only opens for the hand just played, which is in memory. A review built only from `HandRecord` belongs to the history screens. | Rebuild board and live opponents from `HandRecord.actions` |
| A-6 | `ReviewEntry`, `reviewEntries` and `userReviewEntries` stay exported and unchanged, but the app no longer calls them. They remain the regrade oracle used by locked tests of TASK-2.2, TASK-7.5, TASK-7.15 and TASK-9.1. `handRecord(hand, meta)` without decisions keeps grading via `decisionRecord`, for tests only. Production always passes the worker's entries. | yes | Removing them means editing 5 locked files across 4 owners for no user benefit. | Delete them and edit those locked tests |
| A-7 | The advised action text keeps TASK-9.1's `actionLabel(recommended)`, with no all-in or chips options. In cash play, outside short all-ins, it equals the hint's action text. | yes | Short-stack and all-in labels are TASK-9.9; chips are TASK-5.3. | Use the hint's `actionLabel(move, { allIn, unit })` now |
| A-8 | Locked-test edit (owner TASK-9.1): `tests/ui/review-panel.acceptance.test.tsx`. It must (a) build entries with `storedReviewEntries(hand, hand.userDecisions.map(decisionRecord))`, because `ReviewState.entries` changes type; (b) expect the stored advice `['Raise to $8', 'Bet $4', 'Bet $8', 'Call $8']` and grades `correct, correct, minor, correct`. The old values came from unseen-range options, while stored = hint = `ACTION_RANGE_ADVICE`, proven by locked `tests/table/decision-record.acceptance.test.ts:99-100`; (c) replace the banned-text list `['%','equity','Equity','Why','explanation','basis','…','TBD']` with `['TBD', '…', 'undefined', 'null', '[object']` (keep `…`: the review has no loading state); (d) keep `/You: .+ · Advice: .+$/` anchored, applied to the text of the entry's `<p data-part="moves">` element only (not the whole entry body); (e) parse each `<li data-entry>` up to the next `<li data-entry` or `</ol>`, so nested opponent `<li>`s do not cut entries short. Every other assertion stays the same. | yes | AC#1/#9 contradict the banned words and the stale values. Under the unattended-approval rule the orchestrator unlocks the file before the build. | None: the file cannot pass otherwise. Approved with these conditions in qa.md (locked edit, orchestrator unlocked under TASK-9.1). |
| A-9 | Opponent basis items use `data-opponent="<seat>"`, not `data-seat`. | yes | The TASK-9.1 spec lists `li[data-seat]` among the locators the panel must not match (`doit/TASK-9.1/spec.md:107-113`). | `data-seat` as in the hint card |
| A-10 | The storyboard builder applies seat 5's moves with `applyUserAction(table, action, observed)` (no hint). Named states and `STORYBOARD_HISTORY` indexes are unchanged. States after a user move now carry `userDecisions`. A new export `storyboardShowdown(observed?)` builds the SHOWDOWN state with a snapshot at every user decision. | yes | AC#9. Storyboard consumers only read `userDecisions.at(-1)` after their own action (`tests/table/hint.test.ts:142-146`, `tests/table/observed-snapshot.test.ts:124`). | A separate fixture copy |

## 3. Current system
- Stack: React 19 + Vite, strict TS. Vitest runs in the `node` environment with v8 coverage (`vite.config.ts:5-20`;
  90 % lines for `src/{engine,bots,advice,stats,playtest,table}`). UI tests render `TableView` with
  `renderToString` (`tests/ui/review-panel.acceptance.test.tsx:10-14`). No Vitest harness mounts hooks
  (TASK-9.1 A-8). Playwright runs Chromium and WebKit at 1280 × 720 (`playwright.config.ts:3-16`), and axe runs
  through `e2e/support/axe.ts`.
- Review today: `Table.onHandComplete` calls `userReviewEntries(hand)` on the main thread at hand end
  (`src/ui/table/Table.tsx:297-300`). That calls `gradeView` per decision with the decision's snapshot
  (`src/table/review.ts:38-68`). `ReviewPanel` shows street, board, grade, "You: … · Advice: …"
  (`src/ui/table/ReviewPanel.tsx:24-47`). `ReviewState = { entries: readonly ReviewEntry[]; open }`
  (`Table.tsx:31-34`). Bust tests pass `{ entries: [], open }` (`tests/ui/bust-continue.acceptance.test.tsx:27-28`).
- Record today: at hand end `useTableSession` calls `handWrite` (`src/ui/table/useTableSession.ts:190-209`).
  `handWrite` calls `handRecord` (`src/table/session-record.ts:118-135`), which calls `decisionRecord` →
  `gradeView` per decision on the main thread (`src/table/hand-record.ts:161-200, :234`). Stored entry shape:
  `HandRecordDecision` (`hand-record.ts:50-70`).
- Worker: `handleAdviceRequest` already serves `{ kind: 'grade', view, userAction, observed? }` with
  `userAdviceOptions(observed)` (`src/table/advice-service.ts:31-37, :78-83`). `AdviceClient.grade(view,
  userAction)` cannot send `observed` (`src/ui/advice/advice-client.ts:26, :84-88`). The app-wide client is
  `sharedAdviceClient(create)` (`advice-client.ts:132-135`). Bot requests use the same FIFO worker
  (`useTableSession.ts:100-104`).
- Decisions: `applyUserAction(table, action, observed?, hinted)` appends `{ view, action, observed?, hinted? }`
  (`src/table/session.ts:667-692`). `act` passes the snapshot from the session counts (`useTableSession.ts:232-238`).
- Hint card formatting: `hintCard(rec, view, table)` (`src/table/hint.ts:109-137`) uses `formatPct`
  (`src/advice/explain.ts:23-25`, one decimal + `%`), `chartBasisText` (`explain.ts:73-82`), `basisText`
  ('typical player' / 'based on N hands of this opponent'). Preflop opponents are the live non-user seats of the
  view. `HintCard` renders text nodes only (`src/ui/table/HintCard.tsx:26-41`).
- Storyboard fixture: `buildStoryboard` plays every move, including seat 5's, with `play()`, and `tableAt` sets
  `userDecisions: []` (`tests/support/table-scenarios.ts:83-124`). So `handRecord(completedHand(SHOWDOWN))` has
  no decisions and `parseHandRecord` rejects it (doc-113, J-1-01).
- Existing code to reuse (path → what to reuse instead of writing new):
  - `src/table/hint.ts` → extract the opponent-line mapping of `hintCard` (`:113-119`) into an exported
    `opponentLines(view, basis, names)` and use it from both `hintCard` and the review.
  - `src/advice/explain.ts` → `formatPct`, `chartBasisText`, `basisText`.
  - `src/advice/preflop.ts` → `referenceSizeOf`, `chartSpotOf`; `src/advice/hand-class.ts` → `handClassOf`.
  - `src/table/hand-record.ts` → split `decisionRecord` into `decisionEntry(result, decision)` (pure conversion
    of a `GradeResult<Recommendation>`) plus the existing grading call. This also removes the repeated fields
    (TASK-3.12 NIT).
  - `src/table/review.ts` → `STREET_LABELS`, `opensReview`; `src/advice/grade.ts` → `GRADE_LABELS`;
    `src/table/action-bar.ts` → `actionLabel`.
  - `e2e/support/table-scenes.tsx` + `table-harness-bundle.ts` → scene harness, as for `ten-seat-hint`.
  - `e2e/review.spec.ts` helpers (paused clock, pinned words, `checkOrCallToResult`) and
    `e2e/support/paused-clock.ts` `delayWorkerReplies`, as the pattern for subclassing `window.Worker`.
    Copy them; do not import from a spec.
- Locked tests touched by this change (`doit/*/state.json` `locked_tests`):
  - Must edit: `tests/ui/review-panel.acceptance.test.tsx` (TASK-9.1), see A-8.
  - Checked, no edit needed: `e2e/review.spec.ts` (TASK-9.1). It reads only `data-part` street/you/advice/grade
    and `svg[data-card]`. Its `PINNED_ENTRIES` already come from the same options and snapshot. Its axe scan now
    covers the new content. Also checked: `tests/table/review.acceptance.test.ts` (TASK-9.1),
    `tests/advice/determinism.acceptance.test.ts` (TASK-7.15), `tests/advice/range-model.acceptance.test.ts`
    (TASK-7.5), `tests/table/table-size.acceptance.test.ts` (TASK-2.2): they use the kept `reviewEntries` (A-6).
    `tests/ui/bust-continue.acceptance.test.tsx` / `bust-dialog.acceptance.test.tsx` (TASK-9.2/3.11) use
    `{ entries: [] }`, which still typechecks. `tests/table/decision-record.acceptance.test.ts` (TASK-3.12),
    `tests/storage/hand-records.acceptance.test.ts` (TASK-3.9), `tests/table/hinted.acceptance.test.ts`
    (TASK-8.2) and `tests/table/session-restore.acceptance.test.ts` (TASK-3.10) use the kept two-argument
    `handRecord`. `tests/ui/advice-worker.acceptance.test.ts` (TASK-3.6) calls `client.grade(view, 'call')`,
    which still posts `[3, 'grade']`. `tests/ui/hint*.acceptance` (TASK-8.1) use storyboard states, and the hint
    output does not change.
  - Timing-sensitive e2e to re-run (no edit expected): `e2e/bust-continue.spec.ts`, `e2e/hand-records.spec.ts`,
    `e2e/worker-delay*.spec.ts`, and in the slow group `e2e/rapid-pace.spec.ts` (300 ms bot gap; the grade
    request now queues ahead of the next bot request) and `e2e/responsive-table.spec.ts`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Grade each decision when it is made, through `sharedAdviceClient(create).grade(view, action.type, observed)`. Convert the reply with `decisionEntry` and keep one promise per decision. At hand end, `Promise.all` feeds both `handWrite(…, decisions)` and the review. | Grade all decisions at hand end in the worker; keep main-thread grading | AC#6/#7 require decision time and the worker. Stored = reviewed = hint options. | no | n/a (AC#6, AC#7) |
| D-2 | The panel's model is the new `StoredReviewEntry`, built by `storedReviewEntries(hand, decisions)` from the stored entries. `ReviewState.entries` becomes `readonly StoredReviewEntry[] \| null` (null = grades pending). | Extend `ReviewEntry` (needs a full `GradeResult`, which is not stored) | AC#9: recommendation, numbers, explanation and grade come from the stored entry. | no | n/a (AC#9) |
| D-3 | Entry wording and order below "You: … · Advice: …": a chart-basis line (preflop) or `Equity 37.1%` + `Required equity 11.8%` (postflop), then the explanation paragraph, then a list "Opponent ranges" with `<Name>: <basis>` lines. These are the hint card's words. | Storyboard style "Pot odds need 12% · your equity about 58%" plus a "why" line; a "Why:" label | User-visible text; the hint card's exact wording keeps hint and review identical (REQ-036.2). | yes | user (Q-1, qa.md) |

## 5. Design

### Files to create / modify
- `src/table/hand-record.ts` — add `decisionEntry`; `decisionRecord` delegates to it; `handRecord(hand, meta, decisions?)`.
- `src/table/session-record.ts` — `handWrite(table, meta, decisions?)` passes `decisions` to `handRecord`.
- `src/table/decision-grades.ts` (new) — per-hand grade tracker (`requestNewGrades`, `gradedDecisions`).
- `src/table/review.ts` — `StoredReviewEntry`, `storedReviewEntries`.
- `src/table/hint.ts` — export `opponentLines`, used by `hintCard` (no output change).
- `src/ui/advice/advice-client.ts` — `grade(view, userAction, observed?)`.
- `src/ui/table/useTableSession.ts` — `requestDecisionGrade`, the tracker in the effect, the `onHandGraded` option, and a write chained on the grades.
- `src/ui/table/Table.tsx` — `ReviewState.entries` nullable, `HeldReview`, `reviewGraded`, wire `onHandGraded`.
- `src/ui/table/ReviewPanel.tsx` — chart / numbers / explanation / opponent lines.
- `src/ui/styles.css` — styles for the new entry parts (wrap long text).
- `tests/support/table-scenarios.ts` — storyboard via `applyUserAction`; `storyboardShowdown(observed?)`; `TEN_SEAT_SHOWDOWN`.
- `tests/ui/review-numbers.acceptance.test.tsx` (new) — SPEC-01..04, SPEC-08, SPEC-09.
- `tests/table/decision-grades.test.ts` (new) — SPEC-06, SPEC-10, SPEC-11.
- `tests/ui/review-panel.acceptance.test.tsx` — locked edit (A-8), SPEC-12.
- `e2e/review-numbers.spec.ts` (new) — SPEC-05, SPEC-07.
- `e2e/support/table-scenes.tsx` — `ten-seat-review` scene.
- `e2e/support/table-harness-bundle.ts` — add `'ten-seat-review'` to `TableScene`.
- `docs/ui/review.md` (new) — what an entry shows and where it comes from.
- `docs/storage/hand-records.md` — decisions are graded at decision time in the worker (`:70`, `:96`).
- `docs/advice/determinism.md` — `:30` now describes stored entries, not `reviewEntries`.

### Components, interfaces and data
- `src/table/hand-record.ts`
  - `decisionEntry(result: GradeResult<Recommendation>, decision: Pick<UserDecision, 'action' | 'hinted'>): HandRecordDecision`.
    It is the same mapping as today's `decisionRecord` body (`:168-199`), with fresh copies and `hinted === true`.
  - `decisionRecord(d)` = `decisionEntry(gradeView(d.view, d.action.type, userAdviceOptions(d.observed)), d)`.
    The output is unchanged, so the locked TASK-3.12 tests still hold.
  - `handRecord(hand, meta, decisions?: readonly HandRecordDecision[])`: if `decisions` is given, then
    `record.decisions = decisions.map(structuredClone-equivalent copy)` and no grading happens. It throws
    `RangeError('Invalid hand record: decisions')` if `decisions.length !== hand.userDecisions.length`.
    Without it, the behaviour is unchanged (A-6).
- `src/table/decision-grades.ts`
  ```ts
  export interface DecisionGrades {
    readonly handNumber: number;
    /** One per requested decision of that hand, in order. */
    readonly pending: readonly Promise<HandRecordDecision>[];
  }
  export const NO_GRADES: DecisionGrades; // { handNumber: 0, pending: [] }
  /** Calls `request` once for each of table.userDecisions not yet requested for table.handNumber (starting
   *  afresh when the hand number changes); returns the new tracker (input unchanged if nothing is new). */
  export function requestNewGrades(
    grades: DecisionGrades,
    table: TableState,
    request: (decision: UserDecision) => Promise<HandRecordDecision>,
  ): DecisionGrades;
  /** All entries of table's hand in order. Rejects with RangeError('Grades do not match the decisions') if the
   *  tracker is for another hand or its count differs; rejects with the first failed request's error. */
  export function gradedDecisions(grades: DecisionGrades, table: TableState): Promise<readonly HandRecordDecision[]>;
  ```
- `src/ui/advice/advice-client.ts`: `grade(view, userAction, observed?)`. It posts `observed` only when given,
  exactly like `recommend` (`:78-82`). The `Payload` grade variant gains `observed?`.
- `src/ui/table/useTableSession.ts`
  - `export function requestDecisionGrade(create, decision): Promise<HandRecordDecision>`, defined as
    `Promise.resolve().then(() => sharedAdviceClient(create).grade(decision.view, decision.action.type,
    decision.observed)).then((r) => decisionEntry(r, decision))`. It never throws synchronously.
  - New option `onHandGraded?: (hand: CompletedHand, decisions: readonly HandRecordDecision[]) => void`. It is
    called once per completed hand, after all of the hand's grades have resolved and before the record is added.
    It is read through a ref, like `onHandComplete`.
  - In the table effect, before the step switch:
    `grades.current = requestNewGrades(grades.current, table, (d) => requestDecisionGrade(createAdviceWorker, d))`.
  - In the `done` branch: `completedAt = new Date()` (taken now); `write.current = gradedDecisions(grades.current,
    table).then((decisions) => { gradedRef.current?.(done, decisions); const { record, session } =
    handWrite(table, { sessionId, startedAt, completedAt }, decisions); return (started.current ??
    Promise.resolve()).then(() => store.add(record, session)); })`. The existing catch, log, `track`,
    `countObserved` and the synchronous `onHandComplete(done)` stay as they are.
- `src/table/review.ts`
  ```ts
  export interface StoredReviewEntry {
    readonly street: ReviewStreet;
    readonly streetLabel: string;
    readonly board: readonly Card[];          // copy of the decision view's board
    readonly userActionText: string;          // actionLabel(decision.action)
    readonly adviceText: string;              // actionLabel(decision.recommended) (A-7)
    readonly grade: Grade;                    // decision.grade.grade
    readonly gradeLabel: string;              // GRADE_LABELS[grade]
    readonly chartBasis: string | null;       // basis 'chart' only (A-4)
    readonly equity: string | null;           // formatPct(equityPct); null for 'chart'
    readonly requiredEquity: string | null;   // formatPct(requiredEquityPct); null for 'chart'
    readonly explanation: string;             // decision.explanation, exactly as stored
    readonly opponents: HintCardView['opponents'];
    readonly decision: HandRecordDecision;    // the stored entry it was built from (same reference)
  }
  /** One entry per stored decision, same order. RangeError('Review needs one stored decision per user decision')
   *  if the counts differ or decisions[i].street !== hand.userDecisions[i].view.street. No grading. */
  export function storedReviewEntries(
    hand: CompletedHand,
    decisions: readonly HandRecordDecision[],
  ): readonly StoredReviewEntry[];
  ```
  Names come from `hand.seats`. Opponents come from `opponentLines(view, decision.basis === 'chart' ? null :
  decision.opponentBasis, names)`.
- `src/table/hint.ts`: `export function opponentLines(view: PlayerView, basis: readonly { seat: SeatNumber; text:
  string }[] | null, names: ReadonlyMap<number, string>): HintCardView['opponents']`. `null` means a chart decision:
  every live non-user seat of `view` gets `basisText(null)`. Otherwise the result is `basis` in order. `hintCard`
  calls it, and its output is unchanged.
- `src/ui/table/Table.tsx`
  - `ReviewState { entries: readonly StoredReviewEntry[] | null; open: boolean }`.
  - `export interface HeldReview extends ReviewState { readonly hand: CompletedHand }`.
  - `export function reviewGraded(review: HeldReview | null, hand: CompletedHand, entries): HeldReview | null`
    returns `{ ...review, entries }` iff `review?.hand === hand`, else `review` unchanged. This covers a Deal next
    hand click before the grades arrive.
  - `onHandComplete`: if `opensReview(hand)` then `setReview({ hand, entries: null, open: true })`. The new
    `onHandGraded`: `setReview((r) => reviewGraded(r, hand, storedReviewEntries(hand, decisions)))`.
  - `TableView`: the panel renders iff `review?.open === true && review.entries !== null`. The Deal next hand /
    Continue button and the bust-dialog rule are unchanged (`review !== null`).
- `ReviewPanel` entry markup, after the unchanged top row and `moves` paragraph, all as text nodes:
  ```
  {chartBasis !== null && <p data-part="chart">{chartBasis}</p>}
  {equity !== null && requiredEquity !== null && (
    <p className="review-numbers">
      <span data-part="equity">{`Equity ${equity}`}</span>
      <span data-part="required">{`Required equity ${requiredEquity}`}</span>
    </p>)}
  <p data-part="explanation">{explanation}</p>
  {opponents.length > 0 && (
    <ul aria-label="Opponent ranges" className="review-opponents">
      {opponents.map((o) => <li key={o.seat} data-opponent={o.seat}>{`${o.name}: ${o.basis}`}</li>)}
    </ul>)}
  ```
  Wording approved by Q-1. Never use `dangerouslySetInnerHTML`.
- CSS: `.review-numbers` uses flex wrap with a 4 px 16 px gap, like `.hint-numbers`. Explanation and opponent
  text are 14 px `#c9ced6` with `overflow-wrap: anywhere`. The list has `padding-left: 18px`. The panel stays
  400 px wide (TASK-9.1 A-4), so the page scrolls vertically, never horizontally.

### Rules and algorithms
1. Decision time: the commit that appends `userDecisions[i]` runs the effect, which sends exactly one `grade`
   request for `i` (A-1). Requests of earlier hands are never re-sent. A new hand number starts a new tracker.
2. Hand end: the record and the review use the same resolved entries, so the stored record equals what the panel
   shows.
3. Preflop chart basis (A-4): `chartBasisText({ referenceSize: referenceSizeOf(view.players.length), position:
   chartSpotOf(view, size).position, handClass: handClassOf(view.holeCards), action: decision.recommended.type })`.
- Worked examples (checked by running `decisionRecord` on the fixtures, 2026-11-24):
  - Storyboard SHOWDOWN, no snapshot (Ava 1, Ben 2, Cal 3, Dee 4, You 5, Eli 6):
    | # | Street | Board | You | Advice | Grade | Numbers | Opponents |
    |---|---|---|---|---|---|---|---|
    | 1 | Preflop | — | Raise to $8 | Raise to $8 | Correct | `From the 6-max chart: raise A9o from the cutoff` | Ava, Ben, Eli: typical player |
    | 2 | Flop | Ks 9d 4c | Call $4 | Call $4 | Correct | Equity 37.1% · Required equity 11.8% | Ben, Eli: typical player |
    | 3 | Turn | + 2h | Bet $8 | Check | Major error | Equity 28.3% · Required equity 0.0% | Ben, Eli: typical player |
    | 4 | River | + 7c | Check | Bet $8 | Minor error | Equity 54.5% · Required equity 0.0% | Ben: typical player |
  - The same hand with snapshot `[{ seat: 2, hands: 40, vpip: 60, pfr: 5 }]` at every decision: flop entry
    Equity 29.9%, Required equity 11.8%, `Ben: based on 40 hands of this opponent`, `Eli: typical player`.
    The preflop entry still shows `Ava/Ben/Eli: typical player`.
  - Snapshot `hands: 29` (same vpip/pfr): flop 37.1 % / 11.8 %, Ben typical player. Recomputing the same view
    with `hands: 30` gives 30.1 % and `based on 30 hands of this opponent`, so a hand-end recompute would differ.
  - `REVIEW_FOUR` stored entries: advice Raise to $8 / Bet $4 / Bet $8 / Call $8; grades Correct / Correct /
    Minor error / Correct; equity 72.7 / 55.3 / 48.2 %, required 0.0 / 0.0 / 19.0 %.
  - `TEN_SEAT_SHOWDOWN` (10 seats, everyone checks or calls, user seat 5): 4 decisions. Preflop call → Fold,
    then flop/turn/river check. Each postflop entry has 9 opponent lines, and explanations run about 346
    characters. Grading takes about 1.2 s on the main thread (test harness only).

### Error handling and configuration
- `storedReviewEntries`: RangeError on a count or street mismatch (cannot happen in the app; unit-tested).
- `handRecord` with a wrong-length `decisions`: `RangeError('Invalid hand record: decisions')`.
- `gradedDecisions`: rejects as specified. In the app this leads to the existing failed-write path (A-3).
- No new configuration, no new dependency.

## 6. Behaviour specification

### SPEC-01: Four stored entries show street, board, moves, grade, numbers and explanation
- Verifies: AC#1, AC#8, AC#9, DoD#1
- Behaviour: Given `SHOWDOWN` (4 user decisions, played through `applyUserAction`), its record from
  `handRecord(completedHand(SHOWDOWN), meta)` round-tripped through `JSON` and `parseHandRecord`, When
  `TableView` renders `review = { entries: storedReviewEntries(hand, parsed.decisions), open: true }`, Then
  there are 4 entries with exactly the values in the worked-example table (§5). Each entry's
  `[data-part="explanation"]` text equals `parsed.decisions[i].explanation`. Each flop, turn and river entry shows
  `Equity ${formatPct(equityPct)}` and `Required equity ${formatPct(requiredEquityPct)}` of that stored decision.
- Verification: acceptance `tests/ui/review-numbers.acceptance.test.tsx::four stored decisions show street, board, moves, grade, numbers and explanation`

### SPEC-02: Preflop entry shows the chart basis and no equity numbers
- Verifies: AC#2, DoD#1
- Behaviour: Given the same rendered review, Then entry 1 (A9o, cutoff, 6-max) has
  `[data-part="chart"]` = `From the 6-max chart: raise A9o from the cutoff`. It has no `data-part="equity"` or
  `data-part="required"`, and no `%` outside its explanation. Its chart line equals
  `chartBasisText(recommend(view, userAdviceOptions()))` for that decision's view, which is the hint's line.
- Verification: acceptance `tests/ui/review-numbers.acceptance.test.tsx::a preflop entry shows the chart basis instead of equity`

### SPEC-03: Opponent basis lines
- Verifies: AC#3, DoD#1
- Behaviour: Given `storyboardShowdown([{ seat: 2, hands: 40, vpip: 60, pfr: 5 }])` and its stored decisions,
  When rendered, Then the flop entry's "Opponent ranges" list is `Ben: based on 40 hands of this opponent`,
  `Eli: typical player`. The preflop entry's list is `Ava: typical player`, `Ben: typical player`,
  `Eli: typical player`.
- Verification: acceptance `tests/ui/review-numbers.acceptance.test.tsx::basis lines show 40 observed hands and typical player`

### SPEC-04: Review equals the hint given at the decision
- Verifies: AC#4, AC#9, DoD#1
- Behaviour: Given `storyboardShowdown(snapshot29)`, where `snapshot29 = [{ seat: 2, hands: 29, vpip: 60, pfr: 5 }]`,
  and the hint at the flop decision `hintCard(handleAdviceRequest({ kind: 'recommend', view, observed: snapshot29 }).value, view, FLOP_BET)`.
  The stored decisions are `decisionEntry` of each `handleAdviceRequest({ kind: 'grade', … observed })` reply
  (the worker path). The hand ends and Ben's snapshot for the next decision is `hands: 30`. When the review is
  built, Then the flop entry's `decision.recommended` deep-equals the hint's `move`. Its `equity` (`37.1%`),
  `requiredEquity` (`11.8%`), `explanation` and `opponents` deep-equal the hint card's. They differ from a
  recompute with `hands: 30` (30.1 %, `based on 30 hands of this opponent`).
- Verification: acceptance `tests/ui/review-numbers.acceptance.test.tsx::the review repeats the flop hint after the count reaches 30`

### SPEC-05: Ten-seat review readable at 1280 × 720 without horizontal scrolling
- Verifies: AC#5, DoD#1, DoD#7
- Behaviour: Given the `ten-seat-review` scene (`TEN_SEAT_SHOWDOWN`, its 4 stored entries from
  `decisionRecord`, panel open) at 1280 × 720, When it renders, Then the panel lists 4 entries. Each has a
  non-empty explanation, and each postflop entry has 9 opponent lines. `document.documentElement.scrollWidth <=
  clientWidth`, the panel's `scrollWidth <= clientWidth`, and every explanation and opponent line has its right
  edge ≤ the panel's right edge and `scrollWidth <= clientWidth`. axe reports no serious or critical violations.
  This holds in Chromium and WebKit.
- Verification: acceptance `e2e/review-numbers.spec.ts::a ten-seat review with four entries fits 1280 x 720 without horizontal scrolling`

### SPEC-06: One worker grade request per decision, at decision time; hand end uses them
- Verifies: AC#6, AC#7, DoD#1
- Behaviour: Given a fake `request` that records calls, When `requestNewGrades` runs on each state of `SHOWDOWN`'s
  history in order (and again on the same state), Then `request` was called exactly 4 times. Call i happened on
  the first state that has i+1 decisions, with that decision (view, action and observed are the same
  references). A state of the next hand (`dealHand(nextHand(SHOWDOWN), code)`) starts a new tracker.
  `gradedDecisions` resolves the 4 entries in order. It rejects with the request's error if one fails, and with
  `RangeError('Grades do not match the decisions')` for another hand's tracker. `AdviceClient.grade(view,
  'call', snapshot)` posts `{ id, kind: 'grade', view, userAction: 'call', observed: snapshot }`, and without a
  snapshot it posts no `observed` key.
- Verification: unit `tests/table/decision-grades.test.ts::each decision is requested once when it appears`

### SPEC-07: In the app, entries come from the worker's grade replies sent during play
- Verifies: AC#1, AC#6, AC#7, AC#8, DoD#1, DoD#7, DoD#8
- Behaviour: Given the real app on Playwright's paused clock, replay words pinned to `9e3779b9 00000001 00000002
  00000003`, and an init script that subclasses `window.Worker` to log every posted request
  (`id, kind, userAction, view.street`) and every reply. When the user checks or calls to the result
  (4 decisions, entries per `e2e/review.spec.ts` `PINNED_ENTRIES`), Then:
  - after each user click, the count of `grade` requests equals the number of clicks so far (polled), and all 4
    were posted before `Hand over` appeared, with streets preflop/flop/turn/river and `userAction` `call`;
  - the panel's 4 entries show, from the matching reply `r`: `GRADE_LABELS[r.grade]`; explanation text ===
    `r.recommendation.explanation`; postflop `Equity ${r.recommendation.equityPct.toFixed(1)}%` and
    `Required equity ${…requiredEquityPct.toFixed(1)}%`; preflop chart line ===
    `chartBasisText(r.recommendation)` with no equity parts; and one opponent line per
    `r.recommendation.opponentBasis` element, ending in `: ${text}`;
  - axe reports no serious or critical violations with the panel open, and every request goes to the app's
    own origin.
  This holds in Chromium and WebKit.
- Verification: acceptance `e2e/review-numbers.spec.ts::review entries show the grade replies the worker sent during the hand`

### SPEC-08: Stored text is rendered as plain text
- Verifies: AC#9, DoD#1
- Behaviour: Given a stored decision whose `explanation` is `<img src=x onerror="alert(1)"> & <b>bold</b>` and
  whose opponent basis text is `<i>x</i>`, When the panel renders, Then the markup contains `&lt;img` and
  `&lt;b&gt;bold&lt;/b&gt;` and `&lt;i&gt;x&lt;/i&gt;`, and no `<img` or `<b>` or `<i>` element. The source
  of `src/ui/table/ReviewPanel.tsx` does not contain `dangerouslySetInnerHTML`.
- Verification: acceptance `tests/ui/review-numbers.acceptance.test.tsx::stored text is rendered as plain text`

### SPEC-09: Hand end never grades on the main thread; storyboard record parses
- Verifies: AC#6, AC#7, AC#9, DoD#1
- Behaviour: Given `gradeView` replaced (via `vi.mock`) by a version that throws `Error('graded on the main
  thread')` while armed. Precomputed worker-path entries are made before arming. When armed and the hand-end
  path runs (`storedReviewEntries(hand, decisions)`, `handWrite(SHOWDOWN, meta, decisions)`,
  `gradedDecisions`), Then nothing throws, `record.decisions` deep-equals `decisions` (with no shared
  references), and `parseHandRecord(JSON.parse(JSON.stringify(record)))` succeeds with 4 decisions. Also, the
  unarmed `handRecord(completedHand(SHOWDOWN), meta)` (fixture played through `applyUserAction`) parses with
  4 decisions whose actions are raise, call, bet and check.
- Verification: acceptance `tests/ui/review-numbers.acceptance.test.tsx::the hand-end path reads stored decisions and never grades`

### SPEC-10: Review model edges
- Verifies: AC#9, DoD#1
- Behaviour: `storedReviewEntries(hand, [])` for a 4-decision hand, or with a decision whose street differs,
  throws `RangeError('Review needs one stored decision per user decision')`. For an empty hand with `[]` it
  returns `[]`. `entry.board` is a copy (mutating it leaves the view unchanged). `entry.decision` is the input
  object. `handRecord(hand, meta, wrongLength)` throws `RangeError('Invalid hand record: decisions')`.
  `reviewGraded(null, hand, e)` is `null`. `reviewGraded(held, otherHand, e)` returns `held` unchanged.
  `reviewGraded(held, held.hand, e).entries` is `e`. `hintCard` output for `PREFLOP_DECISION` and `FLOP_BET`
  is unchanged by the `opponentLines` extraction (deep-equal to the TASK-8.1 expectations).
- Verification: unit `tests/table/decision-grades.test.ts::review model edges`

### SPEC-11: The decision-grade request converts the worker reply
- Verifies: AC#6, AC#7, DoD#1
- Behaviour: Given each `SHOWDOWN` decision, `decisionEntry(handleAdviceRequest({ kind: 'grade', view,
  userAction, observed }).value, decision)` deep-equals `decisionRecord(decision)`. With `hinted: true` it
  sets `hinted` to true. `requestDecisionGrade(create, decision)`, with a fake worker that answers via
  `handleAdviceRequest`, resolves to the same entry. It never throws synchronously when `create` throws (it
  rejects instead).
- Verification: unit `tests/table/decision-grades.test.ts::the grade reply becomes the stored entry`

### SPEC-12: Locked TASK-9.1 panel test updated
- Verifies: AC#1, AC#9, DoD#1
- Behaviour: `tests/ui/review-panel.acceptance.test.tsx` changes as in A-8 (approved conditions: banned list `['TBD', '…', 'undefined', 'null', '[object']`; `/You: .+ · Advice: .+$/` still anchored, applied to each entry's `data-part="moves"` element text) and passes. Layout, heading, Close,
  Deal next hand, the street, board, you, advice and grade parts, and the closed/none cases are asserted as before.
- Verification: acceptance `tests/ui/review-panel.acceptance.test.tsx::the review panel lists 4 graded entries beside the table with Close and Deal next hand`

### SPEC-13: Repo checks, golden suite, coverage, boundaries, playtest
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#6, DoD#8
- Behaviour: lint, typecheck and `npm test` pass with zero errors, and the coverage thresholds hold (the new
  `src/table/*` code is unit-tested). `tests/golden/` passes 100 %. No engine, bot, advice or stats source
  changes, so the boundary tests are unaffected. No network APIs are added (SPEC-07 asserts same-origin). The
  10,000-hand playtest reports 0 invariant violations.
- Verification: command `npm run lint && npm run typecheck && npm test && npx vitest run tests/golden/ && npm run -s playtest -- --hands 10000 --seed 42`

### SPEC-14: Existing e2e flows still pass with grading during play
- Verifies: DoD#7, DoD#10
- Behaviour: The full Playwright suite passes in Chromium and WebKit, and so does the opt-in slow group
  (`rapid-pace` 300 ms bot gap, `responsive-table`). CI is green on `doit/TASK-9.3`.
- Verification: command `npm run e2e && npm run e2e:slow && gh run list --branch doit/TASK-9.3 --limit 1`

### SPEC-15: Docs and N/A items
- Verifies: DoD#9, DoD#11, DoD#12
- Behaviour: `docs/ui/review.md` describes each entry part and its source (stored decision, decision time,
  worker, A-4 chart line, plain text). `docs/storage/hand-records.md` and `docs/advice/determinism.md` no longer
  say that advice is worked out at hand end. The story doc is published to Backlog.md. DoD#9 is N/A: no new
  strategy text (the explanation and basis strings are TASK-7.10/7.13's). DoD#12 is N/A: there is no service
  worker (`serviceWorker` does not appear in `src/`).
- Verification: manual read the three docs; `backlog doc list --plain` lists the TASK-9.3 doc

## 7. Edge cases
- Preflop-only hands (call then fold; lone raise): chart lines only, no numbers (SPEC-02 rule; `CALL_THEN_FOLD`
  is covered by SPEC-10's model checks).
- A lone preflop fold: no review (unchanged `opensReview`). The grade is still requested and stored (SPEC-06).
- The user's action ends the hand (river call, last fold): the same effect run requests the grade and then
  handles `done` (rule 1, SPEC-06).
- Deal next hand clicked before the grades arrive: `reviewGraded` ignores the late result (SPEC-10). The deal
  waits for the write, as today.
- Grade request fails: A-3. `gradedDecisions` rejects (SPEC-06), and the existing failed-write path follows.
- Count or street mismatch between decisions and stored entries: RangeError (SPEC-10). Cannot occur in the app.
- 10 players, long explanations, 9 basis lines: wraps vertically, no horizontal scroll (SPEC-05).
- Resumed session: starts with no decisions and a new tracker (rule 1).
- StrictMode double effects: `requestNewGrades` only requests decisions beyond those already requested (SPEC-06
  calls it twice on the same state).
- Worker queue: a grade request delays the next bot request by the grade's compute time (about 10-400 ms,
  §9). Covered by SPEC-14.
- Concurrency across hands: trackers are keyed by hand number. A late grade cannot land in the next hand's
  record (SPEC-06).

## 8. Security considerations
- Trust boundary: stored strings (`explanation`, `opponentBasis[].text`) reach the DOM. They are rendered only
  as React text nodes, never HTML (SPEC-08). Worker replies are same-origin plain data, already shape-checked by
  `parseHandRecord` when read back.
- No new dependency, no network, no randomness, no secrets, and no change to the persisted format.

## 9. Non-functional
- Main-thread work at hand end is `storedReviewEntries` only: string formatting and `chartSpotOf`, well under
  1 ms for 10 decisions. No equity work. TASK-9.8 owns the 1 s measurement.
- Worker cost per decision: about 0.1-10 ms at 6-max (TASK-9.1 A-1) and about 400 ms for a 9-opponent postflop
  spot (measured 1.15 s for 3 spots in Node). This stays within REQ-011.1's 300 ms bot gap at 6-max (SPEC-14).
- New Vitest tests are correctness checks that run in seconds, so they stay in the normal suite. The scene
  harness grades `TEN_SEAT_SHOWDOWN` (about 1.2 s) only inside the e2e page, never at test-module import. No new
  test goes in the `TLH_SLOW_TESTS` group. No heavy equity work runs in CI's coverage job.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`, start a game, play a hand past the flop (use Hint at the flop to compare), and read
  the review entries.
- New tests (path → SPEC ids):
  - `tests/ui/review-numbers.acceptance.test.tsx` → SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-08, SPEC-09
  - `tests/table/decision-grades.test.ts` → SPEC-06, SPEC-10, SPEC-11
  - `tests/ui/review-panel.acceptance.test.tsx` (locked edit, A-8) → SPEC-12
  - `e2e/review-numbers.spec.ts` → SPEC-05, SPEC-07
- End-to-end for the Judge: `npx playwright test e2e/review-numbers.spec.ts e2e/review.spec.ts e2e/bust-continue.spec.ts e2e/hint.spec.ts e2e/hand-records.spec.ts`.
  Then, in `npm run dev`, play a hand to showdown with Hint opened at the flop. The flop entry's numbers,
  explanation and basis must match the hint card.

## 11. Open questions
- None. Q-1 answered (qa.md): the hint card's wording (D-3).

## 12. Clarifications log
See `doit/TASK-9.3/qa.md`.
