# TASK-3.8: See each side pot and who wins it

Status: Done · Completed: 2026-11-21 · Epic: TASK-3 — Play hands at the table · Milestone: m-1 · Requirements: REQ-021.5, REQ-024.1 · Branch: doit/TASK-3.8

## What was asked
When a hand has side pots, the table shows each pot amount separately once the betting ends (AC#1), and the result names each pot's winner and amount (AC#2, AC#4). Hands without all-ins look exactly as before (AC#3). The engine already builds and awards side pots (TASK-1.10); this story is display only. Spec: doit/TASK-3.8/spec.md.

Side pots cannot occur in live play yet: the TEMPORARY $160 top-up (TASK-3.21, `src/table/session.ts`) keeps every stack above a short stack. The UI is proven with scripted scenes (Vitest `renderToString` and the Playwright scene harness) until TASK-3.21 removes the top-up.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| Q-1 (auto-accepted) | Felt: while side pots exist, "Pot $N" is replaced by a "Pots" list ("Main pot $60", "Side pot $80"; "Side pot 1/2" if several). This street's bets are added to the last pot so lines sum to the old total. A single pot stays "Pot $N". | yes | Recommended option (a). | Change `potLines()` / the Pots list in `Table.tsx`. |
| Q-2 (auto-accepted) | Result: a "Pot winners" list before Winners, one line per award: "Main pot $60 · You win $60", split "Side pot $81 · Ben wins $41, Ava wins $40". Winners and Shown hands unchanged. | yes | Recommended option (a). | Change the list in `Table.tsx` / `PotResultView`. |
| A-1 | Separate pots show only when `view.pots.length > 1` and the hand is not over; a mid-street all-in keeps a single `Pot $N` until that street ends. | yes | The engine builds side pots only at street end. | Rebuild pots in the UI from contributions (duplicates engine logic). |
| A-2 | After the hand ends the felt shows `Pot $0` as today; the breakdown appears only in the result block. | yes | Engine empties pots at hand end; locked TASK-3.4 test expects `Pot $0`. | Show paid pots on the felt too. |
| A-3 | `handResultView(...).pots` is absent/empty when there is exactly one award (fold-outs always have one). | yes | AC#4 asks per-pot lines only given side pots; keeps locked markup. | Always render pot lines (breaks locked tests). |
| A-4 | Pot lines follow engine `awards` order (main pot, then side pots by level); winners inside a line keep `splitPot` order. | yes | Documented ordering of `HandResult.awards`. | Sort by amount. |

## Clarifications and decisions
Q-1 and Q-2 above were auto-accepted in the autopilot run (see doit/TASK-3.8/qa.md).

Recorded deviations (both judged acceptable by review):
- `HandResultView.pots` is optional and omitted (not `[]`) for a single award, because locked tests (`tests/ui/hand-result-shown.acceptance.test.tsx`, `tests/table/hand-result.test.ts`) `toEqual` the whole view. `TableViewModel.pots` stays a required array.
- `e2e/support/table-harness-bundle.ts` also changed (scene names added to the `TableScene` union for typecheck): 10 files against a budget of 9.
- `flex-wrap` on `.hand-result` was not needed; the block fits 1280 px.

## What was built
- `src/table/table-view.ts` — `PotLineView`, `potLabel()`, `potLines()`, `TableViewModel.pots`.
- `src/table/hand-result.ts` — `PotResultView`, `HandResultView.pots`; shared `winText` wording; unseated award seat throws `RangeError`.
- `src/ui/table/Table.tsx` — felt "Pots" list in place of `Pot $N` while side pots exist; result "Pot winners" list before Winners.
- `src/ui/styles.css` — `.table-pots`, `.table-pot`.
- `tests/support/table-scenarios.ts`, `e2e/support/table-scenes.tsx`, `e2e/support/table-harness-bundle.ts` — scripted side-pot scenes (`side-pot-river`, `side-pot-showdown`): $20/$60/$60 all-in gives main $60, side $80; short stack wins the main pot.
- Tests: `tests/table/side-pots.test.ts`, `tests/ui/side-pots.acceptance.test.tsx`, `e2e/side-pots.spec.ts` (Chromium + WebKit, axe, no outside requests).

No new dependencies; no engine, bots or advice changes.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..04 | AC#1-4 | `tests/ui/side-pots.acceptance.test.tsx` | pass | gates/build-1.json, fix-2.json |
| SPEC-05, 06 | model rules, RangeError | `tests/table/side-pots.test.ts` | pass | same |
| SPEC-07 | browser, axe, layout | `e2e/side-pots.spec.ts` | pass (chromium, webkit) | same |
| SPEC-08 | locked tests unchanged | existing TASK-3.3/3.4/3.5 tests | pass | state.json locked hashes |
| SPEC-09 | lint, typecheck, tests, e2e | `npm run lint && typecheck && npm test && npm run e2e` | pass: 143 files, 506 tests (7 skipped), coverage 96.82%; e2e 122 passed, 6 skipped | build-log.md |
| SPEC-10 | CI + doc | CI on branch; this doc | CI: see judge | Judge: see doit/TASK-3.8/judge/ |
| SPEC-11 | N/A items | empty diff on `src/engine src/bots src/advice` | Judge: see doit/TASK-3.8/judge/ | |

Gates: build-1 PASS, fix-2 PASS (481 changed lines, 10 files). Judge: see doit/TASK-3.8/judge/.

## Review
Round 1: code reviewer 0 blocking; security reviewer clean (no hidden-information leak, text rendered by React, no new input or network).

### Non-blocking review notes (deliberately not fixed)
- NIT `src/ui/table/Table.tsx:92`: the Pot winners line is composed in JSX rather than from `PotResultView.text`, so `text` is only used by tests and the two could drift. The JSX shape was prescribed by the spec.

## How to try it
- `npx vitest run tests/ui/side-pots.acceptance.test.tsx tests/table/side-pots.test.ts`
- `npx playwright test e2e/side-pots.spec.ts`
- Live play cannot show side pots until TASK-3.21.

## Run metrics
Questions 2 (auto-accepted) · assumptions logged 4 (A-1..A-4) · review rounds 1 · judge rounds: see judge folder · gate runs 2 · escalations 0 · changed lines 481.

## Known limitations and follow-ups
- Side pots are proven by scenes only until TASK-3.21 removes the top-up. [trainer] Once TASK-3.21 lands, add a live-play check that a real all-in shows the Pots list (owner: TASK-3.21).
- [trainer] Optional: have `PotResultView` expose the line text and render it directly, removing the NIT (owner: none; low value).

## Lessons for the factory (proposals — not applied)
- Spec file lists should include type-union files that scene additions touch (`table-harness-bundle.ts` was missed, budget 9 vs 10).
- Spec should check locked tests that `toEqual` whole view objects before adding fields (caused the optional `pots` deviation).
