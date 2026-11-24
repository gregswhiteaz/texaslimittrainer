# Spec: TASK-9.6 — See which reviewed decisions were hinted

Status: READY (no questions; A-1..A-6 assumed)
Task: TASK-9.6 · Parent/epic: TASK-9 · Requirements: REQ-040 (040.2), REQ-043 (043.5) · Dream: limit-holdem-trainer

## 1. Summary
Each Hand Review entry whose stored decision has `hinted: true` shows a small "hinted" tag next to its grade
badge. The grade still shows: a hinted Major error reads "Major error" and "hinted". The panel only reads the
`hinted` flag that TASK-8.2 already stores on each decision (`src/table/hand-record.ts:69-70`). This story also
adds the cross-epic Playwright flow from TASK-8.2's spec (open Hint at the flop, act, the hand ends, only the flop
entry shows "hinted") and the TASK-8.2 judge's case (Hint opened and hidden at the first of 2+ decisions).

## 2. Scope
- In scope:
  - `ReviewPanel` renders a "hinted" tag on entries whose `entry.decision.hinted` is true. The grade badge and
    the tag sit together in a right-aligned `review-verdict` group.
  - Styles for the group and the tag, and wrapping of `.review-entry-top` so a river entry with a tag never
    overflows the 400 px panel.
  - Fixture-based acceptance tests (renderToString), the live Playwright flows (Chromium and WebKit) and docs.
- Not doing:
  - Any change to how `hinted` is set or stored (TASK-8.2), to `HandRecordDecision`, `parseHandRecord`,
    `storedReviewEntries` or `StoredReviewEntry` (A-1).
  - Leaving hinted decisions out of the G-2 major-error rate (REQ-040.3) or counting hint use in the Session
    Report (REQ-040.4). Those belong to the statistics and report stories.
  - The grade summary badge (REQ-043.8) and any review rebuilt from history.
  - Edits to any locked test, including `e2e/hinted.spec.ts` (TASK-8.2). The new flows go in a new file (A-6).
