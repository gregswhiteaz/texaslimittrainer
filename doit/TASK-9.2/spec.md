# Spec: TASK-9.2 — Continue to rebuy or leave when I bust with the review open

Status: READY (no questions; A-1..A-6 assumed)
Task: TASK-9.2 · Parent/epic: TASK-9 · Requirements: REQ-007 (007.2, 007.6) · Dream: limit-holdem-trainer

## 1. Summary
A cash hand can end with the user on $0 while the Hand Review panel is held. In that case the table-side
next-hand control now reads `Continue` instead of `Deal next hand`. Continue keeps TASK-3.11's path: it clears
the held review, deals nothing, and the existing `Out of chips` dialog (Rebuy / Leave table) opens. Rebuy and
Leave table then behave exactly as in TASK-3.11. TASK-3.11 A-3 already built the behaviour and left only the
label to this story (doit/TASK-3.11/spec.md:48). This story is the label, its tests and the docs.

## 2. Scope
- In scope:
  - `TableView` (src/ui/table/Table.tsx:257-261): the held-review button's text is `Continue` when
    `userBusted(table)`, else `Deal next hand`. Same element, class, ref, position and click handler.
  - Comments in Table.tsx that say the bust path uses "Deal next hand" (:271, :339) are updated.
  - Tests: one new UI acceptance file, one new Playwright file, and a one-assertion edit to the locked
    `tests/ui/bust-dialog.acceptance.test.tsx` (see "Locked tests the build must edit").
  - Docs: a short "Continue on a bust" paragraph in `docs/ui/navigation.md` after the bust-dialog paragraph (:31-34).
- Not doing:
  - Sit-and-go. In a stopped sit-and-go the control still reads `Deal next hand` and does nothing (TASK-3.21).
    `See results` is TASK-5.8 (REQ-008.9).
  - Ending the session or the Session Report on Leave table. Leave table stays TASK-3.11's pause to Home
    (docs/ui/navigation.md:31-34); E10 (TASK-10.1) changes it for both entry points at once.
  - Any change to `BustDialog`, its copy, `useTableSession`, `dealAfterDone`, `rebuyAndDeal`, the session record,
    the review entries or the review panel.
  - Showing the dialog over the open review, or keeping the review visible behind the dialog (A-3).
  - Any change to styles (`.deal-next`, src/ui/styles.css:698).
- Scope budget: files=5, lines=350

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Continue is shown whenever a review is held on a bust, including after Close review (`review.open === false`). | yes | AC#6 says "using the same held-review state". The control is already gated on `review !== null`, not on the panel being open (Table.tsx:257). Showing Deal next hand after Close on a bust would be the wrong label. | Continue only while the panel is open; Deal next hand after Close |
| A-2 | Only the text changes. The button keeps `class="deal-next"`, `dealNextRef` (focus target after Close review, Table.tsx:338-343), its place under the table and its styling. Its accessible name is exactly `Continue`, with no extra aria-label. | yes | Smallest change. AC#1 and AC#6 fix the visible text. Existing focus handling and the 44 px size carry over. | A new class or a separate component; aria-label "Continue to rebuy or leave" |
| A-3 | Continue runs the existing `onDealNext`: it sets the review to null and calls `dealNext`, which is a no-op on a bust (`dealAfterDone`, useTableSession.ts:68-72). So the review panel closes as the dialog opens. | yes | TASK-3.11 A-3 built this path and it is locked by `tests/table/rebuy.acceptance.test.ts::deal next hand on a bust deals nothing`. The dialog is modal, so the panel behind it could not be read anyway. | Keep the review mounted behind the dialog (a new state) |
| A-4 | The label decision uses `userBusted(table)`, which is already false outside cash and false mid-hand (src/table/session.ts:443-450). A sit-and-go user on 0 chips therefore still sees `Deal next hand`. | yes | Story is cash-only. TASK-5.8 owns the sit-and-go label. | Also relabel the sit-and-go control now |
| A-5 | The Playwright spec seeds a stored $4/$8 cash session: default 6-max, all TAG, 12 hands played, user (seat 5) on $12, button on seat 3, hand 13. It pins the replay words to `[1, 1, 2, 3]`. With check/call play the user decides three times (Preflop `Call $4`, Flop `Check`, Flop `Call $4`) and ends on $0. Final stacks are seats 1-6 = 174, 160, 160, 158, 0, 160. A headless test pins these values. | yes | Same seeding pattern as e2e/rebuy.spec.ts:33-44 and e2e/short-stack.spec.ts:28-38. TASK-3.11's $4 seed busts the user with no decision, so no review opens. Values were checked with `playHand` from tests/support/session-play.ts. | Scene harness with a fixture table (no live session) |
| A-6 | One assertion in the locked TASK-3.11 test `tests/ui/bust-dialog.acceptance.test.tsx` changes. Lines 63-66 assert that a held bust review shows `Deal next hand`. That now contradicts AC#1. It becomes `Continue` and adds a not-`Deal next hand` check. Nothing else in that file changes. | yes | AC#1 requires the change. Under the unattended-approval rule the orchestrator unlocks it before the build. | Leave the file and duplicate the check (would fail) |

