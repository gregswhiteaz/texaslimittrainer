# Spec: TASK-10.8 — See my three most costly leaks first

Status: READY (approved 2026-11-25)
Task: TASK-10.8 · Parent/epic: TASK-10 · Requirements: REQ-044 (044.5), REQ-047 (047.3) · Dream: limit-holdem-trainer

## 1. Summary
The Session Report's "Biggest leaks this session" section lists at most three leaks, most costly first. Today
every qualifying leak is listed in category data order (TASK-10.5 A-3, TASK-10.6 A-4). This story ranks leaks
by unhinted Major errors (descending), then by error rate (descending), and shows the top 3 (REQ-047.3,
REQ-044.5). The ranking is computed at display time from the `leakCounts` already stored in each report
(`major` was stored for this purpose, `docs/storage/reports.md:85`), so the stored format does not change and
reports saved before this story are ranked too.

## 2. Scope
- In scope:
  - `src/stats/leaks.ts`: `sessionLeaks` returns the leaks ranked (D-1, Rules below) and limited to
    `MAX_SHOWN_LEAKS = 3`.
  - `src/ui/report/ReportScreen.tsx`: doc comment only (it already renders `sessionLeaks(counts)` in order).
  - Tests: one new acceptance file (report screen), unit cases in `tests/stats/leaks.test.ts`.
  - Docs: `docs/stats/leaks.md` (ranking rule, cap); Backlog story doc.
- Not doing:
  - Any change to the stored report format (`leakCounts` stays in category data order, written once at
    session end). No DB version change, no new persisted field.
  - Any change to leak detection (`isLeak`), categories, category text, evidence text or the no-leaks sentence.
  - Any new user-visible text (no "and N more leaks" note, no Major count in the evidence) (Q-2).
  - Changing the list markup (`<ul class="report-leak-list">` stays; no `<ol>`, no rank numbers) (A-2).
  - Home snapshot "Top leak" (TASK-2.16) and the Statistics screen (TASK-11.x).
  - Any engine, bots, advice, grading, hand-record or storage change.
- Scope budget: files=5, lines=340

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | `sessionLeaks` itself ranks and caps (returns at most 3); there is no separate uncapped "all leaks ranked" function. | yes | `sessionLeaks` has one production caller, `ReportScreen` (`src/ui/report/ReportScreen.tsx:48`), and REQ-044.5 caps the report at 3. TASK-2.16's "Top leak" can take element 0. Keeps the screen file unchanged except its comment. | Keep `sessionLeaks` uncapped and add `topLeaks(counts)`; a later story can split it if Statistics needs every leak. |
| A-2 | The list stays a `<ul>` with the same item markup; ranking is shown by order only. | yes | Locked tests assert the exact `<ul class="report-leak-list"><li class="report-leak" …>` markup (`tests/ui/report-leaks.acceptance.test.tsx:106-109`, `tests/ui/report-preflop-leaks.acceptance.test.tsx:77-80`). The storyboard shows no rank numbers (`dreams/limit-holdem-trainer/storyboards/Report.dc.html:51-57`). | `<ol>` (semantic order; needs two locked-test edits). |
| A-3 | DoD#7 (Playwright in Chromium and WebKit + axe) is met by the locked `e2e/report-leaks.spec.ts`, which runs the report flow and axe in both browsers and still passes unchanged; the ranking and the cap are verified by server-rendered `ReportScreen` acceptance tests. No new e2e flow. | yes | Same approach as TASK-10.6 (`doit/TASK-10.6/spec.md:36`, SPEC-12): the markup is unchanged and one played hand cannot reach 8 decisions in a category; no e2e helper seeds a multi-leak session (`e2e/report-*.spec.ts` all play one live hand). | A new e2e that seeds ~45 valid hand records and resumes the session (large, brittle). |
| A-4 | Reports read from storage may in principle hold `leakCounts` in any order (they are validated to be in data order, `src/table/session-report.ts:234-249`); ranking does not depend on the input order. | yes | `sessionLeaks` already looks counts up by category (`src/stats/leaks.ts:319-327`). | — |

## 3. Current system
- `src/stats/leaks.ts:271-279` `CategoryCount { category, decisions, errors, major }` (unhinted counts;
  `major ≤ errors ≤ decisions`).
- `src/stats/leaks.ts:301-303` `isLeak`: `decisions ≥ 8 && 5·errors ≥ 2·decisions` (integer arithmetic).
- `src/stats/leaks.ts:306-309` `leakEvidence`; `:311-316` `Leak { category, title, evidence, fix }`.
- `src/stats/leaks.ts:318-327` `sessionLeaks(counts)`: walks `LEAK_CATEGORIES` (31 entries, 15 postflop then
  16 preflop, `:153`) and returns every leak in data order.