- Scope budget: files=5, lines=450

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The panel reads `entry.decision.hinted`. `StoredReviewEntry` already carries the stored decision (`src/table/review.ts:96-97`), so no new field or model function is added. | yes | Smallest change. One source of truth: the stored flag. | A `hinted: boolean` field on `StoredReviewEntry` |
| A-2 | Tag markup is `<span data-part="hinted" class="hinted-tag">hinted</span>`. Its text is lowercase "hinted", as in the AC and REQ-040.2. It comes right after the grade badge, and both sit inside `<span class="review-verdict">`. The group takes the badge's `margin-left: auto`, so the two stay together on the right. The tag is an outlined pill (1 px `#a7aeb8` border, `#d7dce3` text, 12 px, weight 600) on the panel background `#1a1d22` (`src/ui/styles.css:721`), a contrast of about 12:1. It is not a filled badge, so it never reads as a fourth grade colour. | yes | No storyboard shows the tag (`grep -i hinted dreams/limit-holdem-trainer/storyboards` is empty). This keeps the grade first and the tag secondary. | Tag before the badge; tag on the moves line; filled badge |
| A-3 | `.review-entry-top` gets `flex-wrap: wrap; row-gap: 6px`, and `.review-verdict` is `display: inline-flex; gap: 6px; flex-shrink: 0; margin-left: auto`. On a river entry the street, 5 cards and badge just fit (about 326 of 334 px), so with the tag the verdict group wraps whole to a second line, still right-aligned. Entries without a tag keep today's one-line layout. | yes | Prevents horizontal overflow, which the locked e2e layout checks forbid (`e2e/review-header.spec.ts:131-135`, `e2e/review-shown.spec.ts:86-90`). | Smaller cards; truncation |
| A-4 | Fixtures come from the real hint state machine through `userTableAfter(..., hints)` (`tests/support/table-scenarios.ts:265-303`). The AC#2 hinted Major error is a real grade, not an edited one: REVIEW_FOUR's moves with the river call changed to a fold, with Hint opened at decision 3 (worked example below). | yes | Same path as the live table. The values were produced by running the fixtures on 2026-11-24. | Overwriting `grade` in a stored decision |
| A-5 | The live flows run on the records harness under TASK-3.1's pinned words `[0x9e3779b9, 1, 2, 3]`, playing check-or-call ("call" in the story's flow means check when it is free, call otherwise). Each flow plays at most 5 hands (`MAX_HANDS`), the same bound as `e2e/hinted.spec.ts:12`. That file's flop test passes inside this bound, so a hand with a user flop decision (and so 2+ decisions) exists. | yes | Seeded bots make the chosen hand deterministic. The bound stops a runaway loop. | A scripted table scene (not the live Hint button) |
| A-6 | No locked test needs an edit. Checked every `locked_tests` entry in `doit/*/state.json` that touches review, hint or entry markup. `tests/ui/review-panel.acceptance.test.tsx` (TASK-9.1/9.3): entries split on `<li data-entry`, grade regex `<span data-part="grade" data-grade="(\w+)"[^>]*>(.*?)<\/span>` still matches inside the wrapper, banned `TBD`/`…`/`undefined`/`null`/`[object` (none in "hinted"), and REVIEW_FOUR has no hinted decision, so no tag. `tests/ui/review-numbers.acceptance.test.tsx` (TASK-9.3): per-part regexes match unchanged. `tests/ui/review-header.acceptance.test.tsx` (TASK-9.4): font-size checks use selectors this story doesn't change. `tests/ui/review-shown.acceptance.test.tsx` (TASK-9.5): the shown list is outside entries. `e2e/review.spec.ts`, `e2e/review-numbers.spec.ts`, `e2e/review-header.spec.ts`, `e2e/review-shown.spec.ts`: they read `li[data-entry]` parts by `data-part` and check for no overflow. Their live hands never open Hint, so no tag appears. `e2e/hinted.spec.ts`, `tests/table/hinted.acceptance.test.ts` (TASK-8.2): records only, untouched. `e2e/hint.spec.ts` and the `tests/ui/hint*.acceptance` files (TASK-8.1): hint card only. | yes | Grep of locked tests for entry markup, banned text, closed part lists and `count()` probes. | — |

## 3. Current system
- React 19 + Vite, strict TS. `npm test` = `vitest run --coverage` (`package.json:13`). UI acceptance tests render
  `TableView` with `renderToString` and parse markup (`tests/ui/review-panel.acceptance.test.tsx:11-23, 49-53`).
  Playwright runs Chromium and WebKit (`npm run e2e`). axe runs via `axeWithPausedClock`
  (`e2e/support/paused-clock.ts:119`).
- Panel: `src/ui/table/ReviewPanel.tsx:71-109`. Each `<li data-entry data-street class="review-entry">` has
  `.review-entry-top` (street, board group, grade badge `data-part="grade" data-grade` at :83-85), then moves,
  chart, numbers, explanation and opponents. `TableView` renders it at `src/ui/table/Table.tsx:305-311` once
  `review.entries` is set by `onHandGraded` → `storedReviewEntries(hand, decisions)` (:344-347).
- Stored flag: `HandRecordDecision.hinted: boolean`, "True iff the hint was opened at this decision before acting
  (TASK-8.2)" (`src/table/hand-record.ts:69-70`). It is set by `decisionEntry` (:164-173) from
  `UserDecision.hinted`. The live table sets it through `hintedAt(hint, table.hand)` in `onAct`
  (`src/ui/table/Table.tsx:377-383`, `src/table/hint.ts:93-95`). Opening and then hiding still counts
  (`toggleHint` keeps `decision`, `src/table/hint.ts:66-79`).
- `StoredReviewEntry.decision` is the stored entry each review entry was built from (`src/table/review.ts:96-97`,
  set at :143).
- CSS: `.review-entry-top` flex row with no wrap (`src/ui/styles.css:841-845`). `.grade-badge` has
  `margin-left: auto`, 12 px, weight 700 (:863-871). The panel is 400 px with 20 px padding, and entries have
  12 px padding (:713-724, :832-839).
