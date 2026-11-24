# Spec: TASK-9.7 — See a grade summary badge after each hand when auto-open is off

Status: READY (no questions; A-1..A-8 assumed)
Task: TASK-9.7 · Parent/epic: TASK-9 · Requirements: REQ-024 (024.2, 024.3), REQ-043 (043.8, 043.11, 043.13), REQ-057 (057.3) · Dream: limit-holdem-trainer

## 1. Summary
When the auto-open setting is off, a hand that would open the Hand Review panel does not open it. Instead the
table shows a grade summary badge, a button such as "1 Major, 1 Minor" or "All correct", built from the stored
grades of that hand. Clicking the badge opens the panel for that hand and holds the next hand until Deal next
hand. Without a click, the next hand is dealt 1.5 s after the result, as for a hand with no review, and the badge
goes away. No Settings screen or settings store exists yet, so the setting is a `Table` prop (default on). Tests
set it directly. TASK-12.6 adds the toggle and saves it.

## 2. Scope
- In scope:
  - Pure model functions in `src/table/review.ts`. `afterHandReview(hand, autoOpen)` returns
    `'panel' | 'badge' | 'none'`. `reviewBadge(grades)` returns the badge text, worst grade and accessible name.
  - `Table` gets an `autoOpenReview?: boolean` prop (default `true`), badge state and a click-to-open handler.
    `TableView` gets `reviewBadge` / `onOpenReview` props and renders the badge button.
  - Badge styles. A records-harness option that renders the table with auto-open off.
  - Unit/acceptance tests, the live Playwright flows (Chromium and WebKit) and docs.
- Not doing:
  - A Settings screen, a settings store or saving the setting (TASK-12.6, REQ-050.2). `TableScreen` and `App`
    don't pass the prop, so the app keeps today's behaviour: auto-open on (A-1).
  - Any change to when the panel opens with auto-open on (`opensReview`, TASK-9.1), to the review panel's
    contents, to `HandRecordDecision` or to the stored record format.
  - Showing the badge for hands outside the current table (history, Hand History screen).
  - Edits to any locked test (A-8).
