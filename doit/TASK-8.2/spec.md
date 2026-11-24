# Spec: TASK-8.2 — Mark a decision as hinted when I open the hint

Status: READY (no questions; A-1..A-5 assumed)
Task: TASK-8.2 · Parent/epic: TASK-8 · Requirements: REQ-036 (036.2), REQ-040 (040.1), REQ-042 (042.5) · Dream: limit-holdem-trainer

## 1. Summary
If the user opens the hint card at a decision before acting, that decision's entry in the hand record gets
`hinted: true`. This holds even if the card was hidden again or opened several times. Every other entry stays
`hinted: false`. Hinted decisions are still graded as usual. The stored advice for a hinted decision equals what
the card showed, because both use the decision-time observed-stats snapshot. The flag travels on the session's
`UserDecision` and comes from the Table's existing hint state. `decisionRecord` then writes it.

## 2. Scope
- In scope:
  - `UserDecision.hinted?` and a 4th `hinted` parameter on `applyUserAction` (`src/table/session.ts`).
  - `decisionRecord` writes `hinted` from the decision (`src/table/hand-record.ts`).
  - `hintedAt(state, decision)` in `src/table/hint.ts`: true iff the hint was opened at this decision.
  - `useTableSession.act(action, hinted?)` and `Table`'s `onAct`, which passes `hintedAt(hint, table.hand)`.
  - Tests: a domain acceptance file, `hintedAt` units and one Playwright file that reads the stored records.
  - Docs: `docs/storage/hand-records.md` (the `hinted` row) and `docs/ui/hint.md` (a "Hinted decisions" section).
- Not doing:
  - Showing a "hinted" tag in the review, or a `hinted` field on `ReviewEntry`. That is TASK-9.6 (E09-S05).
  - The cross-epic Playwright flow "open Hint at the flop, call, hand ends, the review's flop entry shows
    'hinted'". TASK-9.6 finishes second, so TASK-9.6 adds it. This story's e2e test checks the stored record.
  - Hint-usage reporting (E10) and leaving hinted decisions out of the G-2 major-error rate (E11).
  - Any change to the hand-record format, parser or validation. `hinted` is already a stored boolean
    (src/table/hand-record.ts:69, :403).
  - Persisting `hinted` in the session record. A resumed session restarts its hand with `userDecisions: []`
    (src/table/session-record.ts:231).
  - Any change to grading, advice, the hint card UI or its copy.
- Scope budget: files=10, lines=600

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Selecting Hint at a decision makes it hinted even if the card is still loading or the request failed when the user acts. | yes | REQ-040.1 says "requested a hint before acting". The story says "opened". Both refer to the user's request, not to whether the reply arrived. | Hinted only once a ready card was shown |
| A-2 | `UserDecision.hinted` is optional and written only when true (`{ view, action[, observed], hinted: true }`). An unhinted decision keeps its current shape. | yes | Locked tests deep-compare unhinted decisions and records (e.g. tests/table/decision-record.acceptance.test.ts:134, :146). They stay green unchanged. Same pattern as `observed` (src/table/session.ts:680-683). | Always write `hinted: false` |
| A-3 | `applyUserAction(table, action, observed?, hinted = false)` takes a 4th positional parameter. | yes | Every existing caller passes 2–3 args (grep `applyUserAction(`), so none change. Matches the current positional `observed`. | Options object |
| A-4 | AC#5's "equity 10 points below required equity" is tested as a real-engine flop call with `requiredEquityPct − equityPct ≥ 10`, graded `major` by `call-fold-margin`. The test asserts these preconditions. | yes | `decisionRecord` uses the real equity engine (hand-record.ts:162), so exactly 10.0 can't be pinned. The ≥ 10 boundary itself is already locked (tests/advice/grade.acceptance.test.ts:207-222). | Stub equity through a new seam |
| A-5 | The e2e test looks for a user flop decision under TASK-3.1's pinned replay words. It plays at most 5 hands (check/call) and fails if none reaches one. | yes | Bot play is seeded, so the hand chosen is deterministic. The bound keeps the test from running on forever. | Scene harness with a fixture state (no live records) |