- The records harness renders the live `Table` with the real store and worker, and so opens the review panel
  after each played hand (`e2e/support/records-harness.tsx:75-89`). It opens via `openRecordsHarness`
  (`e2e/support/table-harness-bundle.ts:147-161`).
- Existing code to reuse:
  - `tests/support/table-scenarios.ts:271` `userTableAfter(fixed, moves, button, stacks, observed, hints)` and
    `REVIEW_DECK` (:309) → hinted fixtures through the real hint state machine.
  - `src/table/session.ts` `completedHand`, `src/table/hand-record.ts:198` `decisionRecord`,
    `src/table/review.ts:113` `storedReviewEntries` → panel entries, as in `tests/ui/review-panel.acceptance.test.tsx:29-31`.
  - `e2e/hinted.spec.ts:14-95` → copy the `openReadyHint`, `checkOrCall`, `nextTurnOrResult`, `storedDecisions`
    and `dealNext` helpers (it is locked, so copy, don't import; the same pattern as
    `e2e/review-numbers.spec.ts:10`).
  - `e2e/support/hand-records.ts` `advanceToHand` (:148), `handOver` (:90), `storedRecords` (:80);
    `e2e/support/paused-clock.ts` `runUntil` (:10), `runUntilMyTurn` (:34), `axeWithPausedClock` (:119).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The tag is shown iff `entry.decision.hinted === true`. Nothing is graded again and the grade badge is unchanged. | Hide or soften the grade on hinted entries | REQ-040: hinted decisions are still graded. AC#2 asks for both. | no | n/a |
| D-2 | Markup and placement as in A-2/A-3 (a verdict group of badge + tag; the top row wraps when full). | See A-2 | Keeps the locked parsers' hooks and avoids overflow. | no | n/a |
| D-3 | The cross-epic live flows go in the new `e2e/review-hinted.spec.ts`, not the locked `e2e/hinted.spec.ts`. | Edit the TASK-8.2 file | Locked file. A separate file keeps record checks and panel checks apart. | no | n/a |

## 5. Design

### Files to create / modify
- `src/ui/table/ReviewPanel.tsx` — the verdict group and the hinted tag.
- `src/ui/styles.css` — `.review-entry-top` wrap, `.review-verdict`, `.hinted-tag`. The badge's `margin-left: auto`
  moves to the group.
- `tests/ui/review-hinted.acceptance.test.tsx` (new) — SPEC-01..SPEC-04.
- `e2e/review-hinted.spec.ts` (new) — SPEC-05, SPEC-06.
- `docs/ui/review.md` — a "Hinted tag" section. The title becomes
  "Hand Review panel (TASK-9.1, TASK-9.3, TASK-9.4, TASK-9.5, TASK-9.6)".

### Components, interfaces and data
- `ReviewPanelProps` is unchanged. In `.review-entry-top` the grade span is replaced by:
```tsx
<span className="review-verdict">
  <span data-part="grade" data-grade={entry.grade} className="grade-badge">{entry.gradeLabel}</span>
  {entry.decision.hinted && <span data-part="hinted" className="hinted-tag">hinted</span>}
</span>
```
  Server markup of a hinted flop entry's top row:
  `<div class="review-entry-top"><span data-part="street">Flop</span><div role="group" aria-label="Community cards" class="table-cards">…</div><span class="review-verdict"><span data-part="grade" data-grade="correct" class="grade-badge">Correct</span><span data-part="hinted" class="hinted-tag">hinted</span></span></div>`.
  For an entry that is not hinted, the group holds only the badge.
- CSS (exact):
  - `.review-entry-top` adds `flex-wrap: wrap; row-gap: 6px;`
  - `.review-verdict { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; margin-left: auto; }`
  - `.grade-badge` loses `margin-left: auto` (it has no other users: `grep grade-badge src` finds only
    `ReviewPanel.tsx:83`).
  - `.hinted-tag { padding: 2px 8px; border: 1px solid #a7aeb8; border-radius: 12px; color: #d7dce3; font-size: 12px; font-weight: 600; white-space: nowrap; }`