- Scope budget: files=9, lines=700

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The setting is supplied as `TableProps.autoOpenReview?: boolean`, default `true`, and is not saved anywhere. `Table` reads it through a ref at each hand end, so a change applies from the next hand end (as TASK-12.6 AC#4 expects) and never restarts a timer. No persisted format changes. Saving it is TASK-12.6 ("Saved at once and kept across launches"). | yes | No settings store exists (`grep -rn -i "settings\|autoOpen\|localStorage" src` finds only `opensReview`). The task says "Tests set the setting value directly until E12 exists". | A settings module or localStorage key now (persisted format → TASK-12.6) |
| A-2 | Badge text: count Major and Minor grades. Parts are `"<n> Major"` if n > 0 and `"<m> Minor"` if m > 0, joined by `", "`. With neither, the text is `"All correct"`. Zero counts are left out ("1 Major", not "1 Major, 0 Minor"). Correct grades are not counted. | yes | Matches the AC's "1 Major, 1 Minor" (with 2 Correct not shown) and REQ-043.11's "All correct". | "1 Major, 1 Minor, 2 Correct"; always show both counts |
| A-3 | The badge is `<button type="button" class="review-badge" data-worst="<grade>" aria-label="Open hand review: <text>"><text></button>`. The accessible name contains the visible text (WCAG 2.5.3) and says what the click does. `data-worst` is `major` if any Major error, else `minor` if any Minor error, else `correct`. | yes | A bare "1 Major, 1 Minor" button name doesn't say what it does. Label-in-name is kept. | Visible text only as the name; a visually hidden prefix |
| A-4 | Look: same slot and size as Deal next hand, centred under the table section in `.table-main` (`display: block; margin: 12px auto 0; min-height: 44px; padding: 0 20px; border: 0; border-radius: 22px; font-size: 14px; font-weight: 700; color: #ffffff`). The background is the review grade-badge colour of `data-worst`: `#a3151c` major, `#9a5b00` minor, `#2f6fe0` correct (`src/ui/styles.css:892-902`). These already pass AA with white text in the panel. Focus ring: `outline: 3px solid #ffffff; outline-offset: 2px` on `:focus-visible`. The text always states the grades, so colour is never the only signal (REQ-057.3). | yes | No storyboard shows the badge (`grep -il badge dreams/limit-holdem-trainer/storyboards/*` finds only the per-entry grade badges in `Review.dc.html:61-66`). Reusing the grade colours keeps one colour language. | A neutral grey pill; a badge on the user's seat |
| A-5 | The badge appears once the hand's grades are stored for the review (`onHandGraded`), not at the instant the result shows. Until then nothing is shown. Auto-deal already waits for the hand's write, which comes after grading (`src/ui/table/useTableSession.ts:230-238, 251-258`), so a badge is always on screen before the next deal. If grading fails, the write fails and nothing more is dealt (existing D-2), and no badge is shown. | yes | The badge needs the grades. Same path the panel uses (`reviewGraded`, `src/ui/table/Table.tsx:57-64`). | Grade again on the UI thread (forbidden by TASK-9.3: nothing is graded again) |
| A-6 | Badge lifetime. The badge state is replaced at each hand end (null unless `afterHandReview` says `'badge'`). It is cleared when the badge is clicked, when Deal next hand / Continue is clicked, and when `table.handNumber` changes (an effect keyed on `table.handNumber`). `TableView` renders it only while the hand's result is shown (`result !== null`) and no review is held (`review === null`). So it disappears on the next deal and can never show a previous hand's grades. | yes | REQ-043.11 "disappears when the next hand is dealt". | Clearing only at the next hand end (one stale frame) |
| A-7 | When the user busts with auto-open off (cash), nothing is held: the bust dialog opens as today when no review is held (`Table.tsx:315-317`), and the badge sits behind the modal (`BustDialog` uses `showModal()`). Rebuy/Leave work as today. A sit-and-go stop behaves the same: no auto-deal (`nextHandDelay`, `src/table/session.ts:522-526`), and the badge stays clickable. | yes | REQ-024.3: the panel is not open, so nothing waits on it. No new flow. | Hold the bust dialog until the badge is dismissed |
| A-8 | No locked test needs an edit. Every locked test renders or runs with auto-open at its default (on), so no badge is rendered. Checked: `e2e/table.spec.ts:18-19` closed `BUTTON_NAME` list (TASK-3.1) runs the app, which passes no prop, so no `.review-badge` button. The `count()` probes in `e2e/review.spec.ts` (TASK-9.1), `e2e/review-header.spec.ts` (9.4), `e2e/review-shown.spec.ts` (9.5), `e2e/review-numbers.spec.ts` (9.3) and `e2e/review-hinted.spec.ts` (9.6) probe the panel, `Hand over` status or action buttons, none of which change with auto-open on. `tests/ui/review-panel.acceptance.test.tsx` (9.1/9.3), `review-numbers`, `review-header`, `review-shown`, `review-hinted` and `table.acceptance.test.tsx` render `TableView` without the new optional props, so markup is byte-identical. `e2e/next-hand.spec.ts`, `e2e/hand-records.spec.ts`, `e2e/rapid-pace.spec.ts` (timing): auto-open stays on and the hold logic is unchanged. The records harness is not locked (`e2e/support/*` is not in any `locked_tests`). | yes | Grep of all `doit/*/state.json` `locked_tests` for review auto-open, button-name lists, banned text and `count()` probes. | — |

## 3. Current system
- React 19 + Vite, strict TS. `npm test` = `vitest run --coverage` (`package.json:13`). UI acceptance tests render
  `TableView` with `renderToString` (`tests/ui/review-hinted.acceptance.test.tsx:28-37`). Playwright runs
  Chromium and WebKit (`npm run e2e`). There is no jsdom/testing-library, so stateful `Table` wiring is covered by
  Playwright.
- Auto-open today: `Table.onHandComplete` sets `review = { hand, entries: null, open: true }` iff
  `opensReview(hand)` (`src/ui/table/Table.tsx:340-343`). `onHandGraded` fills the entries
  (`Table.tsx:344-349`). `holdNextHand: holdNextHand || review !== null` (`Table.tsx:354`). Deal next hand shows
  while `review !== null && result !== null` (`Table.tsx:299-303`). The panel shows while
  `review.open && entries !== null` (`Table.tsx:305-312`).
- `opensReview(hand)` is false iff there are no user decisions, or one decision that is a preflop fold
  (`src/table/review.ts:39-44`). So CALL_THEN_FOLD (call $8, then fold to the re-raise) opens it
  (`tests/table/review.acceptance.test.ts:84-91`).
- Holding: turning `holdNextHand` on re-runs the session effect, whose cleanup cancels the pending 1.5 s timer and
  its `write.then` deal (`cancelled` flag, `src/ui/table/useTableSession.ts:247-264`). `nextHandDelay` returns
  `NEXT_HAND_DELAY_MS = 1500` only when not held (`src/table/session.ts:518-526`). So setting a held review
  when the badge is clicked stops the auto-deal.
- Grades: `Grade = 'correct' | 'minor' | 'major'` (`src/advice/grade.ts:10`). `StoredReviewEntry.grade`
  (`src/table/review.ts:86`).
- Records harness: renders `<Table handStore onHandComplete>`, configured by `#root` data attributes
  (`e2e/support/records-harness.tsx:40-44, 88`). It is opened by `openRecordsHarness(page, bundle, words, opts)`
  (`e2e/support/table-harness-bundle.ts:138-161`).
- Existing code to reuse:
  - `src/table/review.ts:40` `opensReview` → inside `afterHandReview`.
  - `src/ui/table/Table.tsx:58` `reviewGraded` pattern → fill the badge's entries for the same hand only.
  - `tests/support/table-scenarios.ts` `userTableAfter` (:271), `REVIEW_DECK` (:309), `REVIEW_FOUR` (:322),
    `CALL_THEN_FOLD` (:328), `PREFLOP_FOLD_ONLY`, `RAISE_TAKES_BLINDS` (:410), `REVIEW_WON_56`, `BB_WALK`.
  - `src/table/hand-record.ts:198` `decisionRecord` + `storedReviewEntries` → stored grades, as in
    `tests/ui/review-hinted.acceptance.test.tsx:28-37`.
  - `e2e/review-hinted.spec.ts` helpers (`enabledActions`, check-or-call, `nextTurnOrResult` pattern) and
    `e2e/support/hand-records.ts` `handOver` (:90), `storedRecords` (:80), `header` (:89); `e2e/support/paused-clock.ts`
    `runUntil` (:10), `runUntilMyTurn` (:34), `axeWithPausedClock` (:119). The 1.5 s check copies
    `e2e/review.spec.ts:213-214` (gap in [1400, 1600]) using the harness's `result` / `header:<n>` events
    (`e2e/support/records-harness.tsx:64-73`).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | `afterHandReview(hand, autoOpen)`: `'none'` if `!opensReview(hand)`; else `'panel'` if `autoOpen`; else `'badge'`. | Put the condition inline in `Table` | AC#7 as a pure, unit-tested rule. The preflop-fold rules stay in one place. | no | n/a |
| D-2 | The badge never holds the next hand. Only clicking it creates a held review (`open: true`), which then holds as today. | Hold while the badge shows | REQ-024.3 / AC#1: 1.5 s auto-deal while the panel is not open. | no | n/a |
| D-3 | The setting is a non-persisted `Table` prop, default on (A-1). | Settings store now | Out of scope; persistence is TASK-12.6. Avoids a persisted-format change. | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/review.ts` — `AfterHandReview`, `afterHandReview`, `ReviewBadge`, `reviewBadge`.
- `src/ui/table/Table.tsx` — `autoOpenReview` prop, badge state, `TableView` props `reviewBadge` / `onOpenReview`,
  badge button.
- `src/ui/styles.css` — `.review-badge` and its `data-worst` colours and focus ring (A-4).
- `e2e/support/records-harness.tsx` — `data-auto-open="0"` → `<Table autoOpenReview={false}>`.
- `e2e/support/table-harness-bundle.ts` — `RecordsHarnessOptions.autoOpen?: boolean` (default `true`), written as
  `data-auto-open="1|0"`.
- `tests/table/review-badge.acceptance.test.ts` (new) — SPEC-01, SPEC-02, SPEC-03.
- `tests/ui/review-badge.acceptance.test.tsx` (new) — SPEC-04, SPEC-05.
- `e2e/review-badge.spec.ts` (new) — SPEC-06, SPEC-07, SPEC-08, SPEC-09.
- `docs/ui/review.md` — a "Grade summary badge (auto-open off)" section. The title becomes
  "Hand Review panel (TASK-9.1, TASK-9.3, TASK-9.4, TASK-9.5, TASK-9.6, TASK-9.7)".

### Components, interfaces and data
- `src/table/review.ts`:
  ```ts
  export type AfterHandReview = 'panel' | 'badge' | 'none';
  /** What the table shows when `hand` ends (REQ-043.8/.11/.12/.13). */
  export function afterHandReview(hand: CompletedHand, autoOpen: boolean): AfterHandReview;

  export interface ReviewBadge {
    readonly text: string;            // "1 Major, 1 Minor" | "All correct" | …
    readonly worst: Grade;            // 'major' | 'minor' | 'correct'
    readonly label: string;           // `Open hand review: ${text}`
  }
  /** The summary of a hand's grades, in any order. RangeError('A review badge needs at least one grade') if empty. */
  export function reviewBadge(grades: readonly Grade[]): ReviewBadge;
  ```
  Callers pass `entries.map((e) => e.grade)` from the hand's `StoredReviewEntry[]`.
- `TableViewProps` adds:
  - `reviewBadge?: ReviewBadge | null` — rendered only when `result !== null && review === null`, as the last
    child of `.table-main` after the table `<section>` (the Deal next hand slot; the two never show together).
  - `onOpenReview?: () => void` — the badge's `onClick`.
  Markup:
  `<button type="button" class="review-badge" data-worst="major" aria-label="Open hand review: 1 Major, 1 Minor">1 Major, 1 Minor</button>`.
- `TableProps` adds `autoOpenReview?: boolean` (default `true`).
- `Table` state: `badge: { hand: CompletedHand; entries: readonly StoredReviewEntry[] | null } | null`.
  - `onHandComplete(hand)`: `mode = afterHandReview(hand, autoOpenRef.current)`. `'panel'` → `setReview(...)` as
    today. `setBadge(mode === 'badge' ? { hand, entries: null } : null)`.
  - `onHandGraded(hand, decisions)`: as today for `review`. Also
    `setBadge((b) => b?.hand === hand ? { ...b, entries: storedReviewEntries(hand, decisions) } : b)`. Compute
    `storedReviewEntries` once and share it with `reviewGraded`.
  - `useEffect(() => setBadge(null), [table.handNumber])` (A-6).
  - `openReview()`: if `badge?.entries` is non-null, `setReview({ hand: badge.hand, entries: badge.entries, open: true })`
    and `setBadge(null)`. The review is then held (`holdNextHand` true), the panel mounts and focuses its heading
    (`useHeadingFocus`), and Deal next hand shows.
  - `onDealNext` also clears the badge.
  - `TableView` receives `reviewBadge={badge?.entries ? reviewBadge(badge.entries.map((e) => e.grade)) : null}`.

### Rules and algorithms
- `afterHandReview` (D-1). `reviewBadge`: `major = count('major')`, `minor = count('minor')`. `parts` gets
  `"${major} Major"` if `major > 0`, then `"${minor} Minor"` if `minor > 0`. `text = parts.join(', ') || 'All correct'`.
  `worst = major > 0 ? 'major' : minor > 0 ? 'minor' : 'correct'`. `label = 'Open hand review: ' + text`.
- Worked examples. Stored grades are produced by `completedHand` → `userDecisions.map(decisionRecord)`; these
  values were checked by running the fixtures on 2026-11-24.
  `RIVER_FOLD = userTableAfter(REVIEW_DECK, FOUR_MOVES.replace(/5:call$/, '5:fold'))` with `FOUR_MOVES` as in
  `tests/ui/review-hinted.acceptance.test.tsx:13-16`.

  | Fixture | Stored grades | `afterHandReview(h, false)` / `(h, true)` | Badge text | worst |
  |---|---|---|---|---|
  | RIVER_FOLD | correct, correct, minor, major | badge / panel | `1 Major, 1 Minor` | major |
  | RAISE_TAKES_BLINDS | correct | badge / panel | `All correct` | correct |
  | CALL_THEN_FOLD | major (call $8), correct (fold) | badge / panel | `1 Major` | major |
  | REVIEW_FOUR | correct, correct, minor, correct | badge / panel | `1 Minor` | minor |
  | REVIEW_WON_56 | correct, correct, major, major, major | badge / panel | `3 Major` | major |
  | PREFLOP_FOLD_ONLY | major (lone preflop fold) | none / none | — | — |
  | BB_WALK | (no decisions) | none / none | — | — |

### Error handling and configuration
- `reviewBadge([])` throws `RangeError('A review badge needs at least one grade')`. This can't happen from
  `Table`, because `'badge'` implies at least one decision.
- A grading failure leaves `badge.entries` null, so no badge is shown and the failed write stops dealing as
  today (A-5).
- Configuration: `autoOpenReview` (default `true`). No new stored data.

## 6. Behaviour specification

### SPEC-01: Badge text and worst grade from the stored grades
- Verifies: AC#1, AC#4, AC#7, DoD#1
- Behaviour: Given each fixture in the worked-example table with auto-open off, When `reviewBadge` is called with
  its stored grades (`hand.userDecisions.map(decisionRecord).map(d => d.grade.grade)`, which the test first
  asserts equal the table's grades), Then `text` / `worst` are exactly: RIVER_FOLD `1 Major, 1 Minor` / `major`
  (grades 1 Major, 1 Minor, 2 Correct); RAISE_TAKES_BLINDS `All correct` / `correct`; CALL_THEN_FOLD
  `1 Major` / `major`; REVIEW_FOUR `1 Minor` / `minor`; REVIEW_WON_56 `3 Major` / `major`. `label` is
  `Open hand review: ` + text. Grade order doesn't matter: the reversed RIVER_FOLD grades give the same result.
  `reviewBadge([])` throws `RangeError` with message `A review badge needs at least one grade`.
- Verification: acceptance `tests/table/review-badge.acceptance.test.ts::the badge counts Major and Minor errors and reads All correct without errors`

### SPEC-02: Panel only when auto-open is on and the hand opens a review; otherwise a badge
- Verifies: AC#3, AC#6, AC#7, DoD#1
- Behaviour: Given the fixtures, When `afterHandReview(hand, autoOpen)` is evaluated, Then for RIVER_FOLD,
  RAISE_TAKES_BLINDS, CALL_THEN_FOLD and REVIEW_FOUR it returns `'panel'` with `true` and `'badge'` with `false`.
  For PREFLOP_FOLD_ONLY and BB_WALK it returns `'none'` for both values. For every fixture,
  `afterHandReview(h, true) === 'panel'` iff `opensReview(h)`.
- Verification: acceptance `tests/table/review-badge.acceptance.test.ts::the panel opens only with auto-open on, otherwise a badge, never after a lone preflop fold`

### SPEC-03: Call then fold preflop gets a badge; a lone preflop fold gets none
- Verifies: AC#6, DoD#1
- Behaviour: Given auto-open off, When CALL_THEN_FOLD ends (user `Call $8`, then `Fold` to the re-raise, both
  preflop), Then `afterHandReview` is `'badge'` and its badge reads `1 Major`. When PREFLOP_FOLD_ONLY ends (a
  single preflop `Fold`), Then `afterHandReview` is `'none'`, so no badge, even though the fold is stored as a
  Major error.
- Verification: acceptance `tests/table/review-badge.acceptance.test.ts::calling then folding preflop shows a badge, a lone preflop fold does not`

### SPEC-04: TableView renders the badge button only after the result, never with a held review
- Verifies: AC#1, AC#4, AC#3, DoD#1, DoD#7
- Behaviour: Given `TableView` rendered with `renderToString`:
  (a) RIVER_FOLD, `review={null}` and `reviewBadge={reviewBadge(grades)}`: the markup has exactly one
  `<button` with `class="review-badge"`, `data-worst="major"`, `aria-label="Open hand review: 1 Major, 1 Minor"`
  and text `1 Major, 1 Minor`. It has no `<aside` (no panel) and no `Deal next hand` text.
  (b) RAISE_TAKES_BLINDS likewise: text `All correct`, `data-worst="correct"`.
  (c) The same RIVER_FOLD table with `review={{ entries, open: true }}` and the same `reviewBadge`: no
  `review-badge`, and the panel `<aside` is present.
  (d) A table mid-hand (`userTableAfter(REVIEW_DECK, '3:fold 4:fold')`, the user to act, no result) with a
  `reviewBadge`: no `review-badge`.
  (e) Neither prop given: markup equals the markup from before this story (no `review-badge` substring).
- Verification: acceptance `tests/ui/review-badge.acceptance.test.tsx::the badge button shows its summary after the result and never beside a held review`

### SPEC-05: Badge colour is never the only signal
- Verifies: AC#4, DoD#1
- Behaviour: Given the badges of SPEC-04 (a) and (b) and REVIEW_FOUR (`1 Minor`, `data-worst="minor"`), Then each
  button's text is non-empty and contains `Major`, `Minor` or is exactly `All correct`, and its aria-label ends with
  its visible text. `src/ui/styles.css` defines `.review-badge[data-worst='major'|'minor'|'correct']` backgrounds
  `#a3151c` / `#9a5b00` / `#2f6fe0` with `color: #ffffff` (read from the file).
- Verification: acceptance `tests/ui/review-badge.acceptance.test.tsx::the badge always states its grades in text`

### SPEC-06: Live — auto-open off: badge, no panel, next hand 1.5 s after the result, badge gone
- Verifies: AC#1, AC#5, DoD#7, DoD#8
- Behaviour: Given the records harness with `autoOpen: false` under TASK-3.1's pinned words `[0x9e3779b9, 1, 2, 3]`
  and a paused clock, When hands are played by check-or-call (at most 5 hands, `MAX_HANDS`), Then for the first hand
  whose result shows after at least one user decision:
  - without advancing the clock, `button.review-badge` becomes visible (Playwright `expect().toBeVisible()`, not a
    one-shot `count()`). Its text equals `reviewBadge` of that hand's stored record grades (computed in the test
    from `storedRecords(page)`, using the A-2 rule), and it matches
    `^(All correct|\d+ Major(, \d+ Minor)?|\d+ Minor)$`;
  - no `complementary` region named `Hand #<n> review` exists, and no `Deal next hand` button;
  - axe (`axeWithPausedClock`) reports no serious or critical violations with the badge shown;
  - then `runUntil` the header shows hand `n+1`. The gap between the harness `result` event and the `header:<n+1>`
    event is in [1400, 1600] ms;
  - after the deal, `button.review-badge` has count 0 (`expect().toHaveCount(0)`);
  - every request is same-origin.
