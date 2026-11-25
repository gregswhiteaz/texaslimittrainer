# TASK-11.4: Filter my trends by table size and game type

Status: Done · Completed: 2026-11-25 · Epic: TASK-11 — Track progress over time · Milestone: m-1 · Requirements: REQ-048 (048.2, 048.4, 048.6, 048.7, 048.9, 048.10, 048.12), REQ-005.4, REQ-057.1, REQ-058.1 · Branch: doit/TASK-11.4

## What was asked
The Statistics screen gets two selects, "Table size" (All, Heads-up, 6-max, Full ring) and "Game type" (All, Cash, Sit-and-go), both defaulting to All. Changing either recomputes the totals line, the Major-error chart, the BB/100 chart and their empty-state messages from the matching hands only. The G-2 target still comes from every stored hand, and BB/100 stays cash-only. Spec: doit/TASK-11.4/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | A hand with unknown `dealtIn` (only hand-built test literals) matches only Table size = All. | yes | Every hand read through `trendHand` has `dealtIn`. | Throw, or treat as 6-max, in `filterTrendData`. |
| A-2 | The filter row renders only once the view has loaded, not while loading or after a read failure. | yes | Nothing to filter before data arrives. The locked loading and failure markup tests stay unchanged. | Render disabled selects in every state. |
| A-3 | The row sits between the header and the first chart card (as in the storyboard) and reuses the Game Config select look (44px) through `.stats-filters`. | yes | Storyboard `Stats.dc.html:26-35`. | Change `src/ui/styles.css`. |
| A-4 | Select values are code ids (`all`, `heads-up`, `6-max`, `full-ring`, `cash`, `sit-and-go`). Labels are the display text. | yes | Matches `ReferenceSize` and `GameType`. | Use label text as value. |
| A-5 | A filter that leaves 0 hands shows "Play your first hand to see trends." and "0 hands over 0 sessions". | yes | REQ-048.10 applies the filters to the empty-state messages. | Add a filter-specific message. |

## Clarifications and decisions
Both questions were auto-accepted in autopilot at the recommended option (doit/TASK-11.4/qa.md). Please confirm or overrule.
- Q-1 Remember the filter? Answer: no. Every opening of Statistics starts at All / All (D-5).
- Q-2 How is a sit-and-go bucketed by table size? Answer: a session's size is the largest dealt-in count among its hands, mapped through `referenceSizeOf` (D-2). A sit-and-go that shrinks from 6 to 2 players stays wholly 6-max. No storage change was needed.
- D-3 Game type is Cash iff `hand.cash !== undefined`, otherwise Sit-and-go.
- D-4 App keeps `{ data, filter, view }` and recomputes `statisticsView(filterTrendData(data, filter), data)` on change. `StatisticsScreen` stays presentational and its `view`/`onHome` props are unchanged.

## What was built
- `src/stats/trends.ts` → `dealtIn` on `TrendSource`/`TrendHand`/`trendHand` (from `seats.length`). Adds `TrendFilter`, `ALL_TRENDS`, the label and option constants, and `filterTrendData(data, filter)`. It returns `data` itself for All / All, keeps input order, and passes `sessionStarts` through. Table size uses the existing `referenceSizeOf`.
- `src/ui/stats/StatisticsScreen.tsx` → the `.stats-filters` row with two labelled controlled selects (`#stats-table-size`, `#stats-game-type`). It has optional `filter` and `onFilterChange` props and shows only for a loaded view.
- `src/ui/App.tsx` → stats state carries `data` and `filter`. A filter change recomputes the view. Home → Statistics resets to All / All.
- `src/ui/styles.css` → `.stats-filters` rules.
- `docs/stats/trends.md` → `dealtIn`, filters section, test list.
- No new dependencies. No change to storage, engine, bots or advice.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..08 | AC#1-8 | `tests/stats/trend-filters.acceptance.test.tsx` (48 asserts) | pass | gates build-1, fix-2 |
| SPEC-09 | filter internals | `tests/stats/trends.test.ts` | pass | gates |
| SPEC-10 | browser flow, axe, origin | `e2e/statistics-filters.spec.ts` (Chromium and WebKit) | pass | judge round 1 |
| SPEC-11 | project checks | lint, typecheck, `npm test`, `npm run e2e` | pass | 1,370 tests passed; lines 94.03%, `src/stats` 100%; e2e 316 passed, 18 opt-in skipped |
| SPEC-12 | docs | `docs/stats/trends.md` and Backlog doc | pass | judge |
| SPEC-13 | no engine/bot/advice change | `git diff` of those folders | pass | judge |