## 3. Current system
- Stack: React 19 + Vite, strict TS, Vitest with v8 coverage (`npm test` = `vitest run --coverage`, package.json:13),
  Playwright in Chromium and WebKit (`npm run e2e`). UI unit tests render `TableView` with `renderToString`
  (tests/ui/bust-dialog.acceptance.test.tsx:24-35). Clicks are proven in Playwright.
- `TableView` renders the held-review button `Deal next hand` when `review !== null && result !== null`
  (src/ui/table/Table.tsx:257-261). It renders `BustDialog` when cash, `userBusted(table)` and `review === null`
  (:271-274). `Table.onDealNext` = `setReview(null); dealNext()` (:344-347). `closeReview` keeps the review held
  and focuses the button (:340-343). The review opens per `opensReview(hand)` (:299, src/table/review.ts:31-35).
- `userBusted(table)`: cash only; true for a done hand with the user's final stack 0, or a no-hand table with the
  user's stack 0 (src/table/session.ts:443-450).
- `dealNext` → `dealAfterDone`: unchanged table on a bust (src/ui/table/useTableSession.ts:66-72, :243-251).
  `rebuy` → `rebuyAndDeal`: stack to buy-in, `rebuys + 1`, deal (:74-79, :255-264). `buyIn` = 20 × big bet
  (session.ts:59-61), $160 at $4/$8.
- `BustDialog`: native modal, heading `Out of chips`, buttons `Rebuy` (initial focus) and `Leave table`, Escape
  ignored (src/ui/table/BustDialog.tsx:11-39). Leave table calls the same `onLeave` as the header: it pauses to
  Home, writes nothing, and Resume reopens the dialog (docs/ui/navigation.md:31-34; e2e/rebuy.spec.ts:135-163).
- Existing code to reuse:
  - `tests/support/table-scenarios.ts` → `withFinalStacks`, `KINGS_SHOWDOWN`, `REVIEW_FOUR` (:191-203, :274).
  - `tests/ui/bust-dialog.acceptance.test.tsx` → copy its `render`/`HELD`/`BUST` setup pattern (:20-35). Do not import from a test file.
  - `tests/support/session-play.ts` → `playHand` for the headless seed pin.
  - `src/table/session-record.ts` → `sessionRecord` for the stored-session seed.
  - `e2e/support/hand-records.ts` → `handOver`, `header`, `playToResult(…, { play: 'call' })`, `seedStoredSessions`,
    `storedRecords`, `storedSessions`.
  - `e2e/support/paused-clock.ts` → `axeWithPausedClock`, `runUntil`. `e2e/support/table-harness-bundle.ts` → `stubReplayWords`.
  - `e2e/rebuy.spec.ts:56-72` → the seed / resume / run-to-result sequence (copy it into the new spec, with the A-5 seed).

### Locked tests the build must edit (unlock before the build)
- `tests/ui/bust-dialog.acceptance.test.tsx` (owner TASK-3.11). Lines 63-66: `// A held review: no dialog until
  Deal next hand clears it (A-3).` / `expect(held).toContain('Deal next hand');` become a comment naming Continue,
  `expect(held).toContain('>Continue</button>')` and `expect(held).not.toContain('Deal next hand')`.
  `expect(held).not.toMatch(/<dialog/)` stays.