- Verification: acceptance `e2e/review-badge.spec.ts::with auto-open off a badge replaces the panel and the next hand deals after 1.5 s`

### SPEC-07: Live — clicking the badge opens that hand's panel and holds the next hand
- Verifies: AC#2, DoD#7
- Behaviour: Given the same harness (auto-open off), When the badge of hand `n` is visible and clicked before the
  clock reaches 1.5 s after the result, Then the panel `Hand #<n> review` is visible with one `li[data-entry]` per
  stored decision of hand `n`, and the badge is gone. After `page.clock.runFor(5000)` the header still shows hand
  `n` and `Deal next hand` is visible. Clicking Deal next hand deals hand `n+1` (`runUntil` the header) and no
  badge or panel remains.
- Verification: acceptance `e2e/review-badge.spec.ts::clicking the badge opens the review for that hand and waits for Deal next hand`

### SPEC-08: Live — a lone preflop fold shows no badge
- Verifies: AC#6, DoD#7
- Behaviour: Given the same harness (auto-open off), When at the user's first turn where `Fold` is enabled the user
  clicks `Fold` (their only decision of that hand), Then after the result no `button.review-badge` appears: the
  test polls in 50 ms real-time steps without advancing the clock until the hand's record is stored, then asserts
  `toHaveCount(0)`. The next hand deals 1.4–1.6 s after the result.