### Rules and algorithms
- Tag rule: one `data-part="hinted"` per entry whose stored decision has `hinted: true`, and none otherwise. The
  number of tags equals `decisions.filter(d => d.hinted).length`.
- Worked examples (produced by running the fixtures on 2026-11-24). `FOUR_MOVES` = REVIEW_FOUR's moves
  `'3:fold 4:fold 5:raise 6:fold 1:fold 2:call 2:check 5:bet 2:call 2:check 5:check 2:bet 5:call'`
  (`tests/support/table-scenarios.ts:322-325`). User Ah 9s, board Ks 9d 4c 2h 6s.
  - `userTableAfter(REVIEW_DECK, FOUR_MOVES, 6, {}, undefined, { 1: 1 })` (Hint at the flop): entries
    Preflop "Raise to $8" Correct, Flop "Bet $4" Correct, Turn "Check" Minor error, River "Call $8" Correct;
    `hinted` = [false, true, false, false] → one tag, on entry 2 (`data-street="flop"`).
  - Same moves, `{ 0: 2 }` (Hint opened and hidden at the first decision): same four grades;
    `hinted` = [true, false, false, false] → one tag, on entry 1 (preflop).
  - Same moves, `{}` (= REVIEW_FOUR): `hinted` all false → no tag.
  - `RIVER_FOLD_MOVES` = FOUR_MOVES with the final `5:call` replaced by `5:fold`, with `{ 3: 1 }`: entries Correct,
    Correct, Minor error, River "Fold" **Major error**; `hinted` = [false, false, false, true] → entry 4 shows
    "Major error" and "hinted".

### Error handling and configuration
- No new errors or settings. `hinted` is validated as a boolean when a record is parsed
  (`src/table/hand-record.ts:419`). Entries built in memory come from `decisionEntry`, which always sets it.

## 6. Behaviour specification

### SPEC-01: Only the hinted flop entry shows the tag
- Verifies: AC#1, DoD#1
- Behaviour: Given `T = userTableAfter(REVIEW_DECK, FOUR_MOVES, 6, {}, undefined, { 1: 1 })`, its entries
  `storedReviewEntries(hand, hand.userDecisions.map(decisionRecord))` with `hand = completedHand(T)`, and the
  stored decisions' `hinted` = `[false, true, false, false]` (asserted). When `TableView` renders
  `review={{ entries, open: true }}`, Then the Decisions list has 4 `<li data-entry>` items with streets
  Preflop, Flop, Turn, River. Each item's count of `data-part="hinted"` is `[0, 1, 0, 0]`. Entry 2's tag text is
  exactly `hinted`, and its `.review-verdict` holds the grade span then the tag span. Each entry's grade still
  reads `Correct`, `Correct`, `Minor error`, `Correct`. The whole panel has exactly 1 `data-part="hinted"`, and
  the panel text (tags stripped) contains none of `TBD`, `…`, `undefined`, `null`, `[object`.
- Verification: acceptance `tests/ui/review-hinted.acceptance.test.tsx::only the flop entry, hinted at the flop, shows the hinted tag`

### SPEC-02: A hinted Major error shows both its grade and the tag
- Verifies: AC#2, DoD#1
- Behaviour: Given `userTableAfter(REVIEW_DECK, RIVER_FOLD_MOVES, 6, {}, undefined, { 3: 1 })` rendered the same
  way, Then entry 4 (`data-street="river"`, you "Fold") has a grade span `data-grade="major"` with text
  `Major error` and a `data-part="hinted"` span with text `hinted`, both inside its `.review-verdict`, grade first.
  Entries 1–3 have no tag.
- Verification: acceptance `tests/ui/review-hinted.acceptance.test.tsx::a hinted Major error shows Major error and hinted`