- Checked and needing no edit:
  - `tests/ui/review-panel.acceptance.test.tsx` (TASK-9.1) uses `REVIEW_FOUR`, where the user is not on $0, so
    `DEAL_NEXT` still matches.
  - `e2e/review.spec.ts` (TASK-9.1), `e2e/hand-records.spec.ts` (TASK-1.55/3.9), `e2e/hinted.spec.ts` (TASK-8.2),
    `e2e/rapid-pace.spec.ts` (TASK-3.13/3.27), `e2e/responsive-table.spec.ts` (TASK-3.6) and
    `e2e/short-stack.spec.ts` (TASK-3.21; the user ends on $18) all click `Deal next hand` only with the user on
    $1 or more. Each starts from a full buy-in, and one limit hand can lose at most 12 big bets ($96 < $160).
  - `e2e/rebuy.spec.ts` (TASK-3.11): its bust hand opens no review (no user decision), and its
    `/rebuy|add chips/i` button query does not match `Continue`.
  - No locked test deep-compares a type this story changes (no type changes).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | `TableView` derives the label from `userBusted(table)`; no new prop. | A `busted`/`label` prop from `Table` | `TableView` already imports and calls `userBusted` for the dialog (Table.tsx:17, :272), and TableView is purely presentational from `table` (D-7). | no | n/a |
| D-2 | Button text `Continue` exactly. | `Continue to rebuy`, `Rebuy or leave` | Fixed by AC#1 and REQ-007.6. | no | n/a (task AC) |

## 5. Design

### Files to create / modify
- `src/ui/table/Table.tsx` — label switch in `TableView`; comment updates.
- `tests/ui/bust-dialog.acceptance.test.tsx` — locked edit (A-6).
- `tests/ui/bust-continue.acceptance.test.tsx` — new: markup checks and headless seed pin.
- `e2e/bust-continue.spec.ts` — new: the live flow in Chromium and WebKit, with axe.
- `docs/ui/navigation.md` — "Continue on a bust" paragraph.

### Components, interfaces and data
- No signature, prop or type changes. In `TableView`:
  `{review !== null && result !== null && (<button type="button" className="deal-next" ref={dealNextRef} onClick={onDealNext}>{userBusted(table) ? 'Continue' : 'Deal next hand'}</button>)}`.
- The `BustDialog` condition stays as it is (`… && review === null`).

### Rules and algorithms
- Label rule: held review (`review !== null`) and a result shown → `Continue` if `userBusted(table)`, else `Deal next hand`.
- Worked examples (all reachable with existing fixtures):
  - `withFinalStacks([160, 222, 160, 160, 0, 165])` (cash $4/$8, user seat 5 on $0) + `{ entries: [], open: true }`
    → `<button type="button" class="deal-next">Continue</button>`, no `<dialog`, no `Deal next hand`.
  - The same with `open: false` → `Continue`, no `<aside` (A-1).
  - `withFinalStacks([160, 222, 160, 160, 1, 165])` + held → `Deal next hand`, no `Continue`.
  - `withFinalStacks(BUST, sitAndGo)` (KINGS_SHOWDOWN with `resolveSessionConfig({ gameType: 'sit-and-go' })` and
    `stakesFor(SIT_AND_GO_LEVEL_1)`, as in bust-dialog.acceptance.test.tsx:79-83) + held → `Deal next hand` (A-4).
  - `withFinalStacks(BUST)` with `review = null` → the dialog and no `deal-next` button (unchanged).
  - A-5 seed played headlessly with `playHand(seed, replayCodeFromWords([1, 1, 2, 3]))` → `userBusted` true,
    `opensReview` true, 3 decisions (`preflop:call`, `flop:check`, `flop:call`), final stacks
    `[174, 160, 160, 158, 0, 160]`. `rebuy(nextHand(done))` → user stack 160, `rebuys` 1.

### Error handling and configuration
- No new errors. If the bust hand's write failed, `rebuy` does nothing (existing TASK-3.11 A-2). Continue still
  clears the review, so the dialog shows. No configuration.

## 6. Behaviour specification

### SPEC-01: A held bust review shows Continue and no Deal next hand
- Verifies: AC#1, AC#6, DoD#1
- Behaviour: Given `TableView` with `withFinalStacks([160, 222, 160, 160, 0, 165])` (a done $4/$8 cash hand, the
  user on $0) and a held review `{ entries: [], open: true }`, When it is rendered, Then the markup contains exactly
  one `<button type="button" class="deal-next">Continue</button>`. It contains no `Deal next hand` and no
  `<dialog`. With `{ entries: [], open: false }` (closed but held) it still shows that Continue button and has no `<aside`.