- Verification: acceptance `e2e/review-badge.spec.ts::a lone preflop fold shows no badge`

### SPEC-09: Live — auto-open on (default): the panel opens and no badge is shown
- Verifies: AC#3, DoD#7
- Behaviour: Given the records harness with default options (auto-open on), When the first hand with a user
  decision ends (check-or-call), Then `Hand #<n> review` is visible, `button.review-badge` has count 0 at that
  moment and after `runFor(5000)`, and the header still shows hand `n`.
- Verification: acceptance `e2e/review-badge.spec.ts::with auto-open on the panel opens and no badge is shown`

### SPEC-10: Repo checks, golden suite, coverage, boundaries, playtest
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#6, DoD#8
- Behaviour: lint, typecheck and `npm test` pass with zero errors. `tests/golden/` passes 100 %. Coverage holds
  (the new `review.ts` functions are fully covered by SPEC-01..03). `src/table/review.ts` still imports no UI code,
  and no engine, bot, advice or statistics source changes. No new network API. The 10,000-hand playtest reports 0
  invariant violations.
- Verification: command `npm run lint && npm run typecheck && npm test && npx vitest run tests/golden/ && npm run -s playtest -- --hands 10000 --seed 42`

### SPEC-11: Existing flows still pass; CI green
- Verifies: DoD#7, DoD#10
- Behaviour: The full Playwright suite passes in Chromium and WebKit, unchanged locked files included
  (`e2e/review*.spec.ts`, `e2e/next-hand.spec.ts`, `e2e/table.spec.ts`, `e2e/bust-continue.spec.ts`,
  `e2e/hand-records.spec.ts`). CI is green on `doit/TASK-9.7`.