### SPEC-03: No hinted decisions, no tag
- Verifies: AC#3, DoD#1
- Behaviour: Given `REVIEW_FOUR` (no Hint opened; every stored `hinted` is false) rendered with its open review,
  Then the panel has no `data-part="hinted"` and no `hinted-tag` class, and its text does not match `/\bhinted\b/i`.
  Every entry still has exactly one grade span inside a `.review-verdict`.
- Verification: acceptance `tests/ui/review-hinted.acceptance.test.tsx::a hand with no hinted decision shows no hinted tag`

### SPEC-04: Hint opened and hidden at the first of 2+ decisions tags only the first entry
- Verifies: AC#4, DoD#1
- Behaviour: Given `userTableAfter(REVIEW_DECK, FOUR_MOVES, 6, {}, undefined, { 0: 2 })` (Hint, then Hide hint,
  before the first decision, through `toggleHint`), When the panel renders, Then the test asserts the hand had
  at least 2 user decisions (`hand.userDecisions.length >= 2` and the list has >= 2 `<li data-entry>`; here 4).
  The per-entry tag counts are `[1, 0, 0, 0]`, and the stored `hinted` = `[true, false, false, false]`.
- Verification: acceptance `tests/ui/review-hinted.acceptance.test.tsx::hint opened and hidden at the first of several decisions tags only the first entry`

### SPEC-05: Live — Hint opened at the flop tags only the flop entry in the review
- Verifies: AC#1, DoD#7, DoD#8
- Behaviour: Given the records harness under the pinned words with a paused clock (A-5), When hands 1..5 are
  played by check-or-call and Hint is opened (and waited until ready) before the user's first flop decision of
  the first hand that reaches one, Then after that hand's result:
  - the panel `Hand #<n> review` appears and the stored record exists (waited with `runUntil`/`expect.poll`, not
    one-shot `count()`);
  - `li[data-entry]` has the stored decision count, which is >= 2;
  - the entry at the hinted index has `data-street="flop"` and one `[data-part="hinted"]` with text `hinted`, and
    every other entry has none (via `evaluateAll`);
  - the stored decisions' `hinted` flags are true at that index only;
  - each entry's `[data-part="grade"]` is non-empty and one of Correct / Minor error / Major error;
  - the panel has no horizontal overflow (`scrollWidth <= clientWidth`) and the tag's box lies inside the panel;
  - axe (`axeWithPausedClock`) reports no serious or critical violations;
  - every request made is same-origin with the page.
  Earlier hands in the search, which opened no Hint, show no tag in their reviews.
- Verification: acceptance `e2e/review-hinted.spec.ts::opening Hint at the flop tags only the flop entry in the review`

### SPEC-06: Live — Hint opened and hidden at the first decision of a 2+ decision hand
- Verifies: AC#4, DoD#7
- Behaviour: Given the same harness, When for each hand (at most 5) Hint is selected and then Hide hint is
  selected before the user's first decision (waiting for "Hide hint", then "Hint", on the toggle), and the hand
  is played by check-or-call, Then for the first hand whose review lists >= 2 entries: the test asserts
  `entries >= 2` explicitly, entry 1 alone has a `[data-part="hinted"]` tag, and the stored `hinted` flags are
  `[true, false, …]`. Hands with one decision are skipped by dealing the next hand. A hand with no user decision
  (a walk) opens no review and is skipped.
- Verification: acceptance `e2e/review-hinted.spec.ts::hint opened and hidden at the first decision tags only the first review entry`

### SPEC-07: Repo checks, golden suite, coverage, boundaries, playtest
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#6, DoD#8
- Behaviour: lint, typecheck and `npm test` pass with zero errors. `tests/golden/` passes 100 %. Coverage holds.
  No engine, bot, advice or statistics source changes, so the boundary test is unchanged. No new network API.
  The 10,000-hand playtest reports 0 invariant violations.
- Verification: command `npm run lint && npm run typecheck && npm test && npx vitest run tests/golden/ && npm run -s playtest -- --hands 10000 --seed 42`