## 3. Current system
- Stack: React 19 + Vite, strict TS, Vitest with v8 coverage (`npm test` = `vitest run --coverage`, package.json:13),
  Playwright (Chromium + WebKit). UI unit tests use `renderToString` and can't click, so the live Table wiring is
  proven in Playwright.
- `UserDecision { view, action, observed? }` (src/table/session.ts:369-374). `applyUserAction(table, action, observed?)`
  appends it, adding `observed` only when given (:665-686). `completedHand` passes `userDecisions` through (:740).
- `decisionRecord({ view, action, observed })` hard-codes `hinted: false` in both branches (src/table/hand-record.ts:161-197).
  `handRecord` maps `hand.userDecisions` through it (:229). The parser already requires a boolean `hinted` (:403).
- Hint state: `HintState { open, decision, card, failed }`, with `NO_HINT` (src/table/hint.ts). `toggleHint` sets
  `decision` to the `HandState` token on first open and keeps it when hidden. `decision` is reset only by
  `NO_HINT`. `Table.onAct` resets the hint to `NO_HINT` and calls `act` (src/ui/table/Table.tsx:322-328).
- `useTableSession.act` applies `applyUserAction(t, action, userObservedSnapshot(t, observed.current))` in a
  `setTable` updater (src/ui/table/useTableSession.ts:232-238). Observed counts live in a ref. They change only
  when a hand is done (`countObserved`, :204), after `handWrite` has built the record (:194). The hint request
  reads the same counts (`requestHint(…, observedCounts())`, Table.tsx:314). So hint and stored decision share
  one snapshot within a decision.
- Fixtures: `userTableAfter(fixed, moves, button, stacks, observed?)` (tests/support/table-scenarios.ts:221-251).
  Others: `REVIEW_DECK` (:254, user A♥9♠, Ben K♦7♣, board K♠9♦4♣2♥6♠) and
  `LIMP_THEN_BET = '3:fold 4:fold 5:call 6:fold 1:fold 2:check 2:bet'` (:328), plus `observedStyle(handsDealt,
  voluntary, preflopRaised)` (:134). `handleAdviceRequest` is the worker's own code path (src/table/advice-service.ts).
- E2E: the records harness renders the live `Table` with the real store and worker. Its log includes
  `__records.observed`, one array per hand with an entry per user decision (e2e/support/records-harness.tsx:16-25, :84-86).
  `storedRecords(page)`, `playToResult` and `advanceToHand` are in e2e/support/hand-records.ts:80, :128, :148.
  `runUntilMyTurn` is in e2e/support/paused-clock.ts:35. The open-ready-hint and check-or-call pattern is in
  e2e/hint-observed.spec.ts:43-56. The pinned `WORDS` are in e2e/hint-observed.spec.ts:12.