- Verification: command `npm run e2e && gh run list --branch doit/TASK-9.7 --limit 1`

### SPEC-12: Docs and N/A items
- Verifies: DoD#9, DoD#11, DoD#12
- Behaviour: `docs/ui/review.md` gains a "Grade summary badge (auto-open off)" section covering: the setting
  (`autoOpenReview`, default on, not yet saved; the toggle is TASK-12.6); when the badge shows (`afterHandReview`);
  the text rule with examples; the colour by worst grade; its lifetime (shown after grading, gone on deal); and
  click → held panel. The story doc is published to Backlog.md. DoD#9 is N/A (no strategy content). DoD#12 is N/A
  (no service worker yet).
- Verification: manual read `docs/ui/review.md`; `backlog doc list --plain` lists the TASK-9.7 doc

## 7. Edge cases
- No user decision (walk) or a lone preflop fold: `'none'`, no badge (SPEC-02, SPEC-03, SPEC-08).
- Call/raise then fold preflop: badge (SPEC-03).
- All Correct: "All correct" (SPEC-01, SPEC-04).
- Only Major or only Minor errors: "3 Major" / "1 Minor" (SPEC-01).
- Grades not yet resolved when the result shows: no badge until they are. Auto-deal waits for the write anyway
  (A-5).
- Grading or write failure: no badge, no further deal (existing behaviour, A-5).
- Click at the instant of the auto-deal: the badge renders only while `result !== null` and is cleared on the
  `handNumber` change (A-6), so a click can only open the current hand's review.