### SPEC-08: Existing review and hint flows still pass
- Verifies: DoD#7, DoD#10
- Behaviour: The full Playwright suite passes in Chromium and WebKit, including the locked `e2e/review.spec.ts`,
  `e2e/review-numbers.spec.ts` (ten-seat layout, no overflow), `e2e/review-header.spec.ts`,
  `e2e/review-shown.spec.ts`, `e2e/hinted.spec.ts` and `e2e/hint.spec.ts`. CI is green on `doit/TASK-9.6`.
- Verification: command `npm run e2e && gh run list --branch doit/TASK-9.6 --limit 1`

### SPEC-09: Docs and N/A items
- Verifies: DoD#9, DoD#11, DoD#12
- Behaviour: `docs/ui/review.md` gains a "Hinted tag" section covering: when the tag shows (the stored `hinted`
  flag, set when Hint was opened at that decision before acting, even if hidden again); that the grade still
  shows; the markup hooks (`.review-verdict`, `data-part="hinted"`); and the wrapping rule. A row is added to the
  "What an entry shows" table. The story doc is published to Backlog.md. DoD#9 is N/A because there is no
  strategy content. DoD#12 is N/A because no service worker exists yet.
- Verification: manual read `docs/ui/review.md`; `backlog doc list --plain` lists the TASK-9.6 doc

## 7. Edge cases
- Several hinted decisions in one hand: one tag per hinted entry (the tag rule; SPEC-01's count check is the
  general form). No separate test is needed, as the render is per entry.
- Hint opened then hidden: still hinted (SPEC-04, SPEC-06).
- Hint opened but the card never arrived (worker failed): still hinted per TASK-8.2 A-1 (`src/table/hint.ts:92`).
  The panel only reads the flag, so it behaves the same as SPEC-01.
- A river entry with 5 cards, Major error and the tag: the verdict group wraps to a second line with no
  horizontal overflow (A-3; SPEC-05 overflow check on a live flop entry; the river layout is covered by the CSS
  rule and the locked no-overflow checks).
- A walk or a preflop fold only: no review, so no tag (unchanged rules, SPEC-06 skip).
- Concurrency, permissions, dependency failure: N/A, as this is pure rendering of stored data.

## 8. Security considerations
- No new trust boundary. `hinted` comes from the stored decision, validated as a boolean on parse
  (`src/table/hand-record.ts:419`). The tag text is a constant rendered as React text.
- No secrets, logging, new dependencies, network calls or randomness.

## 9. Non-functional
- Rendering cost: one boolean check per entry; negligible.
- Accessibility: the tag is visible text read after the grade ("Major error hinted"). Contrast `#d7dce3` on
  `#1a1d22` is about 12:1. axe reports zero serious or critical (SPEC-05).
- Layout: no horizontal scroll in the 400 px panel at 1280 × 720 (SPEC-05, SPEC-08).
- All new tests run in seconds and stay in the normal suite (no `TLH_SLOW_TESTS` gating).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`, start a game, select Hint at a flop decision, act, play the hand out, and read the
  review panel.
- New tests (path → SPEC ids):
  - `tests/ui/review-hinted.acceptance.test.tsx` → SPEC-01, SPEC-02, SPEC-03, SPEC-04
  - `e2e/review-hinted.spec.ts` → SPEC-05, SPEC-06
- Locked tests the build must edit: none (A-6).
- End-to-end for the Judge: `npx playwright test e2e/review-hinted.spec.ts e2e/hinted.spec.ts e2e/review.spec.ts e2e/review-header.spec.ts e2e/review-numbers.spec.ts e2e/review-shown.spec.ts`.
  Then, in `npm run dev`, play a hand: open Hint at the flop, act, and play to the end. The review's flop entry
  shows its grade and "hinted", and no other entry does. Next hand, open and close Hint at the first decision
  only: only the first entry is tagged. A hand with no Hint shows no tag.

## 11. Open questions
None.

## 12. Clarifications log
See `doit/TASK-9.6/qa.md`.