- Existing code to reuse:
  - `src/table/hint.ts` → `toggleHint`, `NO_HINT`, `hintCard` (tests drive the real state machine and card model).
  - `src/table/session.ts` → `userObservedSnapshot`, `countObserved`, `completedHand`.
  - `src/table/hand-record.ts` → `handRecord`, `parseHandRecord`.
  - `src/storage/hand-store.ts` → `openHandStore(new IDBFactory())` round trip, as in tests/table/decision-record.acceptance.test.ts:50-56.
  - `src/advice/recommend.ts` → `userAdviceOptions`, `recommend` (the 30-hand control in AC#6).
  - `tests/support/table-scenarios.ts` → `userTableAfter`, `REVIEW_DECK`, `observedStyle`, `fixedDeck`.
  - `e2e/support/*` helpers listed above. Copy the small `openReadyHint` / `checkOrCall` helpers, as hint-observed.spec.ts does.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The hinted flag comes from `Table`'s `HintState`: `hintedAt(hint, table.hand)` = `hint.decision !== null && hint.decision === table.hand`. It is passed through `act(action, hinted)` into the stored `UserDecision`. | Keep a "hinted" set in `useTableSession`; put the flag on `TableState` | The hint state already ties one hint to one decision token. It survives Hide and is reset by every action (D-3 of TASK-8.1). No new state is needed. | no | n/a |
| D-2 | `decisionRecord` writes `hinted: decision.hinted === true`. Grading is untouched, so a hinted decision keeps its grade (AC#5). | Separate "hinted" grade | REQ-040.1: graded as usual, only marked. | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/session.ts` — `UserDecision.hinted?: boolean`. Add `hinted = false` as a 4th parameter of `applyUserAction`.
- `src/table/hand-record.ts` — `decisionRecord` writes `hinted` from the decision. Update the `hinted` doc comment (:68).
- `src/table/hint.ts` — `hintedAt(state, decision)`.
- `src/ui/table/useTableSession.ts` — `act(action, hinted?)`.
- `src/ui/table/Table.tsx` — `onAct` passes `hintedAt(hint, table.hand)` (deps include `hint`, `table.hand`).
- `tests/support/table-scenarios.ts` — optional 6th parameter `hints` on `userTableAfter` (see below).
- `tests/table/hinted.acceptance.test.ts` (new) — SPEC-01 … SPEC-05.
- `tests/table/hint.test.ts` — `hintedAt` units (SPEC-06).
- `e2e/hinted.spec.ts` (new) — SPEC-07, SPEC-08.
- `docs/storage/hand-records.md`, `docs/ui/hint.md` — story documentation (SPEC-10).

### Components, interfaces and data
- `session.ts`
  - `interface UserDecision { view; action; observed?; /** True iff the hint was opened at this decision before acting (TASK-8.2); absent otherwise. */ readonly hinted?: boolean }`.
  - `applyUserAction(table, action, observed?, hinted = false)`. The appended decision is
    `{ view, action }`, plus `observed: copy` when `observed !== undefined`, plus `hinted: true` when `hinted`.
    It never writes `hinted: false`. Errors are unchanged.
- `hand-record.ts`: `decisionRecord` destructures `hinted` and writes `hinted: hinted === true` in both branches.
- `hint.ts`: `export function hintedAt(state: HintState, decision: HandState | null): boolean`. The result is
  `decision !== null && state.decision === decision`. It ignores `open`, `card` and `failed` (A-1). Pure, no UI imports.
- `useTableSession.ts`: `act: (action: Action, hinted?: boolean) => void`. In the updater call
  `applyUserAction(t, action, userObservedSnapshot(t, observed.current), hinted === true)`.
- `Table.tsx`: `onAct = useCallback((action) => { const hinted = hintedAt(hint, table.hand); setHint(NO_HINT); act(action, hinted); }, [act, hint, table.hand])`.
- `tests/support/table-scenarios.ts`: `userTableAfter(fixed, moves, button = 6, stacks = {}, observed?, hints: Readonly<Record<number, number>> = {})`.
  `hints[i]` is the number of Hint/Hide selections at the user's i-th decision (0-based). Before applying that
  decision the helper starts from `NO_HINT` and runs `toggleHint(state, hand)` that many times. It then calls
  `applyUserAction(table, action, observed, hintedAt(state, table.hand))`. With `hints` omitted the behaviour is unchanged.

### Rules and algorithms
- Worked example (AC#1, AC#3). The deck is `REVIEW_DECK`. The moves are `HINT_FLOP_MOVES = LIMP_THEN_BET + ' 5:call 2:check 5:check 2:check 5:check'`.
  The user makes 4 decisions: preflop call (limp), flop call of Ben's $4 bet, turn check, river check. The hand
  goes to showdown. With `hints = {1: 1}` the stored decisions read `hinted` = `[false, true, false, false]`.
- AC#2: `hints = {1: 2}` (open, hide) gives the same result. AC#4: `hints = {1: 5}` (open, hide, open, hide, open) gives
  exactly 4 entries, and exactly one of them (index 1) is hinted.
- AC#6. Let `botId = table.botIds[2]` (Ben) and `counts = { [botId]: observedStyle(29, 15, 4) }`.
  `snapshot = userObservedSnapshot(flopTable, counts)` is `[{ seat: 2, hands: 29, … }]`, where `flopTable` is the
  state at the user's flop decision. The hint card is
  `hintCard(rec, view, flopTable)`, with `rec` from `handleAdviceRequest({ kind: 'recommend', view, observed: snapshot })`.
  The finished hand gives `countObserved(counts, done)[botId].handsDealt === 30`. The flop entry has
  `recommended` equal to `rec.move`, the same `equityPct` and `requiredEquityPct` (so `formatPct` of each equals
  `card.equity` / `card.requiredEquity`), and the same `explanation` (= `card.explanation`). Its `opponentBasis`
  texts equal `card.opponents[].basis` in seat order, with Ben's reading "typical player". Control:
  `recommend(view, userAdviceOptions(snapshotAt30))` gives Ben `observedHands: 30`, which differs from the stored entry.

### Error handling and configuration
- No new errors. `applyUserAction` still throws `RangeError("Not the user's turn")` or an illegal-action RangeError,
  whatever `hinted` is.

## 6. Behaviour specification

### SPEC-01: Hint opened at the flop marks only the flop entry
- Verifies: AC#1, AC#3, DoD#1
- Behaviour: Given `userTableAfter(REVIEW_DECK, HINT_FLOP_MOVES, 6, {}, undefined, {1: 1})` (Hint opened once at the
  flop decision, then the user calls), When the hand's record is built with `handRecord`, stored with
  `openHandStore(new IDBFactory())` and read back, Then `decisions.map(d => d.street)` is `['preflop','flop','turn','river']`,
  `decisions[1].action.type` is `'call'`, and `decisions.map(d => d.hinted)` is `[false, true, false, false]`.
- Verification: acceptance `tests/table/hinted.acceptance.test.ts::hint opened at the flop marks only the flop entry hinted`

### SPEC-02: Opened then hidden still counts
- Verifies: AC#2, DoD#1
- Behaviour: Given `hints = {1: 2}` (Hint, then Hide hint, before calling), When the record is read back, Then
  `decisions[1].hinted` is `true` and the others are `false`.
- Verification: acceptance `tests/table/hinted.acceptance.test.ts::a hint hidden again before acting still marks the decision hinted`

### SPEC-03: Three opens give one hinted entry
- Verifies: AC#4, DoD#1
- Behaviour: Given `hints = {1: 5}` (three opens with two hides between them), When the record is read back, Then it
  has exactly 4 decisions and `decisions.filter(d => d.hinted)` has length 1, with that one at index 1 (street `'flop'`).
- Verification: acceptance `tests/table/hinted.acceptance.test.ts::opening the hint three times at one decision gives one hinted entry`

### SPEC-04: A hinted bad call is still graded Major error
- Verifies: AC#5, DoD#1
- Behaviour: Given a deck where the user (seat 5) holds junk and calls Ben's flop bet (`LIMP_THEN_BET + ' 5:call …'` to
  the end of the hand, e.g. user 7♣ 2♦ on an A-K-Q flop; the builder picks the cards), with Hint opened at that flop
  decision, When the record is read back, Then the flop entry has `hinted: true`, `grade.grade: 'major'`,
  `grade.ruleId: 'call-fold-margin'` and `requiredEquityPct − equityPct ≥ 10` (asserted as preconditions, A-4).
  The entry also equals the same decision's record built without a hint, except for `hinted`. Grading is unaffected.
- Verification: acceptance `tests/table/hinted.acceptance.test.ts::a hinted call 10 points short is still graded Major error`

### SPEC-05: Stored advice equals the hint card across the 29 → 30 boundary
- Verifies: AC#6, DoD#1
- Behaviour: Given the AC#6 worked example (Ben at 29 observed hands, Hint opened at the flop, card built from the
  worker's `recommend` reply with that snapshot, the user calls and the hand ends so Ben reaches 30), When the
  record is read back, Then the flop entry's `hinted` is `true`. Its `recommended` equals `rec.move` and
  `actionLabel(recommended, { allIn: isShortAllIn(view, recommended), unit: 'dollars' })` equals `card.action`.
  `formatPct(equityPct)`
  equals `card.equity`, `formatPct(requiredEquityPct)` equals `card.requiredEquity`, `explanation` equals
  `card.explanation`, and the `opponentBasis[].text` equal `card.opponents[].basis`. Ben's text is "typical player"
  and the 30-hand control differs.
- Verification: acceptance `tests/table/hinted.acceptance.test.ts::stored advice of a hinted decision equals the hint card after the opponent reaches 30 hands`

### SPEC-06: hintedAt and applyUserAction units
- Verifies: AC#1, AC#2, AC#4, DoD#1
- Behaviour: Given the hint state machine and `applyUserAction`, When each case below runs, Then:
  - `hintedAt(NO_HINT, hand)` is false, and `hintedAt(s, null)` is false.
  - After `toggleHint(NO_HINT, h)`, `hintedAt` is true for `h` and false for another `HandState`. This holds while
    loading, after `hintFailed` (A-1), after a hide, and after 3 open/hide cycles.
  - `applyUserAction(t, a, undefined, true)` appends `{ view, action, hinted: true }`. `applyUserAction(t, a)` and
    `applyUserAction(t, a, undefined, false)` append an object with no `hinted` key (A-2).
  - `decisionRecord` returns `hinted: true` for a hinted decision and `false` otherwise.
- Verification: unit `tests/table/hint.test.ts::hintedAt`

### SPEC-07: Live table stores hinted for the flop decision only
- Verifies: AC#1, AC#3, DoD#1
- Behaviour: Given the records harness with TASK-3.1's pinned words and a paused clock, the user plays check/call.
  At the user's first decision with 3 board cards (looking through hands 1–5, A-5) the user selects Hint, waits
  for a ready card, then checks or calls. When that hand's result is shown and its record is in `storedRecords(page)`,
  Then in that record exactly the entry at the index of the hinted action has `hinted: true`, that entry's
  `street` is `'flop'`, and every other entry (at least the preflop one) has `hinted: false`. The number of
  entries equals that hand's `__records.observed` length.
- Verification: acceptance `e2e/hinted.spec.ts::opening Hint at the flop stores only the flop decision as hinted`

### SPEC-08: Live table: open/hide three times, one hinted entry
- Verifies: AC#2, AC#4, DoD#1
- Behaviour: Given the records harness at the user's first decision of hand 1, When the user selects Hint, Hide hint,
  Hint, Hide hint, Hint, Hide hint (the card ends hidden, `button.hint-toggle` reads "Hint"), then checks or calls
  and the hand ends, Then the stored record's `decisions[0].hinted` is `true`. It is the only entry with `hinted: true`,
  and the entry count equals the hand's `__records.observed` length (one entry per decision).
- Verification: acceptance `e2e/hinted.spec.ts::a hint opened three times and hidden again marks one decision hinted`

### SPEC-09: Repo checks, golden suite, coverage, boundaries, network, playtest
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#6, DoD#8
- Behaviour: lint, typecheck and `npm test` pass with zero errors and the coverage thresholds hold. `tests/golden/`
  passes 100%. `src/table/hint.ts` stays free of UI imports (boundary test). No network APIs are added. The
  10,000-hand playtest reports 0 invariant violations: bots never pass `hinted`, so it is unaffected.
- Verification: command `npm run lint && npm run typecheck && npm test && npx vitest run tests/golden/ && npm run -s playtest -- --hands 10000 --seed 42`

### SPEC-10: Docs, N/A items and CI
- Verifies: DoD#7, DoD#9, DoD#10, DoD#11, DoD#12
- Behaviour: `docs/storage/hand-records.md:87` says `hinted` is true iff the hint was opened at that decision before
  acting (TASK-8.2). `docs/ui/hint.md` gains a "Hinted decisions" section covering open, hide, multiple opens and
  failed/loading (A-1). The story doc is published to Backlog.md. DoD#7 and DoD#12 are N/A: no screen markup,
  copy or style changes (`git diff main -- src/ui/styles.css` and the rendered TableView output are unchanged).
  DoD#9 is N/A: no strategy content. CI is green on `doit/TASK-8.2`.
- Verification: manual `gh run list --branch doit/TASK-8.2 --limit 1` shows success; read both docs

## 7. Edge cases
- Hint opened at the preflop decision only: `onAct` resets to `NO_HINT`, so later decisions are not hinted (SPEC-01 covers the reverse).
- Hint still loading or failed when the user acts: hinted (A-1, SPEC-06).
- A late hint reply after the action: `hintArrived` ignores it (existing). It can't change a stored decision.
- Several opens at one decision: one decision, one entry (SPEC-03, SPEC-08).
- A hand with no user decision: `decisions: []`, unchanged.
- Hint button disabled while the bar is disabled (Table.tsx:244), so no hint can be opened off-turn.
- Resume mid-hand: the hand restarts with no decisions (session-record.ts:231), so there is no stale flag.
- Concurrency: the `act` updater is pure. A StrictMode double call gives the same result.

## 8. Security considerations
- No new trust boundary. `hinted` is a boolean set by app code. Stored records are already validated on read
  (hand-record.ts:403). No new dependencies, network, secrets or randomness.

## 9. Non-functional
- No runtime cost beyond one boolean per decision. The new Vitest file runs a handful of hands with real equity on
  4 postflop decisions each. Target < 10 s under coverage, in the normal suite (correctness, not speed). The e2e
  file plays at most 5 hands per test with a paused clock.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`, then start a 6-max cash game. On a flop decision select Hint, then call. After the
  hand, inspect IndexedDB `hands` in devtools: only the flop entry has `hinted: true`.
- New tests:
  - `tests/table/hinted.acceptance.test.ts` → SPEC-01, 02, 03, 04, 05
  - `tests/table/hint.test.ts` (added cases) → SPEC-06
  - `e2e/hinted.spec.ts` → SPEC-07, 08
- End-to-end for the Judge: `npx playwright test e2e/hinted.spec.ts`

## 11. Open questions
- None.

### Hook-locked tests the build must edit
- None expected. Checked every `locked_tests` entry in `doit/*/state.json`:
  - `tests/table/decision-record.acceptance.test.ts` (TASK-3.12) deep-equals entries with `hinted: false` for
    REVIEW_FOUR and PREFLOP_FOLD_ONLY. Neither opens a hint, so both stay green.
  - `e2e/hand-records.spec.ts` (TASK-3.9, TASK-1.55) seeds a record with `hinted: false`. The format is unchanged.
  - Locked tests that deep-compare `userDecisions` or `CompletedHand` (session, resume, session-restore, review,
    determinism, next-hand, rebuy, table-size, bot-seed) never pass `hinted`. Under A-2 their decisions have no
    `hinted` key, so they stay equal.
  - `e2e/hint.spec.ts`, `tests/ui/hint*.acceptance.test.*` (TASK-8.1) don't read records. `applyUserAction` calls with
    2–3 args still compile. The `act` signature only gains an optional parameter.
- If the build finds a locked test that must change, it stops and reports the file and its owner task. It does not edit the file.

## 12. Clarifications log
- None needed.