- The user busts or a sit-and-go stops with auto-open off: the bust dialog opens as today and the badge stays
  behind it (A-7).
- Setting changed mid-hand: read at hand end (A-1). Wiring a live toggle is TASK-12.6.
- Concurrency, permissions: N/A (single-user client state).

## 8. Security considerations
- No new trust boundary. The badge text is built from the `Grade` union of stored decisions (validated on parse,
  `src/table/hand-record.ts`) and rendered as React text. No HTML injection.
- No secrets, logging, new dependencies, network calls, storage or randomness.

## 9. Non-functional
- Pace: with the badge, the next hand still deals 1.5 s (±100 ms in tests) after the result (SPEC-06).
- Accessibility: the badge is a native button with a 44 px minimum height. Its name contains its visible text.
  White text on `#a3151c` / `#9a5b00` / `#2f6fe0` passes AA (the same pairs already pass axe in the panel). axe
  reports zero serious or critical violations (SPEC-06).
- All new tests run in seconds and stay in the normal suite (no `TLH_SLOW_TESTS` gating).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: N/A in the app until TASK-12.6 adds the toggle (the app passes no prop, so auto-open stays on).
  End to end: `npx playwright test e2e/review-badge.spec.ts` (the records harness with auto-open off).
- New tests (path → SPEC ids):
  - `tests/table/review-badge.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03
  - `tests/ui/review-badge.acceptance.test.tsx` → SPEC-04, SPEC-05
  - `e2e/review-badge.spec.ts` → SPEC-06, SPEC-07, SPEC-08, SPEC-09
- Locked tests the build must edit: none (A-8).
- End-to-end for the Judge: `npx playwright test e2e/review-badge.spec.ts e2e/review.spec.ts e2e/next-hand.spec.ts e2e/table.spec.ts`.
  Then, as a manual check, temporarily pass `autoOpenReview={false}` in `src/ui/table/TableScreen.tsx` (do not
  commit), run `npm run dev`, and play: after a played hand a badge such as "1 Minor" appears and the next hand
  deals 1.5 s later. Clicking the badge opens the panel and holds until Deal next hand. A lone preflop fold shows
  no badge.

## 11. Open questions
None.

## 12. Clarifications log
See `doit/TASK-9.7/qa.md`.