- Verification: acceptance `tests/ui/bust-continue.acceptance.test.tsx::a held bust review shows Continue and no Deal next hand`

### SPEC-02: $1 or more, or a sit-and-go, keeps Deal next hand
- Verifies: AC#4, DoD#1
- Behaviour: Given a held review, When `TableView` is rendered with `withFinalStacks([160, 222, 160, 160, 1, 165])`,
  with `REVIEW_FOUR`, or with the sit-and-go `withFinalStacks(BUST, sitAndGo)`, Then each shows
  `<button type="button" class="deal-next">Deal next hand</button>` and no `>Continue<`.
- Verification: acceptance `tests/ui/bust-continue.acceptance.test.tsx::a held review with chips left or in a sit-and-go shows Deal next hand`

### SPEC-03: The e2e seed busts the user after three reviewed decisions
- Verifies: AC#1, DoD#1
- Behaviour: Given the A-5 seed table (`seatSession(DEFAULT_SESSION_CONFIG)`, seat 5 stack 12, button 3, hand 13),
  When `playHand(seed, replayCodeFromWords([1, 1, 2, 3]))` runs, Then `userBusted` is true and `opensReview` is true.
  `userDecisions` maps to `['preflop:call', 'flop:check', 'flop:call']` and the final stacks are
  `[174, 160, 160, 158, 0, 160]`. `parseSessionRecord(sessionRecord(seed, …))` accepts the seed.
- Verification: acceptance `tests/ui/bust-continue.acceptance.test.tsx::the e2e seed busts the user after three reviewed decisions`

### SPEC-04: Continue opens the dialog, deals nothing, and Rebuy deals with $160
- Verifies: AC#1, AC#2, AC#3, AC#6, DoD#1, DoD#7, DoD#8
- Behaviour: Given the A-5 session stored and resumed with replay words `[1, 1, 2, 3]` and a paused clock, When hand
  13 is played to its result with check/call, Then:
  - the review `complementary` `Hand #13 review` is visible, the user's stack reads `$0`, and a `Continue` button is
    visible; `Deal next hand` buttons count 0 and dialogs count 0;
  - axe reports zero serious/critical violations;
  - after `clock.runFor(5000)` the header still reads `Cash · 6 players · $4/$8 · Hand #13` and there is still no dialog.
  When the user clicks Continue, Then the `Out of chips` dialog is visible with buttons `['Rebuy', 'Leave table']`
  and `Rebuy` focused. The review panel and the Continue button count 0. After `clock.runFor(5000)` the header
  still reads Hand #13 and stored records are `[13]`. axe again reports zero serious/critical violations.
  When the user clicks Rebuy, Then dialogs count 0, the header reads Hand #14, the user's stack plus this-street
  amount equals 160, and every request goes to the app's own origin.
- Verification: acceptance `e2e/bust-continue.spec.ts::a bust with the review open shows Continue, which opens the dialog, and Rebuy deals with $160`

### SPEC-05: Leave table from the dialog opened by Continue
- Verifies: AC#5, DoD#1, DoD#7
- Behaviour: Given the same A-5 bust with the review open, When the user clicks Continue and then `Leave table` in
  the dialog, Then Home (`heading` level 1 `TLH Trainer`) is shown and dialogs count 0. After `clock.runFor(5000)`
  stored records are still `[13]`. The stored session equals the one stored before Leave, with no `endedAt`.
  Resume session then shows the `Out of chips` dialog with the header at Hand #14. This is the same outcome as
  Leave table in TASK-3.11 (e2e/rebuy.spec.ts:135-163).
- Verification: acceptance `e2e/bust-continue.spec.ts::Leave table from the dialog opened by Continue deals nothing more`

### SPEC-06: Continue on a bust deals nothing (existing rule)
- Verifies: AC#2
- Behaviour: Given a done table with the user on $0, When the deal path behind Continue runs (`dealAfterDone`),
  Then the table is unchanged. This is already locked from TASK-3.11; this story must keep it green unchanged.
- Verification: acceptance `tests/table/rebuy.acceptance.test.ts::deal next hand on a bust deals nothing`