- `src/ui/report/ReportScreen.tsx:42-68` `LeaksSection` renders `sessionLeaks(counts)` as
  `<ul class="report-leak-list">` items with `data-category`, or the no-leaks sentence; rendered only when the
  report has `leakCounts` (`:120`).
- `src/table/session-report.ts:234-249` `parseLeakCounts`: stored counts are known ids in strictly increasing
  data order. Unchanged.
- Tests: Vitest (`npm test` = `vitest run --coverage`, `package.json` scripts); acceptance tests are
  `*.acceptance.test.*`; UI tests render with `react-dom/server` `renderToString`
  (`tests/ui/report-leaks.acceptance.test.tsx:1-80`). Playwright via `npm run e2e` (Chromium + WebKit).
- Existing code to reuse:
  - `src/stats/leaks.ts` → `isLeak`, `leakEvidence`, `LEAK_CATEGORIES` (data index for the last tie-break).
  - `tests/ui/report-leaks.acceptance.test.tsx:24-83` → the helpers `session`, `act`, `decision`, `times`,
    `hand`, `report`, `text`, `render`, `leaksSection` pattern. Copy into the new acceptance file (the locked
    file can't be imported from without coupling; there is no shared test-support module for it). Extend
    `decision` with a `hinted` argument.

### Locked tests checked (TASK-10.5 / TASK-10.6 `locked_tests`)
None asserts the order of two or more shown leaks or a shown count above 3, so **no locked test changes**:
- `tests/stats/leaks.acceptance.test.ts` — `sessionLeaks` assertions are single-leak (`:156` `toContainEqual`,
  `:203` one element) or empty (`:195`). Holds.
- `tests/ui/report-leaks.acceptance.test.tsx` — one leak, exact markup (`:104-109`); no leaks (`:126-134`). Holds.
- `tests/stats/preflop-leaks.acceptance.test.ts` — order assertions (`:148-153`, `:199-203`) are on stored
  `leakCounts`, which stay in data order; `sessionLeaks` only empty (`:232`). Holds.
- `tests/ui/report-preflop-leaks.acceptance.test.tsx` — one leak (`:75-80`). Holds.
- `e2e/report-leaks.spec.ts` — zero leaks shown (`:48`), stored counts equal recomputed ones (`:55-57`). Holds.
- Unlocked `tests/stats/leaks.test.ts:111-125` expects `['flop-facing-a-bet-raise' (major 4),
  'river-facing-a-bet-call' (major 1)]` — the ranked order is the same, so it still passes; only new cases are
  added next to it.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Rank at display time from stored `leakCounts`; no new persisted field, no stored order change. | Store leaks in ranked order / store a rank field | `major`, `errors`, `decisions` already reproduce the ranking; old reports get ranked too; stored data-order validation stays. | no | n/a |
| D-2 | Final tie-break after Major and error rate: more errors first, then category data order. | Data order only; more decisions first (identical to "more errors" at equal rate) | Story leaves it open; user-visible ordering rule. | yes | user (Q-1) |
| D-3 | No new user-visible text (no "N more" note, no Major count in evidence). | "and N more leaks" line; "(k Major)" appended to evidence | Story/REQ-044.5 say "up to 3"; storyboard shows 3 plain items; evidence text is fixed by REQ-047.4 and locked tests. | yes | user (Q-2) |

## 5. Design

### Files to create / modify
- `src/stats/leaks.ts` — modify: `MAX_SHOWN_LEAKS`, ranking comparator, `sessionLeaks` ranks and caps.
- `src/ui/report/ReportScreen.tsx` — modify: `LeaksSection` doc comment ("the top 3 leaks, most costly first").
- `tests/ui/report-leak-ranking.acceptance.test.tsx` — create: AC#1–3 on the rendered report.
- `tests/stats/leaks.test.ts` — modify: add the ranking/cap unit test.
- `docs/stats/leaks.md` — modify: replace "Every leak is listed, in the category order…" (`:82-83`) and the
  "come in TASK-10.8" note (`:6-7`) with the ranking rule and cap; add the new test file to the tests list
  (`:151`).

### Components, interfaces and data
```ts
/** At most this many leaks are shown on the report (REQ-044.5, REQ-047.3). */
export const MAX_SHOWN_LEAKS = 3;

/** The leaks among `counts`, most costly first (REQ-047.3), at most MAX_SHOWN_LEAKS;
 *  counts whose category is unknown are ignored. */
export function sessionLeaks(counts: readonly CategoryCount[]): readonly Leak[];
```
- Signature and `Leak` shape unchanged. Input is not mutated. Pure, deterministic, no I/O.
- The comparator may be a non-exported helper (`compareLeaks(a, b)` over `CategoryCount` plus data index).

### Rules and algorithms
1. Candidates: for each `LEAK_CATEGORIES` entry (data index `i`) with a count in `counts` (looked up by
   category, as today) where `isLeak(count)`.
2. Order candidates by, in turn:
   1. `major` descending;
   2. error rate `errors / decisions` descending, compared exactly in integers:
      `a` before `b` iff `a.errors · b.decisions > b.errors · a.decisions`;
   3. `errors` descending (D-2, Q-1);
   4. data index `i` ascending.
3. Take the first `MAX_SHOWN_LEAKS` (3) and map to `{ category, title, evidence: leakEvidence(count), fix }`.

Worked examples:
- AC#1: A `river-facing-a-bet-call {10, 6, 5}` (60%), B `flop-facing-a-bet-call {10, 8, 3}` (80%) → `[A, B]`
  (Major beats rate and data order).
- AC#2: A `flop-facing-a-bet-call {8, 4, 4}` (50%), B `turn-facing-a-bet-call {8, 5, 4}` (62.5%) → `[B, A]`
  (4·8 = 32 < 5·8 = 40).
- AC#3: five leaks, each `{10, 5, m}`: `flop-facing-a-bet-fold` m=1, `flop-facing-a-bet-call` m=2,
  `turn-facing-a-bet-call` m=3, `river-facing-a-bet-call` m=4, `river-not-facing-a-bet-bet` m=5 → shown
  `[river-not-facing-a-bet-bet, river-facing-a-bet-call, turn-facing-a-bet-call]`.
- Equal Major and rate: `flop-facing-a-bet-fold {20, 10, 3}` vs `flop-facing-a-bet-call {10, 5, 3}` (both 50%)
  → fold first (10 errors > 5). Equal in all three: data order (`flop-…-fold` before `flop-…-call`).
- Hinted Major never counts: B with 3 unhinted Major plus 4 hinted Major has `major = 3`.
- Preflop leaks rank with postflop ones on the same rule: `early-fold {10, 5, 5}` ranks above
  `flop-facing-a-bet-fold {10, 5, 2}` although it is later in data order.

### Error handling and configuration
- No new errors. Unknown categories are skipped as today. Fewer than 3 leaks → all shown; none → the existing
  no-leaks sentence (unchanged).

## 6. Behaviour specification

### SPEC-01: More unhinted Major errors are listed first
- Verifies: AC#1, DoD#1
- Behaviour: Given a report built by `sessionReport` from unhinted decisions where leak A
  (`river-facing-a-bet-call`) has 10 decisions, 6 errors, 5 Major and leak B (`flop-facing-a-bet-call`) has 10
  decisions, 8 errors, 3 Major, plus 4 hinted Major `flop`/`call` decisions, When `ReportScreen` renders, Then
  the leaks section's items' `data-category` values are exactly `['river-facing-a-bet-call',
  'flop-facing-a-bet-call']`.
- Verification: acceptance `tests/ui/report-leak-ranking.acceptance.test.tsx::AC#1 a leak with more Major errors is listed first`

### SPEC-02: Equal Major errors list the higher error rate first
- Verifies: AC#2, DoD#1
- Behaviour: Given leak A (`flop-facing-a-bet-call`: 8 unhinted decisions, 4 Major, 4 Correct → 50%) and leak
  B (`turn-facing-a-bet-call`: 8 unhinted decisions, 4 Major, 1 Minor, 3 Correct → 62.5%), When the report is
  rendered, Then the items are exactly `['turn-facing-a-bet-call', 'flop-facing-a-bet-call']`, and B's
  evidence reads `5 of 8 turn calls graded as errors`.
- Verification: acceptance `tests/ui/report-leak-ranking.acceptance.test.tsx::AC#2 equal Major errors list the higher error rate first`

### SPEC-03: Five leaks show exactly the three highest-ranked
- Verifies: AC#3, DoD#1
- Behaviour: Given a session with five leaks, each 10 unhinted decisions with 5 errors, whose Major counts are 1
  (`flop-facing-a-bet-fold`), 2 (`flop-facing-a-bet-call`), 3 (`turn-facing-a-bet-call`), 4
  (`river-facing-a-bet-call`) and 5 (`river-not-facing-a-bet-bet`), When the report is rendered, Then exactly 3
  `<li class="report-leak"` items are present, with `data-category` exactly `['river-not-facing-a-bet-bet',
  'river-facing-a-bet-call', 'turn-facing-a-bet-call']`, and neither `flop-facing-a-bet-fold` nor
  `flop-facing-a-bet-call` appears in the section. The heading is still `Biggest leaks this session`.
- Verification: acceptance `tests/ui/report-leak-ranking.acceptance.test.tsx::AC#3 five leaks show exactly the three highest-ranked`

### SPEC-04: Ranking rule details and the cap
- Verifies: AC#1, AC#2, AC#3
- Behaviour: `sessionLeaks` called directly with `CategoryCount` arrays:
  - equal Major and equal rate (`{20,10,3}` fold vs `{10,5,3}` call on the flop) → more errors first (Q-1);
  - equal in all three → data order;
  - a preflop leak with more Major ranks above postflop leaks (`early-fold {10,5,5}` first);
  - exactly 3 leaks → all 3 returned; 4 leaks → 3; 2 → 2; no leak → `[]`;
  - the result does not depend on input order (reversed input gives the same output) and the input array is
    not mutated;
  - unknown categories and non-leaks are still ignored; `MAX_SHOWN_LEAKS === 3`.
- Verification: unit `tests/stats/leaks.test.ts::sessionLeaks ranks by Major, error rate, errors and data order and keeps the top 3`

### SPEC-05: Stored format and existing leak behaviour unchanged
- Verifies: DoD#2, DoD#8
- Behaviour: Given the change, When the existing suites run, Then every TASK-10.5/10.6 locked test passes
  unchanged (stored `leakCounts` still in data order; one-leak markup identical; no-leaks sentence identical),
  and the locked `e2e/report-leaks.spec.ts` passes in Chromium and WebKit with zero serious/critical axe
  violations and only same-origin requests.
- Verification: command `npm test && npm run e2e -- e2e/report-leaks.spec.ts`

### SPEC-06: Project checks
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#10
- Behaviour: `npm run lint`, `npm run typecheck` and `npm test` (golden-spot suite and coverage thresholds
  included) pass with zero errors; CI is green on the branch. `src/stats/leaks.ts` still imports only types
  from `../engine/hand` and `../advice/grade` plus the JSON — no UI or browser-only code.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-07: Report screen flow in both browsers
- Verifies: DoD#7
- Behaviour: Given the report flow (New game → Start game → play a hand → Leave table), When it runs in
  Chromium and WebKit, Then the leaks section renders and axe reports zero serious or critical violations (A-3).
- Verification: command `npm run e2e -- e2e/report-leaks.spec.ts`

### SPEC-08: Documentation
- Verifies: DoD#11
- Behaviour: `docs/stats/leaks.md` states the ranking rule (Major desc, error rate desc, errors desc, data
  order) with one worked example, the cap of 3, that ranking is computed at display from stored counts (so older
  reports are ranked too), and lists the new test file. The story doc is published to Backlog.md.
- Verification: manual `docs/stats/leaks.md` section on listing/ranking, and `backlog doc list --plain` entry for TASK-10.8

### SPEC-09: Not-applicable DoD items
- Verifies: DoD#6, DoD#9, DoD#12
- Behaviour: DoD#6 does not apply (no engine, bots or advice change, so no playtest). DoD#9 does not apply (no
  new strategy content or text). DoD#12 does not apply (no screen or dialog is added).