- Judge round 1: PASS 13/13, no findings. Its end-to-end run used a production preview with 2,780 seeded hands in 7 sessions plus a real played flow. It checked all 12 Table size × Game type combinations in both browsers. The G-2 target was the all-hands value under every filter. For example, the cash-only subset would give 3.7 where the correct value is 6.8.
- Gate runs: 2 (build, fix), both PASS. The new acceptance file runs in about 1.3 s with `trends.test.ts`, under the 3 s target.
- No item failed in any round (all `item_failures` are 0).

## Review
Review round 1 had no blocking findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR (code): no repo test checks that App passes all hands as the second argument to `statisticsView`. The G-2 behaviour is covered only by the judge's end-to-end run and the test's own helper. The e2e seeds 700 hands, so the target is null there.
- NIT (code): the `if (data === undefined) return;` guard in `src/ui/App.tsx` is unreachable. It only narrows the optional type.
- NIT (code): the locked screen-list parser (`e2e/support/play-money.ts` `screenType()`, used by `tests/ui/screen-list.acceptance.test.ts`) cuts `type Screen` at the first `;`, even one inside a `//` comment. The builder reworded the App comment and did not touch the locked test.
- NIT (security): `filterTrendData` does not reject DOM-edited option values. An unknown game type acts like Sit-and-go and an unknown table size matches nothing. Nothing throws, and it is local only.

## How to try it
- `npm run dev`, then Home → Statistics, change "Table size" and "Game type", and read the totals and both cards.
- `npx vitest run tests/stats/trend-filters.acceptance.test.tsx tests/stats/trends.test.ts`
- `npx playwright test e2e/statistics-filters.spec.ts`

## Run metrics
Questions 2 (auto-accepted) · assumptions 5 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 648 (budget 640) across 8 files.

## Known limitations and follow-ups
- Scope came in at 648 lines against a budget of 640. This is a slight overrun.
- The storyboard "Group by" options differ from REQ-048.1. TASK-11.5 already owns that, so no new task is needed.
- Follow-ups, one line each:
  - [trainer] Add a repo-level test that App passes all stored hands as the `all` argument of `statisticsView` under every filter, with at least 1,000 seeded hands so the target is non-null (owner: TASK-11.4 code MINOR; could be an AC on TASK-11.12 or a small new task).
  - [trainer] Optional: ignore or map unknown select values to All in the `onFilterChange` handler (security NIT, harmless; low value).
  - [trainer] Remove the unreachable `data === undefined` guard in `App.tsx` by making `data` required on the loaded state (NIT).
- Not tracked (infra, below the value bar):
  - [infra] The locked `screenType()` parser stops at the first semicolon, even inside a comment. It tripped once and was worked around by rewording. No follow-up unless it trips again.

## Lessons for the factory (proposals — not applied)
- The spec's SPEC-07 verified the G-2 wiring only through the test's own helper, not through App. Proposal: when a spec item depends on how a component passes arguments, require a test through the real wiring. Only the judge's end-to-end run caught it.
- Locked test helpers that parse source text (the screen-list parser) can trip on comments. Proposal: add a note to the builder instructions to avoid `;` in comments inside `type Screen`.