### SPEC-07: The locked bust-dialog test states Continue
- Verifies: AC#1, DoD#1
- Behaviour: In `tests/ui/bust-dialog.acceptance.test.tsx`, the held-review case for `BUST` asserts no `<dialog`,
  `>Continue</button>` present and `Deal next hand` absent (A-6). All its other assertions are unchanged and pass.
- Verification: acceptance `tests/ui/bust-dialog.acceptance.test.tsx::a bust shows the Rebuy and Leave table dialog over the result`

### SPEC-08: Repo checks, golden suite, coverage, boundaries, network, playtest
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#6, DoD#8
- Behaviour: lint, typecheck and `npm test` pass with zero errors and the coverage thresholds hold. `tests/golden/`
  passes 100%. No engine, bot, advice or statistics file changes, so the boundary tests are unaffected. No network
  APIs are added (also asserted in SPEC-04). The 10,000-hand playtest reports 0 invariant violations (the engine is unchanged).
- Verification: command `npm run lint && npm run typecheck && npm test && npx vitest run tests/golden/ && npm run -s playtest -- --hands 10000 --seed 42`

### SPEC-09: Docs, N/A items and CI
- Verifies: DoD#9, DoD#10, DoD#11, DoD#12
- Behaviour: `docs/ui/navigation.md` gains a paragraph after the bust-dialog one. It says that when the review is
  held on a cash bust, the control under the table reads Continue (also after Close review). Continue clears the
  review and opens the `Out of chips` dialog, and nothing is dealt until Rebuy. The sit-and-go keeps Deal next hand
  (TASK-5.8). The story doc is published to Backlog.md. DoD#9 is N/A: no strategy content. DoD#12 is N/A: there is
  no service worker yet (no `serviceWorker` in src/). CI is green on `doit/TASK-9.2`.
- Verification: manual `gh run list --branch doit/TASK-9.2 --limit 1` shows success; read the doc paragraph

## 7. Edge cases
- Review closed but held on a bust: Continue (A-1, SPEC-01).
- Bust with no user decision (e.g. all-in from the blind): no review opens, so the dialog shows at once (existing; e2e/rebuy.spec.ts).
- Bust with only a preflop fold: impossible. A fold cannot take the stack to $0 unless the blind already did, and
  `opensReview` is false for a lone preflop fold anyway.
- User on $1: Deal next hand (SPEC-02).
- Sit-and-go stopped or user on 0 chips: Deal next hand, unchanged (A-4, SPEC-02).
- Restored bust (Resume): `review` starts null, so the dialog shows without Continue (existing; SPEC-05 checks Resume).
- Failed hand write: Continue still opens the dialog. Rebuy does nothing (existing TASK-3.11 A-2). Not re-tested.
- Double click on Continue: the first click unmounts the button. `dealNext` is a no-op on a bust. N/A.
- Rebuy limit reached (`rebuys === MAX_SESSION_COUNT`): unreachable in practice (1e9). Unchanged.

## 8. Security considerations
No untrusted input, no storage format change, no new dependency, no randomness. The e2e replay-word stub is
test-only. N/A otherwise.

## 9. Non-functional
- The new UI tests run in well under 1 s. The new e2e spec runs under the paused clock with fake slices, like
  e2e/rebuy.spec.ts, in seconds per browser. It is a correctness check, so it stays in the normal `npm run e2e`
  group, not the TLH_SLOW_TESTS group.
- Button touch target unchanged (`.deal-next` min-height 52 px, styles.css:698-711).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`, then seed or play a $4/$8 cash game until the user busts after making a decision.
  The review opens with `Continue` under the table. Click it, the `Out of chips` dialog opens, and choose Rebuy
  or Leave table.
- New tests:
  - `tests/ui/bust-continue.acceptance.test.tsx` → SPEC-01, SPEC-02, SPEC-03
  - `e2e/bust-continue.spec.ts` → SPEC-04, SPEC-05
  - `tests/ui/bust-dialog.acceptance.test.tsx` (locked edit) → SPEC-07
- End-to-end for the Judge: `npx playwright test e2e/bust-continue.spec.ts e2e/rebuy.spec.ts e2e/review.spec.ts`

## 11. Open questions
- None.

## 12. Clarifications log
See `doit/TASK-9.2/qa.md`.