- Verification: manual `git diff --stat main -- src/engine src/bots src/advice src/stats/leak-categories.json` is empty

## 7. Edge cases
- Empty: no `leakCounts` → no section (unchanged); counts but no leak → no-leaks sentence (unchanged, locked).
- Boundary: exactly 3 leaks → all shown; 4 or 5 → top 3 (SPEC-03, SPEC-04); 1–2 → all (SPEC-04, locked one-leak tests).
- Ties: equal Major and rate; full ties (SPEC-04).
- Hinted Majors: excluded from `major` at count time (SPEC-01).
- Mixed preflop/postflop: one ranking over all 31 categories (SPEC-04).
- Invalid input: stored counts are validated by `parseLeakCounts`; unknown categories ignored (SPEC-04).
- Concurrency, interruption, permissions, dependency failure: N/A — pure display-time function.

## 8. Security considerations
N/A — no new input, storage, network, dependency or randomness. Ranking reads already-validated stored counts.

## 9. Non-functional
- `sessionLeaks` sorts at most 31 items; no performance target or slow test is needed.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`, then New game → Start game → play hands → Leave table and read "Biggest leaks this session"
- New tests:
  - `tests/ui/report-leak-ranking.acceptance.test.tsx` → SPEC-01, SPEC-02, SPEC-03
  - `tests/stats/leaks.test.ts` (new `it`) → SPEC-04
- Judge end-to-end: run `npm test`, `npm run e2e -- e2e/report-leaks.spec.ts`; in `npm run dev` play a
  session and Leave table; confirm the section shows at most 3 items. (Reaching several leaks by hand takes a
  long session; the acceptance tests cover ranking with built reports.)

## 11. Open questions
- None. Q-1 (tie-break: more errors, then data order) and Q-2 (no new text) are answered in `doit/TASK-10.8/qa.md` and folded into D-2 and D-3.

## 12. Clarifications log
See `doit/TASK-10.8/qa.md`.
