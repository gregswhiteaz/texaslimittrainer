# Spec: TASK-8.1 — Ask for a hint and see the recommended action with its numbers and reason

Status: READY (approved 2026-11-24)
Task: TASK-8.1 · Parent/epic: TASK-8 · Requirements: REQ-022 (022.2), REQ-035 (035.4), REQ-042 (042.1–.4, .6), REQ-055.6 · Dream: limit-holdem-trainer

## 1. Summary
On the user's turn the Table screen gets a Hint button next to the action buttons. Selecting it asks the
app-wide advice worker for the user-facing recommendation. The request carries the user's PlayerView and an
observed-stats snapshot that the session now builds from finished hands. A hint card then opens between the
table and the action row. It shows the recommended action, the numbers (equity and required equity after the
flop, the chart basis before it), the explanation and each opponent's range basis. Hide hint or any action
hides the card. The story also closes the TASK-7.13/3.12 follow-up: the same snapshot is stored with each user
decision, so hint, hand record and review agree. It also rewrites the bare "That is above 50.0%" sentence
(AC#12).

## 2. Scope
- In scope:
  - Session stats: per-bot style counts kept on `TableState`, updated when a hand finishes. `userObservedSnapshot(table)`
    builds the `ObservedOpponent[]` for the user's decision.
  - The snapshot goes to `applyUserAction` (stored decision) and to the hint request.
  - `AdviceClient.recommend(view, observed?)`.
  - Pure hint logic in `src/table/hint.ts`: the decision token, the open/hide/arrive/fail state machine, and the
    `HintCardView` model built from a `Recommendation`.
  - Chart-basis sentence for preflop hints (`chartBasisText`).
  - `HintCard` component; Hint / Hide hint button; Table wiring; CSS.
  - AC#12: rewrite the value-rule sentence of the `value-bet`, `check-free` and `value-raise` templates so it names
    the equity it compares.
  - Docs: `docs/ui/hint.md` (new) and `docs/advice/explanations.md` (template change and chart basis).
- Not doing:
  - The `hinted` flag in hand records (TASK-8.2). `decisionRecord` keeps writing `hinted: false`.
  - The 1-second budget for the hint card (TASK-8.3). No timing assertions are added beyond AC#9's responsiveness check.
  - Approximate and short-stack labels on the card (TASK-8.4).
  - Showing `alternative` / borderline as a separate card line. They already appear in the explanation text.
  - Persisting observed stats in the session record, or rebuilding them on resume. After a Resume they restart at 0 (Q-3); a follow-up task covers persistence.
  - Passing the snapshot to `AdviceClient.grade` (no caller needs it yet).
  - Any change to bot advice: bots never get a snapshot (`adviceOptions`, recommend.ts:33).
  - Keyboard shortcuts for Hint.
- Scope budget: files=20, lines=1300

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The snapshot has one entry per bot seat whose current bot has ≥ 1 finished hand this session, in ascending seat order: `{seat, hands: handsDealt, vpip, pfr}`. `vpip`/`pfr` come unrounded from `styleStats`. The user's seat is never included. | yes | Same rule as the playtest snapshot (src/playtest/advice-check.ts:61-73, TASK-7.15 A-1). The range code reads it only from 30 hands on (ranges.ts:624). | Include 0-hand entries; round the percentages |
| A-2 | Counts are keyed by per-session bot id (`TableState.botIds`). A replacement bot in the same seat starts at 0 hands, i.e. "typical player". | yes | "This opponent" is the bot, not the chair. TASK-7.15 A-1 resets a replaced seat the same way. | Key by seat |
| A-3 | Every finished hand counts toward each dealt-in bot's `handsDealt`, including hands the user folded early. | yes | Matches `handStyleCounts` (style-stats.ts:46) and the playtest. | Count only hands the user saw to the end |
| A-4 | Reopening the hint in the same decision reuses the card already computed. No second worker request is sent. A failed hint is re-requested on the next open. | yes | Advice is deterministic in (view, snapshot) (doc-112), so the card is identical and this saves worker time. | Re-request each time |
| A-5 | The card opens at once in a "loading" state while the worker computes. The button reads "Hide hint" from that moment. | yes | AC#7 names a hint "still being computed". Instant feedback. | Open the card only when the result arrives |
| A-6 | If the advice request rejects, the card shows an error line and the error is logged with `console.error('Hint could not be worked out', error)`. The table keeps working. | yes | Fails loudly without breaking play. Bot failures keep their existing behaviour (useTableSession.ts:166-172). | Throw into React like the bot path |
| A-7 | The Hint button has `aria-expanded` (true while the card is open) and `aria-controls="hint-card"`. The card is `<section id="hint-card" aria-label="Hint" aria-live="polite">`. | yes | Standard disclosure pattern. Storyboard uses `aria-label="Hint"` (Table.dc.html:61). | `aria-pressed` toggle |
| A-8 | AC#1's 1,000 states come from seeded sessions at 2, 6 and 10 players. Bots act by a cheap seeded random-legal policy through `stepBot(t, policy)` (session.ts:614) and the user plays check/call, so no equity runs. States are collected until there are 250 per street. | yes | Keeps the sweep in the normal suite (seconds) and out of CI's 30 s coverage risk. | Use TAG bots (advice engine on every bot action) |
| A-9 | AC#8's "50 consecutive decisions" and "10 open/hide in one decision" are proven on the hint state machine plus `TableView` rendering, with real advice for scripted states. The e2e test repeats a shorter version (3 decisions, 10 toggles) in a live browser. | yes | 50 live postflop worker runs in Playwright would cost minutes per browser. | 50 live decisions in e2e under the slow group |
| A-10 | The card sits in normal document flow inside `section.table`, after `.table-ring` and before the action row. So it cannot overlap the action row at any size. | yes | Simplest way to meet "never covers it" (REQ-042.2). Matches the storyboard order (Table.dc.html:60-73). | Absolutely positioned overlay |

## 3. Current system
- Stack: React 19 + Vite, strict TypeScript, Vitest (+ v8 coverage, thresholds in vite.config.ts:16-19: 90 % lines for
  `src/{engine,bots,advice,stats,playtest,table}`, 70 % overall), Playwright (Chromium + WebKit) with axe.
  UI unit tests use `renderToString` (no DOM), e.g. tests/ui/table-home.acceptance.test.tsx:18.
- Advice worker: `handleAdviceRequest` already accepts `observed` on `recommend` (src/table/advice-service.ts:24-30, 69-74).
  The client does not send it yet: `AdviceClient.recommend(view)` (src/ui/advice/advice-client.ts:72-74, payload
  type :20). There is one app-wide client, `sharedAdviceClient` (advice-client.ts:122-125).
- User advice options: `userAdviceOptions(observed?)` (src/advice/recommend.ts:26-30), shared by worker, record and review.
- Recommendation shapes: `PreflopRecommendation` (basis 'chart', `referenceSize`, `position`, `handClass`, `action`,
  `move`, `explanation`; src/advice/preflop.ts:34-52) has no `opponentBasis`. `PostflopRecommendation`
  (`equityPct`, `requiredEquityPct`, `opponentBasis`, `explanation`; src/advice/postflop.ts:31-66) does.
- Basis text: `basisText(n)` → 'typical player' | 'based on N hands of this opponent' (src/advice/explanations.ts:99-104).
  A snapshot is read only postflop with 6 players and ≥ 30 hands (src/advice/ranges.ts:612-628).
- Explanation templates: src/advice/explanations.ts:111-126. The bare "That is above/not above {threshold}" is in
  `value-bet`, `check-free` and `value-raise` (:113, :115, :117). Exact copies are pinned in unit tests
  tests/advice/explain.test.ts:158, 175, 192, 206 (not acceptance-locked). `formatPct` (src/advice/explain.ts:20).
- Session: `TableState` (src/table/session.ts:368-390); `nextHand` (:537-583) is the single place a finished hand rolls
  into the next (callers: useTableSession.ts:67, :75; session-record.ts:133). `applyUserAction(table, action,
  observed?)` stores a copy (:619-643). `completedHand` (:671) yields a `StatHand` (style-stats.ts:4).
- Style stats: `handStyleCounts`, `addStyleCounts`, `EMPTY_STYLE_COUNTS`, `styleStats` (src/stats/style-stats.ts:34-116).
- UI: `TableView` is presentational (src/ui/table/Table.tsx:151-239). `Table` holds review state and calls
  `useTableSession` (:246-293). `ActionBar` renders exactly the `role="group" aria-label="Your actions"` div
  (src/ui/table/ActionBar.tsx:12). Locked tests parse that div as the root
  (tests/ui/action-bar.acceptance.test.tsx:43, tests/ui/action-bar-limits.acceptance.test.tsx:54). Many e2e helpers click
  "any enabled button in Your actions" (e2e/support/paused-clock.ts:38, e2e/table.spec.ts:126).
- `act` in useTableSession.ts:222-224 calls `applyUserAction(t, action)` without a snapshot today.
- Test fixtures: `FLOP_BET` (Ben bets $4 into $26, user seat 5 = CO with A♥9♠), `RIVER` and `STORYBOARD_HISTORY`
  (tests/support/table-scenarios.ts:96-124). `TableState` literals at tests/support/table-scenarios.ts:78-93.
  `playHand`/`checkOrCall` (tests/support/session-play.ts:18-41). E2E scenes render `TableView` from fixtures
  (e2e/support/table-scenes.tsx; `openTableScene`, e2e/support/table-harness-bundle.ts:240). `delayWorkerReplies` and
  `runUntilMyTurn` (e2e/support/paused-clock.ts:34-50). `axeWithPausedClock` (:119).
- Existing code to reuse:
  - `src/stats/style-stats.ts` → `handStyleCounts`, `addStyleCounts`, `EMPTY_STYLE_COUNTS`, `styleStats` (no new stat code).
  - `src/advice/recommend.ts` → `userAdviceOptions` (tests compute the expected engine output with it).
  - `src/advice/explain.ts` → `formatPct` for the one-decimal numbers. `basisText` (re-exported) for the preflop "typical player".
  - `src/table/action-bar.ts` → `actionLabel` + `isShortAllIn` for the recommended-action text, so it matches the button label and unit.
  - `src/table/table-view.ts` → seat names (`tableView(table).seats[].name`) for the per-opponent lines.
  - `src/table/advice-service.ts` → `handleAdviceRequest` in tests as the worker's own code path.
  - `tests/support/table-scenarios.ts`, `tests/support/session-play.ts`, `e2e/support/*` helpers listed above.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The Hint button is a sibling of the "Your actions" group, inside a new `<div className="action-row">` wrapper. It is not a button inside the group. | Put Hint inside `ActionBar`'s group (storyboard markup) | Locked tests require the group to hold only action buttons (tests/ui/action-bar.acceptance.test.tsx:43). E2E helpers click any enabled button in the group (e2e/support/paused-clock.ts:38), so they would click Hint and stall. Visually still one row, as in the storyboard. | no | n/a |
| D-2 | Observed counts live on `TableState` as optional `observedCounts?: Readonly<Record<number, StyleCounts>>` (bot id → counts). `nextHand` adds the finished hand. Absent = nothing observed. | Keep counts in a React ref/state in `useTableSession`; read stored hand records | Pure and testable. Every new hand inherits it. Optional, so existing `TableState` literals (tests/support/table-scenarios.ts:78) still type-check. | no | n/a |
| D-3 | A hint belongs to one decision. The token is the `HandState` object at the user's turn (`table.hand`), which is replaced on every action. The card shows only while `state.decision === table.hand` and the bar is enabled. | Hand number + action count | Any action makes the old token stale, so the card hides and late replies are dropped with no extra bookkeeping (AC#7). | no | n/a |
| D-4 | `AdviceClient.recommend(view, observed?)` adds `observed` to the request only when it is given. | New `hint` request kind | The worker already handles `observed` (advice-service.ts:24-30). Internal API. | no | n/a |
| D-5 | Preflop per-opponent basis is built in the card model: one line per live opponent (not folded, not the user) with `basisText(null)`. `PreflopRecommendation` stays unchanged. | Add `opponentBasis` to `PreflopRecommendation` | Preflop advice never reads the snapshot (doc-113 A-4). Changing the engine shape would touch golden and grade tests for no new information. | no | n/a |
| D-6 | The chart basis sentence is authored text in `explanations.ts` (`CHART_BASIS`, `CHART_NAMES`, `CHART_POSITIONS`). It is filled by `chartBasisText(rec)` in `explain.ts`. | Build the string in UI code | Keeps all advice copy in one authored file (REQ-061.2) and keeps the UI dumb. | no | n/a |
| D-7 | Hint card copy (Q-1) and AC#12 wording (Q-2) as listed in §5 "Approved copy". After Resume, observed stats restart at 0 (Q-3); a follow-up task persists them. | Q-1/Q-2/Q-3 alternatives in qa.md | User-visible text; persisted format avoided | yes | user (Q-1, Q-2, Q-3) |

## 5. Design

### Files to create / modify
- `src/table/session.ts` — `observedCounts?` on `TableState`. `nextHand` adds the finished hand's counts per bot id. New `userObservedSnapshot(table)`.
- `src/table/hint.ts` (new) — `hintInput`, `requestHint`, the hint state machine, `HintCardView` + `hintCard`.
- `src/advice/explanations.ts` — AC#12 template rewrite. `CHART_BASIS`, `CHART_NAMES`, `CHART_POSITIONS`.
- `src/advice/explain.ts` — `chartBasisText(rec)`.
- `src/ui/advice/advice-client.ts` — `recommend(view, observed?)`.
- `src/ui/table/HintCard.tsx` (new) — presentational card.
- `src/ui/table/Table.tsx` — `hint`/`onHint` props on `TableView`, action row with Hint button, hint state in `Table`.
- `src/ui/table/useTableSession.ts` — `act` passes `userObservedSnapshot(t)`.
- `src/ui/styles.css` — `.action-row`, `.hint-toggle`, `.hint-card` styles (storyboard colours, Table.dc.html:61-71).
- `tests/support/table-scenarios.ts` — `withObserved(table, byBotId)` helper, `PREFLOP_DECISION` / `TURN_DECISION` exports (states from `STORYBOARD_HISTORY`), `TEN_SEAT_FLOP` (10 players, user to act on the flop, ≥ 2 live opponents).
- `tests/table/observed-snapshot.test.ts` (new) — SPEC-01, SPEC-02, SPEC-03.
- `tests/table/hint.test.ts` (new) — SPEC-12 (state machine units), SPEC-14.
- `tests/ui/hint.acceptance.test.tsx` (new) — SPEC-04 … SPEC-08, SPEC-10.
- `tests/ui/hint-toggle.acceptance.test.tsx` (new) — SPEC-09, SPEC-11.
- `tests/ui/hint-worker.acceptance.test.ts` (new) — SPEC-13.
- `tests/advice/value-copy.acceptance.test.ts` (new) — SPEC-15.
- `tests/advice/explain.test.ts` — re-pin the three rewritten templates. Add `chartBasisText` units (SPEC-16).
- `e2e/hint.spec.ts` (new) — SPEC-17 … SPEC-20.
- `e2e/support/table-scenes.tsx`, `e2e/support/table-harness-bundle.ts` — `ten-seat-hint` scene (TableView with a ready card).
- `docs/ui/hint.md` (new), `docs/advice/explanations.md` — story documentation.

### Components, interfaces and data
- `session.ts`
  - `TableState.observedCounts?: Readonly<Record<number, StyleCounts>>`. Key = bot id. Absent or missing key means 0 hands.
  - `nextHand(table)`: before seat replacement, take `completedHand(table)`. For each of its seats with `botId !== null`,
    set `counts[botId] = addStyleCounts(counts[botId] ?? EMPTY_STYLE_COUNTS, handStyleCounts(done, seat))`. Return the
    new record on the next state. `seatSession` and `restoreSession` leave it absent.
  - `userObservedSnapshot(table: TableState): ObservedOpponent[]`: per A-1, ascending seat. For each bot seat with
    id `table.botIds[seat]` and `c = observedCounts?.[id]` where `c.handsDealt ≥ 1`, the entry is
    `{ seat, hands: c.handsDealt, vpip: styleStats(c).vpip, pfr: styleStats(c).pfr }`. Returns a fresh array each call.
- `hint.ts` (imports no UI code)
  - `hintInput(table): { view: PlayerView; observed: ObservedOpponent[] } | null`. Null unless `nextStep(table) === 'user'`.
    `view = playerView(table.hand, config.userSeat)`, `observed = userObservedSnapshot(table)`.
  - `interface HintAdvisor { recommend(view: PlayerView, observed?: readonly ObservedOpponent[]): Promise<Recommendation> }`.
    `AdviceClient` satisfies it.
  - `requestHint(advisor, table): Promise<Recommendation>` calls `advisor.recommend(input.view, input.observed)`.
    It rejects with `RangeError("Not the user's turn")` when `hintInput` is null.
  - `interface HintState { open: boolean; decision: HandState | null; card: HintCardView | null; failed: boolean }`. `NO_HINT` is all closed/null/false.
  - `toggleHint(state, decision): { state: HintState; request: boolean }`:
    - Open on this decision: close (`open:false`, card kept), `request:false`.
    - Closed, same decision, `card !== null`: reopen, `request:false` (A-4).
    - Otherwise: `{open:true, decision, card:null, failed:false}`, `request:true`.
  - `hintArrived(state, decision, card)` / `hintFailed(state, decision)`: return `state` unchanged unless
    `state.decision === decision`. Otherwise they set `card` or set `failed:true`.
  - `shownHint(state, decision, barEnabled): 'none' | 'loading' | 'ready' | 'error'`. Returns 'none' unless
    `state.open && state.decision === decision && barEnabled`. Otherwise 'error' if failed, 'ready' if card, else 'loading'.
  - `interface HintCardView { action: string; chartBasis: string | null; equity: string | null; requiredEquity: string | null; explanation: string; opponents: readonly { seat; name; basis }[] }`.
  - `hintCard(rec, view, table): HintCardView`:
    - `action = actionLabel(rec.move, { allIn: isShortAllIn(view, rec.move), unit })`, with unit 'chips' for a sit-and-go, else 'dollars'.
    - Chart: `chartBasis = chartBasisText(rec)`, equity fields null. Opponents are the live opponents of `view` with `basisText(null)`.
    - Equity: `equity = formatPct(rec.equityPct)`, `requiredEquity = formatPct(rec.requiredEquityPct)`, `chartBasis = null`.
      Opponents come from `rec.opponentBasis` (seat order kept).
    - `explanation = rec.explanation` exactly (AC#11). `name` is the seat's display name from `tableView(table)`.
- `advice-client.ts`: `recommend(view, observed?)`. The payload is `{kind:'recommend', view}` plus `observed` only when it is defined.
- `HintCard.tsx`: `HintCard({ status, card })` renders `<section id="hint-card" aria-label="Hint" aria-live="polite" className="hint-card" aria-busy={status==='loading'}>`
  with `data-part` children: `hint-action`, `hint-chart` | (`hint-equity`, `hint-required`), `hint-explanation`, and a list
  `aria-label="Opponent ranges"` of `<li data-seat>` items. Loading and error statuses render their single line instead. Text per "Approved copy".
- `TableView` new optional props: `hint?: { status: 'loading'|'ready'|'error'; card: HintCardView | null } | null`, `onHint?: () => void`.
  - When `bar !== null` it renders `<div className="action-row">` with `<ActionBar/>` (unchanged) and then
    `<button type="button" className="hint-toggle" aria-expanded aria-controls="hint-card" disabled={!bar.enabled} onClick={onHint}>`.
    The label is "Hide hint" when `hint` is non-null, else "Hint".
  - `{hint && <HintCard/>}` renders before the action row (A-10).
- `Table`: `const [hint, setHint] = useState(NO_HINT)`. `onHint` runs `toggleHint(hint, table.hand)`. When `request` is
  true it calls `requestHint(sharedAdviceClient(createAdviceWorker), table)`, then `.then(rec => setHint(s => hintArrived(s, token, hintCard(rec, view, table))), err => { console.error(...); setHint(s => hintFailed(s, token)); })`.
  `onAct` wraps `act` and also resets to `NO_HINT`. The rendered `hint` prop is built from `shownHint(...)`.

### Rules and algorithms
- Worked example (AC#4). `FLOP_BET` with `observedCounts = {2: counts(handsDealt 45, …), 5: counts(handsDealt 12, …)}`.
  Bot ids come from `initialBotIds`: Ben (seat 2) → 2, Eli (seat 6) → 5. The snapshot is
  `[{seat:2,hands:45,…},{seat:6,hands:12,…}]`. Ben's line is BB call-raise (VPIP-scaled) → "based on 45 hands of this
  opponent". Eli has 12 < 30 → "typical player".
- Worked example (AC#3). Storyboard state after `3:fold 4:fold`: seat 5 is CO with A♥9♠, 6-max, unopened. The chart
  says raise → `chartBasisText` = "From the 6-max chart: raise A9o from the cutoff". Opponents Eli, Ava, Ben each read
  "typical player". No equity line.
- `chartBasisText(rec) = fill(CHART_BASIS, { chart: CHART_NAMES[rec.referenceSize], action: rec.action, hand: rec.handClass, position: CHART_POSITIONS[rec.position] })`.
  `CHART_BASIS = 'From the {chart} chart: {action} {hand} from {position}'`. Names and positions per "Approved copy".
- AC#12 rewrite: in the three templates, replace the second sentence's leading "That is" with an explicit subject
  (wording per "Approved copy"). Sentence count stays 3 (REQ-037). Every placeholder stays.

### Approved copy (Q-1, Q-2)
- Toggle: "Hint" / "Hide hint". Card heading: "Hint".
- Action line: "Recommended: " + the button label of the recommended move (e.g. "Recommended: Raise to $8").
- Postflop numbers: "Equity 58.0%" and "Required equity 12.5%", on one line.
- Opponent list `aria-label="Opponent ranges"`, lines "{name}: {basis}" (e.g. "Ben: based on 45 hands of this opponent").
- Loading: "Working out the hint…". Error: "The hint could not be worked out. Select Hint to try again."
- `CHART_BASIS = 'From the {chart} chart: {action} {hand} from {position}'`.
  - `CHART_NAMES`: heads-up "heads-up", 6-max "6-max", full-ring "full-ring".
  - `CHART_POSITIONS`: BTN "the button", SB "the small blind", BB "the big blind", CO "the cutoff", HJ "the hijack",
    LJ "the lojack", MP "a middle seat (MP)", UTG "an early seat (UTG)", UTG+1 "an early seat (UTG+1)".
- AC#12 copy:
  - value-bet and value-raise: "That is above {threshold}" becomes "Your equity against the hands that would call is above {threshold}".
  - check-free: "That is not above {threshold}" becomes "Your equity against the hands that would call is not above {threshold}".
  - The rest of each template is unchanged. Re-pin `tests/advice/explain.test.ts` strings one for one.

### Error handling and configuration
- `requestHint` outside the user's turn → `RangeError("Not the user's turn")`. The UI never calls it then (button disabled).
- Worker/advice rejection → card status 'error' (A-6). The next Hint selection re-requests.
- Invalid snapshot → `RangeError` from `observedBySeat` (ranges.ts:573). `userObservedSnapshot` only emits valid
  entries (whole `hands ≥ 1`, percentages 0..100), so this cannot happen from the app.
- No configuration. Hints are unlimited: no counter, limit or cost exists anywhere.

## 6. Behaviour specification

### SPEC-01: Finished hands build per-bot observed counts
- Verifies: AC#4, DoD#1
- Behaviour: Given a 6-max session, When N hands are played and rolled over with `nextHand`, Then
  `userObservedSnapshot` lists every bot seat with `hands = N` and `vpip`/`pfr` equal to
  `styleStats(styleCounts(hands, seat))`, in ascending seat order. It never lists the user's seat. Before any hand
  finishes it returns `[]`.
- Verification: unit `tests/table/observed-snapshot.test.ts::snapshot counts every finished hand per bot`

### SPEC-02: A replacement bot starts with no observed hands
- Verifies: AC#4
- Behaviour: Given a cash session where a bot busts and is replaced (new bot id), When the next hand is dealt, Then the
  snapshot has no entry for that seat until the new bot finishes a hand, and then it shows `hands: 1`.
- Verification: unit `tests/table/observed-snapshot.test.ts::replaced bot resets its observed hands`

### SPEC-03: The stored decision carries the same snapshot the hint uses
- Verifies: AC#2, DoD#1
- Behaviour: Given a table with `observedCounts`, When the user acts through the session's `act` path
  (`applyUserAction(t, a, userObservedSnapshot(t))`), Then `userDecisions.at(-1).observed` deep-equals `hintInput(t).observed`.
- Verification: unit `tests/table/observed-snapshot.test.ts::decision snapshot equals hint snapshot`

### SPEC-04: Hint button on every enabled action bar
- Verifies: AC#1, AC#10
- Behaviour: Given 1,000 seeded table states (250 each at preflop, flop, turn and river; 2, 6 and 10 players; A-8) where
  `userActionBar(table).enabled` is true, When `TableView` is rendered with `onHint`, Then each render has exactly one
  `button.hint-toggle` with text "Hint" and without `disabled`. It is outside the "Your actions" group.
- Verification: acceptance `tests/ui/hint.acceptance.test.tsx::a Hint button is present on every enabled bar`

### SPEC-05: Hint button disabled or absent when the bar is not enabled
- Verifies: AC#10
- Behaviour: Given a table before the first deal, a bot to act (e.g. `PREFLOP`, seat 6 to act) and a finished hand
  (`SHOWDOWN`), When rendered, Then before the deal there is no Hint button. In the other two the Hint button has
  `disabled` and no card is rendered.
- Verification: acceptance `tests/ui/hint.acceptance.test.tsx::Hint is disabled or absent when the bar is idle`

### SPEC-06: Postflop card equals the engine output for view and snapshot
- Verifies: AC#2, AC#11
- Behaviour: Given the storyboard flop (`FLOP_BET`, Ben bets $4 into $26), turn and river user decisions with Ben observed
  for 45 hands, When the hint is computed through `handleAdviceRequest({kind:'recommend', ...hintInput(t)})` and the card is
  rendered in `TableView`, Then the result deep-equals `recommend(view, userAdviceOptions(expectedSnapshot))`. The
  expected snapshot is written literally in the test. The card shows that result's action label, `equityPct` and
  `requiredEquityPct` with exactly one decimal (`/^\d{1,3}\.\d%$/`), its explanation verbatim, and Ben's line with
  `rec.opponentBasis` text for seat 2.
- Verification: acceptance `tests/ui/hint.acceptance.test.tsx::postflop hint shows the engine numbers, explanation and basis`

### SPEC-07: Preflop card shows the chart basis and no numbers
- Verifies: AC#3, AC#11
- Behaviour: Given the storyboard preflop decision (seat 5, CO, A♥9♠, unopened 6-max), When the hint card renders,
  Then it contains "From the 6-max chart: raise A9o from the cutoff" and the engine's `explanation` verbatim. Each live
  opponent (Eli, Ava, Ben) reads "typical player". There is no `hint-equity`/`hint-required` element and no `%` in the card
  outside the explanation.
- Verification: acceptance `tests/ui/hint.acceptance.test.tsx::preflop hint shows the chart basis instead of equity`

### SPEC-08: Per-opponent basis follows the observed hand count
- Verifies: AC#4
- Behaviour: Given `FLOP_BET` with Ben (bot id 2) observed for 45 hands and Eli (bot id 5) for 12, When the hint renders,
  Then Ben's line contains "based on 45 hands of this opponent" and Eli's contains "typical player".
- Verification: acceptance `tests/ui/hint.acceptance.test.tsx::multiway basis shows 45 hands and typical player`

### SPEC-09: Hide hint closes the card and restores the label
- Verifies: AC#6
- Behaviour: Given the card open with a ready card on `FLOP_BET`, When `toggleHint` runs for the same decision (the Hide
  hint button), Then `TableView` renders no `#hint-card` and the toggle reads "Hint" with `aria-expanded="false"`. While open
  it reads "Hide hint" with `aria-expanded="true"`.
- Verification: acceptance `tests/ui/hint-toggle.acceptance.test.tsx::Hide hint hides the card and the button reads Hint`

### SPEC-10: Any action hides the card, including one still computing
- Verifies: AC#7
- Behaviour: Given the hint open (ready) or loading on a decision, When the user takes each of fold/check/call/bet/raise
  (`applyUserAction` → new `table.hand`), Then `shownHint` is 'none' for the new state. A late `hintArrived` for the old
  decision leaves it 'none'. At the user's next decision (later street of the same hand, and next hand) no card is
  rendered until `toggleHint` runs again.
- Verification: acceptance `tests/ui/hint.acceptance.test.tsx::acting hides the hint and the next decision starts closed`

### SPEC-11: Hints are unlimited and free
- Verifies: AC#8
- Behaviour: Given 50 consecutive user decisions from seeded hands, When the hint is opened at each (real
  `handleAdviceRequest` result), and 10 open/hide cycles are run within one decision, Then every open renders a card with
  an action and explanation. The rendered page never matches `/\b(limit|remaining|left|cost|free hints?|\d+\s*(of|\/)\s*\d+\s*hints?)\b/i`
  outside the explanation text.
- Verification: acceptance `tests/ui/hint-toggle.acceptance.test.tsx::the hint opens at 50 decisions and 10 times in one with no limit or cost`

### SPEC-12: Hint state machine rules
- Verifies: AC#6, AC#7, DoD#1
- Behaviour: Units for `toggleHint` (open/close/reopen-from-cache with `request:false`, failed → `request:true`),
  `hintArrived`/`hintFailed` ignoring a stale decision, and `shownHint` precedence (none/error/ready/loading).
- Verification: unit `tests/table/hint.test.ts::hint state machine`

### SPEC-13: Hint advice is computed in the worker with the snapshot
- Verifies: AC#9, AC#2
- Behaviour: Given an `AdviceClient` over a `MessageChannel` with `installAdviceWorker` on the other port (as in
  tests/ui/advice-worker.acceptance.test.ts), When `requestHint(client, FLOP_BET with observed)` runs, Then exactly one
  message `{kind:'recommend', view, observed}` crosses the channel with `observed` equal to `userObservedSnapshot`. The
  promise resolves deep-equal to `recommend(view, userAdviceOptions(observed))`. `requestHint` outside the user's turn
  rejects with RangeError and posts nothing.
- Verification: acceptance `tests/ui/hint-worker.acceptance.test.ts::hint requests go to the advice worker with the snapshot`

### SPEC-14: Card model formatting
- Verifies: AC#2, AC#3, AC#11
- Behaviour: `hintCard` uses `actionLabel` with the all-in prefix for a short all-in move, chips for a sit-and-go and
  dollars for cash. It formats `equityPct` 12 → "12.0%" and keeps the explanation byte-identical.
- Verification: unit `tests/table/hint.test.ts::hint card model`

### SPEC-15: Value-rule sentence names the equity it compares
- Verifies: AC#12
- Behaviour: Given a check-free recommendation with `equityPct` 60.0 and `equityVsCallingRangePct` 45.0 (and value-bet /
  value-raise cases), When `explainPostflop` builds the explanation, Then the sentence that contains "50.0%" names the
  equity against the hands that would call (contains "hands that would call") and does not start with "That". The
  explanation still has 3 sentences.
- Verification: acceptance `tests/advice/value-copy.acceptance.test.ts::the 50% comparison names the calling-range equity`

### SPEC-16: Chart basis text for every chart and position
- Verifies: AC#3, DoD#9
- Behaviour: `chartBasisText` gives the exact "Approved copy" sentence for heads-up, 6-max and full-ring and every `Position`. All
  `CHART_POSITIONS` keys match the `Position` union.
- Verification: unit `tests/advice/explain.test.ts::chartBasisText`

### SPEC-17: The card never overlaps the action row on a 10-seat table at 1280×720
- Verifies: AC#5
- Behaviour: Given the `ten-seat-hint` scene (TableView of `TEN_SEAT_FLOP` with a ready card) at viewport 1280×720, When
  laid out, Then the `#hint-card` bounding box does not intersect the bounding box of the "Your actions" group nor the
  Hint button. Every action button passes `click({ trial: true })` (visible, enabled, not covered).
- Verification: acceptance `e2e/hint.spec.ts::hint card never covers the action bar on a 10-seat table`

### SPEC-18: Live table: open, hide, act
- Verifies: AC#6, AC#7, AC#10, DoD#7
- Behaviour: Given the app at `/` with pinned replay words and a paused clock, When it is the user's turn and Hint is
  selected, Then the Hint card appears with an action and an explanation and the button reads "Hide hint". Hide hint
  removes it and the button reads "Hint". Opening it again and then selecting an action button removes it. At the next
  user decision no card is shown and the button reads "Hint". Runs in Chromium and WebKit. Axe reports no serious or
  critical violations with the card open.
- Verification: acceptance `e2e/hint.spec.ts::Hint opens, hides and closes on an action`

### SPEC-19: Table stays responsive while a hint computes
- Verifies: AC#9, AC#7
- Behaviour: Given every worker reply delayed 2,000 ms (`delayWorkerReplies`), When Hint is selected, Then the card shows
  its loading line. Before any reply arrives, an action button can be clicked and the table's `data-action-count`
  increases. When the delayed hint reply arrives later, no card appears.
- Verification: acceptance `e2e/hint.spec.ts::a hint still computing never blocks the table or reappears after acting`

### SPEC-20: Repeated hints in the browser
- Verifies: AC#8
- Behaviour: Given the live table, When Hint is opened at 3 consecutive user decisions and toggled 10 times within
  one, Then the card shows each time and the page shows no hint counter, limit or cost text.
- Verification: acceptance `e2e/hint.spec.ts::hints are unlimited in the browser`

### SPEC-21: Repository gates
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#10
- Behaviour: lint, typecheck and the full test suite pass with coverage thresholds. The golden-spot suite
  (tests/golden/) passes. `src/table/hint.ts` and `src/advice/*` import nothing from `src/ui` or browser globals. CI is green on the branch.
- Verification: command `npm run lint && npm run typecheck && npm test && npx vitest run tests/golden/ && ! grep -rE "from '\.\./(\.\./)?ui/|from 'react" src/table/hint.ts src/advice src/stats && gh run list --branch doit/TASK-8.1 --limit 1`

### SPEC-22: Playtest invariants unchanged
- Verifies: DoD#6
- Behaviour: A 10,000-hand playtest reports zero invariant violations. Bots are untouched; only advice copy changed.
- Verification: command `npm run -s playtest -- --hands 10000 --seed 42`

### SPEC-23: No new network requests, offline N/A, docs published
- Verifies: DoD#8, DoD#11, DoD#12
- Behaviour: The hint uses only the bundled worker (no fetch). No new dependencies in package.json. `docs/ui/hint.md` and
  the explanations doc are written and the story documentation is published to Backlog.md. DoD#12 is N/A: the offline
  service worker (E13-S07) does not exist yet.
- Verification: manual `git diff main -- package.json` is empty; `grep -rn "fetch(" src/table/hint.ts src/ui/table` is empty; `backlog doc list --plain` shows the TASK-8.1 doc

## 7. Edge cases
- Before the first deal: no bar, so no Hint button (SPEC-05).
- Bot to act or hand over: Hint disabled, card hidden (SPEC-05, `shownHint` barEnabled).
- Decision changes while computing: a stale reply is dropped (SPEC-10, SPEC-19).
- Reopen within a decision: cached, no new request (A-4, SPEC-12). After a failure it re-requests.
- Worker failure: error line (A-6, SPEC-12).
- Replaced bot: reset to 0 hands (SPEC-02). The user seat is never in the snapshot (SPEC-01).
- Fewer than 30 hands, non-6-max tables, preflop: "typical player" (engine rule, ranges.ts:612-628; SPEC-07, SPEC-08).
- Sit-and-go amounts in chips and short all-in labels on the recommended action (SPEC-14).
- Heads-up and full-ring chart basis wording (SPEC-16).
- 10-seat layout (SPEC-17).
- Resumed session: observed stats restart at 0 (Q-3). `restoreSession` leaves `observedCounts` absent. Unit-checked in SPEC-02's file as `restored session starts with an empty snapshot`.
- Concurrency with bot requests: the shared client matches replies by id (advice-client.ts:37-49), so hint and bot
  requests interleave safely. Nothing new is needed.

## 8. Security considerations
- Trust boundary: the worker message. `observed` is validated in the worker by `observedBySeat` (ranges.ts:573-590). The
  response is matched by id.
- Hidden information: the snapshot holds only public action stats of finished hands. The view is the user's own
  PlayerView. No opponent hole cards reach the hint.
- No authn/authz, secrets, injection surfaces or logging of sensitive data. The explanation is rendered as text
  (React escaping, no `dangerouslySetInnerHTML`).
- No new dependencies and no network. No randomness added in app code (test seeds only).

## 9. Non-functional
- Responsiveness: advice runs in the worker (SPEC-13). The table accepts an action while a 2 s delayed hint is pending (SPEC-19).
- Test cost: SPEC-04 does no equity work (A-8). SPEC-06/08/11/13 run a bounded number of postflop recommends: 3 storyboard
  decisions plus up to 50 seeded decisions, mostly preflop and cheap. Target < 20 s for each test file under `npm test`
  coverage. Use per-test timeouts of 60 s and no `TLH_SLOW_TESTS` gating, as these are correctness checks. If a file
  exceeds the target, reduce SPEC-11's postflop share rather than gate it. Pure timing checks for the 1 s target belong to TASK-8.3.
- Footprint: the snapshot is O(bots) per decision. Counts update O(actions) per hand.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev` then open the app, New game → Start game, and select Hint on your turn
- New tests:
  - `tests/table/observed-snapshot.test.ts` → SPEC-01, 02, 03
  - `tests/table/hint.test.ts` → SPEC-12, 14
  - `tests/ui/hint.acceptance.test.tsx` → SPEC-04, 05, 06, 07, 08, 10
  - `tests/ui/hint-toggle.acceptance.test.tsx` → SPEC-09, 11
  - `tests/ui/hint-worker.acceptance.test.ts` → SPEC-13
  - `tests/advice/value-copy.acceptance.test.ts` → SPEC-15
  - `tests/advice/explain.test.ts` (re-pinned + new) → SPEC-16
  - `e2e/hint.spec.ts` → SPEC-17, 18, 19, 20
- End-to-end for the Judge: `npx playwright test e2e/hint.spec.ts`. Then `npm run dev`, start a 6-max cash game, and on
  your turn select Hint. Check that a preflop card shows "From the 6-max chart: …" with no percentages, and that a
  postflop card shows Equity/Required equity to one decimal, the explanation and one basis line per live opponent.
  Select Hide hint, then reopen and fold: the card goes and does not return at the next decision.

## 11. Open questions
- None. Q-1, Q-2 and Q-3 are answered in `doit/TASK-8.1/qa.md` (recommended options, 2026-11-24).

### Hook-locked tests the build must edit
- None expected. Checked against every `locked_tests` entry in `doit/*/state.json`:
  - `tests/ui/action-bar.acceptance.test.tsx` and `tests/ui/action-bar-limits.acceptance.test.tsx` (TASK-3.2, TASK-3.7) stay
    green because `ActionBar` is unchanged (D-1).
  - `tests/ui/table.acceptance.test.tsx` (TASK-3.1) counts one button before the first deal; no Hint button renders without a bar.
  - The "That is" strings are pinned only in unlocked `tests/advice/explain.test.ts` and `tests/advice/postflop.test.ts`
    (test titles only).
  - The golden files (TASK-7.11/7.14) and `tests/advice/explanations.acceptance.test.ts` (TASK-7.10) do not contain them.
- If the build finds a locked test that must change, it stops and reports the file and its owner task. It does not edit the file.

## 12. Clarifications log
See `doit/TASK-8.1/qa.md`.
